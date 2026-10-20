"use client";

import React, { useState } from "react";
import { Locale } from "@/data/contractData";
import { Info, X, HelpCircle, CheckCircle2, Sparkles } from "lucide-react";

export type ExplainerKey =
  | "tract"
  | "plan_c_ci"
  | "need_score"
  | "modeled_vs_measured"
  | "scale_resolution"
  | "four_fifths_rule"
  | "human_tradeoff_11431"
  | "adult_safety_net";

interface ExplainerEntry {
  badge: string;
  title: string;
  shortSummary: string;
  exampleBox: string;
  whyItMatters: string;
}

export const EXPLAINER_DICTIONARY: Record<
  Locale,
  Record<ExplainerKey, ExplainerEntry>
> = {
  en: {
    tract: {
      badge: "GEOGRAPHY TERM",
      title: "What is a “Census Tract” (e.g., 13121010125)?",
      shortSummary:
        "A Census Tract is simply an official neighborhood boundary used by the U.S. Census Bureau. Each tract holds about 3,000 to 5,000 residents (roughly 1 to 2 miles across).",
      exampleBox:
        "How to read the 11-digit number 13121010125:\n• 13 = State of Georgia\n• 121 = Fulton County\n• 010125 = Census Tract 101.25 (Sandy Springs / Roswell Rd corridor)",
      whyItMatters:
        "County averages hide struggling pockets. Looking at individual Census Tracts lets the van target the exact 5-block neighborhood where residents lack cars and insurance.",
    },
    plan_c_ci: {
      badge: "RANKING & CONFIDENCE INTERVAL (CI)",
      title: "What does “Plan C #1” & “CI Statistical Tie” mean?",
      shortSummary:
        "“Plan C” is our 3rd and smartest ranking formula: it scores neighborhoods on health and transportation need, but ONLY considers neighborhoods more than 2 km away from an existing adult safety-net clinic.",
      exampleBox:
        "Why “CI (Confidence Interval)” matters:\n• Health survey numbers have a margin of error (Confidence Interval).\n• The top 2 tracts (34.6% uninsured) stand out clearly, but from rank #3 onward, each tract's margin of error overlaps 35–67 other tracts (a “statistical tie”).\n• When tracts are tied inside the margin of error, the AI breaks ties using % of households with no car and ≥5 km spacing.\n• Among the 4 stops that pass all fairness and spacing rules, Tract 13121010125 is #1 (Plan C #1).",
      whyItMatters:
        "Prevents false precision: the AI won't pretend a 0.1% survey difference makes one neighborhood more deserving than another.",
    },
    need_score: {
      badge: "COMPOSITE SCORE (0.00 – 3.00)",
      title: "How is the “Need Score” (e.g., 2.41 / 3.00) calculated?",
      shortSummary:
        "Every neighborhood in Fulton County is ranked from 0.00 (lowest) to 1.00 (highest) on three critical barriers, then added together for a maximum possible score of 3.00.",
      exampleBox:
        "The 3 Equal Ingredients (Max = 3.00):\n1. % Uninsured Adults (0.00 to 1.00 percentile rank)\n2. % Households With No Car (0.00 to 1.00 percentile rank)\n3. % Adults Overdue for a Routine Checkup (0.00 to 1.00 percentile rank)\n\nA score of 2.41 means this neighborhood ranks near the top of Fulton County across all three barriers simultaneously.",
      whyItMatters:
        "A neighborhood with high uninsured rates AND no cars needs a mobile van much more urgently than a neighborhood where residents can easily drive elsewhere.",
    },
    modeled_vs_measured: {
      badge: "DATA SOURCE HONESTY",
      title: "What is “Measured / Survey” vs. “Modeled Estimate”?",
      shortSummary:
        "Not all numbers come from counting patients at a clinic door. Our agents label where every number comes from so coordinators know how much weight to give it.",
      exampleBox:
        "• Measured (Green): Exact map distance from the neighborhood center to the nearest federal safety-net clinic (HRSA).\n• Survey (Green): U.S. Census American Community Survey (ACS) household counts (e.g., % with no car, % limited English).\n• Modeled Estimate (Indigo): CDC PLACES statistical estimates of chronic disease (e.g., diabetes, high blood pressure) based on national health surveys.",
      whyItMatters:
        "Modeled estimates are great for comparing need across neighborhoods, but should never be quoted as an exact count of sick residents.",
    },
    scale_resolution: {
      badge: "GEOGRAPHIC SCALE WARNING",
      title: "Why are some numbers labeled “12 km Grid” or “4-County Region”?",
      shortSummary:
        "Government tables often attach an 11-digit neighborhood code to data that was actually measured across a huge region.",
      exampleBox:
        "• Neighborhood Tract (~4,000 people): Insurance, car ownership, and clinic distance.\n• 12 km Air Grid: EPA PM2.5 air pollution comes from a giant 12 km grid—almost identical across Fulton County (9.57 to 10.22 µg/m³).\n• 4-County Hospital Region: Emergency room COVID/Flu trends cover Fulton + DeKalb + Clayton + Cobb together, and data ends August 1, 2026.",
      whyItMatters:
        "We never claim “flu is rising in this specific neighborhood” when the data only measures a 4-county hospital region.",
    },
    four_fifths_rule: {
      badge: "FAIRNESS AUDIT (80% RULE)",
      title: "What is the “Four-Fifths Rule” (0.80 Fairness Threshold)?",
      shortSummary:
        "A standard civil-rights fairness test. Even though the Planner is blind to race when picking stops, the Auditor checks afterward whether the 4 stops fairly reach Fulton County's uninsured residents of every background.",
      exampleBox:
        "How to read the ratio:\n• 1.00 = Exact match with that group's share of uninsured residents in Fulton County.\n• 0.80 or higher = PASS (at least four-fifths / 80% representation).\n• Below 0.80 = FLAG for human review.\n\nOur Final 4 Plan passes every group: Black 1.02 · Hispanic 0.81 · White 0.88 · Asian 1.04.",
      whyItMatters:
        "Ensures a “colorblind” math formula doesn't accidentally leave out Black, Hispanic, White, or Asian uninsured residents.",
    },
    human_tradeoff_11431: {
      badge: "HUMAN-IN-THE-LOOP DECISION",
      title: "Why is Tract 13121011431 marked “Not Chosen — Human Decision”?",
      shortSummary:
        "Tract 13121011431 (Sandy Springs) has the highest uninsured rate in the county (34.6%, ~75% Hispanic residents). However, in all 623 possible 4-stop combinations, including it drops the 4-stop Black uninsured ratio below 0.80.",
      exampleBox:
        "Why the AI didn't hide this:\n• Greedy math picked 11431 + 10125, which caused a severe fairness flag (Black ratio 0.45).\n• Rather than quietly dropping 11431 or breaking the fairness rule, the AI highlights 11431 on your map so YOU (the Outreach Coordinator) can decide whether to add a 5th stop or send a partner clinic van there.",
      whyItMatters:
        "Computers should surface hard policy trade-offs to human leaders—not bury them inside a spreadsheet.",
    },
    adult_safety_net: {
      badge: "CLINIC ACCESS FILTER (>2 KM)",
      title: "What is an “Adult-Accessible Safety-Net Clinic”?",
      shortSummary:
        "A Federally Qualified Health Center (FQHC) or HRSA health center that treats uninsured adults on a sliding fee scale—excluding student-only school clinics.",
      exampleBox:
        "Why we excluded school clinics:\n• 9+ federal safety-net sites in Fulton County are inside elementary/high schools that only treat enrolled students.\n• Removing student-only clinics revealed that neighborhoods like Tract 13121010125 are actually 20.1 km from adult safety-net care!",
      whyItMatters:
        "Stops the van from skipping a high-need neighborhood just because an elementary school nurse's office is nearby.",
    },
  },
  es: {
    tract: {
      badge: "TÉRMINO GEOGRÁFICO",
      title: "¿Qué es un “Tracto Censal” (ej. 13121010125)?",
      shortSummary:
        "Un Tracto Censal es un vecindario oficial definido por el Censo de EE. UU., donde viven entre 3,000 y 5,000 personas.",
      exampleBox:
        "Cómo leer el código de 11 dígitos 13121010125:\n• 13 = Georgia\n• 121 = Condado de Fulton\n• 010125 = Vecindario 101.25 (Sandy Springs / Roswell Rd)",
      whyItMatters:
        "Los promedios del condado ocultan vecindarios con alta necesidad. El tracto permite enviar la clínica móvil a las cuadras exactas.",
    },
    plan_c_ci: {
      badge: "RANKING E INTERVALO DE CONFIANZA (CI)",
      title: "¿Qué significan “Plan C #1” y “Empate Estadístico CI”?",
      shortSummary:
        "El “Plan C” califica vecindarios por necesidad de salud y transporte, pero SOLO considera áreas a más de 2 km de una clínica gratuita para adultos.",
      exampleBox:
        "Por qué importa el Intervalo de Confianza (CI):\n• Las encuestas tienen margen de error.\n• Del puesto #3 en adelante, los márgenes de error se superponen con 35–67 tractos (“empate estadístico”).\n• Cuando hay empate, el agente desempata usando % de hogares sin auto y distancia ≥5 km.",
      whyItMatters:
        "Evita la falsa precisión cuando dos vecindarios tienen necesidades estadísticamente iguales.",
    },
    need_score: {
      badge: "PUNTAJE COMPUESTO (0.00 – 3.00)",
      title: "¿Cómo se calcula el “Puntaje de Necesidad” (ej. 2.41 / 3.00)?",
      shortSummary:
        "Suma tres rankings (de 0.00 a 1.00 cada uno): % sin seguro médico, % de hogares sin auto y % sin chequeo médico anual (máximo = 3.00).",
      exampleBox:
        "Un puntaje de 2.41 sobre 3.00 significa que el vecindario está entre los más necesitados del condado en las tres barreras a la vez.",
      whyItMatters:
        "Prioriza lugares donde la falta de seguro se combina con la falta de transporte.",
    },
    modeled_vs_measured: {
      badge: "ORIGEN DE LOS DATOS",
      title: "¿Qué es “Medido / Encuesta” vs. “Estimación Modelada”?",
      shortSummary:
        "Indica si el dato es una medición exacta de mapa/censo o una estimación estadística de los CDC.",
      exampleBox:
        "• Medido / Encuesta: Distancia en km (HRSA) y hogares sin auto (Censo ACS).\n• Estimación Modelada: Tasas de diabetes o presión alta estimadas por CDC PLACES.",
      whyItMatters:
        "Mantiene la honestidad científica ante los coordinadores de salud.",
    },
    scale_resolution: {
      badge: "ESCALA GEOGRÁFICA",
      title: "¿Por qué algunos datos dicen “Cuadrícula 12 km” o “Región de 4 Condados”?",
      shortSummary:
        "El aire (PM2.5) se mide en bloques de 12 km y las visitas a urgencias por gripe/COVID cubren 4 condados juntos.",
      exampleBox:
        "Nunca decimos que los virus suben en un vecindario específico si el dato es de una región de 4 condados.",
      whyItMatters:
        "Evita confundir datos regionales con datos de una sola calle.",
    },
    four_fifths_rule: {
      badge: "AUDITORÍA DE EQUIDAD (REGLA 80%)",
      title: "¿Qué es la “Regla de los Cuatro Quintos” (0.80)?",
      shortSummary:
        "Verifica que las 4 paradas sirvan justamente a todos los grupos sin seguro médico del condado (ratio ≥ 0.80 aprueba).",
      exampleBox:
        "Nuestro Plan Final aprueba en todos los grupos: Afroamericanos 1.02 · Hispanos 0.81 · Blancos 0.88 · Asiáticos 1.04.",
      whyItMatters:
        "Garantiza que ninguna comunidad quede excluida accidentalmente.",
    },
    human_tradeoff_11431: {
      badge: "DECISIÓN HUMANA",
      title: "¿Por qué el Tracto 13121011431 dice “No Elegido — Decisión Humana”?",
      shortSummary:
        "Tiene 34.6% sin seguro (~75% hispanos), pero incluirlo en un plan de solo 4 paradas baja el ratio afroamericano por debajo de 0.80.",
      exampleBox:
        "El sistema lo muestra en el mapa para que usted decida si envía una 5ª unidad o un socio comunitario.",
      whyItMatters:
        "Las decisiones difíciles de equidad deben ser tomadas por personas, no ocultadas por el software.",
    },
    adult_safety_net: {
      badge: "FILTRO DE CLÍNICAS (>2 KM)",
      title: "¿Qué es una “Clínica de Red de Seguridad para Adultos”?",
      shortSummary:
        "Centros de salud federales (FQHC) abiertos a adultos sin seguro, excluyendo clínicas dentro de escuelas que solo atienden estudiantes.",
      exampleBox:
        "Al excluir clínicas escolares, descubrimos que el Tracto 10125 está a 20.1 km de una clínica para adultos.",
      whyItMatters:
        "Evita asumir que una enfermería escolar atiende a los adultos del vecindario.",
    },
  },
  vi: {
    tract: {
      badge: "THUẬT NGỮ ĐỊA LÝ",
      title: "“Phân khu Điều tra Dân số (Census Tract)” là gì?",
      shortSummary:
        "Là một khu dân cư nhỏ do Cục Điều tra Dân số Hoa Kỳ quy định, thường có khoảng 3.000 đến 5.000 cư dân.",
      exampleBox:
        "Cách đọc mã 11 chữ số 13121010125:\n• 13 = Tiểu bang Georgia\n• 121 = Quận Fulton\n• 010125 = Khu dân cư 101.25 (Sandy Springs / Roswell Rd)",
      whyItMatters:
        "Giúp xe khám lưu động đến đúng khu phố đang thiếu xe cá nhân và bảo hiểm y tế.",
    },
    plan_c_ci: {
      badge: "XẾP HẠNG & SAI SỐ THỐNG KÊ (CI)",
      title: "“Plan C #1” và “Hòa Thống kê CI” nghĩa là gì?",
      shortSummary:
        "Plan C chấm điểm nhu cầu y tế & giao thông nhưng CHỈ xét các khu dân cư cách phòng khám an sinh người lớn trên 2 km.",
      exampleBox:
        "Từ hạng #3 trở đi, khoảng tin cậy (CI) chồng lấp với 35–67 phân khu khác. Hệ thống phá thế hòa bằng % hộ không có xe và khoảng cách ≥5 km.",
      whyItMatters:
        "Tránh ngộ nhận sự khác biệt nhỏ trong khảo sát là chênh lệch thực tế.",
    },
    need_score: {
      badge: "ĐIỂM NHU CẦU TỔNG HỢP (0.00 – 3.00)",
      title: "“Điểm Nhu cầu” (ví dụ 2.41 / 3.00) được tính thế nào?",
      shortSummary:
        "Cộng thứ hạng phần trăm (0.00–1.00) của 3 yếu tố: % Không bảo hiểm + % Không có xe hơi + % Thiếu khám định kỳ (tối đa 3.00).",
      exampleBox:
        "Điểm 2.41 / 3.00 có nghĩa khu dân cư này nằm trong nhóm cần xe khám nhất toàn quận ở cả 3 rào cản.",
      whyItMatters:
        "Ưu tiên nơi vừa thiếu bảo hiểm vừa không có phương tiện đi lại.",
    },
    modeled_vs_measured: {
      badge: "NGUỒN DỮ LIỆU",
      title: "“Đo đạc / Khảo sát” khác “Ước tính Mô hình” thế nào?",
      shortSummary:
        "Phân biệt giữa khoảng cách đo thực tế trên bản đồ / khảo sát hộ gia đình (ACS) với ước tính thống kê của CDC PLACES.",
      exampleBox:
        "Giúp điều phối viên biết số nào là đo đạc thực tế, số nào là mô hình ước tính.",
      whyItMatters: "Đảm bảo tính minh bạch khoa học.",
    },
    scale_resolution: {
      badge: "QUY MÔ ĐỊA LÝ",
      title: "Tại sao có nhãn “Lưới 12 km” và “Vùng 4 Quận”?",
      shortSummary:
        "Bụi mịn PM2.5 đo theo ô lưới 12 km, còn xu hướng cấp cứu cúm/COVID đo chung cho cả 4 quận.",
      exampleBox:
        "Không bao giờ lấy số liệu của vùng 4 quận để nói rằng dịch bệnh đang tăng tại một con phố.",
      whyItMatters: "Tránh nhầm lẫn quy mô dữ liệu.",
    },
    four_fifths_rule: {
      badge: "KIỂM TOÁN CÔNG BẰNG (QUY TẮC 80%)",
      title: "“Quy tắc 4/5” (Ngưỡng công bằng 0.80) là gì?",
      shortSummary:
        "Đảm bảo 4 điểm đỗ phục vụ công bằng mọi nhóm cư dân không bảo hiểm (tỷ lệ ≥ 0.80 là Đạt).",
      exampleBox:
        "Kế hoạch 4 điểm đạt ở mọi nhóm: Người Da đen 1.02 · Gốc Tây Ban Nha 0.81 · Da trắng 0.88 · Châu Á 1.04.",
      whyItMatters: "Ngăn ngừa thuật toán vô tình bỏ sót một cộng đồng.",
    },
    human_tradeoff_11431: {
      badge: "QUYẾT ĐỊNH CỦA CON NGƯỜI",
      title: "Tại sao Phân khu 13121011431 ghi “Không Chọn — Quyết định Con người”?",
      shortSummary:
        "Có 34.6% không bảo hiểm (~75% gốc Tây Ban Nha), nhưng nếu đưa vào bộ 4 điểm sẽ làm tỷ lệ cư dân Da đen tụt xuống dưới 0.80.",
      exampleBox:
        "Hệ thống giữ ghim này trên bản đồ để Trưởng nhóm Tiếp cận quyết định cử chuyến xe thứ 5 hoặc đối tác hỗ trợ.",
      whyItMatters:
        "Máy tính phải trình bày rõ sự đánh đổi cho con người quyết định.",
    },
    adult_safety_net: {
      badge: "BỘ LỌC PHÒNG KHÁM (>2 KM)",
      title: "“Phòng khám An sinh cho Người lớn” là gì?",
      shortSummary:
        "Phòng khám liên bang (FQHC) phục vụ người lớn không bảo hiểm, đã loại trừ các phòng y tế trong trường học chỉ khám cho học sinh.",
      exampleBox:
        "Nhờ loại trừ phòng khám trường học, hệ thống phát hiện Phân khu 10125 thực chất cách phòng khám người lớn tới 20.1 km.",
      whyItMatters:
        "Không để phòng y tế trường tiểu học làm sai lệch khoảng cách tiếp cận của người lớn.",
    },
  },
};

