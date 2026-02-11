/**
 * filters.js - Left-side filter panel with per-skill and per-agent filtering
 *
 * Skills are grouped by domain with expandable sections.
 * Domain checkboxes act as parent toggles (all/none/indeterminate).
 * A search box filters visible skills and auto-expands matching domains.
 */

import { DOMAIN_COLORS, getAgentColor } from './colors.js';

let filterEl = null;
let skillStates = {};       // skillId -> boolean
let agentStates = {};       // agentId -> boolean
let skillsByDomain = {};    // domain -> [nodeObj, ...]
let domainExpanded = {};    // domain -> boolean
let onChange = null;
let onAgentChange = null;

/**
 * @param {HTMLElement} el - Filter panel element
 * @param {Array} skillNodes - Array of skill node objects (from data.nodes where type==='skill')
 * @param {Array} agents - Array of agent node objects
 * @param {Object} callbacks - { onFilterChange, onAgentFilterChange }
 */
export function initFilters(el, skillNodes, agents, { onFilterChange, onAgentFilterChange } = {}) {
  filterEl = el;
  onChange = onFilterChange;
  onAgentChange = onAgentFilterChange;

  // Build domain -> skills lookup
  skillsByDomain = {};
  for (const node of skillNodes) {
    if (!skillsByDomain[node.domain]) skillsByDomain[node.domain] = [];
    skillsByDomain[node.domain].push(node);
  }

  // Sort skills within each domain alphabetically
  for (const domain of Object.keys(skillsByDomain)) {
    skillsByDomain[domain].sort((a, b) => (a.title || a.id).localeCompare(b.title || b.id));
  }

  // Initialize all skills as visible
  for (const node of skillNodes) {
    skillStates[node.id] = true;
  }

  // Initialize all agents as visible
  for (const agent of agents) {
    agentStates[agent.id] = true;
  }

  // Initialize all domains as collapsed
  for (const domain of Object.keys(skillsByDomain)) {
    domainExpanded[domain] = false;
  }

  renderSearchBox();
  renderSkills();
  renderAgents(agents);
  bindSectionHeaders();
  bindPanelToggle();

  // Update section counts
  updateSkillsCount();
  updateAgentsCount(agents);
}

// ── Search box ─────────────────────────────────────────────────────

function renderSearchBox() {
  const list = filterEl.querySelector('#skills-filter-list');
  if (!list) return;

  // Insert search box before the filter list
  const existing = filterEl.querySelector('.filter-search');
  if (existing) existing.remove();

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'filter-search';
  input.placeholder = 'Search skills\u2026';
  input.setAttribute('aria-label', 'Search skills');

  list.parentNode.insertBefore(input, list);

  input.addEventListener('input', () => {
    applySearch(input.value.trim().toLowerCase());
  });
}

function applySearch(query) {
  const list = filterEl.querySelector('#skills-filter-list');
  if (!list) return;

  const groups = list.querySelectorAll('.filter-domain-group');

  for (const group of groups) {
    const domain = group.dataset.domain;
    const skillItems = group.querySelectorAll('.filter-skill-item');
    let visibleCount = 0;

    for (const item of skillItems) {
      const name = item.querySelector('.filter-skill-name')?.textContent.toLowerCase() || '';
      const matches = !query || name.includes(query);
      item.classList.toggle('hidden', !matches);
      if (matches) visibleCount++;
    }

    // Domain matches if its name matches or any child skill matches
    const domainName = domain.toLowerCase();
    const domainMatches = !query || domainName.includes(query) || visibleCount > 0;

    group.classList.toggle('hidden', !domainMatches);

    // If searching and there are matches, show all skills in the domain and auto-expand
    if (query && domainMatches) {
      if (domainName.includes(query)) {
        // Domain name matches: show all skills
        for (const item of skillItems) item.classList.remove('hidden');
      }
      group.classList.add('expanded');
    } else if (!query) {
      // Restore collapsed state when clearing search
      group.classList.toggle('expanded', domainExpanded[domain] || false);
    }
  }
}

// ── Skills section ───────────────────────────────────────────────

