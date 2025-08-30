import {
  IsString,
  IsDateString,
  IsOptional,
  IsBoolean,
  IsHexColor,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateLocationDto } from '../../location/dto/create-location.dto';

export class CreateRecurringRuleDto {
  @IsString()
  rule: string; // RULE format

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
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
  location?: CreateLocationDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateRecurringRuleDto)
  recurring?: CreateRecurringRuleDto;
}
