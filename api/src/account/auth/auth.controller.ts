import {
  Controller,
  Get,
  UseGuards,
  Req,
  Res,
  UseFilters,
  Post,
  Body,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import {
  AuthenticatedRequest,
  CompleteOnboardingDto,
  RequestWithCookies,
  UserWithProfile,
} from './auth.dto';
import { GoogleAuthExceptionFilter } from './filters/google-auth-exception.filter';
import { RateLimitGuard } from 'src/common/guards/rate-limit.guard';
import { JwtAuthGuard } from './jwt';
import { User } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ===== Get My Info =====

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@Request() req: { user: User }): Promise<UserWithProfile> {
    return await this.authService.getUserWithProfileById(req.user.id);
  }

  // ===== Google OAuth =====

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Route to start Google OAuth flow
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @UseFilters(GoogleAuthExceptionFilter)
  googleCallback(@Req() req: AuthenticatedRequest, @Res() res: Response) {
    const { user } = req.user;

    // Generate tokens and set cookies
    const tokens = this.authService.generateTokenPair(user);
    this.authService.setAuthCookies(res, tokens);

    // Redirect to frontend (without tokens, only success flag)
    if (!process.env.FRONTEND_URL) {
      throw new Error('FRONTEND_URL is not defined');
    }
    const frontendUrl = process.env.FRONTEND_URL;

    res.redirect(`${frontendUrl}/`);
  }

  // ===== Common Login =====

  /**
   * Handle user onboarding: It's necessary to complete the user profile.
   * @param req Authenticated request
   * @param res Response object
   */
  @Post('onboarding')
  @UseGuards(JwtAuthGuard)
  async completeOnboarding(
    @Body() onboardingDto: CompleteOnboardingDto,
    @Request() req: { user: User },
  ): Promise<User> {
    return await this.authService.completeOnboarding(
      req.user.id,
      onboardingDto,
    );
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
