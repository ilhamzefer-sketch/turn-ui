import { z } from "zod";

import { isTime24 } from "../../shared/time/time24Hour";
import { optionalPhoneSchema, phoneSchema } from "../../shared/validation/phone";

const optionalText = (maximum: number) => z.string().trim().max(maximum, `Maksimum ${maximum} simvol ola bilər.`);

export const branchSchema = z.object({
  name: z.string().trim().min(1, "Filial adını yazın.").max(160, "Maksimum 160 simvol ola bilər."),
  address: z.string().trim().min(1, "Ünvanı yazın.").max(500, "Maksimum 500 simvol ola bilər."),
  city: z.string().trim().min(1, "Şəhəri yazın.").max(120, "Maksimum 120 simvol ola bilər."),
  district: z.string().trim().min(1, "Rayonu yazın.").max(120, "Maksimum 120 simvol ola bilər."),
  phone: optionalPhoneSchema,
  notes: optionalText(2000),
});

export type BranchFormValues = z.infer<typeof branchSchema>;

export const businessProfileSchema = z.object({
  name: z.string().trim().min(1, "Biznes adını yazın.").max(160, "Maksimum 160 simvol ola bilər."),
  phone: phoneSchema,
  legalName: optionalText(200),
  taxId: optionalText(40),
  description: optionalText(2000),
  categoryId: z.string(),
  customSubcategory: optionalText(160),
});

export type BusinessProfileFormValues = z.infer<typeof businessProfileSchema>;

export const memberInviteSchema = z.object({
  phone: phoneSchema,
  firstName: optionalText(80),
  lastName: optionalText(80),
  role: z.enum(["ADMIN", "EMPLOYEE"]),
});

export type MemberInviteFormValues = z.infer<typeof memberInviteSchema>;

export const roomSchema = z.object({
  name: z.string().trim().min(1, "Otaq adını yazın.").max(160, "Maksimum 160 simvol ola bilər."),
  roomNumberOrCode: optionalText(80),
  description: optionalText(2000),
  notes: optionalText(2000),
  reservationMode: z.enum(["LIVE_QUEUE", "PLANNED_BOOKING"]),
  defaultSlotDurationMinutes: z.string().refine((value) => {
    const number = Number(value);
    return Number.isInteger(number) && number >= 1 && number <= 1440;
  }, "1–1440 dəqiqə arasında tam rəqəm yazın."),
  visibility: z.enum(["PUBLIC", "UNLISTED", "PRIVATE"]),
  personalPublicAddress: optionalText(500),
});

export type RoomFormValues = z.infer<typeof roomSchema>;

export const configurationSchema = z.object({
  defaultSlotDurationMinutes: z.string().refine(isIntegerBetween(1, 1440), "1–1440 dəqiqə yazın."),
  appointmentBufferMinutes: z.string().refine(isIntegerBetween(0, 1440), "0–1440 dəqiqə yazın."),
  bookingWindowDays: z.string().refine(isIntegerBetween(1, 90), "1–90 gün yazın."),
  minimumAdvanceMinutes: z.string().refine(isIntegerBetween(0, 10080), "0–10080 dəqiqə yazın."),
  cancellationCutoffMinutes: z.string().refine(isIntegerBetween(0, 525600), "Müsbət dəqiqə yazın."),
  liveQueueResetPolicy: z.enum(["DAILY_AT_TIME", "EVERY_INTERVAL"]),
  liveQueueResetLocalTime: z.string(),
  liveQueueResetIntervalMinutes: z.string(),
  liveQueueMaxParticipants: z.string(),
  liveQueueAcceptingNewEntries: z.boolean(),
}).superRefine((values, context) => {
  if (values.liveQueueResetPolicy === "DAILY_AT_TIME" && !isTime24(values.liveQueueResetLocalTime)) {
    context.addIssue({ code: "custom", path: ["liveQueueResetLocalTime"], message: "Saatı 24 saat formatında yazın (məsələn, 18:30)." });
  }
  if (values.liveQueueResetPolicy === "EVERY_INTERVAL" && !isIntegerBetween(1, 10080)(values.liveQueueResetIntervalMinutes)) {
    context.addIssue({ code: "custom", path: ["liveQueueResetIntervalMinutes"], message: "Müsbət interval yazın." });
  }
  if (values.liveQueueMaxParticipants && !isIntegerBetween(1, 100000)(values.liveQueueMaxParticipants)) {
    context.addIssue({ code: "custom", path: ["liveQueueMaxParticipants"], message: "Müsbət limit yazın və ya boş saxlayın." });
  }
});

export type ConfigurationFormValues = z.infer<typeof configurationSchema>;

function isIntegerBetween(minimum: number, maximum: number) {
  return (value: string) => {
    const number = Number(value);
    return Number.isInteger(number) && number >= minimum && number <= maximum;
  };
}
