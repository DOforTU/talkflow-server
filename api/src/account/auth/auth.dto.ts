import { User } from '../user/user.entity';
import { IsString, IsEnum } from 'class-validator';
import { SupportedLanguage } from '../profile/profile.dto';

/** Google OAuth user information interface */
export interface GoogleUser {
  id: string; // Google OAuth ID
  email: string;
  firstName: string;
  lastName: string;
  picture: string;
  locale?: string; // Google에서 제공하는 언어 정보 (예: 'ko', 'en', 'ja')
}

/** Authentication result interface */
export interface AuthResult {
  accessToken: string;
  user: User;
}

/** JWT payload type definition */
export interface JwtPayload {
  sub: number;
  email?: string;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

/** Token generation result interface */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/** Complete onboarding DTO */
export class CompleteOnboardingDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEnum(SupportedLanguage)
  language: SupportedLanguage;
}
