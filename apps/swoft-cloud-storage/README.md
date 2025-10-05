# SWOFT Cloud Storage MCP Server

**Email-based GTD System with Maildir + .eml format**

**Version:** 3.0.0
**Distribution:** Git (clone repository)
**Platforms:** ✅ Windows | ✅ macOS | ✅ Linux

---

## 🎯 What This Is

MCP server for email-based Getting Things Done (GTD) workflows using:
- **Maildir format** - Industry-standard email storage
- **.eml files** - RFC 5322 email messages
- **Email addresses as identity** - `user@swoft.ai`, `user+claude@swoft.ai`
- **OneDrive sync** - Email messages sync across team

**Mental Model:** Like Gmail/Outlook, but files stored in OneDrive with GTD folders.

---

## 🚀 Setup Instructions

### Prerequisites

- Node.js 20+ installed
- Git installed
- OneDrive synced to: `swoft.ai - Documents`

### 1. Clone Repository

```bash
git clone https://github.com/swoft-app/swoft-portable-apps.git
cd swoft-portable-apps/apps/swoft-cloud-storage
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Build

```bash
npm run build
```

### 4. Configure Claude Desktop

#### **Windows**

Edit: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "swoft-cloud-storage": {
      "command": "node",
      "args": [
        "C:\\Users\\<YourUsername>\\projects\\swoft-portable-apps\\apps\\swoft-cloud-storage\\dist\\mcp-server.js"
      ],
      "env": {
        "CLOUD_STORAGE_WORKSPACE": "swoft.ai - Documents"
      }
    }
  }
}
```

**Note:** Replace `<YourUsername>` with your Windows username.

#### **macOS**

Edit: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "swoft-cloud-storage": {
      "command": "node",
      "args": [
        "/Users/<YourUsername>/projects/swoft-portable-apps/apps/swoft-cloud-storage/dist/mcp-server.js"
      ],
      "env": {
        "CLOUD_STORAGE_WORKSPACE": "swoft.ai - Documents"
      }
    }
  }
}
```

**Note:** Replace `<YourUsername>` with your Mac username.

#### **Linux**

Edit: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "swoft-cloud-storage": {
      "command": "node",
      "args": [
        "/home/<YourUsername>/projects/swoft-portable-apps/apps/swoft-cloud-storage/dist/mcp-server.js"
      ],
      "env": {
        "CLOUD_STORAGE_WORKSPACE": "swoft.ai - Documents"
      }
    }
  }
}
```

**Note:** Replace `<YourUsername>` with your Linux username.

### 5. Restart Claude Desktop

Close and reopen Claude Desktop to load the MCP server.

---

## 📬 Email Addresses (Identity)

### Organization Mailboxes
- `inbox@swoft.ai` - General organization inbox
- `team@swoft.ai` - Team-wide communication

### People Mailboxes

**Humans:**
- `derick@swoft.ai` - Derick (CEO/CTO)
- `kevin@swoft.ai` - Kevin Gibaud (Product Lead)

**AI Agents (+ addressing):**
- `derick+claude@swoft.ai` - Derick's Claude assistant
- `kevin+claude@swoft.ai` - Kevin's Claude assistant

---

## 🛠️ Available Tools

### 1. List All Mailboxes

```javascript
gtd_list_inboxes()
// Returns all available email addresses (organization + people)
```

### 2. View Inbox Items

```javascript
gtd_collect_inbox_items('kevin@swoft.ai', limit: 10)
// Returns up to 10 messages from kevin@swoft.ai/new/
```

### 3. Clarify Item (GTD Workflow)

```javascript
gtd_clarify_item('kevin@swoft.ai', 'message.eml', {
  what_is_it: 'Build issue on Windows',
  is_actionable: true,
  outcome: 'next_action'  // Options: next_action, project, waiting_for, reference, someday_maybe, trash
})
```

### 4. Organize to Reference (Archive)

```javascript
gtd_organize_to_reference('kevin@swoft.ai', 'message.eml')
// Moves processed item to .Reference/ folder
```

### 5. General Storage Tools

