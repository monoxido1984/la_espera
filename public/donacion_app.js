/** Aplicación narrativa y explorador marginal de donación. */
(() => {
  'use strict';

  const D = window.DONATION_DATA;
  if (!D) throw new Error('donacion_data.js no fue cargado');

  const fmt = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 });
  const pct = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1, signDisplay: 'exceptZero' });
  const labels = {
    donacion: 'Donación',
    procuracion: 'Procuración',
    trasplante: 'Trasplante',
    anual: 'Año completo',
    'ene-jul': 'Enero–julio',
    provincia: 'Provincia',
    region_incucai: 'Región INCUCAI',
    region_sanitaria: 'Región sanitaria',
    grupo_etario: 'Grupo etario',
    sexo: 'Sexo',
    organo_tipo: 'Órgano o tipo',
    motivo_causa: 'Motivo o causa',
    estadisticas: 'Estadísticas',
    total: 'Total',
    situacion: 'Situación',
    asignacion: 'Asignación',
    grupo_sanguineo: 'Grupo sanguíneo',
  };

  const $ = (id) => document.getElementById(id);
  const text = (id, value) => { const el = $(id); if (el) el.textContent = value; };
  const cleanLabel = (value) => String(value || '')
    .replace(/^\d+\.\s*/, '')
    .replace(/\bOrganos\b/g, 'Órganos')
    .replace(/\borgano\b/gi, 'órgano')
    .replace(/grupo et.reo/gi, 'grupo etario')
    .replace(/clasificaci.n/gi, 'clasificación')
    .replace(/regi.n/gi, 'región')
    .replace(/donaci.n/gi, 'donación');

  const annual = D.story.annual;
  const januaryJuly = D.story.januaryJuly;
  const closed2025 = annual.find((row) => row.year === 2025);
  const shock2020 = annual.find((row) => row.year === 2020);
  const partial2025 = januaryJuly.find((row) => row.year === 2025);
  const partial2026 = januaryJuly.find((row) => row.year === 2026);

  Charts.animateCounter($('hero-donors'), closed2025.donors, 1400);
  text('chain-donors', fmt.format(closed2025.donors));
  text('chain-procured', fmt.format(closed2025.procured));
  text('chain-implanted', fmt.format(closed2025.implanted));
  text('growth-donors', `${pct.format((closed2025.donors / shock2020.donors - 1) * 100)}%`);
  text('partial-donors', fmt.format(partial2026.donors));
  text('partial-procured', fmt.format(partial2026.procured));
  text('partial-implanted', fmt.format(partial2026.implanted));

  function deltaText(current, previous) {
    const change = (current / previous - 1) * 100;
    return `${pct.format(change)}% frente a ene–jul 2025`;
  }
  text('partial-donors-delta', deltaText(partial2026.donors, partial2025.donors));
  text('partial-procured-delta', deltaText(partial2026.procured, partial2025.procured));
  text('partial-implanted-delta', deltaText(partial2026.implanted, partial2025.implanted));

  let rendered = new Set();
  function renderHistory() {
    if (rendered.has('history')) return;
    Charts.renderLineChart($('chart-history'), annual, [
      { key: 'donors', label: 'Donantes', color: Charts.COLORS.accent },
      { key: 'procured', label: 'Órganos procurados', color: Charts.COLORS.teal },
      { key: 'implanted', label: 'Órganos implantados', color: Charts.COLORS.amber },
    ], { markers: true });
    rendered.add('history');
  }

  function renderPartial() {
    if (rendered.has('partial')) return;
    Charts.renderLineChart($('chart-partial'), januaryJuly, [
      { key: 'donors', label: 'Donantes', color: Charts.COLORS.accent },
      { key: 'procured', label: 'Órganos procurados', color: Charts.COLORS.teal },
      { key: 'implanted', label: 'Órganos implantados', color: Charts.COLORS.amber },
    ]);
    rendered.add('partial');
  }

  function renderProfiles() {
    if (rendered.has('profiles')) return;
    const ageOrder = ['<10', '10~19', '20~29', '30~39', '40~49', '50~59', '60~69', '70~79', '>=80'];
    const ages = [...D.profiles.donorAge2025.items]
      .filter((item) => ageOrder.includes(item.label))
      .sort((a, b) => ageOrder.indexOf(a.label) - ageOrder.indexOf(b.label));
    Charts.renderHorizontalBars($('chart-age'), ages, { color: Charts.COLORS.accent });
    Charts.renderHorizontalBars($('chart-sex'), D.profiles.donorSex2025.items, { color: Charts.COLORS.teal });
    Charts.renderHorizontalBars($('chart-classification'), D.profiles.donorClassification2025.items, { color: Charts.COLORS.amber });
    rendered.add('profiles');
  }

  function renderTerritory(mode) {
    const container = $('chart-territory');
    if (mode === 'organs') {
      text('territory-title', 'Órganos procurados por tipo');
      const data = D.profiles.organs2025.items
        .filter((item) => item.label !== 'TOTAL')
        .sort((a, b) => b.value - a.value);
      Charts.renderDotPlot(container, data.map((item) => ({ label: cleanLabel(item.label), value: item.value })), { color: Charts.COLORS.amber, topN: 20 });
      return;
    }
    text('territory-title', 'Donantes por provincia del establecimiento origen');
    const data = D.profiles.provinceDonors2025.items
      .filter((item) => item.label !== 'TOTAL' && item.label !== 'EST EXTRANJERO')
      .sort((a, b) => b.value - a.value);
    Charts.renderDotPlot(container, data.map((item) => ({ label: cleanLabel(item.label), value: item.value })), { color: Charts.COLORS.accent, topN: 24 });
  }

  Scroll.init({
    opening: () => {},
    chain: () => {},
    history: renderHistory,
    recovery: renderHistory,
    partial: renderPartial,
    profile: renderProfiles,
    territory: () => renderTerritory('territory'),
    organs: () => renderTerritory('organs'),
    explore: () => {},
    closing: () => {},
  });
  renderHistory();
  renderPartial();
  renderProfiles();
  renderTerritory('territory');

  const controls = {
    family: $('filter-family'),
    window: $('filter-window'),
    dimension: $('filter-dimension'),
    event: $('filter-event'),
    period: $('filter-period'),
    table: $('filter-table'),
    metric: $('filter-metric'),
    search: $('filter-search'),
  };

  function windowKey(group) {
    if (group.period.includes('-ene-jul')) return 'ene-jul';
    if (group.periodicity === 'anual') return 'anual';
    return 'otros';
  }

  function setOptions(select, values, formatter = (value) => value, preferred = null) {
    const previous = preferred ?? select.value;
    select.replaceChildren();
    values.forEach((value) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = formatter(value);
      select.appendChild(option);
    });
    if (values.includes(previous)) select.value = previous;
  }

  const unique = (values) => [...new Set(values)];
  const sortPeriods = (values) => [...values].sort((a, b) => a.localeCompare(b, 'es', { numeric: true }));
  const filterBase = () => D.groups.filter((group) => group.family === controls.family.value);
  const filterWindow = () => filterBase().filter((group) => windowKey(group) === controls.window.value);
  const filterDimension = () => filterWindow().filter((group) => group.dimension === controls.dimension.value);
  const filterEvent = () => filterDimension().filter((group) => group.event === controls.event.value);
  const filterPeriod = () => filterEvent().filter((group) => group.period === controls.period.value);

  function updateFamily(preferred = 'donacion') {
    setOptions(controls.family, unique(D.groups.map((group) => group.family)).sort(), (value) => labels[value] || value, preferred);
    updateWindow('anual');
  }
  function updateWindow(preferred = null) {
    setOptions(controls.window, unique(filterBase().map(windowKey)).sort(), (value) => labels[value] || 'Otros cortes', preferred);
    updateDimension('provincia');
  }
  function updateDimension(preferred = null) {
    setOptions(controls.dimension, unique(filterWindow().map((group) => group.dimension)).sort(), (value) => labels[value] || cleanLabel(value), preferred);
    updateEvent();
  }
  function updateEvent(preferred = null) {
    const values = unique(filterDimension().map((group) => group.event)).sort((a, b) => a.localeCompare(b, 'es', { numeric: true }));
    const donorProvince = values.find((value) => value.startsWith('2. Donantes agrupados por provincia'));
    setOptions(controls.event, values, cleanLabel, preferred || donorProvince || values[0]);
    updatePeriod('2025');
  }
  function updatePeriod(preferred = null) {
    const values = sortPeriods(unique(filterEvent().map((group) => group.period)));
    setOptions(controls.period, values, (value) => value.replace('-ene-jul', ' · ene–jul'), preferred || values.at(-1));
    updateTable();
  }
  function updateTable(preferred = null) {
    const groups = filterPeriod();
    setOptions(
      controls.table,
      groups.map((group) => group.id),
      (id) => {
        const group = groups.find((item) => item.id === id);
        const output = group?.trace.outputNumber ? `salida ${group.trace.outputNumber}` : 'tabla';
        return `${output} · ${id}`;
      },
      preferred || groups[0]?.id,
    );
    updateMetric();
  }
  function selectedGroup() {
    return D.groups.find((group) => group.id === controls.table.value) || null;
  }
  function updateMetric(preferred = null) {
    const group = selectedGroup();
    const values = group?.metrics || [];
    const sensible = values.find((value) => value === 'TOTAL') || values.find((value) => !value.startsWith('%')) || values[0];
    setOptions(controls.metric, values, cleanLabel, preferred || sensible);
    renderExplorer();
  }

  function normalized(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }
  function formatValue(value, unit, metric) {
    const suffix = unit === '%' || metric.startsWith('%') ? '%' : '';
    return `${fmt.format(value)}${suffix}`;
  }

  function renderExplorer() {
    const group = selectedGroup();
    if (!group) return;
    const metricIndex = group.metrics.indexOf(controls.metric.value);
    const query = normalized(controls.search.value);
    let rows = group.values
      .filter((value) => value[1] === metricIndex)
      .map((value) => ({ label: group.categories[value[0]], value: value[2], unit: value[3] }))
      .filter((row) => !query || normalized(row.label).includes(query));

    const explicitTotal = rows.find((row) => normalized(row.label) === 'total');
    const chartRows = rows
      .filter((row) => rows.length === 1 || normalized(row.label) !== 'total')
      .sort((a, b) => b.value - a.value);
    const max = Math.max(...chartRows.map((row) => Math.abs(Number(row.value))), 1);

    text('explorer-kicker', `${labels[group.family] || group.family} · ${labels[group.dimension] || cleanLabel(group.dimension)} · ${group.period.replace('-ene-jul', ' enero–julio')}`);
    text('explorer-title', cleanLabel(group.event));
    text('explorer-total', explicitTotal ? formatValue(explicitTotal.value, explicitTotal.unit, controls.metric.value) : 'No informado');

    const bars = $('explorer-bars');
    bars.replaceChildren();
    chartRows.forEach((row) => {
      const item = document.createElement('div');
      item.className = 'explorer-bar-row';
      const name = document.createElement('span');
      name.className = 'explorer-bar-label';
      name.textContent = cleanLabel(row.label);
      const track = document.createElement('span');
      track.className = 'explorer-bar-track';
      const fill = document.createElement('i');
      fill.style.width = `${Math.max(1, Math.abs(Number(row.value)) / max * 100)}%`;
      track.appendChild(fill);
      const value = document.createElement('strong');
      value.textContent = formatValue(row.value, row.unit, controls.metric.value);
      item.append(name, track, value);
      bars.appendChild(item);
    });
    $('explorer-empty').hidden = chartRows.length > 0;

    text('trace-module', group.trace.module || 'No consignado');
    text('trace-output', `${group.trace.outputNumber ? `${group.trace.outputNumber}. ` : ''}${group.trace.outputLabel || cleanLabel(group.event)}`);
    text('trace-period', `${group.period} · ${group.trace.dateFrom || 'sin fecha inicial'} a ${group.trace.dateTo || 'sin fecha final'}`);
    text('trace-ids', `${group.id} / ${group.queryId}`);
    text('trace-filters', group.trace.filters || 'Sin filtros literales registrados');
    text('trace-file', group.trace.sourceFile || 'No consignado');
    text('trace-sha', group.trace.sha256 || 'No consignado');
  }

  controls.family.addEventListener('change', () => updateWindow());
  controls.window.addEventListener('change', () => updateDimension());
  controls.dimension.addEventListener('change', () => updateEvent());
  controls.event.addEventListener('change', () => updatePeriod());
  controls.period.addEventListener('change', () => updateTable());
  controls.table.addEventListener('change', () => updateMetric());
  controls.metric.addEventListener('change', renderExplorer);
  controls.search.addEventListener('input', renderExplorer);

  updateFamily();
})();
