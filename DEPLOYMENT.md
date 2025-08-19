# Deployment Guide

This guide covers deploying the AI Assistant application to various cloud platforms.

## Prerequisites

- Node.js 18+ 
- Git repository with your code
- Environment variables configured
- PostgreSQL database (cloud or local)

## Vercel Deployment (Recommended)

Vercel is the recommended platform for Next.js applications.

### 1. Prepare Your Repository

Ensure your repository is pushed to GitHub, GitLab, or Bitbucket.

```bash
git push origin main
```

### 2. Connect to Vercel

1. Visit [vercel.com](https://vercel.com)
2. Sign up/login with your Git provider
3. Click "New Project"
4. Import your repository
5. Configure project settings

### 3. Environment Variables

Add these environment variables in Vercel dashboard:

```env
DATABASE_URL="postgresql://username:password@host:5432/database"
NEXTAUTH_URL="https://your-app.vercel.app"
NEXTAUTH_SECRET="your-production-secret"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_ID="your-github-client-id"
GITHUB_SECRET="your-github-client-secret"
GOOGLE_API_KEY="your-gemini-api-key"
OPENWEATHER_API_KEY="your-openweather-key"
ALPHA_VANTAGE_API_KEY="your-alphavantage-key"
```

### 4. Database Setup

For production, use a managed PostgreSQL service:

**Recommended Options:**
- Vercel Postgres (built-in)
- Neon (serverless PostgreSQL)
- PlanetScale (MySQL alternative)
- Railway Postgres
- Supabase

**Setup with Neon:**
1. Create account at [neon.tech](https://neon.tech)
2. Create new database
3. Copy connection string to `DATABASE_URL`
4. Run migrations: `pnpm db:push`

### 5. OAuth Configuration

Update OAuth redirect URLs for production:

**Google OAuth:**
- Authorized redirect URIs: `https://your-app.vercel.app/api/auth/callback/google`

**GitHub OAuth:**
- Authorization callback URL: `https://your-app.vercel.app/api/auth/callback/github`

### 6. Deploy

1. Click "Deploy" in Vercel
2. Wait for build to complete
3. Test your live application

## Railway Deployment

Railway offers full-stack deployment with built-in databases.

### 1. Setup Railway

```bash
npm install -g @railway/cli
railway login
railway init
```

### 2. Add Database

```bash
railway add postgresql
```

### 3. Deploy

```bash
railway up
```

### 4. Environment Variables

```bash
railway variables:set NEXTAUTH_SECRET=your-secret
railway variables:set GOOGLE_CLIENT_ID=your-client-id
# Add all other variables...
```

## Netlify Deployment

### 1. Build Configuration

Create `netlify.toml`:

```toml
[build]
  command = "pnpm build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"

[build.environment]
  NODE_VERSION = "18"
```

### 2. Deploy

1. Connect repository to Netlify
2. Set build command: `pnpm build`
3. Set publish directory: `.next`
4. Add environment variables
5. Deploy

## Docker Deployment

### 1. Create Dockerfile

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json pnpm-lock.yaml* ./
RUN corepack enable pnpm && pnpm i --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN corepack enable pnpm && pnpm build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### 2. Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/ai_assistant
      - NEXTAUTH_URL=http://localhost:3000
      - NEXTAUTH_SECRET=your-secret-key
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=ai_assistant
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

### 3. Deploy

```bash
docker-compose up -d
```

## AWS Deployment

### 1. Using AWS Amplify

1. Connect your GitHub repository
2. Set build settings:
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - corepack enable pnpm
           - pnpm install
       build:
         commands:
           - pnpm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```

### 2. Using EC2

1. Launch EC2 instance
2. Install Node.js and PM2
3. Clone repository
4. Install dependencies
5. Set up reverse proxy with nginx
6. Configure SSL with Let's Encrypt

## Database Migration

### Production Migration

```bash
# Run migrations
pnpm db:push

# Or with custom migration
pnpm db:migrate
```

### Backup Strategy

```bash
# Create backup
pg_dump $DATABASE_URL > backup.sql

# Restore backup
psql $DATABASE_URL < backup.sql
```

## Monitoring and Logging

### Vercel Analytics

Add to `next.config.mjs`:

```javascript
const nextConfig = {
  analytics: {
    id: 'your-analytics-id'
  }
};
```

### Error Monitoring

Install Sentry:

```bash
pnpm add @sentry/nextjs
```

Configure in `sentry.client.config.ts`:

```javascript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

## Performance Optimization

### 1. Enable Caching

```javascript
// next.config.mjs
const nextConfig = {
  images: {
    domains: ['example.com'],
  },
  experimental: {
    optimizeCss: true,
  }
};
```

### 2. Database Connection Pooling

```javascript
// lib/db/index.ts
import { drizzle } from 'drizzle-orm/vercel-postgres';
import { sql } from '@vercel/postgres';

export const db = drizzle(sql, { 
  logger: process.env.NODE_ENV === 'development' 
});
```

## Security Checklist

- [ ] Environment variables secured
- [ ] HTTPS enabled
- [ ] OAuth URLs updated
- [ ] Database credentials rotated
- [ ] Rate limiting enabled
- [ ] CORS configured
- [ ] CSP headers set
- [ ] Security headers configured

## Troubleshooting

### Common Issues

**Build Failures:**
- Check Node.js version compatibility
- Verify all environment variables are set
- Review build logs for missing dependencies

**Database Connection:**
- Verify DATABASE_URL format
- Check network connectivity
- Ensure database is accessible from deployment platform

**OAuth Issues:**
- Update redirect URLs for production domain
- Verify client IDs and secrets
- Check OAuth app configuration

**API Rate Limits:**
- Monitor external API usage
- Implement caching for external API calls
- Set up backup/fallback responses

### Health Checks

Create health check endpoints:

```javascript
// app/api/health/route.ts
export async function GET() {
  try {
    // Check database
    await db.execute(sql`SELECT 1`);
    
    return Response.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'healthy',
        server: 'healthy'
      }
    });
  } catch (error) {
    return Response.json({
      status: 'unhealthy',
      error: error.message
    }, { status: 500 });
  }
}
```

## CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'pnpm'
    
    - name: Install dependencies
      run: pnpm install
    
    - name: Run tests
      run: pnpm test
    
    - name: Build
      run: pnpm build
    
    - name: Deploy to Vercel
      uses: vercel/action@v1
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## Post-Deployment

1. **Test all features:**
   - Authentication flow
   - Chat functionality
   - External API tools
   - Database operations

2. **Monitor performance:**
   - Response times
   - Error rates
   - Database queries
   - API usage

3. **Set up alerts:**
   - Error notifications
   - Performance degradation
   - Database issues
   - External API failures

## Scaling Considerations

### Horizontal Scaling

- Use serverless functions (Vercel Functions)
- Implement database read replicas
- Cache frequently accessed data
- Use CDN for static assets

### Database Optimization

- Index frequently queried columns
- Implement connection pooling
- Use database migrations for schema changes
- Monitor query performance

---

Choose the deployment platform that best fits your needs and follow the appropriate section above. Vercel is recommended for its seamless Next.js integration and ease of use.