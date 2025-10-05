/**
 * Maildir Service - GTD Email System
 *
 * Implements Maildir format with GTD workflow folders
 * Follows David Allen's Getting Things Done methodology
 */

import { CloudStorageManager } from '../CloudStorageManager.js';
import { EmailMessageService, ParsedEmailMessage } from './EmailMessageService.js';

export type GTDFolder =
  | 'new'           // Inbox - needs clarification
  | 'cur'           // Currently processing
  | 'Next-Actions'  // Ready to execute
  | 'Waiting-For'   // Delegated/blocked
  | 'Projects'      // Multi-step outcomes
  | 'Someday-Maybe' // Future ideas
  | 'Reference';    // Completed/archived

export interface MailboxInfo {
  email: string;
  path: string;
  type: 'organization' | 'person';
  category?: 'human' | 'ai-agent';
}

export interface EmailListItem {
  filename: string;
  path: string;
  messageId: string;
  from: string;
  to: string[];
  subject: string;
  date: Date;
  folder: string;
  flags: {
    seen: boolean;
    replied: boolean;
    flagged: boolean;
  };
  attachments?: Array<{
    filename: string;
    size: number;
    contentType: string;
  }>;
  gtd?: {
    project?: string;
    context?: string;
    priority?: string;
    status?: string;
  };
}

export class MaildirService {
  constructor(
    private storage: CloudStorageManager,
    private emailService: EmailMessageService
  ) {}

  /**
   * List all available mailboxes (email addresses)
   */
  async listMailboxes(): Promise<MailboxInfo[]> {
    const mailboxes: MailboxInfo[] = [];

    // List Organization mailboxes
    try {
      const orgFolders = await this.storage.list('Mailboxes/Organization');
      for (const folder of orgFolders) {
        if (folder.endsWith('/')) {
          // Strip trailing slash and any parent path
          const email = folder.replace(/\/$/, '').split('/').pop() || folder;
          mailboxes.push({
            email,
            path: `Mailboxes/Organization/${email}`,
            type: 'organization',
          });
        }
      }
    } catch (err) {
      console.error('[Maildir] No Organization mailboxes found');
    }

    // List People mailboxes
    try {
      const peopleFolders = await this.storage.list('Mailboxes/People');
      for (const folder of peopleFolders) {
        if (folder.endsWith('/')) {
          // Strip trailing slash and any parent path
          const email = folder.replace(/\/$/, '').split('/').pop() || folder;
          const isAI = email.includes('+');
          mailboxes.push({
            email,
            path: `Mailboxes/People/${email}`,
            type: 'person',
            category: isAI ? 'ai-agent' : 'human',
          });
        }
      }
    } catch (err) {
      console.error('[Maildir] No People mailboxes found');
    }

    return mailboxes;
  }

  /**
   * Get inbox items from a mailbox's new/ folder
   */
  async getInbox(email: string, limit: number = 10): Promise<EmailListItem[]> {
    const mailboxPath = await this.getMailboxPath(email);
    const inboxPath = `${mailboxPath}/new`;

    try {
      const files = await this.storage.list(inboxPath);
      const emlFiles = files.filter(f => f.endsWith('.eml'));

      // Limit results to prevent context overflow
      const limitedFiles = emlFiles.slice(0, limit);

      // Parse each .eml file
      const items: EmailListItem[] = [];
      for (const fullPath of limitedFiles) {
        try {
          // Extract just the filename from the full path
          const filename = fullPath.split('/').pop() || fullPath;

          // Safety: Check file size before reading (prevent memory issues)
          const metadata = await this.storage.stat(fullPath);
          const maxSize = 5 * 1024 * 1024; // 5 MB limit for .eml files

          if (metadata.size > maxSize) {
            console.error(`[Maildir] Skipping ${filename}: File too large (${Math.round(metadata.size / 1024 / 1024)}MB > 5MB)`);
            items.push({
              filename,
              path: fullPath,
              messageId: 'error-file-too-large',
              from: 'system@swoft.ai',
              to: [email],
              subject: `⚠️ File too large: ${filename}`,
              date: metadata.modified,
              folder: 'new',
              flags: { seen: false, replied: false, flagged: true },
              gtd: { priority: 'high', status: 'new' },
            });
            continue;
          }

          const emlContent = await this.storage.read(fullPath);
          const parsed = await this.emailService.parseMessage(emlContent);

          items.push({
            filename,
            path: fullPath,
            messageId: parsed.messageId,
            from: parsed.from.email,
            to: parsed.to.map(addr => addr.email),
            subject: parsed.subject,
            date: parsed.date,
            folder: 'new',
            flags: {
              seen: false, // Items in new/ are always unseen
              replied: false,
              flagged: false,
            },
            attachments: parsed.attachments.length > 0
              ? parsed.attachments.map(att => ({
                  filename: att.filename,
                  size: att.content.length,
                  contentType: att.contentType,
                }))
              : undefined,
            gtd: parsed.gtd,
          });
        } catch (err: any) {
          console.error(`[Maildir] Failed to parse ${filename}:`, err.message);
        }
      }

      return items;
    } catch (err: any) {
      console.error(`[Maildir] Failed to read inbox for ${email}:`, err.message);
      return [];
    }
  }

