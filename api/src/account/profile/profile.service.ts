import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProfileRepository } from './profile.repository';
import { Profile } from '@prisma/client';
import { ResponseProfileDto, UpdateProfileDto } from './profile.dto';

@Injectable()
export class ProfileService {
  constructor(private readonly profileRepository: ProfileRepository) {}

  // ===== READ =====

  /**
   * Nickname 으로 프로필 조회
   * 다른 사용자에게 공개해도 되는 정보만 반환
   * @param id
   * @returns
   */
  async getProfileByNickname(nickname: string): Promise<ResponseProfileDto> {
    const profile = await this.profileRepository.findByNickname(nickname);

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return {
      id: profile.id,
      nickname: profile.nickname,
      avatarUrl: profile.avatarUrl,
      language: profile.language,
      bio: profile.bio,
    };
  }

  /**
   * Id로 프로필 조회
   * 현재 프로필을 가진 user의 id도 반환
   * userId는 외부로 노출되면 안됨
   * 서버 내부에서만 사용해야 함
   * @param id
   * @returns
   */
  async getProfileById(id: number): Promise<Profile> {
    const profile = await this.profileRepository.findById(id);

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return profile;
  }

  // ===== UPDATE =====

  async updateProfile(
    userId: number,
    profileId: number,
    dto: UpdateProfileDto,
  ): Promise<Profile> {
    const profile = await this.profileRepository.findById(profileId);

    // 1. 프로필 존재 여부 및 소유자 권한 확인
    if (!profile || profile.userId !== userId) {
      throw new ForbiddenException(
        'You are not allowed to update this profile',
      );
    }

    // 2. 낙관적 잠금 로직 실행
    return await this.profileRepository.update(profileId, dto);
  }

  // ===== Sub Functions =====

  /**
   * 닉네임 존재 여부 확인. 있다면 true, 없다면 false
   * userId를 같이 넘긴다면
   * @param nickname 확인하고 싶은 닉네임
   * @returns boolean
   */
  async isExistingNickname(
    nickname: string,
    userId?: number,
  ): Promise<boolean> {
    const profile = await this.profileRepository.findByNickname(nickname);
    if (userId) {
      return !!profile && profile.userId !== userId;
    }
    return !!profile;
  }

  // ===== Find Functions =====
  async findProfileByNickname(nickname: string): Promise<Profile | null> {
    return await this.profileRepository.findByNickname(nickname);
  }

  async findProfileById(id: number): Promise<Profile | null> {
    return await this.profileRepository.findById(id);
  }
}
