"use client";

import React from "react";
import Link from "next/link";
import { Layers, Sparkles, SlidersHorizontal } from "lucide-react";

export function VersionSwitcher({
  activeVersion,
}: {
  activeVersion: "full" | "simple";
}) {
  return (
    <div className="bg-teal-950 text-white border-b border-teal-800/80 px-4 sm:px-8 py-2">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 font-semibold text-teal-200">
          <Layers className="w-3.5 h-3.5 text-teal-400" />
          <span>UI Comparison Mode: Compare both versions side-by-side</span>
        </div>

        <div className="inline-flex items-center bg-slate-900/90 p-1 rounded-xl border border-teal-800">
          <Link
            href="/simple"
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${
              activeVersion === "simple"
                ? "bg-teal-500 text-slate-950 shadow-xs"
                : "text-teal-200 hover:text-white"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Version B: Simplified Coordinator View (/simple)
          </Link>

          <Link
            href="/"
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${
              activeVersion === "full"
                ? "bg-teal-500 text-slate-950 shadow-xs"
                : "text-teal-200 hover:text-white"
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Version A: Full Technical / Judge View (/)
          </Link>
        </div>
      </div>
    </div>
  );
}
