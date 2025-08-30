import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { GoogleStrategy } from './google.strategy';
import { JwtAuthStrategy } from './jwt/jwt.strategy';
import { UserModule } from '../user/user.module';
import { ProfileModule } from '../profile/profile.module';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
    PassportModule,
    UserModule,
    ProfileModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthRepository, GoogleStrategy, JwtAuthStrategy],
})
export class AuthModule {}
