"use client";

import React, { useEffect, useState, Suspense, useCallback } from "react";
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
import type { Order } from "@/types/database.types";

const STEPS = [
  { id: "step-1", title: "Received & Queued", desc: "Sandbox mounted & sanitized" },
  { id: "step-2", title: "Under Active Debugging", desc: "Senior engineer on shift" },
  { id: "step-3", title: "Run Verified & Proof Ready", desc: "Video proof & viva sheet ready" },
  { id: "step-4", title: "Completed & Download Available", desc: "Deliverables unlocked" },
];

const UPI_ID = "chadhakabir77@okaxis";

// Helper: Fetch real order record from Supabase / API fallback
async function getOrderRecord(orderCode: string): Promise<Order | null> {
  if (!orderCode) return null;
  try {
    const supabase = createClient();
    const { data: directData } = await supabase
      .from("orders")
      .select("*")
      .eq("order_code", orderCode)
      .maybeSingle();

    if (directData) return directData;

    const { data: ilikeData } = await supabase
      .from("orders")
      .select("*")
      .ilike("order_code", orderCode)
      .maybeSingle();

    if (ilikeData) return ilikeData;

    const apiRes = await fetch(`/api/orders?code=${encodeURIComponent(orderCode)}`);
    if (apiRes.ok) {
      const apiJson = await apiRes.json();
      if (apiJson.order) {
        return apiJson.order as Order;
      }
    }
  } catch (err: unknown) {
    console.warn("Error retrieving order:", err);
  }
  return null;
}

