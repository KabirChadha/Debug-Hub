"use client";

import React from "react";
import { Terminal, Shield, Zap, Lock } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-[#27272a] bg-[#09090b] text-[#a1a1aa] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-[#27272a]">
          
          {/* Logo & Slogan */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#18181b] border border-[#27272a] flex items-center justify-center text-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.15)]">
              <Terminal className="w-4 h-4 text-orange-500" />
            </div>
            <div>
              <span className="font-extrabold text-white text-base font-mono tracking-tight">
                campus<span className="text-orange-500">.fix</span>
              </span>
              <p className="text-[11px] text-zinc-500">
                Guaranteed Capstone Debugging &amp; Rapid Code Repair
              </p>
            </div>
          </div>

          {/* Guarantee Badges */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#18181b] border border-[#27272a] text-zinc-300">
              <Zap className="w-3.5 h-3.5 text-orange-400" />
              <span>1-2 Hr Express SLA</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#18181b] border border-[#27272a] text-zinc-300">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Anonymous &amp; Encrypted</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#18181b] border border-[#27272a] text-zinc-300">
              <Shield className="w-3.5 h-3.5 text-orange-400" />
              <span>Flat Rate • ₹400 • No Run = ₹0 Charged</span>
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <p>© 2026 CampusCodeFix. Built for engineering students facing capstone deadlines.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-orange-400 transition-colors">Zero-Log Privacy</a>
            <a href="#" className="hover:text-orange-400 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-orange-400 transition-colors">Emergency Dispatch</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
