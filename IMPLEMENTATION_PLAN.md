# Implementation Plan

## 📋 Module Development Checklist

### Phase 1: Core Infrastructure ⚙️

- [x] Project scaffolding
- [x] Database setup (Prisma + PostgreSQL)
- [x] Cache setup (Redis)
- [x] Environment configuration
- [x] Docker setup
- [ ] **Logger service** - centralized logging
- [ ] **Error handling** - custom exception filters
- [ ] **Validation pipes** - request validation

### Phase 2: Authentication & Users 🔐

#### Auth Module
- [ ] JWT strategy (`src/modules/auth/strategies/jwt.strategy.ts`)
- [ ] Local strategy (email/password login)
- [ ] Google OAuth strategy
- [ ] Auth service with login/register logic
- [ ] Auth controller (POST /auth/login, /auth/register, /auth/google/callback)
- [ ] Password hashing (bcrypt)
- [ ] Refresh token logic
- [ ] Email verification (optional)

#### Users Module
- [ ] Users service (CRUD operations)
- [ ] Users controller (GET /users/profile, PATCH /users/profile)
- [ ] User DTO (UpdateUserDto, UserResponseDto)
- [ ] Profile picture upload endpoint
- [ ] Subscription relation query optimization

**Files to Create**:
```typescript
auth/
  ├── strategies/
  │   ├── jwt.strategy.ts
  │   ├── local.strategy.ts
  │   └── google.strategy.ts
  ├── auth.service.ts
  ├── auth.controller.ts
  ├── dto/
  │   ├── login.dto.ts
  │   ├── register.dto.ts
  │   └── oauth.dto.ts
  └── decorators/
      └── auth.decorator.ts (optional)

users/
  ├── users.service.ts
  ├── users.controller.ts
  └── dto/
      ├── update-user.dto.ts
      └── user-response.dto.ts
```

### Phase 3: Question Management 📚

#### Question Sets Module
- [ ] QuestionSet service (CRUD)
- [ ] QuestionSet controller
- [ ] Visibility control (private/public/shared)
- [ ] List user's question sets
- [ ] Share question sets with other users
- [ ] Soft delete archive functionality

#### Questions Module
- [ ] Question service (CRUD)
- [ ] Question controller
- [ ] Bulk operations (create multiple)
- [ ] Topic association
- [ ] Difficulty level management
- [ ] Question review status tracking
- [ ] Search/filter questions

#### Topics Management
- [ ] Automatic topic detection from questions
- [ ] User confirmation of AI-suggested topics
- [ ] Topic stats calculation
- [ ] Topic-based filtering

**Files to Create**:
```typescript
question-sets/
  ├── question-sets.service.ts
  ├── question-sets.controller.ts
  └── dto/
      ├── create-question-set.dto.ts
      ├── update-question-set.dto.ts
      └── question-set-response.dto.ts

questions/
  ├── questions.service.ts
  ├── questions.controller.ts
  └── dto/
      ├── create-question.dto.ts
      ├── update-question.dto.ts
      └── question-response.dto.ts
```

### Phase 4: File Import & AI Parsing 🤖

#### Import Module
- [ ] Import service (orchestration)
- [ ] File upload handler (multipart/form-data)
- [ ] S3 upload integration
- [ ] BullMQ job processor setup
- [ ] AI parsing integration
- [ ] Error handling & retry logic
- [ ] Import job tracking & status updates

#### AI Integration
- [ ] Anthropic API wrapper service
- [ ] Question extraction from image/PDF
- [ ] Auto-topic detection
- [ ] Explanation generation
- [ ] Translation support (English ↔ Vietnamese)
- [ ] Confidence scoring
- [ ] Usage logging & quota tracking

**Files to Create**:
```typescript
import/
  ├── import.service.ts
  ├── import.controller.ts
  ├── processors/
  │   └── import.processor.ts (BullMQ job)
  └── dto/
      ├── upload-file.dto.ts
      └── import-job-response.dto.ts

ai/
  ├── ai.service.ts (main orchestrator)
  ├── providers/
  │   └── anthropic.provider.ts
  ├── dto/
  │   ├── parse-response.dto.ts
  │   ├── explanation-request.dto.ts
  │   └── translation-request.dto.ts
  └── constants/
      └── prompts.ts (system prompts)
```

### Phase 5: Practice Sessions & Analytics 📊

#### Practice Module
- [ ] PracticeSession service
- [ ] PracticeSession controller
- [ ] Start practice endpoint
- [ ] Submit answer endpoint
- [ ] End session endpoint
- [ ] Practice modes (quick, deep, exam, weakness)
- [ ] Question randomization/ordering
- [ ] Session timer tracking

#### Analytics Module
- [ ] User stats calculation
- [ ] Question stats update (accuracy, attempts, streak)
- [ ] Topic stats calculation
- [ ] Streak logging (daily)
- [ ] Weak areas identification
- [ ] Performance trends
- [ ] Analytics endpoint (GET /analytics/dashboard)

