import {
  Controller,
  Get,
  Post,
  UseGuards,
  Req,
  Res,
  Body,
  Request,
  UseFilters,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { Response } from 'express';
import { GoogleAuthExceptionFilter } from './filters/google-auth-exception.filter';
import { RateLimitGuard } from 'src/common/guards/rate-limit.guard';
import { CreateLocalUserDto, LocalLoginDto } from '../user/user.dto';
import { User } from '../user/user.entity';
import { AuthResult, CompleteOnboardingDto } from './auth.dto';
import { JwtAuthGuard } from './jwt';

/** Cookie type definition */
interface AuthCookies {
  accessToken?: string;
  refreshToken?: string;
}

/** Request interface with cookies */
interface RequestWithCookies extends Request {
  cookies: AuthCookies;
}

/** Google OAuth authenticated request interface */
interface AuthenticatedRequest extends Request {
  user: AuthResult; // Receives AuthResult instead of GoogleUser
}

/**
 * Authentication Management Controller
 * - Handle Google OAuth login
 * - JWT token management
 * - Logout handling
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ===== Onboarding APIs =====

  /** Complete user onboarding */
  @Post('complete-onboarding')
  @UseGuards(JwtAuthGuard)
  async completeOnboarding(
    @Body() onboardingDto: CompleteOnboardingDto,
    @Request() req: { user: User },
  ): Promise<{ success: boolean; message: string }> {
    return await this.authService.completeOnboarding(
      req.user.id,
      onboardingDto,
    );
  }

  // ===== User Management APIs =====

  @Post('send-email-code')
  async sendEmailCode(@Body('email') email: string) {
    await this.authService.sendEmailCode(email);
    return { success: true, message: '인증코드가 전송되었습니다.' };
  }

  /** 이메일 인증코드 확인 */
  @Post('check-code')
  async checkCode(
    @Body('email') email: string,
    @Body('code') code: string,
  ): Promise<{ email: string }> {
    return await this.authService.verifyEmailCode(email, code);
  }

  /** Sign up with local account */
  @Post('signup')
  async signup(
    @Body() signupDto: CreateLocalUserDto,
  ): Promise<{ email: string; message: string }> {
    const result = await this.authService.signup(signupDto);
    return {
      ...result,
      message: 'Verification code sent to your email. Please check your inbox.',
    };
  }

  /** Complete signup after email verification */
  @Post('complete-signup')
  async completeSignup(
    @Body('email') email: string,
    @Body('code') code: string,
  ): Promise<{ email: string; message: string }> {
    return await this.authService.completeSignup(email, code);
  }

  @Post('login')
  @UseGuards(RateLimitGuard)
  /** Local account login */
  async login(
    @Body() loginDto: LocalLoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<User> {
    return await this.authService.login(loginDto, res);
  }

  // ===== Authentication APIs =====

  /** Start Google OAuth login */
  @Get('google')
  @UseGuards(
    AuthGuard('google'), // call GoogleStrategy --> validate user by GOOGLE --> validateGoogleUser()
    RateLimitGuard,
  )
  async googleAuth() {
    // Route to start Google OAuth flow
  }

  /** Handle Google OAuth callback */
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @UseFilters(GoogleAuthExceptionFilter)
  googleAuthRedirect(@Req() req: AuthenticatedRequest, @Res() res: Response) {
    // Use AuthResult already validated by Google Strategy
    const { user } = req.user;

    // Generate tokens and set cookies
    const tokens = this.authService.generateTokenPair(user);
    this.authService.setAuthCookies(res, tokens);

    // Redirect to frontend (without tokens, only success flag)
    if (!process.env.FRONTEND_URL) {
      throw new Error('FRONTEND_URL is not defined');
    }
    const frontendUrl = process.env.FRONTEND_URL;

    res.redirect(`${frontendUrl}/app/`);
  }

  // ===== Token Management APIs =====

  /** Refresh token */
  @Post('refresh')
  @UseGuards(RateLimitGuard)
  async refresh(@Req() req: RequestWithCookies, @Res() res: Response) {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'No refresh token provided.',
      });
    }

    const result = await this.authService.refreshAccessToken(refreshToken);

    if (!result.success) {
      return res.status(401).json({
        success: false,
        message: result.message,
      });
    }

    // Set new access token to HttpOnly cookie
    if (result.accessToken) {
      res.cookie('accessToken', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000, // 15 minutes
      });
    }

    return res.json({
      success: true,
      message: 'Token refreshed successfully',
    });
  }

  /** Logout */
  @Post('logout')
  logout(@Res() res: Response) {
    // TODO: Token blacklist management - invalidate tokens on logout
    // Clear all authentication-related cookies
    this.authService.clearAuthCookies(res);

    return res.json({
      success: true,
      message: 'Logged out successfully',
    });
  }
}

// TODO: Implement additional social login providers (Kakao, Naver, etc.)
// TODO: Add 2FA (Two-Factor Authentication) feature
// TODO: Session management and multi-device login control
// TODO: Apply API Rate Limiting
// TODO: Login attempt limiting and security enhancement
