# 반복 일정 테스트 데이터

## 2025년 8월-9월 매일 운동 (하루종일)

POST `/api/events`

```json
{
  "title": "운동",
  "description": "일일 운동",
  "startTime": "2025-08-01 00:00",
  "endTime": "2025-08-01 23:59",
  "isAllDay": true,
  "colorCode": "#FF6B6B",
  "recurring": {
    "rule": "FREQ=DAILY;INTERVAL=1",
    "startDate": "2025-08-01",
    "endDate": "2025-09-30"
  }
}

{
    "title": "점심시간",
    "description": "매일 점심 휴식",
    "startTime": "2025-09-01 12:00",
    "endTime": "2025-09-01 13:00",
    "colorCode": "#28A745",
    "isAllDay": false,
    "recurring": {
      "rule": "FREQ=DAILY",
      "startDate": "2025-09-01"
    }
  }

  {
    "title": "Client Meeting",
    "description": "Bi-weekly client status meeting",
    "startTime": "2025-09-01 10:00",
    "endTime": "2025-12-31 11:00",
    "colorCode": "#FFC107",
    "isAllDay": false,
    "recurring": {
      "rule": "FREQ=WEEKLY;INTERVAL=2;BYDAY=FR",
      "startDate": "2025-09-01",
      "endDate": "2025-12-31"
    },
    "location": {
      "nameEn": "Client Meeting Room",
      "address": "Seoul, Gangnam-gu, Teheran-ro 123, 15F",
      "latitude": 37.5665,
      "longitude": 126.9780
    }
  }

   {
    "title": "본가로 이동",
    "description": "금토 본가에서 생활",
    "startTime": "2025-09-01 18:00",
    "endTime": "2025-12-31 20:00",
    "colorCode": "#FF6B6B",
    "isAllDay": false,
    "recurring": {
      "rule": "FREQ=WEEKLY;INTERVAL=2;BYDAY=FR",
      "startDate": "2025-09-01",
      "endDate": "2025-12-31"
    },
    "location": {
      "nameEn": "본가",
      "address": "서울 금천구 벚꽃로 40",
      "latitude": 37.449108,
      "longitude": 126.904197
    }
  }
```

## RRULE 설명

- `FREQ=DAILY`: 매일 반복
- `INTERVAL=1`: 1일 간격
- `startDate`: 반복 시작일 (2025-08-01)
- `endDate`: 반복 종료일 (2025-09-30)

---
