import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Match } from 'src/common/decorator/match.decorator';
import { ProfileResponseDto } from '../profile/profile.dto';

//  ===== Enum =====
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

export enum UserProvider {
  LOCAL = 'local',
  GOOGLE = 'google',
}

export enum PendingUserStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export class CreateGoogleUserDto {
  /** User email */
  @IsEmail()
  email: string;

  /** Username */
  @IsString()
  username: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  /** Profile picture URL (default: default-avatar.png) */
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  oauthId?: string;
}

export class CreateLocalUserDto {
  /** User email (required, valid email format) */
  @IsEmail()
  email: string;

  /** Password (required) */
  @MinLength(8)
  @MaxLength(20)
  @Matches(/(?=.*[A-Z])/, {
    message: 'Must contain at least 1 uppercase letter',
  })
  @Matches(/(?=.*[a-z])/, {
    message: 'Must contain at least 1 lowercase letter',
  })
  @Matches(/(?=.*\d)/, {
    message: 'Must contain at least 1 number',
  })
  @Matches(/(?=.*[!@#$%^&*()\-_=+{}[\]|\\:;"'<>,.?/`~])/, {
    message: 'Must contain at least 1 special character',
  })
  @Matches(/^[^\s]+$/, {
    message: 'Password must not contain spaces',
  })
  @IsString()
  password: string;

  @Match('password', { message: 'Passwords do not match' })
  passwordConfirm: string;

  /** First name (required) */
  @IsString()
  @MinLength(2)
  @MaxLength(30)
  @Matches(/^[^\s]+(?:\s[^\s]+)?$/, {
    message:
      'First name must contain at most one space, and not at the start or end',
  })
  firstName: string;

  /** User last name (required)*/
  @IsString()
  @MinLength(2)
  @MaxLength(30)
  @Matches(/^[^\s]+(?:\s[^\s]+)?$/, {
    message:
      'Last name must contain at most one space, and not at the start or end',
  })
  lastName: string;
}

export class LocalLoginDto {
  /** User email (required, valid email format) */
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class UpdateUserDto {
  /** Username (optional) */
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(30)
  @Matches(/^[^\s]+(?:\s[^\s]+)?$/, {
    message: 'Name must contain at most one space, and not at the start or end',
  })
  username?: string;

  /** Profile picture URL (optional) */
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  bio?: string;
}

export class UpdatePasswordDto {
  /** Password (required) */
  @IsString()
  oldPassword: string;

  /** Password (required) */
  @MinLength(8)
  @MaxLength(20)
  @Matches(/(?=.*[A-Z])/, {
    message: 'Must contain at least 1 uppercase letter',
  })
  @Matches(/(?=.*[a-z])/, {
    message: 'Must contain at least 1 lowercase letter',
  })
  @Matches(/(?=.*\d)/, {
    message: 'Must contain at least 1 number',
  })
  @Matches(/(?=.*[!@#$%^&*()\-_=+{}[\]|\\:;"'<>,.?/`~])/, {
    message: 'Must contain at least 1 special character',
  })
  @Matches(/^[^\s]+$/, {
    message: 'Password must not contain spaces',
  })
  @IsString()
  newPassword: string;
}

// ===== Response DTO =====

export class UserWithProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  provider: UserProvider;
  lastLogin?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  profile?: ProfileResponseDto | null;
}
