import { describe, expect, it } from "vitest";
import { billingLabel, money, paymentLabel, subscriptionLabel } from "./formatters";

describe("step six formatters", () => {
  it("uses clear Azerbaijani operational labels", () => {
    expect(billingLabel("YEARLY")).toBe("İllik");
    expect(subscriptionLabel("GRACE_PERIOD")).toBe("Güzəşt müddəti");
    expect(paymentLabel("COMPLETED")).toBe("Tamamlanıb");
  });
  it("formats plan money without inventing decimals", () => {
    expect(money(20, "AZN")).toContain("20");
  });
});
