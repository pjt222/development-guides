/**
 * hive.js - Hive plot visualization (D3 SVG)
 *
 * 3-axis radial layout: Skills (210°), Agents (330°), Teams (90°)
 * Nodes positioned along axes by rank metric; links as Bezier curves.
 * Loaded lazily when user clicks the Hive toggle button.
 */

import {
  DOMAIN_COLORS, getAgentColor, getTeamColor, hexToRgba,
  AGENT_PRIORITY_CONFIG, TEAM_CONFIG
} from './colors.js';

let svg = null;
let rootG = null;
let zoomBehavior = null;
let fullData = { nodes: [], links: [] };
let visibleAgentIds = null;
let visibleTeamIds = null;
let visibleSkillSet = null;
let onNodeClick = null;
let onNodeHover = null;
let containerEl = null;
let resizeHandler = null;
let hoveredNodeId = null;

// Axis angles (radians): skills=210°, agents=330°, teams=90°
const AXIS_ANGLES = {
  skill:  (7 * Math.PI) / 6,
  agent: (11 * Math.PI) / 6,
  team:   Math.PI / 2,
};

const AXIS_LABELS = { skill: 'Skills', agent: 'Agents', team: 'Teams' };

// ── Helpers ─────────────────────────────────────────────────────────

function polar(angle, radius) {
  return { x: radius * Math.cos(angle), y: radius * Math.sin(angle) };
}

function getNodeColor(node) {
  if (node.type === 'agent') return getAgentColor(node.id.replace('agent:', ''));
  if (node.type === 'team') return getTeamColor(node.id.replace('team:', ''));
  return DOMAIN_COLORS[node.domain] || '#ffffff';
}

function linkColor(link, nodeById) {
  const src = nodeById.get(link.source) || nodeById.get(link.target);
  const tgt = nodeById.get(link.target) || nodeById.get(link.source);
  if (link.type === 'team') {
    const teamNode = src?.type === 'team' ? src : tgt;
    return getTeamColor((teamNode?.id || '').replace('team:', ''));
  }
  if (link.type === 'agent') {
    const agentNode = src?.type === 'agent' ? src : tgt;
    return getAgentColor((agentNode?.id || '').replace('agent:', ''));
  }
  // skill↔skill: use source domain color
  return DOMAIN_COLORS[src?.domain] || '#ffffff';
}

function computeLayout(nodes, links) {
  const d3 = window.d3;
  if (!containerEl) return { positioned: [], posLinks: [], innerR: 0, outerR: 0 };

  const w = containerEl.clientWidth || window.innerWidth;
  const h = containerEl.clientHeight || (window.innerHeight - 48);
  const dim = Math.min(w, h);
  const innerR = dim * 0.12;
  const outerR = dim * 0.42;

  // Build adjacency for degree computation
  const degree = new Map();
  for (const n of nodes) degree.set(n.id, 0);
  for (const l of links) {
    degree.set(l.source, (degree.get(l.source) || 0) + 1);
    degree.set(l.target, (degree.get(l.target) || 0) + 1);
  }

  // Group nodes by type
  const byType = { skill: [], agent: [], team: [] };
  for (const n of nodes) {
    if (byType[n.type]) byType[n.type].push(n);
  }

  // Sort and rank each axis
  byType.skill.sort((a, b) => (degree.get(a.id) || 0) - (degree.get(b.id) || 0));
  byType.agent.sort((a, b) => ((a.skills?.length || 0) - (b.skills?.length || 0)));
  byType.team.sort((a, b) => ((a.members?.length || 0) - (b.members?.length || 0)));

  const positioned = [];
  const nodeById = new Map();

  for (const type of ['skill', 'agent', 'team']) {
    const axis = byType[type];
    const angle = AXIS_ANGLES[type];
    const maxRank = Math.max(axis.length - 1, 1);
    const scale = d3.scaleLinear().domain([0, maxRank]).range([innerR, outerR]);

    for (let i = 0; i < axis.length; i++) {
      const node = axis[i];
      const r = scale(i);
      const { x, y } = polar(angle, r);
      const pos = { ...node, _x: x, _y: y, _r: r, _angle: angle, _rank: i };
      positioned.push(pos);
      nodeById.set(node.id, pos);
    }
  }

  // Build positioned links
  const posLinks = [];
  for (const l of links) {
    const src = nodeById.get(l.source);
    const tgt = nodeById.get(l.target);
    if (src && tgt) {
      posLinks.push({ ...l, _src: src, _tgt: tgt });
    }
  }

  return { positioned, posLinks, nodeById, innerR, outerR };
}

function linkPath(pl) {
  const s = pl._src;
  const t = pl._tgt;

  if (s._angle === t._angle) {
    // Same-axis link: bow outward perpendicular to axis
    const angle = s._angle;
    const perpAngle = angle + Math.PI / 2;
    const midR = (s._r + t._r) / 2;
    const bowAmount = Math.abs(s._r - t._r) * 0.5 + 15;
    const cx = midR * Math.cos(angle) + bowAmount * Math.cos(perpAngle);
    const cy = midR * Math.sin(angle) + bowAmount * Math.sin(perpAngle);
    return `M ${s._x},${s._y} Q ${cx},${cy} ${t._x},${t._y}`;
  }

  // Inter-axis link: control point pulled toward center
  const mx = (s._x + t._x) / 2;
  const my = (s._y + t._y) / 2;
  const cx = mx * 0.3;
  const cy = my * 0.3;
  return `M ${s._x},${s._y} Q ${cx},${cy} ${t._x},${t._y}`;
}

