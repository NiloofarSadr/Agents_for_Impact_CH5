"use client";

import React, { useState } from "react";
import { Locale } from "@/data/contractData";
import {
  Send,
  Sparkles,
  Bot,
  Database,
  ShieldCheck,
  ShieldAlert,
  MapPin,
  Loader2,
  MessageSquareText,
  FileCode2,
  X,
} from "lucide-react";

interface AgentContribution {
  agent: "Scouts" | "Planner" | "Auditor" | "Explainer";
  role: string;
  finding: string;
}

interface AskResponse {
  ok: boolean;
  inCorpus: boolean;
  question: string;
  answer: string;
  focusRank: number | null;
  contributions: AgentContribution[];
  corpusSources?: string[];
  dataWarning?: string;
  liveTractRow?: Record<string, unknown> | null;
  answeredAt?: string;
}

export function AskAgentPrompt({
  locale,
  onSelectRank,
}: {
  locale: Locale;
  onSelectRank?: (rank: number) => void;
}) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AskResponse | null>(null);

  const copy = {
    en: {
      badge: "STRICT REPO CORPUS Q&A · a4i_health + sql/*.sql + docs/*.md ONLY",
      title: "Ask the AI Planning Team (Restricted to Repo Data Sources)",
      subtitle:
        "Answers are strictly bounded to verified repo files (`docs/HANDOFF.md`, `docs/findings.md`, `docs/scoring.md`, `sql/*.sql`, `scripts/pick4.py`) and live `a4i_health` BigQuery tables. Out-of-corpus questions are automatically refused.",
      placeholder:
        "Ask a repo-grounded question or type any Fulton Tract ID (e.g., 10125, 11431, 10214)...",
      askBtn: "Query Corpus",
      askingBtn: "Checking Repo Corpus...",
      suggestedLabel: "Repo corpus questions (from README.md & docs/HANDOFF.md):",
      jumpBtn: "Highlight Stop on Map & Cards",
      clearBtn: "Clear Answer",
      sourcesLabel: "Repo Data Sources Cited:",
      inCorpusBadge: "VERIFIED IN REPO CORPUS",
      outOfCorpusBadge: "GUARDRAIL: OUTSIDE REPO CORPUS",
      suggestions: [
        "Where should the van go next month, and what 3 drafts were rejected?",
        "Why wasn't Tract 13121011431 (34.6% uninsured) chosen?",
        "How do school clinics and prison checks affect distance (`tract_access_adult`)?",
        "Has the federal government designated any shortage areas in Fulton?",
        "Is COVID, flu, or PM2.5 air pollution rising in this neighborhood?",
        "How long does it take to get there on the bus?",
      ],
    },
    es: {
      badge: "CONSULTA ESTRICTA DEL CORPUS · SOLO a4i_health + sql/*.sql + docs/*.md",
      title: "Pregunte al Equipo de IA (Restringido a Fuentes del Repositorio)",
      subtitle:
        "Las respuestas provienen exclusivamente de archivos verificados del repositorio (`docs/HANDOFF.md`, `docs/findings.md`, `sql/*.sql`, `scripts/pick4.py`) y tablas de BigQuery `a4i_health`. Las preguntas fuera del corpus son rechazadas.",
      placeholder:
        "Pregunte sobre el corpus del repo o escriba un código de Tracto (ej. 10125, 11431, 10214)...",
      askBtn: "Consultar Corpus",
      askingBtn: "Verificando Corpus...",
      suggestedLabel: "Preguntas del corpus del repositorio (README.md y docs/HANDOFF.md):",
      jumpBtn: "Ver Parada en el Mapa",
      clearBtn: "Cerrar Respuesta",
      sourcesLabel: "Fuentes de Datos del Repositorio Citadas:",
      inCorpusBadge: "VERIFICADO EN EL CORPUS DEL REPO",
      outOfCorpusBadge: "BLOQUEADO: FUERA DEL CORPUS DEL REPO",
      suggestions: [
        "¿Adónde debe ir la camioneta y qué 3 borradores fueron rechazados?",
        "¿Por qué no se eligió el Tracto 13121011431 (34.6% sin seguro)?",
        "¿Cómo afectan las clínicas escolares y la prisión a la distancia (`tract_access_adult`)?",
        "¿El gobierno federal ha designado áreas de escasez en Fulton?",
        "¿Está subiendo el COVID, la gripe o el PM2.5 en este vecindario?",
        "¿Cuánto tiempo toma llegar en autobús?",
      ],
    },
    vi: {
      badge: "HỎI ĐÁP NGHIÊM NGẶT THEO KHO DỮ LIỆU REPO · a4i_health + sql/*.sql + docs/*.md",
      title: "Hỏi Đội ngũ AI (Chỉ Trả lời từ Nguồn Dữ liệu trong Repo)",
      subtitle:
        "Câu trả lời chỉ sử dụng dữ liệu đã xác minh trong repo (`docs/HANDOFF.md`, `docs/findings.md`, `sql/*.sql`, `scripts/pick4.py`) và bảng BigQuery `a4i_health`. Câu hỏi ngoài phạm vi sẽ bị từ chối.",
      placeholder:
        "Đặt câu hỏi trong phạm vi repo hoặc nhập mã Phân khu (ví dụ: 10125, 11431, 10214)...",
      askBtn: "Truy vấn Corpus",
      askingBtn: "Đang kiểm tra Corpus...",
      suggestedLabel: "Câu hỏi chuẩn từ kho dữ liệu repo (README.md & docs/HANDOFF.md):",
      jumpBtn: "Xem Điểm đỗ trên Bản đồ",
      clearBtn: "Đóng Câu trả lời",
      sourcesLabel: "Nguồn Dữ liệu Repo Được Trích dẫn:",
      inCorpusBadge: "ĐÃ XÁC MINH TRONG REPO CORPUS",
      outOfCorpusBadge: "CHẶN: NGOÀI NGUỒN DỮ LIỆU REPO",
      suggestions: [
        "Xe khám nên đi đâu tháng tới và 3 bản nháp nào đã bị bác bỏ?",
        "Tại sao Phân khu 13121011431 (34.6% không bảo hiểm) không được chọn?",
        "Phòng khám trường học và nhà tù ảnh hưởng thế nào đến khoảng cách (`tract_access_adult`)?",
        "Chính phủ liên bang có chỉ định vùng thiếu hụt y tế nào ở Fulton không?",
        "COVID, cúm hay bụi mịn PM2.5 có tăng ở khu phố này không?",
        "Đi xe buýt đến đó mất bao lâu?",
      ],
    },
  }[locale];

  const submitQuestion = async (qText: string) => {
    const trimmed = qText.trim();
    if (!trimmed || loading) return;
    setQuery(trimmed);
    setLoading(true);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed, locale }),
      });
      const data = await res.json();
      setResponse(data);
      if (data.focusRank && onSelectRank) {
        onSelectRank(data.focusRank);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-white rounded-2xl border-2 border-teal-600/30 shadow-md overflow-hidden">
      <div className="p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-full">
              <MessageSquareText className="w-3.5 h-3.5 text-teal-600" />
              {copy.badge}
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1.5">
              {copy.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              {copy.subtitle}
            </p>
          </div>
        </div>

        {/* Prompt Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submitQuestion(query);
          }}
          className="flex flex-col sm:flex-row gap-2.5"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={copy.placeholder}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent text-sm text-slate-900 placeholder:text-slate-400"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white transition cursor-pointer shrink-0 shadow-xs"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {copy.askingBtn}
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                {copy.askBtn}
              </>
            )}
          </button>
        </form>

        {/* Suggested Quick Prompts */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-teal-600" />
            {copy.suggestedLabel}
          </div>
          <div className="flex flex-wrap gap-2">
            {copy.suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => submitQuestion(suggestion)}
                className="text-left text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-900 border border-slate-200 hover:border-teal-300 transition cursor-pointer"
              >
                “{suggestion}”
              </button>
            ))}
          </div>
        </div>

        {/* Multi-Agent Corpus Answer Card */}
        {response && response.ok && (
          <div className="mt-4 rounded-2xl bg-slate-900 text-white p-5 space-y-4 border border-slate-800 animate-in fade-in duration-150">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span
                  className={`p-1.5 rounded-lg border ${
                    response.inCorpus
                      ? "bg-teal-500/20 text-teal-300 border-teal-500/30"
                      : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                  }`}
                >
                  {response.inCorpus ? (
                    <Bot className="w-4 h-4" />
                  ) : (
                    <ShieldAlert className="w-4 h-4" />
                  )}
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        response.inCorpus
                          ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                          : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                      }`}
                    >
                      {response.inCorpus
                        ? copy.inCorpusBadge
                        : copy.outOfCorpusBadge}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-300 mt-1">
                    Q: “{response.question}”
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setResponse(null)}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
                {copy.clearBtn}
              </button>
            </div>

            {/* Grounded Answer */}
            <p className="text-sm text-slate-100 leading-relaxed whitespace-pre-line">
              {response.answer}
            </p>

            {/* Exact Repo Corpus Files & Tables Cited */}
            {response.corpusSources && response.corpusSources.length > 0 && (
              <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-3 space-y-1.5">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-teal-300 flex items-center gap-1.5">
                  <FileCode2 className="w-3.5 h-3.5" />
                  {copy.sourcesLabel}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {response.corpusSources.map((src, i) => (
                    <span
                      key={i}
                      className="text-[11px] font-mono bg-slate-900 text-slate-200 border border-slate-700 px-2.5 py-0.5 rounded-md"
                    >
                      {src}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Agent Contributions Strip */}
            {response.contributions && response.contributions.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                {response.contributions.map((c, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl bg-slate-800/90 border border-slate-700 p-3 space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px] font-extrabold text-teal-300">
                      <span>{c.agent} Agent</span>
                      <Database className="w-3 h-3 text-teal-400" />
                    </div>
                    <div className="text-[11px] font-mono font-semibold text-amber-300">
                      {c.role}
                    </div>
                    <p className="text-[11px] text-slate-300 leading-snug">
                      {c.finding}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Data Provenance Warning + Map Jump Button */}
            <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
              {response.dataWarning ? (
                <span className="text-amber-300 flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  {response.dataWarning}
                </span>
              ) : (
                <span />
              )}

              {response.focusRank && onSelectRank && (
                <button
                  type="button"
                  onClick={() => onSelectRank(response.focusRank!)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-teal-500 text-slate-950 hover:bg-teal-400 transition cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  {copy.jumpBtn} (#{response.focusRank})
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
