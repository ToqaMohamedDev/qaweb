'use client';

import { useEffect } from 'react';
import { trackVisitor } from '@/lib/actions/track-visitor';

function generateVisitorId() {
    // Generate a random ID if not exists
    if (typeof window === 'undefined') return '';

    let vid = localStorage.getItem('visitor_id');
    if (!vid) {
        vid = 'v_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
        localStorage.setItem('visitor_id', vid);
    }
    return vid;
}

export function VisitorTracker() {
    useEffect(() => {
        const initTracking = async () => {
            // Wait for hydration
            await new Promise(resolve => setTimeout(resolve, 1000));

            const visitorId = generateVisitorId();
            if (visitorId) {
                // Get referrer if available
                const referrer = document.referrer;
                const currentUrl = window.location.href;

                await trackVisitor(visitorId, currentUrl, referrer);
            }
        };

        // Track on mount and when path changes (handled by next.js navigation usually, 
        // but for server actions we might just do it once per hard load or use usePathname)
        initTracking();

    }, []); // Run once on mount

    return null; // Invisible component
}
