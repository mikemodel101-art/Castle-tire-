import type { Corner, Light, Section } from "@/lib/data";

const FONT = "'Arial Black','Helvetica Neue',Arial,sans-serif";

/** Castle Tire Shop wordmark: tire + red "CASTLE" + car roofline swoosh. */
export function CastleLogo({
  className = "",
  tone = "light",
  tagline = false,
}: {
  className?: string;
  tone?: "light" | "dark";
  tagline?: boolean;
}) {
  const ink = tone === "dark" ? "#ffffff" : "#0b0b0f";
  return (
    <svg
      viewBox={tagline ? "0 0 240 80" : "0 0 240 66"}
      className={className}
      role="img"
      aria-label="Castle Tire Shop"
    >
      <path d="M74 22 C 100 6, 156 2, 206 12 C 218 15, 228 19, 236 25" fill="none" stroke="#e11d2a" strokeWidth="4" strokeLinecap="round" />
      <path d="M96 18 C 124 9, 166 8, 196 14" fill="none" stroke="#e11d2a" strokeWidth="2" strokeLinecap="round" opacity="0.65" />
      <g transform="translate(33 35)">
        <circle r="31" fill="#0b0b0f" />
        <circle r="26.5" fill="none" stroke="#3f3f46" strokeWidth="6" strokeDasharray="3.4 2.6" />
        <circle r="15" fill="#d4d4d8" />
        <circle r="15" fill="none" stroke="#71717a" strokeWidth="1.5" />
        {[0, 72, 144, 216, 288].map((a) => (
          <rect key={a} x="-1.7" y="-14" width="3.4" height="8.5" rx="1.2" fill="#71717a" transform={`rotate(${a})`} />
        ))}
        <circle r="4.5" fill="#3f3f46" />
      </g>
      <text
        x="68"
        y="47"
        fontFamily={FONT}
        fontWeight={900}
        fontStyle="italic"
        fontSize="32"
        fill="#e11d2a"
        stroke={ink}
        strokeWidth="1.3"
        paintOrder="stroke"
        letterSpacing="-0.5"
      >
        CASTLE
      </text>
      <text x="100" y="63" fontFamily={FONT} fontWeight={900} fontStyle="italic" fontSize="15" fill={ink} letterSpacing="0.6">
        TIRE SHOP
      </text>
      {tagline && (
        <text x="120" y="77" textAnchor="middle" fontFamily="Arial,sans-serif" fontWeight={700} fontSize="7.4" fill={ink} letterSpacing="0.5">
          TIRES • ALIGNMENTS • BRAKES • AUTO REPAIR
        </text>
      )}
    </svg>
  );
}

/** Small tire badge used for favicons, avatars and compact headers. */
export function TireMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <circle cx="32" cy="32" r="30" fill="#0b0b0f" />
      <circle cx="32" cy="32" r="25.5" fill="none" stroke="#3f3f46" strokeWidth="6" strokeDasharray="3.4 2.6" />
      <circle cx="32" cy="32" r="14" fill="#e11d2a" />
      <circle cx="32" cy="32" r="5" fill="#fff" />
    </svg>
  );
}

/** Icons from the paper sheet: tire, brake, coil spring, axle, TPMS warning. */
export function ShopIcon({ name, className = "size-5" }: { name: Section; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {name === "tires" && (
        <>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="4" />
          <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
        </>
      )}
      {name === "brakes" && (
        <>
          <circle cx="10.5" cy="13" r="8" />
          <circle cx="10.5" cy="13" r="2.5" />
          <path d="M14.5 4.2a9.5 9.5 0 0 1 5.6 6.3" strokeWidth={3.4} />
        </>
      )}
      {name === "suspension" && (
        <>
          <path d="M7 3h10M7 21h10" />
          <path d="M8 5.5l8 1.8-8 1.8 8 1.8-8 1.8 8 1.8-8 1.8 8 1.8" />
        </>
      )}
      {name === "alignment" && (
        <>
          <rect x="2.5" y="6" width="4" height="12" rx="1.2" />
          <rect x="17.5" y="6" width="4" height="12" rx="1.2" />
          <path d="M6.5 12h11M12 9v6" />
        </>
      )}
      {name === "tpms" && (
        <>
          <path d="M6.8 5.2a9 9 0 0 0-.6 13.6" />
          <path d="M17.2 5.2a9 9 0 0 1 .6 13.6" />
          <path d="M7 21h10" />
          <path d="M12 7.5v6" />
          <path d="M12 16.8v.2" />
        </>
      )}
    </svg>
  );
}

