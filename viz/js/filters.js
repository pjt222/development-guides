/**
 * filters.js - Left-side domain filter checkboxes
 */

import { DOMAIN_COLORS } from './colors.js';

let filterEl = null;
let domainStates = {};   // domain -> boolean
let onChange = null;

export function initFilters(el, domains, { onFilterChange } = {}) {
  filterEl = el;
  onChange = onFilterChange;

  // Initialize all domains as visible
  for (const domain of Object.keys(domains)) {
    domainStates[domain] = true;
  }

  render(domains);
  bindBulkButtons();
}

function render(domains) {
  const list = filterEl.querySelector('.filter-list');
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
      fireChange();
    });
  }
}

function bindBulkButtons() {
  const allBtn = filterEl.querySelector('.filter-all');
  const noneBtn = filterEl.querySelector('.filter-none');

  if (allBtn) {
    allBtn.addEventListener('click', () => {
      for (const d of Object.keys(domainStates)) domainStates[d] = true;
      filterEl.querySelectorAll('input[type=checkbox]').forEach(cb => cb.checked = true);
      fireChange();
    });
  }

  if (noneBtn) {
    noneBtn.addEventListener('click', () => {
      for (const d of Object.keys(domainStates)) domainStates[d] = false;
      filterEl.querySelectorAll('input[type=checkbox]').forEach(cb => cb.checked = false);
      fireChange();
    });
  }
}

function fireChange() {
  if (onChange) {
    const visible = Object.entries(domainStates)
      .filter(([, v]) => v)
      .map(([k]) => k);
    onChange(visible);
  }
}

export function getVisibleDomains() {
  return Object.entries(domainStates)
    .filter(([, v]) => v)
    .map(([k]) => k);
}

export function refreshSwatches() {
  if (!filterEl) return;
  filterEl.querySelectorAll('.filter-item').forEach(item => {
    const cb = item.querySelector('input[data-domain]');
    if (!cb) return;
    const domain = cb.dataset.domain;
    const swatch = item.querySelector('.filter-swatch');
    if (swatch) swatch.style.background = DOMAIN_COLORS[domain] || '#888';
  });
}
