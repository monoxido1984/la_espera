'use client';

import historyData from './history.generated.json';
import DataMethod from './data-method';
import InternationalComparison from './international-comparison';
import { CSSProperties, useMemo, useState } from 'react';

type MetricKey = 'donors' | 'waitlist' | 'median';

type Milestone = {
  id: string;
  year: number;
  type: string;
  title: string;
  body: string;
  reading: string;
  sources: Array<{ label: string; href: string }>;
};

type Metric = {
  key: MetricKey;
  label: string;
  unit: string;
  color: string;
};

const WIDTH = 920;
const HEIGHT = 190;
const PLOT = { left: 78, right: 22, top: 18, bottom: 30 };

const SERIES = historyData;

const MILESTONES: Milestone[] = [
  {
    id: 'law-26066',
    year: 2005,
    type: 'Ley nacional',
    title: 'Ley 26.066: donante presunto',
    body: 'Modificó la Ley 24.193 y estableció la ablación en personas capaces mayores de 18 años que no hubieran dejado constancia expresa de oposición. Fue sancionada el 30 de noviembre de 2005 y publicada el 22 de diciembre.',
    reading: 'Es el punto de partida normativo de esta serie. El marcador no atribuye a la ley los cambios posteriores: permite leerlos dentro de su contexto regulatorio.',
    sources: [
      { label: 'Ley 26.066', href: 'https://www.argentina.gob.ar/normativa/nacional/ley-26066-112375' },
    ],
  },
  {
    id: 'awareness-hospital',
    year: 2013,
    type: 'Ley y estrategia hospitalaria',
    title: 'Conciencia pública y Hospital Donante',
    body: 'La Ley 26.845 promovió acciones educativas sobre la relevancia social de la donación. Ese mismo año, la Resolución 229/13 plasmó la estrategia Hospital Donante para involucrar a los equipos hospitalarios en la procuración.',
    reading: 'Son dos intervenciones distintas —una educativa y otra organizativa— reunidas en un mismo año. No deben leerse como una única política ni como causa directa de la variación anual.',
    sources: [
      { label: 'Ley 26.845', href: 'https://www.argentina.gob.ar/normativa/nacional/ley-26845-211064' },
      { label: 'Estrategias INCUCAI', href: 'https://www.argentina.gob.ar/salud/incucai/comunidad-hospitalaria/estrategias-y-programas' },
    ],
  },
  {
    id: 'ley-justina',
    year: 2018,
    type: 'Ley nacional',
    title: 'Ley 27.447, conocida como Ley Justina',
    body: 'Entró en vigencia el 3 de agosto de 2018. Reguló la obtención y utilización de órganos, tejidos y células, mantuvo el principio de donante presunto e incorporó servicios de procuración en establecimientos con terapia intensiva.',
    reading: 'El aumento de donantes continúa en 2019. La cercanía temporal es visible, pero la gráfica no separa el efecto de la ley de otros cambios institucionales o sociales.',
    sources: [
      { label: 'Nueva Ley de Donación y Trasplante', href: 'https://www.argentina.gob.ar/salud/incucai/nueva-ley-de-doncacion-y-trasplante' },
    ],
  },
  {
    id: 'pandemic',
    year: 2020,
    type: 'Contexto sanitario',
    title: 'Pandemia de COVID-19',
    body: 'La Memoria 2020 del INCUCAI documenta el impacto de la pandemia sobre la donación y el trasplante. También registra protocolos y medidas para sostener la operatividad del sistema durante la emergencia.',
    reading: 'La caída de donantes en 2020 coincide con este contexto excepcional. Existe respaldo institucional para vincular la disrupción con la pandemia, sin reducir toda la variación a una sola causa.',
    sources: [
      { label: 'Memoria INCUCAI 2020', href: 'https://www.argentina.gob.ar/sites/default/files/bancos/2021-12/memoria-incucai-2020.pdf' },
    ],
  },
  {
    id: 'procurar',
    year: 2022,
    type: 'Programa nacional',
    title: 'Programa PROCURAR',
    body: 'Aprobado por la Resolución 3685/22, promovió Unidades Hospitalarias de Procuración de Órganos y Tejidos con asistencia técnica y financiera para establecimientos seleccionados.',
    reading: 'El programa profundiza el modelo intrahospitalario. La recuperación posterior se muestra como evolución observada, no como una estimación del impacto del programa.',
    sources: [
      { label: 'Programa PROCURAR', href: 'https://www.argentina.gob.ar/salud/incucai/comunidad-hospitalaria/programa-procurar' },
    ],
  },
];

