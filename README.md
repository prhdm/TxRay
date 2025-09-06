# TxRay

A modern full-stack application built with Next.js, Express.js, and Supabase, organized as a Turborepo monorepo.

## 🏗️ Architecture

- **Frontend**: Next.js 15 with React 19
- **Backend**: Express.js API with TypeScript
- **Database**: Supabase (PostgreSQL + Auth + Real-time)
- **Hosting**: Vercel (Frontend + Backend)
- **Package Manager**: pnpm
- **Monorepo**: Turborepo

## 📁 Project Structure

```
TxRay/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # Express.js backend
├── packages/
│   ├── ui/           # Shared UI components
│   ├── eslint-config/ # Shared ESLint config
│   └── typescript-config/ # Shared TypeScript config
├── docker/            # Docker configurations
│   ├── Dockerfile.*   # Multi-stage builds
│   ├── docker-compose*.yml # Service orchestration
│   └── env.docker.example # Environment template
├── scripts/           # Build and utility scripts
├── .github/           # GitHub Actions workflows
├── turbo.json         # Turborepo configuration
└── pnpm-workspace.yaml
```

## 🔗 Deployed Services

### Supabase Edge Functions
- **Analytics**: `https://kwhmqawvfkbnwmpzwnru.supabase.co/functions/v1/analytics`
- **Indexer**: `https://kwhmqawvfkbnwmpzwnru.supabase.co/functions/v1/indexer`

The application is configured to use these deployed edge functions for production use.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm 9+

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd TxRay

# Install dependencies
pnpm install

# Set up environment variables
cp apps/web/env.example apps/web/.env.local
cp apps/api/env.example apps/api/.env
```

### Development

```bash
# Start all applications
pnpm dev

# Start only frontend
pnpm dev:web

# Start only backend
pnpm dev:api

# Build all applications
pnpm build

# Lint code
pnpm lint

# Type check
pnpm check-types
```

## 🌐 Development URLs

- **Frontend**: http://localhost:3000
- **Backend**: Supabase Edge Functions (serverless)
- **API**: No separate API needed - fully frontend-only

## 🔧 Environment Variables

### Frontend (apps/web/.env.local)
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
# API URL no longer needed - using Supabase Edge Functions
```

### Supabase Edge Functions (Environment Variables set in Supabase Dashboard)
```bash
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret
APP_ORIGIN=http://localhost:3000
```

## 🚀 Deployment

### Vercel Deployment
See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions on deploying to Vercel and Supabase.

### Docker Deployment
```bash
# Build all Docker images
./scripts/docker-build.sh

# Run with Docker Compose
docker-compose -f docker/docker-compose.yml up

# Run development environment
docker-compose -f docker/docker-compose.dev.yml up

# Build with custom tag
./scripts/docker-build.sh -t v1.0.0

# Build and push to registry
./scripts/docker-build.sh -t v1.0.0 -p
```

### GitHub Actions
- **Production Deployment**: Push tag `v0.0.1-production` to trigger Vercel deployment
- **Docker Builds**: Push tag `v0.0.1-docker` to build and push Docker images

### Quick Tagging
```bash
# Deploy to production
pnpm tag:prod -v 0.0.1 -p

# Build Docker images
pnpm tag:docker -v 0.0.1 -p

# Or use the script directly
./scripts/tag-and-deploy.sh -v 0.0.1 -t production -p
./scripts/tag-and-deploy.sh -v 0.0.1 -t docker -p
```

## 📚 Available Scripts

- `pnpm build` - Build all applications
- `pnpm dev` - Start all applications in development mode
- `pnpm dev:web` - Start only the frontend
- `pnpm dev:api` - Start only the backend
- `pnpm lint` - Lint all applications
- `pnpm check-types` - Type check all applications
- `pnpm format` - Format code with Prettier
- `pnpm tag:prod` - Create production deployment tag
- `pnpm tag:docker` - Create Docker build tag

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15
- **Language**: TypeScript
- **Styling**: CSS Modules
- **UI Components**: Custom component library

### Backend
- **Framework**: Express.js
- **Language**: TypeScript
- **Security**: Helmet, CORS
- **Database**: Supabase

### Infrastructure
- **Hosting**: Vercel
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

- Check the [deployment guide](./DEPLOYMENT.md)
- Review [Turborepo docs](https://turbo.build/repo/docs)
- Check [Next.js docs](https://nextjs.org/docs)
- Review [Supabase docs](https://supabase.com/docs)
