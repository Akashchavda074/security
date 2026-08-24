"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Mail, LockKeyhole, TriangleAlert, BadgeCheck } from "lucide-react";
import { DEMO_LOGIN_ENABLED, createDemoSession, getDemoAccountByCredentials, demoAccounts, DEMO_SESSION_KEY } from "@/lib/demo-auth";

export function DemoLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState(demoAccounts[2]?.email ?? "");
  const [password, setPassword] = useState("demo1234");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const selectedAccount = useMemo(() => getDemoAccountByCredentials(email, password), [email, password]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!DEMO_LOGIN_ENABLED) {
      setError("Demo login is disabled. Enable NEXT_PUBLIC_ENABLE_DEMO_LOGIN=true for local testing.");
      return;
    }

    const account = getDemoAccountByCredentials(email, password);
    if (!account) {
      setError("Invalid demo credentials.");
      return;
    }

    setBusy(true);
    try {
      const session = createDemoSession(account);
      localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(session));
      router.push("/dashboard");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={onSubmit}>
      <label className="block">
        <span className="mb-2 block text-sm text-slate-300">Email</span>
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <Mail className="h-4 w-4 text-slate-400" />
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="guard@company.com"
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
            autoComplete="email"
          />
        </div>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm text-slate-300">Password</span>
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <LockKeyhole className="h-4 w-4 text-slate-400" />
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
            autoComplete="current-password"
          />
        </div>
      </label>

      {selectedAccount ? (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">
          <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <div className="font-semibold">{selectedAccount.label} demo account detected</div>
            <div className="mt-1 text-emerald-100/80">{selectedAccount.email}</div>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-100">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <div>{error}</div>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-2xl bg-emerald-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {busy ? "Signing in..." : "Demo sign in"}
      </button>
    </form>
  );
}
