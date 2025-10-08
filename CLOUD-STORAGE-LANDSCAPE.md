# Cloud Storage Implementation Landscape

**Last Updated:** 2025-10-08
**Updated by:** Claude Code (documentation audit)

## TL;DR - Which Package Do I Use?

| Need | Use This | Repository |
|------|----------|------------|
| **Personal GTD system** | `@swoft-ai/gtd-mcp-server` | gtd-mcp-apps/packages/gtd-core |
| **Team collaboration inbox** | `@swoft-ai/cloud-storage-mcp-server` | gtd-mcp-apps/packages/cloud-storage |
| **Embed in Electron app** | `@swoft-ai/cloud-storage` | swoft-portable-apps/apps/swoft-cloud-storage |
| **Portable MCP tool** | `@swoft-ai/cloud-storage` | swoft-portable-apps/apps/swoft-cloud-storage |

---

## The Confusion (2025-10-08 Audit)

**Problem:** Documentation claimed `gtd-mcp-apps/packages/cloud-storage` was "deprecated" but git commits showed active development.

**Truth:** Git commits are the source of truth. The package is **ACTIVE**, not deprecated.

---

## All Cloud Storage Implementations

### 1. gtd-mcp-apps/packages/gtd-core v3.0.1 ✅

**Purpose:** Personal GTD productivity system

**Key Info:**
- **Latest commit:** Oct 8, 2025 (documentation updates)
- **Status:** ✅ ACTIVE - Primary personal GTD server
- **Tools:** 29 GTD tools (inbox, projects, actions, contexts, review, templates, workflow)
- **Storage:** JSON local files (default) OR OneDrive Maildir (optional, `GTD_STORAGE_BACKEND=onedrive`)
- **Agents:** Synthia AI assistant, inbox processor, startup checks
- **Distribution:** .mcpb bundle
- **Best for:** Solo users, personal productivity

**What changed in v3.0.0:**
- Added OneDrive backend option (not default)
- Did NOT deprecate cloud-storage package
- Added flexible storage backend abstraction

---

### 2. gtd-mcp-apps/packages/cloud-storage v1.0.0 ✅

**Purpose:** Team GTD collaboration via shared OneDrive inboxes

**Key Info:**
- **Latest commit:** Oct 8, 2025 (documentation fixes)
- **Status:** ✅ ACTIVE - Complementary to gtd-core
- **Tools:** 9 tools (4 file operations + 5 team inbox collaboration)
- **Storage:** OneDrive Maildir only (shared team inboxes)
- **Distribution:** .mcpb bundle
- **Best for:** Team collaboration, shared GTD inboxes
- **Use with:** gtd-core (personal) + cloud-storage (team) = complete system

**Clarification:**
- This is NOT deprecated
- Serves a different purpose than gtd-core
- Designed for team workflows, not personal GTD

---

### 3. swoft-portable-apps/apps/swoft-cloud-storage v2.0.0 ✅

**Purpose:** Portable cloud storage library + MCP server

**Key Info:**
- **Latest commit:** Oct 5, 2025 (GTD CAPTURE tool added)
- **Status:** ✅ ACTIVE - Different implementation from gtd-mcp-apps
- **Tools:** 9 tools (same GTD email + file tools)
- **Storage:** OneDrive (generic abstraction layer)
- **Architecture:** Library-first (can embed in Electron apps)
- **Build:** esbuild (bundled, self-contained)
- **Distribution:** OneDrive sync (portable, no installation)
- **Best for:** Electron app integration, portable tool distribution

**Unique Features:**
- Exports library interface (`CloudStorageManager`, `OneDriveProvider`)
- Can be imported as a module in other apps
- Truly portable (bundled with esbuild)
- Team distribution via OneDrive sync

---

## Key Differences

### gtd-mcp-apps/cloud-storage vs swoft-portable-apps/swoft-cloud-storage

