"use client";

import { useActionState, useState } from "react";
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { CastleLogo } from "@/components/brand";
import { DEMO_ACCOUNTS } from "@/lib/auth";
import { login } from "./actions";

const inputClass =
  "h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-[15px] text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, undefined);
  const [email, setEmail] = useState<string>(DEMO_ACCOUNTS[0].email);
  const [password, setPassword] = useState<string>(DEMO_ACCOUNTS[0].password);
  const [activeKey, setActiveKey] = useState<string>(DEMO_ACCOUNTS[0].key);
  const [showPassword, setShowPassword] = useState(false);

  function autofill(key: string) {
    const account = DEMO_ACCOUNTS.find((a) => a.key === key);
    if (!account) return;
    setEmail(account.email);
    setPassword(account.password);
    setActiveKey(account.key);
  }

  return (
    <div className="anim-fade-up rounded-3xl bg-white p-7 shadow-2xl shadow-slate-900/10 ring-1 ring-slate-200 sm:p-10">
      <div className="mb-6 lg:hidden">
        <CastleLogo tagline className="h-14 w-auto" />
      </div>

      <div className="anim-fade-up" style={{ animationDelay: "0.1s" }}>
        <h2 className="text-3xl font-bold tracking-tight text-slate-950">Welcome back</h2>
        <p className="mt-2 text-sm text-slate-600">Sign in with your Castle employee account.</p>
      </div>

      <div className="anim-fade-up mt-6 rounded-2xl border border-brand-100 bg-brand-50/60 p-4" style={{ animationDelay: "0.2s" }}>
        <div className="mb-3 flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-700">
            <Sparkles className="size-3.5" /> Demo login · tap to autofill
          </p>
          <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-slate-500 ring-1 ring-slate-200">
            Dummy data
          </span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {DEMO_ACCOUNTS.map((a) => {
            const active = activeKey === a.key;
            return (
              <button
                type="button"
                key={a.key}
                onClick={() => autofill(a.key)}
                className={`rounded-xl border p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                  active ? "border-brand-500 bg-white shadow-md ring-2 ring-brand-400/30" : "border-slate-200 bg-white/80 hover:border-brand-300"
                }`}
              >
                <span className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-900">{a.label}</span>
                  {active && <ShieldCheck className="size-4 text-brand-600" />}
                </span>
                <span className="mt-0.5 block truncate text-xs text-slate-500">{a.email}</span>
                <span className="mt-1 block text-[11px] text-slate-400">{a.description}</span>
              </button>
            );
          })}
        </div>
      </div>

      <form action={formAction} className="mt-6 space-y-5">
        <div className="anim-fade-up" style={{ animationDelay: "0.3s" }}>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
            Work email
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-slate-400" />
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@castletire.com"
              className={inputClass}
            />
          </div>
        </div>

        <div className="anim-fade-up" style={{ animationDelay: "0.4s" }}>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
            Password
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-slate-400" />
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`${inputClass} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              {showPassword ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
            </button>
          </div>
        </div>

        {state?.error && (
          <div key={state.error} role="alert" className="anim-shake rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">
            {state.error}
          </div>
        )}

        <div className="anim-fade-up" style={{ animationDelay: "0.5s" }}>
          <button
            type="submit"
            disabled={pending}
            className="anim-shimmer anim-gradient group relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-brand-600 via-brand-500 to-brand-700 text-[15px] font-semibold text-white shadow-lg shadow-brand-600/30 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 active:scale-[0.99] disabled:cursor-wait disabled:opacity-80"
          >
            {pending ? (
              <>
                <Loader2 className="size-5 animate-spin" />
                Signing you in…
              </>
            ) : (
              <>
                Sign in to the shop
                <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>
        </div>
      </form>

      <p className="anim-fade-up mt-6 text-center text-xs text-slate-500" style={{ animationDelay: "0.6s" }}>
        Works on iPhone, Android, tablets and Windows PCs. Add it to your home screen like an app.
      </p>
    </div>
  );
}
