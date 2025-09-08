import { Injectable } from '@nestjs/common';
import { Follow, Profile } from '@prisma/client';
import { ResponseProfileDto } from 'src/account/profile/profile.dto';
import { PrismaService } from 'src/common/prisma/prisma.service';

@Injectable()
export class FollowRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ===== CREATE =====

  async followUser(followerId: number, followingId: number): Promise<Follow> {
    return await this.prisma.follow.upsert({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
      update: {
        deletedAt: null,
      },
      create: {
        followerId,
        followingId,
        deletedAt: null,
      },
    });
  }

  // ===== READ =====

  async getFollowers(followingId: number): Promise<ResponseProfileDto[]> {
    const follows = await this.prisma.follow.findMany({
      where: {
        followingId,
        deletedAt: null,
      },
      include: {
        follower: true,
      },
    });

    return follows.map((follow) => ({
      id: follow.follower.id,
      nickname: follow.follower.nickname,
      avatarUrl: follow.follower.avatarUrl,
      language: follow.follower.language,
      bio: follow.follower.bio,
      version: follow.follower.version,
    }));
  }

  async getFollowings(followerId: number): Promise<ResponseProfileDto[]> {
    const follows = await this.prisma.follow.findMany({
      where: {
        followerId,
        deletedAt: null,
      },
      include: {
        following: true,
      },
    });

    return follows.map((follow) => ({
      id: follow.following.id,
      nickname: follow.following.nickname,
      avatarUrl: follow.following.avatarUrl,
      language: follow.following.language,
      bio: follow.following.bio,
      version: follow.following.version,
    }));
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
