export type Locale = "en" | "es" | "vi";

export type ScaleType = "census_tract" | "grid_12km" | "multi_county_4";
export type MethodType = "measured" | "modeled";

export interface LocalizedText {
  en: string;
  es: string;
  vi: string;
}

export interface LabeledMetric {
  id: string;
  label: LocalizedText;
  value: string;
  countyComparison: LocalizedText;
  scale: ScaleType;
  method: MethodType;
  source: string;
  agent: "Burden Scout" | "Access Scout" | "Context Scout";
  highlight?: boolean;
}

export interface ExecutionAdvisory {
  id: string;
  category: "public_event" | "road_work" | "transit" | "weather_holiday" | "co_location";
  severity: "opportunity" | "caution" | "critical";
  title: LocalizedText;
  timeWindow: LocalizedText;
  impact: LocalizedText;
  actionRequired: LocalizedText;
  defaultChecked?: boolean;
}

export interface TractStop {
  rank: number;
  saturdayDate: string;
  saturdayLabel: LocalizedText;
  tractFips: string;
  neighborhood: LocalizedText;
  corridor: LocalizedText;
  siteName: LocalizedText;
  siteAddress: string;
  coordinates: { x: number; y: number; lat: string; lng: string };
  needScore: number;
  scoreCi: string;
  status: "approved_round_1" | "promoted_round_2";
  headlineReason: LocalizedText;
  agentConsensus: {
    planner: LocalizedText;
    auditor: LocalizedText;
    scouts: LocalizedText;
  };
  metrics: LabeledMetric[];
  advisories: ExecutionAdvisory[];
  servicesFocus: LocalizedText[];
}

export const UI_STRINGS: Record<
  Locale,
  {
    govBanner: string;
    appTitle: string;
    appSubtitle: string;
    coordinatorRole: string;
    countyLabel: string;
    runPipelineBtn: string;
    runningPipelineBtn: string;
    viewWhiteboardBtn: string;
    printFlyerBtn: string;
    pitchBannerTag: string;
    pitchBannerText: string;
    agentOfficeTitle: string;
    agentOfficeSubtitle: string;
    prominentRecsTag: string;
    prominentRecsTitle: string;
    prominentRecsDesc: string;
    selectStopPrompt: string;
    needScoreLabel: string;
    countyAvgLabel: string;
    whyChosenTitle: string;
    scaleLegendTitle: string;
    scaleTract: string;
    scaleGrid: string;
    scaleRegion: string;
    methodMeasured: string;
    methodModeled: string;
    executionRadarTitle: string;
    executionRadarDesc: string;
    coordinatorActionLabel: string;
    mapPanelTitle: string;
    mapPanelSubtitle: string;
    argumentPanelTag: string;
    argumentPanelTitle: string;
    argumentPanelDesc: string;
    round1Label: string;
    auditorObjectionLabel: string;
    round2FixLabel: string;
    equityPanelTag: string;
    equityPanelTitle: string;
    equityPanelRule: string;
    limitationsTitle: string;
    limitationsSubtitle: string;
    flyerSectionTag: string;
    flyerSectionTitle: string;
    flyerSectionDesc: string;
    whiteboardTitle: string;
    filterAllEvents: string;
    filterCritical: string;
    filterOpportunities: string;
  }
