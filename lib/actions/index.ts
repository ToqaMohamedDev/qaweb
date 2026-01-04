/**
 * Actions Index
 * 
 * Server actions for database operations
 */

export * from './track-device';
export * from './update-user-role';

// Backward compatibility wrappers
export { trackVisitor } from './track-visitor';

// Aliases for backward compatibility
export {
    trackDeviceAction as trackDevice,
    trackUserDeviceAction,
    trackVisitorDeviceAction
} from './track-device';
