"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Trash2, Download, RotateCcw } from "lucide-react";

type Enquiry = {
  id: number;
  name: string;
  email: string;
  phone: string;
  portfolio: string;
  interests: string;
  message: string;
  status: string;
  created_at: string;
};

function fmt(d: string) {
  return new Date(d).toLocaleString(undefined, {
    month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
  });
}

export default function EnquiriesPage() {
  const [rows, setRows] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "new">("all");

  async function load() {
    setLoading(true);
    const d = await fetch("/api/admin/enquiries").then((r) => r.json());
    setRows(d.enquiries || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function setStatus(id: number, status: "read" | "new") {
    setRows((p) => p.map((r) => (r.id === id ? { ...r, status } : r)));
    await fetch(`/api/admin/enquiries/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }),
    });
  }
  async function remove(id: number) {
    if (!confirm("Delete this enquiry permanently?")) return;
    setRows((p) => p.filter((r) => r.id !== id));
    await fetch(`/api/admin/enquiries/${id}`, { method: "DELETE" });
  }

  const shown = useMemo(
    () => (filter === "new" ? rows.filter((r) => r.status === "new") : rows),
    [rows, filter],
  );
  const unread = rows.filter((r) => r.status === "new").length;

  function exportCsv() {
    const head = ["Name", "Email", "Phone", "Portfolio", "Interests", "Message", "Status", "Date"];
    const esc = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = [
      head.join(","),
      ...rows.map((r) =>
        [r.name, r.email, r.phone, r.portfolio, r.interests, r.message, r.status, fmt(r.created_at)].map(esc).join(","),
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `autotrade-enquiries-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="px-6 py-8 sm:px-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Enquiries</h1>
          <p className="mt-1 text-sm text-slate-400">
            {rows.length} total · <span className="text-danger">{unread} unread</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-white/[0.08] p-0.5">
            {(["all", "new"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize ${
                  filter === f ? "bg-white/[0.08] text-white" : "text-slate-400"
                }`}
              >
                {f === "new" ? "Unread" : "All"}
              </button>
            ))}
          </div>
          <button onClick={load} className="btn-ghost !py-2 !text-xs" title="Refresh">
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <button onClick={exportCsv} className="btn-ghost !py-2 !text-xs">
            <Download className="h-3.5 w-3.5" /> CSV
          </button>
        </div>
      </div>

      <div className="glass overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-slate-500">
              <tr className="border-b border-white/[0.06]">
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold">Contact</th>
                <th className="px-5 py-3 font-semibold">Interested / Portfolio</th>
                <th className="px-5 py-3 font-semibold">Message</th>
                <th className="px-5 py-3 font-semibold">When</th>
                <th className="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-500">Loading…</td></tr>
              ) : shown.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-12 text-center text-slate-500">Nothing here yet.</td></tr>
              ) : (
                shown.map((r) => (
                  <tr
                    key={r.id}
                    className={`border-b border-white/[0.04] align-top hover:bg-white/[0.02] ${
                      r.status === "new" ? "bg-brand-500/[0.04]" : ""
                    }`}
                  >
                    <td className="px-5 py-4">
                      <div className="font-medium text-white">{r.name}</div>
                      {r.status === "new" && (
                        <span className="mt-1 inline-block rounded-full bg-danger/15 px-2 py-0.5 text-[10px] font-bold uppercase text-danger">New</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {r.email && <a href={`mailto:${r.email}`} className="block text-brand-400 hover:underline">{r.email}</a>}
                      {r.phone && <div className="text-slate-400">{r.phone}</div>}
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-slate-200">{r.interests || "—"}</div>
                      {r.portfolio && <div className="text-[11px] text-slate-500">{r.portfolio}</div>}
                    </td>
                    <td className="px-5 py-4 max-w-[280px]">
                      <div className="text-slate-300">{r.message || <span className="text-slate-600">—</span>}</div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-slate-400">{fmt(r.created_at)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        {r.status === "new" ? (
                          <button onClick={() => setStatus(r.id, "read")} title="Mark read"
                            className="grid h-8 w-8 place-items-center rounded-lg border border-ok/30 bg-ok/10 text-ok hover:bg-ok/20">
                            <Check className="h-4 w-4" />
                          </button>
                        ) : (
                          <button onClick={() => setStatus(r.id, "new")} title="Mark unread"
                            className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-slate-400 hover:text-white">
                            <RotateCcw className="h-4 w-4" />
                          </button>
                        )}
                        <button onClick={() => remove(r.id)} title="Delete"
                          className="grid h-8 w-8 place-items-center rounded-lg border border-danger/30 bg-danger/10 text-danger hover:bg-danger/20">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
