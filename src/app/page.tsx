import Link from "next/link";
import { ArrowRight, Shield, Smartphone, Database, ScanSearch, Clock3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";

const pillars = [
  { icon: Shield, title: "Security first", text: "RLS-ready multi-tenant data model with role-aware routes and audit-first workflows." },
  { icon: Smartphone, title: "Mobile PWA", text: "Guard screens are built for phones, with offline queue scaffolding and install support." },
  { icon: Database, title: "Supabase-ready", text: "Server and browser clients are wired for authentication and private storage patterns." },
  { icon: ScanSearch, title: "Evidence workflow", text: "Vehicle entry, OCR correction, image compression, and verification flow foundations." }
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-grid-fade text-slate-100">
      <section className="mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <StatusPill tone="info">Security Management PWA foundation</StatusPill>
          <h1 className="mt-6 text-5xl font-semibold tracking-tight text-white sm:text-6xl">
            A secure, offline-capable security operations platform
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            This scaffold sets up the production-first base for Super Admin, Company Admin, and Guard workflows with PWA support, role-aware layouts, and a Supabase-ready multi-tenant architecture.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300"
            >
              Open login
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard/guard"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white transition hover:bg-white/10"
            >
              View guard shell
            </Link>
          </div>
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <Card key={pillar.title} className="bg-white/5">
                <Icon className="h-6 w-6 text-emerald-300" />
                <h2 className="mt-4 text-xl font-semibold text-white">{pillar.title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">{pillar.text}</p>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Card>
            <div className="flex items-center gap-2 text-amber-300">
              <Clock3 className="h-4 w-4" />
              Offline queue ready
            </div>
            <p className="mt-3 text-sm text-slate-300">Client-side queueing is scaffolded so guard actions can keep moving when the network drops.</p>
          </Card>
          <Card>
            <div className="flex items-center gap-2 text-sky-300">
              <Shield className="h-4 w-4" />
              Audit-friendly
            </div>
            <p className="mt-3 text-sm text-slate-300">Sensitive actions are designed to be append-only and traceable from the backend schema onward.</p>
          </Card>
          <Card>
            <div className="flex items-center gap-2 text-emerald-300">
              <Database className="h-4 w-4" />
              Multi-company isolation
            </div>
            <p className="mt-3 text-sm text-slate-300">Every tenant-owned table is planned with `company_id` and RLS policies in the migration layer.</p>
          </Card>
        </div>
      </section>
    </main>
  );
}
