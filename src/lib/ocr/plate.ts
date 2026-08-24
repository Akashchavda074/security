"use client";

import Tesseract from "tesseract.js";

export type OcrResult = {
  plateNumber: string;
  confidence: number;
  processingTimeMs: number;
  rawText: string;
};

const PLATE_REGEX = /[A-Z]{2}\s?\d{1,2}\s?[A-Z]{0,3}\s?\d{1,4}/g;

function normalizePlate(value: string) {
  return value.replace(/[^A-Z0-9]/g, "").toUpperCase();
}

export async function recognizePlate(image: Blob | string): Promise<OcrResult> {
  const started = performance.now();
  const result = await Tesseract.recognize(image, "eng", {
    logger: () => undefined
  });

  const rawText = result.data.text.toUpperCase();
  const matches = rawText.match(PLATE_REGEX) ?? [];
  const plateNumber = normalizePlate(matches[0] ?? rawText).slice(0, 12);
  const confidence = Math.min(0.99, Math.max(0.2, (result.data.confidence || 50) / 100));

  return {
    plateNumber,
    confidence,
    processingTimeMs: Math.round(performance.now() - started),
    rawText
  };
}
