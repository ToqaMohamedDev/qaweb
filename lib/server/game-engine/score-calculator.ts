/**
 * Score Calculator
 * Calculates player and team scores with various scoring strategies
 */

import type Redis from 'ioredis';
import type {
    StoredAnswer,
    PlayerQuestionResult,
    QuestionResults,
    QuestionStatistics,
    Leaderboard,
    LeaderboardEntry,
    TeamScore,
    Player,
    AnswerResult,
} from '../types/index';

export interface ScoringConfig {
    baseScore: number;
    maxTimeBonus: number;
    questionTimeMs: number;
    enableTimeBonus: boolean;
    enableStreakBonus: boolean;
    streakBonusPerQuestion: number;
    maxStreakBonus: number;
}

const DEFAULT_SCORING_CONFIG: ScoringConfig = {
    baseScore: 100,
    maxTimeBonus: 50,
    questionTimeMs: 10000,
    enableTimeBonus: true,
    enableStreakBonus: false,
    streakBonusPerQuestion: 10,
    maxStreakBonus: 50,
};

export class ScoreCalculator {
    private redis: Redis;
    private config: ScoringConfig;

    constructor(redis: Redis, config: Partial<ScoringConfig> = {}) {
        this.redis = redis;
        this.config = { ...DEFAULT_SCORING_CONFIG, ...config };
    }

    /**
     * Calculate score for a single correct answer
     */
    calculateScore(timeTakenMs: number, streakCount: number = 0): number {
        let score = this.config.baseScore;

        // Time bonus: faster answers get more points
        if (this.config.enableTimeBonus) {
            const timeRatio = Math.max(0, 1 - timeTakenMs / this.config.questionTimeMs);
            const timeBonus = Math.round(this.config.maxTimeBonus * timeRatio);
            score += timeBonus;
        }

        // Streak bonus: consecutive correct answers
        if (this.config.enableStreakBonus && streakCount > 0) {
            const streakBonus = Math.min(
                streakCount * this.config.streakBonusPerQuestion,
                this.config.maxStreakBonus
            );
            score += streakBonus;
        }

        return score;
    }

    /**
     * Calculate results for all players after a question closes
     */
    async calculateQuestionResults(
        roomId: string,
        questionIndex: number,
        correctAnswer: string
    ): Promise<QuestionResults> {
        // Get all players
        const playerIds = await this.redis.smembers(`room:${roomId}:players`);

        // Get all answers
        const answersKey = `room:${roomId}:q:${questionIndex}:answers`;
        const answersRaw = await this.redis.hgetall(answersKey);

        // Get existing scores for streak calculation
        const existingScoresRaw = await this.redis.hgetall(`room:${roomId}:scores`);
        const existingScores: Record<string, number> = {};
        for (const [id, score] of Object.entries(existingScoresRaw)) {
            existingScores[id] = parseInt(score) || 0;
        }

        // Get player info
        const playersRaw = await this.redis.hgetall(`room:${roomId}:playerInfo`);

        // Calculate results for each player
        const playerResults: PlayerQuestionResult[] = [];
        const scoreUpdates: Record<string, number> = {};
        const teamScoreUpdates: Record<string, number> = {};

        // Statistics tracking
        const stats: QuestionStatistics = {
            totalPlayers: playerIds.length,
            answered: 0,
            skipped: 0,
            correct: 0,
            incorrect: 0,
            averageTimeMs: 0,
            optionDistribution: {},
        };

        let totalAnswerTime = 0;
        let fastestTime: number | undefined;
        let fastestPlayerId: string | undefined;

        for (const playerId of playerIds) {
            const playerInfo = playersRaw[playerId] ? JSON.parse(playersRaw[playerId]) : null;
            const playerName = playerInfo?.displayName || 'Unknown Player';
            const teamId = playerInfo?.teamId;

            const answerRaw = answersRaw[playerId];
            let result: AnswerResult;
            let scoreEarned = 0;
            let answer: string | undefined;
            let timeTakenMs: number | undefined;

            if (!answerRaw) {
                // Player skipped
                result = 'SKIPPED';
                stats.skipped++;
            } else {
                const answerData: StoredAnswer = JSON.parse(answerRaw);
                answer = answerData.answer;
                timeTakenMs = answerData.timeTakenMs;
                stats.answered++;
                totalAnswerTime += timeTakenMs;

                // Track option distribution
                stats.optionDistribution[answer] = (stats.optionDistribution[answer] || 0) + 1;

                if (answer === correctAnswer) {
                    result = 'CORRECT';
                    stats.correct++;

                    // Track fastest
                    if (fastestTime === undefined || timeTakenMs < fastestTime) {
                        fastestTime = timeTakenMs;
                        fastestPlayerId = playerId;
                    }

                    // Calculate score
                    scoreEarned = this.calculateScore(timeTakenMs);
                    scoreUpdates[playerId] = scoreEarned;

                    // Update team score
                    if (teamId) {
                        teamScoreUpdates[teamId] = (teamScoreUpdates[teamId] || 0) + scoreEarned;
                    }
                } else {
                    result = 'INCORRECT';
                    stats.incorrect++;
                }
            }

            playerResults.push({
                playerId,
                playerName,
                teamId,
                answer,
                result,
                timeTakenMs,
                scoreEarned,
                totalScore: (existingScores[playerId] || 0) + scoreEarned,
            });
        }

        // Update statistics
        stats.averageTimeMs = stats.answered > 0 ? Math.round(totalAnswerTime / stats.answered) : 0;
        stats.fastestTimeMs = fastestTime;
        stats.fastestPlayerId = fastestPlayerId;

        // Apply score updates to Redis
        await this.applyScoreUpdates(roomId, scoreUpdates, teamScoreUpdates);

        // Get updated leaderboard
        const leaderboard = await this.getLeaderboard(roomId);

        // Get team scores
        const teamScores = await this.getTeamScores(roomId);

        // Get question info
        const questionRaw = await this.redis.hgetall(`room:${roomId}:questions:${questionIndex}`);

        return {
            questionId: questionRaw.id || '',
            questionIndex,
            correctAnswer,
            playerResults,
            teamScores,
            leaderboard,
            statistics: stats,
        };
    }

