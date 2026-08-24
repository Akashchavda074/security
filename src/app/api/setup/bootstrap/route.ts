import { NextResponse } from "next/server";
import { createSupabaseAdminClient, isSupabaseConfigured } from "@/lib/supabase/admin";
import { readFile } from "fs/promises";
import path from "path";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "Supabase env not configured" }, { status: 500 });
  }

  const admin = createSupabaseAdminClient();
  const probe = await admin.from("companies").select("id").limit(1);
  const tablesReady = !probe.error;

  return NextResponse.json({
    ok: true,
    tablesReady,
    schemaError: probe.error?.message ?? null,
    nextStep: tablesReady
      ? "Schema ready. Call POST /api/setup/bootstrap to seed users/companies."
      : "Open Supabase SQL Editor and run supabase/migrations/0001_initial.sql then 0002_storage_auth_sync.sql"
  });
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "Supabase env not configured" }, { status: 500 });
  }

  const body = (await request.json().catch(() => ({}))) as { action?: string };
  const admin = createSupabaseAdminClient();

  if (body.action === "sql-preview") {
    const file1 = await readFile(path.join(process.cwd(), "supabase/migrations/0001_initial.sql"), "utf8");
    const file2 = await readFile(path.join(process.cwd(), "supabase/migrations/0002_storage_auth_sync.sql"), "utf8");
    return NextResponse.json({
      ok: true,
      migrations: [
        { name: "0001_initial.sql", sql: file1 },
        { name: "0002_storage_auth_sync.sql", sql: file2 }
      ]
    });
  }

  // Bootstrap seed data + auth users (requires schema already applied)
  const probe = await admin.from("companies").select("id").limit(1);
  if (probe.error) {
    return NextResponse.json(
      {
        ok: false,
        error: probe.error.message,
        hint: "Run both SQL migrations in Supabase SQL Editor first."
      },
      { status: 409 }
    );
  }

  const companyUpsert = await admin
    .from("companies")
    .upsert(
      [
        {
          company_code: "APLX",
          name: "Apex Logistics",
          contact_email: "ops@apex.demo",
          address: "Mumbai, Maharashtra",
          status: "active"
        },
        {
          company_code: "BHMT",
          name: "Bharat Metals",
          contact_email: "security@bharat.demo",
          address: "Ahmedabad, Gujarat",
          status: "active"
        }
      ],
      { onConflict: "company_code" }
    )
    .select("*");

  if (companyUpsert.error) {
    return NextResponse.json({ ok: false, error: companyUpsert.error.message }, { status: 500 });
  }

  const apex = companyUpsert.data?.find((c) => c.company_code === "APLX");

  const users = [
    { email: "superadmin@security.app", password: "SecureDemo123!", role: "super_admin", full_name: "Super Admin", company_id: null as string | null },
    { email: "admin@apex.security.app", password: "SecureDemo123!", role: "company_admin", full_name: "Apex Admin", company_id: apex?.id ?? null },
    { email: "guard@apex.security.app", password: "SecureDemo123!", role: "guard", full_name: "Rahul Sharma", company_id: apex?.id ?? null }
  ];

  const createdUsers: Array<{ email: string; role: string }> = [];

  for (const user of users) {
    const existing = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const found = existing.data.users.find((item) => item.email?.toLowerCase() === user.email.toLowerCase());
    let userId = found?.id;

    if (!userId) {
      const created = await admin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          role: user.role,
          full_name: user.full_name,
          company_id: user.company_id
        }
      });
      if (created.error) {
        return NextResponse.json({ ok: false, error: created.error.message, email: user.email }, { status: 500 });
      }
      userId = created.data.user?.id;
    }

    if (userId) {
      await admin.from("profiles").upsert({
        id: userId,
        role: user.role,
        full_name: user.full_name,
        company_id: user.company_id,
        is_active: true
      });
      createdUsers.push({ email: user.email, role: user.role });
    }
  }

  if (apex) {
    await admin.from("gates").upsert(
      [
        { company_id: apex.id, name: "Gate 1", code: "APLX-G1", location: "North entrance", status: "active" },
        { company_id: apex.id, name: "Main Gate", code: "APLX-MAIN", location: "Main road", status: "active" }
      ],
      { onConflict: "company_id,code" }
    );

    const gates = await admin.from("gates").select("*").eq("company_id", apex.id);
    const mainGate = gates.data?.find((g) => g.code === "APLX-MAIN");
    const guardAuth = (await admin.auth.admin.listUsers({ page: 1, perPage: 200 })).data.users.find((u) => u.email === "guard@apex.security.app");

    if (mainGate && guardAuth) {
      await admin.from("guards").upsert(
        {
          company_id: apex.id,
          profile_id: guardAuth.id,
          employee_id: "GUARD-001",
          mobile_number: "9000000001",
          email: "guard@apex.security.app",
          assigned_gate_id: mainGate.id,
          status: "active",
          joining_date: "2026-01-12"
        },
        { onConflict: "company_id,employee_id" }
      );
    }

    await admin.from("vehicles").upsert(
      [
        {
          company_id: apex.id,
          vehicle_number: "GJ39CA2073",
          vehicle_type: "Truck",
          owner_name: "Apex Freight",
          driver_name: "Karan Patel",
          authorization_status: "authorized"
        },
        {
          company_id: apex.id,
          vehicle_number: "MH12AB4488",
          vehicle_type: "Car",
          owner_name: "Unknown",
          driver_name: "Unknown",
          authorization_status: "watchlist",
          notes: "Repeated suspicious entry attempts"
        }
      ],
      { onConflict: "company_id,vehicle_number" }
    );

    await admin.from("company_settings").upsert(
      {
        company_id: apex.id,
        verification_interval_minutes: 60,
        verification_window_minutes: 15,
        retention_days: 365
      },
      { onConflict: "company_id" }
    );
  }

  return NextResponse.json({
    ok: true,
    companies: companyUpsert.data?.length ?? 0,
    users: createdUsers,
    credentials: {
      password: "SecureDemo123!",
      accounts: users.map((u) => u.email)
    }
  });
}
