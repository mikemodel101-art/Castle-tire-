"use client";

import { RecoveryScreen } from "@/components/recovery-screen";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RecoveryScreen error={error} reset={reset} />;
}
