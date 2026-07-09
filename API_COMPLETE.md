# API Documentation - AI Exam Practice App

## Current Status

**Base URL**: `http://localhost:3000/api/v1`
**Auth**: JWT Token (Bearer token)
**Database**: PostgreSQL
**Async Processing**: BullMQ + Redis

---

## 1. Authentication APIs

### Register
- **POST** `/auth/register`
- **Auth**: None
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "name": "Nguyen Van A",
    "phone": "0901234567"
  }
  ```
- **Response**: 
  ```json
  {
    "accessToken": "eyJhbGciOi...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "phone": "0901234567",
      "name": "Nguyen Van A",
      "avatarUrl": null,
      "isActive": true,
      "createdAt": "2026-07-09T...",
      "updatedAt": "2026-07-09T..."
    }
  }
  ```

### Login
- **POST** `/auth/login`
- **Auth**: None
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response**: Same as Register

### Get Current User
- **GET** `/auth/me`
- **Auth**: Required
- **Response**: User object

### Logout
- **POST** `/auth/logout`
- **Auth**: Required
- **Response**: `{ message: "Logged out" }`

---

## 2. Question Sets APIs

### Create Question Set
- **POST** `/question-sets`
- **Auth**: Required
- **Body**:
  ```json
  {
    "title": "CompTIA Security+",
    "description": "Chuẩn bị cho kỳ thi",
    "visibility": "private",
    "sourceType": "manual"
  }
  ```
- **Response**: QuestionSet object

### Get All Question Sets
- **GET** `/question-sets`
- **Auth**: Required
- **Query Params**:
  - `page` (default: 1)
  - `limit` (default: 20, max: 100)
  - `visibility` (optional): `private | public | shared`
  - `search` (optional): Search by title
- **Response**: 
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "title": "CompTIA Security+",
        "description": "Chuẩn bị cho kỳ thi",
        "visibility": "private",
        "sourceType": "manual",
        "aiParseStatus": "done",
        "questionCount": 150,
        "topicCount": 5,
        "createdAt": "2026-07-09T...",
        "updatedAt": "2026-07-09T..."
      }
    ],
    "meta": { "total": 5, "page": 1, "limit": 20 }
  }
  ```

### Get Question Set Details
- **GET** `/question-sets/:id`
- **Auth**: Required
- **Response**: QuestionSet object

### Update Question Set
- **PATCH** `/question-sets/:id`
- **Auth**: Required (must be owner)
- **Body**: Any of `{ title, description, visibility, sourceType }`
- **Response**: Updated QuestionSet

### Delete Question Set
- **DELETE** `/question-sets/:id`
- **Auth**: Required (must be owner)
- **Restrictions**: Cannot delete if has active practice sessions
- **Response**: `{ message: "Deleted" }`

---

## 3. Topics APIs

### Create Topic
- **POST** `/question-sets/:setId/topics`
- **Auth**: Required (must be owner of set)
- **Body**:
  ```json
  {
    "name": "Cryptography",
    "sortOrder": 0
  }
  ```
- **Response**: 
  ```json
  {
    "id": "uuid",
    "name": "Cryptography",
    "aiSuggestedName": null,
    "confirmedByUser": true,
    "sortOrder": 0,
    "questionCount": 0,
    "questionSetId": "uuid",
    "createdAt": "2026-07-09T...",
    "updatedAt": "2026-07-09T..."
  }
  ```

### Get Topics
- **GET** `/question-sets/:setId/topics`
- **Auth**: Required
- **Response**: Array of topics (sorted by sortOrder ASC)

### Update Topic
- **PATCH** `/question-sets/:setId/topics/:id`
- **Auth**: Required (must be owner of set)
- **Body**: `{ name?, sortOrder? }`
- **Response**: Updated topic

### Confirm Topic (for AI-suggested topics)
- **PATCH** `/question-sets/:setId/topics/:id/confirm`
- **Auth**: Required (must be owner of set)
- **Body**: `{ name? }` (optional - update name during confirm)
- **Response**: Updated topic with `confirmedByUser: true`

### Delete Topic
- **DELETE** `/question-sets/:setId/topics/:id`
- **Auth**: Required (must be owner of set)
- **Note**: Questions in this topic get `topicId = null`
- **Response**: `{ message: "Deleted" }`

