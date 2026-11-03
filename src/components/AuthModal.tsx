"use client";

import React from "react";
import { X, Lock, ShieldCheck } from "lucide-react";
import { MagicLinkAuth } from "./MagicLinkAuth";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
  onSuccess?: (email: string) => void;
}

export function AuthModal({
  isOpen,
  onClose,
  initialEmail = "",
  onSuccess,
}: AuthModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md p-6 sm:p-7 rounded-3xl bg-[#18181b] border border-[#27272a] shadow-2xl relative glow-orange-border text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent" />

        {/* Modal Top Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#27272a]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Student Account Access
              </h3>
              <p className="text-xs text-zinc-400">
                1-Click Passwordless Authentication
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Terminal Login Component */}
        <MagicLinkAuth
          initialEmail={initialEmail}
          onSuccess={onSuccess}
        />

        {/* Bottom Trust Badge */}
        <div className="mt-4 pt-3 border-t border-[#27272a] text-[11px] text-zinc-500 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Zero spam • Official Magic Link</span>
          </span>
          <span className="font-mono text-zinc-400">campus.fix</span>
        </div>
      </div>
    </div>
  );
}

