import { ConflictException, Injectable } from '@nestjs/common';
import { Follow } from '@prisma/client';
import { ProfileService } from 'src/account/profile/profile.service';
import { FollowRepository } from './follow.repository';
import { ResponseProfileDto } from 'src/account/profile/profile.dto';

@Injectable()
export class FollowService {
  constructor(
    private readonly followRepository: FollowRepository,
    private readonly profileService: ProfileService,
  ) {}

  // ===== CREATE =====

  /**
   *
   * @param userId
   * @param followingId 팔로우할 아이디가 있는지를 확인해야하나?
   * @returns
   */
  async toggleFollow(userId: number, followingId: number): Promise<Follow> {
    const profile = await this.profileService.getProfileById(userId);
    if (profile.id === followingId) {
      throw new ConflictException('You cannot follow yourself.');
    }
    const isFollowing = await this.followRepository.isFollowing(
      profile.id,
      followingId,
    );
    if (isFollowing) {
      if (isFollowing.deletedAt != null) {
        // 언팔로우 상태 -> 복구(다시 팔로우)
        return await this.followRepository.followUser(profile.id, followingId);
      } else {
        // soft delete 상태
        return await this.followRepository.unfollowUser(
          profile.id,
          followingId,
        );
      }
    }
    return await this.followRepository.followUser(profile.id, followingId);
  }

  // ===== READ =====

  async getFollowers(profileId: number): Promise<ResponseProfileDto[]> {
    const profile = await this.profileService.getProfileById(profileId);
    return await this.followRepository.getFollowers(profile.id);
  }

  async getFollowings(profileId: number): Promise<ResponseProfileDto[]> {
    const profile = await this.profileService.getProfileById(profileId);
    return await this.followRepository.getFollowings(profile.id);
  }

  async getFollowCounts(
    profileId: number,
  ): Promise<{ followers: number; followings: number } | null> {
    const profile = await this.profileService.getProfileById(profileId);
    return await this.followRepository.getFollowCounts(profile.id);
  }

  // ===== UPDATE =====
}
