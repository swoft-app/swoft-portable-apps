# SWOFT Cloud Storage - Team Setup Guide

**Quick reference for Derick, Kevin, and Synthia**

## 🎯 What Changed?

**Version 3.0.0** now **auto-detects all OneDrive accounts** on your system!

**Before:** Hardcoded to `OneDrive-DevApps4Biz.com`
**After:** Detects all accounts, you choose which one

---

## ⚡ Quick Setup

### 1. Clone Repository (One Time)

```bash
git clone https://github.com/swoft-app/swoft-portable-apps.git
cd swoft-portable-apps/apps/swoft-cloud-storage
npm install
npm run build
```

### 2. Configure Claude Desktop

**Location:**
- **Mac:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

**Choose your configuration below** ⬇️

---

## 👤 Derick's Configuration

### Business OneDrive (Default)

```json
{
  "mcpServers": {
    "swoft-cloud-storage": {
      "command": "/Users/derick/.nvm/versions/node/v22.15.1/bin/node",
      "args": [
        "/Users/derick/projects/professional/swoft-portable-apps/apps/swoft-cloud-storage/dist/mcp-server.js",
        "--stdio"
      ],
      "env": {
        "ONEDRIVE_ACCOUNT": "DevApps4Biz.com",
        "CLOUD_STORAGE_WORKSPACE": "SWOFT/swoft.ai - Documents",
        "NODE_ENV": "development"
      }
    }
  }
}
```

### Personal OneDrive (Dual Instance)

Add this **in addition** to keep both:

```json
{
  "mcpServers": {
    "swoft-cloud-storage": { /* business config above */ },
    "personal-cloud-storage": {
      "command": "/Users/derick/.nvm/versions/node/v22.15.1/bin/node",
      "args": [
        "/Users/derick/projects/professional/swoft-portable-apps/apps/swoft-cloud-storage/dist/mcp-server.js",
        "--stdio"
      ],
      "env": {
        "ONEDRIVE_ACCOUNT": "Personal",
        "CLOUD_STORAGE_WORKSPACE": "Docs",
        "NODE_ENV": "development"
      }
    }
  }
}
```

**Result:** Access both business SWOFT and personal Docs!

---

## 👤 Kevin's Configuration

### Auto-Detect Business Account

```json
{
  "mcpServers": {
    "swoft-cloud-storage": {
      "command": "node",
      "args": [
        "C:\\Users\\Kevin\\projects\\swoft-portable-apps\\apps\\swoft-cloud-storage\\dist\\mcp-server.js",
        "--stdio"
      ],
      "env": {
        "ONEDRIVE_ACCOUNT_TYPE": "business",
        "CLOUD_STORAGE_WORKSPACE": "SWOFT",
        "NODE_ENV": "development"
      }
    }
  }
}
```

**Notes:**
- Replace `C:\\Users\\Kevin\\...` with your actual path
- Uses first **business** OneDrive account found
- No need to specify exact account name

---

## 🤖 Synthia (AI Agent) Configuration

### Shared OneDrive Access

```json
{
  "mcpServers": {
    "swoft-cloud-storage": {
      "command": "node",
      "args": [
        "/path/to/swoft-portable-apps/apps/swoft-cloud-storage/dist/mcp-server.js",
        "--stdio"
      ],
      "env": {
        "ONEDRIVE_ACCOUNT_TYPE": "shared",
        "CLOUD_STORAGE_WORKSPACE": "SWOFT",
        "NODE_ENV": "production"
      }
    }
  }
}
```

---

## 🔍 Diagnostic Commands

### Check Which Accounts Are Detected

In Claude Desktop/Code, run:

```
list_onedrive_accounts()
```

**Example Output:**

```json
{
  "detected_accounts": [
    {
      "name": "DevApps4Biz.com",
      "path": "/Users/derick/Library/CloudStorage/OneDrive-DevApps4Biz.com",
      "type": "business"
    },
    {
      "name": "Personal",
      "path": "/Users/derick/Library/CloudStorage/OneDrive-Personal",
      "type": "personal"
    }
  ],
  "active_account": {
    "path": "/Users/derick/Library/CloudStorage/OneDrive-DevApps4Biz.com",
    "workspace": "SWOFT/swoft.ai - Documents"
  },
  "configuration": {
    "ONEDRIVE_ACCOUNT": "DevApps4Biz.com",
    "CLOUD_STORAGE_WORKSPACE": "SWOFT/swoft.ai - Documents"
  }
}
```

---

## 🎛️ Configuration Priority

The MCP server picks your OneDrive account in this order:

1. **`ONEDRIVE_PATH`** - Absolute path (highest priority)
   ```json
   "ONEDRIVE_PATH": "/Users/derick/Library/CloudStorage/OneDrive-Personal"
   ```

2. **`ONEDRIVE_ACCOUNT`** - Specific account name
   ```json
   "ONEDRIVE_ACCOUNT": "DevApps4Biz.com"
   ```

3. **`ONEDRIVE_ACCOUNT_TYPE`** - Account type filter
   ```json
   "ONEDRIVE_ACCOUNT_TYPE": "business"
   ```

4. **First Available** - Uses first OneDrive account found (fallback)

---

## 🛠️ Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `ONEDRIVE_ACCOUNT` | No | Specific account name | `DevApps4Biz.com`, `Personal` |
| `ONEDRIVE_ACCOUNT_TYPE` | No | Account type filter | `business`, `personal`, `shared` |
| `ONEDRIVE_PATH` | No | Absolute path override | `/Users/derick/Library/CloudStorage/OneDrive-Personal` |
| `CLOUD_STORAGE_WORKSPACE` | **Yes** | Workspace folder | `SWOFT`, `Docs`, `SWOFT/swoft.ai - Documents` |

---

## 🚨 Common Issues

### "No OneDrive accounts found"

**Fix:** Ensure OneDrive is installed and syncing:
- **Mac:** Check `~/Library/CloudStorage/` has `OneDrive-*` folders
- **Windows:** Check `%USERPROFILE%\` has `OneDrive*` folders

### Wrong account being used

**Fix:** Add `ONEDRIVE_ACCOUNT` to specify exact account:
```json
"env": {
  "ONEDRIVE_ACCOUNT": "Personal"
}
```

### Multiple accounts, want to use both

**Fix:** Create **two MCP instances** with different names:
```json
{
  "mcpServers": {
    "swoft-cloud-storage": { /* business config */ },
    "personal-cloud-storage": { /* personal config */ }
  }
}
```

---

## 📦 Updates

To get the latest version:

```bash
cd swoft-portable-apps/apps/swoft-cloud-storage
git pull origin main
npm install
npm run build
```

Then restart Claude Desktop.

---

## 📞 Support

**Questions?** Ask in:
- OneDrive: `SWOFT/Team/` channel
- GitHub: https://github.com/swoft-app/swoft-portable-apps/issues

**Team:**
- Derick (CEO/CTO) - derick@swoft.ai
- Kevin Gibaud (Product Lead) - kevin@swoft.ai
- Synthia (AI Agent) - synthia+derick@swoft.ai

---

**Version:** 3.0.0
**Last Updated:** 2025-10-08
**Maintained by:** SWOFT AI Team
