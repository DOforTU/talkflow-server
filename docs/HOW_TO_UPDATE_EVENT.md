# 일정 수정 처리 과정 가이드

## 개요

Silhouette의 일정 시스템은 단일 일정과 반복 일정을 지원하며, 각 상황에 따라 다른 업데이트 로직을 적용합니다.

## 일정 유형 분류

### 1. 단일 일정

-   `recurringEventId`가 없는 일정
-   독립적으로 존재하는 일회성 일정

### 2. 반복 일정

-   `recurringEventId`가 있는 일정
-   공통된 `recurringEventId`를 가진 일정들의 집합
-   반복 규칙(RRULE)에 따라 생성된 일정들

## 업데이트 케이스 분류

### Case 1: 단일 → 단일

**상황**: 기존 단일 일정의 내용만 수정 (반복 설정 없음)

**프론트엔드 처리**:

```javascript
// useEventUpdateLogic.ts - updateSingleEventDirectly()
const updateEventDto = buildUpdateEventDto(); // recurring 필드 없음
await eventApi.updateSingleEvent(event.id, updateEventDto);
```

**백엔드 처리**:

-   `PATCH /events/{id}/single` 엔드포인트 사용
-   해당 일정의 필드만 업데이트
-   `recurringEventId` 변경 없음

### Case 2: 단일 → 반복

**상황**: 단일 일정을 반복 일정으로 변환

**프론트엔드 처리**:

```javascript
// useEventUpdateLogic.ts - deleteAndCreateRecurringEvent()
await eventApi.deleteSingleEvent(event.id); // 기존 단일 일정 삭제
const createEventDto = buildCreateEventDto(); // recurring 필드 포함
await eventApi.createEvent(createEventDto);
```

**백엔드 처리**:

1. `DELETE /events/{id}/single` - 기존 단일 일정 삭제
2. `POST /events` - 새로운 반복 일정 생성
    - 반복 규칙에 따라 여러 일정 생성
    - 모든 생성된 일정에 동일한 `recurringEventId` 할당

**StartDate 처리 로직**:

```javascript
// buildCreateEventDto()에서 startDate 결정
if (forceRecurringStartDate) {
    startDate = forceRecurringStartDate; // 강제 지정된 날짜
} else if (new Date(formData.startDate) < new Date(recurring.startDate)) {
    startDate = formData.startDate; // 폼에서 입력된 날짜가 더 이른 경우
} else {
    startDate = recurring.startDate; // 기본값
}
```

"단일 → 반복"의 경우 반복 시작을 기존 단일 시작보다 이전으로 설정하는 경우가 있습니다. 따라서 폼에서 입력된 날짜가 더 이전인 경우 입력된 날짜(formData.startDate)를 사용합니다.

> 참고: recurring.startDate는 기존 단일 일정의 시작 날짜

### Case 3: 반복 → 단일

**상황**: 반복 일정을 단일 일정으로 변환

**프론트엔드 처리**:

```javascript
// useEventUpdateLogic.ts - deleteRecurringAndCreateSingleEvent()
await eventApi.deleteRecurringEvents(event.id);
const createEventDto = buildCreateEventDto(); // recurring 필드 없음
await eventApi.createEvent(createEventDto);
```

**백엔드 처리**:

1. `DELETE /events/{id}/recurring` - 동일한 `recurringEventId`를 가진 모든 일정 삭제
2. `POST /events` - 새로운 단일 일정 생성 (`recurringEventId` 없음)

### Case 4: 반복 → 반복

**상황**: 반복 일정의 설정을 변경

반복 → 반복은 3가지 세부 옵션으로 나뉩니다:

#### 4-1: "이 일정만 수정"

**상황**: 선택된 일정 하나만 반복에서 제외하여 단일 일정으로 변경

**프론트엔드 처리**:

```javascript
// useEventUpdateLogic.ts - handleUpdateSingle()
const updateEventDto = buildUpdateEventDto();
await eventApi.updateSingleEvent(event.id, updateEventDto);
```

