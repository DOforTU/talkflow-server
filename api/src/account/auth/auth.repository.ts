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
    return await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { email },
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
      },
      include: { profile: true },
    });
  }

  async findUserBySub(sub: number): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: {
        id: sub,
      },
      include: {
        profile: true,
      },
    });
  }

  async createUserWithProfile(
    userDto: CreateGoogleUserDto,
    profileDto: CreateProfileDto,
  ): Promise<User | null> {
    const user = await this.prisma.user.create({
      data: {
        email: userDto.email,
        firstName: userDto.firstName,
        lastName: userDto.lastName,
        oauthId: userDto.oauthId,
        provider: user_provider_enum.google,
        profile: {
          create: {
            username: profileDto.username,
            avatarUrl: profileDto.avatarUrl,
          },
        },
      },
    });

    return await this.prisma.user.findUnique({
      where: { id: user.id },
    });
  }

  async completeOnboarding(
    userId: number,
    dto: CompleteOnboardingDto,
  ): Promise<boolean> {
    try {
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          profile: {
            update: {
              username: `${dto.firstName} ${dto.lastName}`.toLowerCase(),
              language: dto.language,
            },
          },
        },
      });
      // 성공 시 true 반환
      return !!updatedUser;
    } catch (error) {
      // 업데이트 실패 시 예외 처리 (예: 해당 user가 없을 경우)
      console.error('Failed to complete onboarding:', error);
      return false;
    }
  }
}
