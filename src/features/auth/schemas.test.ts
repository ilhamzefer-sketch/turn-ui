import { describe, expect, it } from "vitest";

import { loginSchema, registrationSchema } from "./schemas";

describe("authentication schemas", () => {
  it("keeps login validation aligned with the backend contract", () => {
    expect(loginSchema.safeParse({ phone: "", password: "" }).success).toBe(false);
    expect(loginSchema.safeParse({ phone: "050 123 45 67", password: "strong-password" }).success).toBe(true);
  });

  it("accepts Azerbaijani names and rejects weak registration passwords", () => {
    expect(
      registrationSchema.safeParse({
        firstName: "Əli",
        lastName: "Məmmədov",
        phone: "050 123 45 67",
        password: "short",
        confirmPassword: "short",
      }).success,
    ).toBe(false);

    expect(
      registrationSchema.safeParse({
        firstName: "Əli",
        lastName: "Məmmədov",
        phone: "050 123 45 67",
        password: "etibarli-sifre",
        confirmPassword: "etibarli-sifre",
      }).success,
    ).toBe(true);
  });

  it("requires the repeated password to match", () => {
    expect(
      registrationSchema.safeParse({
        firstName: "Əli",
        lastName: "Məmmədov",
        phone: "050 123 45 67",
        password: "etibarli-sifre",
        confirmPassword: "başqa-sifre",
      }).success,
    ).toBe(false);
  });
});
