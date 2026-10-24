export const BANGLADESH_PHONE_REGEX = /^(\+?880|0)1[3-9]\d{8}$/;

export function isValidBangladeshPhone(phone: string): boolean {
  return BANGLADESH_PHONE_REGEX.test(phone);
}

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}
