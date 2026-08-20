import { describe, expect, it } from "vitest";

import { formatTime24Input, isTime24, normalizeTime24 } from "./time24Hour";

describe("24-hour time helpers", () => {
  it("formats four typed digits as an HH:mm value", () => {
    expect(formatTime24Input("1830")).toBe("18:30");
  });

  it("normalizes a single digit hour on blur", () => {
    expect(normalizeTime24("9:30")).toBe("09:30");
  });

  it("rejects values outside the 24-hour clock", () => {
    expect(isTime24("23:59")).toBe(true);
    expect(isTime24("24:00")).toBe(false);
    expect(isTime24("06:75")).toBe(false);
  });
});
