import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { User } from '../user/user.entity';
import { Response } from 'express';
import { DataSource } from 'typeorm';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PendingUserRepository } from './pending-user.repository';
import { Profile } from '../profile/profile.entity';
import { AuthResult, GoogleUser, JwtPayload, TokenPair } from './auth.dto';
import {
  CreateLocalUserDto,
  LocalLoginDto,
  UpdatePasswordDto,
  UserProvider,
} from '../user/user.dto';

/** JWT payload type guard */
function isValidJwtPayload(token: unknown): token is JwtPayload {
  if (typeof token !== 'object' || token === null) {
    return false;
  }

  const obj = token as Record<string, unknown>;

  return (
    'sub' in obj &&
    'type' in obj &&
    typeof obj.sub === 'string' &&
    (obj.type === 'access' || obj.type === 'refresh')
  );
}

/**
 * Authentication Service
 * - Google OAuth user validation and processing
 * - JWT token generation
 * - User account linking and creation
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly pendingUserRepository: PendingUserRepository,
    private dataSource: DataSource,
  ) {}

  // ===== Onboarding Methods =====

  /** Complete user onboarding by updating profile and user information */
  async completeOnboarding(
    userId: string,
    onboardingData: { firstName: string; lastName: string; language: any },
  ): Promise<{ success: boolean; message: string }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Update User information
      await queryRunner.manager.update(User, userId, {
        firstName: onboardingData.firstName,
        lastName: onboardingData.lastName,
      });

      // 2. Find user to get profile relation
      const userWithProfile = await queryRunner.manager.findOne(User, {
        where: { id: userId },
        relations: ['profile'],
      });

      if (!userWithProfile?.profile) {
        throw new Error('User profile not found');
      }

      // 3. Update Profile information using profile ID
      await queryRunner.manager.update(Profile, userWithProfile.profile.id, {
        language: onboardingData.language,
      });

      await queryRunner.commitTransaction();

      return {
        success: true,
        message: 'Onboarding completed successfully',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('Onboarding completion error:', error);
      throw new InternalServerErrorException('Failed to complete onboarding');
    } finally {
      await queryRunner.release();
    }
  }

  // ===== Authentication and Validation Methods =====

  /** Google OAuth user validation and login processing */
  async validateGoogleUser(
    googleUser: GoogleUser,
  ): Promise<AuthResult | undefined> {
    const { id: oauthId, email, firstName, lastName, picture } = googleUser;

    // 1. 이메일로 기존 유저 조회
    const existingUser = await this.userService.findUserByEmail(email);

    // 1-1. 유저가 없으면 새로 생성
    if (!existingUser) {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        // Profile 생성 (온보딩에서 완성할 기본 프로필)
        const createdProfile = await queryRunner.manager.save(Profile, {
          username: null, // 온보딩에서 설정
          avatarUrl: picture || null, // 구글 프로필 사진만 가져오기
          bio: null,
          language: null, // 온보딩에서 설정
        });

        // User 생성 (첫 로그인이므로 lastLogin 설정)
        const createdUser = await queryRunner.manager.save(User, {
          email,
          oauthId,
          firstName: firstName || '',
          lastName: lastName || '',
          provider: UserProvider.GOOGLE,
          profile: createdProfile,
          lastLogin: new Date(),
        });

        // 트랜잭션 커밋
        await queryRunner.commitTransaction();

        return this.generateAuthResult(createdUser);
      } catch (error: any) {
        console.error('OAuth registration error:', error);
        await queryRunner.rollbackTransaction();
        throw new InternalServerErrorException(
          'Failed Google OAuth registration',
        );
      } finally {
        await queryRunner.release();
      }
    }

    // 1-2. 유저가 이미 존재하면 lastLogin 업데이트
    if (existingUser.provider !== UserProvider.GOOGLE) {
      throw new BadRequestException(
        `"${email}" already exists with a different login method.`,
      );
    }

    // Google 로그인 시 lastLogin 업데이트
    await this.userService.updateLastLogin(existingUser.id);

    return this.generateAuthResult(existingUser);
  }

  /** JWT token generation helper */
  private generateAuthResult(user: User): AuthResult {
    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user,
    };
  }

  /** Validate refresh token and generate new access token */
  async refreshAccessToken(refreshToken: string): Promise<{
    success: boolean;
    accessToken?: string;
    user?: User;
    message?: string;
  }> {
    try {
      // Validate refresh token
      const decodedToken: unknown = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
      });

      // Validate token structure
      if (!isValidJwtPayload(decodedToken) || decodedToken.type !== 'refresh') {
        return {
          success: false,
          message: 'Invalid refresh token.',
        };
      }

      // Retrieve user information
      const user = await this.userService.findUserById(
        String(decodedToken.sub),
      );
      if (!user) {
        return {
          success: false,
          message: 'User not found.',
        };
      }

      // TODO: Check if refresh token is blacklisted or expired

      // Generate new access token
      const newAccessToken = this.generateAccessToken(user);

      return {
        success: true,
        accessToken: newAccessToken,
        user,
      };
    } catch {
      return {
        success: false,
        message: 'Invalid refresh token.',
      };
    }
  }

  async signup(dto: CreateLocalUserDto): Promise<{ email: string }> {
    // Check if user already exists
    const existingUser = await this.userService.findUserByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists.');
    }

    // Check if there's already a pending registration for this email
    const existingPending = await this.pendingUserRepository.findByEmail(
      dto.email,
    );
    if (existingPending) {
      // Remove old pending registration
      await this.pendingUserRepository.remove(existingPending);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Generate verification code
    const verificationCode = this.generateCode();
    const codeExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10분 후 만료

    // Save pending user data
    await this.pendingUserRepository.create({
      email: dto.email,
      password: hashedPassword,
      firstName: dto.firstName,
      lastName: dto.lastName,
      verificationCode,
      codeExpiresAt,
    });

    // Send verification email
    await this.sendSignupVerificationCode(dto.email, verificationCode);

    return { email: dto.email };
  }

  // ===== Local Email Verification Methods =====

  /** Send signup verification email */
  private async sendSignupVerificationCode(
    email: string,
    code: string,
  ): Promise<void> {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_OAUTH_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.GMAIL_OAUTH_USER,
      to: email,
      subject: 'Tulog 회원가입 인증코드',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>TULOG 회원가입 인증</h2>
          <p>안녕하세요! TULOG에 가입해주셔서 감사합니다.</p>
          <p>아래 인증코드를 입력하여 회원가입을 완료해주세요:</p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
            <h3 style="color: #333; font-size: 24px; margin: 0;">${code}</h3>
          </div>
          <p>인증코드는 10분간 유효합니다.</p>
          <p>감사합니다.<br>TULOG 팀</p>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Failed to send signup verification email:', error);
      throw new InternalServerErrorException(
        'Failed to send verification email',
      );
    }
  }

  /**
   * Email code storage (기존 로그인 후 이메일 인증용)
   */
  private emailCodeStore = new Map<string, string>();
  /** code generation 6 digits */
  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /** Send email verification code (actual service should use nodemailer, etc.) */
  // npm install nodemailer
  async sendEmailCode(email: string): Promise<void> {
    const code = this.generateCode();
    this.emailCodeStore.set(email, code);
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_OAUTH_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    const mailOptions = {
      from: process.env.GMAIL_OAUTH_USER,
      to: email,
      subject: 'Tulog 회원가입 인증코드',
      text: `That's the code for signup: ${code}`,
    };
    try {
      await transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  /** Verify email code and activate account */
  async verifyEmailCode(
    email: string,
    code: string,
  ): Promise<{ email: string }> {
    // Check stored verification code
    const storedCode = this.emailCodeStore.get(email);
    if (!storedCode) {
      throw new BadRequestException(
        'Verification code has expired or does not exist.',
      );
    }

    if (storedCode !== code) {
      throw new BadRequestException('Verification code does not match.');
    }

    // Find user
    const user = await this.userService.findUserByEmail(email);
    if (!user) {
      throw new BadRequestException('User not found.');
    }

    // Delete verification code
    this.emailCodeStore.delete(email);

    return { email: user.email };
  }

  /** Complete signup after email verification */
  async completeSignup(
    email: string,
    code: string,
  ): Promise<{ email: string; message: string }> {
    // Find pending user
    const pendingUser = await this.pendingUserRepository.findByEmailAndCode(
      email,
      code,
    );

    if (!pendingUser) {
      throw new BadRequestException(
        'Invalid verification code or email address.',
      );
    }

    // Check if code is expired
    if (pendingUser.codeExpiresAt < new Date()) {
      // Remove expired pending user
      await this.pendingUserRepository.remove(pendingUser);
      throw new BadRequestException(
        'Verification code has expired. Please register again.',
      );
    }

    // Check if user already exists (double check)
    const existingUser = await this.userService.findUserByEmail(email);
    if (existingUser) {
      // Remove pending user
      await this.pendingUserRepository.remove(pendingUser);
      throw new ConflictException('Email already exists.');
    }

    // Create actual user
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Create auth record (온보딩에서 완성할 기본 프로필)
      const createdProfile = await queryRunner.manager.save(Profile, {
        username: null, // 온보딩에서 설정
        avatarUrl: `${this.configService.get('USER_DEFAULT_AVATAR_URL')}`,
        bio: null,
        timezone: null, // 온보딩에서 설정
        language: null, // 온보딩에서 설정
      });

      // Create new user with isActive: true
      const createdUser = await queryRunner.manager.save(User, {
        email: pendingUser.email,
        password: pendingUser.password,
        username: [pendingUser.firstName, pendingUser.lastName]
          .filter(Boolean)
          .join(' ')
          .trim(),
        firstName: pendingUser.firstName,
        lastName: pendingUser.lastName,
        provider: UserProvider.LOCAL,
        profile: createdProfile,
      });

      // Remove pending user data
      await this.pendingUserRepository.remove(pendingUser);

      // Commit transaction
      await queryRunner.commitTransaction();

      return {
        email: createdUser.email,
        message: 'Account created successfully!',
      };
    } catch (error: any) {
      console.error('Complete signup error:', error);
      // If error occurs, rollback transaction
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException('Failed to complete registration');
    } finally {
      // Release connection to pool
      await queryRunner.release();
    }
  }

  // ===== User Management Methods =====

  //** login user */
  async login(loginDto: LocalLoginDto, res: Response): Promise<User> {
    try {
      // Check if user exists (with password for comparison)
      const user = await this.userService.findUserWithPasswordByEmail(
        loginDto.email,
      );
      if (!user) {
        throw new BadRequestException('User not found.');
      }

      if (user.provider !== UserProvider.LOCAL) {
        throw new BadRequestException(
          'Login is only allowed for local accounts.',
        );
      }

      // Check password (user.password should now be available)
      const isPasswordValid = await bcrypt.compare(
        loginDto.password,
        user.password,
      );
      if (!isPasswordValid) {
        throw new BadRequestException('Invalid password.');
      }

      // Generate tokens and set cookies
      const tokens = this.generateTokenPair(user);
      this.setAuthCookies(res, tokens);

      return await this.userService.getUserByEmail(user.email);
    } catch (error: any) {
      console.error('Local login error:', error);
      if (error instanceof BadRequestException) {
        throw error; // 기존 에러 메시지 유지
      }
      throw new InternalServerErrorException('Failed Local login');
    }
  }

  /** Retrieve user by ID */
  async findUserById(userId: string): Promise<User | null> {
    return await this.userService.findUserById(userId);
  }

  /** Update user password */
  async updatePassword(
    user: User,
    updatePasswordDto: UpdatePasswordDto,
  ): Promise<User> {
    // check user's provider: if it's not local, throw an error
    if (user.provider !== UserProvider.LOCAL) {
      throw new BadRequestException(
        'Password update is only allowed for local accounts.',
      );
    }

    // Validate user existence and get user with password
    const userWithPW = await this.userService.findUserWithPasswordByEmail(
      user.email,
    );
    if (!userWithPW) {
      throw new BadRequestException(`User with email ${user.email} not found.`);
    }

    // compare old password
    const isPasswordValid = await bcrypt.compare(
      updatePasswordDto.oldPassword,
      userWithPW.password,
    );

    if (!isPasswordValid) {
      throw new BadRequestException('Old password is incorrect.');
    }

    // password bcrypt hashing
    const hashedNewPassword: string = await bcrypt.hash(
      updatePasswordDto.newPassword,
      10,
    );

    // Update password
    await this.userService.updatePassword(user.id, hashedNewPassword);

    return user;
  }

  // ===== Token Management Methods =====

  /** Generate JWT token pair (access + refresh) */
  generateTokenPair(user: User): TokenPair {
    // Generate access token (15 minutes)
    const accessToken = this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        type: 'access',
      },
      {
        secret: process.env.JWT_SECRET || 'your-secret-key',
        expiresIn: '15m',
      },
    );

    // Generate refresh token (7 days)
    const refreshToken = this.jwtService.sign(
      {
        sub: user.id,
        type: 'refresh',
      },
      {
        secret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
        expiresIn: '7d',
      },
    );

    return { accessToken, refreshToken };
  }

  /** Generate access token */
  generateAccessToken(user: User): string {
    return this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        type: 'access',
      },
      {
        secret: process.env.JWT_SECRET || 'jwt-secret-key',
        expiresIn: '15m', // 15분
      },
    );
  }

  // ===== Cookie Management Methods =====

  /** Set cookies */
  setAuthCookies(res: Response, tokens: TokenPair): void {
    const { accessToken, refreshToken } = tokens;

    // Send access token via HttpOnly cookie (enhanced security)
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    // Send refresh token via HttpOnly cookie (enhanced security)
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  /** Clear authentication cookies */
  clearAuthCookies(res: Response): void {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
  }
}

// TODO: Add token blacklist management feature
// TODO: Multi-device login session management
// TODO: Expand social login providers (Kakao, Naver, etc.)
// TODO: Add account unlinking feature
// TODO: Refresh token rotation on token renewal
// TODO: Detect and notify abnormal login attempts
