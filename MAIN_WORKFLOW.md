# Main Workflow - From Question Set to Practice

Complete step-by-step workflow for the main business flow.

---

## 📋 Complete Workflow

### **Step 1: Create Question Set**

**Endpoint**: `POST /api/v1/question-sets`

**Request**:
```bash
curl -X POST http://localhost:3000/api/v1/question-sets \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "CompTIA Security+ 2024",
    "description": "Preparation for Security+ certification exam",
    "visibility": "private",
    "sourceType": "manual"
  }'
```

**Response** (201 Created):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "CompTIA Security+ 2024",
  "description": "Preparation for Security+ certification exam",
  "visibility": "private",
  "sourceType": "manual",
  "aiParseStatus": "done",
  "questionCount": 0,
  "topicCount": 0,
  "ownerId": "user-uuid-here",
  "createdAt": "2026-07-09T10:00:00Z",
  "updatedAt": "2026-07-09T10:00:00Z"
}
```

**Store this**: `setId = "550e8400-e29b-41d4-a716-446655440000"`

---

### **Step 2: Create Topics (Optional - Manual Topics)**

**Endpoint**: `POST /api/v1/question-sets/{setId}/topics`

**Request** (Create first topic manually):
```bash
curl -X POST http://localhost:3000/api/v1/question-sets/550e8400-e29b-41d4-a716-446655440000/topics \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Cryptography & PKI",
    "sortOrder": 0
  }'
```

**Response** (201 Created):
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "name": "Cryptography & PKI",
  "aiSuggestedName": null,
  "confirmedByUser": true,
  "sortOrder": 0,
  "questionCount": 0,
  "questionSetId": "550e8400-e29b-41d4-a716-446655440000",
  "createdAt": "2026-07-09T10:05:00Z",
  "updatedAt": "2026-07-09T10:05:00Z"
}
```

**Note**: This step is optional. When you import files with AI parsing, AI will auto-create topics.

---

### **Step 3: Import File with AI Parsing**

#### **Option A: Import IMAGE (JPG/PNG)**

**Endpoint**: `POST /api/v1/question-sets/{setId}/import`

**Request** (multipart/form-data):
```bash
curl -X POST http://localhost:3000/api/v1/question-sets/550e8400-e29b-41d4-a716-446655440000/import \
  -H "Authorization: Bearer {token}" \
  -F "file=@exam_page_1.jpg" \
  -F "fileType=image"
```

**Process**:
1. ✅ File uploaded to `./uploads/`
2. ✅ Import job created with status `pending`
3. ✅ BullMQ worker picks up job
4. ✅ Gemini AI processes image → extract text
5. ✅ Gemini AI parses questions
6. ✅ Auto-create topics if needed
7. ✅ Auto-create questions with choices & explanation
8. ✅ Set `needsReview: true` if confidence < 0.75

**Response** (202 Accepted):
```json
{
  "importJobId": "770e8400-e29b-41d4-a716-446655440002",
  "status": "pending"
}
```

**Store this**: `jobId = "770e8400-e29b-41d4-a716-446655440002"`

---

#### **Option B: Import PDF**

**Endpoint**: Same - `POST /api/v1/question-sets/{setId}/import`

**Request**:
```bash
curl -X POST http://localhost:3000/api/v1/question-sets/550e8400-e29b-41d4-a716-446655440000/import \
  -H "Authorization: Bearer {token}" \
  -F "file=@exam_questions.pdf" \
  -F "fileType=pdf"
```

**Process**: Same as image
- PDF parsed → extract text → Gemini AI processes

---

#### **Option C: Import RAW TEXT**

**Endpoint**: Same

**Request**:
```bash
curl -X POST http://localhost:3000/api/v1/question-sets/550e8400-e29b-41d4-a716-446655440000/import \
  -H "Authorization: Bearer {token}" \
  -F "file=@questions.txt" \
  -F "fileType=text"
```

**Text file format** (example):
```
1. What is the primary purpose of encryption?
A) To compress data
B) To protect data confidentiality
C) To increase transmission speed
D) To reduce file size

Correct: B

2. Which encryption algorithm uses symmetric keys?
A) RSA
B) AES
C) ECC
D) DSA

Correct: B
```

---

#### **Option D: Import DOCX (Word Document)**

**Endpoint**: Same

**Request**:
```bash
curl -X POST http://localhost:3000/api/v1/question-sets/550e8400-e29b-41d4-a716-446655440000/import \
  -H "Authorization: Bearer {token}" \
  -F "file=@exam_bank.docx" \
  -F "fileType=docx"
```

