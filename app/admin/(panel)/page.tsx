"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Inbox, MailWarning, CalendarClock, ArrowUpRight } from "lucide-react";

type Enquiry = {
  id: number;
  name: string;
  email: string;
  phone: string;
  interests: string;
  message: string;
  status: string;
  created_at: string;
};
type Stats = { total: number; unread: number; today: number };

function fmt(d: string) {
  return new Date(d).toLocaleDateString(undefined, {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
}

export default function Dashboard() {
  const [rows, setRows] = useState<Enquiry[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, unread: 0, today: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/enquiries")
      .then((r) => r.json())
      .then((d) => {
        setRows(d.enquiries || []);
        setStats(d.stats || { total: 0, unread: 0, today: 0 });
      })
      .finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: "Total enquiries", value: stats.total, icon: Inbox, tone: "text-brand-400" },
    { label: "Unread", value: stats.unread, icon: MailWarning, tone: "text-danger" },
    { label: "Today", value: stats.today, icon: CalendarClock, tone: "text-ok" },
  ];

  return (
    <div className="px-6 py-8 sm:px-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight text-white">Dashboard</h1>
        <Link href="/" target="_blank" className="btn-ghost !py-2 !text-xs">
          View Site <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-[0.14em] text-slate-500">{c.label}</span>
              <c.icon className={`h-4 w-4 ${c.tone}`} />
            </div>
            <div className={`mt-3 text-4xl font-black tabular ${c.tone}`}>{loading ? "—" : c.value}</div>
          </div>
        ))}
      </div>

      <div className="glass mt-8 overflow-hidden rounded-2xl">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <h2 className="text-sm font-bold text-white">Recent enquiries</h2>
          <Link href="/admin/enquiries" className="text-xs font-medium text-brand-400 hover:text-brand-500">
            View all →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-slate-500">
              <tr className="border-b border-white/[0.06]">
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold">Contact</th>
                <th className="px-5 py-3 font-semibold">Interested in</th>
                <th className="px-5 py-3 font-semibold">When</th>
                <th className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-500">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-500">No enquiries yet.</td></tr>
              ) : (
                rows.slice(0, 10).map((r) => (
                  <tr key={r.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                    <td className="px-5 py-3.5 font-medium text-white">{r.name}</td>
                    <td className="px-5 py-3.5">
                      {r.email && <div className="text-brand-400">{r.email}</div>}
                      {r.phone && <div className="text-slate-400">{r.phone}</div>}
                    </td>
                    <td className="px-5 py-3.5 text-slate-300">{r.interests || "—"}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-slate-400">{fmt(r.created_at)}</td>
                    <td className="px-5 py-3.5">
                      {r.status === "new" ? (
                        <span className="rounded-full bg-danger/15 px-2 py-0.5 text-[10px] font-bold uppercase text-danger">New</span>
                      ) : (
                        <span className="rounded-full bg-ok/15 px-2 py-0.5 text-[10px] font-bold uppercase text-ok">Read</span>
                      )}
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
