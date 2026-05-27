/**
 * Structured debug logging utility for CellCureHub.
 * 
 * All logs follow the format: [MODULE:ACTION] message { ...data }
 * This makes it easy to grep/filter logs by module or action.
 * 
 * Usage:
 *   import { logger } from '@/lib/logger';
 *   logger.info('AUTH', 'User logged in', { userId: '...' });
 *   logger.error('REPAIR', 'Failed to update status', { error });
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_COLORS: Record<LogLevel, string> = {
  debug: '\x1b[36m',  // cyan
  info: '\x1b[32m',   // green
  warn: '\x1b[33m',   // yellow
  error: '\x1b[31m',  // red
};
const RESET = '\x1b[0m';

function formatLog(level: LogLevel, module: string, action: string, data?: unknown) {
  const timestamp = new Date().toISOString();
  const prefix = `${LOG_COLORS[level]}[${level.toUpperCase()}]${RESET} ${timestamp} [${module}:${action}]`;

  if (data !== undefined) {
    // Sanitize sensitive fields before logging
    const sanitized = sanitizeForLog(data);
    return `${prefix} ${JSON.stringify(sanitized, null, 0)}`;
  }
  return prefix;
}

/** Remove sensitive fields like passwords, tokens, etc. from log data */
function sanitizeForLog(data: unknown): unknown {
  if (data === null || data === undefined) return data;
  if (typeof data === 'string') return data;
  if (typeof data !== 'object') return data;

  if (data instanceof Error) {
    return { name: data.name, message: data.message, stack: data.stack?.split('\n').slice(0, 3).join('\n') };
  }

  if (Array.isArray(data)) return data.map(sanitizeForLog);

  const SENSITIVE_KEYS = ['password', 'token', 'secret', 'authorization', 'cookie', 'aadhar_number', 'imei_number'];
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.some(sk => key.toLowerCase().includes(sk))) {
      result[key] = '[REDACTED]';
    } else {
      result[key] = sanitizeForLog(value);
    }
  }
  return result;
}

export const logger = {
  debug(module: string, action: string, data?: unknown) {
    if (process.env.NODE_ENV === 'production') return; // skip debug in prod
    console.debug(formatLog('debug', module, action, data));
  },

  info(module: string, action: string, data?: unknown) {
    console.info(formatLog('info', module, action, data));
  },

  warn(module: string, action: string, data?: unknown) {
    console.warn(formatLog('warn', module, action, data));
  },

  error(module: string, action: string, data?: unknown) {
    console.error(formatLog('error', module, action, data));
  },
};
