/**
 * Hook to detect browser audio support for HTML5 Audio API.
 * Returns whether the browser supports audio playback, specifically MP3 format.
 */

import { useState, useEffect } from 'react'

interface AudioSupportResult {
  /** Whether the browser supports HTML5 audio */
  isSupported: boolean
  /** Whether the check has completed */
  isChecking: boolean
}

/**
 * Check if the browser supports HTML5 Audio with MP3 playback.
 * This runs client-side only to avoid SSR issues.
 */
function checkAudioSupport(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    // SSR - assume supported, will re-check on client
    return true
  }

  try {
    const audio = document.createElement('audio')

    // Check if Audio API exists
    if (!audio || typeof audio.canPlayType !== 'function') {
      return false
    }

    // Check MP3 support (audio/mpeg is the MIME type for MP3)
    const canPlayMp3 = audio.canPlayType('audio/mpeg')

    // canPlayType returns '', 'maybe', or 'probably'
    // Empty string means no support
    // TypeScript types say it can only be '' | 'maybe' | 'probably', but some
    // older browsers might return 'no', so we cast and check for that as well
    return canPlayMp3 !== '' && (canPlayMp3 as string) !== 'no'
  } catch {
    // If any error occurs during detection, assume not supported
    return false
  }
}

/**
 * Hook to detect browser audio support.
 * Returns isSupported (boolean) and isChecking (loading state).
 */
export function useAudioSupport(): AudioSupportResult {
  const [isSupported, setIsSupported] = useState(true) // Optimistic default
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Only run on client-side
    // Use queueMicrotask to avoid synchronous setState in effect
    queueMicrotask(() => {
      const supported = checkAudioSupport()
      setIsSupported(supported)
      setIsChecking(false)
    })
  }, [])

  return { isSupported, isChecking }
}
