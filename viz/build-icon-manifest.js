#!/usr/bin/env node
/**
 * build-icon-manifest.js
 *
 * Reads viz/data/skills.json and generates viz/data/icon-manifest.json
 * with per-skill prompts, seeds, and paths for Z-Image icon generation.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILLS_PATH = resolve(__dirname, 'public', 'data', 'skills.json');
const OUTPUT_PATH = resolve(__dirname, 'public', 'data', 'icon-manifest.json');
const ICONS_DIR = resolve(__dirname, 'public', 'icons');

// ── Generation config ───────────────────────────────────────────────
const META = {
  model: 'mcp-tools/Z-Image-Turbo',
  resolution: '1024x1024 ( 1:1 )',
  steps: 12,
  shift: 4,
};

const SHARED_SUFFIX = 'dark background, vector art, clean edges, single centered icon, no text';

// ── Per-domain base motifs ──────────────────────────────────────────
const DOMAIN_STYLES = {
  'r-packages':         { basePrompt: 'Glowing hexagonal R logo, circuit board traces',          glow: 'cyan' },
  'git':                { basePrompt: 'Glowing branch tree, commit graph nodes',                 glow: 'mint' },
  'compliance':         { basePrompt: 'Neon shield seal, regulatory checkmark',                  glow: 'pink' },
  'project-management': { basePrompt: 'Glowing Gantt chart, milestone markers',                  glow: 'orange' },
  'devops':             { basePrompt: 'Neon pipeline, gear mechanism, infinity loop',             glow: 'green' },
  'general':            { basePrompt: 'Glowing terminal prompt, wrench tool',                    glow: 'lavender' },
  'observability':      { basePrompt: 'Neon radar eye, signal wave pulse',                       glow: 'amber' },
  'review':             { basePrompt: 'Glowing magnifying glass, code lens',                     glow: 'rose' },
  'mlops':              { basePrompt: 'Neural network nodes, brain circuit',                     glow: 'violet' },
  'containerization':   { basePrompt: 'Neon container box, whale silhouette',                    glow: 'sky' },
  'reporting':          { basePrompt: 'Glowing chart, document with data',                       glow: 'yellow' },
  'web-dev':            { basePrompt: 'Neon browser window, HTML angle brackets',                glow: 'coral' },
  'mcp-integration':    { basePrompt: 'Glowing server nodes, connection plug',                   glow: 'teal' },
  'bushcraft':          { basePrompt: 'Neon campfire flame, leaf, compass rose',                  glow: 'olive' },
  'esoteric':           { basePrompt: 'Glowing third eye, mandala spiral',                       glow: 'magenta' },
  'defensive':          { basePrompt: 'Neon flowing water circle, yin-yang shield',              glow: 'red' },
  'design':             { basePrompt: 'Glowing compass, golden spiral ornament',                 glow: 'rose-gold' },
  'data-serialization': { basePrompt: 'Neon binary stream, schema tree brackets',                glow: 'blue' },
};

// ── Per-skill keyword extraction ────────────────────────────────────
// Extract 2-3 descriptive keywords from the skill title/id
function skillKeywords(id, title) {
  // Map well-known skill IDs to specific visual keywords
  const overrides = {
    'create-r-package':              'scaffolding, package box',
    'submit-to-cran':                'upload arrow, checkmark stamp',
    'write-roxygen-docs':            'documentation scroll, pen nib',
    'write-testthat-tests':          'test tubes, assertion checkmark',
    'setup-github-actions-ci':       'GitHub octocat, workflow arrows',
    'manage-renv-dependencies':      'dependency tree, lock icon',
    'build-pkgdown-site':            'website wireframe, book pages',
    'release-package-version':       'version tag, rocket launch',
    'add-rcpp-integration':          'C++ gears, bridge connector',
    'write-vignette':                'long document, tutorial scroll',
    'create-r-dockerfile':           'Docker whale, R hexagon inside',
    'setup-docker-compose':          'interconnected containers, orchestration',
    'containerize-mcp-server':       'server in a box, glowing connection',
    'optimize-docker-build-cache':   'layered cache, speed arrows',
    'create-quarto-report':          'Quarto diamond, rendered document',
    'build-parameterized-report':    'template with parameters, gears',
    'format-apa-report':             'academic paper, formatted citation',
    'generate-status-report':        'dashboard gauge, progress bar',
    'conduct-gxp-audit':             'audit clipboard, magnifying glass',
    'implement-audit-trail':         'footprint trail, timestamp log',
    'write-validation-documentation':'validation stamp, protocol document',
    'setup-gxp-r-project':           'R hexagon with shield, regulated folder',
    'perform-csv-assessment':        'risk matrix, assessment checklist',
    'write-standard-operating-procedure': 'SOP document, numbered steps',
    'design-training-program':       'curriculum tree, graduation cap',
    'investigate-capa-root-cause':   'fishbone diagram, root cause arrow',
    'implement-electronic-signatures':'digital signature, fingerprint scan',
    'manage-change-control':         'change request form, approval flow',
    'monitor-data-integrity':        'data shield, integrity checkmark',
    'qualify-vendor':                'vendor badge, qualification star',
    'implement-pharma-serialisation':'pharma barcode, track-and-trace',
    'design-compliance-architecture':'architecture blueprint, regulation map',
    'prepare-inspection-readiness':  'inspection checklist, readiness meter',
    'decommission-validated-system': 'system power-down, archive box',
    'validate-statistical-output':   'statistics validation, reference comparison',
    'configure-mcp-server':          'MCP config panel, server settings',
    'build-custom-mcp-server':       'custom server build, tool palette',
    'troubleshoot-mcp-connection':   'debug probe, broken connection repair',
    'scaffold-nextjs-app':           'Next.js logo, app scaffold',
    'setup-tailwind-typescript':     'Tailwind wind, TypeScript logo',
    'deploy-to-vercel':              'Vercel triangle, deployment rocket',
    'commit-changes':                'commit diamond, staged files',
    'create-pull-request':           'pull request merge, branch arrow',
    'manage-git-branches':           'branch tree, switch arrows',
    'configure-git-repository':      'git config gear, repository folder',
    'create-github-release':         'release tag, download package',
    'resolve-git-conflicts':         'conflict merge, resolution handshake',
    'write-claude-md':               'Claude AI icon, instruction document',
    'security-audit-codebase':       'security scan, vulnerability shield',
    'setup-wsl-dev-environment':     'WSL penguin, terminal window',
    'skill-creation':                'skill blueprint, creation spark',
    'skill-evolution':               'evolution spiral, skill upgrade arrow',
    'review-research':               'research paper, peer review lens',
    'review-data-analysis':          'data chart, analysis magnifier',
    'review-software-architecture':  'architecture diagram, review eye',
    'review-web-design':             'web layout, design review palette',
    'review-ux-ui':                  'user interface, usability heuristic',
    'make-fire':                     'sparks, flint and steel',
    'purify-water':                  'water droplet, filtration funnel',
    'forage-plants':                 'leaf identification, plant specimen',
    'meditate':                      'lotus position, calm waves',
    'heal':                          'healing hands, energy aura',
    'remote-viewing':                'third eye open, coordinate grid',
    'tai-chi':                       'tai chi flow, yin-yang balance',
    'aikido':                        'aikido spiral, redirect arrow',
    'mindfulness':                   'awareness ripple, centered mind',
    'ornament-style-mono':           'monochrome pattern, ornament motif',
    'ornament-style-color':          'polychrome ornament, color palette',
    'ornament-style-modern':         'modern pattern, futuristic ornament',
    'design-serialization-schema':   'schema blueprint, data types',
    'serialize-data-formats':        'format conversion, data stream',
    'draft-project-charter':         'charter scroll, project scope',
    'plan-sprint':                   'sprint board, velocity chart',
    'manage-backlog':                'backlog list, priority stack',
    'create-work-breakdown-structure':'WBS tree, hierarchical boxes',
    'generate-status-report':        'progress dashboard, status gauge',
    'conduct-retrospective':         'retro board, team reflection mirror',
    'conduct-post-mortem':           'timeline reconstruction, incident analysis',
    'build-ci-cd-pipeline':          'pipeline stages, continuous flow',
    'implement-gitops-workflow':     'GitOps sync, Argo CD arrows',
    'provision-infrastructure-terraform':'Terraform blocks, infrastructure map',
    'write-helm-chart':              'Helm anchor, chart template',
    'deploy-to-kubernetes':          'Kubernetes wheel, pod deployment',
    'setup-local-kubernetes':        'local cluster, development pods',
    'manage-kubernetes-secrets':     'sealed secrets, encrypted key',
    'configure-ingress-networking':  'ingress gateway, traffic routing',
    'enforce-policy-as-code':        'policy shield, code constraint',
    'setup-container-registry':      'container registry, image tags',
    'configure-api-gateway':         'API gateway, traffic funnel',
    'optimize-cloud-costs':          'cost graph, optimization arrows',
    'run-chaos-experiment':          'chaos monkey, resilience test',
    'setup-service-mesh':            'service mesh grid, sidecar proxy',
    'setup-prometheus-monitoring':   'Prometheus fire, metrics scrape',
    'build-grafana-dashboards':      'Grafana panel, dashboard grid',
    'configure-log-aggregation':     'log funnel, Loki stack',
    'instrument-distributed-tracing':'trace spans, distributed path',
    'configure-alerting-rules':      'alert bell, routing tree',
    'write-incident-runbook':        'runbook steps, incident playbook',
    'define-slo-sli-sla':            'SLO gauge, error budget bar',
    'design-on-call-rotation':       'rotation schedule, pager icon',
    'setup-uptime-checks':           'uptime heartbeat, probe signal',
    'plan-capacity':                 'capacity forecast, growth curve',
    'correlate-observability-signals':'unified signals, metric-log-trace',
    'detect-anomalies-aiops':        'anomaly spike, AI detection',
    'forecast-operational-metrics':  'forecast curve, prediction line',
    'track-ml-experiments':          'MLflow logo, experiment log',
    'build-feature-store':           'feature table, feast icon',
    'label-training-data':           'labeling tool, annotation marker',
    'version-ml-data':               'DVC version, data snapshot',
    'deploy-ml-model-serving':       'model endpoint, serving container',
    'register-ml-model':             'model registry, stage transition',
    'orchestrate-ml-pipeline':       'pipeline DAG, task flow',
    'setup-automl-pipeline':         'AutoML optimizer, hyperparameter grid',
    'run-ab-test-models':            'A/B split, model comparison',
    'monitor-model-drift':           'drift curve, distribution shift',
  };

  if (overrides[id]) return overrides[id];

  // Fallback: extract from title
  const words = (title || id)
    .replace(/[-_]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !['the', 'and', 'for', 'with'].includes(w.toLowerCase()));
  return words.slice(0, 3).join(', ');
}

// ── Seed strategy ───────────────────────────────────────────────────
// Alphabetical domain index * 10000 + 1-based skill offset within domain
function computeSeed(domain, domainIndex, skillOffset) {
  return (domainIndex + 1) * 10000 + skillOffset;
}

// ── Main ────────────────────────────────────────────────────────────
const skills = JSON.parse(readFileSync(SKILLS_PATH, 'utf8'));

// Sort domains alphabetically for stable index assignment
const domainsSorted = Object.keys(skills.domains).sort();
const domainIndexMap = {};
domainsSorted.forEach((d, i) => { domainIndexMap[d] = i; });

// Group nodes by domain to compute per-domain offsets
const domainNodes = {};
for (const node of skills.nodes) {
  if (!domainNodes[node.domain]) domainNodes[node.domain] = [];
  domainNodes[node.domain].push(node);
}

const icons = [];
for (const domain of domainsSorted) {
  const nodes = domainNodes[domain] || [];
  const domainIdx = domainIndexMap[domain];
  const style = DOMAIN_STYLES[domain] || { basePrompt: 'Glowing icon', glow: 'white' };

  // Ensure domain icon directory exists
  mkdirSync(resolve(ICONS_DIR, domain), { recursive: true });

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const seed = computeSeed(domain, domainIdx, i + 1);
    const keywords = skillKeywords(node.id, node.title);
    const prompt = `${style.basePrompt}, ${keywords}, ${SHARED_SUFFIX}`;
    const path = `public/icons/${domain}/${node.id}.webp`;

    icons.push({
      skillId: node.id,
      domain,
      prompt,
      seed,
      path,
      status: 'pending',
    });
  }
}

const manifest = {
  meta: META,
  domainStyles: DOMAIN_STYLES,
  icons,
};

writeFileSync(OUTPUT_PATH, JSON.stringify(manifest, null, 2));

console.log(`Generated ${OUTPUT_PATH}`);
console.log(`  Icons: ${icons.length}`);
console.log(`  Domains: ${domainsSorted.length}`);
console.log(`  Icon directories created under ${ICONS_DIR}`);
