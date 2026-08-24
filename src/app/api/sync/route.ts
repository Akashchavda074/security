import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const eventSchema = z.object({
  clientEventId: z.string().uuid(),
  type: z.enum(["vehicle_entry", "vehicle_exit", "verification", "checkpoint", "incident"]),
  payload: z.record(z.string(), z.unknown())
});

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (!profile) return NextResponse.json({ error: "Profile missing" }, { status: 403 });

  const body = await request.json();
  const events = z.array(eventSchema).parse(body.events ?? []);
  const results: Array<{ clientEventId: string; status: "inserted" | "duplicate" | "error"; detail?: string }> = [];

  for (const event of events) {
    try {
      if (event.type === "vehicle_entry") {
        const payload = event.payload;
        const { error } = await admin.from("vehicle_entries").insert({
          id: crypto.randomUUID(),
          client_event_id: event.clientEventId,
          company_id: payload.companyId,
          gate_id: payload.gateId,
          guard_id: payload.guardId,
          vehicle_number: payload.vehicleNumber,
          ocr_plate_number: payload.ocrPlateNumber,
          corrected_plate_number: payload.correctedPlateNumber ?? null,
          ocr_confidence: payload.ocrConfidence ?? null,
          correction_reason: payload.correctionReason ?? null,
          vehicle_image_url: payload.vehicleImageUrl ?? null,
          plate_image_url: payload.plateImageUrl ?? null,
          driver_name: payload.driverName ?? null,
          purpose: payload.purpose ?? null,
          destination: payload.destination ?? null,
          remarks: payload.remarks ?? null,
          entry_time: payload.entryTime ?? new Date().toISOString()
        });
        if (error?.code === "23505") results.push({ clientEventId: event.clientEventId, status: "duplicate" });
        else if (error) results.push({ clientEventId: event.clientEventId, status: "error", detail: error.message });
        else results.push({ clientEventId: event.clientEventId, status: "inserted" });
        continue;
      }

      if (event.type === "vehicle_exit") {
        const payload = event.payload;
        const { error } = await admin.from("vehicle_exits").insert({
          id: crypto.randomUUID(),
          client_event_id: event.clientEventId,
          company_id: payload.companyId,
          gate_id: payload.gateId,
          guard_id: payload.guardId,
          vehicle_entry_id: payload.vehicleEntryId,
          exit_image_url: payload.exitImageUrl ?? null,
          exit_time: payload.exitTime ?? new Date().toISOString()
        });
        if (error?.code === "23505") results.push({ clientEventId: event.clientEventId, status: "duplicate" });
        else if (error) results.push({ clientEventId: event.clientEventId, status: "error", detail: error.message });
        else results.push({ clientEventId: event.clientEventId, status: "inserted" });
        continue;
      }

      if (event.type === "verification") {
        const payload = event.payload;
        const { error } = await admin.from("guard_verifications").insert({
          id: crypto.randomUUID(),
          client_event_id: event.clientEventId,
          company_id: payload.companyId,
          guard_id: payload.guardId,
          gate_id: payload.gateId ?? null,
          shift_id: payload.shiftId ?? null,
          image_url: payload.imageUrl ?? null,
          verification_time: payload.verificationTime ?? new Date().toISOString()
        });
        if (error?.code === "23505") results.push({ clientEventId: event.clientEventId, status: "duplicate" });
        else if (error) results.push({ clientEventId: event.clientEventId, status: "error", detail: error.message });
        else results.push({ clientEventId: event.clientEventId, status: "inserted" });
        continue;
      }

      if (event.type === "incident") {
        const payload = event.payload;
        const { error } = await admin.from("incidents").insert({
          id: crypto.randomUUID(),
          company_id: payload.companyId,
          gate_id: payload.gateId ?? null,
          guard_id: payload.guardId ?? null,
          severity: payload.severity ?? "medium",
          title: payload.title,
          description: payload.description ?? null,
          status: "open"
        });
        if (error) results.push({ clientEventId: event.clientEventId, status: "error", detail: error.message });
        else results.push({ clientEventId: event.clientEventId, status: "inserted" });
        continue;
      }

      results.push({ clientEventId: event.clientEventId, status: "error", detail: "Unsupported type" });
    } catch (error) {
      results.push({ clientEventId: event.clientEventId, status: "error", detail: error instanceof Error ? error.message : "Unknown error" });
    }
  }

  return NextResponse.json({ results });
}
