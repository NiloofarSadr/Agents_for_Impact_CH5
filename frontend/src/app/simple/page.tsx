"use client";

import React, { useState } from "react";
import {
  Locale,
  UI_STRINGS,
  RECOMMENDED_STOPS,
  REJECTED_DRAFT_STOP,
  EQUITY_AUDIT_DATA,
  EXPLAINER_FLYER,
  ScaleType,
  MethodType,
} from "@/data/contractData";
import { FultonMap } from "@/components/FultonMap";
import { VersionSwitcher } from "@/components/VersionSwitcher";
import {
  ExplainerKey,
  InfoTrigger,
  InfoModal,
} from "@/components/InfoExplainer";
import {
  Globe,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Calendar,
  MapPin,
  CheckSquare,
  Square,
  FileText,
  Users,
  Compass,
  Truck,
  CheckCircle2,
  Copy,
  Check,
  Printer,
  Megaphone,
  Construction,
  Bus,
  CloudSun,
  Handshake,
  HelpCircle,
  HeartHandshake,
  Route,
  Scale,
} from "lucide-react";

export default function SimplifiedCoordinatorPage() {
  const [locale, setLocale] = useState<Locale>("en");
  const [selectedRank, setSelectedRank] = useState<number>(1);
  const [showRejectedPin, setShowRejectedPin] = useState<boolean>(true);
  const [activeInfoTerm, setActiveInfoTerm] = useState<ExplainerKey | null>(
    null
  );
  const [flyerLangMode, setFlyerLangMode] = useState<"active" | "bilingual">(
    "bilingual"
  );
  const [copiedFlyer, setCopiedFlyer] = useState<boolean>(false);
  const [ checkedActions, setCheckedActions ] = useState<Record<string, boolean>>({
    "adv-1a": true,
    "adv-2a": true,
    "adv-3a": true,
    "adv-4a": true,
  });

  const t = UI_STRINGS[locale];
  const activeStop =
    RECOMMENDED_STOPS.find((s) => s.rank === selectedRank) ||
    RECOMMENDED_STOPS[0];

  const toggleChecklist = (id: string) => {
    setCheckedActions((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyFlyer = () => {
    const flyer = EXPLAINER_FLYER[locale];
    const scheduleLines = RECOMMENDED_STOPS.map(
      (s) =>
        `• ${s.saturdayLabel[locale]}: ${s.siteName[locale]} (${s.siteAddress})`
    ).join("\n");
    const text = `${flyer.badge}\n${flyer.headline}\n\n${flyer.subheadline}\n\n${scheduleLines}\n\n${flyer.footerNote}`;
    navigator.clipboard?.writeText(text);
    setCopiedFlyer(true);
    setTimeout(() => setCopiedFlyer(false), 2500);
  };

  const getScaleBadge = (scale: ScaleType) => {
    if (scale === "census_tract") {
      return {
        label: t.scaleTract,
        classes: "bg-teal-50 text-teal-800 border-teal-300",
        infoKey: "tract" as ExplainerKey,
      };
    }
    if (scale === "grid_12km") {
      return {
        label: t.scaleGrid,
        classes: "bg-amber-50 text-amber-800 border-amber-300",
        infoKey: "scale_resolution" as ExplainerKey,
      };
    }
    return {
      label: t.scaleRegion,
      classes: "bg-purple-50 text-purple-800 border-purple-300",
      infoKey: "scale_resolution" as ExplainerKey,
    };
  };

  const getMethodBadge = (method: MethodType) => {
    if (method === "measured") {
      return {
        label: t.methodMeasured,
        classes: "bg-emerald-50 text-emerald-800 border-emerald-300",
      };
    }
    return {
      label: t.methodModeled,
      classes: "bg-indigo-50 text-indigo-800 border-indigo-300",
    };
  };

  const getCategoryIcon = (
    cat:
      | "public_event"
      | "road_work"
      | "transit"
      | "weather_holiday"
      | "co_location"
  ) => {
    switch (cat) {
      case "co_location":
        return <Handshake className="w-4 h-4 text-emerald-600" />;
      case "road_work":
        return <Construction className="w-4 h-4 text-rose-600" />;
      case "transit":
        return <Bus className="w-4 h-4 text-amber-600" />;
      case "weather_holiday":
        return <CloudSun className="w-4 h-4 text-rose-600" />;
      default:
        return <Megaphone className="w-4 h-4 text-sky-600" />;
    }
  };

  // Plain-English translations for the top Coordinator Summary section
  const laymanCopy = {
    en: {
      topBadge: "SIMPLIFIED COORDINATOR VIEW · PLAIN-LANGUAGE GUIDE",
      topTitle: "How the AI Team Picked Next Month’s 4 Mobile Clinic Stops",
      topSubtitle:
        "Instead of one black-box formula, 4 specialized AI assistants researched Fulton County neighborhoods, checked each other’s work, and rejected 3 flawed drafts before recommending these 4 Saturdays.",
      workflowTitle: "1. The 4-Step Assistant Workflow (In Plain English)",
      steps: [
        {
          step: "Step 1 · Neighbourhood Scouts",
          title: "Find Where Care & Cars Are Missing",
          desc: "Scanned all 325 Fulton County neighborhoods for adults without health insurance, households without a car, and overdue checkups. (Blind to race by rule.)",
        },
        {
          step: "Step 2 · Route Planner",
          title: "Pick 4 Spread-Out Saturday Stops",
          desc: "Selected neighborhoods that are more than 2 km from any adult free/sliding-scale clinic and spaced at least 5 km apart.",
        },
        {
          step: "Step 3 · Fairness & Quality Auditor",
          title: "Double-Check for Hidden Traps & Fairness",
          desc: "Filtered out student-only school clinics and tested all 623 possible 4-stop combinations until every community passed the 80% fairness rule.",
        },
        {
          step: "Step 4 · Community Outreach Writer",
          title: "Write Ready-to-Print Flyers",
          desc: "Turned the approved 4-stop schedule into a friendly, 6th-grade reading level flyer in English, Spanish, and Vietnamese.",
        },
      ],
      criteriaTitle: "2. The 4 Rules Every Recommended Stop Must Pass",
      criteria: [
        {
          title: "High Unmet Need (Plan C Score)",
          desc: "Combines % Uninsured + % With No Car + % Overdue Checkup (scored 0.00 to 3.00). Uses statistical tie-breakers when survey margins overlap.",
          infoKey: "plan_c_ci" as ExplainerKey,
          infoLabel: "What is CI & Plan C #1?",
        },
        {
          title: "No Adult Safety-Net Clinic Nearby (>2 km)",
          desc: "Must be over 2 km away from an adult-accessible FQHC or health center (ignoring elementary/high school clinics that only treat students).",
          infoKey: "adult_safety_net" as ExplainerKey,
          infoLabel: "Why >2 km?",
        },
        {
          title: "Spread Across the County (≥5 km Apart)",
          desc: "Each Saturday stop must be at least 5 km from the other three stops so one neighborhood doesn't get two visits while others get none.",
          infoKey: "tract" as ExplainerKey,
          infoLabel: "What is a Tract?",
        },
        {
          title: "Fair to Every Community (≥0.80 Ratio)",
          desc: "Audited as a complete 4-stop set across Black (1.02), Hispanic (0.81), White (0.88), and Asian (1.04) uninsured residents—zero fairness flags.",
          infoKey: "four_fifths_rule" as ExplainerKey,
          infoLabel: "Explain 0.80 Rule",
        },
      ],
      quickGlossaryLabel: "Click any badge to explain the numbers in plain English:",
    },
    es: {
      topBadge: "VISTA SIMPLIFICADA PARA COORDINADORES · LENGUAJE CLARO",
      topTitle: "Cómo el Equipo de IA Eligió las 4 Paradas de la Clínica Móvil",
      topSubtitle:
        "Cuatro asistentes especializados analizaron los vecindarios del Condado de Fulton, revisaron su propio trabajo y rechazaron 3 borradores antes de aprobar estos 4 sábados.",
      workflowTitle: "1. Flujo de Trabajo en 4 Pasos (En Español Claro)",
      steps: [
        {
          step: "Paso 1 · Exploradores de Datos",
          title: "Buscar Dónde Faltan Clínicas y Autos",
          desc: "Analizaron los 325 vecindarios buscando adultos sin seguro médico, hogares sin auto y falta de chequeos (sin usar datos de raza).",
        },
        {
          step: "Paso 2 · Planificador de Ruta",
          title: "Elegir 4 Sábados Bien Distribuidos",
          desc: "Seleccionó áreas a más de 2 km de clínicas gratuitas para adultos y separadas por al menos 5 km entre sí.",
        },
        {
          step: "Paso 3 · Auditor de Equidad y Calidad",
          title: "Detectar Trampas y Verificar Equidad",
          desc: "Excluyó clínicas escolares solo para estudiantes y probó 623 combinaciones hasta lograr equidad para todos los grupos (≥0.80).",
        },
        {
          step: "Paso 4 · Redactor Comunitario",
          title: "Crear Folletos Listos para Imprimir",
          desc: "Tradujo el horario aprobado a un folleto claro (nivel de 6.º grado) en inglés, español y vietnamita.",
        },
      ],
      criteriaTitle: "2. Las 4 Reglas que Toda Parada Debe Cumplir",
      criteria: [
        {
          title: "Alta Necesidad (Puntaje Plan C)",
          desc: "Suma % Sin Seguro + % Sin Auto + % Sin Chequeo (de 0.00 a 3.00). Desempata con % sin auto cuando los márgenes de error (CI) se cruzan.",
          infoKey: "plan_c_ci" as ExplainerKey,
          infoLabel: "¿Qué es CI y Plan C #1?",
        },
        {
          title: "Sin Clínica para Adultos Cercana (>2 km)",
          desc: "A más de 2 km de cualquier centro de salud federal para adultos (excluyendo enfermerías escolares).",
          infoKey: "adult_safety_net" as ExplainerKey,
          infoLabel: "¿Por qué >2 km?",
        },
        {
          title: "Separación Mínima de ≥5 km",
          desc: "Cada parada del sábado está a ≥5 km de las demás para cubrir distintas zonas del condado.",
          infoKey: "tract" as ExplainerKey,
          infoLabel: "¿Qué es un Tracto?",
        },
        {
          title: "Equidad para Toda Comunidad (≥0.80)",
          desc: "Auditado en conjunto: Afroamericanos (1.02), Hispanos (0.81), Blancos (0.88) y Asiáticos (1.04) — cero alertas.",
          infoKey: "four_fifths_rule" as ExplainerKey,
          infoLabel: "Explicar Regla 0.80",
        },
      ],
      quickGlossaryLabel: "Haga clic en cualquier botón para explicar los números:",
    },
    vi: {
      topBadge: "GIAO DIỆN ĐƠN GIẢN CHO ĐIỀU PHỐI VIÊN · NGÔN NGỮ DỄ HIỂU",
      topTitle: "Cách Đội ngũ AI Chọn 4 Điểm Đỗ Xe Khám Lưu động Tháng Tới",
      topSubtitle:
        "4 trợ lý AI chuyên biệt đã khảo sát 325 khu dân cư Quận Fulton, kiểm tra chéo và bác bỏ 3 bản nháp chưa đạt chuẩn trước khi chọn ra 4 ngày Thứ Bảy này.",
      workflowTitle: "1. Quy trình 4 Bước (Giải thích Dễ hiểu)",
      steps: [
        {
          step: "Bước 1 · Trợ lý Khảo sát",
          title: "Tìm Nơi Thiếu Bảo hiểm & Thiếu Xe Cá nhân",
          desc: "Quét 325 khu dân cư tìm nơi có tỷ lệ không bảo hiểm cao, không có xe hơi và thiếu khám định kỳ (không dùng dữ liệu chủng tộc).",
        },
        {
          step: "Bước 2 · Trợ lý Lập Tuyến",
          title: "Chọn 4 Điểm Đỗ Cách Đều Nhau",
          desc: "Chỉ chọn khu vực cách phòng khám người lớn trên 2 km và cách nhau ít nhất 5 km.",
        },
        {
          step: "Bước 3 · Kiểm toán Công bằng",
          title: "Loại bỏ Phòng khám Trường học & Kiểm tra Công bằng",
          desc: "Loại trừ phòng y tế chỉ khám cho học sinh và thử 623 tổ hợp đến khi đạt chuẩn công bằng 80% cho mọi cộng đồng.",
        },
        {
          step: "Bước 4 · Trợ lý Truyền thông",
          title: "Tạo Tờ rơi Đa Ngữ",
          desc: "Chuyển lịch trình thành tờ rơi dễ đọc (cấp lớp 6) bằng tiếng Anh, Tây Ban Nha và tiếng Việt.",
        },
      ],
      criteriaTitle: "2. 4 Tiêu chí Mọi Điểm Đỗ Phải Đạt",
      criteria: [
        {
          title: "Nhu cầu Cao (Điểm Plan C)",
          desc: "Cộng % Không bảo hiểm + % Không xe + % Thiếu khám (0.00–3.00). Xử lý hòa thống kê (CI) bằng tỷ lệ không có xe.",
          infoKey: "plan_c_ci" as ExplainerKey,
          infoLabel: "CI & Plan C #1 là gì?",
        },
        {
          title: "Cách Phòng khám Người lớn >2 km",
          desc: "Cách trung tâm y tế người lớn trên 2 km (đã loại trừ phòng y tế trường học).",
          infoKey: "adult_safety_net" as ExplainerKey,
          infoLabel: "Tại sao >2 km?",
        },
        {
          title: "Cách Nhau Ít nhất ≥5 km",
          desc: "Mỗi điểm đỗ Thứ Bảy cách nhau tối thiểu 5 km để phục vụ nhiều khu vực.",
          infoKey: "tract" as ExplainerKey,
          infoLabel: "Tract là gì?",
        },
        {
          title: "Công bằng Cho Mọi Cộng đồng (≥0.80)",
          desc: "Đạt chuẩn 4/5 cho cả 4 nhóm: Da đen (1.02), Tây Ban Nha (0.81), Da trắng (0.88), Châu Á (1.04).",
          infoKey: "four_fifths_rule" as ExplainerKey,
          infoLabel: "Giải thích Quy tắc 0.80",
        },
      ],
      quickGlossaryLabel: "Nhấp vào bất kỳ nút nào để xem giải thích chi tiết:",
    },
  }[locale];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Version Switcher Bar so User Can Compare Version A vs Version B */}
      <VersionSwitcher activeVersion="simple" />

      {/* Sticky Header with Language Selector */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center shadow-sm font-bold">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900">
                  {t.appTitle}
                </h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Coordinator Edition
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Fulton County (FIPS 13121) · 4 Audited Saturday Stops Next Month
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Multi-Lingual Switcher */}
            <div
              className="inline-flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200"
              role="group"
              aria-label="Language Selector"
            >
              <Globe className="w-3.5 h-3.5 text-slate-500 ml-2 mr-1" />
              {(
                [
                  { code: "en", label: "English" },
                  { code: "es", label: "Español" },
                  { code: "vi", label: "Tiếng Việt" },
                ] as { code: Locale; label: string }[]
              ).map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setLocale(lang.code)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    locale === lang.code
                      ? "bg-teal-700 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setActiveInfoTerm("plan_c_ci")}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-amber-700" />
              Plain-English Number Guide
            </button>

            <a
              href="#explainer-flyer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-teal-700 text-white hover:bg-teal-800 transition shadow-xs"
            >
              <FileText className="w-3.5 h-3.5" />
              {t.printFlyerBtn}
            </a>
          </div>
        </div>
      </header>

      {/* Interactive Info Modal */}
      <InfoModal
        activeTerm={activeInfoTerm}
        locale={locale}
        onClose={() => setActiveInfoTerm(null)}
        onSelectTerm={(term) => setActiveInfoTerm(term)}
      />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-8 py-6 space-y-8">
        {/* 1. TOP PLAIN-ENGLISH SUMMARY OF AGENT WORKFLOW & DECISION CRITERIA */}
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white p-5 sm:p-6">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-teal-300 bg-teal-500/15 border border-teal-400/30 px-2.5 py-0.5 rounded-full">
              <Sparkles className="w-3.5 h-3.5" />
              {laymanCopy.topBadge}
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold mt-2">
              {laymanCopy.topTitle}
            </h2>
            <p className="text-xs sm:text-sm text-slate-200 mt-1 max-w-4xl leading-relaxed">
              {laymanCopy.topSubtitle}
            </p>
          </div>

          <div className="p-5 sm:p-6 space-y-6">
            {/* 4-Step Layman Workflow */}
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-teal-800 mb-3 flex items-center gap-1.5">
                <Route className="w-4 h-4 text-teal-600" />
                {laymanCopy.workflowTitle}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {laymanCopy.steps.map((s, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl bg-slate-50 border border-slate-200 p-4 flex flex-col justify-between"
                  >
                    <div>
                      <div className="text-[11px] font-extrabold uppercase tracking-wide text-teal-700">
                        {s.step}
                      </div>
                      <div className="text-sm font-bold text-slate-900 mt-1">
                        {s.title}
                      </div>
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                        {s.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4 Decision Criteria Cards with Clickable Info Triggers */}
            <div className="pt-4 border-t border-slate-200">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-teal-800 mb-3 flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-teal-600" />
                {laymanCopy.criteriaTitle}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {laymanCopy.criteria.map((c, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl bg-teal-50/50 border border-teal-200/80 p-4 flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-extrabold text-slate-900">
                          {c.title}
                        </span>
                        <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                      </div>
                      <p className="text-xs text-slate-700 mt-1.5 leading-relaxed">
                        {c.desc}
                      </p>
                    </div>
                    <div>
                      <InfoTrigger
                        term={c.infoKey}
                        label={c.infoLabel}
                        onOpen={setActiveInfoTerm}
                        variant="teal"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive Quick-Click Glossary Bar */}
            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-teal-600" />
                {laymanCopy.quickGlossaryLabel}
              </span>
              <InfoTrigger
                term="tract"
                label="What is a “Tract”?"
                onOpen={setActiveInfoTerm}
              />
              <InfoTrigger
                term="plan_c_ci"
                label="What is “CI Plan C #1”?"
                onOpen={setActiveInfoTerm}
              />
              <InfoTrigger
                term="need_score"
                label="How is “Score 2.41” calculated?"
                onOpen={setActiveInfoTerm}
              />
              <InfoTrigger
                term="modeled_vs_measured"
                label="Modeled vs. Measured Data"
                onOpen={setActiveInfoTerm}
              />
              <InfoTrigger
                term="human_tradeoff_11431"
                label="Why wasn't Tract 11431 (34.6% uninsured) chosen?"
                onOpen={setActiveInfoTerm}
              />
            </div>
          </div>
        </section>

        {/* 2. PROMINENT AGENT RECOMMENDATIONS: 4 SATURDAY DEPLOYMENT CARDS */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-teal-700">
                {t.prominentRecsTag}
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-0.5">
                {t.prominentRecsTitle}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                {t.prominentRecsDesc}
              </p>
            </div>
          </div>

          {/* 4-Card Grid with Clickable Info Pills for Tract & Plan C Score */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {RECOMMENDED_STOPS.map((stop) => {
              const isSelected = stop.rank === selectedRank;
              const isPromoted = stop.status === "promoted_round_2";
              const criticalCount = stop.advisories.filter(
                (a) => a.severity === "critical" || a.severity === "caution"
              ).length;

              return (
                <div
                  key={stop.tractFips}
                  onClick={() => setSelectedRank(stop.rank)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setSelectedRank(stop.rank);
                    }
                  }}
                  className={`text-left rounded-2xl p-4 sm:p-5 transition cursor-pointer border-2 flex flex-col justify-between relative ${
                    isSelected
                      ? "bg-white border-teal-600 shadow-lg ring-4 ring-teal-600/10"
                      : "bg-white border-slate-200 hover:border-teal-300 shadow-xs"
                  }`}
                >
                  <div>
                    {/* Top Row: Rank Badge + Clickable Plan C Info */}
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-extrabold ${
                          isSelected
                            ? "bg-teal-700 text-white"
                            : "bg-slate-100 text-slate-800"
                        }`}
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        {stop.saturdayLabel[locale].split("·")[0]}
                      </span>

                      <InfoTrigger
                        term="plan_c_ci"
                        label={
                          isPromoted
                            ? `${stop.scoreCi} (Exhaustive)`
                            : stop.scoreCi
                        }
                        onOpen={setActiveInfoTerm}
                        variant="teal"
                      />
                    </div>

                    {/* Neighborhood & Clickable Tract Badge */}
                    <h3 className="text-base font-extrabold text-slate-900 mt-3 leading-snug">
                      {stop.neighborhood[locale]}
                    </h3>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-xs font-mono font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        Tract {stop.tractFips}
                      </span>
                      <InfoTrigger
                        term="tract"
                        label="What is this?"
                        onOpen={setActiveInfoTerm}
                      />
                    </div>

                    {/* Host Site */}
                    <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                        <span className="truncate">{stop.siteName[locale]}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 pl-5 truncate">
                        {stop.siteAddress}
                      </div>
                    </div>

                    {/* Key Metrics Strip + Clickable Need Score Info */}
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="bg-teal-50/70 border border-teal-200/70 rounded-xl p-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-teal-700">
                            Need Score
                          </span>
                          <InfoTrigger
                            term="need_score"
                            label="?"
                            onOpen={setActiveInfoTerm}
                          />
                        </div>
                        <div className="text-lg font-black text-teal-900 mt-0.5">
                          {stop.needScore}
                          <span className="text-[11px] font-semibold text-teal-700">
                            {" "}
                            / 3.00
                          </span>
                        </div>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-2">
                        <div className="text-[10px] uppercase font-bold text-slate-500">
                          Uninsured / No Car
                        </div>
                        <div className="text-sm font-extrabold text-slate-900 mt-1">
                          {stop.metrics[0].value} · {stop.metrics[1].value}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Bar: Event Advisory Count */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span
                      className={`font-semibold flex items-center gap-1 ${
                        criticalCount > 0 ? "text-amber-700" : "text-emerald-700"
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {stop.advisories.length} Saturday Event Advisories
                    </span>
                    <span className="font-bold text-teal-700">
                      {isSelected ? "Inspecting ↓" : "Inspect →"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 3. SPLIT WORKSPACE: SUPPORTIVE DATA + INTERACTIVE MAP + SATURDAY EVENTS */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT 7 COLUMNS: Supportive Evidence + Saturday Event Advisories */}
          <div className="lg:col-span-7 space-y-6">
            {/* Supportive Data Card with Clickable Info Triggers */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-md text-xs font-extrabold bg-teal-700 text-white">
                      Saturday #{activeStop.rank}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      Tract {activeStop.tractFips}
                    </span>
                    <InfoTrigger
                      term="tract"
                      label="Explain Tract"
                      onOpen={setActiveInfoTerm}
                    />
                    <InfoTrigger
                      term="plan_c_ci"
                      label="Explain Plan C & CI"
                      onOpen={setActiveInfoTerm}
                    />
                  </div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1.5">
                    {activeStop.neighborhood[locale]}
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {activeStop.saturdayLabel[locale]} ·{" "}
                    <span className="font-semibold text-slate-800">
                      {activeStop.siteName[locale]}
                    </span>{" "}
                    ({activeStop.siteAddress})
                  </p>
                </div>

                {/* Mandatory Scale & Method Legend with Clickable Info */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-[11px] space-y-1.5">
                  <div className="font-bold text-slate-700 flex items-center justify-between gap-2">
                    <span>Data Source & Scale Labels</span>
                    <InfoTrigger
                      term="modeled_vs_measured"
                      label="Why labeled?"
                      onOpen={setActiveInfoTerm}
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="px-2 py-0.5 rounded border bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold">
                      {t.methodMeasured}
                    </span>
                    <span className="px-2 py-0.5 rounded border bg-indigo-50 text-indigo-800 border-indigo-300 font-semibold">
                      {t.methodModeled}
                    </span>
                  </div>
                </div>
              </div>

              {/* Plain-Language "Why Chosen" Summary Box */}
              <div className="bg-teal-50/70 border border-teal-200 rounded-xl p-4">
                <div className="text-xs font-extrabold uppercase tracking-wider text-teal-900 flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-teal-700" />
                    {t.whyChosenTitle}
                  </span>
                  <InfoTrigger
                    term="adult_safety_net"
                    label="Why school clinics were excluded"
                    onOpen={setActiveInfoTerm}
                    variant="teal"
                  />
                </div>
                <p className="text-xs sm:text-sm text-slate-800 mt-1.5 leading-relaxed font-medium">
                  {activeStop.headlineReason[locale]}
                </p>
              </div>

              {/* 6 Supportive Metrics Grid with Scale & Method Badges + Info Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {activeStop.metrics.map((m) => {
                  const scaleBadge = getScaleBadge(m.scale);
                  const methodBadge = getMethodBadge(m.method);
                  return (
                    <div
                      key={m.id}
                      className="rounded-xl border border-slate-200 p-3.5 bg-white hover:border-slate-300 transition flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5 mb-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded border ${scaleBadge.classes}`}
                          >
                            {scaleBadge.label}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded border ${methodBadge.classes}`}
                          >
                            {methodBadge.label}
                          </span>
                          <InfoTrigger
                            term={scaleBadge.infoKey}
                            label="?"
                            onOpen={setActiveInfoTerm}
                          />
                        </div>

                        <div className="text-xs font-bold text-slate-700">
                          {m.label[locale]}
                        </div>

                        <div className="flex items-baseline justify-between gap-2 mt-1">
                          <span className="text-xl font-black text-slate-900">
                            {m.value}
                          </span>
                          <span className="text-[11px] font-medium text-slate-500">
                            {t.countyAvgLabel}: {m.countyComparison[locale]}
                          </span>
                        </div>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                        <span>Source: {m.source}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Publicly Known Events & Execution Advisories for Selected Stop */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-amber-700">
                  SATURDAY FIELD OPERATIONS · STOP #{activeStop.rank}
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 mt-0.5">
                  Public Events, Transit & Street-Level Execution Advisories
                </h3>
                <p className="text-xs text-slate-600">
                  Known neighborhood events, MARTA bus frequency, and parking logistics for{" "}
                  <span className="font-bold text-slate-800">
                    {activeStop.neighborhood[locale]}
                  </span>
                  .
                </p>
              </div>

              <div className="space-y-3">
                {activeStop.advisories.map((adv) => {
                  const isChecked = !!checkedActions[adv.id];
                  const borderClass =
                    adv.severity === "critical"
                      ? "border-l-4 border-l-rose-500 border-slate-200"
                      : adv.severity === "caution"
                      ? "border-l-4 border-l-amber-500 border-slate-200"
                      : "border-l-4 border-l-emerald-500 border-slate-200";

                  return (
                    <div
                      key={adv.id}
                      className={`rounded-xl border p-4 bg-slate-50/60 space-y-2.5 ${borderClass}`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(adv.category)}
                          <span className="text-sm font-extrabold text-slate-900">
                            {adv.title[locale]}
                          </span>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-600 bg-white px-2.5 py-0.5 rounded-md border border-slate-200">
                          {adv.timeWindow[locale]}
                        </span>
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed">
                        {adv.impact[locale]}
                      </p>

                      <div
                        onClick={() => toggleChecklist(adv.id)}
                        className="pt-2 border-t border-slate-200/80 flex items-start gap-2.5 cursor-pointer select-none"
                      >
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-teal-700 shrink-0 mt-0.5" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        )}
                        <div className="text-xs">
                          <span className="font-bold text-teal-900">
                            {t.coordinatorActionLabel}:{" "}
                          </span>
                          <span
                            className={
                              isChecked
                                ? "line-through text-slate-400"
                                : "text-slate-800 font-medium"
                            }
                          >
                            {adv.actionRequired[locale]}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT 5 COLUMNS: Map + Human Trade-off Card + Simplified Fairness Summary */}
          <div className="lg:col-span-5 space-y-6">
            <FultonMap
              locale={locale}
              selectedRank={selectedRank}
              onSelectRank={setSelectedRank}
              showRejectedPin={showRejectedPin}
              onToggleRejectedPin={() => setShowRejectedPin(!showRejectedPin)}
            />

            {/* Human Decision Trade-Off Card (Tract 13121011431) */}
            <div className="bg-white rounded-2xl border-2 border-amber-300 shadow-xs p-5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full">
                  <HeartHandshake className="w-3.5 h-3.5 text-amber-700" />
                  Flagged for Outreach Coordinator Decision
                </span>
                <InfoTrigger
                  term="human_tradeoff_11431"
                  label="Why wasn't 11431 chosen?"
                  onOpen={setActiveInfoTerm}
                  variant="teal"
                />
              </div>

              <h3 className="text-base font-extrabold text-slate-900">
                {REJECTED_DRAFT_STOP.neighborhood[locale]} (Tract{" "}
                {REJECTED_DRAFT_STOP.tractFips})
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed">
                {REJECTED_DRAFT_STOP.auditorRejection[locale]}
              </p>
              <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 text-xs text-amber-950 font-medium">
                {REJECTED_DRAFT_STOP.plannerFix[locale]}
              </div>
            </div>

            {/* Simplified Fairness & Equity Scorecard */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-teal-700">
                    FAIRNESS VERIFICATION
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {t.equityPanelTitle}
                  </h3>
                </div>
                <InfoTrigger
                  term="four_fifths_rule"
                  label="Explain 0.80 Rule"
                  onOpen={setActiveInfoTerm}
                  variant="teal"
                />
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {t.equityPanelRule}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {EQUITY_AUDIT_DATA.demographics.map((grp, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        {grp.group[locale]}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Plan: {grp.planShare} vs County:{" "}
                        {grp.countyUninsuredBenchmark}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        {grp.status[locale]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 4. EXPLAINER AGENT: MULTI-LINGUAL PRINTABLE COMMUNITY FLYER */}
        <section
          id="explainer-flyer"
          className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-teal-700">
                {t.flyerSectionTag}
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-0.5">
                {t.flyerSectionTitle}
              </h2>
              <p className="text-xs text-slate-600">{t.flyerSectionDesc}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setFlyerLangMode("bilingual")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                    flyerLangMode === "bilingual"
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-600"
                  }`}
                >
                  Side-by-Side (EN + ES)
                </button>
                <button
                  type="button"
                  onClick={() => setFlyerLangMode("active")}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                    flyerLangMode === "active"
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-600"
                  }`}
                >
                  Single Language ({locale.toUpperCase()})
                </button>
              </div>

              <button
                type="button"
                onClick={handleCopyFlyer}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition cursor-pointer"
              >
                {copiedFlyer ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    Copied for WhatsApp / SMS
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy WhatsApp / SMS Text
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-teal-700 hover:bg-teal-800 text-white transition cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Flyer
              </button>
            </div>
          </div>

          <div
            className={`grid grid-cols-1 ${
              flyerLangMode === "bilingual" ? "lg:grid-cols-2" : ""
            } gap-6`}
          >
            {(flyerLangMode === "bilingual"
              ? (["en", "es"] as Locale[])
              : ([locale] as Locale[])
            ).map((langKey) => {
              const flyer = EXPLAINER_FLYER[langKey];
              return (
                <div
                  key={langKey}
                  className="rounded-2xl border-2 border-teal-700/20 bg-gradient-to-b from-teal-50/50 to-white p-6 space-y-4 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-teal-700 text-white tracking-wide">
                      {flyer.badge}
                    </span>
                    <span className="text-xs font-bold uppercase text-teal-800 bg-teal-100 px-2.5 py-0.5 rounded">
                      {langKey === "en"
                        ? "English"
                        : langKey === "es"
                        ? "Español"
                        : "Tiếng Việt"}
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                    {flyer.headline}
                  </h3>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {flyer.subheadline}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {flyer.promiseItems.map((item, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 text-xs font-bold bg-emerald-50 text-emerald-900 border border-emerald-200 px-3 py-1.5 rounded-xl"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        {item}
                      </span>
                    ))}
                  </div>

                  <div className="space-y-2.5 pt-2">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-teal-900">
                      {flyer.scheduleTitle}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {RECOMMENDED_STOPS.map((s) => (
                        <div
                          key={s.tractFips}
                          className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs"
                        >
                          <div className="text-xs font-extrabold text-teal-800">
                            {s.saturdayLabel[langKey]}
                          </div>
                          <div className="text-xs font-bold text-slate-900 mt-0.5">
                            {s.neighborhood[langKey]}
                          </div>
                          <div className="text-[11px] text-slate-600 mt-0.5">
                            {s.siteName[langKey]}
                          </div>
                          <div className="text-[11px] font-medium text-slate-500">
                            {s.siteAddress}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-teal-200/60 text-xs font-medium text-slate-700">
                    {flyer.footerNote}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