---

## 4. Import Pipeline APIs

### Upload File & Create Import Job
- **POST** `/question-sets/:setId/import`
- **Auth**: Required (must be owner)
- **Content-Type**: `multipart/form-data`
- **Fields**:
  - `file`: Binary file (image/jpeg, image/png, application/pdf, text/plain, docx)
  - `fileType`: `image | pdf | text | docx` (enum)
- **Validations**:
  - File size: max 10MB
  - No active import job on this set
- **Response**: 
  ```json
  {
    "importJobId": "uuid",
    "status": "pending"
  }
  ```

### Get Import Job Status
- **GET** `/question-sets/:setId/import/:jobId`
- **Auth**: Required (must be owner)
- **Response**:
  ```json
  {
    "id": "uuid",
    "status": "pending | processing | done | partial | failed",
    "parsedCount": 3,
    "failedCount": 0,
    "errorMessage": null,
    "createdAt": "2026-07-09T...",
    "finishedAt": "2026-07-09T..."
  }
  ```

### Get Import History
- **GET** `/question-sets/:setId/import`
- **Auth**: Required (must be owner)
- **Response**: Array of import jobs (newest first)

---

## 5. Questions APIs

### List Questions
- **GET** `/question-sets/:setId/questions`
- **Auth**: Required (must be owner of set)
- **Query Params**:
  - `page` (default: 1)
  - `limit` (default: 20, max: 100)
  - `needsReview` (optional): `true | false` - Filter questions needing review
- **Response**:
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "content": "What is...",
        "contentVi": "Cái gì là...",
        "imageUrl": null,
        "choices": [
          {
            "key": "A",
            "content": "Answer A",
            "contentVi": "Đáp án A",
            "isCorrect": true
          }
        ],
        "explanation": {
          "content": "The answer is...",
          "source": "ai | manual",
          "isVerified": true
        },
        "difficulty": "EASY | MEDIUM | HARD",
        "status": "DRAFT | PUBLISHED | ARCHIVED",
        "confidenceScore": 0.95,
        "needsReview": false,
        "topicId": "uuid",
        "createdAt": "2026-07-09T...",
        "updatedAt": "2026-07-09T..."
      }
    ],
    "meta": { "total": 150, "page": 1, "limit": 20 }
  }
  ```

### Get Question Detail
- **GET** `/question-sets/:setId/questions/:id`
- **Auth**: Required (must be owner of set)
- **Response**: Single question object (same structure as above)

### Update Question
- **PATCH** `/question-sets/:setId/questions/:id`
- **Auth**: Required (must be owner of set)
- **Body**:
  ```json
  {
    "content": "Updated question text",
    "contentVi": "Cập nhật nội dung",
    "difficulty": "EASY | MEDIUM | HARD",
    "topicId": "uuid",
    "choices": [
      {
        "key": "A",
        "content": "Answer A",
        "contentVi": "Đáp án A",
        "isCorrect": true
      }
    ]
  }
  ```
- **Validations**:
  - Must have ≥1 choice
  - Must have ≥1 choice with `isCorrect: true`
  - Topic must belong to same question set
  - All fields are optional
- **Response**: Updated question object

### Delete Question
- **DELETE** `/question-sets/:setId/questions/:id`
- **Auth**: Required (must be owner of set)
- **Response**: `{ message: "Deleted" }`

### Update Question Explanation
- **PATCH** `/question-sets/:setId/questions/:id/explanation`
- **Auth**: Required (must be owner of set)
- **Body** (one of):
  ```json
  {
    "content": "User-edited explanation text",
    "regenerate": false
  }
  ```
  OR
  ```json
  {
    "regenerate": true
  }
  ```
- **Features**:
  - If `content` provided: Manual edit, marked as `source: "manual"`, `isVerified: true`
  - If `regenerate: true`: Call Gemini AI to generate new explanation, marked as `source: "ai"`, `isVerified: false`
- **Response**: Updated question object with new explanation

### Report Explanation Issue
- **PATCH** `/question-sets/:setId/questions/:id/explanation/report`
- **Auth**: Required
- **Body**:
  ```json
  {
    "reason": "Explanation is incorrect or unclear"
  }
  ```
- **Features**:
  - Idempotent: Same user can report multiple times, updates the report
  - Max reason length: 500 characters
- **Response**: `{ message: "Report submitted" }`

---

## Data Models

### User
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "phone": "0901234567",
  "name": "Nguyen Van A",
  "avatarUrl": null,
  "isActive": true,
  "createdAt": "2026-07-09T...",
  "updatedAt": "2026-07-09T..."
}
```