function nodeShape(d) {
  // Skills: circle (rendered as <circle>)
  // Agents: octagon, Teams: pentagon (rendered as <polygon>)
  if (d.type === 'agent') {
    const r = 5;
    const pts = [];
    for (let i = 0; i < 8; i++) {
      const a = (Math.PI * 2 * i) / 8 - Math.PI / 8;
      pts.push(`${d._x + r * Math.cos(a)},${d._y + r * Math.sin(a)}`);
    }
    return { tag: 'polygon', attrs: { points: pts.join(' ') } };
  }
  if (d.type === 'team') {
    const r = 6;
    const pts = [];
    for (let i = 0; i < 5; i++) {
      const a = (Math.PI * 2 * i) / 5 - Math.PI / 2;
      pts.push(`${d._x + r * Math.cos(a)},${d._y + r * Math.sin(a)}`);
    }
    return { tag: 'polygon', attrs: { points: pts.join(' ') } };
  }
  return { tag: 'circle', attrs: { cx: d._x, cy: d._y, r: 3.5 } };
}

// ── Filter helpers ──────────────────────────────────────────────────

function getFilteredData() {
  const nodes = fullData.nodes.filter(n => {
    if (n.type === 'team') return visibleTeamIds === null || visibleTeamIds.has(n.id);
    if (n.type === 'agent') return visibleAgentIds === null || visibleAgentIds.has(n.id);
    return visibleSkillSet === null || visibleSkillSet.has(n.id);
  });

  const nodeIds = new Set(nodes.map(n => n.id));
  const links = fullData.links.filter(l => nodeIds.has(l.source) && nodeIds.has(l.target));

  return { nodes, links };
}

// ── Render ──────────────────────────────────────────────────────────

function render() {
  const d3 = window.d3;
  if (!svg || !rootG || !d3) return;

  const w = containerEl.clientWidth || window.innerWidth;
  const h = containerEl.clientHeight || (window.innerHeight - 48);
  svg.attr('width', w).attr('height', h);

  const { nodes, links } = getFilteredData();
  const { positioned, posLinks, nodeById, innerR, outerR } = computeLayout(nodes, links);

  rootG.selectAll('*').remove();

  // Center group
  const g = rootG.append('g').attr('transform', `translate(${w / 2},${h / 2})`);

  // ── Axis lines ──
  for (const [type, angle] of Object.entries(AXIS_ANGLES)) {
    const inner = polar(angle, innerR * 0.8);
    const outer = polar(angle, outerR * 1.08);
    g.append('line')
      .attr('class', 'hive-axis')
      .attr('x1', inner.x).attr('y1', inner.y)
      .attr('x2', outer.x).attr('y2', outer.y);

    // Label
    const labelPos = polar(angle, outerR * 1.15);
    g.append('text')
      .attr('class', 'hive-axis-label')
      .attr('x', labelPos.x).attr('y', labelPos.y)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .text(AXIS_LABELS[type]);
  }

  // ── Links ──
  const linkG = g.append('g').attr('class', 'hive-links');

  // Draw skill↔skill links first (lowest layer)
  const skillLinks = posLinks.filter(l => l.type === 'skill');
  const otherLinks = posLinks.filter(l => l.type !== 'skill');

  for (const pl of skillLinks) {
    linkG.append('path')
      .attr('class', 'hive-link hive-link-skill')
      .attr('d', linkPath(pl))
      .attr('stroke', hexToRgba(linkColor(pl, nodeById), 0.12))
      .attr('data-source', pl.source)
      .attr('data-target', pl.target);
  }

  for (const pl of otherLinks) {
    const opacity = pl.type === 'team' ? 0.25 : 0.18;
    const width = pl.type === 'team' ? 0.8 : 0.5;
    linkG.append('path')
      .attr('class', `hive-link hive-link-${pl.type}`)
      .attr('d', linkPath(pl))
      .attr('stroke', hexToRgba(linkColor(pl, nodeById), opacity))
      .attr('stroke-width', width)
      .attr('data-source', pl.source)
      .attr('data-target', pl.target);
  }

  // ── Nodes ──
  const nodeG = g.append('g').attr('class', 'hive-nodes');

  for (const d of positioned) {
    const color = getNodeColor(d);
    const shape = nodeShape(d);
    let el;

    if (shape.tag === 'circle') {
      el = nodeG.append('circle')
        .attr('cx', shape.attrs.cx)
        .attr('cy', shape.attrs.cy)
        .attr('r', shape.attrs.r);
    } else {
      el = nodeG.append('polygon')
        .attr('points', shape.attrs.points);
    }

    el.attr('class', 'hive-node')
      .attr('fill', color)
      .attr('data-id', d.id)
      .attr('data-type', d.type)
      .on('mouseenter', () => handleHover(d, nodeById, positioned))
      .on('mouseleave', () => handleHoverEnd(positioned))
      .on('click', (event) => {
        event.stopPropagation();
        if (onNodeClick) onNodeClick(d);
      });
  }

  // Background click clears selection
  svg.on('click', () => {
    if (onNodeClick) onNodeClick(null);
  });
}

