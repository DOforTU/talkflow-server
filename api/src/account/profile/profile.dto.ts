import { profile_language_enum } from '@prisma/client';
import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export interface ResponseProfileDto {
  id: number;
  nickname: string;
  avatarUrl: string;
  language: string | null;
  bio: string | null;
}

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  @MaxLength(30)
  @MinLength(4)
  // 닉네임은 띄어쓰기 없이 영문, 숫자, 한글 및 밑줄('_')만 사용할 수 있음.
  @Matches(/^[a-zA-Z0-9_가-힣]+$/u, {
    message:
      'You can only use English, numbers, Korean, and underscores(_) without spaces.',
  })
  nickname?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @IsIn(['en', 'ko'])
  @IsOptional()
  language?: profile_language_enum;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsNumber()
  @IsNotEmpty()
  version: number;
}
