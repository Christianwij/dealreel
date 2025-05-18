import { AppProps } from 'next/app'
import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
import ErrorBoundary from '@/components/ErrorBoundary'
import { Analytics } from '@vercel/analytics/react'
import { Toaster } from 'react-hot-toast'

import '@/styles/globals.css'

// Initialize performance monitoring
if (typeof window !== 'undefined') {
  // Create and observe performance marks
  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      // Report performance metrics to Sentry
      Sentry.addBreadcrumb({
        category: 'performance',
        message: `${entry.name}: ${entry.duration}ms`,
        level: 'info',
      })
    })
  })

  observer.observe({ entryTypes: ['measure', 'mark'] })
}

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Track route changes
    const handleRouteChange = (url: string) => {
      Sentry.addBreadcrumb({
        category: 'navigation',
        message: `Navigated to ${url}`,
        level: 'info',
      })
    }

    // Add route change listener
    window.addEventListener('routeChangeComplete', handleRouteChange as any)

    return () => {
      window.removeEventListener('routeChangeComplete', handleRouteChange as any)
    }
  }, [])

  return (
    <ErrorBoundary>
      <Component {...pageProps} />
      <Analytics />
      <Toaster position="bottom-right" />
    </ErrorBoundary>
  )
}

export default MyApp 