> = {
  en: {
    govBanner: "Fulton County Department of Public Health · Mobile Outreach Dispatch System (FIPS 13121)",
    appTitle: "Clinic Van Planner",
    appSubtitle: "Multi-Agent Street-Level Decision & Execution Workspace for the Outreach Coordinator",
    coordinatorRole: "Active User: Outreach Lead (Fulton County)",
    countyLabel: "Deployment Cycle: 4 Saturdays · November 2026",
    runPipelineBtn: "Re-Run 5-Agent Verification Loop",
    runningPipelineBtn: "Running Scouts → Planner → Auditor...",
    viewWhiteboardBtn: "Inspect session.state Whiteboard",
    printFlyerBtn: "Community Flyer (EN / ES / VI)",
    pitchBannerTag: "FINAL AUDITED CLINIC PLAN · REJECTED ITS OWN ANSWER 3 TIMES BEFORE CONVERGING",
    pitchBannerText:
      "Final 4 Saturdays at Tracts 13121010125, 13121006900, 13121011307, and 13121009405 (>=5 km apart, >2 km from adult-accessible safety-net clinics, excluding student-only school clinics). Passes the Four-Fifths Equity Audit across every group: Black 1.02 | Hispanic 0.81 | White 0.88 | Asian 1.04.",
    agentOfficeTitle: "The 5-Agent Office Workflow (Google ADK + BigQuery MCP Toolbox)",
    agentOfficeSubtitle: "Strict role isolation: Scouts & Planner are barred from race data; Auditor audits the final 4-stop set; Explainer writes at a 6th-grade reading level.",
    prominentRecsTag: "PRIMARY AGENT RECOMMENDATIONS · FINAL 4 AUDITED SATURDAYS (DOCS/HANDOFF.MD)",
    prominentRecsTitle: "Recommended Mobile Clinic Van Deployment Schedule",
    prominentRecsDesc:
      "Click any Saturday stop to inspect its BigQuery-verified supportive data (labeled by geographic resolution and measured/survey/modeled source) plus public events and transit advisories.",
    selectStopPrompt: "Selected for Deep-Dive Inspection",
    needScoreLabel: "Plan C Need Percentile Sum",
    countyAvgLabel: "vs. Fulton baseline",
    whyChosenTitle: "Supportive Evidence: Why the Agents Chose This Neighborhood",
    scaleLegendTitle: "Mandatory Data Provenance Labels (Rule #4)",
    scaleTract: "Census Tract (~4k residents)",
    scaleGrid: "12 km EPA Grid (1.05× spread)",
    scaleRegion: "4-County Region (to Aug 1, 2026)",
    methodMeasured: "Measured / Survey (ACS/HRSA)",
    methodModeled: "Modeled Estimate (CDC PLACES)",
    executionRadarTitle: "Public Events, Transit & Street-Level Execution Radar",
    executionRadarDesc:
      "Known public events, GDOT road work, MARTA Saturday headway shifts, and co-location opportunities affecting clinic van operations.",
    coordinatorActionLabel: "Coordinator Execution Checklist",
    mapPanelTitle: "Fulton County (13121) Street-Level Dispatch Map",
    mapPanelSubtitle: "Showing 4 Approved Saturday Stops (10125, 06900, 11307, 09405) + Tract 11431 ('Not Chosen — Human Decision')",
    argumentPanelTag: "DEMO MOMENT · THREE REJECTIONS BEFORE CONVERGING ON FINAL 4",
    argumentPanelTitle: "The Argument: How the System Rejected Its Own Answer 3 Times",
    argumentPanelDesc:
      "Plan A failed equity (Black 0.53 FLAG); Plan B put vans 0.45–0.83 km from existing clinics; Greedy Plan C picked 2 North Fulton tracts (Black 0.45 FLAG); Exhaustive search (623 sets) passed all checks.",
    round1Label: "1. Plan A & Plan B Rejected",
    auditorObjectionLabel: "2. Greedy Plan C Rejected (Black 0.45 FLAG)",
    round2FixLabel: "3. Final 4 Set Approved (623 Combos Tested)",
    equityPanelTag: "POST-HOC EQUITY AUDIT · HUMAN DECISION-MAKER ONLY",
    equityPanelTitle: "Who the Final 4 Plan Serves (BigQuery Audit)",
    equityPanelRule:
      "Rule #5 Enforced: Race is banned from Planner inputs. Auditor checks the final 4-stop set against Fulton County's uninsured population (Four-Fifths Rule: ratio < 0.80 = FLAG).",
    limitationsTitle: "What We Could Not Tell You (Say It Out Loud)",
    limitationsSubtitle: "Honest boundaries and human trade-offs surfaced by the Composer rulebook.",
    flyerSectionTag: "EXPLAINER AGENT OUTPUT (outreach) · 6TH-GRADE LEVEL · ZERO JARGON",
    flyerSectionTitle: "Ready-to-Distribute Multi-Lingual Neighborhood Flyer",
    flyerSectionDesc:
      "English first; Spanish justified at Stop #2 (Tract 13121006900, 5.3% limited-English households) and for Tract 11431 outreach.",
    whiteboardTitle: "ADK session.state Shared Whiteboard (contract.py)",
    filterAllEvents: "All Advisories",
    filterCritical: "Critical / Traffic Alerts",
    filterOpportunities: "Co-Location Opportunities",
  },
  es: {
    govBanner: "Departamento de Salud Pública del Condado de Fulton · Sistema de Despacho Móvil (FIPS 13121)",
    appTitle: "Planificador de Clínica Móvil",
    appSubtitle: "Espacio de Decisión y Ejecución a Nivel de Calle para el Coordinador de Alcance Comunitario",
    coordinatorRole: "Usuario Activo: Coordinador de Alcance (Fulton)",
    countyLabel: "Ciclo: 4 Sábados · Noviembre 2026",
    runPipelineBtn: "Ejecutar Bucle de 5 Agentes",
    runningPipelineBtn: "Ejecutando Exploradores → Planificador → Auditor...",
    viewWhiteboardBtn: "Ver Pizarra session.state",
    printFlyerBtn: "Folleto Comunitario (EN / ES / VI)",
    pitchBannerTag: "PLAN FINAL AUDITADO · RECHAZÓ SU PROPIA RESPUESTA 3 VECES ANTES DE CONVERGER",
    pitchBannerText:
      "4 sábados finales en los tramos 13121010125, 13121006900, 13121011307 y 13121009405 (>=5 km entre sí, excluyendo clínicas solo para estudiantes). Aprueba la auditoría de equidad en todos los grupos: Afroamericanos 1.02 | Hispanos 0.81 | Blancos 0.88 | Asiáticos 1.04.",
    agentOfficeTitle: "Flujo de Trabajo de los 5 Agentes (Google ADK + BigQuery MCP Toolbox)",
    agentOfficeSubtitle: "Aislamiento estricto: Exploradores y Planificador no ven datos raciales; el Auditor evalúa el conjunto final de 4 paradas.",
    prominentRecsTag: "RECOMENDACIONES PRINCIPALES · 4 SÁBADOS AUDITADOS (DOCS/HANDOFF.MD)",
    prominentRecsTitle: "Calendario Recomendado de Despliegue de la Clínica Móvil",
    prominentRecsDesc:
      "Seleccione cualquier parada de sábado para inspeccionar los datos verificados en BigQuery y los eventos públicos u obras viales.",
    selectStopPrompt: "Seleccionado para Inspección Detallada",
    needScoreLabel: "Puntaje Plan C",
    countyAvgLabel: "vs. promedio de Fulton",
    whyChosenTitle: "Evidencia de Respaldo: Por Qué los Agentes Eligieron Este Vecindario",
    scaleLegendTitle: "Etiquetas Obligatorias de Escala y Origen (Regla #4)",
    scaleTract: "Tramo Censal (~4k hab.)",
    scaleGrid: "Cuadrícula EPA 12 km",
    scaleRegion: "Región de 4 Condados",
    methodMeasured: "Medido / Encuesta (ACS/HRSA)",
    methodModeled: "Estimación Modelada (PLACES)",
    executionRadarTitle: "Radar de Eventos Públicos, Tránsito y Ejecución en Calle",
    executionRadarDesc:
      "Eventos públicos conocidos, obras de GDOT, horarios de sábado de MARTA y oportunidades de co-ubicación.",
    coordinatorActionLabel: "Lista de Verificación del Coordinador",
    mapPanelTitle: "Mapa de Despacho a Nivel de Calle del Condado de Fulton (13121)",
    mapPanelSubtitle: "Muestra las 4 Paradas Finales (10125, 06900, 11307, 09405) + Tramo 11431 (Decisión Humana)",
    argumentPanelTag: "MOMENTO DEMO · TRES RECHAZOS ANTES DEL PLAN FINAL",
    argumentPanelTitle: "El Argumento: Cómo el Sistema Rechazó su Propia Respuesta 3 Veces",
    argumentPanelDesc:
      "Plan A falló en equidad (0.53 FLAG); Plan B puso la unidad a 0.45–0.83 km de clínicas existentes; Plan C voraz falló en el conjunto final (0.45 FLAG); la búsqueda de 623 combinaciones aprobó todo.",
    round1Label: "1. Plan A y Plan B Rechazados",
    auditorObjectionLabel: "2. Plan C Voraz Rechazado (0.45 FLAG)",
    round2FixLabel: "3. Conjunto Final de 4 Aprobado (623 probados)",
    equityPanelTag: "AUDITORÍA DE EQUIDAD POST-HOC · SOLO PARA EL COORDINADOR HUMANO",
    equityPanelTitle: "A Quién Sirve el Plan Final (Auditoría BigQuery)",
    equityPanelRule:
      "Regla #5: Los datos de raza están prohibidos en la planificación; se audita el conjunto final de 4 paradas (Regla de 4/5: <0.80 = FLAG).",
    limitationsTitle: "Lo Que No Pudimos Hacer (Transparencia Total)",
    limitationsSubtitle: "Límites y decisiones humanas reportadas por el Compositor.",
    flyerSectionTag: "SALIDA DEL AGENTE EXPLICADOR (outreach) · CERO JERGA",
    flyerSectionTitle: "Folleto Comunitario Multilingüe Listo para Imprimir",
    flyerSectionDesc:
      "Inglés primero; Español justificado en la Parada #2 (Tramo 13121006900, 5.3% inglés limitado) y para alcance en 11431.",
    whiteboardTitle: "Pizarra Compartida ADK session.state (contract.py)",
    filterAllEvents: "Todos los Avisos",
    filterCritical: "Alertas Críticas / Tráfico",
    filterOpportunities: "Oportunidades de Co-Ubicación",
  },
  vi: {
    govBanner: "Sở Y tế Công cộng Quận Fulton · Hệ thống Điều phối Xe Phòng khám Lưu động (FIPS 13121)",
    appTitle: "Trình Lập Kế Hoạch Xe Phòng Khám",
    appSubtitle: "Không gian Quyết định & Điều hành Thực địa Đa Tác tử cho Điều phối viên Y tế",
    coordinatorRole: "Người dùng: Điều phối viên Ngoại viện (Fulton)",
    countyLabel: "Chu kỳ: 4 Thứ Bảy · Tháng 11/2026",
    runPipelineBtn: "Chạy lại Vòng Kiểm chứng 5 Tác tử",
    runningPipelineBtn: "Đang chạy Scouts → Planner → Auditor...",
    viewWhiteboardBtn: "Xem Bảng trắng session.state",
    printFlyerBtn: "Tờ rơi Cộng đồng (EN / ES / VI)",
    pitchBannerTag: "KẾ HOẠCH CUỐI CÙNG ĐÃ KIỂM TOÁN · TỰ BÁC BỎ 3 LẦN TRƯỚC KHI CHỐT",
    pitchBannerText:
      "4 Thứ Bảy cuối cùng tại các phân khu 13121010125, 13121006900, 13121011307 và 13121009405 (cách nhau >=5 km, loại trừ phòng khám chỉ phục vụ học sinh). Đạt kiểm toán công bằng cho mọi nhóm: Da đen 1.02 | GốcTây Ban Nha 0.81 | Da trắng 0.88 | Châu Á 1.04.",
    agentOfficeTitle: "Quy trình 5 Tác tử (Google ADK + BigQuery MCP Toolbox)",
    agentOfficeSubtitle: "Cách ly vai trò nghiêm ngặt: Scouts & Planner không xem dữ liệu chủng tộc; Auditor kiểm tra bộ 4 điểm cuối cùng.",
    prominentRecsTag: "ĐỀ XUẤT TRỌNG TÂM · 4 THỨ BẢY ĐÃ KIỂM TOÁN (DOCS/HANDOFF.MD)",
    prominentRecsTitle: "Lịch Điều phối Xe Phòng khám Lưu động Đề xuất",
    prominentRecsDesc:
      "Nhấp vào từng điểm dừng Thứ Bảy để xem dữ liệu minh chứng từ BigQuery cùng các sự kiện công cộng hoặc rào cản giao thông.",
    selectStopPrompt: "Đang chọn để Xem Chi tiết",
    needScoreLabel: "Điểm Nhu cầu Plan C",
    countyAvgLabel: "so với TB Quận Fulton",
    whyChosenTitle: "Dữ liệu Minh chứng: Vì sao Tác tử Chọn Khu vực Này",
    scaleLegendTitle: "Nhãn Quy mô & Nguồn Dữ liệu Bắt buộc (Quy tắc #4)",
    scaleTract: "Phân khu Điều tra (~4k dân)",
    scaleGrid: "Lưới EPA 12 km",
    scaleRegion: "Vùng 4 Quận (đến 01/08/2026)",
    methodMeasured: "Đo lường / Khảo sát (ACS/HRSA)",
    methodModeled: "Ước tính Mô hình (CDC PLACES)",
    executionRadarTitle: "Radar Sự kiện Công cộng, Giao thông & Thực thi Hiện trường",
    executionRadarDesc:
      "Các sự kiện công cộng, công trường GDOT, lịch xe buýt MARTA ngày Thứ Bảy và cơ hội phối hợp điểm phát thực phẩm.",
    coordinatorActionLabel: "Danh mục Chuẩn bị của Điều phối viên",
    mapPanelTitle: "Bản đồ Điều phối Thực địa Quận Fulton (13121)",
    mapPanelSubtitle: "Hiển thị 4 Điểm Đỗ Được Duyệt (10125, 06900, 11307, 09405) + Phân khu 11431 (Quyết định Con người)",
    argumentPanelTag: "ĐIỂM NHẤN DEMO · 3 LẦN TỰ BÁC BỎ TRƯỚC KHI CHỐT",
    argumentPanelTitle: "Cuộc Phản biện: Hệ thống Tự Bác bỏ Đáp án 3 Lần Như Thế Nào",
    argumentPanelDesc:
      "Plan A trượt công bằng (0.53 FLAG); Plan B đặt xe sát phòng khám hiện hữu (0.45–0.83 km); Plan C tham lam trượt kiểm toán bộ 4 điểm (0.45 FLAG); duyệt vét cạn 623 tổ hợp tìm ra bộ 4 điểm đạt chuẩn.",
    round1Label: "1. Bác bỏ Plan A & Plan B",
    auditorObjectionLabel: "2. Bác bỏ Plan C Tham lam (0.45 FLAG)",
    round2FixLabel: "3. Duyệt Bộ 4 Điểm Cuối (623 tổ hợp)",
    equityPanelTag: "KIỂM TOÁN CÔNG BẰNG HẬU KỲ · CHỈ DÀNH CHO CON NGƯỜI",
    equityPanelTitle: "Kế hoạch Phục vụ Ai (Kiểm toán BigQuery)",
    equityPanelRule:
      "Quy tắc #5: Dữ liệu chủng tộc bị cấm trong bước lập kế hoạch; chỉ kiểm toán trên bộ 4 điểm cuối cùng (Quy tắc 4/5: <0.80 = CẢNH BÁO).",
    limitationsTitle: "Những Điều Dữ Liệu Không Thể Làm Thay Bạn",
    limitationsSubtitle: "Giới hạn minh bạch và sự đánh đổi được báo cáo cho điều phối viên.",
    flyerSectionTag: "ĐẦU RA TÁC TỬ EXPLAINER (outreach) · KHÔNG THUẬT NGỮ",
    flyerSectionTitle: "Tờ rơi Cộng đồng Đa Ngôn ngữ Sẵn sàng In ấn",
    flyerSectionDesc:
      "Tiếng Anh mặc định; Tiếng Tây Ban Nha cấp thiết tại Điểm #2 (Tract 13121006900, 5.3% hạn chế tiếng Anh) và phân khu 11431.",
    whiteboardTitle: "Bảng trắng Chung ADK session.state (contract.py)",
    filterAllEvents: "Tất cả Cảnh báo",
    filterCritical: "Cảnh báo Giao thông / Khẩn",
    filterOpportunities: "Cơ hội Phối hợp Sự kiện",
  },
};

