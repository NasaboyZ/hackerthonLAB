import { AuthShell } from "@/features/auth/components/AuthShell";
import { RegisterForm } from "@/features/auth/components/RegisterForm";
import { getTranslations } from "next-intl/server";

export default async function RegisterPage() { const t = await getTranslations("Auth"); return <AuthShell title={t("joinExpedition")} subtitle={t("registerSubtitle")}><Suspense><RegisterForm /></Suspense></AuthShell>; }
import { Suspense } from "react";
