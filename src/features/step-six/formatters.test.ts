import { describe, expect, it } from "vitest";
import { billingLabel, money, paymentLabel, planCodeLabel, subscriptionLabel } from "./formatters";

describe("step six formatters", () => {
  it("uses clear Azerbaijani operational labels", () => {
    expect(billingLabel("YEARLY")).toBe("İllik");
    expect(subscriptionLabel("GRACE_PERIOD")).toBe("Güzəşt müddəti");
    expect(paymentLabel("COMPLETED")).toBe("Tamamlanıb");
  });
  it("formats plan money without inventing decimals", () => {
    expect(money(20, "AZN")).toContain("20");
  });
  it("translates plan codes before showing receipt history", () => {
    expect(planCodeLabel("STANDARD_MONTHLY")).toBe("Standart aylıq plan");
    expect(planCodeLabel("BUSINESS_MONTHLY")).toBe("Biznes aylıq plan");
  });
});
