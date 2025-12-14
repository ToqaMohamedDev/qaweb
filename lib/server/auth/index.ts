/**
 * Authentication Service
 * JWT-based authentication for the Quiz Battle Platform
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import type Redis from 'ioredis';
import type {
    User,
    Session,
    AuthTokenPayload,
} from '../types/index';
import { Logger } from '../utils/logger';

export interface AuthConfig {
    jwtSecret: string;
    jwtExpiresIn: string;
    refreshExpiresIn: string;
    bcryptRounds: number;
    sessionMaxAge: number; // in seconds
}

const DEFAULT_CONFIG: AuthConfig = {
    jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    bcryptRounds: 10,
    sessionMaxAge: 30 * 24 * 60 * 60, // 30 days
};

export class AuthService {
    private redis: Redis;
    private config: AuthConfig;
    private logger: Logger;

    constructor(redis: Redis, config: Partial<AuthConfig> = {}) {
        this.redis = redis;
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.logger = new Logger('AuthService');
    }

    // ═══════════════════════════════════════════════════════════
    // USER MANAGEMENT
    // ═══════════════════════════════════════════════════════════

    /**
     * Register a new user
     */
    async register(
        email: string,
        password: string,
        displayName: string
    ): Promise<{ success: boolean; user?: User; token?: string; error?: string }> {
        try {
            // Check if email already exists
            const existingUser = await this.redis.hget('users:email_index', email.toLowerCase());
            if (existingUser) {
                return { success: false, error: 'Email already registered' };
            }

            // Hash password
            const passwordHash = await bcrypt.hash(password, this.config.bcryptRounds);

            // Create user
            const userId = uuidv4();
            const user: User = {
                id: userId,
                email: email.toLowerCase(),
                displayName,
                passwordHash,
                role: 'PLAYER',
                stats: {
                    gamesPlayed: 0,
                    gamesWon: 0,
                    totalScore: 0,
                    correctAnswers: 0,
                    averageAccuracy: 0,
                },
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            // Store user
            await this.redis.hset(`user:${userId}`, {
                id: userId,
                email: user.email,
                displayName: user.displayName,
                passwordHash: user.passwordHash,
                role: user.role,
                stats: JSON.stringify(user.stats),
                createdAt: user.createdAt.toISOString(),
                updatedAt: user.updatedAt.toISOString(),
            });

            // Index by email
            await this.redis.hset('users:email_index', email.toLowerCase(), userId);
            await this.redis.hset(`users:${userId}`, 'displayName', displayName);

            // Generate tokens
            const { accessToken } = await this.createSession(user);

            this.logger.info(`User registered: ${userId}`);

            // Return user without password hash
            const safeUser = { ...user };
            delete (safeUser as any).passwordHash;

            return { success: true, user: safeUser, token: accessToken };
        } catch (error) {
            this.logger.error('Registration failed', error as Error);
            return { success: false, error: 'Registration failed' };
        }
    }

    /**
     * Login user
     */
    async login(
        email: string,
        password: string,
        deviceFingerprint?: string,
        ipHash?: string
    ): Promise<{ success: boolean; user?: User; token?: string; refreshToken?: string; error?: string }> {
        try {
            // Find user by email
            const userId = await this.redis.hget('users:email_index', email.toLowerCase());
            if (!userId) {
                return { success: false, error: 'Invalid email or password' };
            }

            // Get user data
            const userData = await this.redis.hgetall(`user:${userId}`);
            if (!userData || !userData.passwordHash) {
                return { success: false, error: 'Invalid email or password' };
            }

            // Verify password
            const validPassword = await bcrypt.compare(password, userData.passwordHash);
            if (!validPassword) {
                return { success: false, error: 'Invalid email or password' };
            }

            // Parse user
            const user: User = {
                id: userData.id!,
                email: userData.email!,
                displayName: userData.displayName!,
                passwordHash: userData.passwordHash,
                role: userData.role as 'ADMIN' | 'PLAYER',
                stats: JSON.parse(userData.stats || '{}'),
                createdAt: new Date(userData.createdAt!),
                updatedAt: new Date(userData.updatedAt!),
            };

            // Create session
            const { accessToken, refreshToken, session } = await this.createSession(
                user,
                deviceFingerprint,
                ipHash
            );

            this.logger.info(`User logged in: ${userId}`);

            // Return user without password hash
            const safeUser = { ...user };
            delete (safeUser as any).passwordHash;

            return { success: true, user: safeUser, token: accessToken, refreshToken };
        } catch (error) {
            this.logger.error('Login failed', error as Error);
            return { success: false, error: 'Login failed' };
        }
    }

    /**
     * Logout user
     */
    async logout(sessionId: string, userId: string): Promise<void> {
        try {
            await this.redis.hdel(`sessions:${userId}`, sessionId);
            this.logger.info(`User logged out: ${userId}, session: ${sessionId}`);
        } catch (error) {
            this.logger.error('Logout failed', error as Error);
        }
    }

    // ═══════════════════════════════════════════════════════════
    // SESSION MANAGEMENT
    // ═══════════════════════════════════════════════════════════

    /**
     * Create a new session
     */
    private async createSession(
        user: User,
        deviceFingerprint?: string,
        ipHash?: string
    ): Promise<{ accessToken: string; refreshToken: string; session: Session }> {
        const sessionId = uuidv4();

        const session: Session = {
            id: sessionId,
            userId: user.id,
            deviceFingerprint,
            ipHash,
            isValid: true,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + this.config.sessionMaxAge * 1000),
            lastActivity: new Date(),
        };

        // Store session
        await this.redis.hset(`sessions:${user.id}`, sessionId, JSON.stringify(session));
        await this.redis.expire(`sessions:${user.id}`, this.config.sessionMaxAge);

        // Generate tokens
        const tokenPayload = {
            userId: user.id,
            sessionId,
            role: user.role,
            deviceFingerprint,
        };

        const accessToken = jwt.sign(tokenPayload, this.config.jwtSecret, {
            expiresIn: this.config.jwtExpiresIn as `${number}d` | `${number}h`,
        });

        const refreshToken = jwt.sign(
            { ...tokenPayload, isRefresh: true },
            this.config.jwtSecret,
            { expiresIn: this.config.refreshExpiresIn as `${number}d` | `${number}h` }
        );

        return { accessToken, refreshToken, session };
    }

    /**
     * Validate session
     */
    async validateSession(sessionId: string, userId: string): Promise<boolean> {
        try {
            const sessionData = await this.redis.hget(`sessions:${userId}`, sessionId);
            if (!sessionData) return false;

            const session: Session = JSON.parse(sessionData);
            if (!session.isValid) return false;
            if (new Date(session.expiresAt) < new Date()) return false;

            // Update last activity
            session.lastActivity = new Date();
            await this.redis.hset(`sessions:${userId}`, sessionId, JSON.stringify(session));

            return true;
        } catch (error) {
            this.logger.error('Session validation failed', error as Error);
            return false;
        }
    }

    /**
     * Refresh access token
     */
    async refreshToken(
        refreshToken: string
    ): Promise<{ success: boolean; token?: string; error?: string }> {
        try {
            const decoded = jwt.verify(refreshToken, this.config.jwtSecret) as AuthTokenPayload & { isRefresh?: boolean };

            if (!decoded.isRefresh) {
                return { success: false, error: 'Invalid refresh token' };
            }

            // Validate session
            const isValid = await this.validateSession(decoded.sessionId, decoded.userId);
            if (!isValid) {
                return { success: false, error: 'Session expired' };
            }

            // Generate new access token
            const tokenPayload = {
                userId: decoded.userId,
                sessionId: decoded.sessionId,
                role: decoded.role,
                deviceFingerprint: decoded.deviceFingerprint,
            };

            const newToken = jwt.sign(tokenPayload, this.config.jwtSecret, {
                expiresIn: this.config.jwtExpiresIn as `${number}d` | `${number}h`,
            });

            return { success: true, token: newToken };
        } catch (error) {
            this.logger.error('Token refresh failed', error as Error);
            return { success: false, error: 'Invalid refresh token' };
        }
    }

    /**
     * Verify JWT token
     */
    verifyToken(token: string): AuthTokenPayload | null {
        try {
            return jwt.verify(token, this.config.jwtSecret) as AuthTokenPayload;
        } catch {
            return null;
        }
    }

    // ═══════════════════════════════════════════════════════════
    // USER QUERIES
    // ═══════════════════════════════════════════════════════════

    /**
     * Get user by ID
     */
    async getUserById(userId: string): Promise<User | null> {
        try {
            const userData = await this.redis.hgetall(`user:${userId}`);
            if (!userData || !userData.id) return null;

            return {
                id: userData.id,
                email: userData.email!,
                displayName: userData.displayName!,
                passwordHash: userData.passwordHash!,
                role: userData.role as 'ADMIN' | 'PLAYER',
                stats: JSON.parse(userData.stats || '{}'),
                createdAt: new Date(userData.createdAt!),
                updatedAt: new Date(userData.updatedAt!),
            };
        } catch (error) {
            this.logger.error('Get user failed', error as Error);
            return null;
        }
    }

    /**
     * Update user profile
     */
    async updateProfile(
        userId: string,
        updates: { displayName?: string; avatarUrl?: string }
    ): Promise<boolean> {
        try {
            const updateData: Record<string, string> = {
                updatedAt: new Date().toISOString(),
            };

            if (updates.displayName) {
                updateData.displayName = updates.displayName;
                await this.redis.hset(`users:${userId}`, 'displayName', updates.displayName);
            }
            if (updates.avatarUrl) updateData.avatarUrl = updates.avatarUrl;

            await this.redis.hset(`user:${userId}`, updateData);
            return true;
        } catch (error) {
            this.logger.error('Update profile failed', error as Error);
            return false;
        }
    }

    /**
     * Update user stats after a game
     */
    async updateUserStats(
        userId: string,
        gameResult: {
            won: boolean;
            score: number;
            correctAnswers: number;
            totalQuestions: number;
        }
    ): Promise<void> {
        try {
            const user = await this.getUserById(userId);
            if (!user) return;

            const stats = user.stats;
            stats.gamesPlayed++;
            if (gameResult.won) stats.gamesWon++;
            stats.totalScore += gameResult.score;
            stats.correctAnswers += gameResult.correctAnswers;

            const totalAnswered = stats.gamesPlayed * gameResult.totalQuestions;
            stats.averageAccuracy = totalAnswered > 0
                ? (stats.correctAnswers / totalAnswered) * 100
                : 0;

            await this.redis.hset(`user:${userId}`, {
                stats: JSON.stringify(stats),
                updatedAt: new Date().toISOString(),
            });
        } catch (error) {
            this.logger.error('Update user stats failed', error as Error);
        }
    }

    /**
     * Change password
     */
    async changePassword(
        userId: string,
        currentPassword: string,
        newPassword: string
    ): Promise<{ success: boolean; error?: string }> {
        try {
            const user = await this.getUserById(userId);
            if (!user) {
                return { success: false, error: 'User not found' };
            }

            // Verify current password
            const valid = await bcrypt.compare(currentPassword, user.passwordHash!);
            if (!valid) {
                return { success: false, error: 'Current password is incorrect' };
            }

            // Hash new password
            const newHash = await bcrypt.hash(newPassword, this.config.bcryptRounds);

            // Update password
            await this.redis.hset(`user:${userId}`, {
                passwordHash: newHash,
                updatedAt: new Date().toISOString(),
            });

            // Invalidate all sessions except current
            // (In production, keep the current session ID and invalidate others)

            return { success: true };
        } catch (error) {
            this.logger.error('Change password failed', error as Error);
            return { success: false, error: 'Password change failed' };
        }
    }
}
