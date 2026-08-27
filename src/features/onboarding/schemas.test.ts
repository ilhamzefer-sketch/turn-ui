import { describe, expect, it } from "vitest";

import { businessOnboardingSchema, individualWorkspaceSchema } from "./schemas";

describe("onboarding schemas", () => {
  it("requires a useful individual workspace name", () => {
    expect(individualWorkspaceSchema.safeParse({ name: "" }).success).toBe(false);
    expect(individualWorkspaceSchema.safeParse({ name: "Leyla Məmmədova" }).success).toBe(true);
  });

  it("keeps the first business step intentionally compact", () => {
    expect(businessOnboardingSchema.safeParse({ name: "", phone: "" }).success).toBe(false);
    expect(
      businessOnboardingSchema.safeParse({
        name: "Sahil Studio",
        phone: "0501234567",
        categoryId: "2",
        customSubcategory: "",
        description: "",
      }).success,
    ).toBe(true);
  });
});