### QuestionSet
```json
{
  "id": "uuid",
  "title": "CompTIA Security+",
  "description": "Chuẩn bị cho kỳ thi",
  "visibility": "private | public | shared",
  "sourceType": "manual | image | pdf | text | docx",
  "aiParseStatus": "pending | processing | done | failed",
  "questionCount": 150,
  "topicCount": 5,
  "createdAt": "2026-07-09T...",
  "updatedAt": "2026-07-09T..."
}
```

### Topic
```json
{
  "id": "uuid",
  "name": "Cryptography",
  "aiSuggestedName": null,
  "confirmedByUser": true,
  "sortOrder": 0,
  "questionCount": 15,
  "questionSetId": "uuid",
  "createdAt": "2026-07-09T...",
  "updatedAt": "2026-07-09T..."
}
```

### Question
```json
{
  "id": "uuid",
  "content": "What is...",
  "contentVi": "Cái gì là...",
  "imageUrl": null,
  "choices": [
    {
      "key": "A",
      "content": "Answer text",
      "contentVi": "Text tiếng Việt",
      "isCorrect": true
    }
  ],
  "explanation": {
    "content": "Explanation text",
    "source": "ai | manual",
    "isVerified": true
  },
  "difficulty": "EASY | MEDIUM | HARD",
  "status": "DRAFT | PUBLISHED | ARCHIVED",
  "confidenceScore": 0.95,
  "needsReview": false,
  "topicId": "uuid",
  "questionSetId": "uuid",
  "createdAt": "2026-07-09T...",
  "updatedAt": "2026-07-09T..."
}
```

### ImportJob
```json
{
  "id": "uuid",
  "status": "pending | processing | done | partial | failed",
  "parsedCount": 3,
  "failedCount": 0,
  "errorMessage": null,
  "questionSetId": "uuid",
  "createdAt": "2026-07-09T...",
  "finishedAt": "2026-07-09T..."
}
```

### ExplanationFeedback
```json
{
  "id": "uuid",
  "questionId": "uuid",
  "userId": "uuid",
  "reason": "Explanation is incorrect",
  "createdAt": "2026-07-09T...",
  "updatedAt": "2026-07-09T..."
}
```

---

## Error Responses

All errors return:
```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "Bad Request"
}
```

Common errors:
- `400 Bad Request` - Validation failed
- `401 Unauthorized` - Missing/invalid JWT token
- `403 Forbidden` - Not authorized to access resource
- `404 Not Found` - Resource not found
- `409 Conflict` - Cannot perform action (e.g., active import job)

---

## Status Summary

### ✅ IMPLEMENTED (Ready to Use)
- [x] Authentication (Register, Login, JWT)
- [x] Question Sets (CRUD with ownership & visibility)
- [x] Topics (CRUD with AI suggestions)
- [x] Import Pipeline (Async with BullMQ + Gemini AI)
- [x] Questions Review (CRUD + explanation management)
- [x] Practice Sessions (Start → Submit answers → End with tracking)
- [x] Analytics (User statistics & insights)

### 6. Practice Sessions APIs

#### Start Practice Session
- **POST** `/practice-sessions`
- **Auth**: Required
- **Body**:
  ```json
  {
    "questionSetId": "uuid",
    "mode": "quick | deep | exam | weakness"
  }
  ```
- **Response**:
  ```json
  {
    "id": "uuid",
    "userId": "uuid",
    "questionSetId": "uuid",
    "mode": "quick",
    "totalQuestions": 50,
    "answered": 0,
    "correct": 0,
    "accuracy": 0,
    "durationSeconds": 0,
    "status": "in_progress",
    "startedAt": "2026-07-09T...",
    "endedAt": null
  }
  ```

#### Get All User Sessions
- **GET** `/practice-sessions`
- **Auth**: Required
- **Query Params**:
  - `page` (default: 1)
  - `limit` (default: 20, max: 100)
