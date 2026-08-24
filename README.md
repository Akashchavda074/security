# Security Management PWA

Production-oriented starter for a multi-company security management platform.

## Stack

- Next.js App Router
- TypeScript strict mode
- Tailwind CSS
- Supabase-ready auth and data layer
- PWA shell with offline queue scaffolding
- Postgres schema and RLS migration

## Getting started

1. Copy `.env.example` to `.env.local` and add Supabase keys.
2. Open http://localhost:3000/setup
3. In Supabase SQL Editor, run `supabase/ALL_MIGRATIONS.sql` (or `0001` then `0002`).
4. Click **Bootstrap seed data** on `/setup`.
5. Sign in at `/login` with bootstrap accounts.

## Stack

- Next.js App Router
- TypeScript strict mode
- Tailwind CSS
- Supabase Auth + Postgres + Storage + RLS
- PWA offline queue with sync API
- Live camera capture, client OCR (Tesseract), image compression

## Bootstrap accounts (after setup)

- `superadmin@security.app` / `SecureDemo123!`
- `admin@apex.security.app` / `SecureDemo123!`
- `guard@apex.security.app` / `SecureDemo123!`

Demo fallback remains available when `NEXT_PUBLIC_ENABLE_DEMO_LOGIN=true`.

## Hourly verification cron

`POST /api/cron/verification-alerts` with `Authorization: Bearer $CRON_SECRET`  
(Vercel cron configured in `vercel.json` for hourly runs)