    /**
     * Apply score updates atomically
     */
    private async applyScoreUpdates(
        roomId: string,
        playerScores: Record<string, number>,
        teamScores: Record<string, number>
    ): Promise<void> {
        const pipeline = this.redis.pipeline();

        // Update player scores
        for (const [playerId, score] of Object.entries(playerScores)) {
            pipeline.hincrby(`room:${roomId}:scores`, playerId, score);
            pipeline.hincrby(`room:${roomId}:correctCount`, playerId, 1);
        }

        // Update team scores
        for (const [teamId, score] of Object.entries(teamScores)) {
            pipeline.hincrby(`room:${roomId}:teamScores`, teamId, score);
        }

        await pipeline.exec();
    }

    /**
     * Get current leaderboard
     */
    async getLeaderboard(roomId: string): Promise<Leaderboard> {
        // Get all player scores
        const scoresRaw = await this.redis.hgetall(`room:${roomId}:scores`);
        const correctCountRaw = await this.redis.hgetall(`room:${roomId}:correctCount`);
        const answeredCountRaw = await this.redis.hgetall(`room:${roomId}:answeredCount`);
        const playerInfoRaw = await this.redis.hgetall(`room:${roomId}:playerInfo`);

        // Get previous rankings for rank change calculation
        const previousRanksRaw = await this.redis.hgetall(`room:${roomId}:previousRanks`);

        // Build leaderboard entries
        const entries: LeaderboardEntry[] = [];

        for (const [playerId, scoreStr] of Object.entries(scoresRaw)) {
            const playerInfo = playerInfoRaw[playerId] ? JSON.parse(playerInfoRaw[playerId]) : {};
            const score = parseInt(scoreStr) || 0;
            const correctAnswers = parseInt(correctCountRaw[playerId]) || 0;
            const totalAnswers = parseInt(answeredCountRaw[playerId]) || 0;
            const previousRank = parseInt(previousRanksRaw[playerId]) || 0;

            entries.push({
                rank: 0, // Will be set after sorting
                playerId,
                playerName: playerInfo.displayName || 'Unknown',
                teamId: playerInfo.teamId,
                teamName: playerInfo.teamName,
                score,
                correctAnswers,
                totalAnswers,
                previousRank: previousRank > 0 ? previousRank : undefined,
                rankChange: 0, // Will be calculated after sorting
            });
        }

        // Sort by score (descending), then by correct answers
        entries.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return b.correctAnswers - a.correctAnswers;
        });

        // Assign ranks and calculate rank changes
        const newRanks: Record<string, string> = {};
        entries.forEach((entry, index) => {
            entry.rank = index + 1;
            if (entry.previousRank) {
                entry.rankChange = entry.previousRank - entry.rank;
            }
            newRanks[entry.playerId] = entry.rank.toString();
        });

        // Store new ranks as previous for next calculation
        if (Object.keys(newRanks).length > 0) {
            await this.redis.hset(`room:${roomId}:previousRanks`, newRanks);
        }

        // Get team leaderboard
        const teams = await this.getTeamLeaderboard(roomId);

        return {
            players: entries,
            teams,
            lastUpdated: Date.now(),
        };
    }

    /**
     * Get team scores
     */
    async getTeamScores(roomId: string): Promise<Record<string, number>> {
        const scoresRaw = await this.redis.hgetall(`room:${roomId}:teamScores`);
        const scores: Record<string, number> = {};

        for (const [teamId, score] of Object.entries(scoresRaw)) {
            scores[teamId] = parseInt(score) || 0;
        }

        return scores;
    }

    /**
     * Get team leaderboard with full details
     */
    async getTeamLeaderboard(roomId: string): Promise<TeamScore[]> {
        const scoresRaw = await this.redis.hgetall(`room:${roomId}:teamScores`);
        const teamsRaw = await this.redis.hgetall(`room:${roomId}:teams`);

        const teams: TeamScore[] = [];

        for (const [teamId, score] of Object.entries(scoresRaw)) {
            const teamInfo = teamsRaw[teamId] ? JSON.parse(teamsRaw[teamId]) : {};
            const memberCount = await this.redis.scard(`room:${roomId}:team:${teamId}:members`);

            teams.push({
                teamId,
                teamName: teamInfo.name || 'Unknown Team',
                teamColor: teamInfo.color || '#6366F1',
                score: parseInt(score) || 0,
                memberCount,
            });
        }

        // Sort by score
        teams.sort((a, b) => b.score - a.score);

        return teams;
    }

    /**
     * Reset scores for a room
     */
    async resetScores(roomId: string): Promise<void> {
        const pipeline = this.redis.pipeline();

        pipeline.del(`room:${roomId}:scores`);
        pipeline.del(`room:${roomId}:teamScores`);
        pipeline.del(`room:${roomId}:correctCount`);
        pipeline.del(`room:${roomId}:answeredCount`);
        pipeline.del(`room:${roomId}:previousRanks`);

        await pipeline.exec();
    }

    /**
     * Get player score
     */
    async getPlayerScore(roomId: string, playerId: string): Promise<number> {
        const score = await this.redis.hget(`room:${roomId}:scores`, playerId);
        return parseInt(score || '0');
    }

    /**
     * Increment answered count for player
     */
    async incrementAnsweredCount(roomId: string, playerId: string): Promise<void> {
        await this.redis.hincrby(`room:${roomId}:answeredCount`, playerId, 1);
    }
}