**백엔드 처리**:

-   `PUT /events/{id}/single` 엔드포인트 사용
-   해당 일정의 `recurringEventId`를 null로 설정
-   다른 반복 일정들은 그대로 유지

#### 4-2: "관련 일정 모두 수정"

**상황**: 모든 반복 일정을 삭제하고 새로운 설정으로 재생성

전부 수정을 하지 않는 이유: 시작 날짜, 종료 날짜가 변경된다면, 어차피 rule에 맞게 새로 생성할 요소는 생성하고, 삭제할 요소는 삭제한 후 부분적으로 업데이트를 해야합니다. 이런 경우 3개의 로직을 수행하는 것보다 DELETE + POST 요청 두개로 처리하는 것이 더 간편하기에 새로 생성하는 방안을 채택하였습니다.

**프론트엔드 처리**:

```javascript
// useEventUpdateLogic.ts - handleUpdateRecurring()
await eventApi.deleteRecurringEvents(event.id);
const createEventDto = buildCreateEventDto(); // 기존 로직 사용
await eventApi.createEvent(createEventDto);
```

**백엔드 처리**:

1. `DELETE /events/{id}/recurring` - 모든 관련 반복 일정 삭제
2. `POST /events` - 새로운 반복 일정 생성

**StartDate 처리**:

-   `handleRecurringApply`에서 기존 `recurring.startDate`와 새로운 `recurringData.startDate` 비교
-   기존이 더 이른 경우 기존값 유지 (전체 반복 범위 보존)

#### 4-3: "이 일정 이후 수정"

**상황**: 선택된 일정 이후의 모든 반복 일정을 삭제하고 새로운 설정으로 재생성

**프론트엔드 처리**:

```javascript
// useEventUpdateLogic.ts - handleUpdateFromThis()
await eventApi.deleteEventsFromThis(event.id);
const [startDateStr] = event.startTime.split(" ");
const createEventDto = buildCreateEventDto(startDateStr); // 현재 일정 날짜 강제 적용
await eventApi.createEvent(createEventDto);
```

**백엔드 처리**:

1. `DELETE /events/{id}/from-this` - 선택된 일정 이후의 반복 일정만 삭제

-   해당 API 요청을 하게 되면 기존 반복일정의 마지막 날은 선택된 일정 날짜의 이전날로 쪼개짐.

2. `POST /events` - 현재 일정 날짜부터 시작하는 새로운 반복 일정 생성

**StartDate 처리**:

-   `forceRecurringStartDate`를 현재 이벤트의 날짜로 설정
-   이전 일정들은 유지, 현재 일정부터 새로운 반복 시작

## 반복 일정 StartDate 결정 로직

### 프론트엔드 - buildCreateEventDto()

```javascript
if (recurring && recurring.rule && recurring.startDate) {
    let startDate = recurring.startDate;

    if (forceRecurringStartDate) {
        // "이 일정 이후 수정"에서 사용: 무조건 지정된 날짜
        startDate = forceRecurringStartDate;
    } else if (new Date(formData.startDate) < new Date(recurring.startDate)) {
        // 폼 날짜가 더 이른 경우: 단일→반복, 반복 시작일을 앞당기는 경우
        startDate = formData.startDate;
    }
    // 그 외: recurring.startDate 유지
}
```

### 프론트엔드 - handleRecurringApply()

```javascript
// "관련 일정 모두 수정"용: 기존 startDate 보존 로직
let startDate = recurringData.startDate;
if (recurring && recurring.startDate && new Date(recurring.startDate) < new Date(recurringData.startDate)) {
    startDate = recurring.startDate; // 기존이 더 이른 경우 유지
}
```

## API 엔드포인트

### 생성

-   `POST /events` - 새로운 일정 생성 (단일/반복)

### 수정

-   `PATCH /events/{id}/single` - 단일 일정 수정
-   `PATCH /events/{id}/recurring` - 반복 일정 모두 수정 (미사용->삭제예정)

### 삭제

