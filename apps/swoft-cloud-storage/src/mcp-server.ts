#!/usr/bin/env node

/**
 * SWOFT Cloud Storage MCP Server
 *
 * MCP server using cloud storage abstraction layer
 * Works with OneDrive, iCloud, etc.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { CloudStorageManager } from './CloudStorageManager.js';
import { OneDriveProvider } from './providers/OneDriveProvider.js';
import { config as dotenvConfig } from 'dotenv';

// Load environment variables
dotenvConfig();

// Suppress console logs in MCP mode
const originalConsole = { ...console };
console.log = (...args: any[]) => originalConsole.error('[LOG]', ...args);
console.warn = (...args: any[]) => originalConsole.error('[WARN]', ...args);
console.info = (...args: any[]) => originalConsole.error('[INFO]', ...args);

class CloudStorageMcpServer {
  private server: Server;
  private storage: CloudStorageManager;

  constructor() {
    this.server = new Server(
      {
        name: 'swoft-cloud-storage',
        version: '2.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize cloud storage with available providers
    const workspaceFolder = process.env.CLOUD_STORAGE_WORKSPACE || 'swoft.ai - Documents';

    this.storage = new CloudStorageManager([
      new OneDriveProvider(workspaceFolder),
      // Future: Add more providers here
      // new iCloudProvider(workspaceFolder),
    ]);

    this.setupHandlers();
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'list_docs',
          description: 'List files in cloud storage workspace',
          inputSchema: {
            type: 'object',
            properties: {
              subfolder: {
                type: 'string',
                description: 'Subfolder to list (optional)'
              }
            }
          }
        },
        {
          name: 'read_doc',
          description: 'Read file contents from cloud storage',
          inputSchema: {
            type: 'object',
            properties: {
              filename: {
                type: 'string',
                description: 'File path to read'
              }
            },
            required: ['filename']
          }
        },
        {
          name: 'search_docs',
          description: 'Search files in cloud storage using glob pattern',
          inputSchema: {
            type: 'object',
            properties: {
              pattern: {
                type: 'string',
                description: 'Glob pattern (e.g., "**/*.md")'
              },
              subfolder: {
                type: 'string',
                description: 'Subfolder to search in (optional)'
              }
            },
            required: ['pattern']
          }
        },
        {
          name: 'get_provider_info',
          description: 'Get information about active cloud storage provider',
          inputSchema: {
            type: 'object',
            properties: {}
          }
        }
      ]
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'list_docs': {
            const files = await this.storage.list(args?.subfolder);
            const provider = this.storage.getProvider();
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    provider: provider.displayName,
                    subfolder: args?.subfolder || '/',
                    files,
                    count: files.length
                  }, null, 2)
                }
              ]
            };
          }

          case 'read_doc': {
            if (!args?.filename) {
              throw new Error('filename parameter required');
            }
            const content = await this.storage.read(args.filename);
            return {
              content: [
                {
                  type: 'text',
                  text: content
                }
              ]
            };
          }

          case 'search_docs': {
            if (!args?.pattern) {
              throw new Error('pattern parameter required');
            }
            const results = await this.storage.search(args.pattern, args?.subfolder);
            const provider = this.storage.getProvider();
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    provider: provider.displayName,
                    pattern: args.pattern,
                    subfolder: args?.subfolder,
                    results,
                    count: results.length
                  }, null, 2)
                }
              ]
            };
          }

          case 'get_provider_info': {
            const provider = this.storage.getProvider();
            const available = await this.storage.getAvailableProviders();
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    active: {
                      name: provider.name,
                      displayName: provider.displayName,
                      basePath: provider.basePath
                    },
                    available: available.map(p => ({
                      name: p.name,
                      displayName: p.displayName
                    }))
                  }, null, 2)
                }
              ]
            };
          }

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`
            }
          ],
          isError: true
        };
      }
    });
  }

  async run() {
    try {
      // Initialize cloud storage (auto-detect providers)
      await this.storage.initialize();

      const provider = this.storage.getProvider();
      console.error(`[CloudStorage MCP] Using provider: ${provider.displayName}`);
      console.error(`[CloudStorage MCP] Base path: ${provider.basePath}`);

      // Start MCP server
      const transport = new StdioServerTransport();
      await this.server.connect(transport);

      console.error('[CloudStorage MCP] Server running');
    } catch (error: any) {
      console.error('[CloudStorage MCP] Failed to start:', error.message);
      process.exit(1);
    }
  }
}

// Main execution
const server = new CloudStorageMcpServer();
server.run().catch(console.error);
