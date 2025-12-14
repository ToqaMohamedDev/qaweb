/**
 * Logger Utility
 * Structured logging with different levels
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    context: string;
    message: string;
    data?: Record<string, unknown>;
    error?: {
        message: string;
        stack?: string;
    };
}

export class Logger {
    private context: string;
    private static level: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';
    private static levels: Record<LogLevel, number> = {
        debug: 0,
        info: 1,
        warn: 2,
        error: 3,
    };

    constructor(context: string) {
        this.context = context;
    }

    private shouldLog(level: LogLevel): boolean {
        return Logger.levels[level] >= Logger.levels[Logger.level];
    }

    private formatEntry(
        level: LogLevel,
        message: string,
        data?: Record<string, unknown> | Error
    ): LogEntry {
        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            context: this.context,
            message,
        };

        if (data instanceof Error) {
            entry.error = {
                message: data.message,
                stack: data.stack,
            };
        } else if (data) {
            entry.data = data;
        }

        return entry;
    }

    private output(entry: LogEntry): void {
        const color = {
            debug: '\x1b[36m', // Cyan
            info: '\x1b[32m',  // Green
            warn: '\x1b[33m',  // Yellow
            error: '\x1b[31m', // Red
        };
        const reset = '\x1b[0m';

        if (process.env.NODE_ENV === 'production') {
            // JSON output for production
            console.log(JSON.stringify(entry));
        } else {
            // Formatted output for development
            const prefix = `${color[entry.level]}[${entry.level.toUpperCase()}]${reset}`;
            const contextStr = `\x1b[90m[${entry.context}]${reset}`;
            const timeStr = `\x1b[90m${entry.timestamp}${reset}`;

            console.log(`${timeStr} ${prefix} ${contextStr} ${entry.message}`);

            if (entry.data) {
                console.log('  Data:', JSON.stringify(entry.data, null, 2));
            }

            if (entry.error?.stack) {
                console.log('  Stack:', entry.error.stack);
            }
        }
    }

    debug(message: string, data?: Record<string, unknown>): void {
        if (this.shouldLog('debug')) {
            this.output(this.formatEntry('debug', message, data));
        }
    }

    info(message: string, data?: Record<string, unknown>): void {
        if (this.shouldLog('info')) {
            this.output(this.formatEntry('info', message, data));
        }
    }

    warn(message: string, data?: Record<string, unknown>): void {
        if (this.shouldLog('warn')) {
            this.output(this.formatEntry('warn', message, data));
        }
    }

    error(message: string, error?: Error | Record<string, unknown>): void {
        if (this.shouldLog('error')) {
            this.output(this.formatEntry('error', message, error));
        }
    }

    static setLevel(level: LogLevel): void {
        Logger.level = level;
    }
}

/**
 * Event Logger
 * Logs game events for analytics and debugging
 */
export class EventLogger {
    private redis: any; // Redis client type
    private logger: Logger;

    constructor(redis: any) {
        this.redis = redis;
        this.logger = new Logger('EventLogger');
    }

    async logEvent(
        eventType: string,
        eventData: Record<string, unknown>,
        options?: {
            roomId?: string;
            userId?: string;
            ipHash?: string;
        }
    ): Promise<void> {
        const event = {
            id: this.generateId(),
            type: eventType,
            data: eventData,
            roomId: options?.roomId,
            userId: options?.userId,
            ipHash: options?.ipHash,
            timestamp: Date.now(),
        };

        try {
            // Store in Redis stream
            if (options?.roomId) {
                await this.redis.xadd(
                    `room:${options.roomId}:events`,
                    '*',
                    'type', eventType,
                    'data', JSON.stringify(eventData),
                    'userId', options.userId || '',
                    'timestamp', event.timestamp.toString()
                );
            }

            // Also store in global event log
            await this.redis.xadd(
                'events:global',
                '*',
                'type', eventType,
                'roomId', options?.roomId || '',
                'userId', options?.userId || '',
                'data', JSON.stringify(eventData),
                'timestamp', event.timestamp.toString()
            );

            this.logger.debug(`Event logged: ${eventType}`, { eventData });
        } catch (error) {
            this.logger.error('Failed to log event', error as Error);
        }
    }

    async getEvents(
        roomId: string,
        options?: {
            limit?: number;
            since?: number;
            eventType?: string;
        }
    ): Promise<Record<string, unknown>[]> {
        try {
            const start = options?.since ? options.since.toString() : '-';
            const limit = options?.limit ?? 100;

            const events = await this.redis.xrange(
                `room:${roomId}:events`,
                start,
                '+',
                'COUNT',
                limit
            );

            return events.map((entry: any) => ({
                id: entry[0],
                ...this.parseEventFields(entry[1]),
            }));
        } catch (error) {
            this.logger.error('Failed to get events', error as Error);
            return [];
        }
    }

    private parseEventFields(fields: string[]): Record<string, unknown> {
        const result: Record<string, string> = {};
        for (let i = 0; i < fields.length; i += 2) {
            const key = fields[i];
            const value = fields[i + 1];
            if (key && value !== undefined) {
                result[key] = value;
            }
        }

        // Parse data JSON
        if (result.data) {
            try {
                result.data = JSON.parse(result.data);
            } catch {
                // Keep as string if not valid JSON
            }
        }

        return result;
    }

    private generateId(): string {
        return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    }
}
