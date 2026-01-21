'use client'

import { useEffect, useState, useCallback, useRef } from 'react'

/**
 * Hook to detect page visibility changes (tab focus/blur).
 *
 * Uses the Page Visibility API to detect when the user switches tabs,
 * minimizes the browser, or locks the screen.
 *
 * @returns Object with:
 *   - isHidden: true when page is not visible (tab inactive)
 *   - onVisibilityChange: callback to register visibility change handlers
 */
export function usePageVisibility() {
  // Initialize with document.hidden if available (SSR-safe)
  const [isHidden, setIsHidden] = useState(() =>
    typeof document !== 'undefined' ? document.hidden : false
  )
  const callbacksRef = useRef<Set<(hidden: boolean) => void>>(new Set())

  // Register a callback to be notified of visibility changes
  const onVisibilityChange = useCallback(
    (callback: (hidden: boolean) => void) => {
      callbacksRef.current.add(callback)
      // Return cleanup function
      return () => {
        callbacksRef.current.delete(callback)
      }
    },
    []
  )

  useEffect(() => {
    // Check if Page Visibility API is supported
    if (typeof document === 'undefined' || !('hidden' in document)) {
      return
    }

    const handleVisibilityChange = () => {
      const hidden = document.hidden
      setIsHidden(hidden)

      // Notify all registered callbacks
      callbacksRef.current.forEach((callback) => {
        callback(hidden)
      })
    }

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return {
    isHidden,
    onVisibilityChange,
  }
}