**Process**: DOCX extracted → text parsed by Gemini

---

### **Step 4: Check Import Job Status**

**Endpoint**: `GET /api/v1/question-sets/{setId}/import/{jobId}`

**Request** (Poll while processing):
```bash
curl -X GET http://localhost:3000/api/v1/question-sets/550e8400-e29b-41d4-a716-446655440000/import/770e8400-e29b-41d4-a716-446655440002 \
  -H "Authorization: Bearer {token}"
```

**Response** (While processing):
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "status": "processing",
  "parsedCount": 0,
  "failedCount": 0,
  "errorMessage": null,
  "createdAt": "2026-07-09T10:10:00Z",
  "finishedAt": null
}
```

**Response** (After completion):
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "status": "done",
  "parsedCount": 25,
  "failedCount": 2,
  "errorMessage": null,
  "createdAt": "2026-07-09T10:10:00Z",
  "finishedAt": "2026-07-09T10:12:30Z"
}
```

**Possible statuses**:
- `pending` - Waiting to be processed
- `processing` - Currently being processed by worker
- `done` - All questions parsed successfully
- `partial` - Some questions parsed, some failed
- `failed` - All failed (error message provided)

---

### **Step 5: View Import History**

**Endpoint**: `GET /api/v1/question-sets/{setId}/import`

**Request**:
```bash
curl -X GET http://localhost:3000/api/v1/question-sets/550e8400-e29b-41d4-a716-446655440000/import \
  -H "Authorization: Bearer {token}"
```

**Response**:
```json
[
  {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "status": "done",
    "parsedCount": 25,
    "failedCount": 2,
    "errorMessage": null,
    "createdAt": "2026-07-09T10:10:00Z",
    "finishedAt": "2026-07-09T10:12:30Z"
  },
  {
    "id": "880e8400-e29b-41d4-a716-446655440003",
    "status": "done",
    "parsedCount": 15,
    "failedCount": 0,
    "errorMessage": null,
    "createdAt": "2026-07-09T11:00:00Z",
    "finishedAt": "2026-07-09T11:02:15Z"
  }
]
```

---

### **Step 6: View All Topics (Auto-created by AI)**

**Endpoint**: `GET /api/v1/question-sets/{setId}/topics`

**Request**:
```bash
curl -X GET http://localhost:3000/api/v1/question-sets/550e8400-e29b-41d4-a716-446655440000/topics \
  -H "Authorization: Bearer {token}"
```

**Response** (Topics created by AI during import):
```json
[
  {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "name": "Cryptography & PKI",
    "aiSuggestedName": null,
    "confirmedByUser": true,
    "sortOrder": 0,
    "questionCount": 12,
    "questionSetId": "550e8400-e29b-41d4-a716-446655440000",
    "createdAt": "2026-07-09T10:05:00Z",
    "updatedAt": "2026-07-09T10:05:00Z"
  },
  {
    "id": "770e8400-e29b-41d4-a716-446655440004",
    "name": "Access Control",
    "aiSuggestedName": "Access Control & Authentication",
    "confirmedByUser": false,
    "sortOrder": 1,
    "questionCount": 10,
    "questionSetId": "550e8400-e29b-41d4-a716-446655440000",
    "createdAt": "2026-07-09T10:11:00Z",
    "updatedAt": "2026-07-09T10:11:00Z"
  },
  {
    "id": "880e8400-e29b-41d4-a716-446655440005",
    "name": "Network Security",
    "aiSuggestedName": "Network Protocols & Security",
    "confirmedByUser": false,
    "sortOrder": 2,
    "questionCount": 8,
    "questionSetId": "550e8400-e29b-41d4-a716-446655440000",
    "createdAt": "2026-07-09T10:12:00Z",
    "updatedAt": "2026-07-09T10:12:00Z"
  }
]
```

---

### **Step 7: Confirm AI-Suggested Topics**

**Endpoint**: `PATCH /api/v1/question-sets/{setId}/topics/{topicId}/confirm`

**Request** (Confirm and optionally rename):
```bash
curl -X PATCH http://localhost:3000/api/v1/question-sets/550e8400-e29b-41d4-a716-446655440000/topics/770e8400-e29b-41d4-a716-446655440004/confirm \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Access Control & Authentication"
  }'
```

