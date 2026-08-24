"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Mail, LockKeyhole, TriangleAlert, BadgeCheck } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { DEMO_LOGIN_ENABLED, createDemoSession, getDemoAccountByCredentials, DEMO_SESSION_KEY } from "@/lib/demo-auth";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("guard@apex.security.app");
  const [password, setPassword] = useState("SecureDemo123!");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"supabase" | "demo">("supabase");
  const [supabaseReady, setSupabaseReady] = useState(false);

  useEffect(() => {
    setSupabaseReady(Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY));
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setBusy(true);

    try {
      if (mode === "supabase" && supabaseReady) {
        const supabase = createSupabaseBrowserClient();
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) {
          setError(signInError.message);
          return;
        }
        router.push("/dashboard");
        router.refresh();
        return;
      }

      if (!DEMO_LOGIN_ENABLED) {
        setError("Supabase login failed and demo login is disabled.");
        return;
      }

      const account = getDemoAccountByCredentials(email, password);
      if (!account) {
        setError("Invalid credentials.");
        return;
      }
      localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(createDemoSession(account)));
      router.push("/dashboard");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={onSubmit}>
      <div className="flex gap-2">
        <button type="button" onClick={() => setMode("supabase")} className={`rounded-xl px-3 py-2 text-xs font-semibold ${mode === "supabase" ? "bg-emerald-400 text-slate-950" : "border border-white/10 text-white"}`}>
          Supabase Auth
        </button>
        {DEMO_LOGIN_ENABLED ? (
          <button type="button" onClick={() => setMode("demo")} className={`rounded-xl px-3 py-2 text-xs font-semibold ${mode === "demo" ? "bg-emerald-400 text-slate-950" : "border border-white/10 text-white"}`}>
            Demo fallback
          </button>
        ) : null}
      </div>

      <label className="block">
        <span className="mb-2 block text-sm text-slate-300">Email</span>
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <Mail className="h-4 w-4 text-slate-400" />
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full bg-transparent text-sm text-white outline-none" autoComplete="email" />
        </div>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm text-slate-300">Password</span>
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <LockKeyhole className="h-4 w-4 text-slate-400" />
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full bg-transparent text-sm text-white outline-none" autoComplete="current-password" />
        </div>
      </label>

      {mode === "supabase" ? (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">
          <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            Real Supabase Auth {supabaseReady ? "is configured" : "needs env keys"}. After SQL migrations, run bootstrap to create seed users.
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-100">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <div>{error}</div>
        </div>
      ) : null}

      <button type="submit" disabled={busy} className="w-full rounded-2xl bg-emerald-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-70">
        {busy ? "Signing in..." : mode === "supabase" ? "Sign in with Supabase" : "Demo sign in"}
      </button>
    </form>
  );
}
