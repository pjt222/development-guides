/**
 * panel.js - Right-side detail panel (open/close/populate)
 */

import { DOMAIN_COLORS, COMPLEXITY_BADGE_COLORS, getAgentColor, getCurrentThemeName } from './colors.js';

const GITHUB_BASE = 'https://github.com/pjt222/development-guides/blob/main/skills/';
const GITHUB_AGENTS_BASE = 'https://github.com/pjt222/development-guides/blob/main/';

const PRIORITY_BADGE_COLORS = {
  critical: '#ff4444',
  high:     '#ffaa00',
  normal:   '#888899',
};

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

  if (node.type === 'agent') {
    openAgentPanel(node);
    return;
  }

  openSkillPanel(node);
}

function openSkillPanel(node) {
  const color = DOMAIN_COLORS[node.domain] || '#ffffff';
  const badgeColor = COMPLEXITY_BADGE_COLORS[node.complexity] || '#999';

  const iconSrc = `icons/${getCurrentThemeName()}/${encodeURI(node.domain)}/${encodeURI(node.id)}.webp`;
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

  setPanelContent(html);
}

function openAgentPanel(node) {
  const agentId = node.id.replace('agent:', '');
  const color = getAgentColor(agentId);
  const priorityColor = PRIORITY_BADGE_COLORS[node.priority] || '#888899';

  const iconSrc = `icons/${getCurrentThemeName()}/agents/${encodeURI(agentId)}.webp`;

  let html = `
    <div class="panel-icon-wrapper">
      <img class="panel-icon" src="${iconSrc}" alt=""
        onerror="this.parentElement.innerHTML='<div class=\\'panel-agent-hex\\' style=\\'color:${color};text-shadow:0 0 16px ${color}\\'>&#x2B22;</div>'">
    </div>
    <h2 class="panel-title" style="color: ${color}; text-shadow: 0 0 12px ${color}">${escHtml(node.title || node.id)}</h2>
    <div class="panel-badges">
      <span class="badge" style="border-color: ${color}; color: ${color}">agent</span>
      <span class="badge" style="border-color: ${priorityColor}; color: ${priorityColor}">${escHtml(node.priority)}</span>
    </div>
    <p class="panel-desc">${escHtml(node.description)}</p>
  `;

  if (node.tools && node.tools.length) {
    html += `<h3 class="panel-section-title">Tools</h3>`;
    html += `<div class="panel-tags">${node.tools.map(t =>
      `<span class="tag">${escHtml(t)}</span>`
    ).join('')}</div>`;
  }

  if (node.mcp_servers && node.mcp_servers.length) {
    html += `<h3 class="panel-section-title">MCP Servers</h3>`;
    html += `<div class="panel-tags">${node.mcp_servers.map(t =>
      `<span class="tag">${escHtml(t)}</span>`
    ).join('')}</div>`;
  }

  if (node.tags && node.tags.length) {
    html += `<h3 class="panel-section-title">Tags</h3>`;
    html += `<div class="panel-tags">${node.tags.map(t =>
      `<span class="tag">${escHtml(t)}</span>`
    ).join('')}</div>`;
  }

  if (node.skills && node.skills.length) {
    html += `<h3 class="panel-section-title">Skills (${node.skills.length})</h3><ul class="panel-related">`;
    for (const sid of node.skills) {
      html += `<li><a href="#" class="related-link" data-id="${escAttr(sid)}">${escHtml(sid)}</a></li>`;
    }
    html += `</ul>`;
  }

  html += `
    <div class="panel-actions">
      <a href="${GITHUB_AGENTS_BASE}${encodeURI(node.path)}" target="_blank" rel="noopener" class="source-link">
        View Agent Definition
      </a>
    </div>
  `;

  setPanelContent(html);
}

function setPanelContent(html) {
  const content = panelEl.querySelector('.panel-content');
  if (content) content.innerHTML = html;

  // Bind related/skill links
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
