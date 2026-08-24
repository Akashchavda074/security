"use client";

export async function compressImageFile(file: Blob, options?: { maxWidth?: number; quality?: number; maxBytes?: number }) {
  const maxWidth = options?.maxWidth ?? 1600;
  const quality = options?.quality ?? 0.72;
  const maxBytes = options?.maxBytes ?? 700_000;

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxWidth / bitmap.width);
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Unable to process image.");
  }
  ctx.drawImage(bitmap, 0, 0, width, height);

  let currentQuality = quality;
  let blob = await canvasToBlob(canvas, currentQuality);
  while (blob.size > maxBytes && currentQuality > 0.4) {
    currentQuality -= 0.08;
    blob = await canvasToBlob(canvas, currentQuality);
  }

  return new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" });
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Image compression failed."));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      quality
    );
  });
}
