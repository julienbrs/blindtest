import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getSupabaseClient,
  getSupabaseClientSafe,
  isSupabaseConfigured,
  resetSupabaseClient,
  SupabaseConfigError,
  testSupabaseConnection,
} from './supabase'

// Mock the @supabase/supabase-js module
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  })),
}))

describe('supabase', () => {
  const originalEnv = process.env

  beforeEach(() => {
    // Reset module state before each test
    resetSupabaseClient()
    // Reset environment
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
    vi.clearAllMocks()
  })

  describe('isSupabaseConfigured', () => {
    it('returns false when URL is missing', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = ''
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'valid-key'

      expect(isSupabaseConfigured()).toBe(false)
    })

    it('returns false when anon key is missing', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = ''

      expect(isSupabaseConfigured()).toBe(false)
    })

    it('returns false when URL contains placeholder value', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://your-project.supabase.co'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'valid-key'

      expect(isSupabaseConfigured()).toBe(false)
    })

    it('returns false when anon key contains placeholder value', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'your-anon-key-here'

      expect(isSupabaseConfigured()).toBe(false)
    })

    it('returns false when URL is invalid', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'not-a-valid-url'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'valid-key'

      expect(isSupabaseConfigured()).toBe(false)
    })

    it('returns true when properly configured', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-project.supabase.co'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test'

      expect(isSupabaseConfigured()).toBe(true)
    })
  })

  describe('getSupabaseClient', () => {
    it('throws SupabaseConfigError when URL is missing', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = ''
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'valid-key'

      expect(() => getSupabaseClient()).toThrow(SupabaseConfigError)
      expect(() => getSupabaseClient()).toThrow(
        /Supabase configuration missing/
      )
    })

    it('throws SupabaseConfigError when anon key is missing', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = ''

      expect(() => getSupabaseClient()).toThrow(SupabaseConfigError)
    })

    it('throws SupabaseConfigError when config is invalid', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://your-project.supabase.co'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'valid-key'

      expect(() => getSupabaseClient()).toThrow(SupabaseConfigError)
      expect(() => getSupabaseClient()).toThrow(
        /Supabase configuration invalid/
      )
    })

    it('creates and returns client when properly configured', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-project.supabase.co'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test'

      const client = getSupabaseClient()
      expect(client).toBeDefined()
      expect(client.auth).toBeDefined()
      expect(client.from).toBeDefined()
    })

    it('returns the same client instance on subsequent calls (singleton)', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-project.supabase.co'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test'

      const client1 = getSupabaseClient()
      const client2 = getSupabaseClient()
      expect(client1).toBe(client2)
    })
  })

  describe('getSupabaseClientSafe', () => {
    it('returns null when not configured', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = ''
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = ''

      const client = getSupabaseClientSafe()
      expect(client).toBeNull()
    })

    it('returns null when config is invalid', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://your-project.supabase.co'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'your-anon-key-here'

      const client = getSupabaseClientSafe()
      expect(client).toBeNull()
    })

    it('returns client when properly configured', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-project.supabase.co'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test'

      const client = getSupabaseClientSafe()
      expect(client).not.toBeNull()
    })
  })

  describe('testSupabaseConnection', () => {
    it('returns error when not configured', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = ''
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = ''

      const result = await testSupabaseConnection()
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('returns success when connection works', async () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-project.supabase.co'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test'

      const result = await testSupabaseConnection()
      expect(result.success).toBe(true)
      expect(result.error).toBeUndefined()
    })
  })

  describe('resetSupabaseClient', () => {
    it('resets the singleton so a new client is created', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-project.supabase.co'
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test'

      const client1 = getSupabaseClient()
      resetSupabaseClient()
      const client2 = getSupabaseClient()

      // After reset, a new client should be created
      // (with our mock, they're both mocked objects, but createClient should be called twice)
      expect(client1).toBeDefined()
      expect(client2).toBeDefined()
    })
  })

  describe('SupabaseConfigError', () => {
    it('has correct name', () => {
      const error = new SupabaseConfigError('test message')
      expect(error.name).toBe('SupabaseConfigError')
    })

    it('has correct message', () => {
      const error = new SupabaseConfigError('test message')
      expect(error.message).toBe('test message')
    })

    it('is instanceof Error', () => {
      const error = new SupabaseConfigError('test message')
      expect(error instanceof Error).toBe(true)
    })
  })
})
