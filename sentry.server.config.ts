import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Only enable in production
  enabled: process.env.NODE_ENV === 'production',
  
  // Configure error filtering
  beforeSend(event) {
    // Don't send events for known operational errors
    if (event.exception) {
      const errorMessage = event.exception.values?.[0]?.value?.toLowerCase() || ''
      if (
        errorMessage.includes('database connection error') ||
        errorMessage.includes('redis connection error')
      ) {
        // Set proper fingerprint for operational errors
        event.fingerprint = ['operational-error', errorMessage]
      }
    }
    return event
  },
}) 