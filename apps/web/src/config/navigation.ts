import type { LucideIcon } from "lucide-react";
import { BookOpen, CircleHelp, Map, MapPinned, Route, Settings, UserRound } from "lucide-react";

export type NavigationItem = Readonly<{
  id: string;
  href: string;
  labelKey: string;
  descriptionKey?: string;
  icon: LucideIcon;
}>;

export const primaryNavigation: readonly NavigationItem[] = [
  { id: "map", href: "/map", labelKey: "map.label", descriptionKey: "map.description", icon: Map },
  { id: "places", href: "/places", labelKey: "places.label", descriptionKey: "places.description", icon: MapPinned },
  { id: "logbook", href: "/logbook", labelKey: "logbook.label", descriptionKey: "logbook.description", icon: BookOpen },
  { id: "expeditions", href: "/expeditions", labelKey: "expeditions.label", descriptionKey: "expeditions.description", icon: Route },
  { id: "profile", href: "/profile", labelKey: "profile.label", descriptionKey: "profile.description", icon: UserRound },
] as const;

export const secondaryNavigation: readonly NavigationItem[] = [
  { id: "settings", href: "/settings", labelKey: "settings.label", icon: Settings },
  { id: "help", href: "/help", labelKey: "help.label", icon: CircleHelp },
] as const;

export const navigation = [...primaryNavigation, ...secondaryNavigation] as const;

export function isNavigationItemActive(pathname: string, href: NavigationItem["href"]): boolean {
  const normalizedPath = normalizePathname(pathname);
  return normalizedPath === href || normalizedPath.startsWith(`${href}/`);
}

function normalizePathname(pathname: string): string {
  const path = pathname.split("?")[0].split("#")[0].replace(/\/$/, "") || "/";
  return path.replace(/^\/(de|en|fr|it)(?=\/|$)/, "") || "/";
}