export const RECOMMENDED_STOPS: TractStop[] = [
  {
    rank: 1,
    saturdayDate: "2026-11-07",
    saturdayLabel: {
      en: "Saturday #1 · Nov 7, 2026 (9:00 AM – 2:00 PM)",
      es: "Sábado #1 · 7 de Nov, 2026 (9:00 AM – 2:00 PM)",
      vi: "Thứ Bảy #1 · 07/11/2026 (9:00 AM – 2:00 PM)",
    },
    tractFips: "13121010125",
    neighborhood: {
      en: "South Fulton / Chattahoochee Hills Rural-Urban Fringe (Tract 10125)",
      es: "Corredor Sur de Fulton / Chattahoochee (Tramo 10125)",
      vi: "Nam Fulton / Hành lang Chattahoochee (Phân khu 10125)",
    },
    corridor: {
      en: "Farthest from Care · 3,251 Residents",
      es: "Más Lejos de Atención · 3,251 Habitantes",
      vi: "Xa Y tế Nhất · 3.251 Cư dân",
    },
    siteName: {
      en: "South Fulton Community Hub & Transfer Pad",
      es: "Centro Comunitario del Sur de Fulton",
      vi: "Bãi đỗ Trung tâm Cộng đồng Nam Fulton",
    },
    siteAddress: "Tract 13121010125 · South Fulton Corridor, GA",
    coordinates: { x: 24, y: 78, lat: "33.6120° N", lng: "84.5410° W" },
    needScore: 9.42,
    scoreCi: "Plan C #1",
    status: "approved_round_1",
    headlineReason: {
      en: "Farthest from care in the final set: 20.1 km straight-line distance to the nearest adult-accessible safety-net clinic (excluding student-only school clinics), while 31.6% of households (nearly 1 in 3) have no car.",
      es: "El más alejado de atención médica: 20.1 km hasta la clínica de adultos más cercana (excluyendo clínicas escolares), mientras el 31.6% de los hogares (1 de cada 3) no tiene auto.",
      vi: "Xa điểm chăm sóc y tế nhất: cách 20.1 km đường thẳng tới phòng khám người lớn gần nhất (đã trừ phòng khám học đường), trong khi 31.6% hộ gia đình (1/3 số hộ) không có ô tô.",
    },
    agentConsensus: {
      planner: {
        en: "Selected as Saturday #1 anchor from Plan C (>2 km from adult safety-net clinics, >=5 km spacing). Solves the severe 20.1 km distance gap coupled with 31.6% carless households.",
        es: "Seleccionado como Sábado #1 del Plan C (>2 km de clínicas de adultos, >=5 km de separación). Cubre una brecha crítica de 20.1 km con 31.6% de hogares sin vehículo.",
        vi: "Được chọn làm điểm neo Thứ Bảy #1 từ Plan C (>2 km từ phòng khám người lớn, cách nhau >=5 km). Giải quyết khoảng trống 20.1 km và 31.6% hộ không có xe.",
      },
      auditor: {
        en: "PASSED Set-Level Audit (scripts/pick4.py): Part of the 4-stop combination achieving Black 1.02, Hispanic 0.81, White 0.88, Asian 1.04 parity (zero flags).",
        es: "APROBADO en Auditoría de Conjunto (scripts/pick4.py): Parte de la combinación que logra paridad 1.02 / 0.81 / 0.88 / 1.04 sin alertas.",
        vi: "ĐẠT Kiểm toán Tổ hợp 4 Điểm (scripts/pick4.py): Thuộc bộ 4 điểm đạt tỷ lệ công bằng 1.02 / 0.81 / 0.88 / 1.04 (không có cờ cảnh báo).",
      },
      scouts: {
        en: "Access Scout measured 20.1 km to adult safety-net care (school clinics excluded) and 31.6% no-car households; Burden Scout reported 12.9% uninsured and 73.7% checkup rate.",
        es: "Access Scout midió 20.1 km a clínica de adultos y 31.6% sin auto; Burden Scout reportó 12.9% sin seguro y 73.7% de chequeos.",
        vi: "Access Scout đo được 20.1 km tới phòng khám người lớn và 31.6% hộ không xe; Burden Scout ghi nhận 12.9% không bảo hiểm và 73.7% khám định kỳ.",
      },
    },
    metrics: [
      {
        id: "m1-dist",
        label: {
          en: "Distance to Adult Safety-Net Clinic (School Clinics Excluded)",
          es: "Distancia a Clínica de Adultos (Sin Clínicas Escolares)",
          vi: "Khoảng cách tới Phòng khám Người lớn (Trừ Trạm Trường học)",
        },
        value: "20.1 km",
        countyComparison: {
          en: "Farthest of the 4 stops (straight-line measured)",
          es: "La más lejana de las 4 paradas (línea recta)",
          vi: "Xa nhất trong 4 điểm dừng (đo đường thẳng)",
        },
        scale: "census_tract",
        method: "measured",
        source: "a4i_health.tract_access_adult (sql/tract_access_adult.sql)",
        agent: "Access Scout",
        highlight: true,
      },
      {
        id: "m1-nocar",
        label: {
          en: "Households with No Vehicle",
          es: "Hogares sin Vehículo",
          vi: "Hộ gia đình Không có Ô tô",
        },
        value: "31.6%",
        countyComparison: {
          en: "nearly 1 in 3 households (3,251 tract pop.)",
          es: "casi 1 de cada 3 hogares (3,251 hab.)",
          vi: "gần 1/3 số hộ gia đình (3.251 dân)",
        },
        scale: "census_tract",
        method: "measured",
        source: "CDC SVI / ACS Survey Estimate (Tract 13121010125)",
        agent: "Access Scout",
        highlight: true,
      },
      {
        id: "m1-unins",
        label: {
          en: "Uninsured Adults (Ages 18–64)",
          es: "Adultos sin Seguro Médico (18–64)",
          vi: "Người lớn Không Bảo hiểm Y tế (18–64)",
        },
        value: "12.9%",
        countyComparison: {
          en: "PLACES ACCESS2 (with 95% CI in places_ci)",
          es: "PLACES ACCESS2 (con IC 95% en places_ci)",
          vi: "PLACES ACCESS2 (kèm khoảng tin cậy 95%)",
        },
        scale: "census_tract",
        method: "modeled",
        source: "CDC PLACES 2023 BRFSS Small-Area Model",
        agent: "Burden Scout",
      },
      {
        id: "m1-checkup",
        label: {
          en: "Routine Annual Checkup Rate",
          es: "Tasa de Chequeo Médico Anual",
          vi: "Tỷ lệ Khám Sức khỏe Định kỳ Hàng năm",
        },
        value: "73.7%",
        countyComparison: {
          en: "Reversed in need score (lower checkup = higher need)",
          es: "Invertido en puntaje (menor chequeo = mayor necesidad)",
          vi: "Đảo ngược trong điểm nhu cầu (ít khám = nhu cầu cao)",
        },
        scale: "census_tract",
        method: "modeled",
        source: "CDC PLACES CHECKUP Model",
        agent: "Burden Scout",
      },
      {
        id: "m1-pm25",
        label: {
          en: "Ambient PM2.5 Air Quality (Not Used to Rank)",
          es: "Calidad del Aire PM2.5 (No Usado para Clasificar)",
          vi: "Chất lượng Không khí PM2.5 (Không dùng xếp hạng)",
        },
        value: "8.98–9.81 µg/m³",
        countyComparison: {
          en: "1.05× spread across Fulton · 12 km grid only",
          es: "Variación 1.05× en Fulton · cuadrícula de 12 km",
          vi: "Chênh lệch 1.05× toàn quận · lưới 12 km",
        },
        scale: "grid_12km",
        method: "modeled",
        source: "CDC Daily Tract-Level PM2.5 (12 km Grid)",
        agent: "Context Scout",
      },
      {
        id: "m1-covid",
        label: {
          en: "Regional COVID ED Visits (Week Ending Aug 1, 2026)",
          es: "Visitas Regionales a Urgencias por COVID (1 Ago 2026)",
          vi: "Ca Cấp cứu COVID Vùng 4 Quận (Tuần kết thúc 01/08/2026)",
        },
        value: "0.07% → 0.28%",
        countyComparison: {
          en: "Clayton, DeKalb, Fulton, Gwinnett HSA context",
          es: "Contexto regional de 4 condados (HSA)",
          vi: "Bối cảnh vùng 4 quận (Clayton, DeKalb, Fulton, Gwinnett)",
        },
        scale: "multi_county_4",
        method: "measured",
        source: "CDC NSSP Emergency Department Trends (disease_weekly)",
        agent: "Context Scout",
      },
    ],
    advisories: [
      {
        id: "adv-1a",
        category: "co_location",
        severity: "opportunity",
        title: {
          en: "South Fulton Saturday Mobile Pantry & Produce Market",
          es: "Mercado y Despensa Móvil Sabatina del Sur de Fulton",
          vi: "Chợ Nông sản & Điểm Phát Thực phẩm Thứ Bảy Nam Fulton",
        },
        timeWindow: {
          en: "Sat Nov 7 · 8:30 AM – 12:00 PM (Adjacent Lot)",
          es: "Sáb 7 Nov · 8:30 AM – 12:00 PM (Lote Adyacente)",
          vi: "Thứ Bảy 07/11 · 8:30 AM – 12:00 PM (Bãi kế bên)",
        },
        impact: {
          en: "Because Tract 10125 is 20.1 km from adult safety-net care and 31.6% of households have no vehicle, pairing with Saturday food distribution maximizes walk-up reach.",
          es: "Dado que el Tramo 10125 está a 20.1 km de clínicas de adultos y 31.6% no tiene auto, co-ubicar con la despensa maximiza el acceso peatonal.",
          vi: "Do Tract 10125 cách phòng khám người lớn tới 20.1 km và 31.6% hộ không có xe, việc phối hợp cùng điểm phát thực phẩm giúp tối đa hóa lượng người đi bộ đến khám.",
        },
        actionRequired: {
          en: "Stage van by 8:15 AM and coordinate courtesy church shuttle loop for carless households.",
          es: "Estacionar la unidad a las 8:15 AM y coordinar transporte comunitario para hogares sin auto.",
          vi: "Đưa xe vào vị trí trước 8:15 AM và phối hợp xe đưa đón miễn phí cho các hộ không có ô tô.",
        },
        defaultChecked: true,
      },
      {
        id: "adv-1b",
        category: "transit",
        severity: "caution",
        title: {
          en: "MARTA Weekend Bus Headway Reduction (40-Min Intervals)",
          es: "Reducción de Frecuencia Sabatina de Autobuses MARTA (40 min)",
          vi: "Giảm Tần suất Xe buýt MARTA Ngày Thứ Bảy (40 phút/chuyến)",
        },
        timeWindow: {
          en: "All Day Saturday · South Fulton Feeder Routes",
          es: "Todo el sábado · Rutas Alimentadoras del Sur de Fulton",
          vi: "Cả ngày Thứ Bảy · Các tuyến buýt nhánh Nam Fulton",
        },
        impact: {
          en: "Longer Saturday bus waits compound the 31.6% no-vehicle barrier for elderly residents.",
          es: "Las esperas más largas de autobús los sábados agravan la falta de vehículo (31.6%).",
          vi: "Thời gian chờ xe buýt lâu hơn vào Thứ Bảy làm tăng rào cản đi lại cho 31.6% hộ không có xe.",
        },
        actionRequired: {
          en: "Send SMS arrival times aligned with the :15 and :55 bus drop-offs.",
          es: "Alinear los turnos de recepción con las llegadas del autobús de las :15 y :55.",
          vi: "Sắp xếp khung giờ đón bệnh nhân khớp với chuyến xe buýt lúc :15 và :55.",
        },
      },
    ],
    servicesFocus: [
      {
        en: "Primary Preventive Checkups & Blood Pressure Screening",
        es: "Chequeos Preventivos Primarios y Presión Arterial",
        vi: "Khám Dự phòng Tổng quát & Đo Huyết áp",
      },
      {
        en: "Blood Glucose (A1C) & 30-Day Prescription Bridge",
        es: "Glucosa A1C y Recetas Puente de 30 Días",
        vi: "Đo Đường huyết A1C & Cấp Thuốc Ngắn hạn 30 Ngày",
      },
    ],
  },
  {
    rank: 2,
    saturdayDate: "2026-11-14",
    saturdayLabel: {
      en: "Saturday #2 · Nov 14, 2026 (9:00 AM – 2:00 PM)",
      es: "Sábado #2 · 14 de Nov, 2026 (9:00 AM – 2:00 PM)",
      vi: "Thứ Bảy #2 · 14/11/2026 (9:00 AM – 2:00 PM)",
    },
    tractFips: "13121006900",
    neighborhood: {
      en: "South Atlanta High-Need Corridor (Tract 06900)",
      es: "Corredor de Alta Necesidad del Sur de Atlanta (Tramo 06900)",
      vi: "Hành lang Nhu cầu Cao Nam Atlanta (Phân khu 06900)",
    },
    corridor: {
      en: "South Atlanta · 3,733 Residents · 5.3% Limited English",
      es: "Sur de Atlanta · 3,733 Habitantes · 5.3% Inglés Limitado",
      vi: "Nam Atlanta · 3.733 Cư dân · 5.3% Hạn chế Tiếng Anh",
    },
    siteName: {
      en: "South Atlanta Neighborhood Recreation & Civic Lot",
      es: "Explanada Recreativa y Cívica del Sur de Atlanta",
      vi: "Bãi đỗ Trung tâm Sinh hoạt Cộng đồng Nam Atlanta",
    },
    siteAddress: "Tract 13121006900 · South Atlanta, GA",
    coordinates: { x: 58, y: 56, lat: "33.7180° N", lng: "84.3740° W" },
    needScore: 9.21,
    scoreCi: "Plan C #2",
    status: "approved_round_1",
    headlineReason: {
      en: "High combined need in South Atlanta (14.8% uninsured, 20.5% no car, 3.2 km to adult safety-net clinic) and 5.3% limited-English households—justifying bilingual English + Spanish flyer deployment.",
      es: "Alta necesidad combinada en el sur de Atlanta (14.8% sin seguro, 20.5% sin auto, a 3.2 km de clínica de adultos) y 5.3% de hogares con inglés limitado (justifica folleto bilingüe Español/Inglés).",
      vi: "Nhu cầu kết hợp cao tại Nam Atlanta (14.8% không bảo hiểm, 20.5% không có xe, cách phòng khám người lớn 3.2 km) và 5.3% hộ hạn chế tiếng Anh (cần phát tờ rơi song ngữ Anh/Tây Ban Nha).",
    },
    agentConsensus: {
      planner: {
        en: "Selected as Saturday #2 stop (>=5 km from all other stops). Balances South Atlanta chronic care demand with >3.2 km separation from adult-accessible safety-net clinics.",
        es: "Seleccionado como Sábado #2 (>=5 km de otras paradas). Equilibra la demanda en el sur de Atlanta con 3.2 km de distancia a clínicas de adultos.",
        vi: "Được chọn cho Thứ Bảy #2 (cách các điểm khác >=5 km). Cân bằng nhu cầu tại Nam Atlanta với khoảng cách 3.2 km tới phòng khám người lớn.",
      },
      auditor: {
        en: "PASSED Set-Level Audit: Verified 3.2 km from nearest non-school safety-net clinic. Highest limited-English share among the 4 stops (5.3%), triggering Spanish Explainer output.",
        es: "APROBADO en Auditoría: Verificado a 3.2 km de la clínica no escolar más cercana. Mayor proporción de inglés limitado (5.3%), activando el folleto en español.",
        vi: "ĐẠT Kiểm toán: Xác minh cách 3.2 km từ phòng khám người lớn gần nhất. Có tỷ lệ hạn chế tiếng Anh cao nhất trong 4 điểm (5.3%), kích hoạt tờ rơi tiếng Tây Ban Nha.",
      },
      scouts: {
        en: "Burden Scout reported 14.8% uninsured and 74.5% checkup rate; Access Scout measured 20.5% no-vehicle households and 3.2 km adult safety-net distance.",
        es: "Burden Scout reportó 14.8% sin seguro y 74.5% de chequeos; Access Scout midió 20.5% de hogares sin auto y 3.2 km de distancia.",
        vi: "Burden Scout ghi nhận 14.8% không bảo hiểm và 74.5% khám định kỳ; Access Scout đo được 20.5% hộ không có xe và khoảng cách 3.2 km.",
      },
    },
    metrics: [
      {
        id: "m2-unins",
        label: {
          en: "Uninsured Adults (Ages 18–64)",
          es: "Adultos sin Seguro Médico (18–64)",
          vi: "Người lớn Không Bảo hiểm Y tế (18–64)",
        },
        value: "14.8%",
        countyComparison: {
          en: "3,733 residents in Tract 13121006900",
          es: "3,733 habitantes en el Tramo 13121006900",
          vi: "3.733 cư dân tại Tract 13121006900",
        },
        scale: "census_tract",
        method: "modeled",
        source: "CDC PLACES ACCESS2 (Tract 13121006900)",
        agent: "Burden Scout",
        highlight: true,
      },
      {
        id: "m2-nocar",
        label: {
          en: "Households with No Vehicle",
          es: "Hogares sin Vehículo",
          vi: "Hộ gia đình Không có Ô tô",
        },
        value: "20.5%",
        countyComparison: {
          en: "1 in 5 households without a car",
          es: "1 de cada 5 hogares sin vehículo",
          vi: "1/5 số hộ gia đình không có ô tô",
        },
        scale: "census_tract",
        method: "measured",
        source: "CDC SVI / ACS Survey (Tract 13121006900)",
        agent: "Access Scout",
        highlight: true,
      },
      {
        id: "m2-dist",
        label: {
          en: "Distance to Adult Safety-Net Clinic",
          es: "Distancia a Clínica de Adultos",
          vi: "Khoảng cách tới Phòng khám Người lớn",
        },
        value: "3.2 km",
        countyComparison: {
          en: "Exceeds >2 km Plan C adult-access threshold",
          es: "Supera el umbral >2 km del Plan C",
          vi: "Vượt ngưỡng >2 km của Plan C",
        },
        scale: "census_tract",
        method: "measured",
        source: "a4i_health.tract_access_adult (school sites excluded)",
        agent: "Access Scout",
      },
      {
        id: "m2-checkup",
        label: {
          en: "Routine Annual Checkup Rate",
          es: "Tasa de Chequeo Médico Anual",
          vi: "Tỷ lệ Khám Sức khỏe Định kỳ",
        },
        value: "74.5%",
        countyComparison: {
          en: "5.3% limited-English households (Spanish flyer)",
          es: "5.3% hogares con inglés limitado (folleto ES)",
          vi: "5.3% hộ hạn chế tiếng Anh (tờ rơi song ngữ)",
        },
        scale: "census_tract",
        method: "modeled",
        source: "CDC PLACES CHECKUP + SVI Limited English",
        agent: "Burden Scout",
      },
    ],
    advisories: [
      {
        id: "adv-2a",
        category: "co_location",
        severity: "opportunity",
        title: {
          en: "Bilingual Spanish/English Community Church Outreach & Coat Drive",
          es: "Jornada Bilingüe de Salud y Abrigos de Invierno en Iglesia Local",
          vi: "Ngày hội Chăm sóc Sức khỏe Song ngữ & Tặng Áo ấm Mùa đông",
        },
        timeWindow: {
          en: "Sat Nov 14 · 9:30 AM – 1:30 PM (Tract 06900 Community Center)",
          es: "Sáb 14 Nov · 9:30 AM – 1:30 PM (Centro Comunitario 06900)",
          vi: "Thứ Bảy 14/11 · 9:30 AM – 1:30 PM (Trung tâm Cộng đồng 06900)",
        },
        impact: {
          en: "Stop #2 has the highest limited-English rate of the 4 stops (5.3%); co-locating with bilingual parish volunteers increases Hispanic family turnout.",
          es: "La Parada #2 tiene la mayor tasa de inglés limitado (5.3%); coordinar con voluntarios bilingües impulsa la asistencia de familias hispanas.",
          vi: "Điểm #2 có tỷ lệ hạn chế tiếng Anh cao nhất trong 4 điểm (5.3%); phối hợp cùng tình nguyện viên song ngữ giúp tăng lượng gia đình gốc Tây Ban Nha đến khám.",
        },
        actionRequired: {
          en: "Staff 1 bilingual Spanish medical interpreter onboard and distribute the Explainer's Spanish flyer 72 hours prior.",
          es: "Asignar 1 intérprete médico en español a bordo y distribuir el folleto en español 72 horas antes.",
          vi: "Bố trí 1 thông dịch viên y tế tiếng Tây Ban Nha trên xe và phát tờ rơi song ngữ trước 72 giờ.",
        },
        defaultChecked: true,
      },
      {
        id: "adv-2b",
        category: "road_work",
        severity: "caution",
        title: {
          en: "South Atlanta Arterial Utility Work & Curb Parking Restriction",
          es: "Obras de Servicios Públicos y Restricción de Estacionamiento",
          vi: "Thi công Hạ tầng & Hạn chế Đỗ xe Dọc Trục Đường Chính",
        },
        timeWindow: {
          en: "Sat Nov 14 · 7:00 AM – 4:00 PM",
          es: "Sáb 14 Nov · 7:00 AM – 4:00 PM",
          vi: "Thứ Bảy 14/11 · 7:00 AM – 4:00 PM",
        },
        impact: {
          en: "Street-curb parking is narrowed for weekend utility maintenance; 34-ft van requires off-street pad.",
          es: "El estacionamiento en acera está reducido por obras; la unidad de 34 pies requiere explanada interna.",
          vi: "Lòng đường bị thu hẹp để bảo trì hạ tầng cuối tuần; xe phòng khám cần đỗ trong sân trung tâm.",
        },
        actionRequired: {
          en: "Stage van inside the off-street recreation center lot and place directional A-frame signs at the main intersection.",
          es: "Estacionar dentro del lote del centro recreativo y colocar letreros direccionales en la avenida principal.",
          vi: "Đưa xe vào bãi đỗ nội bộ của trung tâm sinh hoạt và đặt biển chỉ dẫn tại ngã tư chính.",
        },
      },
    ],
    servicesFocus: [
      {
        en: "Bilingual English/Spanish Preventive Screenings",
        es: "Chequeos Preventivos Bilingües (Español / Inglés)",
        vi: "Khám Sàng lọc Dự phòng Song ngữ (Anh / Tây Ban Nha)",
      },
      {
        en: "Blood Pressure, Glucose & Flu Vaccinations",
        es: "Presión Arterial, Glucosa y Vacunas contra la Gripe",
        vi: "Đo Huyết áp, Đường huyết & Tiêm Phòng Cúm",
      },
    ],
  },
  {
    rank: 3,
    saturdayDate: "2026-11-21",
    saturdayLabel: {
      en: "Saturday #3 · Nov 21, 2026 (9:00 AM – 2:00 PM)",
      es: "Sábado #3 · 21 de Nov, 2026 (9:00 AM – 2:00 PM)",
      vi: "Thứ Bảy #3 · 21/11/2026 (9:00 AM – 2:00 PM)",
    },
    tractFips: "13121011307",
    neighborhood: {
      en: "South Fulton / Old National–Flat Shoals Corridor (Tract 11307)",
      es: "Corredor Sur de Fulton / Old National–Flat Shoals (Tramo 11307)",
      vi: "Nam Fulton / Hành lang Old National–Flat Shoals (Phân khu 11307)",
    },
    corridor: {
      en: "Most Uninsured of the Four · 4,631 Residents",
      es: "Mayor Tasa Sin Seguro de los Cuatro · 4,631 Habitantes",
      vi: "Tỷ lệ Không Bảo hiểm Cao nhất Trong 4 Điểm · 4.631 Dân",
    },
    siteName: {
      en: "South Fulton Regional Library & Community Plaza",
      es: "Plaza Comunitaria y Biblioteca Regional del Sur de Fulton",
      vi: "Quảng trường Cộng đồng & Thư viện Khu vực Nam Fulton",
    },
    siteAddress: "Tract 13121011307 · South Fulton, GA",
    coordinates: { x: 44, y: 76, lat: "33.6045° N", lng: "84.4680° W" },
    needScore: 9.16,
    scoreCi: "Set Audit Pass",
    status: "promoted_round_2",
    headlineReason: {
      en: "Most uninsured of the four selected stops (18.0% uninsured across 4,631 residents, 22.9% no vehicle, 4.8 km to adult safety-net clinic). Promoted during exhaustive 623-set search so the final 4-stop plan passes the Four-Fifths Equity Audit (Black 1.02).",
      es: "El tramo con más adultos sin seguro de los cuatro (18.0% sin seguro entre 4,631 habitantes, 22.9% sin auto, a 4.8 km de clínica de adultos). Promovido tras evaluar 623 combinaciones para aprobar la auditoría de equidad (1.02).",
      vi: "Phân khu có tỷ lệ không bảo hiểm cao nhất trong 4 điểm (18.0% không bảo hiểm trên 4.631 dân, 22.9% không có xe, cách phòng khám người lớn 4.8 km). Được chọn qua duyệt vét cạn 623 tổ hợp để đạt chuẩn công bằng (1.02).",
    },
    agentConsensus: {
      planner: {
        en: "Selected via `scripts/pick4.py` exhaustive search of 623 spaced 4-stop combinations after greedy spacing failed the set-level audit.",
        es: "Seleccionado mediante búsqueda exhaustiva (`scripts/pick4.py`, 623 combinaciones) luego de que el algoritmo voraz fallara la auditoría.",
        vi: "Được chọn thông qua thuật toán duyệt vét cạn 623 tổ hợp (`scripts/pick4.py`) sau khi cách chọn tham lam trượt kiểm toán.",
      },
      auditor: {
        en: "REPLACED greedy North Fulton picks that caused Black ratio to drop to 0.45 FLAG. With Tract 13121011307, the final 4-stop set achieves Black 1.02, Hispanic 0.81, White 0.88, Asian 1.04 (0 flags).",
        es: "REEMPLAZÓ las selecciones del norte de Fulton que bajaban la paridad afroamericana a 0.45 FLAG. Con el Tramo 11307, el plan logra 1.02 / 0.81 / 0.88 / 1.04 (0 alertas).",
        vi: "THAY THẾ các điểm Bắc Fulton làm tỷ lệ cư dân Da đen tụt xuống 0.45 FLAG. Với Tract 11307, bộ 4 điểm đạt 1.02 / 0.81 / 0.88 / 1.04 (0 cảnh báo).",
      },
      scouts: {
        en: "Burden Scout confirmed 18.0% uninsured (highest of the 4 stops) among 4,631 residents; Access Scout verified 4.8 km to nearest adult safety-net site and 22.9% no car.",
        es: "Burden Scout confirmó 18.0% sin seguro (el más alto de los 4) entre 4,631 habitantes; Access Scout midió 4.8 km a clínica y 22.9% sin auto.",
        vi: "Burden Scout xác nhận 18.0% không bảo hiểm (cao nhất trong 4 điểm) trên 4.631 dân; Access Scout đo được 4.8 km tới phòng khám và 22.9% không xe.",
      },
    },
    metrics: [
      {
        id: "m3-unins",
        label: {
          en: "Uninsured Adults (Ages 18–64) — Highest of the 4 Stops",
          es: "Adultos sin Seguro (18–64) — El Más Alto de las 4 Paradas",
          vi: "Người lớn Không Bảo hiểm (18–64) — Cao nhất Trong 4 Điểm",
        },
        value: "18.0%",
        countyComparison: {
          en: "4,631 residents in Tract 13121011307",
          es: "4,631 habitantes en el Tramo 13121011307",
          vi: "4.631 cư dân tại Tract 13121011307",
        },
        scale: "census_tract",
        method: "modeled",
        source: "CDC PLACES ACCESS2 (Tract 13121011307)",
        agent: "Burden Scout",
        highlight: true,
      },
      {
        id: "m3-dist",
        label: {
          en: "Distance to Adult Safety-Net Clinic (School Sites Excluded)",
          es: "Distancia a Clínica de Adultos (Sin Clínicas Escolares)",
          vi: "Khoảng cách tới Phòng khám Người lớn (Trừ Trạm Trường học)",
        },
        value: "4.8 km",
        countyComparison: {
          en: ">=5 km apart from all other Saturday stops",
          es: ">=5 km de separación de las demás paradas",
          vi: "Cách >=5 km so với các điểm Thứ Bảy khác",
        },
        scale: "census_tract",
        method: "measured",
        source: "a4i_health.tract_access_adult (sql/tract_access_adult.sql)",
        agent: "Access Scout",
        highlight: true,
      },
      {
        id: "m3-nocar",
        label: {
          en: "Households with No Vehicle",
          es: "Hogares sin Vehículo",
          vi: "Hộ gia đình Không có Ô tô",
        },
        value: "22.9%",
        countyComparison: {
          en: "nearly 1 in 4 households without a car",
          es: "casi 1 de cada 4 hogares sin vehículo",
          vi: "gần 1/4 số hộ không có ô tô",
        },
        scale: "census_tract",
        method: "measured",
        source: "CDC SVI / ACS Survey (Tract 13121011307)",
        agent: "Access Scout",
      },
      {
        id: "m3-checkup",
        label: {
          en: "Routine Annual Checkup Rate",
          es: "Tasa de Chequeo Médico Anual",
          vi: "Tỷ lệ Khám Sức khỏe Định kỳ",
        },
        value: "77.8%",
        countyComparison: {
          en: "Tract-level modeled preventive care rate",
          es: "Tasa preventiva modelada a nivel de tramo",
          vi: "Tỷ lệ khám dự phòng mô hình cấp phân khu",
        },
        scale: "census_tract",
        method: "modeled",
        source: "CDC PLACES CHECKUP Model",
        agent: "Burden Scout",
      },
    ],
    advisories: [
      {
        id: "adv-3a",
        category: "public_event",
        severity: "caution",
        title: {
          en: "Pre-Thanksgiving I-85 South & Old National Hwy Corridor Traffic",
          es: "Tráfico Pre-Acción de Gracias en I-85 Sur y Old National Hwy",
          vi: "Ùn tắc Trước Lễ Tạ ơn trên Cao tốc I-85 Nam & Old National Hwy",
        },
        timeWindow: {
          en: "Sat Nov 21 · 7:30 AM – 11:30 AM",
          es: "Sáb 21 Nov · 7:30 AM – 11:30 AM",
          vi: "Thứ Bảy 21/11 · 7:30 AM – 11:30 AM",
        },
        impact: {
          en: "Holiday shopping & pre-Thanksgiving turkey giveaway events along Old National Hwy add 25 mins to morning van transit.",
          es: "Eventos de entrega de pavos de Acción de Gracias en Old National Hwy agregan 25 min al traslado matutino.",
          vi: "Sự kiện phát thực phẩm Lễ Tạ ơn dọc đường Old National Hwy làm tăng thêm 25 phút di chuyển buổi sáng.",
        },
        actionRequired: {
          en: "Dispatch van at 7:45 AM and partner with the Thanksgiving food giveaway organizers to cross-refer uninsured families.",
          es: "Despachar la unidad a las 7:45 AM y coordinar con los organizadores de entrega de alimentos para referir familias sin seguro.",
          vi: "Xuất phát lúc 7:45 AM và phối hợp với ban tổ chức phát quà Lễ Tạ ơn để giới thiệu các hộ chưa có bảo hiểm sang khám.",
        },
        defaultChecked: true,
      },
      {
        id: "adv-3b",
        category: "weather_holiday",
        severity: "caution",
        title: {
          en: "Late-November Morning Cold Weather Intake Protocol",
          es: "Protocolo de Recepción bajo Clima Frío Matutino",
          vi: "Phương án Đón tiếp Buổi sáng Thời tiết Lạnh Cuối Tháng 11",
        },
        timeWindow: {
          en: "Sat Nov 21 · 8:30 AM – 10:30 AM",
          es: "Sáb 21 Nov · 8:30 AM – 10:30 AM",
          vi: "Thứ Bảy 21/11 · 8:30 AM – 10:30 AM",
        },
        impact: {
          en: "4,631 tract population with 18.0% uninsured means high walk-up queue volume during cold morning hours.",
          es: "Alta fila esperada durante las primeras horas frías de la mañana.",
          vi: "Lưu lượng người xếp hàng buổi sáng cao trong thời tiết lạnh.",
        },
        actionRequired: {
          en: "Use indoor library community room for intake registration and SMS pager queue.",
          es: "Usar el salón interior de la biblioteca para registro y fila por SMS.",
          vi: "Sử dụng phòng sinh hoạt trong thư viện để đăng ký và gọi số qua SMS.",
        },
      },
    ],
    servicesFocus: [
      {
        en: "Uninsured Adult Primary Care & Chronic Lab Panel",
        es: "Atención Primaria para Adultos Sin Seguro y Laboratorio",
        vi: "Khám Đa khoa Người lớn Không Bảo hiểm & Xét nghiệm",
      },
      {
        en: "Sliding-Scale FQHC Follow-Up Referral Navigation",
        es: "Navegación y Referencia a Clínicas FQHC",
        vi: "Hướng dẫn Chuyển tuyến Phòng khám An sinh FQHC",
      },
    ],
  },
  {
    rank: 4,
    saturdayDate: "2026-11-28",
    saturdayLabel: {
      en: "Saturday #4 · Nov 28, 2026 (9:00 AM – 2:00 PM)",
      es: "Sábado #4 · 28 de Nov, 2026 (9:00 AM – 2:00 PM)",
      vi: "Thứ Bảy #4 · 28/11/2026 (9:00 AM – 2:00 PM)",
    },
    tractFips: "13121009405",
    neighborhood: {
      en: "West / Central Fulton Preventive Gap Corridor (Tract 09405)",
      es: "Corredor de Brecha Preventiva de Fulton (Tramo 09405)",
      vi: "Hành lang Khoảng trống Khám Dự phòng Fulton (Phân khu 09405)",
    },
    corridor: {
      en: "Lowest Checkup Rate of the Four · 4,332 Residents",
      es: "Menor Tasa de Chequeo de los Cuatro · 4,332 Habitantes",
      vi: "Tỷ lệ Khám Định kỳ Thấp nhất Trong 4 Điểm · 4.332 Dân",
    },
    siteName: {
      en: "Neighborhood Multipurpose & Transit Access Lot (Tract 09405)",
      es: "Estacionamiento Comunitario y Acceso de Tránsito (Tramo 09405)",
      vi: "Bãi đỗ Khu Đa năng & Tiếp cận Giao thông (Phân khu 09405)",
    },
    siteAddress: "Tract 13121009405 · Fulton County, GA",
    coordinates: { x: 46, y: 38, lat: "33.7920° N", lng: "84.4210° W" },
    needScore: 9.01,
    scoreCi: "Plan C #4",
    status: "approved_round_1",
    headlineReason: {
      en: "Lowest routine checkup rate of the four selected stops (70.3% checkup rate, 20.9% no car, 2.4 km to adult safety-net clinic). Note: Weakest on uninsured (7.9%), selected specifically to close the preventive checkup + carless access gap while maintaining set-level equity.",
      es: "La tasa más baja de chequeos médicos anuales de las cuatro paradas (70.3% de chequeos, 20.9% sin auto, a 2.4 km de clínica de adultos). Seleccionado por su brecha de chequeos preventivos y falta de vehículo.",
      vi: "Tỷ lệ khám sức khỏe định kỳ thấp nhất trong 4 điểm (70.3% khám định kỳ, 20.9% không có xe, cách phòng khám người lớn 2.4 km). Được chọn để lấp khoảng trống khám dự phòng và thiếu phương tiện đi lại.",
    },
    agentConsensus: {
      planner: {
        en: "Selected as Saturday #4 to target the lowest preventive checkup rate (70.3%) combined with 20.9% carless households, spaced >=5 km from Stops #1–#3.",
        es: "Seleccionado como Sábado #4 para atender la tasa más baja de chequeos preventivos (70.3%) con 20.9% de hogares sin auto.",
        vi: "Được chọn cho Thứ Bảy #4 nhằm giải quyết tỷ lệ khám định kỳ thấp nhất (70.3%) kết hợp với 20.9% hộ không có xe.",
      },
      auditor: {
        en: "PASSED Set-Level Audit + Honest Caveat Surfaced: Composer notes that Stop #4 has the lowest uninsured rate (7.9%) of the four; alternative set 06900/11421/11307/09405 reaches ~22% more uninsured with no flags.",
        es: "APROBADO en Auditoría + Nota Transparente: El Compositor señala que la Parada #4 tiene la menor tasa sin seguro (7.9%); el conjunto alternativo alcanza ~22% más personas sin seguro.",
        vi: "ĐẠT Kiểm toán + Ghi chú Minh bạch: Composer lưu ý Điểm #4 có tỷ lệ không bảo hiểm thấp nhất (7.9%); phương án thay thế với 11421 tiếp cận nhiều hơn ~22% người không bảo hiểm.",
      },
      scouts: {
        en: "Burden Scout flagged 70.3% annual checkup rate (lowest of the 4 stops); Access Scout measured 20.9% no-vehicle households and 2.4 km to adult safety-net care.",
        es: "Burden Scout reportó 70.3% de chequeo anual (el menor de los 4); Access Scout midió 20.9% sin vehículo y 2.4 km a clínica.",
        vi: "Burden Scout ghi nhận tỷ lệ khám định kỳ 70.3% (thấp nhất trong 4 điểm); Access Scout đo được 20.9% hộ không có xe và cách phòng khám 2.4 km.",
      },
    },
    metrics: [
      {
        id: "m4-checkup",
        label: {
          en: "Routine Annual Checkup Rate (Lowest of the 4 Stops)",
          es: "Tasa de Chequeo Anual (La Más Baja de las 4 Paradas)",
          vi: "Tỷ lệ Khám Định kỳ Hàng năm (Thấp nhất Trong 4 Điểm)",
        },
        value: "70.3%",
        countyComparison: {
          en: "Primary driver for Stop #4 selection",
          es: "Factor principal para la selección #4",
          vi: "Yếu tố chính để chọn Điểm dừng #4",
        },
        scale: "census_tract",
        method: "modeled",
        source: "CDC PLACES CHECKUP (Tract 13121009405)",
        agent: "Burden Scout",
        highlight: true,
      },
      {
        id: "m4-nocar",
        label: {
          en: "Households with No Vehicle",
          es: "Hogares sin Vehículo",
          vi: "Hộ gia đình Không có Ô tô",
        },
        value: "20.9%",
        countyComparison: {
          en: "1 in 5 households without a vehicle (4,332 pop.)",
          es: "1 de cada 5 hogares sin vehículo (4,332 hab.)",
          vi: "1/5 số hộ không có xe (4.332 dân)",
        },
        scale: "census_tract",
        method: "measured",
        source: "CDC SVI / ACS Survey (Tract 13121009405)",
        agent: "Access Scout",
        highlight: true,
      },
      {
        id: "m4-dist",
        label: {
          en: "Distance to Adult Safety-Net Clinic",
          es: "Distancia a Clínica de Adultos",
          vi: "Khoảng cách tới Phòng khám Người lớn",
        },
        value: "2.4 km",
        countyComparison: {
          en: "Straight-line distance (school sites excluded)",
          es: "Distancia en línea recta (sin clínicas escolares)",
          vi: "Khoảng cách đường thẳng (trừ trạm trường học)",
        },
        scale: "census_tract",
        method: "measured",
        source: "a4i_health.tract_access_adult",
        agent: "Access Scout",
      },
      {
        id: "m4-unins",
        label: {
          en: "Uninsured Adults (Ages 18–64) — Honest Boundary Caveat",
          es: "Adultos sin Seguro (18–64) — Nota de Transparencia",
          vi: "Người lớn Không Bảo hiểm (18–64) — Lưu ý Minh bạch",
        },
        value: "7.9%",
        countyComparison: {
          en: "Weakest on uninsured; selected for low checkup + no car",
          es: "Más bajo en sin seguro; elegido por bajo chequeo y sin auto",
          vi: "Thấp về không bảo hiểm; được chọn do ít khám định kỳ + không xe",
        },
        scale: "census_tract",
        method: "modeled",
        source: "CDC PLACES ACCESS2 Model",
        agent: "Burden Scout",
      },
    ],
    advisories: [
      {
        id: "adv-4a",
        category: "weather_holiday",
        severity: "critical",
        title: {
          en: "Thanksgiving Holiday Weekend Clinic & Pharmacy Closures",
          es: "Cierre de Clínicas y Farmacias por Fin de Semana de Acción de Gracias",
          vi: "Đóng cửa Phòng khám & Hiệu thuốc Dịp Cuối tuần Lễ Tạ ơn",
        },
        timeWindow: {
          en: "Sat Nov 28 · Post-Thanksgiving Holiday Weekend",
          es: "Sáb 28 Nov · Fin de Semana Posterior a Acción de Gracias",
          vi: "Thứ Bảy 28/11 · Cuối tuần Sau Lễ Tạ ơn",
        },
        impact: {
          en: "Fixed neighborhood clinics and partner pharmacies are closed Nov 26–29 for Thanksgiving break; mobile van serves as walk-in preventive checkup hub.",
          es: "Las clínicas fijas y farmacias asociadas cierran del 26 al 29 de nov por Acción de Gracias; la unidad móvil cubre chequeos preventivos sin cita.",
          vi: "Các phòng khám cố định đóng cửa từ 26–29/11 nghỉ Lễ Tạ ơn; xe lưu động đóng vai trò điểm khám dự phòng không cần hẹn trước.",
        },
        actionRequired: {
          en: "Double preventive screening kits (blood pressure, lipid panels, A1C, flu shots) for residents overdue for annual checkups.",
          es: "Duplicar kits de chequeo preventivo (presión, colesterol, A1C y vacunas) para residentes sin chequeo anual.",
          vi: "Tăng gấp đôi bộ xét nghiệm khám dự phòng (huyết áp, mỡ máu, A1C, vắc-xin cúm) cho người dân lâu chưa khám định kỳ.",
        },
        defaultChecked: true,
      },
    ],
    servicesFocus: [
      {
        en: "Comprehensive Annual Wellness Checkups (70.3% Baseline Gap)",
        es: "Chequeo Anual Preventivo Completo (Brecha del 70.3%)",
        vi: "Khám Sức khỏe Định kỳ Toàn diện (Lấp khoảng trống 70.3%)",
      },
      {
        en: "Post-Holiday Blood Pressure & Preventive Screenings",
        es: "Chequeo de Presión y Prevención Post-Feriado",
        vi: "Đo Huyết áp & Tầm soát Dự phòng Sau Kỳ nghỉ Lễ",
      },
    ],
  },
];

