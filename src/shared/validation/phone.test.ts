import { describe, expect, it } from "vitest";

import { phoneSchema } from "./phone";
import { toLocalPhoneInput } from "./phoneFormat";

describe("phone contract", () => {
  it.each(["0504059961", "0707654321", "0991234567"])("accepts exact local value %s", (phone) => {
    expect(phoneSchema.safeParse(phone).success).toBe(true);
  });

  it.each(["", "504059961", "+994504059961", "050 405 99 61", "050-405-99-61", "050405996", "05040599611"])(
    "rejects unsupported value %s",
    (phone) => {
      expect(phoneSchema.safeParse(phone).success).toBe(false);
    },
  );

  it("converts stored international values for editing without changing unknown values", () => {
    expect(toLocalPhoneInput("+994504059961")).toBe("0504059961");
    expect(toLocalPhoneInput("0504059961")).toBe("0504059961");
  });
});
