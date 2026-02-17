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
let selectedNodeId = null;

// ── Event Log ────────────────────────────────────────────────────────
const hiveEventLog = [];

function logEvent(entry) {
  entry.ts = new Date().toISOString();
  hiveEventLog.push(entry);
  console.log('[hive-log]', entry);
}

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
  const innerR = dim * 0.08;
  const outerR = dim * 0.46;

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

  // Perpendicular offset for dual-track layout (avoids overlap on dense axes)
  const TRACK_SPREAD = { skill: 4, agent: 5, team: 6 };

  const positioned = [];
  const nodeById = new Map();

  for (const type of ['skill', 'agent', 'team']) {
    const axis = byType[type];
    const angle = AXIS_ANGLES[type];
    const maxRank = Math.max(axis.length - 1, 1);
    const scale = d3.scaleLinear().domain([0, maxRank]).range([innerR, outerR]);
    const perpAngle = angle + Math.PI / 2;
    const spread = TRACK_SPREAD[type];

    for (let i = 0; i < axis.length; i++) {
      const node = axis[i];
      const r = scale(i);
      // 3-track for skills (center/left/right), 2-track for agents/teams
      let side;
      if (type === 'skill') {
        const track = i % 3;  // 0=center, 1=left, 2=right
        side = track === 0 ? 0 : track === 1 ? -1 : 1;
      } else {
        side = (i % 2 === 0) ? 1 : -1;
      }
      const offset = side * spread;
      const x = r * Math.cos(angle) + offset * Math.cos(perpAngle);
      const y = r * Math.sin(angle) + offset * Math.sin(perpAngle);
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
  // Skills: circle, Agents: octagon, Teams: pentagon
  if (d.type === 'agent') {
    const r = 4;
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
  return { tag: 'circle', attrs: { cx: d._x, cy: d._y, r: 2 } };
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

  // ── Axis lines (dual-track) ──
  const TRACK_SPREAD = { skill: 4, agent: 5, team: 6 };
  for (const [type, angle] of Object.entries(AXIS_ANGLES)) {
    const perpAngle = angle + Math.PI / 2;
    const spread = TRACK_SPREAD[type];

    const sides = (type === 'skill') ? [-1, 0, 1] : [-1, 1];
    for (const side of sides) {
      const ox = side * spread * Math.cos(perpAngle);
      const oy = side * spread * Math.sin(perpAngle);
      const inner = polar(angle, innerR * 0.8);
      const outer = polar(angle, outerR * 1.08);
      g.append('line')
        .attr('class', 'hive-axis')
        .attr('x1', inner.x + ox).attr('y1', inner.y + oy)
        .attr('x2', outer.x + ox).attr('y2', outer.y + oy);
    }

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
      .attr('data-target', pl.target)
      .attr('data-type', 'skill');
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
      .attr('data-target', pl.target)
      .attr('data-type', pl.type);
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
        if (selectedNodeId === d.id) {
          handleDeselect();
          if (onNodeClick) onNodeClick(null);
        } else {
          handleSelect(d, nodeById);
          if (onNodeClick) onNodeClick(d);
        }
      });
  }

  // Background click clears selection
  svg.on('click', () => {
    logEvent({ event: 'bgClick' });
    handleDeselect();
    if (onNodeClick) onNodeClick(null);
  });

  // Re-apply selection highlighting if a node is selected
  if (selectedNodeId && nodeById.has(selectedNodeId)) {
    handleSelect(nodeById.get(selectedNodeId), nodeById);
  }
}

// ── Hover highlight ─────────────────────────────────────────────────

