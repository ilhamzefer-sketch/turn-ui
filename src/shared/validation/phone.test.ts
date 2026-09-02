import { describe, expect, it } from "vitest";

import { phoneSchema } from "./phone";
import { toLocalPhoneInput } from "./phoneFormat";

describe("phone contract", () => {
  it.each(["0500000000", "0707654321", "0991234567"])("accepts exact local value %s", (phone) => {
    expect(phoneSchema.safeParse(phone).success).toBe(true);
  });

  it.each(["", "500000000", "+994500000000", "050 000 00 00", "050-000-00-00", "050000000", "05000000000"])(
    "rejects unsupported value %s",
    (phone) => {
      expect(phoneSchema.safeParse(phone).success).toBe(false);
    },
  );

  it("converts stored international values for editing without changing unknown values", () => {
    expect(toLocalPhoneInput("+994500000000")).toBe("0500000000");
    expect(toLocalPhoneInput("0500000000")).toBe("0500000000");
  });
});
