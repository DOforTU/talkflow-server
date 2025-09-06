# Notice (알림) 기능 문서

## 📋 개요

사용자에게 중요한 활동(팔로우, 좋아요, 시스템 공지)에 대한 알림을 제공하는 기능입니다.

## 🗂️ 데이터베이스 스키마

### Notice 엔터티

```prisma
model Notice {
  id          Int                 @id @default(autoincrement())
  type        notice_type_enum    // 알림 타입
  title       String              // 알림 제목
  content     String              // 알림 내용
  isRead      Boolean             @default(false)  // 읽음 여부

  // 관계 필드
  profileId   Int                 // 알림 받는 사용자
  profile     Profile             @relation("ProfileNotices", fields: [profileId], references: [id])

  // 선택적 관계 (알림 타입에 따라)
  relatedFollowId     Int?        // 팔로우 관련 알림
  relatedFollow       Follow?     @relation(fields: [relatedFollowId], references: [id])

  relatedLikeId       Int?        // 좋아요 관련 알림
  relatedLike         SilhouetteLike? @relation(fields: [relatedLikeId], references: [id])

  relatedSilhouetteId Int?        // 실루엣 관련 알림
  relatedSilhouette   Silhouette? @relation(fields: [relatedSilhouetteId], references: [id])

  // 타임스탬프
  createdAt   DateTime            @default(now())
  updatedAt   DateTime            @updatedAt
  deletedAt   DateTime?
}

enum notice_type_enum {
  FOLLOW    // 팔로우 알림
  LIKE      // 좋아요 알림
  SYSTEM    // 시스템 공지
}
```

## 🎯 주요 기능

### 1. 알림 타입별 기능

#### 📌 FOLLOW 알림

-   **발생 조건**: 다른 사용자가 나를 팔로우할 때
-   **알림 대상**: 팔로우 당한 사용자
-   **내용 예시**: "홍길동님이 회원님을 팔로우했습니다."

#### 💝 LIKE 알림

-   **발생 조건**: 내 게시물이 좋아요 10개 단위로 달성할 때 (본인이 본인 게시글에 좋아요한거는 제외)
-   **알림 대상**: 게시물 작성자
-   **내용 예시**: "여러명이 회원님의 게시물에 좋아요를 눌렀습니다."
-   **특이사항**: 10개, 20개, 30개... 배수일 때만 발송

#### 📢 SYSTEM 알림

-   **발생 조건**: 관리자가 직접 생성
-   **알림 대상**: 특정 사용자 또는 전체 사용자
-   **내용 예시**: "서비스 점검 안내", "새 기능 출시" 등

### 2. 트랜잭션 기반 알림 생성

#### 팔로우 + 알림 동시 생성

```typescript
async createFollowNotice(
  tx: TransactionClient,
  targetId: number,      // 알림을 받는 사람 (팔로우 당한 사람)
  entityId: number,      // 알림을 발생시킨 사람 (팔로우한 사람)
  entityName: string     // 팔로우한 사람의 닉네임
) {
  // Notice만 생성 (Follow는 별도 Repository에서 처리)
  const dto: CreateNoticeDto = {
    type: notice_type_enum.follow,
    title: '새로운 팔로워',
    content: `${entityName}님이 당신을 팔로우했습니다.`,
    profileId: targetId,
    relatedEntityId: entityId,
    relatedEntityName: entityName,
  };

  return await this.noticeRepository.create(tx, dto);
}
```

**실제 사용 방식:**

```typescript
// Follow Service에서 팔로우 생성 후 알림 서비스 호출
async followUser(followerId: number, followingId: number, followerNickname: string) {
  return await this.prisma.$transaction(async (tx) => {
    // 1. 팔로우 생성 (Follow Repository에서)
    const follow = await tx.follow.create({
      data: { followerId, followingId }
    });

    // 2. 알림 생성 (Notice Service 호출)
    await this.noticeService.createFollowNotice(
      tx,
      followingId,        // 팔로우 당한 사람 (알림 받을 사람)
      followerId,         // 팔로우한 사람
      followerNickname    // 팔로우한 사람의 닉네임
    );

    return follow;
  });
}
```

#### 좋아요 + 알림 조건부 생성

```typescript
async createLikeWithNotice(
  tx: TransactionClient,
  silhouetteId: number,
  profileId: number,
  silhouetteOwnerId: number
) {
  // 자신의 게시물이 아닐 때만 실행
  if (profileId !== silhouetteOwnerId) {
    // 다른 사람의 좋아요 개수 확인
    const likeCount = await tx.silhouetteLike.count({
      where: {
        silhouetteId,
        deletedAt: null,
        profileId: { not: silhouetteOwnerId }
      }
    });

    // 10개 단위일 때만 알림 생성
    if (likeCount >= 10 && likeCount % 10 === 0) {
      return await tx.notice.create({...});
    }
  }
}
```

