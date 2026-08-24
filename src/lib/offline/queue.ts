"use client";

import { openDB } from "idb";

export interface OfflineQueueItem {
  id: string;
  type: "vehicle_entry" | "vehicle_exit" | "verification" | "checkpoint" | "incident";
  payload: Record<string, unknown>;
  createdAt: string;
  syncedAt?: string;
}

const DB_NAME = "security-management-pwa";
const STORE = "offline-queue";

async function db() {
  return openDB(DB_NAME, 1, {
    upgrade(database) {
      if (!database.objectStoreNames.contains(STORE)) {
        database.createObjectStore(STORE, { keyPath: "id" });
      }
    }
  });
}

export async function enqueueOfflineItem(item: OfflineQueueItem) {
  const database = await db();
  await database.put(STORE, item);
}

export async function listOfflineItems() {
  const database = await db();
  return database.getAll(STORE);
}

export async function removeOfflineItem(id: string) {
  const database = await db();
  await database.delete(STORE, id);
}

export async function clearOfflineQueue() {
  const database = await db();
  await database.clear(STORE);
}
