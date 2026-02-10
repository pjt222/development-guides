/**
 * graph.js - Force-graph setup, node/link rendering, interactions
 */

import { DOMAIN_COLORS, COMPLEXITY_CONFIG, FEATURED_NODES, hexToRgba } from './colors.js';

let graph = null;
let graphData = { nodes: [], links: [] };
let fullData = { nodes: [], links: [] };
let selectedNodeId = null;
let hoveredNodeId = null;
let onNodeClick = null;
let onNodeHover = null;

// ── Icon state ──────────────────────────────────────────────────────
let iconMode = false;
const iconImages = new Map();   // skillId -> Image
const iconLoadFailed = new Set();
const ICON_ZOOM_THRESHOLD = 1.0;

const SAME_DOMAIN_DISTANCE = 40;
const CROSS_DOMAIN_DISTANCE = 100;
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
      const activeId = selectedNodeId || hoveredNodeId;
      if (!activeId) return 'rgba(255,255,255,0.06)';
      const src = typeof link.source === 'object' ? link.source.id : link.source;
      const tgt = typeof link.target === 'object' ? link.target.id : link.target;
      if (src === activeId || tgt === activeId) {
        const connectedNode = graphData.nodes.find(n => n.id === (src === activeId ? tgt : src));
        const color = connectedNode ? (DOMAIN_COLORS[connectedNode.domain] || '#ffffff') : '#ffffff';
        return hexToRgba(color, 0.35);
      }
      return 'rgba(255,255,255,0.02)';
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
export function preloadIcons(nodes) {
  for (const node of nodes) {
    const path = `icons/${node.domain}/${node.id}.webp`;
    const img = new Image();
    img.onload = () => iconImages.set(node.id, img);
    img.onerror = () => iconLoadFailed.add(node.id);
    img.src = path;
  }
}

export function setIconMode(enabled) {
  iconMode = !!enabled;
}

export function getIconMode() {
  return iconMode;
}

// ── Node rendering ──────────────────────────────────────────────────
function drawNode(node, ctx, globalScale) {
  const x = node.x;
  const y = node.y;
  if (!isFinite(x) || !isFinite(y)) return;

  const color = DOMAIN_COLORS[node.domain] || '#ffffff';
  const cfg = COMPLEXITY_CONFIG[node.complexity] || COMPLEXITY_CONFIG.intermediate;
  const featured = FEATURED_NODES[node.id];
  const r = featured ? featured.radius : cfg.radius;

  const isHighlighted = isNodeHighlighted(node);
  const dimmed = (selectedNodeId || hoveredNodeId) && !isHighlighted;
  const alpha = dimmed ? 0.12 : 1;

  const useIcon = iconMode && iconImages.has(node.id) && globalScale > ICON_ZOOM_THRESHOLD;

  if (useIcon) {
    // ── Icon mode: draw image with domain-colored glow ──
    const img = iconImages.get(node.id);
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
  const cfg = COMPLEXITY_CONFIG[node.complexity] || COMPLEXITY_CONFIG.intermediate;
  const featured = FEATURED_NODES[node.id];
  const r = featured ? featured.radius : cfg.radius;
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

export function setDomainVisibility(visibleDomains) {
  const visSet = new Set(visibleDomains);
  const filteredNodes = fullData.nodes
    .filter(n => visSet.has(n.domain))
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
    }));

  graphData = { nodes: filteredNodes, links: filteredLinks };

  if (graph) {
    graph.graphData(graphData);
    setTimeout(() => graph.zoomToFit(400, 40), 500);
  }
}

export function refreshGraph() {
  if (graph) graph.nodeCanvasObject(drawNode);
}

export function getGraph() { return graph; }
