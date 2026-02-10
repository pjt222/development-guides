/**
 * filters.js - Left-side filter panel with collapsible Skills & Agents sections
 */

import { DOMAIN_COLORS, getAgentColor } from './colors.js';

let filterEl = null;
let domainStates = {};   // domain -> boolean
let agentStates = {};    // agentId -> boolean
let onChange = null;
let onAgentChange = null;

export function initFilters(el, domains, agents, { onFilterChange, onAgentFilterChange } = {}) {
  filterEl = el;
  onChange = onFilterChange;
  onAgentChange = onAgentFilterChange;

  // Initialize all domains as visible
  for (const domain of Object.keys(domains)) {
    domainStates[domain] = true;
  }

  // Initialize all agents as visible
  for (const agent of agents) {
    agentStates[agent.id] = true;
  }

  renderSkills(domains);
  renderAgents(agents);
  bindSectionHeaders();
  bindPanelToggle();

  // Update section counts
  updateSkillsCount(domains);
  updateAgentsCount(agents);
}

// ── Skills section ───────────────────────────────────────────────────

function renderSkills(domains) {
  const list = filterEl.querySelector('#skills-filter-list');
  if (!list) return;

  list.innerHTML = '';
  const sorted = Object.entries(domains).sort((a, b) => b[1].count - a[1].count);

  for (const [domain, info] of sorted) {
    const color = DOMAIN_COLORS[domain] || '#888';
    const item = document.createElement('label');
    item.className = 'filter-item';
    item.innerHTML = `
      <input type="checkbox" data-domain="${domain}" ${domainStates[domain] ? 'checked' : ''}>
      <span class="filter-swatch" style="background: ${color}"></span>
      <span class="filter-name">${domain}</span>
      <span class="filter-count">${info.count}</span>
    `;
    list.appendChild(item);

    item.querySelector('input').addEventListener('change', e => {
      domainStates[domain] = e.target.checked;
      fireDomainChange();
    });
  }
}

function updateSkillsCount(domains) {
  const el = filterEl.querySelector('#skills-section-count');
  if (el) {
    const total = Object.values(domains).reduce((s, d) => s + d.count, 0);
    el.textContent = total;
  }
}

// ── Agents section ───────────────────────────────────────────────────

function renderAgents(agents) {
  const list = filterEl.querySelector('#agents-filter-list');
  if (!list) return;

  list.innerHTML = '';
  const color = getAgentColor();

  // Sort agents: critical first, then high, then normal; alphabetical within priority
  const priorityOrder = { critical: 0, high: 1, normal: 2 };
  const sorted = [...agents].sort((a, b) => {
    const pa = priorityOrder[a.priority] ?? 2;
    const pb = priorityOrder[b.priority] ?? 2;
    if (pa !== pb) return pa - pb;
    return (a.title || a.id).localeCompare(b.title || b.id);
  });

  for (const agent of sorted) {
    const item = document.createElement('label');
    item.className = 'filter-item';
    item.innerHTML = `
      <input type="checkbox" data-agent="${agent.id}" ${agentStates[agent.id] ? 'checked' : ''}>
      <span class="filter-swatch agent-hex" style="background: ${color}"></span>
      <span class="filter-name">${agent.title || agent.id}</span>
      <span class="filter-count">${agent.priority || ''}</span>
    `;
    list.appendChild(item);

    item.querySelector('input').addEventListener('change', e => {
      agentStates[agent.id] = e.target.checked;
      fireAgentChange();
    });
  }
}

function updateAgentsCount(agents) {
  const el = filterEl.querySelector('#agents-section-count');
  if (el) el.textContent = agents.length;
}

// ── Section collapse / expand ────────────────────────────────────────

function bindSectionHeaders() {
  filterEl.querySelectorAll('.filter-section-header').forEach(header => {
    // Collapse/expand on header click (but not on bulk buttons)
    header.addEventListener('click', e => {
      // Ignore clicks on bulk buttons inside the header
      if (e.target.closest('.filter-bulk')) return;

      const expanded = header.getAttribute('aria-expanded') === 'true';
      header.setAttribute('aria-expanded', !expanded);
      const body = header.nextElementSibling;
      if (body) body.classList.toggle('open', !expanded);
    });

    // Bulk All/None buttons
    const section = header.closest('.filter-section');
    const target = section?.dataset.section;

    header.querySelectorAll('.filter-bulk button').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation(); // Don't toggle section
        const isAll = btn.classList.contains('filter-all');

        if (target === 'skills') {
          for (const d of Object.keys(domainStates)) domainStates[d] = isAll;
          filterEl.querySelectorAll('#skills-filter-list input[type=checkbox]')
            .forEach(cb => cb.checked = isAll);
          fireDomainChange();
        } else if (target === 'agents') {
          for (const a of Object.keys(agentStates)) agentStates[a] = isAll;
          filterEl.querySelectorAll('#agents-filter-list input[type=checkbox]')
            .forEach(cb => cb.checked = isAll);
          fireAgentChange();
        }
      });
    });
  });
}

// ── Panel toggle (collapse entire panel) ─────────────────────────────

function bindPanelToggle() {
  const toggle = document.getElementById('panel-toggle');
  if (!toggle) return;

  toggle.addEventListener('click', () => {
    const collapsed = filterEl.classList.toggle('collapsed');
    toggle.classList.toggle('collapsed', collapsed);
  });
}

// ── Fire callbacks ───────────────────────────────────────────────────

function fireDomainChange() {
  if (onChange) {
    onChange(getVisibleDomains());
  }
}

function fireAgentChange() {
  if (onAgentChange) {
    onAgentChange(getVisibleAgentIds());
  }
}

// ── Public getters ───────────────────────────────────────────────────

export function getVisibleDomains() {
  return Object.entries(domainStates)
    .filter(([, v]) => v)
    .map(([k]) => k);
}

export function getVisibleAgentIds() {
  return Object.entries(agentStates)
    .filter(([, v]) => v)
    .map(([k]) => k);
}

// ── Swatch refresh (theme change) ────────────────────────────────────

export function refreshSwatches() {
  if (!filterEl) return;

  // Refresh domain swatches
  filterEl.querySelectorAll('#skills-filter-list .filter-item').forEach(item => {
    const cb = item.querySelector('input[data-domain]');
    if (cb) {
      const swatch = item.querySelector('.filter-swatch');
      if (swatch) swatch.style.background = DOMAIN_COLORS[cb.dataset.domain] || '#888';
    }
  });

  // Refresh agent swatches
  const agentColor = getAgentColor();
  filterEl.querySelectorAll('#agents-filter-list .filter-swatch').forEach(swatch => {
    swatch.style.background = agentColor;
  });
}
