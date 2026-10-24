"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { register } from "@/features/auth/api/auth.api";
import { validateEmail, validatePassword, validateUsername } from "@/features/auth/schemas/auth.schemas";

export function RegisterForm() {
  const t = useTranslations("Auth"); const router = useRouter(); const params = useSearchParams();
  const [error, setError] = useState<string | null>(null); const [busy, setBusy] = useState(false); const [show, setShow] = useState(false);
  const destination = params.get("returnUrl"); const safeDestination = destination?.startsWith("/") && !destination.startsWith("//") ? destination : "/map";
  return <form className="space-y-5" onSubmit={async event => { event.preventDefault(); const data = new FormData(event.currentTarget); const email = String(data.get("email") ?? ""); const username = String(data.get("username") ?? ""); const password = String(data.get("password") ?? ""); const confirmPassword = String(data.get("confirmPassword") ?? ""); if (!validateEmail(email) || !validateUsername(username) || !validatePassword(password) || password !== confirmPassword) { setError(t("invalidForm")); return; } setBusy(true); setError(null); try { await register({ email, username, password, confirmPassword }); window.dispatchEvent(new Event("magnetrail-auth-changed")); router.replace(safeDestination as never); router.refresh(); } catch { setError(t("registrationError")); } finally { setBusy(false); } }}>
    {error ? <p role="alert" className="rounded-lg border border-restricted/40 bg-restricted/10 px-3 py-2 text-sm text-restricted">{error}</p> : null}
    <label className="block text-sm font-medium">{t("username")}<input name="username" autoComplete="username" required minLength={3} maxLength={32} className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent" /></label>
    <label className="block text-sm font-medium">{t("email")}<input name="email" type="email" autoComplete="email" required className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent" /></label>
    <label className="block text-sm font-medium">{t("password")}<span className="relative mt-2 block"><input name="password" type={show ? "text" : "password"} autoComplete="new-password" required minLength={12} className="w-full rounded-lg border border-border bg-background px-3 py-2.5 pr-11 outline-none focus:ring-2 focus:ring-accent" /><button type="button" onClick={() => setShow(value => !value)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-2 text-muted-foreground" aria-label={show ? t("hidePassword") : t("showPassword")}>{show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></span></label>
    <label className="block text-sm font-medium">{t("confirmPassword")}<input name="confirmPassword" type={show ? "text" : "password"} autoComplete="new-password" required minLength={12} className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 outline-none focus:ring-2 focus:ring-accent" /></label>
    <button disabled={busy} className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-background disabled:opacity-50">{busy ? t("loading") : t("register")}</button>
    <p className="text-center text-sm text-muted-foreground">{t("hasAccount")} <Link className="text-accent hover:underline" href={`/login${destination ? `?returnUrl=${encodeURIComponent(safeDestination)}` : ""}` as never}>{t("login")}</Link></p>
  </form>;
}
