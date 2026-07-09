# Postman Guide - Upload File & Test API

Step-by-step guide to test the AI Exam Practice API in Postman.

---

## 1️⃣ Setup Postman Environment

### Create New Workspace (Optional but Recommended)

1. **Open Postman** → Click **Workspaces**
2. Click **Create Workspace**
3. Name: `AI Exam Practice`
4. Type: `Personal`
5. Click **Create**

---

## 2️⃣ Create Environment Variables

This way you don't need to copy-paste tokens and URLs every time.

### Steps:

1. **Top right** → Click **Environments** icon 🌍
2. Click **Create Environment**
3. Name: `AI Exam Practice Dev`

### Add Variables:

| Variable | Initial Value | Current Value |
|----------|---------------|---------------|
| `base_url` | `http://localhost:3000/api/v1` | `http://localhost:3000/api/v1` |
| `token` | (empty) | (will fill after login) |
| `setId` | (empty) | (will fill after creating set) |
| `topicId` | (empty) | (will fill after creating topic) |
| `jobId` | (empty) | (will fill after importing) |
| `questionId` | (empty) | (will fill after creating question) |

### How to add:

```
Variable name: base_url
Initial value: http://localhost:3000/api/v1
Current value: http://localhost:3000/api/v1
```

Then click **Save** and **Close**.

---

## 3️⃣ Register User

### Request Setup:

1. Click **+ New Tab** (or Ctrl+T)
2. Change **GET** → **POST**
3. **URL**: `{{base_url}}/auth/register`
4. Go to **Body** tab
5. Select **raw** → **JSON**

### Body:

```json
{
  "email": "testuser@example.com",
  "password": "password123",
  "name": "Test User",
  "phone": "0901234567"
}
```

### Send Request

