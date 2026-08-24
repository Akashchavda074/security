import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

async function requireProfile() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { error: NextResponse.json({ error: "Supabase not configured" }, { status: 500 }) };
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (!profile) return { error: NextResponse.json({ error: "Profile missing" }, { status: 403 }) };
  return { admin, user, profile };
}

export async function GET(request: Request) {
  const auth = await requireProfile();
  if ("error" in auth && auth.error) return auth.error;
  const { admin, profile } = auth as Awaited<ReturnType<typeof requireProfile>> & { admin: ReturnType<typeof createSupabaseAdminClient>; profile: { role: string; company_id: string | null } };

  const companyId = new URL(request.url).searchParams.get("companyId") ?? profile.company_id;
  if (!companyId) return NextResponse.json({ error: "companyId required" }, { status: 400 });
  if (profile.role !== "super_admin" && profile.company_id !== companyId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [gates, guards, vehicles] = await Promise.all([
    admin.from("gates").select("*").eq("company_id", companyId).order("name"),
    admin.from("guards").select("*").eq("company_id", companyId).order("employee_id"),
    admin.from("vehicles").select("*").eq("company_id", companyId).order("vehicle_number")
  ]);

  return NextResponse.json({
    gates: gates.data ?? [],
    guards: guards.data ?? [],
    vehicles: vehicles.data ?? [],
    errors: [gates.error?.message, guards.error?.message, vehicles.error?.message].filter(Boolean)
  });
}

export async function POST(request: Request) {
  const auth = await requireProfile();
  if ("error" in auth && auth.error) return auth.error;
  const { admin, profile, user } = auth as Awaited<ReturnType<typeof requireProfile>> & {
    admin: ReturnType<typeof createSupabaseAdminClient>;
    profile: { role: string; company_id: string | null };
    user: { id: string };
  };

  if (!["company_admin", "super_admin"].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const companyId = body.companyId ?? profile.company_id;
  if (!companyId) return NextResponse.json({ error: "companyId required" }, { status: 400 });
  if (profile.role !== "super_admin" && profile.company_id !== companyId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (body.entity === "gate") {
    const { data, error } = await admin
      .from("gates")
      .insert({ company_id: companyId, name: body.name, code: String(body.code).toUpperCase(), location: body.location ?? null, status: body.status ?? "active" })
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await admin.from("audit_logs").insert({ company_id: companyId, actor_user_id: user.id, action: "create_gate", entity: "gates", entity_id: data.id, new_value: data });
    return NextResponse.json({ gate: data });
  }

  if (body.entity === "guard") {
    const { data, error } = await admin
      .from("guards")
      .insert({
        company_id: companyId,
        employee_id: String(body.employeeId).toUpperCase(),
        mobile_number: body.mobileNumber ?? null,
        email: body.email ?? null,
        assigned_gate_id: body.assignedGateId ?? null,
        status: body.status ?? "active",
        joining_date: new Date().toISOString().slice(0, 10)
      })
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await admin.from("audit_logs").insert({ company_id: companyId, actor_user_id: user.id, action: "create_guard", entity: "guards", entity_id: data.id, new_value: data });
    return NextResponse.json({ guard: data });
  }

  if (body.entity === "vehicle") {
    const { data, error } = await admin
      .from("vehicles")
      .insert({
        company_id: companyId,
        vehicle_number: String(body.vehicleNumber).toUpperCase(),
        vehicle_type: body.vehicleType,
        owner_name: body.ownerName ?? null,
        driver_name: body.driverName ?? null,
        authorization_status: body.authorizationStatus ?? "authorized",
        notes: body.notes ?? null
      })
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await admin.from("audit_logs").insert({ company_id: companyId, actor_user_id: user.id, action: "create_vehicle", entity: "vehicles", entity_id: data.id, new_value: data });
    return NextResponse.json({ vehicle: data });
  }

  return NextResponse.json({ error: "Unknown entity" }, { status: 400 });
}

export async function PATCH(request: Request) {
  const auth = await requireProfile();
  if ("error" in auth && auth.error) return auth.error;
  const { admin, profile, user } = auth as Awaited<ReturnType<typeof requireProfile>> & {
    admin: ReturnType<typeof createSupabaseAdminClient>;
    profile: { role: string; company_id: string | null };
    user: { id: string };
  };

  if (!["company_admin", "super_admin"].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const companyId = body.companyId ?? profile.company_id;

  if (body.entity === "gate") {
    const { data, error } = await admin
      .from("gates")
      .update({ name: body.name, code: String(body.code).toUpperCase(), location: body.location ?? null, status: body.status ?? "active", updated_at: new Date().toISOString() })
      .eq("id", body.id)
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await admin.from("audit_logs").insert({ company_id: companyId, actor_user_id: user.id, action: "update_gate", entity: "gates", entity_id: data.id, new_value: data });
    return NextResponse.json({ gate: data });
  }

  if (body.entity === "guard") {
    const { data, error } = await admin
      .from("guards")
      .update({
        employee_id: String(body.employeeId).toUpperCase(),
        mobile_number: body.mobileNumber ?? null,
        assigned_gate_id: body.assignedGateId ?? null,
        status: body.status ?? "active",
        updated_at: new Date().toISOString()
      })
      .eq("id", body.id)
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await admin.from("audit_logs").insert({ company_id: companyId, actor_user_id: user.id, action: "update_guard", entity: "guards", entity_id: data.id, new_value: data });
    return NextResponse.json({ guard: data });
  }

  if (body.entity === "vehicle") {
    const { data, error } = await admin
      .from("vehicles")
      .update({
        vehicle_number: String(body.vehicleNumber).toUpperCase(),
        vehicle_type: body.vehicleType,
        owner_name: body.ownerName ?? null,
        driver_name: body.driverName ?? null,
        authorization_status: body.authorizationStatus ?? "authorized",
        notes: body.notes ?? null,
        updated_at: new Date().toISOString()
      })
      .eq("id", body.id)
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await admin.from("audit_logs").insert({ company_id: companyId, actor_user_id: user.id, action: "update_vehicle", entity: "vehicles", entity_id: data.id, new_value: data });
    return NextResponse.json({ vehicle: data });
  }

  return NextResponse.json({ error: "Unknown entity" }, { status: 400 });
}

export async function DELETE(request: Request) {
  const auth = await requireProfile();
  if ("error" in auth && auth.error) return auth.error;
  const { admin, profile, user } = auth as Awaited<ReturnType<typeof requireProfile>> & {
    admin: ReturnType<typeof createSupabaseAdminClient>;
    profile: { role: string; company_id: string | null };
    user: { id: string };
  };

  if (!["company_admin", "super_admin"].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const entity = searchParams.get("entity");
  const id = searchParams.get("id");
  const companyId = searchParams.get("companyId") ?? profile.company_id;
  if (!entity || !id) return NextResponse.json({ error: "entity and id required" }, { status: 400 });

  const table = entity === "gate" ? "gates" : entity === "guard" ? "guards" : entity === "vehicle" ? "vehicles" : null;
  if (!table) return NextResponse.json({ error: "Unknown entity" }, { status: 400 });

  const { error } = await admin.from(table).delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await admin.from("audit_logs").insert({ company_id: companyId, actor_user_id: user.id, action: `delete_${entity}`, entity: table, entity_id: id });
  return NextResponse.json({ ok: true });
}