export const REJECTED_DRAFT_STOP = {
  draftRank: 1,
  tractFips: "13121011431",
  neighborhood: {
    en: "Tract 13121011431 (34.6% Uninsured — Not Chosen, Escalated to Human)",
    es: "Tramo 13121011431 (34.6% Sin Seguro — Escalado al Coordinador Humano)",
    vi: "Phân khu 13121011431 (34.6% Không Bảo hiểm — Chuyển Con người Quyết định)",
  },
  coordinates: { x: 64, y: 24, lat: "33.8810° N", lng: "84.3120° W" },
  initialNeedScore: 9.85,
  tiedWithScore: 9.16,
  plannerDraftReason: {
    en: "Attempt 1 (Plan A: need + distance) reached Black uninsured residents at only 0.53 FLAG of their county share because distance-weighting pulled vans to low-need North Fulton. Attempt 2 (Plan B: need only) passed audit (0.99), but top picks sat 0.45–0.83 km from existing clinics where a van adds no access.",
    es: "Intento 1 (Plan A: necesidad + distancia) alcanzó a residentes afroamericanos sin seguro en solo 0.53 FLAG. Intento 2 (Plan B: solo necesidad) aprobó la auditoría (0.99), pero sus sitios estaban a 0.45–0.83 km de clínicas existentes.",
    vi: "Lần 1 (Plan A: nhu cầu + khoảng cách) chỉ đạt tỷ lệ 0.53 FLAG cho cư dân Da đen không bảo hiểm. Lần 2 (Plan B: chỉ tính nhu cầu) đạt kiểm toán (0.99), nhưng các điểm đầu bảng nằm sát phòng khám hiện hữu (0.45–0.83 km).",
  },
  auditorRejection: {
    en: "Attempt 3 (Plan C Greedy First 4 Picks: 11431 / 10125 / 06900 / 06602): While the top-30 pool passed, greedy >=5 km spacing picked 2 North Fulton tracts—causing the final 4-stop set to fail the Auditor's Four-Fifths Rule for Black uninsured residents (ratio = 0.45 FLAG < 0.80). Lesson: Audit the final 4 stops, not the candidate pool.",
    es: "Intento 3 (Plan C Voraz: 11431 / 10125 / 06900 / 06602): El espaciado voraz eligió 2 tramos del norte de Fulton, haciendo que las 4 paradas finales fallaran la auditoría para residentes afroamericanos (0.45 FLAG < 0.80). Lección: Auditar las 4 paradas finales, no la lista preliminar.",
    vi: "Lần 3 (Plan C Tham lam: 11431 / 10125 / 06900 / 06602): Thuật toán chọn tham lam lấy 2 phân khu Bắc Fulton khiến bộ 4 điểm cuối trượt kiểm toán đối với cư dân Da đen (tỷ lệ 0.45 FLAG < 0.80). Bài học: Phải kiểm toán trên 4 điểm chốt cuối cùng.",
  },
  plannerFix: {
    en: "Final Approved Set (`scripts/pick4.py` tested all 623 spaced 4-stop combinations from top 15): Selected 13121010125, 13121006900, 13121011307, 13121009405 (Need 9.16). Passes BigQuery Equity Audit for ALL groups (Black 1.02 | Hispanic 0.81 | White 0.88 | Asian 1.04). Trade-off surfaced to human: Tract 11431 (34.6% uninsured, ~75% Hispanic) appears in no passing 4-stop set—recommended for next month's 1st Saturday with a Spanish navigator.",
    es: "Conjunto Final Aprobado (`scripts/pick4.py` probó 623 combinaciones): Seleccionó 10125, 06900, 11307 y 09405 (Necesidad 9.16). Aprueba para TODOS los grupos (1.02 / 0.81 / 0.88 / 1.04). Decisión humana: El Tramo 11431 (34.6% sin seguro, ~75% hispano) se recomienda para el primer sábado del próximo mes con navegador en español.",
    vi: "Bộ 4 Điểm Được Duyệt (`scripts/pick4.py` đã thử 623 tổ hợp): Chọn 10125, 06900, 11307, 09405 (Điểm 9.16). Đạt kiểm toán cho MỌI nhóm (1.02 / 0.81 / 0.88 / 1.04). Đánh đổi báo cáo cho con người: Tract 11431 (34.6% không bảo hiểm, ~75% gốc Tây Ban Nha) được đề xuất bố trí vào Thứ Bảy đầu tiên tháng sau.",
  },
};

