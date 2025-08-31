import { IsBoolean, IsOptional, IsString } from 'class-validator';
import e from 'express';

export class CreateSilhouettesDto {
  @IsString()
  contentUrl: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  //@IsOptional()
  //runningTime?: number;
}

//export class UpdateSilhouettesDto {
//  @IsString()
//  contentUrl: string;
//}
