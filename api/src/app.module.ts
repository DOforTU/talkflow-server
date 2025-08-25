import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { SecurityMiddleware } from './common/middleware/security.middleware';
import { LoggingMiddleware } from './common/middleware/logging.middleware';
import { PrismaModule } from './common/prisma/prisma.module';
import { UserModule } from './account/user/user.module';
import { AuthModule } from './account/auth/auth.module';
import { ProfileModule } from './account/profile/profile.module';
import { FollowModule } from './account/follow/follow.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    UserModule,
    ProfileModule,
    FollowModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // 모든 라우트에 미들웨어 적용
    consumer.apply(SecurityMiddleware, LoggingMiddleware).forRoutes('*path');
  }
}
