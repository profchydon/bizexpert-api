import { createHmac, randomInt, timingSafeEqual } from "crypto";

export const SIGNUP_OTP_LENGTH = 6;
export const SIGNUP_OTP_TTL_SECONDS = 600;
export const SIGNUP_OTP_COOLDOWN_SECONDS = 60;

export function generateSignupOtp(): string {
  return randomInt(0, 1_000_000).toString().padStart(SIGNUP_OTP_LENGTH, "0");
}

export function hashSignupOtp(
  email: string,
  otp: string,
  secret: string,
): string {
  return createHmac("sha256", secret).update(`${email}:${otp}`).digest("hex");
}

export function signupOtpMatches(
  email: string,
  otp: string,
  secret: string,
  storedHash: string,
): boolean {
  const actual = hashSignupOtp(email, otp, secret);
  const left = Buffer.from(actual);
  const right = Buffer.from(storedHash);
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}

export function signupOtpKey(email: string): string {
  return `signup-otp:${email}`;
}

export function signupOtpCooldownKey(email: string): string {
  return `signup-otp-cooldown:${email}`;
}
