/**
 * app.js - Bootstrap: load data, init subsystems, bind controls
 */

import { initGraph, destroyGraph, focusNode, resetView, zoomIn, zoomOut, setSkillVisibility, getGraph, refreshGraph, preloadIcons, switchIconPalette, setVisibleAgents, setVisibleTeams, getVisibleAgentIds } from './graph.js';
import { setIconMode, getIconMode } from './icons.js';
import { initPanel, openPanel, closePanel, refreshPanelTheme } from './panel.js';
import { initFilters, getVisibleSkillIds, getVisibleAgentIds as getFilteredAgentIds, getVisibleTeamIds as getFilteredTeamIds, refreshSwatches } from './filters.js';
import { setTheme, getThemeNames, getCurrentThemeName } from './colors.js';
import { logEvent, isEnabled as isEventLogEnabled, downloadLog } from './eventlog.js';

const DATA_URL = 'data/skills.json';

let allData = null;
let currentMode = '2d';
let graph3dMod = null;
let hiveMod = null;
let switching = false;

// ── Mode-aware wrappers ─────────────────────────────────────────────

function activeFocusNode(id) {
  if (currentMode === 'hive' && hiveMod) hiveMod.focusNodeHive(id);
  else if (currentMode === '3d' && graph3dMod) graph3dMod.focusNode3D(id);
  else focusNode(id);
}

function activeResetView() {
  if (currentMode === 'hive' && hiveMod) hiveMod.resetViewHive();
  else if (currentMode === '3d' && graph3dMod) graph3dMod.resetView3D();
  else resetView();
}

function activeZoomIn() {
  if (currentMode === 'hive' && hiveMod) hiveMod.zoomInHive();
  else if (currentMode === '3d' && graph3dMod) graph3dMod.zoomIn3D();
  else zoomIn();
}

function activeZoomOut() {
  if (currentMode === 'hive' && hiveMod) hiveMod.zoomOutHive();
  else if (currentMode === '3d' && graph3dMod) graph3dMod.zoomOut3D();
  else zoomOut();
}

function activeSetSkillVisibility(ids) {
  if (currentMode === 'hive' && hiveMod) hiveMod.setSkillVisibilityHive(ids);
  else if (currentMode === '3d' && graph3dMod) graph3dMod.setSkillVisibility3D(ids);
  else setSkillVisibility(ids);
}

function activeSetVisibleAgents(ids) {
  if (currentMode === 'hive' && hiveMod) hiveMod.setVisibleAgentsHive(ids);
  else if (currentMode === '3d' && graph3dMod) graph3dMod.setVisibleAgents3D(ids);
  else setVisibleAgents(ids);
}

function activeSetVisibleTeams(ids) {
  if (currentMode === 'hive' && hiveMod) hiveMod.setVisibleTeamsHive(ids);
  else if (currentMode === '3d' && graph3dMod) graph3dMod.setVisibleTeams3D(ids);
  else setVisibleTeams(ids);
}

function activeRefreshGraph() {
  if (currentMode === 'hive' && hiveMod) hiveMod.refreshHiveGraph();
  else if (currentMode === '3d' && graph3dMod) graph3dMod.refreshGraph3D();
  else refreshGraph();
}

function activeGetVisibleAgentIds() {
  if (currentMode === 'hive' && hiveMod) return hiveMod.getVisibleAgentIdsHive();
  else if (currentMode === '3d' && graph3dMod) return graph3dMod.getVisibleAgentIds3D();
  return getVisibleAgentIds();
}

// ── Layout button helper ────────────────────────────────────────────

function setActiveMode(mode) {
  document.getElementById('btn-2d').classList.toggle('active', mode === '2d');
  document.getElementById('btn-3d').classList.toggle('active', mode === '3d');
  document.getElementById('btn-hive').classList.toggle('active', mode === 'hive');
}

function isWebGLAvailable() {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch (e) {
    return false;
  }
}

// ── Mode Switching ──────────────────────────────────────────────────

async function switchTo3D() {
  if (!isWebGLAvailable()) {
    alert('WebGL is not supported in your browser. 3D mode requires WebGL.');
    return;
  }

  const container = document.getElementById('graph-container');

  try {
    if (!graph3dMod) {
      graph3dMod = await import('./graph3d.js');
    }

    // Destroy current mode
    if (currentMode === 'hive' && hiveMod) {
      hiveMod.destroyHiveGraph();
    } else {
      destroyGraph();
    }
    container.innerHTML = '';

    // Initialize 3D graph with same data and callbacks
    graph3dMod.init3DGraph(container, allData, {
      onClick(node) {
        if (node) openPanel(node);
        else closePanel();
      },
      onHover(node) {
        showTooltip(node);
      },
    });

    // Apply current filter state
    graph3dMod.setVisibleAgents3D(getFilteredAgentIds());
    graph3dMod.setVisibleTeams3D(getFilteredTeamIds());
    graph3dMod.setSkillVisibility3D(getVisibleSkillIds());

    // Preload 3D icon textures
    graph3dMod.preload3DIcons(allData.nodes, getCurrentThemeName());

    currentMode = '3d';
    logEvent('app', { event: 'modeSwitch', mode: '3d' });
    setActiveMode('3d');

    // Hide hive sort toggle
    const hiveSortBtn3d = document.getElementById('btn-hive-sort');
    if (hiveSortBtn3d) hiveSortBtn3d.style.display = 'none';

    // Auto zoom-to-fit after layout settles
    setTimeout(() => {
      const g = graph3dMod.getGraph3D();
      if (g) g.zoomToFit(800, 40);
    }, 3500);
  } catch (err) {
    console.error('Failed to switch to 3D:', err);
    // Fallback: reinit 2D
    switchTo2D();
  }
}

