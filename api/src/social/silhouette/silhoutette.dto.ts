import { content_enum } from '@prisma/client';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class ResponseSilhouette {
  id: number;
  contentUrl: string;
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

  @IsBoolean()
  isPublic: boolean;

  //@IsOptional()
  //runningTime?: number;
}

//export class UpdateSilhouettesDto {
//  @IsString()
//  contentUrl: string;
//}
