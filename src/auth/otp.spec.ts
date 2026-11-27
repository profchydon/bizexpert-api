import {
  SIGNUP_OTP_LENGTH,
  generateSignupOtp,
  hashSignupOtp,
  signupOtpKey,
  signupOtpMatches,
} from "./otp";

describe("signup OTP", () => {
  it("generates a zero-padded 6-digit code", () => {
    const code = generateSignupOtp();
    expect(code).toMatch(/^\d{6}$/);
    expect(code).toHaveLength(SIGNUP_OTP_LENGTH);
  });

  it("hashes and compares with the email and secret", () => {
    const hash = hashSignupOtp("ada@shop.ng", "123456", "secret");
    expect(signupOtpMatches("ada@shop.ng", "123456", "secret", hash)).toBe(
      true,
    );
    expect(signupOtpMatches("ada@shop.ng", "000000", "secret", hash)).toBe(
      false,
    );
    expect(signupOtpMatches("other@shop.ng", "123456", "secret", hash)).toBe(
      false,
    );
    expect(signupOtpKey("ada@shop.ng")).toBe("signup-otp:ada@shop.ng");
  });
});
