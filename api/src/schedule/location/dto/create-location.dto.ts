import { IsString, IsNumber } from 'class-validator';

export class CreateLocationDto {
  @IsString()
  nameEn: string;

  @IsString()
  nameKo: string;

  @IsString()
  address: string;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;
}