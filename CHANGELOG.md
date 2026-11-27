# Changelog

## Unreleased

- **Feat:** Signup sends a 6-digit email OTP through Resend. The account is unverified until `POST /auth/verify-email`. Covered by `otp.spec.ts`, `resend-mailer.spec.ts`, and `signup.service.spec.ts`.

- **Fix:** Creating a business uses a unique slug, wraps owner membership and the default shop in a transaction, and returns locations. Covered by `business-slug.spec.ts` and `create-business.util.spec.ts`.

- **Change:** AI chat calls OpenRouter (`POST /api/v1/chat/completions`) with `OPENROUTER_API_KEY`. The `openai` package is removed. Covered by `openrouter.client.spec.ts` and `openrouter.loop.spec.ts`.
