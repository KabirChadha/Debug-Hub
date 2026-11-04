"use client";

import React, { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: "What exactly is the 'Guaranteed Run or ₹0 Charge' guarantee?",
      a: "It's simple: we guarantee that your project builds, starts, and executes its core capstone demonstration cleanly on your local machine or cloud target without fatal errors. We provide a screen recording proof before delivery. If it fails to execute as agreed, you do not pay a single rupee.",
    },
    {
      q: "How fast is the 1-2 Hour Turnaround for emergency college deadlines?",
      a: "When you select emergency rush, your ticket bypasses the queue and is immediately picked up by an active senior engineer on shift. Most compiler failures, dependency incompatibilities, and async crashes are diagnosed and patched within 45 to 90 minutes.",
    },
    {
      q: "What is included with my delivered project?",
      a: "Every debugged project includes: (1) Clean, fixed source code archive with all dependencies resolved, (2) HD verification screen recording demonstrating successful build, startup, and zero-error execution, and (3) Exact setup and run instructions to reproduce the clean run on your machine.",
    },
    {
      q: "Is my college identity, professor name, or source code protected?",
      a: "Absolutely. We require zero personal student data—no university name, no roll numbers, no professor information. Repositories are tested inside isolated ephemeral sandboxes and securely purged from our servers within 48 hours of ticket closure.",
    },
    {
      q: "Which tech stacks and frameworks do you support?",
      a: "We support Next.js (App Router/SSR), React, Supabase, Node.js, Python (Django, FastAPI, Flask), PyTorch, TensorFlow, Java (Spring Boot), Flutter, Docker, PostgreSQL, MySQL, and C/C++ embedded assignments.",
    },
  ];

  return (
    <section className="py-16 sm:py-20 border-t border-[#27272a] bg-[#000000]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#18181b] border border-[#27272a] text-xs text-orange-400 font-mono mb-3">
            <HelpCircle className="w-3.5 h-3.5 text-orange-400" />
            <span>CLARITY &amp; PEACE OF MIND</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="mt-2 text-sm text-[#a1a1aa]">
            Everything you need to know about our emergency capstone debugging &amp; verification service.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-xl bg-[#18181b] border border-[#27272a] overflow-hidden transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 text-white hover:text-orange-400 font-medium text-sm sm:text-base cursor-pointer"
                >
                  <span className="font-semibold text-white">{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-zinc-400 transition-transform duration-200 flex-shrink-0 ${
                      isOpen ? "rotate-180 text-orange-400" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-[#a1a1aa] leading-relaxed border-t border-[#27272a]/60 animate-in fade-in duration-150">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
