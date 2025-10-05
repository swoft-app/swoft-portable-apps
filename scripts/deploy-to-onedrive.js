#!/usr/bin/env node

/**
 * Deploy portable app to OneDrive for team distribution
 *
 * Usage: node scripts/deploy-to-onedrive.js <app-name>
 * Example: node scripts/deploy-to-onedrive.js onedrive-mcp-server
 */

import { existsSync, cpSync, readFileSync } from 'fs';
import { join, resolve } from 'path';
import { homedir, platform } from 'os';

function getOneDrivePath() {
  if (platform() === 'win32') {
    return join(process.env.USERPROFILE, 'OneDrive - DevApps4Biz.com');
  } else {
    return join(homedir(), 'Library/CloudStorage/OneDrive-DevApps4Biz.com');
  }
}

function deployApp(appName) {
  const appPath = resolve(process.cwd(), 'apps', appName);
  const distPath = join(appPath, 'dist');
  const packageJsonPath = join(appPath, 'package.json');

  // Validate app exists
  if (!existsSync(appPath)) {
    console.error(`❌ App not found: ${appName}`);
    console.error(`   Expected at: ${appPath}`);
    process.exit(1);
  }

  // Validate dist exists
  if (!existsSync(distPath)) {
    console.error(`❌ Dist directory not found for ${appName}`);
    console.error(`   Run 'pnpm build' first`);
    process.exit(1);
  }

  // Read package.json for app metadata
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
  const appVersion = packageJson.version || '1.0.0';

  // Determine OneDrive deployment path
  const oneDriveBase = getOneDrivePath();
  const deployTarget = join(oneDriveBase, 'swoft.ai - Documents', 'Tools', appName);

  console.log(`📦 Deploying ${appName} v${appVersion}`);
  console.log(`   Source: ${distPath}`);
  console.log(`   Target: ${deployTarget}`);

  // Check OneDrive is accessible
  if (!existsSync(oneDriveBase)) {
    console.error(`❌ OneDrive not found at: ${oneDriveBase}`);
    console.error(`   Ensure OneDrive is syncing`);
    process.exit(1);
  }

  try {
    // Copy dist directory to OneDrive
    cpSync(distPath, join(deployTarget, 'dist'), {
      recursive: true,
      force: true
    });

    // Copy package.json
    cpSync(packageJsonPath, join(deployTarget, 'package.json'), {
      force: true
    });

    // Copy README if exists
    const readmePath = join(appPath, 'README.md');
    if (existsSync(readmePath)) {
      cpSync(readmePath, join(deployTarget, 'README.md'), {
        force: true
      });
    }

    // Copy .env.example if exists
    const envExamplePath = join(appPath, '.env.example');
    if (existsSync(envExamplePath)) {
      cpSync(envExamplePath, join(deployTarget, '.env.example'), {
        force: true
      });
    }

    console.log(`✅ Deployed successfully!`);
    console.log(`   OneDrive will sync to team automatically`);
    console.log(`   Location: ${deployTarget}`);

  } catch (error) {
    console.error(`❌ Deployment failed:`, error.message);
    process.exit(1);
  }
}

// Main execution
const appName = process.argv[2];

if (!appName) {
  console.error('Usage: node scripts/deploy-to-onedrive.js <app-name>');
  console.error('Example: node scripts/deploy-to-onedrive.js onedrive-mcp-server');
  process.exit(1);
}

deployApp(appName);
