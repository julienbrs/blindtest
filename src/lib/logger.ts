/**
 * Server-side error logging utility
 *
 * Provides structured JSON logging for server-side errors with:
 * - ISO timestamp
 * - Context (endpoint/function name)
 * - Error message
 * - Stack trace for debugging
 */

export interface LogEntry {
  timestamp: string
  context: string
  message: string
  stack?: string
  metadata?: Record<string, unknown>
}

/**
 * Log an error with structured JSON format
 *
 * @param context - Where the error occurred (e.g., "GET /api/songs")
 * @param error - The error object or unknown value
 * @param metadata - Optional additional data to include in the log
 *
 * @example
 * ```typescript
 * try {
 *   // ... operation
 * } catch (error) {
 *   logError('GET /api/songs', error);
 *   return NextResponse.json({ error: 'Internal error' }, { status: 500 });
 * }
 * ```
 */
export function logError(
  context: string,
  error: unknown,
  metadata?: Record<string, unknown>
): void {
  const timestamp = new Date().toISOString()
  const message = error instanceof Error ? error.message : String(error)
  const stack = error instanceof Error ? error.stack : undefined

  const logEntry: LogEntry = {
    timestamp,
    context,
    message,
    ...(stack && { stack }),
    ...(metadata && { metadata }),
  }

  console.error(JSON.stringify(logEntry, null, 2))
}

/**
 * Log a warning with structured JSON format
 *
 * @param context - Where the warning occurred
 * @param message - Warning message
 * @param metadata - Optional additional data
 */
export function logWarning(
  context: string,
  message: string,
  metadata?: Record<string, unknown>
): void {
  const timestamp = new Date().toISOString()

  const logEntry = {
    timestamp,
    level: 'warning',
    context,
    message,
    ...(metadata && { metadata }),
  }

  console.warn(JSON.stringify(logEntry, null, 2))
}

/**
 * Log an info message with structured JSON format
 *
 * @param context - Where the message originated
 * @param message - Info message
 * @param metadata - Optional additional data
 */
export function logInfo(
  context: string,
  message: string,
  metadata?: Record<string, unknown>
): void {
  const timestamp = new Date().toISOString()

  const logEntry = {
    timestamp,
    level: 'info',
    context,
    message,
    ...(metadata && { metadata }),
  }

  console.log(JSON.stringify(logEntry, null, 2))
}
