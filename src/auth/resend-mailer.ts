import { Resend } from "resend";

export type SignupOtpMail = {
  apiKey: string;
  from: string;
  to: string;
  code: string;
};

type SendResult = { error: { message: string } | null };

export async function sendSignupOtpEmail(
  mail: SignupOtpMail,
  send: (mail: SignupOtpMail) => Promise<SendResult> = sendWithResend,
): Promise<void> {
  const apiKey = mail.apiKey.trim();
  const from = mail.from.trim();
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set");
  }
  if (!from) {
    throw new Error("RESEND_FROM is not set");
  }
  const { error } = await send({ ...mail, apiKey, from });
  if (error) {
    throw new Error(error.message);
  }
}

async function sendWithResend(mail: SignupOtpMail): Promise<SendResult> {
  const resend = new Resend(mail.apiKey);
  const { error } = await resend.emails.send({
    from: mail.from,
    to: mail.to,
    subject: "Your BizExpert verification code",
    text: `Your BizExpert verification code is ${mail.code}. It expires in 10 minutes.`,
    html: `<p>Your BizExpert verification code is <strong>${mail.code}</strong>.</p><p>It expires in 10 minutes.</p>`,
  });
  return { error: error ? { message: error.message } : null };
}
