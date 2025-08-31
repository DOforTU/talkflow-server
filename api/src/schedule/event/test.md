```json
// 1. 매주 화요일 스탠드업 미팅
  {
    "title": "스탠드업 미팅",
    "description": "매주 화요일 오전 스탠드업",
    "startTime": "2024-01-09T09:30:00Z",
    "endTime": "2024-01-09T10:00:00Z",
    "colorCode": "#007BFF",
    "isAllDay": false,
    "recurring": {
      "rule": "FREQ=WEEKLY;BYDAY=TU",
      "startDate": "2024-01-09",
      "endDate": "2024-12-31"
    }
  }

  // 2. 매일 점심시간 (종료일 없음)
  {
    "title": "점심시간",
    "description": "매일 점심 휴식",
    "startTime": "2024-01-01T12:00:00Z",
    "endTime": "2024-01-01T13:00:00Z",
    "colorCode": "#28A745",
    "isAllDay": false,
    "recurring": {
      "rule": "FREQ=DAILY",
      "startDate": "2024-01-01"
    }
  }

  // 3. 격주 월요일 1on1 미팅
  {
    "title": "1on1 미팅",
    "description": "격주 월요일 매니저와 1on1",
    "startTime": "2024-01-08T14:00:00Z",
    "endTime": "2024-01-08T15:00:00Z",
    "colorCode": "#6F42C1",
    "isAllDay": false,
    "recurring": {
      "rule": "FREQ=WEEKLY;INTERVAL=2;BYDAY=MO",
      "startDate": "2024-01-08"
    },
    "location": {
      "nameKo": "회의실 A",
      "address": "서울시 강남구 테헤란로 123",
      "latitude": 37.5665,
      "longitude": 126.9780
    }
  }

  // 4. 매월 마지막 금요일 해피아워
  {
    "title": "해피아워",
    "description": "매월 마지막 금요일 회식",
    "startTime": "2024-01-26T18:00:00Z",
    "endTime": "2024-01-26T21:00:00Z",
    "colorCode": "#DC3545",
    "isAllDay": false,
    "recurring": {
      "rule": "FREQ=MONTHLY;BYDAY=-1FR",
      "startDate": "2024-01-26"
    }
  }

  // 5. 단일 이벤트 (recurring 없음)
  {
    "title": "프로젝트 킥오프",
    "description": "Q1 프로젝트 킥오프 미팅",
    "startTime": "2024-01-15T10:00:00Z",
    "endTime": "2024-01-15T12:00:00Z",
    "colorCode": "#FFC107",
    "isAllDay": false
  }

  // 6. 하루 종일 이벤트
  {
    "title": "연차",
    "description": "개인 휴가",
    "startTime": "2024-02-14T00:00:00Z",
    "endTime": "2024-02-14T23:59:59Z",
    "colorCode": "#17A2B8",
    "isAllDay": true
  }
```

```json
// 1. 매주 수요일 팀 미팅 (회의실 포함)
  {
    "title": "팀 미팅",
    "description": "매주 수요일 정기 팀 미팅",
    "startTime": "2024-01-10T14:00:00Z",
    "endTime": "2024-01-10T15:30:00Z",
    "colorCode": "#007BFF",
    "isAllDay": false,
    "recurring": {
      "rule": "FREQ=WEEKLY;BYDAY=WE",
      "startDate": "2024-01-10",
      "endDate": "2024-06-30"
    },
    "location": {
      "nameKo": "대회의실",
      "nameEn": "Main Conference Room",
      "address": "서울시 강남구 테헤란로 152, 13층",
      "latitude": 37.5048,
      "longitude": 127.0280
    }
  }

  // 2. 매월 첫째주 목요일 전체 회의 (장소만 한국어)
  {
    "title": "전체 회의",
    "description": "매월 첫째주 목요일 전체 직원 회의",
    "startTime": "2024-01-04T16:00:00Z",
    "endTime": "2024-01-04T17:00:00Z",
    "colorCode": "#28A745",
    "isAllDay": false,
    "recurring": {
      "rule": "FREQ=MONTHLY;BYDAY=1TH",
      "startDate": "2024-01-04"
    },
    "location": {
      "nameKo": "오디토리움",
      "address": "서울시 서초구 강남대로 465, B1층",
      "latitude": 37.4979,
      "longitude": 127.0276
    }
  }

  // 3. 격주 금요일 클라이언트 미팅 (영어명만)
  {
    "title": "Client Meeting",
    "description": "Bi-weekly client status meeting",
    "startTime": "2024-01-12T10:00:00Z",
    "endTime": "2024-01-12T11:00:00Z",
    "colorCode": "#FFC107",
    "isAllDay": false,
    "recurring": {
      "rule": "FREQ=WEEKLY;INTERVAL=2;BYDAY=FR",
      "startDate": "2024-01-12",
      "endDate": "2024-12-31"
    },
    "location": {
      "nameEn": "Client Meeting Room",
      "address": "Seoul, Gangnam-gu, Teheran-ro 123, 15F",
      "latitude": 37.5665,
      "longitude": 126.9780
    }
  }

  // 4. 단일 이벤트 with location
  {
    "title": "워크샵",
    "description": "Q1 전략 수립 워크샵",
    "startTime": "2024-02-20T09:00:00Z",
    "endTime": "2024-02-20T18:00:00Z",
    "colorCode": "#6F42C1",
    "isAllDay": false,
    "location": {
      "nameKo": "코엑스 컨벤션센터",
      "nameEn": "COEX Convention Center",
      "address": "서울시 강남구 영동대로 513",
      "latitude": 37.5115,
      "longitude": 127.0595
    }
  }

  // 5. 매일 점심시간 (카페테리아 위치 포함)
  {
    "title": "점심시간",
    "description": "매일 점심 휴식 시간",
    "startTime": "2024-01-01T12:00:00Z",
    "endTime": "2024-01-01T13:00:00Z",
    "colorCode": "#17A2B8",
    "isAllDay": false,
    "recurring": {
      "rule": "FREQ=DAILY",
      "startDate": "2024-01-01"
    },
    "location": {
      "nameKo": "사내 카페테리아",
      "address": "서울시 강남구 테헤란로 152, 12층",
      "latitude": 37.5048,
      "longitude": 127.0280
    }
  }
```
