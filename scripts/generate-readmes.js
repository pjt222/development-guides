#!/usr/bin/env node
/**
 * generate-readmes.js
 *
 * Reads skills/_registry.yml, agents/_registry.yml, teams/_registry.yml,
 * and guides/_registry.yml to auto-generate dynamic sections in README.md,
 * skills/README.md, agents/README.md, CLAUDE.md, guides/README.md,
 * viz/README.md, and teams/README.md.
 *
 * Usage:
 *   node scripts/generate-readmes.js          # update files in-place
 *   node scripts/generate-readmes.js --check  # dry-run, exit 1 if stale
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const CHECK_MODE = process.argv.includes('--check');

// ── Load registries ──────────────────────────────────────────────
const skillsRegistry = yaml.load(
  readFileSync(resolve(ROOT, 'skills/_registry.yml'), 'utf8')
);
const agentsRegistry = yaml.load(
  readFileSync(resolve(ROOT, 'agents/_registry.yml'), 'utf8')
);
const teamsRegistryPath = resolve(ROOT, 'teams/_registry.yml');
const teamsRegistry = existsSync(teamsRegistryPath)
  ? yaml.load(readFileSync(teamsRegistryPath, 'utf8'))
  : { total_teams: 0, teams: [] };
const guidesRegistryPath = resolve(ROOT, 'guides/_registry.yml');
const guidesRegistry = existsSync(guidesRegistryPath)
  ? yaml.load(readFileSync(guidesRegistryPath, 'utf8'))
  : { total_guides: 0, categories: {}, guides: [] };

const domains = skillsRegistry.domains;
const agents = agentsRegistry.agents;
const defaultSkills = agentsRegistry.default_skills || [];
const teams = teamsRegistry.teams || [];
const guides = guidesRegistry.guides || [];
const guideCategories = guidesRegistry.categories || {};
const totalSkills = skillsRegistry.total_skills;
const totalAgents = agentsRegistry.total_agents;
const totalTeams = teamsRegistry.total_teams || 0;
const totalGuides = guidesRegistry.total_guides || 0;
const totalDomains = Object.keys(domains).length;

// ── Helpers ──────────────────────────────────────────────────────

function domainDisplayName(domainId) {
  return domainId
    .split('-')
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');
}

function agentDisplayName(agentId) {
  return agentId;
}

function teamDisplayName(teamId) {
  return teamId;
}

/**
 * Replace content between AUTO markers in a file.
 * Returns true if the file changed.
 */
function replaceSection(content, sectionName, newInner) {
  const startTag = `<!-- AUTO:START:${sectionName} -->`;
  const endTag = `<!-- AUTO:END:${sectionName} -->`;
  const startIdx = content.indexOf(startTag);
  const endIdx = content.indexOf(endTag);
  if (startIdx === -1 || endIdx === -1) {
    console.warn(`WARN: markers for "${sectionName}" not found`);
    return content;
  }
  const before = content.slice(0, startIdx + startTag.length);
  const after = content.slice(endIdx);
  return `${before}\n${newInner}\n${after}`;
}

/**
 * Process a file: apply all section replacements, write if changed.
 * Returns true if the file content differs from disk.
 */
function processFile(filePath, sections) {
  const original = readFileSync(filePath, 'utf8');
  let content = original;
  for (const [name, generator] of Object.entries(sections)) {
    content = replaceSection(content, name, generator());
  }
  const changed = content !== original;
  if (changed && !CHECK_MODE) {
    writeFileSync(filePath, content);
  }
  return changed;
}

/**
 * Write a fully-generated file (no markers). Returns true if changed.
 */
function writeGeneratedFile(filePath, content) {
  const original = existsSync(filePath) ? readFileSync(filePath, 'utf8') : '';
  const changed = content !== original;
  if (changed && !CHECK_MODE) {
    writeFileSync(filePath, content);
  }
  return changed;
}

// ── Section generators ───────────────────────────────────────────

function generateStats() {
  const lines = [
    `- **${totalSkills} skills** across ${totalDomains} domains — structured, executable procedures`,
    `- **${totalAgents} agents** — specialized Claude Code personas covering development, review, compliance, and more`,
    `- **${totalTeams} teams** — predefined multi-agent compositions for complex workflows`,
    `- **${totalGuides} guides** — human-readable workflow, infrastructure, and reference documentation`,
    `- **Interactive visualization** — force-graph explorer with ${totalSkills} R-generated skill icons and 9 color themes`,
  ];
  return lines.join('\n');
}

