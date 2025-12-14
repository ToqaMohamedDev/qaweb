/**
 * Validation Schemas
 * Zod schemas for request validation
 */

import { z } from 'zod';

// ═══════════════════════════════════════════════════════════
// AUTH SCHEMAS
// ═══════════════════════════════════════════════════════════

export const registerSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
    displayName: z.string()
        .min(2, 'Display name must be at least 2 characters')
        .max(50, 'Display name cannot exceed 50 characters')
        .regex(/^[a-zA-Z0-9_\- ]+$/, 'Display name can only contain letters, numbers, underscores, hyphens, and spaces'),
});

export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
    deviceFingerprint: z.string().optional(),
});

export const refreshTokenSchema = z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const updateProfileSchema = z.object({
    displayName: z.string()
        .min(2, 'Display name must be at least 2 characters')
        .max(50, 'Display name cannot exceed 50 characters')
        .optional(),
    avatarUrl: z.string().url('Invalid avatar URL').optional(),
});

// ═══════════════════════════════════════════════════════════
// ROOM SCHEMAS
// ═══════════════════════════════════════════════════════════

export const createRoomSchema = z.object({
    title: z.string()
        .min(3, 'Title must be at least 3 characters')
        .max(100, 'Title cannot exceed 100 characters'),
    settings: z.object({
        maxTeams: z.number().min(2).max(20).optional(),
        maxPlayersPerTeam: z.number().min(1).max(10).optional(),
        questionTimeSeconds: z.number().min(5).max(60).optional(),
        showResultsSeconds: z.number().min(2).max(30).optional(),
        countdownSeconds: z.number().min(1).max(10).optional(),
        allowReconnect: z.boolean().optional(),
        reconnectTimeoutSeconds: z.number().min(10).max(300).optional(),
        shuffleQuestions: z.boolean().optional(),
        shuffleOptions: z.boolean().optional(),
    }).optional(),
});

export const joinRoomSchema = z.object({
    roomCode: z.string().length(6, 'Room code must be 6 characters').optional(),
    inviteToken: z.string().min(1).optional(),
    teamId: z.string().uuid().optional(),
}).refine(data => data.roomCode || data.inviteToken, {
    message: 'Either roomCode or inviteToken is required',
});

export const createTeamSchema = z.object({
    name: z.string()
        .min(2, 'Team name must be at least 2 characters')
        .max(30, 'Team name cannot exceed 30 characters'),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').optional(),
});

// ═══════════════════════════════════════════════════════════
// QUESTION SCHEMAS
// ═══════════════════════════════════════════════════════════

const questionOptionSchema = z.object({
    id: z.string().length(1),
    text: z.string().min(1, 'Option text is required').max(500),
});

export const questionSchema = z.object({
    articleHtml: z.string().max(10000).optional().nullable(),
    questionText: z.string().min(5, 'Question must be at least 5 characters').max(1000),
    options: z.array(questionOptionSchema)
        .min(2, 'At least 2 options required')
        .max(6, 'Maximum 6 options allowed'),
    correctOption: z.string().length(1),
    timeLimitSeconds: z.number().min(5).max(120).optional(),
});

export const addQuestionsSchema = z.object({
    questions: z.array(questionSchema).min(1, 'At least 1 question required'),
});

export const submitAnswerSchema = z.object({
    questionId: z.string().uuid('Invalid question ID'),
    answer: z.string().length(1, 'Answer must be a single character'),
    clientTimestamp: z.number().positive('Invalid timestamp'),
});

// ═══════════════════════════════════════════════════════════
// ADMIN SCHEMAS
// ═══════════════════════════════════════════════════════════

export const kickPlayerSchema = z.object({
    playerId: z.string().uuid('Invalid player ID'),
    reason: z.string().max(200).optional().default('Removed by admin'),
});

export const goToQuestionSchema = z.object({
    questionIndex: z.number().min(0).int('Question index must be an integer'),
});

export const broadcastMessageSchema = z.object({
    content: z.string()
        .min(1, 'Message cannot be empty')
        .max(500, 'Message cannot exceed 500 characters'),
});

// ═══════════════════════════════════════════════════════════
// ANTI-CHEAT SCHEMAS
// ═══════════════════════════════════════════════════════════

export const antiCheatReportSchema = z.object({
    type: z.string().min(1),
    flags: z.object({
        tabSwitches: z.number().min(0),
        focusLostCount: z.number().min(0),
        devToolsOpened: z.boolean(),
        copyAttempts: z.number().min(0).optional(),
        pasteAttempts: z.number().min(0).optional(),
        rightClickAttempts: z.number().min(0).optional(),
    }),
    timestamp: z.number().positive(),
    metadata: z.record(z.string(), z.unknown()).optional(),
});

// ═══════════════════════════════════════════════════════════
// TYPE EXPORTS
// ═══════════════════════════════════════════════════════════

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type JoinRoomInput = z.infer<typeof joinRoomSchema>;
export type CreateTeamInput = z.infer<typeof createTeamSchema>;
export type QuestionInput = z.infer<typeof questionSchema>;
export type AddQuestionsInput = z.infer<typeof addQuestionsSchema>;
export type SubmitAnswerInput = z.infer<typeof submitAnswerSchema>;
export type KickPlayerInput = z.infer<typeof kickPlayerSchema>;
export type GoToQuestionInput = z.infer<typeof goToQuestionSchema>;
export type BroadcastMessageInput = z.infer<typeof broadcastMessageSchema>;
export type AntiCheatReportInput = z.infer<typeof antiCheatReportSchema>;
