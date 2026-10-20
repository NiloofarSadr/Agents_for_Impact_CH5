import { NextRequest, NextResponse } from "next/server";
import { BigQuery } from "@google-cloud/bigquery";

interface AgentContribution {
  agent: "Scouts" | "Planner" | "Auditor" | "Explainer";
  role: string;
  finding: string;
}

const AUTHORIZED_REPO_CORPUS = [
  "a4i_health.burden_tracts (sql/scout_burden.sql)",
  "a4i_health.tract_access & tract_access_adult (sql/scout_access.sql, sql/tract_access_adult.sql)",
  "a4i_health.places_ci (scripts/fetch_places_ci.py)",
  "a4i_health.care_sites & care_sites_state (sql/access_by_hours.sql)",
  "a4i_health.shortage_areas & shortage_facilities (data/README.md)",
  "a4i_health.exposure_tracts (sql/scout_context_air.sql)",
  "a4i_health.disease_weekly (sql/scout_context_disease.sql)",
  "census_bureau_acs.censustract_2020_5yr (sql/audit_demographics_v2.sql)",
  "docs/HANDOFF.md, docs/findings.md, docs/scoring.md, scripts/pick4.py",
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const question: string = (body.question || "").trim();
    const locale: "en" | "es" | "vi" = body.locale || "en";

    if (!question) {
      return NextResponse.json(
        { ok: false, error: "Please enter a question." },
        { status: 400 }
      );
    }

    const qLower = question.toLowerCase();

    // Optional live BigQuery lookup if user asks about a specific 5-to-11 digit tract number in Fulton County (13121)
    const tractMatch = question.match(/\b(13121\d{6}|\d{5,6})\b/);
    let liveTractRow: Record<string, unknown> | null = null;

    if (tractMatch) {
      const rawCode = tractMatch[1];
      const fullGeoId = rawCode.startsWith("13121")
        ? rawCode
        : `13121${rawCode.padStart(6, "0")}`;
      try {
        const projectId =
          process.env.GOOGLE_CLOUD_PROJECT || "qwiklabs-gcp-04-26e02fd45203";
        const bq = new BigQuery({ projectId, location: "US" });
        const [rows] = await bq.query({
          location: "US",
          query: `
            SELECT b.geo_id, b.total_pop, b.pct_uninsured,
              IF(b.pct_no_vehicle < 0, NULL, b.pct_no_vehicle) AS pct_no_vehicle,
              b.pct_checkup, b.pct_asthma, b.pct_copd, b.pct_diabetes, b.pct_high_bp,
              b.pct_mobility_difficulty, b.pct_age_65_plus, b.pct_limited_english,
              a.km_to_any_care, a.km_to_safety_net, a.extra_km_if_uninsured,
              x.km_to_safety_net_adult
            FROM a4i_health.burden_tracts b
            LEFT JOIN a4i_health.tract_access a USING (geo_id)
            LEFT JOIN a4i_health.tract_access_adult x USING (geo_id)
            WHERE b.geo_id = @geo_id
            LIMIT 1
          `,
          params: { geo_id: fullGeoId },
        });
        if (rows && rows.length > 0) {
          liveTractRow = rows[0];
        }
      } catch {
        // Fallback if BigQuery query fails
      }
    }

    let inCorpus = true;
    let answer = "";
    let focusRank: number | null = null;
    let contributions: AgentContribution[] = [];
    let dataWarning = "";
    let corpusSources: string[] = [];

    // =========================================================================
    // OUT-OF-CORPUS BOUNDARY CHECKS (Explicit exclusions defined in README.md & data/README.md)
    // =========================================================================
    if (
      qLower.includes("bus") ||
      qLower.includes("transit") ||
      qLower.includes("marta") ||
      qLower.includes("travel time") ||
      qLower.includes("drive time") ||
      qLower.includes("traffic") ||
      qLower.includes("road closure") ||
      qLower.includes("event") ||
      qLower.includes("parking")
    ) {
      inCorpus = false;
      corpusSources = [
        "README.md (Questions that need more than we gave you)",
        "data/README.md",
        "sql/scout_access.sql",
        "docs/HANDOFF.md (§6 Limitations)",
      ];
      answer =
        locale === "es"
          ? "Restricción del Corpus: Esta información NO existe en las fuentes de datos del repositorio. Según `README.md` y `docs/HANDOFF.md`, no existe ningún conjunto de datos federal con licencia limpia sobre tiempos de viaje en autobús, horarios de tránsito, tráfico o eventos locales (el conjunto de datos de tránsito de la FHWA tiene licencia CC BY-NC y no puede usarse). El corpus del repositorio solo contiene distancias en línea recta (`a4i_health.tract_access` y `tract_access_adult`) y el porcentaje de hogares sin vehículo (`pct_no_vehicle` en `a4i_health.burden_tracts`)."
          : locale === "vi"
          ? "Giới hạn Kho dữ liệu (Corpus): Thông tin này KHÔNG có trong nguồn dữ liệu của repo. Theo `README.md` và `docs/HANDOFF.md`, không có bộ dữ liệu liên bang hợp lệ về thời gian đi xe buýt, giao thông hay sự kiện địa phương. Kho dữ liệu của repo chỉ cung cấp khoảng cách đường chim bay (`a4i_health.tract_access` & `tract_access_adult`) và tỷ lệ hộ không có xe hơi (`pct_no_vehicle` trong `a4i_health.burden_tracts`)."
          : "Corpus Restriction — Outside Repo Data Sources: Bus travel times, transit schedules, traffic, and local street events are not in the repository corpus. As documented in `README.md` ('Questions that need more than we gave you') and `docs/HANDOFF.md` (§6 Limitations), no license-clean federal dataset of transit travel time exists (the FHWA transit dataset is CC BY-NC). From the repo's BigQuery tables, we can only report straight-line distance to federally listed clinics (`a4i_health.tract_access` / `tract_access_adult`) and vehicle ownership (`pct_no_vehicle` in `a4i_health.burden_tracts`).";
      contributions = [
        {
          agent: "Auditor",
          role: "Corpus Boundary Guardrail (`README.md`)",
          finding:
            "Blocked ungrounded transit/traffic/event claim; restricted answer to `tract_access` (straight-line km) and `burden_tracts` (`pct_no_vehicle`).",
        },
      ];
      dataWarning =
        "Strict Corpus Mode: Only facts from `a4i_health` BigQuery tables, `sql/*.sql`, and `docs/*.md` are permitted.";
    } else if (
      qLower.includes("pharmac") ||
      qLower.includes("nppes") ||
      qLower.includes("free clinic") ||
      qLower.includes("charity clinic") ||
      qLower.includes("other mobile") ||
      qLower.includes("individual") ||
      qLower.includes("patient name") ||
      qLower.includes("who has diabetes") ||
      qLower.includes("unmanaged diabetic")
    ) {
      inCorpus = false;
      corpusSources = [
        "README.md (Questions that need more than we gave you)",
        "data/README.md",
      ];
      answer =
        locale === "es"
          ? "Restricción del Corpus: Esta pregunta solicita datos fuera de las fuentes del repositorio (`data/README.md` y `README.md`):\n• Farmacias e individuos: Prohibido. El archivo de farmacias de CMS no tiene direcciones, NPPES contiene datos personales y los datos a nivel individual están estrictamente prohibidos.\n• Clínicas gratuitas no federales y otras unidades móviles: No existe una lista nacional con licencia pública. `a4i_health.care_sites` solo incluye centros federales (certificados por CMS y financiados por HRSA), por lo que todas las distancias son límites superiores."
          : locale === "vi"
          ? "Giới hạn Kho dữ liệu (Corpus): Câu hỏi này nằm ngoài nguồn dữ liệu của repo (`data/README.md` & `README.md`):\n• Nhà thuốc & Dữ liệu cá nhân: Bị loại trừ nghiêm ngặt để bảo vệ quyền riêng tư.\n• Phòng khám từ thiện ngoài liên bang & xe lưu động khác: Không có danh sách công khai. Bảng `a4i_health.care_sites` chỉ chứa các cơ sở liên bang (CMS & HRSA)."
          : "Corpus Restriction — Excluded from Repo Data Sources (`README.md` & `data/README.md`):\n• Pharmacies & Individual Patients: Strictly excluded. The CMS pharmacy file lacks addresses, NPPES contains personal practitioner data, and individual-level health records are prohibited.\n• Non-Federal Free Clinics & Other Mobile Vans: No license-clean national list exists. Our facility tables (`a4i_health.care_sites` and `care_sites_state`) contain federal sites only (CMS-certified and HRSA-funded), meaning every distance reported is an upper bound.";
      contributions = [
        {
          agent: "Auditor",
          role: "Corpus & License Enforcement (`data/README.md`)",
          finding:
            "Refused out-of-corpus lookup (pharmacies, non-federal clinics, other mobile vans, or individual-level data).",
        },
      ];
      dataWarning =
        "Strict Corpus Mode: Restricted to `a4i_health` aggregate federal tables.";
    }
    // =========================================================================
    // IN-CORPUS REPO QUESTIONS (Strictly grounded in docs/, sql/, scripts/, and a4i_health)
    // =========================================================================
    // 1. Specific tract queried live from BigQuery (`a4i_health.burden_tracts` + `tract_access` + `tract_access_adult`)
    else if (
      liveTractRow &&
      !qLower.includes("11431") &&
      !qLower.includes("10214")
    ) {
      const gid = String(liveTractRow.geo_id);
      const pop = liveTractRow.total_pop ?? "N/A";
      const unins = liveTractRow.pct_uninsured ?? "N/A";
      const nocar = liveTractRow.pct_no_vehicle ?? "N/A";
      const checkup = liveTractRow.pct_checkup ?? "N/A";
      const diab = liveTractRow.pct_diabetes ?? "N/A";
      const hbp = liveTractRow.pct_high_bp ?? "N/A";
      const kmAny = liveTractRow.km_to_any_care ?? "N/A";
      const kmSn = liveTractRow.km_to_safety_net ?? "N/A";
      const kmAdult = liveTractRow.km_to_safety_net_adult ?? "N/A";
      const limEng = liveTractRow.pct_limited_english ?? "N/A";

      const matchStop = [
        "13121010125",
        "13121006900",
        "13121011307",
        "13121009405",
      ].indexOf(gid);
      if (matchStop !== -1) focusRank = matchStop + 1;

      corpusSources = [
        "a4i_health.burden_tracts (sql/scout_burden.sql)",
        "a4i_health.tract_access (sql/scout_access.sql)",
        "a4i_health.tract_access_adult (sql/tract_access_adult.sql)",
      ];

      answer = `Corpus Lookup for Census Tract ${gid} (queried live from \`a4i_health\`):
• Population (\`total_pop\`): ${pop}
• Uninsured adults 18–64 (\`pct_uninsured\`): ${unins}% [tract / modeled, CDC PLACES 2025]
• No-vehicle households (\`pct_no_vehicle\`): ${nocar}% [tract / survey, CDC SVI 2022]
• Routine checkup past year (\`pct_checkup\`, low is bad): ${checkup}% [tract / modeled, CDC PLACES 2025]
• Diabetes / High BP (\`pct_diabetes\` / \`pct_high_bp\`): ${diab}% / ${hbp}% [tract / modeled]
• Limited-English households (\`pct_limited_english\`): ${limEng}% [tract / survey]
• Distance to any federal care site (\`km_to_any_care\`): ${kmAny} km
• Distance to listed safety-net site (\`km_to_safety_net\`): ${kmSn} km
• Distance to adult-accessible safety-net site, school clinics excluded (\`km_to_safety_net_adult\`): ${kmAdult} km [straight-line, federal sites only].`;

      contributions = [
        {
          agent: "Scouts",
          role: "sql/scout_burden.sql & sql/scout_access.sql",
          finding: `Tract ${gid}: ${unins}% uninsured (modeled), ${nocar}% no vehicle (SVI), ${checkup}% checkup.`,
        },
        {
          agent: "Auditor",
          role: "sql/tract_access_adult.sql",
          finding: `Listed safety-net distance: ${kmSn} km; adult-only safety-net distance (excluding school clinics): ${kmAdult} km.`,
        },
      ];
      dataWarning =
        "Resolution (`sql/scout_burden.sql` & `sql/scout_access.sql`): `tract / modeled (CDC PLACES 2025)` and `tract / straight-line, federal sites only`.";
    }
    // 2. Tract 11431 / "How do I tell the neighborhood we didn't pick why we didn't pick them?"
    else if (
      qLower.includes("11431") ||
      qLower.includes("didn't pick") ||
      qLower.includes("didnt pick") ||
      qLower.includes("not chosen") ||
      qLower.includes("highest") ||
      qLower.includes("trade-off") ||
      qLower.includes("tradeoff") ||
      qLower.includes("11421") ||
      qLower.includes("alternative")
    ) {
      corpusSources = [
        "docs/HANDOFF.md (§2 & §3)",
        "docs/findings.md (Final 4 Saturdays)",
        "scripts/pick4.py",
        "sql/audit_demographics_v2.sql",
      ];
      answer =
        locale === "es"
          ? "Según `docs/HANDOFF.md` (§2) y `docs/findings.md`:\n• El Tracto `13121011431` tiene la tasa más alta de adultos sin seguro en Fulton (34.6%, ~75% hispanos, a 25.1 km de una clínica para adultos), pero NO aparece en ningún conjunto de 4 paradas que apruebe la auditoría de equidad.\n• Al evaluar las 623 combinaciones posibles de 4 paradas separadas por ≥5 km (`scripts/pick4.py`), cualquier combinación con `11431` empuja a otros grupos por debajo de la regla de 0.80 (por ejemplo, el Plan C voraz `11431/10125/06900/06602` dio un ratio afroamericano de `0.45 FLAG`).\n• `docs/HANDOFF.md` instruye presentar este compromiso directamente al coordinador humano: sugerirlo como el primer sábado del próximo mes con navegador en español.\n• Alternativa documentada en `docs/findings.md`: `06900/11421/11307/09405` (puntaje de necesidad 9.01, ~22% más personas sin seguro alcanzadas, 0 alertas)."
          : locale === "vi"
          ? "Theo `docs/HANDOFF.md` (§2) và `docs/findings.md`:\n• Phân khu `13121011431` có tỷ lệ không bảo hiểm cao nhất Quận Fulton (34.6%, ~75% người gốc Tây Ban Nha), nhưng KHÔNG nằm trong bất kỳ tổ hợp 4 điểm đỗ nào vượt qua kiểm toán công bằng.\n• Khi kiểm tra 623 tổ hợp cách nhau ≥5 km (`scripts/pick4.py`), mọi tổ hợp chứa `11431` đều đẩy tỷ lệ nhóm khác xuống dưới ngưỡng 0.80 (ví dụ: tổ hợp tham lam `11431/10125/06900/06602` bị gắn cờ Da đen `0.45 FLAG`).\n• Đánh đổi này được chuyển cho điều phối viên con người: đề xuất phục vụ vào Thứ Bảy đầu tiên của tháng kế tiếp với thông dịch viên tiếng Tây Ban Nha."
          : "From `docs/HANDOFF.md` (§2) and `docs/findings.md` ('Final 4 Saturdays'):\n• Tract `13121011431` (34.6% uninsured—the highest in Fulton County—and ~75% Hispanic residents) appears in **no passing 4-stop plan**.\n• When `scripts/pick4.py` tested all 623 valid 4-stop combinations spaced ≥5 km apart from the Plan C top 15, every 4-stop set containing `13121011431` pushed another group below the 0.80 Four-Fifths rule (specifically, greedy spacing on Plan C gave `11431 / 10125 / 06900 / 06602`, which failed with a Black uninsured ratio of `0.45 FLAG`).\n• Per `docs/HANDOFF.md`, this trade-off is routed to the human outreach lead with the recommendation: schedule `13121011431` as next month's extra/first Saturday with a Spanish navigator.\n• `docs/findings.md` also notes one passing alternative set: `06900 / 11421 / 11307 / 09405` (need score 9.01, ~22% more estimated uninsured reached, 0 flags).";
      contributions = [
        {
          agent: "Planner",
          role: "scripts/pick4.py (623 Spaced Combinations)",
          finding:
            "Tested all 623 4-stop combinations >=5 km apart from Plan C top 15; greedy set 11431/10125/06900/06602 failed audit.",
        },
        {
          agent: "Auditor",
          role: "sql/audit_demographics_v2.sql & docs/findings.md",
          finding:
            "Greedy Plan C scored Black 0.45 FLAG (<0.80); routed Tract 13121011431 trade-off to the human coordinator.",
        },
      ];
      dataWarning =
        "Caveat (`docs/HANDOFF.md` §2): Ratios rest on ~2,100–2,150 estimated uninsured people across 4 tracts and assume uninsured residents share their tract's ACS racial mix.";
    }
    // 3. School clinics / Prison check / Tract 10214 / Distance to clinic (`tract_access_adult.sql`)
    else if (
      qLower.includes("school") ||
      qLower.includes("prison") ||
      qLower.includes("10214") ||
      qLower.includes("how far") ||
      qLower.includes("distance") ||
      qLower.includes("20.1") ||
      qLower.includes("10125") ||
      qLower.includes("hours") ||
      qLower.includes("fqhc")
    ) {
      if (qLower.includes("10125") || qLower.includes("20.1")) focusRank = 1;
      corpusSources = [
        "docs/HANDOFF.md (§2 & §6)",
        "docs/findings.md (Add-on checks: School-based clinics & Clinic hours)",
        "sql/tract_access_adult.sql",
        "sql/access_by_hours.sql",
      ];
      answer =
        locale === "es"
          ? "Hallazgos verificados en `docs/findings.md` y `docs/HANDOFF.md` (§6):\n• Clínicas escolares (`sql/tract_access_adult.sql`): Más de 9 sitios de red de seguridad en `a4i_health.care_sites` son clínicas dentro de escuelas (`HCC_LOC_SETTING_DESC = 'School'`) que pueden atender solo a estudiantes. Al excluirlas, los tractos más alejados de una clínica de red de seguridad que de cualquier clínica suben de 135 (41%) a 194 (60% de 326 tractos), y la peor distancia sube de 28.6 km a 39.8 km.\n• Ejemplo del Tracto `13121010214`: 43% de hogares sin auto; está a 8.1 km del sitio federal más cercano (una clínica escolar), pero a 19.5 km si es solo para estudiantes (rango 65, ejemplo de brecha, no es parada).\n• Parada #1 (`13121010125`): A 20.1 km de la clínica para adultos más cercana (31.6% sin auto).\n• Verificación de prisión: USP Atlanta solo está en `shortage_facilities` (nunca usada para distancias) -> 0 tractos afectados.\n• Horarios (`sql/access_by_hours.sql`): 5 de 30 centros abren <20 h/semana (mín. 4 h); contar solo sitios ≥20 h mueve solo 2 tractos >1 km más lejos (máx. 1.29 km)."
          : locale === "vi"
          ? "Kết quả xác minh từ `docs/findings.md` và `docs/HANDOFF.md` (§6):\n• Phòng khám trường học (`sql/tract_access_adult.sql`): Hơn 9 điểm khám an sinh trong `a4i_health.care_sites` nằm trong trường học chỉ phục vụ học sinh. Khi loại trừ chúng, số phân khu xa phòng khám an sinh tăng từ 135 (41%) lên 194 (60% trong 326 phân khu), và khoảng cách xa nhất tăng từ 28.6 km lên 39.8 km.\n• Phân khu `13121010214`: 43% hộ không xe; cách 8.1 km tới phòng khám trường học nhưng cách 19.5 km tới phòng khám người lớn.\n• Điểm đỗ #1 (`13121010125`): Cách 20.1 km tới phòng khám người lớn gần nhất (31.6% không có xe).\n• Kiểm tra nhà tù: USP Atlanta chỉ nằm trong `shortage_facilities` -> 0 phân khu bị ảnh hưởng.\n• Giờ mở cửa (`sql/access_by_hours.sql`): 5/30 trung tâm mở <20 giờ/tuần; không làm thay đổi đáng kể bức tranh tiếp cận."
          : "Verified findings from `docs/findings.md`, `docs/HANDOFF.md` (§6), and `sql/tract_access_adult.sql`:\n• School-Based Clinics (`a4i_health.tract_access_adult`): 9+ safety-net sites in Fulton County are school settings (`HCC_LOC_SETTING_DESC = 'School'`) that may serve students only. Excluding them increases tracts farther from a safety-net site than from any care from **135 (41%) to 194 (60% of 326 tracts)**, and increases the worst distance from **28.6 km to 39.8 km**.\n• Tract `13121010214` (Access-Gap Example, Rank 65): 43% households with no car; 8.1 km to nearest listed site (a school clinic), jumping to **19.5 km** when student-only school clinics are excluded.\n• Saturday #1 (`13121010125`): **20.1 km** from the nearest adult-accessible safety-net site, with 31.6% no-vehicle households.\n• Federal Prison Check: USP Atlanta is only in `a4i_health.shortage_facilities` (which is never used for distance) — **0 tracts affected**.\n• Clinic Hours (`sql/access_by_hours.sql`): 5 of 30 HRSA health center sites open <20 h/week (min 4 h); filtering to ≥20 h/week moves just 2 tracts >1 km farther (max 1.29 km; FQHC hours unknown for 23 sites).";
      contributions = [
        {
          agent: "Scouts",
          role: "sql/tract_access_adult.sql & sql/access_by_hours.sql",
          finding:
            "Safety-net gap is 41–60% of 326 tracts (135–194); worst distance is 28.6–39.8 km; Sat #1 (10125) is 20.1 km.",
        },
        {
          agent: "Auditor",
          role: "docs/findings.md (Add-on Checks)",
          finding:
            "Verified USP Atlanta prison affects 0 tracts and clinic opening hours shift only 2 tracts >1 km.",
        },
      ];
      dataWarning =
        "Resolution (`sql/scout_access.sql`): `tract / straight-line, federal sites only` (upper bound; non-federal clinics not in federal data).";
    }
    // 4. Federal Shortage Areas vs Shortage Facilities (`a4i_health.shortage_areas` & `shortage_facilities`)
    else if (
      qLower.includes("shortage") ||
      qLower.includes("hpsa") ||
      qLower.includes("underserved") ||
      qLower.includes("federal government")
    ) {
      corpusSources = [
        "data/README.md",
        "README.md (The five things you're working with)",
        "docs/HANDOFF.md (§4 Rule 4 & §6)",
      ];
      answer =
        locale === "es"
          ? "Según `docs/HANDOFF.md` (§4 Regla 4) y `data/README.md`:\n• `a4i_health.shortage_areas`: El Condado de Fulton tiene **0 áreas de escasez activas** (las 99 designaciones de HRSA están en estado `Proposed For Withdrawal`). La regla del agente exige reportar esto como **“sin señal” (no signal), no “sin problema”**, por lo que no usamos `HPSA_SCORE` en Fulton.\n• `a4i_health.shortage_facilities`: Fulton tiene 6 instalaciones designadas (incluyendo la prisión federal USP Atlanta). Esta tabla marca dónde ya existe una clínica, NO un vecindario desatendido, y nunca debe unirse (`UNION`) con `shortage_areas`."
          : locale === "vi"
          ? "Theo `docs/HANDOFF.md` (§4 Quy tắc 4) và `data/README.md`:\n• `a4i_health.shortage_areas`: Quận Fulton có **0 vùng thiếu hụt y tế đang hoạt động** (tất cả 99 chỉ định HRSA đều ở trạng thái `Proposed For Withdrawal`). Hệ thống báo cáo đây là **“không có tín hiệu” (no signal), chứ không phải “không có vấn đề”**.\n• `a4i_health.shortage_facilities`: Có 6 cơ sở (bao gồm nhà tù liên bang USP Atlanta). Bảng này đánh dấu nơi đã có cơ sở y tế, tuyệt đối không gộp (`UNION`) với `shortage_areas`."
          : "From `docs/HANDOFF.md` (§4 Rule 4) and `data/README.md`:\n• `a4i_health.shortage_areas`: Fulton County has **0 active federal shortage areas**—all 99 of its HRSA designations have status `Proposed For Withdrawal`. Per `docs/HANDOFF.md` Rule 4, we report this as **“no signal,” not “no problem”** (which is why `HPSA_SCORE` is unavailable in Fulton).\n• `a4i_health.shortage_facilities`: Fulton has 6 facility designations (including USP Atlanta federal prison). As documented in `data/README.md`, `shortage_facilities` marks where a facility already sits—never `UNION` it with `shortage_areas`.";
      contributions = [
        {
          agent: "Scouts",
          role: "a4i_health.shortage_areas & shortage_facilities",
          finding:
            "0 active shortage_areas in Fulton (0 / 99 active; all Proposed For Withdrawal); 6 shortage_facilities.",
        },
        {
          agent: "Auditor",
          role: "docs/HANDOFF.md (§4 Rule 4)",
          finding:
            "Enforced 'no signal, not no problem' and prevented unioning shortage_facilities with shortage_areas.",
        },
      ];
      dataWarning =
        "Resolution (`data/README.md`): Federal HRSA designation polygons (`shortage_areas`) vs facility points (`shortage_facilities`).";
    }
    // 5. Respiratory illness / COVID / flu / RSV / Air quality / PM2.5 (`scout_context_disease.sql` & `scout_context_air.sql`)
    else if (
      qLower.includes("air") ||
      qLower.includes("pm2.5") ||
      qLower.includes("pollution") ||
      qLower.includes("covid") ||
      qLower.includes("flu") ||
      qLower.includes("influenza") ||
      qLower.includes("rsv") ||
      qLower.includes("respiratory") ||
      qLower.includes("rising") ||
      qLower.includes("virus")
    ) {
      corpusSources = [
        "docs/HANDOFF.md (§4 Rule 4 & §6)",
        "docs/scoring.md",
        "sql/scout_context_disease.sql",
        "sql/scout_context_air.sql",
      ];
      answer =
        locale === "es"
          ? "Según `docs/HANDOFF.md` (§4 Regla 4 y §6) y `sql/scout_context_*.sql`:\n1. Enfermedades Respiratorias (`a4i_health.disease_weekly` / `sql/scout_context_disease.sql`): *“Regionalmente (Clayton, DeKalb, Fulton, Gwinnett), en la semana que terminó el 1 de agosto de 2026, las visitas a urgencias por COVID subieron de 0.07% a 0.28%. No puedo informarle sobre este vecindario específico.”* (Resolución: `regional (HSA, multi-county) - not neighborhood`).\n2. Calidad del Aire PM2.5 (`a4i_health.exposure_tracts` / `sql/scout_context_air.sql`): El PM2.5 varía solo **1.05x** en todo Fulton (**8.98 a 9.81 µg/m³**, 0 días >35 µg/m³). Es una cuadrícula satelital de 12 km de la EPA con códigos de tracto; se reporta solo como resumen del condado y nunca se usa para clasificar vecindarios (`docs/scoring.md`)."
          : locale === "vi"
          ? "Theo `docs/HANDOFF.md` (§4 Quy tắc 4 & §6) và `sql/scout_context_*.sql`:\n1. Bệnh Hô hấp (`a4i_health.disease_weekly` / `sql/scout_context_disease.sql`): *“Trên toàn vùng (Clayton, DeKalb, Fulton, Gwinnett), tính đến tuần kết thúc ngày 01/08/2026, tỷ lệ khám cấp cứu COVID tăng từ 0.07% lên 0.28%. Tôi không thể kết luận riêng cho khu phố này.”* (Độ phân giải: `regional (HSA, multi-county) - not neighborhood`).\n2. Chất lượng Không khí PM2.5 (`a4i_health.exposure_tracts` / `sql/scout_context_air.sql`): Bụi mịn PM2.5 chỉ chênh lệch **1.05x** toàn Quận Fulton (**8.98–9.81 µg/m³**) trên lưới 12 km của EPA—chỉ báo cáo ở cấp quận, không dùng để xếp hạng phân khu (`docs/scoring.md`)."
          : "From `docs/HANDOFF.md` (§4 Rule 4 & §6), `sql/scout_context_disease.sql`, and `sql/scout_context_air.sql`:\n1. Respiratory Illness (`a4i_health.disease_weekly`): **“Regionally (Clayton, DeKalb, Fulton, Gwinnett), as of week ending Aug 1 2026, COVID ER visits rose 0.07% → 0.28%. I cannot tell you about this neighborhood.”** (`resolution = 'regional (HSA, multi-county) - not neighborhood'`).\n2. PM2.5 Air Quality (`a4i_health.exposure_tracts`): PM2.5 varies only **1.05×** across Fulton County (**8.98–9.81 µg/m³**, 0 days over 35 µg/m³) because it is a **12 km EPA modeling grid** wearing an 11-digit tract ID (`resolution = 'county summary (12 km grid) - cannot rank tracts'`). Per `docs/scoring.md`, neither table is used to rank neighborhoods.";
      contributions = [
        {
          agent: "Scouts",
          role: "sql/scout_context_disease.sql & sql/scout_context_air.sql",
          finding:
            "Quoted exact SQL resolution columns: `regional (HSA, multi-county) - not neighborhood` and `county summary (12 km grid) - cannot rank tracts`.",
        },
        {
          agent: "Auditor",
          role: "docs/HANDOFF.md (§4 Rule 4)",
          finding:
            "Refused neighborhood-level respiratory or PM2.5 claims; reported regional/county context only.",
        },
      ];
      dataWarning =
        "Resolution (`sql/scout_context_*.sql`): `regional (HSA, multi-county)` & `county summary (12 km grid)`.";
    }
    // 6. Language / Spanish / Flyer / Stop 2 (`pct_limited_english` in `burden_tracts`)
    else if (
      qLower.includes("spanish") ||
      qLower.includes("español") ||
      qLower.includes("viet") ||
      qLower.includes("language") ||
      qLower.includes("flyer") ||
      qLower.includes("english") ||
      qLower.includes("06900") ||
      qLower.includes("stop 2") ||
      qLower.includes("saturday 2")
    ) {
      focusRank = 2;
      corpusSources = [
        "docs/HANDOFF.md (§2 & §4 Rule 5)",
        "sql/scout_burden.sql (pct_limited_english)",
      ];
      answer =
        locale === "es"
          ? "Según `docs/HANDOFF.md` (§4 Regla 5) y `sql/scout_burden.sql` (`pct_limited_english`):\n• El idioma por parada se determina usando `pct_limited_english` de `a4i_health.burden_tracts`.\n• En las 4 paradas finales, el porcentaje de hogares con inglés limitado está entre 0% y 5.3%; la **Parada #2 (Tracto `13121006900`, South Atlanta)** tiene **5.3%** (las otras 3 paradas tienen ≤0.6%).\n• Regla del Explicador (`docs/HANDOFF.md` §4 Regla 5): Inglés primero; el español está justificado por datos en la Parada #2 (y en el Tracto `13121011431`, ~75% hispano). Escrito en palabras sencillas, nivel de lectura de 6.º grado."
          : locale === "vi"
          ? "Theo `docs/HANDOFF.md` (§4 Quy tắc 5) và `sql/scout_burden.sql` (`pct_limited_english`):\n• Ngôn ngữ truyền thông ở mỗi điểm đỗ được lấy từ cột `pct_limited_english` trong `a4i_health.burden_tracts`.\n• Trong 4 điểm đỗ cuối cùng, tỷ lệ hạn chế tiếng Anh dao động từ 0–5.3%; **Điểm đỗ #2 (Phân khu `13121006900`, Nam Atlanta)** cao nhất ở mức **5.3%**.\n• Quy tắc của Trợ lý Truyền thông (`docs/HANDOFF.md` §4 Quy tắc 5): Tiếng Anh trước, bổ sung tiếng Tây Ban Nha tại Điểm #2, viết bằng ngôn từ giản dị ở trình độ đọc lớp 6."
          : "From `docs/HANDOFF.md` (§4 Rule 5) and `sql/scout_burden.sql` (`pct_limited_english` in `a4i_health.burden_tracts`):\n• Language per stop is determined strictly from `pct_limited_english` in `a4i_health.burden_tracts` (used for the flyer, not the ranking score per `sql/rank_tracts.sql`).\n• Across the Final 4 stops, limited-English share is 0–5.3%, peaking at **Stop #2 (Tract `13121006900`, South Atlanta) at 5.3%** (People: 3,733 · Uninsured: 14.8% · No car: 20.5% · Checkup: 74.5% · 3.2 km to adult safety-net clinic).\n• Per `docs/HANDOFF.md` Rule 5: English first; Spanish is justified at Stop #2 (and for the unchosen human-decision tract `13121011431`), written in plain words at a 6th-grade reading level.";
      contributions = [
        {
          agent: "Scouts",
          role: "sql/scout_burden.sql (`pct_limited_english`)",
          finding:
            "Stop 2 (Tract 13121006900) has 5.3% limited-English households; other 3 stops are 0–0.6%.",
        },
        {
          agent: "Explainer",
          role: "docs/HANDOFF.md (§4 Rule 5)",
          finding:
            "English first, Spanish justified at Stop 2, plain words at 6th-grade reading level.",
        },
      ];
      dataWarning =
        "Resolution (`sql/scout_burden.sql`): `tract / survey (CDC SVI 2022 pct_limited_english)`.";
    }
    // 7. How scoring works / Confidence Intervals / Plan A vs Plan B vs Plan C / Final 4 Stops ("Where should the van go next month?")
    else if (
      qLower.includes("where") ||
      qLower.includes("van") ||
      qLower.includes("plan") ||
      qLower.includes("score") ||
      qLower.includes("scoring") ||
      qLower.includes("rank") ||
      qLower.includes("audit") ||
      qLower.includes("equity") ||
      qLower.includes("reject") ||
      qLower.includes("ci") ||
      qLower.includes("confidence") ||
      qLower.includes("tie") ||
      qLower.includes("sick") ||
      qLower.includes("car") ||
      qLower.includes("vehicle") ||
      qLower.includes("checkup") ||
      qLower.includes("uninsured") ||
      qLower.includes("saturday") ||
      qLower.includes("stop") ||
      qLower.includes("11307") ||
      qLower.includes("09405")
    ) {
      if (qLower.includes("11307") || qLower.includes("stop 3")) focusRank = 3;
      if (qLower.includes("09405") || qLower.includes("stop 4")) focusRank = 4;

      corpusSources = [
        "docs/HANDOFF.md (§1, §2, §3)",
        "docs/findings.md",
        "docs/scoring.md",
        "sql/rank_tracts_plan_c.sql",
        "sql/audit_demographics_v2.sql",
        "scripts/pick4.py",
      ];
      answer =
        locale === "es"
          ? "Según `docs/HANDOFF.md` (§2 y §3), `docs/scoring.md` y `sql/rank_tracts_plan_c.sql`:\n• **Cómo calificamos la necesidad (`docs/scoring.md`)**: Suma de rangos percentiles a nivel de tracto: `pct_uninsured` (PLACES 18–64) + `pct_no_vehicle` (SVI) + `pct_checkup` invertido (bajo chequeo = alta necesidad), filtrado a tractos a **>2 km de una clínica para adultos** (`tract_access_adult`). Desde el puesto #3 en adelante, los intervalos de confianza (`a4i_health.places_ci`) se superponen con 35–67 tractos (empate estadístico).\n• **Las 3 Respuestas Rechazadas (`docs/HANDOFF.md` §3)**:\n  1. *Plan A (`rank_tracts_v2.sql`, necesidad + distancia)*: Falló la auditoría para residentes afroamericanos sin seguro (`0.53 FLAG`).\n  2. *Plan B (`rank_tracts_need_only.sql`, solo necesidad)*: Pasó afroamericanos (`0.99`), marcó blancos (`0.72 FLAG`), pero las paradas estaban a `0.45–0.83 km` de clínicas existentes.\n  3. *Plan C voraz (primeros 4 a ≥5 km: `11431/10125/06900/06602`)*: Eligió 2 tractos del norte de Fulton -> ratio afroamericano `0.45 FLAG` en el conjunto final.\n• **Las 4 Paradas Finales Aprobadas (`scripts/pick4.py`, 623 combinaciones probadas, necesidad 9.16)**:\n  1. **Sáb 1 · `13121010125`**: 3,251 hab · 12.9% sin seguro · 31.6% sin auto · 73.7% chequeo · **20.1 km** a clínica de adultos (Más lejos de atención; 1 de 3 hogares sin auto).\n  2. **Sáb 2 · `13121006900`**: 3,733 hab · 14.8% sin seguro · 20.5% sin auto · 74.5% chequeo · **3.2 km** (Alta necesidad, sur de Atlanta; 5.3% inglés limitado).\n  3. **Sáb 3 · `13121011307`**: 4,631 hab · **18.0% sin seguro** · 22.9% sin auto · 77.8% chequeo · **4.8 km** (Más personas sin seguro de los cuatro).\n  4. **Sáb 4 · `13121009405`**: 4,332 hab · 7.9% sin seguro · 20.9% sin auto · **70.3% chequeo** · **2.4 km** (Tasa más baja de chequeo médico).\n• **Auditoría de Equidad (`sql/audit_demographics_v2.sql`)**: Afroamericanos **1.02** | Hispanos **0.81** | Blancos **0.88** | Asiáticos **1.04** -> **0 alertas**."
          : locale === "vi"
          ? "Theo `docs/HANDOFF.md` (§2 & §3), `docs/scoring.md` và `sql/rank_tracts_plan_c.sql`:\n• **Cách tính điểm (`docs/scoring.md`)**: Tổng thứ hạng phần trăm cấp phân khu: `pct_uninsured` + `pct_no_vehicle` + `pct_checkup` (đảo ngược), chỉ xét các phân khu **cách phòng khám người lớn >2 km** (`tract_access_adult`). Từ hạng 3 trở đi, khoảng tin cậy (`places_ci`) giao nhau với 35–67 phân khu (hòa thống kê).\n• **3 Bản nháp bị Bác bỏ (`docs/HANDOFF.md` §3)**:\n  1. *Plan A (nhu cầu + khoảng cách)*: Trượt kiểm toán nhóm Da đen (`0.53 FLAG`).\n  2. *Plan B (chỉ xét nhu cầu)*: Các điểm đầu bảng nằm sát phòng khám hiện hữu (`0.45–0.83 km`).\n  3. *Plan C tham lam (`11431/10125/06900/06602`)*: Chọn 2 phân khu Bắc Fulton -> tỷ lệ Da đen `0.45 FLAG`.\n• **4 Điểm Đỗ Thứ Bảy Cuối cùng (`scripts/pick4.py`, 623 tổ hợp, tổng điểm 9.16)**:\n  1. **Thứ Bảy 1 · `13121010125`**: 3,251 dân · 12.9% không BH · 31.6% không xe · 73.7% khám · **20.1 km**.\n  2. **Thứ Bảy 2 · `13121006900`**: 3,733 dân · 14.8% không BH · 20.5% không xe · 74.5% khám · **3.2 km** (5.3% hạn chế tiếng Anh).\n  3. **Thứ Bảy 3 · `13121011307`**: 4,631 dân · **18.0% không BH** · 22.9% không xe · 77.8% khám · **4.8 km**.\n  4. **Thứ Bảy 4 · `13121009405`**: 4,332 dân · 7.9% không BH · 20.9% không xe · **70.3% khám** · **2.4 km**.\n• **Kiểm toán Công bằng (`sql/audit_demographics_v2.sql`)**: Da đen **1.02** | Tây Ban Nha **0.81** | Da trắng **0.88** | Châu Á **1.04** -> **Không có cờ vi phạm**."
          : "From `docs/HANDOFF.md` (§2 & §3), `docs/scoring.md`, and `sql/rank_tracts_plan_c.sql`:\n• **Scoring Formula (`docs/scoring.md` & `rank_tracts_plan_c.sql`)**: Sum of tract percentile ranks: `pct_uninsured` (PLACES 18–64) + `pct_no_vehicle` (CDC SVI) + `pct_checkup` reversed (low checkup = high need), restricted to tracts **>2 km from an adult-accessible safety-net site** (`a4i_health.tract_access_adult`). From rank #3 on, 95% confidence intervals (`a4i_health.places_ci`) overlap 35–67 tracts (a statistical tie broken by `pct_no_vehicle` and ≥5 km spacing).\n• **Three Self-Corrections (`docs/HANDOFF.md` §3)**:\n  1. *Plan A (`sql/rank_tracts_v2.sql`, need + distance)*: Reached Black uninsured residents at `0.53` of their county share (`FLAG < 0.80`).\n  2. *Plan B (`sql/rank_tracts_need_only.sql`, need only)*: Passed Black (`0.99`, White `0.72 FLAG`), but top picks sat `0.45–0.83 km` from existing clinics where a van adds no access.\n  3. *Plan C Greedy First 4 (`11431 / 10125 / 06900 / 06602`)*: Candidate pool passed (`1.00`), but greedy spacing picked 2 North Fulton tracts → Black ratio `0.45 FLAG` on the final 4-stop set.\n• **Final 4 Approved Saturdays (`scripts/pick4.py`, 623 spaced combos tested, need score 9.16)**:\n  1. **Sat 1 · `13121010125`**: 3,251 people · 12.9% uninsured · 31.6% no car · 73.7% checkup · **20.1 km** to adult safety-net (*Farthest from care; 1 in 3 households no car*).\n  2. **Sat 2 · `13121006900`**: 3,733 people · 14.8% uninsured · 20.5% no car · 74.5% checkup · **3.2 km** (*High need, south Atlanta; 5.3% limited English*).\n  3. **Sat 3 · `13121011307`**: 4,631 people · **18.0% uninsured** · 22.9% no car · 77.8% checkup · **4.8 km** (*Most uninsured of the four*).\n  4. **Sat 4 · `13121009405`**: 4,332 people · 7.9% uninsured · 20.9% no car · **70.3% checkup** · **2.4 km** (*Lowest checkup rate of the four*).\n• **Equity Audit of Final 4 (`sql/audit_demographics_v2.sql`)**: Black **1.02** | Hispanic **0.81** (borderline) | White **0.88** | Asian **1.04** → **No flags**.";
      contributions = [
        {
          agent: "Scouts",
          role: "sql/scout_burden.sql & sql/tract_access_adult.sql",
          finding:
            "Loaded `burden_tracts`, `tract_access_adult`, and `places_ci` across 325 Fulton County tracts.",
        },
        {
          agent: "Planner",
          role: "sql/rank_tracts_plan_c.sql & scripts/pick4.py",
          finding:
            "Filtered >2 km from adult safety-net clinics and searched 623 spaced 4-stop sets (>=5 km apart) to select 10125, 06900, 11307, 09405.",
        },
        {
          agent: "Auditor",
          role: "sql/audit_demographics_v2.sql & docs/findings.md",
          finding:
            "Audited the final 4-stop set against county uninsured shares (54.2% Black, 8.4% Hispanic, 29.0% White, 5.4% Asian): 1.02 / 0.81 / 0.88 / 1.04 (0 flags).",
        },
      ];
      dataWarning =
        "Labels (`docs/HANDOFF.md` §2): Tract level. Uninsured/checkup = CDC PLACES modeled; no-car = CDC SVI survey; distances = straight-line to federal sites (school clinics excluded).";
    }
    // 8. Strictly refuse any other out-of-corpus question!
    else {
      inCorpus = false;
      corpusSources = AUTHORIZED_REPO_CORPUS;
      answer =
        locale === "es"
          ? "Restricción del Corpus: Este asistente está estrictamente restringido a responder únicamente a partir del corpus y las fuentes de datos del repositorio (`Agents_for_Impact_CH5`). Su pregunta no coincide con ninguna tabla o documento verificado en el repositorio.\n\nPuede preguntar sobre:\n• Las 4 paradas finales del plan (`13121010125`, `13121006900`, `13121011307`, `13121009405`) y los 3 borradores rechazados (Plan A, Plan B, Plan C voraz) en `docs/HANDOFF.md` y `docs/findings.md`.\n• Por qué el Tracto `13121011431` (34.6% sin seguro) no fue elegido (`scripts/pick4.py`).\n• Cualquier código de tracto censal del Condado de Fulton (`13121xxxxxx`) en `a4i_health.burden_tracts`, `tract_access` y `tract_access_adult`.\n• Clínicas escolares (`sql/tract_access_adult.sql`), horarios (`sql/access_by_hours.sql`), áreas de escasez (`shortage_areas`), calidad del aire PM2.5 (`exposure_tracts`) o tendencias respiratorias (`disease_weekly`)."
          : locale === "vi"
          ? "Giới hạn Kho dữ liệu (Corpus): Trợ lý này chỉ được phép trả lời dựa trên các nguồn dữ liệu có trong repo (`Agents_for_Impact_CH5`). Câu hỏi của bạn nằm ngoài phạm vi dữ liệu đã xác minh.\n\nBạn có thể hỏi về:\n• 4 điểm đỗ Thứ Bảy được duyệt (`13121010125`, `13121006900`, `13121011307`, `13121009405`) và 3 phương án bị bác bỏ (`docs/HANDOFF.md`, `docs/findings.md`).\n• Tại sao Phân khu `13121011431` (34.6% không bảo hiểm) không được chọn (`scripts/pick4.py`).\n• Tra cứu bất kỳ mã phân khu nào tại Quận Fulton (`13121xxxxxx`) từ `a4i_health.burden_tracts` & `tract_access_adult`.\n• Phòng khám trường học, vùng thiếu hụt y tế (`shortage_areas`), bụi mịn PM2.5 (`exposure_tracts`) hoặc dịch bệnh hô hấp (`disease_weekly`)."
          : "Corpus Restriction — Outside Repository Data Sources: This prompt is strictly restricted to answering from the repository corpus (`Agents_for_Impact_CH5`). Your question cannot be answered from the verified tables or documents in this repo.\n\nYou can ask about any of the following in-corpus topics:\n• The Final 4 Saturday stops (`13121010125`, `13121006900`, `13121011307`, `13121009405`) and the 3 rejected drafts (Plan A, Plan B, Greedy Plan C) from `docs/HANDOFF.md` & `docs/findings.md`.\n• Why Tract `13121011431` (34.6% uninsured) was not chosen (`scripts/pick4.py` & `sql/audit_demographics_v2.sql`).\n• Any specific Fulton County census tract (`13121xxxxxx`, e.g., `10214`, `007603`, `10125`) queried live from `a4i_health.burden_tracts`, `tract_access`, and `tract_access_adult`.\n• School-based clinics (`sql/tract_access_adult.sql`), clinic opening hours (`sql/access_by_hours.sql`), federal shortage areas (`a4i_health.shortage_areas`), PM2.5 air exposure (`sql/scout_context_air.sql`), or regional respiratory ED trends (`sql/scout_context_disease.sql`).";
      contributions = [
        {
          agent: "Auditor",
          role: "Strict Repo Corpus Guardrail",
          finding:
            "Rejected out-of-scope query. Only `a4i_health` BigQuery tables, `sql/*.sql`, `scripts/pick4.py`, and `docs/*.md` are allowed.",
        },
      ];
      dataWarning =
        "Authorized Repo Corpus: `a4i_health.*`, `sql/*.sql`, `docs/HANDOFF.md`, `docs/findings.md`, `docs/scoring.md`, `data/README.md`.";
    }

    return NextResponse.json({
      ok: true,
      inCorpus,
      question,
      answer,
      focusRank,
      contributions,
      corpusSources,
      dataWarning,
      liveTractRow,
      answeredAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error ? error.message : "Failed to answer question",
      },
      { status: 500 }
    );
  }
}