export function InfoTrigger({
  term,
  label,
  onOpen,
  variant = "light",
}: {
  term: ExplainerKey;
  label?: string;
  onOpen: (term: ExplainerKey) => void;
  variant?: "light" | "dark" | "teal";
}) {
  const styles =
    variant === "dark"
      ? "bg-slate-800 hover:bg-slate-700 text-teal-300 border-slate-700"
      : variant === "teal"
      ? "bg-teal-100/90 hover:bg-teal-200 text-teal-900 border-teal-300"
      : "bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-800 border-slate-300 hover:border-teal-300";

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onOpen(term);
      }}
      title="Click for plain-language explanation"
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-semibold border transition cursor-pointer ${styles}`}
    >
      <Info className="w-3 h-3 shrink-0 text-teal-600" />
      {label ? <span>{label}</span> : <span>Info</span>}
    </button>
  );
}

export function InfoModal({
  activeTerm,
  locale,
  onClose,
  onSelectTerm,
}: {
  activeTerm: ExplainerKey | null;
  locale: Locale;
  onClose: () => void;
  onSelectTerm: (term: ExplainerKey) => void;
}) {
  if (!activeTerm) return null;
  const entry = EXPLAINER_DICTIONARY[locale][activeTerm];
  const allKeys: { key: ExplainerKey; shortLabel: string }[] = [
    { key: "tract", shortLabel: "Census Tract" },
    { key: "plan_c_ci", shortLabel: "CI & Plan C #1" },
    { key: "need_score", shortLabel: "Need Score (2.41)" },
    { key: "adult_safety_net", shortLabel: ">2 km Adult Clinic Filter" },
    { key: "four_fifths_rule", shortLabel: "Fairness Ratio (0.80)" },
    { key: "human_tradeoff_11431", shortLabel: "Tract 11431 Trade-off" },
    { key: "modeled_vs_measured", shortLabel: "Modeled vs. Measured" },
    { key: "scale_resolution", shortLabel: "12km Grid / 4-County Scale" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30">
              <HelpCircle className="w-4 h-4" />
            </span>
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-teal-300">
                {entry.badge}
              </div>
              <h3 className="text-base font-extrabold text-white">
                Plain-Language Coordinator Guide
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-4">
          <h4 className="text-lg font-extrabold text-slate-900">
            {entry.title}
          </h4>
          <p className="text-sm text-slate-700 leading-relaxed">
            {entry.shortSummary}
          </p>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-800 whitespace-pre-line leading-relaxed font-medium">
            {entry.exampleBox}
          </div>

          <div className="bg-teal-50/80 border border-teal-200 rounded-xl p-3.5 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
            <div className="text-xs text-teal-950">
              <span className="font-bold">Why this matters for clinic planning: </span>
              {entry.whyItMatters}
            </div>
          </div>

          {/* Quick switcher to browse other terms */}
          <div className="pt-3 border-t border-slate-200">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-teal-600" />
              Click any other term to explain:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {allKeys.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onSelectTerm(item.key)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    activeTerm === item.key
                      ? "bg-teal-700 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {item.shortLabel}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
