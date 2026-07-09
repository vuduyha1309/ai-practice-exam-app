# Analytics API - Testing Guide

## Base URL
```
http://localhost:3000/api/v1
```

## Authentication
All analytics endpoints require JWT token in Authorization header:
```
Authorization: Bearer {token}
```

---

## 1. Get All Statistics (Comprehensive)

### Request
```bash
curl -X GET http://localhost:3000/api/v1/analytics/stats \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json"
```

### Response
```json
{
  "overall": {
    "totalSessions": 15,
    "totalQuestionsAnswered": 250,
    "totalCorrect": 210,
    "overallAccuracy": 84.0,
    "totalTimeHours": 5.5
  },
  "topics": [
    {
      "topicId": "uuid",
      "topicName": "Cryptography",
      "questionSetId": "uuid",
      "totalAttempted": 50,
      "totalCorrect": 45,
      "accuracy": 90.0,
      "lastPracticedAt": "2026-07-09T10:30:00Z"
    }
  ],
  "weakAreas": [
    {
      "topicId": "uuid",
      "topicName": "Network Security",
      "questionSetId": "uuid",
      "totalAttempted": 30,
      "totalCorrect": 20,
      "accuracy": 66.67,
      "lastPracticedAt": "2026-07-08T15:00:00Z"
    }
  ],
  "strengthAreas": [
    {
      "topicId": "uuid",
      "topicName": "Cryptography",
      "questionSetId": "uuid",
      "totalAttempted": 50,
      "totalCorrect": 45,
      "accuracy": 90.0,
      "lastPracticedAt": "2026-07-09T10:30:00Z"
    }
  ],
  "streak": {
    "currentStreak": 5,
    "longestStreak": 12,
    "questionsLast7Days": 95,
    "streakHistory": [
      {
        "date": "2026-07-09",
        "questionsDone": 20,
        "isStreakDay": true
      }
    ]
  },
  "recentSessions": [
    {
      "sessionId": "uuid",
      "mode": "quick",
      "questionSetTitle": "CompTIA Security+",
      "totalQuestions": 50,
      "answered": 45,
      "correct": 40,
      "accuracy": 88.89,
      "durationMinutes": 30,
      "startedAt": "2026-07-09T10:00:00Z",
      "endedAt": "2026-07-09T10:30:00Z"
    }
  ],
  "difficulty": {
    "distribution": {
      "easy": 30,
      "medium": 50,
      "hard": 25
    },
    "accuracyByDifficulty": {
      "easy": { "total": 30, "correct": 28, "accuracy": 93.33 },
      "medium": { "total": 50, "correct": 42, "accuracy": 84.0 },
      "hard": { "total": 25, "correct": 18, "accuracy": 72.0 }
    }
  },
  "sessionModes": {
    "quick": {
      "sessions": 10,
      "totalQuestions": 150,
      "totalCorrect": 130,
      "accuracy": 86.67,
      "avgTimeSeconds": 540
    }
  }
}
```

---

## 2. Get Overall Statistics

### Request
```bash
curl -X GET http://localhost:3000/api/v1/analytics/overall \
  -H "Authorization: Bearer {token}"
```

### Response
```json
{
  "totalSessions": 15,
  "totalQuestionsAnswered": 250,
  "totalCorrect": 210,
  "overallAccuracy": 84.0,
  "totalTimeHours": 5.5
}
```

---

## 3. Get Topic Statistics

### Request
```bash
curl -X GET http://localhost:3000/api/v1/analytics/topics \
  -H "Authorization: Bearer {token}"
```

### Response
```json
[
  {
    "topicId": "uuid",
    "topicName": "Cryptography",
    "questionSetId": "uuid",
    "totalAttempted": 50,
    "totalCorrect": 45,
    "accuracy": 90.0,
    "lastPracticedAt": "2026-07-09T10:30:00Z"
  },
  {
    "topicId": "uuid",
    "topicName": "Network Security",
    "questionSetId": "uuid",
    "totalAttempted": 30,
    "totalCorrect": 20,
    "accuracy": 66.67,
    "lastPracticedAt": "2026-07-08T15:00:00Z"
  }
]
```

---

## 4. Get Weak Areas (Bottom 5 Topics)

### Request
```bash
curl -X GET http://localhost:3000/api/v1/analytics/weak-areas \
  -H "Authorization: Bearer {token}"
```

### Response
```json
[
  {
    "topicId": "uuid",
    "topicName": "Network Security",
    "questionSetId": "uuid",
    "totalAttempted": 30,
    "totalCorrect": 20,
    "accuracy": 66.67,
    "lastPracticedAt": "2026-07-08T15:00:00Z"
  }
]
```

---

## 5. Get Strength Areas (Top 5 Topics)

### Request
```bash
curl -X GET http://localhost:3000/api/v1/analytics/strength-areas \
  -H "Authorization: Bearer {token}"
```

### Response
```json
[
  {
    "topicId": "uuid",
    "topicName": "Cryptography",
    "questionSetId": "uuid",
    "totalAttempted": 50,
    "totalCorrect": 45,
    "accuracy": 90.0,
    "lastPracticedAt": "2026-07-09T10:30:00Z"
  }
]
```

---

## 6. Get Most Mistaken Questions

### Request
```bash
curl -X GET http://localhost:3000/api/v1/analytics/most-mistaken \
  -H "Authorization: Bearer {token}"
```

