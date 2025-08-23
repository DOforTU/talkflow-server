import { Injectable } from '@nestjs/common';
import { CreateGoogleUserDto, CreateProfileDto } from './auth.dto';
import { User, user_provider_enum } from '@prisma/client';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUserByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });
  }

  async findUserByOauthId(oauthId: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { oauthId },
      include: { profile: true },
    });
  }

  async findUserBySub(sub: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: {
        id: sub,
      },
    });
  }

  async createUserWithProfile(
    userDto: CreateGoogleUserDto,
    profileDto: CreateProfileDto,
  ): Promise<User | null> {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: userDto.email,
          firstName: userDto.firstName,
          lastName: userDto.lastName,
          oauthId: userDto.oauthId,
          provider: user_provider_enum.google,
        },
      });

      await tx.profile.create({
        data: {
          username: profileDto.username,
          avatarUrl: profileDto.avatarUrl,
          user: {
            connect: { id: user.id },
          },
        },
      });

      return tx.user.findUnique({
        where: { id: user.id },
        include: { profile: true },
      });
    });
  }
}