const METRICS: Metric[] = [
  { key: 'donors', label: 'Donantes de órganos y tejidos', unit: 'personas', color: 'var(--renal)' },
  { key: 'waitlist', label: 'En lista durante el año · Total LE', unit: 'pacientes', color: 'var(--teal)' },
  { key: 'median', label: 'Mediana del tiempo renal hasta el trasplante', unit: 'meses', color: 'var(--yellow-dark)' },
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
  const min = Math.min(...values);
  const max = Math.max(...values);
  const padding = Math.max((max - min) * 0.12, 1);
  return [Math.max(0, min - padding), max + padding] as const;
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

function tickValues(domain: readonly [number, number]) {
  return [domain[0], (domain[0] + domain[1]) / 2, domain[1]];
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

function HistoricalPanel({
  metric,
  selectedYear,
  selectedMilestone,
  onSelectMilestone,
  onSelectYear,
  showXAxis,
  showMilestones,
  baselineYear,
}: {
  metric: Metric;
  selectedYear: number;
  selectedMilestone: Milestone | null;
  onSelectMilestone: (id: string) => void;
  onSelectYear: (year: number) => void;
  showXAxis: boolean;
  showMilestones: boolean;
  baselineYear: number;
}) {
  const domain = useMemo(() => metricDomain(metric), [metric]);
  const latest = SERIES.find(item => item.year === selectedYear)![metric.key];
  const pandemicStart = xPosition(2020) - (xPosition(2021) - xPosition(2020)) / 2;
  const pandemicEnd = xPosition(2021) + (xPosition(2021) - xPosition(2020)) / 2;

  return (
    <section className="historical-panel">
      <header>
        <span>{metric.label}</span>
        <strong>{selectedYear} · {metric.key === 'median' ? formatDecimal(latest) : formatInteger(latest)} {metric.unit}</strong>
      </header>
      <div className="historical-plot-wrap">
        <svg
          className="historical-plot"
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label={`${metric.label}, 2005 a 2025. Serie anual nacional con hitos institucionales seleccionables.`}
        >
          <rect
            className="historical-pandemic-band"
            x={pandemicStart}
            y={PLOT.top}
            width={pandemicEnd - pandemicStart}
            height={HEIGHT - PLOT.top - PLOT.bottom}
          />
          {showMilestones && (
            <text className="historical-pandemic-label" x={xPosition(2020)} y={PLOT.top + 12} textAnchor="middle">
              pandemia
            </text>
          )}

          {tickValues(domain).map((tick) => {
            const y = yPosition(tick, domain);
            return (
              <g key={tick}>
                <line className="historical-grid-line" x1={PLOT.left} x2={WIDTH - PLOT.right} y1={y} y2={y} />
                <text className="historical-axis-label" x={PLOT.left - 10} y={y + 4} textAnchor="end">
                  {metric.key === 'median' ? formatInteger(tick) : formatInteger(tick)}
                </text>
              </g>
            );
          })}

          <rect
            className="historical-frame"
            x={PLOT.left}
            y={PLOT.top}
            width={WIDTH - PLOT.left - PLOT.right}
            height={HEIGHT - PLOT.top - PLOT.bottom}
          />

          {metric.key === 'median' && <polygon className="historical-wait-band" points={bandPoints(domain)} />}
          <line className="historical-baseline-year" x1={xPosition(baselineYear)} x2={xPosition(baselineYear)} y1={PLOT.top} y2={HEIGHT - PLOT.bottom} />
          <line
            className="historical-selected-year"
            x1={xPosition(selectedYear)}
            x2={xPosition(selectedYear)}
            y1={PLOT.top}
            y2={HEIGHT - PLOT.bottom}
          />
          <polyline className="historical-series-line" style={{ '--series-color': metric.color } as CSSProperties} points={linePoints(metric, domain)} />
          {SERIES.map((item) => (
            <circle
              key={item.year}
              className="historical-series-dot"
              style={{ '--series-color': metric.color } as CSSProperties}
              cx={xPosition(item.year)}
              cy={yPosition(item[metric.key], domain)}
              r={item.year === selectedYear ? 6 : 3}
              aria-label={`${item.year}: ${metric.key === 'median' ? formatDecimal(item[metric.key]) : formatInteger(item[metric.key])} ${metric.unit}`}
              onClick={() => onSelectYear(item.year)}
            />
          ))}

          {showXAxis ? [2005, 2010, 2015, 2020, 2025].map((year) => (
            <text key={year} className="historical-axis-label historical-year-label" x={xPosition(year)} y={HEIGHT - 7} textAnchor="middle">{year}</text>
          )) : (
            <text className="historical-axis-label historical-range-label" x={WIDTH / 2} y={HEIGHT - 7} textAnchor="middle">2005–2025</text>
          )}
          <text className="historical-axis-title" x={14} y={HEIGHT / 2} textAnchor="middle" transform={`rotate(-90 14 ${HEIGHT / 2})`}>{metric.unit}</text>
        </svg>
        <div className="historical-year-targets" aria-label={`Elegir año en ${metric.label}`}>
          {SERIES.map((item) => <button key={item.year} type="button" tabIndex={item.year === selectedYear ? 0 : -1} aria-label={`${metric.label}: elegir ${item.year}`} aria-pressed={item.year === selectedYear} onClick={() => onSelectYear(item.year)} style={{ left: `${(xPosition(item.year) / WIDTH) * 100}%` }} />)}
        </div>
        {metric.key === 'median' && <p className="historical-band-note"><i aria-hidden="true" />La línea muestra la mediana; la franja P25–P75 contiene la mitad central de los tiempos. No es un intervalo de confianza ni un pronóstico.</p>}

        {showMilestones && MILESTONES.map((milestone) => {
          const datum = SERIES.find((item) => item.year === milestone.year);
          if (!datum) return null;
          const left = `${(xPosition(milestone.year) / WIDTH) * 100}%`;
          const top = `${(yPosition(datum[metric.key], domain) / HEIGHT) * 100}%`;
          const isSelected = selectedMilestone?.id === milestone.id;
          return (
            <button
              key={milestone.id}
              type="button"
              className="historical-milestone-point"
              style={{ left, top }}
              aria-label={`${milestone.year}: ${milestone.title}`}
              aria-controls="historical-event-detail"
              aria-expanded={isSelected}
              aria-pressed={isSelected}
              onClick={() => onSelectMilestone(milestone.id)}
            >
              <span>{milestone.year}</span>
            </button>
          );
        })}
      </div>

      {showMilestones && (
        <nav className="historical-milestone-mobile" aria-label="Hitos de la serie histórica">
          {MILESTONES.map((milestone) => {
            const isSelected = selectedMilestone?.id === milestone.id;
            return (
              <button
                key={milestone.id}
                type="button"
                aria-label={`${milestone.year}: ${milestone.title}`}
                aria-controls="historical-event-detail"
                aria-expanded={isSelected}
                aria-pressed={isSelected}
                onClick={() => onSelectMilestone(milestone.id)}
              >
                {milestone.year}
              </button>
            );
          })}
        </nav>
      )}
      {showMilestones && selectedMilestone && <MilestoneDetail milestone={selectedMilestone} />}
    </section>
  );
}

export default function HistoricalSeries() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(2025);
  const [baselineYear, setBaselineYear] = useState(2005);
  const selected = MILESTONES.find((item) => item.id === selectedId) ?? null;
  const current = SERIES.find(item => item.year === selectedYear)!;
  const baseline = SERIES.find(item => item.year === baselineYear)!;
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
        <p className="eyebrow">Pregunta 5 · cambios en el tiempo</p>
        <h2 id="historical-series-title">Donación y espera: ¿qué cambió en veinte años?</h2>
        <div>
          <p>Los donantes forman parte de esta historia: hacen posibles los trasplantes. Mirá cómo cambiaron la donación, las listas y el tiempo hasta el trasplante renal. Las series dan contexto; no permiten calcular cuánto se acorta la espera por cada donante.</p>
          <span>2005–2025</span>
        </div>
      </header>

      <p className="metric-context">Contexto nacional independiente del atlas: todas las listas para el conteo en lista, órganos y tejidos para donantes, sólo renal para tiempos. Años completos; sin filtros provinciales ni etarios.</p>
      <div className="history-explorer">
        <div className="history-controls">
          <label htmlFor="history-year">Año que explorás <strong>{selectedYear}</strong></label>
          <input id="history-year" type="range" min="2005" max="2025" step="1" value={selectedYear} onChange={event => selectYear(Number(event.target.value))} />
          <label htmlFor="history-baseline">Comparar con</label>
          <select id="history-baseline" value={baselineYear} onChange={event => setBaselineYear(Number(event.target.value))}>{SERIES.map(item => <option key={item.year}>{item.year}</option>)}</select>
        </div>
        <div className="history-comparison" aria-live="polite">
          {METRICS.map(metric => {
            const delta = current[metric.key] - baseline[metric.key];
            return <div key={metric.key}><span>{metric.label}</span><strong>{metric.key === 'median' ? formatDecimal(current[metric.key]) : formatInteger(current[metric.key])}<small> {metric.unit}</small></strong><p>{delta > 0 ? '+' : ''}{metric.key === 'median' ? formatDecimal(delta) : formatInteger(delta)} {metric.unit} frente a {baselineYear}</p></div>;
          })}
        </div>
        <p className="history-reading-key">Línea continua: {selectedYear} · línea punteada: {baselineYear}. Cada gráfico tiene su propia escala y población.</p>
      </div>
      <div className="historical-series-panels">
        {METRICS.map((metric, index) => (
          <HistoricalPanel
            key={metric.key}
            metric={metric}
            selectedYear={selectedYear}
            baselineYear={baselineYear}
            selectedMilestone={selected}
            onSelectMilestone={selectMilestone}
            onSelectYear={selectYear}
            showXAxis={index === METRICS.length - 1}
            showMilestones={index === 0}
          />
        ))}
      </div>

      <details className="history-data-table"><summary>Consultar los valores de los 21 años</summary><div className="history-table-scroll"><table><caption>CRESI/SINTRA · series nacionales 2005–2025. Mediana y percentiles: meses hasta el trasplante renal entre receptores trasplantados.</caption><thead><tr><th scope="col">Año</th><th scope="col">Donantes</th><th scope="col">En lista</th><th scope="col">Mediana</th><th scope="col">P25</th><th scope="col">P75</th><th scope="col">Receptores</th></tr></thead><tbody>{SERIES.map(item => <tr key={item.year}><th scope="row">{item.year}</th><td>{formatInteger(item.donors)}</td><td>{formatInteger(item.waitlist)}</td><td>{formatDecimal(item.median)}</td><td>{formatDecimal(item.p25)}</td><td>{formatDecimal(item.p75)}</td><td>{formatInteger(item.n)}</td></tr>)}</tbody></table></div></details>

      <InternationalComparison />

      <DataMethod fields={[{label:'Fuentes nacionales',value:'CRESI: incidencia/prevalencia de lista (Total LE); donantes reales y de tejidos; reporte de trasplante renal, fila TOTAL de estadísticos. Rutas, fechas de consulta de tiempos e identificadores en la descarga.'},{label:'Comparación internacional',value:'Global Observatory on Donation and Transplantation (OMS–ONT), indicador Actual deceased donors (DD), 2005 y 2025. Conteos y tasas publicados por país; el observatorio calcula las tasas con población UNFPA. Consulta: 18/09/2026. La fuente advierte que puede revisar cifras todavía no definitivas.'},{label:'Cálculos',value:'Conteos sumados de tablas provinciales: lista, 24 jurisdicciones; donantes incluye establecimiento extranjero cuando está publicado. Mediana y P25–P75 renales publicados, sin ponderar percentiles. Diferencias entre años calculadas para la pieza. La comparación internacional no recalcula ni ordena las tasas.'},{label:'Lectura temporal',value:'Cada año describe una población diferente. No se sigue a una cohorte. Los conteos de lista son el Total LE del informe anual de incidencia/prevalencia y no deben confundirse con la fotografía actual.'}]} links={[{label:'CRESI/SINTRA',href:'https://cresi.incucai.gov.ar/'},{label:'GODT · resumen por país',href:'https://www.transplant-observatory.org/summary/'},{label:'GODT · metodología',href:'https://www.transplant-observatory.org/methodology/'},{label:'GODT · cómo citar los datos',href:'https://www.transplant-observatory.org/uses-of-dataquoting-data/'},{label:'Descargar historia con fuentes (JSON)',href:'/datos/historia-y-fuentes.json'}]} />
      <footer className="historical-series-notes">
        <span>Donantes: órganos y tejidos</span>
        <span>Lista: pacientes en todas las listas</span>
        <span>Espera: mediana renal hasta el trasplante; banda P25–P75</span>
        <strong>Los hitos aportan contexto temporal; su coincidencia con la serie no demuestra causalidad.</strong>
      </footer>
    </section>
  );
}
