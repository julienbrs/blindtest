import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { logError, logWarning, logInfo, LogEntry } from './logger'

describe('logger', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>
  let consoleLogSpy: ReturnType<typeof vi.spyOn>

  // Helper to get spy output as string
  const getSpyOutput = (
    spy: ReturnType<typeof vi.spyOn>,
    callIndex = 0
  ): string => spy.mock.calls[callIndex][0] as string

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('logError', () => {
    it('should log error with timestamp', () => {
      const error = new Error('Test error')
      logError('GET /api/test', error)

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1)

      const loggedJson = getSpyOutput(consoleErrorSpy)
      const parsed: LogEntry = JSON.parse(loggedJson)

      expect(parsed.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })

    it('should log error with context', () => {
      const error = new Error('Test error')
      logError('GET /api/songs', error)

      const loggedJson = getSpyOutput(consoleErrorSpy)
      const parsed: LogEntry = JSON.parse(loggedJson)

      expect(parsed.context).toBe('GET /api/songs')
    })

    it('should log error message from Error object', () => {
      const error = new Error('Something went wrong')
      logError('POST /api/rescan', error)

      const loggedJson = getSpyOutput(consoleErrorSpy)
      const parsed: LogEntry = JSON.parse(loggedJson)

      expect(parsed.message).toBe('Something went wrong')
    })

    it('should log stack trace from Error object', () => {
      const error = new Error('Test error')
      logError('GET /api/audio/abc123', error)

      const loggedJson = getSpyOutput(consoleErrorSpy)
      const parsed: LogEntry = JSON.parse(loggedJson)

      expect(parsed.stack).toBeDefined()
      expect(parsed.stack).toContain('Error: Test error')
    })

    it('should handle non-Error objects', () => {
      logError('GET /api/test', 'String error')

      const loggedJson = getSpyOutput(consoleErrorSpy)
      const parsed: LogEntry = JSON.parse(loggedJson)

      expect(parsed.message).toBe('String error')
      expect(parsed.stack).toBeUndefined()
    })

    it('should handle null error', () => {
      logError('GET /api/test', null)

      const loggedJson = getSpyOutput(consoleErrorSpy)
      const parsed: LogEntry = JSON.parse(loggedJson)

      expect(parsed.message).toBe('null')
    })

    it('should handle undefined error', () => {
      logError('GET /api/test', undefined)

      const loggedJson = getSpyOutput(consoleErrorSpy)
      const parsed: LogEntry = JSON.parse(loggedJson)

      expect(parsed.message).toBe('undefined')
    })

    it('should include optional metadata', () => {
      const error = new Error('File not found')
      logError('GET /api/audio/abc123', error, {
        errorType: 'FILE_NOT_FOUND',
        filePath: '/path/to/file.mp3',
        code: 'ENOENT',
      })

      const loggedJson = getSpyOutput(consoleErrorSpy)
      const parsed: LogEntry = JSON.parse(loggedJson)

      expect(parsed.metadata).toBeDefined()
      expect(parsed.metadata?.errorType).toBe('FILE_NOT_FOUND')
      expect(parsed.metadata?.filePath).toBe('/path/to/file.mp3')
      expect(parsed.metadata?.code).toBe('ENOENT')
    })

    it('should not include metadata key when not provided', () => {
      const error = new Error('Test error')
      logError('GET /api/test', error)

      const loggedJson = getSpyOutput(consoleErrorSpy)
      const parsed: LogEntry = JSON.parse(loggedJson)

      expect(parsed.metadata).toBeUndefined()
    })

    it('should produce valid JSON output', () => {
      const error = new Error('Test error')
      logError('GET /api/test', error, { extra: 'data' })

      const loggedJson = getSpyOutput(consoleErrorSpy)

      // Should not throw
      expect(() => JSON.parse(loggedJson)).not.toThrow()
    })

    it('should format JSON with indentation for readability', () => {
      const error = new Error('Test')
      logError('GET /api/test', error)

      const loggedJson = getSpyOutput(consoleErrorSpy)

      // Check for newlines (indented JSON)
      expect(loggedJson).toContain('\n')
    })
  })

  describe('logWarning', () => {
    it('should log warning with level field', () => {
      logWarning('Cache', 'Cache miss for song abc123')

      expect(consoleWarnSpy).toHaveBeenCalledTimes(1)

      const loggedJson = getSpyOutput(consoleWarnSpy)
      const parsed = JSON.parse(loggedJson)

      expect(parsed.level).toBe('warning')
    })

    it('should log warning with timestamp and context', () => {
      logWarning('AudioScanner', 'Slow scan detected')

      const loggedJson = getSpyOutput(consoleWarnSpy)
      const parsed = JSON.parse(loggedJson)

      expect(parsed.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
      expect(parsed.context).toBe('AudioScanner')
      expect(parsed.message).toBe('Slow scan detected')
    })

    it('should include optional metadata for warnings', () => {
      logWarning('API', 'Rate limit approaching', { remaining: 10 })

      const loggedJson = getSpyOutput(consoleWarnSpy)
      const parsed = JSON.parse(loggedJson)

      expect(parsed.metadata?.remaining).toBe(10)
    })
  })

  describe('logInfo', () => {
    it('should log info with level field', () => {
      logInfo('Startup', 'Server started on port 3000')

      expect(consoleLogSpy).toHaveBeenCalledTimes(1)

      const loggedJson = getSpyOutput(consoleLogSpy)
      const parsed = JSON.parse(loggedJson)

      expect(parsed.level).toBe('info')
    })

    it('should log info with timestamp and context', () => {
      logInfo('Cache', 'Cache refreshed')

      const loggedJson = getSpyOutput(consoleLogSpy)
      const parsed = JSON.parse(loggedJson)

      expect(parsed.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
      expect(parsed.context).toBe('Cache')
      expect(parsed.message).toBe('Cache refreshed')
    })

    it('should include optional metadata for info', () => {
      logInfo('Scan', 'Scan completed', { songsFound: 150, duration: 2500 })

      const loggedJson = getSpyOutput(consoleLogSpy)
      const parsed = JSON.parse(loggedJson)

      expect(parsed.metadata?.songsFound).toBe(150)
      expect(parsed.metadata?.duration).toBe(2500)
    })
  })

  describe('JSON format compliance', () => {
    it('should produce parseable JSON for all log levels', () => {
      logError('Test', new Error('error'))
      logWarning('Test', 'warning')
      logInfo('Test', 'info')

      expect(() => JSON.parse(getSpyOutput(consoleErrorSpy))).not.toThrow()
      expect(() => JSON.parse(getSpyOutput(consoleWarnSpy))).not.toThrow()
      expect(() => JSON.parse(getSpyOutput(consoleLogSpy))).not.toThrow()
    })

    it('should handle special characters in error messages', () => {
      const error = new Error('Error with "quotes" and \\ backslashes')
      logError('Test', error)

      const loggedJson = getSpyOutput(consoleErrorSpy)
      expect(() => JSON.parse(loggedJson)).not.toThrow()

      const parsed = JSON.parse(loggedJson)
      expect(parsed.message).toContain('"quotes"')
      expect(parsed.message).toContain('\\')
    })

    it('should handle unicode in messages', () => {
      logInfo('Test', 'Message with émojis 🎵 and accents éàü')

      const loggedJson = getSpyOutput(consoleLogSpy)
      expect(() => JSON.parse(loggedJson)).not.toThrow()

      const parsed = JSON.parse(loggedJson)
      expect(parsed.message).toContain('🎵')
      expect(parsed.message).toContain('é')
    })
  })
})
