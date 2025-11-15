export type LogContext = Record<string, unknown>

/**
 * Centralized helper for logging auth/session/tenant issues.
 * In development it uses console.warn; in production it uses console.error.
 */
export function logAuthIssue(message: string, context: LogContext = {}): void {
  const payload = { message, ...context }

  if (process.env.NODE_ENV !== 'production') {
    // More visible in dev without polluting error tracking too much
    // eslint-disable-next-line no-console
    console.warn('[AUTH_ISSUE]', payload)
  } else {
    // eslint-disable-next-line no-console
    console.error('[AUTH_ISSUE]', payload)
  }
}
