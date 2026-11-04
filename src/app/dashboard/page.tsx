"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
  Package, 
  ExternalLink, 
  Clock, 
  CheckCircle2, 
  FileCode2, 
  ArrowRight, 
  RefreshCw,
  ShieldCheck,
  Zap,
  Lock,
  Plus
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { MagicLinkAuth } from "@/components/MagicLinkAuth";
import type { Order, OrderStatus, PaymentStatus } from "@/types/database.types";
import type { User } from "@supabase/supabase-js";

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  const fetchUserOrders = useCallback(async (currentUser: User) => {
    setIsLoadingOrders(true);
    try {
      const email = currentUser.email || "";
      const res = await fetch(`/api/user/orders?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.orders) {
        setOrders(data.orders);
      }
    } catch (err: unknown) {
      console.warn("Error loading user orders:", err);
    } finally {
      setIsLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setIsLoadingAuth(false);
      if (data.user) {
        fetchUserOrders(data.user);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserOrders(session.user);
      } else {
        setOrders([]);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [fetchUserOrders]);

  const getStatusBadge = (status: OrderStatus, paymentStatus?: PaymentStatus) => {
    if (paymentStatus === "verifying") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 animate-pulse">
          <Clock className="w-3.5 h-3.5" />
          Payment Verifying
        </span>
      );
    }

    switch (status) {
      case "submitted":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
            <Clock className="w-3.5 h-3.5" />
            Queued in Sandbox
          </span>
        );
      case "in_progress":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-orange-500/10 text-orange-400 border border-orange-500/30 animate-pulse">
            <Zap className="w-3.5 h-3.5" />
            Under Debugging
          </span>
        );
      case "proof_ready":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Proof Ready
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Completed &amp; Unlocked
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono text-zinc-400 border border-zinc-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#09090b] text-[#a1a1aa]">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        
        {/* Loading Auth State */}
        {isLoadingAuth ? (
          <div className="py-24 text-center space-y-4">
            <div className="w-10 h-10 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-zinc-400 font-mono">Authenticating personal dashboard...</p>
          </div>
        ) : !user ? (
          /* Unauthenticated State */
          <div className="max-w-md mx-auto my-12 p-8 rounded-3xl bg-[#18181b] border border-[#27272a] shadow-2xl text-center space-y-6 glow-orange-border">
            <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-orange-400 flex items-center justify-center mx-auto shadow-inner">
              <Lock className="w-7 h-7" />
            </div>

            <div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight">
                Student Account Access
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 mt-2 leading-relaxed">
                Enter your college or personal email to receive a passwordless magic login link and access your capstone triage dashboard.
              </p>
            </div>

            <MagicLinkAuth />

            <div className="pt-2 text-[11px] text-zinc-500 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Zero-log privacy • Encrypted 1-click magic link tokens</span>
            </div>
          </div>
        ) : (
          /* Authenticated Dashboard */
          <div className="space-y-8">
            
            {/* Header banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#27272a]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-orange-400 font-bold">
                    STUDENT TICKETS REPOSITORY
                  </span>
                  <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    SESSION ACTIVE
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                  My Orders &amp; Deliverables
                </h1>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                  Connected as <span className="font-mono text-zinc-200">{user.email}</span>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => fetchUserOrders(user)}
                  disabled={isLoadingOrders}
                  className="px-3.5 py-2 rounded-xl bg-[#18181b] hover:bg-zinc-800 text-zinc-300 border border-[#27272a] text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                  title="Refresh Orders"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-orange-400 ${isLoadingOrders ? "animate-spin" : ""}`} />
                  <span>Refresh</span>
                </button>

                <Link
                  href="/#submit-code"
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)] flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Triage Ticket</span>
                </Link>
              </div>
            </div>

            {/* Orders List Section */}
            {isLoadingOrders ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-zinc-400 font-mono">Syncing your active tickets...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="py-16 text-center rounded-3xl bg-[#18181b] border border-[#27272a] p-8 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">No active debug tickets found</h3>
                  <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                    You haven&apos;t submitted any capstone code for triage under this email address yet.
                  </p>
                </div>
                <Link
                  href="/#submit-code"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)]"
                >
                  <span>Submit Code for ₹400 Triage</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {orders.map((ord) => {
                  const fileName = ord.file_name || (ord.file_storage_path ? ord.file_storage_path.split("/").pop() : "project_archive.zip");

                  return (
                    <div
                      key={ord.id || ord.order_code}
                      className="p-6 rounded-2xl bg-[#18181b] border border-[#27272a] hover:border-orange-500/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 glow-orange-border"
                    >
                      {/* Left: Order Info */}
                      <div className="space-y-2.5 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-sm font-mono font-extrabold text-white bg-[#09090b] px-3 py-1 rounded-lg border border-orange-500/40">
                            #{ord.order_code}
                          </span>
                          {getStatusBadge(ord.status, ord.payment_status)}
                          <span className="text-[11px] font-mono text-zinc-500">
                            {new Date(ord.created_at).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-zinc-300">
                          <FileCode2 className="w-4 h-4 text-orange-400 flex-shrink-0" />
                          <span className="font-mono text-white font-medium truncate">{fileName}</span>
                          <span className="text-zinc-600">•</span>
                          <span className="text-zinc-400">{ord.tech_stack}</span>
                        </div>

                        <p className="text-xs text-zinc-400 line-clamp-1 max-w-xl">
                          {ord.issue_description}
                        </p>
                      </div>

                      {/* Right: Action & Payment status */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-shrink-0">
                        {ord.utr_number && (
                          <div className="text-left sm:text-right text-[11px] font-mono text-zinc-400 bg-[#09090b] px-3 py-1.5 rounded-xl border border-[#27272a]">
                            <span className="text-zinc-500 block text-[10px]">UTR REF:</span>
                            <span className="text-orange-400 font-semibold">{ord.utr_number}</span>
                          </div>
                        )}

                        <Link
                          href={`/order/${ord.order_code}`}
                          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(249,115,22,0.3)] flex items-center justify-center gap-1.5"
                        >
                          <span>Open Ticket Portal</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