export const EQUITY_AUDIT_DATA = {
  totalPopulationServed: "15,947 total residents (~2,100 est. uninsured across the final 4 tracts)",
  uninsuredReachedEstimate: "Benchmark: ACS 2020 race × PLACES uninsured (18–64) · Four-Fifths Rule (<0.80 = FLAG)",
  demographics: [
    {
      group: {
        en: "Black / African American Uninsured Parity Ratio (54% of Fulton Uninsured)",
        es: "Razón de Paridad Sin Seguro Afroamericanos (54% de Fulton)",
        vi: "Tỷ lệ Công bằng Cư dân Da đen Không Bảo hiểm (54% toàn Quận)",
      },
      planShare: "1.02 PASS (Final 4)",
      countyUninsuredBenchmark: "Plan A: 0.53 FLAG | Plan C Greedy: 0.45 FLAG",
      status: {
        en: "PASSES Four-Fifths Rule (1.02 ≥ 0.80). Exhaustive 623-combo search fixed the 0.45 greedy-spacing failure without using race as a planning input.",
        es: "APRUEBA Regla de 4/5 (1.02 ≥ 0.80). La búsqueda de 623 combinaciones corrigió el fallo de 0.45 sin usar raza como entrada del planificador.",
        vi: "ĐẠT Quy tắc 4/5 (1.02 ≥ 0.80). Duyệt 623 tổ hợp đã khắc phục lỗi 0.45 mà không đưa dữ liệu chủng tộc vào bước lập kế hoạch.",
      },
    },
    {
      group: {
        en: "Hispanic / Latino Uninsured Parity Ratio",
        es: "Razón de Paridad Sin Seguro Hispanos / Latinos",
        vi: "Tỷ lệ Công bằng Cư dân Gốc Tây Ban Nha / Mỹ Latinh",
      },
      planShare: "0.81 PASS (Borderline)",
      countyUninsuredBenchmark: "Threshold: 0.80 · Stop #2 = 5.3% Limited English",
      status: {
        en: "PASSES (0.81 ≥ 0.80 borderline). Because Tract 13121011431 (34.6% uninsured, ~75% Hispanic) is in no passing 4-stop set, Composer routes 11431 to the human Outreach Lead for next month's 1st Saturday with a Spanish navigator.",
        es: "APRUEBA (0.81 ≥ 0.80 en el límite). El Tramo 11431 (34.6% sin seguro, ~75% hispano) se escala al Coordinador humano para el primer sábado del próximo mes.",
        vi: "ĐẠT (0.81 ≥ 0.80 sát ngưỡng). Vì Tract 11431 (34.6% không bảo hiểm, ~75% gốc Tây Ban Nha) không nằm trong tổ hợp nào thỏa mãn đồng thời mọi nhóm, hệ thống báo cáo lên Điều phối viên để xếp lịch tháng tới.",
      },
    },
    {
      group: {
        en: "White (0.88 PASS) & Asian (1.04 PASS) Uninsured Parity Ratios",
        es: "Razón de Paridad Blancos (0.88 APRUEBA) y Asiáticos (1.04 APRUEBA)",
        vi: "Tỷ lệ Công bằng Da trắng (0.88 ĐẠT) & Châu Á (1.04 ĐẠT)",
      },
      planShare: "0.88 White / 1.04 Asian",
      countyUninsuredBenchmark: "All 4 Groups ≥ 0.80 (Zero Flags!)",
      status: {
        en: "Zero flags across all four groups. Alternative passing set surfaced to human: 06900 / 11421 / 11307 / 09405 (Need 9.01, reaches ~22% more uninsured, 0 flags).",
        es: "Cero alertas en los cuatro grupos. Alternativa reportada al coordinador: 06900 / 11421 / 11307 / 09405 (Necesidad 9.01, alcanza ~22% más personas sin seguro, 0 alertas).",
        vi: "Không có cờ cảnh báo nào ở cả 4 nhóm. Phương án thay thế trình Điều phối viên: 06900 / 11421 / 11307 / 09405 (Điểm 9.01, tiếp cận thêm ~22% người không bảo hiểm).",
      },
    },
  ],
};

