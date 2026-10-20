"use client";

import React from "react";
import {
  RECOMMENDED_STOPS,
  REJECTED_DRAFT_STOP,
  Locale,
  TractStop,
} from "@/data/contractData";
import {
  MapPin,
  ShieldAlert,
  Building2,
  CalendarClock,
  CheckCircle2,
} from "lucide-react";

interface FultonMapProps {
  locale: Locale;
  selectedRank: number;
  onSelectRank: (rank: number) => void;
  showRejectedPin: boolean;
  onToggleRejectedPin: () => void;
}

export function FultonMap({
  locale,
  selectedRank,
  onSelectRank,
  showRejectedPin,
  onToggleRejectedPin,
}: FultonMapProps) {
  const selectedStop: TractStop =
    RECOMMENDED_STOPS.find((s) => s.rank === selectedRank) ||
    RECOMMENDED_STOPS[0];

  const labels = {
    en: {
      legendApproved: "Approved Saturday Van Stop (#1–#4)",
      legendPromoted: "Auditor Final 4 Exhaustive Search (#3)",
      legendRejected: "Not Chosen — Human Decision (13121011431)",
      legendClinic: "Fixed Safety-Net Clinic (FQHC)",
      toggleRejected: showRejectedPin
        ? "Hide Unselected Pin (13121011431)"
        : "Show Unselected Pin (13121011431)",
      countyLineLabel: "Fulton / Clayton–DeKalb County Border",
      borderClinicTag: "North Fulton / Sandy Springs Corridor",
      activePinLabel: "Active Map Selection",
    },
    es: {
      legendApproved: "Parada Aprobada (#1–#4)",
      legendPromoted: "Selección Exhaustiva (#3)",
      legendRejected: "No Elegido — Decisión Humana (13121011431)",
      legendClinic: "Clínica Fija de Red de Seguridad (FQHC)",
      toggleRejected: showRejectedPin
        ? "Ocultar Pin No Elegido (11431)"
        : "Mostrar Pin No Elegido (11431)",
      countyLineLabel: "Límite Condado Fulton / Clayton–DeKalb",
      borderClinicTag: "Corredor Sandy Springs / North Fulton",
      activePinLabel: "Selección Activa en Mapa",
    },
    vi: {
      legendApproved: "Điểm Đỗ Được Duyệt (#1–#4)",
      legendPromoted: "Điểm Tìm kiếm Toàn diện (#3)",
      legendRejected: "Không Chọn — Quyết định Con người (13121011431)",
      legendClinic: "Phòng khám An sinh Cố định (FQHC)",
      toggleRejected: showRejectedPin
        ? "Ẩn Điểm Không Chọn (11431)"
        : "Hiện Điểm Không Chọn (11431)",
      countyLineLabel: "Ranh giới Quận Fulton / Clayton–DeKalb",
      borderClinicTag: "Hành lang Sandy Springs / Bắc Fulton",
      activePinLabel: "Điểm Đang Chọn trên Bản đồ",
    },
  }[locale];

  return (
    <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col">
      {/* Header Bar */}
      <div className="p-4 sm:px-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-900/90">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30">
              GIS · FIPS 13121
            </span>
            <h3 className="text-sm sm:text-base font-bold text-white">
              {locale === "en" && "Fulton County Street-Level Dispatch & Audit Map"}
              {locale === "es" && "Mapa de Despacho y Auditoría del Condado de Fulton"}
              {locale === "vi" && "Bản đồ Điều phối & Kiểm toán Thực địa Quận Fulton"}
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {locale === "en" &&
              "Click any numbered pin (#1–#4) to inspect tract metrics, scale labels, and Saturday event advisories."}
            {locale === "es" &&
              "Haga clic en cualquier pin (#1–#4) para ver métricas, escala y avisos de eventos del sábado."}
            {locale === "vi" &&
              "Nhấp vào các ghim (#1–#4) để xem chỉ số phân khu, nhãn quy mô và cảnh báo sự kiện Thứ Bảy."}
          </p>
        </div>

        <button
          type="button"
          onClick={onToggleRejectedPin}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer flex items-center gap-1.5 ${
            showRejectedPin
              ? "bg-rose-500/20 border-rose-500/50 text-rose-200"
              : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          {labels.toggleRejected}
        </button>
      </div>

      {/* Interactive SVG Map Canvas */}
      <div className="relative w-full h-[380px] sm:h-[420px] bg-slate-950 select-none overflow-hidden">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid slice"
          className="w-full h-full"
        >
          <defs>
            <pattern
              id="mapGrid"
              width="10"
              height="10"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 10 0 L 0 0 0 10"
                fill="none"
                stroke="#1e293b"
                strokeWidth="0.3"
              />
            </pattern>
            <radialGradient id="needGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="rejectGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* 12km EPA Grid Overlay */}
          <rect width="100" height="100" fill="url(#mapGrid)" />

          {/* Stylized Fulton County Polygon (Southwest / South Fulton focus) */}
          <polygon
            points="68,8 82,16 74,36 63,52 60,72 48,74 34,88 12,86 16,66 28,48 44,30 56,14"
            fill="#0f172a"
            stroke="#334155"
            strokeWidth="0.8"
          />

          {/* County Border Line (Southeast / Clayton & DeKalb Border) */}
          <path
            d="M 63,52 L 60,72 L 48,74 L 34,88"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="0.7"
            strokeDasharray="2,1.5"
          />
          <text
            x="61"
            y="67"
            fill="#fbbf24"
            fontSize="2.3"
            fontWeight="600"
          >
            {labels.countyLineLabel}
          </text>

          {/* Major Highways (I-285, I-85, I-75, I-20, Campbellton Rd) */}
          {/* I-20 East-West */}
          <path
            d="M 10,43 Q 48,44 90,42"
            fill="none"
            stroke="#334155"
            strokeWidth="1.1"
          />
          <text x="15" y="41.5" fill="#64748b" fontSize="2.2">
            I-20 W
          </text>

          {/* I-75 / I-85 Connector North-South */}
          <path
            d="M 60,12 L 54,44 L 54,75"
            fill="none"
            stroke="#475569"
            strokeWidth="1.3"
          />
          <text x="55.5" y="34" fill="#64748b" fontSize="2.2">
            I-75 / I-85
          </text>

          {/* I-85 South / Roosevelt Hwy Corridor */}
          <path
            d="M 52,48 L 36,68 L 18,86"
            fill="none"
            stroke="#475569"
            strokeWidth="1.1"
          />
          <text x="20" y="74" fill="#64748b" fontSize="2.1">
            I-85 S / US-29
          </text>

          {/* I-285 Perimeter Loop */}
          <path
            d="M 30,36 C 24,55 32,72 56,70 C 66,68 70,50 64,34"
            fill="none"
            stroke="#334155"
            strokeWidth="0.9"
            strokeDasharray="1.5,1"
          />
          <text x="24" y="52" fill="#64748b" fontSize="2.1">
            I-285
          </text>

          {/* Existing Fixed Safety-Net Clinics (Downtown/Midtown Cluster + Cross-Border Clinic) */}
          {[
            { x: 53, y: 38, label: "Grady / Downtown FQHC Hub" },
            { x: 46, y: 42, label: "West End Safety-Net Clinic" },
          ].map((clinic, idx) => (
            <g key={idx} transform={`translate(${clinic.x}, ${clinic.y})`}>
              <rect
                x="-1.6"
                y="-1.6"
                width="3.2"
                height="3.2"
                rx="0.6"
                fill="#38bdf8"
                stroke="#0284c7"
                strokeWidth="0.4"
              />
              <text
                x="2.4"
                y="0.8"
                fill="#7dd3fc"
                fontSize="2.1"
                fontWeight="500"
              >
                {clinic.label}
              </text>
            </g>
          ))}

          {/* Cross-Border Safety-Net Clinic that triggered Auditor Rejection */}
          {showRejectedPin && (
            <g>
              {/* Dashed red distance line between Rejected Stop (47,66) and Border Clinic (51,69) */}
              <line
                x1={REJECTED_DRAFT_STOP.coordinates.x}
                y1={REJECTED_DRAFT_STOP.coordinates.y}
                x2={51}
                y2={69}
                stroke="#fb7185"
                strokeWidth="0.8"
                strokeDasharray="1.2,1.2"
              />
              {/* Border clinic icon */}
              <g transform="translate(51, 69)">
                <rect
                  x="-1.8"
                  y="-1.8"
                  width="3.6"
                  height="3.6"
                  rx="0.6"
                  fill="#f59e0b"
                  stroke="#fff"
                  strokeWidth="0.4"
                />
                <text
                  x="2.6"
                  y="1.2"
                  fill="#fde68a"
                  fontSize="2.2"
                  fontWeight="700"
                >
                  {labels.borderClinicTag}
                </text>
              </g>

              {/* Rejected Pin (Tract 13121007808) */}
              <g
                transform={`translate(${REJECTED_DRAFT_STOP.coordinates.x}, ${REJECTED_DRAFT_STOP.coordinates.y})`}
              >
                <circle r="6" fill="url(#rejectGlow)" />
                <circle
                  r="2.6"
                  fill="#e11d48"
                  stroke="#fecdd3"
                  strokeWidth="0.6"
                />
                <text
                  x="0"
                  y="0.9"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="2.4"
                  fontWeight="800"
                >
                  ✕
                </text>
                <text
                  x="-3.5"
                  y="-3.6"
                  fill="#fda4af"
                  fontSize="2.2"
                  fontWeight="700"
                >
                  Not Chosen ({REJECTED_DRAFT_STOP.tractFips})
                </text>
              </g>
            </g>
          )}

          {/* 4 Approved Saturday Van Stops */}
          {RECOMMENDED_STOPS.map((stop) => {
            const isSelected = stop.rank === selectedRank;
            const isPromoted = stop.status === "promoted_round_2";
            return (
              <g
                key={stop.tractFips}
                transform={`translate(${stop.coordinates.x}, ${stop.coordinates.y})`}
                onClick={() => onSelectRank(stop.rank)}
                className="cursor-pointer"
              >
                <circle
                  r={isSelected ? "9" : "5.5"}
                  fill="url(#needGlow)"
                />
                {isSelected && (
                  <circle
                    r="4.6"
                    fill="none"
                    stroke="#2dd4bf"
                    strokeWidth="0.6"
                    strokeDasharray="1.5,1"
                  />
                )}
                <circle
                  r={isSelected ? "3.3" : "2.7"}
                  fill={
                    isPromoted
                      ? "#8b5cf6"
                      : isSelected
                      ? "#14b8a6"
                      : "#0d9488"
                  }
                  stroke="#ffffff"
                  strokeWidth={isSelected ? "0.8" : "0.5"}
                />
                <text
                  x="0"
                  y="1"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="2.5"
                  fontWeight="800"
                >
                  {stop.rank}
                </text>
                <text
                  x="4.2"
                  y="0.8"
                  fill={isSelected ? "#5eead4" : "#e2e8f0"}
                  fontSize={isSelected ? "2.6" : "2.2"}
                  fontWeight={isSelected ? "700" : "600"}
                >
                  #{stop.rank} {stop.tractFips.slice(-6)}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Floating Active Tract Overlay Card on Map */}
        <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-sm bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl p-3 shadow-lg">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {labels.activePinLabel} · #{selectedStop.rank}
            </span>
            <span className="text-[11px] font-mono text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
              Tract {selectedStop.tractFips}
            </span>
          </div>
          <p className="text-xs sm:text-sm font-bold text-white mt-1">
            {selectedStop.neighborhood[locale]}
          </p>
          <p className="text-[11px] text-slate-300 mt-0.5">
            {selectedStop.siteName[locale]} ({selectedStop.siteAddress})
          </p>
          <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-amber-300 font-medium flex items-center gap-1">
              <CalendarClock className="w-3.5 h-3.5" />
              {selectedStop.advisories.length}{" "}
              {locale === "en"
                ? "Saturday Execution Advisories"
                : locale === "es"
                ? "Avisos de Ejecución"
                : "Cảnh báo Thực thi"}
            </span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Score {selectedStop.needScore}
            </span>
          </div>
        </div>
      </div>

      {/* Legend Footer */}
      <div className="px-4 py-3 bg-slate-900 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-300">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-teal-500 border border-white shrink-0" />
          <span>{labels.legendApproved}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-violet-500 border border-white shrink-0" />
          <span>{labels.legendPromoted}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-rose-600 border border-white shrink-0" />
          <span>{labels.legendRejected}</span>
        </div>
        <div className="flex items-center gap-2">
          <Building2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <span>{labels.legendClinic}</span>
        </div>
      </div>
    </div>
  );
}
