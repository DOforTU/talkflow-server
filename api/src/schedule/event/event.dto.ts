import {
  IsString,
  IsDateString,
  IsOptional,
  IsBoolean,
  IsHexColor,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  CreateLocationDto,
  ResponseLocationDto,
} from '../location/location.dto';
import { CreateRecurringRuleDto } from '../recurring-event/recurring-event.dto';

// ===== 클라이언트에서 서버로 POST api/event 요청 시 사용되는 DTO =====

export class CreateEventDto {
  @IsString()
  title: string;

  /**
   * 클라이언트가 전송하지 않으면 undefined
   */
  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  startTime: string; // ex) 2023-03-15T10:00:00Z

  @IsDateString()
  endTime: string; // ex) 2023-03-15T12:00:00Z

  /**
   * true라면 startTime: 2023-03-15T00:00:00Z, endTime: 2023-03-16T00:00:00Z
   * 프론트에서 isAllDay true를 보낸다면 알아서 start/endTime을 위와 같이 보내기 때문에 예외처리 불필요
   */
  @IsBoolean()
  isAllDay: boolean;

  @IsHexColor()
  colorCode: string;

  /**
   * 클라이언트가 전송하지 않으면 undefined
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateLocationDto)
  location?: CreateLocationDto;

  /**
   * 클라이언트가 전송하지 않으면 undefined
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateRecurringRuleDto)
  recurring?: CreateRecurringRuleDto;
}

// ===== 서버 내부에서 사용되는 데이터 타입 정의 =====
export interface EventData {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
  colorCode: string;
}

// ===== 서버가 클라이언트에게 응답하는 프로필 정보 DTO =====
export class ResponseEventDto {
  id: number;
  title: string;
  description: string | null;
  startTime: Date;
  endTime: Date;
  isAllDay: boolean;
  colorCode: string;

  // time columns
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;

  // parts of relations
  userId: number;
  location: ResponseLocationDto | null;
  recurringEventId: number | null;
}