export const LIMITATIONS_LIST: LocalizedText[] = [
  {
    en: "Human Trade-Off #1 — Tract 13121011431 (34.6% uninsured, highest in Fulton): Its uninsured residents are ~75% Hispanic; any 4-stop set including it pushes other groups below 0.80. Routed to the Outreach Lead for next month's 1st Saturday with a Spanish navigator.",
    es: "Decisión Humana #1 — Tramo 13121011431 (34.6% sin seguro, el más alto de Fulton): ~75% hispano; incluirlo baja a otros grupos de 0.80. Escalado al Coordinador para el primer sábado del próximo mes con navegador en español.",
    vi: "Đánh đổi Trình Con người #1 — Tract 13121011431 (34.6% không bảo hiểm, cao nhất Fulton): ~75% cư dân gốc Tây Ban Nha; đưa vào bộ 4 điểm sẽ đẩy nhóm khác xuống dưới 0.80. Đề xuất Điều phối viên xếp lịch Thứ Bảy đầu tháng sau.",
  },
  {
    en: "School-Based Clinics & Prison Check (`sql/tract_access_adult.sql`): USP Atlanta (federal prison) is only in `shortage_facilities` (0 tracts affected), but 9+ safety-net sites are student-only School clinics—making access look up to 11 km better than reality (e.g., Tract 10214 jumps from 8.1 km to 19.5 km; 41% → 60% of Fulton tracts are farther from adult safety-net care than any care).",
    es: "Clínicas Escolares y Prisión (`sql/tract_access_adult.sql`): 9+ sitios son clínicas escolares solo para estudiantes, haciendo que el acceso parezca hasta 11 km mejor de lo real (ej. el Tramo 10214 sube de 8.1 km a 19.5 km).",
    vi: "Phòng khám Trường học & Nhà tù (`sql/tract_access_adult.sql`): Hơn 9 điểm an sinh là phòng khám trường học chỉ phục vụ học sinh, làm khoảng cách tiếp cận ảo tốt hơn thực tế tới 11 km (ví dụ Tract 10214 tăng từ 8.1 km lên 19.5 km).",
  },
  {
    en: "Scale, Confidence Intervals & Sample Size Boundaries: Top 2 uninsured tracts are statistically distinct, but from rank #3 on, 35–67 tracts tie within 95% CIs (`a4i_health.places_ci`). Stop #4 (09405) is weakest on uninsured (7.9%, chosen for 70.3% low checkup + 20.9% no car). Four-stop equity ratios rest on ~2,100 estimated uninsured people and are noisy.",
    es: "Límites de Escala, Intervalos de Confianza y Muestra: Desde el puesto #3, entre 35 y 67 tramos empatan estadísticamente (`places_ci`). La Parada #4 es la más baja en personas sin seguro (7.9%). Las razones de equidad se basan en ~2,100 personas estimadas.",
    vi: "Giới hạn Quy mô, Khoảng Tin cậy & Cỡ mẫu: Từ hạng #3 trở đi, có 35–67 phân khu hòa nhau trong khoảng tin cậy 95% (`places_ci`). Điểm #4 thấp nhất về tỷ lệ không bảo hiểm (7.9%). Tỷ lệ kiểm toán dựa trên mẫu ~2.100 người nên có độ nhiễu.",
  },
];

