import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CalendarCheck2, Camera, ClipboardCheck, FileText } from "lucide-react";
import { SESSION_COOKIE, memberForEmail } from "@/lib/auth";
import { PHOTOS, SHOP } from "@/lib/data";
import { LoginForm } from "./login-form";

export const metadata = {
  title: "Sign in · Castle Tire Shop",
};

const FEATURES = [
  { icon: CalendarCheck2, text: "Daily job board with claim & accept" },
  { icon: ClipboardCheck, text: "Digital multi-point inspections" },
  { icon: Camera, text: "Photos & videos from any phone" },
  { icon: FileText, text: "Branded reports shared by text" },
];

const HEADLINE = ["Every", "tire.", "Every", "vehicle.", "Every", "report."];

export default async function LoginPage() {
  const jar = await cookies();
  if (memberForEmail(jar.get(SESSION_COOKIE)?.value)) redirect("/dashboard");

  return (
    <main className="relative grid min-h-dvh overflow-hidden bg-slate-950 lg:grid-cols-2">
      {/* Animated brand panel */}
      <section className="relative hidden flex-col justify-between overflow-hidden p-12 text-white lg:flex">
        <img
          src={PHOTOS.shopInterior}
          alt=""
          className="anim-kenburns absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900/85 to-amber-900/50" />

        {/* Floating tire rings */}
        <div className="anim-float absolute -right-28 top-24 size-[28rem] rounded-full border-[36px] border-white/5" />
        <div
          className="anim-float absolute -left-16 bottom-40 size-72 rounded-full border-[22px] border-amber-400/10"
          style={{ animationDelay: "-3s" }}
        />
        <div className="anim-spin-slow absolute right-16 top-1/3 size-40 rounded-full border-4 border-dashed border-amber-300/20" />

        <div className="anim-fade-up relative flex items-center gap-3">
          <BrandMark />
          <div>
            <p className="text-lg font-semibold tracking-tight">{SHOP.name}</p>
            <p className="text-xs uppercase tracking-[0.2em] text-amber-300/80">Shop Operations</p>
          </div>
        </div>

        <div className="relative max-w-xl">
          <h1 className="text-5xl font-bold leading-[1.05] tracking-tight xl:text-6xl">
            {HEADLINE.map((word, i) => (
              <span
                key={`${word}-${i}`}
                className="anim-word mr-3 inline-block"
                style={{ animationDelay: `${0.15 + i * 0.09}s` }}
              >
                {word.endsWith(".") ? <span className="text-amber-400">{word}</span> : word}
              </span>
            ))}
          </h1>
          <p className="anim-fade-up mt-6 max-w-md text-lg text-slate-300" style={{ animationDelay: "0.8s" }}>
            Run the shop floor from one place: jobs, digital inspections, photos and videos, and
            customer history.
          </p>
          <ul className="mt-8 grid gap-3">
            {FEATURES.map(({ icon: Icon, text }, i) => (
              <li
                key={text}
                className="anim-slide-in flex items-center gap-3 text-slate-200"
                style={{ animationDelay: `${1 + i * 0.12}s` }}
              >
                <span className="grid size-9 place-items-center rounded-lg bg-amber-400/15 text-amber-300 ring-1 ring-amber-300/30">
                  <Icon className="size-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <div className="anim-road h-1.5 w-full rounded-full" />
          <p className="mt-4 text-xs text-slate-400">
            {SHOP.address} · {SHOP.phone}
          </p>
        </div>
      </section>

      {/* Form panel */}
      <section className="relative flex items-center justify-center bg-slate-100 p-6 sm:p-10">
        <div className="pointer-events-none absolute inset-0 overflow-hidden lg:hidden">
          <div className="anim-float absolute -top-24 -right-24 size-72 rounded-full bg-amber-300/30 blur-3xl" />
          <div
            className="anim-float absolute -bottom-24 -left-16 size-72 rounded-full bg-slate-400/20 blur-3xl"
            style={{ animationDelay: "-4s" }}
          />
        </div>
        <div className="relative w-full max-w-md">
          <LoginForm />
          <p className="anim-fade-in mt-6 text-center text-xs text-slate-500" style={{ animationDelay: "0.9s" }}>
            Secure employee access · {SHOP.name}, Massachusetts
          </p>
        </div>
      </section>
    </main>
  );
}

function BrandMark() {
  return (
    <span className="anim-spin-slow relative grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-amber-300 to-orange-500 shadow-lg shadow-amber-500/30">
      <svg viewBox="0 0 48 48" className="size-7 text-slate-900" fill="none" aria-hidden="true">
        <circle cx="24" cy="24" r="17" stroke="currentColor" strokeWidth="5" />
        <circle cx="24" cy="24" r="6" fill="currentColor" />
        <path d="M24 7v9M24 32v9M7 24h9M32 24h9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </span>
  );
}