function handleHover(node, nodeById, positioned) {
  if (selectedNodeId) return;
  hoveredNodeId = node.id;

  // Collect links by type, building typed adjacency
  const linkEls = [];
  const byType = { team: [], agent: [], skill: [] };
  rootG.selectAll('.hive-link').each(function () {
    const el = window.d3.select(this);
    const src = el.attr('data-source');
    const tgt = el.attr('data-target');
    const type = el.attr('data-type');
    linkEls.push({ el, src, tgt });
    if (type && byType[type]) byType[type].push({ src, tgt });
  });

  // Helper: find neighbors via a specific link type
  const neighbors = (id, linkType) => {
    const result = [];
    for (const { src, tgt } of byType[linkType]) {
      if (src === id) result.push(tgt);
      if (tgt === id) result.push(src);
    }
    return result;
  };

  const connected = new Set([node.id]);

  if (node.type === 'team') {
    // team → agents (via team links) → skills (via agent links)
    const agents = neighbors(node.id, 'team');
    agents.forEach(a => connected.add(a));
    agents.forEach(a => neighbors(a, 'agent').forEach(s => connected.add(s)));

  } else if (node.type === 'agent') {
    // agent → teams (via team links) + skills (via agent links)
    neighbors(node.id, 'team').forEach(t => connected.add(t));
    neighbors(node.id, 'agent').forEach(s => connected.add(s));

  } else {
    // skill → agents (via agent links) + related skills (via skill links)
    neighbors(node.id, 'agent').forEach(a => connected.add(a));
    neighbors(node.id, 'skill').forEach(s => connected.add(s));
  }

  // Log hover event
  const connArr = [...connected];
  logEvent({
    event: 'hover',
    node: { id: node.id, type: node.type, domain: node.domain },
    connected: connArr,
    connectedByType: {
      skills: connArr.filter(id => (nodeById.get(id) || {}).type === 'skill').length,
      agents: connArr.filter(id => (nodeById.get(id) || {}).type === 'agent').length,
      teams: connArr.filter(id => (nodeById.get(id) || {}).type === 'team').length,
    },
    linksHighlighted: linkEls.filter(({ src, tgt }) => connected.has(src) && connected.has(tgt)).length,
  });

  // Highlight links where both endpoints are in connected set
  for (const { el, src, tgt } of linkEls) {
    const on = connected.has(src) && connected.has(tgt);
    el.classed('highlighted', on).classed('dimmed', !on);
  }

  rootG.selectAll('.hive-node').each(function () {
    const el = window.d3.select(this);
    el.classed('dimmed', !connected.has(el.attr('data-id')));
  });

  if (onNodeHover) onNodeHover(node);
}

function handleHoverEnd(positioned) {
  if (selectedNodeId) return;
  logEvent({ event: 'hoverEnd', node: hoveredNodeId });
  hoveredNodeId = null;
  rootG.selectAll('.hive-link').classed('highlighted', false).classed('dimmed', false);
  rootG.selectAll('.hive-node').classed('dimmed', false);
  if (onNodeHover) onNodeHover(null);
}

// ── Click select (type-aware BFS) ───────────────────────────────────