function switchTo2D() {
  const container = document.getElementById('graph-container');

  // Destroy current non-2D mode
  if (currentMode === 'hive' && hiveMod) {
    hiveMod.destroyHiveGraph();
  } else if (graph3dMod) {
    graph3dMod.destroy3DGraph();
  }
  container.innerHTML = '';

  // Re-init 2D graph
  initGraph(container, allData, {
    onClick(node) {
      if (node) openPanel(node);
      else closePanel();
    },
    onHover(node) {
      showTooltip(node);
    },
  });

  // Restore icon mode
  const savedIconMode = localStorage.getItem('skillnet-icons') === 'true';
  if (savedIconMode) setIconMode(true);
  preloadIcons(allData.nodes, getCurrentThemeName());

  // Apply current filter state
  setVisibleAgents(getFilteredAgentIds());
  setVisibleTeams(getFilteredTeamIds());
  setSkillVisibility(getVisibleSkillIds());

  currentMode = '2d';
  logEvent('app', { event: 'modeSwitch', mode: '2d' });
  setActiveMode('2d');

  // Hide hive sort toggle
  const hiveSortBtn2d = document.getElementById('btn-hive-sort');
  if (hiveSortBtn2d) hiveSortBtn2d.style.display = 'none';

  // Auto zoom-to-fit
  setTimeout(() => {
    const g = getGraph();
    if (g) g.zoomToFit(800, 40);
  }, 3500);
}

// ── Hive Mode ────────────────────────────────────────────────────────

