/**
 * ============================================================================
 * ONESIGNAL MODULE EXPORTS
 * ============================================================================
 */

// Client-side exports (for use in React components)
export {
    initOneSignal,
    requestNotificationPermission,
    loginUser,
    logoutUser,
    addUserTag,
    removeUserTag,
    subscribeToTeacher,
    unsubscribeFromTeacher,
    getNotificationStatus,
} from './client';

// Config exports
export {
    ONESIGNAL_APP_ID,
    ONESIGNAL_CONFIG,
    validateOneSignalConfig,
    type NotificationEventType,
    type NotificationPayload,
} from './config';

// Note: Server-side exports should be imported directly from './server'
// to avoid including server code in client bundles
// import { notifyNewExam, notifyTeacherApproved } from '@/lib/onesignal/server';
