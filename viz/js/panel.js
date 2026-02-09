/**
 * panel.js - Right-side detail panel (open/close/populate)
 */

import { DOMAIN_COLORS, COMPLEXITY_BADGE_COLORS } from './colors.js';

const GITHUB_BASE = 'https://github.com/pjt222/development-guides/blob/main/skills/';

let panelEl = null;
let onRelatedClick = null;

export function initPanel(el, { onRelated } = {}) {
  panelEl = el;
  onRelatedClick = onRelated;

  const closeBtn = panelEl.querySelector('.panel-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', closePanel);
  }
}

export function openPanel(node) {
  if (!panelEl || !node) return;

  const color = DOMAIN_COLORS[node.domain] || '#ffffff';
  const badgeColor = COMPLEXITY_BADGE_COLORS[node.complexity] || '#999';

  const iconSrc = `icons/${encodeURI(node.domain)}/${encodeURI(node.id)}.webp`;
  let html = `
    <div class="panel-icon-wrapper">
      <img class="panel-icon" src="${iconSrc}" alt="" onerror="this.parentElement.style.display='none'">
    </div>
    <h2 class="panel-title" style="color: ${color}; text-shadow: 0 0 12px ${color}">${escHtml(node.title || node.id)}</h2>
    <div class="panel-badges">
      <span class="badge badge-domain" style="border-color: ${color}; color: ${color}">${escHtml(node.domain)}</span>
      <span class="badge badge-complexity" style="border-color: ${badgeColor}; color: ${badgeColor}">${escHtml(node.complexity)}</span>
      <span class="badge badge-lang">${escHtml(node.language)}</span>
    </div>
    <p class="panel-desc">${escHtml(node.description)}</p>
  `;

  if (node.tags && node.tags.length) {
    html += `<div class="panel-tags">${node.tags.map(t =>
      `<span class="tag">${escHtml(t)}</span>`
    ).join('')}</div>`;
  }

  if (node.related && node.related.length) {
    html += `<h3 class="panel-section-title">Related Skills</h3><ul class="panel-related">`;
    for (const rid of node.related) {
      html += `<li><a href="#" class="related-link" data-id="${escAttr(rid)}">${escHtml(rid)}</a></li>`;
    }
    html += `</ul>`;
  }

  html += `
    <div class="panel-actions">
      <a href="${GITHUB_BASE}${encodeURI(node.path)}" target="_blank" rel="noopener" class="source-link">
        View Source SKILL.md
      </a>
    </div>
  `;

  const content = panelEl.querySelector('.panel-content');
  if (content) content.innerHTML = html;

  // Bind related skill links
  panelEl.querySelectorAll('.related-link').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const id = a.dataset.id;
      if (onRelatedClick) onRelatedClick(id);
    });
  });

  panelEl.classList.add('open');
}

export function closePanel() {
  if (panelEl) panelEl.classList.remove('open');
}

function escHtml(s) {
  const div = document.createElement('div');
  div.textContent = s || '';
  return div.innerHTML;
}

function escAttr(s) {
  return (s || '').replace(/"/g, '&quot;');
}
