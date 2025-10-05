#!/usr/bin/env node

/**
 * Build Portable Cloud Storage
 *
 * Creates a single standalone bundle with all dependencies included
 * No node_modules needed after build - just copy dist/ and run
 */

import { build } from 'esbuild';
import { existsSync, mkdirSync, cpSync } from 'fs';
import { resolve } from 'path';

async function buildPortable() {
  console.log('🔨 Building portable cloud storage bundle...');

  // Ensure dist exists
  if (!existsSync('dist')) {
    mkdirSync('dist');
  }

  try {
    // Build MCP server as single bundle
    await build({
      entryPoints: ['src/mcp-server.ts'],
      bundle: true,
      platform: 'node',
      target: 'node20',
      format: 'esm',
      outfile: 'dist/mcp-server.js',
      external: [], // Bundle everything
      minify: false, // Keep readable for debugging
      sourcemap: true
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
      external: [], // Bundle everything
      minify: false,
      sourcemap: true
    });

    // Copy package.json (for metadata)
    cpSync('package.json', 'dist/package.json');

    // Copy README
    if (existsSync('README.md')) {
      cpSync('README.md', 'dist/README.md');
    }

    console.log('✅ Build complete!');
    console.log('');
    console.log('📦 Portable bundle created:');
    console.log('   dist/mcp-server.js  - MCP server (standalone)');
    console.log('   dist/index.js       - Library exports (for Electron)');
    console.log('');
    console.log('🚀 Deploy to OneDrive:');
    console.log('   pnpm deploy:onedrive');
    console.log('');
    console.log('💡 No node_modules needed - everything is bundled!');

  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

buildPortable();
