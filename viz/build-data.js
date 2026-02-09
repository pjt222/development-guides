#!/usr/bin/env node
/**
 * build-data.js
 *
 * Parses skills/_registry.yml and each SKILL.md to produce
 * viz/data/skills.json with nodes, links, domains, and meta.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILLS_DIR = resolve(__dirname, '..', 'skills');
const REGISTRY_PATH = resolve(SKILLS_DIR, '_registry.yml');
const OUTPUT_PATH = resolve(__dirname, 'data', 'skills.json');

// ── Parse registry ──────────────────────────────────────────────
const registry = yaml.load(readFileSync(REGISTRY_PATH, 'utf8'));
const skillMap = new Map();          // id -> node object
const validIds = new Set();

for (const [domainName, domainObj] of Object.entries(registry.domains)) {
  for (const skill of domainObj.skills) {
    validIds.add(skill.id);
    skillMap.set(skill.id, {
      id: skill.id,
      domain: domainName,
      complexity: skill.complexity,
      language: skill.language,
      registryDescription: skill.description,
      path: skill.path,
    });
  }
}

// ── Parse each SKILL.md ─────────────────────────────────────────
const nodes = [];
const links = [];

for (const [id, meta] of skillMap) {
  const skillPath = resolve(SKILLS_DIR, meta.path);
  if (!existsSync(skillPath)) {
    console.warn(`WARN: ${meta.path} not found, skipping`);
    continue;
  }

  const raw = readFileSync(skillPath, 'utf8').replace(/\r\n/g, '\n');

  // ── Extract display title (first # heading after frontmatter) ──
  let title = id;
  const titleMatch = raw.match(/^---[\s\S]*?---\s*\n#\s+(.+)/m);
  if (titleMatch) {
    title = titleMatch[1].trim();
  }

  // ── Extract tags from frontmatter ──
  let tags = [];
  const fmMatch = raw.match(/^---\n([\s\S]*?)\n---/);
  if (fmMatch) {
    try {
      const fm = yaml.load(fmMatch[1]);
      if (fm?.metadata?.tags) {
        tags = fm.metadata.tags.split(',').map(t => t.trim()).filter(Boolean);
      }
    } catch { /* skip bad yaml */ }
  }

  // ── Extract Related Skills section ──
  // Must handle fenced code blocks: ignore ## headings inside them.
  // Strategy: walk line by line, track code fence state, find the
  // LAST valid "## Related Skills" heading outside a code fence.
  const lines = raw.split('\n');
  let inCodeFence = false;
  let lastRelatedIdx = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^```/.test(line)) {
      inCodeFence = !inCodeFence;
      continue;
    }
    if (!inCodeFence && /^##\s+Related\s+Skills/i.test(line)) {
      lastRelatedIdx = i;
    }
  }

  const relatedIds = [];
  if (lastRelatedIdx >= 0) {
    // Gather lines after the heading until the next ## heading or EOF
    for (let i = lastRelatedIdx + 1; i < lines.length; i++) {
      const line = lines[i];
      if (/^##\s/.test(line)) break;  // next section
      // Match `skill-name` at start of bullet
      const m = line.match(/^-\s+`([a-z0-9-]+)`/);
      if (m && validIds.has(m[1]) && m[1] !== id) {
        relatedIds.push(m[1]);
      }
    }
  }

  nodes.push({
    id,
    title,
    domain: meta.domain,
    complexity: meta.complexity,
    language: meta.language,
    description: meta.registryDescription,
    tags,
    related: relatedIds,
    path: meta.path,
  });

  for (const targetId of relatedIds) {
    links.push({ source: id, target: targetId });
  }
}

// ── Build domain summary ────────────────────────────────────────
const domains = {};
for (const [domainName, domainObj] of Object.entries(registry.domains)) {
  domains[domainName] = {
    description: domainObj.description,
    count: domainObj.skills.length,
  };
}

// ── Output ──────────────────────────────────────────────────────
const output = {
  meta: {
    generated: new Date().toISOString(),
    totalNodes: nodes.length,
    totalLinks: links.length,
    totalDomains: Object.keys(domains).length,
  },
  domains,
  nodes,
  links,
};

writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
console.log(`Generated ${OUTPUT_PATH}`);
console.log(`  Nodes: ${nodes.length}`);
console.log(`  Links: ${links.length}`);
console.log(`  Domains: ${Object.keys(domains).length}`);