**Response**:
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440004",
  "name": "Access Control & Authentication",
  "aiSuggestedName": "Access Control & Authentication",
  "confirmedByUser": true,
  "sortOrder": 1,
  "questionCount": 10,
  "questionSetId": "550e8400-e29b-41d4-a716-446655440000",
  "createdAt": "2026-07-09T10:11:00Z",
  "updatedAt": "2026-07-09T10:13:00Z"
}
```

---

### **Step 8: List Questions (With Review Filter)**

**Endpoint**: `GET /api/v1/question-sets/{setId}/questions`

**Request** (Show all questions):
```bash
curl -X GET "http://localhost:3000/api/v1/question-sets/550e8400-e29b-41d4-a716-446655440000/questions?page=1&limit=20" \
  -H "Authorization: Bearer {token}"
```

**Request** (Show only questions needing review):
```bash
curl -X GET "http://localhost:3000/api/v1/question-sets/550e8400-e29b-41d4-a716-446655440000/questions?page=1&limit=20&needsReview=true" \
  -H "Authorization: Bearer {token}"
```

**Response**:
```json
{
  "data": [
    {
      "id": "990e8400-e29b-41d4-a716-446655440010",
      "content": "What is the primary purpose of encryption?",
      "contentVi": "Mục đích chính của mã hóa là gì?",
      "imageUrl": null,
      "choices": [
        {
          "key": "A",
          "content": "To compress data",
          "contentVi": "Để nén dữ liệu",
          "isCorrect": false
        },
        {
          "key": "B",
          "content": "To protect data confidentiality",
          "contentVi": "Để bảo vệ bí mật dữ liệu",
          "isCorrect": true
        },
        {
          "key": "C",
          "content": "To increase transmission speed",
          "contentVi": "Để tăng tốc độ truyền",
          "isCorrect": false
        },
        {
          "key": "D",
          "content": "To reduce file size",
          "contentVi": "Để giảm kích thước tệp",
          "isCorrect": false
        }
      ],
      "explanation": {
        "content": "Encryption is primarily used to protect the confidentiality of data by converting it into an unreadable format that can only be accessed with the correct key.",
        "source": "ai",
        "isVerified": false
      },
      "difficulty": "EASY",
      "status": "DRAFT",
      "confidenceScore": 0.92,
      "needsReview": false,
      "topicId": "660e8400-e29b-41d4-a716-446655440001",
      "createdAt": "2026-07-09T10:11:15Z",
      "updatedAt": "2026-07-09T10:11:15Z"
    },
    {
      "id": "aa0e8400-e29b-41d4-a716-446655440011",
      "content": "Which of the following is NOT a cryptographic algorithm?",
      "contentVi": "Cái nào sau đây KHÔNG phải là thuật toán mã hóa?",
      "imageUrl": null,
      "choices": [
        {
          "key": "A",
          "content": "AES",
          "contentVi": "AES",
          "isCorrect": false
        },
        {
          "key": "B",
          "content": "RSA",
          "contentVi": "RSA",
          "isCorrect": false
        },
        {
          "key": "C",
          "content": "HTTP",
          "contentVi": "HTTP",
          "isCorrect": true
        },
        {
          "key": "D",
          "content": "ECC",
          "contentVi": "ECC",
          "isCorrect": false
        }
      ],
      "explanation": {
        "content": "HTTP is a protocol for transferring hypertext, not a cryptographic algorithm. AES, RSA, and ECC are all cryptographic algorithms.",
        "source": "ai",
        "isVerified": false
      },
      "difficulty": "MEDIUM",
      "status": "DRAFT",
      "confidenceScore": 0.68,
      "needsReview": true,
      "topicId": "660e8400-e29b-41d4-a716-446655440001",
      "createdAt": "2026-07-09T10:11:20Z",
      "updatedAt": "2026-07-09T10:11:20Z"
    }
  ],
  "meta": {
    "total": 25,
    "page": 1,
    "limit": 20
  }
}
```

---

### **Step 9: Review & Fix Questions**

#### **A: Update Question Content**

**Endpoint**: `PATCH /api/v1/question-sets/{setId}/questions/{questionId}`

**Request** (Fix the question):
```bash
curl -X PATCH http://localhost:3000/api/v1/question-sets/550e8400-e29b-41d4-a716-446655440000/questions/aa0e8400-e29b-41d4-a716-446655440011 \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Which of the following is NOT a cryptographic algorithm?",
    "contentVi": "Cái nào sau đây KHÔNG phải là thuật toán mã hóa?",
    "difficulty": "EASY",
    "topicId": "660e8400-e29b-41d4-a716-446655440001",
    "choices": [
      {
        "key": "A",
        "content": "AES",
        "contentVi": "AES",
        "isCorrect": false
      },
      {
        "key": "B",
        "content": "RSA",
        "contentVi": "RSA",
        "isCorrect": false
      },
      {
        "key": "C",
        "content": "HTTP",
        "contentVi": "HTTP",
        "isCorrect": true
      },
      {
        "key": "D",
        "content": "ECC",
        "contentVi": "ECC",
        "isCorrect": false
      }
    ]
  }'
