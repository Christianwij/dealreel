# Monitoring Guide

## Overview
This document outlines the monitoring and observability setup for the DealReel3 application.

## Monitoring Stack

### Error Tracking (Sentry)
- Frontend: @sentry/nextjs
- Backend: sentry-sdk[fastapi]
- Real-time error tracking and reporting
- Performance monitoring
- Session replay

### Performance Analytics (Vercel)
- Page load times
- API response times
- Core Web Vitals
- User behavior analytics

### Application Health
- Backend health checks
- Database connection monitoring
- Redis cache monitoring
- API endpoint monitoring

## Sentry Configuration

### Frontend Setup
```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  enableTracing: true,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  enabled: process.env.NODE_ENV === 'production'
})
```

### Backend Setup
```python
# app/core/monitoring.py
from sentry_sdk.integrations.fastapi import FastAPIIntegration
import sentry_sdk

sentry_sdk.init(
    dsn=settings.SENTRY_DSN,
    traces_sample_rate=0.1,
    environment=settings.ENVIRONMENT,
    integrations=[FastAPIIntegration()]
)
```

## Error Handling

### Frontend Error Boundary
```typescript
// components/ErrorBoundary.tsx
class ErrorBoundary extends React.Component<Props, State> {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    Sentry.withScope((scope) => {
      scope.setExtras({
        componentStack: errorInfo.componentStack,
      })
      Sentry.captureException(error)
    })
  }
}
```

### Backend Error Handling
```python
# app/core/error_handlers.py
from fastapi import Request
from sentry_sdk import capture_exception

async def http_exception_handler(request: Request, exc: HTTPException):
    capture_exception(exc)
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )
```

## Performance Monitoring

### Frontend Transactions
```typescript
// Example: File Upload Monitoring
const onDrop = useCallback(async (files: File[]) => {
  const transaction = Sentry.startTransaction({
    name: 'file_upload',
    op: 'upload'
  })
  
  try {
    transaction.setData('fileCount', files.length)
    transaction.setData('totalSize', files.reduce((acc, f) => acc + f.size, 0))
    
    await uploadFiles(files)
    
    transaction.setStatus('ok')
  } catch (error) {
    transaction.setStatus('error')
    throw error
  } finally {
    transaction.finish()
  }
}, [])
```

### Backend Transactions
```python
# Example: Document QA Monitoring
async def process_question(question: str, context: str):
    with sentry_sdk.start_transaction(name="qa_processing", op="ai") as transaction:
        transaction.set_data("question_length", len(question))
        transaction.set_data("context_length", len(context))
        
        try:
            answer = await generate_answer(question, context)
            transaction.set_status("ok")
            return answer
        except Exception as e:
            transaction.set_status("error")
            raise e
```

## Alerts and Notifications

### Error Alerts
- Critical errors: Immediate notification
- Error threshold alerts
- Error rate monitoring
- Custom alert rules

### Performance Alerts
- Response time degradation
- Error rate spikes
- Memory usage alerts
- CPU utilization alerts

### Alert Channels
- Email notifications
- Slack integration
- PagerDuty integration
- Custom webhooks

## Dashboards and Reporting

### Sentry Dashboards
- Error tracking overview
- Performance metrics
- Release tracking
- User impact analysis

### Vercel Analytics
- Page performance metrics
- User engagement
- Geographic distribution
- Device analytics

### Custom Metrics
- Business KPIs
- User engagement
- Feature usage
- Error rates

## Incident Response

### Incident Levels
1. P0 - Critical (Service Down)
2. P1 - Major (Significant Impact)
3. P2 - Minor (Limited Impact)
4. P3 - Low (Minimal Impact)

### Response Procedures
1. Detection
   - Automated monitoring alerts
   - User reports
   - System checks

2. Assessment
   - Determine severity
   - Identify impact
   - Assign resources

3. Resolution
   - Implement fix
   - Verify solution
   - Update status

4. Post-mortem
   - Document incident
   - Identify root cause
   - Implement preventive measures

## Logging

### Frontend Logging
```typescript
// Structured logging with context
logger.error('File upload failed', {
  userId: user.id,
  fileSize: file.size,
  fileType: file.type,
  error: error.message
})
```

### Backend Logging
```python
# Structured logging with correlation IDs
logger.info('Processing document', extra={
    'document_id': doc.id,
    'user_id': user.id,
    'correlation_id': request_id,
    'processing_type': 'qa'
})
```

## Health Checks

### Backend Health Endpoints
```python
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "version": settings.VERSION,
        "database": await check_database(),
        "redis": await check_redis()
    }
```

### Frontend Health Checks
```typescript
// Regular API health verification
const checkApiHealth = async () => {
  try {
    const response = await fetch('/api/health')
    const data = await response.json()
    
    if (data.status !== 'healthy') {
      Sentry.captureMessage('API health check failed', {
        level: 'warning',
        extra: data
      })
    }
  } catch (error) {
    Sentry.captureException(error)
  }
}
```

## Best Practices

### Error Tracking
1. Include relevant context
2. Set proper fingerprints
3. Filter sensitive data
4. Use appropriate error levels

### Performance Monitoring
1. Monitor critical paths
2. Set appropriate sampling rates
3. Track custom metrics
4. Use meaningful transaction names

### Alerting
1. Configure meaningful thresholds
2. Avoid alert fatigue
3. Include actionable information
4. Establish escalation paths

## Resources
- [Sentry Documentation](https://docs.sentry.io/)
- [Vercel Analytics](https://vercel.com/analytics)
- [FastAPI Monitoring](https://fastapi.tiangolo.com/advanced/monitoring/)
- [Next.js Monitoring](https://nextjs.org/docs/advanced-features/monitoring) 