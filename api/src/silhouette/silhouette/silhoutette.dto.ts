import { IsOptional, IsString } from 'class-validator';

export class CreateSilhouettesDto {
  @IsString()
  contentUrl: string;

  @IsOptional()
  runningTime?: number;
}