/**
 * Game Results Calculator
 * Calculates final game results and statistics
 */
export class GameResultsCalculator {
    private scoreCalculator: ScoreCalculator;
    private redis: Redis;

    constructor(redis: Redis, scoreConfig?: Partial<ScoringConfig>) {
        this.redis = redis;
        this.scoreCalculator = new ScoreCalculator(redis, scoreConfig);
    }

    /**
     * Calculate final game results
     */
    async calculateFinalResults(roomId: string): Promise<{
        winner: LeaderboardEntry | null;
        winningTeam: TeamScore | null;
        leaderboard: Leaderboard;
        statistics: {
            totalPlayers: number;
            totalAnswers: number;
            totalCorrect: number;
            totalIncorrect: number;
            totalSkipped: number;
            averageAccuracy: number;
            averageTimeMs: number;
        };
    }> {
        const leaderboard = await this.scoreCalculator.getLeaderboard(roomId);
        const teamLeaderboard = await this.scoreCalculator.getTeamLeaderboard(roomId);

        // Get room info
        const roomState = await this.redis.hgetall(`room:${roomId}:state`);
        const totalQuestions = parseInt(roomState.totalQuestions) || 0;
        const totalPlayers = leaderboard.players.length;

        // Calculate total statistics by iterating through all questions
        let totalAnswers = 0;
        let totalCorrect = 0;
        let totalIncorrect = 0;
        let totalSkipped = 0;
        let totalTimeMs = 0;
        let answersWithTime = 0;

        // Get answers for each question to calculate comprehensive stats
        for (let qIndex = 0; qIndex < totalQuestions; qIndex++) {
            const answersKey = `room:${roomId}:q:${qIndex}:answers`;
            const questionKey = `room:${roomId}:questions:${qIndex}`;

            const answersRaw = await this.redis.hgetall(answersKey);
            const questionRaw = await this.redis.hgetall(questionKey);
            const correctAnswer = questionRaw.correctOption;

            const playerIds = await this.redis.smembers(`room:${roomId}:players`);

            for (const playerId of playerIds) {
                const answerRaw = answersRaw[playerId];

                if (!answerRaw) {
                    totalSkipped++;
                } else {
                    const answerData = JSON.parse(answerRaw);
                    totalAnswers++;

                    if (answerData.timeTakenMs) {
                        totalTimeMs += answerData.timeTakenMs;
                        answersWithTime++;
                    }

                    if (answerData.answer === correctAnswer) {
                        totalCorrect++;
                    } else {
                        totalIncorrect++;
                    }
                }
            }
        }

        const averageAccuracy = totalAnswers > 0
            ? (totalCorrect / totalAnswers) * 100
            : 0;

        const averageTimeMs = answersWithTime > 0
            ? Math.round(totalTimeMs / answersWithTime)
            : 0;

        return {
            winner: leaderboard.players[0] || null,
            winningTeam: teamLeaderboard[0] || null,
            leaderboard,
            statistics: {
                totalPlayers,
                totalAnswers,
                totalCorrect,
                totalIncorrect,
                totalSkipped,
                averageAccuracy: Math.round(averageAccuracy * 100) / 100,
                averageTimeMs,
            },
        };
    }
}
