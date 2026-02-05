/**
 * Services Index
 * 
 * Central export for active database services
 * Note: Other services (stage, subject, lesson, exam, question) 
 * are now handled by lib/data/service.ts (dataService)
 */

// Auth & Profile Services
export * from './auth.service';
export * from './profile.service';

// Teacher Services
export * from './teacher.service';

// Tracking Services
export * from './device.service';

// Message & Support Services
export * from './message.service';
export * from './support.service';

// Email Services
export * from './email.service';