| Feature | gtd-mcp-apps/cloud-storage | swoft-portable-apps/swoft-cloud-storage |
|---------|---------------------------|----------------------------------------|
| **Architecture** | MCP server-first | Library-first (MCP server is secondary) |
| **Purpose** | Team collaboration tool | Reusable library + portable tool |
| **Can embed?** | No (standalone MCP only) | Yes (exports library interface) |
| **Build tool** | tsc (TypeScript compiler) | esbuild (bundler) |
| **Distribution** | .mcpb bundle | OneDrive sync (portable) |
| **node_modules** | Required at runtime | Bundled (self-contained) |
| **Team focus** | Shared GTD inboxes | Generic cloud storage |

---

## Architecture Comparison

### gtd-mcp-apps/packages/cloud-storage
```
Server Entry (index.ts)
  ↓
OneDriveServer (server.ts)
  ↓
Models + Services
  ↓
MCP Tools (9 tools)
```

### swoft-portable-apps/apps/swoft-cloud-storage
```
Library Interface (index.ts)
  ↓
CloudStorageManager
  ↓
Providers (OneDriveProvider, BaseProvider)
  ↓
Services
  ↓
MCP Server (mcp-server.ts) - Optional entry point
```

---

## When to Use Each

### Use gtd-core (gtd-mcp-apps/gtd-core)
- ✅ You want personal GTD task management
- ✅ You need 29 GTD tools (inbox, projects, actions, reviews)
- ✅ You prefer local JSON storage (or optional OneDrive)
- ✅ You want AI agents (Synthia assistant)

### Use cloud-storage (gtd-mcp-apps/cloud-storage)
- ✅ You need team collaboration via shared inboxes
- ✅ You want GTD inbox workflows for multiple team members
- ✅ You need file operations on OneDrive
- ✅ You use gtd-core and want to ADD team features

### Use swoft-cloud-storage (swoft-portable-apps)
- ✅ You're building an Electron app that needs cloud storage
- ✅ You want to import CloudStorageManager as a library
- ✅ You need portable distribution via OneDrive sync
- ✅ You want self-contained bundled code (no node_modules)

---

## The v3.0.0 Confusion

**What people thought:** "v3.0.0 deprecated cloud-storage package"

**What actually happened:**
1. gtd-core v3.0.0 added **optional** OneDrive backend support
2. This did NOT deprecate the cloud-storage package
3. cloud-storage serves a different purpose (team collaboration)
4. Both packages are complementary, not competing

**Documentation fixes (2025-10-08):**
- Removed "[DEPRECATED]" from cloud-storage package.json
- Updated README to clarify "complementary products"
- Fixed CLAUDE.md to explain the relationship
- Created this landscape document

---

## Repository Locations

```
/Users/derick/projects/professional/
├── gtd-mcp-apps/
│   ├── packages/gtd-core/               # Personal GTD (v3.0.1)
│   └── packages/cloud-storage/          # Team collaboration (v1.0.0)
│
└── swoft-portable-apps/
    └── apps/swoft-cloud-storage/        # Portable library (v2.0.0)
```

---

## Commit History Evidence

**gtd-mcp-apps/packages/cloud-storage:**
```
f326530 core: Release v3 (Oct 8, 2025)
76c383e Major release v3.0.0: Unified GTD MCP Server (Oct 8, 2025)
```

**swoft-portable-apps/apps/swoft-cloud-storage:**
```
36cdf06 Add GTD CAPTURE tool (Oct 5, 2025)
4b7469d Fix Windows filename compatibility (Oct 5, 2025)
e5e2c74 Add comprehensive README (Oct 5, 2025)
```

Both show recent, active development. Neither is deprecated.

---

## Lesson Learned

**Git commits are the source of truth, not documentation.**

When documentation conflicts with git history:
1. Check actual commits (`git log`)
2. Check actual code changes (`git diff`)
3. Fix documentation to match reality
4. Don't trust old CLAUDE.md files blindly

---

**Questions?** Ask Derick or check git history with `git log --oneline --since="2025-10-01"`.