```javascript
// List files in OneDrive
list_docs({subfolder: 'Documentation'})

// Read file
read_doc({filename: 'Documentation/README.md'})

// Search with glob pattern
search_docs({pattern: '**/*.md'})

// Get provider info
get_provider_info()
```

---

## 📂 Maildir Structure

Each mailbox follows industry-standard Maildir format:

```
email@swoft.ai/
├── new/                    # Inbox - unread messages (GTD: COLLECT)
├── cur/                    # Currently reading (GTD: CLARIFY)
├── tmp/                    # Temporary (system use)
├── .Next-Actions/          # GTD: Ready to execute (DO)
├── .Waiting-For/           # GTD: Delegated/blocked
├── .Projects/              # GTD: Multi-step outcomes
├── .Someday-Maybe/         # GTD: Future ideas
└── .Reference/             # GTD: Completed/archived
```

---

## 📧 Email Message Format

Messages are RFC 5322 .eml files with GTD metadata:

```eml
From: "Kevin Gibaud" <kevin@swoft.ai>
To: "Derick" <derick@swoft.ai>
Subject: Windows Build Issue
Date: Sat, 5 Oct 2025 14:30:00 +0200
Message-ID: <unique-id@swoft.ai>
X-GTD-Project: swoft-ai-platform
X-GTD-Context: windows-build
X-GTD-Priority: high
X-GTD-Status: new
Content-Type: text/plain; charset=utf-8

Message content here...
```

**Benefits:**
- ✅ Drag-and-drop from Outlook/Gmail works
- ✅ Attachment support (base64 MIME)
- ✅ Standard email clients can read them
- ✅ GTD metadata in custom headers

---

## 🔄 GTD Workflow (David Allen)

1. **COLLECT** - Capture items into `new/` folder
2. **CLARIFY** - Process: "What is it?" "Is it actionable?"
3. **ORGANIZE** - Move to appropriate GTD folder
4. **REFLECT** - Weekly review
5. **ENGAGE** - Execute from `.Next-Actions/`

---

## 🛠️ Development

### Build from Source

```bash
npm install
npm run build
```

### Run Tests

```bash
npm test
```

### Distribution Strategy

**❌ NOT via OneDrive** (node_modules is 100MB - crashes sync)
**✅ Via Git clone** (fast, version controlled, portable)

Updates:
```bash
git pull origin main
npm install
npm run build
```

---

## 🔒 Safety Features

- **5MB file size limit** - Prevents memory issues
- **Attachment metadata only** - Content loaded on-demand
- **Pagination** - Default 10 items per request
- **Graceful degradation** - Oversized files show warnings

---

## 📝 OneDrive Paths

**macOS:**
```
~/Library/CloudStorage/OneDrive-DevApps4Biz.com/swoft.ai - Documents/Mailboxes/
```

**Windows:**
```
%USERPROFILE%\OneDrive - DevApps4Biz.com\swoft.ai - Documents\Mailboxes\
```

**Linux:**
```
~/OneDrive/swoft.ai - Documents/Mailboxes/
```

---

## 🐛 Troubleshooting

### MCP Server Not Loading

1. Check Claude Desktop config path is absolute (not relative)
2. Verify `dist/mcp-server.js` exists
3. Check `node_modules/` exists in repo (run `npm install`)
4. Restart Claude Desktop

### "Mailbox not found" Error

- Email addresses are case-sensitive: `kevin@swoft.ai` ✅ `Kevin@swoft.ai` ❌
- Check mailbox exists in OneDrive: `Mailboxes/People/<email>/`

### OneDrive Sync Issues

- **Never copy node_modules to OneDrive** - causes crashes
- Only .eml email files should sync
- Keep MCP server in git repo, not OneDrive

---

## 📖 References

- **GTD Methodology:** David Allen's "Getting Things Done"
- **Maildir Format:** https://en.wikipedia.org/wiki/Maildir
- **RFC 5322:** https://tools.ietf.org/html/rfc5322
- **MCP Protocol:** https://modelcontextprotocol.io

---

**Repository:** https://github.com/swoft-app/swoft-portable-apps
**Maintainer:** SWOFT AI Team
**Version:** 3.0.0 (Email GTD System)