- **Response**:
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "userId": "uuid",
        "questionSetId": "uuid",
        "mode": "quick",
        "totalQuestions": 50,
        "answered": 45,
        "correct": 40,
        "accuracy": 88.89,
        "durationSeconds": 1800,
        "status": "completed",
        "startedAt": "2026-07-09T10:00:00Z",
        "endedAt": "2026-07-09T10:30:00Z"
      }
    ],
    "meta": { "total": 10, "page": 1, "limit": 20 }
  }
  ```

#### Get Session Details
- **GET** `/practice-sessions/:id`
- **Auth**: Required
- **Response**: Session object (quick summary)

#### Get Session Review (Chi tiết bài làm)
- **GET** `/practice-sessions/:id/review`
- **Auth**: Required
- **Response**: Full session with question details + answers
  ```json
  {
    "id": "uuid",
    "userId": "uuid",
    "questionSetId": "uuid",
    "questionSetTitle": "CompTIA Security+",
    "mode": "quick",
    "totalQuestions": 50,
    "answered": 45,
    "correct": 40,
    "accuracy": 88.89,
    "durationSeconds": 1800,
    "status": "completed",
    "startedAt": "2026-07-09T10:00:00Z",
    "endedAt": "2026-07-09T10:30:00Z",
    "answers": [
      {
        "id": "uuid",
        "questionId": "uuid",
        "content": "What is encryption?",
        "contentVi": "Mã hóa là gì?",
        "choices": [
          {
            "key": "A",
            "content": "Compress data",
            "contentVi": "Nén dữ liệu",
            "isCorrect": false
          },
          {
            "key": "B",
            "content": "Protect confidentiality",
            "contentVi": "Bảo vệ bí mật",
            "isCorrect": true
          }
        ],
        "explanation": {
          "content": "Encryption protects...",
          "source": "ai",
          "isVerified": false
        },
        "difficulty": "EASY",
        "topic": {
          "id": "uuid",
          "name": "Cryptography"
        },
        "selectedChoiceKey": "B",
        "correctChoiceKey": "B",
        "isCorrect": true,
        "timeSpentMs": 45000,
        "aiExplanationViewed": true,
        "seqOrder": 0
      },
      {
        "id": "uuid",
        "questionId": "uuid",
        "content": "What is RSA?",
        "contentVi": "RSA là gì?",
        "choices": [...],
        "explanation": {...},
        "difficulty": "MEDIUM",
        "topic": {...},
        "selectedChoiceKey": "C",
        "correctChoiceKey": "A",
        "isCorrect": false,
        "timeSpentMs": 120000,
        "aiExplanationViewed": false,
        "seqOrder": 1
      }
    ]
  }
  ```
  
  **Xem chi tiết:**
  - ✅ Câu hỏi đúng/sai → `isCorrect`
  - ✅ Đáp án user chọn → `selectedChoiceKey`
  - ✅ Đáp án đúng → `correctChoiceKey`
  - ✅ Toàn bộ choices để hiển thị
  - ✅ Giải thích của AI
  - ✅ Thời gian làm → `timeSpentMs`
  - ✅ Có xem giải thích không → `aiExplanationViewed`

#### Submit Answer (Single or Multiple Choice)
- **PATCH** `/practice-sessions/:id/answer`
- **Auth**: Required
- **Body**:
  ```json
  {
    "questionId": "uuid",
    "selectedChoiceKeys": "A",
    "timeSpentMs": 45000,
    "aiExplanationViewed": false
  }
  ```
  OR (Multiple Choice)
  ```json
  {
    "questionId": "uuid",
    "selectedChoiceKeys": ["A", "B", "C"],
    "timeSpentMs": 120000,
    "aiExplanationViewed": true
  }
  ```
- **Logic**:
  - Single Choice: Only 1 correct answer → `selectedChoiceKeys: "A"` or `["A"]`
  - Multiple Choice: Multiple correct answers → `selectedChoiceKeys: ["A", "B"]`
  - Answer is correct if selected keys exactly match correct keys
- **Response**: Updated session object

#### End Practice Session
- **POST** `/practice-sessions/:id/end`
- **Auth**: Required
- **Response**: Completed session object with final stats

---

### 7. Analytics APIs

#### Get All Stats
- **GET** `/analytics/stats`
- **Auth**: Required
- **Response**: Comprehensive user statistics
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

#### Get Overall Stats
- **GET** `/analytics/overall`
- **Auth**: Required
- **Response**: Total sessions, questions, accuracy, time spent

#### Get Topic Stats
- **GET** `/analytics/topics`
- **Auth**: Required
- **Response**: Array of statistics by topic

#### Get Weak Areas
- **GET** `/analytics/weak-areas`
- **Auth**: Required
- **Response**: Top 5 topics with lowest accuracy

#### Get Strength Areas
- **GET** `/analytics/strength-areas`
- **Auth**: Required
- **Response**: Top 5 topics with highest accuracy

#### Get Most Mistaken Questions
- **GET** `/analytics/most-mistaken`
- **Auth**: Required
- **Response**: 10 questions with highest incorrect streak

#### Get Daily Streak
- **GET** `/analytics/streak`
- **Auth**: Required
- **Response**: Current streak, longest streak, and 30-day history

#### Get Recent Sessions
- **GET** `/analytics/recent-sessions`
- **Auth**: Required
- **Response**: Last 5 completed practice sessions

#### Get Difficulty Stats
- **GET** `/analytics/difficulty`
- **Auth**: Required
- **Response**: Question distribution and accuracy by difficulty level

#### Get Session Mode Stats
- **GET** `/analytics/session-modes`
- **Auth**: Required
- **Response**: Statistics grouped by practice mode (quick, deep, exam, weakness)

---

### 📋 TODO - Not Yet Implemented

#### Subscriptions
- [ ] GET `/subscriptions/me` - Get plan
- [ ] POST `/subscriptions/upgrade` - Change plan

---

## Testing

**Sample Token** (for testing):
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmN2QxN2U4Yy0xNGU5LTRhZTUtYjAxNi1kZmExMTAyY2RlMmYiLCJpYXQiOjE3ODM1NTk3MDksImV4cCI6MTc4NDE2NDUwOX0.g2h6d61i5Alb6TZUyg75Ubr7h7G8KenbOa2JLteKZpQ
```

