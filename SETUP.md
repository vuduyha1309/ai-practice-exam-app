# AI Exam Practice App - Setup Complete ✅

## Project Overview
A NestJS backend for an AI-powered exam practice platform with:
- User authentication (Email + Google OAuth)
- Question bank management with AI parsing
- Practice sessions with adaptive learning
- Analytics & streak tracking
- Subscription management
- AI-powered explanations (Anthropic Claude)
- Offline support
- File uploads (AWS S3)

## Tech Stack
- **Runtime**: Node.js 20+
- **Framework**: NestJS
- **Database**: PostgreSQL 16
- **Cache/Queue**: Redis 7
- **ORM**: Prisma v7
- **Auth**: JWT + Passport
- **Job Queue**: BullMQ
- **AI**: Anthropic API
- **File Storage**: AWS S3
- **Package Manager**: pnpm

## Setup Completed ✅

### 1. Project Structure Created
```
src/
├── modules/
│   ├── auth/              (JWT + Google OAuth)
│   ├── users/             (User management)
│   ├── question-sets/     (Question bank)
│   ├── questions/         (Individual questions)
│   ├── import/            (File import with AI)
│   ├── practice/          (Practice sessions)
│   ├── ai/                (AI integration)
│   ├── analytics/         (Analytics & stats)
│   └── subscriptions/     (Subscription plans)
├── prisma/                (Database service)
├── common/
│   ├── guards/            (JWT auth guard)
│   ├── decorators/        (Current user decorator)
│   └── interceptors/
└── app.module.ts          (Main module)
```

### 2. Database & Services Running
- ✅ PostgreSQL 16 (Port 5432)
- ✅ Redis 7 (Port 6379)
- ✅ Prisma Migration Created (tables initialized)

### 3. Environment Configuration
- `.env` - Development environment variables
- `.env.example` - Template for git
- `docker/docker-compose.yml` - Container orchestration
- `prisma.config.ts` - Prisma CLI config

### 4. Database Schema
Advanced Prisma schema with:
- User authentication (email + OAuth providers)
- Subscription & AI usage tracking
- Question sets with topics
- Practice sessions & answers
- Analytics (user stats per question/topic)
- Offline download support
- Import jobs for batch processing

**Key Enums Defined**:
- AuthProvider, VisibilityType, SourceType
- DifficultyLevel, QuestionStatus
- PracticeMode, SessionStatus
- SubscriptionPlan, SubscriptionStatus
- AiFeatureType, ImportStatus

## Next Steps

### 1. Update Environment Variables
Edit `.env` and add your actual credentials:
```env
# Auth
JWT_SECRET=<generate-a-strong-secret>
GOOGLE_CLIENT_ID=<your-client-id>
GOOGLE_CLIENT_SECRET=<your-client-secret>

# AI
ANTHROPIC_API_KEY=<your-anthropic-key>

# AWS S3
AWS_ACCESS_KEY_ID=<your-key>
AWS_SECRET_ACCESS_KEY=<your-secret>
S3_BUCKET_NAME=<your-bucket>
```

### 2. Implement Core Modules

**Priority 1 - Auth Module**:
```bash
# Create JWT strategy, Google OAuth strategy
# Implement login, register, oauth endpoints
```

**Priority 2 - Users Module**:
```bash
# Create user service, controller
# User profile endpoints
```

**Priority 3 - Question Management**:
```bash
# Question set CRUD operations
# Topic management
# Question import with AI parsing
```

### 3. Start Development Server
```bash
# Option 1: Development mode with hot reload
pnpm run start:dev

# Option 2: Production build
pnpm run build
pnpm run start

# Option 3: Debug mode
pnpm run start:debug
```

### 4. Useful Commands

**Database Management**:
```bash
# Open Prisma Studio (GUI for database)
npx prisma studio

# Create new migration after schema changes
npx prisma migrate dev --name <migration-name>

# Reset database (DANGEROUS - deletes all data)
npx prisma migrate reset

# Generate Prisma Client after schema changes
npx prisma generate
```

**Docker**:
```bash
# View running containers
docker ps

# View logs
docker logs exam_postgres
docker logs exam_redis

# Stop all services
docker compose -f docker/docker-compose.yml down

# Stop and remove volumes (reset data)
docker compose -f docker/docker-compose.yml down -v
```

**Development**:
```bash
# Lint & fix
pnpm run lint

# Format code
pnpm run format

# Run tests
pnpm run test
pnpm run test:e2e
```

## API Base URL
Once running: `http://localhost:3000`

## Database Access
- **Prisma Studio**: `npx prisma studio`
- **PostgreSQL CLI**: 
  ```bash
  docker exec -it exam_postgres psql -U postgres -d ai_exam_practice
  ```

## File Structure by Feature

```
modules/
├── auth/
│   ├── auth.module.ts
│   ├── strategies/
│   │   ├── jwt.strategy.ts
│   │   ├── google.strategy.ts
│   │   └── local.strategy.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── dto/
│       ├── login.dto.ts
│       └── register.dto.ts
│
├── users/
│   ├── users.module.ts
│   ├── users.controller.ts
│   ├── users.service.ts
│   └── dto/
│
├── question-sets/
│   ├── question-sets.module.ts
│   ├── question-sets.controller.ts
│   ├── question-sets.service.ts
│   └── dto/
│
├── questions/
│   ├── questions.module.ts
│   ├── questions.controller.ts
│   ├── questions.service.ts
│   └── dto/
│
├── import/
│   ├── import.module.ts
│   ├── import.controller.ts
│   ├── import.service.ts
│   ├── processors/
│   │   └── import.processor.ts (BullMQ job)
│   └── dto/
│
├── practice/
│   ├── practice.module.ts
│   ├── practice.controller.ts
│   ├── practice.service.ts
│   └── dto/
│
├── ai/
│   ├── ai.module.ts
│   ├── ai.service.ts
│   ├── providers/
│   │   └── anthropic.provider.ts
│   └── dto/
│
├── analytics/
│   ├── analytics.module.ts
│   ├── analytics.controller.ts
│   ├── analytics.service.ts
│   └── dto/
│
└── subscriptions/
    ├── subscriptions.module.ts
    ├── subscriptions.controller.ts
    ├── subscriptions.service.ts
    └── dto/
```

## Notes
- Database tables are automatically created from Prisma schema
- Prisma Client is auto-generated in node_modules
- All migrations tracked in `prisma/migrations/`
- BullMQ processes run via Redis for async jobs
- JWT tokens expire in 7 days (configurable via .env)
- UUIDs used for all primary keys (PostgreSQL native UUID)

## Troubleshooting

**Database Connection Error**:
```bash
# Check if Docker containers are running
docker ps

# Restart services
docker compose -f docker/docker-compose.yml down
docker compose -f docker/docker-compose.yml up -d
```

**Prisma Generate Error**:
```bash
# Clear cache and regenerate
rm -rf node_modules/.prisma
npx prisma generate
```

**Port Conflicts**:
- Change ports in `.env` and `docker-compose.yml`
- Default: PostgreSQL 5432, Redis 6379, NestJS 3000

## Ready to Code! 🚀
The foundation is set up. Start implementing your features in the modules!
