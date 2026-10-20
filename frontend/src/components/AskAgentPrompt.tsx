"use client";

import React, { useState } from "react";
import { Locale } from "@/data/contractData";
import {
  Send,
  Sparkles,
  Bot,
  Database,
  ShieldCheck,
  MapPin,
  Loader2,
  MessageSquareText,
  X,
} from "lucide-react";

interface AgentContribution {
  agent: "Scouts" | "Planner" | "Auditor" | "Explainer";
  role: string;
  finding: string;
}

interface AskResponse {
  ok: boolean;
  question: string;
  answer: string;
  focusRank: number | null;
  contributions: AgentContribution[];
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
      badge: "INTERACTIVE COORDINATOR Q&A · POWERED BY BIGQUERY a4i_health",
      title: "Ask the AI Planning Team a Question",
      subtitle:
        "Ask why a neighborhood was or wasn't chosen, check Saturday traffic/event impacts, or type any Fulton County Tract ID (e.g., 13121011431) for a live BigQuery lookup.",
      placeholder:
        "Ask anything (e.g., “Why wasn't Tract 11431 chosen?” or “Which stop needs Spanish flyers?”)...",
      askBtn: "Ask Agents",
      askingBtn: "Consulting Agents...",
      suggestedLabel: "Try a common coordinator question:",
      jumpBtn: "Highlight Stop on Map & Cards",
      clearBtn: "Clear Answer",
      suggestions: [
        "Why wasn't Tract 13121011431 (34.6% uninsured) chosen?",
        "Why is Saturday #1 (10125) 20.1 km from an adult clinic?",
        "Which Saturday stop needs a Spanish interpreter & flyers?",
        "Is flu, COVID, or air pollution rising in a specific neighborhood?",
        "What public events or road work affect our 4 Saturdays?",
      ],
    },
    es: {
      badge: "PREGUNTAS INTERACTIVAS · CONECTADO A BIGQUERY a4i_health",
      title: "Pregunte al Equipo de Planificación de IA",
      subtitle:
        "Pregunte por qué se eligió o descartó un vecindario, consulte eventos del sábado o escriba cualquier código de Tracto (ej. 13121011431) para consultar BigQuery en vivo.",
      placeholder:
        "Escriba su pregunta (ej. “¿Por qué no se eligió el Tracto 11431?” o “¿Qué parada necesita español?”)...",
      askBtn: "Preguntar",
      askingBtn: "Consultando...",
      suggestedLabel: "Preguntas frecuentes del coordinador:",
      jumpBtn: "Ver Parada en el Mapa",
      clearBtn: "Cerrar Respuesta",
      suggestions: [
        "¿Por qué no se eligió el Tracto 13121011431 (34.6% sin seguro)?",
        "¿Por qué el Sábado #1 (10125) está a 20.1 km de una clínica para adultos?",
        "¿Qué parada del sábado necesita intérprete y folletos en español?",
        "¿Está subiendo el COVID, la gripe o la contaminación en algún vecindario?",
        "¿Qué eventos públicos o cierres viales afectan los 4 sábados?",
      ],
    },
    vi: {
      badge: "HỎI ĐÁP TRỰC TIẾP · KẾT NỐI BIGQUERY a4i_health",
      title: "Đặt Câu hỏi cho Đội ngũ Trợ lý AI",
      subtitle:
        "Hỏi lý do chọn hoặc loại một khu dân cư, kiểm tra sự kiện Thứ Bảy, hoặc nhập mã Phân khu (ví dụ 13121011431) để truy vấn BigQuery trực tiếp.",
      placeholder:
        "Nhập câu hỏi (ví dụ: “Tại sao không chọn Phân khu 11431?” hoặc “Điểm nào cần tiếng Tây Ban Nha?”)...",
      askBtn: "Hỏi AI",
      askingBtn: "Đang truy vấn...",
      suggestedLabel: "Câu hỏi gợi ý cho điều phối viên:",
      jumpBtn: "Xem Điểm đỗ trên Bản đồ",
      clearBtn: "Đóng Câu trả lời",
      suggestions: [
        "Tại sao Phân khu 13121011431 (34.6% không bảo hiểm) không được chọn?",
        "Tại sao Thứ Bảy #1 (10125) cách phòng khám người lớn tới 20.1 km?",
        "Điểm đỗ nào cần thông dịch viên và tờ rơi tiếng Tây Ban Nha?",
        "Cúm, COVID hay ô nhiễm không khí có tăng ở khu phố cụ thể nào không?",
        "Những sự kiện hay công trình giao thông nào ảnh hưởng 4 ngày Thứ Bảy?",
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

        {/* Multi-Agent Answer Card */}
        {response && response.ok && (
          <div className="mt-4 rounded-2xl bg-slate-900 text-white p-5 space-y-4 border border-slate-800 animate-in fade-in duration-150">
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  <Bot className="w-4 h-4" />
                </span>
                <div>
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-teal-300">
                    5-Agent Verified Response
                  </div>
                  <div className="text-xs font-semibold text-slate-300">
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

            {/* Plain-Language Answer */}
            <p className="text-sm text-slate-100 leading-relaxed whitespace-pre-line">
              {response.answer}
            </p>

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
                    <div className="text-[11px] font-semibold text-white">
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
