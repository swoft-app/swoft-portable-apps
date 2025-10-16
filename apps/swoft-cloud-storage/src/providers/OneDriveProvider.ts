/**
 * OneDrive Provider
 *
 * Cloud storage provider for Microsoft OneDrive
 * Supports multi-account auto-detection for team portability
 */

import { homedir, platform } from 'os';
import { join } from 'path';
import { existsSync, readdirSync } from 'fs';
import { BaseCloudStorageProvider } from './BaseProvider.js';

interface OneDriveAccount {
  name: string;
  path: string;
  type: 'business' | 'personal' | 'shared';
}

export class OneDriveProvider extends BaseCloudStorageProvider {
  name = 'onedrive';
  displayName = 'OneDrive';
  basePath: string;

  constructor(workspaceFolder: string = '') {
    super(workspaceFolder);
    this.basePath = this.detectOneDrivePath();
  }

  /**
   * Get OneDrive base directory (platform-specific)
   */
  private getOneDriveBaseDir(): string {
    if (platform() === 'win32') {
      // Windows: %USERPROFILE%\OneDrive*
      return process.env.USERPROFILE || '';
    } else {
      // Mac/Linux: ~/Library/CloudStorage/OneDrive*
      return join(homedir(), 'Library/CloudStorage');
    }
  }

  /**
   * Detect all available OneDrive accounts
   */
  private detectAllOneDriveAccounts(): OneDriveAccount[] {
    const baseDir = this.getOneDriveBaseDir();

    if (!existsSync(baseDir)) {
      return [];
    }

    const accounts: OneDriveAccount[] = [];

    try {
      const entries = readdirSync(baseDir, { withFileTypes: true });

      for (const entry of entries) {
        if (!entry.isDirectory()) continue;

        const name = entry.name;

        // Match OneDrive directories (Mac: OneDrive-*, Windows: OneDrive*)
        if (platform() === 'win32') {
          if (name.startsWith('OneDrive')) {
            accounts.push({
              name: name.replace('OneDrive - ', '').replace('OneDrive', 'Personal'),
              path: join(baseDir, name),
              type: this.detectAccountType(name)
            });
          }
        } else {
          if (name.startsWith('OneDrive-')) {
            accounts.push({
              name: name.replace('OneDrive-', ''),
              path: join(baseDir, name),
              type: this.detectAccountType(name)
            });
          }
        }
      }
    } catch (error) {
      console.error('[OneDrive] Failed to scan for accounts:', error);
    }

    return accounts;
  }

  /**
   * Detect account type from directory name
   */
  private detectAccountType(dirName: string): 'business' | 'personal' | 'shared' {
    const normalized = dirName.toLowerCase();

    if (normalized.includes('personal')) {
      return 'personal';
    } else if (normalized.includes('shared')) {
      return 'shared';
    } else {
      return 'business';
    }
  }

  /**
   * Detect OneDrive path with multi-account support
   *
   * Priority:
   * 1. ONEDRIVE_PATH - Absolute path override
   * 2. ONEDRIVE_ACCOUNT - Specific account name (e.g., "DevApps4Biz.com", "Personal")
   * 3. ONEDRIVE_ACCOUNT_TYPE - Account type filter (business/personal/shared)
   * 4. First available account (fallback)
   */
  private detectOneDrivePath(): string {
    // Priority 1: Absolute path override
    if (process.env.ONEDRIVE_PATH) {
      const customPath = process.env.ONEDRIVE_PATH;
      if (existsSync(customPath)) {
        console.error(`[OneDrive] Using custom path: ${customPath}`);
        return customPath;
      } else {
        console.error(`[OneDrive] Custom path not found: ${customPath}`);
      }
    }

    // Detect all available accounts
    const accounts = this.detectAllOneDriveAccounts();

    if (accounts.length === 0) {
      throw new Error('No OneDrive accounts found. Please ensure OneDrive is installed and syncing.');
    }

    console.error(`[OneDrive] Found ${accounts.length} account(s):`,
      accounts.map(a => `${a.name} (${a.type})`).join(', '));

    // Priority 2: Specific account name
    if (process.env.ONEDRIVE_ACCOUNT) {
      const accountName = process.env.ONEDRIVE_ACCOUNT;
      const account = accounts.find(a => a.name === accountName);

      if (account) {
        console.error(`[OneDrive] Using account: ${account.name} (${account.type})`);
        return account.path;
      } else {
        console.error(`[OneDrive] Account not found: ${accountName}`);
        console.error(`[OneDrive] Available accounts: ${accounts.map(a => a.name).join(', ')}`);
      }
    }

    // Priority 3: Account type filter
    if (process.env.ONEDRIVE_ACCOUNT_TYPE) {
      const accountType = process.env.ONEDRIVE_ACCOUNT_TYPE as 'business' | 'personal' | 'shared';
      const account = accounts.find(a => a.type === accountType);

      if (account) {
        console.error(`[OneDrive] Using first ${accountType} account: ${account.name}`);
        return account.path;
      } else {
        console.error(`[OneDrive] No ${accountType} account found`);
      }
    }

    // Priority 4: First available account
    const firstAccount = accounts[0];
    console.error(`[OneDrive] Using first available account: ${firstAccount.name} (${firstAccount.type})`);
    return firstAccount.path;
  }

  /**
   * Override base path if custom path provided
   */
  setBasePath(customPath: string): void {
    this.basePath = customPath;
  }

  /**
   * Get all available OneDrive accounts (for diagnostics)
   */
  getAvailableAccounts(): OneDriveAccount[] {
    return this.detectAllOneDriveAccounts();
  }
}
