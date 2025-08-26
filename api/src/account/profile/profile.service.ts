import { Injectable, NotFoundException } from '@nestjs/common';
import { ProfileRepository } from './profile.repository';
import { Profile } from '@prisma/client';
import { ResponseProfileDto } from './profile.dto';

@Injectable()
export class ProfileService {
  constructor(private readonly profileRepository: ProfileRepository) {}

  // ===== READ =====
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

  // ===== Sub Functions =====

  /**
   * 닉네임 존재 여부 확인. 있다면 true, 없다면 false(본인 닉네임은 제외)
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
}
