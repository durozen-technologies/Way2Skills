"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  BriefcaseBusiness,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareText,
  X,
} from "lucide-react";
import { AdminAuthProvider, AdminLogin, useAdminAuth } from "@/components/admin/AdminAuth";

const navigation = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/courses", label: "Courses", icon: BookOpen },
  { href: "/admin/internships", label: "Internships", icon: BriefcaseBusiness },
  { href: "/admin/feedback", label: "Feedback", icon: MessageSquareText },
] as const;

function AdminShell({ children }: { children: ReactNode }) {
  const { admin, token, logout, pagePath, pageTitle } = useAdminAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const router = useRouter();

  if (!token || !admin) return <AdminLogin />;

  function signOut() {
    logout();
    setDrawerOpen(false);
    router.replace("/admin");
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {drawerOpen && (
        <button
          aria-label="Close navigation drawer"
          className="fixed inset-0 z-40 bg-slate-950/40 md:hidden"
          onClick={() => setDrawerOpen(false)}
          type="button"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[#17263D] text-slate-100 transition-transform duration-200 md:translate-x-0 ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
          <div>
            <p className="text-lg font-bold tracking-tight">Way2Skills</p>
            <p className="mt-0.5 text-xs text-slate-400">Administration</p>
          </div>
          <button
            aria-label="Close navigation"
            className="rounded-lg p-2 text-slate-300 hover:bg-white/10 md:hidden"
            onClick={() => setDrawerOpen(false)}
            type="button"
          >
            <X aria-hidden="true" size={19} />
          </button>
        </div>
        <nav aria-label="Admin navigation" className="flex-1 space-y-1 px-3 py-5">
          {navigation.map(({ href, label, icon: Icon }) => {
            const active = pagePath === href;
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 ${
                  active
                    ? "bg-sky-500/15 text-sky-200"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
                href={href}
                key={href}
                onClick={() => setDrawerOpen(false)}
              >
                <Icon aria-hidden="true" size={18} strokeWidth={1.8} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-3">
          <div className="mb-2 truncate px-3 py-2 text-xs text-slate-400" title={admin.email}>
            Signed in as <span className="block truncate text-slate-200">{admin.email}</span>
          </div>
          <button
            className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
            onClick={signOut}
            type="button"
          >
            <LogOut aria-hidden="true" size={18} strokeWidth={1.8} />
            Logout
          </button>
        </div>
      </aside>

      <div className="min-h-screen md:pl-64">
        <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 md:px-8">
          <div className="flex items-center gap-3">
            <button
              aria-label="Open navigation menu"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 md:hidden"
              onClick={() => setDrawerOpen(true)}
              type="button"
            >
              <Menu aria-hidden="true" size={19} />
            </button>
            <div>
              <p className="text-xs font-medium text-slate-500">Way2Skills Admin</p>
              <h1 className="text-lg font-semibold tracking-tight text-slate-950">
                {pageTitle}
              </h1>
            </div>
          </div>
          <span className="hidden max-w-56 truncate text-sm text-slate-600 sm:block">
            {admin.email}
          </span>
        </header>
        <main className="px-4 py-6 sm:px-6 sm:py-8 md:px-8">{children}</main>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminAuthProvider>
      <AdminShell>{children}</AdminShell>
    </AdminAuthProvider>
  );
}
