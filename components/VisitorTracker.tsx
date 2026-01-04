'use client';

/**
 * Visitor Tracker Component
 * 
 * Tracks visitor devices for analytics
 */

import { useEffect } from 'react';
import { trackVisitorDeviceAction } from '@/lib/actions/track-device';
import { useAuthStore } from '@/lib/stores/useAuthStore';

function generateVisitorId(): string {
    if (typeof window === 'undefined') return '';

    // Try to get from localStorage
    const stored = localStorage.getItem('visitor_id');
    if (stored) return stored;

    // Generate new ID
    const newId = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('visitor_id', newId);
    return newId;
}

function detectDeviceInfo() {
    if (typeof window === 'undefined') {
        return {
            deviceType: 'unknown',
            osName: '',
            osVersion: '',
            browser: '',
            browserVersion: '',
            userAgent: '',
        };
    }

    const ua = navigator.userAgent;

    // Detect device type
    let deviceType = 'desktop';
    if (/Mobile|Android|iPhone|iPad/i.test(ua)) {
        deviceType = /iPad|Tablet/i.test(ua) ? 'tablet' : 'mobile';
    }

    // Detect OS
    let osName = '';
    let osVersion = '';
    if (/Windows NT (\d+\.\d+)/.test(ua)) {
        osName = 'Windows';
        osVersion = RegExp.$1;
    } else if (/Mac OS X (\d+[._]\d+)/.test(ua)) {
        osName = 'macOS';
        osVersion = RegExp.$1.replace('_', '.');
    } else if (/Android (\d+\.\d+)/.test(ua)) {
        osName = 'Android';
        osVersion = RegExp.$1;
    } else if (/iPhone OS (\d+_\d+)/.test(ua)) {
        osName = 'iOS';
        osVersion = RegExp.$1.replace('_', '.');
    }

    // Detect browser
    let browser = '';
    let browserVersion = '';
    if (/Chrome\/(\d+\.\d+)/.test(ua) && !/Edg/.test(ua)) {
        browser = 'Chrome';
        browserVersion = RegExp.$1;
    } else if (/Firefox\/(\d+\.\d+)/.test(ua)) {
        browser = 'Firefox';
        browserVersion = RegExp.$1;
    } else if (/Safari\/(\d+\.\d+)/.test(ua) && !/Chrome/.test(ua)) {
        browser = 'Safari';
        const match = ua.match(/Version\/(\d+\.\d+)/);
        browserVersion = match ? match[1] : '';
    } else if (/Edg\/(\d+\.\d+)/.test(ua)) {
        browser = 'Edge';
        browserVersion = RegExp.$1;
    }

    return {
        deviceType,
        osName,
        osVersion,
        browser,
        browserVersion,
        userAgent: ua,
    };
}

export function VisitorTracker() {
    const { user } = useAuthStore();

    useEffect(() => {
        // Only track visitors (not logged-in users)
        if (user) return;

        const trackVisitor = async () => {
            try {
                const visitorId = generateVisitorId();
                if (!visitorId) return;

                const deviceInfo = detectDeviceInfo();

                await trackVisitorDeviceAction({
                    visitorId,
                    deviceType: deviceInfo.deviceType,
                    osName: deviceInfo.osName,
                    osVersion: deviceInfo.osVersion,
                    browser: deviceInfo.browser,
                    browserVersion: deviceInfo.browserVersion,
                    userAgent: deviceInfo.userAgent,
                    pageUrl: window.location.href,
                    referrer: document.referrer,
                });
            } catch (error) {
                // Silently fail - tracking is not critical
                console.debug('Visitor tracking error:', error);
            }
        };

        trackVisitor();
    }, [user]);

    return null;
}