// ── Hover highlight ─────────────────────────────────────────────────

function handleHover(node, nodeById, positioned) {
  hoveredNodeId = node.id;

  // Find connected node IDs
  const connected = new Set([node.id]);
  rootG.selectAll('.hive-link').each(function () {
    const el = window.d3.select(this);
    const src = el.attr('data-source');
    const tgt = el.attr('data-target');
    if (src === node.id || tgt === node.id) {
      connected.add(src);
      connected.add(tgt);
      el.classed('highlighted', true).classed('dimmed', false);
    } else {
      el.classed('highlighted', false).classed('dimmed', true);
    }
  });

  rootG.selectAll('.hive-node').each(function () {
    const el = window.d3.select(this);
    const id = el.attr('data-id');
    el.classed('dimmed', !connected.has(id));
  });

  if (onNodeHover) onNodeHover(node);
}

function handleHoverEnd(positioned) {
  hoveredNodeId = null;
  rootG.selectAll('.hive-link').classed('highlighted', false).classed('dimmed', false);
  rootG.selectAll('.hive-node').classed('dimmed', false);
  if (onNodeHover) onNodeHover(null);
}

// ── Public API ──────────────────────────────────────────────────────

export function initHiveGraph(container, data, { onClick, onHover } = {}) {
  const d3 = window.d3;
  if (!d3) throw new Error('D3 library not loaded');

  containerEl = container;
  onNodeClick = onClick;
  onNodeHover = onHover;

  fullData = {
    nodes: data.nodes.map(n => ({ ...n })),
    links: data.links.map(l => ({
      source: typeof l.source === 'object' ? l.source.id : l.source,
      target: typeof l.target === 'object' ? l.target.id : l.target,
      type: l.type,
    })),
  };

  const w = container.clientWidth || window.innerWidth;
  const h = container.clientHeight || (window.innerHeight - 48);

  svg = d3.select(container).append('svg')
    .attr('width', w)
    .attr('height', h)
    .style('display', 'block');

  rootG = svg.append('g');

  // Zoom behavior
  zoomBehavior = d3.zoom()
    .scaleExtent([0.3, 5])
    .on('zoom', (event) => {
      rootG.attr('transform', event.transform);
    });

  svg.call(zoomBehavior);

  // Resize handler
  resizeHandler = () => {
    if (!svg || !containerEl) return;
    const nw = containerEl.clientWidth || window.innerWidth;
    const nh = containerEl.clientHeight || (window.innerHeight - 48);
    svg.attr('width', nw).attr('height', nh);
    render();
  };
  window.addEventListener('resize', resizeHandler);

  render();
}

export function destroyHiveGraph() {
  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler);
    resizeHandler = null;
  }
  if (svg) {
    svg.remove();
    svg = null;
  }
  rootG = null;
  zoomBehavior = null;
  fullData = { nodes: [], links: [] };
  visibleAgentIds = null;
  visibleTeamIds = null;
  visibleSkillSet = null;
  onNodeClick = null;
  onNodeHover = null;
  containerEl = null;
  hoveredNodeId = null;
}

export function setSkillVisibilityHive(ids) {
  visibleSkillSet = ids instanceof Set ? ids : new Set(ids);
  render();
}

export function setVisibleAgentsHive(ids) {
  visibleAgentIds = new Set(ids);
  // Render is deferred to setSkillVisibilityHive (always called after)
}

export function setVisibleTeamsHive(ids) {
  visibleTeamIds = new Set(ids);
  // Render is deferred to setSkillVisibilityHive (always called after)
}

export function getVisibleAgentIdsHive() {
  return visibleAgentIds;
}

export function refreshHiveGraph() {
  render();
}

export function focusNodeHive(id) {
  if (!svg || !rootG || !window.d3) return;
  const node = rootG.select(`.hive-node[data-id="${id}"]`);
  if (node.empty()) return;

  // Flash the node
  const origFill = node.attr('fill');
  node.attr('fill', '#ffffff')
    .transition().duration(400)
    .attr('fill', origFill);
}

export function resetViewHive() {
  if (!svg || !zoomBehavior || !window.d3) return;
  svg.transition().duration(500).call(
    zoomBehavior.transform,
    window.d3.zoomIdentity
  );
  hoveredNodeId = null;
}

export function zoomInHive() {
  if (!svg || !zoomBehavior || !window.d3) return;
  svg.transition().duration(300).call(zoomBehavior.scaleBy, 1.4);
}

export function zoomOutHive() {
  if (!svg || !zoomBehavior || !window.d3) return;
  svg.transition().duration(300).call(zoomBehavior.scaleBy, 0.7);
}
