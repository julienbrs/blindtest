'use client'

import { useCallback, useEffect, useState } from 'react'

/**
 * Interface for the fullscreen hook return value.
 */
export interface UseFullscreenReturn {
  /** Whether the app is currently in fullscreen mode */
  isFullscreen: boolean
  /** Toggle fullscreen mode (enter if not fullscreen, exit if fullscreen) */
  toggleFullscreen: () => Promise<void>
  /** Enter fullscreen mode */
  enterFullscreen: () => Promise<void>
  /** Exit fullscreen mode */
  exitFullscreen: () => Promise<void>
  /** Whether fullscreen is supported in the current browser */
  isSupported: boolean
}

/**
 * Hook for managing fullscreen mode.
 * Uses the Fullscreen API with proper error handling for browsers that don't support it (e.g., iOS Safari).
 *
 * @example
 * ```tsx
 * function GamePage() {
 *   const { isFullscreen, toggleFullscreen, isSupported } = useFullscreen()
 *
 *   return (
 *     <button onClick={toggleFullscreen} disabled={!isSupported}>
 *       {isFullscreen ? <MinimizeIcon /> : <MaximizeIcon />}
 *     </button>
 *   )
 * }
 * ```
 */
export function useFullscreen(): UseFullscreenReturn {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isSupported, setIsSupported] = useState(false)

  // Check if fullscreen is supported on mount
  useEffect(() => {
    const supported =
      typeof document !== 'undefined' &&
      (document.fullscreenEnabled ||
        // @ts-expect-error - webkit prefix for Safari
        document.webkitFullscreenEnabled ||
        false)

    // Check initial fullscreen state
    const fullscreenElement =
      document.fullscreenElement ||
      // @ts-expect-error - webkit prefix for Safari
      document.webkitFullscreenElement
    const initialFullscreen = !!fullscreenElement

    // Use queueMicrotask to avoid setState synchronously in effect
    queueMicrotask(() => {
      setIsSupported(supported)
      setIsFullscreen(initialFullscreen)
    })
  }, [])

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const fullscreenElement =
        document.fullscreenElement ||
        // @ts-expect-error - webkit prefix for Safari
        document.webkitFullscreenElement
      setIsFullscreen(!!fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener(
        'webkitfullscreenchange',
        handleFullscreenChange
      )
    }
  }, [])

  const enterFullscreen = useCallback(async () => {
    if (!isSupported) return

    try {
      const element = document.documentElement
      if (element.requestFullscreen) {
        await element.requestFullscreen()
        // @ts-expect-error - webkit prefix for Safari
      } else if (element.webkitRequestFullscreen) {
        // @ts-expect-error - webkit prefix for Safari
        await element.webkitRequestFullscreen()
      }
    } catch {
      // Silently fail - fullscreen may be blocked by browser
    }
  }, [isSupported])

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen()
        // @ts-expect-error - webkit prefix for Safari
      } else if (document.webkitExitFullscreen) {
        // @ts-expect-error - webkit prefix for Safari
        await document.webkitExitFullscreen()
      }
    } catch {
      // Silently fail
    }
  }, [])

  const toggleFullscreen = useCallback(async () => {
    const fullscreenElement =
      document.fullscreenElement ||
      // @ts-expect-error - webkit prefix for Safari
      document.webkitFullscreenElement

    if (fullscreenElement) {
      await exitFullscreen()
    } else {
      await enterFullscreen()
    }
  }, [enterFullscreen, exitFullscreen])

  return {
    isFullscreen,
    toggleFullscreen,
    enterFullscreen,
    exitFullscreen,
    isSupported,
  }
}
