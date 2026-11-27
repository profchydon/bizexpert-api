import { readFileSync } from "node:fs";
import { join } from "node:path";

function source(name: string) {
  return readFileSync(join(__dirname, name), "utf8");
}

describe("signup email OTP wiring", () => {
  it("registers without a JWT and verifies through Resend", () => {
    const signup = source("signup.service.ts");
    const otp = source("signup-otp.service.ts");
    const controller = source("auth.controller.ts");
    expect(signup).toContain("requiresVerification: true");
    expect(signup).not.toContain("buildAuthResponse");
    expect(signup).toContain("verifyEmail");
    expect(signup).toContain("resendOtp");
    expect(otp).toContain("sendSignupOtpEmail");
    expect(otp).toContain("RESEND_API_KEY");
    expect(controller).toContain("verify-email");
    expect(controller).toContain("resend-otp");
    expect(source("auth.service.ts")).toContain("emailVerifiedAt");
  });
});
