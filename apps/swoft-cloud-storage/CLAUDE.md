# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

**SWOFT Cloud Storage** - A portable, self-contained MCP server and library for cloud storage abstraction.

This is a **different implementation** from `gtd-mcp-apps/packages/cloud-storage`. Key differences:

| Feature | swoft-portable-apps/swoft-cloud-storage | gtd-mcp-apps/cloud-storage |
|---------|----------------------------------------|---------------------------|
| **Purpose** | Generic cloud storage library + MCP | Team GTD collaboration MCP |
| **Architecture** | Library-first (can embed in Electron) | MCP server-first |
| **Use Case** | Portable tool, Electron integration | Team inbox collaboration |
| **Distribution** | Via OneDrive sync (portable) | Via .mcpb bundle |
| **Version** | 2.0.0 | 1.0.0 |

**Key Tech Stack:**
- TypeScript 5.9 (strict mode, ES2022 modules)
- MCP SDK 1.17.4
- OneDrive cloud storage provider
- Maildir email format for GTD workflows
- glob for file pattern matching
- mailparser/nodemailer for email handling
- esbuild for bundling (portable distribution)

## Common Commands

```bash
# Development
npm install          # Install dependencies
npm run build        # Build with esbuild (creates bundled dist/)
npm run build:tsc    # TypeScript compilation only
npm run dev          # Watch mode (tsc --watch)
npm run clean        # Remove dist and node_modules
npm run rebuild      # Clean + build

# Deployment
npm run deploy:onedrive  # Deploy to OneDrive for team distribution

# Testing
npm test             # Run tests
```

## Architecture

### Layered Design

```
Models (CloudStorageProvider interface, types)
  ↓
Providers (OneDriveProvider, BaseProvider)
  ↓
CloudStorageManager (provider abstraction layer)
  ↓
Services (EmailMessageService, MaildirService, GTDInboxService)
  ↓
MCP Server (mcp-server.ts)
```

### Key Components

**1. Library-First Architecture**
- `CloudStorageManager` - Core abstraction layer
- `OneDriveProvider` - OneDrive-specific implementation
- `BaseProvider` - Abstract base for providers
- **Can be imported as a library** into Electron apps via `index.ts` exports

**2. MCP Server**
- Separate entry point: `mcp-server.ts`
- Implements MCP protocol on top of library
- Can run standalone or be embedded

**3. GTD Email Services**
- `MaildirService` - Maildir format with GTD folders
- `EmailMessageService` - .eml file creation/parsing
- `GTDInboxService` - GTD clarification logic

**4. MCP Tools (9 total)**
- File operations: list_docs, read_doc, search_docs, get_provider_info
- GTD workflows: gtd_list_inboxes, gtd_collect_inbox_items, gtd_clarify_item, gtd_organize_to_reference, gtd_capture

## Build Strategy

Uses **esbuild** for portable distribution:

```javascript
// build.js
esbuild.build({
  entryPoints: ['src/mcp-server.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  outfile: 'dist/mcp-server.js',
  external: ['@modelcontextprotocol/*']
})
```

**Why esbuild instead of tsc:**
- Bundles all dependencies (except MCP SDK)
- Creates truly portable dist/ (no node_modules needed)
- Faster builds
- Better for OneDrive distribution

## Data Location

- OneDrive path detection (Mac/Windows/Linux)
- Default workspace: `swoft.ai - Documents`
- Override via: `export CLOUD_STORAGE_WORKSPACE=custom-folder`

## Environment Variables

- `CLOUD_STORAGE_WORKSPACE` - Override default workspace folder (default: "swoft.ai - Documents")

## Distribution

**Portable App Strategy:**
1. Build with `npm run build` (creates bundled dist/)
2. Deploy to OneDrive: `npm run deploy:onedrive`
3. Team gets updates automatically via OneDrive sync
4. No installation required - just copy and run

**Path in OneDrive:**
```
~/Library/CloudStorage/OneDrive-DevApps4Biz.com/SWOFT/Apps/swoft-cloud-storage/
```

## TypeScript Configuration

Strict mode enabled with all strict checks.

## Relationship to Other Repos

**This is NOT the same as gtd-mcp-apps/packages/cloud-storage:**

- **swoft-portable-apps/swoft-cloud-storage** (this package):
  - Generic cloud storage library
  - Can be embedded in Electron apps
  - Distributed via OneDrive as portable tool
  - Focus: Reusable abstraction layer

- **gtd-mcp-apps/packages/cloud-storage**:
  - Team GTD collaboration MCP server
  - Specialized for team inbox workflows
  - Distributed via .mcpb bundles
  - Focus: Team collaboration features

Both are **active** and serve different purposes.

## Credits

Built by SWOFT AI Platform team for portable cloud storage integration.