### Response
```json
[
  {
    "questionId": "uuid",
    "content": "What is the purpose of SSL/TLS?",
    "contentVi": "Mục đích của SSL/TLS là gì?",
    "difficulty": "HARD",
    "topic": {
      "id": "uuid",
      "name": "Cryptography"
    },
    "attemptCount": 5,
    "correctCount": 1,
    "accuracy": 20.0,
    "incorrectStreak": 4,
    "lastAttemptedAt": "2026-07-09T09:00:00Z"
  }
]
```

---

## 7. Get Daily Streak

### Request
```bash
curl -X GET http://localhost:3000/api/v1/analytics/streak \
  -H "Authorization: Bearer {token}"
```

### Response
```json
{
  "currentStreak": 5,
  "longestStreak": 12,
  "questionsLast7Days": 95,
  "streakHistory": [
    {
      "date": "2026-07-09",
      "questionsDone": 20,
      "isStreakDay": true
    },
    {
      "date": "2026-07-08",
      "questionsDone": 18,
      "isStreakDay": true
    },
    {
      "date": "2026-07-07",
      "questionsDone": 15,
      "isStreakDay": true
    }
  ]
}
```

---

## 8. Get Recent Sessions

### Request
```bash
curl -X GET http://localhost:3000/api/v1/analytics/recent-sessions \
  -H "Authorization: Bearer {token}"
```

### Response
```json
[
  {
    "sessionId": "uuid",
    "mode": "quick",
    "questionSetTitle": "CompTIA Security+",
    "totalQuestions": 50,
    "answered": 45,
    "correct": 40,
    "accuracy": 88.89,
    "durationMinutes": 30,
    "startedAt": "2026-07-09T10:00:00Z",
    "endedAt": "2026-07-09T10:30:00Z"
  }
]
```

---

## 9. Get Difficulty Statistics

### Request
```bash
curl -X GET http://localhost:3000/api/v1/analytics/difficulty \
  -H "Authorization: Bearer {token}"
```

### Response
```json
{
  "distribution": {
    "easy": 30,
    "medium": 50,
    "hard": 25
  },
  "accuracyByDifficulty": {
    "easy": {
      "total": 30,
      "correct": 28,
      "accuracy": 93.33
    },
    "medium": {
      "total": 50,
      "correct": 42,
      "accuracy": 84.0
    },
    "hard": {
      "total": 25,
      "correct": 18,
      "accuracy": 72.0
    }
  }
}
```

---

## 10. Get Session Mode Statistics

### Request
```bash
curl -X GET http://localhost:3000/api/v1/analytics/session-modes \
  -H "Authorization: Bearer {token}"
```

### Response
```json
{
  "quick": {
    "sessions": 10,
    "totalQuestions": 150,
    "totalCorrect": 130,
    "accuracy": 86.67,
    "avgTimeSeconds": 540
  },
  "deep": {
    "sessions": 3,
    "totalQuestions": 75,
    "totalCorrect": 60,
    "accuracy": 80.0,
    "avgTimeSeconds": 1200
  },
  "exam": {
    "sessions": 2,
    "totalQuestions": 100,
    "totalCorrect": 85,
    "accuracy": 85.0,
    "avgTimeSeconds": 2400
  }
}
```

---

## Testing Notes

### Using Postman

1. Import these endpoints into Postman
2. Set collection-level variable for token:
   ```
   {{token}} = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
3. In Authorization tab select "Bearer Token" and use `{{token}}`
4. Send requests to see analytics

### Using JavaScript/Fetch

```javascript
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";

async function getStats() {
  const response = await fetch('http://localhost:3000/api/v1/analytics/stats', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  
  const data = await response.json();
  console.log(data);
}

getStats();
```

### Using cURL with .sh File

Create `analytics-test.sh`:

```bash
#!/bin/bash

TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
BASE_URL="http://localhost:3000/api/v1"

echo "=== Overall Stats ==="
curl -X GET $BASE_URL/analytics/overall \
  -H "Authorization: Bearer $TOKEN"

echo -e "\n\n=== Topic Stats ==="
curl -X GET $BASE_URL/analytics/topics \
  -H "Authorization: Bearer $TOKEN"

echo -e "\n\n=== Weak Areas ==="
curl -X GET $BASE_URL/analytics/weak-areas \
  -H "Authorization: Bearer $TOKEN"

echo -e "\n\n=== Strength Areas ==="
curl -X GET $BASE_URL/analytics/strength-areas \
  -H "Authorization: Bearer $TOKEN"

echo -e "\n\n=== Daily Streak ==="
curl -X GET $BASE_URL/analytics/streak \
  -H "Authorization: Bearer $TOKEN"

echo -e "\n\n=== Recent Sessions ==="
curl -X GET $BASE_URL/analytics/recent-sessions \
  -H "Authorization: Bearer $TOKEN"

echo -e "\n\n=== Difficulty Stats ==="
curl -X GET $BASE_URL/analytics/difficulty \
  -H "Authorization: Bearer $TOKEN"

echo -e "\n\n=== Session Mode Stats ==="
curl -X GET $BASE_URL/analytics/session-modes \
  -H "Authorization: Bearer $TOKEN"
```

Then run:
```bash
bash analytics-test.sh
```

---

## Error Responses

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Invalid request",
  "error": "Bad Request"
}
```

---

## Performance Notes

- All analytics endpoints are read-only and don't modify data
- Complex queries (like `/analytics/stats`) may take 1-2 seconds on large datasets
- Consider adding pagination or filters if datasets become large
- Streaks only calculate for last 30 days to optimize performance

---

## Data Freshness

- Session stats are updated in real-time when sessions end
- Topic stats are updated when answers are submitted
- Streak data is recorded when session ends
- All data is queried directly from database (no caching layer currently)
