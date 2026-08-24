"use client";

import { listOfflineItems, removeOfflineItem, type OfflineQueueItem } from "@/lib/offline/queue";

export async function syncOfflineQueue() {
  if (typeof window === "undefined" || !navigator.onLine) {
    return { synced: 0, failed: 0 };
  }

  const items = await listOfflineItems();
  if (!items.length) return { synced: 0, failed: 0 };

  const events = items.map((item: OfflineQueueItem) => ({
    clientEventId: item.id,
    type: item.type,
    payload: item.payload
  }));

  const response = await fetch("/api/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ events })
  });

  if (!response.ok) {
    return { synced: 0, failed: items.length };
  }

  const data = (await response.json()) as {
    results: Array<{ clientEventId: string; status: string }>;
  };

  let synced = 0;
  let failed = 0;
  for (const result of data.results) {
    if (result.status === "inserted" || result.status === "duplicate") {
      await removeOfflineItem(result.clientEventId);
      synced += 1;
    } else {
      failed += 1;
    }
  }

  return { synced, failed };
}
