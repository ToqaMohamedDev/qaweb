"use client";

import { motion } from "framer-motion";

export function HeroBackground() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-pink-500/5 dark:from-primary-500/10 dark:to-pink-500/10" />

            {/* Floating Blobs */}
            <motion.div
                animate={{
                    y: [-20, 20, -20],
                    rotate: [0, 10, 0],
                    scale: [1, 1.1, 1],
                }}
                transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4"
            />

            <motion.div
                animate={{
                    y: [20, -20, 20],
                    rotate: [0, -10, 0],
                    scale: [1, 1.2, 1],
                }}
                transition={{
                    duration: 12,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 2,
                }}
                className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-pink-500/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4"
            />

            <motion.div
                animate={{
                    x: [-30, 30, -30],
                    y: [-30, 30, -30],
                    scale: [1, 1.5, 1],
                }}
                transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1,
                }}
                className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[90px] -translate-x-1/2 -translate-y-1/2"
            />
        </div>
    );
}
