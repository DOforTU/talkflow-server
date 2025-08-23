import { User } from '@prisma/client';

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

/** Authentication result interface */
export interface AuthResult {
  accessToken: string;
  user: User;
}

export class CreateGoogleUserDto {
  oauthId: string; // Google OAuth ID
  email: string;
  firstName: string;
  lastName: string;
}

export class CreateProfileDto {
  username: string;
  avatarUrl: string;
}