function handleSelect(node, nodeById) {
  selectedNodeId = node.id;

  // Build typed adjacency from rendered links
  const linkEls = [];
  const adj = new Map(); // id → [{ neighbor, linkType }]
  rootG.selectAll('.hive-link').each(function () {
    const el = window.d3.select(this);
    const src = el.attr('data-source');
    const tgt = el.attr('data-target');
    const type = el.attr('data-type');
    linkEls.push({ el, src, tgt });
    if (!adj.has(src)) adj.set(src, []);
    if (!adj.has(tgt)) adj.set(tgt, []);
    adj.get(src).push({ neighbor: tgt, linkType: type });
    adj.get(tgt).push({ neighbor: src, linkType: type });
  });

  // BFS with total-hop budget: every link costs 1 hop regardless of type
  const MAX_HOPS = 2;
  const connected = new Map(); // id → best (lowest) hops
  connected.set(node.id, 0);
  const queue = [{ id: node.id, hops: 0 }];

  while (queue.length) {
    const { id: cur, hops } = queue.shift();
    if (hops >= MAX_HOPS) continue;
    for (const { neighbor } of (adj.get(cur) || [])) {
      const nextHops = hops + 1;
      const prev = connected.get(neighbor);
      if (prev !== undefined && prev <= nextHops) continue;
      connected.set(neighbor, nextHops);
      queue.push({ id: neighbor, hops: nextHops });
    }
  }

  // Log click event
  const connectedSet = new Set(connected.keys());
  const clickConnArr = [...connectedSet];
  // Build hop-cost map for diagnostics
  const connectedWithHops = {};
  for (const [id, hops] of connected) {
    connectedWithHops[id] = hops;
  }
  logEvent({
    event: 'click',
    node: { id: node.id, type: node.type, domain: node.domain },
    connected: clickConnArr,
    connectedByType: {
      skills: clickConnArr.filter(id => (nodeById.get(id) || {}).type === 'skill').length,
      agents: clickConnArr.filter(id => (nodeById.get(id) || {}).type === 'agent').length,
      teams: clickConnArr.filter(id => (nodeById.get(id) || {}).type === 'team').length,
    },
    connectedWithHops,
    linksHighlighted: linkEls.filter(({ src, tgt }) => connectedSet.has(src) && connectedSet.has(tgt)).length,
  });

  // Apply highlighting
  for (const { el, src, tgt } of linkEls) {
    const on = connectedSet.has(src) && connectedSet.has(tgt);
    el.classed('highlighted', on).classed('dimmed', !on);
  }
  rootG.selectAll('.hive-node').each(function () {
    const el = window.d3.select(this);
    el.classed('dimmed', !connectedSet.has(el.attr('data-id')));
  });
}

function handleDeselect() {
  logEvent({ event: 'deselect' });
  selectedNodeId = null;
  rootG.selectAll('.hive-link').classed('highlighted', false).classed('dimmed', false);
  rootG.selectAll('.hive-node').classed('dimmed', false);
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
    .style('display', 'block')
    .style('overflow', 'hidden');

  rootG = svg.append('g');

  // Zoom behavior
  zoomBehavior = d3.zoom()
    .scaleExtent([0.3, 5])
    .clickDistance(5)
    .filter((event) => {
      // Block pointer/touch on nodes so native click fires, but allow wheel zoom everywhere
      if (event.target.classList?.contains('hive-node') && event.type !== 'wheel') return false;
      // Replicate d3-zoom default: allow ctrl+wheel (trackpad pinch), reject secondary buttons
      return (!event.ctrlKey || event.type === 'wheel') && !event.button;
    })
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
    zoomToFitHive(0);
  };
  window.addEventListener('resize', resizeHandler);

  render();
  zoomToFitHive(0);
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
  selectedNodeId = null;
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

function zoomToFitHive(duration = 500) {
  if (!svg || !rootG || !zoomBehavior || !window.d3) return;
  const bbox = rootG.node().getBBox();
  if (!bbox.width || !bbox.height) return;

  const w = containerEl.clientWidth || window.innerWidth;
  const h = containerEl.clientHeight || (window.innerHeight - 48);
  const padding = 40;

  const scale = Math.min(
    (w - padding * 2) / bbox.width,
    (h - padding * 2) / bbox.height
  );
  const cx = bbox.x + bbox.width / 2;
  const cy = bbox.y + bbox.height / 2;

  const transform = window.d3.zoomIdentity
    .translate(w / 2 - cx * scale, h / 2 - cy * scale)
    .scale(scale);

  svg.transition().duration(duration).call(zoomBehavior.transform, transform);
}

export function resetViewHive() {
  if (!svg || !zoomBehavior || !window.d3) return;
  zoomToFitHive(500);
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

export function downloadHiveLog() {
  const json = JSON.stringify(hiveEventLog, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `hive-events-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function clearHiveLog() {
  hiveEventLog.length = 0;
}
