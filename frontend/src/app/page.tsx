"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Locale,
  UI_STRINGS,
  RECOMMENDED_STOPS,
  REJECTED_DRAFT_STOP,
  EQUITY_AUDIT_DATA,
  LIMITATIONS_LIST,
  EXPLAINER_FLYER,
  SESSION_STATE_SNAPSHOT,
  ScaleType,
  MethodType,
} from "@/data/contractData";
import { FultonMap } from "@/components/FultonMap";
import {
  Globe,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Calendar,
  MapPin,
  Database,
  CheckSquare,
  Square,
  ArrowRight,
  FileText,
  Terminal,
  Users,
  EyeOff,
  Compass,
  Activity,
  Truck,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Printer,
  RefreshCw,
  Megaphone,
  Construction,
  Bus,
  CloudSun,
  Handshake,
} from "lucide-react";

const PIPELINE_STEPS = [
  {
    id: "scouts",
    name: "3 Scouts (Parallel)",
    keyWritten: "ev_burden, ev_access, ev_context",
    ruleNote: "BigQuery a4i_health · No race columns",
  },
  {
    id: "planner_v1",
    name: "Plan A & B Rejected",
    keyWritten: "plan_draft (v1)",
    ruleNote: "Plan A Black=0.53 FLAG; Plan B 0.45km from clinic",
  },
  {
    id: "auditor_v1",
    name: "Greedy Plan C Rejected",
    keyWritten: "audit_revisions",
    ruleNote: "11431+06602 gave Black=0.45 FLAG",
  },
  {
    id: "planner_v2",
    name: "Exhaustive Search (623 Sets)",
    keyWritten: "plan_draft (v2)",
    ruleNote: "10125, 06900, 11307, 09405 (Need 9.16)",
  },
  {
    id: "auditor_eq",
    name: "Auditor + Composer + Explainer",
    keyWritten: "audit_equity, outreach",
    ruleNote: "Zero flags (1.02/0.81/0.88/1.04) · EN/ES/VI",
  },
];

interface LiveBigQueryPayload {
  ok: boolean;
  projectId?: string;
  dataset?: string;
  queriedAt?: string;
  latencyMs?: number;
  final4Tracts?: string[];
  planCTop30?: Array<Record<string, unknown>>;
  scoutBurden?: Array<Record<string, unknown>>;
  scoutAccess?: Array<Record<string, unknown>>;
  scoutAir?: Record<string, unknown> | null;
  scoutDiseaseLatest?: Record<string, unknown> | null;
  auditDemographics?: Array<Record<string, unknown>>;
  equityRatios?: {
    black: number;
    hispanic: number;
    white: number;
    asian: number;
  } | null;
  error?: string;
}

interface LiveRepoSyncPayload {
  ok: boolean;
  repoRoot?: string;
  syncedAt?: string;
  git?: {
    branch: string;
    lastCommit: {
      hash: string;
      subject: string;
      date: string;
      author: string;
    };
    remoteUrl: string;
  };
  docs?: {
    handoffMd: string;
    findingsMd: string;
    scoringMd: string;
  };
  sqlFiles?: Record<string, string>;
  error?: string;
}

