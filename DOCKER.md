# 🐳 Docker Guide for TxRay

This guide covers Docker setup, building, and deployment for the TxRay monorepo.

## 🚀 Quick Start

### 1. Build All Images
```bash
# Build with default tag (latest)
pnpm docker:build

# Build with custom tag
pnpm docker:build -t v1.0.0

# Build and push to registry
pnpm docker:build -t v1.0.0 -p
```

### 2. Run Production Environment
```bash
# Start all services
pnpm docker:up

# View logs
pnpm docker:logs

# Stop all services
pnpm docker:down
```

### 3. Run Development Environment
```bash
# Start development services with hot reload
pnpm docker:dev

# View development logs
docker-compose -f docker-compose.dev.yml logs -f
```

## 🏗️ Architecture

### Multi-Stage Builds
- **Base Stage**: Install dependencies and setup environment
- **Builder Stage**: Build TypeScript and compile assets
- **Runner Stage**: Production-optimized runtime

### Services
- **Web**: Next.js frontend (port 3000)
- **API**: Express.js backend (port 3001)
- **Supabase**: PostgreSQL database (port 5432)
- **Redis**: Caching layer (port 6379)
- **Nginx**: Reverse proxy (ports 80, 443)

## 🔧 Configuration

### Environment Variables
Copy `docker/env.docker.example` to `docker/.env.docker`:
```bash
cp docker/env.docker.example docker/.env.docker
# Edit docker/.env.docker with your values
```

### Docker Compose Files
- **`docker/docker-compose.yml`**: Production configuration
- **`docker/docker-compose.dev.yml`**: Development with hot reload

## 📦 Image Details

### Web App (`Dockerfile.web`)
- **Base**: Node.js 18 Alpine
- **Features**: Multi-stage build, standalone Next.js
- **Port**: 3000
- **Health Check**: Built-in Next.js health endpoint

### API (`Dockerfile.api`)
- **Base**: Node.js 18 Alpine
- **Features**: Multi-stage build, health checks
- **Port**: 3001
- **Health Check**: `/health` endpoint

### UI Package (`Dockerfile.ui`)
- **Base**: Node.js 18 Alpine
- **Purpose**: Shared component library
- **Output**: Built CSS and TypeScript

## 🚀 Deployment

### Local Development
```bash
# Start development environment
docker-compose -f docker/docker-compose.dev.yml up -d

# View logs
docker-compose -f docker/docker-compose.dev.yml logs -f

# Stop development environment
docker-compose -f docker/docker-compose.dev.yml down
```

### Production
```bash
# Start production environment
docker-compose -f docker/docker-compose.yml up -d

# Scale services
docker-compose -f docker/docker-compose.yml up -d --scale api=3 --scale web=2

# View production logs
docker-compose -f docker/docker-compose.yml logs -f
```

### Custom Registry
```bash
# Build and tag for custom registry
./scripts/docker-build.sh -t v1.0.0

# Tag for your registry
docker tag txray/web:v1.0.0 your-registry.com/txray/web:v1.0.0
docker tag txray/api:v1.0.0 your-registry.com/txray/api:v1.0.0

# Push to registry
docker push your-registry.com/txray/web:v1.0.0
docker push your-registry.com/txray/api:v1.0.0
```

## 🔍 Monitoring & Debugging

### Health Checks
```bash
# Check service health
docker-compose ps

# View health check logs
docker-compose logs api | grep health
```

### Resource Usage
```bash
# Monitor resource usage
docker stats

# View container details
docker inspect txray-api
```

### Debugging
```bash
# Access running container
docker exec -it txray-api sh

# View container logs
docker logs txray-api -f

# Check container environment
docker exec txray-api env
```

## 🛠️ Customization

### Adding New Services
1. Create new Dockerfile
2. Add service to `docker-compose.yml`
3. Update build script in `scripts/docker-build.sh`

### Environment-Specific Configs
```bash
# Production
docker-compose -f docker/docker-compose.yml -f docker/docker-compose.prod.yml up

# Staging
docker-compose -f docker/docker-compose.yml -f docker/docker-compose.staging.yml up
```

### Volume Mounts
```bash
# Persistent data
volumes:
  - ./data:/app/data
  - ./logs:/app/logs

# Development mounts
volumes:
  - ./src:/app/src
  - ./config:/app/config
```

## 🔒 Security Best Practices

### Non-Root Users
- All containers run as non-root users
- Proper file permissions
- Minimal runtime dependencies

### Health Checks
- Built-in health endpoints
- Automatic restart policies
- Resource limits

### Network Security
- Isolated networks
- Port exposure control
- Service-to-service communication

## 📚 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache
```

#### Port Conflicts
```bash
# Check port usage
lsof -i :3000
lsof -i :3001

# Use different ports
docker-compose up -p 3002:3000
```

#### Memory Issues
```bash
# Increase Docker memory limit
# Docker Desktop > Settings > Resources > Memory

# Monitor memory usage
docker stats --no-stream
```

#### Permission Issues
```bash
# Fix file permissions
sudo chown -R $USER:$USER .

# Check container user
docker exec -it txray-api whoami
```

## 🎯 Performance Optimization

### Build Optimization
- Multi-stage builds
- Layer caching
- Dependency optimization

### Runtime Optimization
- Alpine Linux base images
- Minimal production dependencies
- Health check optimization

### Network Optimization
- Service discovery
- Load balancing
- Connection pooling

## 🔄 CI/CD Integration

### GitHub Actions
- Automatic builds on `v*-docker` tags (e.g., `v0.0.1-docker`)
- Multi-platform builds (AMD64, ARM64)
- Registry pushing
- Artifact generation

### Build Commands
```bash
# CI/CD build
docker buildx build --platform linux/amd64,linux/arm64 -t txray/web:latest .

# Local build
docker build -t txray/web:latest .
```

## 📖 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [Multi-stage Builds](https://docs.docker.com/develop/dev-best-practices/multistage-build/)
- [Docker Security](https://docs.docker.com/engine/security/)
