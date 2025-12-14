/**
 * Leaderboard Component
 * Real-time player rankings
 */

'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LeaderboardEntry {
    rank: number;
    playerId: string;
    playerName: string;
    teamId?: string;
    teamName?: string;
    score: number;
    correctAnswers: number;
    totalAnswers: number;
    previousRank?: number;
    rankChange: number;
}

interface Team {
    teamId: string;
    teamName: string;
    teamColor: string;
    score: number;
    memberCount: number;
}

interface LeaderboardProps {
    players: LeaderboardEntry[];
    teams?: Team[];
    currentPlayerId?: string;
    showTeams?: boolean;
    compact?: boolean;
    maxDisplay?: number;
}

export function Leaderboard({
    players,
    teams = [],
    currentPlayerId,
    showTeams = false,
    compact = false,
    maxDisplay = 10,
}: LeaderboardProps) {
    const displayPlayers = players.slice(0, maxDisplay);
    const currentPlayer = players.find(p => p.playerId === currentPlayerId);
    const currentPlayerInTop = displayPlayers.some(p => p.playerId === currentPlayerId);

    return (
        <div className="w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <span className="text-2xl">🏆</span>
                    Leaderboard
                </h3>
                {showTeams && teams.length > 0 && (
                    <div className="flex gap-2">
                        {teams.map((team) => (
                            <div
                                key={team.teamId}
                                className="px-3 py-1 rounded-full text-xs font-medium"
                                style={{
                                    backgroundColor: `${team.teamColor}30`,
                                    color: team.teamColor,
                                    border: `1px solid ${team.teamColor}50`,
                                }}
                            >
                                {team.teamName}: {team.score}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Player list */}
            <div className={`space-y-${compact ? '1' : '2'}`}>
                <AnimatePresence mode="popLayout">
                    {displayPlayers.map((player, index) => (
                        <LeaderboardRow
                            key={player.playerId}
                            player={player}
                            isCurrentPlayer={player.playerId === currentPlayerId}
                            compact={compact}
                            index={index}
                        />
                    ))}
                </AnimatePresence>

                {/* Show current player if not in top*/}
                {currentPlayer && !currentPlayerInTop && (
                    <>
                        <div className="flex items-center gap-2 py-2">
                            <div className="flex-1 border-t border-dashed border-white/20" />
                            <span className="text-xs text-white/40">You</span>
                            <div className="flex-1 border-t border-dashed border-white/20" />
                        </div>
                        <LeaderboardRow
                            player={currentPlayer}
                            isCurrentPlayer={true}
                            compact={compact}
                            index={currentPlayer.rank - 1}
                        />
                    </>
                )}
            </div>
        </div>
    );
}

interface LeaderboardRowProps {
    player: LeaderboardEntry;
    isCurrentPlayer: boolean;
    compact: boolean;
    index: number;
}

function LeaderboardRow({ player, isCurrentPlayer, compact, index }: LeaderboardRowProps) {
    const rankDisplay = () => {
        switch (player.rank) {
            case 1:
                return '🥇';
            case 2:
                return '🥈';
            case 3:
                return '🥉';
            default:
                return player.rank;
        }
    };

    const rankChangeIcon = () => {
        if (player.rankChange > 0) {
            return <span className="text-green-400 text-xs">↑{player.rankChange}</span>;
        }
        if (player.rankChange < 0) {
            return <span className="text-red-400 text-xs">↓{Math.abs(player.rankChange)}</span>;
        }
        return null;
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{
                layout: { type: 'spring', stiffness: 350, damping: 25 },
                delay: index * 0.05,
            }}
            className={`
        flex items-center gap-3 px-4 rounded-xl
        ${compact ? 'py-2' : 'py-3'}
        ${isCurrentPlayer
                    ? 'bg-indigo-500/20 border border-indigo-400/30'
                    : 'bg-white/5 border border-white/10'
                }
        ${player.rank <= 3 ? 'ring-1 ring-yellow-400/20' : ''}
      `}
        >
            {/* Rank */}
            <div className={`
        flex items-center justify-center font-bold
        ${compact ? 'w-8 text-base' : 'w-10 text-lg'}
        ${player.rank <= 3 ? 'text-yellow-300' : 'text-white/60'}
      `}>
                {rankDisplay()}
            </div>

            {/* Player info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className={`
            font-medium truncate
            ${isCurrentPlayer ? 'text-indigo-300' : 'text-white'}
          `}>
                        {player.playerName}
                        {isCurrentPlayer && <span className="ml-1 text-xs opacity-60">(You)</span>}
                    </span>
                    {player.teamName && (
                        <span className="text-xs text-white/40 truncate">
                            • {player.teamName}
                        </span>
                    )}
                </div>
                {!compact && (
                    <div className="text-xs text-white/40 mt-0.5">
                        {player.correctAnswers}/{player.totalAnswers} correct
                    </div>
                )}
            </div>

            {/* Rank change */}
            <div className="flex-shrink-0 w-8 text-center">
                {rankChangeIcon()}
            </div>

            {/* Score */}
            <div className={`
        flex-shrink-0 font-bold
        ${compact ? 'text-base' : 'text-lg'}
        ${player.rank === 1 ? 'text-yellow-300' : 'text-white'}
      `}>
                {player.score}
            </div>
        </motion.div>
    );
}

/**
 * Compact sidebar leaderboard
 */
interface SidebarLeaderboardProps {
    players: LeaderboardEntry[];
    currentPlayerId?: string;
}

export function SidebarLeaderboard({ players, currentPlayerId }: SidebarLeaderboardProps) {
    return (
        <div className="bg-white/5 rounded-xl border border-white/10 p-4">
            <Leaderboard
                players={players}
                currentPlayerId={currentPlayerId}
                compact={true}
                maxDisplay={5}
            />
        </div>
    );
}
