"use client";

import React from "react";
import { Code2, Cpu, Database, Server, Layers, Globe, Smartphone } from "lucide-react";

export function TechStackScroll() {
  const stacks = [
    { name: "Next.js 14 / React", type: "App Router / SSR", icon: Globe },
    { name: "Python / FastAPI", type: "AI & ML Services", icon: Cpu },
    { name: "Supabase / PostgreSQL", type: "Auth, RLS & DB", icon: Database },
    { name: "Node.js / Express", type: "REST & WebSockets", icon: Server },
    { name: "Docker & Container", type: "DevOps & Compose", icon: Layers },
    { name: "PyTorch & TensorFlow", type: "Model Training & Eval", icon: Cpu },
    { name: "Java / Spring Boot", type: "Enterprise Capstones", icon: Code2 },
    { name: "Flutter / Mobile", type: "Cross-Platform Apps", icon: Smartphone },
  ];

  return (
    <div className="w-full py-8 border-b border-[#27272a] bg-[#09090b]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs font-mono text-zinc-500 uppercase tracking-widest mb-6">
          {"// All major college capstone architectures supported & guaranteed"}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {stacks.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div
                key={idx}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#18181b]/70 border border-[#27272a] hover:border-orange-500/40 hover:bg-[#18181b] transition-all group text-center"
              >
                <Icon className="w-5 h-5 text-zinc-400 group-hover:text-orange-400 mb-1.5 transition-colors" />
                <span className="text-xs font-bold text-zinc-200 group-hover:text-white line-clamp-1">
                  {s.name}
                </span>
                <span className="text-[10px] text-zinc-500 line-clamp-1">
                  {s.type}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
