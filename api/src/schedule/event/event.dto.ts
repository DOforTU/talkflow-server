import {
  IsString,
  IsDateString,
  IsOptional,
  IsBoolean,
  IsHexColor,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateLocationDto } from '../location/location.dto';

export class CreateRecurringRuleDto {
  @IsString()
  rule: string; // RRULE format

  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class CreateEventDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsOptional()
  @IsBoolean()
  isAllDay?: boolean;

  @IsHexColor()
  colorCode: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateLocationDto)
  location?: CreateLocationDto | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateRecurringRuleDto)
  recurring?: CreateRecurringRuleDto | null;
}
