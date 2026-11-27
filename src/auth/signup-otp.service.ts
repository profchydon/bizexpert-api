import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  ServiceUnavailableException,
  TooManyRequestsException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";
import { redisConnectionOptions } from "../common/redis.util";
import {
  SIGNUP_OTP_COOLDOWN_SECONDS,
  SIGNUP_OTP_TTL_SECONDS,
  generateSignupOtp,
  hashSignupOtp,
  signupOtpCooldownKey,
  signupOtpKey,
  signupOtpMatches,
} from "./otp";
import { sendSignupOtpEmail } from "./resend-mailer";

@Injectable()
export class SignupOtpService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SignupOtpService.name);
  private redis: Redis | null = null;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    this.redis = new Redis({
      ...redisConnectionOptions(this.config),
      maxRetriesPerRequest: 3,
    });
  }

  onModuleDestroy() {
    this.redis?.disconnect();
  }

  async issueAndSend(email: string): Promise<void> {
    const client = this.requireRedis();
    const cooldown = signupOtpCooldownKey(email);
    const reserved = await client.set(
      cooldown,
      "1",
      "EX",
      SIGNUP_OTP_COOLDOWN_SECONDS,
      "NX",
    );
    if (reserved !== "OK") {
      throw new TooManyRequestsException("Wait before requesting another code");
    }
    const secret = this.config.getOrThrow<string>("JWT_SECRET");
    const code = generateSignupOtp();
    await client.set(
      signupOtpKey(email),
      hashSignupOtp(email, code, secret),
      "EX",
      SIGNUP_OTP_TTL_SECONDS,
    );
    try {
      await sendSignupOtpEmail({
        apiKey: this.config.get<string>("RESEND_API_KEY", ""),
        from: this.config.get<string>("RESEND_FROM", ""),
        to: email,
        code,
      });
    } catch (err) {
      await client.del(signupOtpKey(email));
      await client.del(cooldown);
      this.logger.error(
        err instanceof Error ? err.message : "Failed to send signup OTP",
      );
      throw new ServiceUnavailableException(
        "Could not send the verification email",
      );
    }
  }

  async verify(email: string, otp: string): Promise<boolean> {
    const client = this.requireRedis();
    const stored = await client.get(signupOtpKey(email));
    if (!stored) {
      return false;
    }
    const secret = this.config.getOrThrow<string>("JWT_SECRET");
    const ok = signupOtpMatches(email, otp.trim(), secret, stored);
    if (ok) {
      await client.del(signupOtpKey(email));
    }
    return ok;
  }

  private requireRedis(): Redis {
    if (!this.redis) {
      throw new ServiceUnavailableException("OTP store is not ready");
    }
    return this.redis;
  }
}
