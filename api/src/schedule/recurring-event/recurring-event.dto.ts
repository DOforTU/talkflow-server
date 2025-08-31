import { IsDateString, IsOptional, IsString } from 'class-validator';

// ===== 클라이언트에서 서버로 POST api/event 요청 시 사용되는 DTO =====

export class CreateRecurringRuleDto {
  @IsString()
  rule: string; // RRULE format, EX) FREQ=DAILY;INTERVAL=1

  @IsDateString()
  startDate: string;

  /**
   * 클라이언트가 전송하지 않으면 undefined
   * undefined의 경우에는 일정을 무한히 생성하는 것이 아닌
   * 6개월치 생성 후 매 주마다 업데이트(추가 생성)하는 방식으로 구현
   */
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

// ===== 서버 내부에서 사용되는 데이터 타입 정의 =====

// 반복 규칙 타입 정의
export interface RecurringData {
  rule: string;
  startDate: string;
  endDate?: string | null;
}

export interface CreateRecurringEventData {
  rule: string;
  startDate: Date;
  endDate?: Date;
  title: string;
  description?: string;
  colorCode: string;
  userId: number;
  locationId?: number;
}
