import { z } from "zod";

import { phoneSchema } from "../../shared/validation/phone";

export const guestQueueSchema = z.object({
  displayName: z.string().trim().min(2, "Adı ən az 2 simvol yazın.").max(160, "Ad maksimum 160 simvol ola bilər."),
  phone: phoneSchema,
});

export type GuestQueueFormValues = z.infer<typeof guestQueueSchema>;

export const manualEntrySchema = guestQueueSchema.extend({
  source: z.enum(["OWNER_PHONE", "OWNER_WALK_IN", "OWNER_OTHER"]),
  internalNote: z.string().max(1000, "Qeyd maksimum 1000 simvol ola bilər."),
});

export type ManualEntryFormValues = z.infer<typeof manualEntrySchema>;

export const bookingNoteSchema = z.object({
  customerNote: z.string().max(1000, "Qeyd maksimum 1000 simvol ola bilər."),
});

export type BookingNoteFormValues = z.infer<typeof bookingNoteSchema>;

export const manualBookingSchema = manualEntrySchema;
export type ManualBookingFormValues = z.infer<typeof manualBookingSchema>;
