/**
 * colors.js - Theme palette system with 9 switchable colormaps
 *
 * Provides: getColor, setTheme, getCurrentPalette, getThemeNames
 * Backward compat: DOMAIN_COLORS Proxy delegates to active palette
 */

// ── Domain order (alphabetical) for consistent palette assignment ──
const DOMAIN_ORDER = [
  'alchemy',
  'bushcraft',
  'compliance',
  'containerization',
  'data-serialization',
  'defensive',
  'design',
  'devops',
  'esoteric',
  'gardening',
  'general',
  'git',
  'intellectual-property',
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
  'tcg',
  'web-dev',
  'workflow-visualization',
];

// ── 9 named palettes: one hex color per domain (22 domains) ────────
const PALETTES = {
  cyberpunk: {
    'alchemy':                   '#ffaa33',
    'bushcraft':                 '#88cc44',
    'compliance':                '#ff3366',
    'containerization':          '#44ddff',
    'data-serialization':        '#44aaff',
    'defensive':                 '#ff4444',
    'design':                    '#ff88dd',
    'devops':                    '#00ff88',
    'esoteric':                  '#dd44ff',
    'gardening':                 '#44bb66',
    'general':                   '#ccccff',
    'git':                       '#66ffcc',
    'intellectual-property':     '#33ccff',
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
    'tcg':                       '#ff5577',
    'web-dev':                   '#ff6633',
    'workflow-visualization':    '#66dd88',
  },

  viridis: {
    'alchemy':                   '#440154',
    'bushcraft':                 '#471063',
    'compliance':                '#481E6F',
    'containerization':          '#472B7A',
    'data-serialization':        '#453882',
    'defensive':                 '#414487',
    'design':                    '#3C4F8A',
    'devops':                    '#375A8C',
    'esoteric':                  '#32658E',
    'gardening':                 '#2E6F8E',
    'general':                   '#2A788E',
    'git':                       '#26828E',
    'intellectual-property':     '#228B8D',
    'jigsawr':                   '#1F958B',
    'mcp-integration':           '#1F9F88',
    'mlops':                     '#22A884',
    'morphic':                   '#2CB17E',
    'observability':             '#3ABA76',
    'project-management':        '#4DC36B',
    'r-packages':                '#62CB5F',
    'reporting':                 '#7AD151',
    'review':                    '#93D741',
    'swarm':                     '#AEDC30',
    'tcg':                       '#C9E120',
    'web-dev':                   '#E5E419',
    'workflow-visualization':    '#FDE725',
  },

  magma: {
    'alchemy':                   '#000004',
    'bushcraft':                 '#050416',
    'compliance':                '#0F0B2C',
    'containerization':          '#1B1043',
    'data-serialization':        '#2A115C',
    'defensive':                 '#3B0F70',
    'design':                    '#4C117A',
    'devops':                    '#5C167F',
    'esoteric':                  '#6C1D81',
    'gardening':                 '#7C2382',
    'general':                   '#8C2981',
    'git':                       '#9C2E7F',
    'intellectual-property':     '#AD347C',
    'jigsawr':                   '#BE3A77',
    'mcp-integration':           '#CF4070',
    'mlops':                     '#DE4968',
    'morphic':                   '#EA5661',
    'observability':             '#F4665C',
    'project-management':        '#F9795D',
    'r-packages':                '#FC8C63',
    'reporting':                 '#FE9F6D',
    'review':                    '#FEB27A',
    'swarm':                     '#FEC589',
    'tcg':                       '#FED89A',
    'web-dev':                   '#FDEBAC',
    'workflow-visualization':    '#FCFDBF',
  },

  inferno: {
    'alchemy':                   '#000004',
    'bushcraft':                 '#050417',
    'compliance':                '#11092E',
    'containerization':          '#1F0C47',
    'data-serialization':        '#310A5C',
    'defensive':                 '#420A68',
    'design':                    '#520E6D',
    'devops':                    '#63156E',
    'esoteric':                  '#731A6E',
    'gardening':                 '#84206B',
    'general':                   '#932667',
    'git':                       '#A32C61',
    'intellectual-property':     '#B3325A',
    'jigsawr':                   '#C23B4F',
    'mcp-integration':           '#D04545',
    'mlops':                     '#DD513A',
    'morphic':                   '#E75E2E',
    'observability':             '#EF6E20',
    'project-management':        '#F67F13',
    'r-packages':                '#FA9207',
    'reporting':                 '#FCA50A',
    'review':                    '#FBB81D',
    'swarm':                     '#F9CC36',
    'tcg':                       '#F4E055',
    'web-dev':                   '#F2F27C',
    'workflow-visualization':    '#FCFFA4',
  },

  plasma: {
    'alchemy':                   '#0D0887',
    'bushcraft':                 '#260591',
    'compliance':                '#39049A',
    'containerization':          '#4A03A1',
    'data-serialization':        '#5B01A5',
    'defensive':                 '#6A00A8',
    'design':                    '#7A02A8',
    'devops':                    '#8908A6',
    'esoteric':                  '#9714A1',
    'gardening':                 '#A51F99',
    'general':                   '#B12A90',
    'git':                       '#BC3587',
    'intellectual-property':     '#C6417D',
    'jigsawr':                   '#D04D73',
    'mcp-integration':           '#D9586A',
    'mlops':                     '#E16462',
    'morphic':                   '#E87059',
    'observability':             '#EF7D51',
    'project-management':        '#F58A47',
    'r-packages':                '#F9983E',
    'reporting':                 '#FCA636',
    'review':                    '#FDB52E',
    'swarm':                     '#FDC527',
    'tcg':                       '#FBD624',
    'web-dev':                   '#F6E826',
    'workflow-visualization':    '#F0F921',
  },

  cividis: {
    'alchemy':                   '#00204D',
    'bushcraft':                 '#00275E',
    'compliance':                '#002E6F',
    'containerization':          '#00366E',
    'data-serialization':        '#213D6D',
    'defensive':                 '#31446B',
    'design':                    '#3E4B6B',
    'devops':                    '#49526B',
    'esoteric':                  '#545A6C',
    'gardening':                 '#5D616E',
    'general':                   '#666970',
    'git':                       '#6F7073',
    'intellectual-property':     '#787777',
    'jigsawr':                   '#828079',
    'mcp-integration':           '#8B8779',
    'mlops':                     '#958F78',
    'morphic':                   '#9F9777',
    'observability':             '#AA9F75',
    'project-management':        '#B5A971',
    'r-packages':                '#C0B16E',
    'reporting':                 '#CBBA69',
    'review':                    '#D6C364',
    'swarm':                     '#E1CC5D',
    'tcg':                       '#ECD654',
    'web-dev':                   '#F9E04A',
    'workflow-visualization':    '#FFEA46',
  },

  mako: {
    'alchemy':                   '#03051A',
    'bushcraft':                 '#100B23',
    'compliance':                '#1F122D',
    'containerization':          '#2E1739',
    'data-serialization':        '#3D1A42',
    'defensive':                 '#4C1D4B',
    'design':                    '#5C1E51',
    'devops':                    '#6D1F56',
    'esoteric':                  '#7E1E5A',
    'gardening':                 '#901D5B',
    'general':                   '#A11A5B',
    'git':                       '#B21758',
    'intellectual-property':     '#C31753',
    'jigsawr':                   '#D2204C',
    'mcp-integration':           '#DE2E44',
    'mlops':                     '#E83F3F',
    'morphic':                   '#EE523F',
    'observability':             '#F16646',
    'project-management':        '#F47953',
    'r-packages':                '#F58B63',
    'reporting':                 '#F69C73',
    'review':                    '#F6AD85',
    'swarm':                     '#F6BD9A',
    'tcg':                       '#F7CDB0',
    'web-dev':                   '#F8DCC7',
    'workflow-visualization':    '#FAEBDD',
  },

  rocket: {
    'alchemy':                   '#0B0405',
    'bushcraft':                 '#160B13',
    'compliance':                '#201322',
    'containerization':          '#2A1B32',
    'data-serialization':        '#322243',
    'defensive':                 '#382A54',
    'design':                    '#3D3266',
    'devops':                    '#403B78',
    'esoteric':                  '#404589',
    'gardening':                 '#3D5195',
    'general':                   '#395D9C',
    'git':                       '#36699F',
    'intellectual-property':     '#3574A1',
    'jigsawr':                   '#347FA4',
    'mcp-integration':           '#348CA7',
    'mlops':                     '#3497A9',
    'morphic':                   '#36A2AB',
    'observability':             '#3AADAC',
    'project-management':        '#42B9AD',
    'r-packages':                '#4DC4AD',
    'reporting':                 '#60CEAC',
    'review':                    '#7DD6AF',
    'swarm':                     '#9ADDB6',
    'tcg':                       '#B4E4C3',
    'web-dev':                   '#CAEDD4',
    'workflow-visualization':    '#DEF5E5',
  },

  turbo: {
    'alchemy':                   '#30123B',
    'bushcraft':                 '#3B3081',
    'compliance':                '#424CB7',
    'containerization':          '#4668DF',
    'data-serialization':        '#4682F8',
    'defensive':                 '#3E9BFE',
    'design':                    '#2EB5F2',
    'devops':                    '#1DCCD9',
    'esoteric':                  '#18DFBE',
    'gardening':                 '#27EEA5',
    'general':                   '#46F884',
    'git':                       '#6EFE61',
    'intellectual-property':     '#94FF46',
    'jigsawr':                   '#B0F936',
    'mcp-integration':           '#CAED34',
    'mlops':                     '#E1DD37',
    'morphic':                   '#F2C93A',
    'observability':             '#FCB236',
    'project-management':        '#FE972B',
    'r-packages':                '#F9791E',
    'reporting':                 '#F05B12',
    'review':                    '#E2430A',
    'swarm':                     '#CF2E05',
    'tcg':                       '#B81D02',
    'web-dev':                   '#9C0F01',
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

const _rgbaCache = new Map();
export function hexToRgba(hex, alpha) {
  const key = hex + '|' + alpha;
  let val = _rgbaCache.get(key);
  if (val !== undefined) return val;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  val = `rgba(${r},${g},${b},${alpha})`;
  _rgbaCache.set(key, val);
  return val;
}
