# TxRay Deployment Guide

This guide covers deploying your TxRay application to Vercel (frontend + backend) and Supabase (database + auth).

## 🏷️ Tag-Based Deployments

### Vercel Deployment
Push a tag with the `-production` suffix to trigger automatic deployment:
```bash
# Deploy version 0.0.1 to production
git tag v0.0.1-production
git push origin v0.0.1-production
```

### Docker Builds
Push a tag with the `-docker` suffix to build and push Docker images:
```bash
# Build and push Docker images for version 0.0.1
git tag v0.0.1-docker
git push origin v0.0.1-docker
```

### Tag Format
- **Production**: `v{version}-production` (e.g., `v0.0.1-production`)
- **Docker**: `v{version}-docker` (e.g., `v0.0.1-docker`)

## Prerequisites

- [Vercel account](https://vercel.com)
- [Supabase account](https://supabase.com)
- [GitHub/GitLab repository](https://github.com)

## 1. Supabase Setup

### Create a new Supabase project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - Name: `txray`
   - Database Password: Generate a strong password
   - Region: Choose closest to your users
5. Wait for project creation (2-3 minutes)

### Get your Supabase credentials

1. Go to Project Settings → API
2. Copy the following values:
   - Project URL
   - Anon (public) key
   - Service Role (secret) key

### Set up your database schema

1. Go to SQL Editor
2. Create your tables (example):

```sql
-- Example users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);
```

## 2. Vercel Setup

### Deploy the Frontend (Next.js)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your Git repository
4. Configure the project:
   - Framework Preset: Next.js
   - Root Directory: `apps/web`
   - Build Command: `pnpm build`
   - Output Directory: `.next`
   - Install Command: `pnpm install`

5. Add environment variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   # API URL no longer needed - using Supabase Edge Functions
   ```

6. Deploy

### Backend (Supabase Edge Functions)

No separate backend deployment needed! The authentication and analytics are handled by Supabase Edge Functions.

**Set up Supabase Edge Functions:**

1. Deploy the auth function:
   ```bash
   pnpm exec supabase functions deploy auth --project-ref your_project_ref
   ```

2. Set environment variables in Supabase Dashboard:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   SUPABASE_JWT_SECRET=your_jwt_secret
   APP_ORIGIN=https://your-frontend-domain.vercel.app
   ```

3. Deploy analytics functions (optional):
   ```bash
   pnpm exec supabase functions deploy analytics --project-ref your_project_ref
   pnpm exec supabase functions deploy indexer-run --project-ref your_project_ref
   ```

## 3. Environment Configuration

### Frontend (.env.local)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
# API URL no longer needed - using Supabase Edge Functions
```

### Supabase Edge Functions (Dashboard)

Set these in your Supabase Dashboard → Edge Functions → Environment Variables:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret
APP_ORIGIN=https://your-frontend.vercel.app
```

## 4. Domain Configuration

### Custom Domain (Optional)

1. In Vercel, go to your project settings
2. Navigate to "Domains"
3. Add your custom domain
4. Update DNS records as instructed

### Update CORS

After deploying, update your backend CORS configuration with the production frontend URL.

## 5. Testing Deployment

1. Test your frontend: `https://your-frontend.vercel.app`
2. Test your API: `https://your-api.vercel.app/health`
3. Test Supabase connection through your app

## 6. Monitoring & Analytics

### Vercel Analytics

- Enable Vercel Analytics in your project settings
- Monitor performance and user behavior

### Supabase Monitoring

- Check Database → Logs for query performance
- Monitor Auth → Users for authentication issues
- Use Database → API for real-time insights

## 7. CI/CD Setup

### GitHub Actions (Optional)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install -g pnpm
      - run: pnpm install
      - run: pnpm build
      # Add Vercel deployment steps
```

## Troubleshooting

### Common Issues

1. **Build Failures**: Check build logs in Vercel
2. **Environment Variables**: Ensure all required vars are set
3. **CORS Errors**: Verify frontend URL in backend CORS config
4. **Database Connection**: Check Supabase credentials and policies

### Support

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Turborepo Documentation](https://turbo.build/repo/docs)
