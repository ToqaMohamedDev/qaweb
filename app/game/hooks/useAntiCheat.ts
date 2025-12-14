/**
 * Anti-Cheat Monitor Hook
 * Frontend monitoring - REPORTS ONLY to server
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { Socket } from 'socket.io-client';

interface AntiCheatFlags {
    tabSwitches: number;
    focusLostCount: number;
    devToolsOpened: boolean;
    copyAttempts: number;
    pasteAttempts: number;
    rightClickAttempts: number;
}

export function useAntiCheat(socket: Socket | null, enabled: boolean = true) {
    const flagsRef = useRef<AntiCheatFlags>({
        tabSwitches: 0,
        focusLostCount: 0,
        devToolsOpened: false,
        copyAttempts: 0,
        pasteAttempts: 0,
        rightClickAttempts: 0,
    });

    const report = useCallback((type: string) => {
        if (!socket?.connected) return;

        socket.emit('anticheat:report', {
            type,
            flags: { ...flagsRef.current },
            timestamp: Date.now(),
        });
    }, [socket]);

    useEffect(() => {
        if (!enabled) return;

        // Tab visibility change
        const handleVisibilityChange = () => {
            if (document.hidden) {
                flagsRef.current.tabSwitches++;
                report('TAB_SWITCH');
            }
        };

        // Window blur (focus lost)
        const handleBlur = () => {
            flagsRef.current.focusLostCount++;
            report('FOCUS_LOST');
        };

        // Context menu (right click)
        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
            flagsRef.current.rightClickAttempts++;
            report('RIGHT_CLICK_ATTEMPT');
        };

        // Copy attempt
        const handleCopy = (e: ClipboardEvent) => {
            e.preventDefault();
            flagsRef.current.copyAttempts++;
            report('COPY_ATTEMPT');
        };

        // Paste attempt
        const handlePaste = (e: ClipboardEvent) => {
            e.preventDefault();
            flagsRef.current.pasteAttempts++;
            report('PASTE_ATTEMPT');
        };

        // Keyboard shortcuts
        const handleKeyDown = (e: KeyboardEvent) => {
            // Prevent Ctrl+C, Ctrl+V, Ctrl+U
            if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'u'].includes(e.key.toLowerCase())) {
                e.preventDefault();
                if (e.key.toLowerCase() === 'c') {
                    flagsRef.current.copyAttempts++;
                    report('COPY_SHORTCUT');
                } else if (e.key.toLowerCase() === 'v') {
                    flagsRef.current.pasteAttempts++;
                    report('PASTE_SHORTCUT');
                }
            }

            // Detect F12 or Ctrl+Shift+I (DevTools)
            if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
                e.preventDefault();
                flagsRef.current.devToolsOpened = true;
                report('DEVTOOLS_SHORTCUT');
            }
        };

        // DevTools detection via window size
        let devToolsCheckInterval: NodeJS.Timeout;
        const checkDevTools = () => {
            const threshold = 160;
            const widthThreshold = window.outerWidth - window.innerWidth > threshold;
            const heightThreshold = window.outerHeight - window.innerHeight > threshold;

            if ((widthThreshold || heightThreshold) && !flagsRef.current.devToolsOpened) {
                flagsRef.current.devToolsOpened = true;
                report('DEVTOOLS_SIZE');
            }
        };

        // Add event listeners
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);
        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('copy', handleCopy);
        document.addEventListener('paste', handlePaste);
        document.addEventListener('keydown', handleKeyDown);
        devToolsCheckInterval = setInterval(checkDevTools, 1000);

        // Cleanup
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('copy', handleCopy);
            document.removeEventListener('paste', handlePaste);
            document.removeEventListener('keydown', handleKeyDown);
            clearInterval(devToolsCheckInterval);
        };
    }, [enabled, report]);

    return {
        flags: flagsRef.current,
    };
}
