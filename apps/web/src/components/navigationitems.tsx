"use client";

import Link from "next/link";
import type { Route } from "next";
import { ChevronRight } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import type { NavigationItem as NavigationItemDefinition } from "@/config/navigation";

type NavigationItemProps = {
  item: NavigationItemDefinition;
  label: string;
  description?: string;
  active: boolean;
};

export function NavigationItem({ item, label, description, active }: NavigationItemProps) {
  const Icon = item.icon;

  return (
    <Dialog.Close asChild>
      <Link
        href={item.href as Route}
        aria-current={active ? "page" : undefined}
        className={`group flex min-h-16 items-center gap-3 rounded-xl border px-3 py-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
          active
            ? "border-accent/50 bg-accent/10 text-foreground"
            : "border-transparent text-muted-foreground hover:border-border hover:bg-hover-surface hover:text-foreground"
        }`}
      >
        <span className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${active ? "bg-accent/15 text-accent" : "bg-elevated text-muted-foreground group-hover:text-foreground"}`}>
          <Icon aria-hidden="true" size={19} strokeWidth={1.8} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{label}</span>
          {description ? <span className="mt-0.5 block truncate text-xs text-muted-foreground">{description}</span> : null}
        </span>
        <ChevronRight aria-hidden="true" size={16} className={`shrink-0 transition-transform group-hover:translate-x-0.5 ${active ? "text-accent" : "text-muted-foreground/60"}`} />
      </Link>
    </Dialog.Close>
  );
}
