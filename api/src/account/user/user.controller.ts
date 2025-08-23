import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './user.entity';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';
import { UserWithProfile } from './user.dto';

/**
 * User Management Controller
 * - Provides user CRUD APIs
 * - JWT authentication protection
 * - Soft Delete support
 */
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // ===== READ =====

  /** Get current logged-in user information */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getUserInfo(@Request() req: { user: User }): Promise<UserWithProfile> {
    return await this.userService.getUserWithProfileById(req.user.id);
  }

  /** Get user by ID */
  @Get(':id')
  async getUserById(@Param('id') id: string): Promise<User> {
    return await this.userService.getUserById(id);
  }

  // ===== UPDATE =====
}
