"use client";

import { RecoveryScreen } from "@/components/recovery-screen";
import "./globals.css";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <RecoveryScreen error={error} reset={reset} />
      </body>
    </html>
  );
}
