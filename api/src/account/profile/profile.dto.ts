import { IsOptional, IsString, IsEnum } from 'class-validator';

export enum SupportedLanguage {
  KO = 'ko',
  EN = 'en',
}

export class ProfileResponseDto {
  id: string;
  username: string | null;
  language: SupportedLanguage | null;
  avatarUrl: string | null;
  bio?: string | null;
}

export class CreateGoogleProfileDto {
  @IsString()
  username: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsEnum(SupportedLanguage)
  language?: SupportedLanguage;
}
