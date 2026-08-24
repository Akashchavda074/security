import { NextResponse } from "next/server";
import { createSupabaseAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";

/**
 * Hourly verification checker.
 * Call from a cron (Vercel Cron / GitHub Action / Supabase scheduled function).
 * Protect with CRON_SECRET header in production.
 */
export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const header = request.headers.get("authorization");
    if (header !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const admin = createSupabaseAdminClient();
  const { data: settings } = await admin.from("company_settings").select("*");
  const now = Date.now();
  const createdAlerts: string[] = [];

  for (const setting of settings ?? []) {
    const intervalMs = (setting.verification_interval_minutes ?? 60) * 60_000;
    const windowMs = (setting.verification_window_minutes ?? 15) * 60_000;

    const { data: guards } = await admin.from("guards").select("id, employee_id, company_id, status").eq("company_id", setting.company_id).eq("status", "active");
    for (const guard of guards ?? []) {
      const { data: latest } = await admin
        .from("guard_verifications")
        .select("verification_time")
        .eq("guard_id", guard.id)
        .order("verification_time", { ascending: false })
        .limit(1)
        .maybeSingle();

      const last = latest?.verification_time ? new Date(latest.verification_time).getTime() : 0;
      const overdue = !last || now - last > intervalMs + windowMs;
      if (!overdue) continue;

      await admin.from("guards").update({ status: "missed_verification", updated_at: new Date().toISOString() }).eq("id", guard.id);

      const { data: alert } = await admin
        .from("alerts")
        .insert({
          company_id: guard.company_id,
          severity: "high",
          title: "Missed hourly verification",
          details: `Guard ${guard.employee_id} missed the verification window.`,
          related_table: "guards",
          related_id: guard.id
        })
        .select("id")
        .single();

      await admin.from("notifications").insert({
        company_id: guard.company_id,
        title: "Hourly verification overdue",
        body: `Guard ${guard.employee_id} must complete duty check-in now.`
      });

      if (alert?.id) createdAlerts.push(alert.id);
    }
  }

  return NextResponse.json({
    ok: true,
    alertsCreated: createdAlerts.length,
    alertIds: createdAlerts,
    checkedAt: new Date().toISOString()
  });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    usage: "POST with Authorization: Bearer CRON_SECRET every hour"
  });
}
