/**
 * app.js - Bootstrap: load data, init subsystems, bind controls
 */

import { initGraph, focusNode, resetView, zoomIn, zoomOut, setSkillVisibility, getGraph, refreshGraph, preloadIcons, setIconMode, getIconMode, setVisibleAgents, getVisibleAgentIds } from './graph.js';
import { initPanel, openPanel, closePanel } from './panel.js';
import { initFilters, getVisibleSkillIds, refreshSwatches } from './filters.js';
import { setTheme, getThemeNames, getCurrentThemeName } from './colors.js';

const DATA_URL = 'data/skills.json';

let allData = null;

async function main() {
  // ── Verify force-graph loaded ──
  if (typeof ForceGraph === 'undefined') {
    throw new Error('ForceGraph library not loaded. Check CDN script tag.');
  }

  // ── Load data ──
  let data;
  try {
    const res = await fetch(DATA_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = await res.json();
  } catch (err) {
    document.getElementById('graph-container').innerHTML = `
      <div class="load-error">
        <h2>Data not found</h2>
        <p>Run <code>cd viz && npm install && node build-data.js</code> to generate skills.json</p>
        <p class="error-detail">${err.message}</p>
      </div>
    `;
    return;
  }

  allData = data;

  // ── Update header stats ──
  document.getElementById('stat-skills').textContent = data.meta.totalSkills;
  document.getElementById('stat-edges').textContent = data.meta.totalLinks;
  document.getElementById('stat-domains').textContent = data.meta.totalDomains;
  document.getElementById('stat-agents').textContent = data.meta.totalAgents;

  // ── Restore saved theme ──
  const savedTheme = localStorage.getItem('skillnet-theme');
  if (savedTheme && getThemeNames().includes(savedTheme)) {
    setTheme(savedTheme);
  }
  const themeSelect = document.getElementById('theme-select');
  themeSelect.value = getCurrentThemeName();

  // ── Init detail panel ──
  initPanel(document.getElementById('detail-panel'), {
    onRelated(id) {
      // Skill links from agent panel use plain skill IDs
      const node = allData.nodes.find(n => n.id === id || n.id === `agent:${id}`);
      if (node) {
        focusNode(node.id);
        openPanel(node);
      }
    },
  });

  // ── Init filter panel ──
  const skillNodes = data.nodes.filter(n => n.type === 'skill');
  const agentNodes = data.nodes.filter(n => n.type === 'agent');
  initFilters(document.getElementById('filter-panel'), skillNodes, agentNodes, {
    onFilterChange(visibleSkillIds) {
      setSkillVisibility(visibleSkillIds);
      updateFilteredStats(visibleSkillIds);
    },
    onAgentFilterChange(visibleIds) {
      setVisibleAgents(visibleIds);
      setSkillVisibility(getVisibleSkillIds());
      updateFilteredStats(getVisibleSkillIds());
    },
  });

  // ── Init graph ──
  const container = document.getElementById('graph-container');
  initGraph(container, data, {
    onClick(node) {
      if (node) {
        openPanel(node);
      } else {
        closePanel();
      }
    },
    onHover(node) {
      showTooltip(node);
    },
  });

  // ── Preload icons ──
  preloadIcons(data.nodes);

  // ── Bind controls ──
  document.getElementById('btn-zoom-in').addEventListener('click', zoomIn);
  document.getElementById('btn-zoom-out').addEventListener('click', zoomOut);
  document.getElementById('btn-reset').addEventListener('click', () => {
    resetView();
    closePanel();
  });

  // ── Theme dropdown ──
  themeSelect.addEventListener('change', () => {
    try {
      setTheme(themeSelect.value);
      localStorage.setItem('skillnet-theme', themeSelect.value);
      refreshSwatches();
      const g = getGraph();
      refreshGraph();
    } catch (err) {
      console.error('Theme switch failed:', err);
    }
  });

  // ── Icon toggle ──
  const iconBtn = document.getElementById('btn-icon-toggle');
  const savedIconMode = localStorage.getItem('skillnet-icons') === 'true';
  if (savedIconMode) {
    setIconMode(true);
    iconBtn.classList.add('active');
  }
  iconBtn.addEventListener('click', () => {
    const next = !getIconMode();
    setIconMode(next);
    iconBtn.classList.toggle('active', next);
    localStorage.setItem('skillnet-icons', next);
    const g = getGraph();
    refreshGraph();
  });

  // ── Auto zoom-to-fit after layout settles ──
  setTimeout(() => {
    const g = getGraph();
    if (g) g.zoomToFit(800, 40);
  }, 3500);
}

// ── Tooltip ──
const tooltip = document.getElementById('tooltip');

function showTooltip(node) {
  if (!node || !tooltip) {
    if (tooltip) tooltip.style.display = 'none';
    return;
  }
  const label = node.type === 'agent'
    ? `${node.title || node.id} [agent / ${node.priority}]`
    : `${node.title || node.id} [${node.domain}]`;
  tooltip.textContent = label;
  tooltip.style.display = 'block';
}

// Track mouse for tooltip position
document.addEventListener('mousemove', e => {
  if (tooltip && tooltip.style.display === 'block') {
    tooltip.style.left = (e.clientX + 14) + 'px';
    tooltip.style.top = (e.clientY + 14) + 'px';
  }
});

function updateFilteredStats(visibleSkillIds) {
  if (!allData) return;
  const skillSet = new Set(visibleSkillIds);
  const agentIds = getVisibleAgentIds();

  const visSkills = allData.nodes.filter(n => n.type === 'skill' && skillSet.has(n.id));
  const visAgents = allData.nodes.filter(n => {
    if (n.type !== 'agent') return false;
    if (agentIds === null) return true;
    return agentIds.has(n.id);
  });
  const visNodeIds = new Set([...visSkills, ...visAgents].map(n => n.id));
  const visLinks = allData.links.filter(l => visNodeIds.has(l.source) && visNodeIds.has(l.target));

  // Count unique domains among visible skills
  const visDomains = new Set(visSkills.map(n => n.domain));

  document.getElementById('stat-skills').textContent = visSkills.length;
  document.getElementById('stat-edges').textContent = visLinks.length;
  document.getElementById('stat-domains').textContent = visDomains.size;
  document.getElementById('stat-agents').textContent = visAgents.length;
}

main().catch(err => {
  console.error(err);
  document.getElementById('graph-container').innerHTML = `
    <div class="load-error">
      <h2>Runtime Error</h2>
      <p>${err.message}</p>
      <p class="error-detail">${err.stack || ''}</p>
    </div>
  `;
});
