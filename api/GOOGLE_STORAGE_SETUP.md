# Google Cloud Storage 설정 가이드

## 1. Google Cloud 프로젝트 설정

1. Google Cloud Console에서 새 프로젝트를 생성하거나 기존 프로젝트를 선택합니다.
2. Cloud Storage API를 활성화합니다.
3. Storage 버킷을 생성합니다.

## 2. 서비스 계정 설정

1. Google Cloud Console에서 IAM & Admin > Service Accounts로 이동합니다.
2. 새 서비스 계정을 생성합니다.
3. 서비스 계정에 다음 권한을 부여합니다:
   - Storage Object Admin
   - Storage Object Creator
   - Storage Object Viewer

4. 서비스 계정 키를 JSON 형태로 다운로드합니다.

## 3. 환경 변수 설정

`.env` 파일에 다음 설정을 추가합니다:

```env
# Google Cloud Storage Configuration
GOOGLE_STORAGE_BUCKET=your-bucket-name
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account-key.json
```

## 4. 버킷 권한 설정

생성한 버킷의 권한을 다음과 같이 설정합니다:

- 공개 읽기 권한을 부여하여 업로드된 이미지를 웹에서 접근할 수 있도록 합니다.

## 5. 사용법

### 파일 업로드

```bash
POST /api/files/upload?type=user
Content-Type: multipart/form-data

# Response
{
  "url": "https://storage.googleapis.com/your-bucket-name/user-profile/12345-67890.jpg"
}
```

### 지원되는 파일 형식

- JPG/JPEG
- PNG
- GIF
- WebP

### 파일 크기 제한

- 최대 5MB

## 6. 프로필 이미지 업데이트 흐름

1. 클라이언트에서 이미지를 `/api/files/upload?type=user`로 업로드
2. Google Storage에 파일이 저장되고 공개 URL이 반환됨
3. 반환된 URL을 사용해서 프로필 업데이트 API 호출
4. 기존 이미지가 있다면 자동으로 삭제됨

## 7. 주의사항

- 서비스 계정 키 파일은 절대로 버전 컨트롤에 포함하지 마세요.
- 프로덕션 환경에서는 환경 변수나 시크릿 매니저를 사용해서 인증 정보를 관리하세요.
- 버킷 이름은 전 세계적으로 고유해야 합니다.
