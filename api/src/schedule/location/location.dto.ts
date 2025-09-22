import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateLocationDto {
  /**
   * 클라이언트가 전송하지 않으면 undefined
   */
  @IsString()
  @IsOptional()
  nameEn?: string;

  /**
   * 클라이언트가 전송하지 않으면 undefined, 다만 nameEn, nameKo 둘 중 하나는 반드시 존재해야 함
   */
  @IsString()
  @IsOptional()
  nameKo?: string;

  @IsString()
  address: string;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;
}

// ===== 서버가 클라이언트에게 응답하는 프로필 정보 DTO =====

export class ResponseLocationDto {
  id: number;
  nameEn: string | null;
  nameKo: string | null;
  address: string;
  latitude: number;
  longitude: number;
}
