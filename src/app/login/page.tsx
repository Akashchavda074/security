import Link from "next/link";
import type { Route } from "next";
import { ShieldCheck, KeyRound, BadgeCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { LoginForm } from "@/components/login-form";
import { DEMO_LOGIN_ENABLED, demoAccounts } from "@/lib/demo-auth";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.12),_transparent_24%),linear-gradient(180deg,#020617_0%,#0f172a_55%,#020617_100%)] px-4 py-12 text-slate-100">
      <div className="mx-auto grid min-h-[calc(100vh-6rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <section>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
            <ShieldCheck className="h-4 w-4 text-emerald-300" />
            Supabase Auth + optional demo fallback
          </div>
          <h1 className="mt-6 text-5xl font-semibold tracking-tight text-white sm:text-6xl">Open the security console</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-300">
            Sign in with real Supabase accounts after running SQL migrations and bootstrap. Demo login remains available for offline UI testing.
          </p>
        </section>

        <Card className="border-white/10 bg-slate-950/80 p-6">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <KeyRound className="h-4 w-4" />
            {DEMO_LOGIN_ENABLED ? "Supabase primary · demo fallback on" : "Supabase Auth only"}
          </div>
          <LoginForm />
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
            <div className="flex items-center gap-2 font-semibold text-white">
              <BadgeCheck className="h-4 w-4 text-emerald-300" />
              After bootstrap (Supabase users)
            </div>
            <div className="mt-3 space-y-2 text-slate-400">
              <code className="block rounded bg-slate-950/80 px-2 py-1 text-xs text-emerald-300">superadmin@security.app / SecureDemo123!</code>
              <code className="block rounded bg-slate-950/80 px-2 py-1 text-xs text-emerald-300">admin@apex.security.app / SecureDemo123!</code>
              <code className="block rounded bg-slate-950/80 px-2 py-1 text-xs text-emerald-300">guard@apex.security.app / SecureDemo123!</code>
            </div>
            {DEMO_LOGIN_ENABLED ? (
              <div className="mt-4 text-xs text-slate-500">
                Demo still works: {demoAccounts.map((a) => a.email).join(", ")} / demo1234
              </div>
            ) : null}
          </div>
          <div className="mt-6 text-sm text-slate-400">
            Setup help:{" "}
            <Link href={"/setup" as Route} className="text-emerald-300 underline-offset-4 hover:underline">
              Open setup checklist
            </Link>
          </div>
        </Card>
      </div>
    </main>
  );
}
