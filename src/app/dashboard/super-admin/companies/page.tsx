"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status-pill";
import { useLocalSystem } from "@/components/local-system-provider";
import type { CompanyStatus } from "@/lib/types";

const emptyForm = {
  name: "",
  code: "",
  contactInfo: "",
  address: "",
  status: "active" as CompanyStatus
};

type RemoteCompany = {
  id: string;
  name: string;
  company_code: string;
  contact_email: string | null;
  address: string | null;
  status: CompanyStatus;
};

export default function SuperAdminCompaniesPage() {
  const { state, createCompany, updateCompany, updateCompanyStatus, deleteCompany } = useLocalSystem();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [remoteCompanies, setRemoteCompanies] = useState<RemoteCompany[]>([]);
  const [backendNote, setBackendNote] = useState("Using local store. Sign in with Supabase to use Postgres CRUD.");

  async function loadRemote() {
    try {
      const response = await fetch("/api/companies");
      if (!response.ok) {
        setBackendNote("Postgres API unavailable (login with Supabase after migrations). Local CRUD still works.");
        return;
      }
      const data = await response.json();
      setRemoteCompanies(data.companies ?? []);
      setBackendNote("Connected to Supabase Postgres for company CRUD.");
    } catch {
      setBackendNote("Postgres API unavailable. Local CRUD still works.");
    }
  }

  useEffect(() => {
    void loadRemote();
  }, []);

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function startEdit(companyId: string) {
    const remote = remoteCompanies.find((item) => item.id === companyId);
    if (remote) {
      setEditingId(remote.id);
      setForm({
        name: remote.name,
        code: remote.company_code,
        contactInfo: remote.contact_email ?? "",
        address: remote.address ?? "",
        status: remote.status
      });
      return;
    }
    const company = state.companies.find((item) => item.id === companyId);
    if (!company) return;
    setEditingId(company.id);
    setForm({
      name: company.name,
      code: company.code,
      contactInfo: company.contactInfo,
      address: company.address,
      status: company.status
    });
  }

  async function saveCompany() {
    if (!form.name || !form.code) return;

    if (editingId && remoteCompanies.some((item) => item.id === editingId)) {
      const response = await fetch("/api/companies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingId, ...form, company_code: form.code, contact_email: form.contactInfo })
      });
      if (response.ok) {
        await loadRemote();
        resetForm();
        return;
      }
    }

    if (!editingId) {
      const response = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      if (response.ok) {
        await loadRemote();
        resetForm();
        return;
      }
    }

    if (editingId) updateCompany(editingId, form);
    else createCompany(form);
    resetForm();
  }

  const localList = state.companies;
  const showRemote = remoteCompanies.length > 0;

  return (
    <div className="space-y-6">
      <Card>
        <StatusPill tone="info">{editingId ? "Edit company" : "Create company"}</StatusPill>
        <h1 className="mt-3 text-2xl font-semibold text-white">{editingId ? "Update company" : "Add company"}</h1>
        <p className="mt-2 text-sm text-slate-400">{backendNote}</p>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <input value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} placeholder="Company name" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none" />
          <input value={form.code} onChange={(e) => setForm((current) => ({ ...current, code: e.target.value }))} placeholder="Company code" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none" />
          <input value={form.contactInfo} onChange={(e) => setForm((current) => ({ ...current, contactInfo: e.target.value }))} placeholder="Contact info" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none" />
          <input value={form.address} onChange={(e) => setForm((current) => ({ ...current, address: e.target.value }))} placeholder="Address" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none" />
          <select value={form.status} onChange={(e) => setForm((current) => ({ ...current, status: e.target.value as CompanyStatus }))} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none">
            <option value="active" className="bg-slate-950">Active</option>
            <option value="suspended" className="bg-slate-950">Suspended</option>
          </select>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => void saveCompany()} className="rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950">
            {editingId ? "Save changes" : "Create company"}
          </button>
          {editingId ? (
            <button type="button" onClick={resetForm} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white">
              Cancel edit
            </button>
          ) : null}
        </div>
      </Card>

      <Card>
        <StatusPill tone="info">{showRemote ? "Postgres companies" : "Local companies"}</StatusPill>
        <h2 className="mt-3 text-2xl font-semibold text-white">Manage companies</h2>
        <div className="mt-5 grid gap-3">
          {(showRemote ? remoteCompanies : localList).map((company) => {
            const id = company.id;
            const name = "company_code" in company ? company.name : company.name;
            const code = "company_code" in company ? company.company_code : company.code;
            const contact = "company_code" in company ? company.contact_email ?? "" : company.contactInfo;
            const address = "company_code" in company ? company.address ?? "" : company.address;
            const status = company.status;

            return (
              <div key={id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-medium text-white">{name}</div>
                    <div className="mt-1 text-sm text-slate-400">
                      {code} • {contact || "No contact"} • {address || "No address"}
                    </div>
                  </div>
                  <StatusPill tone={status === "active" ? "success" : "danger"}>{status.toUpperCase()}</StatusPill>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={() => startEdit(id)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white">
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (showRemote) {
                        await fetch("/api/companies", {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            id,
                            name,
                            code,
                            contactInfo: contact,
                            address,
                            status: status === "active" ? "suspended" : "active"
                          })
                        });
                        await loadRemote();
                      } else {
                        updateCompanyStatus(id, status === "active" ? "suspended" : "active");
                      }
                    }}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white"
                  >
                    {status === "active" ? "Suspend" : "Activate"}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!window.confirm(`Delete ${name}?`)) return;
                      if (showRemote) {
                        await fetch(`/api/companies?id=${id}`, { method: "DELETE" });
                        await loadRemote();
                      } else {
                        deleteCompany(id);
                      }
                      if (editingId === id) resetForm();
                    }}
                    className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
