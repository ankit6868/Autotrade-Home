"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, Inbox, UserCog, Globe, LogOut } from "lucide-react";
import { site } from "@/lib/site";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/enquiries", label: "Enquiries", icon: Inbox, badge: true },
  { href: "/admin/account", label: "Account", icon: UserCog },
];

export default function AdminSidebar({ username }: { username: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [unread, setUnread] = useState<number>(0);

  useEffect(() => {
    let alive = true;
    fetch("/api/admin/enquiries")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => alive && d?.stats && setUnread(d.stats.unread || 0))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [pathname]);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => {});
    router.replace("/admin/login");
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-60 flex-col border-r border-white/[0.06] bg-ink-900">
      <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-5">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-brand-400 to-iris-500 text-xs font-black text-ink-950">
          AT
        </div>
        <div className="leading-tight">
          <div className="text-sm font-bold text-white">{site.brandShort}</div>
          <div className="text-[10px] uppercase tracking-[0.14em] text-slate-500">Admin Panel</div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">Management</p>
        {NAV.map((n) => {
          const active = pathname === n.href;
          const Icon = n.icon;
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-brand-500/15 text-brand-400"
                  : "text-slate-300 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1">{n.label}</span>
              {n.badge && unread > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-danger px-1.5 text-[10px] font-bold text-white">
                  {unread}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-white/[0.06] px-3 py-4">
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/[0.04] hover:text-white"
        >
          <Globe className="h-4 w-4" /> View Site
        </a>
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-danger hover:bg-danger/10"
        >
          <LogOut className="h-4 w-4" /> Logout
        </button>
        <p className="px-3 pt-2 text-[10px] text-slate-600">Signed in as {username}</p>
      </div>
    </aside>
  );
}
