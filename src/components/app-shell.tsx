"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  BookOpen,
  Briefcase,
  Camera,
  Car,
  ClipboardCheck,
  Compass,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Plus,
  Receipt,
  Settings,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { logout } from "@/app/login/actions";
import { CastleLogo } from "@/components/brand";
import { GuidedTour, WelcomeModal, useOnboarding, useTourState } from "@/components/onboarding";
import { PersistenceNotice } from "@/components/persistence-notice";
import { PageSkeleton } from "@/components/ui";
import type { ShopState } from "@/lib/data";
import { MeProvider, useShopState, type Me } from "@/lib/store";

type BadgeKey = "waiting" | "estimates" | "messages" | "reports";
type NavItem = { href: string; label: string; icon: LucideIcon; badge?: BadgeKey; hint?: string };

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, hint: "Morning briefing" },
  { href: "/jobs", label: "Today's Jobs", icon: Briefcase, badge: "waiting", hint: "Check-in to pickup" },
  { href: "/customers", label: "Customers", icon: Users, hint: "Name, phone, plate" },
  { href: "/vehicles", label: "Vehicles", icon: Car, hint: "History + health" },
  { href: "/inspections", label: "Inspections", icon: ClipboardCheck, hint: "Green / yellow / red" },
  { href: "/media", label: "Photos & Video", icon: Camera, hint: "Proof per corner" },
  { href: "/estimates", label: "Estimates", icon: Receipt, badge: "estimates", hint: "One-tap pricing" },
  { href: "/expenses", label: "Expenses", icon: Wallet, hint: "Money in vs out" },
  { href: "/messages", label: "Messages", icon: MessageSquare, badge: "messages", hint: "Every text logged" },
  { href: "/reports", label: "Reports", icon: FileText, badge: "reports", hint: "Text the link" },
  { href: "/guide", label: "Newcomer Guide", icon: BookOpen, hint: "Learn in 10 min" },
  { href: "/settings", label: "Settings", icon: Settings, hint: "Shop + data" },
];

const TABS: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/jobs", label: "Jobs", icon: Briefcase, badge: "waiting" },
  { href: "/inspections", label: "Inspect", icon: ClipboardCheck },
  { href: "/messages", label: "Messages", icon: MessageSquare, badge: "messages" },
];

function badgeCounts(s: ShopState | null): Record<BadgeKey, number> {
  if (!s) return { waiting: 0, estimates: 0, messages: 0, reports: 0 };
  return {
    waiting: s.jobs.filter((j) => j.date === s.anchorDay && j.status === "waiting").length,
    estimates: s.estimates.filter((e) => e.status === "sent").length,
    messages: s.messages.filter((m) => m.direction === "in" && m.at.startsWith(s.anchorDay)).length,
    reports: s.reports.filter((r) => !r.sentAt).length,
  };
}

