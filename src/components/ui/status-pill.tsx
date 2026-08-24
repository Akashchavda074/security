import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function StatusPill({
  children,
  tone = "neutral"
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
}) {
  const tones: Record<string, string> = {
    neutral: "bg-white/8 text-slate-200 ring-white/10",
    success: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/20",
    warning: "bg-amber-500/15 text-amber-300 ring-amber-400/20",
    danger: "bg-rose-500/15 text-rose-300 ring-rose-400/20",
    info: "bg-sky-500/15 text-sky-300 ring-sky-400/20"
  };

  return (
    <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1", tones[tone])}>
      {children}
    </span>
  );
}
