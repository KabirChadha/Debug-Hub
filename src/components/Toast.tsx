"use client";

import React, { useEffect } from "react";
import { Check, Copy, X } from "lucide-react";

interface ToastProps {
  message: string;
  submessage?: string;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export function Toast({
  message,
  submessage,
  isVisible,
  onClose,
  duration = 4500,
}: ToastProps) {
  useEffect(() => {
    if (!isVisible) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300 max-w-sm sm:max-w-md">
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#18181b] border-2 border-orange-500 shadow-[0_0_30px_rgba(249,115,22,0.45)] text-left backdrop-blur-md">
        <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Copy className="w-4 h-4 text-orange-400" />
        </div>
        <div className="flex-1 pr-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-white">
            <span>{message}</span>
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          {submessage && (
            <p className="text-[11px] text-zinc-400 mt-1 leading-snug">
              {submessage}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-zinc-500 hover:text-white transition-colors p-1 cursor-pointer"
          aria-label="Dismiss toast"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
