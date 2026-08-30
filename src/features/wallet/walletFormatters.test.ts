import { describe, expect, it } from "vitest";

import { aznAmount, coinAmount, walletTransactionLabel, whatsappTopUpUrl } from "./walletFormatters";

describe("wallet formatters", () => {
  it("converts coins to AZN using the supplied rate", () => {
    expect(coinAmount(100)).toBe("100 coin");
    expect(aznAmount(100, 10)).toMatch(/^10[,.]00 ₼$/);
  });

  it("builds a WhatsApp request containing both coin and AZN values", () => {
    const url = whatsappTopUpUrl("https://wa.me/message/P63GI5XJ3PQLC1", 250, "25,00 ₼");

    expect(url).toContain("https://wa.me/message/P63GI5XJ3PQLC1?text=");
    expect(decodeURIComponent(url)).toContain("250 coin (25,00 ₼)");
  });

  it("uses a clear label for subscription debits", () => {
    expect(walletTransactionLabel("SUBSCRIPTION_PAYMENT")).toBe("Abunəlik ödənişi");
  });
});