async function switchToHive() {
  const container = document.getElementById('graph-container');

  try {
    if (!hiveMod) {
      hiveMod = await import('./hive.js');
    }

    // Destroy current mode
    if (currentMode === '3d' && graph3dMod) {
      graph3dMod.destroy3DGraph();
    } else {
      destroyGraph();
    }
    container.innerHTML = '';

    hiveMod.initHiveGraph(container, allData, {
      onClick(node) {
        if (node) openPanel(node);
        else closePanel();
      },
      onHover(node) {
        showTooltip(node);
      },
    });

    // Apply current filter state
    hiveMod.setVisibleAgentsHive(getFilteredAgentIds());
    hiveMod.setVisibleTeamsHive(getFilteredTeamIds());
    hiveMod.setSkillVisibilityHive(getVisibleSkillIds());

    currentMode = 'hive';
    logEvent('app', { event: 'modeSwitch', mode: 'hive' });
    setActiveMode('hive');

    // Show and restore hive sort toggle
    const sortBtn = document.getElementById('btn-hive-sort');
    if (sortBtn) {
      sortBtn.style.display = '';
      const savedSort = localStorage.getItem('skillnet-hive-sort') || 'ranked';
      hiveMod.setHiveSortMode(savedSort);
      sortBtn.classList.toggle('active', savedSort === 'interleaved');
      sortBtn.textContent = savedSort === 'interleaved' ? 'Ranked' : 'Spread';
    }
  } catch (err) {
    console.error('Failed to switch to Hive:', err);
    switchTo2D();
  }
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
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
  document.getElementById('stat-teams').textContent = data.meta.totalTeams;

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
        activeFocusNode(node.id);
        openPanel(node);
      }
    },
  });

  // ── Init filter panel ──
  const skillNodes = data.nodes.filter(n => n.type === 'skill');
  const agentNodes = data.nodes.filter(n => n.type === 'agent');
  const teamNodes = data.nodes.filter(n => n.type === 'team');
  initFilters(document.getElementById('filter-panel'), skillNodes, agentNodes, teamNodes, {
    onFilterChange(visibleSkillIds) {
      activeSetSkillVisibility(visibleSkillIds);
      updateFilteredStats(visibleSkillIds);
    },
    onAgentFilterChange(visibleIds) {
      activeSetVisibleAgents(visibleIds);
      activeSetSkillVisibility(getVisibleSkillIds());
      updateFilteredStats(getVisibleSkillIds());
    },
    onTeamFilterChange(visibleIds) {
      activeSetVisibleTeams(visibleIds);
      activeSetSkillVisibility(getVisibleSkillIds());
      updateFilteredStats(getVisibleSkillIds());
    },
    onTagFilterChange() {
      const visSkills = getVisibleSkillIds();
      activeSetSkillVisibility(visSkills);
      activeSetVisibleAgents(getFilteredAgentIds());
      activeSetVisibleTeams(getFilteredTeamIds());
      updateFilteredStats(visSkills);
    },
  });

  // ── Init graph ──
  const container = document.getElementById('graph-container');
  initGraph(container, data, {
    onClick(node) {
      if (node) openPanel(node);
      else closePanel();
    },
    onHover(node) {
      showTooltip(node);
    },
  });

  // ── Preload icons ──
  preloadIcons(data.nodes, getCurrentThemeName());

  // ── Bind controls ──
  document.getElementById('btn-zoom-in').addEventListener('click', () => activeZoomIn());
  document.getElementById('btn-zoom-out').addEventListener('click', () => activeZoomOut());
  document.getElementById('btn-reset').addEventListener('click', () => {
    activeResetView();
    closePanel();
  });

  // ── Event log download ──
  const logBtn = document.getElementById('btn-event-log');
  if (isEventLogEnabled()) {
    logBtn.style.display = '';
    logBtn.title = 'Download Event Log';
    logBtn.addEventListener('click', () => downloadLog());
  }

  // ── Layout buttons (radio group: 2D / 3D / Hive) ──
  document.getElementById('btn-2d').addEventListener('click', async () => {
    if (switching || currentMode === '2d') return;
    switching = true;
    try { switchTo2D(); } finally { switching = false; }
  });

  document.getElementById('btn-3d').addEventListener('click', async () => {
    if (switching || currentMode === '3d') return;
    switching = true;
    try { await switchTo3D(); } finally { switching = false; }
  });

  document.getElementById('btn-hive').addEventListener('click', async () => {
    if (switching || currentMode === 'hive') return;
    switching = true;
    try { await switchToHive(); } finally { switching = false; }
  });

  // ── Hive sort toggle ──
  const hiveSortBtn = document.getElementById('btn-hive-sort');
  if (hiveSortBtn) hiveSortBtn.addEventListener('click', () => {
    if (!hiveMod) return;
    const next = hiveMod.getHiveSortMode() === 'ranked' ? 'interleaved' : 'ranked';
    hiveMod.setHiveSortMode(next);
    const btn = document.getElementById('btn-hive-sort');
    btn.classList.toggle('active', next === 'interleaved');
    btn.textContent = next === 'interleaved' ? 'Ranked' : 'Spread';
    localStorage.setItem('skillnet-hive-sort', next);
    logEvent('app', { event: 'hiveSortToggle', mode: next });
  });

  // ── Theme dropdown ──
  themeSelect.addEventListener('change', () => {
    try {
      logEvent('app', { event: 'themeChange', theme: themeSelect.value });
      setTheme(themeSelect.value);
      localStorage.setItem('skillnet-theme', themeSelect.value);
      switchIconPalette(themeSelect.value, data.nodes);  // 2D cache
      if (graph3dMod) graph3dMod.switchIconPalette3D(themeSelect.value, data.nodes);
      // Hive: render() uses getCurrentThemeName() dynamically — no explicit call needed
      refreshSwatches();
      refreshPanelTheme();
      activeRefreshGraph();
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
    logEvent('app', { event: 'iconToggle', enabled: next });
    setIconMode(next);
    iconBtn.classList.toggle('active', next);
    localStorage.setItem('skillnet-icons', next);
    activeRefreshGraph();
  });

  logEvent('app', { event: 'sessionStart', mode: currentMode, nodeCount: data.nodes.length, linkCount: data.links.length });

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
  // In 3D mode, use built-in HTML tooltip from nodeLabel; skip custom tooltip
  // In hive mode, show custom tooltip as in 2D
  if (currentMode === '3d') {
    if (tooltip) tooltip.style.display = 'none';
    return;
  }
  let label;
  if (node.type === 'team') {
    label = `${node.title || node.id} [team / ${node.members ? node.members.length : 0} members]`;
  } else if (node.type === 'agent') {
    label = `${node.title || node.id} [agent / ${node.priority}]`;
  } else {
    label = `${node.title || node.id} [${node.domain}]`;
  }
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
  const agentIds = activeGetVisibleAgentIds();

  const visSkills = allData.nodes.filter(n => n.type === 'skill' && skillSet.has(n.id));
  const visAgents = allData.nodes.filter(n => {
    if (n.type !== 'agent') return false;
    if (agentIds === null) return true;
    return agentIds.has(n.id);
  });
  const visTeams = allData.nodes.filter(n => n.type === 'team');
  const visNodeIds = new Set([...visSkills, ...visAgents, ...visTeams].map(n => n.id));
  const visLinks = allData.links.filter(l => visNodeIds.has(l.source) && visNodeIds.has(l.target));

  // Count unique domains among visible skills
  const visDomains = new Set(visSkills.map(n => n.domain));

  document.getElementById('stat-skills').textContent = visSkills.length;
  document.getElementById('stat-edges').textContent = visLinks.length;
  document.getElementById('stat-domains').textContent = visDomains.size;
  document.getElementById('stat-agents').textContent = visAgents.length;
  document.getElementById('stat-teams').textContent = visTeams.length;
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
