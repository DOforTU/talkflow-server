import { Injectable } from '@nestjs/common';
import { ProfileRepository } from './profile.repository';

@Injectable()
export class ProfileService {
  constructor(private readonly profileRepository: ProfileRepository) {}

  // ===== Sub Functions =====

  /**
   * 닉네임 존재 여부 확인. 있다면 true, 없다면 false
   * @param nickname 확인하고 싶은 닉네임
   * @returns boolean
   */
  async isExistingNickname(nickname: string): Promise<boolean> {
    const profile = await this.profileRepository.findByNickname(nickname);
    return !!profile;
  }

  // ===== Find Functions =====
  async findProfileByNickname(nickname: string) {
    return await this.profileRepository.findByNickname(nickname);
  }
}
