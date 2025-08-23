import {
  Injectable,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/account/auth/jwt';
import { UserRole } from 'src/account/user/user.dto';
import { User } from 'src/account/user/user.entity';

/**
 * AdminGuard
 * - JWT 인증 + 활성화 + 관리자 권한 확인
 * - ADMIN 또는 SUPER_ADMIN만 접근 가능
 */
@Injectable()
export class AdminGuard extends JwtAuthGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 먼저 JwtAuthGuard 통과 (JWT + isActive 검사)
    const isAuthenticated = await super.canActivate(context);
    if (!isAuthenticated) {
      return false;
    }

    const request = context.switchToHttp().getRequest();
    const user: User = request.user;

    // 관리자 권한 확인
    if (![UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(user.role)) {
      throw new ForbiddenException('관리자 권한이 필요합니다.');
    }

    return true;
  }
}
