/**
 * chord.js - Circular chord diagram visualization (D3 SVG)
 *
 * Outer ring segments: one per domain, sized by skill count.
 * Chords: connect domains that share agents, cross-referenced skills,
 * or team composition relationships.
 * Loaded lazily when user clicks the Chord button.
 */

import * as d3 from 'd3';
import { DOMAIN_COLORS, hexToRgba, getCurrentThemeName } from './colors.js';
import { logEvent } from './eventlog.js';

let svg = null;
let rootG = null;
let fullData = { nodes: [], links: [] };
let onNodeClick = null;
let onNodeHover = null;
let containerEl = null;
let resizeHandler = null;
let hoveredIndex = null;

// ── Derived data ──────────────────────────────────────────────────
let domainList = [];         // sorted domain names
let domainIndex = {};        // domain -> index
let matrix = [];             // NxN connection matrix
let domainSkillCounts = {};  // domain -> skill count

// ── Public API ────────────────────────────────────────────────────

export function initChordGraph(container, data, callbacks = {}) {
  containerEl = container;
  fullData = data;
  onNodeClick = callbacks.onClick || null;
  onNodeHover = callbacks.onHover || null;

  buildMatrix();
  render();

  resizeHandler = () => render();
  window.addEventListener('resize', resizeHandler);
}

export function destroyChordGraph() {
  if (svg) {
    svg.remove();
    svg = null;
    rootG = null;
  }
  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler);
    resizeHandler = null;
  }
  containerEl = null;
  hoveredIndex = null;
}

export function refreshChordGraph() {
  render();
}

// Stubs for filter compatibility (chord shows all domains, no per-node filtering)
export function setSkillVisibilityChord() {}
export function setVisibleAgentsChord() {}
export function setVisibleTeamsChord() {}
export function getVisibleAgentIdsChord() { return null; }
export function focusNodeChord() {}
export function resetViewChord() {
  if (svg && rootG) {
    svg.transition().duration(500).call(
      d3.zoom().transform,
      d3.zoomIdentity
    );
  }
}
export function zoomInChord() {
  if (svg) svg.transition().duration(300).call(d3.zoom().scaleBy, 1.3);
}
export function zoomOutChord() {
  if (svg) svg.transition().duration(300).call(d3.zoom().scaleBy, 0.7);
}

// ── Build connection matrix ───────────────────────────────────────

function buildMatrix() {
  const skills = fullData.nodes.filter(n => n.type === 'skill');
  const agents = fullData.nodes.filter(n => n.type === 'agent');
  const teams = fullData.nodes.filter(n => n.type === 'team');

  // Collect domains from skills
  const domainSet = new Set();
  domainSkillCounts = {};
  for (const s of skills) {
    domainSet.add(s.domain);
    domainSkillCounts[s.domain] = (domainSkillCounts[s.domain] || 0) + 1;
  }
  domainList = [...domainSet].sort();
  domainIndex = {};
  domainList.forEach((d, i) => { domainIndex[d] = i; });

  const n = domainList.length;
  matrix = Array.from({ length: n }, () => new Float32Array(n));

  // Map skill ID -> domain
  const skillDomain = {};
  for (const s of skills) skillDomain[s.id] = s.domain;

  // 1. Skill cross-references (Related Skills linking across domains)
  for (const link of fullData.links) {
    if (link.type !== 'skill') continue;
    const srcDomain = skillDomain[link.source] || skillDomain[link.source?.id];
    const tgtDomain = skillDomain[link.target] || skillDomain[link.target?.id];
    if (srcDomain && tgtDomain && srcDomain !== tgtDomain) {
      const i = domainIndex[srcDomain];
      const j = domainIndex[tgtDomain];
      if (i !== undefined && j !== undefined) {
        matrix[i][j] += 1;
        matrix[j][i] += 1;
      }
    }
  }

  // 2. Agent-skill connections (agent serves skills in multiple domains)
  for (const agent of agents) {
    if (!agent.skills || agent.skills.length === 0) continue;
    const agentDomains = new Set();
    for (const skillId of agent.skills) {
      const domain = skillDomain[skillId];
      if (domain) agentDomains.add(domain);
    }
    const domArr = [...agentDomains];
    for (let a = 0; a < domArr.length; a++) {
      for (let b = a + 1; b < domArr.length; b++) {
        const i = domainIndex[domArr[a]];
        const j = domainIndex[domArr[b]];
        if (i !== undefined && j !== undefined) {
          matrix[i][j] += 2;
          matrix[j][i] += 2;
        }
      }
    }
  }

  // 3. Team composition (team members connect across domains via their skills)
  for (const team of teams) {
    if (!team.members || team.members.length === 0) continue;
    const teamDomains = new Set();
    for (const memberId of team.members) {
      const agent = agents.find(a => a.id === `agent:${memberId}` || a.id === memberId);
      if (agent && agent.skills) {
        for (const skillId of agent.skills) {
          const domain = skillDomain[skillId];
          if (domain) teamDomains.add(domain);
        }
      }
    }
    const domArr = [...teamDomains];
    for (let a = 0; a < domArr.length; a++) {
      for (let b = a + 1; b < domArr.length; b++) {
        const i = domainIndex[domArr[a]];
        const j = domainIndex[domArr[b]];
        if (i !== undefined && j !== undefined) {
          matrix[i][j] += 1.5;
          matrix[j][i] += 1.5;
        }
      }
    }
  }
}

