/**
 * Email Message Service - .eml format handling
 *
 * Handles creating and parsing RFC 5322 .eml format messages with GTD metadata
 * Works with Maildir structure for SWOFT GTD system
 */

import { simpleParser, ParsedMail, AddressObject } from 'mailparser';
import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';

export interface EmailAddress {
  email: string;
  name?: string;
}

export interface GTDMetadata {
  project?: string;
  context?: string;
  priority?: 'high' | 'medium' | 'low';
  tags?: string[];
  status?: 'new' | 'clarifying' | 'next-action' | 'waiting-for' | 'someday' | 'reference';
}

export interface EmailMessageOptions {
  from: EmailAddress;
  to: EmailAddress | EmailAddress[];
  subject: string;
  text: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
  gtd?: GTDMetadata;
}

export interface ParsedEmailMessage {
  messageId: string;
  from: EmailAddress;
  to: EmailAddress[];
  subject: string;
  date: Date;
  text: string;
  html?: string;
  attachments: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
  gtd: GTDMetadata;
}

export class EmailMessageService {
  /**
   * Create a .eml format message
   */
  async createMessage(options: EmailMessageOptions): Promise<string> {
    const message: Mail.Options = {
      from: this.formatAddress(options.from),
      to: Array.isArray(options.to)
        ? options.to.map(addr => this.formatAddress(addr))
        : this.formatAddress(options.to),
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments as any,
      // Custom GTD headers (X- prefix for extension headers)
      headers: this.buildGTDHeaders(options.gtd),
    };

    // Generate .eml content using nodemailer
    const emlContent = await this.generateEML(message);
    return emlContent;
  }

  /**
   * Parse a .eml format message
   */
  async parseMessage(emlContent: string): Promise<ParsedEmailMessage> {
    const parsed = await simpleParser(emlContent);

    return {
      messageId: parsed.messageId || this.generateMessageId(),
      from: this.extractAddress(parsed.from),
      to: this.extractAddresses(parsed.to),
      subject: parsed.subject || '(No subject)',
      date: parsed.date || new Date(),
      text: parsed.text || '',
      html: parsed.html || undefined,
      attachments: (parsed.attachments || []).map(att => ({
        filename: att.filename || 'attachment',
        content: att.content,
        contentType: att.contentType,
      })),
      gtd: this.extractGTDMetadata(parsed),
    };
  }

  /**
   * Generate Maildir filename (Windows-compatible)
   * Format: {timestamp}.{pid}.{hostname}_2,{flags}.eml
   *
   * Note: Uses underscore instead of colon (Windows doesn't allow : in filenames)
   * Traditional Maildir: filename:2,flags
   * Windows-safe:       filename_2,flags
   */
  generateMaildirFilename(flags: string = ''): string {
    const timestamp = Math.floor(Date.now() / 1000);
    const pid = process.pid;
    const hostname = 'swoft.local';
    const uniqueId = `${timestamp}.${pid}.${hostname}`;

    // Use underscore instead of colon for Windows compatibility
    return flags ? `${uniqueId}_2,${flags}.eml` : `${uniqueId}_2,.eml`;
  }

  /**
   * Parse Maildir filename flags
   * S = Seen, R = Replied, F = Flagged, D = Draft, T = Trashed
   *
   * Supports both formats:
   * - Traditional: filename:2,flags
   * - Windows-safe: filename_2,flags
   */
  parseMaildirFlags(filename: string): {
    seen: boolean;
    replied: boolean;
    flagged: boolean;
    draft: boolean;
    trashed: boolean;
  } {
    // Try both colon (traditional) and underscore (Windows-safe) formats
    const flagMatch = filename.match(/[_:]2,([A-Z]*)/);
    const flags = flagMatch ? flagMatch[1] : '';

    return {
      seen: flags.includes('S'),
      replied: flags.includes('R'),
      flagged: flags.includes('F'),
      draft: flags.includes('D'),
      trashed: flags.includes('T'),
    };
  }

  // Private helper methods

  private formatAddress(addr: EmailAddress): string {
    return addr.name ? `"${addr.name}" <${addr.email}>` : addr.email;
  }

  private extractAddress(parsed: AddressObject | AddressObject[] | undefined): EmailAddress {
    if (!parsed) {
      return { email: 'unknown@swoft.ai' };
    }

    const addressObj = Array.isArray(parsed) ? parsed[0] : parsed;
    const firstAddress = addressObj.value[0];

    return {
      email: firstAddress.address || 'unknown@swoft.ai',
      name: firstAddress.name,
    };
  }

  private extractAddresses(parsed: AddressObject | AddressObject[] | undefined): EmailAddress[] {
    if (!parsed) {
      return [];
    }

    const addressObjs = Array.isArray(parsed) ? parsed : [parsed];
    return addressObjs.flatMap(obj =>
      obj.value.map(addr => ({
        email: addr.address || 'unknown@swoft.ai',
        name: addr.name,
      }))
    );
  }

  private buildGTDHeaders(gtd?: GTDMetadata): Record<string, string> {
    if (!gtd) {
      return {};
    }

    const headers: Record<string, string> = {};

    if (gtd.project) headers['X-GTD-Project'] = gtd.project;
    if (gtd.context) headers['X-GTD-Context'] = gtd.context;
    if (gtd.priority) headers['X-GTD-Priority'] = gtd.priority;
    if (gtd.status) headers['X-GTD-Status'] = gtd.status;
    if (gtd.tags && gtd.tags.length > 0) {
      headers['X-GTD-Tags'] = gtd.tags.join(', ');
    }

    return headers;
  }

  private extractGTDMetadata(parsed: ParsedMail): GTDMetadata {
    const headers = parsed.headers;

    return {
      project: headers.get('x-gtd-project') as string | undefined,
      context: headers.get('x-gtd-context') as string | undefined,
      priority: headers.get('x-gtd-priority') as any,
      status: headers.get('x-gtd-status') as any,
      tags: this.parseTags(headers.get('x-gtd-tags') as string | undefined),
    };
  }

  private parseTags(tagsHeader?: string): string[] | undefined {
    if (!tagsHeader) return undefined;
    return tagsHeader.split(',').map(tag => tag.trim());
  }

  private async generateEML(message: Mail.Options): Promise<string> {
    // Create a test account for generating .eml (not actually sending)
    const transporter = nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
    });

    return new Promise((resolve, reject) => {
      transporter.sendMail(message, (err, info) => {
        if (err) {
          reject(err);
          return;
        }

        const chunks: Buffer[] = [];
        info.message.on('data', (chunk: Buffer) => chunks.push(chunk));
        info.message.on('end', () => {
          const emlContent = Buffer.concat(chunks).toString('utf-8');
          resolve(emlContent);
        });
        info.message.on('error', reject);
      });
    });
  }

  private generateMessageId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `<${timestamp}.${random}@swoft.ai>`;
  }
}
