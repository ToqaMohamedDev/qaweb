// =============================================
// GameBackground Component - خلفية اللعبة المتحركة
// =============================================

'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';

interface GameBackgroundProps {
    variant?: 'default' | 'danger' | 'warning' | 'success';
    showParticles?: boolean;
}

// Grid pattern as base64 (shared across all game pages)
const GRID_PATTERN = "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzFhMWEzYSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')";

// Static particle positions to avoid hydration mismatch
const PARTICLES = [
    { left: 5, top: 10, duration: 3.2, delay: 0.5 },
    { left: 15, top: 25, duration: 4.1, delay: 1.2 },
    { left: 25, top: 5, duration: 3.8, delay: 0.3 },
    { left: 35, top: 45, duration: 4.5, delay: 1.8 },
    { left: 45, top: 15, duration: 3.4, delay: 0.7 },
    { left: 55, top: 65, duration: 4.2, delay: 1.5 },
    { left: 65, top: 35, duration: 3.6, delay: 0.9 },
    { left: 75, top: 85, duration: 4.8, delay: 1.1 },
    { left: 85, top: 55, duration: 3.3, delay: 1.6 },
    { left: 95, top: 20, duration: 4.4, delay: 0.4 },
    { left: 10, top: 70, duration: 3.9, delay: 1.3 },
    { left: 20, top: 90, duration: 4.0, delay: 0.6 },
    { left: 30, top: 60, duration: 3.5, delay: 1.9 },
    { left: 40, top: 30, duration: 4.3, delay: 0.8 },
    { left: 50, top: 80, duration: 3.7, delay: 1.4 },
    { left: 60, top: 50, duration: 4.6, delay: 0.2 },
    { left: 70, top: 75, duration: 3.1, delay: 1.7 },
    { left: 80, top: 40, duration: 4.7, delay: 1.0 },
    { left: 90, top: 95, duration: 3.0, delay: 0.1 },
    { left: 12, top: 42, duration: 4.9, delay: 2.0 },
];

const GLOW_COLORS = {
    default: 'bg-indigo-600/10',
    danger: 'bg-red-600/20',
    warning: 'bg-orange-600/15',
    success: 'bg-green-600/15',
};

function GameBackgroundComponent({ variant = 'default', showParticles = false }: GameBackgroundProps) {
    return (
        <div className="fixed inset-0 pointer-events-none">
            {/* Grid Pattern */}
            <div
                className="absolute inset-0 opacity-30"
                style={{ backgroundImage: GRID_PATTERN }}
            />

            {/* Glowing Orbs */}
            <div className="absolute top-20 left-20 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
            <div
                className="absolute bottom-20 right-20 w-96 h-96 bg-orange-500/20 rounded-full blur-[120px] animate-pulse"
                style={{ animationDelay: '1s' }}
            />
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] ${GLOW_COLORS[variant]} rounded-full blur-[150px] transition-colors duration-1000`} />

            {/* Floating Particles */}
            {showParticles && PARTICLES.map((particle, i) => (
                <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-white/30 rounded-full"
                    style={{
                        left: `${particle.left}%`,
                        top: `${particle.top}%`,
                    }}
                    animate={{
                        y: [0, -30, 0],
                        opacity: [0.3, 0.8, 0.3],
                    }}
                    transition={{
                        duration: particle.duration,
                        repeat: Infinity,
                        delay: particle.delay,
                    }}
                />
            ))}
        </div>
    );
}

export const GameBackground = memo(GameBackgroundComponent);
