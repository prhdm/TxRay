# TxRay API

Express.js backend API for the TxRay application.

## Features

- Express.js server with TypeScript
- CORS enabled for frontend communication
- Helmet for security headers
- Supabase integration for database and authentication
- Environment-based configuration
- Health check endpoint

## Development

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Lint code
pnpm lint

# Type check
pnpm check-types
```

## Environment Variables

Copy `env.example` to `.env` and fill in your values:

- `PORT`: Server port (default: 3001)
- `NODE_ENV`: Environment (development/production)
- `FRONTEND_URL`: Frontend URL for CORS
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key

## API Endpoints

- `GET /health` - Health check
- `GET /api/hello` - Hello world endpoint

## Deployment

This API is configured for Vercel deployment. The `vercel.json` file handles the build and routing configuration.

## Supabase Integration

The API includes Supabase client configuration for:
- Database operations
- Authentication
- Real-time subscriptions
- File storage
