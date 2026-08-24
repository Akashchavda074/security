import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  helper,
  className
}: {
  label: string;
  value: string;
  helper: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-3xl border border-white/10 bg-slate-950/60 p-5 shadow-glow backdrop-blur", className)}>
      <div className="text-sm text-slate-400">{label}</div>
      <div className="mt-2 text-3xl font-semibold tracking-tight text-white">{value}</div>
      <div className="mt-2 text-sm text-slate-500">{helper}</div>
    </div>
  );
}
