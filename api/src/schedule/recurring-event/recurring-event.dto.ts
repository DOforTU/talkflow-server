import { Location } from '@prisma/client';
import { IsDateString, IsOptional, IsString } from 'class-validator';
import { ResponseLocationDto } from '../location/location.dto';

// ===== 클라이언트에서 서버로 POST api/event 요청 시 사용되는 DTO =====

export class CreateRecurringRuleDto {
  @IsString()
  rule: string; // RRULE format, EX) FREQ=DAILY;INTERVAL=1

  @IsDateString()
  startDate: string;

  // 사용자는 endDate를 설정하지 않아도 되지만,
  // 클라이언트가 알아서 보냄
  @IsDateString()
  endDate: string;
}

export class UpdateRecurringEventDto {
  @IsOptional()
  @IsString()
  rule?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

// ===== 서버 내부에서 사용되는 데이터 타입 정의 =====

// 반복 규칙 타입 정의
export interface RecurringData {
  rule: string;
  startDate: string; // "2025-09-01" 형식
  endDate: string; // "2025-09-30" 형식
}

export interface CreateRecurringEventData {
  rule: string;
  startDate: string; // "2025-09-01" 형식
  endDate?: string; // "2025-09-30" 형식

  // event 정보
  title: string;
  description?: string;
  colorCode: string;
  userId: number;
  locationId?: number;
  startTime: string; // "2025-09-01 19:30" 형식
  endTime: string; // "2025-09-01 21:00" 형식
}

// 서버에서 클라이언트에게 응답하는 정보 DTO

export class ResponseRecurringEventDto {
  id: number;
  userId: number;
  rule: string;
  startDate: string;
  endDate: string | null;
  title: string;
  description: string | null;
  colorCode: string;
  startTime: string;
  endTime: string;
  version: number;
}