function generateSkillsIntro(linkPrefix) {
  return `The **[Skills Library](${linkPrefix})** provides ${totalSkills} task-level skills following the [Agent Skills open standard](https://agentskills.io). Each skill is a \`SKILL.md\` with YAML frontmatter and standardized sections: When to Use, Inputs, Procedure (with expected outcomes and failure recovery), Validation, Common Pitfalls, and Related Skills.`;
}

function generateSkillsIntroStandalone() {
  return `A collection of ${totalSkills} task-level skills following the [Agent Skills open standard](https://agentskills.io) (\`SKILL.md\` format). These skills provide structured, executable procedures that agentic systems (Claude Code, Codex, Cursor, Gemini CLI, etc.) can consume to perform specific development tasks.`;
}

function generateSkillsTable(linkPrefix) {
  const rows = [];
  rows.push('| Domain | Skills | Description |');
  rows.push('|--------|--------|-------------|');
  for (const [domainId, domainObj] of Object.entries(domains)) {
    const name = domainDisplayName(domainId);
    const count = domainObj.skills.length;
    const desc = domainObj.description;
    rows.push(`| [${name}](${linkPrefix}${domainId}/) | ${count} | ${desc} |`);
  }
  return rows.join('\n');
}

function generateAgentsIntro(linkPrefix) {
  let text = `The **[Agents Library](${linkPrefix})** provides ${totalAgents} specialized agent definitions for Claude Code. Agents define *who* handles a task (persona, tools, domain expertise), complementing skills which define *how* (procedure, validation).`;
  if (defaultSkills.length > 0) {
    const names = defaultSkills.map(s => s.id).join(', ');
    text += ` All agents inherit default skills: ${names}.`;
  }
  return text;
}

function generateAgentsIntroStandalone() {
  let text = `A collection of ${totalAgents} specialized agent definitions for [Claude Code](https://docs.anthropic.com/en/docs/claude-code). Each agent defines a persona with specific capabilities, tools, and domain expertise that Claude Code uses when spawned as a subagent.`;
  if (defaultSkills.length > 0) {
    const names = defaultSkills.map(s => s.id).join(', ');
    text += `\n\nAll agents inherit **default skills**: ${names}.`;
  }
  return text;
}

function generateAgentsTable(linkPrefix) {
  const sorted = [...agents].sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
    const pa = priorityOrder[a.priority] ?? 2;
    const pb = priorityOrder[b.priority] ?? 2;
    if (pa !== pb) return pa - pb;
    return a.id.localeCompare(b.id);
  });

  const rows = [];
  rows.push('| Agent | Priority | Description |');
  rows.push('|-------|----------|-------------|');
  for (const agent of sorted) {
    const name = agentDisplayName(agent.id);
    rows.push(
      `| [${name}](${linkPrefix}${agent.id}.md) | ${agent.priority} | ${agent.description} |`
    );
  }
  return rows.join('\n');
}

function generateTeamsIntro(linkPrefix) {
  return `The **[Teams Library](${linkPrefix})** provides ${totalTeams} predefined multi-agent team compositions. Teams define *who works together* — coordinated groups of agents with assigned roles, a lead, and a defined coordination pattern for complex workflows.`;
}

function generateTeamsIntroStandalone() {
  return `A collection of ${totalTeams} predefined multi-agent team compositions for [Claude Code](https://docs.anthropic.com/en/docs/claude-code). Each team defines a coordinated group of agents with assigned roles, a lead, and a defined coordination pattern for complex workflows.`;
}

function generateTeamsTable(linkPrefix) {
  const rows = [];
  rows.push('| Team | Lead | Members | Coordination | Description |');
  rows.push('|------|------|---------|--------------|-------------|');
  for (const team of teams) {
    const name = teamDisplayName(team.id);
    const memberCount = team.members ? team.members.length : 0;
    rows.push(
      `| [${name}](${linkPrefix}${team.id}.md) | ${team.lead} | ${memberCount} | ${team.coordination || 'hub-and-spoke'} | ${team.description} |`
    );
  }
  return rows.join('\n');
}

function generateOverview() {
  return `A documentation-only repository containing ${totalGuides} guides, a skills library of ${totalSkills} agentic skills, ${totalAgents} agent definitions, and ${totalTeams} team compositions following the [Agent Skills open standard](https://agentskills.io). There is no build system, no tests, and no compiled code — all content is markdown and YAML.

The guides serve as the human entry point to the agentic system: practical workflows explaining when, why, and how to interact with agents, teams, and skills through Claude Code.`;
}

