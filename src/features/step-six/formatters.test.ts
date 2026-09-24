import { describe, expect, it } from "vitest";
import { analyticsRangeError, weekdayLabel, billingLabel, money, paymentLabel, planCodeLabel, subscriptionLabel } from "./formatters";

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

describe("analytics validation", () => {
  it("rejects missing, invalid, reversed and overlong dates", () => {
    for (const [from, to] of [["", "2026-01-01"], ["2026-02-30", "2026-03-01"], ["2026-02-01", "2026-01-01"], ["2024-01-01", "2025-01-02"]]) expect(analyticsRangeError(from, to)).not.toBeNull();
    expect(analyticsRangeError("2024-01-01", "2025-01-01")).toBeNull();
    expect(analyticsRangeError("2026-01-01", "2026-01-01")).toBeNull();
  });
  it("translates weekdays and handles missing data", () => {
    expect(weekdayLabel("WEDNESDAY")).toBe("Çərşənbə");
    expect(weekdayLabel(null)).toBe("Məlumat yoxdur");
  });
});
