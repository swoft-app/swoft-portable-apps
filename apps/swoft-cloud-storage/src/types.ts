/**
 * Cloud Storage Provider Types
 *
 * Abstraction layer for cloud storage providers (OneDrive, iCloud, etc.)
 * Can be used by both MCP servers and Electron apps
 */

export interface CloudStorageProvider {
  /** Provider name (e.g., "onedrive", "icloud") */
  name: string;

  /** Display name (e.g., "OneDrive", "iCloud Drive") */
  displayName: string;

  /** Base path to cloud storage on local filesystem */
  basePath: string;

  /** Check if provider is available on this machine */
  isAvailable(): Promise<boolean>;

  /** List files in a directory */
  list(subfolder?: string): Promise<string[]>;

  /** Read file contents */
  read(path: string): Promise<string>;

  /** Search files matching pattern (glob) */
  search(pattern: string, subfolder?: string): Promise<string[]>;

  /** Get file metadata */
  stat(path: string): Promise<FileMetadata>;
}

export interface FileMetadata {
  path: string;
  name: string;
  size: number;
  modified: Date;
  isDirectory: boolean;
}

export interface CloudStorageConfig {
  /** Workspace subfolder (e.g., "swoft.ai - Documents") */
  workspaceFolder?: string;

  /** Auto-detect available providers */
  autoDetect?: boolean;

  /** Preferred provider (if multiple available) */
  preferredProvider?: string;
}

export class CloudStorageError extends Error {
  constructor(
    message: string,
    public provider: string,
    public code: string
  ) {
    super(message);
    this.name = 'CloudStorageError';
  }
}
