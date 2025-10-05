# SWOFT Portable Apps - Context for AI Agents

> **Portable, self-contained tools** distributed via OneDrive - No installation required

## 🏢 Repository Purpose

This repository contains **portable applications** that:
- ✅ Are self-contained (bundled dependencies)
- ✅ Work cross-platform (Mac/Windows/Linux)
- ✅ Require no installation (just copy and run)
- ✅ Distribute via OneDrive sync (automatic team updates)

## 🎯 Repository Architecture

Part of the **SWOFT 4-Repo Architecture**:

| Repository | Purpose | Distribution |
|-----------|---------|--------------|
| **swoft-ai-platform** | Cloud services + MCP servers | DigitalOcean |
| **swoft-desktop-apps** | Electron applications | Installers |
| **swoft-portable-apps** (this repo) | Portable tools | OneDrive sync |
| **swoft-workspace-platform** | RETIRED | Archived |

## 📁 Structure

```
swoft-portable-apps/
├── apps/
│   └── onedrive-mcp-server/     # OneDrive collaboration MCP
│       ├── src/                  # TypeScript source
│       ├── dist/                 # Built output (git-ignored)
│       ├── package.json
│       └── README.md
├── scripts/
│   └── deploy-to-onedrive.js    # Deployment automation
├── docs/
├── package.json                  # Workspace root
└── pnpm-workspace.yaml
