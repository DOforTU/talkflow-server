import { Injectable } from '@nestjs/common';
import { ProfileRepository } from './profile.repository';

@Injectable()
export class ProfileService {
  constructor(private readonly profileRepository: ProfileRepository) {}

  // ===== Sub Functions =====

  async isExistingNickname(nickname: string): Promise<boolean> {
    const profile = await this.profileRepository.findByNickname(nickname);
    return !!profile;
  }

  // ===== Find Functions =====
  async findProfileByNickname(nickname: string) {
    return await this.profileRepository.findByNickname(nickname);
  }
}
