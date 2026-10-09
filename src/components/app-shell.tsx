"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  Briefcase,
  Camera,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  LogOut,
  Users,
} from "lucide-react";
import { logout } from "@/app/login/actions";
import { SHOP } from "@/lib/data";

export type ShellUser = { id: string; name: string; role: string; initials: string };

const NAV = [
  { href: "/dashboard", label: "Dashboard", short: "Home", icon: LayoutDashboard },
  { href: "/jobs", label: "Jobs", short: "Jobs", icon: Briefcase },
  { href: "/inspections", label: "Inspections", short: "Inspect", icon: ClipboardCheck },
  { href: "/media", label: "Photos & Video", short: "Media", icon: Camera },
  { href: "/customers", label: "Customers", short: "Clients", icon: Users },
  { href: "/reports", label: "Reports", short: "Reports", icon: FileText },
];

export function AppShell({ user, children }: { user: ShellUser; children: ReactNode }) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="min-h-dvh bg-slate-100">
      {/* Desktop / tablet sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-slate-950 text-slate-300 md:flex">
        <div className="flex items-center gap-3 border-b border-white/5 px-5 py-5">
          <span className="anim-spin-slow grid size-10 place-items-center rounded-xl bg-gradient-to-br from-amber-300 to-orange-500">
            <svg viewBox="0 0 48 48" className="size-6 text-slate-900" fill="none" aria-hidden="true">
              <circle cx="24" cy="24" r="17" stroke="currentColor" strokeWidth="5" />
              <circle cx="24" cy="24" r="6" fill="currentColor" />
            </svg>
          </span>
          <div>
            <p className="font-semibold leading-tight text-white">{SHOP.name}</p>
            <p className="text-[11px] uppercase tracking-[0.16em] text-amber-300/80">Shop Operations</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-5">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-white/10 text-white shadow-inner ring-1 ring-white/10"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className={`size-[18px] transition-colors ${active ? "text-amber-400" : "text-slate-500 group-hover:text-amber-300"}`} />
                {label}
                {active && <span className="ml-auto size-1.5 rounded-full bg-amber-400" />}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-3 border-t border-white/5 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
            <span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-amber-300 to-orange-500 text-xs font-bold text-slate-900">
              {user.initials}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{user.name}</p>
              <p className="truncate text-xs text-slate-400">{user.role}</p>
            </div>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              <LogOut className="size-4" /> Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between bg-slate-950/95 px-4 pb-3 pt-[max(env(safe-area-inset-top),0.75rem)] text-white backdrop-blur md:hidden">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-amber-300 to-orange-500 text-slate-900">
            <svg viewBox="0 0 48 48" className="size-5" fill="none" aria-hidden="true">
              <circle cx="24" cy="24" r="17" stroke="currentColor" strokeWidth="5" />
              <circle cx="24" cy="24" r="6" fill="currentColor" />
            </svg>
          </span>
          <p className="text-[15px] font-semibold">Castle Tire</p>
        </div>
        <form action={logout}>
          <button
            type="submit"
            aria-label="Sign out"
            className="grid size-9 place-items-center rounded-full bg-white/10 text-xs font-bold ring-1 ring-white/10"
          >
            {user.initials}
          </button>
        </form>
      </header>

      <main className="min-h-dvh pb-28 md:ml-64 md:pb-10">
        <div className="page-enter mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">{children}</div>
      </main>

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 pb-[max(env(safe-area-inset-bottom),0.5rem)] backdrop-blur md:hidden">
        <ul className="grid grid-cols-6">
          {NAV.map(({ href, short, icon: Icon }) => {
            const active = isActive(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition ${
                    active ? "text-amber-600" : "text-slate-500"
                  }`}
                >
                  <span className={`grid h-7 w-12 place-items-center rounded-full transition ${active ? "bg-amber-100" : ""}`}>
                    <Icon className="size-[18px]" />
                  </span>
                  {short}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