export function AppShell({ user, children }: { user: Me; children: ReactNode }) {
  const pathname = usePathname();
  const state = useShopState();
  const [drawer, setDrawer] = useState(false);
  const counts = badgeCounts(state);
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const { welcomeOpen, dismissWelcome, setWelcomeOpen } = useOnboarding();
  const { tour, setTour, start } = useTourState();

  const startTour = () => {
    dismissWelcome();
    setDrawer(false);
    start();
  };

  const navList = (onNavigate?: () => void) => (
    <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
      {NAV.map(({ href, label, icon: Icon, badge, hint }) => {
        const active = isActive(href);
        const count = badge ? counts[badge] : 0;
        const isGuide = href === "/guide";
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            title={hint}
            className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
              isGuide
                ? active
                  ? "bg-brand-600 text-white shadow-lg shadow-brand-600/30"
                  : "bg-brand-600/10 text-brand-200 ring-1 ring-brand-500/30 hover:bg-brand-600/20 hover:text-white"
                : active
                  ? "bg-white/10 text-white ring-1 ring-white/10"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Icon className={`size-[18px] ${isGuide ? "" : active ? "text-brand-400" : "text-slate-500 group-hover:text-brand-300"}`} />
            <span className="min-w-0 flex-1">
              {label}
              {hint && !active && <span className="block truncate text-[11px] font-normal opacity-60">{hint}</span>}
            </span>
            {count > 0 && (
              <span className="ml-auto rounded-full bg-brand-600 px-2 py-0.5 text-[11px] font-bold text-white">{count}</span>
            )}
          </Link>
        );
      })}
      <button
        type="button"
        onClick={() => {
          onNavigate?.();
          startTour();
        }}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-white/5 hover:text-white"
      >
        <Compass className="size-[18px] text-slate-500" />
        Replay 60-sec tour
      </button>
    </nav>
  );

  const userCard = (
    <div className="space-y-3 border-t border-white/5 p-4">
      <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
        <span className="grid size-9 place-items-center rounded-full bg-brand-600 text-xs font-bold text-white">{user.initials}</span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{user.name}</p>
          <p className="truncate text-xs text-slate-400">{user.role}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setWelcomeOpen(true)}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-slate-300 transition hover:bg-white/5 hover:text-white"
        >
          <BookOpen className="size-3.5" /> Welcome
        </button>
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-300 transition hover:bg-white/5 hover:text-white"
          >
            <LogOut className="size-3.5" /> Sign out
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <MeProvider me={user}>
      <div className="min-h-dvh bg-slate-100">
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-slate-950 text-slate-300 md:flex print:hidden">
          <div className="px-4 pb-2 pt-5">
            <Link href="/dashboard" className="block rounded-2xl bg-white px-3 py-2 shadow-lg shadow-black/20">
              <CastleLogo className="h-11 w-auto" />
            </Link>
            <p className="mt-3 px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Shop operations</p>
          </div>
          {navList()}
          {userCard}
        </aside>

        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 pb-2 pt-[max(env(safe-area-inset-top),0.5rem)] backdrop-blur md:hidden print:hidden">
          <Link href="/dashboard" aria-label="Dashboard">
            <CastleLogo className="h-10 w-auto" />
          </Link>
          <div className="flex items-center gap-1">
            <Link href="/guide" aria-label="Newcomer guide" className="grid size-10 place-items-center rounded-xl text-slate-600 hover:bg-slate-100">
              <BookOpen className="size-5" />
            </Link>
            <button
              type="button"
              onClick={() => setDrawer(true)}
              aria-label="Open menu"
              className="relative grid size-10 place-items-center rounded-xl text-slate-800 hover:bg-slate-100"
            >
              <Menu className="size-6" />
              {counts.reports + counts.estimates > 0 && (
                <span className="absolute right-1.5 top-1.5 size-2.5 rounded-full bg-brand-600 ring-2 ring-white" />
              )}
            </button>
          </div>
        </header>

        {drawer && (
          <div className="fixed inset-0 z-50 md:hidden print:hidden" role="dialog" aria-modal="true">
            <button type="button" aria-label="Close menu" className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={() => setDrawer(false)} />
            <div className="anim-drawer absolute inset-y-0 left-0 flex w-72 flex-col bg-slate-950 text-slate-300 shadow-2xl">
              <div className="flex items-center justify-between px-4 pb-2 pt-[max(env(safe-area-inset-top),1rem)]">
                <span className="rounded-xl bg-white px-2.5 py-1.5">
                  <CastleLogo className="h-9 w-auto" />
                </span>
                <button type="button" onClick={() => setDrawer(false)} aria-label="Close menu" className="grid size-9 place-items-center rounded-full bg-white/10 text-white">
                  <X className="size-5" />
                </button>
              </div>
              {navList(() => setDrawer(false))}
              {userCard}
            </div>
          </div>
        )}

        <main className="min-h-dvh pb-28 md:ml-64 md:pb-10 print:ml-0 print:min-h-0 print:p-0">
          <div className="page-enter mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8 print:max-w-none print:p-0">
            {state ? <><PersistenceNotice />{children}</> : <PageSkeleton />}
          </div>
        </main>

        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 pb-[max(env(safe-area-inset-bottom),0.4rem)] backdrop-blur md:hidden print:hidden">
          <ul className="grid grid-cols-5 items-end">
            {TABS.slice(0, 2).map((t) => (
              <TabLink key={t.href} item={t} active={isActive(t.href)} count={t.badge ? counts[t.badge] : 0} />
            ))}
            <li className="flex justify-center">
              <Link
                href="/jobs/new"
                aria-label="New vehicle"
                className="-mt-6 grid size-14 place-items-center rounded-full bg-brand-600 text-white shadow-lg shadow-brand-600/40 ring-4 ring-white transition active:scale-95"
              >
                <Plus className="size-7" />
              </Link>
            </li>
            {TABS.slice(2).map((t) => (
              <TabLink key={t.href} item={t} active={isActive(t.href)} count={t.badge ? counts[t.badge] : 0} />
            ))}
          </ul>
        </nav>

        <WelcomeModal open={welcomeOpen} onClose={dismissWelcome} onTour={startTour} />
        <GuidedTour active={tour} onDone={() => setTour(false)} />
      </div>
    </MeProvider>
  );
}

function TabLink({ item, active, count }: { item: NavItem; active: boolean; count: number }) {
  const Icon = item.icon;
  return (
    <li>
      <Link
        href={item.href}
        className={`relative flex flex-col items-center gap-1 py-2 text-[10px] font-semibold transition ${
          active ? "text-brand-600" : "text-slate-500"
        }`}
      >
        <span className={`grid h-7 w-12 place-items-center rounded-full transition ${active ? "bg-brand-50" : ""}`}>
          <Icon className="size-[19px]" />
        </span>
        {item.label}
        {count > 0 && (
          <span className="absolute right-[calc(50%-22px)] top-1 rounded-full bg-brand-600 px-1.5 text-[10px] font-bold leading-4 text-white">
            {count}
          </span>
        )}
      </Link>
    </li>
  );
}