export const EXPLAINER_FLYER = {
  en: {
    badge: "FREE NEIGHBORHOOD HEALTH VAN · NO INSURANCE NEEDED",
    headline: "Your Neighborhood Health Van Is Coming This November!",
    subheadline:
      "Free checkups, blood pressure checks, blood sugar checks, and friendly nurses right in your neighborhood. Walk right up—no appointment, no insurance, and no ID required.",
    promiseItems: [
      "Free Care · Walk Right Up",
      "English & Spanish Support (Stop #2 & Hotline)",
      "Takes About 20 Minutes · No Insurance Needed",
    ],
    scheduleTitle: "Find Us on 4 Saturday Mornings (9:00 AM – 2:00 PM)",
    footerNote:
      "Questions or need a ride? Call or text Fulton County Community Health at (404) 613-1205. (Written at a 6th-grade reading level by the Explainer Agent with zero data jargon.)",
  },
  es: {
    badge: "CLÍNICA MÓVIL GRATUITA EN SU VECINDARIO · NO NECESITA SEGURO",
    headline: "¡La Clínica Móvil Llega a Su Vecindario Este Noviembre!",
    subheadline:
      "Chequeos médicos gratuitos, presión arterial, azúcar en la sangre y enfermeras amables cerca de su casa. Venga sin cita—no necesita seguro médico ni identificación.",
    promiseItems: [
      "Atención 100% Gratuita · Sin Cita",
      "Personal en Español (Especialmente Parada #2)",
      "Solo Toma 20 Minutos · Todos Bienvenidos",
    ],
    scheduleTitle: "Visítenos Estos 4 Sábados (9:00 AM – 2:00 PM)",
    footerNote:
      "¿Preguntas o necesita ayuda para llegar? Llame o envíe mensaje de texto al Condado de Fulton al (404) 613-1205.",
  },
  vi: {
    badge: "XE KHÁM BỆNH LƯU ĐỘNG MIỄN PHÍ · KHÔNG CẦN BẢO HIỂM",
    headline: "Xe Phòng Khám Sức Khỏe Sẽ Đến Khu Phố Của Bạn Trong Tháng 11 Này!",
    subheadline:
      "Khám sức khỏe định kỳ, đo huyết áp, kiểm tra đường huyết miễn phí ngay gần nhà. Không cần đặt lịch hẹn, không cần bảo hiểm y tế.",
    promiseItems: [
      "Khám Hoàn toàn Miễn phí · Không Cần Hẹn",
      "Hỗ trợ Đa ngôn ngữ (Anh / Tây Ban Nha / Việt)",
      "Chỉ Mất 20 Phút · Đón Khách Vãng Lai",
    ],
    scheduleTitle: "Lịch Đỗ Xe 4 Sáng Thứ Bảy (9:00 AM – 2:00 PM)",
    footerNote:
      "Cần hỗ trợ? Gọi hoặc nhắn tin Y tế Cộng đồng Quận Fulton: (404) 613-1205.",
  },
};

