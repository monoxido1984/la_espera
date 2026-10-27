'use client';
import {useMemo,useState} from 'react';
import {annualListLabels,type AnnualTimeSelection} from './annual-time-model';
import type {ComparisonYear} from './annual-comparison-model';
import {causeMetric,timeMetric,timePopulation,territoryCauseOptions,territorySeries,type TerritoryMetric,type TerritoryPoint} from './territory-comparison-model';
import {decimal,integer,type HistoryYear} from './universe-model';
import {roundedDifference} from './comparison-display';
import HistoryMarkers from './history-markers';

export const comparisonMeasures: {id: TerritoryMetric; label: string; group: string}[] = [
  {id: 'waitlist', label: 'Personas en lista al cierre', group: 'Lista y movimientos'},
  {id: 'entries', label: 'Ingresos en el año', group: 'Lista y movimientos'},
  {id: 'exits', label: 'Egresos registrados', group: 'Lista y movimientos'},
  {id: 'transplants', label: 'Trasplantes', group: 'Lista y movimientos'},
  {id: 'deaths', label: 'Fallecimientos en lista', group: 'Lista y movimientos'},
  {id: 'entryCause', label: 'Causas de ingreso', group: 'Causas'},
  {id: 'exitCause', label: 'Motivos de egreso', group: 'Causas'},
  {id: 'time', label: 'Tiempo de espera hasta el trasplante (media)', group: 'Tiempos hasta el trasplante'},
];

export function useComparisonState(initialProvince?: string | null) {
  const [choiceA, setChoiceA] = useState(initialProvince || 'BUENOS AIRES');
  const [choiceB, setChoiceB] = useState('ARGENTINA');
  const [listChoice, setListChoice] = useState('');
  const [metric, setMetric] = useState<TerritoryMetric>('waitlist');
  const [age, setAge] = useState('all');
  const [causeChoice, setCauseChoice] = useState('');
  return {
    choiceA, setChoiceA,
    choiceB, setChoiceB,
    listChoice, setListChoice,
    metric, setMetric,
    age, setAge,
    causeChoice, setCauseChoice,
  };
}

export type ComparisonState = ReturnType<typeof useComparisonState>;

