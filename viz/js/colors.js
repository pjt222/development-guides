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
    'bushcraft':                 '#471164',
    'compliance':                '#481F70',
    'containerization':          '#472D7B',
    'data-serialization':        '#443A83',
    'defensive':                 '#404688',
    'design':                    '#3B528B',
    'devops':                    '#365D8D',
    'esoteric':                  '#31688E',
    'general':                   '#2C728E',
    'git':                       '#287C8E',
    'intellectual-property':     '#24868E',
    'jigsawr':                   '#21908C',
    'mcp-integration':           '#1F9A8A',
    'mlops':                     '#20A486',
    'morphic':                   '#27AD81',
    'observability':             '#35B779',
    'project-management':        '#47C16E',
    'r-packages':                '#5DC863',
    'reporting':                 '#75D054',
    'review':                    '#8FD744',
    'swarm':                     '#AADC32',
    'tcg':                       '#C7E020',
    'web-dev':                   '#E3E418',
    'workflow-visualization':    '#FDE725',
  },

  magma: {
    'alchemy':                   '#000004',
    'bushcraft':                 '#060517',
    'compliance':                '#100B2E',
    'containerization':          '#1D1147',
    'data-serialization':        '#2D1160',
    'defensive':                 '#3F0F72',
    'design':                    '#51127C',
    'devops':                    '#611880',
    'esoteric':                  '#721F81',
    'general':                   '#822681',
    'git':                       '#932B80',
    'intellectual-property':     '#A5317E',
    'jigsawr':                   '#B63679',
    'mcp-integration':           '#C73D73',
    'mlops':                     '#D8456C',
    'morphic':                   '#E65164',
    'observability':             '#F1605D',
    'project-management':        '#F8735C',
    'r-packages':                '#FB8861',
    'reporting':                 '#FD9B6B',
    'review':                    '#FEAF77',
    'swarm':                     '#FEC287',
    'tcg':                       '#FED799',
    'web-dev':                   '#FDEAAB',
    'workflow-visualization':    '#FCFDBF',
  },

  inferno: {
    'alchemy':                   '#000004',
    'bushcraft':                 '#060418',
    'compliance':                '#110A31',
    'containerization':          '#210C4A',
    'data-serialization':        '#330A5F',
    'defensive':                 '#450A69',
    'design':                    '#56106E',
    'devops':                    '#68166E',
    'esoteric':                  '#781C6D',
    'general':                   '#89226A',
    'git':                       '#9A2865',
    'intellectual-property':     '#AB2F5E',
    'jigsawr':                   '#BB3754',
    'mcp-integration':           '#CA404A',
    'mlops':                     '#D84C3E',
    'morphic':                   '#E35932',
    'observability':             '#ED6925',
    'project-management':        '#F57A18',
    'r-packages':                '#F98C0A',
    'reporting':                 '#FCA108',
    'review':                    '#FCB519',
    'swarm':                     '#F9C932',
    'tcg':                       '#F4DE52',
    'web-dev':                   '#F1F17A',
    'workflow-visualization':    '#FCFFA4',
  },

  plasma: {
    'alchemy':                   '#0D0887',
    'bushcraft':                 '#270592',
    'compliance':                '#3B049A',
    'containerization':          '#4C02A1',
    'data-serialization':        '#5D01A6',
    'defensive':                 '#6E00A8',
    'design':                    '#7E03A8',
    'devops':                    '#8E0BA5',
    'esoteric':                  '#9C179E',
    'general':                   '#A92395',
    'git':                       '#B52F8C',
    'intellectual-property':     '#C13B82',
    'jigsawr':                   '#CC4678',
    'mcp-integration':           '#D5536F',
    'mlops':                     '#DE5F65',
    'morphic':                   '#E56B5D',
    'observability':             '#ED7953',
    'project-management':        '#F3864A',
    'r-packages':                '#F89441',
    'reporting':                 '#FCA338',
    'review':                    '#FDB32F',
    'swarm':                     '#FDC328',
    'tcg':                       '#FBD424',
    'web-dev':                   '#F6E726',
    'workflow-visualization':    '#F0F921',
  },

  cividis: {
    'alchemy':                   '#00204D',
    'bushcraft':                 '#00285F',
    'compliance':                '#002F6F',
    'containerization':          '#05366E',
    'data-serialization':        '#233E6C',
    'defensive':                 '#34456B',
    'design':                    '#414D6B',
    'devops':                    '#4C546C',
    'esoteric':                  '#575C6D',
    'general':                   '#61646F',
    'git':                       '#6A6C71',
    'intellectual-property':     '#737475',
    'jigsawr':                   '#7C7B78',
    'mcp-integration':           '#868379',
    'mlops':                     '#918C78',
    'morphic':                   '#9B9477',
    'observability':             '#A69D75',
    'project-management':        '#B2A672',
    'r-packages':                '#BCAF6F',
    'reporting':                 '#C8B86A',
    'review':                    '#D3C164',
    'swarm':                     '#E0CB5E',
    'tcg':                       '#ECD555',
    'web-dev':                   '#F8DF4B',
    'workflow-visualization':    '#FFEA46',
  },

  mako: {
    'alchemy':                   '#03051A',
    'bushcraft':                 '#110C24',
    'compliance':                '#20122E',
    'containerization':          '#30173A',
    'data-serialization':        '#3F1B44',
    'defensive':                 '#501D4C',
    'design':                    '#611F53',
    'devops':                    '#721F57',
    'esoteric':                  '#841E5A',
    'general':                   '#961C5B',
    'git':                       '#A9185A',
    'intellectual-property':     '#BA1656',
    'jigsawr':                   '#CB1B4F',
    'mcp-integration':           '#D82748',
    'mlops':                     '#E43841',
    'morphic':                   '#EC4B3E',
    'observability':             '#F06043',
    'project-management':        '#F3744F',
    'r-packages':                '#F4875E',
    'reporting':                 '#F59970',
    'review':                    '#F6AA82',
    'swarm':                     '#F6BB97',
    'tcg':                       '#F7CCAE',
    'web-dev':                   '#F8DBC6',
    'workflow-visualization':    '#FAEBDD',
  },

  rocket: {
    'alchemy':                   '#0B0405',
    'bushcraft':                 '#170C14',
    'compliance':                '#211423',
    'containerization':          '#2B1C35',
    'data-serialization':        '#342346',
    'defensive':                 '#3A2C58',
    'design':                    '#3E356B',
    'devops':                    '#413E7E',
    'esoteric':                  '#40498E',
    'general':                   '#3B5698',
    'git':                       '#38629D',
    'intellectual-property':     '#366FA0',
    'jigsawr':                   '#357BA2',
    'mcp-integration':           '#3486A5',
    'mlops':                     '#3492A8',
    'morphic':                   '#359EAA',
    'observability':             '#38AAAC',
    'project-management':        '#3FB6AD',
    'r-packages':                '#49C1AD',
    'reporting':                 '#5BCDAD',
    'review':                    '#78D6AE',
    'swarm':                     '#96DDB5',
    'tcg':                       '#B1E4C2',
    'web-dev':                   '#C9ECD3',
    'workflow-visualization':    '#DEF5E5',
  },

  turbo: {
    'alchemy':                   '#30123B',
    'bushcraft':                 '#3C3184',
    'compliance':                '#434FBB',
    'containerization':          '#466BE3',
    'data-serialization':        '#4686FB',
    'defensive':                 '#3BA0FD',
    'design':                    '#28BBEC',
    'devops':                    '#1AD3D1',
    'esoteric':                  '#1AE4B6',
    'general':                   '#31F299',
    'git':                       '#56FA75',
    'intellectual-property':     '#80FF53',
    'jigsawr':                   '#A2FC3C',
    'mcp-integration':           '#BEF434',
    'mlops':                     '#D9E436',
    'morphic':                   '#EDD03A',
    'observability':             '#FABA39',
    'project-management':        '#FE9F2F',
    'r-packages':                '#FB8022',
    'reporting':                 '#F26014',
    'review':                    '#E4460A',
    'swarm':                     '#D23105',
    'tcg':                       '#BA1E02',
    'web-dev':                   '#9D1001',
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
