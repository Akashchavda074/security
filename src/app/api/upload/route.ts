import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await request.formData();
  const file = form.get("file");
  const companyId = String(form.get("companyId") ?? "");
  const kind = String(form.get("kind") ?? "vehicles");

  if (!(file instanceof File) || !companyId) {
    return NextResponse.json({ error: "file and companyId required" }, { status: 400 });
  }

  const now = new Date();
  const pathName = `${companyId}/${kind}/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${String(now.getUTCDate()).padStart(2, "0")}/${crypto.randomUUID()}.jpg`;

  const admin = createSupabaseAdminClient();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const { error } = await admin.storage.from("security-evidence").upload(pathName, bytes, {
    contentType: file.type || "image/jpeg",
    upsert: false
  });

  if (error) {
    return NextResponse.json({ error: error.message, hint: "Ensure migration 0002 created the security-evidence bucket." }, { status: 500 });
  }

  const { data: signed } = await admin.storage.from("security-evidence").createSignedUrl(pathName, 60 * 60 * 24 * 7);

  return NextResponse.json({
    path: pathName,
    signedUrl: signed?.signedUrl ?? null
  });
}
