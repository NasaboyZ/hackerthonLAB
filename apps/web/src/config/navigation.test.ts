import { describe, expect, it } from "vitest";
import { navigation, primaryNavigation, secondaryNavigation, isNavigationItemActive } from "@/config/navigation";

describe("navigation configuration", () => {
  it("contains exactly the seven required items in the required groups", () => {
    expect(primaryNavigation.map((item) => item.id)).toEqual(["map", "places", "logbook", "expeditions", "profile"]);
    expect(secondaryNavigation.map((item) => item.id)).toEqual(["settings", "help"]);
    expect(navigation).toHaveLength(7);
  });

  it("matches nested and locale-prefixed paths without false positives", () => {
    expect(isNavigationItemActive("/de/map", "/map")).toBe(true);
    expect(isNavigationItemActive("/de/map/some-area", "/map")).toBe(true);
    expect(isNavigationItemActive("/maple", "/map")).toBe(false);
    expect(isNavigationItemActive("/fr/profile", "/profile")).toBe(true);
  });
});