```

**Response**:
```json
{
  "id": "aa0e8400-e29b-41d4-a716-446655440011",
  "content": "Which of the following is NOT a cryptographic algorithm?",
  "contentVi": "Cái nào sau đây KHÔNG phải là thuật toán mã hóa?",
  "imageUrl": null,
  "choices": [...],
  "explanation": {...},
  "difficulty": "EASY",
  "status": "DRAFT",
  "confidenceScore": 0.68,
  "needsReview": false,
  "topicId": "660e8400-e29b-41d4-a716-446655440001",
  "createdAt": "2026-07-09T10:11:20Z",
  "updatedAt": "2026-07-09T10:14:00Z"
}
```

---

#### **B: Regenerate Explanation with AI**

**Endpoint**: `PATCH /api/v1/question-sets/{setId}/questions/{questionId}/explanation`

**Request** (Ask AI to regenerate):
```bash
curl -X PATCH http://localhost:3000/api/v1/question-sets/550e8400-e29b-41d4-a716-446655440000/questions/aa0e8400-e29b-41d4-a716-446655440011/explanation \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "regenerate": true
  }'
```

**Process**:
1. ✅ Find correct answer from choices
2. ✅ Call Gemini AI with question + correct answer
3. ✅ AI generates new explanation
4. ✅ Mark as `source: "ai"`, `isVerified: false`

**Response**:
```json
{
  "id": "aa0e8400-e29b-41d4-a716-446655440011",
  "content": "Which of the following is NOT a cryptographic algorithm?",
  "contentVi": "Cái nào sau đây KHÔNG phải là thuật toán mã hóa?",
  "choices": [...],
  "explanation": {
    "content": "HTTP (HyperText Transfer Protocol) is a protocol for transferring web pages and resources over the internet, not a cryptographic algorithm. AES, RSA, and ECC are all well-known cryptographic algorithms used for encryption and security purposes.",
    "source": "ai",
    "isVerified": false
  },
  "difficulty": "EASY",
  "needsReview": false,
  "topicId": "660e8400-e29b-41d4-a716-446655440001",
  "updatedAt": "2026-07-09T10:15:30Z"
}
```

---

#### **C: Manually Edit Explanation**

**Endpoint**: Same - `PATCH /api/v1/question-sets/{setId}/questions/{questionId}/explanation`

**Request** (User provides better explanation):
```bash
curl -X PATCH http://localhost:3000/api/v1/question-sets/550e8400-e29b-41d4-a716-446655440000/questions/aa0e8400-e29b-41d4-a716-446655440011/explanation \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "HTTP is a protocol for transferring hypertext/web pages. It's not a cryptographic algorithm like AES, RSA, and ECC which are designed specifically for encryption and security.",
    "regenerate": false
  }'
```

**Response** (Marked as manually edited):
```json
{
  "id": "aa0e8400-e29b-41d4-a716-446655440011",
  "explanation": {
    "content": "HTTP is a protocol for transferring hypertext/web pages. It's not a cryptographic algorithm like AES, RSA, and ECC which are designed specifically for encryption and security.",
    "source": "manual",
    "isVerified": true
  },
  "updatedAt": "2026-07-09T10:16:00Z"
}
```

---

#### **D: Report Explanation Issue**

**Endpoint**: `PATCH /api/v1/question-sets/{setId}/questions/{questionId}/explanation/report`

**Request** (Report bad explanation):
```bash
curl -X PATCH http://localhost:3000/api/v1/question-sets/550e8400-e29b-41d4-a716-446655440000/questions/990e8400-e29b-41d4-a716-446655440010/explanation/report \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Explanation is incomplete and doesn't mention authentication aspects"
  }'
```

**Response**:
```json
{
  "message": "Report submitted"
}
```

**Notes**:
- ✅ Idempotent: Same user can report multiple times (updates report)
- ✅ Tracked in `ExplanationFeedback` table
- ✅ Helps identify problematic explanations

---

### **Step 10: Delete Question (If Bad)**

**Endpoint**: `DELETE /api/v1/question-sets/{setId}/questions/{questionId}`

**Request**:
```bash
curl -X DELETE http://localhost:3000/api/v1/question-sets/550e8400-e29b-41d4-a716-446655440000/questions/aa0e8400-e29b-41d4-a716-446655440011 \
  -H "Authorization: Bearer {token}"