function generateRegistries() {
  const domainList = Object.entries(domains)
    .map(([id, obj]) => `${id} (${obj.skills.length})`)
    .join(', ');

  return `- \`skills/_registry.yml\` is the machine-readable catalog of all ${totalSkills} skills across ${totalDomains} domains: ${domainList}.
- \`agents/_registry.yml\` is the machine-readable catalog of all ${totalAgents} agents.
- \`teams/_registry.yml\` is the machine-readable catalog of all ${totalTeams} teams.
- \`guides/_registry.yml\` is the machine-readable catalog of all ${totalGuides} guides across ${Object.keys(guideCategories).length} categories.

When adding or removing skills, agents, teams, or guides, the corresponding registry must be updated to stay in sync.`;
}

// ── Fully generated files ────────────────────────────────────────

function generateGuidesSection() {
  const lines = [];
  for (const guide of guides) {
    lines.push(
      `- **[${guide.title}](guides/${guide.id}.md)** — ${guide.description}`
    );
  }
  return lines.join('\n');
}

function generateGuidesReadme() {
  const categoryOrder = ['workflow', 'infrastructure', 'reference', 'design'];
  const lines = [
    '# Guides',
    '',
    `${totalGuides} guides serving as the human entry point to the agentic system — practical workflows for agents, teams, and skills, plus infrastructure setup and reference material.`,
    '',
  ];

  for (const catId of categoryOrder) {
    const catGuides = guides.filter((g) => g.category === catId);
    if (catGuides.length === 0) continue;
    const catDesc = guideCategories[catId]
      ? guideCategories[catId].description
      : catId;
    const catName = catId[0].toUpperCase() + catId.slice(1);
    lines.push(`## ${catName}`);
    lines.push('');
    lines.push(`*${catDesc}*`);
    lines.push('');
    for (const guide of catGuides) {
      lines.push(`### [${guide.title}](${guide.id}.md)`);
      lines.push(`${guide.description}.`);
      lines.push('');
    }
  }

  return lines.join('\n');
}

function generateVizReadme() {
  return `# Interactive Skills Visualization

Force-graph explorer for the ${totalSkills}-skill, ${totalAgents}-agent, ${totalTeams}-team development platform. Built with [force-graph](https://github.com/vasturiano/force-graph), R/ggplot2 icon rendering, and 6 color themes.

## Architecture

- **Force-graph** (\`js/graph.js\`): 2D canvas rendering with zoom, pan, and click-to-inspect
- **R icon pipeline** (\`R/\`): ggplot2 + ggfx neon glow pictograms rendered per-skill as transparent WebP icons
- **${totalSkills} skill icons** (\`icons/<domain>/\`): one glyph per skill, domain-colored
- **6 color themes**: cyberpunk, viridis, inferno, magma, plasma, cividis
- **Data pipeline**: \`build-data.js\` reads all three registries and generates \`data/skills.json\`

## Build Pipeline

\`\`\`bash
# Generate skills.json from registries
node build-data.js

# Render R-based pictogram icons (requires R with ggplot2, ggfx)
Rscript build-icons.R

# Build icon manifest and convert to WebP
node build-icons.js
\`\`\`

## Run Locally

\`\`\`bash
cd viz && python3 -m http.server 8080
# Open http://localhost:8080
\`\`\`

## Docker

\`\`\`bash
docker compose up --build
# Open http://localhost:8080
\`\`\`

## Directory Layout

\`\`\`
viz/
\u251c\u2500\u2500 index.html                 # Force-graph explorer
\u251c\u2500\u2500 build-data.js              # Registry \u2192 skills.json pipeline
\u251c\u2500\u2500 build-icons.R              # R icon rendering orchestrator
\u251c\u2500\u2500 build-icons.js             # WebP conversion + manifest
\u251c\u2500\u2500 build-icon-manifest.js     # Icon manifest generator
\u251c\u2500\u2500 generate-palette-colors.R  # Domain color palette generator
\u251c\u2500\u2500 Dockerfile                 # Container build
\u251c\u2500\u2500 docker-compose.yml         # Compose configuration
\u251c\u2500\u2500 js/                        # Graph, filters, panel, color themes
\u251c\u2500\u2500 css/                       # Styles
\u251c\u2500\u2500 R/                         # Glyph primitives, render, utilities
\u251c\u2500\u2500 data/                      # skills.json, icon-manifest.json, palette-colors.json
\u2514\u2500\u2500 icons/                     # WebP skill icons by domain
\`\`\`
`;
}