1. Click **Send**
2. Response:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "testuser@example.com",
    "name": "Test User",
    ...
  }
}
```

### Save Token to Environment:

1. In response → Click **Copy** the `accessToken` value (without quotes)
2. Go to **Environments** → Select `AI Exam Practice Dev`
3. Find `token` → Paste into **Current value**
4. Click **Save**

---

## 4️⃣ Create Question Set

### Request Setup:

1. New tab: **POST**
2. **URL**: `{{base_url}}/question-sets`
3. Go to **Headers** tab
4. Add:
   - Key: `Authorization`
   - Value: `Bearer {{token}}`

5. Go to **Body** → **raw** → **JSON**

### Body:

```json
{
  "title": "CompTIA Security+ 2024",
  "description": "Preparation for certification exam",
  "visibility": "private",
  "sourceType": "manual"
}
```

### Send and Save:

1. Click **Send**
2. Copy `id` from response
3. **Environments** → Paste to `setId` **Current value**
4. **Save**

---

## 5️⃣ CREATE TOPIC (Optional)

### Request Setup:

1. **POST**
2. **URL**: `{{base_url}}/question-sets/{{setId}}/topics`
3. **Headers**: Add `Authorization: Bearer {{token}}`
4. **Body** → **raw** → **JSON**

### Body:

```json
{
  "name": "Cryptography",
  "sortOrder": 0
}
```

### Send and Save:

- Copy `id` → Save to `topicId` environment variable

---

## 6️⃣ UPLOAD FILE - THE MAIN PART! 📤

This is where you upload image/PDF/text/docx.

### Request Setup:

1. **POST**
2. **URL**: `{{base_url}}/question-sets/{{setId}}/import`
3. **Headers**: Add `Authorization: Bearer {{token}}`
4. **Body** → Select **form-data** (NOT raw!)

### Add Form Fields:

In **Body**, you'll see a table with Key/Value columns.

#### First Row (File):
- **Key**: `file`
- **Value**: Click the **dropdown** on the right → Select **File**
- Then click the **blue "Select Files"** button
- Choose your file (image.jpg, exam.pdf, questions.txt, etc.)

#### Second Row (File Type):
- **Key**: `fileType`
- **Value**: `image` (or `pdf`, `text`, `docx`)
- **Type**: Keep as **Text** (not File)

### What it looks like:

```
KEY          | VALUE
--------------------------------------
file         | [Select File Button]
fileType     | image
```

### Example for Each File Type:

**For Image (JPG/PNG)**:
```
file → exam_page_1.jpg
fileType → image
```

**For PDF**:
```
file → exam_questions.pdf
fileType → pdf
```

**For Text**:
```
file → questions.txt
fileType → text
```

**For DOCX**:
```
file → exam_bank.docx
fileType → docx
```

### Send Request:

1. Click **Send**
2. Response (202 Accepted):
```json
{
  "importJobId": "770e8400-e29b-41d4-a716-446655440002",
  "status": "pending"
}
```

3. Copy `importJobId` → Save to `jobId` environment variable

---

## 7️⃣ Check Import Status

### Request Setup:

1. **GET**
2. **URL**: `{{base_url}}/question-sets/{{setId}}/import/{{jobId}}`
3. **Headers**: Add `Authorization: Bearer {{token}}`

### Send Request (multiple times):

Keep clicking **Send** to poll the status.

**Response - While Processing**:
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

**Response - After Done**:
```json
{
  "id": "770e8400-e29b-41d4-a716-446655440002",
  "status": "done",
  "parsedCount": 15,
  "failedCount": 0,
  "errorMessage": null,
  "createdAt": "2026-07-09T10:10:00Z",
  "finishedAt": "2026-07-09T10:12:30Z"
}
```

💡 **Tip**: Set **Postman Timer** to auto-send every 2 seconds:
- Click **Send** dropdown arrow → Select **Send repeatedly**
- Set interval (e.g., 2 seconds)
- Click **Send** to start auto-polling

---

## 8️⃣ List Questions

### Request Setup:

1. **GET**
2. **URL**: `{{base_url}}/question-sets/{{setId}}/questions?page=1&limit=20`
3. **Headers**: Add `Authorization: Bearer {{token}}`

### Send Request:

Response:
```json
{
  "data": [
    {
      "id": "990e8400-e29b-41d4-a716-446655440010",
      "content": "What is encryption?",
      "contentVi": "Mã hóa là gì?",
      "choices": [...],
      "explanation": {...},
      "difficulty": "EASY",
      "needsReview": false,
      "topicId": "...",
      ...
    }
  ],
  "meta": { "total": 15, "page": 1, "limit": 20 }
}
```

### Filter by needsReview:

**URL**: `{{base_url}}/question-sets/{{setId}}/questions?page=1&limit=20&needsReview=true`

---

## 9️⃣ Get Question Detail

### Request Setup:

1. **GET**
2. **URL**: `{{base_url}}/question-sets/{{setId}}/questions/{{questionId}}`
3. **Headers**: Add `Authorization: Bearer {{token}}`

---

## 🔟 Update Question

### Request Setup:

1. **PATCH**
2. **URL**: `{{base_url}}/question-sets/{{setId}}/questions/{{questionId}}`
3. **Headers**: Add `Authorization: Bearer {{token}}`
4. **Body** → **raw** → **JSON**

### Body (Update difficulty):

```json
{
  "difficulty": "MEDIUM"
}
```

### Body (Update choices):

```json
{
  "choices": [
    {
      "key": "A",
      "content": "Answer A",
      "contentVi": "Đáp án A",
      "isCorrect": true
    },
    {
      "key": "B",
      "content": "Answer B",
      "contentVi": "Đáp án B",
      "isCorrect": false
    }
  ]
}
```

---

## 1️⃣1️⃣ Regenerate Explanation (AI)

### Request Setup:

1. **PATCH**
2. **URL**: `{{base_url}}/question-sets/{{setId}}/questions/{{questionId}}/explanation`
3. **Headers**: Add `Authorization: Bearer {{token}}`
4. **Body** → **raw** → **JSON**

### Body:

```json
{
  "regenerate": true
}
```

### Send:

- Gemini AI will regenerate explanation
- Response includes new explanation with `source: "ai"`

---

## 1️⃣2️⃣ Edit Explanation (Manual)

### Request Setup:

Same URL as above, but different body.

### Body:

```json
{
  "content": "My custom explanation text here",
  "regenerate": false
}
```

### Response:

```json
{
  "explanation": {
    "content": "My custom explanation text here",
    "source": "manual",
    "isVerified": true
  }
}
```

---

## 1️⃣3️⃣ Report Explanation Issue

### Request Setup:

1. **PATCH**
2. **URL**: `{{base_url}}/question-sets/{{setId}}/questions/{{questionId}}/explanation/report`
3. **Headers**: Add `Authorization: Bearer {{token}}`
4. **Body** → **raw** → **JSON**

### Body:

```json
{
  "reason": "Explanation is incomplete and confusing"
}
```

### Response:

```json
{
  "message": "Report submitted"
}
```

---

## 1️⃣4️⃣ Delete Question

### Request Setup:

1. **DELETE**
2. **URL**: `{{base_url}}/question-sets/{{setId}}/questions/{{questionId}}`
3. **Headers**: Add `Authorization: Bearer {{token}}`

### Send:

Response:
```json
{
  "message": "Deleted"
}
```

---

## 📋 Complete Test Sequence

Copy-paste this sequence to test everything:

```
1. POST /auth/register
   → Save token to environment

