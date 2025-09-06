import { content_enum } from '@prisma/client';
import {
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class ResponseSilhouette {
  id: number;
  contentUrl: string;
  title: string | null;
  type: content_enum;
  runningTime: number;
  isPublic: boolean;
  createdAt: Date;
  profile: {
    id: number;
    nickname: string;
    avatarUrl: string;
  };
}

export class CreateSilhouettesDto {
  @IsString()
  contentUrl: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsBoolean()
  isPublic: boolean;

  @IsNumber()
  @IsOptional()
  runningTime?: number;

  @IsIn(['image', 'video'])
  @IsOptional()
  type?: content_enum;
}

export class CreateSilhouetteFullDto {
  @IsString()
  contentUrl: string;

  @IsBoolean()
  isPublic: boolean;

  @IsString()
  @IsOptional()
  title?: string;

  @IsNumber()
  @IsOptional()
  runningTime?: number;

  @IsIn(['image', 'video'])
  type: content_enum;
}