**Sample User ID**:
```
f7d17e8c-14e9-4ae5-b016-dfa1102cde2f
```

**Curl Example** (Register):
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User",
    "phone": "0901234567"
  }'
```

**Curl Example** (List Questions):
```bash
curl -X GET "http://localhost:3000/api/v1/question-sets/{setId}/questions?page=1&limit=20" \
  -H "Authorization: Bearer {token}"
```

---

## Architecture

- **Pattern**: Controller → Service → Repository → Prisma ORM → PostgreSQL
- **Async Processing**: BullMQ + Redis (for import jobs with retry logic)
- **AI Integration**: Gemini 3.5 Flash API (for question parsing & explanation generation)
- **File Storage**: Local filesystem (`./uploads/`)
- **Authentication**: JWT with 7-day expiry
- **Validation**: Class-validator DTOs with type safety
- **Error Handling**: Consistent error responses with proper HTTP status codes

---

## Development Notes

### Environment Variables Required
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_HOST` - Redis host for BullMQ
- `REDIS_PORT` - Redis port
- `JWT_SECRET` - Secret key for JWT signing
- `JWT_EXPIRES_IN` - JWT expiry time (e.g., "7d")
- `GEMINI_API_KEY` - Google Gemini API key
- `UPLOAD_DIR` - Directory for file uploads (e.g., "./uploads")
- `MAX_FILE_SIZE` - Max file size in bytes (e.g., 10485760 for 10MB)

### Running the App

**Development**:
```bash
npm run start
```

**Build**:
```bash
npm run build
```

**Lint**:
```bash
npm run lint
```

**Format**:
```bash
npm run format
```

---

## Database Migrations

All database schemas are managed through Prisma migrations. Current migrations:
- `20260708233430_init` - Initial schema with User, QuestionSet, Topic, Question, ImportJob
- `20260708235556_update_user_auth` - Updated User model with phone field

To apply migrations:
```bash
npx prisma migrate deploy
```

To create a new migration:
```bash
npx prisma migrate dev --name migration_name
```
