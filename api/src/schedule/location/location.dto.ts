import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateLocationDto {
  @IsString()
  @IsOptional()
  nameEn?: string | null;

  @IsString()
  @IsOptional()
  nameKo?: string | null;

  @IsString()
  address: string;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;
}