**Files to Create**:
```typescript
practice/
  ├── practice.service.ts
  ├── practice.controller.ts
  ├── processors/
  │   └── ai-feedback.processor.ts (BullMQ - AI explanation job)
  └── dto/
      ├── start-session.dto.ts
      ├── submit-answer.dto.ts
      └── session-response.dto.ts

analytics/
  ├── analytics.service.ts
  ├── analytics.controller.ts
  ├── processors/
  │   └── analytics.processor.ts (BullMQ - async calc)
  └── dto/
      └── analytics-dashboard.dto.ts
```

### Phase 6: Subscriptions & Usage Tracking 💳

#### Subscriptions Module
- [ ] Subscription service
- [ ] Subscription controller
- [ ] Plan management (free, pro, unlimited)
- [ ] Quota checking
- [ ] Period management
- [ ] Cancellation logic
- [ ] Stripe/payment integration (optional)

#### AI Usage Tracking
- [ ] Log all AI API calls
- [ ] Track token usage (input/output)
- [ ] Calculate costs
- [ ] Implement quota limits per plan
- [ ] Quota reset on period end
- [ ] Usage alerts/notifications

**Files to Create**:
```typescript
subscriptions/
  ├── subscriptions.service.ts
  ├── subscriptions.controller.ts
  ├── dto/
  │   ├── create-subscription.dto.ts
  │   └── subscription-response.dto.ts
  └── processors/
      └── subscription-renewal.processor.ts
```

### Phase 7: Advanced Features 🚀

#### Offline Support
- [ ] Offline download management
- [ ] Sync status tracking
- [ ] Conflict resolution on sync
- [ ] Mobile sync endpoints

#### Advanced Analytics
- [ ] Predictive weak areas
- [ ] Learning path recommendations
- [ ] Performance forecasting
- [ ] Comparative analytics

#### Admin Features
- [ ] User management dashboard
- [ ] Question review workflow
- [ ] Import job monitoring
- [ ] Analytics export

### Phase 8: Testing & Deployment 🧪

- [ ] Unit tests for services
- [ ] Integration tests for controllers
- [ ] E2E tests for workflows
- [ ] Performance testing (load)
- [ ] API documentation (Swagger)
- [ ] CI/CD pipeline setup
- [ ] Production deployment

## 🎯 Priority Order

### Week 1-2: MVP Core
1. ✅ Infrastructure setup
2. **Auth & Users** (complete login/register)
3. **Question management** (basic CRUD)
4. **Practice sessions** (basic session tracking)

### Week 3-4: AI Integration
5. **File import** (upload + parsing)
6. **AI explanations** (basic + translation)
7. **Analytics** (basic stats)

### Week 5+: Polish & Advanced
8. Subscriptions & quotas
9. Advanced analytics
10. Admin dashboard
11. Testing & deployment

## 📝 Important Notes

### Code Organization
- Keep services slim, business logic in services
- Controllers only handle HTTP concerns
- DTOs for type safety and API contracts
- Use interfaces for dependencies (dependency injection)
- Common utilities in `src/common/`

### Database Optimization
- Use Prisma's `select` to avoid fetching all fields
- Implement pagination for list endpoints
- Add database indexes for frequently queried fields
- Cache frequently accessed data (Redis)

### Security Checklist
- [ ] Validate all inputs (class-validator)
- [ ] Sanitize file uploads
- [ ] Implement rate limiting
- [ ] CORS configuration
- [ ] SQL injection prevention (Prisma handles this)
- [ ] Password hashing (bcrypt)
- [ ] JWT token validation
- [ ] Role-based access control (RBAC)

### Performance Optimization
- [ ] Lazy load relations
- [ ] Query result pagination
- [ ] Redis caching for user sessions
- [ ] BullMQ for async jobs
- [ ] Image optimization before S3 upload
- [ ] Database query optimization

### Logging & Monitoring
- [ ] Structured logging (Winston)
- [ ] Error tracking (Sentry optional)
- [ ] Performance monitoring
- [ ] API usage tracking

## 🚀 Getting Started

1. **Run development server**: `pnpm run start:dev`
2. **Create first module**: `nest g service modules/auth`
3. **Implement auth endpoints** first
4. **Test with Postman/Insomnia**
5. **Add more modules incrementally**

## 📚 Commands for Development

```bash
# Generate new module/service/controller
nest g module modules/feature-name
nest g service modules/feature-name
nest g controller modules/feature-name
nest g class modules/feature-name/dto/create-feature.dto

# Database
npx prisma migrate dev --name your_migration_name
npx prisma studio

# Testing
pnpm run test
pnpm run test:e2e
pnpm run test:cov

# Code quality
pnpm run lint
pnpm run format

# Build
pnpm run build
pnpm run start:prod
```

---

**Ready to start building! 🎉**
Start with the Auth module and expand from there.
