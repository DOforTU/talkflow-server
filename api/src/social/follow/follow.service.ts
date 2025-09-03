import { Injectable } from '@nestjs/common';
import { Follow, Profile } from '@prisma/client';
import { ProfileService } from 'src/account/profile/profile.service';
import { FollowRepository } from './follow.repository';

@Injectable()
export class FollowService {
  constructor(
    private readonly followRepository: FollowRepository,
    private readonly profileService: ProfileService,
  ) {}

  // ----- CREATE -----

  async followUser(userId: number, followingId: number): Promise<Follow> {
    const profile = await this.profileService.getProfileById(userId);
    return await this.followRepository.followUser(profile.id, followingId);
  }

  // ----- READ -----

  async getFollowers(userId: number): Promise<Profile[]> {
    const profile = await this.profileService.getProfileById(userId);
    return await this.followRepository.getFollowers(profile.id);
  }

  async getFollowings(userId: number): Promise<Profile[]> {
    const profile = await this.profileService.getProfileById(userId);
    return await this.followRepository.getFollowings(profile.id);
  }

  // ----- UPDATE -----

  async unfollowUser(userId: number, followingId: number): Promise<boolean> {
    const profile = await this.profileService.getProfileById(userId);
    return await this.followRepository.unfollowUser(profile.id, followingId);
  }
}
