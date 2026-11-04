"use client";

import React, { useState } from "react";
import { Terminal, CheckCircle2, AlertTriangle, RefreshCw, ShieldCheck } from "lucide-react";

export function InteractiveDebugDemo() {
  const [activeTab, setActiveTab] = useState<"after" | "before">("after");
  const [isSimulating, setIsSimulating] = useState(false);

  const handleSimulate = () => {
    setIsSimulating(true);
    setTimeout(() => setIsSimulating(false), 600);
  };

  return (
    <div className="w-full rounded-2xl bg-[#18181b] border border-[#27272a] shadow-2xl overflow-hidden glow-orange-border">
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#09090b] border-b border-[#27272a]">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
          </div>
          <span className="text-xs font-mono text-zinc-400 ml-2 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-orange-400" />
            capstone-debug-sandbox ~ bash
          </span>
        </div>

        {/* Before / After toggle */}
        <div className="flex items-center gap-1 bg-[#18181b] p-0.5 rounded-lg border border-[#27272a]">
          <button
            onClick={() => setActiveTab("before")}
            className={`px-2.5 py-1 rounded text-[11px] font-mono transition-all cursor-pointer ${
              activeTab === "before"
                ? "bg-red-950/60 text-red-400 border border-red-800/50 font-bold"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            ❌ Broken Project
          </button>
          <button
            onClick={() => setActiveTab("after")}
            className={`px-2.5 py-1 rounded text-[11px] font-mono transition-all cursor-pointer ${
              activeTab === "after"
                ? "bg-orange-500 text-white font-bold shadow-[0_0_12px_rgba(249,115,22,0.4)]"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            ⚡ Fixed + Verified
          </button>
        </div>
      </div>

      {/* Terminal Body */}
      <div className="p-4 sm:p-5 font-mono text-xs sm:text-[13px] bg-[#09090b] min-h-[260px] flex flex-col justify-between">
        {activeTab === "before" ? (
          <div className="space-y-2 text-zinc-400 animate-in fade-in duration-150">
            <p className="text-zinc-500">$ npm run build && docker-compose up</p>
            <p className="text-zinc-300">
              [+] Building 14.2s (6/8)
            </p>
            <p className="text-red-400 font-semibold">
              ERR! TypeError: Cannot read properties of undefined (reading &apos;session&apos;)
            </p>
            <p className="text-red-400/90 pl-3 border-l-2 border-red-500/50 text-[11px]">
              at AuthCallbackHandler (src/auth/session.ts:84:19)<br />
              at processTicksAndRejections (node:internal/process/task_queues:95:5)
            </p>
            <p className="text-amber-400 text-xs">
              ⚠️ Container exited with code 1. Database migrations failed: lock timeout.
            </p>
            <div className="p-2.5 mt-3 rounded-lg bg-red-950/20 border border-red-900/40 text-red-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>Submission Due in 2 hours: Zero marks if presentation server fails.</span>
            </div>
          </div>
        ) : (
          <div className="space-y-2 text-zinc-300 animate-in fade-in duration-150">
            <p className="text-zinc-500">$ ./campus-fix-verify.sh --stack=nextjs-supabase-ml</p>
            <p className="text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              [✓] Session race-condition patched in `src/auth/session.ts`
            </p>
            <p className="text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              [✓] Postgres connection pool limits tuned (RLS policies validated)
            </p>
            <p className="text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              [✓] Next.js 14 production build: 0 errors in 3.8s (Static + SSR ready)
            </p>
            <p className="text-orange-400 font-semibold flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-orange-400" />
              [⚡] Ready on http://localhost:3000 (Docker Container Status: Healthy)
            </p>

            <div className="p-3 mt-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-white font-medium">Execution Verified &amp; Clean Source Delivered</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                0 Errors
              </span>
            </div>
          </div>
        )}

        {/* Terminal Action Bar */}
        <div className="pt-3 mt-4 border-t border-[#27272a] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSimulate}
              disabled={isSimulating}
              className="px-2.5 py-1 rounded-md bg-[#18181b] hover:bg-[#27272a] text-zinc-300 hover:text-white flex items-center gap-1.5 border border-[#27272a] transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 text-orange-400 ${isSimulating ? "animate-spin" : ""}`} />
              <span>{isSimulating ? "Testing..." : "Rerun Diagnostic"}</span>
            </button>
            <span className="text-zinc-500 text-[11px] hidden sm:inline">
              Latency: 18ms
            </span>
          </div>

          <div className="flex items-center gap-2 text-zinc-400 text-[11px]">
            <span className="text-emerald-400">● 100% Guaranteed Run</span>
            <span className="text-zinc-600">|</span>
            <span className="text-orange-400">or ₹0 charged</span>
          </div>
        </div>
      </div>
    </div>
  );
}
