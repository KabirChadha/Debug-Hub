"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  FileText, 
  X, 
  Terminal, 
  Download,
  Video,
  Database as DbIcon
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Order, OrderStatus } from "@/types/database.types";

interface OrderTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialOrderId?: string;
}

export function OrderTrackerModal({
  isOpen,
  onClose,
  initialOrderId = "FIX-8392",
}: OrderTrackerModalProps) {
  const [orderId, setOrderId] = useState(initialOrderId);
  const [searchedId, setSearchedId] = useState(initialOrderId);
  const [liveOrder, setLiveOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFromDatabase, setIsFromDatabase] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (!isOpen || !initialOrderId) return;

    async function fetchInitial() {
      const cleanCode = initialOrderId.trim().toUpperCase();
      if (!cleanCode) return;

      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .ilike("order_code", cleanCode)
          .maybeSingle();

        if (!isMounted) return;

        if (data && !error) {
          setLiveOrder(data);
          setIsFromDatabase(true);
        } else {
          setLiveOrder(null);
          setIsFromDatabase(false);
        }
      } catch (err: unknown) {
        console.warn("Using simulation mode:", err);
        if (isMounted) {
          setLiveOrder(null);
          setIsFromDatabase(false);
        }
      }
    }

    fetchInitial();

    return () => {
      isMounted = false;
    };
  }, [initialOrderId, isOpen]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) return;
    const cleanCode = orderId.trim().toUpperCase();
    setSearchedId(cleanCode);
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .ilike("order_code", cleanCode)
        .maybeSingle();

      if (data && !error) {
        setLiveOrder(data);
        setIsFromDatabase(true);
      } else {
        setLiveOrder(null);
        setIsFromDatabase(false);
      }
    } catch (err: unknown) {
      console.warn("Using simulation mode:", err);
      setLiveOrder(null);
      setIsFromDatabase(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  // Derive current status stage
  const currentStatus: OrderStatus = liveOrder?.status || "in_progress";

  const isPaidOrCompleted = 
    liveOrder?.payment_status?.toLowerCase() === "approved" ||
    liveOrder?.status?.toLowerCase() === "completed" ||
    liveOrder?.is_paid === true;

  const getStepState = (stepIndex: number) => {
    if (isPaidOrCompleted) return "done";
    const statusOrder: OrderStatus[] = ["submitted", "in_progress", "proof_ready", "completed"];
    const currentIndex = statusOrder.indexOf(currentStatus);
    if (currentIndex > stepIndex) return "done";
    if (currentIndex === stepIndex) return "active";
    return "pending";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-[#18181b] border border-[#27272a] rounded-2xl shadow-2xl overflow-hidden p-6 text-left glow-orange-border max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#27272a]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-500">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Order Tracking &amp; Live Status
                {isFromDatabase && (
                  <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                    <DbIcon className="w-3 h-3" /> Supabase Live
                  </span>
                )}
              </h3>
              <p className="text-xs text-zinc-400">
                Real-time debugging telemetry for capstone submissions
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

        {/* Search bar inside modal */}
        <form onSubmit={handleSearch} className="mt-5 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="Enter Order Code (e.g., FIX-8392)"
              className="w-full bg-[#09090b] border border-[#27272a] text-sm text-white placeholder:text-zinc-500 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl text-sm transition-all shadow-[0_0_15px_rgba(249,115,22,0.3)] disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            {isLoading ? "Searching..." : "Track"}
          </button>
        </form>

        {/* Live Ticket Info Box */}
        <div className="mt-5 p-4 rounded-xl bg-[#09090b] border border-[#27272a]">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#27272a]/80 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-zinc-400">Order Code:</span>
              <span className="font-mono text-orange-400 font-bold bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
                {liveOrder ? liveOrder.order_code : searchedId}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-emerald-400 font-medium">
                {isPaidOrCompleted ? "Status: Completed / Delivered" : `Status: ${currentStatus.replace("_", " ")}`}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3 text-xs">
            <div>
              <span className="text-zinc-500 block">Project Stack</span>
              <span className="text-zinc-200 font-medium truncate block">
                {liveOrder?.tech_stack || "Next.js 14 + Supabase + PyTorch"}
              </span>
            </div>
            <div>
              <span className="text-zinc-500 block">Turnaround SLA</span>
              <span className="text-orange-400 font-medium">⚡ 90 Mins Express</span>
            </div>
            <div>
              <span className="text-zinc-500 block">Guarantee Status</span>
              <span className="text-emerald-400 font-medium">✓ 100% Run or ₹0</span>
            </div>
          </div>

          {liveOrder?.issue_description && (
            <div className="mt-3 pt-3 border-t border-[#27272a]/50 text-xs">
              <span className="text-zinc-500 block mb-1">Issue Reported:</span>
              <p className="text-zinc-300 font-mono text-[11px] bg-[#18181b] p-2 rounded border border-[#27272a]/70 line-clamp-2">
                {liveOrder.issue_description}
              </p>
            </div>
          )}

          {/* Deliverables quick links if available */}
          {(liveOrder?.proof_video_url || liveOrder?.fixed_zip_url) && (
            <div className="mt-3 pt-3 border-t border-[#27272a]/60 flex flex-wrap gap-2 text-xs">
              {liveOrder.proof_video_url && (
                <a
                  href={liveOrder.proof_video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Watch Verified Execution Video</span>
                </a>
              )}
              {liveOrder.fixed_zip_url && (
                <a
                  href={liveOrder.fixed_zip_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Fixed Archive</span>
                </a>
              )}
            </div>
          )}
        </div>

        {/* Timeline Steps */}
        <div className="mt-6 space-y-4">
          <div className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">
            Execution Milestones
          </div>

          <div className="space-y-3">
            {/* Step 1: Submitted */}
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 p-1 rounded-full ${
                getStepState(0) === "done" || getStepState(0) === "active"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                  : "bg-zinc-800 text-zinc-500 border border-zinc-700"
              }`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-white">Order Submitted &amp; Isolated Sandbox Mounted</span>
                  <span className="text-zinc-500">
                    {liveOrder?.created_at ? new Date(liveOrder.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Verified"}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Code archive sanitized, credentials stripped, anonymous test container booted.
                </p>
              </div>
            </div>

            {/* Step 2: In Progress */}
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 p-1 rounded-full ${
                getStepState(1) === "done"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                  : getStepState(1) === "active"
                  ? "bg-orange-500/20 text-orange-400 border border-orange-500/50 animate-pulse"
                  : "bg-zinc-800 text-zinc-500 border border-zinc-700"
              }`}>
                {getStepState(1) === "done" ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <Clock className="w-3.5 h-3.5" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-medium ${getStepState(1) === "active" ? "text-orange-400" : "text-white"}`}>
                    Senior Engineer Debugging &amp; Dependency Resolution
                  </span>
                  <span className="text-zinc-500">
                    {getStepState(1) === "active" ? "In Progress" : "Completed"}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Resolving unhandled promise rejections, database locks, and port collisions.
                </p>
              </div>
            </div>

            {/* Step 3: Proof Ready */}
            <div className={`flex items-start gap-3 ${getStepState(2) === "pending" ? "opacity-60" : ""}`}>
              <div className={`mt-0.5 p-1 rounded-full ${
                getStepState(2) === "done"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                  : getStepState(2) === "active"
                  ? "bg-orange-500/20 text-orange-400 border border-orange-500/50 animate-pulse"
                  : "bg-zinc-800 text-zinc-500 border border-zinc-700"
              }`}>
                <FileText className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs">
                  <span className={`font-medium ${getStepState(2) === "active" ? "text-orange-400" : "text-zinc-200"}`}>
                    Proof Video Recorded &amp; 1-Page Viva Defense Sheet Compiled
                  </span>
                  <span className="text-zinc-500">
                    {getStepState(2) === "active" ? "Ready for Review" : getStepState(2) === "done" ? "Passed" : "Queued"}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Detailed breakdown of root causes, time complexities, and anticipated oral viva questions.
                </p>
              </div>
            </div>

            {/* Step 4: Completed */}
            <div className={`flex items-start gap-3 ${getStepState(3) === "pending" ? "opacity-60" : ""}`}>
              <div className={`mt-0.5 p-1 rounded-full ${
                getStepState(3) === "done"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                  : "bg-zinc-800 text-zinc-500 border border-zinc-700"
              }`}>
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-zinc-200">Final Handover &amp; Sandbox Sanitization
                  </span>
                  <span className="text-zinc-500">
                    {getStepState(3) === "done" ? "Handover Complete" : "Pending Approval"}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Production code zip delivered with zero-risk run guarantee.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-6 pt-4 border-t border-[#27272a] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <ShieldCheck className="w-4 h-4 text-orange-400" />
            <span>256-Bit Encrypted Ticket Vault</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-lg transition-colors cursor-pointer"
          >
            Close Tracker
          </button>
        </div>
      </div>
    </div>
  );
}
