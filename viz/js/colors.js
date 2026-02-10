/**
 * colors.js - Theme palette system with 6 switchable colormaps
 *
 * Provides: getColor, setTheme, getCurrentPalette, getThemeNames
 * Backward compat: DOMAIN_COLORS Proxy delegates to active palette
 */

// ── Domain order (alphabetical) for consistent palette assignment ──
const DOMAIN_ORDER = [
  'bushcraft', 'compliance', 'containerization', 'data-serialization',
  'defensive', 'design', 'devops', 'esoteric', 'general', 'git',
  'mcp-integration', 'mlops', 'morphic', 'observability', 'project-management',
  'r-packages', 'reporting', 'review', 'swarm', 'web-dev', 'workflow-visualization',
];

// ── 6 named palettes: 18 hex colors each ───────────────────────────
const PALETTES = {
  cyberpunk: {
    'bushcraft':          '#88cc44',
    'compliance':         '#ff3366',
    'containerization':   '#44ddff',
    'data-serialization': '#44aaff',
    'defensive':          '#ff4444',
    'design':             '#ff88dd',
    'devops':             '#00ff88',
    'esoteric':           '#dd44ff',
    'general':            '#ccccff',
    'git':                '#66ffcc',
    'mcp-integration':    '#00ccaa',
    'mlops':              '#aa66ff',
    'morphic':            '#bb88ff',
    'observability':      '#ffaa00',
    'project-management': '#ff8844',
    'r-packages':         '#00f0ff',
    'reporting':          '#ffdd00',
    'review':             '#ff66aa',
    'swarm':              '#aadd44',
    'web-dev':            '#ff6633',
    'workflow-visualization': '#66dd88',
  },

  // Viridis: purple → teal → yellow-green (perceptually uniform)
  viridis: {
    'bushcraft':          '#46085c',
    'compliance':         '#471365',
    'containerization':   '#472272',
    'data-serialization': '#45307d',
    'defensive':          '#423d84',
    'design':             '#3d4a89',
    'devops':             '#37558d',
    'esoteric':           '#31618e',
    'general':            '#2b6c8e',
    'git':                '#25788e',
    'mcp-integration':    '#20848d',
    'mlops':              '#1a908b',
    'morphic':            '#179c8c',
    'observability':      '#1f9c88',
    'project-management': '#2da882',
    'r-packages':         '#42b676',
    'reporting':          '#62c467',
    'review':             '#86d14a',
    'swarm':              '#99d83e',
    'web-dev':            '#addc30',
    'workflow-visualization': '#5ec962',
  },

  // Inferno: black → purple → red → orange → yellow
  inferno: {
    'bushcraft':          '#0c0826',
    'compliance':         '#1b0b3a',
    'containerization':   '#2e0a56',
    'data-serialization': '#470b6a',
    'defensive':          '#5f1474',
    'design':             '#781c6d',
    'devops':             '#902568',
    'esoteric':           '#a73458',
    'general':            '#bb4749',
    'git':                '#ce5d3c',
    'mcp-integration':    '#de7633',
    'mlops':              '#ed912f',
    'morphic':            '#e39e32',
    'observability':      '#f7ab36',
    'project-management': '#fcc545',
    'r-packages':         '#fadf5b',
    'reporting':          '#f6f478',
    'review':             '#f3fa96',
    'swarm':              '#f8fc9d',
    'web-dev':            '#fcffa4',
    'workflow-visualization': '#f0f921',
  },

  // Magma: black → purple → pink → peach → cream
  magma: {
    'bushcraft':          '#080616',
    'compliance':         '#140b36',
    'containerization':   '#270b52',
    'data-serialization': '#3d076e',
    'defensive':          '#540f7e',
    'design':             '#6a2381',
    'devops':             '#803c7d',
    'esoteric':           '#96567c',
    'general':            '#ab6f7c',
    'git':                '#bf897f',
    'mcp-integration':    '#d0a387',
    'mlops':              '#e0bc95',
    'morphic':            '#d8c89e',
    'observability':      '#edd5a7',
    'project-management': '#f4e7bc',
    'r-packages':         '#f8f1cf',
    'reporting':          '#fcf6e1',
    'review':             '#fdf9f0',
    'swarm':              '#fdfcb8',
    'web-dev':            '#fcfdbf',
    'workflow-visualization': '#fbfcb6',
  },

  // Plasma: purple → pink → orange → yellow
  plasma: {
    'bushcraft':          '#1a068a',
    'compliance':         '#320597',
    'containerization':   '#4a039e',
    'data-serialization': '#6101a5',
    'defensive':          '#7701a8',
    'design':             '#8c0ba5',
    'devops':             '#a01d9a',
    'esoteric':           '#b2348c',
    'general':            '#c24b7d',
    'git':                '#d0626e',
    'mcp-integration':    '#dc7b5f',
    'mlops':              '#e69350',
    'morphic':            '#e99e4b',
    'observability':      '#ecaa46',
    'project-management': '#f2c13d',
    'r-packages':         '#f4d73e',
    'reporting':          '#f5ea3e',
    'review':             '#f2f744',
    'swarm':              '#f1f832',
    'web-dev':            '#f0f921',
    'workflow-visualization': '#e8e24b',
  },

  // Cividis: blue → gray → olive → yellow (colorblind-friendly)
  cividis: {
    'bushcraft':          '#002462',
    'compliance':         '#06296c',
    'containerization':   '#1e3461',
    'data-serialization': '#333f59',
    'defensive':          '#454c54',
    'design':             '#555a56',
    'devops':             '#636860',
    'esoteric':           '#70776b',
    'general':            '#7d8578',
    'git':                '#8a9484',
    'mcp-integration':    '#97a391',
    'mlops':              '#a4b29e',
    'morphic':            '#acbaa4',
    'observability':      '#b4c1aa',
    'project-management': '#c4cfb5',
    'r-packages':         '#d5dec1',
    'reporting':          '#e5ecce',
    'review':             '#f2f6dd',
    'swarm':              '#f8faca',
    'web-dev':            '#fdfd96',
    'workflow-visualization': '#b5d86e',
  },
};

