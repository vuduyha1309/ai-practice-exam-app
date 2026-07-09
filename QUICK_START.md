# Quick Start Guide

## Prerequisites Installed ✅
- Node.js 20+
- pnpm
- NestJS CLI
- Docker Desktop (with WSL2 on Windows)

## 1. Start Services (One-time)

```bash
# Navigate to project
cd ai-exam-practice

# Start Docker services (PostgreSQL + Redis)
docker compose -f docker/docker-compose.yml --env-file .env up -d

# Verify containers running
docker ps
```

## 2. Configure Environment

Update `.env` with your actual credentials:
```env
JWT_SECRET=your-strong-secret-key-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-secret
ANTHROPIC_API_KEY=your-anthropic-key
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
```

## 3. Start Development Server

```bash
# Install dependencies (first time only)
pnpm install

# Run in development mode
pnpm run start:dev
```

Server runs on: `http://localhost:3000`

## 4. Verify Setup

```bash
# Test database connection
npx prisma studio

# View database in browser at http://localhost:5555
```

## Development Workflow

```bash
# Watch mode (auto-restart on changes)
pnpm run start:dev

# Build for production
pnpm run build

# Run production build
pnpm run start

# Lint code
pnpm run lint

# Format code
pnpm run format

# Run tests
pnpm run test
```

## Common Tasks

### Add New Module
```bash
nest g module modules/your-module
nest g controller modules/your-module
nest g service modules/your-module
```

### Create a New Migration
After editing `prisma/schema.prisma`:
```bash
npx prisma migrate dev --name describe_changes
```

### View Database
```bash
# Prisma Studio (GUI)
npx prisma studio

# PostgreSQL CLI
docker exec -it exam_postgres psql -U postgres -d ai_exam_practice
```

### Reset Database (⚠️ Deletes all data)
```bash
npx prisma migrate reset
```

## Stop Services

```bash
# Stop containers but keep data
docker compose -f docker/docker-compose.yml stop

# Stop and remove containers (keeps data in volumes)
docker compose -f docker/docker-compose.yml down

# Stop and delete everything (DANGEROUS)
docker compose -f docker/docker-compose.yml down -v
```

## Troubleshooting

### "Can't reach database server"
```bash
# Check Docker status
docker ps

# Restart services
docker compose -f docker/docker-compose.yml restart
```

### Port 3000 already in use
Edit `.env`:
```env
PORT=3001  # Change to another port
```

### Build errors
```bash
# Clear cache and reinstall
rm -rf node_modules dist
pnpm install
pnpm run build
```

## Next Steps
1. Implement Auth module (login, register, Google OAuth)
2. Create User service and endpoints
3. Build Question management features
4. Add practice session logic
5. Integrate AI explanations

---

For detailed setup documentation, see [SETUP.md](./SETUP.md)