function renderSkills() {
  const list = filterEl.querySelector('#skills-filter-list');
  if (!list) return;

  list.innerHTML = '';

  // Sort domains by skill count descending
  const sorted = Object.entries(skillsByDomain).sort((a, b) => b[1].length - a[1].length);

  for (const [domain, skills] of sorted) {
    const color = DOMAIN_COLORS[domain] || '#888';
    const group = document.createElement('div');
    group.className = 'filter-domain-group';
    group.dataset.domain = domain;

    // Domain header
    const header = document.createElement('div');
    header.className = 'filter-domain-header';
    header.innerHTML = `
      <span class="filter-domain-chevron" aria-hidden="true">&#x25BE;</span>
      <input type="checkbox" data-domain="${domain}" checked>
      <span class="filter-swatch" style="background: ${color}"></span>
      <span class="filter-domain-name">${domain}</span>
      <span class="filter-domain-count">${skills.length}</span>
    `;

    const domainCb = header.querySelector('input');

    // Chevron / header click toggles expand
    header.addEventListener('click', e => {
      if (e.target === domainCb) return; // Don't toggle expand on checkbox click
      e.preventDefault();
      domainExpanded[domain] = !domainExpanded[domain];
      group.classList.toggle('expanded', domainExpanded[domain]);
    });

    // Domain checkbox toggles all child skills
    domainCb.addEventListener('change', () => {
      const checked = domainCb.checked;
      for (const skill of skills) {
        skillStates[skill.id] = checked;
      }
      // Update child checkboxes
      group.querySelectorAll('.filter-skill-item input').forEach(cb => {
        cb.checked = checked;
      });
      domainCb.indeterminate = false;
      fireSkillChange();
    });

    group.appendChild(header);

    // Skill items container
    const skillsContainer = document.createElement('div');
    skillsContainer.className = 'filter-domain-skills';

    for (const skill of skills) {
      const item = document.createElement('label');
      item.className = 'filter-skill-item';
      item.innerHTML = `
        <input type="checkbox" data-skill="${skill.id}" checked>
        <span class="filter-skill-name">${skill.title || skill.id}</span>
      `;

      const skillCb = item.querySelector('input');
      skillCb.addEventListener('change', () => {
        skillStates[skill.id] = skillCb.checked;
        updateDomainCheckbox(domain);
        fireSkillChange();
      });

      skillsContainer.appendChild(item);
    }

    group.appendChild(skillsContainer);
    list.appendChild(group);
  }
}

function updateDomainCheckbox(domain) {
  const skills = skillsByDomain[domain];
  if (!skills) return;

  const allChecked = skills.every(s => skillStates[s.id]);
  const noneChecked = skills.every(s => !skillStates[s.id]);

  const group = filterEl.querySelector(`.filter-domain-group[data-domain="${domain}"]`);
  if (!group) return;

  const domainCb = group.querySelector('.filter-domain-header input[data-domain]');
  if (!domainCb) return;

  domainCb.checked = allChecked;
  domainCb.indeterminate = !allChecked && !noneChecked;
}

function updateSkillsCount() {
  const el = filterEl.querySelector('#skills-section-count');
  if (!el) return;

  const total = Object.keys(skillStates).length;
  const visible = Object.values(skillStates).filter(Boolean).length;
  el.textContent = visible < total ? `${visible}/${total}` : String(total);
}

// ── Agents section ───────────────────────────────────────────────

