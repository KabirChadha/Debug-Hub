"use client";

import React, { useState } from "react";
import { 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  Search
} from "lucide-react";
import { InteractiveDebugDemo } from "./InteractiveDebugDemo";
import { OrderTrackerModal } from "./OrderTrackerModal";

export function Hero() {
  const [isTrackerModalOpen, setIsTrackerModalOpen] = useState(false);

  return (
    <>
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 bg-[#09090b]">
        {/* Glow Effects in Background */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-orange-600/15 to-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-orange-500/5 rounded-full blur-[90px] pointer-events-none" />

        {/* Tech Grid Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: High Conversion Copy */}
            <div className="lg:col-span-7 space-y-6 text-left">
              
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#18181b] border border-orange-500/30 text-xs text-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.15)]">
                <span className="flex h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                <span className="font-semibold tracking-wide">Emergency Capstone &amp; Lab Submission Triage</span>
                <span className="text-zinc-600">|</span>
                <span className="text-zinc-300 font-mono">100% Student Confidential</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
                Review &amp; Capstone Code Debugging —{" "}
                <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(249,115,22,0.4)]">
                  Guaranteed Run or ₹0 Charge
                </span>
              </h1>

              {/* Muted Zinc Body */}
              <p className="text-base sm:text-lg text-[#a1a1aa] leading-relaxed max-w-2xl">
                Don&apos;t risk your grade on runtime crashes, broken migrations, Docker container failures, or compilation errors right before project evaluation. 
                Our vetted senior software engineers fix your repository in <strong className="text-white font-semibold">1–2 hours</strong> with verified run execution, clean code archives, and direct zero-error proof recordings.
              </p>

              {/* Key Bullet Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs sm:text-sm text-zinc-300">
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center flex-shrink-0 border border-orange-500/30">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <span><strong>Zero Risk:</strong> If code doesn&apos;t run cleanly, ₹0 charged</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center flex-shrink-0 border border-orange-500/30">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <span><strong>Express SLA:</strong> Average 47-minute diagnosis &amp; patch</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center flex-shrink-0 border border-orange-500/30">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <span><strong>Anonymous:</strong> No college roll numbers or name logs</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center flex-shrink-0 border border-orange-500/30">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <span><strong>Verified Proof:</strong> Screen recording of zero-error run</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <a
                  href="#submit-code"
                  className="px-7 py-4 rounded-xl text-sm font-bold bg-orange-500 hover:bg-orange-600 text-white transition-all duration-200 shadow-[0_0_25px_rgba(249,115,22,0.4)] hover:shadow-[0_0_35px_rgba(249,115,22,0.6)] flex items-center justify-center gap-2.5 group cursor-pointer"
                >
                  <span>Fix My Capstone Code Now</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>

                <button
                  type="button"
                  onClick={() => setIsTrackerModalOpen(true)}
                  className="px-6 py-4 rounded-xl text-sm font-semibold bg-[#18181b] hover:bg-[#27272a] text-zinc-200 border border-[#27272a] hover:border-orange-500/50 hover:ring-2 hover:ring-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Search className="w-4 h-4 text-orange-400" />
                  <span>Track Live Ticket</span>
                </button>
              </div>

              {/* Micro proof badges */}
              <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-zinc-400 border-t border-[#27272a]/60">
                <div className="flex items-center gap-2">
                  <span className="text-orange-400 font-bold">★★★★★</span>
                  <span className="text-zinc-300 font-medium">4.9 / 5</span>
                  <span>(2,400+ Engineering Students)</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-zinc-300">Sanitized Environment</span>
                </div>
              </div>

            </div>

            {/* Right Column: Live Diagnostic Terminal Demo */}
            <div className="lg:col-span-5">
              <div className="relative">
                {/* Glow behind terminal */}
                <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/30 to-amber-500/20 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
                
                <InteractiveDebugDemo />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Tracker Modal */}
      <OrderTrackerModal
        isOpen={isTrackerModalOpen}
        onClose={() => setIsTrackerModalOpen(false)}
      />
    </>
  );
}
