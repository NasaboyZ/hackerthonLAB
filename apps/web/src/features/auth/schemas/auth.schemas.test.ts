import { describe, expect, it } from "vitest";
import { validateEmail, validatePassword, validateUsername } from "@/features/auth/schemas/auth.schemas";

describe("authentication validation", () => {
  it("accepts supported usernames and rejects unsafe characters", () => {
    expect(validateUsername("RiverHunter_1")).toBe(true);
    expect(validateUsername("river hunter")).toBe(false);
  });
  it("requires a long password and valid email", () => {
    expect(validatePassword("a".repeat(12))).toBe(true);
    expect(validatePassword("short")).toBe(false);
    expect(validateEmail("explorer@example.com")).toBe(true);
    expect(validateEmail("not-an-email")).toBe(false);
  });
});