  /**
   * Get messages from a specific GTD folder
   */
  async getFolder(email: string, folder: GTDFolder, limit: number = 50): Promise<EmailListItem[]> {
    const mailboxPath = await this.getMailboxPath(email);
    const folderPath = folder.startsWith('.') || folder === 'new' || folder === 'cur'
      ? `${mailboxPath}/${folder}`
      : `${mailboxPath}/.${folder}`;

    try {
      const files = await this.storage.list(folderPath);
      const emlFiles = files.filter(f => f.endsWith('.eml'));
      const limitedFiles = emlFiles.slice(0, limit);

      const items: EmailListItem[] = [];
      for (const filename of limitedFiles) {
        try {
          const fullPath = `${folderPath}/${filename}`;
          const emlContent = await this.storage.read(fullPath);
          const parsed = await this.emailService.parseMessage(emlContent);
          const flags = this.emailService.parseMaildirFlags(filename);

          items.push({
            filename,
            path: fullPath,
            messageId: parsed.messageId,
            from: parsed.from.email,
            to: parsed.to.map(addr => addr.email),
            subject: parsed.subject,
            date: parsed.date,
            folder,
            flags,
            gtd: parsed.gtd,
          });
        } catch (err: any) {
          console.error(`[Maildir] Failed to parse ${filename}:`, err.message);
        }
      }

      return items;
    } catch (err: any) {
      console.error(`[Maildir] Failed to read folder ${folder} for ${email}:`, err.message);
      return [];
    }
  }

  /**
   * Read a specific email message
   */
  async readMessage(email: string, filename: string): Promise<ParsedEmailMessage | null> {
    const mailboxPath = await this.getMailboxPath(email);

    // Search in all folders for the message
    const folders: string[] = [
      'new',
      'cur',
      '.Next-Actions',
      '.Waiting-For',
      '.Projects',
      '.Someday-Maybe',
      '.Reference',
    ];

    for (const folder of folders) {
      try {
        const fullPath = `${mailboxPath}/${folder}/${filename}`;
        const emlContent = await this.storage.read(fullPath);
        return await this.emailService.parseMessage(emlContent);
      } catch (err) {
        // File not in this folder, try next
        continue;
      }
    }

    return null;
  }

  /**
   * Move message to a GTD folder (ORGANIZE step)
   */
  async moveToFolder(
    email: string,
    filename: string,
    targetFolder: GTDFolder
  ): Promise<{ success: boolean; message: string }> {
    const mailboxPath = await this.getMailboxPath(email);

    // Find source folder
    const sourceFolders = ['new', 'cur'];
    let sourceFolder: string | null = null;

    for (const folder of sourceFolders) {
      const sourcePath = `${mailboxPath}/${folder}/${filename}`;
      try {
        await this.storage.stat(sourcePath);
        sourceFolder = folder;
        break;
      } catch (err) {
        continue;
      }
    }

    if (!sourceFolder) {
      return {
        success: false,
        message: `Message ${filename} not found in new/ or cur/`,
      };
    }

    const targetFolderPath = targetFolder === 'new' || targetFolder === 'cur'
      ? targetFolder
      : `.${targetFolder}`;

    return {
      success: false,
      message: `Move operation: ${sourceFolder}/${filename} → ${targetFolderPath}/ (not yet implemented - needs file move support in CloudStorageManager)`,
    };
  }

  /**
   * Send a message (create new .eml in recipient's new/ folder)
   */
  async sendMessage(options: {
    from: string;
    to: string;
    subject: string;
    text: string;
    html?: string;
    gtd?: {
      project?: string;
      context?: string;
      priority?: 'high' | 'medium' | 'low';
    };
  }): Promise<{ success: boolean; filename: string; path: string }> {
    const recipientPath = await this.getMailboxPath(options.to);
    const inboxPath = `${recipientPath}/new`;

    // Create .eml message
    const emlContent = await this.emailService.createMessage({
      from: { email: options.from },
      to: { email: options.to },
      subject: options.subject,
      text: options.text,
      html: options.html,
      gtd: options.gtd
        ? {
            ...options.gtd,
            status: 'new', // New messages start in 'new' status
          }
        : undefined,
    });

    // Generate Maildir filename
    const filename = this.emailService.generateMaildirFilename();
    const fullPath = `${inboxPath}/${filename}`;

    // Write message to inbox
    await this.storage.write(fullPath, emlContent);

    return {
      success: true,
      filename,
      path: fullPath,
    };
  }

  // Private helper methods

  private async getMailboxPath(email: string): Promise<string> {
    const mailboxes = await this.listMailboxes();
    const mailbox = mailboxes.find(mb => mb.email === email);

    if (!mailbox) {
      throw new Error(`Mailbox not found: ${email}`);
    }

    return mailbox.path;
  }
}
