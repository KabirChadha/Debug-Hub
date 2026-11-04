"use client";

import React from "react";
import { Zap, ShieldCheck, Video, CheckCircle, Sparkles } from "lucide-react";

export function BenefitsBanner() {
  const benefits = [
    {
      id: "turnaround",
      badge: "Emergency SLA",
      title: "1-2 Hour Turnaround",
      highlight: "Guaranteed express queue",
      description:
        "Submission deadline in 3 hours? We assign a dedicated senior engineer immediately to triage syntax, runtime crashes, and container errors before your professor opens the portal.",
      icon: Zap,
      accentColor: "from-orange-500/20 to-amber-500/10",
      stats: "Avg. triage time: 47 mins",
      actionText: "See Rush Protocols",
      actionType: "info",
    },
    {
      id: "security",
      badge: "Zero Exposure",
      title: "Anonymous & Encrypted",
      highlight: "256-bit memory scrub",
      description:
        "Your academic identity stays 100% private. We don't ask for your college name, roll number, or upload code to public Git repos. All code files are auto-purged post delivery.",
      icon: ShieldCheck,
      accentColor: "from-orange-600/20 to-orange-500/10",
      stats: "Zero-log anonymous policy",
      actionText: "Security Details",
      actionType: "info",
    },
    {
      id: "verification",
      badge: "Zero-Error Guarantee",
      title: "Run Verification & Proof Video",
      highlight: "Execution proof included",
      description:
        "Never submit unverified code. Every debugged project includes an HD screen recording demonstrating error-free build, API execution, and clean test suite runs.",
      icon: Video,
      accentColor: "from-amber-500/20 to-orange-500/15",
      stats: "Verified screen recording included",
      actionText: "Verified Run",
      actionType: "info",
    },
  ];

  return (
    <section className="relative z-10 py-12 sm:py-16 border-y border-[#27272a] bg-[#000000]">
      {/* Subtle orange accent glow behind benefits */}
      <div className="absolute inset-0 bg-radial from-orange-500/5 via-transparent to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header pill */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#18181b] border border-[#27272a] text-xs text-orange-400 font-mono mb-3 shadow-[0_0_15px_rgba(249,115,22,0.1)]">
            <Sparkles className="w-3.5 h-3.5 text-orange-400" />
            <span>THE CAMPUS CODE-FIX PLEDGE</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Engineered Exclusively for Engineering Students
          </h2>
          <p className="mt-2 text-sm text-[#a1a1aa]">
            No generic advice or StackOverflow copy-pastes. Real software engineers delivering running code and academic confidence.
          </p>
        </div>

        {/* 3 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {benefits.map((b) => {
            const Icon = b.icon;
            return (
              <div
                key={b.id}
                className="group relative flex flex-col justify-between p-6 rounded-2xl bg-[#18181b] border border-[#27272a] hover:border-orange-500/50 hover:shadow-[0_0_30px_rgba(249,115,22,0.15)] transition-all duration-300"
              >
                {/* Top Badge & Icon */}
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-xl bg-[#09090b] border border-[#27272a] group-hover:border-orange-500/60 flex items-center justify-center text-orange-500 transition-colors shadow-inner">
                      <Icon className="w-6 h-6 text-orange-500 group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
                      {b.badge}
                    </span>
                  </div>

                  {/* Title & Highlight */}
                  <h3 className="text-lg font-bold text-white group-hover:text-orange-400 transition-colors">
                    {b.title}
                  </h3>
                  <p className="text-xs font-mono text-zinc-400 mt-1 mb-3">
                    ⚡ {b.highlight}
                  </p>

                  {/* Description */}
                  <p className="text-xs text-[#a1a1aa] leading-relaxed">
                    {b.description}
                  </p>
                </div>

                {/* Bottom Stats & Trigger */}
                <div className="mt-6 pt-4 border-t border-[#27272a]/80 flex items-center justify-between">
                  <span className="text-[11px] text-zinc-400 font-mono">
                    {b.stats}
                  </span>

                  <div className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-400">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Verified</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Micro trust guarantee bar */}
        <div className="mt-8 p-4 rounded-xl bg-[#18181b]/60 border border-[#27272a] flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-orange-500 font-bold">100% Zero-Risk Rule:</span>
            <span className="text-zinc-300">
              If the code does not execute cleanly on your machine or cloud sandbox, you pay ₹0.
            </span>
          </div>
          <div className="flex items-center gap-3 text-zinc-400 font-mono text-[11px]">
            <span>🔒 AES-256 Bit</span>
            <span>•</span>
            <span>⚡ Fast-Track Queue</span>
            <span>•</span>
            <span>🎯 Run Guaranteed</span>
          </div>
        </div>

      </div>
    </section>
  );
}
