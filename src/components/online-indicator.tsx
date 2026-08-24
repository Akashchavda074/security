"use client";

import { useEffect, useState } from "react";
import { Wifi, WifiOff } from "lucide-react";
import { StatusPill } from "@/components/ui/status-pill";
import { cn } from "@/lib/utils";
import { listOfflineItems } from "@/lib/offline/queue";
import { syncOfflineQueue } from "@/lib/offline/sync";

export function OnlineIndicator() {
  const [online, setOnline] = useState(true);
  const [queueCount, setQueueCount] = useState(0);
  const [syncNote, setSyncNote] = useState("Synced");

  useEffect(() => {
    const refreshQueue = async () => {
      const items = await listOfflineItems();
      setQueueCount(items.length);
      setSyncNote(items.length ? `${items.length} records waiting to sync` : "Synced");
    };

    const onOnline = async () => {
      setOnline(true);
      const result = await syncOfflineQueue();
      await refreshQueue();
      if (result.synced) setSyncNote(`Synced ${result.synced}`);
    };

    const onOffline = () => {
      setOnline(false);
      void refreshQueue();
    };

    const onOnlineEvent = () => {
      void onOnline();
    };

    setOnline(navigator.onLine);
    void refreshQueue();
    window.addEventListener("online", onOnlineEvent);
    window.addEventListener("offline", onOffline);
    const interval = window.setInterval(() => {
      void refreshQueue();
      if (navigator.onLine) void syncOfflineQueue().then(refreshQueue);
    }, 15000);

    return () => {
      window.removeEventListener("online", onOnlineEvent);
      window.removeEventListener("offline", onOffline);
      window.clearInterval(interval);
    };
  }, []);

  return (
    <div className={cn("flex items-center gap-2", online ? "text-emerald-200" : "text-amber-200")}>
      {online ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
      <StatusPill tone={online ? "success" : "warning"}>{online ? "ONLINE" : "OFFLINE"}</StatusPill>
      <span className="text-xs text-slate-400">{online && queueCount === 0 ? "Synced ✓" : syncNote}</span>
    </div>
  );
}