const TIRE_FILL: Record<Light, string> = {
  green: "#10b981",
  blue: "#0ea5e9",
  yellow: "#f59e0b",
  red: "#ef4444",
  none: "#1f2937",
};

/** Top-down car like the paper sheet. Tires are coloured by their inspection status. */
export function CarTopView({
  className = "",
  lights,
}: {
  className?: string;
  lights?: Partial<Record<Corner, Light>>;
}) {
  const fill = (c: Corner) => TIRE_FILL[lights?.[c] ?? "none"];
  return (
    <svg viewBox="0 0 140 260" className={className} aria-hidden="true">
      <rect x="6" y="44" width="20" height="46" rx="7" fill={fill("LF")} />
      <rect x="114" y="44" width="20" height="46" rx="7" fill={fill("RF")} />
      <rect x="6" y="172" width="20" height="46" rx="7" fill={fill("LR")} />
      <rect x="114" y="172" width="20" height="46" rx="7" fill={fill("RR")} />
      <path
        d="M44 10 C52 5 88 5 96 10 C108 17 114 30 115 50 L117 200 C117 232 104 252 70 252 C36 252 23 232 23 200 L25 50 C26 30 32 17 44 10 Z"
        fill="#f8fafc"
        stroke="#94a3b8"
        strokeWidth="2"
      />
      <path d="M50 20 C60 38 80 38 90 20" fill="none" stroke="#cbd5e1" strokeWidth="1.5" />
      <path d="M36 78 C48 66 92 66 104 78 L98 108 C84 102 56 102 42 108 Z" fill="#1e293b" />
      <rect x="42" y="112" width="56" height="70" rx="10" fill="#eef2f7" stroke="#cbd5e1" />
      <path d="M33 112 L39 112 L39 182 L33 186 Z" fill="#334155" />
      <path d="M107 112 L101 112 L101 182 L107 186 Z" fill="#334155" />
      <path d="M42 188 C56 194 84 194 98 188 L104 214 C90 222 50 222 36 214 Z" fill="#1e293b" />
      <path d="M25 100 L12 96 L12 110 L25 112 Z" fill="#cbd5e1" stroke="#94a3b8" />
      <path d="M115 100 L128 96 L128 110 L115 112 Z" fill="#cbd5e1" stroke="#94a3b8" />
      <rect x="40" y="12" width="16" height="6" rx="3" fill="#fde68a" />
      <rect x="84" y="12" width="16" height="6" rx="3" fill="#fde68a" />
      <rect x="36" y="242" width="18" height="5" rx="2.5" fill="#ef4444" />
      <rect x="86" y="242" width="18" height="5" rx="2.5" fill="#ef4444" />
    </svg>
  );
}

const r2 = (n: number) => Math.round(n * 100) / 100;

/** Drilled rotor with a red caliper, as printed on the sheet. */
export function BrakeDisc({ className = "" }: { className?: string }) {
  const holes = Array.from({ length: 18 }, (_, i) => {
    const a = (i / 18) * Math.PI * 2;
    const r = 34 + (i % 2) * 7;
    return { x: r2(58 + Math.cos(a) * r), y: r2(62 + Math.sin(a) * r) };
  });
  const lugs = Array.from({ length: 5 }, (_, i) => {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    return { x: r2(58 + Math.cos(a) * 12), y: r2(62 + Math.sin(a) * 12) };
  });
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <circle cx="58" cy="62" r="50" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="2" />
      <circle cx="58" cy="62" r="43" fill="none" stroke="#e2e8f0" strokeWidth="2" />
      {holes.map((h, i) => (
        <circle key={i} cx={h.x} cy={h.y} r="2.4" fill="#64748b" />
      ))}
      <circle cx="58" cy="62" r="22" fill="#e5e7eb" stroke="#94a3b8" strokeWidth="2" />
      {lugs.map((l, i) => (
        <circle key={i} cx={l.x} cy={l.y} r="3" fill="#475569" />
      ))}
      <circle cx="58" cy="62" r="5" fill="#334155" />
      <path d="M86 18 C108 30 116 52 112 76" fill="none" stroke="#dc2626" strokeWidth="18" strokeLinecap="round" />
      <path d="M90 26 C104 36 109 52 107 68" fill="none" stroke="#f87171" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}