2. POST /question-sets
   → Save setId to environment

3. POST /question-sets/{{setId}}/topics (Optional)
   → Save topicId to environment

4. POST /question-sets/{{setId}}/import (with file upload)
   → Save jobId to environment

5. GET /question-sets/{{setId}}/import/{{jobId}}
   → Poll until status = "done"

6. GET /question-sets/{{setId}}/questions
   → View all questions

7. GET /question-sets/{{setId}}/questions/{{questionId}}
   → View single question detail

8. PATCH /question-sets/{{setId}}/questions/{{questionId}}/explanation
   → Regenerate or edit explanation

9. PATCH /question-sets/{{setId}}/questions/{{questionId}}/explanation/report
   → Report issue

10. DELETE /question-sets/{{setId}}/questions/{{questionId}}
    → Delete bad question
```

---

## 🐛 Troubleshooting

### Error: "Authorization header not found"

**Issue**: Forgot to add `Authorization` header

**Solution**:
1. Go to **Headers** tab
2. Add: `Authorization: Bearer {{token}}`
3. Make sure token is saved in environment

### Error: "Invalid file type"

**Issue**: File type doesn't match actual file

**Solution**:
- `fileType=image` for JPG/PNG files
- `fileType=pdf` for PDF files
- `fileType=text` for TXT files
- `fileType=docx` for Word documents

### Error: "File size exceeds 10MB"

**Issue**: Your file is too large

**Solution**:
- Compress the file
- Split into multiple files
- Use smaller sample file for testing

### Error: "No active import job found"

**Issue**: Maybe using wrong setId or jobId

**Solution**:
1. Verify `setId` in environment is correct
2. Verify `jobId` in environment is correct
3. Create new set and try again

### Error: "Set ID doesn't match question"

**Issue**: Trying to update question from different set

**Solution**:
- Use correct `setId` that owns the question
- Check `setId` in environment

---

## 💾 Export Postman Collection

Once you create all requests, you can share them:

1. **Top left** → Click the three dots **⋯** on your collection
2. Click **Export**
3. Format: **Collection v2.1** (recommended)
4. Choose location to save
5. Share with team members

---

## 📚 Quick Reference

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/auth/register` | Register user |
| POST | `/auth/login` | Login user |
| GET | `/auth/me` | Get current user |
| POST | `/question-sets` | Create question set |
| GET | `/question-sets` | List question sets |
| GET | `/question-sets/{id}` | Get question set detail |
| PATCH | `/question-sets/{id}` | Update question set |
| DELETE | `/question-sets/{id}` | Delete question set |
| POST | `/question-sets/{setId}/topics` | Create topic |
| GET | `/question-sets/{setId}/topics` | List topics |
| PATCH | `/question-sets/{setId}/topics/{id}` | Update topic |
| PATCH | `/question-sets/{setId}/topics/{id}/confirm` | Confirm AI topic |
| DELETE | `/question-sets/{setId}/topics/{id}` | Delete topic |
| **POST** | **`/question-sets/{setId}/import`** | **Upload file** |
| GET | `/question-sets/{setId}/import/{jobId}` | Check import status |
| GET | `/question-sets/{setId}/import` | Get import history |
| GET | `/question-sets/{setId}/questions` | List questions |
| GET | `/question-sets/{setId}/questions/{id}` | Get question detail |
| PATCH | `/question-sets/{setId}/questions/{id}` | Update question |
| DELETE | `/question-sets/{setId}/questions/{id}` | Delete question |
| PATCH | `/question-sets/{setId}/questions/{id}/explanation` | Edit/regenerate explanation |
| PATCH | `/question-sets/{setId}/questions/{id}/explanation/report` | Report issue |

---

## 🎥 Video Guide Alternative

If you prefer video:
- [Postman File Upload Tutorial](https://www.youtube.com/watch?v=pbBgP3-Rldg)
- [Postman Form Data Guide](https://www.youtube.com/watch?v=QHC5J0CYx7w)

---

## ✅ Testing Checklist

- [ ] Installed Postman
- [ ] Created environment with variables
- [ ] Registered user and saved token
- [ ] Created question set and saved setId
- [ ] Uploaded file (image/PDF/text/docx)
- [ ] Checked import status (polls until done)
- [ ] Listed questions
- [ ] Updated a question
- [ ] Regenerated explanation with AI
- [ ] Edited explanation manually
- [ ] Reported explanation issue
- [ ] Deleted a question

