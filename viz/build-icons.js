#!/usr/bin/env node
/**
 * build-icons.js
 *
 * Icon generation from icon-manifest.json using @gradio/client + sharp.
 * Calls Z-Image-Turbo for generation, then uses sharp for local
 * threshold-based background removal. Saves WebP files to
 * viz/icons/<domain>/<skill-id>.webp.
 *
 * Usage:
 *   cd viz && npm install && node build-icons.js
 *   node build-icons.js --only bushcraft          # Single domain
 *   node build-icons.js --skip-existing           # Resume from where you left off
 *   node build-icons.js --concurrency 1           # Sequential (default)
 *   node build-icons.js --delay 5000              # Delay between requests in ms (default 5000)
 *   node build-icons.js --bg-threshold 30         # Dark-pixel transparency threshold (0-255)
 *   node build-icons.js --no-bg-remove            # Skip background removal
 *   node build-icons.js --dry-run                 # Show what would be generated
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Client } from '@gradio/client';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MANIFEST_PATH = resolve(__dirname, 'public', 'data', 'icon-manifest.json');
const ICONS_DIR = resolve(__dirname, 'public', 'icons');
const LOGS_DIR = resolve(__dirname, 'logs');

// ── CLI args ────────────────────────────────────────────────────────
const args = process.argv.slice(2);

function getFlag(name) {
  return args.includes(name);
}

function getFlagValue(name, defaultVal) {
  const idx = args.indexOf(name);
  if (idx < 0 || idx + 1 >= args.length) return defaultVal;
  const val = parseInt(args[idx + 1], 10);
  return Number.isNaN(val) ? defaultVal : val;
}

const onlyDomain   = getFlag('--only') ? args[args.indexOf('--only') + 1] : null;
const skipExisting = getFlag('--skip-existing');
const concurrency  = getFlagValue('--concurrency', 1);
const delay        = getFlagValue('--delay', 5000);
const bgThreshold  = getFlagValue('--bg-threshold', 30);
const noBgRemove   = getFlag('--no-bg-remove');
const dryRun       = getFlag('--dry-run');

// ── Logging ─────────────────────────────────────────────────────────
mkdirSync(LOGS_DIR, { recursive: true });
const today = new Date().toISOString().slice(0, 10);
const LOG_FILE = resolve(LOGS_DIR, `build-icons-${today}.log`);

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  try { appendFileSync(LOG_FILE, line + '\n'); } catch {}
}

function logError(msg) {
  const line = `[${new Date().toISOString()}] ERROR: ${msg}`;
  console.error(line);
  try { appendFileSync(LOG_FILE, line + '\n'); } catch {}
}

// ── Load manifest ───────────────────────────────────────────────────
const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
const { meta, icons } = manifest;

let queue = icons;
if (onlyDomain) {
  queue = queue.filter(ic => ic.domain === onlyDomain);
  log(`Filtered to domain: ${onlyDomain} (${queue.length} icons)`);
}
if (skipExisting) {
  queue = queue.filter(ic => {
    if (ic.status === 'done') return false;
    return !existsSync(resolve(__dirname, ic.path));
  });
  log(`After skip-existing filter: ${queue.length} icons`);
}

log(`Generating ${queue.length} icons (concurrency=${concurrency}, delay=${delay}ms, bgThreshold=${bgThreshold})`);
log(`Model: ${meta.model}, Resolution: ${meta.resolution}, Steps: ${meta.steps}`);

if (dryRun) {
  log('DRY RUN - would generate:');
  for (const entry of queue) {
    log(`  ${entry.domain}/${entry.skillId} -> ${entry.path}`);
  }
  log(`Total: ${queue.length} icons`);
  process.exit(0);
}

// ── Graceful shutdown ───────────────────────────────────────────────
let shutdownRequested = false;

function saveManifest() {
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
}

function handleShutdown(signal) {
  if (shutdownRequested) {
    log(`Second ${signal} received, forcing exit`);
    process.exit(1);
  }
  shutdownRequested = true;
  log(`${signal} received - finishing current icon, then saving progress and exiting...`);
}

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

// ── Background removal via sharp ────────────────────────────────────
async function removeBackground(inputBuffer, threshold) {
  const { data, info } = await sharp(inputBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const pixels = new Uint8Array(data);

  for (let i = 0; i < pixels.length; i += channels) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    // Perceived brightness (ITU-R BT.601)
    const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
    if (brightness < threshold) {
      pixels[i + 3] = 0; // set alpha to transparent
    }
  }

  return sharp(Buffer.from(pixels), { raw: { width, height, channels } })
    .webp({ quality: 90 })
    .toBuffer();
}

// ── Gradio client ───────────────────────────────────────────────────
let zImageClient = null;

async function initClient() {
  log('Connecting to Z-Image-Turbo...');
  zImageClient = await Client.connect('mcp-tools/Z-Image-Turbo');
  log('Client connected.');
}

async function generateIcon(entry) {
  const { skillId, domain, prompt, seed, path: relPath } = entry;
  const outPath = resolve(__dirname, relPath);
  const manifestEntry = icons.find(ic => ic.skillId === skillId && ic.domain === domain);

  mkdirSync(dirname(outPath), { recursive: true });

  try {
    // Step 1: Generate image via Z-Image-Turbo
    const genResult = await zImageClient.predict('/generate', {
      prompt,
      resolution: meta.resolution,
      steps: meta.steps,
      shift: meta.shift,
      seed,
      random_seed: false,
    });

    const imageData = genResult.data[0];
    if (!imageData || (!imageData.url && !imageData.path)) {
      throw new Error('No image data returned from Z-Image');
    }

    // Step 2: Download the generated image
    const imageUrl = imageData.url || imageData.path;
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error(`Download failed: ${response.status}`);
    const rawBuffer = Buffer.from(await response.arrayBuffer());

    // Step 3: Background removal (or pass-through)
    let finalBuffer;
    if (noBgRemove) {
      finalBuffer = await sharp(rawBuffer).webp({ quality: 90 }).toBuffer();
    } else {
      finalBuffer = await removeBackground(rawBuffer, bgThreshold);
    }

    // Step 4: Save
    writeFileSync(outPath, finalBuffer);

    // Step 5: Update manifest status
    if (manifestEntry) manifestEntry.status = 'done';
    saveManifest();

    log(`OK: ${domain}/${skillId} (seed=${seed}, ${(finalBuffer.length / 1024).toFixed(1)}KB)`);
    return { skillId, status: 'done' };
  } catch (err) {
    if (manifestEntry) {
      manifestEntry.status = 'error';
      manifestEntry.lastError = err.message;
    }
    saveManifest();

    logError(`${domain}/${skillId}: ${err.message}`);
    return { skillId, status: 'error', error: err.message };
  }
}

// ── Sleep helper ────────────────────────────────────────────────────
function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ── Batch runner with concurrency limit ─────────────────────────────
async function runBatch(items, fn, limit) {
  const results = [];
  let idx = 0;

  async function worker() {
    while (idx < items.length) {
      if (shutdownRequested) break;
      const i = idx++;
      results[i] = await fn(items[i]);
      if (delay > 0 && idx < items.length && !shutdownRequested) {
        await sleep(delay);
      }
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

// ── Main ────────────────────────────────────────────────────────────
async function main() {
  if (queue.length === 0) {
    log('No icons to generate.');
    return;
  }

  await initClient();

  const startTime = Date.now();
  const results = await runBatch(queue, generateIcon, concurrency);

  const done = results.filter(r => r && r.status === 'done').length;
  const failed = results.filter(r => r && r.status === 'error').length;
  const skipped = results.length - done - failed;
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  log(`Complete: ${done} succeeded, ${failed} failed, ${skipped} skipped in ${elapsed}s`);

  if (shutdownRequested) {
    log('Shutdown requested - progress has been saved. Rerun with --skip-existing to resume.');
  }
}

main().catch(err => {
  logError(`Fatal: ${err.message}`);
  saveManifest();
  process.exit(1);
});