function renderAgents(agents) {
  const list = filterEl.querySelector('#agents-filter-list');
  if (!list) return;

  list.innerHTML = '';

  // Sort agents: critical first, then high, then normal; alphabetical within priority
  const priorityOrder = { critical: 0, high: 1, normal: 2 };
  const sorted = [...agents].sort((a, b) => {
    const pa = priorityOrder[a.priority] ?? 2;
    const pb = priorityOrder[b.priority] ?? 2;
    if (pa !== pb) return pa - pb;
    return (a.title || a.id).localeCompare(b.title || b.id);
  });

  for (const agent of sorted) {
    const agentId = agent.id.replace('agent:', '');
    const color = getAgentColor(agentId);
    const item = document.createElement('label');
    item.className = 'filter-item';
    item.innerHTML = `
      <input type="checkbox" data-agent="${agent.id}" ${agentStates[agent.id] ? 'checked' : ''}>
      <span class="filter-swatch agent-hex" data-agent-id="${agentId}" style="background: ${color}"></span>
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
  if (!el) return;

  const total = agents.length;
  const visible = Object.values(agentStates).filter(Boolean).length;
  el.textContent = visible < total ? `${visible}/${total}` : String(total);
}

// ── Section collapse / expand ────────────────────────────────────

function toggleSection(header) {
  const expanded = header.getAttribute('aria-expanded') === 'true';
  header.setAttribute('aria-expanded', !expanded);
  const bodyId = header.getAttribute('aria-controls');
  const body = bodyId ? document.getElementById(bodyId) : header.nextElementSibling;
  if (body) body.classList.toggle('open', !expanded);
}

function bindSectionHeaders() {
  filterEl.querySelectorAll('.filter-section-header').forEach(header => {
    // Collapse/expand on header click (but not on bulk buttons)
    header.addEventListener('click', e => {
      if (e.target.closest('.filter-bulk')) return;
      toggleSection(header);
    });

    // Keyboard support for div[role="button"]
    header.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        if (e.target.closest('.filter-bulk')) return;
        e.preventDefault();
        toggleSection(header);
      }
    });

    // Bulk All/None buttons
    const section = header.closest('.filter-section');
    const target = section?.dataset.section;

    header.querySelectorAll('.filter-bulk button').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation(); // Don't toggle section
        const isAll = btn.classList.contains('filter-all');

        if (target === 'skills') {
          for (const id of Object.keys(skillStates)) skillStates[id] = isAll;
          // Update all skill checkboxes
          filterEl.querySelectorAll('#skills-filter-list .filter-skill-item input[type=checkbox]')
            .forEach(cb => cb.checked = isAll);
          // Update all domain checkboxes
          filterEl.querySelectorAll('#skills-filter-list .filter-domain-header input[type=checkbox]')
            .forEach(cb => {
              cb.checked = isAll;
              cb.indeterminate = false;
            });
          updateSkillsCount();
          fireSkillChange();
        } else if (target === 'agents') {
          for (const a of Object.keys(agentStates)) agentStates[a] = isAll;
          filterEl.querySelectorAll('#agents-filter-list input[type=checkbox]')
            .forEach(cb => cb.checked = isAll);
          updateAgentsCount(
            Object.keys(agentStates).map(id => ({ id }))
          );
          fireAgentChange();
        }
      });
    });
  });
}

// ── Panel toggle (collapse entire panel) ─────────────────────────

function bindPanelToggle() {
  const toggle = document.getElementById('panel-toggle');
  if (!toggle) return;

  toggle.addEventListener('click', () => {
    const collapsed = filterEl.classList.toggle('collapsed');
    toggle.classList.toggle('collapsed', collapsed);
    toggle.setAttribute('aria-expanded', !collapsed);

    // Move focus to toggle when collapsing if focus was inside the panel
    if (collapsed && filterEl.contains(document.activeElement)) {
      toggle.focus();
    }
  });
}

// ── Fire callbacks ───────────────────────────────────────────────

function fireSkillChange() {
  updateSkillsCount();
  if (onChange) {
    onChange(getVisibleSkillIds());
  }
}

function fireAgentChange() {
  const totalAgents = Object.keys(agentStates).length;
  const visibleAgents = Object.values(agentStates).filter(Boolean).length;
  const el = filterEl.querySelector('#agents-section-count');
  if (el) el.textContent = visibleAgents < totalAgents ? `${visibleAgents}/${totalAgents}` : String(totalAgents);

  if (onAgentChange) {
    onAgentChange(getVisibleAgentIds());
  }
}

// ── Public getters ───────────────────────────────────────────────

export function getVisibleSkillIds() {
  return Object.entries(skillStates)
    .filter(([, v]) => v)
    .map(([k]) => k);
}

/** @deprecated Use getVisibleSkillIds instead */
export function getVisibleDomains() {
  const visibleIds = new Set(getVisibleSkillIds());
  const domains = new Set();
  for (const [domain, skills] of Object.entries(skillsByDomain)) {
    if (skills.some(s => visibleIds.has(s.id))) {
      domains.add(domain);
    }
  }
  return [...domains];
}

export function getVisibleAgentIds() {
  return Object.entries(agentStates)
    .filter(([, v]) => v)
    .map(([k]) => k);
}

// ── Swatch refresh (theme change) ────────────────────────────────

export function refreshSwatches() {
  if (!filterEl) return;

  // Refresh domain swatches
  filterEl.querySelectorAll('#skills-filter-list .filter-domain-header').forEach(header => {
    const cb = header.querySelector('input[data-domain]');
    if (cb) {
      const swatch = header.querySelector('.filter-swatch');
      if (swatch) swatch.style.background = DOMAIN_COLORS[cb.dataset.domain] || '#888';
    }
  });

  // Refresh agent swatches (per-agent colors)
  filterEl.querySelectorAll('#agents-filter-list .filter-swatch[data-agent-id]').forEach(swatch => {
    const agentId = swatch.dataset.agentId;
    swatch.style.background = getAgentColor(agentId);
  });
}
