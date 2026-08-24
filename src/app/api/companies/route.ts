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

  return { supabase, admin, user, profile };
}

export async function GET() {
  const auth = await requireProfile();
  if ("error" in auth && auth.error) return auth.error;

  const { admin, profile } = auth as Awaited<ReturnType<typeof requireProfile>> & { admin: ReturnType<typeof createSupabaseAdminClient>; profile: { role: string; company_id: string | null } };

  let query = admin.from("companies").select("*").order("created_at", { ascending: false });
  if (profile.role !== "super_admin" && profile.company_id) {
    query = query.eq("id", profile.company_id);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ companies: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireProfile();
  if ("error" in auth && auth.error) return auth.error;
  const { admin, profile, user } = auth as Awaited<ReturnType<typeof requireProfile>> & {
    admin: ReturnType<typeof createSupabaseAdminClient>;
    profile: { role: string };
    user: { id: string };
  };

  if (profile.role !== "super_admin") {
    return NextResponse.json({ error: "Only super admin can create companies" }, { status: 403 });
  }

  const body = await request.json();
  const { data, error } = await admin
    .from("companies")
    .insert({
      name: body.name,
      company_code: String(body.code ?? body.company_code ?? "").toUpperCase(),
      contact_email: body.contactInfo ?? body.contact_email ?? null,
      address: body.address ?? null,
      status: body.status ?? "active"
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await admin.from("audit_logs").insert({
    company_id: data.id,
    actor_user_id: user.id,
    action: "create_company",
    entity: "companies",
    entity_id: data.id,
    new_value: data
  });

  return NextResponse.json({ company: data });
}

export async function PATCH(request: Request) {
  const auth = await requireProfile();
  if ("error" in auth && auth.error) return auth.error;
  const { admin, profile, user } = auth as Awaited<ReturnType<typeof requireProfile>> & {
    admin: ReturnType<typeof createSupabaseAdminClient>;
    profile: { role: string };
    user: { id: string };
  };

  if (profile.role !== "super_admin") {
    return NextResponse.json({ error: "Only super admin can update companies" }, { status: 403 });
  }

  const body = await request.json();
  const { data, error } = await admin
    .from("companies")
    .update({
      name: body.name,
      company_code: String(body.code ?? body.company_code ?? "").toUpperCase(),
      contact_email: body.contactInfo ?? body.contact_email ?? null,
      address: body.address ?? null,
      status: body.status,
      updated_at: new Date().toISOString()
    })
    .eq("id", body.id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await admin.from("audit_logs").insert({
    company_id: data.id,
    actor_user_id: user.id,
    action: "update_company",
    entity: "companies",
    entity_id: data.id,
    new_value: data
  });

  return NextResponse.json({ company: data });
}

export async function DELETE(request: Request) {
  const auth = await requireProfile();
  if ("error" in auth && auth.error) return auth.error;
  const { admin, profile, user } = auth as Awaited<ReturnType<typeof requireProfile>> & {
    admin: ReturnType<typeof createSupabaseAdminClient>;
    profile: { role: string };
    user: { id: string };
  };

  if (profile.role !== "super_admin") {
    return NextResponse.json({ error: "Only super admin can delete companies" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const { error } = await admin.from("companies").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await admin.from("audit_logs").insert({
    company_id: id,
    actor_user_id: user.id,
    action: "delete_company",
    entity: "companies",
    entity_id: id
  });

  return NextResponse.json({ ok: true });
}
