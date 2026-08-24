import { NextResponse } from "next/server";

export function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

  return NextResponse.json({
    ok: true,
    service: "security-management-pwa",
    mode: "running",
    timestamp: new Date().toISOString(),
    supabase: {
      configured: Boolean(url && anon),
      urlHost: url ? new URL(url).host : null,
      hasAnonKey: Boolean(anon),
      hasServiceKey: Boolean(service),
      jwksConfigured: Boolean(process.env.SUPABASE_JWKS_URL)
    },
    demoLogin: process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN === "true"
  });
}
