"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { useLocalSystem } from "@/components/local-system-provider";
import { CameraCapture } from "@/components/camera-capture";
import { compressImageFile } from "@/lib/images/compress";
import { recognizePlate } from "@/lib/ocr/plate";
import { enqueueOfflineItem } from "@/lib/offline/queue";
import { syncOfflineQueue } from "@/lib/offline/sync";

export default function GuardEntryPage() {
  const { currentCompany, currentCompanyGates, currentCompanyGuards, currentCompanyVehicles, recordVehicleEntry } = useLocalSystem();
  const [gateId, setGateId] = useState(currentCompanyGates[0]?.id ?? "");
  const [guardId, setGuardId] = useState(currentCompanyGuards[0]?.id ?? "");
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [driverName, setDriverName] = useState("");
  const [purpose, setPurpose] = useState("Delivery");
  const [destination, setDestination] = useState("Warehouse");
  const [ocrPlateNumber, setOcrPlateNumber] = useState("");
  const [ocrConfidence, setOcrConfidence] = useState(0);
  const [correctedPlateNumber, setCorrectedPlateNumber] = useState("");
  const [correctionReason, setCorrectionReason] = useState("");
  const [vehicleImageUrl, setVehicleImageUrl] = useState<string | null>(null);
  const [plateImageUrl, setPlateImageUrl] = useState<string | null>(null);
  const [remarks, setRemarks] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [ocrMs, setOcrMs] = useState<number | null>(null);

  useEffect(() => {
    setGateId(currentCompanyGates[0]?.id ?? "");
    setGuardId(currentCompanyGuards[0]?.id ?? "");
  }, [currentCompanyGates, currentCompanyGuards]);

  async function uploadEvidence(blob: Blob, kind: string) {
    if (!currentCompany) return null;
    const compressed = await compressImageFile(blob, {
      maxWidth: kind === "plates" ? 1000 : 1600,
      maxBytes: kind === "plates" ? 150_000 : 700_000
    });
    const form = new FormData();
    form.set("file", compressed);
    form.set("companyId", currentCompany.id);
    form.set("kind", kind);
    const response = await fetch("/api/upload", { method: "POST", body: form });
    if (!response.ok) return null;
    const data = (await response.json()) as { signedUrl?: string; path?: string };
    return data.signedUrl ?? data.path ?? null;
  }

  async function onVehicleCapture(blob: Blob) {
    setBusy(true);
    setMessage("Compressing and running OCR...");
    try {
      const compressed = await compressImageFile(blob);
      const ocr = await recognizePlate(compressed);
      setOcrPlateNumber(ocr.plateNumber);
      setVehicleNumber(ocr.plateNumber);
      setOcrConfidence(ocr.confidence);
      setOcrMs(ocr.processingTimeMs);
      const uploaded = await uploadEvidence(compressed, "vehicles");
      setVehicleImageUrl(uploaded);
      if (ocr.confidence < 0.7) {
        setMessage("LOW CONFIDENCE — please verify the number manually.");
      } else {
        setMessage(`OCR detected ${ocr.plateNumber} (${Math.round(ocr.confidence * 100)}%).`);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Capture failed");
    } finally {
      setBusy(false);
    }
  }

  async function onPlateCapture(blob: Blob) {
    setBusy(true);
    try {
      const uploaded = await uploadEvidence(blob, "plates");
      setPlateImageUrl(uploaded);
      const ocr = await recognizePlate(blob);
      if (ocr.plateNumber) {
        setOcrPlateNumber(ocr.plateNumber);
        setVehicleNumber((current) => current || ocr.plateNumber);
        setOcrConfidence(ocr.confidence);
        setOcrMs(ocr.processingTimeMs);
      }
    } finally {
      setBusy(false);
    }
  }

  async function saveEntry() {
    if (!currentCompany || !gateId || !guardId || !vehicleNumber || !ocrPlateNumber) return;
    setBusy(true);
    setMessage(null);
    try {
      const matched = currentCompanyVehicles.find((vehicle) => vehicle.vehicleNumber === (correctedPlateNumber || vehicleNumber).toUpperCase());
      recordVehicleEntry({
        companyId: currentCompany.id,
        gateId,
        guardId,
        vehicleNumber: (correctedPlateNumber || vehicleNumber).toUpperCase(),
        driverName: driverName || matched?.driverName || "Unknown",
        purpose,
        destination,
        ocrPlateNumber,
        ocrConfidence,
        correctedPlateNumber: correctedPlateNumber || undefined,
        correctionReason: correctionReason || undefined,
        vehicleImageName: vehicleImageUrl ?? undefined,
        plateImageName: plateImageUrl ?? undefined,
        remarks
      });

      const clientEventId = crypto.randomUUID();
      const payload = {
        companyId: currentCompany.id,
        gateId,
        guardId,
        vehicleNumber: (correctedPlateNumber || vehicleNumber).toUpperCase(),
        ocrPlateNumber,
        correctedPlateNumber: correctedPlateNumber || null,
        ocrConfidence,
        correctionReason: correctionReason || null,
        vehicleImageUrl,
        plateImageUrl,
        driverName,
        purpose,
        destination,
        remarks,
        entryTime: new Date().toISOString()
      };

      if (navigator.onLine) {
        const response = await fetch("/api/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ events: [{ clientEventId, type: "vehicle_entry", payload }] })
        });
        if (!response.ok) {
          await enqueueOfflineItem({ id: clientEventId, type: "vehicle_entry", payload, createdAt: new Date().toISOString() });
          setMessage("Saved locally. Sync will retry when connection is stable.");
        } else {
          setMessage("Vehicle entry saved and synced.");
        }
      } else {
        await enqueueOfflineItem({ id: clientEventId, type: "vehicle_entry", payload, createdAt: new Date().toISOString() });
        setMessage("Offline: entry queued and will sync automatically.");
      }

      await syncOfflineQueue();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <StatusPill tone="success">Vehicle entry</StatusPill>
      <h1 className="mt-3 text-2xl font-semibold text-white">Live camera + OCR entry</h1>
      <p className="mt-3 text-sm text-slate-400">Capture with rear camera, compress image, run plate OCR, confirm/correct, then save with offline sync.</p>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <div className="space-y-3">
          <CameraCapture facingMode="environment" label="Vehicle camera" onCapture={(blob) => void onVehicleCapture(blob)} />
          <CameraCapture facingMode="environment" label="Number plate crop" onCapture={(blob) => void onPlateCapture(blob)} />
        </div>

        <div className="space-y-3">
          <select value={gateId} onChange={(e) => setGateId(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none">
            {currentCompanyGates.map((gate) => (
              <option key={gate.id} value={gate.id} className="bg-slate-950">
                {gate.name}
              </option>
            ))}
          </select>
          <select value={guardId} onChange={(e) => setGuardId(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none">
            {currentCompanyGuards.map((guard) => (
              <option key={guard.id} value={guard.id} className="bg-slate-950">
                {guard.name}
              </option>
            ))}
          </select>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm text-slate-400">OCR result</div>
            <input value={ocrPlateNumber} onChange={(e) => setOcrPlateNumber(e.target.value.toUpperCase())} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none" />
            <div className="mt-2 text-sm text-slate-300">
              Confidence {Math.round(ocrConfidence * 100)}%{ocrMs ? ` · ${ocrMs}ms` : ""}
              {ocrConfidence > 0 && ocrConfidence < 0.7 ? " · LOW CONFIDENCE" : ""}
            </div>
          </div>

          <input value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())} placeholder="Confirmed vehicle number" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none" />
          <input value={correctedPlateNumber} onChange={(e) => setCorrectedPlateNumber(e.target.value.toUpperCase())} placeholder="Corrected plate (keeps original OCR)" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none" />
          <input value={correctionReason} onChange={(e) => setCorrectionReason(e.target.value)} placeholder="Correction reason" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none" />
          <input value={driverName} onChange={(e) => setDriverName(e.target.value)} placeholder="Driver name" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none" />
          <input value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="Purpose" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none" />
          <input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Destination" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none" />
          <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Remarks" className="min-h-24 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none" />

          <button type="button" disabled={busy} onClick={() => void saveEntry()} className="w-full rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-60">
            {busy ? "Working..." : "Save entry"}
          </button>
          {message ? <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">{message}</div> : null}
        </div>
      </div>
    </Card>
  );
}
