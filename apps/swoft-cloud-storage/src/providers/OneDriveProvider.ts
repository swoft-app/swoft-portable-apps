/**
 * OneDrive Provider
 *
 * Cloud storage provider for Microsoft OneDrive
 */

import { homedir, platform } from 'os';
import { join } from 'path';
import { BaseCloudStorageProvider } from './BaseProvider.js';

export class OneDriveProvider extends BaseCloudStorageProvider {
  name = 'onedrive';
  displayName = 'OneDrive';
  basePath: string;

  constructor(workspaceFolder: string = '') {
    super(workspaceFolder);
    this.basePath = this.detectOneDrivePath();
  }

  /**
   * Detect OneDrive path based on platform
   */
  private detectOneDrivePath(): string {
    if (platform() === 'win32') {
      // Windows: %USERPROFILE%\OneDrive - DevApps4Biz.com
      return join(process.env.USERPROFILE || '', 'OneDrive - DevApps4Biz.com');
    } else {
      // Mac/Linux: ~/Library/CloudStorage/OneDrive-DevApps4Biz.com
      return join(homedir(), 'Library/CloudStorage/OneDrive-DevApps4Biz.com');
    }
  }

  /**
   * Override base path if custom path provided
   */
  setBasePath(customPath: string): void {
    this.basePath = customPath;
  }
}
