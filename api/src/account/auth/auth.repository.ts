import { Injectable } from '@nestjs/common';
import {
  CompleteOnboardingDto,
  CreateGoogleUserDto,
  CreateProfileDto,
  UserWithProfile,
} from './auth.dto';
import { User, user_provider_enum } from '@prisma/client';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUserInfoById(userId: number): Promise<UserWithProfile | null> {
    return await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: { profile: true },
    });
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return await this.prisma.user.findFirst({
      where: { email, deletedAt: null },
      include: { profile: true },
    });
  }

  async findUserByOauthId(
    oauthId: string,
    provider: user_provider_enum,
  ): Promise<User | null> {
    return await this.prisma.user.findFirst({
      where: {
        oauthId,
        provider,
        deletedAt: null,
      },
      include: { profile: true },
    });
  }

  async findUserBySub(sub: number): Promise<User | null> {
    return await this.prisma.user.findFirst({
      where: {
        id: sub,
        deletedAt: null,
      },
    });
  }

  async createUserWithProfile(
    userDto: CreateGoogleUserDto,
    profileDto: CreateProfileDto,
  ): Promise<User | null> {
    return await this.prisma.user.create({
      data: {
        email: userDto.email,
        firstName: userDto.firstName,
        lastName: userDto.lastName,
        oauthId: userDto.oauthId,
        provider: user_provider_enum.google,
        profile: {
          create: {
            nickname: profileDto.nickname,
            avatarUrl: profileDto.avatarUrl,
          },
        },
      },
    });
  }

  async completeOnboarding(
    userId: number,
    dto: CompleteOnboardingDto,
  ): Promise<User | null> {
    return await this.prisma.user.update({
      where: { id: userId, deletedAt: null },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        profile: {
          update: {
            nickname: dto.nickname,
            language: dto.language,
          },
        },
      },
    });
  }
}
