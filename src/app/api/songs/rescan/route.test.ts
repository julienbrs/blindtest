import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'
import * as audioScanner from '@/lib/audioScanner'

// Mock the audioScanner module
vi.mock('@/lib/audioScanner', () => ({
  refreshCache: vi.fn(),
  getCacheInfo: vi.fn(),
}))

describe('POST /api/songs/rescan', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns success with song count and scan duration when rescan succeeds', async () => {
    const mockCacheInfo = { count: 42, lastScan: 1705500000000 }
    vi.mocked(audioScanner.refreshCache).mockResolvedValue(undefined)
    vi.mocked(audioScanner.getCacheInfo).mockReturnValue(mockCacheInfo)

    const response = await POST()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.songsFound).toBe(42)
    expect(typeof data.scanDuration).toBe('number')
    expect(data.scanDuration).toBeGreaterThanOrEqual(0)
    expect(data.message).toMatch(/Scan terminé: 42 chansons trouvées en \d+ms/)
    expect(audioScanner.refreshCache).toHaveBeenCalledTimes(1)
    expect(audioScanner.getCacheInfo).toHaveBeenCalledTimes(1)
  })

  it('returns error when refreshCache throws', async () => {
    vi.mocked(audioScanner.refreshCache).mockRejectedValue(
      new Error('AUDIO_FOLDER_PATH non défini')
    )

    const response = await POST()
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data).toEqual({
      error: 'Erreur lors du rescan',
    })
  })

  it('returns error when refreshCache throws unknown error', async () => {
    vi.mocked(audioScanner.refreshCache).mockRejectedValue('unknown error')

    const response = await POST()
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data).toEqual({
      error: 'Erreur lors du rescan',
    })
  })

  it('calls refreshCache before getCacheInfo', async () => {
    const callOrder: string[] = []
    vi.mocked(audioScanner.refreshCache).mockImplementation(async () => {
      callOrder.push('refreshCache')
    })
    vi.mocked(audioScanner.getCacheInfo).mockImplementation(() => {
      callOrder.push('getCacheInfo')
      return { count: 10, lastScan: Date.now() }
    })

    await POST()

    expect(callOrder).toEqual(['refreshCache', 'getCacheInfo'])
  })

  it('returns zero songs when folder is empty', async () => {
    const mockCacheInfo = { count: 0, lastScan: 1705500000000 }
    vi.mocked(audioScanner.refreshCache).mockResolvedValue(undefined)
    vi.mocked(audioScanner.getCacheInfo).mockReturnValue(mockCacheInfo)

    const response = await POST()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.songsFound).toBe(0)
    expect(data.message).toMatch(/Scan terminé: 0 chansons trouvées/)
  })

  it('measures scan duration accurately', async () => {
    const mockCacheInfo = { count: 100, lastScan: Date.now() }
    const delay = 50 // 50ms delay
    vi.mocked(audioScanner.refreshCache).mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, delay))
    })
    vi.mocked(audioScanner.getCacheInfo).mockReturnValue(mockCacheInfo)

    const response = await POST()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.scanDuration).toBeGreaterThanOrEqual(delay)
    // Allow some tolerance for test execution overhead
    expect(data.scanDuration).toBeLessThan(delay + 100)
  })
})
