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
import { GTDInboxService } from './services/GTDInboxService.js';
import { EmailMessageService } from './services/EmailMessageService.js';
import { MaildirService } from './services/MaildirService.js';

/**
 * MCP SDK Standard Logging Practice:
 * - STDOUT: JSON-RPC protocol messages ONLY (kept clean by MCP SDK)
 * - STDERR: All logging, debugging, errors (console.error, console.warn, etc.)
 *
 * We redirect console.log/info/warn → console.error (STDERR)
 * This keeps STDOUT clean while allowing proper MCP logging
 */
const originalConsole = { ...console };

// Redirect all console methods to STDERR (MCP SDK best practice)
console.log = (...args: any[]) => originalConsole.error('[LOG]', ...args);
console.warn = (...args: any[]) => originalConsole.error('[WARN]', ...args);
console.info = (...args: any[]) => originalConsole.error('[INFO]', ...args);
console.debug = (...args: any[]) => originalConsole.error('[DEBUG]', ...args);
// console.error already goes to STDERR - keep as-is

class CloudStorageMcpServer {
  private server: Server;
  private storage: CloudStorageManager;
  private gtdService: GTDInboxService;
  private emailService: EmailMessageService;
  private maildirService: MaildirService;

  constructor() {
    this.server = new Server(
      {
        name: 'swoft-cloud-storage',
        version: '3.0.0',
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

    this.gtdService = new GTDInboxService();
    this.emailService = new EmailMessageService();
    this.maildirService = new MaildirService(this.storage, this.emailService);

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
        },
        {
          name: 'gtd_list_inboxes',
          description: 'GTD: List all available team member inboxes (human and AI agents)',
          inputSchema: {
            type: 'object',
            properties: {}
          }
        },
        {
          name: 'gtd_collect_inbox_items',
          description: 'GTD COLLECT: View items in inbox requiring clarification',
          inputSchema: {
            type: 'object',
            properties: {
              inbox_owner: {
                type: 'string',
                description: 'Inbox owner (email address, e.g., "derick+claude@swoft.ai", "team@swoft.ai")'
              },
              limit: {
                type: 'number',
                description: 'Max items to return (default: 10, prevents context overflow)',
                default: 10
              }
            },
            required: ['inbox_owner']
          }
        },
        {
          name: 'gtd_clarify_item',
          description: 'GTD CLARIFY: Process an inbox item - answer "What is it?" and "Is it actionable?"',
          inputSchema: {
            type: 'object',
            properties: {
              inbox_owner: {
                type: 'string',
                description: 'Inbox owner (email address)'
              },
              item_filename: {
                type: 'string',
                description: 'Inbox item filename (.eml file)'
              },
              clarification: {
                type: 'object',
                description: 'GTD clarification answers',
                properties: {
                  what_is_it: { type: 'string' },
                  is_actionable: { type: 'boolean' },
                  outcome: {
                    type: 'string',
                    enum: ['next_action', 'project', 'waiting_for', 'reference', 'someday_maybe', 'trash']
                  }
                }
              }
            },
            required: ['inbox_owner', 'item_filename', 'clarification']
          }
        },
        {
          name: 'gtd_organize_to_reference',
          description: 'GTD ORGANIZE: Move processed item to reference (completed/archived)',
          inputSchema: {
            type: 'object',
            properties: {
              inbox_owner: {
                type: 'string',
                description: 'Inbox owner (email address)'
              },
              item_filename: {
                type: 'string',
                description: 'Item filename (.eml file)'
              }
            },
            required: ['inbox_owner', 'item_filename']
          }
        }
      ]
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      const params = args as Record<string, any> | undefined;

      try {
        switch (name) {
          case 'list_docs': {
            const files = await this.storage.list(params?.subfolder);
            const provider = this.storage.getProvider();
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    provider: provider.displayName,
                    subfolder: params?.subfolder || '/',
                    files,
                    count: files.length
                  }, null, 2)
                }
              ]
            };
          }

          case 'read_doc': {
            if (!params?.filename) {
              throw new Error('filename parameter required');
            }
            const content = await this.storage.read(params.filename as string);
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
            if (!params?.pattern) {
              throw new Error('pattern parameter required');
            }
            const results = await this.storage.search(params.pattern as string, params?.subfolder as string | undefined);
            const provider = this.storage.getProvider();
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    provider: provider.displayName,
                    pattern: params?.pattern,
                    subfolder: params?.subfolder,
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

          case 'gtd_list_inboxes': {
            const mailboxes = await this.maildirService.listMailboxes();

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    mailboxes: mailboxes.map(mb => ({
                      email: mb.email,
                      type: mb.type,
                      category: mb.category
                    })),
                    count: mailboxes.length
                  }, null, 2)
                }
              ]
            };
          }

          case 'gtd_collect_inbox_items': {
            const email = params?.inbox_owner as string;
            const limit = params?.limit as number || 10;

            const items = await this.maildirService.getInbox(email, limit);

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    inbox: email,
                    format: 'Maildir + .eml (RFC 5322)',
                    items_returned: items.length,
                    limit_applied: limit,
                    items: items.map(item => ({
                      filename: item.filename,
                      from: item.from,
                      to: item.to,
                      subject: item.subject,
                      date: item.date,
                      gtd: item.gtd
                    }))
                  }, null, 2)
                }
              ]
            };
          }

          case 'gtd_clarify_item': {
            const email = params?.inbox_owner as string;
            const filename = params?.item_filename as string;
            const clarification = params?.clarification as any;

            const message = await this.maildirService.readMessage(email, filename);

            if (!message) {
              throw new Error(`Message not found: ${filename}`);
            }

            const gtdDecision = this.gtdService.createClarificationDecision(clarification);

            // Truncate content to prevent context overflow
            const contentPreview = message.text.length > 1000
              ? message.text.slice(0, 1000) + '\n...(truncated)'
              : message.text;

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    message: {
                      filename,
                      from: message.from.email,
                      subject: message.subject,
                      date: message.date
                    },
                    clarification: gtdDecision,
                    content_preview: contentPreview,
                    next_action: 'Move to appropriate GTD folder based on outcome'
                  }, null, 2)
                }
              ]
            };
          }

          case 'gtd_organize_to_reference': {
            const email = params?.inbox_owner as string;
            const filename = params?.item_filename as string;

            const result = await this.maildirService.moveToFolder(email, filename, 'Reference');

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2)
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
