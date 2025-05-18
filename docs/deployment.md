# Deployment Guide

## Overview
This document outlines the deployment procedures for the DealReel3 application.

## Infrastructure

### Frontend (Vercel)
- Next.js application
- Automatic deployments from main branch
- Preview deployments for pull requests

### Backend (Render)
- FastAPI application
- PostgreSQL database
- Redis cache
- Automatic deployments from main branch

## Environment Variables

### Frontend (.env)
```plaintext
NEXT_PUBLIC_API_URL=https://api.dealreel.com
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-key
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

### Backend (.env)
```plaintext
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://host:6379/0
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-service-role-key
OPENAI_API_KEY=your-openai-key
SENTRY_DSN=your-sentry-dsn
```

## Deployment Process

### Frontend Deployment

1. Automatic Deployment
- Push to main branch triggers deployment
- Vercel builds and deploys automatically
- Preview URLs generated for pull requests

2. Manual Deployment
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

3. Environment Variables
- Set in Vercel dashboard
- Encrypted in transit and at rest
- Available during build and runtime

### Backend Deployment

1. Automatic Deployment
- Push to main branch triggers deployment
- Render builds and deploys automatically
- Health checks ensure successful deployment

2. Manual Deployment
```bash
# Deploy using Render CLI
render deploy

# Or trigger deploy webhook
curl -X POST $RENDER_DEPLOY_HOOK
```

3. Database Migrations
```bash
# Run migrations
cd backend
alembic upgrade head

# Create new migration
alembic revision -m "description"
```

## Monitoring and Health Checks

### Frontend
- Vercel Analytics dashboard
- Sentry error tracking
- Custom performance monitoring

### Backend
- Render metrics dashboard
- Sentry error tracking
- Health check endpoint: `/health`

## Rollback Procedures

### Frontend Rollback
1. Via Vercel Dashboard:
   - Go to deployments
   - Find last working deployment
   - Click "Promote to Production"

2. Via Git:
```bash
# Revert last commit
git revert HEAD
git push origin main
```

### Backend Rollback
1. Via Render Dashboard:
   - Go to deployments
   - Select previous deployment
   - Click "Manual Deploy"

2. Database Rollback:
```bash
# Rollback last migration
cd backend
alembic downgrade -1
```

## Security Considerations

### SSL/TLS
- All endpoints use HTTPS
- SSL certificates auto-renewed
- HSTS enabled

### Environment Variables
- Never commit to repository
- Rotate regularly
- Use secret management systems

### Access Control
- IP allowlisting for database
- Role-based access control
- Regular security audits

## Backup and Recovery

### Database Backups
- Automated daily backups
- 30-day retention
- Point-in-time recovery available

### Recovery Process
1. Stop application
2. Restore database backup
3. Verify data integrity
4. Restart application

## Performance Optimization

### Frontend
- Automatic static optimization
- Image optimization
- Code splitting
- Caching strategies

### Backend
- Database connection pooling
- Redis caching
- Rate limiting
- Async operations

## Troubleshooting

### Common Issues

1. Build Failures
```bash
# Check build logs
vercel logs
render logs
```

2. Database Connection Issues
```bash
# Verify connection
python backend/scripts/verify_db.py
```

3. Cache Issues
```bash
# Clear Redis cache
redis-cli FLUSHALL
```

### Debugging Tools
- Sentry debug mode
- Vercel deployment logs
- Render logs
- Database query logs

## Maintenance Windows

### Scheduled Maintenance
- Database updates: Sundays 2-4 AM UTC
- System updates: First Monday of month
- Notify users 48 hours in advance

### Emergency Maintenance
- Use status page for updates
- Follow incident response plan
- Post-mortem after resolution

## Resources
- [Vercel Documentation](https://vercel.com/docs)
- [Render Documentation](https://render.com/docs)
- [Sentry Documentation](https://docs.sentry.io/)
- [Alembic Documentation](https://alembic.sqlalchemy.org/) 