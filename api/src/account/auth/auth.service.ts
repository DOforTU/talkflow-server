import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthRepository } from './auth.repository';
import {
  GoogleUser,
  CreateGoogleUserDto,
  CreateProfileDto,
  AuthResult,
} from './auth.dto';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
  ) {}

  async validateGoogleUser(googleUser: GoogleUser): Promise<AuthResult> {
    let user = await this.authRepository.findUserByOauthId(googleUser.id);

    if (!user) {
      user = await this.authRepository.findUserByEmail(googleUser.email);

      if (!user) {
        const createUserDto: CreateGoogleUserDto = {
          oauthId: googleUser.id,
          email: googleUser.email,
          firstName: googleUser.firstName,
          lastName: googleUser.lastName,
        };

        const createProfileDto: CreateProfileDto = {
          username:
            `${googleUser.firstName} ${googleUser.lastName}`.toLowerCase(),
          avatarUrl: googleUser.picture,
        };

        user = await this.authRepository.createUserWithProfile(
          createUserDto,
          createProfileDto,
        );
      }
    }

    if (!user) {
      throw new Error('Failed to create or find user');
    }

    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user,
    };
  }

  async findUserBySub(sub: string): Promise<User | null> {
    return this.authRepository.findUserBySub(sub);
  }
}