export default function ClinicVanPlannerPage() {
  const [locale, setLocale] = useState<Locale>("en");
  const [selectedRank, setSelectedRank] = useState<number>(1);
  const [showRejectedPin, setShowRejectedPin] = useState<boolean>(true);
  const [showWhiteboard, setShowWhiteboard] = useState<boolean>(false);
  const [inspectorTab, setInspectorTab] = useState<
    "bigquery" | "repo" | "whiteboard"
  >("bigquery");
  const [flyerLangMode, setFlyerLangMode] = useState<"active" | "bilingual">(
    "bilingual"
  );
  const [copiedFlyer, setCopiedFlyer] = useState<boolean>(false);
  const [eventFilter, setEventFilter] = useState<
    "all" | "selected" | "critical" | "opportunity"
  >("selected");

  // Live Repo & BigQuery connection state
  const [liveBq, setLiveBq] = useState<LiveBigQueryPayload | null>(null);
  const [liveRepo, setLiveRepo] = useState<LiveRepoSyncPayload | null>(null);
  const [isFetchingLive, setIsFetchingLive] = useState<boolean>(false);

  // Pipeline simulation state
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [activePipelineStep, setActivePipelineStep] = useState<number>(4);

  // Coordinator action checklist state
  const [checkedActions, setCheckedActions] = useState<Record<string, boolean>>({
    "adv-1a": true,
    "adv-2a": true,
    "adv-3a": true,
    "adv-4a": true,
  });

  const fetchLiveRepoAndBigQuery = useCallback(async () => {
    setIsFetchingLive(true);
    try {
      const [repoRes, bqRes] = await Promise.all([
        fetch("/api/repo-sync", { cache: "no-store" }),
        fetch("/api/bigquery", { cache: "no-store" }),
      ]);
      const [repoJson, bqJson] = await Promise.all([
        repoRes.json(),
        bqRes.json(),
      ]);
      setLiveRepo(repoJson);
      setLiveBq(bqJson);
    } catch (err) {
      console.error("Live sync error:", err);
    } finally {
      setIsFetchingLive(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveRepoAndBigQuery();
  }, [fetchLiveRepoAndBigQuery]);

  const t = UI_STRINGS[locale];
  const activeStop =
    RECOMMENDED_STOPS.find((s) => s.rank === selectedRank) ||
    RECOMMENDED_STOPS[0];

  const handleRunSimulation = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setActivePipelineStep(0);
    fetchLiveRepoAndBigQuery();
    [1, 2, 3, 4].forEach((stepIndex, idx) => {
      setTimeout(() => {
        setActivePipelineStep(stepIndex);
        if (stepIndex === 4) {
          setIsSimulating(false);
        }
      }, (idx + 1) * 650);
    });
  };

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
      };
    }
    if (scale === "grid_12km") {
      return {
        label: t.scaleGrid,
        classes: "bg-amber-50 text-amber-800 border-amber-300",
      };
    }
    return {
      label: t.scaleRegion,
      classes: "bg-purple-50 text-purple-800 border-purple-300",
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

  // Filtered advisories for the Execution Radar section
  const allAdvisoriesWithStop = RECOMMENDED_STOPS.flatMap((stop) =>
    stop.advisories.map((adv) => ({ ...adv, stop }))
  );

  const displayedAdvisories = allAdvisoriesWithStop.filter((item) => {
    if (eventFilter === "selected") return item.stop.rank === selectedRank;
    if (eventFilter === "critical")
      return item.severity === "critical" || item.severity === "caution";
    if (eventFilter === "opportunity") return item.severity === "opportunity";
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Civic Agency Strip */}
      <div className="bg-slate-950 text-slate-200 text-xs py-2 px-4 sm:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{t.govBanner}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-slate-400">
            <button
              type="button"
              onClick={() => {
                setInspectorTab("bigquery");
                setShowWhiteboard(true);
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-emerald-950/90 text-emerald-300 border border-emerald-700/60 hover:bg-emerald-900/80 transition cursor-pointer"
            >
              <Database className="w-3 h-3 text-emerald-400" />
              {isFetchingLive
                ? "Querying BigQuery a4i_health..."
                : liveBq?.ok
                ? `LIVE BigQuery (${liveBq.projectId}.a4i_health · ${liveBq.latencyMs}ms)`
                : "BigQuery Snapshot Ready"}
            </button>

            <button
              type="button"
              onClick={() => {
                setInspectorTab("repo");
                setShowWhiteboard(true);
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-sky-950/90 text-sky-300 border border-sky-700/60 hover:bg-sky-900/80 transition cursor-pointer"
            >
              <Terminal className="w-3 h-3 text-sky-400" />
              {liveRepo?.ok && liveRepo.git
                ? `Repo: ${liveRepo.git.branch}@${liveRepo.git.lastCommit.hash} (HANDOFF.md + ${
                    Object.keys(liveRepo.sqlFiles || {}).length
                  } SQL)`
                : "Repo: Agents_for_Impact_CH5"}
            </button>

            <span className="text-teal-400 font-mono font-semibold">
              {t.countyLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Main Sticky Navigation & Multi-Lingual Bar */}
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
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                  Google ADK · Live BigQuery + Repo Synced
                </span>
              </div>
              <p className="text-xs text-slate-500">{t.appSubtitle}</p>
            </div>
          </div>

          {/* Right Controls: Multi-Lingual Switcher + Action Buttons */}
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
              onClick={handleRunSimulation}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition cursor-pointer shadow-xs"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  isSimulating || isFetchingLive
                    ? "animate-spin text-teal-400"
                    : "text-teal-400"
                }`}
              />
              {isSimulating ? t.runningPipelineBtn : t.runPipelineBtn}
            </button>

            <button
              type="button"
              onClick={() => setShowWhiteboard(!showWhiteboard)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                showWhiteboard
                  ? "bg-amber-50 border-amber-400 text-amber-900"
                  : "bg-white border-slate-300 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-amber-600" />
              {t.viewWhiteboardBtn}
            </button>

            <a
              href="#explainer-flyer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-teal-600 text-white hover:bg-teal-700 transition shadow-xs"
            >
              <FileText className="w-3.5 h-3.5" />
              {t.printFlyerBtn}
            </a>
          </div>
        </div>

        {/* Collapsible Live BigQuery + Git Repo + `session.state` Drawer */}
        {showWhiteboard && (
          <div className="bg-slate-900 text-slate-100 border-t border-slate-800 px-4 sm:px-8 py-4">
            <div className="max-w-7xl mx-auto space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setInspectorTab("bigquery")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      inspectorTab === "bigquery"
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    <Database className="w-3.5 h-3.5" />
                    1. Live BigQuery (`a4i_health` SQL Output)
                  </button>
                  <button
                    type="button"
                    onClick={() => setInspectorTab("repo")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      inspectorTab === "repo"
                        ? "bg-sky-600 text-white"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    2. Live Repo Files (`docs/HANDOFF.md` & `sql/*.sql`)
                  </button>
                  <button
                    type="button"
                    onClick={() => setInspectorTab("whiteboard")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      inspectorTab === "whiteboard"
                        ? "bg-teal-600 text-white"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    3. ADK `session.state` Contract
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={fetchLiveRepoAndBigQuery}
                    className="text-xs text-teal-300 hover:text-teal-200 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${
                        isFetchingLive ? "animate-spin" : ""
                      }`}
                    />
                    Re-query BigQuery & Repo
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowWhiteboard(false)}
                    className="text-xs text-slate-400 hover:text-white cursor-pointer"
                  >
                    Close ✕
                  </button>
                </div>
              </div>

              {inspectorTab === "bigquery" && (
                <pre className="text-[11px] font-mono bg-slate-950 p-3.5 rounded-xl border border-slate-800 overflow-x-auto max-h-72 text-emerald-300">
                  {JSON.stringify(
                    liveBq || { status: "Loading live BigQuery results..." },
                    null,
                    2
                  )}
                </pre>
              )}

              {inspectorTab === "repo" && (
                <pre className="text-[11px] font-mono bg-slate-950 p-3.5 rounded-xl border border-slate-800 overflow-x-auto max-h-72 text-sky-300">
                  {JSON.stringify(
                    liveRepo || { status: "Loading repo files..." },
                    null,
                    2
                  )}
                </pre>
              )}

              {inspectorTab === "whiteboard" && (
                <pre className="text-[11px] font-mono bg-slate-950 p-3.5 rounded-xl border border-slate-800 overflow-x-auto max-h-72 text-amber-300">
                  {JSON.stringify(
                    {
                      ...SESSION_STATE_SNAPSHOT,
                      _liveBigQuerySync: liveBq
                        ? {
                            projectId: liveBq.projectId,
                            queriedAt: liveBq.queriedAt,
                            latencyMs: liveBq.latencyMs,
                            liveEquityRatios: liveBq.equityRatios,
                          }
                        : null,
                    },
                    null,
                    2
                  )}
                </pre>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-8 py-6 space-y-8">
        {/* 1. AGENT CONSENSUS BANNER & 5-AGENT WORKFLOW TRACE */}
        <section className="bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950 text-white rounded-2xl p-5 sm:p-6 shadow-lg border border-slate-800">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
            <div className="space-y-1.5 max-w-4xl">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-teal-300 bg-teal-500/15 border border-teal-400/30 px-2.5 py-0.5 rounded-full">
                <Sparkles className="w-3.5 h-3.5" />
                {t.pitchBannerTag}
              </div>
              <p className="text-sm sm:text-base font-medium text-slate-100 leading-relaxed">
                {t.pitchBannerText}
              </p>
            </div>
            <div className="shrink-0 bg-slate-800/90 border border-slate-700 rounded-xl px-4 py-3 text-xs space-y-1">
              <div className="text-slate-400 font-medium">
                {locale === "en" && "Coordinator Query"}
                {locale === "es" && "Consulta del Coordinador"}
                {locale === "vi" && "Câu hỏi Điều phối viên"}
              </div>
              <div className="font-semibold text-white flex items-center gap-1.5">
                <span>“Where should the van go next month?”</span>
              </div>
              <div className="text-[11px] text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Revise Loop Converged in Round 2 (Max 2)</span>
              </div>
            </div>
          </div>

          {/* 5-Agent Pipeline Stepper */}
          <div className="pt-4">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-semibold text-slate-300">
                {t.agentOfficeTitle}
              </span>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                {t.agentOfficeSubtitle}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
              {PIPELINE_STEPS.map((step, index) => {
                const isComplete = index <= activePipelineStep;
                const isCurrent = index === activePipelineStep && isSimulating;
                return (
                  <div
                    key={step.id}
                    className={`rounded-xl p-3 border transition ${
                      isCurrent
                        ? "bg-teal-500/20 border-teal-400 ring-2 ring-teal-400/40"
                        : isComplete
                        ? "bg-slate-800/80 border-slate-700"
                        : "bg-slate-900/40 border-slate-800 opacity-50"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-teal-300">
                        Step {index + 1} · {step.name}
                      </span>
                      {isComplete && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-amber-300 mt-1 truncate">
                      → {step.keyWritten}
                    </div>
                    <div className="text-[11px] text-slate-300 mt-0.5">
                      {step.ruleNote}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 2. PROMINENT AGENT RECOMMENDATIONS: 4 SATURDAY DEPLOYMENT CARDS */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
                {t.prominentRecsTag}
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-0.5">
                {t.prominentRecsTitle}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5 max-w-3xl">
                {t.prominentRecsDesc}
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>
                {locale === "en" && "All 4 sites verified >6 km from cross-border clinics"}
                {locale === "es" && "4 sitios verificados a >6 km de clínicas fronterizas"}
                {locale === "vi" && "Cả 4 điểm đã xác minh cách >6 km từ phòng khám giáp ranh"}
              </span>
            </div>
          </div>

          {/* 4 Prominent Recommendation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {RECOMMENDED_STOPS.map((stop) => {
              const isSelected = stop.rank === selectedRank;
              const isPromoted = stop.status === "promoted_round_2";
              const criticalCount = stop.advisories.filter(
                (a) => a.severity === "critical" || a.severity === "caution"
              ).length;
              const oppCount = stop.advisories.filter(
                (a) => a.severity === "opportunity"
              ).length;

              return (
                <div
                  key={stop.tractFips}
                  onClick={() => setSelectedRank(stop.rank)}
                  className={`rounded-2xl p-4 sm:p-5 border transition-all cursor-pointer flex flex-col justify-between relative ${
                    isSelected
                      ? "bg-white border-teal-600 ring-2 ring-teal-600/25 shadow-md"
                      : "bg-white border-slate-200 hover:border-teal-400 hover:shadow-sm"
                  }`}
                >
                  <div>
                    {/* Top Row: Saturday Badge + Score */}
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                          isPromoted
                            ? "bg-violet-100 text-violet-900 border border-violet-300"
                            : isSelected
                            ? "bg-teal-700 text-white"
                            : "bg-slate-100 text-slate-800"
                        }`}
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        Sat #{stop.rank} · {stop.saturdayDate.slice(5)}
                      </span>

                      <div className="text-right">
                        <div className="text-lg font-black text-slate-900 leading-none">
                          {stop.needScore}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500">
                          CI {stop.scoreCi}
                        </div>
                      </div>
                    </div>

                    {/* Auditor Verification Pill */}
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-mono font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                        Tract {stop.tractFips}
                      </span>
                      {isPromoted ? (
                        <span className="text-[11px] font-bold bg-violet-50 text-violet-800 px-2 py-0.5 rounded border border-violet-200">
                          ★ Round 2 Auditor Fix
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                          ✓ Auditor Verified
                        </span>
                      )}
                    </div>

                    {/* Neighborhood & Site */}
                    <h3 className="text-base font-bold text-slate-900 mt-2 leading-snug">
                      {stop.neighborhood[locale]}
                    </h3>
                    <p className="text-xs font-medium text-teal-800 mt-1 flex items-start gap-1">
                      <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{stop.siteName[locale]}</span>
                    </p>

                    {/* Supportive Reason Snippet */}
                    <p className="text-xs text-slate-600 mt-2.5 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      {stop.headlineReason[locale]}
                    </p>

                    {/* Top 2 Highlight Metrics with Scale/Method Pills */}
                    <div className="mt-3 space-y-1.5">
                      {stop.metrics.slice(0, 2).map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between text-xs bg-slate-50/80 px-2.5 py-1.5 rounded-lg border border-slate-200/80"
                        >
                          <span className="text-slate-700 font-medium truncate pr-2">
                            {m.label[locale]}
                          </span>
                          <span className="font-bold text-slate-900 shrink-0">
                            {m.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Card Footer: Public Events / Execution Impact Count */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5">
                      {criticalCount > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 font-semibold">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          {criticalCount} Alert{criticalCount > 1 ? "s" : ""}
                        </span>
                      )}
                      {oppCount > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-900 border border-emerald-200 font-semibold">
                          +{oppCount} Co-Locate
                        </span>
                      )}
                    </div>
                    <span
                      className={`font-bold flex items-center gap-0.5 ${
                        isSelected ? "text-teal-700" : "text-slate-500"
                      }`}
                    >
                      {isSelected
                        ? locale === "en"
                          ? "Inspecting"
                          : locale === "es"
                          ? "Activo"
                          : "Đang xem"
                        : locale === "en"
                        ? "Inspect"
                        : locale === "es"
                        ? "Ver"
                        : "Xem"}
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 3. SELECTED STOP DEEP-DIVE: SUPPORTIVE DATA (LEFT) + MAP & EXECUTION EVENTS (RIGHT) */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT 7 COLUMNS: Supportive Data & Agent Rationale */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-5">
              {/* Stop Header */}
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-700 text-white">
                      {activeStop.saturdayLabel[locale]}
                    </span>
                    <span className="text-xs font-mono font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md">
                      FIPS {activeStop.tractFips}
                    </span>
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900 mt-2">
                    {activeStop.neighborhood[locale]}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-4 h-4 text-teal-700 shrink-0" />
                    <span>
                      <strong>{activeStop.siteName[locale]}</strong> ·{" "}
                      {activeStop.siteAddress}
                    </span>
                  </p>
                </div>

                <div className="bg-teal-50 border border-teal-200 rounded-xl px-4 py-2.5 text-right">
                  <div className="text-[11px] font-bold uppercase text-teal-800">
                    {t.needScoreLabel}
                  </div>
                  <div className="text-2xl font-black text-teal-950">
                    {activeStop.needScore}{" "}
                    <span className="text-xs font-normal text-teal-700">
                      / 100 ({activeStop.scoreCi})
                    </span>
                  </div>
                </div>
              </div>

              {/* Multi-Agent Consensus Callouts (Planner + Auditor + Scouts) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-teal-700" />
                    <span>Planner Agent</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                    {activeStop.agentConsensus.planner[locale]}
                  </p>
                </div>

                <div className="bg-emerald-50/60 rounded-xl p-3.5 border border-emerald-200">
                  <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span>Auditor Agent</span>
                  </div>
                  <p className="text-xs text-emerald-900 mt-1.5 leading-relaxed">
                    {activeStop.agentConsensus.auditor[locale]}
                  </p>
                </div>

                <div className="bg-indigo-50/60 rounded-xl p-3.5 border border-indigo-200">
                  <div className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-indigo-700" />
                    <span>3 Scout Agents</span>
                  </div>
                  <p className="text-xs text-indigo-900 mt-1.5 leading-relaxed">
                    {activeStop.agentConsensus.scouts[locale]}
                  </p>
                </div>
              </div>

              {/* Supportive Evidence Table with Mandatory Scale & Modeled/Measured Badges */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm sm:text-base font-bold text-slate-900">
                    {t.whyChosenTitle}
                  </h4>
                  <span className="text-[11px] font-medium text-slate-500">
                    {t.scaleLegendTitle}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeStop.metrics.map((metric) => {
                    const scaleBadge = getScaleBadge(metric.scale);
                    const methodBadge = getMethodBadge(metric.method);
                    return (
                      <div
                        key={metric.id}
                        className={`rounded-xl p-3.5 border transition ${
                          metric.highlight
                            ? "bg-teal-50/40 border-teal-300 shadow-2xs"
                            : "bg-white border-slate-200"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-bold text-slate-800">
                            {metric.label[locale]}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0">
                            {metric.agent}
                          </span>
                        </div>

                        <div className="mt-2 flex items-baseline justify-between">
                          <span className="text-2xl font-black text-slate-900">
                            {metric.value}
                          </span>
                          <span className="text-xs font-semibold text-teal-800">
                            {metric.countyComparison[locale]}
                          </span>
                        </div>

                        {/* Mandatory Scale & Modeled-vs-Measured Badges */}
                        <div className="mt-3 flex flex-wrap items-center gap-1.5">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${scaleBadge.classes}`}
                          >
                            Scale: {scaleBadge.label}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${methodBadge.classes}`}
                          >
                            {methodBadge.label}
                          </span>
                        </div>

                        <div className="mt-1.5 text-[11px] text-slate-500 font-mono truncate">
                          Source: {metric.source}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recommended Clinical Services on Van */}
              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-700">
                  {locale === "en" && "Recommended Van Inventory Focus:"}
                  {locale === "es" && "Enfoque Clínico Recomendado en la Unidad:"}
                  {locale === "vi" && "Trọng tâm Dịch vụ Trên Xe Lưu động:"}
                </span>
                {activeStop.servicesFocus.map((svc, i) => (
                  <span
                    key={i}
                    className="text-xs font-medium bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg border border-slate-200"
                  >
                    • {svc[locale]}
                  </span>
                ))}
              </div>
            </div>

            {/* 4. "THE ARGUMENT" PANEL (DEMO MOMENT: WHERE AGENT REJECTED ITS OWN ANSWER) */}
            <div className="bg-white rounded-2xl border-2 border-amber-300/90 shadow-xs p-5 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                    {t.argumentPanelTag}
                  </span>
                  <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1">
                    {t.argumentPanelTitle}
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {t.argumentPanelDesc}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRank(3);
                    setShowRejectedPin(true);
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-900 text-white hover:bg-amber-800 transition cursor-pointer"
                >
                  {locale === "en" && "Highlight Saturday #3 Swap on Map"}
                  {locale === "es" && "Ver Reemplazo del Sábado #3 en Mapa"}
                  {locale === "vi" && "Xem Điểm Thay thế Thứ Bảy #3 Trên Bản đồ"}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {/* Step 1: Planner Draft v1 */}
                <div className="rounded-xl p-4 bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">
                      {t.round1Label}
                    </span>
                    <span className="text-[11px] font-mono bg-slate-200 text-slate-800 px-2 py-0.5 rounded">
                      13121007808
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-900">
                    {REJECTED_DRAFT_STOP.neighborhood[locale]}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {REJECTED_DRAFT_STOP.plannerDraftReason[locale]}
                  </p>
                </div>

                {/* Step 2: Auditor Method Objection */}
                <div className="rounded-xl p-4 bg-rose-50/80 border border-rose-300 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-900 flex items-center gap-1">
                      <XCircle className="w-4 h-4 text-rose-600" />
                      {t.auditorObjectionLabel}
                    </span>
                  </div>
                  <p className="text-xs text-rose-950 font-medium leading-relaxed">
                    {REJECTED_DRAFT_STOP.auditorRejection[locale]}
                  </p>
                </div>

                {/* Step 3: Planner Round 2 Fix */}
                <div className="rounded-xl p-4 bg-emerald-50/80 border border-emerald-300 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      {t.round2FixLabel}
                    </span>
                    <span className="text-[11px] font-mono bg-emerald-200/70 text-emerald-950 px-2 py-0.5 rounded font-bold">
                      13121011306
                    </span>
                  </div>
                  <p className="text-xs text-emerald-950 font-medium leading-relaxed">
                    {REJECTED_DRAFT_STOP.plannerFix[locale]}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT 5 COLUMNS: Interactive Map + Public Events & Clinic Execution Radar */}
          <div className="lg:col-span-5 space-y-6">
            <FultonMap
              locale={locale}
              selectedRank={selectedRank}
              onSelectRank={setSelectedRank}
              showRejectedPin={showRejectedPin}
              onToggleRejectedPin={() => setShowRejectedPin(!showRejectedPin)}
            />

            {/* PUBLICLY KNOWN EVENTS & STREET-LEVEL EXECUTION RADAR */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                    <Calendar className="w-3.5 h-3.5" />
                    {locale === "en" && "FIELD OPERATIONS & PUBLIC EVENTS"}
                    {locale === "es" && "OPERACIONES Y EVENTOS PÚBLICOS"}
                    {locale === "vi" && "SỰ KIỆN CÔNG CỘNG & VẬN HÀNH"}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    {Object.values(checkedActions).filter(Boolean).length} /{" "}
                    {allAdvisoriesWithStop.length}{" "}
                    {locale === "en"
                      ? "Actions Ready"
                      : locale === "es"
                      ? "Listos"
                      : "Đã chuẩn bị"}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                  {t.executionRadarTitle}
                </h3>
                <p className="text-xs text-slate-600">{t.executionRadarDesc}</p>
              </div>

              {/* Filter Pills */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  {
                    id: "selected",
                    label:
                      locale === "en"
                        ? `Saturday #${selectedRank} Only (${activeStop.advisories.length})`
                        : locale === "es"
                        ? `Solo Sábado #${selectedRank} (${activeStop.advisories.length})`
                        : `Chỉ Thứ Bảy #${selectedRank} (${activeStop.advisories.length})`,
                  },
                  {
                    id: "all",
                    label: `${t.filterAllEvents} (${allAdvisoriesWithStop.length})`,
                  },
                  { id: "critical", label: t.filterCritical },
                  { id: "opportunity", label: t.filterOpportunities },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() =>
                      setEventFilter(
                        tab.id as
                          | "all"
                          | "selected"
                          | "critical"
                          | "opportunity"
                      )
                    }
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      eventFilter === tab.id
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Advisory Cards List */}
              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                {displayedAdvisories.map((adv) => {
                  const isChecked = !!checkedActions[adv.id];
                  const badgeStyles =
                    adv.severity === "critical"
                      ? "bg-rose-100 text-rose-900 border-rose-300"
                      : adv.severity === "caution"
                      ? "bg-amber-100 text-amber-900 border-amber-300"
                      : "bg-emerald-100 text-emerald-900 border-emerald-300";

                  const severityLabel =
                    adv.severity === "critical"
                      ? locale === "en"
                        ? "Critical Execution Impact"
                        : locale === "es"
                        ? "Impacto Crítico"
                        : "Ảnh hưởng Nghiêm trọng"
                      : adv.severity === "caution"
                      ? locale === "en"
                        ? "Traffic / Transit Caution"
                        : locale === "es"
                        ? "Precaución Vial / Tránsito"
                        : "Lưu ý Giao thông"
                      : locale === "en"
                      ? "Co-Location Opportunity"
                      : locale === "es"
                      ? "Oportunidad de Co-Ubicación"
                      : "Cơ hội Phối hợp";

                  return (
                    <div
                      key={adv.id}
                      className="rounded-xl p-3.5 border border-slate-200 bg-slate-50/70 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          {getCategoryIcon(adv.category)}
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded border ${badgeStyles}`}
                          >
                            {severityLabel}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono font-semibold text-slate-600">
                          Sat #{adv.stop.rank} · {adv.stop.saturdayDate.slice(5)}
                        </span>
                      </div>

                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                        {adv.title[locale]}
                      </h4>
                      <div className="text-[11px] font-medium text-slate-500">
                        {adv.timeWindow[locale]}
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {adv.impact[locale]}
                      </p>

                      {/* Actionable Coordinator Mitigation Checkbox */}
                      <button
                        type="button"
                        onClick={() => toggleChecklist(adv.id)}
                        className={`w-full text-left p-2.5 rounded-lg border text-xs flex items-start gap-2 transition cursor-pointer ${
                          isChecked
                            ? "bg-emerald-50/90 border-emerald-300 text-emerald-950"
                            : "bg-white border-slate-300 text-slate-800 hover:border-teal-500"
                        }`}
                      >
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <span className="font-bold block text-[11px] uppercase tracking-wide text-slate-500">
                            {t.coordinatorActionLabel}:
                          </span>
                          <span className="font-medium">
                            {adv.actionRequired[locale]}
                          </span>
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* 5. POST-HOC EQUITY AUDIT (`audit_equity`) & "WHAT WE COULD NOT TELL YOU" */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Equity Audit (7 cols) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-purple-900 bg-purple-100 px-2.5 py-0.5 rounded-full border border-purple-300">
                  <Users className="w-3.5 h-3.5 text-purple-700" />
                  {t.equityPanelTag}
                </span>
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1">
                  {t.equityPanelTitle}
                </h3>
              </div>
              <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200">
                Key: session.state[&quot;audit_equity&quot;]
              </span>
            </div>

            <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200 text-xs text-purple-950 font-medium flex items-start gap-2">
              <EyeOff className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
              <span>{t.equityPanelRule}</span>
            </div>

            <div className="space-y-3">
              {EQUITY_AUDIT_DATA.demographics.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs sm:text-sm font-bold text-slate-900">
                      {item.group[locale]}
                    </span>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="font-bold text-teal-800">
                        Plan Share: {item.planShare}
                      </span>
                      <span className="text-slate-500">
                        Fulton Uninsured Benchmark:{" "}
                        {item.countyUninsuredBenchmark}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-700">
                    {item.status[locale]}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* What We Could Not Tell You (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-300">
                Composer Rulebook · Honest Boundaries
              </span>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1">
                {t.limitationsTitle}
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                {t.limitationsSubtitle}
              </p>
            </div>

            <ul className="space-y-3">
              {LIMITATIONS_LIST.map((lim, i) => (
                <li
                  key={i}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed flex items-start gap-2.5"
                >
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 font-bold flex items-center justify-center shrink-0 text-[11px]">
                    {i + 1}
                  </span>
                  <span>{lim[locale]}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 6. EXPLAINER AGENT MULTI-LINGUAL COMMUNITY FLYER (`outreach`) */}
        <section
          id="explainer-flyer"
          className="bg-white rounded-2xl border-2 border-teal-600/30 shadow-md p-5 sm:p-8 space-y-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                {t.flyerSectionTag}
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
                {t.flyerSectionTitle}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                {t.flyerSectionDesc}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setFlyerLangMode("bilingual")}
                  className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer ${
                    flyerLangMode === "bilingual"
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-600"
                  }`}
                >
                  Side-by-Side (English + Español)
                </button>
                <button
                  type="button"
                  onClick={() => setFlyerLangMode("active")}
                  className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer ${
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

          {/* Flyer Preview Grid */}
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
