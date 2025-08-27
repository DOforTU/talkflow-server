import { Profile, profile_language_enum, User } from '@prisma/client';
import {
  IsString,
  IsNotEmpty,
  IsIn,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';

/** Cookie type definition */
export interface AuthCookies {
  accessToken?: string;
  refreshToken?: string;
}

/** Request interface with cookies */
export interface RequestWithCookies extends Request {
  cookies: AuthCookies;
}

/** Google OAuth authenticated request interface */
export interface AuthenticatedRequest extends Request {
  user: AuthResult; // Receives AuthResult instead of GoogleUser
}

export interface GoogleUser {
  id: string; // Google OAuth ID
  email: string;
  firstName: string;
  lastName: string;
  picture: string;
}

/** JWT payload type definition */
export interface JwtPayload {
  sub: number; // User ID
  email?: string;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}
/** Authentication result interface */
export interface AuthResult {
  accessToken: string;
  user: User;
}

export interface TokenPair {
  accessToken: string;
  refreshToken?: string;
}

// Google Strategy에서 내부적으로 생성 (HTTP 요청 아님)
export interface CreateGoogleUserDto {
  oauthId: string; // Google OAuth ID
  email: string;
  firstName: string;
  lastName: string;
}

export interface CreateProfileDto {
  nickname: string;
  avatarUrl: string;
}

export interface UserWithProfile extends User {
  profile: Profile | null;
}

// ===== HTTP 요청에서 사용되는 DTO: 데코레이터 필수 =====

export class CompleteOnboardingDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  @MinLength(4)
  // 닉네임은 띄어쓰기 없이 영문, 숫자, 한글 및 밑줄('_')만 사용할 수 있음.
  @Matches(/^[a-zA-Z0-9_가-힣]+$/u, {
    message:
      'You can only use English, numbers, Korean, and underscores(_) without spaces.',
  })
  nickname: string;

  @IsIn(['ko', 'en'])
  language: profile_language_enum;
}