```

**Response**:
```json
{
  "message": "Deleted"
}
```

---

### **Step 11: Get Question Set Summary**

**Endpoint**: `GET /api/v1/question-sets/{setId}`

**Request**:
```bash
curl -X GET http://localhost:3000/api/v1/question-sets/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer {token}"
```

**Response** (Updated counts):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "CompTIA Security+ 2024",
  "description": "Preparation for Security+ certification exam",
  "visibility": "private",
  "sourceType": "manual",
  "aiParseStatus": "done",
  "questionCount": 24,
  "topicCount": 3,
  "ownerId": "user-uuid-here",
  "createdAt": "2026-07-09T10:00:00Z",
  "updatedAt": "2026-07-09T10:16:00Z"
}
```

---

## 📊 Workflow Summary

```
1. Create Question Set
   ↓
2. (Optional) Create Manual Topics
   ↓
3. Import File (Image/PDF/Text/DOCX)
   ↓
4. AI Parses & Creates:
   - Questions with choices
   - Topics (auto)
   - Explanations
   ↓
5. Check Import Status (poll)
   ↓
6. View Auto-created Topics
   ↓
7. Confirm AI Topics
   ↓
8. List Questions
   ↓
9. Review & Fix Questions:
   - Update content/choices
   - Regenerate explanation (AI)
   - Edit explanation manually
   - Report issues
   - Delete bad questions
   ↓
10. Ready for Practice (future module)
```

---

## 🔄 Multiple Imports

You can import multiple files into the same question set:

```bash
# First import
POST /question-sets/{setId}/import with image_1.jpg

# Wait for completion

# Second import
POST /question-sets/{setId}/import with exam_page_2.pdf

# Wait for completion

# Questions accumulate in the set
GET /question-sets/{setId}/questions
# Returns total 50 questions from both imports
```

---

## ❌ Error Scenarios

### Validation Errors

**Missing required field**:
```json
{
  "statusCode": 400,
  "message": "Title is required",
  "error": "Bad Request"
}
```

**Invalid UUID**:
```json
{
  "statusCode": 400,
  "message": "ID không hợp lệ",
  "error": "Bad Request"
}
```

**No correct answer in choices**:
```json
{
  "statusCode": 400,
  "message": "Phải có ít nhất 1 đáp án đúng",
  "error": "Bad Request"
}
```

### Authorization Errors

**Not owner of set**:
```json
{
  "statusCode": 403,
  "message": "Không có quyền sửa câu hỏi",
  "error": "Forbidden"
}
```

**Question not in set**:
```json
{
  "statusCode": 404,
  "message": "Câu hỏi không thuộc bộ đề này",
  "error": "Not Found"
}
```

### Business Logic Errors

**Active import job exists**:
```json
{
  "statusCode": 409,
  "message": "Cannot create import job while one is active",
  "error": "Conflict"
}
```

**File too large**:
```json
{
  "statusCode": 400,
  "message": "File size exceeds 10MB limit",
  "error": "Bad Request"
}
```

---

## 💡 Pro Tips

1. **Always check `needsReview`** - AI might be uncertain about some questions
2. **Batch operations** - Import multiple files before reviewing all questions
3. **Use pagination** - For large question sets (500+ questions), use pagination
4. **Filter by needsReview** - `?needsReview=true` to focus on problematic questions
5. **Confirm topics early** - Confirmed topics appear first in dropdown
6. **Regenerate explanations** - If AI explanation is bad, regenerate or edit manually
7. **Report issues** - Help improve the system by reporting bad explanations

---

## 🔧 Technical Details

### AI Parsing Flow
```
File → Extract Text → Gemini AI → Parse Questions → 
  → Auto-create Topics → Auto-create Questions → Save to DB
```

### Async Processing
- All imports are async (doesn't block response)
- Uses BullMQ with Redis
- Auto-retry on failure (3 attempts)
- Exponential backoff between retries

### Database Structure
```
User
  ├── QuestionSet
  │   ├── Topic
  │   │   └── Question
  │   │       ├── Choice[]
  │   │       └── Explanation
  │   └── ImportJob
  │       ├── ParsedQuestion
  │       └── ParsedTopic
  └── ExplanationFeedback
```

