import { describe, expect, it } from 'vitest'
import { normalizeGameConfig } from './gameConfig'

describe('normalizeGameConfig', () => {
  it('convertit automatiquement une ancienne configuration sans playlist en null', () => {
    expect(
      normalizeGameConfig({
        guessMode: 'artist',
        clipDuration: 30,
        timerDuration: 10,
        noTimer: false,
        revealDuration: 4,
      })
    ).toEqual({
      guessMode: 'artist',
      clipDuration: 30,
      timerDuration: 10,
      noTimer: false,
      revealDuration: 4,
      playlistId: null,
    })
  })

  it('conserve uniquement un identifiant de playlist non vide', () => {
    expect(
      normalizeGameConfig({ playlistId: '  m3u_party  ' }).playlistId
    ).toBe('m3u_party')
    expect(normalizeGameConfig({ playlistId: '   ' }).playlistId).toBeNull()
  })
})
