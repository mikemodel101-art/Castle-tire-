import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CalendarCheck2, Camera, ClipboardCheck, MessageSquareText } from "lucide-react";
import { CastleLogo } from "@/components/brand";
import { SESSION_COOKIE, memberForEmail } from "@/lib/auth";
import { PHOTOS, SHOP } from "@/lib/data";
import { LoginForm } from "./login-form";

export const metadata = {
  title: "Sign in",
};

const FEATURES = [
  { icon: CalendarCheck2, text: "Today's jobs: create, accept & track every vehicle" },
  { icon: ClipboardCheck, text: "Digital inspection sheet: tires, brakes, TPMS, suspension, alignment" },
  { icon: Camera, text: "Photos & short videos straight from the phone" },
  { icon: MessageSquareText, text: "Branded reports texted to customers, no app needed" },
];

const HEADLINE = ["Every", "tire.", "Every", "vehicle.", "Every", "report."];

export default async function LoginPage() {
  const jar = await cookies();
  if (memberForEmail(jar.get(SESSION_COOKIE)?.value)) redirect("/dashboard");

  return (
    <main className="relative grid min-h-dvh overflow-hidden bg-slate-950 lg:grid-cols-2">
      {/* Animated brand panel */}
      <section className="relative hidden flex-col justify-between overflow-hidden p-12 text-white lg:flex">
        <img src={PHOTOS.shopInterior} alt="" className="anim-kenburns absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950/85 to-brand-950/70" />

        <div className="anim-float absolute -right-28 top-24 size-[28rem] rounded-full border-[36px] border-white/5" />
        <div
          className="anim-float absolute -left-16 bottom-40 size-72 rounded-full border-[22px] border-brand-500/15"
          style={{ animationDelay: "-3s" }}
        />
        <div className="anim-spin-slow absolute right-16 top-1/3 size-40 rounded-full border-4 border-dashed border-brand-400/25" />

        <div className="anim-fade-up relative">
          <span className="inline-block rounded-2xl bg-white px-4 py-2.5 shadow-2xl shadow-black/40">
            <CastleLogo tagline className="h-16 w-auto" />
          </span>
        </div>

        <div className="relative max-w-xl">
          <h1 className="text-5xl font-bold leading-[1.05] tracking-tight xl:text-6xl">
            {HEADLINE.map((word, i) => (
              <span key={`${word}-${i}`} className="anim-word mr-3 inline-block" style={{ animationDelay: `${0.15 + i * 0.09}s` }}>
                {word.endsWith(".") ? <span className="text-brand-500">{word}</span> : word}
              </span>
            ))}
          </h1>
          <p className="anim-fade-up mt-6 max-w-md text-lg text-slate-300" style={{ animationDelay: "0.8s" }}>
            Castle&apos;s shop floor on any phone, tablet or PC. Write the work order, inspect, take photos and text
            the report in minutes.
          </p>
          <ul className="mt-8 grid gap-3">
            {FEATURES.map(({ icon: Icon, text }, i) => (
              <li
                key={text}
                className="anim-slide-in flex items-center gap-3 text-slate-200"
                style={{ animationDelay: `${1 + i * 0.12}s` }}
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-500/15 text-brand-300 ring-1 ring-brand-400/30">
                  <Icon className="size-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          <div className="anim-road w-full rounded-full opacity-60" />
          <p className="mt-4 text-xs text-slate-400">
            {SHOP.address} · {SHOP.phone}
          </p>
        </div>
      </section>

      {/* Form panel */}
      <section className="relative flex items-center justify-center bg-slate-100 p-5 sm:p-10">
        <div className="pointer-events-none absolute inset-0 overflow-hidden lg:hidden">
          <div className="anim-float absolute -right-24 -top-24 size-72 rounded-full bg-brand-300/30 blur-3xl" />
          <div className="anim-float absolute -bottom-24 -left-16 size-72 rounded-full bg-slate-400/25 blur-3xl" style={{ animationDelay: "-4s" }} />
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
