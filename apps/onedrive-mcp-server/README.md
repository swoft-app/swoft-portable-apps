# OneDrive MCP Server - Portable Edition

**Version:** 1.0.1
**Distribution:** OneDrive Sync (Auto-updates!)
**Platforms:** Mac, Windows, Linux

---

## 🎯 What This Is

Portable OneDrive MCP server for accessing SWOFT team collaboration files directly from Claude Code.

**Mental Model:** Browse Microsoft Teams workspace from your IDE (like VS Code Files tab for Teams channels).

---

## 🛠️ Available Tools

### 1. List Team Documents
```javascript
mcp__onedrive-collaboration__list_swoft_docs()
mcp__onedrive-collaboration__list_swoft_docs({subfolder: "Documentation"})
```

### 2. Read Team Files
```javascript
mcp__onedrive-collaboration__read_swoft_doc({
  filename: "Documentation/README.md"
})
```

### 3. Search Workspace
```javascript
mcp__onedrive-collaboration__search_swoft_docs({
  pattern: "**/*.md"
})
```

---

## 🔧 Development

### Build from Source

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Deploy to OneDrive
pnpm deploy:onedrive
```

### Local Testing

```bash
# Debug mode
node dist/index.js --debug

# MCP mode (test connection)
node dist/index.js --stdio
```

---

## 📦 Deployment

OneDrive deployment automatically syncs to team:

```bash
# Deploy to OneDrive
pnpm deploy:onedrive

# OneDrive path:
# Mac: ~/Library/CloudStorage/OneDrive-DevApps4Biz.com/swoft.ai - Documents/Tools/onedrive-mcp/
# Windows: %USERPROFILE%\OneDrive - DevApps4Biz.com\swoft.ai - Documents\Tools\onedrive-mcp\
```

Team members get updates automatically via OneDrive sync!

---

## 📝 Source Code

- `src/index.ts` - Entry point
- `src/OneDriveSwoftMcpServer.ts` - MCP server implementation
- `src/machineContext.ts` - Platform utilities

---

## 🎯 Use Cases

- ✅ Access team collaboration files from IDE
- ✅ Read runbooks, guides, SOPs
- ✅ Browse AI-Workspace drafts
- ✅ Check meeting notes and action items
- ✅ Team coordination via shared OneDrive

---

**Distribution:** OneDrive sync (automatic updates)
**Maintainer:** Derick's Claude Code