// ── Render ────────────────────────────────────────────────────────

function render() {
  if (!containerEl) return;

  const width = containerEl.clientWidth;
  const height = containerEl.clientHeight;
  const minDim = Math.min(width, height);
  const outerRadius = minDim * 0.42;
  const innerRadius = outerRadius - 20;

  // Clear previous
  if (svg) svg.remove();

  svg = d3.select(containerEl)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('class', 'chord-svg');

  // Background rect for click-to-deselect
  svg.append('rect')
    .attr('width', width)
    .attr('height', height)
    .attr('fill', 'transparent')
    .on('click', () => {
      hoveredIndex = null;
      updateHighlight();
      if (onNodeClick) onNodeClick(null);
    });

  const zoomBehavior = d3.zoom()
    .scaleExtent([0.3, 5])
    .on('zoom', (event) => {
      rootG.attr('transform', event.transform);
    });
  svg.call(zoomBehavior);

  rootG = svg.append('g')
    .attr('transform', `translate(${width / 2},${height / 2})`);

  // D3 chord layout
  const chord = d3.chord()
    .padAngle(0.04)
    .sortSubgroups(d3.descending);

  const chords = chord(matrix);

  const arc = d3.arc()
    .innerRadius(innerRadius)
    .outerRadius(outerRadius);

  const ribbon = d3.ribbon()
    .radius(innerRadius);

  // ── Draw chords (ribbons) ──
  const chordPaths = rootG.append('g')
    .attr('class', 'chords')
    .selectAll('path')
    .data(chords)
    .join('path')
    .attr('d', ribbon)
    .attr('fill', d => {
      const srcDomain = domainList[d.source.index];
      return hexToRgba(DOMAIN_COLORS[srcDomain] || '#ffffff', 0.55);
    })
    .attr('stroke', d => {
      const srcDomain = domainList[d.source.index];
      return hexToRgba(DOMAIN_COLORS[srcDomain] || '#ffffff', 0.2);
    })
    .attr('stroke-width', 0.5)
    .style('cursor', 'pointer')
    .on('mouseenter', function (event, d) {
      hoveredIndex = d.source.index;
      updateHighlight();
      showChordTooltip(event, d);
    })
    .on('mouseleave', function () {
      hoveredIndex = null;
      updateHighlight();
      if (onNodeHover) onNodeHover(null);
    });

  // ── Draw outer arcs (domain segments) ──
  const groupG = rootG.append('g')
    .attr('class', 'groups')
    .selectAll('g')
    .data(chords.groups)
    .join('g')
    .style('cursor', 'pointer')
    .on('mouseenter', function (event, d) {
      hoveredIndex = d.index;
      updateHighlight();
      showGroupTooltip(event, d);
    })
    .on('mouseleave', function () {
      hoveredIndex = null;
      updateHighlight();
      if (onNodeHover) onNodeHover(null);
    })
    .on('click', function (event, d) {
      logEvent('chord', { event: 'domainClick', domain: domainList[d.index] });
    });

  groupG.append('path')
    .attr('d', arc)
    .attr('fill', d => DOMAIN_COLORS[domainList[d.index]] || '#ffffff')
    .attr('stroke', d => hexToRgba(DOMAIN_COLORS[domainList[d.index]] || '#ffffff', 0.8))
    .attr('stroke-width', 1);

  // ── Domain labels ──
  groupG.append('text')
    .each(d => { d.angle = (d.startAngle + d.endAngle) / 2; })
    .attr('dy', '0.35em')
    .attr('transform', d => {
      const angle = d.angle * 180 / Math.PI - 90;
      const flip = d.angle > Math.PI;
      return `rotate(${angle}) translate(${outerRadius + 8})${flip ? ' rotate(180)' : ''}`;
    })
    .attr('text-anchor', d => d.angle > Math.PI ? 'end' : 'start')
    .attr('fill', d => DOMAIN_COLORS[domainList[d.index]] || '#ffffff')
    .attr('font-size', '10px')
    .attr('font-family', 'Share Tech Mono, monospace')
    .text(d => {
      const domain = domainList[d.index];
      const count = domainSkillCounts[domain] || 0;
      return `${domain} (${count})`;
    });

  // Store references for highlight updates
  svg._chordPaths = chordPaths;
  svg._groupG = groupG;

  logEvent('chord', { event: 'render', domains: domainList.length });
}

