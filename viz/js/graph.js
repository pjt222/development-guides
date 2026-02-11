/**
 * graph.js - Force-graph setup, node/link rendering, interactions
 */

import { DOMAIN_COLORS, COMPLEXITY_CONFIG, FEATURED_NODES, hexToRgba, getAgentColor, AGENT_PRIORITY_CONFIG, getCurrentThemeName } from './colors.js';

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

// ── Agent state ─────────────────────────────────────────────────────
let visibleAgentIds = null; // null = all visible, Set = specific IDs

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

const SAME_DOMAIN_DISTANCE = 40;
const CROSS_DOMAIN_DISTANCE = 100;
const AGENT_LINK_DISTANCE = 120;
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
      const activeId = selectedNodeId || hoveredNodeId;
      // Find agent node for this link to get per-agent color
      const getAgentLinkColor = (alpha) => {
        const src = typeof link.source === 'object' ? link.source : graphData.nodes.find(n => n.id === link.source);
        const agentNode = src && src.type === 'agent' ? src : null;
        if (!agentNode) {
          const tgt = typeof link.target === 'object' ? link.target : graphData.nodes.find(n => n.id === link.target);
          const aNode = tgt && tgt.type === 'agent' ? tgt : null;
          if (aNode) return hexToRgba(getAgentColor(aNode.id.replace('agent:', '')), alpha);
        } else {
          return hexToRgba(getAgentColor(agentNode.id.replace('agent:', '')), alpha);
        }
        return hexToRgba(getAgentColor(), alpha);
      };
      if (!activeId) {
        return isAgentLink
          ? getAgentLinkColor(0.04)
          : 'rgba(255,255,255,0.06)';
      }
      const src = typeof link.source === 'object' ? link.source.id : link.source;
      const tgt = typeof link.target === 'object' ? link.target.id : link.target;
      if (src === activeId || tgt === activeId) {
        if (isAgentLink) return getAgentLinkColor(0.3);
        const connectedNode = graphData.nodes.find(n => n.id === (src === activeId ? tgt : src));
        const color = connectedNode ? (DOMAIN_COLORS[connectedNode.domain] || '#ffffff') : '#ffffff';
        return hexToRgba(color, 0.35);
      }
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
      if (link.type === 'agent') return AGENT_LINK_DISTANCE;
      const src = typeof link.source === 'object' ? link.source : graphData.nodes.find(n => n.id === link.source);
      const tgt = typeof link.target === 'object' ? link.target : graphData.nodes.find(n => n.id === link.target);
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
    const path = node.type === 'agent'
      ? `icons/${pal}/agents/${node.id.replace('agent:', '')}.webp`
      : `icons/${pal}/${node.domain}/${node.id}.webp`;
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
    const grad = ctx.createRadialGradient(x, y, iconSize * 0.3, x, y, iconSize);
    grad.addColorStop(0, hexToRgba(color, 0.12 * alpha));
    grad.addColorStop(1, hexToRgba(color, 0));
    ctx.beginPath();
    ctx.arc(x, y, iconSize, 0, 2 * Math.PI);
    ctx.fillStyle = grad;
    ctx.fill();

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
    const grad = ctx.createRadialGradient(x, y, r * 0.5, x, y, cfg.glowRadius);
    grad.addColorStop(0, hexToRgba(color, cfg.glowOpacity * alpha));
    grad.addColorStop(1, hexToRgba(color, 0));
    ctx.beginPath();
    ctx.arc(x, y, cfg.glowRadius, 0, 2 * Math.PI);
    ctx.fillStyle = grad;
    ctx.fill();

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

  // Label
  const hasActiveSelection = !!(selectedNodeId || hoveredNodeId);
  const showLabel = (hasActiveSelection && isHighlightedNode && !dimmed) || globalScale > LABEL_ZOOM_THRESHOLD;
  if (showLabel) {
    const fontSize = Math.max(10 / globalScale, 2);
    ctx.font = `bold ${fontSize}px 'Share Tech Mono', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = `rgba(255,255,255,${0.9 * alpha})`;
    const labelY = useIcon ? y + r * 1.4 : y + r + 2;
    ctx.fillText(node.title || node.id, x, labelY);
  }
}

// ── Node rendering ──────────────────────────────────────────────────
function drawNode(node, ctx, globalScale) {
  const x = node.x;
  const y = node.y;
  if (!isFinite(x) || !isFinite(y)) return;

  if (node.type === 'agent') {
    drawAgentNode(node, ctx, globalScale);
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
    const grad = ctx.createRadialGradient(x, y, iconSize * 0.3, x, y, iconSize * glowMult);
    grad.addColorStop(0, hexToRgba(color, 0.12 * alpha));
    grad.addColorStop(1, hexToRgba(color, 0));
    ctx.beginPath();
    ctx.arc(x, y, iconSize * glowMult, 0, 2 * Math.PI);
    ctx.fillStyle = grad;
    ctx.fill();

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
    const grad = ctx.createRadialGradient(x, y, r * 0.5, x, y, glowRadius);
    grad.addColorStop(0, hexToRgba(color, cfg.glowOpacity * alpha));
    grad.addColorStop(1, hexToRgba(color, 0));
    ctx.beginPath();
    ctx.arc(x, y, glowRadius, 0, 2 * Math.PI);
    ctx.fillStyle = grad;
    ctx.fill();

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
    const fontSize = Math.max(10 / globalScale, 2);
    ctx.font = `${fontSize}px 'Share Tech Mono', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = `rgba(255,255,255,${0.9 * alpha})`;
    const labelY = useIcon ? y + r * 1.4 : y + r + 2;
    ctx.fillText(node.title || node.id, x, labelY);
  }
}

function drawHitArea(node, color, ctx) {
  if (!isFinite(node.x) || !isFinite(node.y)) return;
  let r;
  if (node.type === 'agent') {
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
  const activeId = selectedNodeId || hoveredNodeId;
  if (!activeId) return true;
  if (node.id === activeId) return true;
  return graphData.links.some(l => {
    const src = typeof l.source === 'object' ? l.source.id : l.source;
    const tgt = typeof l.target === 'object' ? l.target.id : l.target;
    return (src === activeId && tgt === node.id) || (tgt === activeId && src === node.id);
  });
}

function handleNodeClick(node) {
  if (node) {
    selectedNodeId = node.id;
    if (onNodeClick) onNodeClick(node);
  }
}

function handleNodeHover(node) {
  hoveredNodeId = node ? node.id : null;
  if (onNodeHover) onNodeHover(node);
}

function handleBackgroundClick() {
  selectedNodeId = null;
  if (onNodeClick) onNodeClick(null);
}

export function selectNode(id) {
  selectedNodeId = id;
  const node = graphData.nodes.find(n => n.id === id);
  if (node && graph) {
    graph.centerAt(node.x, node.y, 500);
    graph.zoom(4, 500);
  }
}

export function clearSelection() {
  selectedNodeId = null;
  hoveredNodeId = null;
}

export function focusNode(id) {
  const node = graphData.nodes.find(n => n.id === id);
  if (node && graph) {
    selectedNodeId = id;
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
  if (graph) graph.nodeCanvasObject(drawNode);
}

export function getGraph() { return graph; }
