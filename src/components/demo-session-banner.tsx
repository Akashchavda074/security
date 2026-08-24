"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, LogOut } from "lucide-react";
import { DEMO_SESSION_KEY, type DemoSession } from "@/lib/demo-auth";
import { StatusPill } from "@/components/ui/status-pill";

export function DemoSessionBanner() {
  const [session, setSession] = useState<DemoSession | null>(null);

  useEffect(() => {
    const load = () => {
      const raw = localStorage.getItem(DEMO_SESSION_KEY);
      setSession(raw ? (JSON.parse(raw) as DemoSession) : null);
    };

    load();
    window.addEventListener("storage", load);
    return () => window.removeEventListener("storage", load);
  }, []);

  if (!session) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3">
      <div className="flex items-center gap-3">
        <ShieldCheck className="h-4 w-4 text-emerald-300" />
        <div>
          <div className="text-sm font-semibold text-emerald-100">Demo session active</div>
          <div className="text-xs text-emerald-100/70">
            {session.email} · {session.companyName ?? "No company"}
          </div>
        </div>
      </div>
      <StatusPill tone="success">{session.role.replaceAll("_", " ").toUpperCase()}</StatusPill>
      <button
        type="button"
        onClick={() => {
          localStorage.removeItem(DEMO_SESSION_KEY);
          window.location.assign("/login");
        }}
        className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-white/5 px-3 py-2 text-xs font-semibold text-emerald-100 transition hover:bg-white/10"
      >
        <LogOut className="h-3.5 w-3.5" />
        End demo session
      </button>
    </div>
  );
}
