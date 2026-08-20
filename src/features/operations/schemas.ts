import { z } from "zod";

const phone = z.string().trim().min(7, "Telefon nömrəsini tam yazın.").max(30, "Telefon nömrəsi çox uzundur.");

export const guestQueueSchema = z.object({
  displayName: z.string().trim().min(2, "Adı ən az 2 simvol yazın.").max(160, "Ad maksimum 160 simvol ola bilər."),
  phone,
});

export type GuestQueueFormValues = z.infer<typeof guestQueueSchema>;

export const manualEntrySchema = guestQueueSchema.extend({
  source: z.enum(["OWNER_PHONE", "OWNER_WALK_IN", "OWNER_OTHER"]),
  internalNote: z.string().max(1000, "Qeyd maksimum 1000 simvol ola bilər."),
});

export type ManualEntryFormValues = z.infer<typeof manualEntrySchema>;

export const bookingNoteSchema = z.object({
  serviceId: z.string(),
  customerNote: z.string().max(1000, "Qeyd maksimum 1000 simvol ola bilər."),
});

export type BookingNoteFormValues = z.infer<typeof bookingNoteSchema>;

export const manualBookingSchema = manualEntrySchema.extend({ serviceId: z.string() });
export type ManualBookingFormValues = z.infer<typeof manualBookingSchema>;
