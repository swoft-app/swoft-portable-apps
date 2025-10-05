/**
 * Base Cloud Storage Provider
 *
 * Abstract base class for cloud storage implementations
 */

import { existsSync, statSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { glob } from 'glob';
import type { CloudStorageProvider, FileMetadata } from '../types.js';

export abstract class BaseCloudStorageProvider implements CloudStorageProvider {
  abstract name: string;
  abstract displayName: string;
  abstract basePath: string;

  protected workspaceFolder: string;

  constructor(workspaceFolder: string = '') {
    this.workspaceFolder = workspaceFolder;
  }

  /**
   * Get full workspace path
   */
  protected getWorkspacePath(): string {
    if (this.workspaceFolder) {
      return join(this.basePath, this.workspaceFolder);
    }
    return this.basePath;
  }

  /**
   * Check if provider is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const workspacePath = this.getWorkspacePath();
      return existsSync(workspacePath);
    } catch {
      return false;
    }
  }

  /**
   * List files in directory
   */
  async list(subfolder?: string): Promise<string[]> {
    const workspacePath = this.getWorkspacePath();
    const targetPath = subfolder ? join(workspacePath, subfolder) : workspacePath;

    if (!existsSync(targetPath)) {
      throw new Error(`Directory not found: ${targetPath}`);
    }

    const files = readdirSync(targetPath, { withFileTypes: true });
    return files.map(file => {
      const fullPath = subfolder ? join(subfolder, file.name) : file.name;
      return file.isDirectory() ? `${fullPath}/` : fullPath;
    });
  }

  /**
   * Read file contents
   */
  async read(path: string): Promise<string> {
    const workspacePath = this.getWorkspacePath();
    const fullPath = join(workspacePath, path);

    if (!existsSync(fullPath)) {
      throw new Error(`File not found: ${path}`);
    }

    return readFileSync(fullPath, 'utf-8');
  }

  /**
   * Search files matching glob pattern
   */
  async search(pattern: string, subfolder?: string): Promise<string[]> {
    const workspacePath = this.getWorkspacePath();
    const searchPath = subfolder ? join(workspacePath, subfolder) : workspacePath;

    const matches = await glob(pattern, {
      cwd: searchPath,
      nodir: true,
      dot: false
    });

    return matches;
  }

  /**
   * Get file metadata
   */
  async stat(path: string): Promise<FileMetadata> {
    const workspacePath = this.getWorkspacePath();
    const fullPath = join(workspacePath, path);

    if (!existsSync(fullPath)) {
      throw new Error(`File not found: ${path}`);
    }

    const stats = statSync(fullPath);
    const name = path.split('/').pop() || path;

    return {
      path,
      name,
      size: stats.size,
      modified: stats.mtime,
      isDirectory: stats.isDirectory()
    };
  }
}
