/**
 * colors.js - Theme palette system with 9 switchable colormaps
 *
 * Provides: getColor, setTheme, getCurrentPalette, getThemeNames
 * Backward compat: DOMAIN_COLORS Proxy delegates to active palette
 */

// ── Domain order (alphabetical) for consistent palette assignment ──
const DOMAIN_ORDER = [
  'alchemy',
  'animal-training',
  'bushcraft',
  'compliance',
  'containerization',
  'crafting',
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
  'library-science',
  'mcp-integration',
  'mlops',
  'morphic',
  'mycology',
  'observability',
  'project-management',
  'prospecting',
  'r-packages',
  'reporting',
  'review',
  'shiny',
  'swarm',
  'tcg',
  'web-dev',
  'workflow-visualization',
];

// ── 9 named palettes: one hex color per domain (22 domains) ────────
const PALETTES = {
  cyberpunk: {
    'alchemy':                   '#ffaa33',
    'animal-training':           '#ff9944',
    'bushcraft':                 '#88cc44',
    'compliance':                '#ff3366',
    'containerization':          '#44ddff',
    'crafting':                  '#cc8855',
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
    'library-science':           '#8B7355',
    'mcp-integration':           '#00ccaa',
    'mlops':                     '#aa66ff',
    'morphic':                   '#bb88ff',
    'mycology':                  '#aa77cc',
    'observability':             '#ffaa00',
    'project-management':        '#ff8844',
    'prospecting':               '#ddaa33',
    'r-packages':                '#00f0ff',
    'reporting':                 '#ffdd00',
    'review':                    '#ff66aa',
    'shiny':                     '#3399ff',
    'swarm':                     '#aadd44',
    'tcg':                       '#ff5577',
    'web-dev':                   '#ff6633',
    'workflow-visualization':    '#66dd88',
  },

  viridis: {
    'alchemy':                   '#440154',
    'animal-training':           '#470D60',
    'bushcraft':                 '#48196B',
    'compliance':                '#482475',
    'containerization':          '#472E7C',
    'crafting':                  '#453882',
    'data-serialization':        '#424186',
    'defensive':                 '#3E4B8A',
    'design':                    '#3A548C',
    'devops':                    '#365D8D',
    'esoteric':                  '#32658E',
    'gardening':                 '#2E6D8E',
    'general':                   '#2B758E',
    'git':                       '#287D8E',
    'intellectual-property':     '#25848E',
    'jigsawr':                   '#228C8D',
    'library-science':           '#1F948C',
    'mcp-integration':           '#1E9C89',
    'mlops':                     '#20A386',
    'morphic':                   '#25AB82',
    'mycology':                  '#2EB37C',
    'observability':             '#3ABA76',
    'project-management':        '#48C16E',
    'prospecting':               '#58C765',
    'r-packages':                '#6ACD5B',
    'reporting':                 '#7ED34F',
    'review':                    '#93D741',
    'shiny':                     '#A8DB34',
    'swarm':                     '#BEDF26',
    'tcg':                       '#D4E21A',
    'web-dev':                   '#E9E51A',
    'workflow-visualization':    '#FDE725',
  },

  magma: {
    'alchemy':                   '#000004',
    'animal-training':           '#030313',
    'bushcraft':                 '#0A0923',
    'compliance':                '#140E35',
    'containerization':          '#1E1149',
    'crafting':                  '#2A115C',
    'data-serialization':        '#38106D',
    'defensive':                 '#461078',
    'design':                    '#54137D',
    'devops':                    '#601880',
    'esoteric':                  '#6D1D81',
    'gardening':                 '#7A2282',
    'general':                   '#882781',
    'git':                       '#942C80',
    'intellectual-property':     '#A1307E',
    'jigsawr':                   '#AF347B',
    'library-science':           '#BD3977',
    'mcp-integration':           '#CA3E72',
    'mlops':                     '#D6456C',
    'morphic':                   '#E24D66',
    'mycology':                  '#EC5760',
    'observability':             '#F3655C',
    'project-management':        '#F8745C',
    'prospecting':               '#FB835F',
    'r-packages':                '#FD9366',
    'reporting':                 '#FEA26F',
    'review':                    '#FEB27A',
    'shiny':                     '#FEC185',
    'swarm':                     '#FED093',
    'tcg':                       '#FDDFA1',
    'web-dev':                   '#FCEEB0',
    'workflow-visualization':    '#FCFDBF',
  },

  inferno: {
    'alchemy':                   '#000004',
    'animal-training':           '#040312',
    'bushcraft':                 '#0B0725',
    'compliance':                '#160B38',
    'containerization':          '#230C4C',
    'crafting':                  '#310A5C',
    'data-serialization':        '#3F0966',
    'defensive':                 '#4D0D6C',
    'design':                    '#5A116E',
    'devops':                    '#67166E',
    'esoteric':                  '#741A6E',
    'gardening':                 '#81206C',
    'general':                   '#8E2469',
    'git':                       '#9B2964',
    'intellectual-property':     '#A82E5F',
    'jigsawr':                   '#B53359',
    'library-science':           '#C03A50',
    'mcp-integration':           '#CC4248',
    'mlops':                     '#D74B3F',
    'morphic':                   '#E05536',
    'mycology':                  '#E9602C',
    'observability':             '#EF6E21',
    'project-management':        '#F57B17',
    'prospecting':               '#F8890C',
    'r-packages':                '#FB9806',
    'reporting':                 '#FCA70D',
    'review':                    '#FBB81D',
    'shiny':                     '#F9C72F',
    'swarm':                     '#F6D847',
    'tcg':                       '#F2E763',
    'web-dev':                   '#F3F585',
    'workflow-visualization':    '#FCFFA4',
  },

  plasma: {
    'alchemy':                   '#0D0887',
    'animal-training':           '#220690',
    'bushcraft':                 '#320597',
    'compliance':                '#40049D',
    'containerization':          '#4E02A2',
    'crafting':                  '#5B01A5',
    'data-serialization':        '#6800A8',
    'defensive':                 '#7501A8',
    'design':                    '#8104A7',
    'devops':                    '#8D0BA5',
    'esoteric':                  '#9814A0',
    'gardening':                 '#A21E9A',
    'general':                   '#AD2793',
    'git':                       '#B6308B',
    'intellectual-property':     '#BF3984',
    'jigsawr':                   '#C7427C',
    'library-science':           '#CF4C74',
    'mcp-integration':           '#D6556D',
    'mlops':                     '#DD5E66',
    'morphic':                   '#E3685F',
    'mycology':                  '#E97157',
    'observability':             '#EF7C51',
    'project-management':        '#F3874A',
    'prospecting':               '#F79143',
    'r-packages':                '#FA9D3C',
    'reporting':                 '#FCA934',
    'review':                    '#FDB52E',
    'shiny':                     '#FDC229',
    'swarm':                     '#FCCF25',
    'tcg':                       '#F9DD25',
    'web-dev':                   '#F5EA27',
    'workflow-visualization':    '#F0F921',
  },

  cividis: {
    'alchemy':                   '#00204D',
    'animal-training':           '#00265A',
    'bushcraft':                 '#002C69',
    'compliance':                '#00316F',
    'containerization':          '#0B376E',
    'crafting':                  '#213D6D',
    'data-serialization':        '#2F436C',
    'defensive':                 '#3A486B',
    'design':                    '#434F6B',
    'devops':                    '#4C546C',
    'esoteric':                  '#545A6C',
    'gardening':                 '#5B616E',
    'general':                   '#64666F',
    'git':                       '#6B6C71',
    'intellectual-property':     '#727274',
    'jigsawr':                   '#787877',
    'library-science':           '#817F79',
    'mcp-integration':           '#888579',
    'mlops':                     '#908B79',
    'morphic':                   '#989278',
    'mycology':                  '#A19876',
    'observability':             '#AA9F75',
    'project-management':        '#B2A672',
    'prospecting':               '#BAAD70',
    'r-packages':                '#C3B56D',
    'reporting':                 '#CDBC68',
    'review':                    '#D6C364',
    'shiny':                     '#DECA5F',
    'swarm':                     '#E8D259',
    'tcg':                       '#F2DA50',
    'web-dev':                   '#FBE248',
    'workflow-visualization':    '#FFEA46',
  },

  mako: {
    'alchemy':                   '#03051A',
    'animal-training':           '#0D0A21',
    'bushcraft':                 '#190F29',
    'compliance':                '#251433',
    'containerization':          '#31183B',
    'crafting':                  '#3D1A42',
    'data-serialization':        '#4A1D49',
    'defensive':                 '#571E4F',
    'design':                    '#641F54',
    'devops':                    '#711F57',
    'esoteric':                  '#801E5A',
    'gardening':                 '#8D1D5B',
    'general':                   '#9B1B5B',
    'git':                       '#AA185A',
    'intellectual-property':     '#B71657',
    'jigsawr':                   '#C41753',
    'library-science':           '#D01F4C',
    'mcp-integration':           '#DB2946',
    'mlops':                     '#E33641',
    'morphic':                   '#EA453E',
    'mycology':                  '#EE5540',
    'observability':             '#F16646',
    'project-management':        '#F37450',
    'prospecting':               '#F4835B',
    'r-packages':                '#F59168',
    'reporting':                 '#F69F76',
    'review':                    '#F6AD85',
    'shiny':                     '#F6B995',
    'swarm':                     '#F7C6A7',
    'tcg':                       '#F8D2B9',
    'web-dev':                   '#F9DFCB',
    'workflow-visualization':    '#FAEBDD',
  },

  rocket: {
    'alchemy':                   '#0B0405',
    'animal-training':           '#140910',
    'bushcraft':                 '#1C111C',
    'compliance':                '#251729',
    'containerization':          '#2C1C36',
    'crafting':                  '#322243',
    'data-serialization':        '#372852',
    'defensive':                 '#3C3060',
    'design':                    '#3F366F',
    'devops':                    '#413E7D',
    'esoteric':                  '#40468A',
    'gardening':                 '#3E5095',
    'general':                   '#3A599A',
    'git':                       '#38639D',
    'intellectual-property':     '#366CA0',
    'jigsawr':                   '#3575A1',
    'library-science':           '#347FA4',
    'mcp-integration':           '#3488A6',
    'mlops':                     '#3491A8',
    'morphic':                   '#349AAA',
    'mycology':                  '#36A4AB',
    'observability':             '#3AADAC',
    'project-management':        '#3FB6AD',
    'prospecting':               '#47BFAD',
    'r-packages':                '#52C8AD',
    'reporting':                 '#64D0AD',
    'review':                    '#7CD6AF',
    'shiny':                     '#94DCB5',
    'swarm':                     '#AAE1BD',
    'tcg':                       '#BDE8C9',
    'web-dev':                   '#CEEED7',
    'workflow-visualization':    '#DEF5E5',
  },

  turbo: {
    'alchemy':                   '#30123B',
    'animal-training':           '#392B74',
    'bushcraft':                 '#4141A4',
    'compliance':                '#4558CA',
    'containerization':          '#476EE6',
    'crafting':                  '#4682F8',
    'data-serialization':        '#4197FF',
    'defensive':                 '#34ACF7',
    'design':                    '#25C0E7',
    'devops':                    '#1AD2D2',
    'esoteric':                  '#18E1BC',
    'gardening':                 '#24EBA9',
    'general':                   '#3BF58F',
    'git':                       '#59FB73',
    'intellectual-property':     '#7AFE59',
    'jigsawr':                   '#97FE43',
    'library-science':           '#AEFA37',
    'mcp-integration':           '#C3F134',
    'mlops':                     '#D7E535',
    'morphic':                   '#E8D639',
    'mycology':                  '#F5C63A',
    'observability':             '#FCB436',
    'project-management':        '#FE9E2F',
    'prospecting':               '#FC8625',
    'r-packages':                '#F76E19',
    'reporting':                 '#EE5610',
    'review':                    '#E2430A',
    'shiny':                     '#D43305',
    'swarm':                     '#C22403',
    'tcg':                       '#AD1701',
    'web-dev':                   '#960D01',
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
    'dog-trainer':                   '#ff9944',
    'devops-engineer':               '#00ff88',
    'gxp-validator':                 '#ff3399',
    'jigsawr-developer':             '#22ddaa',
    'librarian':                     '#8B7355',
    'martial-artist':                '#ff4466',
    'mlops-engineer':                '#bb77ff',
    'mycologist':                    '#aa77cc',
    'mystic':                        '#dd44ff',
    'project-manager':               '#ff8844',
    'prospector':                    '#ddaa33',
    'putior-integrator':             '#66dd88',
    'r-developer':                   '#00f0ff',
    'security-analyst':              '#ff3333',
    'shiny-developer':               '#3399ff',
    'senior-data-scientist':         '#aa66ff',
    'senior-researcher':             '#ffaa00',
    'senior-software-developer':     '#44ddff',
    'senior-ux-ui-specialist':       '#66ffcc',
    'senior-web-designer':           '#ffdd00',
    'shaman':                        '#9944ff',
    'shapeshifter':                  '#bb88ff',
    'survivalist':                   '#88cc44',
    'swarm-strategist':              '#aadd44',
    'web-developer':                 '#ff6633',
  },

  viridis: {
    'auditor':                       '#482576',
    'code-reviewer':                 '#46307E',
    'designer':                      '#433D84',
    'dog-trainer':                   '#888888',
    'devops-engineer':               '#3F4889',
    'gxp-validator':                 '#3B528B',
    'jigsawr-developer':             '#365D8D',
    'librarian':                     '#888888',
    'martial-artist':                '#31678E',
    'mlops-engineer':                '#2D718E',
    'mycologist':                    '#888888',
    'mystic':                        '#29798E',
    'project-manager':               '#26828E',
    'prospector':                    '#888888',
    'putior-integrator':             '#228C8D',
    'r-developer':                   '#1F948C',
    'security-analyst':              '#1F9E89',
    'shiny-developer':               '#20A387',
    'senior-data-scientist':         '#22A785',
    'senior-researcher':             '#29AF7F',
    'senior-software-developer':     '#37B878',
    'senior-ux-ui-specialist':       '#48C16E',
    'senior-web-designer':           '#5BC863',
    'shaman':                        '#888888',
    'shapeshifter':                  '#71CF57',
    'survivalist':                   '#89D548',
    'swarm-strategist':              '#A2DA37',
    'web-developer':                 '#BBDF27',
  },

  magma: {
    'auditor':                       '#150E37',
    'code-reviewer':                 '#21114E',
    'designer':                      '#311165',
    'dog-trainer':                   '#888888',
    'devops-engineer':               '#410F75',
    'gxp-validator':                 '#51127C',
    'jigsawr-developer':             '#601880',
    'librarian':                     '#888888',
    'martial-artist':                '#6F1F81',
    'mlops-engineer':                '#7F2582',
    'mycologist':                    '#888888',
    'mystic':                        '#8F2A81',
    'project-manager':               '#9E2F7F',
    'prospector':                    '#888888',
    'putior-integrator':             '#AE347B',
    'r-developer':                   '#BE3977',
    'security-analyst':              '#CD4071',
    'shiny-developer':               '#D5446D',
    'senior-data-scientist':         '#DC4869',
    'senior-researcher':             '#E85362',
    'senior-software-developer':     '#F2625D',
    'senior-ux-ui-specialist':       '#F8745C',
    'senior-web-designer':           '#FB8661',
    'shaman':                        '#888888',
    'shapeshifter':                  '#FD9969',
    'survivalist':                   '#FEAA74',
    'swarm-strategist':              '#FEBD82',
    'web-developer':                 '#FECE91',
  },

  inferno: {
    'auditor':                       '#170C3A',
    'code-reviewer':                 '#260C51',
    'designer':                      '#380962',
    'dog-trainer':                   '#888888',
    'devops-engineer':               '#480B6A',
    'gxp-validator':                 '#58106E',
    'jigsawr-developer':             '#67166E',
    'librarian':                     '#888888',
    'martial-artist':                '#771C6D',
    'mlops-engineer':                '#86216B',
    'mycologist':                    '#888888',
    'mystic':                        '#962667',
    'project-manager':               '#A52C60',
    'prospector':                    '#888888',
    'putior-integrator':             '#B43359',
    'r-developer':                   '#C23A50',
    'security-analyst':              '#CF4446',
    'shiny-developer':               '#D54A40',
    'senior-data-scientist':         '#DB503B',
    'senior-researcher':             '#E65D30',
    'senior-software-developer':     '#EE6A24',
    'senior-ux-ui-specialist':       '#F57B17',
    'senior-web-designer':           '#F98C0A',
    'shaman':                        '#888888',
    'shapeshifter':                  '#FB9E07',
    'survivalist':                   '#FCB014',
    'swarm-strategist':              '#FAC429',
    'web-developer':                 '#F6D645',
  },

  plasma: {
    'auditor':                       '#42049E',
    'code-reviewer':                 '#5102A3',
    'designer':                      '#6100A7',
    'dog-trainer':                   '#888888',
    'devops-engineer':               '#7000A8',
    'gxp-validator':                 '#7F03A8',
    'jigsawr-developer':             '#8D0BA5',
    'librarian':                     '#888888',
    'martial-artist':                '#9A169F',
    'mlops-engineer':                '#A62098',
    'mycologist':                    '#888888',
    'mystic':                        '#B22B8F',
    'project-manager':               '#BD3786',
    'prospector':                    '#888888',
    'putior-integrator':             '#C7427C',
    'r-developer':                   '#CF4C74',
    'security-analyst':              '#D8576B',
    'shiny-developer':               '#DC5D67',
    'senior-data-scientist':         '#E06363',
    'senior-researcher':             '#E76F5B',
    'senior-software-developer':     '#ED7A52',
    'senior-ux-ui-specialist':       '#F3874A',
    'senior-web-designer':           '#F89441',
    'shaman':                        '#888888',
    'shapeshifter':                  '#FBA139',
    'survivalist':                   '#FDAF31',
    'swarm-strategist':              '#FEBE2A',
    'web-developer':                 '#FCCE25',
  },

  cividis: {
    'auditor':                       '#00326F',
    'code-reviewer':                 '#13386D',
    'designer':                      '#28406C',
    'dog-trainer':                   '#888888',
    'devops-engineer':               '#36476B',
    'gxp-validator':                 '#414D6B',
    'jigsawr-developer':             '#4C546C',
    'librarian':                     '#888888',
    'martial-artist':                '#565C6D',
    'mlops-engineer':                '#5F636E',
    'mycologist':                    '#888888',
    'mystic':                        '#676970',
    'project-manager':               '#707173',
    'prospector':                    '#888888',
    'putior-integrator':             '#787877',
    'r-developer':                   '#817F79',
    'security-analyst':              '#8A8779',
    'shiny-developer':               '#8F8B78',
    'senior-data-scientist':         '#948E78',
    'senior-researcher':             '#9E9677',
    'senior-software-developer':     '#A89E75',
    'senior-ux-ui-specialist':       '#B2A672',
    'senior-web-designer':           '#BCAF6F',
    'shaman':                        '#888888',
    'shapeshifter':                  '#C6B66B',
    'survivalist':                   '#D1BF66',
    'swarm-strategist':              '#DCC860',
    'web-developer':                 '#E7D159',
  },

  mako: {
    'auditor':                       '#261433',
    'code-reviewer':                 '#34193D',
    'designer':                      '#431C46',
    'dog-trainer':                   '#888888',
    'devops-engineer':               '#521E4D',
    'gxp-validator':                 '#621F53',
    'jigsawr-developer':             '#711F57',
    'librarian':                     '#888888',
    'martial-artist':                '#821E5A',
    'mlops-engineer':                '#931C5B',
    'mycologist':                    '#888888',
    'mystic':                        '#A3195B',
    'project-manager':               '#B41658',
    'prospector':                    '#888888',
    'putior-integrator':             '#C31753',
    'r-developer':                   '#D11F4C',
    'security-analyst':              '#DD2C45',
    'shiny-developer':               '#E23442',
    'senior-data-scientist':         '#E73D3F',
    'senior-researcher':             '#ED4F3E',
    'senior-software-developer':     '#F16244',
    'senior-ux-ui-specialist':       '#F37450',
    'senior-web-designer':           '#F4855E',
    'shaman':                        '#888888',
    'shapeshifter':                  '#F5966D',
    'survivalist':                   '#F6A67E',
    'swarm-strategist':              '#F6B591',
    'web-developer':                 '#F7C5A5',
  },

  rocket: {
    'auditor':                       '#26172A',
    'code-reviewer':                 '#2E1E39',
    'designer':                      '#35254A',
    'dog-trainer':                   '#888888',
    'devops-engineer':               '#3B2D5A',
    'gxp-validator':                 '#3E356C',
    'jigsawr-developer':             '#413E7D',
    'librarian':                     '#888888',
    'martial-artist':                '#40488D',
    'mlops-engineer':                '#3D5297',
    'mycologist':                    '#888888',
    'mystic':                        '#395E9C',
    'project-manager':               '#366A9F',
    'prospector':                    '#888888',
    'putior-integrator':             '#3575A1',
    'r-developer':                   '#347FA4',
    'security-analyst':              '#348BA6',
    'shiny-developer':               '#3490A8',
    'senior-data-scientist':         '#3496A9',
    'senior-researcher':             '#35A1AB',
    'senior-software-developer':     '#39ABAC',
    'senior-ux-ui-specialist':       '#3FB6AD',
    'senior-web-designer':           '#49C1AD',
    'shaman':                        '#888888',
    'shapeshifter':                  '#58CBAD',
    'survivalist':                   '#70D4AD',
    'swarm-strategist':              '#8DDBB3',
    'web-developer':                 '#A8E1BC',
  },

  turbo: {
    'auditor':                       '#455BCD',
    'code-reviewer':                 '#4774EC',
    'designer':                      '#458CFD',
    'dog-trainer':                   '#888888',
    'devops-engineer':               '#39A4FB',
    'gxp-validator':                 '#28BDEA',
    'jigsawr-developer':             '#1AD2D2',
    'librarian':                     '#888888',
    'martial-artist':                '#19E3BA',
    'mlops-engineer':                '#2BEFA0',
    'mycologist':                    '#888888',
    'mystic':                        '#4BF87F',
    'project-manager':               '#71FE5F',
    'prospector':                    '#888888',
    'putior-integrator':             '#95FE45',
    'r-developer':                   '#B0FA37',
    'security-analyst':              '#C8EF34',
    'shiny-developer':               '#D4E736',
    'senior-data-scientist':         '#DFDF37',
    'senior-researcher':             '#F0CC3A',
    'senior-software-developer':     '#FBB838',
    'senior-ux-ui-specialist':       '#FE9E2F',
    'senior-web-designer':           '#FB8222',
    'shaman':                        '#888888',
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

// ── Per-team per-palette colors ──────────────────────────────────
const TEAM_PALETTE_COLORS = {
  cyberpunk: {
    'ai-self-care':                  '#da70d6',
    'devops-platform-engineering':   '#ff4500',
    'fullstack-web-dev':             '#ffcc00',
    'gxp-compliance-validation':     '#ff6ec7',
    'ml-data-science-review':        '#7b68ee',
    'r-package-review':              '#00ccff',
  },

  viridis: {
    'ai-self-care':                  '#35608D',
    'devops-platform-engineering':   '#2C738E',
    'fullstack-web-dev':             '#24868E',
    'gxp-compliance-validation':     '#1F9A8A',
    'ml-data-science-review':        '#26AD81',
    'r-package-review':              '#43BF71',
  },

  magma: {
    'ai-self-care':                  '#641A80',
    'devops-platform-engineering':   '#842681',
    'fullstack-web-dev':             '#A5317E',
    'gxp-compliance-validation':     '#C63D73',
    'ml-data-science-review':        '#E44F64',
    'r-package-review':              '#F76F5C',
  },

  inferno: {
    'ai-self-care':                  '#6B186E',
    'devops-platform-engineering':   '#8C2369',
    'fullstack-web-dev':             '#AC2F5E',
    'gxp-compliance-validation':     '#C9404A',
    'ml-data-science-review':        '#E25734',
    'r-package-review':              '#F3771A',
  },

  plasma: {
    'ai-self-care':                  '#900DA4',
    'devops-platform-engineering':   '#AB2494',
    'fullstack-web-dev':             '#C13B82',
    'gxp-compliance-validation':     '#D5536F',
    'ml-data-science-review':        '#E56A5D',
    'r-package-review':              '#F1844B',
  },

  cividis: {
    'ai-self-care':                  '#4E576C',
    'devops-platform-engineering':   '#62656F',
    'fullstack-web-dev':             '#737475',
    'gxp-compliance-validation':     '#868379',
    'ml-data-science-review':        '#9A9377',
    'r-package-review':              '#B0A473',
  },

  mako: {
    'ai-self-care':                  '#751F58',
    'devops-platform-engineering':   '#981B5B',
    'fullstack-web-dev':             '#BB1656',
    'gxp-compliance-validation':     '#D82648',
    'ml-data-science-review':        '#EB483E',
    'r-package-review':              '#F2704D',
  },

  rocket: {
    'ai-self-care':                  '#414081',
    'devops-platform-engineering':   '#3B5799',
    'fullstack-web-dev':             '#366FA0',
    'gxp-compliance-validation':     '#3486A5',
    'ml-data-science-review':        '#359CAA',
    'r-package-review':              '#3DB4AD',
  },

  turbo: {
    'ai-self-care':                  '#18D6CB',
    'devops-platform-engineering':   '#35F394',
    'fullstack-web-dev':             '#81FF52',
    'gxp-compliance-validation':     '#BDF434',
    'ml-data-science-review':        '#EBD339',
    'r-package-review':              '#FEA632',
  },
};

export function getTeamColor(teamId) {
  if (teamId && TEAM_PALETTE_COLORS[currentTheme]?.[teamId]) {
    return TEAM_PALETTE_COLORS[currentTheme][teamId];
  }
  const colors = TEAM_PALETTE_COLORS[currentTheme];
  if (colors) {
    const vals = Object.values(colors);
    return vals[0] || '#00ffcc';
  }
  return '#00ffcc';
}

export const TEAM_CONFIG = {
  radius: 7,
  glowRadius: 20,
  glowOpacity: 0.55,
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
