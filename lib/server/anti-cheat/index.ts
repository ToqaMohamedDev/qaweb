/**
 * Anti-Cheat System
 * Server-side detection and flagging (no automatic bans)
 */

import type Redis from 'ioredis';
import { EventEmitter } from 'events';
import type {
    AntiCheatFlags,
    AntiCheatReport,
    AntiCheatAlert,
    RiskLevel,
    AlertSeverity,
} from '../types/index';
import { v4 as uuidv4 } from 'uuid';

export interface AntiCheatConfig {
    // Thresholds
    tabSwitchWarningThreshold: number;
    tabSwitchAlertThreshold: number;
    focusLostWarningThreshold: number;
    focusLostAlertThreshold: number;
    suspiciousFastAnswerMs: number;
    impossibleFastAnswerMs: number;

    // Pattern detection
    patternWindowMs: number;
    patternThreshold: number;

    // Scoring
    riskScoreThreshold: {
        low: number;
        medium: number;
        high: number;
        critical: number;
    };
}

const DEFAULT_CONFIG: AntiCheatConfig = {
    tabSwitchWarningThreshold: 3,
    tabSwitchAlertThreshold: 5,
    focusLostWarningThreshold: 3,
    focusLostAlertThreshold: 5,
    suspiciousFastAnswerMs: 1000,
    impossibleFastAnswerMs: 300,
    patternWindowMs: 60000, // 1 minute
    patternThreshold: 5,
    riskScoreThreshold: {
        low: 10,
        medium: 25,
        high: 50,
        critical: 75,
    },
};

interface PlayerFlags extends AntiCheatFlags {
    riskScore: number;
    patterns: SuspiciousPattern[];
    lastReportTime: number;
}

interface SuspiciousPattern {
    type: string;
    timestamp: number;
    data?: Record<string, unknown>;
}

export class AntiCheatSystem extends EventEmitter {
    private redis: Redis;
    private config: AntiCheatConfig;
    private playerFlags: Map<string, Map<string, PlayerFlags>> = new Map(); // roomId -> playerId -> flags

