"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, RefreshCcw, Check } from "lucide-react";

type CameraCaptureProps = {
  facingMode?: "user" | "environment";
  onCapture: (blob: Blob) => void;
  label?: string;
};

export function CameraCapture({ facingMode = "environment", onCapture, label = "Capture" }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setPreviewUrl(null);
    stop();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setReady(true);
      }
    } catch {
      setError("Camera permission denied or unavailable. Allow camera access and retry.");
      setReady(false);
    }
  }, [facingMode, stop]);

  useEffect(() => {
    void start();
    return () => stop();
  }, [start, stop]);

  async function capture() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
    if (!blob) return;
    setPreviewUrl(URL.createObjectURL(blob));
    onCapture(blob);
  }

  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-sm font-medium text-white">{label}</div>
      {previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={previewUrl} alt="Captured frame" className="aspect-video w-full rounded-xl object-cover" />
      ) : (
        <video ref={videoRef} playsInline muted className="aspect-video w-full rounded-xl bg-slate-950 object-cover" />
      )}
      {error ? <div className="text-sm text-rose-300">{error}</div> : null}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => void start()} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white">
          <RefreshCcw className="h-4 w-4" />
          Retake / Restart
        </button>
        <button
          type="button"
          disabled={!ready}
          onClick={() => void capture()}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-3 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50"
        >
          <Camera className="h-4 w-4" />
          Capture
        </button>
        {previewUrl ? (
          <span className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-100">
            <Check className="h-4 w-4" />
            Captured
          </span>
        ) : null}
      </div>
    </div>
  );
}
