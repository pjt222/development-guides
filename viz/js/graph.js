/**
 * graph.js - Force-graph setup, node/link rendering, interactions
 */

import { DOMAIN_COLORS, COMPLEXITY_CONFIG, FEATURED_NODES, hexToRgba, getAgentColor, getTeamColor, AGENT_PRIORITY_CONFIG, TEAM_CONFIG, getCurrentThemeName } from './colors.js';

let graph = null;
let graphData = { nodes: [], links: [] };
let fullData = { nodes: [], links: [] };
let selectedNodeId = null;
let hoveredNodeId = null;
let onNodeClick = null;
let onNodeHover = null;

// ── Icon state ──────────────────────────────────────────────────────
let iconMode = false;
const cachedPaletteIcons = new Map(); // palette -> Map(nodeId -> Image)
let activeIconMap = new Map();        // current palette's nodeId -> Image
const ICON_ZOOM_THRESHOLD = 1.0;

// ── Performance caches ──────────────────────────────────────────────
let highlightedNodeIds = null;  // Set of active + neighbor IDs (null = all highlighted)
let nodeById = new Map();       // id -> node for O(1) lookup
let cachedFontScale = 0;
let cachedFontBold = '';
let cachedFontNormal = '';

// ── Gradient texture cache ────────────────────────────────────────
const GLOW_TEX_SIZE = 64;
const glowCache = new Map(); // "profile|#hex" -> OffscreenCanvas

function getGlowTexture(profile, hex) {
  const key = profile + '|' + hex;
  let tex = glowCache.get(key);
  if (tex) return tex;
  if (typeof OffscreenCanvas === 'undefined') return null;
  const s = GLOW_TEX_SIZE, c = s / 2, outerR = c;
  const innerR = profile === 'icon' ? outerR * 0.3 : outerR * 0.17;
  tex = new OffscreenCanvas(s, s);
  const tctx = tex.getContext('2d');
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const grad = tctx.createRadialGradient(c, c, innerR, c, c, outerR);
  grad.addColorStop(0, `rgba(${r},${g},${b},1)`);
  grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
  tctx.fillStyle = grad;
  tctx.fillRect(0, 0, s, s);
  glowCache.set(key, tex);
  return tex;
}

function drawGlow(ctx, x, y, radius, profile, hex, opacity) {
  const tex = getGlowTexture(profile, hex);
  if (tex) {
    const prev = ctx.globalAlpha;
    ctx.globalAlpha = opacity;
    ctx.drawImage(tex, x - radius, y - radius, radius * 2, radius * 2);
    ctx.globalAlpha = prev;
  } else {
    // Fallback: live gradient (old browsers without OffscreenCanvas)
    const innerR = profile === 'icon' ? radius * 0.3 : radius * 0.17;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    const grad = ctx.createRadialGradient(x, y, innerR, x, y, radius);
    grad.addColorStop(0, hexToRgba(hex, opacity));
    grad.addColorStop(1, hexToRgba(hex, 0));
    ctx.fillStyle = grad;
    ctx.fill();
  }
}

// ── Agent & Team state ──────────────────────────────────────────────
let visibleAgentIds = null; // null = all visible, Set = specific IDs
let visibleTeamIds = null;  // null = all visible, Set = specific IDs

export function setAgentsVisible(v) {
  // Backward compat: boolean toggles all agents
  if (typeof v === 'boolean') {
    visibleAgentIds = v ? null : new Set();
  }
}

export function setVisibleAgents(ids) {
  visibleAgentIds = new Set(ids);
}

export function getAgentsVisible() {
  // Returns true if any agents are visible
  return visibleAgentIds === null || visibleAgentIds.size > 0;
}

export function getVisibleAgentIds() {
  return visibleAgentIds;
}

export function setVisibleTeams(ids) {
  visibleTeamIds = new Set(ids);
}

export function getVisibleTeamIds() {
  return visibleTeamIds;
}

