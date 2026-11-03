"use client";

import React from "react";
import { Zap } from "lucide-react";
import { IntakeForm } from "./IntakeForm";

export function SubmitSection() {
  return (
    <section id="submit-code" className="py-16 sm:py-24 bg-[#09090b] relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#18181b] border border-orange-500/30 text-xs text-orange-400 font-mono mb-3 shadow-[0_0_15px_rgba(249,115,22,0.15)]">
            <Zap className="w-3.5 h-3.5 text-orange-400" />
            <span>INSTANT DISPATCH PROTOCOL</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Anonymous Client Intake Portal
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#a1a1aa]">
            Directly upload your project zip. Assigned to a senior engineer on shift within 5 minutes.
          </p>
        </div>

        {/* The Intake Form Component */}
        <IntakeForm />

      </div>
    </section>
  );
}