## 🛠️ API 엔드포인트

### 알림 조회

```typescript
// 내 알림 목록 조회
GET /notices
Query Parameters:
- isRead?: boolean     // 읽음 여부 필터
- type?: notice_type_enum  // 알림 타입 필터
- limit?: number       // 페이지 크기 (기본: 20)
- offset?: number      // 페이지 오프셋 (기본: 0)

// 응답 예시
{
  "notices": [
    {
      "id": 1,
      "type": "FOLLOW",
      "title": "팔로우",
      "content": "홍길동님이 회원님을 팔로우했습니다.",
      "isRead": false,
      "createdAt": "2025-09-05T10:00:00Z",
      "relatedFollow": {
        "follower": {
          "nickname": "홍길동",
          "avatarUrl": "..."
        }
      }
    }
  ],
  "totalCount": 25,
  "unreadCount": 5
}
```

### 알림 읽음 처리

```typescript
// 특정 알림 읽음 처리
PATCH /notices/:id/read

// 전체 알림 읽음 처리
PATCH /notices/read-all
```

### 알림 삭제

```typescript
// 특정 알림 삭제
DELETE /notices/:id

// 읽은 알림 일괄 삭제
DELETE /notices/read
```

## 🔄 비즈니스 로직

### 1. 알림 생성 조건

#### 팔로우 알림

-   ✅ 다른 사용자가 나를 팔로우할 때
-   ❌ 내가 다른 사용자를 팔로우할 때는 알림 없음

#### 좋아요 알림

-   ✅ 다른 사람들의 좋아요가 10개 단위 달성 시
-   ❌ 자신의 좋아요는 카운트에서 제외
-   ❌ 자신의 게시물에 자신이 좋아요해도 알림 없음

#### 시스템 알림

-   ✅ 관리자가 직접 생성
-   ✅ 중요 공지, 업데이트, 이벤트 등

### 2. 알림 우선순위

1. **SYSTEM** (시스템 공지) - 최우선
2. **FOLLOW** (팔로우) - 실시간
3. **LIKE** (좋아요) - 배치성

### 3. 알림 정리 정책 (향후 구현 예정)

-   **자동 삭제**: 60일 경과된 읽은 알림 (미구현)
-   **최대 보관**: 사용자당 1000개 (미구현)
-   **실시간 알림**: WebSocket 또는 Push 알림 연동 가능 (미구현)

## 📊 성능 고려사항

### 1. 인덱스 최적화

```sql
-- 자주 사용되는 쿼리 최적화
CREATE INDEX idx_notice_profile_read ON notice(profile_id, is_read);
CREATE INDEX idx_notice_created_at ON notice(created_at DESC);
CREATE INDEX idx_notice_type_profile ON notice(type, profile_id);
```

### 2. 배치 처리

-   좋아요 알림은 실시간이 아닌 배치로 처리 가능
-   대량 알림 발송 시 큐 시스템 활용

### 3. 캐싱 전략

-   읽지 않은 알림 개수 캐싱
-   최근 알림 목록 캐싱

## 🚀 향후 확장 계획

### 1. 추가 알림 타입

-   **COMMENT**: 댓글 알림
-   **MENTION**: 멘션 알림
-   **EVENT**: 이벤트 알림

### 2. 개인화 설정

-   알림 타입별 on/off 설정
-   알림 수신 시간대 설정
-   Push 알림 선택적 수신

### 3. 실시간 알림

-   WebSocket 연동
-   FCM Push 알림
-   이메일 알림 (중요 공지)

## 🔧 사용 예시

### Service에서 알림 생성

```typescript
// Follow Service에서
async followUser(followerId: number, followingId: number, nickname: string) {
  return await this.prisma.$transaction(async (tx) => {
    const result = await this.noticeService.createFollowWithNotice(
      tx, followingId, followerId, nickname
    );
    return result.follow;
  });
}

// Like Service에서
async likePost(silhouetteId: number, profileId: number, ownerId: number) {
  return await this.prisma.$transaction(async (tx) => {
    const like = await tx.silhouetteLike.create({...});
    await this.noticeService.createLikeWithNotice(
      tx, silhouetteId, profileId, ownerId
    );
    return like;
  });
}
```

### Controller에서 알림 조회

```typescript
@Get()
async getNotices(
  @Request() req: { user: User },
  @Query() query: NoticeQueryDto
): Promise<NoticeResponseDto> {
  return await
```
