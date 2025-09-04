# 반복 일정 업데이트 로직 가이드

## 개요

TalkFlow에서 일정을 업데이트할 때 반복 일정의 특성에 따라 다양한 경우의 수가 존재합니다. 이 문서는 각 상황에서 어떻게 업데이트 옵션을 제공할지를 정의합니다.

## 업데이트 경우의 수

### Case 1: 단일 일정 → 단일 일정
- **상황**: 반복되지 않는 일정을 반복되지 않는 일정으로 수정
- **조건**: `!wasRecurring && !willBeRecurring`
- **동작**: UpdateOptionsModal을 표시하지 않고 직접 업데이트
- **이유**: 단순한 일정 수정이므로 추가 옵션이 필요 없음

```typescript
// 예시: 제목, 시간, 설명만 변경
event: { title: "회의", recurringEventId: null }
→ { title: "팀 미팅", recurringEventId: null }
```

### Case 2: 단일 일정 → 반복 일정  
- **상황**: 반복되지 않는 일정을 반복 일정으로 변경
- **조건**: `!wasRecurring && willBeRecurring`
- **동작**: UpdateOptionsModal을 표시하지 않고 직접 업데이트
- **이유**: 새로운 반복 일정을 생성하는 것이므로 추가 옵션이 필요 없음

```typescript
// 예시: 단일 일정에 반복 설정 추가
event: { title: "회의", recurringEventId: null }
→ { title: "회의", recurringEventId: "new-id", recurring: { rule: "WEEKLY" } }
```

### Case 3: 반복 일정 → 단일 일정
- **상황**: 반복 일정을 단일 일정으로 변경 (반복 해제)
- **조건**: `wasRecurring && !willBeRecurring`  
- **동작**: UpdateOptionsModal을 표시하지 않고 직접 업데이트
- **이유**: 반복 설정을 제거하는 것이므로 해당 일정만 단일화

```typescript
// 예시: 반복 일정에서 반복 설정 제거
event: { title: "회의", recurringEventId: "existing-id" }
→ { title: "회의", recurringEventId: null }
```

### Case 4: 반복 일정 → 반복 일정
- **상황**: 반복 일정을 반복 일정으로 수정
- **조건**: `wasRecurring && willBeRecurring`
- **동작**: 반복 설정 변경 여부에 따라 다른 옵션 제공

#### Case 4-1: 반복 설정 변경 없음
- **조건**: `hasRecurringChanged() === false`
- **제공 옵션**:
  - ✅ "이 일정만 수정" (showSingleOption: true)
  - ✅ "관련 일정 모두 수정" (showRecurringOption: true)  
  - ✅ "이 일정 이후 모두 수정" (showFromThisOption: true)
- **이유**: 반복 패턴은 그대로 두고 내용만 수정하므로 모든 옵션 제공 가능

```typescript
// 예시: 제목만 변경, 반복 설정은 동일
event: { title: "주간회의", recurring: { rule: "WEEKLY" } }
→ { title: "팀 주간회의", recurring: { rule: "WEEKLY" } } // 반복 설정 동일
```

#### Case 4-2: 반복 설정 변경됨
- **조건**: `hasRecurringChanged() === true`
- **제공 옵션**:
  - ❌ "이 일정만 수정" (showSingleOption: false)
  - ✅ "관련 일정 모두 수정" (showRecurringOption: true)
  - ✅ "이 일정 이후 모두 수정" (showFromThisOption: true)
- **이유**: 반복 패턴이 변경되면 해당 일정만 수정하는 것은 의미가 없음

```typescript
// 예시: 반복 주기 변경
event: { title: "회의", recurring: { rule: "WEEKLY" } }
→ { title: "회의", recurring: { rule: "DAILY" } } // 반복 설정 변경
```

## 업데이트 옵션별 동작

### 1. "이 일정만 수정" (handleUpdateSingle)
- **대상**: 선택된 일정 인스턴스만
- **동작**: 해당 일정을 반복 그룹에서 분리하여 개별 일정으로 수정
- **사용 조건**: 반복 설정이 변경되지 않은 경우에만 제공

### 2. "관련 일정 모두 수정" (handleUpdateRecurring)  
- **대상**: 동일한 recurringEventId를 가진 모든 일정
- **동작**: 전체 반복 그룹의 모든 일정을 일괄 수정
- **사용 조건**: 반복 일정 → 반복 일정인 경우 항상 제공

### 3. "이 일정 이후 모두 수정" (handleUpdateFromThis)
- **대상**: 선택된 일정부터 미래의 모든 반복 일정
- **동작**: 과거 일정은 유지하고 현재 일정부터 새로운 반복 그룹 생성
- **사용 조건**: 반복 일정 → 반복 일정인 경우 항상 제공

## 구현 세부사항

### hasRecurringChanged() 함수
반복 설정의 변경 여부를 확인하는 함수로, 다음 항목들을 비교:
- 반복 규칙 (rule)
- 시작 날짜 (startDate)  
- 종료 날짜 (endDate)

### getUpdateOptions() 함수
현재 일정 상태와 수정된 내용을 분석하여 적절한 업데이트 옵션을 결정:

```typescript
const getUpdateOptions = () => {
    const wasRecurring = !!event?.recurringEventId;
    const willBeRecurring = !!recurring && !!recurring.rule && !!recurring.startDate;
    
    // 4가지 경우의 수에 따른 옵션 결정
    // ...
}
```

## 주의사항

1. **데이터 일관성**: 반복 일정 수정 시 연관된 모든 일정의 데이터 일관성 유지 필요
2. **사용자 경험**: 불필요한 옵션 모달 표시 최소화로 사용자 편의성 향상  
3. **오류 처리**: 반복 일정 수정 실패 시 롤백 및 사용자 알림 필요
4. **성능**: 대량의 반복 일정 수정 시 배치 처리 고려

## 추가 고려사항

### 미래 확장 가능성
- 특정 기간만 수정하는 옵션
- 반복 일정의 예외 처리 (특정 날짜 제외)
- 반복 일정의 임시 변경 (일회성 수정)

### API 설계 고려사항
- 업데이트 타입별 별도 엔드포인트 vs 통합 엔드포인트
- 트랜잭션 처리 및 원자성 보장
- 대용량 반복 일정 처리를 위한 비동기 처리