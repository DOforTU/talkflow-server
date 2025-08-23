import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './account/auth/auth.module';
import { UserModule } from './account/user/user.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SecurityMiddleware } from './common/middleware/security.middleware';
import { LoggingMiddleware } from './common/middleware/logging.middleware';
import { ProfileModule } from './account/profile/profile.module';
import { PrismaService } from './common/prisma/prisma.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PendingUser } from './account/auth/pending-user.entity';
import { Profile } from './account/profile/profile.entity';
import { User } from './account/user/user.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        schema: configService.get('DB_SCHEMA'),
        entities: [User, Profile, PendingUser],
        synchronize: configService.get('NODE_ENV') === 'development', // 배포환경에서는 false, 일단 table 자동 생성을 위해 true
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UserModule,
    ProfileModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // 모든 라우트에 미들웨어 적용
    consumer.apply(SecurityMiddleware, LoggingMiddleware).forRoutes('*');
  }
}
