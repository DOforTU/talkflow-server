import { Injectable } from '@nestjs/common';
import { Follow, Profile } from '@prisma/client';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class FollowRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ===== CREATE =====

  async followUser(followerId: number, followingId: number): Promise<Follow> {
    return await this.prisma.follow.update({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
      data: {
        follower: { connect: { id: followerId } },
        following: { connect: { id: followingId } },
        deletedAt: null,
      },
    });
  }

  // ===== READ =====

  async getFollowers(followingId: number): Promise<Profile[]> {
    const followers = await this.prisma.follow.findMany({
      where: { followingId },
      include: { follower: true },
    });
    return followers.map((follow) => follow.follower);
  }

  async getFollowings(followerId: number): Promise<Profile[]> {
    const followings = await this.prisma.follow.findMany({
      where: { followerId },
      include: { following: true },
    });
    return followings.map((follow) => follow.following);
  }

  async getFollowCounts(
    profileId: number,
  ): Promise<{ followers: number; followings: number } | null> {
    const followers = await this.prisma.follow.count({
      where: { followingId: profileId, deletedAt: null },
    });
    const followings = await this.prisma.follow.count({
      where: { followerId: profileId, deletedAt: null },
    });
    return { followers, followings };
  }

  // ===== UPDATE =====

  async unfollowUser(followerId: number, followingId: number): Promise<Follow> {
    return await this.prisma.follow.update({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  // ===== SUB FUNCTION =====

  async isFollowing(
    followerId: number,
    followingId: number,
  ): Promise<Follow | null> {
    const follow = await this.prisma.follow.findFirst({
      where: {
        followerId,
        followingId,
        deletedAt: null,
      },
    });
    return follow;
  }
}
