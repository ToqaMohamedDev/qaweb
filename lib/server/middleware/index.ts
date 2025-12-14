/**
 * Authentication Middleware
 * Protects API routes with JWT verification
 */

import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { AuthTokenPayload } from '../types/index';
import { Logger } from '../utils/logger';

const logger = new Logger('AuthMiddleware');

// Extend Express Request type
declare global {
    namespace Express {
        interface Request {
            user?: AuthTokenPayload;
        }
    }
}

/**
 * JWT Authentication Middleware
 * Verifies the Bearer token and attaches user info to request
 */
export function authenticateToken(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
        ? authHeader.slice(7)
        : null;

    if (!token) {
        res.status(401).json({
            error: 'Authentication required',
            code: 'NO_TOKEN',
        });
        return;
    }

    try {
        const secret = process.env.JWT_SECRET || 'your-secret-key';
        const decoded = jwt.verify(token, secret) as AuthTokenPayload;
        req.user = decoded;
        next();
    } catch (error) {
        logger.warn('Invalid token attempt', { error: (error as Error).message });
        res.status(401).json({
            error: 'Invalid or expired token',
            code: 'INVALID_TOKEN',
        });
    }
}

/**
 * Optional Authentication Middleware
 * Attaches user info if token is valid, but doesn't require it
 */
export function optionalAuth(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
        ? authHeader.slice(7)
        : null;

    if (token) {
        try {
            const secret = process.env.JWT_SECRET || 'your-secret-key';
            const decoded = jwt.verify(token, secret) as AuthTokenPayload;
            req.user = decoded;
        } catch {
            // Token invalid, but continue without user
        }
    }

    next();
}

/**
 * Admin Role Middleware
 * Requires authenticated user with ADMIN role
 */
export function requireAdmin(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    if (!req.user) {
        res.status(401).json({
            error: 'Authentication required',
            code: 'NO_AUTH',
        });
        return;
    }

    if (req.user.role !== 'ADMIN') {
        res.status(403).json({
            error: 'Admin access required',
            code: 'NOT_ADMIN',
        });
        return;
    }

    next();
}

/**
 * Rate Limiting Middleware
 * Basic in-memory rate limiting (use Redis in production)
 */
const requestCounts = new Map<string, { count: number; resetAt: number }>();

export function rateLimiter(
    maxRequests: number = 100,
    windowMs: number = 60000
) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const key = req.ip || req.headers['x-forwarded-for'] as string || 'unknown';
        const now = Date.now();

        let record = requestCounts.get(key);

        if (!record || now > record.resetAt) {
            record = { count: 1, resetAt: now + windowMs };
            requestCounts.set(key, record);
        } else {
            record.count++;
        }

        if (record.count > maxRequests) {
            res.status(429).json({
                error: 'Too many requests',
                code: 'RATE_LIMITED',
                retryAfter: Math.ceil((record.resetAt - now) / 1000),
            });
            return;
        }

        // Add rate limit headers
        res.setHeader('X-RateLimit-Limit', maxRequests);
        res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count));
        res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetAt / 1000));

        next();
    };
}

/**
 * Request Validation Middleware
 * Validates request body using Zod schema
 */
import { z } from 'zod';

export function validateBody<T extends z.ZodType>(schema: T) {
    return (req: Request, res: Response, next: NextFunction): void => {
        try {
            req.body = schema.parse(req.body);
            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({
                    error: 'Validation failed',
                    code: 'VALIDATION_ERROR',
                    details: error.issues.map(e => ({
                        field: e.path.join('.'),
                        message: e.message,
                    })),
                });
            } else {
                next(error);
            }
        }
    };
}

/**
 * Error Handler Middleware
 * Catches unhandled errors and formats response
 */
export function errorHandler(
    err: Error,
    req: Request,
    res: Response,
    _next: NextFunction
): void {
    logger.error('Unhandled error', err);

    // Don't expose internal errors in production
    const isDev = process.env.NODE_ENV === 'development';

    res.status(500).json({
        error: isDev ? err.message : 'Internal server error',
        code: 'INTERNAL_ERROR',
        stack: isDev ? err.stack : undefined,
    });
}

/**
 * Request Logger Middleware
 */
export function requestLogger(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.debug(`${req.method} ${req.path}`, {
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userId: req.user?.userId,
        });
    });

    next();
}
