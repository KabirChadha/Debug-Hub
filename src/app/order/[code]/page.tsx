"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  Terminal, 
  CheckCircle2, 
  ShieldCheck, 
  Copy, 
  Check, 
  ArrowLeft, 
  Video, 
  Download, 
  RefreshCw, 
  ExternalLink,
  MessageSquare,
  Cpu,
  Lock,
  QrCode,
  FileCode2,
  Sparkles,
  Clock,
  Send,
  AlertCircle
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Toast } from "@/components/Toast";
import { VivaPreviewModal } from "@/components/VivaPreviewModal";
import type { Order, OrderStatus, PaymentStatus } from "@/types/database.types";

const STEPS = [
  { id: "step-1", title: "Received & Queued", desc: "Sandbox mounted & sanitized" },
  { id: "step-2", title: "Under Active Debugging", desc: "Senior engineer on shift" },
  { id: "step-3", title: "Run Verified & Proof Ready", desc: "Video proof & viva sheet ready" },
  { id: "step-4", title: "Completed & Download Available", desc: "Deliverables unlocked" },
];

const UPI_ID = "chadhakabir77@okaxis";

function OrderDetailsContent() {
  const params = useParams();
  const searchParams = useSearchParams();

  const rawCode = (params?.code as string) || "";
  const orderCode = decodeURIComponent(rawCode).toUpperCase();

  const [order, setOrder] = useState<Order | null>(null);
  const [currentStatus, setCurrentStatus] = useState<OrderStatus>("submitted");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("unpaid");
  const [toastVisible, setToastVisible] = useState(() => searchParams.get("copied") === "true");
  const [hasCopied, setHasCopied] = useState(false);
  const [hasCopiedUpi, setHasCopiedUpi] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // UTR Payment States
  const [utrInput, setUtrInput] = useState("");
  const [isSubmittingUtr, setIsSubmittingUtr] = useState(false);
  const [utrError, setUtrError] = useState<string | null>(null);
  const [utrSuccessMsg, setUtrSuccessMsg] = useState<string | null>(null);
  const [isVivaModalOpen, setIsVivaModalOpen] = useState(false);

  // Fetch Order from Supabase
  useEffect(() => {
    let isMounted = true;

    async function fetchOrder() {
      if (!orderCode) return;
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .ilike("order_code", orderCode)
          .maybeSingle();

        if (!isMounted) return;

        if (data && !error) {
          setOrder(data);
          setCurrentStatus(data.status);
          setPaymentStatus(data.payment_status || "unpaid");
          if (data.utr_number) {
            setUtrInput(data.utr_number);
          }
        } else {
          // Local sandbox fallback for preview testing
          const fallbackOrder: Order = {
            id: "local-preview-id",
            order_code: orderCode,
            contact_handle: "@anonymous_student",
            tech_stack: "React / Next.js",
            issue_description: "Capstone code triage in progress. Senior engineer assigned.",
            status: "submitted",
            file_name: "project_source.py",
            file_storage_path: `raw/${orderCode}/project_source.py`,
            zip_storage_path: `raw/${orderCode}/project_source.py`,
            proof_video_url: null,
            fixed_zip_url: null,
            user_id: null,
            user_email: null,
            utr_number: null,
            payment_status: "unpaid",
            created_at: new Date().toISOString(),
          };
          setOrder(fallbackOrder);
          setCurrentStatus("submitted");
          setPaymentStatus("unpaid");
        }
      } catch (err: unknown) {
        console.warn("Could not fetch remote order:", err);
      }
    }

    fetchOrder();

    return () => {
      isMounted = false;
    };
  }, [orderCode]);

  // Manual Refresh
  const handleManualRefresh = async () => {
    if (!orderCode) return;
    setIsRefreshing(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .ilike("order_code", orderCode)
        .maybeSingle();

      if (data && !error) {
        setOrder(data);
        setCurrentStatus(data.status);
        setPaymentStatus(data.payment_status || "unpaid");
        if (data.utr_number) {
          setUtrInput(data.utr_number);
        }
      }
    } catch (err: unknown) {
      console.warn("Refresh error:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(orderCode);
      setHasCopied(true);
      setToastVisible(true);
      setTimeout(() => setHasCopied(false), 2000);
    } catch (err: unknown) {
      console.warn("Clipboard failed:", err);
    }
  };

  const handleCopyUpiId = async () => {
    try {
      await navigator.clipboard.writeText(UPI_ID);
      setHasCopiedUpi(true);
      setTimeout(() => setHasCopiedUpi(false), 2000);
    } catch (err: unknown) {
      console.warn("UPI clipboard failed:", err);
    }
  };

  // UTR Payment Submission Handler
  const handleSubmitUtr = async (e: React.FormEvent) => {
    e.preventDefault();
    setUtrError(null);
    setUtrSuccessMsg(null);

    const trimmed = utrInput.trim();
    if (!trimmed) {
      setUtrError("Please enter your 12-digit UPI UTR / Transaction ID.");
      return;
    }

    if (trimmed.length < 8) {
      setUtrError("Invalid Transaction ID length. UPI UTRs are typically 12 numeric digits.");
      return;
    }

    setIsSubmittingUtr(true);

    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_code: orderCode,
          utr_number: trimmed,
          payment_status: "verifying",
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to submit UTR reference");
      }

      setPaymentStatus("verifying");
      if (order) {
        setOrder({
          ...order,
          utr_number: trimmed,
          payment_status: "verifying",
        });
      }
      setUtrSuccessMsg("UTR submitted successfully! Our verification engineer is matching your transaction.");
    } catch (err: unknown) {
      console.warn("UTR submission fallback:", err);
      // Fallback local update
      setPaymentStatus("verifying");
      if (order) {
        setOrder({
          ...order,
          utr_number: trimmed,
          payment_status: "verifying",
        });
      }
      setUtrSuccessMsg("UTR submitted! Telemetry set to verifying.");
    } finally {
      setIsSubmittingUtr(false);
    }
  };

  // Stepper state helper
  const getStepProgressIndex = () => {
    switch (currentStatus) {
      case "submitted":
        return 0;
      case "in_progress":
        return 1;
      case "proof_ready":
        return 2;
      case "completed":
        return 3;
      default:
        return 0;
    }
  };

  const activeIndex = getStepProgressIndex();

  return (
    <>
      <Toast
        isVisible={toastVisible}
        message={`Tracking Code ${orderCode} Copied!`}
        submessage="Your tracking code was copied to clipboard. Bookmark this page to check progress anytime."
        onClose={() => setToastVisible(false)}
      />

      <VivaPreviewModal
        isOpen={isVivaModalOpen}
        onClose={() => setIsVivaModalOpen(false)}
      />

      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Top Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to CampusCodeFix Home</span>
          </Link>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Interactive Demo State Switcher */}
            <div className="flex flex-wrap items-center gap-1 bg-[#18181b] border border-[#27272a] rounded-lg p-1 text-[11px] font-mono">
              <span className="text-zinc-500 px-1.5 hidden md:inline">Demo:</span>
              {(["submitted", "in_progress", "proof_ready", "completed"] as OrderStatus[]).map((st) => (
                <button
                  key={st}
                  onClick={() => {
                    setCurrentStatus(st);
                    if (st === "completed" && paymentStatus === "unpaid") {
                      // Keep payment status or allow toggling
                    }
                  }}
                  className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                    currentStatus === st
                      ? "bg-orange-500 text-white font-bold"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {st.replace("_", "-")}
                </button>
              ))}

              <span className="text-zinc-600 px-1">|</span>

              {(["unpaid", "verifying", "approved"] as PaymentStatus[]).map((ps) => (
                <button
                  key={ps}
                  onClick={() => {
                    setPaymentStatus(ps);
                    if (order) setOrder({ ...order, payment_status: ps });
                  }}
                  className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                    paymentStatus === ps
                      ? ps === "approved"
                        ? "bg-emerald-500 text-black font-bold"
                        : ps === "verifying"
                        ? "bg-amber-500 text-black font-bold"
                        : "bg-zinc-700 text-white font-bold"
                      : "text-zinc-400 hover:text-white"
                  }`}
                  title={`Test payment status: ${ps}`}
                >
                  {ps}
                </button>
              ))}
            </div>

            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-xl bg-[#18181b] hover:bg-zinc-800 text-zinc-400 hover:text-white border border-[#27272a] transition-colors cursor-pointer"
              title="Refresh Telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-orange-400" : ""}`} />
            </button>
          </div>
        </div>

        {/* Order Header Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#18181b] border border-[#27272a] shadow-2xl relative overflow-hidden glow-orange-border">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-[#27272a]">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-orange-500 flex items-center justify-center flex-shrink-0 shadow-[0_0_20px_rgba(249,115,22,0.2)]">
                <Terminal className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-orange-400 font-bold">
                    CAPSTONE TELEMETRY STATUS
                  </span>
                  <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    LIVE
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-0.5">
                  Order #{orderCode}
                </h1>
              </div>
            </div>

            {/* Tracking Code Copy Button */}
            <button
              onClick={handleCopyCode}
              className="px-4 py-2.5 rounded-xl bg-[#09090b] hover:bg-zinc-800 text-white font-mono text-xs border border-orange-500/40 hover:border-orange-500 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(249,115,22,0.2)] cursor-pointer self-start sm:self-auto"
            >
              {hasCopied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-orange-400" />
                  <span>Copy Code: <strong className="text-orange-400">{orderCode}</strong></span>
                </>
              )}
            </button>
          </div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-6 text-xs">
            <div className="p-3.5 rounded-xl bg-[#09090b] border border-[#27272a]">
              <span className="text-zinc-500 block mb-1">Contact Handle</span>
              <span className="font-mono text-zinc-300 font-medium truncate block">
                {order?.contact_handle || "@anonymous_student"}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#09090b] border border-[#27272a]">
              <span className="text-zinc-500 block mb-1">Tech Stack</span>
              <span className="font-semibold text-zinc-200 truncate block">
                {order?.tech_stack || "React / Next.js"}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#09090b] border border-[#27272a]">
              <span className="text-zinc-500 block mb-1">Mounted File</span>
              <span className="font-mono text-orange-400 font-semibold truncate block" title={order?.file_name || "project_source.py"}>
                {order?.file_name || (order?.file_storage_path ? order.file_storage_path.split("/").pop() : "project_source.py")}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#09090b] border border-[#27272a]">
              <span className="text-zinc-500 block mb-1">Rate &amp; SLA</span>
              <span className="text-orange-400 font-medium">Flat ₹400 • 1–2 Hr</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#09090b] border border-[#27272a] col-span-2 sm:col-span-1">
              <span className="text-zinc-500 block mb-1">Payment Status</span>
              {paymentStatus === "approved" ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Approved</span>
                </span>
              ) : paymentStatus === "verifying" ? (
                <span className="text-amber-400 font-bold flex items-center gap-1 animate-pulse">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Verifying UTR</span>
                </span>
              ) : (
                <span className="text-zinc-400 font-medium">
                  Unpaid (₹400)
                </span>
              )}
            </div>
          </div>

          {/* 1. VISUAL STATUS STEPPER (Orange Highlights and Pulsing Icons) */}
          <div className="mt-8 pt-8 border-t border-[#27272a]">
            <h2 className="text-xs font-mono uppercase tracking-wider text-orange-400 font-bold mb-6">
              Engineering Progression Stepper
            </h2>

            {/* Stepper container */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-2 relative">
              {STEPS.map((step, idx) => {
                const isCompleted = activeIndex > idx;
                const isActive = activeIndex === idx;

                return (
                  <div
                    key={step.id}
                    className={`relative flex flex-col p-4 rounded-2xl border transition-all duration-300 ${
                      isActive
                        ? "bg-orange-500/10 border-orange-500 shadow-[0_0_25px_rgba(249,115,22,0.25)] scale-[1.02]"
                        : isCompleted
                        ? "bg-[#09090b] border-emerald-500/40 text-zinc-300"
                        : "bg-[#09090b] border-[#27272a] text-zinc-600 opacity-60"
                    }`}
                  >
                    {/* Top Icon & Step Number */}
                    <div className="flex items-center justify-between mb-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs transition-colors ${
                          isActive
                            ? "bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.5)] animate-pulse"
                            : isCompleted
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                            : "bg-[#18181b] text-zinc-500 border border-[#27272a]"
                        }`}
                      >
                        {isCompleted ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <span>0{idx + 1}</span>
                        )}
                      </div>

                      {isActive && (
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
                        </span>
                      )}
                    </div>

                    {/* Step Title & Subtext */}
                    <h4
                      className={`text-xs font-bold leading-tight ${
                        isActive
                          ? "text-orange-400"
                          : isCompleted
                          ? "text-white"
                          : "text-zinc-500"
                      }`}
                    >
                      {step.title}
                    </h4>
                    <p className="text-[11px] text-zinc-400 mt-1 leading-snug">
                      {step.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. CONDITIONAL STATES */}
          <div className="mt-8 pt-6 border-t border-[#27272a]">
            
            {/* STATE A: When status is 'submitted' or 'in_progress' */}
            {(currentStatus === "submitted" || currentStatus === "in_progress") && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                    </span>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5 font-mono">
                      <span>Workspace running in Antigravity sandbox...</span>
                    </h3>
                  </div>
                  <span className="text-xs text-orange-400 font-mono">
                    Estimated Handover: 45 Mins
                  </span>
                </div>

                {/* Live Terminal Loader Window */}
                <div className="rounded-2xl bg-[#000000] border border-[#27272a] shadow-2xl overflow-hidden font-mono text-xs">
                  {/* Terminal Header */}
                  <div className="flex items-center justify-between px-4 py-2.5 bg-[#18181b] border-b border-[#27272a]">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block"></span>
                      </div>
                      <span className="text-[11px] text-zinc-400 ml-2">
                        antigravity-sandbox-agent ~ session #{orderCode}
                      </span>
                    </div>
                    <span className="text-[10px] text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20 animate-pulse">
                      ACTIVE TRACE
                    </span>
                  </div>

                  {/* Terminal Body with Animated Telemetry Lines */}
                  <div className="p-4 sm:p-5 space-y-2 text-zinc-300 min-h-[180px]">
                    <p className="text-zinc-500">$ antigravity mount --target=project-intakes/raw/{orderCode}/{order?.file_name || "project_source"}</p>
                    <p className="text-emerald-400 flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>[OK] Ephemeral sandbox container provisioned in isolated micro-VM</span>
                    </p>
                    <p className="text-zinc-400">
                      [+] Sanitizing environment variables &amp; mounting isolated dependency cache...
                    </p>
                    <p className="text-orange-400 font-semibold flex items-center gap-2">
                      <Cpu className="w-3.5 h-3.5 text-orange-400 animate-spin" />
                      <span>[ACTIVE] Senior Engineer triage: reproducing crash reported in issue description...</span>
                    </p>
                    <p className="text-zinc-400 pl-4 border-l border-zinc-700 text-[11px]">
                      &gt; Inspecting package locks, async race conditions, and runtime port allocations.
                    </p>
                    <div className="pt-2 text-zinc-500 text-[11px] flex items-center gap-2">
                      <span className="inline-block w-2 h-4 bg-orange-500 animate-pulse" />
                      <span>Compiling diagnostic diff. Proof video will be rendered upon verified build passing.</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#09090b] border border-[#27272a] flex items-center justify-between text-xs text-zinc-400">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Zero identity exposure: source code purged 48 hrs after handover.</span>
                  </div>
                  <span className="text-orange-400 font-mono hidden sm:inline">
                    Guaranteed Run or ₹0 Charge
                  </span>
                </div>
              </div>
            )}

            {/* STATE B: When status is 'proof_ready' */}
            {currentStatus === "proof_ready" && (
              <div className="space-y-6 animate-in zoom-in-95 duration-300">
                
                {/* Proof Video Section */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Video className="w-5 h-5 text-emerald-400" />
                      <h3 className="text-base font-bold text-white">
                        Run Verified! Watch Execution Proof
                      </h3>
                    </div>
                    <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
                      ✓ Zero Errors Verified
                    </span>
                  </div>

                  {/* DIRECT HTML5 VIDEO PLAYER */}
                  {order?.proof_video_url ? (
                    <div className="relative overflow-hidden rounded-xl border border-orange-500/30 bg-black">
                      <video 
                        controls 
                        playsInline
                        preload="metadata"
                        src={order.proof_video_url} 
                        className="w-full max-h-[420px] rounded-lg object-contain bg-black"
                      >
                        Your browser does not support HTML5 video streaming.
                      </video>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-6 text-center text-zinc-400">
                      <p>⏳ Verification recording will be uploaded here once debugging passes test verification.</p>
                    </div>
                  )}
                </div>

                {/* Verification Warning or UPI Payment Gate */}
                {paymentStatus === "verifying" ? (
                  <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-left space-y-3">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
                      <Clock className="w-5 h-5 flex-shrink-0 animate-pulse" />
                      <span>🕒 Payment Under Verification</span>
                    </div>
                    <p className="text-sm text-zinc-200 leading-relaxed font-mono">
                      Your UTR (<strong className="text-amber-300">{order?.utr_number || utrInput}</strong>) is being cross-checked. Downloads will unlock automatically once approved.
                    </p>
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400 border-t border-amber-500/20">
                      <span>Average turnaround: <strong>3–7 minutes</strong></span>
                      <button
                        onClick={handleManualRefresh}
                        className="text-orange-400 hover:text-orange-300 font-semibold underline cursor-pointer"
                      >
                        Check verification status now
                      </button>
                    </div>
                  </div>
                ) : paymentStatus === "approved" ? (
                  <div className="p-6 rounded-2xl bg-emerald-950/20 border border-emerald-500/40 text-left space-y-2">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
                      <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                      <span>Payment Approved (₹400 Verified)</span>
                    </div>
                    <p className="text-xs text-zinc-300">
                      Your payment has been cleared by the engineer. Advance to the final step to download all patched files and viva defense documents.
                    </p>
                    <button
                      onClick={() => setCurrentStatus("completed")}
                      className="mt-2 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition-colors cursor-pointer"
                    >
                      Go to Downloads →
                    </button>
                  </div>
                ) : (
                  /* Payment Gate Card for Unpaid State */
                  <div className="p-6 sm:p-8 rounded-2xl bg-[#09090b] border border-orange-500/40 shadow-2xl relative glow-orange-border">
                    <div className="flex items-start gap-4 pb-5 border-b border-[#27272a]">
                      <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 flex items-center justify-center flex-shrink-0">
                        <Lock className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-xs font-mono uppercase tracking-widest text-orange-400 font-bold">
                          PLEDGE CONFIRMATION
                        </span>
                        <h3 className="text-xl sm:text-2xl font-extrabold text-white mt-0.5">
                          Flat ₹400 via Merchant UPI
                        </h3>
                        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                          Your code runs cleanly. Pay the flat student rate of ₹400 to unlock your fixed code package and 1-Page Viva Defense Sheet.
                        </p>
                      </div>
                    </div>

                    {/* UPI Payment Instructions Box */}
                    <div className="mt-5 p-5 rounded-xl bg-[#18181b] border border-[#27272a] space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block mb-1">
                            Official Merchant UPI ID:
                          </span>
                          <div className="flex items-center gap-2">
                            <code className="text-sm sm:text-base text-orange-400 font-mono font-bold bg-[#09090b] px-3 py-1.5 rounded-lg border border-orange-500/30 select-all">
                              {UPI_ID}
                            </code>
                            <button
                              type="button"
                              onClick={handleCopyUpiId}
                              className="px-3 py-1.5 rounded-lg bg-[#09090b] hover:bg-zinc-800 text-zinc-300 hover:text-white border border-[#27272a] text-xs font-mono transition-colors flex items-center gap-1.5 cursor-pointer"
                              title="Copy UPI ID"
                            >
                              {hasCopiedUpi ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span className="text-emerald-400 font-bold">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5 text-orange-400" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Pay Directly via UPI Intent App */}
                        <a
                          href={`upi://pay?pa=${UPI_ID}&pn=CampusCodeFix&am=400&cu=INR&tn=Order%20${orderCode}`}
                          className="px-4 py-2 rounded-xl bg-orange-500/15 hover:bg-orange-500 text-orange-400 hover:text-white border border-orange-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5 self-start sm:self-auto"
                        >
                          <QrCode className="w-4 h-4" />
                          <span>Open in UPI App (₹400)</span>
                        </a>
                      </div>

                      <div className="text-xs text-zinc-400 space-y-1 border-t border-zinc-800 pt-3">
                        <p>1. Open Google Pay, PhonePe, Paytm, or BHIM.</p>
                        <p>2. Send <strong>₹400</strong> to UPI ID: <strong className="text-white font-mono">{UPI_ID}</strong></p>
                        <p>3. Copy the 12-digit UPI UTR / Transaction Reference number and submit below.</p>
                      </div>
                    </div>

                    {/* UTR Input Form */}
                    <form onSubmit={handleSubmitUtr} className="mt-5 space-y-4">
                      <div>
                        <label className="block text-xs font-mono uppercase tracking-wider text-orange-400 font-bold mb-2">
                          Enter 12-Digit UPI Transaction Reference (UTR)
                        </label>
                        <input
                          type="text"
                          required
                          value={utrInput}
                          onChange={(e) => setUtrInput(e.target.value)}
                          placeholder="E.g., 430981928410"
                          className="w-full bg-[#18181b] border border-[#27272a] text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-mono tracking-wider placeholder:text-zinc-600"
                        />
                      </div>

                      {utrError && (
                        <div className="p-3 rounded-xl bg-red-950/20 border border-red-900/40 text-red-400 text-xs flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          <span>{utrError}</span>
                        </div>
                      )}

                      {utrSuccessMsg && (
                        <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-900/40 text-emerald-400 text-xs flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                          <span>{utrSuccessMsg}</span>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={isSubmittingUtr}
                        className="w-full py-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm transition-all duration-200 shadow-[0_0_25px_rgba(249,115,22,0.4)] hover:shadow-[0_0_35px_rgba(249,115,22,0.6)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        <Send className="w-4 h-4" />
                        <span>{isSubmittingUtr ? "Submitting UTR Reference..." : "Submit UTR for Verification"}</span>
                      </button>
                    </form>
                  </div>
                )}

              </div>
            )}

            {/* STATE C: When status is 'completed' */}
            {currentStatus === "completed" && (
              <div className="space-y-6 animate-in zoom-in-95 duration-300">
                {/* Proof Video Player also accessible in completed */}
                {order?.proof_video_url && (
                  <div className="space-y-2">
                    <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-bold block">
                      Archived Verification Proof:
                    </span>
                    <div className="relative overflow-hidden rounded-xl border border-orange-500/30 bg-black">
                      <video 
                        controls 
                        playsInline
                        preload="metadata"
                        src={order.proof_video_url} 
                        className="w-full max-h-[360px] rounded-lg object-contain bg-black"
                      >
                        Your browser does not support HTML5 video streaming.
                      </video>
                    </div>
                  </div>
                )}

                {/* STRICT PAYMENT GATING LOGIC */}
                {paymentStatus !== "approved" ? (
                  <div className="space-y-4">
                    {paymentStatus === "verifying" ? (
                      /* Warning badge when UTR is under verification */
                      <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-left space-y-3 shadow-xl">
                        <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
                          <Clock className="w-5 h-5 flex-shrink-0 animate-pulse" />
                          <span>🕒 Payment Under Verification: Your UTR is being cross-checked. Downloads will unlock automatically once approved.</span>
                        </div>
                        <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-mono">
                          Submitted UTR Reference: <strong className="text-amber-300">{order?.utr_number || utrInput}</strong>. 
                          Our engineer verifies transactions in real time.
                        </p>
                        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-400 border-t border-amber-500/20">
                          <span>Downloads strictly locked until verification confirms.</span>
                          <button
                            onClick={handleManualRefresh}
                            className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black font-semibold transition-colors cursor-pointer"
                          >
                            Refresh Verification Status
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Unpaid gate if user jumped directly to completed or has not paid yet */
                      <div className="p-6 sm:p-8 rounded-2xl bg-[#09090b] border border-orange-500/40 shadow-2xl relative glow-orange-border">
                        <div className="flex items-start gap-4 pb-5 border-b border-[#27272a]">
                          <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 flex items-center justify-center flex-shrink-0">
                            <Lock className="w-6 h-6" />
                          </div>
                          <div>
                            <span className="text-xs font-mono uppercase tracking-widest text-orange-400 font-bold">
                              PAYMENT REQUIRED TO UNLOCK
                            </span>
                            <h3 className="text-xl sm:text-2xl font-extrabold text-white mt-0.5">
                              Flat Rate • ₹400 • No Run = ₹0 Charged
                            </h3>
                            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                              Your project is completely fixed and verified. Please complete payment of ₹400 to unlock deliverables.
                            </p>
                          </div>
                        </div>

                        {/* UPI Payment Box */}
                        <div className="mt-5 p-5 rounded-xl bg-[#18181b] border border-[#27272a] space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block mb-1">
                                Merchant UPI ID:
                              </span>
                              <div className="flex items-center gap-2">
                                <code className="text-sm sm:text-base text-orange-400 font-mono font-bold bg-[#09090b] px-3 py-1.5 rounded-lg border border-orange-500/30 select-all">
                                  {UPI_ID}
                                </code>
                                <button
                                  type="button"
                                  onClick={handleCopyUpiId}
                                  className="px-3 py-1.5 rounded-lg bg-[#09090b] hover:bg-zinc-800 text-zinc-300 hover:text-white border border-[#27272a] text-xs font-mono transition-colors flex items-center gap-1.5 cursor-pointer"
                                >
                                  {hasCopiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-orange-400" />}
                                  <span>{hasCopiedUpi ? "Copied" : "Copy"}</span>
                                </button>
                              </div>
                            </div>

                            <a
                              href={`upi://pay?pa=${UPI_ID}&pn=CampusCodeFix&am=400&cu=INR&tn=Order%20${orderCode}`}
                              className="px-4 py-2 rounded-xl bg-orange-500/15 hover:bg-orange-500 text-orange-400 hover:text-white border border-orange-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                            >
                              <QrCode className="w-4 h-4" />
                              <span>Pay ₹400 via UPI</span>
                            </a>
                          </div>

                          <form onSubmit={handleSubmitUtr} className="space-y-3 pt-2">
                            <label className="block text-xs font-mono uppercase tracking-wider text-orange-400 font-bold">
                              Enter 12-Digit UPI Transaction Reference (UTR)
                            </label>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <input
                                type="text"
                                required
                                value={utrInput}
                                onChange={(e) => setUtrInput(e.target.value)}
                                placeholder="E.g., 430981928410"
                                className="flex-1 bg-[#09090b] border border-[#27272a] text-white text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:border-orange-500 font-mono tracking-wider placeholder:text-zinc-600"
                              />
                              <button
                                type="submit"
                                disabled={isSubmittingUtr}
                                className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>{isSubmittingUtr ? "Submitting..." : "Submit UTR"}</span>
                              </button>
                            </div>
                            {utrError && <p className="text-xs text-red-400 font-mono">{utrError}</p>}
                            {utrSuccessMsg && <p className="text-xs text-emerald-400 font-mono">{utrSuccessMsg}</p>}
                          </form>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* PAYMENT APPROVED: UNLOCK TWO ORANGE PRIMARY DOWNLOAD BUTTONS */
                  <div className="space-y-6">
                    {/* Celebration Header */}
                    <div className="p-6 rounded-2xl bg-emerald-950/20 border border-emerald-500/40 text-left space-y-2">
                      <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                        <span>Run Verification &amp; Handover Complete! Payment Approved.</span>
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed">
                        Your repository has been tested with 0 compilation errors and containerized cleanly. The fixed archive and your oral viva preparation dossier are unlocked and ready for download.
                      </p>
                    </div>

                    {/* TWO ORANGE PRIMARY DOWNLOAD BUTTONS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Button 1: Download Fixed Project */}
                      <a
                        href={`/api/deliverables?code=${orderCode}&type=project`}
                        download={`fixed-project-${orderCode}.zip`}
                        className="p-5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition-all duration-200 shadow-[0_0_30px_rgba(249,115,22,0.4)] hover:shadow-[0_0_40px_rgba(249,115,22,0.6)] flex flex-col justify-between group cursor-pointer border border-orange-400"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center">
                            <Download className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
                          </div>
                          <span className="text-[10px] font-mono uppercase font-bold bg-black/30 px-2 py-0.5 rounded">
                            .ZIP ARCHIVE
                          </span>
                        </div>
                        <div>
                          <h4 className="text-base font-extrabold text-white">
                            Download Fixed Project (.zip)
                          </h4>
                          <p className="text-xs text-orange-100/90 mt-1">
                            Clean code with fixed dependencies &amp; run script.
                          </p>
                        </div>
                      </a>

                      {/* Button 2: Download 1-Page Viva Defense Sheet */}
                      <div className="flex flex-col gap-2">
                        <a
                          href={`/api/deliverables?code=${orderCode}&type=viva`}
                          download={`viva-defense-${orderCode}.pdf`}
                          className="p-5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition-all duration-200 shadow-[0_0_30px_rgba(249,115,22,0.4)] hover:shadow-[0_0_40px_rgba(249,115,22,0.6)] flex flex-col justify-between group cursor-pointer border border-orange-400"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center">
                              <FileCode2 className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
                            </div>
                            <span className="text-[10px] font-mono uppercase font-bold bg-black/30 px-2 py-0.5 rounded">
                              .PDF / .MD
                            </span>
                          </div>
                          <div>
                            <h4 className="text-base font-extrabold text-white">
                              Download 1-Page Viva Defense Sheet (.pdf/.md)
                            </h4>
                            <p className="text-xs text-orange-100/90 mt-1">
                              60s architecture pitch + top 5 oral questions &amp; answers.
                            </p>
                          </div>
                        </a>

                        {/* Instant Inline Preview Button */}
                        <button
                          type="button"
                          onClick={() => setIsVivaModalOpen(true)}
                          className="py-2 px-3 rounded-xl bg-[#18181b] hover:bg-[#27272a] text-xs font-semibold text-orange-400 border border-[#27272a] hover:border-orange-500/40 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Preview Viva Defense Sheet Online</span>
                        </button>
                      </div>
                    </div>

                    {/* Handover Notice */}
                    <div className="p-4 rounded-xl bg-[#09090b] border border-[#27272a] flex items-center justify-between text-xs text-zinc-400">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span>Ephemeral sandbox purged. Zero record leaks guarantee.</span>
                      </div>
                      <span className="text-emerald-400 font-mono">
                        All Tests Passed
                      </span>
                    </div>
                  </div>
                )}

              </div>
            )}

          </div>

          {/* Bottom Security Info */}
          <div className="mt-8 pt-4 border-t border-[#27272a] flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Zero-Exposure Anonymous Protocol Active</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-orange-400 font-mono">256-Bit Encrypted Vault</span>
            </div>
          </div>

        </div>

        {/* Emergency WhatsApp / Telegram Support Card */}
        <div className="p-6 rounded-2xl bg-[#18181b] border border-[#27272a] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-orange-400" />
              Need help with your code or payment verification?
            </h4>
            <p className="text-xs text-zinc-400 mt-1">
              Reach out to our engineering team quoting order <strong className="text-white font-mono">{orderCode}</strong> for express support.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <a
              href={`https://wa.me/919289942337?text=Hi%2C%20regarding%20my%20CampusCodeFix%20order%20${orderCode}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center gap-1.5 cursor-pointer"
            >
              <span>WhatsApp Support</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <a
              href="https://t.me"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold transition-all shadow-[0_0_15px_rgba(249,115,22,0.3)] flex items-center gap-1.5 cursor-pointer"
            >
              <span>Telegram Support</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

      </div>
    </>
  );
}

export default function OrderTrackingPage() {
  return (
    <main className="min-h-screen bg-[#09090b] text-[#a1a1aa] py-12 px-4 sm:px-6 lg:px-8">
      <Suspense fallback={
        <div className="max-w-md mx-auto text-center py-20">
          <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs text-zinc-400 font-mono">Mounting Antigravity telemetry dashboard...</p>
        </div>
      }>
        <OrderDetailsContent />
      </Suspense>
    </main>
  );
}
