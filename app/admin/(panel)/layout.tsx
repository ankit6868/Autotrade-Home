import { redirect } from "next/navigation";
import { currentAdmin } from "@/lib/db";
import AdminSidebar from "@/components/admin/AdminSidebar";

// Server-side guard for every /admin panel page. Runs on the Node runtime so it
// can verify the signed cookie against the DB session secret. /admin/login is
// OUTSIDE this route group, so it isn't guarded (no redirect loop).
export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const username = await currentAdmin();
  if (!username) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-ink-950 text-slate-200">
      <AdminSidebar username={username} />
      <main className="ml-60 min-h-screen">{children}</main>
    </div>
  );
}
