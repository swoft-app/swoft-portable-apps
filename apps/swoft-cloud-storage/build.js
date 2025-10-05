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

    // Copy node_modules (external packages need this)
    // Skip .bin directories (contain symlinks that cause cross-platform issues)
    console.log('📦 Copying node_modules (external dependencies)...');
    console.log('   ⏳ This may take a minute...');
    try {
      cpSync('node_modules', 'dist/node_modules', {
        recursive: true,
        dereference: false, // Don't follow symlinks
        errorOnExist: false,
        force: true,
        filter: (src) => {
          // Skip .bin directories (symlinks cause cross-platform issues)
          const normalizedPath = src.split(sep).join('/');
          if (normalizedPath.includes('/node_modules/.bin')) {
            return false;
          }
          return true;
        }
      });
      console.log('   ✅ node_modules copied');
    } catch (err) {
      console.error('❌ FATAL: Could not copy node_modules:', err.message);
      console.error('   This is required for mailparser/nodemailer dependencies');
      process.exit(1);
    }

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
      'dist/node_modules/mailparser',
      'dist/node_modules/nodemailer',
    ];

    for (const file of requiredFiles) {
      if (!existsSync(file)) {
        console.error(`❌ FATAL: Build validation failed - missing: ${file}`);
        process.exit(1);
      }
    }

    console.log('✅ Build complete and validated!');
    console.log('');
    console.log('📦 Portable bundle created:');
    console.log('   dist/mcp-server.js      - MCP server (bundled)');
    console.log('   dist/index.js           - Library exports (for Electron)');
    console.log('   dist/node_modules/      - External dependencies');
    console.log('');
    console.log('🎯 Cross-platform ready:');
    console.log('   ✅ Windows (copy dist/ folder)');
    console.log('   ✅ macOS (copy dist/ folder)');
    console.log('   ✅ Linux (copy dist/ folder)');
    console.log('');
    console.log('🚀 Deploy to OneDrive:');
    console.log('   npm run deploy:onedrive');
    console.log('');
    console.log('💡 dist/ folder is fully portable - just copy and run!');

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
