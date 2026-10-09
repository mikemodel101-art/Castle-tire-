import { TEAM, type Member } from "./data";

// Demo-only credentials. No database: these live in code on purpose for the demo.
export const SESSION_COOKIE = "castle_session";

export const DEMO_ACCOUNTS = [
  {
    key: "manager",
    label: "Manager",
    description: "Full access · Mike Sullivan",
    email: "admin@castletire.com",
    password: "Castle2026",
    memberId: "mike",
  },
  {
    key: "technician",
    label: "Technician",
    description: "Shop floor · Luis Ortega",
    email: "tech@castletire.com",
    password: "Tech2026",
    memberId: "luis",
  },
] as const;

export function memberForEmail(email: string | undefined): Member | undefined {
  const account = DEMO_ACCOUNTS.find((a) => a.email === email);
  return account ? TEAM.find((m) => m.id === account.memberId) : undefined;
}
