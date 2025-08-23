import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { User } from './user.entity';
import { UserWithProfile } from './user.dto';
import { ProfileResponseDto } from '../profile/profile.dto';

/**
 * User Business Logic Service
 * - User CRUD operations
 * - Google OAuth user management
 * - Soft Delete functionality
 * - Data validation
 */
@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  // ===== READ =====

  async getUserWithProfileById(id: string): Promise<UserWithProfile> {
    const user = await this.findWithProfileById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Profile DTO로 변환
    const profileDto: ProfileResponseDto | null = user.profile
      ? {
          id: user.profile.id,
          username: user.profile.username,
          language: user.profile.language,
          avatarUrl: user.profile.avatarUrl,
          bio: user.profile.bio || null,
        }
      : null;

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      // oauthId 제외 (클라이언트에서 불필요)
      role: user.role,
      provider: user.provider,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt,
      profile: profileDto,
    };
  }

  /**
   * Get user by ID (throws exception)
   * @param id User ID
   * @returns User entity
   */
  async getUserById(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  /** Get user by email (with throws exception, can get no isActive user) */
  async getUserByEmail(email: string): Promise<User> {
    const user = await this.findUserByEmail(email);
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }
    return user;
  }

  // ===== Admin Logic =====

  /**
   * Get active user count
   * @returns Number of active users
   */
  async getUserCount(): Promise<number> {
    return this.userRepository.countUsers();
  }

  async getDeletedUserById(id: string): Promise<User> {
    const user = await this.userRepository.findDeletedById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  // ===== UPDATE =====

  /**
   * Update user password
   * @param id User ID
   * @param hashedNewPassword New hashed password
   * @returns Updated user entity
   */
  async updatePassword(id: string, hashedNewPassword: string): Promise<User> {
    // Check user existence
    await this.getUserById(id);

    // Business logic: Update user password
    const updatedUser = await this.userRepository.updatePasswordById(
      id,
      hashedNewPassword,
    );

    if (!updatedUser) {
      throw new Error(`Failed to update password for user with ID ${id}`);
    }

    return updatedUser;
  }

  /**
   * Update user's last login time
   * @param id User ID
   * @returns Updated user entity
   */
  async updateLastLogin(id: string): Promise<User> {
    // Check user existence
    await this.getUserById(id);

    // Update last login time
    const updatedUser = await this.userRepository.updateLastLogin(
      id,
      new Date(),
    );

    if (!updatedUser) {
      throw new Error(`Failed to update last login for user with ID ${id}`);
    }

    return updatedUser;
  }

  /**
   * Restore deleted user
   * @param id User ID
   * @returns Restored user entity
   */
  async restoreUser(id: string): Promise<User> {
    // Check deleted user existence
    await this.getDeletedUserById(id);

    const restored = await this.userRepository.restoreById(id);
    if (!restored) {
      throw new Error(`Failed to restore user with ID ${id}`);
    }

    const restoredUser = await this.userRepository.findById(id);
    if (!restoredUser) {
      throw new Error(`Failed to retrieve restored user with ID ${id}`);
    }

    return restoredUser;
  }

  // ===== DELETE =====
  /**
   * Permanently delete user
   * @param id User ID
   */
  async hardDeleteUser(id: string): Promise<void> {
    // Business logic: Check user existence (including deleted users)
    await this.getDeletedUserById(id);

    const deleted = await this.userRepository.hardDeleteById(id);
    if (!deleted) {
      throw new Error(`Failed to permanently delete user with ID ${id}`);
    }
  }

  // ===== SUB FUNCTION =====

  async findWithProfileById(id: string): Promise<User | null> {
    return await this.userRepository.findWithProfileById(id);
  }

  /**
   * Get all users
   * @returns Array of user entities
   */
  async findAllUsers(): Promise<User[] | null> {
    return this.userRepository.findAll();
  }

  /**
   * Find active user by ID (nullable)
   * @param id User ID
   * @returns User entity or null
   */
  async findUserById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  /**
   * Find active user by email (nullable)
   * @param email User email
   * @returns User entity or null
   */
  async findUserByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findByEmail(email);
  }

  /**
   * Find active user by email with password (for login)
   * @param email User email
   * @returns User entity or null
   */
  async findUserWithPasswordByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findByEmailWithPassword(email);
  }

  /**
   * Find active user by sub (used in JWT validation)
   * @param sub User sub
   * @returns User entity or null
   */
  async findUserBySub(sub: string): Promise<User | null> {
    return await this.userRepository.findBySub(sub);
  }

  /**
   * Find user by email (with deleted users)
   * @param email User email
   * @returns User entity or null
   */
  async findUserIncludingDeletedByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findByEmailIncludingDeleted(email);
  }

  /**
   * Find all deleted users
   * @returns Array of deleted user entities
   */
  async findDeletedUsers(): Promise<User[]> {
    return await this.userRepository.findAllDeleted();
  }
}
