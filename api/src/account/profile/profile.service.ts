import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ProfileRepository } from './profile.repository';
import { Profile } from '@prisma/client';
import { ResponseProfileDto, UpdateProfileDto } from './profile.dto';
import { ConfigService } from '@nestjs/config';
import { StorageService } from '../../common/module/storage/storage.service';
import { profileToResponsePublicProfileDto } from 'src/common/utils/profileTypeChanger';

@Injectable()
export class ProfileService {
  constructor(
    private readonly profileRepository: ProfileRepository,
    private readonly storageService: StorageService,
    private readonly configService: ConfigService,
  ) {}

  // ===== READ =====

  /**
   * Nickname 으로 프로필 조회
   * 다른 사용자에게 공개해도 되는 정보만 반환
   * @param id
   * @returns
   */
  async getProfileByNickname(nickname: string): Promise<ResponseProfileDto> {
    const profile = await this.profileRepository.findByNickname(nickname);

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    // 다른 사용자에게 공개되는 로직이므로 userId는 null로 반환
    return profileToResponsePublicProfileDto(profile);
  }

  /**
   * Id로 프로필 조회
   * 현재 프로필을 가진 user의 id도 반환
   * userId는 외부로 노출되면 안됨
   * 서버 내부에서만 사용해야 함
   * @param id
   * @returns
   */
  async getProfileById(id: number): Promise<ResponseProfileDto> {
    const profile = await this.profileRepository.findById(id);

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return profile;
  }

  async getProfileByUserId(userId: number): Promise<ResponseProfileDto> {
    const profile = await this.profileRepository.findByUserId(userId);

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return profile;
  }

  // ===== UPDATE =====

  async updateProfile(
    userId: number,
    profileId: number,
    dto: UpdateProfileDto,
  ): Promise<Profile> {
    const profile = await this.profileRepository.findById(profileId);

    // 1. 프로필 존재 여부 및 소유자 권한 확인
    if (!profile || profile.userId !== userId) {
      throw new ForbiddenException(
        'You are not allowed to update this profile',
      );
    }

    // 2. 아바타 URL이 변경되는 경우 기존 이미지 삭제
    if (dto.avatarUrl && profile.avatarUrl !== dto.avatarUrl) {
      await this.deleteOldAvatar(profile.avatarUrl);
    }

    // 3. 낙관적 잠금 로직 실행
    return await this.profileRepository.update(profileId, dto);
  }

  async resetToDefaultAvatar(
    userId: number,
    profileId: number,
  ): Promise<Profile> {
    const profile = await this.profileRepository.findById(profileId);

    // 1. 프로필 존재 여부 및 소유자 권한 확인
    if (!profile || profile.userId !== userId) {
      throw new ForbiddenException(
        'You are not allowed to update this profile',
      );
    }

    // 2. 기존 아바타 이미지 삭제
    await this.deleteOldAvatar(profile.avatarUrl);

    // 3. 기본 아바타로 변경
    const defaultAvatarUrl = this.getDefaultAvatarUrl();
    const updateDto = {
      avatarUrl: defaultAvatarUrl,
      version: profile.version,
    };

    return await this.profileRepository.update(profileId, updateDto);
  }

  // ===== Sub Functions =====

  /**
   * 닉네임 존재 여부 확인. 있다면 true, 없다면 false
   * userId를 같이 넘긴다면
   * @param nickname 확인하고 싶은 닉네임
   * @returns boolean
   */
  async isExistingNickname(
    nickname: string,
    userId?: number,
  ): Promise<boolean> {
    const profile = await this.profileRepository.findByNickname(nickname);
    if (userId) {
      return !!profile && profile.userId !== userId;
    }
    return !!profile;
  }

  // ===== Find Functions =====

  // ===== Private Helper Methods =====

  /**
   * 기존 아바타 이미지를 Google Storage에서 삭제
   * @param avatarUrl 삭제할 아바타 URL
   */
  private async deleteOldAvatar(avatarUrl: string): Promise<void> {
    try {
      // 기본 아바타나 외부 URL은 삭제하지 않음
      if (!avatarUrl || avatarUrl.includes('default-avatar')) {
        return;
      }

      // Google Storage의 파일인 경우에만 삭제
      const filePath = this.storageService.extractFilePathFromUrl(avatarUrl);
      if (filePath) {
        await this.storageService.deleteFile(filePath);
      }
    } catch (error) {
      // 이미지 삭제 실패는 로그만 남기고 계속 진행
      console.error('Failed to delete old avatar:', error);
    }
  }

  /**
   * 기본 아바타 URL을 반환
   * @returns 기본 아바타 URL
   */
  getDefaultAvatarUrl(): string {
    return this.configService.get<string>(
      'USER_DEFAULT_AVATAR_URL',
      'https://via.placeholder.com/128/cccccc/ffffff?text=Avatar',
    );
  }

  /**
   * 사용자 아바타 저장소 URL을 반환
   * @returns 사용자 아바타 저장소 URL
   */
  getUserAvatarStorageUrl(): string {
    return this.configService.get<string>(
      'USER_AVATAR_URLS',
      'https://example.com/user-avatar/',
    );
  }
}
