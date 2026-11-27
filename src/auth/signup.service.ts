import {
  BadRequestException,
  ConflictException,
  Injectable,
} from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../prisma/prisma.service";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { SignupOtpService } from "./signup-otp.service";

const BCRYPT_ROUNDS = 12;

@Injectable()
export class SignupService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly signupOtp: SignupOtpService,
    private readonly authService: AuthService,
  ) {}

  async register(
    dto: RegisterDto,
  ): Promise<{ requiresVerification: true; email: string }> {
    const email = dto.email.toLowerCase().trim();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing?.emailVerifiedAt) {
      throw new ConflictException("A user with this email already exists");
    }
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const data = {
      name: dto.name.trim(),
      passwordHash,
      phone: dto.phone?.trim() ?? null,
    };
    if (existing) {
      await this.prisma.user.update({ where: { id: existing.id }, data });
    } else {
      await this.prisma.user.create({ data: { ...data, email } });
    }
    await this.signupOtp.issueAndSend(email);
    return { requiresVerification: true, email };
  }

  async verifyEmail(email: string, otp: string) {
    const normalized = email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email: normalized },
    });
    const valid =
      user && !user.emailVerifiedAt
        ? await this.signupOtp.verify(normalized, otp)
        : false;
    if (!user || !valid) {
      throw new BadRequestException("Invalid or expired code");
    }
    const verified = await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerifiedAt: new Date() },
    });
    return this.authService.loginWithUser(verified);
  }

  async resendOtp(email: string): Promise<{ sent: true }> {
    const normalized = email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email: normalized },
    });
    if (user && !user.emailVerifiedAt) {
      await this.signupOtp.issueAndSend(normalized);
    }
    return { sent: true };
  }
}
