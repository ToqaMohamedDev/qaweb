/**
 * Game Lobby Page
 * Join or create game rooms
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

export default function GameLobbyPage() {
    const router = useRouter();
    const [joinMode, setJoinMode] = useState<'code' | 'create'>('code');
    const [roomCode, setRoomCode] = useState('');
    const [roomName, setRoomName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleJoinRoom = async () => {
        if (!roomCode.trim()) {
            setError('Please enter a room code');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Navigate to room
            router.push(`/game/room/${roomCode.toUpperCase()}`);
        } catch (err) {
            setError('Failed to join room');
            setLoading(false);
        }
    };

    const handleCreateRoom = async () => {
        if (!roomName.trim()) {
            setError('Please enter a room name');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Get or create auth token
            let authToken = localStorage.getItem('game_token');

            if (!authToken) {
                // Create guest session first
                const guestResponse = await fetch('/api/auth/guest', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({})
                });

                const guestData = await guestResponse.json();

                if (!guestResponse.ok || !guestData.success) {
                    console.error('Guest session error:', guestData);
                    throw new Error(guestData.error || 'Failed to create guest session - check if Redis is running');
                }

                authToken = guestData.token;
                if (authToken) {
                    localStorage.setItem('game_token', authToken);
                    if (guestData.user?.id) {
                        localStorage.setItem('game_user_id', guestData.user.id);
                    }
                }
            }

            // Create room via API
            const response = await fetch('/api/game/rooms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ roomName: roomName.trim() })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Failed to create room');
            }

            // Navigate to the created room
            router.push(`/game/room/${data.room.code}`);
        } catch (err) {
            console.error('Create room error:', err);
            setError(err instanceof Error ? err.message : 'Failed to create room');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 
                    flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                {/* Header */}
                <div className="text-center mb-8">
                    <motion.h1
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className="text-4xl font-bold text-white mb-2"
                    >
                        🎮 Quiz Battle
                    </motion.h1>
                    <p className="text-white/60">
                        Real-time competitive quiz platform
                    </p>
                </div>

                {/* Card */}
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 
                       shadow-2xl overflow-hidden">
                    {/* Tabs */}
                    <div className="flex border-b border-white/10">
                        <button
                            onClick={() => setJoinMode('code')}
                            className={`flex-1 py-4 font-medium transition-all ${joinMode === 'code'
                                ? 'text-white bg-white/10 border-b-2 border-indigo-400'
                                : 'text-white/50 hover:text-white/70'
                                }`}
                        >
                            Join Room
                        </button>
                        <button
                            onClick={() => setJoinMode('create')}
                            className={`flex-1 py-4 font-medium transition-all ${joinMode === 'create'
                                ? 'text-white bg-white/10 border-b-2 border-indigo-400'
                                : 'text-white/50 hover:text-white/70'
                                }`}
                        >
                            Create Room
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {joinMode === 'code' ? (
                            <motion.div
                                key="join"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="space-y-4"
                            >
                                <div>
                                    <label className="block text-sm text-white/60 mb-2">
                                        Room Code
                                    </label>
                                    <input
                                        type="text"
                                        value={roomCode}
                                        onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                                        placeholder="Enter 6-digit code"
                                        maxLength={6}
                                        className="w-full px-5 py-4 text-center text-2xl font-mono font-bold
                             bg-white/10 border border-white/20 rounded-xl
                             text-white placeholder-white/30 tracking-widest
                             focus:outline-none focus:border-indigo-400 focus:ring-2 
                             focus:ring-indigo-400/30 transition-all"
                                    />
                                </div>

                                <button
                                    onClick={handleJoinRoom}
                                    disabled={loading}
                                    className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-500 
                           rounded-xl text-white font-bold text-lg
                           hover:from-indigo-400 hover:to-purple-400
                           disabled:opacity-50 disabled:cursor-not-allowed
                           transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="w-5 h-5 border-2 border-white/30 border-t-white 
                                       rounded-full animate-spin" />
                                            Joining...
                                        </span>
                                    ) : (
                                        '🚀 Join Game'
                                    )}
                                </button>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="create"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="space-y-4"
                            >
                                <div>
                                    <label className="block text-sm text-white/60 mb-2">
                                        Room Name
                                    </label>
                                    <input
                                        type="text"
                                        value={roomName}
                                        onChange={(e) => setRoomName(e.target.value)}
                                        placeholder="My Quiz Battle"
                                        className="w-full px-5 py-4 bg-white/10 border border-white/20 rounded-xl
                             text-white placeholder-white/30
                             focus:outline-none focus:border-indigo-400 focus:ring-2 
                             focus:ring-indigo-400/30 transition-all"
                                    />
                                </div>

                                <button
                                    onClick={handleCreateRoom}
                                    disabled={loading}
                                    className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 
                           rounded-xl text-white font-bold text-lg
                           hover:from-green-400 hover:to-emerald-400
                           disabled:opacity-50 disabled:cursor-not-allowed
                           transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="w-5 h-5 border-2 border-white/30 border-t-white 
                                       rounded-full animate-spin" />
                                            Creating...
                                        </span>
                                    ) : (
                                        '✨ Create Room'
                                    )}
                                </button>
                            </motion.div>
                        )}

                        {/* Error */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="mt-4 p-3 bg-red-500/20 border border-red-400/30 
                          rounded-lg text-red-300 text-sm text-center"
                            >
                                {error}
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Features */}
                <div className="mt-8 grid grid-cols-3 gap-4 text-center">
                    {[
                        { icon: '⚡', label: 'Real-Time' },
                        { icon: '🔒', label: 'Secure' },
                        { icon: '🏆', label: 'Competitive' },
                    ].map((feature) => (
                        <div key={feature.label} className="text-white/50">
                            <div className="text-2xl mb-1">{feature.icon}</div>
                            <div className="text-xs">{feature.label}</div>
                        </div>
                    ))}
                </div>

                {/* Back link */}
                <div className="mt-8 text-center">
                    <a
                        href="/"
                        className="text-white/40 hover:text-white/60 text-sm transition-colors"
                    >
                        ← Back to Home
                    </a>
                </div>
            </motion.div>
        </div>
    );
}