-   `DELETE /events/{id}/single` - 단일 일정 삭제
-   `DELETE /events/{id}/recurring` - 관련 반복 일정 모두 삭제
-   `DELETE /events/{id}/from-this` - 이 일정 이후 반복 일정 삭제

## 주의사항

1. **React 상태 업데이트 비동기성**

    - `handleRecurringFromThisApply`로 상태 변경 후 즉시 `buildCreateEventDto` 호출 시
    - 아직 업데이트되지 않은 이전 상태 사용 가능
    - 해결: 직접 파라미터로 날짜 전달

2. **날짜 비교 정확성**

    - `new Date()` 생성자 사용 시 시간대 주의
    - 문자열 형태로 비교할 경우 형식 일관성 유지

3. **반복 일정 범위 보존**
    - "관련 일정 모두 수정" 시 기존 시작 날짜보다 이른 날짜는 보존
    - "이 일정 이후 수정" 시에만 현재 일정 날짜부터 시작

## 테스트 시나리오

1. **단일 → 반복**: 9월 27일 단일 일정을 9월 6일부터 시작하는 반복 일정으로 변경
2. **반복 → 단일**: 반복 일정 중 하나를 선택하여 독립적인 단일 일정으로 변경
3. **반복 → 반복 (모두)**: 9월 6일~10월 6일 반복에서 RULE만 변경 (시작일 유지)
4. **반복 → 반복 (이후)**: 9월 6일~10월 6일 반복에서 9월 28일부터 새로운 설정 적용

## 업데이트 옵션 결정 로직

### getUpdateOptions() 함수

현재 일정 상태와 수정된 내용을 분석하여 적절한 업데이트 옵션을 결정:

```javascript
const getUpdateOptions = () => {
    const wasRecurring = !!event?.recurringEventId;
    const willBeRecurring = !!recurring && !!recurring.rule && !!recurring.startDate;

    // Case 1: 단일 → 단일 (모달 안 보여줌)
    if (!wasRecurring && !willBeRecurring) {
        return { shouldShowModal: false };
    }

    // Case 2: 단일 → 반복 (모달 안 보여줌)
    if (!wasRecurring && willBeRecurring) {
        return { shouldShowModal: false };
    }

    // Case 3: 반복 → 단일 (모달 안 보여줌)
    if (wasRecurring && !willBeRecurring) {
        return { shouldShowModal: false };
    }

    // Case 4: 반복 → 반복
    if (wasRecurring && willBeRecurring) {
        const recurringChanged = hasRecurringChanged();

        if (!recurringChanged) {
            // 반복 설정 변경 안함: 모든 옵션 표시
            return {
                shouldShowModal: true,
                showSingleOption: true,
                showRecurringOption: true,
                showFromThisOption: true,
            };
        } else {
            // 반복 설정 변경됨: "관련 일정 모두", "이 일정 이후"만 표시
            return {
                shouldShowModal: true,
                showSingleOption: false,
                showRecurringOption: true,
                showFromThisOption: true,
            };
        }
    }
};
```

### hasRecurringChanged() 함수

반복 설정의 변경 여부를 확인:

```javascript
const hasRecurringChanged = () => {
    if (!recurring && !recurringEventData) return false;
    if (!recurring || !recurringEventData) return true;

    return (
        recurring.rule !== recurringEventData.rule ||
        recurring.startDate !== recurringEventData.startDate ||
        recurring.endDate !== (recurringEventData.endDate || undefined)
    );
};
```

## 구현 세부사항

### UpdateEventModal 컴포넌트

```javascript
const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const options = getUpdateOptions();

    if (!options.shouldShowModal) {
        // 모달 없이 직접 처리
        await handleSubmitLogic(e);
    } else {
        // 옵션 모달 표시
        setShowUpdateOptionsModal(true);
    }
};
```

### 각 업데이트 옵션별 핸들러

-   `handleUpdateSingle()`: "이 일정만 수정"
-   `handleUpdateRecurring()`: "관련 일정 모두 수정"
-   `handleUpdateFromThis()`: "이 일정 이후 수정"
