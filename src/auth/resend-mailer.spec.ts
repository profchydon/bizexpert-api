import { sendSignupOtpEmail } from "./resend-mailer";

describe("sendSignupOtpEmail", () => {
  const mail = {
    apiKey: "re_test",
    from: "BizExpert <noreply@bizexpert.app>",
    to: "ada@shop.ng",
    code: "123456",
  };

  it("throws when the API key or from address is missing", async () => {
    await expect(
      sendSignupOtpEmail({ ...mail, apiKey: "  " }, async () => ({
        error: null,
      })),
    ).rejects.toThrow("RESEND_API_KEY is not set");
    await expect(
      sendSignupOtpEmail({ ...mail, from: "" }, async () => ({ error: null })),
    ).rejects.toThrow("RESEND_FROM is not set");
  });

  it("sends through the injected transport and surfaces Resend errors", async () => {
    const send = jest.fn(async () => ({ error: null }));
    await sendSignupOtpEmail(mail, send);
    expect(send).toHaveBeenCalledWith(mail);

    await expect(
      sendSignupOtpEmail(mail, async () => ({
        error: { message: "invalid from" },
      })),
    ).rejects.toThrow("invalid from");
  });
});
