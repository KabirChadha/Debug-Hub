"use client";

import React from "react";
import { X, FileText, HelpCircle, Code2, ShieldAlert, Sparkles } from "lucide-react";

interface VivaPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VivaPreviewModal({ isOpen, onClose }: VivaPreviewModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-3xl max-h-[90vh] bg-[#18181b] border border-[#27272a] rounded-2xl shadow-2xl overflow-y-auto p-6 text-left glow-orange-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#27272a] sticky top-0 bg-[#18181b]/95 backdrop-blur z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-500">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">
                  Sample 1-Page Viva Defense Sheet
                </h3>
                <span className="text-[10px] font-semibold bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Included Free With Every Fix
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Created by senior developers to help you ace oral examinations and code reviews
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Viva Document Paper Simulation */}
        <div className="mt-6 bg-[#09090b] border border-[#27272a] rounded-xl p-6 font-sans space-y-6 text-sm">
          {/* Top Bar of Sheet */}
          <div className="flex flex-wrap items-center justify-between border-b border-[#27272a] pb-4 gap-2">
            <div>
              <span className="text-xs text-orange-400 font-mono font-semibold tracking-wide uppercase">
                {"// CONFIDENTIAL CAPSTONE DEFENSE DOSSIER"}
              </span>
              <h4 className="text-base font-bold text-white mt-1">
                Project: AI Health Diagnostic Portal &amp; Realtime Triage Engine
              </h4>
            </div>
            <div className="text-right">
              <span className="text-xs text-zinc-500 block">Stack Tested</span>
              <span className="text-xs font-mono text-zinc-300">FastAPI + Next.js 14 + Supabase</span>
            </div>
          </div>

          {/* Section 1: Architecture Summary */}
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-orange-400 uppercase tracking-wider">
              <Code2 className="w-4 h-4" />
              1. 60-Second Architecture Pitch (Memorize this for the intro)
            </div>
            <p className="text-xs text-zinc-300 mt-2 leading-relaxed bg-[#18181b] p-3.5 rounded-lg border border-[#27272a]">
              &quot;Our system adopts a microservice-style decoupled architecture. The frontend uses Next.js 14 with Server Components to minimize client bundle size, while asynchronous inferencing is handled via a FastAPI Python microservice running asynchronous worker queues. Relational state and row-level security policies are enforced at the Supabase database layer.&quot;
            </p>
          </div>

          {/* Section 2: Root Cause & How It Was Fixed */}
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-orange-400 uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4" />
              2. The Fatal Bug &amp; The Solution (In case professor asks what went wrong)
            </div>
            <div className="grid sm:grid-cols-2 gap-3 mt-2 text-xs">
              <div className="p-3 bg-red-950/20 border border-red-900/40 rounded-lg">
                <span className="text-red-400 font-semibold block mb-1">What Was Crashing:</span>
                <p className="text-zinc-400 leading-normal">
                  Connection pool exhaustion and unhandled CORS headers in WebSocket handshake when simultaneous telemetry events fired.
                </p>
              </div>
              <div className="p-3 bg-emerald-950/20 border border-emerald-900/40 rounded-lg">
                <span className="text-emerald-400 font-semibold block mb-1">How It Was Engineered:</span>
                <p className="text-zinc-400 leading-normal">
                  Implemented singleton DB connection pooling with explicit timeouts, and standardized CORS headers with preflight origin verification.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Top 3 Anticipated Viva Questions */}
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-orange-400 uppercase tracking-wider">
              <HelpCircle className="w-4 h-4" />
              3. Anticipated Viva / Examiner Questions &amp; Precise Answers
            </div>

            <div className="space-y-3 mt-3">
              <div className="p-3.5 bg-[#18181b] border border-[#27272a] rounded-lg">
                <p className="text-xs font-semibold text-white">
                  Q1: &quot;Why did you choose PostgreSQL / Supabase over MongoDB for this capstone?&quot;
                </p>
                <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                  <span className="text-orange-400 font-medium">Your Answer:</span> &quot;Our medical diagnostic schema requires strict referential integrity between patient records and doctor audit logs. Postgres gives ACID compliance, and Supabase Row Level Security (RLS) ensures patients can never query another user&apos;s records at the database protocol level.&quot;
                </p>
              </div>

              <div className="p-3.5 bg-[#18181b] border border-[#27272a] rounded-lg">
                <p className="text-xs font-semibold text-white">
                  Q2: &quot;What is the computational complexity of your recommendation algorithm?&quot;
                </p>
                <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                  <span className="text-orange-400 font-medium">Your Answer:</span> &quot;By vectorizing similarity checks using cosine similarity with indexed embeddings, query latency is reduced from O(N) linear scan to O(log N) through Hierarchical Navigable Small World (HNSW) indexing.&quot;
                </p>
              </div>

              <div className="p-3.5 bg-[#18181b] border border-[#27272a] rounded-lg">
                <p className="text-xs font-semibold text-white">
                  Q3: &quot;How does your code prevent memory leaks during real-time streaming?&quot;
                </p>
                <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                  <span className="text-orange-400 font-medium">Your Answer:</span> &quot;All subscription sockets implement explicit teardown logic in the `useEffect` cleanup hook, preventing detached DOM node references and uncollected callback listeners.&quot;
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Sparkles className="w-4 h-4 text-orange-400" />
            <span>Delivered in PDF &amp; Markdown format with every completed ticket.</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-xl shadow-[0_0_15px_rgba(249,115,22,0.3)] transition-all cursor-pointer"
          >
            Got It, Close Preview
          </button>
        </div>
      </div>
    </div>
  );
}
