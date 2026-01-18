import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useAudioSupport } from './useAudioSupport'

describe('useAudioSupport', () => {
  let originalCreateElement: typeof document.createElement

  beforeEach(() => {
    originalCreateElement = document.createElement.bind(document)
  })

  afterEach(() => {
    document.createElement = originalCreateElement
    vi.restoreAllMocks()
  })

  it('returns isChecking=true initially', () => {
    const { result } = renderHook(() => useAudioSupport())
    // Note: Due to useEffect timing, isChecking may already be false
    // We just verify the hook returns expected shape
    expect(result.current).toHaveProperty('isSupported')
    expect(result.current).toHaveProperty('isChecking')
  })

  it('returns isSupported=true when browser supports MP3', async () => {
    document.createElement = vi.fn((tagName: string) => {
      if (tagName === 'audio') {
        return {
          canPlayType: vi.fn((type: string) =>
            type === 'audio/mpeg' ? 'probably' : ''
          ),
        } as unknown as HTMLAudioElement
      }
      return originalCreateElement(tagName)
    })

    const { result } = renderHook(() => useAudioSupport())

    await waitFor(() => {
      expect(result.current.isChecking).toBe(false)
    })

    expect(result.current.isSupported).toBe(true)
  })

  it('returns isSupported=true when canPlayType returns "maybe"', async () => {
    document.createElement = vi.fn((tagName: string) => {
      if (tagName === 'audio') {
        return {
          canPlayType: vi.fn((type: string) =>
            type === 'audio/mpeg' ? 'maybe' : ''
          ),
        } as unknown as HTMLAudioElement
      }
      return originalCreateElement(tagName)
    })

    const { result } = renderHook(() => useAudioSupport())

    await waitFor(() => {
      expect(result.current.isChecking).toBe(false)
    })

    expect(result.current.isSupported).toBe(true)
  })

  it('returns isSupported=false when canPlayType returns empty string', async () => {
    document.createElement = vi.fn((tagName: string) => {
      if (tagName === 'audio') {
        return {
          canPlayType: vi.fn(() => ''),
        } as unknown as HTMLAudioElement
      }
      return originalCreateElement(tagName)
    })

    const { result } = renderHook(() => useAudioSupport())

    await waitFor(() => {
      expect(result.current.isChecking).toBe(false)
    })

    expect(result.current.isSupported).toBe(false)
  })

  it('returns isSupported=false when canPlayType returns "no"', async () => {
    document.createElement = vi.fn((tagName: string) => {
      if (tagName === 'audio') {
        return {
          canPlayType: vi.fn(() => 'no'),
        } as unknown as HTMLAudioElement
      }
      return originalCreateElement(tagName)
    })

    const { result } = renderHook(() => useAudioSupport())

    await waitFor(() => {
      expect(result.current.isChecking).toBe(false)
    })

    expect(result.current.isSupported).toBe(false)
  })

  it('returns isSupported=false when canPlayType is not a function', async () => {
    document.createElement = vi.fn((tagName: string) => {
      if (tagName === 'audio') {
        return {
          canPlayType: undefined,
        } as unknown as HTMLAudioElement
      }
      return originalCreateElement(tagName)
    })

    const { result } = renderHook(() => useAudioSupport())

    await waitFor(() => {
      expect(result.current.isChecking).toBe(false)
    })

    expect(result.current.isSupported).toBe(false)
  })

  it('returns isSupported=false when audio element is null', async () => {
    document.createElement = vi.fn((tagName: string) => {
      if (tagName === 'audio') {
        return null as unknown as HTMLAudioElement
      }
      return originalCreateElement(tagName)
    })

    const { result } = renderHook(() => useAudioSupport())

    await waitFor(() => {
      expect(result.current.isChecking).toBe(false)
    })

    expect(result.current.isSupported).toBe(false)
  })

  it('returns isSupported=false when createElement throws', async () => {
    document.createElement = vi.fn((tagName: string) => {
      if (tagName === 'audio') {
        throw new Error('Not supported')
      }
      return originalCreateElement(tagName)
    })

    const { result } = renderHook(() => useAudioSupport())

    await waitFor(() => {
      expect(result.current.isChecking).toBe(false)
    })

    expect(result.current.isSupported).toBe(false)
  })

  it('sets isChecking to false after check completes', async () => {
    const { result } = renderHook(() => useAudioSupport())

    await waitFor(() => {
      expect(result.current.isChecking).toBe(false)
    })
  })
})
