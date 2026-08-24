"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { useLocalSystem } from "@/components/local-system-provider";
import { CameraCapture } from "@/components/camera-capture";
import { compressImageFile } from "@/lib/images/compress";
import { enqueueOfflineItem } from "@/lib/offline/queue";
import { syncOfflineQueue } from "@/lib/offline/sync";
import { formatCountdown, getNextVerificationAt, getVerificationDueState } from "@/lib/verification-reminder";

export default function GuardVerificationPage() {
  const { currentCompany, currentCompanyGuards, currentCompanyGates, recordVerification, currentCompanyVerifications } = useLocalSystem();
  const [guardId, setGuardId] = useState(currentCompanyGuards[0]?.id ?? "");
  const [gateId, setGateId] = useState(currentCompanyGates[0]?.id ?? "");
  const [shiftId, setShiftId] = useState("shift-local");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setGuardId(currentCompanyGuards[0]?.id ?? "");
    setGateId(currentCompanyGates[0]?.id ?? "");
  }, [currentCompanyGates, currentCompanyGuards]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const selectedGuard = currentCompanyGuards.find((guard) => guard.id === guardId) ?? currentCompanyGuards[0];
  const lastVerificationAt = useMemo(() => {
    if (!selectedGuard) return undefined;
    const latestRecord = currentCompanyVerifications
      .filter((item) => item.guardId === selectedGuard.id)
      .sort((a, b) => new Date(b.verificationTime).getTime() - new Date(a.verificationTime).getTime())[0];
    return latestRecord?.verificationTime ?? selectedGuard.lastVerificationAt;
  }, [currentCompanyVerifications, selectedGuard]);
  const dueState = getVerificationDueState(lastVerificationAt, now);
  const nextAt = getNextVerificationAt(lastVerificationAt);

  async function onCapture(blob: Blob) {
    if (!currentCompany) return;
    setBusy(true);
    setMessage("Compressing verification photo...");
    try {
      const compressed = await compressImageFile(blob, { maxWidth: 1280, maxBytes: 500_000 });
      const form = new FormData();
      form.set("file", compressed);
      form.set("companyId", currentCompany.id);
      form.set("kind", "guard-verification");
      const response = await fetch("/api/upload", { method: "POST", body: form });
      if (response.ok) {
        const data = (await response.json()) as { signedUrl?: string; path?: string };
        setImageUrl(data.signedUrl ?? data.path ?? null);
        setMessage("Photo ready. Save verification to complete check-in.");
      } else {
        setImageUrl(URL.createObjectURL(compressed));
        setMessage("Upload pending/offline. Photo kept locally for sync.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function saveVerification() {
    if (!currentCompany || !guardId || !gateId) return;
    setBusy(true);
    try {
      recordVerification({ companyId: currentCompany.id, guardId, gateId, shiftId, imageName: imageUrl ?? undefined });
      const clientEventId = crypto.randomUUID();
      const payload = {
        companyId: currentCompany.id,
        guardId,
        gateId,
        shiftId,
        imageUrl,
        verificationTime: new Date().toISOString()
      };

      if (navigator.onLine) {
        const response = await fetch("/api/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ events: [{ clientEventId, type: "verification", payload }] })
        });
        if (!response.ok) {
          await enqueueOfflineItem({ id: clientEventId, type: "verification", payload, createdAt: new Date().toISOString() });
          setMessage("Saved locally. Will sync when online.");
        } else {
          setMessage("Verification saved and synced.");
        }
      } else {
        await enqueueOfflineItem({ id: clientEventId, type: "verification", payload, createdAt: new Date().toISOString() });
        setMessage("Offline: verification queued.");
      }
      await syncOfflineQueue();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <StatusPill tone={dueState === "missed" ? "danger" : dueState === "due" ? "warning" : "success"}>
        {dueState === "missed" ? "Missed check-in" : dueState === "due" ? "Due now" : dueState === "due_soon" ? "Due soon" : "On schedule"}
      </StatusPill>
      <h1 className="mt-3 text-2xl font-semibold text-white">Hourly guard verification</h1>
      <p className="mt-3 text-sm text-slate-400">Front-camera check-in with compression, private upload, and offline sync. This proves check-in happened — not sleep/alertness.</p>
      <p className="mt-2 text-sm text-slate-300">
        {dueState === "ok" || dueState === "due_soon" ? `Next reminder in ${formatCountdown(nextAt, now)}` : `Overdue since ${nextAt.toLocaleTimeString()}`}
      </p>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <div className="space-y-3">
          <CameraCapture facingMode="user" label="Verification camera (front)" onCapture={(blob) => void onCapture(blob)} />
          <select value={guardId} onChange={(e) => setGuardId(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none">
            {currentCompanyGuards.map((guard) => (
              <option key={guard.id} value={guard.id} className="bg-slate-950">
                {guard.name}
              </option>
            ))}
          </select>
          <select value={gateId} onChange={(e) => setGateId(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none">
            {currentCompanyGates.map((gate) => (
              <option key={gate.id} value={gate.id} className="bg-slate-950">
                {gate.name}
              </option>
            ))}
          </select>
          <input value={shiftId} onChange={(e) => setShiftId(e.target.value)} placeholder="Shift ID" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none" />
          <button type="button" disabled={busy} onClick={() => void saveVerification()} className="w-full rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-60">
            {busy ? "Saving..." : "Save verification"}
          </button>
          {message ? <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">{message}</div> : null}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-sm text-slate-400">Recent verifications</div>
          <div className="mt-3 space-y-2">
            {currentCompanyVerifications.slice(0, 5).map((verification) => (
              <div key={verification.id} className="rounded-xl border border-white/5 bg-slate-950/50 px-3 py-2 text-sm text-slate-200">
                <div className="font-medium text-white">{verification.guardId}</div>
                <div className="text-slate-400">{new Date(verification.verificationTime).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
