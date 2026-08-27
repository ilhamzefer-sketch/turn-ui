import { z } from "zod";

import { phoneSchema } from "../../shared/validation/phone";

const namePattern = /^[\p{L}][\p{L} .'-]*$/u;

export const loginSchema = z.object({
  phone: phoneSchema,
  password: z.string().min(1, "Şifrəni daxil edin.").max(128, "Şifrə çox uzundur."),
});

export const registrationSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, "Ad ən azı 2 simvol olmalıdır.")
    .max(80, "Ad maksimum 80 simvol ola bilər.")
    .regex(namePattern, "Ad düzgün formatda deyil."),
  lastName: z
    .string()
    .trim()
    .min(2, "Soyad ən azı 2 simvol olmalıdır.")
    .max(80, "Soyad maksimum 80 simvol ola bilər.")
    .regex(namePattern, "Soyad düzgün formatda deyil."),
  phone: phoneSchema,
  password: z
    .string()
    .min(8, "Şifrə ən azı 8 simvol olmalıdır.")
    .max(128, "Şifrə maksimum 128 simvol ola bilər."),
  confirmPassword: z.string().min(1, "Şifrəni təkrar daxil edin."),
}).refine((values) => values.password === values.confirmPassword, {
  message: "Şifrələr eyni deyil.",
  path: ["confirmPassword"],
});

export const recoverySchema = z.object({
  disputedPhone: phoneSchema,
  claimantName: z.string().trim().min(2, "Adınızı daxil edin.").max(160),
  claimantContactPhone: phoneSchema,
  description: z
    .string()
    .trim()
    .min(10, "Müraciətinizi ən azı 10 simvolla izah edin.")
    .max(2000, "Müraciət maksimum 2000 simvol ola bilər."),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegistrationFormValues = z.infer<typeof registrationSchema>;
export type RecoveryFormValues = z.infer<typeof recoverySchema>;
