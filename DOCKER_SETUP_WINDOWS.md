# Docker Desktop Setup Guide for Windows

## 📋 Prerequisites

- **Windows 10/11** (Pro, Enterprise, or Education)
- **At least 4GB RAM** (8GB recommended)
- **20GB free disk space**
- **Virtualization enabled** in BIOS (for Hyper-V)

## 🔧 System Requirements Check

### Check Windows Version
```powershell
# Open PowerShell as Administrator
winver
```
Required: Windows 10 version 2004+ or Windows 11

### Check Virtualization (Hyper-V)
```powershell
# Run as Administrator
wmic os get caption
Get-ComputerInfo | Select-Object WindowsVersion
```

### Enable Hyper-V (if not enabled)
```powershell
# Run PowerShell as Administrator
Enable-WindowsOptionalFeature -Online -FeatureName Hyper-V -All

# Then restart computer
Restart-Computer
```

---

## 📥 Installation Steps

### Step 1: Download Docker Desktop

1. Visit: https://www.docker.com/products/docker-desktop
2. Click **"Download for Windows"**
3. Choose **"Docker Desktop for Windows"** (usually auto-detected)
4. Wait for download to complete (~500MB)

### Step 2: Install Docker Desktop

1. **Open installer**: `Docker Desktop Installer.exe`
2. **Grant permissions**: Click "Yes" when prompted for Admin access
3. **Select options**:
   - ✅ Install required Windows components
   - ✅ Add Docker to PATH
   - ✅ Use WSL 2 instead of Hyper-V (recommended)
4. **Click "Install"** and wait for completion
5. **Restart computer** when prompted

### Step 3: Start Docker Desktop

1. Click **Start Menu** → Search "Docker"
2. Open **"Docker Desktop"**
3. Wait for Docker icon to appear in system tray
4. Status shows: "Docker Desktop is running"

---

## ✅ Verify Installation

### Test Docker Installation
```powershell
# Open PowerShell or Command Prompt
docker --version
# Expected: Docker version 24.x.x or higher

docker run hello-world
# Expected: "Hello from Docker!" message
```

---

## 🚀 Quick Start with AI Exam Practice App

### 1. Clone Repository
```powershell
git clone https://github.com/vuduyha1309/ai-practice-exam-app.git
cd ai-practice-exam-app
```

### 2. Create Environment File
```powershell
# Copy the docker-compose from docker folder
Copy-Item -Path "docker/docker-compose.yml" -Destination "./"

# Create .env file with:
@"
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=ai_exam_practice
JWT_SECRET=your-super-secret-key-change-this
GEMINI_API_KEY=your-gemini-api-key-here
"@ | Out-File -Encoding UTF8 .env
```

### 3. Start Services
```powershell
# Navigate to project root
cd ai-practice-exam-app

# Start all services
docker-compose up -d

# Check status
docker-compose ps
# Expected: 3 running containers (postgres, redis, backend)
```

### 4. Initialize Database
```powershell
# Run migrations
docker-compose exec backend npx prisma migrate deploy

# Seed test data
docker-compose exec backend npm run db:seed
```

### 5. Access Services
- **API**: http://localhost:3000/api/v1
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### 6. View Logs
```powershell
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f postgres
docker-compose logs -f redis
```

### 7. Stop Services
```powershell
docker-compose down
```

---

## 🆘 Troubleshooting

### Error: "Docker daemon is not running"
```powershell
# Solution: Start Docker Desktop
# Check system tray for Docker icon and click to start
```

### Error: "Hyper-V is not enabled"
```powershell
# Run as Administrator:
Enable-WindowsOptionalFeature -Online -FeatureName Hyper-V -All
Restart-Computer
```

### Error: "Port 5432 is already in use"
```powershell
# Solution: Change port in docker-compose.yml
# Change: "5432:5432" to "5433:5432"
# Then: docker-compose up -d
```

### Error: "Insufficient disk space"
```powershell
# Check disk space:
Get-Volume

# Free up space or:
# Settings → Apps → Docker → Uninstall other unused apps
```

### Container exits immediately
```powershell
# Check logs:
docker-compose logs backend

# Common issues:
# - Missing environment variables in .env
# - Database not ready (wait 30 seconds)
# - Port already in use
```

### Can't connect to PostgreSQL
```powershell
# Verify container is running:
docker-compose ps

# Check PostgreSQL logs:
docker-compose logs postgres

# Manual test:
docker exec -it exam_postgres psql -U postgres -d ai_exam_practice
```

---

## 📊 Docker Desktop Settings (Optional)

### Increase Resources (if needed)
1. Open **Docker Desktop**
2. Click **Settings** (gear icon)
3. Go to **Resources**
4. **Adjust**:
   - CPUs: 4+ (recommended)
   - Memory: 6-8GB (recommended)
   - Disk: 50GB+ (recommended)
5. Click **Apply & Restart**

### Enable WSL 2 (Recommended)
1. Settings → General
2. ✅ Enable WSL 2

### File Sharing
1. Settings → Resources → File Sharing
2. Add project folder to shared paths

---

## 🎓 Common Docker Commands

```powershell
# List running containers
docker ps

# List all containers
docker ps -a

# View logs
docker logs <container-name>

# Execute command in container
docker exec -it <container-name> <command>

# Stop container
docker stop <container-name>

# Remove container
docker rm <container-name>

# Remove image
docker rmi <image-name>

# Clean up unused resources
docker system prune -a
```

---

## 📚 Additional Resources

- **Docker Docs**: https://docs.docker.com/desktop/install/windows-install/
- **Docker Tutorial**: https://docs.docker.com/get-started/
- **Compose Reference**: https://docs.docker.com/compose/compose-file/

---

## ✅ Verification Checklist

- [ ] Docker Desktop installed
- [ ] Docker daemon running
- [ ] `docker --version` works
- [ ] `docker run hello-world` works
- [ ] docker-compose.yml in project root
- [ ] .env file created with API keys
- [ ] `docker-compose up -d` runs successfully
- [ ] All 3 containers running (`docker-compose ps`)
- [ ] Database migrations completed
- [ ] Seed data loaded
- [ ] API accessible at http://localhost:3000/api/v1

---

## 🎉 You're Ready!

Your AI Exam Practice App backend is now running in Docker!

**Next steps**:
- Test API endpoints: http://localhost:3000/api/v1/auth/me
- Start building your Expo frontend
- Deploy to production (Railway)

**Questions?** Check logs with `docker-compose logs -f`
