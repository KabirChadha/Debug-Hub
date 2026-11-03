"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Terminal, 
  Search, 
  ArrowRight, 
  User as UserIcon, 
  LogOut, 
  Package,
  Mail
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { OrderTrackerModal } from "./OrderTrackerModal";
import { AuthModal } from "./AuthModal";
import type { User } from "@supabase/supabase-js";

export function Navbar() {
  const [searchInput, setSearchInput] = useState("");
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [trackedId, setTrackedId] = useState("FIX-8392");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      setUser(null);
    } catch (err: unknown) {
      console.warn("Sign out error:", err);
    }
  };

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setTrackedId(searchInput.trim());
    } else {
      setTrackedId("FIX-8392");
    }
    setIsTrackerOpen(true);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-[#27272a] bg-[#09090b]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          
          {/* Left: Terminal Logo */}
          <div className="flex items-center gap-3">
            <Link 
              href="/" 
              className="flex items-center gap-2.5 group focus:outline-none"
              aria-label="Campus Code Fix Home"
            >
              <div className="w-10 h-10 rounded-xl bg-[#18181b] border border-[#27272a] group-hover:border-orange-500/80 flex items-center justify-center text-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.15)] group-hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] transition-all duration-300">
                <Terminal className="w-5 h-5 text-orange-500 transform group-hover:scale-110 transition-transform" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-white tracking-tight text-lg sm:text-xl font-mono">
                    campus<span className="text-orange-500">.fix</span>
                  </span>
                  <span className="hidden md:inline-flex text-[10px] uppercase font-mono font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20 px-1.5 py-0.5 rounded">
                    v2.5
                  </span>
                </div>
                <span className="text-[10px] text-zinc-500 font-mono tracking-wider -mt-1 hidden sm:block">
                  CAPSTONE RUNTIME ASSURANCE
                </span>
              </div>
            </Link>

            {/* Engineers Online Status Pill */}
            <div className="hidden xl:flex items-center gap-2 ml-4 px-3 py-1.5 rounded-full bg-[#18181b] border border-[#27272a] text-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-medium text-zinc-200">
                <span className="text-emerald-400 font-semibold mr-1">🟢 Engineers Online</span>
                <span className="text-zinc-500">| 14 on shift</span>
              </span>
            </div>
          </div>

          {/* Center/Right: Search + Auth + CTA */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-1 max-w-xl justify-end">
            <form onSubmit={handleTrackSubmit} className="relative hidden md:block w-48 lg:w-56">
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 absolute left-3 text-zinc-500 pointer-events-none" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Track # (e.g. FIX-8392)"
                  className="w-full bg-[#18181b] border border-[#27272a] text-xs text-white placeholder:text-zinc-500 rounded-xl pl-8 pr-14 py-2 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-mono"
                />
                <button
                  type="submit"
                  className="absolute right-1 px-2 py-1 bg-[#27272a] hover:bg-orange-500 text-zinc-300 hover:text-white rounded-lg text-[10px] font-medium transition-colors cursor-pointer"
                >
                  Track
                </button>
              </div>
            </form>

            {/* Auth Section */}
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#18181b] hover:bg-zinc-800 text-zinc-200 border border-[#27272a] hover:border-orange-500/40 transition-colors"
                  title="View your capstone tickets"
                >
                  <Package className="w-3.5 h-3.5 text-orange-400" />
                  <span className="hidden sm:inline">My Orders</span>
                </Link>

                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#18181b] border border-[#27272a] text-xs font-mono text-zinc-300">
                  <div className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-[10px] font-bold">
                    {user.email ? user.email.charAt(0).toUpperCase() : <UserIcon className="w-3 h-3" />}
                  </div>
                  <span className="max-w-[100px] truncate hidden lg:inline">
                    {user.email?.split("@")[0]}
                  </span>
                  <button
                    onClick={handleSignOut}
                    className="ml-1 text-zinc-500 hover:text-red-400 transition-colors p-0.5 cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#18181b] hover:bg-zinc-800 text-white border border-[#27272a] hover:border-orange-500/40 transition-all cursor-pointer whitespace-nowrap shadow-sm font-mono"
              >
                <Mail className="w-3.5 h-3.5 text-orange-400" />
                <span>Sign In / Magic Link</span>
              </button>
            )}

            {/* Action CTA Button */}
            <a
              href="#submit-code"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)] hover:shadow-[0_0_25px_rgba(249,115,22,0.5)] cursor-pointer whitespace-nowrap"
            >
              <span>Submit Code</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

        </div>

        {/* Mobile secondary indicator bar */}
        <div className="md:hidden flex items-center justify-between px-4 py-1.5 bg-[#18181b]/50 border-t border-[#27272a]/60 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-emerald-400 font-medium">🟢 Engineers Online</span>
          </div>
          <button
            onClick={() => setIsTrackerOpen(true)}
            className="text-orange-400 hover:underline font-mono text-[11px]"
          >
            Track Order # →
          </button>
        </div>
      </header>

      {/* Track Order Modal */}
      <OrderTrackerModal
        isOpen={isTrackerOpen}
        onClose={() => setIsTrackerOpen(false)}
        initialOrderId={trackedId}
      />

      {/* Magic Link Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
}
