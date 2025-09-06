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
  async getMyFollowers(@Request() req: { user: User }): Promise<Profile[]> {
    return await this.followService.getFollowers(req.user.id);
  }

  /** Get my followings */
  @Get('me/followings')
  @UseGuards(OnBoardingGuard)
  async getMyFollowings(@Request() req: { user: User }): Promise<Profile[]> {
    return await this.followService.getFollowings(req.user.id);
  }

  /** Get users who follow specific user */
  @Get(':id/followers')
  @UseGuards(OnBoardingGuard)
  async getFollowers(
    @Request() req: { user: User },
    @Param('id') id: number,
  ): Promise<Profile[] | null> {
    return await this.followService.getFollowers(id);
  }

  /** Get users that specific user follows */
  @Get(':id/followings')
  @UseGuards(OnBoardingGuard)
  async getFollowings(
    @Request() req: { user: User },
    @Param('id') id: number,
  ): Promise<Profile[] | null> {
    return await this.followService.getFollowings(id);
  }

  // ===== UPDATE =====

  // ===== DELETE =====
}
