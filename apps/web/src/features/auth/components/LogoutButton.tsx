"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { logout } from "@/features/auth/api/auth.api";

export function LogoutButton() { const t = useTranslations("Auth"); const router = useRouter(); return <button type="button" onClick={async () => { try { await logout(); } finally { window.dispatchEvent(new Event("magnetrail-auth-changed")); router.replace("/map"); router.refresh(); } }} className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:bg-hover-surface hover:text-foreground">{t("logout")}</button>; }
