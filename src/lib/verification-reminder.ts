/** Hourly duty check-in interval (ms). Configurable later via company_settings. */
export const VERIFICATION_INTERVAL_MS = 60 * 60 * 1000;

/** Soft window after due time before treating as missed (15 min). */
export const VERIFICATION_WINDOW_MS = 15 * 60 * 1000;

export type VerificationDueState = "ok" | "due_soon" | "due" | "missed";

export function getVerificationDueState(lastVerificationAt?: string | null, now = Date.now()): VerificationDueState {
  if (!lastVerificationAt) {
    return "missed";
  }

  const elapsed = now - new Date(lastVerificationAt).getTime();
  if (elapsed < VERIFICATION_INTERVAL_MS - 5 * 60 * 1000) {
    return "ok";
  }
  if (elapsed < VERIFICATION_INTERVAL_MS) {
    return "due_soon";
  }
  if (elapsed < VERIFICATION_INTERVAL_MS + VERIFICATION_WINDOW_MS) {
    return "due";
  }
  return "missed";
}

export function getNextVerificationAt(lastVerificationAt?: string | null): Date {
  const base = lastVerificationAt ? new Date(lastVerificationAt).getTime() : Date.now();
  return new Date(base + VERIFICATION_INTERVAL_MS);
}

export function formatCountdown(target: Date, now = Date.now()): string {
  const diff = Math.max(0, target.getTime() - now);
  const totalMinutes = Math.floor(diff / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const seconds = Math.floor((diff % 60000) / 1000);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

export function notificationSlotKey(guardId: string, dueAt: Date): string {
  return `verification-notify:${guardId}:${dueAt.toISOString()}`;
}