export function ComparisonControls({
  state,
  selectionList,
  selectionProvince,
  provinceNames,
  causeOptions,
}: {
  state: ComparisonState;
  selectionList: string;
  selectionProvince: string | null;
  provinceNames: Map<string, string>;
  causeOptions: {id: string; label: string; value: number}[];
}) {
  const {choiceA, setChoiceA, choiceB, setChoiceB, listChoice, setListChoice, metric, setMetric, age, setAge, causeChoice, setCauseChoice} = state;
  const list = listChoice || selectionList;
  const territoryA = choiceA || selectionProvince || [...provinceNames.keys()][0] || 'BUENOS AIRES';
  const territoryB = choiceB === territoryA ? (territoryA === 'ARGENTINA' ? [...provinceNames.keys()][0] : 'ARGENTINA') : choiceB;
  const isCause = causeMetric(metric);
  const selectedCause = causeOptions.find(row => row.id === causeChoice) ?? causeOptions[0];
  const cause = selectedCause?.id ?? '';

  function territoryOptions(other: string) {
    return (
      <>
        <option value="ARGENTINA" disabled={other === 'ARGENTINA'}>Argentina</option>
        {[...provinceNames].map(([id, label]) => (
          <option key={id} value={id} disabled={id === other}>{label}</option>
        ))}
      </>
    );
  }

  return (
    <div className="v2-comparison-controls-sidebar">
      <label>
        Primer territorio
        <select value={territoryA} onChange={e => setChoiceA(e.target.value)}>
          {territoryOptions('')}
        </select>
      </label>
      <label>
        Segundo territorio
        <select value={territoryB} onChange={e => setChoiceB(e.target.value)}>
          {territoryOptions(territoryA)}
        </select>
      </label>
      <label>
        Lista
        <select value={list} onChange={e => setListChoice(e.target.value)}>
          {Object.entries(annualListLabels).map(([id, label]) => (
            <option key={id} value={id}>{label}</option>
          ))}
        </select>
      </label>
      <label>
        Información
        <select value={metric} onChange={e => setMetric(e.target.value as TerritoryMetric)}>
          {[...new Set(comparisonMeasures.map(row => row.group))].map(group => (
            <optgroup key={group} label={group}>
              {comparisonMeasures.filter(row => row.group === group).map(row => (
                <option key={row.id} value={row.id}>{row.label}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>
      {timePopulation(metric) && (
        <label>
          Edad
          <select value={age} onChange={e => setAge(e.target.value)}>
            <option value="all">Todas las edades</option>
            <option value="menor_18">Menores de 18</option>
            <option value="18_mas">18 años y más</option>
          </select>
        </label>
      )}
      {isCause && (
        <label>
          Causa
          <select value={cause} disabled={!causeOptions.length} onChange={e => setCauseChoice(e.target.value)}>
            {!causeOptions.length && <option value="">Sin causas publicadas</option>}
            {causeOptions.map(row => (
              <option key={row.id} value={row.id}>{row.label}</option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}

export function ComparisonPanel({
  state,
  record,
  renalNational,
  provinceNames,
  selectionList,
  selectionProvince,
  onYear,
}: {
  state: ComparisonState;
  record: ComparisonYear;
  renalNational: HistoryYear[];
  provinceNames: Map<string, string>;
  selectionList: string;
  selectionProvince: string | null;
  onYear?: (year: number) => void;
}) {
  const {choiceA, choiceB, listChoice, metric, age, causeChoice} = state;
  const list = listChoice || selectionList;
  const territoryA = choiceA || selectionProvince || [...provinceNames.keys()][0] || 'BUENOS AIRES';
  const territoryB = choiceB === territoryA ? (territoryA === 'ARGENTINA' ? [...provinceNames.keys()][0] : 'ARGENTINA') : choiceB;

  const isTime = timeMetric(metric), isCause = causeMetric(metric);
  const queryMetric: TerritoryMetric = metric === 'time' ? 'average' : metric;
  const causeOptions = useMemo(() => isCause ? territoryCauseOptions(list, [territoryA, territoryB], metric as 'entryCause' | 'exitCause', record.year) : [], [isCause, list, territoryA, territoryB, metric, record.year]);
  const selectedCause = causeOptions.find(row => row.id === causeChoice) ?? causeOptions[0];
  const cause = selectedCause?.id ?? '';

  const seriesA = useMemo(() => territorySeries({list, territory: territoryA, metric: queryMetric, age, cause}, renalNational), [list, territoryA, queryMetric, age, cause, renalNational]);
  const seriesB = useMemo(() => territorySeries({list, territory: territoryB, metric: queryMetric, age, cause}, renalNational), [list, territoryB, queryMetric, age, cause, renalNational]);

  const unit = isTime ? (['HEPATICA', 'HEPATORRENAL', 'HEPATOINTESTINAL', 'HEPATOPANCREATICA'].includes(list) ? 'días' : 'meses') : 'PMH';
  const name = (territory: string) => territory === 'ARGENTINA' ? 'Argentina' : provinceNames.get(territory) ?? territory;
  const measure = comparisonMeasures.find(row => row.id === metric)!.label;
  const format = (value: number | null) => value === null ? 's/d' : isTime ? decimal(value) : new Intl.NumberFormat('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2}).format(value);

  const a = seriesA.find(row => row.year === record.year)!, b = seriesB.find(row => row.year === record.year)!;
  const rawDiff = roundedDifference(a.value, b.value, isTime ? 1 : 2);
  const difference = rawDiff === null ? null : (Object.is(rawDiff, -0) || rawDiff === 0 ? 0 : rawDiff);

  const ceiling = Math.max(1, ...[...seriesA, ...seriesB].flatMap(row => [row.value ?? 0]));
  const x = (year: number) => 35 + (year - 2005) / 20 * 530, y = (val: number) => 170 - (val / ceiling) * 135;
  const path = (rows: TerritoryPoint[]) => rows.map((row, i) => row.value === null ? '' : (i && rows[i - 1].value !== null && rows[i - 1].year === row.year - 1 ? 'L' : 'M') + x(row.year) + ',' + y(row.value)).join(' ');

  const share = (point: TerritoryPoint) => point.amount !== null && point.reportTotal !== null && point.reportTotal > 0 ? point.amount / point.reportTotal * 100 : null;
  const shareA = share(a), shareB = share(b);
  const rawShareDiff = roundedDifference(shareA, shareB, 1);
  const shareDifference = rawShareDiff === null ? null : (Object.is(rawShareDiff, -0) || rawShareDiff === 0 ? 0 : rawShareDiff);

  const finding = difference === null
    ? ('Falta un dato publicado para comparar ambos territorios en ' + record.year + '.')
    : difference === 0
    ? ('En ' + record.year + ', ambos territorios muestran ' + format(a.value) + ' ' + unit + ' a la precisión presentada.')
    : ('En ' + record.year + ', ' + name(territoryB) + ' muestra ' + format(Math.abs(difference)) + ' ' + unit + ' ' + (difference > 0 ? 'más' : 'menos') + ' que ' + name(territoryA) + ' en esta medida.');

  function mainCell(point: TerritoryPoint) {
    return (
      <>
        <strong>{format(point.value)}</strong>
        {metric === 'time' && point.median !== null && (
          <small>
            Mediana: {decimal(point.median)}
            {point.p25 !== null && point.p75 !== null && ` (P25–P75: ${decimal(point.p25)}–${decimal(point.p75)})`}
          </small>
        )}
        {isTime && point.n !== null && <small>{integer(point.n)} receptores</small>}
        {!isTime && point.amount !== null && <small>{integer(point.amount)} registros</small>}
      </>
    );
  }

  const tableMeasureLabel = metric === 'time' ? `Media hasta trasplante (${unit})` : (selectedCause?.label ?? measure);

  return (
    <div className="v2-comparison-stage">
      <header className="v2-story-scope">Comparación territorial · {record.label} · {scopeName(territoryA, territoryB, name)}</header>
      <div className="v2-comparison-meta">
        <p className="v2-comparison-legend">
          <span className="v2-legend-a">■ Azul: {name(territoryA)}</span>
          <span className="v2-legend-b">╌ Violeta discontinuo: {name(territoryB)}</span>
        </p>
        <p className="v2-comparison-finding" aria-live="polite">{finding}</p>
      </div>

      <div className="v2-comparison-chart-container">
        <svg viewBox="0 0 600 210" role="group" aria-label={`${measure} en ${name(territoryA)} y ${name(territoryB)}, ${unit}, escala común desde cero, 2005 a 2025`}>
          <line x1="35" x2="565" y1="170" y2="170" stroke="currentColor" opacity=".25"/>
          <HistoryMarkers x={x} bottom={170} top={35} labelTop={18}/>
          <path d={path(seriesA)} fill="none" stroke="#0052cc" strokeWidth="2.4"/>
          <path d={path(seriesB)} fill="none" stroke="#7400bd" strokeWidth="2.4" strokeDasharray="6 4"/>
          <line x1={x(record.year)} x2={x(record.year)} y1="35" y2="170" stroke="currentColor" opacity=".25" strokeDasharray="3 4"/>
          {[seriesA, seriesB].map((rows, index) => rows.map(row => row.value === null ? null : (
            <circle
              key={index + '-' + row.year}
              cx={x(row.year)}
              cy={y(row.value)}
              r={row.year === record.year ? 5.5 : 3}
              fill={index ? '#7400bd' : '#0052cc'}
              role={onYear ? 'button' : undefined}
              tabIndex={onYear ? 0 : undefined}
              aria-label={`${row.year}: ${format(row.value)} ${unit} · ${name(index ? territoryB : territoryA)}`}
              aria-pressed={onYear ? row.year === record.year : undefined}
              onClick={() => onYear?.(row.year)}
              onKeyDown={event => { if (onYear && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); onYear(row.year); } }}
            >
              <title>{`${name(index ? territoryB : territoryA)} · ${row.year} · ${format(row.value)} ${unit}${row.median !== null ? ` (Mediana: ${decimal(row.median)})` : ''}${row.n !== null ? ` · ${integer(row.n)} receptores` : ''}`}</title>
            </circle>
          )))}
          <text x="35" y="24" fontSize="12" fill="currentColor">{format(ceiling)} {unit}</text>
          <text x="20" y="174" fontSize="11" fill="currentColor">0</text>
          <text x="35" y="195" fontSize="11" fill="currentColor">2005</text>
          <text x="565" y="195" fontSize="11" fill="currentColor" textAnchor="end">2025</text>
        </svg>
      </div>

      <div className="v2-comparison-table-wrap">
        <table>
          <caption>{record.year} · diferencia: {name(territoryB)} menos {name(territoryA)}</caption>
          <thead>
            <tr>
              <th scope="col">Medida</th>
              <th scope="col">{name(territoryA)}</th>
              <th scope="col">{name(territoryB)}</th>
              <th scope="col">Diferencia</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">
                {tableMeasureLabel}
                <small>{unit === 'PMH' ? <abbr title="Por millón de habitantes">PMH</abbr> : unit}</small>
              </th>
              <td>{mainCell(a)}</td>
              <td>{mainCell(b)}</td>
              <td className="v2-comparison-diff">{difference === null ? 's/d' : (difference > 0 ? '+' : '') + format(difference)}</td>
            </tr>
            {isCause && (
              <tr>
                <th scope="row">Porcentaje del reporte<small>%</small></th>
                <td>{shareA === null ? 's/d' : decimal(shareA)}%</td>
                <td>{shareB === null ? 's/d' : decimal(shareB)}%</td>
                <td className="v2-comparison-diff">{shareDifference === null ? 's/d' : (shareDifference > 0 ? '+' : '') + decimal(shareDifference) + ' pp'}</td>
              </tr>
            )}
          </tbody>
        </table>
        {!isTime && <p className="v2-comparison-pmh-note">PMH: por millón de habitantes.</p>}
        {metric === 'time' && <p className="v2-comparison-pmh-note">La comparación de tiempo utiliza la media hasta el trasplante para garantizar equivalencia estadística entre territorios.</p>}
      </div>
    </div>
  );
}

function scopeName(tA: string, tB: string, nameFn: (s: string) => string) {
  return `${nameFn(tA)} vs. ${nameFn(tB)}`;
}

export default function ExplorationComparison({
  selection,
  record,
  renalNational,
  provinceNames,
  onYear,
}: {
  selection: AnnualTimeSelection;
  record: ComparisonYear;
  history?: ComparisonYear[];
  renalNational: HistoryYear[];
  provinceNames: Map<string, string>;
  onYear?: (year: number) => void;
}) {
  const state = useComparisonState(selection.province);
  const isCause = causeMetric(state.metric);
  const territoryA = state.choiceA || selection.province || [...provinceNames.keys()][0] || 'BUENOS AIRES';
  const territoryB = state.choiceB === territoryA ? (territoryA === 'ARGENTINA' ? [...provinceNames.keys()][0] : 'ARGENTINA') : state.choiceB;
  const list = state.listChoice || selection.list;
  const causeOptions = useMemo(() => isCause ? territoryCauseOptions(list, [territoryA, territoryB], state.metric as 'entryCause' | 'exitCause', record.year) : [], [isCause, list, territoryA, territoryB, state.metric, record.year]);

  return (
    <div className="v2-comparison-full">
      <ComparisonControls
        state={state}
        selectionList={selection.list}
        selectionProvince={selection.province}
        provinceNames={provinceNames}
        causeOptions={causeOptions}
      />
      <ComparisonPanel
        state={state}
        record={record}
        renalNational={renalNational}
        provinceNames={provinceNames}
        selectionList={selection.list}
        selectionProvince={selection.province}
        onYear={onYear}
      />
    </div>
  );
}
