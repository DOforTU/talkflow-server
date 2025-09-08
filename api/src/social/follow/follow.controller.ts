import { ResponseProfileDto } from './../../../dist/account/profile/profile.dto.d';
import {
  Controller,
  Get,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { FollowService } from './follow.service';
import { OnBoardingGuard } from 'src/common/guards/onboarding.guard';
import { Follow, Profile, User } from '@prisma/client';

@Controller('profiles')
export class FollowController {
  constructor(private readonly followService: FollowService) {}

  // ===== CREATE =====

  @Post(':id/follow')
  @UseGuards(OnBoardingGuard)
  async followUser(
    @Request() req: { user: User },
    @Param('id') id: number,
  ): Promise<Follow> {
    return await this.followService.toggleFollow(req.user.id, id);
  }

  // ===== READ =====

  /** Get my followers */
  @Get('me/followers')
  @UseGuards(OnBoardingGuard)
  async getMyFollowers(
    @Request() req: { user: User },
  ): Promise<ResponseProfileDto[]> {
    return await this.followService.getFollowers(req.user.id);
  }

  /** Get my followings */
  @Get('me/followings')
  @UseGuards(OnBoardingGuard)
  async getMyFollowings(
    @Request() req: { user: User },
  ): Promise<ResponseProfileDto[]> {
    return await this.followService.getFollowings(req.user.id);
  }

  /** Get users who follow specific user */
  @Get(':id/followers')
  async getFollowers(
    @Param('id') id: number,
  ): Promise<ResponseProfileDto[] | null> {
    return await this.followService.getFollowers(id);
  }

  /** Get users that specific user follows */
  @Get(':id/followings')
  async getFollowings(
    @Param('id') id: number,
  ): Promise<ResponseProfileDto[] | null> {
    return await this.followService.getFollowings(id);
  }

  /** Get users follower/following count */
  @Get(':id/follow-counts')
  async getFollowCounts(
    @Param('id') id: number,
  ): Promise<{ followers: number; followings: number } | null> {
    return await this.followService.getFollowCounts(id);
  }

  // ===== UPDATE =====

  // ===== DELETE =====
}