function OrderDetailsContent() {
  const params = useParams();
  const searchParams = useSearchParams();

  const rawCode = (params?.code as string) || "";
  const orderCode = decodeURIComponent(rawCode).trim().toUpperCase();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(() => Boolean(orderCode));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDownloadingDeliverable, setIsDownloadingDeliverable] = useState(false);
  const [toastVisible, setToastVisible] = useState(() => searchParams.get("copied") === "true");
  const [hasCopied, setHasCopied] = useState(false);
  const [hasCopiedUpi, setHasCopiedUpi] = useState(false);
  
  // UTR Payment States
  const [utrInput, setUtrInput] = useState("");
  const [isSubmittingUtr, setIsSubmittingUtr] = useState(false);
  const [isVivaModalOpen, setIsVivaModalOpen] = useState(false);

  // Fetch / refresh order row from Supabase
  const fetchOrder = useCallback(async () => {
    const record = await getOrderRecord(orderCode);
    if (record) {
      setOrder(record);
      if (record.utr_number) {
        setUtrInput(record.utr_number);
      }
    }
    return record;
  }, [orderCode]);

  // 1. Source of truth from Supabase on mount
  useEffect(() => {
    let ignore = false;

    if (!orderCode) return;

    getOrderRecord(orderCode).then((record) => {
      if (!ignore) {
        if (record) {
          setOrder(record);
          if (record.utr_number) {
            setUtrInput(record.utr_number);
          }
        }
        setIsLoading(false);
      }
    });

    return () => {
      ignore = true;
    };
  }, [orderCode]);

  // 2. Realtime subscription to order row changes
  useEffect(() => {
    if (!orderCode) return;
    const supabase = createClient();

    const channel = supabase
      .channel(`order-realtime-${orderCode}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `order_code=eq.${orderCode}`,
        },
        (payload) => {
          if (payload.new) {
            setOrder(payload.new as Order);
          } else {
            fetchOrder();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderCode, fetchOrder]);

  // Refresh handler
  const handleCheckStatus = async () => {
    setIsRefreshing(true);
    try {
      await fetchOrder();
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
    const utrValue = utrInput.trim();
    if (!utrValue || utrValue.length < 6) {
      alert("Please enter a valid UTR number.");
      return;
    }

    setIsSubmittingUtr(true);
    try {
      const supabase = createClient();
      let submitError: string | null = null;
      const { error } = await supabase
        .from("orders")
        .update({
          utr_number: utrValue,
          payment_status: "pending_verification",
        })
        .eq("order_code", orderCode);

      // Fallback to server route if direct client update hits RLS restrictions
      if (error) {
        submitError = error.message;
        try {
          const res = await fetch("/api/orders", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              order_code: orderCode,
              utr_number: utrValue,
              payment_status: "pending_verification",
            }),
          });

          if (res.ok) {
            submitError = null;
          } else {
            const errData = await res.json().catch(() => ({}));
            submitError = errData.error || error.message;
          }
        } catch {
          // retain submitError
        }
      }

      if (submitError) {
        alert("Failed to submit UTR: " + submitError);
      } else {
        await fetchOrder(); // re-fetch from database immediately
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error submitting UTR";
      alert("Failed to submit UTR: " + msg);
    } finally {
      setIsSubmittingUtr(false);
    }
  };

  // Deliverable Download Handler
  const handleDownloadDeliverable = async () => {
    setIsDownloadingDeliverable(true);
    try {
      const explicitUrl =
        (order as Record<string, unknown>)?.deliverable_url as string ||
        order?.fixed_zip_url;

      // 1. Direct absolute URL (e.g. Supabase Storage publicUrl or external URL)
      if (explicitUrl && (explicitUrl.startsWith("http://") || explicitUrl.startsWith("https://"))) {
        window.open(explicitUrl, "_blank");
        return;
      }

      // 2. Query Supabase Storage from 'deliverables' bucket
      const supabase = createClient();
      let storagePath = explicitUrl;
      if (!storagePath) {
        try {
          const { data: listFiles } = await supabase.storage.from("deliverables").list(orderCode);
          if (listFiles && listFiles.length > 0) {
            storagePath = `${orderCode}/${listFiles[0].name}`;
          } else {
            storagePath = `${orderCode}/fixed-project.zip`;
          }
        } catch {
          storagePath = `${orderCode}/fixed-project.zip`;
        }
      }

      const { data: signedData, error: signedError } = await supabase.storage
        .from("deliverables")
        .createSignedUrl(storagePath, 3600);

      if (!signedError && signedData?.signedUrl) {
        window.open(signedData.signedUrl, "_blank");
        return;
      }

      // 3. Fallback to server route which has service role access to deliverables
      window.open(`/api/deliverables?code=${encodeURIComponent(orderCode)}&type=project`, "_blank");
    } catch (err: unknown) {
      console.warn("Deliverable download error:", err);
      window.open(`/api/deliverables?code=${encodeURIComponent(orderCode)}&type=project`, "_blank");
    } finally {
      setIsDownloadingDeliverable(false);
    }
  };

  // Strict Payment Verification & Unlocking Logic derived directly from order
  const isPaymentApproved = 
    order?.payment_status?.toLowerCase() === "approved" ||
    order?.payment_status?.toLowerCase() === "completed" ||
    order?.status?.toLowerCase() === "completed" ||
    order?.is_paid === true;

  const isUtrPending = 
    order?.payment_status === "pending_verification" || 
    order?.payment_status === "verifying" ||
    Boolean(order?.utr_number && !isPaymentApproved);

  // Stepper state progression
  const getStepProgressIndex = () => {
    if (isPaymentApproved) {
      return 3;
    }
    switch (order?.status) {
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

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-4">
        <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-zinc-400 font-mono">Connecting to telemetry vault for #{orderCode}...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-orange-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white">Order #{orderCode} Not Found</h2>
        <p className="text-xs text-zinc-400 leading-relaxed">
          We couldn&apos;t find this tracking ticket in the database. Please verify your order reference or reach out to our team.
        </p>
        <div className="pt-4 flex items-center justify-center gap-3">
          <button
            onClick={handleCheckStatus}
            disabled={isRefreshing}
            className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Retry Search</span>
          </button>
          <Link
            href="/"
            className="px-4 py-2 rounded-xl bg-[#18181b] border border-[#27272a] hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold transition-colors"
          >
            Back Home
          </Link>
        </div>
      </div>
    );
  }

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

          <div className="flex items-center gap-2">
            <button
              onClick={handleCheckStatus}
              disabled={isRefreshing}
              className="px-3.5 py-1.5 rounded-xl bg-[#18181b] hover:bg-zinc-800 text-zinc-300 hover:text-white border border-[#27272a] text-xs font-mono transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
              title="Refresh Telemetry"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-orange-400" : ""}`} />
              <span>{isRefreshing ? "Refreshing..." : "Refresh Status"}</span>
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
                {order.contact_handle || "@anonymous_student"}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#09090b] border border-[#27272a]">
              <span className="text-zinc-500 block mb-1">Tech Stack</span>
              <span className="font-semibold text-zinc-200 truncate block">
                {order.tech_stack || "React / Next.js"}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#09090b] border border-[#27272a]">
              <span className="text-zinc-500 block mb-1">Mounted File</span>
              <span className="font-mono text-orange-400 font-semibold truncate block" title={order.file_name || "project_source"}>
                {order.file_name || (order.file_storage_path ? order.file_storage_path.split("/").pop() : "project_source")}
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#09090b] border border-[#27272a]">
              <span className="text-zinc-500 block mb-1">Rate &amp; SLA</span>
              <span className="text-orange-400 font-medium">Flat ₹400 • 1–2 Hr</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#09090b] border border-[#27272a] col-span-2 sm:col-span-1">
              <span className="text-zinc-500 block mb-1">Payment Status</span>
              {isPaymentApproved ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Approved</span>
                </span>
              ) : isUtrPending ? (
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

          {/* Engineering Progression Stepper */}
          <div className="mt-8 pt-8 border-t border-[#27272a]">
            <h2 className="text-xs font-mono uppercase tracking-wider text-orange-400 font-bold mb-6">
              Engineering Progression Stepper
            </h2>

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

          {/* Conditional Sections */}
          <div className="mt-8 pt-6 border-t border-[#27272a]">
            
            {/* Active Sandbox Terminal: Displayed during triage if not yet approved */}
            {!isPaymentApproved && (order.status === "submitted" || order.status === "in_progress" || !order.status) && (
              <div className="space-y-4 animate-in fade-in duration-300 mb-8">
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

                  <div className="p-4 sm:p-5 space-y-2 text-zinc-300 min-h-[180px]">
                    <p className="text-zinc-500">$ antigravity mount --target=project-intakes/raw/{orderCode}/{order.file_name || "project_source"}</p>
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

            {/* Proof Video Section */}
            {(isPaymentApproved || order.status === "proof_ready" || order.status === "completed" || Boolean(order.proof_video_url)) && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Video className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-base font-bold text-white">
                      {isPaymentApproved ? "Archived Verification Proof" : "Run Verified! Watch Execution Proof"}
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
                    ✓ Zero Errors Verified
                  </span>
                </div>

                {order.proof_video_url ? (
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
            )}

            {/* STRICT RENDERING BY STATUS: Unlocked Deliverables vs Under Verification vs Unpaid */}
            {isPaymentApproved ? (
              /* 1. UNLOCKED DELIVERABLES: Hide UTR form completely and show download buttons */
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="p-6 rounded-2xl bg-emerald-950/20 border border-emerald-500/40 text-left space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-base sm:text-lg">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                    <span>Payment Verified! Your Repaired Project is Ready</span>
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">
                    Your repository has been tested with 0 compilation errors and containerized cleanly. The fixed archive and your oral viva preparation dossier are unlocked and ready for download.
                  </p>
                </div>

                {/* Primary Download Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Download Button 1: Download Fixed Source Code */}
                  <button
                    type="button"
                    onClick={handleDownloadDeliverable}
                    disabled={isDownloadingDeliverable}
                    className="p-5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold transition-all duration-200 shadow-[0_0_30px_rgba(249,115,22,0.4)] hover:shadow-[0_0_40px_rgba(249,115,22,0.6)] flex flex-col justify-between group cursor-pointer border border-orange-400 text-left disabled:opacity-60"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center">
                        <Download className={`w-5 h-5 group-hover:translate-y-0.5 transition-transform ${isDownloadingDeliverable ? "animate-bounce" : ""}`} />
                      </div>
                      <span className="text-[10px] font-mono uppercase font-bold bg-black/30 px-2 py-0.5 rounded">
                        .ZIP ARCHIVE
                      </span>
                    </div>
                    <div>
                      <h4 className="text-base font-extrabold text-white">
                        {isDownloadingDeliverable ? "Opening Deliverable..." : "Download Fixed Source Code"}
                      </h4>
                      <p className="text-xs text-orange-100/90 mt-1">
                        Clean code with fixed dependencies &amp; run script.
                      </p>
                    </div>
                  </button>

                  {/* Download Button 2: Download Viva Defense Sheet */}
                  <div className="flex flex-col gap-2">
                    <a
                      href={`/api/deliverables?code=${orderCode}&type=viva`}
                      download={`viva-defense-${orderCode}.md`}
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
                          Download Viva Defense Sheet (.pdf/.md)
                        </h4>
                        <p className="text-xs text-orange-100/90 mt-1">
                          60s architecture pitch + top 5 oral questions &amp; answers.
                        </p>
                      </div>
                    </a>

                    <button
                      type="button"
                      onClick={() => setIsVivaModalOpen(true)}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#18181b] hover:bg-zinc-800 text-orange-400 hover:text-orange-300 border border-orange-500/30 text-xs font-mono font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Preview Viva Sheet in Browser (Instant)</span>
                    </button>
                  </div>
                </div>

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
            ) : isUtrPending ? (
              /* 2. UTR SUBMITTED: PAYMENT UNDER VERIFICATION BANNER */
              <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/40 text-left space-y-3 shadow-xl animate-in fade-in duration-300">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
                  <Clock className="w-5 h-5 flex-shrink-0 animate-pulse" />
                  <span>Payment Under Verification: Your UTR is being cross-checked. Downloads will unlock automatically once approved.</span>
                </div>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-mono">
                  Submitted UTR: <strong className="text-amber-300">{order.utr_number || utrInput}</strong>. Verification usually takes 3-7 minutes.
                </p>
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-400 border-t border-amber-500/20">
                  <span>Status: <strong>Verification in progress</strong></span>
                  <button
                    type="button"
                    onClick={handleCheckStatus}
                    disabled={isRefreshing}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                    <span>{isRefreshing ? "Checking..." : "Check verification status now"}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* 3. UNPAID STATE: UPI PAYMENT CARD & UTR INPUT FORM */
              <div className="p-6 sm:p-8 rounded-2xl bg-[#09090b] border border-orange-500/40 shadow-2xl relative glow-orange-border animate-in fade-in duration-300">
                <div className="flex items-start gap-4 pb-5 border-b border-[#27272a]">
                  <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-400 flex items-center justify-center flex-shrink-0">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-mono uppercase tracking-widest text-orange-400 font-bold">
                      PLEDGE CONFIRMATION
                    </span>
                    <h3 className="text-xl sm:text-2xl font-extrabold text-white mt-0.5">
                      Flat Rate • ₹400 • No Run = ₹0 Charged
                    </h3>
                    <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                      Your project is completely fixed and verified. Please complete payment of ₹400 to unlock deliverables.
                    </p>
                  </div>
                </div>

                {/* UPI Payment Instructions Box */}
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