export const SESSION_STATE_SNAPSHOT = {
  ev_burden: {
    agent: "burden_scout",
    sql: "sql/scout_burden.sql + a4i_health.places_ci",
    resolution: "census_tract (modeled PLACES 2023 BRFSS)",
    race_columns_accessed: false,
    final_4_tracts: [
      { tract_fips: "13121010125", pop: 3251, uninsured_pct: 12.9, checkup_pct: 73.7 },
      { tract_fips: "13121006900", pop: 3733, uninsured_pct: 14.8, checkup_pct: 74.5 },
      { tract_fips: "13121011307", pop: 4631, uninsured_pct: 18.0, checkup_pct: 77.8 },
      { tract_fips: "13121009405", pop: 4332, uninsured_pct: 7.9, checkup_pct: 70.3 },
    ],
  },
  ev_access: {
    agent: "access_scout",
    sql: "sql/scout_access.sql + a4i_health.tract_access_adult",
    resolution: "census_tract (SVI survey no-car + measured straight-line km excluding school clinics)",
    race_columns_accessed: false,
    final_4_tracts: [
      { tract_fips: "13121010125", no_car_pct: 31.6, km_to_adult_safetynet: 20.1 },
      { tract_fips: "13121006900", no_car_pct: 20.5, km_to_adult_safetynet: 3.2, limited_english_pct: 5.3 },
      { tract_fips: "13121011307", no_car_pct: 22.9, km_to_adult_safetynet: 4.8 },
      { tract_fips: "13121009405", no_car_pct: 20.9, km_to_adult_safetynet: 2.4 },
    ],
  },
  ev_context: {
    agent: "context_scout",
    sql: "sql/scout_context_air.sql + sql/scout_context_disease.sql",
    race_columns_accessed: false,
    air_pm25: { range: "8.98-9.81", spread: "1.05x", resolution: "12km_grid (never used to rank tracts)" },
    disease_weekly: { covid_ed_pct: "0.07% -> 0.28%", week_ending: "2026-08-01", resolution: "4_county_HSA (Clayton, DeKalb, Fulton, Gwinnett)" },
    shortage_areas: { active_in_fulton: 0, proposed_for_withdrawal: 99, note: "Say 'no signal', not 'no problem'" },
  },
  plan_draft: {
    agent: "planner",
    sql: "sql/rank_tracts_plan_c.sql + scripts/pick4.py",
    candidates_tested: 623,
    min_spacing_km: 5.0,
    min_adult_clinic_distance_km: 2.0,
    final_4_picks: ["13121010125", "13121006900", "13121011307", "13121009405"],
    alternative_passing_set: ["13121006900", "13121011421", "13121011307", "13121009405"],
  },
  audit_revisions: [
    { attempt: 1, plan: "Plan A (need + distance)", reason_rejected: "Black uninsured ratio 0.53 FLAG (<0.80)" },
    { attempt: 2, plan: "Plan B (need only)", reason_rejected: "Top picks 0.45-0.83 km from existing clinics; van adds no access" },
    { attempt: 3, plan: "Plan C greedy (11431/10125/06900/06602)", reason_rejected: "Picked 2 North Fulton tracts -> final set Black ratio 0.45 FLAG" },
  ],
  audit_equity: {
    agent: "auditor",
    sql: "sql/audit_demographics_v2.sql",
    visibility: "HUMAN_OUTREACH_LEAD_ONLY",
    ratios: { Black: 1.02, Hispanic: 0.81, White: 0.88, Asian: 1.04 },
    flags: [],
    human_tradeoff: "Tract 13121011431 (34.6% uninsured, ~75% Hispanic) is in no passing 4-stop set; route to human for next month's 1st Saturday with Spanish navigator.",
  },
  outreach: {
    agent: "explainer",
    reading_level: "6th_grade",
    languages: ["en", "es", "vi"],
    spanish_justified_at: "Stop #2 (Tract 13121006900, 5.3% limited English) + Tract 11431 outreach",
  },
};
