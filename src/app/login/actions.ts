"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DEMO_ACCOUNTS, SESSION_COOKIE } from "@/lib/auth";

export type LoginState = { error?: string; email?: string } | undefined;

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const account = DEMO_ACCOUNTS.find((a) => a.email === email && a.password === password);
  if (!account) {
    return { error: "That email or password doesn't match. Use a demo login below.", email };
  }

  const jar = await cookies();
  jar.set(SESSION_COOKIE, account.email, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  redirect("/dashboard");
}

export async function logout() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect("/login");
}
