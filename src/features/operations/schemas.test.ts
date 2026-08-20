import { describe, expect, it } from "vitest";

import { localDateTimeLabel } from "./operationFormatters";
import { guestQueueSchema, manualBookingSchema } from "./schemas";

describe("step 5 operation contracts", () => {
  it("requires both a guest name and phone", () => {
    expect(guestQueueSchema.safeParse({ displayName: "", phone: "" }).success).toBe(false);
    expect(guestQueueSchema.safeParse({ displayName: "Leyla Məmmədova", phone: "0501234567" }).success).toBe(true);
  });

  it("does not allow a public source for owner-created bookings", () => {
    expect(manualBookingSchema.safeParse({
      displayName: "Leyla Məmmədova",
      phone: "0501234567",
      source: "WEB",
      internalNote: "",
      serviceId: "",
    }).success).toBe(false);
  });

  it("keeps backend local appointment time unchanged", () => {
    expect(localDateTimeLabel("2026-08-24T10:00:00")).toContain("10:00");
  });
});
