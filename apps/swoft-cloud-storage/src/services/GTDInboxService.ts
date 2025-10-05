/**
 * GTD Inbox Service
 *
 * Domain Service implementing David Allen's GTD methodology
 * with Eric Evans DDD patterns.
 *
 * UBIQUITOUS LANGUAGE:
 * - Inbox (Aggregate Root)
 * - InboxItem (Entity)
 * - Clarify (Domain Operation)
 * - Organize (Domain Operation)
 *
 * RESPONSIBILITY: GTD workflow operations (COLLECT, CLARIFY, ORGANIZE)
 * DELEGATES TO: File system operations for persistence
 */

/**
 * GTD Inbox Item (Entity)
 */
export interface InboxItem {
  // DDD Entity identity
  id: string;
  path: string;

  // GTD metadata
  status: GTDStatus;
  priority: Priority;
  requires_clarification: boolean;

  // File metadata
  modified: string;
  size: number;
}

/**
 * GTD Status (Value Object)
 */
export type GTDStatus = 'unclarified' | 'blocked' | 'delegated' | 'unknown';

/**
 * Priority (Value Object)
 */
export type Priority = 'high' | 'normal' | 'low';

/**
 * GTD Outcome (Value Object)
 */
export type GTDOutcome = 'next_action' | 'project' | 'waiting_for' | 'reference' | 'someday_maybe' | 'trash';

/**
 * GTD Clarification (Value Object)
 */
export interface Clarification {
  what_is_it: string;
  is_actionable: boolean;
  outcome: GTDOutcome;
}

/**
 * GTD Inbox Service
 *
 * Domain Service implementing GTD workflow operations.
 * Pure business logic - no infrastructure concerns.
 */
export class GTDInboxService {
  /**
   * GTD COLLECT: Enrich file list with GTD metadata
   *
   * Takes raw file listing and adds GTD-semantic information.
   */
  enrichInboxItems(files: Array<{ name: string; path: string; type: string; size: number; modified: string }>): InboxItem[] {
    return files
      .filter(item => item.type === 'file' && item.name.endsWith('.md'))
      .filter(item => !item.name.startsWith('REPLY-') && !item.name.startsWith('PROCESSING-'))
      .map(item => ({
        // DDD Entity properties
        id: item.name,
        path: item.path,

        // GTD metadata
        status: this.inferGTDStatus(item.name),
        priority: this.inferPriority(item.name),
        requires_clarification: true,

        // File metadata
        modified: item.modified,
        size: item.size,
      }));
  }

  /**
   * GTD CLARIFY: Create clarification decision
   *
   * Domain logic for processing an inbox item through GTD clarification.
   */
  createClarificationDecision(clarification: Clarification) {
    return {
      // Clarification questions (David Allen)
      what_is_it: clarification.what_is_it,
      is_actionable: clarification.is_actionable,

      // Organize decision
      outcome: clarification.outcome,

      // Recommended next steps
      recommended_action: this.getRecommendedAction(clarification.outcome),

      // DDD Event
      event: {
        type: 'InboxItemClarified',
        timestamp: new Date().toISOString(),
        clarification,
      },
    };
  }

  /**
   * GTD ORGANIZE: Create archive instruction
   *
   * Returns domain event for organizing item to reference.
   */
  createArchiveInstruction(itemFilename: string, inboxOwner: string) {
    const sourcePath = `Team/inbox-${inboxOwner}-claude/${itemFilename}`;
    const targetPath = `Team/inbox-${inboxOwner}-claude/processed/${itemFilename}`;

    return {
      // DDD Event
      event: {
        type: 'InboxItemArchived',
        aggregate_id: itemFilename,
        inbox_owner: inboxOwner,
        timestamp: new Date().toISOString(),
      },

      // GTD Organize step
      organize_action: 'Move to Reference',
      source: sourcePath,
      target: targetPath,

      // TODO: Implement actual file move when write operations added
      status: 'MANUAL_ACTION_REQUIRED',
      instructions: `Move ${sourcePath} to ${targetPath}`,
    };
  }

  // ============================================================================
  // GTD Domain Logic (Private Methods)
  // ============================================================================

  private inferGTDStatus(filename: string): GTDStatus {
    if (filename.startsWith('INBOX-')) return 'unclarified';
    if (filename.startsWith('ISSUE-')) return 'blocked';
    if (filename.startsWith('REPLY-')) return 'delegated';
    return 'unknown';
  }

  private inferPriority(filename: string): Priority {
    if (filename.includes('HIGH') || filename.includes('URGENT')) return 'high';
    if (filename.includes('NORMAL')) return 'normal';
    if (filename.includes('LOW')) return 'low';
    return 'normal';
  }

  private getRecommendedAction(outcome: GTDOutcome): string {
    const recommendations: Record<GTDOutcome, string> = {
      next_action: 'Add to Next Actions list with context tags',
      project: 'Create project plan with desired outcome and next actions',
      waiting_for: 'Track in Waiting For list with trigger/due date',
      reference: 'Move to Reference (processed folder)',
      someday_maybe: 'Add to Someday/Maybe list for future review',
      trash: 'Delete (no action needed)',
    };

    return recommendations[outcome] || 'Unknown outcome type';
  }
}
