import { describe, expect, it } from "vitest";

import {
  businessProfileSchema,
  branchSchema,
  configurationSchema,
  liveQueueConfigurationSchema,
  memberInviteSchema,
  roomSchema,
} from "./schemas";

describe("management form contracts", () => {
  it("requires the business branch location fields", () => {
    const result = branchSchema.safeParse({ name: "", address: "", city: "", district: "", phone: "", notes: "" });
    expect(result.success).toBe(false);
  });

  it("accepts only exact local phone values across management forms", () => {
    expect(memberInviteSchema.safeParse({ phone: "0501234567", firstName: "", lastName: "", role: "EMPLOYEE" }).success).toBe(true);
    expect(memberInviteSchema.safeParse({ phone: "+994501234567", firstName: "", lastName: "", role: "EMPLOYEE" }).success).toBe(false);
    expect(branchSchema.safeParse({ name: "Filial", address: "Ünvan", city: "Bakı", district: "Nəsimi", phone: "", notes: "" }).success).toBe(true);
    expect(branchSchema.safeParse({ name: "Filial", address: "Ünvan", city: "Bakı", district: "Nəsimi", phone: "050-123-45-67", notes: "" }).success).toBe(false);
    expect(businessProfileSchema.safeParse({ name: "Biznes", phone: "050123456", legalName: "", taxId: "", description: "", categoryId: "", customSubcategory: "" }).success).toBe(false);
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

  it("requires both a live queue reset rule and its matching time value", () => {
    const missingRule = liveQueueConfigurationSchema.safeParse({
      liveQueueResetPolicy: "",
      liveQueueResetLocalTime: "",
      liveQueueResetIntervalMinutes: "",
      liveQueueMaxParticipants: "",
      liveQueueAcceptingNewEntries: true,
    });
    const missingDailyTime = liveQueueConfigurationSchema.safeParse({
      liveQueueResetPolicy: "DAILY_AT_TIME",
      liveQueueResetLocalTime: "",
      liveQueueResetIntervalMinutes: "",
      liveQueueMaxParticipants: "",
      liveQueueAcceptingNewEntries: true,
    });

    expect(missingRule.success).toBe(false);
    expect(missingDailyTime.success).toBe(false);
  });
});
