// =============================================
// Logger Utility - خدمة التسجيل المركزية
// =============================================

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogOptions {
    context?: string;
    data?: unknown;
}

/**
 * Check if we're in development mode
 */
const isDev = process.env.NODE_ENV === 'development';

/**
 * Format timestamp for logs
 */
function getTimestamp(): string {
    return new Date().toISOString();
}

/**
 * Format log message with context
 */
function formatMessage(level: LogLevel, message: string, context?: string): string {
    const prefix = context ? `[${context}]` : '';
    return `[${getTimestamp()}] [${level.toUpperCase()}]${prefix} ${message}`;
}

/**
 * Serialize error objects to readable format
 */
function serializeError(data: unknown): unknown {
    if (data instanceof Error) {
        return {
            name: data.name,
            message: data.message,
            stack: data.stack?.split('\n').slice(0, 5).join('\n'),
        };
    }

    // PostgrestError or similar objects
    // Check for nested error properties common in Supabase/frameworks
    if (data && typeof data === 'object') {
        const obj = data as Record<string, unknown>;

        // Return directly if it looks like a clean error object
        if (obj.code && obj.message) {
            return {
                message: obj.message,
                code: obj.code,
                details: obj.details,
                hint: obj.hint,
            };
        }

        // Handle wrapper objects like { error: ... } or { data: { message: ... } }
        if (obj.error) return serializeError(obj.error);
        if (obj.message) return { message: obj.message, ...obj };
    }

    return data;
}

/**
 * Logger service - استخدم هذه الخدمة بدلاً من console.log
 * 
 * @example
 * import { logger } from '@/lib/utils/logger';
 * 
 * logger.debug('Debug message', { context: 'MyComponent' });
 * logger.info('Info message');
 * logger.warn('Warning message');
 * logger.error('Error message', { data: errorObject });
 */
export const logger = {
    /**
     * Debug log - يظهر فقط في development mode
     */
    debug: (message: string, options?: LogOptions): void => {
        if (isDev) {
            const formattedMessage = formatMessage('debug', message, options?.context);
            if (options?.data) {
                console.log(formattedMessage, options.data);
            } else {
                console.log(formattedMessage);
            }
        }
    },

    /**
     * Info log - للمعلومات العامة
     */
    info: (message: string, options?: LogOptions): void => {
        const formattedMessage = formatMessage('info', message, options?.context);
        if (options?.data) {
            console.info(formattedMessage, options.data);
        } else {
            console.info(formattedMessage);
        }
    },

    /**
     * Warning log - للتحذيرات
     */
    warn: (message: string, options?: LogOptions): void => {
        const formattedMessage = formatMessage('warn', message, options?.context);
        if (options?.data) {
            console.warn(formattedMessage, options.data);
        } else {
            console.warn(formattedMessage);
        }
    },

    /**
     * Error log - للأخطاء
     */
    error: (message: string, options?: LogOptions): void => {
        const formattedMessage = formatMessage('error', message, options?.context);
        if (options?.data) {
            // تحويل الـ Error object لشكل قابل للقراءة
            const errorData = serializeError(options.data);
            console.error(formattedMessage, errorData);
        } else {
            console.error(formattedMessage);
        }
    },

    /**
     * Game log - للـ game events (debug only)
     */
    game: (message: string, options?: LogOptions): void => {
        if (isDev) {
            const formattedMessage = formatMessage('debug', `🎮 ${message}`, options?.context || 'Game');
            if (options?.data) {
                console.log(formattedMessage, options.data);
            } else {
                console.log(formattedMessage);
            }
        }
    },

    /**
     * Socket log - للـ socket events (debug only)
     */
    socket: (message: string, options?: LogOptions): void => {
        if (isDev) {
            const formattedMessage = formatMessage('debug', `📡 ${message}`, options?.context || 'Socket');
            if (options?.data) {
                console.log(formattedMessage, options.data);
            } else {
                console.log(formattedMessage);
            }
        }
    },

    /**
     * Auth log - للـ authentication events (debug only)
     */
    auth: (message: string, options?: LogOptions): void => {
        if (isDev) {
            const formattedMessage = formatMessage('debug', `🔐 ${message}`, options?.context || 'Auth');
            if (options?.data) {
                console.log(formattedMessage, options.data);
            } else {
                console.log(formattedMessage);
            }
        }
    },
};

export default logger;
