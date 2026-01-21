import { createClient, SupabaseClient } from '@supabase/supabase-js'

/**
 * Supabase client singleton for the Blindtest application.
 *
 * The client is lazily initialized on first use and reused for subsequent calls.
 * This ensures a single connection is maintained throughout the application lifecycle.
 *
 * Environment variables required:
 * - NEXT_PUBLIC_SUPABASE_URL: Your Supabase project URL
 * - NEXT_PUBLIC_SUPABASE_ANON_KEY: Your Supabase anonymous key
 *
 * Get these from your Supabase dashboard: https://supabase.com/dashboard
 * Project Settings > API
 */

let supabaseClient: SupabaseClient | null = null

/**
 * Check if Supabase is configured with valid credentials.
 * Returns true if both URL and anon key are set and appear valid.
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Check if variables are set and not placeholder values
  if (!url || !anonKey) {
    return false
  }

  // Check for placeholder values
  if (
    url.includes('your-project') ||
    anonKey.includes('your-anon-key') ||
    anonKey === 'your-anon-key-here'
  ) {
    return false
  }

  // Basic URL validation
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Error thrown when Supabase is not properly configured.
 */
export class SupabaseConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SupabaseConfigError'
  }
}

/**
 * Get the Supabase client singleton.
 *
 * @returns The Supabase client instance
 * @throws {SupabaseConfigError} If Supabase environment variables are not configured
 *
 * @example
 * ```ts
 * const supabase = getSupabaseClient();
 * const { data, error } = await supabase.from('rooms').select('*');
 * ```
 */
export function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new SupabaseConfigError(
      'Supabase configuration missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.'
    )
  }

  if (!isSupabaseConfigured()) {
    throw new SupabaseConfigError(
      'Supabase configuration invalid. Please update NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY with your actual Supabase project credentials.'
    )
  }

  supabaseClient = createClient(url, anonKey, {
    auth: {
      // Disable auto refresh for the anon client (no user auth in MVP)
      autoRefreshToken: false,
      persistSession: false,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  })

  return supabaseClient
}

/**
 * Get the Supabase client if configured, or null if not.
 * Use this when you want to gracefully handle missing configuration.
 *
 * @returns The Supabase client instance or null if not configured
 *
 * @example
 * ```ts
 * const supabase = getSupabaseClientSafe();
 * if (!supabase) {
 *   console.log('Multiplayer mode unavailable - Supabase not configured');
 *   return;
 * }
 * ```
 */
export function getSupabaseClientSafe(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null
  }

  try {
    return getSupabaseClient()
  } catch {
    return null
  }
}

/**
 * Test the Supabase connection by making a simple query.
 * Useful for verifying that credentials are valid.
 *
 * @returns An object with success status and optional error message
 *
 * @example
 * ```ts
 * const result = await testSupabaseConnection();
 * if (result.success) {
 *   console.log('Connected to Supabase!');
 * } else {
 *   console.error('Connection failed:', result.error);
 * }
 * ```
 */
export async function testSupabaseConnection(): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const supabase = getSupabaseClient()

    // Test connection by checking auth status (doesn't require any tables)
    const { error } = await supabase.auth.getSession()

    if (error) {
      return {
        success: false,
        error: `Auth check failed: ${error.message}`,
      }
    }

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return {
      success: false,
      error: message,
    }
  }
}

/**
 * Reset the Supabase client singleton.
 * Primarily used for testing purposes.
 */
export function resetSupabaseClient(): void {
  supabaseClient = null
}