function generateTeamsReadme() {
  return `# Teams

Predefined multi-agent team compositions for coordinated workflows in [Claude Code](https://docs.anthropic.com/en/docs/claude-code).

## Overview

<!-- AUTO:START:teams-intro -->
${generateTeamsIntroStandalone()}
<!-- AUTO:END:teams-intro -->

Teams complement agents and skills:
- **Skills** define *how* (procedure, validation, recovery)
- **Agents** define *who* (persona, tools, domain expertise)
- **Teams** define *who works together* (composition, roles, coordination)

## Available Teams

<!-- AUTO:START:teams-table -->
${generateTeamsTable('')}
<!-- AUTO:END:teams-table -->

## Creating a New Team

1. Copy \`_template.md\` to \`<team-name>.md\`
2. Fill in YAML frontmatter: \`name\`, \`description\`, \`lead\`, \`members[]\`, \`coordination\`
3. Write Purpose, Team Composition, Coordination Pattern, Task Decomposition, and Configuration sections
4. Include a \`<!-- CONFIG:START -->\` / \`<!-- CONFIG:END -->\` block with machine-readable YAML
5. Add the entry to \`_registry.yml\`
6. Run \`npm run update-readmes\` from the project root

## Coordination Patterns

| Pattern | Description | Best For |
|---------|-------------|----------|
| **Hub-and-spoke** | Lead distributes tasks and collects results | Review teams, audit teams |
| **Sequential** | Each member processes in order | Pipeline workflows |
| **Parallel** | Members work independently, lead merges | Independent subtasks |
| **Consensus** | Members deliberate and reach agreement | Decision-making teams |

## Machine-Readable Configuration

Each team definition includes an embedded configuration block between \`<!-- CONFIG:START -->\` and \`<!-- CONFIG:END -->\` markers. Tooling can extract this YAML to auto-create teams via Claude Code's TeamCreate/SendMessage infrastructure.

## Registry

The \`_registry.yml\` file provides programmatic discovery of all teams:

\`\`\`python
import yaml
with open("teams/_registry.yml") as f:
    registry = yaml.safe_load(f)
    for team in registry["teams"]:
        print(f"{team['id']}: {team['lead']} + {len(team['members'])} members")
\`\`\`
`;
}

// ── Main ─────────────────────────────────────────────────────────

let staleCount = 0;

function run(label, changed) {
  if (changed) {
    staleCount++;
    console.log(`${CHECK_MODE ? 'STALE' : 'UPDATED'}: ${label}`);
  } else {
    console.log(`OK: ${label}`);
  }
}

// README.md (abbreviated — full tables live in sub-READMEs)
run(
  'README.md',
  processFile(resolve(ROOT, 'README.md'), {
    stats: generateStats,
    guides: generateGuidesSection,
  })
);

// skills/README.md
run(
  'skills/README.md',
  processFile(resolve(ROOT, 'skills/README.md'), {
    'skills-intro': generateSkillsIntroStandalone,
    'skills-table': () => generateSkillsTable(''),
  })
);

// agents/README.md
run(
  'agents/README.md',
  processFile(resolve(ROOT, 'agents/README.md'), {
    'agents-intro': generateAgentsIntroStandalone,
    'agents-table': () => generateAgentsTable(''),
  })
);

// CLAUDE.md
run(
  'CLAUDE.md',
  processFile(resolve(ROOT, 'CLAUDE.md'), {
    overview: generateOverview,
    registries: generateRegistries,
  })
);

// guides/README.md (fully generated)
run(
  'guides/README.md',
  writeGeneratedFile(resolve(ROOT, 'guides/README.md'), generateGuidesReadme())
);

// viz/README.md (fully generated)
run(
  'viz/README.md',
  writeGeneratedFile(resolve(ROOT, 'viz/README.md'), generateVizReadme())
);

// teams/README.md (fully generated)
run(
  'teams/README.md',
  writeGeneratedFile(resolve(ROOT, 'teams/README.md'), generateTeamsReadme())
);

// Summary
console.log(
  `\nStats: ${totalSkills} skills, ${totalDomains} domains, ${totalAgents} agents, ${totalTeams} teams, ${totalGuides} guides`
);

if (CHECK_MODE && staleCount > 0) {
  console.error(`\n${staleCount} file(s) are stale. Run "npm run update-readmes" to fix.`);
  process.exit(1);
} else if (CHECK_MODE) {
  console.log('\nAll files are up to date.');
} else if (staleCount > 0) {
  console.log(`\n${staleCount} file(s) updated.`);
} else {
  console.log('\nNo changes needed.');
}
