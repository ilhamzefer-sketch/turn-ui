import { z } from "zod";

export const individualWorkspaceSchema = z.object({
  name: z.string().trim().min(2, "İş sahəsinin adını daxil edin.").max(160, "Ad maksimum 160 simvol ola bilər."),
});

export const businessOnboardingSchema = z.object({
  name: z.string().trim().min(2, "Biznes adını daxil edin.").max(160, "Ad maksimum 160 simvol ola bilər."),
  phone: z.string().trim().min(1, "Biznes telefonunu daxil edin.").max(30),
  categoryId: z.string().optional(),
  customSubcategory: z.string().trim().max(160, "Kateqoriya maksimum 160 simvol ola bilər.").optional(),
  description: z.string().trim().max(2000, "Açıqlama maksimum 2000 simvol ola bilər.").optional(),
});

export type IndividualWorkspaceFormValues = z.infer<typeof individualWorkspaceSchema>;
export type BusinessOnboardingFormValues = z.infer<typeof businessOnboardingSchema>;
