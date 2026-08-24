import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={cn("rounded-3xl border border-white/10 bg-slate-950/70 p-5 shadow-glow backdrop-blur", className)}>{children}</section>;
}
