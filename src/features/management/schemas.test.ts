import { describe, expect, it } from "vitest";

import {
  branchSchema,
  configurationSchema,
  roomSchema,
} from "./schemas";

describe("management form contracts", () => {
  it("requires the business branch location fields", () => {
    const result = branchSchema.safeParse({ name: "", address: "", city: "", district: "", phone: "", notes: "" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid room duration", () => {
    const result = roomSchema.safeParse({
      name: "Aysel",
      roomNumberOrCode: "",
      description: "",
      notes: "",
      reservationMode: "PLANNED_BOOKING",
      defaultSlotDurationMinutes: "0",
      visibility: "UNLISTED",
      personalPublicAddress: "",
    });
    expect(result.success).toBe(false);
  });

  it("requires the configured daily live queue reset time", () => {
    const result = configurationSchema.safeParse({
      defaultSlotDurationMinutes: "20",
      appointmentBufferMinutes: "0",
      bookingWindowDays: "30",
      minimumAdvanceMinutes: "30",
      cancellationCutoffMinutes: "0",
      liveQueueResetPolicy: "DAILY_AT_TIME",
      liveQueueResetLocalTime: "",
      liveQueueResetIntervalMinutes: "480",
      liveQueueMaxParticipants: "",
      liveQueueAcceptingNewEntries: true,
    });
    expect(result.success).toBe(false);
  });
});