// ── Performance helpers ─────────────────────────────────────────────
function rebuildHighlightSet() {
  const activeId = selectedNodeId || hoveredNodeId;
  if (!activeId) { highlightedNodeIds = null; return; }
  const set = new Set([activeId]);
  // 1-hop: direct neighbors
  for (const l of graphData.links) {
    const src = typeof l.source === 'object' ? l.source.id : l.source;
    const tgt = typeof l.target === 'object' ? l.target.id : l.target;
    if (src === activeId) set.add(tgt);
    else if (tgt === activeId) set.add(src);
  }
  // 2-hop for teams: also highlight agents' skill connections
  if (activeId.startsWith('team:')) {
    const firstHop = new Set(set);
    for (const l of graphData.links) {
      const src = typeof l.source === 'object' ? l.source.id : l.source;
      const tgt = typeof l.target === 'object' ? l.target.id : l.target;
      if (firstHop.has(src) && src !== activeId) set.add(tgt);
      else if (firstHop.has(tgt) && tgt !== activeId) set.add(src);
    }
  }
  highlightedNodeIds = set;
}

function rebuildNodeIndex() {
  nodeById = new Map();
  for (const n of graphData.nodes) nodeById.set(n.id, n);
}

function precomputeLinkColors() {
  for (const link of graphData.links) {
    if (link.type === 'team') {
      // Team links get team color from the source (team node)
      const src = typeof link.source === 'object' ? link.source : nodeById.get(typeof link.source === 'string' ? link.source : link.source?.id);
      if (src && src.type === 'team') {
        link._teamHex = getTeamColor(src.id.replace('team:', ''));
      } else {
        link._teamHex = getTeamColor();
      }
      link._agentHex = null;
      continue;
    }
    if (link.type !== 'agent') { link._agentHex = null; link._teamHex = null; continue; }
    link._teamHex = null;
    const src = typeof link.source === 'object' ? link.source : nodeById.get(typeof link.source === 'string' ? link.source : link.source?.id);
    if (src && src.type === 'agent') {
      link._agentHex = getAgentColor(src.id.replace('agent:', ''));
      continue;
    }
    const tgt = typeof link.target === 'object' ? link.target : nodeById.get(typeof link.target === 'string' ? link.target : link.target?.id);
    if (tgt && tgt.type === 'agent') {
      link._agentHex = getAgentColor(tgt.id.replace('agent:', ''));
    } else {
      link._agentHex = getAgentColor();
    }
  }
}

const SAME_DOMAIN_DISTANCE = 40;
const CROSS_DOMAIN_DISTANCE = 100;
const AGENT_LINK_DISTANCE = 120;
const TEAM_LINK_DISTANCE = 80;
const LABEL_ZOOM_THRESHOLD = 2.5;

