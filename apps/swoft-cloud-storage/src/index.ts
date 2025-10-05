/**
 * SWOFT Cloud Storage
 *
 * Cloud storage abstraction layer for SWOFT platform
 * Works with OneDrive, iCloud, and can be integrated with Electron apps
 */

export * from './types.js';
export * from './CloudStorageManager.js';
export * from './providers/index.js';

// For Electron app integration
export { CloudStorageManager } from './CloudStorageManager.js';
export { OneDriveProvider } from './providers/OneDriveProvider.js';
