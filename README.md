# AI Exam Practice App - Backend

![NestJS](https://img.shields.io/badge/NestJS-v11-red?logo=nestjs)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-v15-blue?logo=postgresql)
![TypeScript](https://img.shields.io/badge/TypeScript-v5-blue?logo=typescript)

A comprehensive backend API for an AI-powered exam practice platform. Users can create question sets, practice with adaptive learning modes, track analytics, and improve their exam performance.

## 🎯 Features

### Core Features
- ✅ User Authentication (JWT)
- ✅ Question Set Management (CRUD)
- ✅ File Import & AI Parsing (Image, PDF, Text, DOCX)
- ✅ 8 Practice Modes (Quick, Deep, Exam, Weakness, Most-Mistaken, Difficulty, Topic, Mixed)
- ✅ Comprehensive Analytics Dashboard
- ✅ User Performance Tracking
- ✅ Topic & Question Statistics
- ✅ Daily Streak System

### Advanced Features
- 🔄 Async Job Processing (BullMQ + Redis)
- 🤖 AI-Powered Question Parsing (Google Gemini)
- 📊 Detailed Performance Analytics
- 🎓 Adaptive Learning Suggestions
- 🔐 Role-based Access Control
- 📱 Ready for Mobile (Expo)

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- PostgreSQL v15+
- Redis v7+

### Installation

```bash
# Clone repository
git clone https://github.com/vuduyha1309/ai-practice-exam-app.git
cd ai-practice-exam-app

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your config

# Run database migrations
npx prisma migrate deploy

# Seed test data
npm run db:seed

# Start development server
npm run start:dev
```

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ai_exam_practice?schema=public"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Google Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# File Storage
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
```

## 📚 API Documentation

Full API documentation available in `API_COMPLETE.md`

### Base URL
```
http://localhost:3000/api/v1
```

### Key Endpoints

**Authentication**
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /auth/me` - Get current user
- `POST /auth/logout` - Logout

**Practice Sessions**
- `POST /practice-sessions` - Start session
- `PATCH /practice-sessions/:id/answer` - Submit answer
- `POST /practice-sessions/:id/end` - End session
- `GET /practice-sessions/:id/review` - Get session review

**Practice Modes**
- `POST /practice-sessions/weakness-mode` - Practice weak areas
- `POST /practice-sessions/most-mistaken-mode` - Practice mistakes
- `POST /practice-sessions/difficulty-mode` - Practice by difficulty
- `POST /practice-sessions/topic-mode` - Practice specific topic
- `POST /practice-sessions/mixed-mode` - Mix all modes

**Analytics**
- `GET /analytics/stats` - Get all stats
- `GET /analytics/weak-areas` - Get weak topics
- `GET /analytics/strength-areas` - Get strong topics
- `GET /analytics/streak` - Get daily streak
- `GET /analytics/most-mistaken` - Most mistaken questions

## 🏗️ Architecture

```
src/
├── modules/
│   ├── auth/           # Authentication
│   ├── practice/       # Practice sessions
│   ├── questions/      # Question management
│   ├── analytics/      # User analytics
│   ├── import/         # File import & parsing
│   └── ...
├── common/
│   ├── guards/         # JWT auth guard
│   ├── decorators/     # Custom decorators
│   └── services/       # Shared services
└── prisma/            # Database config
```

## 🗄️ Database Schema

Key models:
- **User** - User accounts with auth
- **QuestionSet** - Collections of questions
- **Question** - Individual questions
- **Topic** - Question categories
- **PracticeSession** - User practice sessions
- **SessionAnswer** - User answers in sessions
- **UserQuestionStat** - User stats per question
- **UserTopicStat** - User stats per topic
- **StreakLog** - Daily practice streaks

## 🧪 Testing

### With Seed Data
```bash
npm run db:seed
```

### API Testing
See `ANALYTICS_API_EXAMPLES.md` for curl examples

### Test Token
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmN2QxN2U4Yy0xNGU5LTRhZTUtYjAxNi1kZmExMTAyY2RlMmYiLCJpYXQiOjE3ODM1NjE1MzYsImV4cCI6MTc4NDE2NjMzNn0.eHrXYf_qjQ1-tbDvFdrJt8WngXEzphts-UF_HDKghOg
```

## 📦 Deployment

### Railway (Recommended)
1. Create account on railway.app
2. Connect GitHub repository
3. Set environment variables
4. Deploy automatically

### Docker
```bash
docker build -t ai-exam-practice .
docker run -p 3000:3000 ai-exam-practice
```

## 🛠️ Development

```bash
# Build
npm run build

# Format code
npm run format

# Lint
npm run lint

# Database migrations
npx prisma migrate dev --name migration_name

# Seed data
npm run db:seed
```

## 📖 Additional Resources

- `API_COMPLETE.md` - Complete API documentation
- `ANALYTICS_API_EXAMPLES.md` - Analytics endpoints with examples
- `SETUP.md` - Detailed setup guide
- `QUICK_START.md` - Quick start guide

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/amazing-feature`
2. Commit changes: `git commit -m 'Add amazing feature'`
3. Push to branch: `git push origin feature/amazing-feature`
4. Open Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Vu Duy Ha**
- GitHub: [@vuduyha1309](https://github.com/vuduyha1309)

## 📞 Support

For support, email: support@aiexampractice.com or create an issue on GitHub.

---

**Status**: ✅ MVP Ready | 🚀 Production Ready | 📱 Mobile Ready (Expo)
