/**
 * Cloud Storage Manager
 *
 * Manages multiple cloud storage providers with auto-detection
 * Can be used by both MCP servers and Electron apps
 */

import type { CloudStorageProvider, CloudStorageConfig } from './types.js';
import { CloudStorageError } from './types.js';

export class CloudStorageManager {
  private providers: CloudStorageProvider[] = [];
  private activeProvider: CloudStorageProvider | null = null;
  private config: CloudStorageConfig;

  constructor(
    providers: CloudStorageProvider[],
    config: CloudStorageConfig = {}
  ) {
    this.providers = providers;
    this.config = {
      autoDetect: true,
      ...config
    };
  }

  /**
   * Initialize and detect available providers
   */
  async initialize(): Promise<void> {
    if (!this.config.autoDetect) {
      // Use preferred provider if specified
      if (this.config.preferredProvider) {
        const provider = this.providers.find(
          p => p.name === this.config.preferredProvider
        );
        if (provider && await provider.isAvailable()) {
          this.activeProvider = provider;
          return;
        }
      }
    }

    // Auto-detect available providers
    for (const provider of this.providers) {
      if (await provider.isAvailable()) {
        this.activeProvider = provider;
        console.error(`[CloudStorage] Using provider: ${provider.displayName}`);
        return;
      }
    }

    throw new CloudStorageError(
      'No cloud storage provider available',
      'none',
      'NO_PROVIDER_AVAILABLE'
    );
  }

  /**
   * Get active provider
   */
  getProvider(): CloudStorageProvider {
    if (!this.activeProvider) {
      throw new CloudStorageError(
        'No provider initialized. Call initialize() first.',
        'none',
        'NOT_INITIALIZED'
      );
    }
    return this.activeProvider;
  }

  /**
   * Get all available providers
   */
  async getAvailableProviders(): Promise<CloudStorageProvider[]> {
    const available: CloudStorageProvider[] = [];

    for (const provider of this.providers) {
      if (await provider.isAvailable()) {
        available.push(provider);
      }
    }

    return available;
  }

  /**
   * Switch to different provider
   */
  async switchProvider(providerName: string): Promise<void> {
    const provider = this.providers.find(p => p.name === providerName);

    if (!provider) {
      throw new CloudStorageError(
        `Provider not found: ${providerName}`,
        providerName,
        'PROVIDER_NOT_FOUND'
      );
    }

    if (!await provider.isAvailable()) {
      throw new CloudStorageError(
        `Provider not available: ${providerName}`,
        providerName,
        'PROVIDER_NOT_AVAILABLE'
      );
    }

    this.activeProvider = provider;
    console.error(`[CloudStorage] Switched to provider: ${provider.displayName}`);
  }

  /**
   * List files (delegates to active provider)
   */
  async list(subfolder?: string): Promise<string[]> {
    return this.getProvider().list(subfolder);
  }

  /**
   * Read file (delegates to active provider)
   */
  async read(path: string): Promise<string> {
    return this.getProvider().read(path);
  }

  /**
   * Search files (delegates to active provider)
   */
  async search(pattern: string, subfolder?: string): Promise<string[]> {
    return this.getProvider().search(pattern, subfolder);
  }

  /**
   * Get file metadata (delegates to active provider)
   */
  async stat(path: string) {
    return this.getProvider().stat(path);
  }

  /**
   * Write file contents (delegates to active provider)
   */
  async write(path: string, content: string): Promise<void> {
    return this.getProvider().write(path, content);
  }
}
