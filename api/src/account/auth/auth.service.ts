import { Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthRepository } from './auth.repository';
import {
  GoogleUser,
  CreateGoogleUserDto,
  CreateProfileDto,
  AuthResult,
  TokenPair,
  JwtPayload,
  CompleteOnboardingDto,
  UserWithProfile,
} from './auth.dto';
import { User } from '@prisma/client';
import { Response } from 'express';
import { UserService } from '../user/user.service';
import { ProfileService } from '../profile/profile.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly userService: UserService,
    private readonly profileService: ProfileService,
    private readonly jwtService: JwtService,
  ) {}

  async getUserInfoById(userId: number): Promise<UserWithProfile> {
    const user = await this.authRepository.findUserInfoById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  // ===== Google Login =====

  /**
   * Validate Google user and return authentication result.
   * @param googleUser Google user information
   * @returns AuthResult
   */
  async validateGoogleUser(googleUser: GoogleUser): Promise<AuthResult> {
    // oauthId, provider로 사용자 존재 여부 확인
    let user = await this.authRepository.findUserByOauthId(
      googleUser.id,
      'google',
    );

    if (!user) {
      user = await this.authRepository.findUserByEmail(googleUser.email);
      if (user) {
        // 구글 로그인이 아니지만, 이메일이 이미 존재하는 경우(로컬 로그인이 gmail인 경우 등...)
        throw new Error('User Email already exists');
      } else {
        const createUserDto: CreateGoogleUserDto = {
          oauthId: googleUser.id,
          email: googleUser.email,
          // firstName, lastName이 빈 문자열일 수도 있음
          firstName:
            googleUser.firstName && googleUser.firstName.trim() !== ''
              ? googleUser.firstName
              : 'User',
          lastName:
            googleUser.lastName && googleUser.lastName.trim() !== ''
              ? googleUser.lastName
              : Math.floor(10000 + Math.random() * 90000).toString(),
        };

        const createProfileDto: CreateProfileDto = {
          nickname:
            `${googleUser.firstName}${Math.floor(10000 + Math.random() * 90000).toString()}`.toLowerCase(),
          avatarUrl: googleUser.picture,
        };

        // TODO: nickname 중복 충돌이 일어날 경우 랜덤 숫자를 한 번 더 부여
        // 최대 5번 반복, 만약 그래도 중복이면, 다시 로그인을 시도해주세요 라는 문구를 남김

        for (let i = 0; i < 5; i++) {
          const isExisting = await this.profileService.isExistingNickname(
            createProfileDto.nickname,
          );
          if (!isExisting) {
            break;
          }
          createProfileDto.nickname = `${createProfileDto.nickname}${Math.floor(
            10000 + Math.random() * 90000,
          )}`;
        }

        user = await this.authRepository.createUserWithProfile(
          createUserDto,
          createProfileDto,
        );
      }
    }

    if (!user) {
      throw new Error('Failed to create or find user');
    }

    // generate AuthResult
    return this.generateAuthResult(user);
  }

  async completeOnboarding(
    userId: number,
    dto: CompleteOnboardingDto,
  ): Promise<boolean> {
    await this.userService.getUserById(userId);
    return await this.authRepository.completeOnboarding(userId, dto);
  }

  // ===== Token Management Methods =====

  /** Generate JWT token pair (access + refresh) */
  generateTokenPair(user: User): TokenPair {
    // Generate access token (15 minutes)
    const accessToken: string = this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        type: 'access',
      },
      {
        secret: process.env.JWT_SECRET || 'your-secret-key',
        expiresIn: '15m',
      },
    );

    // Generate refresh token (7 days)
    const refreshToken: string = this.jwtService.sign(
      {
        sub: user.id,
        type: 'refresh',
      },
      {
        secret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
        expiresIn: '7d',
      },
    );

    return { accessToken, refreshToken };
  }

  /** Validate refresh token and generate new access token */
  async refreshAccessToken(refreshToken: string): Promise<{
    success: boolean;
    accessToken?: string;
    user?: User;
    message?: string;
  }> {
    try {
      // Validate refresh token
      const decodedToken: unknown = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
      });

      // Validate token structure
      if (
        !this.isValidJwtPayload(decodedToken) ||
        decodedToken.type !== 'refresh'
      ) {
        return {
          success: false,
          message: 'Invalid refresh token.',
        };
      }

      // Retrieve user information
      const user = await this.findUserBySub(decodedToken.sub);

      if (!user) {
        return {
          success: false,
          message: 'User not found.',
        };
      }

      // TODO: Check if refresh token is blacklisted or expired

      // Generate new access token
      const newAccessToken = this.generateAccessToken(user);
      return {
        success: true,
        accessToken: newAccessToken,
        user,
      };
    } catch {
      return {
        success: false,
        message: 'Invalid refresh token.',
      };
    }
  }

  /** Generate access token */
  generateAccessToken(user: User): string {
    return this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        type: 'access',
      },
      {
        secret: process.env.JWT_SECRET || 'jwt-secret-key',
        expiresIn: '15m', // 15분
      },
    );
  }

  /** JWT token generation helper */
  private generateAuthResult(user: User): AuthResult {
    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user,
    };
  }

  private isValidJwtPayload(token: unknown): token is JwtPayload {
    if (typeof token !== 'object' || token === null) {
      return false;
    }

    const obj = token as Record<string, unknown>;

    return (
      'sub' in obj &&
      'type' in obj &&
      typeof obj.sub === 'string' &&
      (obj.type === 'access' || obj.type === 'refresh')
    );
  }

  // ===== Cookie Management Methods =====

  setAuthCookies(res: Response, tokens: TokenPair): void {
    const { accessToken, refreshToken } = tokens;

    // Send access token via HttpOnly cookie (enhanced security)
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    // Send refresh token via HttpOnly cookie (enhanced security)
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  /** Clear authentication cookies */
  clearAuthCookies(res: Response): void {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
  }

  // ===== Sub Funcions ====
  async findUserBySub(sub: number): Promise<User | null> {
    return this.authRepository.findUserBySub(sub);
  }
}
