import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { User } from './user.entity';

/**
 * User Data Access Layer (Repository Pattern)
 * - Database CRUD operations using TypeORM
 * - Soft Delete support
 * - Google OAuth user creation support
 */
@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // ===== READ =====

  /**
   * user's all info, Join everthing for deleting user
   * @param userId
   * @returns
   */
  async findWithProfileById(id: string): Promise<User | null> {
    return await this.userRepository
      .createQueryBuilder('user')
      .where('user.id = :id', { id })
      .leftJoinAndSelect('user.profile', 'profile')
      .getOne();
  }

  /**
   * Find user by ID (ONLY active & not-deleted)
   * @param id User ID
   * @returns User entity or null
   */
  async findById(id: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: {
        id,
        deletedAt: IsNull(),
      },
    });
  }

  /**
   * Find all users (admin only, active & not-deleted)
   * @returns Array of user entities
   */
  async findAll(): Promise<User[]> {
    return await this.userRepository.find({
      where: { deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Find user by email (ONLY active & not-deleted)
   * @param email User email
   * @returns User entity or null
   */
  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { email, deletedAt: IsNull() },
    });
  }

  /**
   * Find user by sub (used in JWT validation, ONLY active users)
   * @param sub User sub
   * @returns User entity or null
   */
  async findBySub(sub: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { id: sub, deletedAt: IsNull() },
    });
  }

  /**
   * Find user by sub (used in JWT validation, including inactive users)
   * @param sub User sub
   * @returns User entity or null
   */
  async findBySubIncludingInactive(sub: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { id: sub, deletedAt: IsNull() },
    });
  }

  /**
   * Find user by email (including deleted users)
   * @param email User email
   * @returns User entity or null
   */
  async findByEmailIncludingDeleted(email: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { email },
    });
  }

  /**
   * Find all deleted users (admin only)
   * @returns Array of user entities
   */
  async findAllDeleted(): Promise<User[]> {
    return await this.userRepository.find({
      where: { deletedAt: Not(IsNull()) },
    });
  }

  /**
   * Find deleted user by ID
   * @param id User ID
   * @returns User entity or null
   */
  async findDeletedById(id: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { id, deletedAt: Not(IsNull()) },
      withDeleted: true,
    });
  }

  /**
   * Find user by ID with password (including inactive users)
   * @param id User ID
   * @returns User entity with password or null
   */
  async findByIdWithPassword(id: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { id, deletedAt: IsNull() },
      select: ['id', 'email', 'password'],
    });
  }

  /**
   * Find user by email with password (for login and update pw)
   * @param email User email
   * @returns User entity with password or null
   */
  async findByEmailWithPassword(email: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { email, deletedAt: IsNull() },
      select: [
        'id',
        'email',
        'password', // include password for login and update pw
        'role',
      ],
    });
  }

  // ===== Update =====

  /** Update user Password */
  async updatePasswordById(
    id: string,
    hashedNewPassword: string,
  ): Promise<User | null> {
    await this.userRepository.update(id, {
      password: hashedNewPassword,
    });
    return await this.findById(id);
  }

  /** Update user's last login time */
  async updateLastLogin(id: string, lastLogin: Date): Promise<User | null> {
    await this.userRepository.update(id, {
      lastLogin,
    });
    return await this.findById(id);
  }

  /** Restore deleted user */
  async restoreById(id: string): Promise<boolean> {
    const result = await this.userRepository
      .createQueryBuilder()
      .update()
      .set({ deletedAt: null })
      .where('id = :id', { id })
      .execute();
    return (result.affected ?? 0) > 0;
  }

  // ===== Delete =====

  /** Permanently delete user */
  async hardDeleteById(id: string): Promise<boolean> {
    const result = await this.userRepository.delete(id);
    return (result.affected ?? 0) > 0;
  }

  // ===== Utility Methods =====

  /** Check if user exists (active users only) */
  async userExistsById(id: string): Promise<boolean> {
    const count = await this.userRepository.count({
      where: { id, deletedAt: IsNull() },
    });
    return count > 0;
  }

  /** Count active users */
  async countUsers(): Promise<number> {
    return await this.userRepository.count({
      where: { deletedAt: IsNull() },
    });
  }
}
