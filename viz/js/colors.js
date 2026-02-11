/**
 * colors.js - Theme palette system with 9 switchable colormaps
 *
 * Provides: getColor, setTheme, getCurrentPalette, getThemeNames
 * Backward compat: DOMAIN_COLORS Proxy delegates to active palette
 */

// ── Domain order (alphabetical) for consistent palette assignment ──
const DOMAIN_ORDER = [
  'bushcraft',
  'compliance',
  'containerization',
  'data-serialization',
  'defensive',
  'design',
  'devops',
  'esoteric',
  'general',
  'git',
  'jigsawr',
  'mcp-integration',
  'mlops',
  'morphic',
  'observability',
  'project-management',
  'r-packages',
  'reporting',
  'review',
  'swarm',
  'web-dev',
  'workflow-visualization',
];

// ── 9 named palettes: one hex color per domain (22 domains) ────────
const PALETTES = {
  cyberpunk: {
    'bushcraft':                 '#88cc44',
    'compliance':                '#ff3366',
    'containerization':          '#44ddff',
    'data-serialization':        '#44aaff',
    'defensive':                 '#ff4444',
    'design':                    '#ff88dd',
    'devops':                    '#00ff88',
    'esoteric':                  '#dd44ff',
    'general':                   '#ccccff',
    'git':                       '#66ffcc',
    'jigsawr':                   '#22ddaa',
    'mcp-integration':           '#00ccaa',
    'mlops':                     '#aa66ff',
    'morphic':                   '#bb88ff',
    'observability':             '#ffaa00',
    'project-management':        '#ff8844',
    'r-packages':                '#00f0ff',
    'reporting':                 '#ffdd00',
    'review':                    '#ff66aa',
    'swarm':                     '#aadd44',
    'web-dev':                   '#ff6633',
    'workflow-visualization':    '#66dd88',
  },

  viridis: {
    'bushcraft':                 '#440154',
    'compliance':                '#471365',
    'containerization':          '#482374',
    'data-serialization':        '#46337E',
    'defensive':                 '#424186',
    'design':                    '#3C4F8A',
    'devops':                    '#365C8D',
    'esoteric':                  '#31688E',
    'general':                   '#2C738E',
    'git':                       '#277F8E',
    'jigsawr':                   '#238A8D',
    'mcp-integration':           '#1F968B',
    'mlops':                     '#1FA187',
    'morphic':                   '#26AD81',
    'observability':             '#35B779',
    'project-management':        '#4AC16D',
    'r-packages':                '#64CB5F',
    'reporting':                 '#80D34E',
    'review':                    '#9FDA3A',
    'swarm':                     '#BFDF25',
    'web-dev':                   '#DFE318',
    'workflow-visualization':    '#FDE725',
  },

  magma: {
    'bushcraft':                 '#000004',
    'compliance':                '#06051A',
    'containerization':          '#130D35',
    'data-serialization':        '#231151',
    'defensive':                 '#37106C',
    'design':                    '#4B117A',
    'devops':                    '#5F187F',
    'esoteric':                  '#721F81',
    'general':                   '#842681',
    'git':                       '#982D80',
    'jigsawr':                   '#AC337C',
    'mcp-integration':           '#C03A77',
    'mlops':                     '#D3436E',
    'morphic':                   '#E44F64',
    'observability':             '#F1605D',
    'project-management':        '#F8765C',
    'r-packages':                '#FC8D63',
    'reporting':                 '#FEA470',
    'review':                    '#FEBA80',
    'swarm':                     '#FED094',
    'web-dev':                   '#FDE7A9',
    'workflow-visualization':    '#FCFDBF',
  },

  inferno: {
    'bushcraft':                 '#000004',
    'compliance':                '#07051B',
    'containerization':          '#150B38',
    'data-serialization':        '#280B54',
    'defensive':                 '#3E0966',
    'design':                    '#520E6D',
    'devops':                    '#65156E',
    'esoteric':                  '#781C6D',
    'general':                   '#8C2369',
    'git':                       '#9F2A63',
    'jigsawr':                   '#B2325A',
    'mcp-integration':           '#C43C4E',
    'mlops':                     '#D44842',
    'morphic':                   '#E25734',
    'observability':             '#ED6925',
    'project-management':        '#F57D15',
    'r-packages':                '#FA9307',
    'reporting':                 '#FCA90E',
    'review':                    '#FAC127',
    'swarm':                     '#F5D848',
    'web-dev':                   '#F1EF74',
    'workflow-visualization':    '#FCFFA4',
  },

  plasma: {
    'bushcraft':                 '#0D0887',
    'compliance':                '#2A0593',
    'containerization':          '#3F049C',
    'data-serialization':        '#5402A3',
    'defensive':                 '#6700A8',
    'design':                    '#7902A8',
    'devops':                    '#8B0AA5',
    'esoteric':                  '#9C179E',
    'general':                   '#AB2494',
    'git':                       '#B93289',
    'jigsawr':                   '#C5417E',
    'mcp-integration':           '#D14E72',
    'mlops':                     '#DB5C68',
    'morphic':                   '#E56A5D',
    'observability':             '#ED7953',
    'project-management':        '#F48849',
    'r-packages':                '#F9993E',
    'reporting':                 '#FCAA33',
    'review':                    '#FEBC2A',
    'swarm':                     '#FCCF25',
    'web-dev':                   '#F7E425',
    'workflow-visualization':    '#F0F921',
  },

  cividis: {
    'bushcraft':                 '#00204D',
    'compliance':                '#002961',
    'containerization':          '#00306F',
    'data-serialization':        '#16396D',
    'defensive':                 '#2E436C',
    'design':                    '#3E4B6B',
    'devops':                    '#4B546C',
    'esoteric':                  '#575C6D',
    'general':                   '#62656F',
    'git':                       '#6C6E72',
    'jigsawr':                   '#787776',
    'mcp-integration':           '#838079',
    'mlops':                     '#8E8A79',
    'morphic':                   '#9A9377',
    'observability':             '#A69D75',
    'project-management':        '#B3A772',
    'r-packages':                '#C0B16E',
    'reporting':                 '#CDBC68',
    'review':                    '#DBC761',
    'swarm':                     '#E9D358',
    'web-dev':                   '#F7DE4C',
    'workflow-visualization':    '#FFEA46',
  },

  mako: {
    'bushcraft':                 '#03051A',
    'compliance':                '#130D25',
    'containerization':          '#241432',
    'data-serialization':        '#36193E',
    'defensive':                 '#491D48',
    'design':                    '#5C1E51',
    'devops':                    '#701F57',
    'esoteric':                  '#841E5A',
    'general':                   '#981B5B',
    'git':                       '#AE1759',
    'jigsawr':                   '#C11754',
    'mcp-integration':           '#D2214C',
    'mlops':                     '#E13342',
    'morphic':                   '#EB483E',
    'observability':             '#F06043',
    'project-management':        '#F37651',
    'r-packages':                '#F58B63',
    'reporting':                 '#F6A077',
    'review':                    '#F6B48E',
    'swarm':                     '#F7C7A7',
    'web-dev':                   '#F8D9C3',
    'workflow-visualization':    '#FAEBDD',
  },

  rocket: {
    'bushcraft':                 '#0B0405',
    'compliance':                '#180D16',
    'containerization':          '#241628',
    'data-serialization':        '#2E1E3C',
    'defensive':                 '#372850',
    'design':                    '#3D3266',
    'devops':                    '#413D7B',
    'esoteric':                  '#40498E',
    'general':                   '#3B5799',
    'git':                       '#37659E',
    'jigsawr':                   '#3573A1',
    'mcp-integration':           '#3481A4',
    'mlops':                     '#348FA7',
    'morphic':                   '#359CAA',
    'observability':             '#38AAAC',
    'project-management':        '#40B7AD',
    'r-packages':                '#4EC4AD',
    'reporting':                 '#66D0AD',
    'review':                    '#8AD9B1',
    'swarm':                     '#AAE2BE',
    'web-dev':                   '#C6EBD1',
    'workflow-visualization':    '#DEF5E5',
  },

  turbo: {
    'bushcraft':                 '#30123B',
    'compliance':                '#3D358C',
    'containerization':          '#4457C8',
    'data-serialization':        '#4777EF',
    'defensive':                 '#4195FF',
    'design':                    '#2EB3F3',
    'devops':                    '#1BD0D5',
    'esoteric':                  '#1AE4B6',
    'general':                   '#35F393',
    'git':                       '#62FC6B',
    'jigsawr':                   '#90FF48',
    'mcp-integration':           '#B3F836',
    'mlops':                     '#D2E935',
    'morphic':                   '#EBD339',
    'observability':             '#FABA39',
    'project-management':        '#FE9B2D',
    'r-packages':                '#F9771E',
    'reporting':                 '#EC5410',
    'review':                    '#DB3A07',
    'swarm':                     '#C22402',
    'web-dev':                   '#A11201',
    'workflow-visualization':    '#7A0403',
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

// ── Per-agent per-palette colors ─────────────────────────────────
const AGENT_PALETTE_COLORS = {
  cyberpunk: {
    'auditor':                       '#ff7744',
    'code-reviewer':                 '#ff66aa',
    'designer':                      '#ff88dd',
    'devops-engineer':               '#00ff88',
    'gxp-validator':                 '#ff3399',
    'jigsawr-developer':             '#22ddaa',
    'martial-artist':                '#ff4466',
    'mlops-engineer':                '#bb77ff',
    'mystic':                        '#dd44ff',
    'project-manager':               '#ff8844',
    'putior-integrator':             '#66dd88',
    'r-developer':                   '#00f0ff',
    'security-analyst':              '#ff3333',
    'senior-data-scientist':         '#aa66ff',
    'senior-researcher':             '#ffaa00',
    'senior-software-developer':     '#44ddff',
    'senior-ux-ui-specialist':       '#66ffcc',
    'senior-web-designer':           '#ffdd00',
    'shapeshifter':                  '#bb88ff',
    'survivalist':                   '#88cc44',
    'swarm-strategist':              '#aadd44',
    'web-developer':                 '#ff6633',
  },

  viridis: {
    'auditor':                       '#482576',
    'code-reviewer':                 '#46307E',
    'designer':                      '#433D84',
    'devops-engineer':               '#3F4889',
    'gxp-validator':                 '#3B528B',
    'jigsawr-developer':             '#365D8D',
    'martial-artist':                '#31678E',
    'mlops-engineer':                '#2D718E',
    'mystic':                        '#29798E',
    'project-manager':               '#26828E',
    'putior-integrator':             '#228C8D',
    'r-developer':                   '#1F948C',
    'security-analyst':              '#1F9E89',
    'senior-data-scientist':         '#22A785',
    'senior-researcher':             '#29AF7F',
    'senior-software-developer':     '#37B878',
    'senior-ux-ui-specialist':       '#48C16E',
    'senior-web-designer':           '#5BC863',
    'shapeshifter':                  '#71CF57',
    'survivalist':                   '#89D548',
    'swarm-strategist':              '#A2DA37',
    'web-developer':                 '#BBDF27',
  },

  magma: {
    'auditor':                       '#150E37',
    'code-reviewer':                 '#21114E',
    'designer':                      '#311165',
    'devops-engineer':               '#410F75',
    'gxp-validator':                 '#51127C',
    'jigsawr-developer':             '#601880',
    'martial-artist':                '#6F1F81',
    'mlops-engineer':                '#7F2582',
    'mystic':                        '#8F2A81',
    'project-manager':               '#9E2F7F',
    'putior-integrator':             '#AE347B',
    'r-developer':                   '#BE3977',
    'security-analyst':              '#CD4071',
    'senior-data-scientist':         '#DC4869',
    'senior-researcher':             '#E85362',
    'senior-software-developer':     '#F2625D',
    'senior-ux-ui-specialist':       '#F8745C',
    'senior-web-designer':           '#FB8661',
    'shapeshifter':                  '#FD9969',
    'survivalist':                   '#FEAA74',
    'swarm-strategist':              '#FEBD82',
    'web-developer':                 '#FECE91',
  },

  inferno: {
    'auditor':                       '#170C3A',
    'code-reviewer':                 '#260C51',
    'designer':                      '#380962',
    'devops-engineer':               '#480B6A',
    'gxp-validator':                 '#58106E',
    'jigsawr-developer':             '#67166E',
    'martial-artist':                '#771C6D',
    'mlops-engineer':                '#86216B',
    'mystic':                        '#962667',
    'project-manager':               '#A52C60',
    'putior-integrator':             '#B43359',
    'r-developer':                   '#C23A50',
    'security-analyst':              '#CF4446',
    'senior-data-scientist':         '#DB503B',
    'senior-researcher':             '#E65D30',
    'senior-software-developer':     '#EE6A24',
    'senior-ux-ui-specialist':       '#F57B17',
    'senior-web-designer':           '#F98C0A',
    'shapeshifter':                  '#FB9E07',
    'survivalist':                   '#FCB014',
    'swarm-strategist':              '#FAC429',
    'web-developer':                 '#F6D645',
  },

  plasma: {
    'auditor':                       '#42049E',
    'code-reviewer':                 '#5102A3',
    'designer':                      '#6100A7',
    'devops-engineer':               '#7000A8',
    'gxp-validator':                 '#7F03A8',
    'jigsawr-developer':             '#8D0BA5',
    'martial-artist':                '#9A169F',
    'mlops-engineer':                '#A62098',
    'mystic':                        '#B22B8F',
    'project-manager':               '#BD3786',
    'putior-integrator':             '#C7427C',
    'r-developer':                   '#CF4C74',
    'security-analyst':              '#D8576B',
    'senior-data-scientist':         '#E06363',
    'senior-researcher':             '#E76F5B',
    'senior-software-developer':     '#ED7A52',
    'senior-ux-ui-specialist':       '#F3874A',
    'senior-web-designer':           '#F89441',
    'shapeshifter':                  '#FBA139',
    'survivalist':                   '#FDAF31',
    'swarm-strategist':              '#FEBE2A',
    'web-developer':                 '#FCCE25',
  },

  cividis: {
    'auditor':                       '#00326F',
    'code-reviewer':                 '#13386D',
    'designer':                      '#28406C',
    'devops-engineer':               '#36476B',
    'gxp-validator':                 '#414D6B',
    'jigsawr-developer':             '#4C546C',
    'martial-artist':                '#565C6D',
    'mlops-engineer':                '#5F636E',
    'mystic':                        '#676970',
    'project-manager':               '#707173',
    'putior-integrator':             '#787877',
    'r-developer':                   '#817F79',
    'security-analyst':              '#8A8779',
    'senior-data-scientist':         '#948E78',
    'senior-researcher':             '#9E9677',
    'senior-software-developer':     '#A89E75',
    'senior-ux-ui-specialist':       '#B2A672',
    'senior-web-designer':           '#BCAF6F',
    'shapeshifter':                  '#C6B66B',
    'survivalist':                   '#D1BF66',
    'swarm-strategist':              '#DCC860',
    'web-developer':                 '#E7D159',
  },

  mako: {
    'auditor':                       '#261433',
    'code-reviewer':                 '#34193D',
    'designer':                      '#431C46',
    'devops-engineer':               '#521E4D',
    'gxp-validator':                 '#621F53',
    'jigsawr-developer':             '#711F57',
    'martial-artist':                '#821E5A',
    'mlops-engineer':                '#931C5B',
    'mystic':                        '#A3195B',
    'project-manager':               '#B41658',
    'putior-integrator':             '#C31753',
    'r-developer':                   '#D11F4C',
    'security-analyst':              '#DD2C45',
    'senior-data-scientist':         '#E73D3F',
    'senior-researcher':             '#ED4F3E',
    'senior-software-developer':     '#F16244',
    'senior-ux-ui-specialist':       '#F37450',
    'senior-web-designer':           '#F4855E',
    'shapeshifter':                  '#F5966D',
    'survivalist':                   '#F6A67E',
    'swarm-strategist':              '#F6B591',
    'web-developer':                 '#F7C5A5',
  },

  rocket: {
    'auditor':                       '#26172A',
    'code-reviewer':                 '#2E1E39',
    'designer':                      '#35254A',
    'devops-engineer':               '#3B2D5A',
    'gxp-validator':                 '#3E356C',
    'jigsawr-developer':             '#413E7D',
    'martial-artist':                '#40488D',
    'mlops-engineer':                '#3D5297',
    'mystic':                        '#395E9C',
    'project-manager':               '#366A9F',
    'putior-integrator':             '#3575A1',
    'r-developer':                   '#347FA4',
    'security-analyst':              '#348BA6',
    'senior-data-scientist':         '#3496A9',
    'senior-researcher':             '#35A1AB',
    'senior-software-developer':     '#39ABAC',
    'senior-ux-ui-specialist':       '#3FB6AD',
    'senior-web-designer':           '#49C1AD',
    'shapeshifter':                  '#58CBAD',
    'survivalist':                   '#70D4AD',
    'swarm-strategist':              '#8DDBB3',
    'web-developer':                 '#A8E1BC',
  },

  turbo: {
    'auditor':                       '#455BCD',
    'code-reviewer':                 '#4774EC',
    'designer':                      '#458CFD',
    'devops-engineer':               '#39A4FB',
    'gxp-validator':                 '#28BDEA',
    'jigsawr-developer':             '#1AD2D2',
    'martial-artist':                '#19E3BA',
    'mlops-engineer':                '#2BEFA0',
    'mystic':                        '#4BF87F',
    'project-manager':               '#71FE5F',
    'putior-integrator':             '#95FE45',
    'r-developer':                   '#B0FA37',
    'security-analyst':              '#C8EF34',
    'senior-data-scientist':         '#DFDF37',
    'senior-researcher':             '#F0CC3A',
    'senior-software-developer':     '#FBB838',
    'senior-ux-ui-specialist':       '#FE9E2F',
    'senior-web-designer':           '#FB8222',
    'shapeshifter':                  '#F46516',
    'survivalist':                   '#E84B0C',
    'swarm-strategist':              '#D83706',
    'web-developer':                 '#C42503',
  },
};

export function getAgentColor(agentId) {
  if (agentId && AGENT_PALETTE_COLORS[currentTheme]?.[agentId]) {
    return AGENT_PALETTE_COLORS[currentTheme][agentId];
  }
  // Fallback: first agent color in current palette, or gold
  const colors = AGENT_PALETTE_COLORS[currentTheme];
  if (colors) {
    const vals = Object.values(colors);
    return vals[0] || '#ffd700';
  }
  return '#ffd700';
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
