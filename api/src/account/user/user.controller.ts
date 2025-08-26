import { Body, Controller, Patch, Request, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { User } from '@prisma/client';
import { UpdateUserDto } from './user.dto';
import { JwtAuthGuard } from '../auth/jwt';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateMe(
    @Request() req: { user: User },
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.userService.updateMe(req.user.id, updateUserDto);
  }
}
