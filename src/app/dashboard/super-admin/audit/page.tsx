"use client";

import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { useLocalSystem } from "@/components/local-system-provider";

export default function SuperAdminAuditPage() {
  const { auditLogs } = useLocalSystem();

  return (
    <Card>
      <StatusPill tone="info">Audit logs</StatusPill>
      <h1 className="mt-3 text-2xl font-semibold text-white">Append-only system history</h1>
      <div className="mt-5 space-y-3">
        {auditLogs.slice(0, 20).map((row) => (
          <div key={row.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="font-medium text-white">{row.action}</div>
            <div className="mt-1 text-sm text-slate-400">
              {row.entity} • {row.detail}
            </div>
            <div className="mt-2 text-xs text-slate-500">{new Date(row.createdAt).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}
