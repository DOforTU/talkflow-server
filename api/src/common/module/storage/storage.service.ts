import { Injectable } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StorageService {
  private storage: Storage;
  private bucketName: string;

  constructor(private readonly configService: ConfigService) {
    // Google Cloud Storage 초기화
    const keyFilename = this.configService.get<string>(
      'GOOGLE_APPLICATION_CREDENTIALS',
    );
    const serviceAccountKey = this.configService.get<string>(
      'GOOGLE_SERVICE_ACCOUNT_KEY',
    );

    const storageOptions: { [key: string]: unknown } = {};

    if (serviceAccountKey) {
      // JSON 키 내용이 환경 변수에 있는 경우
      try {
        storageOptions.credentials = JSON.parse(serviceAccountKey);
      } catch (error) {
        console.error('Invalid GOOGLE_SERVICE_ACCOUNT_KEY JSON:', error);
      }
    } else if (keyFilename) {
      // 키 파일 경로가 있는 경우
      storageOptions.keyFilename = keyFilename;
    }

    this.storage = new Storage(storageOptions);

    // 버킷 이름은 환경 변수에서 가져오거나 기본값 사용
    this.bucketName = this.configService.get<string>(
      'GOOGLE_STORAGE_BUCKET',
      'your-bucket-name',
    );
  }

  /**
   * 파일을 Google Cloud Storage에 업로드
   * @param file 업로드할 파일
   * @param folder 저장할 폴더 (user-profile, silhouette 등)
   * @returns 업로드된 파일의 공개 URL
   */
  async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
    const fileName = this.generateFileName(file.originalname);
    const filePath = `${folder}/${fileName}`;

    const bucket = this.storage.bucket(this.bucketName);
    const fileUpload = bucket.file(filePath);

    const blobStream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype,
      },
    });

    return new Promise((resolve, reject) => {
      blobStream.on('error', (error) => {
        reject(error);
      });

      blobStream.on('finish', () => {
        // 공개 URL 생성 (버킷이 공개라고 가정)
        const publicUrl = this.getPublicUrl(filePath);
        resolve(publicUrl);
      });

      blobStream.end(file.buffer);
    });
  }

  /**
   * 기존 파일을 삭제
   * @param filePath 삭제할 파일의 경로
   */
  async deleteFile(filePath: string): Promise<void> {
    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(filePath);

    await file.delete();
  }

  /**
   * 고유한 파일명 생성
   * @param originalName 원본 파일명
   * @returns 고유한 파일명
   */
  private generateFileName(originalName: string): string {
    const timestamp = Date.now();
    const randomSuffix = Math.round(Math.random() * 1e9);
    const extension = originalName.split('.').pop();
    return `${timestamp}-${randomSuffix}.${extension}`;
  }

  /**
   * 공개 URL 생성
   * @param filePath 파일 경로
   * @returns 공개 URL
   */
  private getPublicUrl(filePath: string): string {
    return `https://storage.googleapis.com/${this.bucketName}/${filePath}`;
  }

  /**
   * URL에서 파일 경로 추출
   * @param url 파일 URL
   * @returns 파일 경로
   */
  extractFilePathFromUrl(url: string): string | null {
    const baseUrl = `https://storage.googleapis.com/${this.bucketName}/`;
    if (url.startsWith(baseUrl)) {
      return url.replace(baseUrl, '');
    }
    return null;
  }
}