// ── Highlight on hover ────────────────────────────────────────────

function updateHighlight() {
  if (!svg || !svg._chordPaths || !svg._groupG) return;

  if (hoveredIndex === null) {
    // Reset all
    svg._chordPaths
      .attr('fill', d => {
        const srcDomain = domainList[d.source.index];
        return hexToRgba(DOMAIN_COLORS[srcDomain] || '#ffffff', 0.55);
      })
      .attr('stroke', d => {
        const srcDomain = domainList[d.source.index];
        return hexToRgba(DOMAIN_COLORS[srcDomain] || '#ffffff', 0.2);
      });
    svg._groupG.select('path')
      .attr('opacity', 1);
    svg._groupG.select('text')
      .attr('opacity', 1);
    return;
  }

  // Dim non-connected chords and segments
  const connectedIndices = new Set([hoveredIndex]);
  svg._chordPaths.each(function (d) {
    if (d.source.index === hoveredIndex || d.target.index === hoveredIndex) {
      connectedIndices.add(d.source.index);
      connectedIndices.add(d.target.index);
    }
  });

  svg._chordPaths
    .attr('fill', function (d) {
      const connected = d.source.index === hoveredIndex || d.target.index === hoveredIndex;
      const srcDomain = domainList[d.source.index];
      const color = DOMAIN_COLORS[srcDomain] || '#ffffff';
      return hexToRgba(color, connected ? 0.85 : 0.08);
    })
    .attr('stroke', function (d) {
      const connected = d.source.index === hoveredIndex || d.target.index === hoveredIndex;
      const srcDomain = domainList[d.source.index];
      return hexToRgba(DOMAIN_COLORS[srcDomain] || '#ffffff', connected ? 0.6 : 0.02);
    });

  svg._groupG.select('path')
    .attr('opacity', d => connectedIndices.has(d.index) ? 1 : 0.2);
  svg._groupG.select('text')
    .attr('opacity', d => connectedIndices.has(d.index) ? 1 : 0.2);
}

// ── Tooltips ──────────────────────────────────────────────────────

function showGroupTooltip(event, d) {
  const domain = domainList[d.index];
  const count = domainSkillCounts[domain] || 0;

  // Count connections
  let connectionCount = 0;
  for (let j = 0; j < domainList.length; j++) {
    if (j !== d.index && matrix[d.index][j] > 0) connectionCount++;
  }

  if (onNodeHover) {
    onNodeHover({
      id: domain,
      type: 'domain',
      title: domain,
      domain: domain,
      _chordTooltip: `${domain}: ${count} skills, ${connectionCount} cross-domain connections`,
    });
  }
}

function showChordTooltip(event, d) {
  const srcDomain = domainList[d.source.index];
  const tgtDomain = domainList[d.target.index];
  const weight = matrix[d.source.index][d.target.index];

  if (onNodeHover) {
    onNodeHover({
      id: `${srcDomain}-${tgtDomain}`,
      type: 'chord',
      title: `${srcDomain} ↔ ${tgtDomain}`,
      domain: srcDomain,
      _chordTooltip: `${srcDomain} ↔ ${tgtDomain}: ${weight.toFixed(1)} connection weight`,
    });
  }
}