export function initGraph(container, data, { onClick, onHover } = {}) {
  fullData = {
    nodes: data.nodes.map(n => ({ ...n })),
    links: data.links.map(l => ({ ...l })),
  };
  graphData = {
    nodes: fullData.nodes.map(n => ({ ...n })),
    links: fullData.links.map(l => ({ ...l })),
  };

  onNodeClick = onClick;
  onNodeHover = onHover;
  rebuildNodeIndex();
  precomputeLinkColors();

  graph = ForceGraph()(container)
    .width(container.clientWidth || window.innerWidth)
    .height(container.clientHeight || (window.innerHeight - 48))
    .graphData(graphData)
    .backgroundColor('transparent')
    .nodeId('id')
    .linkSource('source')
    .linkTarget('target')
    .linkColor(link => {
      const isAgentLink = link.type === 'agent';
      const isTeamLink = link.type === 'team';
      const activeId = selectedNodeId || hoveredNodeId;
      const getAgentLinkColor = (alpha) => {
        if (link._agentHex) return hexToRgba(link._agentHex, alpha);
        return hexToRgba(getAgentColor(), alpha);
      };
      const getTeamLinkColor = (alpha) => {
        if (link._teamHex) return hexToRgba(link._teamHex, alpha);
        return hexToRgba(getTeamColor(), alpha);
      };
      if (!activeId) {
        if (isTeamLink) return getTeamLinkColor(0.06);
        return isAgentLink
          ? getAgentLinkColor(0.04)
          : 'rgba(255,255,255,0.06)';
      }
      const src = typeof link.source === 'object' ? link.source.id : link.source;
      const tgt = typeof link.target === 'object' ? link.target.id : link.target;
      if (src === activeId || tgt === activeId) {
        if (isTeamLink) return getTeamLinkColor(0.4);
        if (isAgentLink) return getAgentLinkColor(0.3);
        const connectedNode = nodeById.get(src === activeId ? tgt : src);
        const color = connectedNode ? (DOMAIN_COLORS[connectedNode.domain] || '#ffffff') : '#ffffff';
        return hexToRgba(color, 0.35);
      }
      if (isTeamLink) return getTeamLinkColor(0.01);
      return isAgentLink ? getAgentLinkColor(0.01) : 'rgba(255,255,255,0.02)';
    })
    .linkWidth(link => {
      const activeId = selectedNodeId || hoveredNodeId;
      if (!activeId) return 0.5;
      const src = typeof link.source === 'object' ? link.source.id : link.source;
      const tgt = typeof link.target === 'object' ? link.target.id : link.target;
      return (src === activeId || tgt === activeId) ? 1.5 : 0.3;
    })
    .nodeCanvasObject(drawNode)
    .nodePointerAreaPaint(drawHitArea)
    .onNodeClick(handleNodeClick)
    .onNodeHover(handleNodeHover)
    .onBackgroundClick(handleBackgroundClick)
    .cooldownTicks(200)
    .warmupTicks(100);

  // Configure forces via the library's d3Force accessor
  graph.d3Force('link')
    .distance(link => {
      if (link.type === 'team') return TEAM_LINK_DISTANCE;
      if (link.type === 'agent') return AGENT_LINK_DISTANCE;
      const src = typeof link.source === 'object' ? link.source : nodeById.get(link.source);
      const tgt = typeof link.target === 'object' ? link.target : nodeById.get(link.target);
      return (src && tgt && src.domain === tgt.domain) ? SAME_DOMAIN_DISTANCE : CROSS_DOMAIN_DISTANCE;
    });

  graph.d3Force('charge').strength(-80);

  window.addEventListener('resize', () => {
    if (graph) {
      graph.width(container.clientWidth || window.innerWidth);
      graph.height(container.clientHeight || (window.innerHeight - 48));
    }
  });

  return graph;
}

export function destroyGraph() {
  if (graph) {
    graph.pauseAnimation();
    graph = null;
  }
  graphData = { nodes: [], links: [] };
  fullData = { nodes: [], links: [] };
  selectedNodeId = null;
  hoveredNodeId = null;
  highlightedNodeIds = null;
  nodeById = new Map();
  glowCache.clear();
}

// ── Icon management ─────────────────────────────────────────────────
let _iconRefreshTimer = null;
function _scheduleIconRefresh() {
  if (_iconRefreshTimer) clearTimeout(_iconRefreshTimer);
  _iconRefreshTimer = setTimeout(() => {
    _iconRefreshTimer = null;
    if (graph) graph.nodeCanvasObject(drawNode);
  }, 100);
}

export function preloadIcons(nodes, palette) {
  const pal = palette || getCurrentThemeName();
  if (cachedPaletteIcons.has(pal)) {
    activeIconMap = cachedPaletteIcons.get(pal);
    return;
  }
  const palMap = new Map();
  cachedPaletteIcons.set(pal, palMap);

  for (const node of nodes) {
    let path;
    if (node.type === 'team') {
      path = `icons/${pal}/teams/${node.id.replace('team:', '')}.webp`;
    } else if (node.type === 'agent') {
      path = `icons/${pal}/agents/${node.id.replace('agent:', '')}.webp`;
    } else {
      path = `icons/${pal}/${node.domain}/${node.id}.webp`;
    }
    const img = new Image();
    img.onload = () => {
      palMap.set(node.id, img);
      _scheduleIconRefresh();
    };
    img.onerror = () => {}; // silently skip missing icons
    img.src = path;
  }
  activeIconMap = palMap;
}

