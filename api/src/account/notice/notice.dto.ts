import {
  IsEnum,
  IsOptional,
  IsString,
  IsBoolean,
  IsInt,
} from 'class-validator';
import { notice_type_enum } from '@prisma/client';

export class CreateNoticeDto {
  @IsEnum(notice_type_enum)
  type: notice_type_enum;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsInt()
  targetId: number;

  @IsOptional()
  @IsInt()
  actorId?: number;

  @IsOptional()
  @IsInt()
  relatedFollowId?: number;

  @IsOptional()
  @IsInt()
  relatedLikeId?: number;
}

export class UpdateNoticeDto {
  @IsOptional()
  @IsBoolean()
  isRead?: boolean;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;
}

export class NoticeQueryDto {
  // 읽었는지 확인용
  @IsOptional()
  @IsBoolean()
  isRead?: boolean;

  // 무슨 타입인지 like, follow, system
  @IsOptional()
  @IsEnum(notice_type_enum)
  type?: notice_type_enum;

  // 한 번에 알림을 몇개까지 볼 수 있는지
  @IsOptional()
  @IsInt()
  limit?: number = 20;

  // 몇 개 건너뛸건지 근데 20개씩 볼 수 있게 건너뜀 없음
  @IsOptional()
  @IsInt()
  offset?: number = 0;
}
