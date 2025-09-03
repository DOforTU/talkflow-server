import {
  IsString,
  IsOptional,
  IsBoolean,
  IsHexColor,
  ValidateNested,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  CreateLocationDto,
  ResponseLocationDto,
} from '../location/location.dto';
import {
  CreateRecurringRuleDto,
  ResponseRecurringDto,
  UpdateRecurringEventDto,
} from '../recurring-event/recurring-event.dto';

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

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/, {
    message: 'startTime must be in format YYYY-MM-DD HH:mm',
  })
  startTime: string; // ex) 2025-09-01 19:30

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/, {
    message: 'endTime must be in format YYYY-MM-DD HH:mm',
  })
  endTime: string; // ex) 2025-09-01 21:00

  /**
   * true라면 startTime: 2025-09-01 00:00, endTime: 2025-09-01 23:59
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

export class UpdateEventDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/, {
    message: 'startTime must be in format YYYY-MM-DD HH:mm',
  })
  startTime?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/, {
    message: 'endTime must be in format YYYY-MM-DD HH:mm',
  })
  endTime?: string;

  @IsOptional()
  @IsBoolean()
  isAllDay?: boolean;

  @IsOptional()
  @IsHexColor()
  colorCode?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateLocationDto)
  location?: CreateLocationDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateRecurringEventDto)
  recurring?: UpdateRecurringEventDto;
}

// ===== 서버 내부에서 사용되는 데이터 타입 정의 =====
export interface EventData {
  title: string;
  description?: string;
  startTime: string; // "2025-09-01 19:30" 형식
  endTime: string; // "2025-09-01 21:00" 형식
  isAllDay: boolean;
  colorCode: string;
}

// ===== 서버가 클라이언트에게 응답하는 정보 DTO =====
export class EventDetailDto {
  id: number;
  title: string;
  description: string | null;
  startTime: string; // "2025-09-01 19:30" 형식
  endTime: string; // "2025-09-01 21:00" 형식
  isAllDay: boolean;
  colorCode: string;
  version: number;

  // time columns
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;

  // parts of relations
  userId: number;
  location: ResponseLocationDto | null;
  recurringEvent: ResponseRecurringDto | null;
}