    constructor(redis: Redis, config: Partial<AntiCheatConfig> = {}) {
        super();
        this.redis = redis;
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /**
     * Initialize tracking for a player in a room
     */
    initializePlayer(roomId: string, playerId: string): void {
        if (!this.playerFlags.has(roomId)) {
            this.playerFlags.set(roomId, new Map());
        }

        const roomPlayers = this.playerFlags.get(roomId)!;
        if (!roomPlayers.has(playerId)) {
            roomPlayers.set(playerId, this.createDefaultFlags());
        }
    }

    /**
     * Process anti-cheat report from client
     */
    async processReport(
        roomId: string,
        playerId: string,
        playerName: string,
        report: AntiCheatReport
    ): Promise<void> {
        this.initializePlayer(roomId, playerId);
        const flags = this.getPlayerFlags(roomId, playerId);
        if (!flags) return;

        // Update flags based on report
        this.updateFlags(flags, report);

        // Detect patterns
        await this.detectPatterns(roomId, playerId, playerName, report);

        // Calculate risk score
        this.calculateRiskScore(flags);

        // Persist to Redis
        await this.persistFlags(roomId, playerId, flags);

        // Generate alerts if needed
        await this.checkAndGenerateAlerts(roomId, playerId, playerName, flags);
    }

    /**
     * Check answer timing for suspicious behavior
     */
    async checkAnswerTiming(
        roomId: string,
        playerId: string,
        playerName: string,
        timeTakenMs: number,
        questionIndex: number
    ): Promise<{ suspicious: boolean; reason?: string }> {
        this.initializePlayer(roomId, playerId);
        const flags = this.getPlayerFlags(roomId, playerId);
        if (!flags) return { suspicious: false };

        // Impossible fast answer
        if (timeTakenMs < this.config.impossibleFastAnswerMs) {
            const pattern: SuspiciousPattern = {
                type: 'IMPOSSIBLE_FAST_ANSWER',
                timestamp: Date.now(),
                data: { timeTakenMs, questionIndex },
            };
            flags.patterns.push(pattern);
            flags.suspiciousPatterns.push(`Impossible fast answer: ${timeTakenMs}ms`);

            await this.generateAlert(roomId, playerId, playerName, {
                alertType: 'IMPOSSIBLE_TIMING',
                severity: 'CRITICAL',
                details: `Answered in ${timeTakenMs}ms on question ${questionIndex + 1}. This is faster than humanly possible.`,
                flags,
            });

            return { suspicious: true, reason: 'IMPOSSIBLE_TIMING' };
        }

        // Suspiciously fast answer
        if (timeTakenMs < this.config.suspiciousFastAnswerMs) {
            const pattern: SuspiciousPattern = {
                type: 'SUSPICIOUS_FAST_ANSWER',
                timestamp: Date.now(),
                data: { timeTakenMs, questionIndex },
            };
            flags.patterns.push(pattern);

            // Check for pattern of fast answers
            const recentFastAnswers = flags.patterns.filter(
                p => p.type === 'SUSPICIOUS_FAST_ANSWER' &&
                    Date.now() - p.timestamp < this.config.patternWindowMs
            );

            if (recentFastAnswers.length >= 3) {
                flags.suspiciousPatterns.push('Pattern of very fast answers');

                await this.generateAlert(roomId, playerId, playerName, {
                    alertType: 'FAST_ANSWER_PATTERN',
                    severity: 'ALERT',
                    details: `${recentFastAnswers.length} answers in under ${this.config.suspiciousFastAnswerMs}ms each.`,
                    flags,
                });

                return { suspicious: true, reason: 'FAST_ANSWER_PATTERN' };
            }
        }

        await this.persistFlags(roomId, playerId, flags);
        return { suspicious: false };
    }

    /**
     * Get player flags
     */
    getPlayerFlags(roomId: string, playerId: string): PlayerFlags | null {
        return this.playerFlags.get(roomId)?.get(playerId) ?? null;
    }

    /**
     * Get all player flags for a room
     */
    getAllPlayerFlags(roomId: string): Map<string, PlayerFlags> | null {
        return this.playerFlags.get(roomId) ?? null;
    }

    /**
     * Get flagged players for admin dashboard
     */
    async getFlaggedPlayers(roomId: string): Promise<Array<{
        playerId: string;
        riskLevel: RiskLevel;
        riskScore: number;
        flags: AntiCheatFlags;
        patternCount: number;
    }>> {
        const roomPlayers = this.playerFlags.get(roomId);
        if (!roomPlayers) return [];

        const flaggedPlayers: Array<{
            playerId: string;
            riskLevel: RiskLevel;
            riskScore: number;
            flags: AntiCheatFlags;
            patternCount: number;
        }> = [];

        for (const [playerId, flags] of roomPlayers) {
            if (flags.riskLevel !== 'LOW' || flags.patterns.length > 0) {
                flaggedPlayers.push({
                    playerId,
                    riskLevel: flags.riskLevel,
                    riskScore: flags.riskScore,
                    flags: {
                        tabSwitches: flags.tabSwitches,
                        focusLostCount: flags.focusLostCount,
                        devToolsOpened: flags.devToolsOpened,
                        copyAttempts: flags.copyAttempts,
                        pasteAttempts: flags.pasteAttempts,
                        rightClickAttempts: flags.rightClickAttempts,
                        suspiciousPatterns: flags.suspiciousPatterns,
                        riskLevel: flags.riskLevel,
                        lastUpdated: flags.lastReportTime,
                    },
                    patternCount: flags.patterns.length,
                });
            }
        }

        // Sort by risk score
        flaggedPlayers.sort((a, b) => b.riskScore - a.riskScore);

        return flaggedPlayers;
    }

    /**
     * Create default flags
     */
    private createDefaultFlags(): PlayerFlags {
        return {
            tabSwitches: 0,
            focusLostCount: 0,
            devToolsOpened: false,
            copyAttempts: 0,
            pasteAttempts: 0,
            rightClickAttempts: 0,
            suspiciousPatterns: [],
            riskLevel: 'LOW',
            lastUpdated: Date.now(),
            riskScore: 0,
            patterns: [],
            lastReportTime: Date.now(),
        };
    }

    /**
     * Update flags from report
     */
    private updateFlags(flags: PlayerFlags, report: AntiCheatReport): void {
        const { flags: reportFlags, type, timestamp } = report;

        // Update counts
        flags.tabSwitches = Math.max(flags.tabSwitches, reportFlags.tabSwitches);
        flags.focusLostCount = Math.max(flags.focusLostCount, reportFlags.focusLostCount);
        flags.devToolsOpened = flags.devToolsOpened || reportFlags.devToolsOpened;
        flags.copyAttempts = Math.max(flags.copyAttempts, reportFlags.copyAttempts || 0);
        flags.pasteAttempts = Math.max(flags.pasteAttempts, reportFlags.pasteAttempts || 0);
        flags.rightClickAttempts = Math.max(flags.rightClickAttempts, reportFlags.rightClickAttempts || 0);

        // Add pattern
        flags.patterns.push({
            type,
            timestamp,
            data: report.metadata,
        });

        flags.lastReportTime = timestamp;
    }

    /**
     * Detect suspicious patterns
     */
    private async detectPatterns(
        roomId: string,
        playerId: string,
        playerName: string,
        report: AntiCheatReport
    ): Promise<void> {
        const flags = this.getPlayerFlags(roomId, playerId);
        if (!flags) return;

        const now = Date.now();

        // Tab switching pattern
        if (report.type === 'TAB_SWITCH') {
            const recentTabSwitches = flags.patterns.filter(
                p => p.type === 'TAB_SWITCH' && now - p.timestamp < this.config.patternWindowMs
            );

            if (recentTabSwitches.length >= this.config.tabSwitchAlertThreshold) {
                flags.suspiciousPatterns.push('Excessive tab switching');

                await this.generateAlert(roomId, playerId, playerName, {
                    alertType: 'EXCESSIVE_TAB_SWITCHING',
                    severity: 'ALERT',
                    details: `${recentTabSwitches.length} tab switches in the last minute.`,
                    flags,
                });
            }
        }

        // Focus lost pattern
        if (report.type === 'FOCUS_LOST') {
            const recentFocusLost = flags.patterns.filter(
                p => p.type === 'FOCUS_LOST' && now - p.timestamp < this.config.patternWindowMs
            );

            if (recentFocusLost.length >= this.config.focusLostAlertThreshold) {
                flags.suspiciousPatterns.push('Frequent focus loss');

                await this.generateAlert(roomId, playerId, playerName, {
                    alertType: 'FREQUENT_FOCUS_LOSS',
                    severity: 'WARNING',
                    details: `Lost focus ${recentFocusLost.length} times in the last minute.`,
                    flags,
                });
            }
        }

        // DevTools detection
        if (report.type.includes('DEVTOOLS')) {
            flags.devToolsOpened = true;
            flags.suspiciousPatterns.push('DevTools opened');

            await this.generateAlert(roomId, playerId, playerName, {
                alertType: 'DEVTOOLS_DETECTED',
                severity: 'ALERT',
                details: `Developer tools detected: ${report.type}`,
                flags,
            });
        }

        // Clean up old patterns
        flags.patterns = flags.patterns.filter(
            p => now - p.timestamp < this.config.patternWindowMs * 5
        );
    }

    /**
     * Calculate risk score
     */
    private calculateRiskScore(flags: PlayerFlags): void {
        let score = 0;

        // Tab switches
        score += flags.tabSwitches * 3;

        // Focus lost
        score += flags.focusLostCount * 2;

        // DevTools
        if (flags.devToolsOpened) score += 30;

        // Copy/Paste/Right-click attempts
        score += flags.copyAttempts * 5;
        score += flags.pasteAttempts * 5;
        score += flags.rightClickAttempts * 2;

        // Suspicious patterns
        score += flags.suspiciousPatterns.length * 10;

        // Fast answer patterns
        const fastAnswerPatterns = flags.patterns.filter(
            p => p.type.includes('FAST_ANSWER')
        ).length;
        score += fastAnswerPatterns * 5;

        flags.riskScore = score;

        // Determine risk level
        const thresholds = this.config.riskScoreThreshold;
        if (score >= thresholds.critical) {
            flags.riskLevel = 'CRITICAL';
        } else if (score >= thresholds.high) {
            flags.riskLevel = 'HIGH';
        } else if (score >= thresholds.medium) {
            flags.riskLevel = 'MEDIUM';
        } else {
            flags.riskLevel = 'LOW';
        }
    }

    /**
     * Persist flags to Redis
     */
    private async persistFlags(roomId: string, playerId: string, flags: PlayerFlags): Promise<void> {
        await this.redis.hset(`room:${roomId}:flags:${playerId}`, {
            tabSwitches: flags.tabSwitches.toString(),
            focusLostCount: flags.focusLostCount.toString(),
            devToolsOpened: flags.devToolsOpened.toString(),
            copyAttempts: flags.copyAttempts.toString(),
            pasteAttempts: flags.pasteAttempts.toString(),
            rightClickAttempts: flags.rightClickAttempts.toString(),
            suspiciousPatterns: JSON.stringify(flags.suspiciousPatterns),
            riskLevel: flags.riskLevel,
            riskScore: flags.riskScore.toString(),
            lastReportTime: flags.lastReportTime.toString(),
        });

        await this.redis.expire(`room:${roomId}:flags:${playerId}`, 86400);
    }

    /**
     * Check and generate alerts
     */
    private async checkAndGenerateAlerts(
        roomId: string,
        playerId: string,
        playerName: string,
        flags: PlayerFlags
    ): Promise<void> {
        // Risk level alerts
        if (flags.riskLevel === 'HIGH' || flags.riskLevel === 'CRITICAL') {
            await this.generateAlert(roomId, playerId, playerName, {
                alertType: 'HIGH_RISK_SCORE',
                severity: flags.riskLevel === 'CRITICAL' ? 'CRITICAL' : 'ALERT',
                details: `Risk score reached ${flags.riskScore}. Level: ${flags.riskLevel}`,
                flags,
            });
        }
    }

    /**
     * Generate alert for admin
     */
    private async generateAlert(
        roomId: string,
        playerId: string,
        playerName: string,
        data: {
            alertType: string;
            severity: AlertSeverity;
            details: string;
            flags: PlayerFlags;
        }
    ): Promise<AntiCheatAlert> {
        const alert: AntiCheatAlert = {
            id: uuidv4(),
            roomId,
            playerId,
            playerName,
            alertType: data.alertType,
            severity: data.severity,
            details: data.details,
            flags: {
                tabSwitches: data.flags.tabSwitches,
                focusLostCount: data.flags.focusLostCount,
                devToolsOpened: data.flags.devToolsOpened,
                copyAttempts: data.flags.copyAttempts,
                pasteAttempts: data.flags.pasteAttempts,
                rightClickAttempts: data.flags.rightClickAttempts,
                suspiciousPatterns: data.flags.suspiciousPatterns,
                riskLevel: data.flags.riskLevel,
                lastUpdated: data.flags.lastReportTime,
            },
            timestamp: Date.now(),
            reviewed: false,
        };

        // Store in Redis
        await this.redis.rpush(`room:${roomId}:alerts`, JSON.stringify(alert));
        await this.redis.expire(`room:${roomId}:alerts`, 86400);

        // Emit event for WebSocket notification
        this.emit('alert', alert);

        return alert;
    }

    /**
     * Get all alerts for a room
     */
    async getAlerts(roomId: string): Promise<AntiCheatAlert[]> {
        const alertsRaw = await this.redis.lrange(`room:${roomId}:alerts`, 0, -1);
        return alertsRaw.map(a => JSON.parse(a) as AntiCheatAlert);
    }

    /**
     * Mark alert as reviewed
     */
    async reviewAlert(
        roomId: string,
        alertId: string,
        reviewedBy: string,
        actionTaken?: string
    ): Promise<void> {
        const alerts = await this.getAlerts(roomId);
        const alertIndex = alerts.findIndex(a => a.id === alertId);

        if (alertIndex === -1) return;

        alerts[alertIndex]!.reviewed = true;
        alerts[alertIndex]!.reviewedBy = reviewedBy;
        alerts[alertIndex]!.actionTaken = actionTaken;

        // Update in Redis
        await this.redis.lset(`room:${roomId}:alerts`, alertIndex, JSON.stringify(alerts[alertIndex]));
    }

    /**
     * Cleanup room data
     */
    async cleanupRoom(roomId: string): Promise<void> {
        this.playerFlags.delete(roomId);
    }
}

/**
 * Frontend Anti-Cheat Monitor (for reference - runs on client)
 * This is ONLY for detection - all decisions are made server-side
 */
export const FRONTEND_ANTICHEAT_CODE = `
class AntiCheatMonitor {
  constructor(socket) {
    this.socket = socket;
    this.flags = {
      tabSwitches: 0,
      focusLostCount: 0,
      devToolsOpened: false,
      copyAttempts: 0,
      pasteAttempts: 0,
      rightClickAttempts: 0,
      suspiciousPatterns: []
    };
    this.initializeMonitors();
  }

  initializeMonitors() {
    // Tab visibility
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.flags.tabSwitches++;
        this.report('TAB_SWITCH');
      }
    });

    // Window focus
    window.addEventListener('blur', () => {
      this.flags.focusLostCount++;
      this.report('FOCUS_LOST');
    });

    // DevTools detection (heuristic)
    this.detectDevTools();

    // Disable actions
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.flags.rightClickAttempts++;
      this.report('RIGHT_CLICK_ATTEMPT');
    });

    document.addEventListener('copy', (e) => {
      e.preventDefault();
      this.flags.copyAttempts++;
      this.report('COPY_ATTEMPT');
    });

    document.addEventListener('paste', (e) => {
      e.preventDefault();
      this.flags.pasteAttempts++;
      this.report('PASTE_ATTEMPT');
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Ctrl+C, Ctrl+V, Ctrl+U
      if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'u'].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
      // F12 or Ctrl+Shift+I
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
        e.preventDefault();
        this.flags.devToolsOpened = true;
        this.report('DEVTOOLS_SHORTCUT');
      }
    });
  }

  detectDevTools() {
    const threshold = 160;
    
    const check = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      
      if ((widthThreshold || heightThreshold) && !this.flags.devToolsOpened) {
        this.flags.devToolsOpened = true;
        this.report('DEVTOOLS_SIZE');
      }
    };
    
    setInterval(check, 1000);
  }

  report(type) {
    this.socket.emit('anticheat:report', {
      type,
      flags: { ...this.flags },
      timestamp: Date.now()
    });
  }
}
`;
