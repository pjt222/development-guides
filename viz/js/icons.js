/**
 * icons.js - Shared icon state and path utility
 *
 * Single source of truth for icon mode across all visualization modes (2D, 3D, Hive).
 * Each renderer maintains its own format-specific cache (Image, THREE.Texture, SVG path).
 */

import { getCurrentThemeName } from './colors.js';

let iconMode = false;
export const ICON_ZOOM_THRESHOLD = 1.0;

export function setIconMode(v) { iconMode = !!v; }
export function getIconMode() { return iconMode; }

export function getIconPath(node, palette) {
  const pal = palette || getCurrentThemeName();
  if (node.type === 'team') return `icons/${pal}/teams/${node.id.replace('team:', '')}.webp`;
  if (node.type === 'agent') return `icons/${pal}/agents/${node.id.replace('agent:', '')}.webp`;
  return `icons/${pal}/${node.domain}/${node.id}.webp`;
}

// ── Loaded-icon tracker (shared across renderers) ────────────────
const loadedIcons = new Map(); // palette -> Set(nodeId)

export function markIconLoaded(palette, nodeId) {
  if (!loadedIcons.has(palette)) loadedIcons.set(palette, new Set());
  loadedIcons.get(palette).add(nodeId);
}

export function isIconLoaded(nodeId, palette) {
  const pal = palette || getCurrentThemeName();
  return loadedIcons.has(pal) && loadedIcons.get(pal).has(nodeId);
}
