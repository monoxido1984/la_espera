/**
 * charts.js — Módulo de visualizaciones D3 para el scrollytelling SINTRA/CRESI
 *
 * Cada función recibe datos y un contenedor SVG, y es pura.
 * Requiere D3 v7 cargado globalmente.
 */

const Charts = (() => {
  'use strict';

  const fmt = new Intl.NumberFormat('es-AR');
  const fmtPct = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 });
  const num = (v) => fmt.format(Math.round(Number(v)));
  const pct = (v) => `${fmtPct.format(Number(v))}%`;
  const one = (v) => fmtPct.format(Number(v));

  // Shared constants
  const DURATION = 600;
  const EASE = d3.easeCubicOut;

  // Color tokens matching CSS
  const COLORS = {
    accent: '#3b9cf5',
    teal: '#2dd4a8',
    coral: '#f06449',
    amber: '#f5b731',
    purple: '#a78bfa',
    ink: '#e8ecf1',
    muted: '#5f6d7e',
    line: 'rgba(255,255,255,0.06)',
    lineStrong: 'rgba(255,255,255,0.12)',
    bg: '#0c0f11',
    bgPanel: '#1a2030',
  };

  // ---- Tooltip singleton ----
  let tooltipEl = null;
  function ensureTooltip() {
    if (!tooltipEl) {
      tooltipEl = document.createElement('div');
      tooltipEl.className = 'tooltip';
      document.body.appendChild(tooltipEl);
    }
    return tooltipEl;
  }

  function showTooltip(html, event) {
    const tip = ensureTooltip();
    tip.innerHTML = html;
    tip.classList.add('visible');
    const x = Math.min(event.clientX + 12, window.innerWidth - 240);
    const y = event.clientY - 40;
    tip.style.left = `${x}px`;
    tip.style.top = `${y}px`;
  }

  function hideTooltip() {
    const tip = ensureTooltip();
    tip.classList.remove('visible');
  }

  // ---- Scales helper ----
  function makeMargins(overrides = {}) {
    return { top: 24, right: 24, bottom: 44, left: 56, ...overrides };
  }

  // ---- VIZ-01: Animated counter ----
  function animateCounter(element, target, duration = 1200) {
    if (!element) return;
    const start = performance.now();
    const ease = (t) => 1 - Math.pow(1 - t, 3);
    function frame(now) {
      const progress = Math.min(1, (now - start) / duration);
      element.textContent = num(target * ease(progress));
      if (progress < 1) requestAnimationFrame(frame);
      else element.textContent = num(target);
    }
    requestAnimationFrame(frame);
  }

  // ---- VIZ-02: Bubble chart ----
  function renderBubbles(container, data, options = {}) {
    container.innerHTML = '';
    const width = container.clientWidth || 500;
    const height = options.height || 380;

    const maxVal = Math.max(...data.map(d => d.value));
    const total = data.reduce((a, b) => a + b.value, 0);
    const bubbleColors = [COLORS.teal, COLORS.accent, COLORS.amber, COLORS.purple, COLORS.coral, COLORS.muted, COLORS.lineStrong];

    // Pack layout simulation
    const sorted = [...data].sort((a, b) => b.value - a.value);
    const positions = [];
    const centerX = width / 2;
    const centerY = height / 2;
    const maxR = Math.min(width, height) * 0.28;

    sorted.forEach((d, i) => {
      const r = Math.max(18, Math.sqrt(d.value / maxVal) * maxR);
      let angle, dist;
      if (i === 0) {
        angle = 0; dist = 0;
      } else {
        angle = (i * 2.39996) + Math.PI * 0.5; // golden angle
        dist = r * 0.8 + positions[0].r * 0.3 + i * 8;
      }
      positions.push({
        ...d,
        x: centerX + Math.cos(angle) * dist,
        y: centerY + Math.sin(angle) * dist * 0.8,
        r,
        color: d.color || bubbleColors[i % bubbleColors.length],
        pct: ((d.value / total) * 100).toFixed(1),
      });
    });

    positions.forEach((p, i) => {
      const bubble = document.createElement('div');
      bubble.className = 'bubble';
      bubble.style.cssText = `
        width: ${p.r * 2}px;
        height: ${p.r * 2}px;
        left: ${p.x - p.r}px;
        top: ${p.y - p.r}px;
        background: radial-gradient(circle at 35% 35%, ${p.color}44, ${p.color}22);
        border: 1.5px solid ${p.color}55;
        animation-delay: ${i * 80}ms;
      `;

      if (p.r > 35) {
        bubble.innerHTML = `
          <span class="bubble-value">${num(p.value)}</span>
          <span class="bubble-label">${p.label}</span>
        `;
      }

      bubble.addEventListener('mouseenter', (e) => {
        showTooltip(`<b>${p.label}</b><br>${num(p.value)} pacientes (${p.pct}%)`, e);
      });
      bubble.addEventListener('mouseleave', hideTooltip);

      container.appendChild(bubble);
    });
  }

  // ---- VIZ-03, VIZ-04, VIZ-05, VIZ-09: Multi-line chart ----
  function renderLineChart(svg, data, seriesDefs, options = {}) {
    const svgEl = d3.select(svg);
    svgEl.selectAll('*').remove();

    const width = options.width || 640;
    const height = options.height || 320;
    const margin = makeMargins(options.margin);
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    svgEl.attr('viewBox', `0 0 ${width} ${height}`);

    const g = svgEl.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xExtent = d3.extent(data, d => d.year);
    const x = d3.scaleLinear().domain(xExtent).range([0, innerW]);

    const allVals = seriesDefs.flatMap(s => data.map(d => d[s.key])).filter(v => v != null);
    const yMin = options.yMin ?? Math.min(0, d3.min(allVals));
    const yMax = d3.max(allVals) * 1.08;
    const y = d3.scaleLinear().domain([yMin, yMax]).range([innerH, 0]).nice();

    // Grid lines
    const yTicks = y.ticks(5);
    g.selectAll('.gridline')
      .data(yTicks)
      .enter().append('line')
      .attr('class', 'gridline')
      .attr('x1', 0).attr('x2', innerW)
      .attr('y1', d => y(d)).attr('y2', d => y(d));

    // Y axis labels
    const unit = options.unit || '';
    g.selectAll('.y-label')
      .data(yTicks)
      .enter().append('text')
      .attr('class', 'axis')
      .attr('x', -8).attr('y', d => y(d) + 4)
      .attr('text-anchor', 'end')
      .text(d => unit === '%' ? `${d.toFixed(0)}%` : num(d));

    // X axis
    const xTicks = data.map(d => d.year).filter((v, i) => i % 2 === 0 || i === data.length - 1);
    g.append('line').attr('class', 'axis-line')
      .attr('x1', 0).attr('x2', innerW)
      .attr('y1', innerH).attr('y2', innerH);

    g.selectAll('.x-label')
      .data(xTicks)
      .enter().append('text')
      .attr('class', 'axis')
      .attr('x', d => x(d)).attr('y', innerH + 22)
      .attr('text-anchor', 'middle')
      .text(d => d);

    // Markers
    if (options.markers) {
      if (data.some(d => d.year === 2018)) {
        g.append('line').attr('class', 'law-marker')
          .attr('x1', x(2018)).attr('x2', x(2018))
          .attr('y1', 0).attr('y2', innerH);
        g.append('text').attr('class', 'mark-label')
          .attr('x', x(2018) + 5).attr('y', 12)
          .text('Ley Justina');
      }
      if (data.some(d => d.year === 2020)) {
        g.append('line').attr('class', 'covid-marker')
          .attr('x1', x(2020)).attr('x2', x(2020))
          .attr('y1', 0).attr('y2', innerH);
        g.append('text').attr('class', 'mark-label')
          .attr('x', x(2020) + 5).attr('y', 26)
          .text('COVID-19');
      }
    }

    // Lines and dots
    const line = d3.line()
      .x(d => x(d.year))
      .curve(d3.curveMonotoneX);

    seriesDefs.forEach(s => {
      const lineG = g.append('g');

      // Area
      if (options.showArea) {
        const area = d3.area()
          .x(d => x(d.year))
          .y0(innerH)
          .y1(d => y(d[s.key]))
          .curve(d3.curveMonotoneX);

        lineG.append('path')
          .datum(data)
          .attr('class', 'chart-area')
          .attr('d', area)
          .attr('fill', s.color);
      }

      // Line
      lineG.append('path')
        .datum(data)
        .attr('class', 'chart-line')
        .attr('d', line.y(d => y(d[s.key])))
        .attr('stroke', s.color);

      // Dots
      lineG.selectAll('.chart-dot')
        .data(data)
        .enter().append('circle')
        .attr('class', 'chart-dot')
        .attr('cx', d => x(d.year))
        .attr('cy', d => y(d[s.key]))
        .attr('r', 4)
        .attr('fill', s.color)
        .on('mouseenter', function(event, d) {
          const val = unit === '%' ? pct(d[s.key]) : num(d[s.key]);
          showTooltip(`<b>${s.label}</b> ${d.year}<br><span class="tooltip-value">${val}</span>`, event);
        })
        .on('mouseleave', hideTooltip);
    });

    // Legend
    if (seriesDefs.length > 1) {
      const legend = g.append('g')
        .attr('transform', `translate(${innerW - seriesDefs.length * 120}, -8)`);

      seriesDefs.forEach((s, i) => {
        const lg = legend.append('g').attr('transform', `translate(${i * 130}, 0)`);
        lg.append('rect').attr('width', 10).attr('height', 3).attr('y', -2).attr('fill', s.color).attr('rx', 1);
        lg.append('text').attr('x', 14).attr('y', 1).attr('fill', COLORS.muted).attr('font-size', 10).text(s.label);
      });
    }
  }

  // ---- VIZ-06: Stacked/grouped bars (dialysis interruptions) ----
  function renderGroupedBars(svg, data, options = {}) {
    const svgEl = d3.select(svg);
    svgEl.selectAll('*').remove();

    const width = options.width || 640;
    const height = options.height || 320;
    const margin = makeMargins({ left: 50 });
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    svgEl.attr('viewBox', `0 0 ${width} ${height}`);
    const g = svgEl.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const keys = options.keys || ['deathInterruptions', 'txInterruptions'];
    const labels = options.labels || ['Fallecimiento', 'Trasplante'];
    const colors = options.colors || [COLORS.coral, COLORS.teal];

    const x0 = d3.scaleBand().domain(data.map(d => d.year)).range([0, innerW]).padding(0.3);
    const x1 = d3.scaleBand().domain(keys).range([0, x0.bandwidth()]).padding(0.1);
    const maxVal = d3.max(data, d => d3.max(keys, k => d[k]));
    const y = d3.scaleLinear().domain([0, maxVal * 1.1]).range([innerH, 0]).nice();

    // Grid
    y.ticks(5).forEach(t => {
      g.append('line').attr('class', 'gridline')
        .attr('x1', 0).attr('x2', innerW).attr('y1', y(t)).attr('y2', y(t));
      g.append('text').attr('class', 'axis')
        .attr('x', -8).attr('y', y(t) + 4).attr('text-anchor', 'end').text(num(t));
    });

    // X axis
    g.append('line').attr('class', 'axis-line')
      .attr('x1', 0).attr('x2', innerW).attr('y1', innerH).attr('y2', innerH);

    data.forEach(d => {
      g.append('text').attr('class', 'axis')
        .attr('x', x0(d.year) + x0.bandwidth() / 2).attr('y', innerH + 20)
        .attr('text-anchor', 'middle').text(d.year);
    });

    // Bars
    data.forEach(d => {
      keys.forEach((k, ki) => {
        g.append('rect')
          .attr('class', 'chart-bar')
          .attr('x', x0(d.year) + x1(k))
          .attr('y', y(d[k]))
          .attr('width', x1.bandwidth())
          .attr('height', innerH - y(d[k]))
          .attr('fill', colors[ki])
          .attr('opacity', 0.75)
          .on('mouseenter', function(event) {
            showTooltip(`<b>${labels[ki]}</b> ${d.year}<br><span class="tooltip-value">${num(d[k])}</span>`, event);
          })
          .on('mouseleave', hideTooltip);
      });
    });

    // Legend
    const legend = g.append('g').attr('transform', `translate(${innerW - 240}, -8)`);
    keys.forEach((k, i) => {
      const lg = legend.append('g').attr('transform', `translate(${i * 130}, 0)`);
      lg.append('rect').attr('width', 10).attr('height', 10).attr('y', -8).attr('fill', colors[i]).attr('rx', 2);
      lg.append('text').attr('x', 14).attr('y', 1).attr('fill', COLORS.muted).attr('font-size', 10).text(labels[i]);
    });
  }

  // ---- VIZ-10: Horizontal bar chart (age/sex pyramid) ----
  function renderHorizontalBars(svg, data, options = {}) {
    const svgEl = d3.select(svg);
    svgEl.selectAll('*').remove();

    const width = options.width || 640;
    const height = options.height || 320;
    const margin = makeMargins({ left: 80 });
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    svgEl.attr('viewBox', `0 0 ${width} ${height}`);
    const g = svgEl.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const maxVal = d3.max(data, d => d.value);
    const y = d3.scaleBand().domain(data.map(d => d.label)).range([0, innerH]).padding(0.25);
    const x = d3.scaleLinear().domain([0, maxVal * 1.1]).range([0, innerW]);
    const color = options.color || COLORS.accent;

    // Labels
    data.forEach(d => {
      g.append('text').attr('class', 'axis')
        .attr('x', -8).attr('y', y(d.label) + y.bandwidth() / 2 + 4)
        .attr('text-anchor', 'end').text(d.label);
    });

    // Bars
    data.forEach(d => {
      g.append('rect')
        .attr('class', 'chart-bar')
        .attr('x', 0)
        .attr('y', y(d.label))
        .attr('width', x(d.value))
        .attr('height', y.bandwidth())
        .attr('fill', color)
        .attr('opacity', 0.7)
        .on('mouseenter', function(event) {
          showTooltip(`<b>${d.label}</b><br><span class="tooltip-value">${num(d.value)}</span>`, event);
        })
        .on('mouseleave', hideTooltip);

      g.append('text')
        .attr('x', x(d.value) + 6)
        .attr('y', y(d.label) + y.bandwidth() / 2 + 4)
        .attr('fill', COLORS.muted).attr('font-size', 11)
        .text(num(d.value));
    });
  }

  // ---- VIZ-11: Province dot plot (Cleveland dot chart) ----
  function renderDotPlot(container, data, options = {}) {
    container.innerHTML = '';
    const maxVal = Math.max(...data.map(d => d.value));
    const color = options.color || COLORS.accent;
    const sorted = [...data].sort((a, b) => b.value - a.value);
    const topN = options.topN || 15;
    const shown = sorted.slice(0, topN);

    shown.forEach(d => {
      const row = document.createElement('div');
      row.className = 'dot-plot-row';
      const prov = d.province || d.label || '';
      const barWidth = (d.value / maxVal * 100).toFixed(1);
      row.innerHTML = `
        <span>${prov}</span>
        <div class="dot-plot-bar" style="width:${barWidth}%;background:${color};opacity:0.7"></div>
        <span class="dot-plot-value">${num(d.value)}</span>
      `;
      container.appendChild(row);
    });
  }

  // ---- VIZ-12: Outcomes stacked area ----
  function renderOutcomesChart(svg, data, options = {}) {
    const svgEl = d3.select(svg);
    svgEl.selectAll('*').remove();

    const width = options.width || 640;
    const height = options.height || 320;
    const margin = makeMargins();
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    svgEl.attr('viewBox', `0 0 ${width} ${height}`);
    const g = svgEl.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear()
      .domain(d3.extent(data, d => d.year))
      .range([0, innerW]);

    const maxVal = d3.max(data, d => Math.max(d.tx, d.deaths, d.otherExclusions));
    const y = d3.scaleLinear().domain([0, maxVal * 1.15]).range([innerH, 0]).nice();

    // Grid
    y.ticks(5).forEach(t => {
      g.append('line').attr('class', 'gridline')
        .attr('x1', 0).attr('x2', innerW).attr('y1', y(t)).attr('y2', y(t));
      g.append('text').attr('class', 'axis')
        .attr('x', -8).attr('y', y(t) + 4).attr('text-anchor', 'end').text(num(t));
    });

    g.append('line').attr('class', 'axis-line')
      .attr('x1', 0).attr('x2', innerW).attr('y1', innerH).attr('y2', innerH);

    const xTicks = data.map(d => d.year).filter((v, i) => i % 2 === 0 || i === data.length - 1);
    xTicks.forEach(t => {
      g.append('text').attr('class', 'axis')
        .attr('x', x(t)).attr('y', innerH + 20).attr('text-anchor', 'middle').text(t);
    });

    const series = [
      { key: 'tx', label: 'Trasplantes', color: COLORS.teal },
      { key: 'deaths', label: 'Fallecimientos', color: COLORS.coral },
      { key: 'otherExclusions', label: 'Otras exclusiones', color: COLORS.amber },
    ];

    const line = d3.line().x(d => x(d.year)).curve(d3.curveMonotoneX);

    series.forEach(s => {
      // Area
      const area = d3.area()
        .x(d => x(d.year))
        .y0(innerH)
        .y1(d => y(d[s.key]))
        .curve(d3.curveMonotoneX);

      g.append('path').datum(data)
        .attr('d', area).attr('fill', s.color).attr('opacity', 0.06);

      g.append('path').datum(data)
        .attr('class', 'chart-line')
        .attr('d', line.y(d => y(d[s.key])))
        .attr('stroke', s.color);

      g.selectAll(`.dot-${s.key}`)
        .data(data).enter().append('circle')
        .attr('class', 'chart-dot')
        .attr('cx', d => x(d.year)).attr('cy', d => y(d[s.key]))
        .attr('r', 4).attr('fill', s.color)
        .on('mouseenter', (event, d) => {
          showTooltip(`<b>${s.label}</b> ${d.year}<br><span class="tooltip-value">${num(d[s.key])}</span>`, event);
        })
        .on('mouseleave', hideTooltip);
    });

    // Legend
    const legend = g.append('g').attr('transform', `translate(0, -8)`);
    series.forEach((s, i) => {
      const lg = legend.append('g').attr('transform', `translate(${i * 140}, 0)`);
      lg.append('rect').attr('width', 10).attr('height', 3).attr('y', -2).attr('fill', s.color).attr('rx', 1);
      lg.append('text').attr('x', 14).attr('y', 1).attr('fill', COLORS.muted).attr('font-size', 10).text(s.label);
    });
  }

  // ---- VIZ-08: Clock (renders into DOM, not SVG) ----
  function renderClock(container, clockData) {
    const arc = Math.min(350, Math.max(52, clockData.avgMonths / 48 * 360));
    container.innerHTML = `
      <div class="clock-stage">
        <div class="clock-face" style="--arc:${arc}deg">
          <i class="clock-hand" aria-hidden="true"></i>
          <div class="clock-readout">
            <b id="clock-minutes">0</b>
            <span>minutos promedio</span>
            <small>${one(clockData.avgMonths)} meses hasta el trasplante renal</small>
          </div>
        </div>
        <div class="equiv-grid">
          ${clockData.equivalents.map((item, i) => `
            <div class="equiv-card">
              <b>${Number.isInteger(Number(item.value)) ? num(item.value) : one(item.value)}</b>
              <span>${item.label}</span>
              <small>${item.unit}. ${item.note}</small>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    animateCounter(container.querySelector('#clock-minutes'), clockData.avgMinutes);
  }

  // Public API
  return {
    animateCounter,
    renderBubbles,
    renderLineChart,
    renderGroupedBars,
    renderHorizontalBars,
    renderDotPlot,
    renderOutcomesChart,
    renderClock,
    showTooltip,
    hideTooltip,
    COLORS,
    num,
    pct,
    one,
  };
})();