// ── Active theme state ──────────────────────────────────────────────
let currentTheme = 'cyberpunk';

export function getColor(domain) {
  return PALETTES[currentTheme]?.[domain] || '#ffffff';
}

export function setTheme(name) {
  if (PALETTES[name]) {
    currentTheme = name;
  }
}

export function getCurrentPalette() {
  return { ...PALETTES[currentTheme] };
}

export function getThemeNames() {
  return Object.keys(PALETTES);
}

export function getCurrentThemeName() {
  return currentTheme;
}

// ── Backward-compatible DOMAIN_COLORS Proxy ─────────────────────────
// Existing code reads DOMAIN_COLORS[domain]; this Proxy delegates to
// the active palette so theme switches propagate without code changes.
export const DOMAIN_COLORS = new Proxy({}, {
  get(_target, prop) {
    if (typeof prop === 'string') {
      return PALETTES[currentTheme]?.[prop];
    }
    return undefined;
  },
  ownKeys() {
    return DOMAIN_ORDER;
  },
  getOwnPropertyDescriptor(_target, prop) {
    if (DOMAIN_ORDER.includes(prop)) {
      return { configurable: true, enumerable: true, value: PALETTES[currentTheme]?.[prop] };
    }
    return undefined;
  },
  has(_target, prop) {
    return DOMAIN_ORDER.includes(prop);
  },
});

// ── Agent colors (one warm gold per theme) ──────────────────────────
const AGENT_COLORS = {
  cyberpunk: '#ffd700',
  viridis:   '#fde725',
  inferno:   '#fcffa4',
  magma:     '#fcfdbf',
  plasma:    '#f0f921',
  cividis:   '#fdfd96',
};

export function getAgentColor() {
  return AGENT_COLORS[currentTheme] || '#ffd700';
}

export const AGENT_PRIORITY_CONFIG = {
  critical: { radius: 8, glowRadius: 24, glowOpacity: 0.7 },
  high:     { radius: 6, glowRadius: 18, glowOpacity: 0.5 },
  normal:   { radius: 5, glowRadius: 14, glowOpacity: 0.4 },
};

// ── Complexity configs (unchanged) ──────────────────────────────────
export const COMPLEXITY_CONFIG = {
  basic:        { radius: 5, glowRadius: 14, glowOpacity: 0.4,  label: 'Basic' },
  intermediate: { radius: 5, glowRadius: 18, glowOpacity: 0.5,  label: 'Intermediate' },
  advanced:     { radius: 5, glowRadius: 22, glowOpacity: 0.6,  label: 'Advanced' },
};

export const COMPLEXITY_BADGE_COLORS = {
  basic:        '#00ff88',
  intermediate: '#ffdd00',
  advanced:     '#dd44ff',
};

// ── Featured hub nodes (viz-layer config, not skill metadata) ────────
export const FEATURED_NODES = {
  'skill-creation':      { radius: 9, tier: 'primary' },
  'skill-evolution':     { radius: 7, tier: 'secondary' },
  'create-skill-glyph':  { radius: 7, tier: 'secondary' },
};

export function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
