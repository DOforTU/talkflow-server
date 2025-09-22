import { Injectable } from '@nestjs/common';
import { Event, RecurringEvent, Silhouette, User } from '@prisma/client';
import { AdminRepository } from './admin.repository';

@Injectable()
export class AdminService {
  constructor(private readonly adminRepository: AdminRepository) {}

  // 사용자만 전체 조회
  async getAllUsers(): Promise<User[]> {
    return await this.adminRepository.getAllUsers();
  }

  // soft delete된 사용자만 전체 조회
  async getDeletedUsers(): Promise<User[]> {
    return await this.adminRepository.getDeletedUsers();
  }

  // soft delete된 event만 전체 조회
  async getDeletedEvents(): Promise<Event[]> {
    return await this.adminRepository.getDeletedEvents();
  }

  // soft delete된 recurring event만 전체 조회
  async getDeletedRecurringEvents(): Promise<RecurringEvent[]> {
    return await this.adminRepository.getDeletedRecurringEvents();
  }

  // soft delete된 silhouette만 전체 조회
  async getDeletedSilhouettes(): Promise<Silhouette[]> {
    return await this.adminRepository.getDeletedSilhouettes();
  }
}
