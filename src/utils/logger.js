/**
 * Logger utility for consistent logging across the application
 * In production, you might want to integrate with a logging service
 */

const isDev = import.meta.env.DEV || process.env.NODE_ENV === 'development'

export const logger = {
  log: (...args) => {
    if (isDev) {
      console.log('[HRMS]', ...args)
    }
  },
  
  info: (...args) => {
    if (isDev) {
      console.info('[HRMS:INFO]', ...args)
    }
  },
  
  warn: (...args) => {
    console.warn('[HRMS:WARN]', ...args)
  },
  
  error: (...args) => {
    console.error('[HRMS:ERROR]', ...args)
  },
  
  debug: (...args) => {
    if (isDev) {
      console.debug('[HRMS:DEBUG]', ...args)
    }
  },
}

export default logger
