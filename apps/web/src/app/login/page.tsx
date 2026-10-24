import { AuthShell } from "@/features/auth/components/AuthShell";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { getTranslations } from "next-intl/server";

export default async function LoginPage() { const t = await getTranslations("Auth"); return <AuthShell title={t("welcomeBack")} subtitle={t("loginSubtitle")}><Suspense><LoginForm /></Suspense></AuthShell>; }
import { Suspense } from "react";
