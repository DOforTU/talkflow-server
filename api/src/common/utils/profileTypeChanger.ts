import { Profile } from '@prisma/client';
import { ResponseProfileDto } from 'src/account/profile/profile.dto';

export function profileToResponseProfileDto(
  profile?: Profile | null,
): ResponseProfileDto | null {
  if (!profile) {
    return null;
  }
  return {
    id: profile.id,
    nickname: profile.nickname,
    avatarUrl: profile.avatarUrl,
    language: profile.language,
    bio: profile.bio,
    version: profile.version,
    userId: profile.userId,
  };
}

/**
 * 같은 ResponseProfileDto타입이지만, userId는 null로 변환
 * @param profile 변환할 프로필 정보
 * @returns 외부에 노출할 프로필 정보 DTO
 */
export function profileToResponsePublicProfileDto(
  profile: ResponseProfileDto,
): ResponseProfileDto {
  return {
    id: profile.id,
    nickname: profile.nickname,
    avatarUrl: profile.avatarUrl,
    language: profile.language,
    bio: profile.bio,
    version: profile.version,
    userId: null,
  };
}
