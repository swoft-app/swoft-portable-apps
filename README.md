# SWOFT Portable Apps

> **Self-contained, cross-platform tools** - No installation required, just copy and run

## 🏢 Repository Architecture

This repository is part of the **SWOFT 4-Repo Architecture**:

| Repository | Purpose | Distribution |
|-----------|---------|--------------|
| **swoft-ai-platform** | AI Platform Services & Packages | DigitalOcean Cloud |
| **swoft-desktop-apps** | Desktop Applications (Electron) | Installers (.dmg, .exe) |
| **swoft-portable-apps** (this repo) | Portable Tools & Utilities | OneDrive sync, direct copy |
| **swoft-workspace-platform** | RETIRED - Archived | N/A |

### Why Portable Apps?

**Key Characteristics:**
- ✅ **Self-contained** - All dependencies bundled (node_modules included)
- ✅ **Cross-platform** - Works on Mac, Windows, Linux
- ✅ **No build required** - Distributed as pre-built code
- ✅ **OneDrive distribution** - Team gets updates automatically via sync
- ✅ **Instant deployment** - Copy to OneDrive → Team has it immediately

**Different from Desktop Apps:**
- Desktop apps = Electron → Need packaging → Installers (.dmg, .exe)
- Portable apps = Node.js scripts → No packaging → Just copy and run

---

## 📦 Applications

### OneDrive MCP Server

**Purpose:** Access SWOFT team collaboration files from Claude Code/Desktop
**Location:** `apps/onedrive-mcp-server/`
**Distribution:** OneDrive sync
**Size:** ~3MB (self-contained)

**Tools:**
- Browse OneDrive/SWOFT workspace files
- Read team documentation
- Search collaboration workspace

**Deployment:**
```bash
# Build and deploy to OneDrive
cd apps/onedrive-mcp-server
pnpm build
pnpm deploy:onedrive
```

OneDrive syncs to team automatically → Everyone gets update!

---

## 🚀 Development Workflow

### Adding a New Portable App

1. **Create app directory:**
   ```bash
   mkdir -p apps/my-portable-tool/{src,dist}
   cd apps/my-portable-tool
   ```

2. **Create package.json:**
   ```json
   {
     "name": "@swoft-ai/my-portable-tool",
     "version": "1.0.0",
     "type": "module",
     "main": "dist/index.js",
     "scripts": {
       "build": "tsc",
       "deploy:onedrive": "node ../../scripts/deploy-to-onedrive.js"
     }
   }
   ```

3. **Write code in src/:**
   ```bash
   # TypeScript source
   src/index.ts
   src/utils.ts
   ```

4. **Build:**
   ```bash
   pnpm build
   # Creates dist/ with all code bundled
   ```

5. **Deploy to OneDrive:**
   ```bash
   pnpm deploy:onedrive
   # Copies to OneDrive → Team gets it via sync
   ```

---

## 📋 Portable App Requirements

To be considered "portable," an app must:

- ✅ Be self-contained (include all dependencies)
- ✅ Work cross-platform (Mac/Windows/Linux)
- ✅ Require only Node.js runtime (no global packages)
- ✅ Be distributable as a directory (no installer needed)
- ✅ Have clear documentation for setup

**Good candidates:**
- MCP servers
- CLI tools
- Scripts and utilities
- Configuration generators
- Development helpers

**NOT good candidates:**
- Apps needing OS-level access (use Electron)
- Apps with native dependencies (use Desktop Apps)
- Large applications (>50MB)

---

## 🔧 Scripts

### Deployment Script

`scripts/deploy-to-onedrive.js` - Copies built app to OneDrive

```bash
# Deploy specific app
node scripts/deploy-to-onedrive.js apps/onedrive-mcp-server

# Deploy all apps
pnpm deploy:all
```

---

## 📖 Documentation

- **Architecture:** `docs/architecture.md` - How portable apps work
- **Distribution:** `docs/distribution.md` - OneDrive deployment strategy
- **Adding Apps:** `docs/adding-apps.md` - Step-by-step guide

---

## 🎯 Use Cases

### For Team Members (Kevin, etc.)

1. **Automatic updates via OneDrive:**
   - Derick builds → Deploys to OneDrive
   - OneDrive syncs to your machine
   - You get updates automatically

2. **No installation hassle:**
   - Just point Claude Code to OneDrive path
   - No npm install, no builds, just works

### For Derick (Maintainer)

1. **Version control:**
   - Source code in git (this repo)
   - Build and deploy to OneDrive
   - Team gets pre-built apps

2. **Easy distribution:**
   - One build → Everyone gets it
   - No app store, no manual updates

---

## 🔒 Security

- All apps reviewed before deployment
- OneDrive provides team-level access control
- No external network access (local files only)

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Add your portable app in `apps/`
4. Submit pull request

**Standards:**
- TypeScript preferred
- Include README in app directory
- Self-contained (bundle dependencies)
- Cross-platform compatible

---

## 📄 License

This project is proprietary software owned by SWOFT AI.

---

## 💬 Support

- **Email:** support@swoft.ai
- **Issues:** [GitHub Issues](https://github.com/swoft-app/swoft-portable-apps/issues)

---

**🚀 Simple. Portable. Just works.**
