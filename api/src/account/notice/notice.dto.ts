import {
  IsEnum,
  IsOptional,
  IsString,
  IsBoolean,
  IsNumber,
} from 'class-validator';
import { notice_type_enum } from '@prisma/client';

export class CreateNoticeDto {
  @IsEnum(notice_type_enum)
  type: notice_type_enum;

  @IsString()
  title: string;

  @IsString()
  content: string;

  // 알림을 받는 사람
  @IsNumber()
  profileId: number;

  @IsOptional()
  @IsNumber()
  relatedEntityId?: number;

  @IsOptional()
  @IsString()
  relatedEntityName?: string;
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
  @IsNumber()
  limit?: number = 20;

  // 몇 개 건너뛸건지 근데 20개씩 볼 수 있게 건너뜀 없음
  @IsOptional()
  @IsNumber()
  offset?: number = 0;
}
