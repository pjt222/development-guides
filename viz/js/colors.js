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
    'bushcraft':                 '#481A6C',
    'compliance':                '#482576',
    'containerization':          '#472F7D',
    'crafting':                  '#443A83',
    'data-serialization':        '#414487',
    'defensive':                 '#3D4D8A',
    'design':                    '#39568C',
    'devops':                    '#35608D',
    'esoteric':                  '#31688E',
    'gardening':                 '#2D718E',
    'general':                   '#2A788E',
    'git':                       '#27808E',
    'intellectual-property':     '#23888E',
    'jigsawr':                   '#21908C',
    'mcp-integration':           '#1F988B',
    'mlops':                     '#1FA188',
    'morphic':                   '#22A884',
    'mycology':                  '#29AF7F',
    'observability':             '#35B779',
    'project-management':        '#43BF71',
    'prospecting':               '#54C568',
    'r-packages':                '#66CB5D',
    'reporting':                 '#7AD151',
    'review':                    '#8FD744',
    'shiny':                     '#A5DB36',
    'swarm':                     '#BBDF27',
    'tcg':                       '#D2E21B',
    'web-dev':                   '#E9E519',
    'workflow-visualization':    '#FDE725',
  },

  magma: {
    'alchemy':                   '#000004',
    'animal-training':           '#030313',
    'bushcraft':                 '#0B0924',
    'compliance':                '#150E37',
    'containerization':          '#20114B',
    'crafting':                  '#2D1160',
    'data-serialization':        '#3B0F70',
    'defensive':                 '#491078',
    'design':                    '#57157E',
    'devops':                    '#641A80',
    'esoteric':                  '#721F81',
    'gardening':                 '#7F2582',
    'general':                   '#8C2981',
    'git':                       '#9A2D7F',
    'intellectual-property':     '#A8327D',
    'jigsawr':                   '#B63679',
    'mcp-integration':           '#C43C75',
    'mlops':                     '#D1426F',
    'morphic':                   '#DE4968',
    'mycology':                  '#E85362',
    'observability':             '#F1605D',
    'project-management':        '#F76F5C',
    'prospecting':               '#FA7F5E',
    'r-packages':                '#FC8F65',
    'reporting':                 '#FE9F6D',
    'review':                    '#FEAF77',
    'shiny':                     '#FEBF84',
    'swarm':                     '#FECE91',
    'tcg':                       '#FDDEA0',
    'web-dev':                   '#FCEDAF',
    'workflow-visualization':    '#FCFDBF',
  },

  inferno: {
    'alchemy':                   '#000004',
    'animal-training':           '#040313',
    'bushcraft':                 '#0C0826',
    'compliance':                '#170C3A',
    'containerization':          '#240C4F',
    'crafting':                  '#330A5F',
    'data-serialization':        '#420A68',
    'defensive':                 '#500E6C',
    'design':                    '#5D126E',
    'devops':                    '#6B186E',
    'esoteric':                  '#781C6D',
    'gardening':                 '#86216B',
    'general':                   '#932667',
    'git':                       '#A12A63',
    'intellectual-property':     '#AE305C',
    'jigsawr':                   '#BB3754',
    'mcp-integration':           '#C73E4C',
    'mlops':                     '#D34744',
    'morphic':                   '#DD513A',
    'mycology':                  '#E65D30',
    'observability':             '#ED6925',
    'project-management':        '#F3771A',
    'prospecting':               '#F8850F',
    'r-packages':                '#FB9507',
    'reporting':                 '#FCA50A',
    'review':                    '#FCB519',
    'shiny':                     '#FAC62D',
    'swarm':                     '#F6D645',
    'tcg':                       '#F2E661',
    'web-dev':                   '#F2F584',
    'workflow-visualization':    '#FCFFA4',
  },

  plasma: {
    'alchemy':                   '#0D0887',
    'animal-training':           '#230691',
    'bushcraft':                 '#330597',
    'compliance':                '#42049E',
    'containerization':          '#5002A2',
    'crafting':                  '#5D01A6',
    'data-serialization':        '#6A00A8',
    'defensive':                 '#7701A8',
    'design':                    '#8405A7',
    'devops':                    '#900DA4',
    'esoteric':                  '#9C179E',
    'gardening':                 '#A62098',
    'general':                   '#B12A90',
    'git':                       '#BB3488',
    'intellectual-property':     '#C33D80',
    'jigsawr':                   '#CC4678',
    'mcp-integration':           '#D35171',
    'mlops':                     '#DA5B6A',
    'morphic':                   '#E16462',
    'mycology':                  '#E76F5B',
    'observability':             '#ED7953',
    'project-management':        '#F1844B',
    'prospecting':               '#F68F44',
    'r-packages':                '#F99B3E',
    'reporting':                 '#FCA636',
    'review':                    '#FDB32F',
    'shiny':                     '#FEC029',
    'swarm':                     '#FCCE25',
    'tcg':                       '#F9DC24',
    'web-dev':                   '#F5EA27',
    'workflow-visualization':    '#F0F921',
  },

  cividis: {
    'alchemy':                   '#00204D',
    'animal-training':           '#00275B',
    'bushcraft':                 '#002C6A',
    'compliance':                '#00326F',
    'containerization':          '#0F386E',
    'crafting':                  '#233E6C',
    'data-serialization':        '#31446B',
    'defensive':                 '#3C4A6B',
    'design':                    '#46506B',
    'devops':                    '#4E576C',
    'esoteric':                  '#575C6D',
    'gardening':                 '#5F636E',
    'general':                   '#666970',
    'git':                       '#6E6E73',
    'intellectual-property':     '#757575',
    'jigsawr':                   '#7C7B78',
    'mcp-integration':           '#848279',
    'mlops':                     '#8C8879',
    'morphic':                   '#958F78',
    'mycology':                  '#9E9677',
    'observability':             '#A69D75',
    'project-management':        '#B0A473',
    'prospecting':               '#B8AB70',
    'r-packages':                '#C1B36D',
    'reporting':                 '#CBBA69',
    'review':                    '#D3C164',
    'shiny':                     '#DDC95F',
    'swarm':                     '#E7D159',
    'tcg':                       '#F1D951',
    'web-dev':                   '#FAE149',
    'workflow-visualization':    '#FFEA46',
  },

  mako: {
    'alchemy':                   '#03051A',
    'animal-training':           '#0D0B21',
    'bushcraft':                 '#1A102A',
    'compliance':                '#261433',
    'containerization':          '#33183C',
    'crafting':                  '#3F1B44',
    'data-serialization':        '#4C1D4B',
    'defensive':                 '#5A1E51',
    'design':                    '#681F55',
    'devops':                    '#751F58',
    'esoteric':                  '#841E5A',
    'gardening':                 '#931C5B',
    'general':                   '#A11A5B',
    'git':                       '#AF1759',
    'intellectual-property':     '#BD1655',
    'jigsawr':                   '#CB1B4F',
    'mcp-integration':           '#D62449',
    'mlops':                     '#DF3044',
    'morphic':                   '#E83F3F',
    'mycology':                  '#ED4F3E',
    'observability':             '#F06043',
    'project-management':        '#F2704D',
    'prospecting':               '#F47F58',
    'r-packages':                '#F58E65',
    'reporting':                 '#F69C73',
    'review':                    '#F6AA82',
    'shiny':                     '#F6B893',
    'swarm':                     '#F7C5A5',
    'tcg':                       '#F8D1B8',
    'web-dev':                   '#F9DECA',
    'workflow-visualization':    '#FAEBDD',
  },

  rocket: {
    'alchemy':                   '#0B0405',
    'animal-training':           '#140911',
    'bushcraft':                 '#1D111D',
    'compliance':                '#26172A',
    'containerization':          '#2D1D38',
    'crafting':                  '#342346',
    'data-serialization':        '#382A54',
    'defensive':                 '#3C3163',
    'design':                    '#403872',
    'devops':                    '#414081',
    'esoteric':                  '#40498E',
    'gardening':                 '#3D5297',
    'general':                   '#395D9C',
    'git':                       '#37679F',
    'intellectual-property':     '#3671A0',
    'jigsawr':                   '#357BA2',
    'mcp-integration':           '#3484A5',
    'mlops':                     '#348EA7',
    'morphic':                   '#3497A9',
    'mycology':                  '#35A1AB',
    'observability':             '#38AAAC',
    'project-management':        '#3DB4AD',
    'prospecting':               '#45BDAD',
    'r-packages':                '#4FC6AD',
    'reporting':                 '#60CEAC',
    'review':                    '#78D6AE',
    'shiny':                     '#91DBB4',
    'swarm':                     '#A8E1BC',
    'tcg':                       '#BBE7C8',
    'web-dev':                   '#CDEDD7',
    'workflow-visualization':    '#DEF5E5',
  },

  turbo: {
    'alchemy':                   '#30123B',
    'animal-training':           '#392C76',
    'bushcraft':                 '#4143A7',
    'compliance':                '#455BCD',
    'containerization':          '#4771E9',
    'crafting':                  '#4686FB',
    'data-serialization':        '#3E9BFE',
    'defensive':                 '#30B1F4',
    'design':                    '#22C5E2',
    'devops':                    '#18D6CB',
    'esoteric':                  '#1AE4B6',
    'gardening':                 '#2BEFA0',
    'general':                   '#46F884',
    'git':                       '#67FD68',
    'intellectual-property':     '#88FF4E',
    'jigsawr':                   '#A2FC3C',
    'mcp-integration':           '#B9F635',
    'mlops':                     '#CEEB34',
    'morphic':                   '#E1DD37',
    'mycology':                  '#F0CC3A',
    'observability':             '#FABA39',
    'project-management':        '#FEA632',
    'prospecting':               '#FD8D27',
    'r-packages':                '#F9731D',
    'reporting':                 '#F05B12',
    'review':                    '#E4460A',
    'shiny':                     '#D63506',
    'swarm':                     '#C42503',
    'tcg':                       '#AF1801',
    'web-dev':                   '#960E01',
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
  cyberpunk:  { 'r-package-review': '#00ffcc' },
  viridis:    { 'r-package-review': '#5EC962' },
  magma:      { 'r-package-review': '#F0605D' },
  inferno:    { 'r-package-review': '#ED6925' },
  plasma:     { 'r-package-review': '#E76F5A' },
  cividis:    { 'r-package-review': '#B5A971' },
  mako:       { 'r-package-review': '#D2204C' },
  rocket:     { 'r-package-review': '#49C1AD' },
  turbo:      { 'r-package-review': '#6EFE61' },
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