export function switchIconPalette(palette, nodes) {
  if (cachedPaletteIcons.has(palette)) {
    activeIconMap = cachedPaletteIcons.get(palette);
  } else {
    preloadIcons(nodes, palette);
  }
}

export function setIconMode(enabled) {
  iconMode = !!enabled;
}

export function getIconMode() {
  return iconMode;
}

// ── Shape helpers ───────────────────────────────────────────────────
function drawHexPath(ctx, x, y, r) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6; // flat-top
    const vx = x + r * Math.cos(angle);
    const vy = y + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(vx, vy);
    else ctx.lineTo(vx, vy);
  }
  ctx.closePath();
}

function drawOctPath(ctx, x, y, r) {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI / 4) * i - Math.PI / 8; // flat-top octagon
    const vx = x + r * Math.cos(angle);
    const vy = y + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(vx, vy);
    else ctx.lineTo(vx, vy);
  }
  ctx.closePath();
}

function drawPentPath(ctx, x, y, r) {
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = (2 * Math.PI / 5) * i - Math.PI / 2; // point-up pentagon
    const vx = x + r * Math.cos(angle);
    const vy = y + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(vx, vy);
    else ctx.lineTo(vx, vy);
  }
  ctx.closePath();
}

// ── Agent node rendering ────────────────────────────────────────────
function drawAgentNode(node, ctx, globalScale) {
  const x = node.x;
  const y = node.y;
  const agentId = node.id.replace('agent:', '');
  const color = getAgentColor(agentId);
  const cfg = AGENT_PRIORITY_CONFIG[node.priority] || AGENT_PRIORITY_CONFIG.normal;
  const r = cfg.radius;

  const isHighlightedNode = isNodeHighlighted(node);
  const dimmed = (selectedNodeId || hoveredNodeId) && !isHighlightedNode;
  const alpha = dimmed ? 0.12 : 1;

  const useIcon = iconMode && activeIconMap.has(node.id) && globalScale > ICON_ZOOM_THRESHOLD;

  if (useIcon) {
    // ── Icon mode: draw agent icon with glow ──
    const img = activeIconMap.get(node.id);
    const iconSize = r * 3.5;

    // Subtle glow behind icon (reduced — glyphs have baked-in neon glow)
    drawGlow(ctx, x, y, iconSize, 'icon', color, 0.12 * alpha);

    // Draw icon image
    ctx.globalAlpha = alpha;
    ctx.drawImage(img, x - iconSize, y - iconSize, iconSize * 2, iconSize * 2);
    ctx.globalAlpha = 1;

    // Octagon frame around agent icon
    drawOctPath(ctx, x, y, iconSize + 1);
    ctx.strokeStyle = hexToRgba(color, 0.5 * alpha);
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Critical priority gets brighter outer octagon ring
    if (node.priority === 'critical') {
      drawOctPath(ctx, x, y, iconSize + 4);
      ctx.strokeStyle = `rgba(255,255,255,${0.6 * alpha})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  } else {
    // ── Glow mode: octagon rendering ──
    // Radial glow
    drawGlow(ctx, x, y, cfg.glowRadius, 'glow', color, cfg.glowOpacity * alpha);

    // Solid octagon core
    drawOctPath(ctx, x, y, r);
    ctx.fillStyle = hexToRgba(color, 0.85 * alpha);
    ctx.fill();

    // White center dot
    ctx.beginPath();
    ctx.arc(x, y, r * 0.3, 0, 2 * Math.PI);
    ctx.fillStyle = `rgba(255,255,255,${0.9 * alpha})`;
    ctx.fill();

    // Critical priority gets outer octagon ring
    if (node.priority === 'critical') {
      drawOctPath(ctx, x, y, r + 2.5);
      ctx.strokeStyle = `rgba(255,255,255,${0.6 * alpha})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  // Label — placed below the octagon frame
  const hasActiveSelection = !!(selectedNodeId || hoveredNodeId);
  const showLabel = (hasActiveSelection && isHighlightedNode && !dimmed) || globalScale > LABEL_ZOOM_THRESHOLD;
  if (showLabel) {
    ctx.font = cachedFontBold;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = `rgba(255,255,255,${0.9 * alpha})`;
    const labelY = useIcon ? y + r * 3.5 + 4 : y + r + 4;
    ctx.fillText(node.title || node.id, x, labelY);
  }
}

// ── Team node rendering ──────────────────────────────────────────────
function drawTeamNode(node, ctx, globalScale) {
  const x = node.x;
  const y = node.y;
  const teamId = node.id.replace('team:', '');
  const color = getTeamColor(teamId);
  const r = TEAM_CONFIG.radius;

  const isHighlightedNode = isNodeHighlighted(node);
  const dimmed = (selectedNodeId || hoveredNodeId) && !isHighlightedNode;
  const alpha = dimmed ? 0.12 : 1;

  const useIcon = iconMode && activeIconMap.has(node.id) && globalScale > ICON_ZOOM_THRESHOLD;

  if (useIcon) {
    const img = activeIconMap.get(node.id);
    const iconSize = r * 3.5;

    drawGlow(ctx, x, y, iconSize, 'icon', color, 0.12 * alpha);

    ctx.globalAlpha = alpha;
    ctx.drawImage(img, x - iconSize, y - iconSize, iconSize * 2, iconSize * 2);
    ctx.globalAlpha = 1;

    // Pentagon frame around team icon
    drawPentPath(ctx, x, y, iconSize + 1);
    ctx.strokeStyle = hexToRgba(color, 0.5 * alpha);
    ctx.lineWidth = 1.5;
    ctx.stroke();
  } else {
    // ── Glow mode: pentagon rendering ──
    drawGlow(ctx, x, y, TEAM_CONFIG.glowRadius, 'glow', color, TEAM_CONFIG.glowOpacity * alpha);

    // Solid pentagon core
    drawPentPath(ctx, x, y, r);
    ctx.fillStyle = hexToRgba(color, 0.85 * alpha);
    ctx.fill();

    // White center dot
    ctx.beginPath();
    ctx.arc(x, y, r * 0.3, 0, 2 * Math.PI);
    ctx.fillStyle = `rgba(255,255,255,${0.9 * alpha})`;
    ctx.fill();

    // Member count badge
    const memberCount = node.members ? node.members.length : 0;
    if (memberCount > 0 && globalScale > 1.5) {
      const badgeR = r * 0.45;
      const badgeX = x + r * 0.7;
      const badgeY = y - r * 0.7;
      ctx.beginPath();
      ctx.arc(badgeX, badgeY, badgeR, 0, 2 * Math.PI);
      ctx.fillStyle = hexToRgba(color, 0.9 * alpha);
      ctx.fill();
      ctx.font = `bold ${badgeR * 1.4}px 'Share Tech Mono', monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = `rgba(0,0,0,${0.9 * alpha})`;
      ctx.fillText(String(memberCount), badgeX, badgeY);
    }
  }

  // Label
  const hasActiveSelection = !!(selectedNodeId || hoveredNodeId);
  const showLabel = (hasActiveSelection && isHighlightedNode && !dimmed) || globalScale > LABEL_ZOOM_THRESHOLD;
  if (showLabel) {
    ctx.font = cachedFontBold;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = `rgba(255,255,255,${0.9 * alpha})`;
    const labelY = useIcon ? y + r * 3.5 + 4 : y + r + 4;
    ctx.fillText(node.title || node.id, x, labelY);
  }
}

// ── Node rendering ──────────────────────────────────────────────────
function drawNode(node, ctx, globalScale) {
  // Font cache — recompute only when scale changes
  if (globalScale !== cachedFontScale) {
    cachedFontScale = globalScale;
    const fs = Math.max(10 / globalScale, 2);
    cachedFontBold = `bold ${fs}px 'Share Tech Mono', monospace`;
    cachedFontNormal = `${fs}px 'Share Tech Mono', monospace`;
  }

  const x = node.x;
  const y = node.y;
  if (!isFinite(x) || !isFinite(y)) return;

  if (node.type === 'agent') {
    drawAgentNode(node, ctx, globalScale);
    return;
  }

  if (node.type === 'team') {
    drawTeamNode(node, ctx, globalScale);
    return;
  }

  const color = DOMAIN_COLORS[node.domain] || '#ffffff';
  const cfg = COMPLEXITY_CONFIG[node.complexity] || COMPLEXITY_CONFIG.intermediate;
  const featured = FEATURED_NODES[node.id];
  const r = featured ? featured.radius : cfg.radius;

  const isHighlighted = isNodeHighlighted(node);
  const dimmed = (selectedNodeId || hoveredNodeId) && !isHighlighted;
  const alpha = dimmed ? 0.12 : 1;

  const useIcon = iconMode && activeIconMap.has(node.id) && globalScale > ICON_ZOOM_THRESHOLD;

  if (useIcon) {
    // ── Icon mode: draw image with domain-colored glow ──
    const img = activeIconMap.get(node.id);
    const iconSize = r * 3.5;
    const glowMult = featured ? (featured.tier === 'primary' ? 1.5 : 1.3) : 1;

    // Subtle glow behind icon (reduced — glyphs have baked-in neon glow)
    drawGlow(ctx, x, y, iconSize * glowMult, 'icon', color, 0.12 * alpha);

    // Draw icon image
    ctx.globalAlpha = alpha;
    ctx.drawImage(img, x - iconSize, y - iconSize, iconSize * 2, iconSize * 2);
    ctx.globalAlpha = 1;

    // Featured ring (icon mode)
    if (featured) {
      const ringRadius = iconSize + 2;
      const strokeWidth = featured.tier === 'primary' ? 1.5 : 1;
      const ringAlpha = featured.tier === 'primary' ? 0.6 : 0.4;
      ctx.beginPath();
      ctx.arc(x, y, ringRadius, 0, 2 * Math.PI);
      ctx.strokeStyle = `rgba(255,255,255,${ringAlpha * alpha})`;
      ctx.lineWidth = strokeWidth;
      ctx.stroke();
    }
  } else {
    // ── Glow mode (original rendering) ──
    const glowMult = featured ? (featured.tier === 'primary' ? 1.5 : 1.3) : 1;
    const glowRadius = cfg.glowRadius * glowMult;
    drawGlow(ctx, x, y, glowRadius, 'glow', color, cfg.glowOpacity * alpha);

    // Solid core
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fillStyle = hexToRgba(color, 0.85 * alpha);
    ctx.fill();

    // White center dot
    ctx.beginPath();
    ctx.arc(x, y, r * 0.35, 0, 2 * Math.PI);
    ctx.fillStyle = `rgba(255,255,255,${0.9 * alpha})`;
    ctx.fill();

    // Featured ring (glow mode)
    if (featured) {
      const ringRadius = r + 2;
      const strokeWidth = featured.tier === 'primary' ? 1.5 : 1;
      const ringAlpha = featured.tier === 'primary' ? 0.6 : 0.4;
      ctx.beginPath();
      ctx.arc(x, y, ringRadius, 0, 2 * Math.PI);
      ctx.strokeStyle = `rgba(255,255,255,${ringAlpha * alpha})`;
      ctx.lineWidth = strokeWidth;
      ctx.stroke();
    }
  }

  // Labels
  const hasActiveSelection = !!(selectedNodeId || hoveredNodeId);
  const showLabel = (hasActiveSelection && isHighlighted && !dimmed) || globalScale > LABEL_ZOOM_THRESHOLD;
  if (showLabel) {
    ctx.font = cachedFontNormal;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = `rgba(255,255,255,${0.9 * alpha})`;
    const labelY = useIcon ? y + r * 2.8 + 2 : y + r + 4;
    ctx.fillText(node.title || node.id, x, labelY);
  }
}

function drawHitArea(node, color, ctx) {
  if (!isFinite(node.x) || !isFinite(node.y)) return;
  let r;
  if (node.type === 'team') {
    r = TEAM_CONFIG.radius;
  } else if (node.type === 'agent') {
    const acfg = AGENT_PRIORITY_CONFIG[node.priority] || AGENT_PRIORITY_CONFIG.normal;
    r = acfg.radius;
  } else {
    const cfg = COMPLEXITY_CONFIG[node.complexity] || COMPLEXITY_CONFIG.intermediate;
    const featured = FEATURED_NODES[node.id];
    r = featured ? featured.radius : cfg.radius;
  }
  ctx.beginPath();
  ctx.arc(node.x, node.y, Math.max(r + 4, 8), 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
}

function isNodeHighlighted(node) {
  return highlightedNodeIds === null || highlightedNodeIds.has(node.id);
}

/** Invalidate canvas so drawNode() re-runs with current state. */
function redraw() {
  if (graph) graph.nodeCanvasObject(drawNode);
}

function handleNodeClick(node) {
  if (node) {
    selectedNodeId = node.id;
    rebuildHighlightSet();
    redraw();
    if (onNodeClick) onNodeClick(node);
  }
}

function handleNodeHover(node) {
  hoveredNodeId = node ? node.id : null;
  rebuildHighlightSet();
  redraw();
  if (onNodeHover) onNodeHover(node);
}

function handleBackgroundClick() {
  selectedNodeId = null;
  rebuildHighlightSet();
  redraw();
  if (onNodeClick) onNodeClick(null);
}

export function selectNode(id) {
  selectedNodeId = id;
  rebuildHighlightSet();
  const node = nodeById.get(id);
  if (node && graph) {
    graph.centerAt(node.x, node.y, 500);
    graph.zoom(4, 500);
  }
}

export function clearSelection() {
  selectedNodeId = null;
  hoveredNodeId = null;
  rebuildHighlightSet();
  redraw();
}

export function focusNode(id) {
  const node = nodeById.get(id);
  if (node && graph) {
    selectedNodeId = id;
    rebuildHighlightSet();
    graph.centerAt(node.x, node.y, 800);
    graph.zoom(4, 800);
  }
}

export function resetView() {
  clearSelection();
  if (graph) graph.zoomToFit(600, 40);
}

export function zoomIn() {
  if (graph) graph.zoom(graph.zoom() * 1.5, 300);
}

export function zoomOut() {
  if (graph) graph.zoom(graph.zoom() / 1.5, 300);
}

export function setSkillVisibility(visibleSkillIds) {
  const visSet = visibleSkillIds instanceof Set ? visibleSkillIds : new Set(visibleSkillIds);

  const filteredNodes = fullData.nodes
    .filter(n => {
      if (n.type === 'team') {
        if (visibleTeamIds === null) return true;
        return visibleTeamIds.has(n.id);
      }
      if (n.type === 'agent') {
        if (visibleAgentIds === null) return true;
        return visibleAgentIds.has(n.id);
      }
      return visSet.has(n.id);
    })
    .map(n => ({ ...n }));

  const nodeIds = new Set(filteredNodes.map(n => n.id));
  const filteredLinks = fullData.links
    .filter(l => {
      const src = typeof l.source === 'object' ? l.source.id : l.source;
      const tgt = typeof l.target === 'object' ? l.target.id : l.target;
      return nodeIds.has(src) && nodeIds.has(tgt);
    })
    .map(l => ({
      source: typeof l.source === 'object' ? l.source.id : l.source,
      target: typeof l.target === 'object' ? l.target.id : l.target,
      type: l.type,
    }));

  graphData = { nodes: filteredNodes, links: filteredLinks };
  rebuildNodeIndex();
  precomputeLinkColors();

  if (graph) {
    graph.graphData(graphData);
    setTimeout(() => graph.zoomToFit(400, 40), 500);
  }
}

/** @deprecated Use setSkillVisibility instead */
export function setDomainVisibility(visibleDomains) {
  const visSet = new Set(visibleDomains);
  const skillIds = fullData.nodes
    .filter(n => n.type === 'skill' && visSet.has(n.domain))
    .map(n => n.id);
  setSkillVisibility(skillIds);
}

export function refreshGraph() {
  precomputeLinkColors();
  glowCache.clear(); // invalidate gradient textures on theme switch
  redraw();
}

export function getGraph() { return graph; }
