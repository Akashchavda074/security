"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";

type SetupStatus = {
  tablesReady?: boolean;
  schemaError?: string | null;
  nextStep?: string;
  error?: string;
};

export default function SetupPage() {
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [bootstrapResult, setBootstrapResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copyNote, setCopyNote] = useState<string | null>(null);
  const [sqlPreview, setSqlPreview] = useState<string>("");

  async function refresh() {
    const response = await fetch("/api/setup/bootstrap");
    const data = await response.json();
    setStatus(data);
  }

  useEffect(() => {
    void refresh();
    void fetch("/api/setup/bootstrap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "sql-preview" })
    })
      .then((res) => res.json())
      .then((data) => {
        const combined = (data.migrations ?? []).map((m: { name: string; sql: string }) => `-- ===== ${m.name} =====\n${m.sql}`).join("\n\n");
        setSqlPreview(combined);
      })
      .catch(() => undefined);
  }, []);

  async function copySql() {
    if (!sqlPreview) return;
    await navigator.clipboard.writeText(sqlPreview);
    setCopyNote("Full SQL copied. Paste into Supabase SQL Editor and click Run.");
  }

  async function runBootstrap() {
    setBusy(true);
    setBootstrapResult(null);
    try {
      const response = await fetch("/api/setup/bootstrap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "bootstrap" })
      });
      const data = await response.json();
      setBootstrapResult(JSON.stringify(data, null, 2));
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-3xl space-y-6">
        <Card>
          <StatusPill tone={status?.tablesReady ? "success" : "warning"}>{status?.tablesReady ? "Schema ready" : "Migration required"}</StatusPill>
          <h1 className="mt-3 text-3xl font-semibold text-white">Supabase setup</h1>
          <p className="mt-3 text-sm text-slate-400">
            Your project keys are configured, but tables are missing. Run the SQL once in Supabase, then bootstrap.
          </p>

          <ol className="mt-6 list-decimal space-y-3 pl-5 text-sm text-slate-300">
            <li>
              Open{" "}
              <a className="text-emerald-300 underline" href="https://supabase.com/dashboard/project/xszsgritpcntxykxopnw/sql/new" target="_blank" rel="noreferrer">
                Supabase SQL Editor
              </a>
            </li>
            <li>Click <strong>Copy full SQL</strong> below, paste into the editor, click <strong>Run</strong></li>
            <li>Come back here and click <strong>Refresh status</strong> until <code>tablesReady: true</code></li>
            <li>Click <strong>Bootstrap seed data</strong></li>
            <li>Sign in at <a className="text-emerald-300 underline" href="/login">/login</a></li>
          </ol>

          <div className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-50">
            Current error: {status?.schemaError ?? "unknown"}
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
            <div className="font-medium text-white">Status</div>
            <pre className="mt-2 overflow-auto text-xs text-slate-400">{JSON.stringify(status, null, 2)}</pre>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => void copySql()} className="rounded-2xl bg-sky-400 px-4 py-3 text-sm font-semibold text-slate-950">
              Copy full SQL
            </button>
            <button type="button" onClick={() => void refresh()} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white">
              Refresh status
            </button>
            <button type="button" disabled={busy || !status?.tablesReady} onClick={() => void runBootstrap()} className="rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-60">
              {busy ? "Bootstrapping..." : "Bootstrap seed data"}
            </button>
          </div>

          {copyNote ? <p className="mt-3 text-sm text-emerald-300">{copyNote}</p> : null}

          {bootstrapResult ? (
            <pre className="mt-4 overflow-auto rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-xs text-emerald-200">{bootstrapResult}</pre>
          ) : null}
        </Card>
      </div>
    </main>
  );
}
