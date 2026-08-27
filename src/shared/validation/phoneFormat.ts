export const phoneFormatMessage = "Telefon nömrəsini 0504059961 formatında yazın.";

export const localPhonePattern = /^0[1-9]\d{8}$/;

export function toLocalPhoneInput(phone: string | null | undefined) {
  if (!phone) return "";
  return /^\+994[1-9]\d{8}$/.test(phone) ? `0${phone.slice(4)}` : phone;
}

export function isLocalPhone(phone: string) {
  return localPhonePattern.test(phone);
}
