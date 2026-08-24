"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BellRing, Camera } from "lucide-react";
import { useLocalSystem } from "@/components/local-system-provider";
import {
  formatCountdown,
  getNextVerificationAt,
  getVerificationDueState,
  notificationSlotKey,
  VERIFICATION_INTERVAL_MS
} from "@/lib/verification-reminder";

async function ensureNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }
  if (Notification.permission === "granted" || Notification.permission === "denied") {
    return Notification.permission;
  }
  return Notification.requestPermission();
}

function fireVerificationNotification(title: string, body: string) {
  if (typeof window === "undefined" || !("Notification" in window) || Notification.permission !== "granted") {
    return;
  }
  try {
    const notification = new Notification(title, {
      body,
      tag: "guard-hourly-verification",
      requireInteraction: true
    });
    notification.onclick = () => {
      window.focus();
      window.location.href = "/dashboard/guard/verification";
      notification.close();
    };
  } catch {
    // Some browsers block Notification construction outside user gesture; ignore.
  }
}

export function VerificationReminder() {
  const { state, currentCompanyGuards, currentCompanyVerifications, createIncident, currentCompany } = useLocalSystem();
  const [now, setNow] = useState(() => Date.now());
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [dismissedUntil, setDismissedUntil] = useState<number | null>(null);
  const [missedLogged, setMissedLogged] = useState(false);

  const guard = currentCompanyGuards[0];
  const lastVerificationAt = useMemo(() => {
    if (!guard) return undefined;
    const fromProfile = guard.lastVerificationAt;
    const latestRecord = currentCompanyVerifications
      .filter((item) => item.guardId === guard.id)
      .sort((a, b) => new Date(b.verificationTime).getTime() - new Date(a.verificationTime).getTime())[0];
    const fromRecord = latestRecord?.verificationTime;
    if (!fromProfile) return fromRecord;
    if (!fromRecord) return fromProfile;
    return new Date(fromProfile).getTime() >= new Date(fromRecord).getTime() ? fromProfile : fromRecord;
  }, [currentCompanyVerifications, guard]);

  const dueState = getVerificationDueState(lastVerificationAt, now);
  const nextAt = getNextVerificationAt(lastVerificationAt);
  const overdue = dueState === "due" || dueState === "missed";
  const visible = state.currentRole === "guard" && Boolean(guard) && (overdue || dueState === "due_soon");
  const snoozed = dismissedUntil !== null && now < dismissedUntil;

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    setPermission(Notification.permission);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const maybeNotify = useCallback(async () => {
    if (!guard || state.currentRole !== "guard") return;
    if (dueState !== "due" && dueState !== "missed") return;

    const dueAt = getNextVerificationAt(lastVerificationAt);
    const slot = notificationSlotKey(guard.id, dueAt);
    if (sessionStorage.getItem(slot) === "1") return;

    const status = await ensureNotificationPermission();
    setPermission(status);
    if (status === "granted") {
      fireVerificationNotification(
        "Hourly verification due",
        "Complete your duty check-in with a camera capture. Missed check-ins are logged for review."
      );
      sessionStorage.setItem(slot, "1");
    }
  }, [dueState, guard, lastVerificationAt, state.currentRole]);

  useEffect(() => {
    void maybeNotify();
  }, [maybeNotify, now]);

  useEffect(() => {
    if (!guard || !currentCompany || state.currentRole !== "guard" || dueState !== "missed" || missedLogged) {
      return;
    }
    const slot = `missed-alert:${guard.id}:${getNextVerificationAt(lastVerificationAt).toISOString()}`;
    if (sessionStorage.getItem(slot) === "1") {
      setMissedLogged(true);
      return;
    }
    createIncident({
      companyId: currentCompany.id,
      gateId: guard.assignedGateId,
      guardId: guard.id,
      severity: "high",
      title: "Missed hourly verification",
      description: `${guard.name} did not complete the hourly duty check-in within the allowed window.`
    });
    sessionStorage.setItem(slot, "1");
    setMissedLogged(true);
  }, [createIncident, currentCompany, dueState, guard, lastVerificationAt, missedLogged, state.currentRole]);

  // Recheck on the hour boundary even if the tab stayed open for a long time.
  useEffect(() => {
    if (state.currentRole !== "guard") return;
    const id = window.setInterval(() => {
      setNow(Date.now());
      void maybeNotify();
    }, Math.min(VERIFICATION_INTERVAL_MS, 60_000));
    return () => window.clearInterval(id);
  }, [maybeNotify, state.currentRole]);

  if (!visible || snoozed || !guard) {
    return null;
  }

  return (
    <div
      className={`mx-4 mt-4 rounded-3xl border px-4 py-4 xl:mx-8 ${
        dueState === "missed"
          ? "border-rose-400/30 bg-rose-500/10"
          : dueState === "due"
            ? "border-amber-400/30 bg-amber-400/10"
            : "border-sky-400/30 bg-sky-400/10"
      }`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-2xl bg-white/5 p-2">
            <BellRing className="h-5 w-5 text-amber-200" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white">
              {dueState === "missed"
                ? "Missed hourly verification"
                : dueState === "due"
                  ? "Hourly verification is due now"
                  : "Verification due soon"}
            </div>
            <p className="mt-1 text-sm text-slate-300">
              Guard duty check-in for {guard.name}. This records that you completed the check — it does not prove sleep or alertness.
            </p>
            <p className="mt-2 text-xs text-slate-400">
              {overdue
                ? `Overdue since ${nextAt.toLocaleTimeString()}`
                : `Next check-in in ${formatCountdown(nextAt, now)}`}
              {permission !== "granted" ? " · Enable browser notifications for phone alerts." : " · Browser notifications enabled."}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {permission !== "granted" ? (
            <button
              type="button"
              onClick={async () => {
                const status = await ensureNotificationPermission();
                setPermission(status);
                if (status === "granted") {
                  fireVerificationNotification("Notifications enabled", "You will be reminded every hour to complete verification.");
                }
              }}
              className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white"
            >
              Enable alerts
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setDismissedUntil(Date.now() + 5 * 60 * 1000)}
            className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200"
          >
            Snooze 5 min
          </button>
          <Link
            href="/dashboard/guard/verification"
            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950"
          >
            <Camera className="h-4 w-4" />
            Verify now
          </Link>
        </div>
      </div>
    </div>
  );
}
