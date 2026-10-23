'use client';

import historyData from './history.generated.json';
import {MILESTONES,type Milestone} from './historical-milestones';
import DataMethod from './data-method';
import InternationalComparison from './international-comparison';
import { CSSProperties, useMemo, useState } from 'react';

type MetricKey = 'donors' | 'waitlist' | 'median';



type Metric = {
  key: MetricKey;
  label: string;
  unit: string;
  color: string;
  context: string;
};

const WIDTH = 920;
const HEIGHT = 160;
const PLOT = { left: 78, right: 22, top: 18, bottom: 30 };

const SERIES = historyData;



const METRICS: Metric[] = [
  { key: 'waitlist', label: 'En lista de espera', unit: 'registros', color: '#9dcfc8', context: 'Todas las listas · Total LE del informe anual' },
  { key: 'median', label: 'Tiempo hasta el trasplante', unit: 'meses', color: '#ebc16c', context: 'Mediana renal · sólo quienes recibieron un trasplante' },
  { key: 'donors', label: 'Donantes', unit: 'donantes', color: '#f1977d', context: 'Donantes fallecidos reales de órganos y de tejidos' },
];

const formatInteger = (value: number) => new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(value);
const formatDecimal = (value: number) => new Intl.NumberFormat('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value);

function xPosition(year: number) {
  const innerWidth = WIDTH - PLOT.left - PLOT.right;
  return PLOT.left + ((year - 2005) / 20) * innerWidth;
}

function metricValues(metric: Metric) {
  if (metric.key === 'median') return SERIES.flatMap((item) => [item.p25, item.p75]);
  return SERIES.map((item) => item[metric.key]);
}

function metricDomain(metric: Metric) {
  const values = metricValues(metric);
  const max = Math.max(...values) * 1.12;
  const step = 10 ** Math.floor(Math.log10(max));
  return [0, Math.ceil(max / step) * step] as const;
}

function yPosition(value: number, domain: readonly [number, number]) {
  const innerHeight = HEIGHT - PLOT.top - PLOT.bottom;
  return PLOT.top + ((domain[1] - value) / (domain[1] - domain[0])) * innerHeight;
}

function linePoints(metric: Metric, domain: readonly [number, number]) {
  return SERIES.map((item) => `${xPosition(item.year)},${yPosition(item[metric.key], domain)}`).join(' ');
}

function bandPoints(domain: readonly [number, number]) {
  const upper = SERIES.map((item) => `${xPosition(item.year)},${yPosition(item.p75, domain)}`);
  const lower = [...SERIES].reverse().map((item) => `${xPosition(item.year)},${yPosition(item.p25, domain)}`);
  return [...upper, ...lower].join(' ');
}

function MilestoneDetail({ milestone }: { milestone: Milestone }) {
  return (
    <article className="historical-event-detail" id="historical-event-detail" key={milestone.id} aria-live="polite">
      <div className="historical-event-year">{milestone.year}</div>
      <div className="historical-event-copy">
        <span>{milestone.type}</span>
        <h3>{milestone.title}</h3>
        <p>{milestone.body}</p>
        <div className="historical-event-sources">
          {milestone.sources.map((source) => (
            <a key={source.href} href={source.href} target="_blank" rel="noreferrer">{source.label} ↗</a>
          ))}
        </div>
      </div>
      <aside>
        <strong>Cómo leerlo</strong>
        <p>{milestone.reading}</p>
      </aside>
    </article>
  );
}

function TimelineRow({ metric, selectedYear, baselineYear, onSelectYear }: {
  metric: Metric;
  selectedYear: number;
  baselineYear: number;
  onSelectYear: (year: number) => void;
}) {
  const domain = useMemo(() => metricDomain(metric), [metric]);
  const current = SERIES.find(item => item.year === selectedYear)!;
  const baseline = SERIES.find(item => item.year === baselineYear)!;
  const value = current[metric.key];
  const delta = value - baseline[metric.key];
  const format = metric.key === 'median' ? formatDecimal : formatInteger;
  const selectedX = xPosition(selectedYear);
  const selectedY = yPosition(value, domain);
  return (
    <article className="pulse-row" style={{ '--pulse-color': metric.color } as CSSProperties}>
      <div className="pulse-readout">
        <h3>{metric.label}</h3>
        <p className="pulse-value"><strong>{format(value)}</strong><span>{metric.unit}</span></p>
        <p className="pulse-delta">{delta > 0 ? '+' : ''}{format(delta)} frente a {baselineYear}</p>
        <p className="pulse-context">{metric.context}{metric.key === 'median' ? ` · ${formatInteger(current.n)} receptores` : ''}</p>
      </div>
      <div className="pulse-chart">
        <svg viewBox={'0 0 ' + WIDTH + ' ' + HEIGHT} role="img" aria-label={metric.label + ', serie nacional 2005 a 2025. ' + selectedYear + ': ' + format(value) + ' ' + metric.unit + '. Escala propia desde cero.'}>
          <rect className="pulse-pandemic" x={xPosition(2020) - 20} y={PLOT.top} width={xPosition(2021) - xPosition(2020) + 40} height={HEIGHT - PLOT.top - PLOT.bottom} />
          {[0, domain[1] / 2, domain[1]].map(tick => <g key={tick}>
            <line className="pulse-grid" x1={PLOT.left} x2={WIDTH - PLOT.right} y1={yPosition(tick, domain)} y2={yPosition(tick, domain)} />
            <text className="pulse-axis" x={PLOT.left - 14} y={yPosition(tick, domain) + 5} textAnchor="end">{formatInteger(tick)}</text>
          </g>)}
          {[2005, 2010, 2015, 2020, 2025].map(year => <line key={year} className="pulse-grid pulse-grid-vertical" x1={xPosition(year)} x2={xPosition(year)} y1={PLOT.top} y2={HEIGHT - PLOT.bottom} />)}
          {metric.key === 'median' && <polygon className="pulse-band" points={bandPoints(domain)} />}
          <line className="pulse-baseline" x1={xPosition(baselineYear)} x2={xPosition(baselineYear)} y1={PLOT.top} y2={HEIGHT - PLOT.bottom} />
          <line className="pulse-cursor" x1={selectedX} x2={selectedX} y1={PLOT.top} y2={HEIGHT - PLOT.bottom} />
          <polyline className="pulse-line" points={linePoints(metric, domain)} />
          {SERIES.map(item => <circle key={item.year} className="pulse-dot" cx={xPosition(item.year)} cy={yPosition(item[metric.key], domain)} r={item.year === selectedYear ? 7 : 2.5} />)}
          <circle className="pulse-halo" cx={selectedX} cy={selectedY} r="14" />
          {[2005, 2010, 2015, 2020, 2025].map(year => <text key={year} className="pulse-axis pulse-year" x={xPosition(year)} y={HEIGHT - 4} textAnchor="middle">{year}</text>)}
        </svg>
        <div className="pulse-targets" role="group" aria-label={'Elegir año en ' + metric.label}>
          {SERIES.map(item => <button key={item.year} type="button" tabIndex={-1} aria-label={metric.label + ': elegir ' + item.year} aria-pressed={item.year === selectedYear} onClick={() => onSelectYear(item.year)} style={{ left: (xPosition(item.year) / WIDTH) * 100 + '%' }} />)}
        </div>
      </div>
    </article>
  );
}

export default function HistoricalSeries() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(2025);
  const [baselineYear, setBaselineYear] = useState(2005);
  const selected = MILESTONES.find((item) => item.id === selectedId) ?? null;
  const selectMilestone = (id: string) => {
    setSelectedId(id);
    setSelectedYear(MILESTONES.find(item => item.id === id)!.year);
  };
  const selectYear = (year: number) => {
    setSelectedId(null);
    setSelectedYear(year);
  };

  return (
    <section className="historical-series" id="historia" aria-labelledby="historical-series-title">
      <header className="historical-series-intro">
        <p className="eyebrow">02 · Los años de la espera</p>
        <h2 id="historical-series-title">Los años pasan.<br /><em>La espera cambia.</em></h2>
        <div><p>Una misma línea de tiempo. Tres formas de mirar la espera en Argentina.</p><span>2005 — 2025</span></div>
      </header>

      <div className="history-pulse">
        <header className="pulse-heading">
          <div><span className="pulse-overline">Argentina · 21 años</span><p>Listas. Tiempo. Donación.</p></div>
          <output htmlFor="history-year" className="pulse-year-display">{selectedYear}</output>
        </header>
        <div className="pulse-rows" aria-live="polite" aria-atomic="true">
          {METRICS.map(metric => <TimelineRow key={metric.key} metric={metric} selectedYear={selectedYear} baselineYear={baselineYear} onSelectYear={selectYear} />)}
        </div>
        <div className="pulse-controls">
          <div className="pulse-year-control">
            <label htmlFor="history-year">Mové el año. Mirá cómo cambia la historia.</label>
            <div><button type="button" aria-label="Año anterior" disabled={selectedYear === 2005} onClick={() => selectYear(selectedYear - 1)}>←</button><input id="history-year" type="range" min="2005" max="2025" step="1" value={selectedYear} aria-valuetext={String(selectedYear)} onChange={event => selectYear(Number(event.target.value))} /><button type="button" aria-label="Año siguiente" disabled={selectedYear === 2025} onClick={() => selectYear(selectedYear + 1)}>→</button></div>
          </div>
          <label className="pulse-compare" htmlFor="history-baseline">Comparar con<select id="history-baseline" value={baselineYear} onChange={event => setBaselineYear(Number(event.target.value))}>{SERIES.map(item => <option key={item.year}>{item.year}</option>)}</select></label>
        </div>
        <p className="pulse-reading">Mismo calendario, escalas propias desde cero. Línea vertical: año elegido. Punteada: comparación. Franja amarilla: mitad central de los tiempos renales (P25–P75).</p>
      </div>
      <div className="history-connection">
        <p>La donación hace posible el trasplante.<br /><strong>La espera no depende de una sola cifra.</strong></p>
        <p>Cada serie describe una población distinta. El tiempo corresponde a quienes recibieron un trasplante renal; no predice cuánto les falta a quienes siguen en lista. El conteo anual en lista es distinto de la fotografía actual.</p>
      </div>
      <nav className="pulse-milestones" aria-label="Hitos de la historia">
        <span>Hitos para leer el contexto</span>
        {MILESTONES.map(milestone => <button key={milestone.id} type="button" aria-expanded={selectedId === milestone.id} aria-controls="historical-event-detail" onClick={() => { if (selectedId === milestone.id) setSelectedId(null); else selectMilestone(milestone.id); }}><strong>{milestone.year}</strong><span>{milestone.type}</span></button>)}
      </nav>
      {selected && <MilestoneDetail milestone={selected} />}

      <details className="history-data-table"><summary>Consultar los valores de los 21 años</summary><div className="history-table-scroll"><table><caption>CRESI/SINTRA · series nacionales 2005–2025. Mediana y percentiles: meses hasta el trasplante renal entre receptores trasplantados.</caption><thead><tr><th scope="col">Año</th><th scope="col">Donantes</th><th scope="col">En lista</th><th scope="col">Mediana</th><th scope="col">P25</th><th scope="col">P75</th><th scope="col">Receptores</th></tr></thead><tbody>{SERIES.map(item => <tr key={item.year}><th scope="row">{item.year}</th><td>{formatInteger(item.donors)}</td><td>{formatInteger(item.waitlist)}</td><td>{formatDecimal(item.median)}</td><td>{formatDecimal(item.p25)}</td><td>{formatDecimal(item.p75)}</td><td>{formatInteger(item.n)}</td></tr>)}</tbody></table></div></details>

      <details className="history-international"><summary>Otra perspectiva: la donación en otros países <span aria-hidden="true">↗</span></summary><InternationalComparison /></details>

      <DataMethod fields={[{label:'Fuentes nacionales',value:'CRESI: incidencia/prevalencia de lista (Total LE); donantes reales y de tejidos; reporte de trasplante renal, fila TOTAL de estadísticos. Rutas, fechas de consulta de tiempos e identificadores en la descarga.'},{label:'Comparación internacional',value:'Global Observatory on Donation and Transplantation (OMS–ONT), indicador Actual deceased donors (DD), 2005 y 2025. Conteos y tasas publicados por país; el observatorio calcula las tasas con población UNFPA. Consulta: 18/09/2026. La fuente advierte que puede revisar cifras todavía no definitivas.'},{label:'Cálculos',value:'Conteos sumados de tablas provinciales: lista, 24 jurisdicciones; donantes incluye establecimiento extranjero cuando está publicado. Mediana y P25–P75 renales publicados, sin ponderar percentiles. Diferencias entre años calculadas para la pieza. La comparación internacional no recalcula ni ordena las tasas.'},{label:'Lectura temporal',value:'Cada año describe una población diferente. No se sigue a una cohorte. Los conteos de lista son el Total LE del informe anual de incidencia/prevalencia y no deben confundirse con la fotografía actual.'}]} links={[{label:'CRESI/SINTRA',href:'https://cresi.incucai.gov.ar/'},{label:'GODT · resumen por país',href:'https://www.transplant-observatory.org/summary/'},{label:'GODT · metodología',href:'https://www.transplant-observatory.org/methodology/'},{label:'GODT · cómo citar los datos',href:'https://www.transplant-observatory.org/uses-of-dataquoting-data/'},{label:'Descargar historia con fuentes (JSON)',href:'/datos/historia-y-fuentes.json'}]} />
      <footer className="historical-series-notes">
        <span>Donantes: órganos y tejidos</span>
        <span>Lista: Total LE del informe anual</span>
        <span>Espera: mediana renal hasta el trasplante; banda P25–P75</span>
        <strong>Los hitos aportan contexto temporal; su coincidencia con la serie no demuestra causalidad.</strong>
      </footer>
    </section>
  );
}
