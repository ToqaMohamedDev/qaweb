/**
 * Admin Dashboard Component
 * Enhanced real-time monitoring and control panel for game admins
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Socket } from 'socket.io-client';

interface Player {
    playerId: string;
    playerName: string;
    teamId?: string;
    status: 'PENDING' | 'ANSWERED' | 'SKIPPED';
    answer?: string;
    timeTakenMs?: number;
    flags?: {
        tabSwitches: number;
        focusLostCount: number;
        devToolsOpened: boolean;
        riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    };
}

interface Alert {
    id: string;
    playerId: string;
    playerName: string;
    alertType: string;
    severity: 'INFO' | 'WARNING' | 'ALERT' | 'CRITICAL';
    details: string;
    timestamp: number;
    reviewed: boolean;
}

interface AdminDashboardProps {
    socket: Socket | null;
    roomId: string;
    roomState: any;
    players: Player[];
    onAction: (action: string, data?: any) => void;
}

export function AdminDashboard({
    socket,
    roomId,
    roomState,
    players,
    onAction,
}: AdminDashboardProps) {
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [broadcastMessage, setBroadcastMessage] = useState('');
    const [isMinimized, setIsMinimized] = useState(false);

    // Listen for alerts
    useEffect(() => {
        if (!socket) return;

        socket.on('admin:anticheat_alert', (alert: Alert) => {
            setAlerts(prev => [alert, ...prev]);
        });

        return () => {
            socket.off('admin:anticheat_alert');
        };
    }, [socket]);

    const answeredCount = players.filter(p => p.status === 'ANSWERED').length;
    const pendingCount = players.filter(p => p.status === 'PENDING').length;
    const flaggedCount = players.filter(p => p.flags?.riskLevel && p.flags.riskLevel !== 'LOW').length;
    const unreadAlerts = alerts.filter(a => !a.reviewed).length;

    const isPaused = roomState?.status === 'PAUSED';
    const isActive = roomState?.status === 'QUESTION_ACTIVE';

    const handleBroadcast = () => {
        if (!broadcastMessage.trim()) return;
        onAction('broadcast', { content: broadcastMessage });
        setBroadcastMessage('');
    };

    const getStatusLabel = () => {
        switch (roomState?.status) {
            case 'QUESTION_ACTIVE': return { label: '🟢 جاري', color: 'bg-emerald-500/20 text-emerald-400' };
            case 'PAUSED': return { label: '⏸️ متوقف', color: 'bg-amber-500/20 text-amber-400' };
            case 'SHOWING_RESULTS': return { label: '📊 النتائج', color: 'bg-blue-500/20 text-blue-400' };
            case 'STARTING': return { label: '🚀 يبدأ', color: 'bg-purple-500/20 text-purple-400' };
            case 'ENDED': return { label: '🏁 انتهى', color: 'bg-gray-500/20 text-gray-400' };
            default: return { label: roomState?.status || 'غير معروف', color: 'bg-gray-500/20 text-gray-400' };
        }
    };

    const status = getStatusLabel();

    if (isMinimized) {
        return (
            <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={() => setIsMinimized(false)}
                className="fixed bottom-4 right-4 z-50 p-4 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 
                           text-white shadow-xl shadow-amber-500/30 hover:scale-110 transition-transform"
            >
                <span className="text-2xl">👑</span>
                {unreadAlerts > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
                        {unreadAlerts}
                    </span>
                )}
            </motion.button>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 
                       rounded-2xl border border-amber-400/20 overflow-hidden
                       shadow-xl shadow-amber-500/10 backdrop-blur-xl"
        >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-b border-white/10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">👑</span>
                        <div>
                            <h2 className="text-lg font-bold text-white">لوحة التحكم</h2>
                            <p className="text-xs text-white/50">إدارة اللعبة والمراقبة</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${status.color}`}>
                            {status.label}
                        </span>
                        <button
                            onClick={() => setIsMinimized(true)}
                            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/60"
                        >
                            ➖
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-2 p-3 border-b border-white/5">
                <QuickStat icon="✅" value={answeredCount} label="أجابوا" color="emerald" />
                <QuickStat icon="⏳" value={pendingCount} label="ينتظرون" color="amber" pulse={pendingCount > 0} />
                <QuickStat icon="⚠️" value={flaggedCount} label="مشتبهون" color="red" />
                <QuickStat icon="👥" value={players.length} label="الإجمالي" color="blue" />
            </div>

            {/* Game Controls */}
            <div className="p-3 border-b border-white/5">
                <div className="grid grid-cols-3 gap-2">
                    {!isPaused && isActive && (
                        <ControlBtn icon="⏸️" label="إيقاف" onClick={() => onAction('pause')} color="amber" />
                    )}
                    {isPaused && (
                        <ControlBtn icon="▶️" label="استئناف" onClick={() => onAction('resume')} color="emerald" />
                    )}
                    <ControlBtn icon="⏭️" label="تخطي" onClick={() => onAction('skip')} color="blue" />
                    <ControlBtn icon="🔄" label="إعادة" onClick={() => onAction('restart')} color="purple" />
                    <ControlBtn icon="🏁" label="إنهاء" onClick={() => onAction('end')} color="red" requireConfirm />
                </div>
            </div>

            {/* Players Monitor */}
            <div className="p-3 border-b border-white/5">
                <h3 className="text-sm font-medium text-white/60 mb-2 flex items-center gap-2">
                    <span>👥</span> اللاعبون ({players.length})
                </h3>
                <div className="max-h-[200px] overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-white/10">
                    {players.map((player) => (
                        <PlayerRow
                            key={player.playerId}
                            player={player}
                            onKick={() => onAction('kick', { playerId: player.playerId, reason: 'أزاله المشرف' })}
                        />
                    ))}
                    {players.length === 0 && (
                        <p className="text-center text-white/30 py-4 text-sm">لا يوجد لاعبون</p>
                    )}
                </div>
            </div>

            {/* Alerts Section */}
            {alerts.length > 0 && (
                <div className="p-3 border-b border-white/5 bg-red-500/5">
                    <h3 className="text-sm font-medium text-red-400 mb-2 flex items-center gap-2">
                        <span>🚨</span> تنبيهات ({unreadAlerts})
                    </h3>
                    <div className="max-h-[100px] overflow-y-auto space-y-1">
                        {alerts.slice(0, 5).map((alert) => (
                            <AlertRow
                                key={alert.id}
                                alert={alert}
                                onDismiss={() => setAlerts(prev =>
                                    prev.map(a => a.id === alert.id ? { ...a, reviewed: true } : a)
                                )}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Broadcast Message */}
            <div className="p-3">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={broadcastMessage}
                        onChange={(e) => setBroadcastMessage(e.target.value)}
                        placeholder="رسالة للجميع..."
                        className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10
                                   text-white placeholder-white/30 focus:outline-none focus:border-amber-400/50
                                   text-sm"
                        onKeyPress={(e) => e.key === 'Enter' && handleBroadcast()}
                    />
                    <button
                        onClick={handleBroadcast}
                        disabled={!broadcastMessage.trim()}
                        className="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-400 font-medium
                                   hover:bg-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed
                                   transition-colors text-sm"
                    >
                        📢
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

function QuickStat({ icon, value, label, color, pulse = false }: {
    icon: string;
    value: number;
    label: string;
    color: string;
    pulse?: boolean;
}) {
    const colors: Record<string, string> = {
        emerald: 'bg-emerald-500/20 text-emerald-400',
        amber: 'bg-amber-500/20 text-amber-400',
        red: 'bg-red-500/20 text-red-400',
        blue: 'bg-blue-500/20 text-blue-400',
    };

    return (
        <motion.div
            className={`p-2 rounded-xl text-center ${colors[color]}`}
            animate={pulse ? { scale: [1, 1.02, 1] } : {}}
            transition={{ duration: 1, repeat: Infinity }}
        >
            <div className="text-lg">{icon}</div>
            <div className="text-xl font-bold">{value}</div>
            <div className="text-xs opacity-70">{label}</div>
        </motion.div>
    );
}

function ControlBtn({ icon, label, onClick, color, requireConfirm = false }: {
    icon: string;
    label: string;
    onClick: () => void;
    color: string;
    requireConfirm?: boolean;
}) {
    const [confirmMode, setConfirmMode] = useState(false);

    const colors: Record<string, string> = {
        emerald: 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border-emerald-500/30',
        amber: 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border-amber-500/30',
        red: 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border-red-500/30',
        blue: 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border-blue-500/30',
        purple: 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border-purple-500/30',
    };

    const handleClick = () => {
        if (requireConfirm && !confirmMode) {
            setConfirmMode(true);
            setTimeout(() => setConfirmMode(false), 3000);
            return;
        }
        onClick();
        setConfirmMode(false);
    };

    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleClick}
            className={`p-3 rounded-xl border transition-all flex flex-col items-center gap-1 ${colors[color]}`}
        >
            <span className="text-xl">{icon}</span>
            <span className="text-xs font-medium">
                {confirmMode ? 'تأكيد؟' : label}
            </span>
        </motion.button>
    );
}

function PlayerRow({ player, onKick }: { player: Player; onKick: () => void }) {
    const getStatusIcon = () => {
        switch (player.status) {
            case 'ANSWERED': return '✅';
            case 'SKIPPED': return '⏭️';
            default: return '⏳';
        }
    };

    const getRiskBadge = () => {
        if (!player.flags?.riskLevel || player.flags.riskLevel === 'LOW') return null;
        const colors: Record<string, string> = {
            MEDIUM: 'bg-amber-500/30 text-amber-400',
            HIGH: 'bg-orange-500/30 text-orange-400',
            CRITICAL: 'bg-red-500/30 text-red-400 animate-pulse',
        };
        return (
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${colors[player.flags.riskLevel]}`}>
                {player.flags.riskLevel}
            </span>
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`flex items-center gap-2 p-2 rounded-lg transition-colors
                       ${player.flags?.riskLevel === 'CRITICAL'
                    ? 'bg-red-500/10 border border-red-500/20'
                    : 'bg-white/5 hover:bg-white/10'
                }`}
        >
            <span className="text-sm">{getStatusIcon()}</span>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                    <span className="font-medium text-white text-sm truncate">
                        {player.playerName}
                    </span>
                    {getRiskBadge()}
                </div>
                {player.timeTakenMs && (
                    <span className="text-xs text-white/40">
                        {(player.timeTakenMs / 1000).toFixed(1)}s
                    </span>
                )}
            </div>
            <button
                onClick={onKick}
                className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 
                           transition-colors opacity-0 group-hover:opacity-100"
                title="إزالة"
            >
                ⛔
            </button>
        </motion.div>
    );
}

function AlertRow({ alert, onDismiss }: { alert: Alert; onDismiss: () => void }) {
    const severityIcons: Record<string, string> = {
        INFO: 'ℹ️',
        WARNING: '⚡',
        ALERT: '⚠️',
        CRITICAL: '🚨',
    };

    return (
        <div className={`flex items-center gap-2 p-2 rounded-lg text-xs
                        ${alert.reviewed ? 'opacity-50' : 'bg-red-500/10'}`}>
            <span>{severityIcons[alert.severity]}</span>
            <span className="flex-1 text-white/80 truncate">
                {alert.playerName}: {alert.alertType}
            </span>
            {!alert.reviewed && (
                <button onClick={onDismiss} className="text-white/40 hover:text-white/60">✕</button>
            )}
        </div>
    );
}
