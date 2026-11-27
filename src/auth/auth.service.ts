import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { Business, User } from "@prisma/client";

import { UpdateProfileDto } from "./dto/update-profile.dto";
import { JwtPayload } from "./strategies/jwt.strategy";
import { PrismaService } from "../prisma/prisma.service";

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(
    email: string,
    password: string,
  ): Promise<{ user: User; token: string; businesses: Business[] }> {
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException("Invalid email or password");
    }

    return this.buildAuthResponse(user);
  }

  loginWithUser(user: User): Promise<{
    user: User;
    token: string;
    businesses: Business[];
  }> {
    if (!user.emailVerifiedAt) {
      throw new UnauthorizedException("Verify your email before signing in");
    }
    return this.buildAuthResponse(user);
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user || !user.isActive) {
      return null;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    return isMatch ? user : null;
  }

  generateToken(user: User, businessIds: string[]): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      businessIds,
    };
    return this.jwtService.sign(payload);
  }

  private async buildAuthResponse(user: User): Promise<{
    user: User;
    token: string;
    businesses: Business[];
  }> {
    const memberships = await this.prisma.businessMembership.findMany({
      where: { userId: user.id, isActive: true },
      include: {
        business: { include: { locations: true } },
      },
    });
    const businesses = memberships
      .map((m) => m.business)
      .filter((b) => !!b && b.isActive) as Business[];
    const businessIds = businesses.map((b) => b.id);
    const token = this.generateToken(user, businessIds);
    return { user, token, businesses };
  }

  async getProfile(userId: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<User> {
    const user = await this.getProfile(userId);

    if (dto.email && dto.email !== user.email) {
      const conflict = await this.prisma.user.findUnique({
        where: { email: dto.email.toLowerCase().trim() },
      });
      if (conflict) {
        throw new ConflictException("Email is already in use");
      }
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        ...(dto.email !== undefined && {
          email: dto.email.toLowerCase().trim(),
        }),
        ...(dto.phone !== undefined && { phone: dto.phone?.trim() ?? null }),
      },
    });
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.getProfile(userId);

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException("Current password is incorrect");
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }
}
