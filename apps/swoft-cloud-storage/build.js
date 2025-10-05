#!/usr/bin/env node

/**
 * Build Portable Cloud Storage (Cross-Platform)
 *
 * Creates a standalone bundle that works on:
 * - Windows (tested)
 * - macOS (tested)
 * - Linux (tested)
 *
 * Defensive programming: Fail fast with clear error messages
 */

import { build } from 'esbuild';
import { existsSync, mkdirSync, cpSync, rmSync } from 'fs';
import { resolve, sep } from 'path';
import { platform } from 'os';

async function buildPortable() {
  console.log('🔨 Building portable cloud storage bundle...');
  console.log(`📍 Platform: ${platform()} (${process.arch})`);
  console.log(`📍 Node: ${process.version}`);

  // Validation: Check required dependencies exist
  if (!existsSync('src/mcp-server.ts')) {
    console.error('❌ FATAL: src/mcp-server.ts not found');
    console.error('   Are you running this from the correct directory?');
    process.exit(1);
  }

  if (!existsSync('node_modules')) {
    console.error('❌ FATAL: node_modules not found');
    console.error('   Run: npm install');
    process.exit(1);
  }

  // Clean dist folder (fresh build)
  if (existsSync('dist')) {
    console.log('🧹 Cleaning dist/ folder...');
    try {
      rmSync('dist', { recursive: true, force: true });
    } catch (err) {
      console.error('❌ FATAL: Could not clean dist/ folder:', err.message);
      process.exit(1);
    }
  }

  // Create fresh dist folder
  try {
    mkdirSync('dist', { recursive: true });
  } catch (err) {
    console.error('❌ FATAL: Could not create dist/ folder:', err.message);
    process.exit(1);
  }

  try {
    // Node.js built-in modules (don't bundle these)
    const nodeBuiltins = [
      'fs', 'path', 'stream', 'util', 'events', 'buffer', 'crypto',
      'os', 'url', 'http', 'https', 'zlib', 'net', 'tls', 'dns',
      'child_process', 'readline', 'string_decoder', 'querystring'
    ];

    // External packages (use dynamic requires, can't be bundled)
    const externalPackages = [
      'mailparser',
      'nodemailer',
      ...nodeBuiltins
    ];

    // Build MCP server as single bundle
    await build({
      entryPoints: ['src/mcp-server.ts'],
      bundle: true,
      platform: 'node',
      target: 'node20',
      format: 'esm',
      outfile: 'dist/mcp-server.js',
      external: externalPackages, // Exclude packages that use dynamic requires
      minify: false, // Keep readable for debugging
      sourcemap: true,
      banner: {
        js: `import { createRequire } from 'module';const require = createRequire(import.meta.url);`
      }
      // Note: shebang already in source file
    });

    // Build library exports (for Electron integration)
    await build({
      entryPoints: ['src/index.ts'],
      bundle: true,
      platform: 'node',
      target: 'node20',
      format: 'esm',
      outfile: 'dist/index.js',
      external: nodeBuiltins, // Exclude Node.js built-ins
      minify: false,
      sourcemap: true
    });

    // Copy package.json (for metadata)
    console.log('📦 Copying package.json...');
    try {
      cpSync('package.json', 'dist/package.json');
    } catch (err) {
      console.error('❌ FATAL: Could not copy package.json:', err.message);
      process.exit(1);
    }

    // NOTE: node_modules NOT copied to dist/
    // The MCP server expects to run from the repo with node_modules installed
    // This prevents massive OneDrive syncs (node_modules can be 100MB+)
    console.log('📦 Skipping node_modules copy (expects repo installation)');
    console.log('   ℹ️  MCP server will use ../node_modules from repo');

    // Copy README
    if (existsSync('README.md')) {
      cpSync('README.md', 'dist/README.md');
    }

    // Validation: Verify build artifacts exist
    console.log('🔍 Validating build...');
    const requiredFiles = [
      'dist/mcp-server.js',
      'dist/index.js',
      'dist/package.json',
    ];

    // Validate repo has required dependencies
    const requiredDeps = [
      'node_modules/mailparser',
      'node_modules/nodemailer',
    ];

    for (const file of requiredFiles) {
      if (!existsSync(file)) {
        console.error(`❌ FATAL: Build validation failed - missing: ${file}`);
        process.exit(1);
      }
    }

    for (const dep of requiredDeps) {
      if (!existsSync(dep)) {
        console.error(`❌ FATAL: Missing dependency: ${dep}`);
        console.error('   Run: npm install');
        process.exit(1);
      }
    }

    console.log('✅ Build complete and validated!');
    console.log('');
    console.log('📦 Build output:');
    console.log('   dist/mcp-server.js      - MCP server (bundled)');
    console.log('   dist/index.js           - Library exports');
    console.log('   node_modules/           - Dependencies (not copied)');
    console.log('');
    console.log('🎯 Deployment Strategy:');
    console.log('   ✅ Run from REPO (git clone)');
    console.log('   ❌ NOT from OneDrive (avoids massive sync)');
    console.log('');
    console.log('📝 Setup Instructions:');
    console.log('   1. git clone https://github.com/swoft-app/swoft-portable-apps');
    console.log('   2. cd swoft-portable-apps/apps/swoft-cloud-storage');
    console.log('   3. npm install');
    console.log('   4. npm run build');
    console.log('   5. Point Claude Desktop to: <repo-path>/dist/mcp-server.js');
    console.log('');
    console.log('💡 Why? node_modules is 100MB+ - too big for OneDrive sync!');

  } catch (error) {
    console.error('❌ FATAL: Build failed:', error.message);
    if (error.stack) {
      console.error('');
      console.error('Stack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

buildPortable();
