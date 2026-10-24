"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { primaryNavigation, secondaryNavigation, isNavigationItemActive } from "@/config/navigation";
import { NavigationItem } from "@/components/navigationitems";
import Link from "next/link";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { LogoutButton } from "@/features/auth/components/LogoutButton";

export default function Navigation() {
  const pathname = usePathname();
  const t = useTranslations("Navigation");
  const { user, loading } = useCurrentUser();

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button type="button" className="fixed right-4 top-4 z-40 flex size-11 items-center justify-center rounded-xl border border-border bg-surface/95 text-foreground shadow-lg shadow-black/10 backdrop-blur-sm transition-colors hover:bg-hover-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:right-6 sm:top-6" aria-label={t("openMenu")}>
          <Menu aria-hidden="true" size={20} strokeWidth={1.8} />
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/35 backdrop-blur-[2px]" />
        <Dialog.Content className="fixed inset-y-0 right-0 z-50 flex w-[min(400px,calc(100vw-1rem))] flex-col border-l border-border bg-surface p-4 text-foreground shadow-2xl shadow-black/30 outline-none sm:p-6" aria-describedby={undefined}>
          <div className="flex items-start justify-between gap-4 border-b border-border pb-5">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-accent">Magnetrail</p>
              <Dialog.Title className="mt-2 text-2xl font-semibold tracking-tight">{t("title")}</Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <button type="button" className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-hover-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent" aria-label={t("closeMenu")}>
                <X aria-hidden="true" size={20} strokeWidth={1.8} />
              </button>
            </Dialog.Close>
          </div>

          <nav aria-label={t("title")} className="min-h-0 flex-1 overflow-y-auto py-5">
            {!loading ? <div className="mb-5 rounded-xl border border-border bg-background p-3">{user ? <div className="flex items-center justify-between gap-3"><Link href="/profile" className="min-w-0"><p className="truncate font-medium text-foreground">{user.username}</p><p className="text-xs text-muted-foreground">{t("level", { level: user.level })}</p></Link><LogoutButton /></div> : <div className="flex gap-2"><Link href={"/login" as never} className="flex-1 rounded-lg border border-border px-3 py-2 text-center text-sm hover:bg-hover-surface">{t("login")}</Link><Link href={"/register" as never} className="flex-1 rounded-lg bg-accent px-3 py-2 text-center text-sm font-semibold text-background">{t("register")}</Link></div>}</div> : null}
            <p className="mb-3 px-1 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">{t("primary")}</p>
            <div className="space-y-1.5">
              {primaryNavigation.map((item) => (
                <NavigationItem key={item.id} item={item} label={t(item.labelKey)} description={item.descriptionKey ? t(item.descriptionKey) : undefined} active={isNavigationItemActive(pathname, item.href)} />
              ))}
            </div>

            <div className="my-6 border-t border-border" />

            <p className="mb-3 px-1 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">{t("secondary")}</p>
            <div className="space-y-1.5">
              {secondaryNavigation.map((item) => (
                <NavigationItem key={item.id} item={item} label={t(item.labelKey)} active={isNavigationItemActive(pathname, item.href)} />
              ))}
            </div>
          </nav>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
