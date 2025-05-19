import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Capture Replay for 10% of all sessions,
  // plus for 100% of sessions with an error
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  // Only enable in production
  enabled: process.env.NODE_ENV === 'production',
  
  // Configure error filtering
  beforeSend(event) {
    // Don't send events for known network errors or user cancellations
    if (event.exception) {
      const errorMessage = event.exception.values?.[0]?.value?.toLowerCase() || ''
      if (
        errorMessage.includes('network error') ||
        errorMessage.includes('user cancelled') ||
        errorMessage.includes('aborted')
      ) {
        return null
      }
    }
    return event
  },
}) 