'use client';

import { CSSProperties, useEffect, useMemo, useState } from 'react';
import {
  buildStoryView,
  formatDecimal,
  formatInteger,
  MarginDatum,
  StoryData,
  TransplantSnapshot,
} from './story-model';
import rawTransplantSnapshot from './transplant-snapshot.generated.json';
import rawWaitTimeProvince from './wait-time-province.generated.json';
import AllocationExplainer from './allocation-explainer';
import DataMethod from './data-method';
import HistoricalSeries from './historical-series';
import WaitingComposition from './waiting-composition';
import { summarizeWait, type WaitCell } from './wait-statistics';
import TimeSummary from './time-summary';
import historyData from './history.generated.json';

type CssVars = CSSProperties & Record<`--${string}`, string | number>;

type ProvinceDefinition = {
  key: string;
  name: string;
};

type GeoPosition = [number, number];

type ProvinceFeature = {
  type: 'Feature';
  properties: {
    id: string;
    nombre: string;
    centroide?: { lon: number; lat: number };
  };
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: GeoPosition[][] | GeoPosition[][][];
  };
};

type ProvinceFeatureCollection = {
  type: 'FeatureCollection';
  features: ProvinceFeature[];
};

type ListSnapshot = NonNullable<StoryData['currentSnapshot']['byList']>[number];
type ProvinceProfile = {
  age: MarginDatum[];
  sex: MarginDatum[];
};
type ProfileLens = 'age' | 'sex';
type TerritoryFocus = 'patients' | 'donors' | 'wait';
type MapPalette = {
  light: [number, number, number];
  dark: [number, number, number];
};

const TERRITORY_PALETTES: Record<TerritoryFocus, MapPalette> = {
  donors: { light: [247, 234, 212], dark: [172, 91, 35] },
  patients: { light: [221, 237, 232], dark: [18, 103, 98] },
  wait: { light: [232, 227, 239], dark: [91, 74, 111] },
};

const TRANSPLANT_SNAPSHOT = rawTransplantSnapshot as TransplantSnapshot;
const WAIT_TIME_PROVINCE = rawWaitTimeProvince as { periods: number[]; cells: WaitCell[] };
const WAIT_LIST_IDS = new Set(
  WAIT_TIME_PROVINCE.cells
    .filter((cell) => cell.status === 'observado' && cell.n > 0)
    .map((cell) => cell.list),
);

const PROVINCES: ProvinceDefinition[] = [
  { key: 'JUJUY', name: 'Jujuy' },
  { key: 'SALTA', name: 'Salta' },
  { key: 'FORMOSA', name: 'Formosa' },
  { key: 'MISIONES', name: 'Misiones' },
  { key: 'CATAMARCA', name: 'Catamarca' },
  { key: 'TUCUMAN', name: 'Tucumán' },
  { key: 'SANTIAGO DEL ESTERO', name: 'Santiago del Estero' },
  { key: 'CHACO', name: 'Chaco' },
  { key: 'CORRIENTES', name: 'Corrientes' },
  { key: 'LA RIOJA', name: 'La Rioja' },
  { key: 'CORDOBA', name: 'Córdoba' },
  { key: 'SANTA FE', name: 'Santa Fe' },
  { key: 'ENTRE RIOS', name: 'Entre Ríos' },
  { key: 'SAN JUAN', name: 'San Juan' },
  { key: 'SAN LUIS', name: 'San Luis' },
  { key: 'CAPITAL FEDERAL', name: 'Ciudad Autónoma de Buenos Aires' },
  { key: 'MENDOZA', name: 'Mendoza' },
  { key: 'LA PAMPA', name: 'La Pampa' },
  { key: 'BUENOS AIRES', name: 'Buenos Aires' },
  { key: 'NEUQUEN', name: 'Neuquén' },
  { key: 'RIO NEGRO', name: 'Río Negro' },
  { key: 'CHUBUT', name: 'Chubut' },
  { key: 'SANTA CRUZ', name: 'Santa Cruz' },
  { key: 'TIERRA DEL FUEGO', name: 'Tierra del Fuego' },
];

const MAP_WIDTH = 430;
const MAP_HEIGHT = 620;
const MAP_BOUNDS = { minLon: -74.2, maxLon: -52.1, minLat: -55.3, maxLat: -21.6 };
const TIERRA_DEL_FUEGO_BOUNDS = { minLon: -69.5, maxLon: -64.4, minLat: -55.3, maxLat: -52.3 };
const CABA_COORDINATES: GeoPosition = [-58.3816, -34.6037];

function provinceKey(value: string) {
  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .trim();

  if (normalized === 'CABA' || normalized === 'CIUDAD AUTONOMA DE BUENOS AIRES') {
    return 'CAPITAL FEDERAL';
  }

  if (normalized.startsWith('TIERRA DEL FUEGO')) {
    return 'TIERRA DEL FUEGO';
  }

  return normalized;
}

function projectPoint([longitude, latitude]: GeoPosition) {
  const x = ((longitude - MAP_BOUNDS.minLon) / (MAP_BOUNDS.maxLon - MAP_BOUNDS.minLon)) * MAP_WIDTH;
  const y = ((MAP_BOUNDS.maxLat - latitude) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)) * MAP_HEIGHT;
  return [x, y] as const;
}

function ringToPath(ring: GeoPosition[]) {
  return ring
    .map((point, index) => {
      const [x, y] = projectPoint(point);
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ') + ' Z';
}

function geometryToPath(feature: ProvinceFeature) {
  const polygons = feature.geometry.type === 'Polygon'
    ? [feature.geometry.coordinates as GeoPosition[][]]
    : feature.geometry.coordinates as GeoPosition[][][];
  const bounds = provinceKey(feature.properties.nombre) === 'TIERRA DEL FUEGO'
    ? TIERRA_DEL_FUEGO_BOUNDS
    : MAP_BOUNDS;

  return polygons
    .filter((polygon) => polygon.some((ring) => ring.some(([longitude, latitude]) => (
      longitude >= bounds.minLon && longitude <= bounds.maxLon
      && latitude >= bounds.minLat && latitude <= bounds.maxLat
    ))))
    .flatMap((polygon) => polygon.map((ring) => ringToPath(ring)))
    .join(' ');
}

function Bars({ items, compact = false }: { items: MarginDatum[]; compact?: boolean }) {
  const max = Math.max(...items.map((item) => item.value), 1);
  return (
    <div className={compact ? 'bars bars-compact' : 'bars'}>
      {items.map((item) => (
        <div className="bar-row" key={item.label}>
          <span className="bar-label">{item.label}</span>
          <span className="bar-track" aria-hidden="true">
            <span className="bar-fill" style={{ '--bar': `${(item.value / max) * 100}%` } as CssVars} />
          </span>
          <strong>{formatInteger(item.value)}</strong>
        </div>
      ))}
    </div>
  );
}

function waitBinLabel(label: string) {
  return label
    .replaceAll('~', '–')
    .replace('meses', ' meses')
    .replace('mes', ' mes')
    .replace('años', ' años')
    .replace('año', ' año')
    .replace(/\s+/g, ' ')
    .trim();
}

function WaitBinsChart({ items }: { items: MarginDatum[] }) {
  return <div className="wait-bins"><p>Cantidad de registros por antigüedad</p><Bars compact items={items.map(item => ({...item,label:waitBinLabel(item.label)}))} /></div>;
}

function MissingMetric({ children }: { children: string }) {
  return (
    <div className="territory-missing">
      <span aria-hidden="true">—</span>
      <p>{children}</p>
    </div>
  );
}

function listPeoplePhrase(list: ListSnapshot) {
  if (list.id === 'TOTAL') return 'registros en todas las listas';
  if (list.id === 'CORNEAS' || list.id === 'ESCLERAS') {
    return `personas en lista de ${list.label.toLocaleLowerCase('es-AR')}`;
  }
  return `personas en lista ${list.label.toLocaleLowerCase('es-AR')}`;
}

function hasWaitData(listId: string, year: number, age: string) {
  return WAIT_TIME_PROVINCE.cells.some((cell) => (
    cell.list === listId
    && cell.year === year
    && (age === 'all' || cell.age === age)
    && cell.status === 'observado'
    && cell.n > 0
  ));
}

function useProvinceShapes() {
  const [provinceShapes, setProvinceShapes] = useState<ProvinceFeature[]>([]);
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch('/geo/provincias.geojson')
      .then((response) => {
        if (!response.ok) throw new Error(`GeoJSON HTTP ${response.status}`);
        return response.json() as Promise<ProvinceFeatureCollection>;
      })
      .then((geojson) => {
        if (!cancelled && geojson.type === 'FeatureCollection' && geojson.features.length > 0) {
          setProvinceShapes(geojson.features);
        }
      })
      .catch(() => {
        if (!cancelled) setMapError(true);
      });

    return () => { cancelled = true; };
  }, []);

  return { provinceShapes, mapError };
}

function ProvinceMapSvg({
  provinceShapes,
  mapError,
  values,
  selectedKey,
  onSelect,
  metricLabel,
  formatMetric,
  palette = TERRITORY_PALETTES.patients,
  interactive = true,
}: {
  provinceShapes: ProvinceFeature[];
  mapError: boolean;
  values: Map<string, MarginDatum>;
  selectedKey: string | null;
  onSelect: (key: string | null) => void;
  metricLabel: string;
  formatMetric?: (datum: MarginDatum) => string;
  palette?: MapPalette;
  interactive?: boolean;
}) {
  const metricValues = Array.from(values.values())
    .map((item) => item.value)
    .filter((value) => Number.isFinite(value) && value >= 0);
  const minValue = metricValues.length ? Math.min(...metricValues) : 0;
  const maxValue = metricValues.length ? Math.max(...metricValues) : 0;
  const orderedShapes = [...provinceShapes].sort((left, right) => {
    const leftSelected = provinceKey(left.properties.nombre) === selectedKey ? 1 : 0;
    const rightSelected = provinceKey(right.properties.nombre) === selectedKey ? 1 : 0;
    return leftSelected - rightSelected;
  });
  const cabaDefinition = PROVINCES.find((province) => province.key === 'CAPITAL FEDERAL');
  const cabaDatum = values.get('CAPITAL FEDERAL');
  const cabaIntensity = cabaDatum && Number.isFinite(cabaDatum.value) && cabaDatum.value >= 0
    ? maxValue > minValue
      ? (cabaDatum.value - minValue) / (maxValue - minValue)
      : 1
    : 0;
  const cabaFill = cabaDatum && Number.isFinite(cabaDatum.value) && cabaDatum.value >= 0
    ? `rgb(${Math.round(palette.light[0] + (palette.dark[0] - palette.light[0]) * cabaIntensity)} ${Math.round(palette.light[1] + (palette.dark[1] - palette.light[1]) * cabaIntensity)} ${Math.round(palette.light[2] + (palette.dark[2] - palette.light[2]) * cabaIntensity)})`
    : undefined;
  const cabaDisplayedValue = cabaDatum
    ? (formatMetric ? formatMetric(cabaDatum) : formatInteger(cabaDatum.value))
    : '';
  const cabaLabel = `${cabaDefinition?.name ?? 'Ciudad Autónoma de Buenos Aires'}: ${cabaDatum ? `${cabaDisplayedValue} ${metricLabel}` : 'sin registro provincial publicado'}`;
  const [cabaX, cabaY] = projectPoint(CABA_COORDINATES);

  if (provinceShapes.length === 0) {
    return (
      <div className={`territory-map-loading${mapError ? ' is-error' : ''}`} role="status">
        {mapError ? 'No se pudo cargar la geometría provincial.' : 'Trazando el territorio…'}
      </div>
    );
  }

  return (
    <svg
      className={`territory-map${interactive ? '' : ' is-static'}`}
      viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
      role="group"
      aria-label="Mapa interactivo de las provincias argentinas"
      onClick={() => { if (interactive) onSelect(null); }}
    >
      <defs><pattern id="map-missing" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#eee9df"/><path d="M0 0L6 6" stroke="#a39e95" strokeWidth="1"/></pattern></defs>
      <rect
        className="territory-map-background"
        x="0"
        y="0"
        width={MAP_WIDTH}
        height={MAP_HEIGHT}
        aria-hidden="true"
        onClick={() => onSelect(null)}
      />
      {orderedShapes.map((feature) => {
        const key = provinceKey(feature.properties.nombre);
        const definition = PROVINCES.find((province) => province.key === key);
        if (!definition || key === 'CAPITAL FEDERAL') return null;

        const datum = values.get(key);
        const intensity = datum && Number.isFinite(datum.value) && datum.value >= 0
          ? maxValue > minValue
            ? (datum.value - minValue) / (maxValue - minValue)
            : 1
          : 0;
        const heatColor = datum && Number.isFinite(datum.value) && datum.value >= 0
          ? `rgb(${Math.round(palette.light[0] + (palette.dark[0] - palette.light[0]) * intensity)} ${Math.round(palette.light[1] + (palette.dark[1] - palette.light[1]) * intensity)} ${Math.round(palette.light[2] + (palette.dark[2] - palette.light[2]) * intensity)})`
          : undefined;
        const displayedValue = datum
          ? (formatMetric ? formatMetric(datum) : formatInteger(datum.value))
          : '';
        const label = `${definition.name}: ${datum ? `${displayedValue} ${metricLabel}` : 'sin registro provincial publicado'}`;

        return (
          <path
            key={feature.properties.id}
            d={geometryToPath(feature)}
            className={`province-shape province-${datum ? 'current' : 'missing'}`}
            style={{ '--map-density': intensity, '--map-fill': heatColor ?? 'url(#map-missing)' } as CssVars}
            role={interactive ? 'button' : 'presentation'}
            tabIndex={interactive ? 0 : -1}
            aria-label={label}
            aria-pressed={interactive ? selectedKey === key : undefined}
            onClick={(event) => {
              if (!interactive) return;
              event.stopPropagation();
              onSelect(key);
            }}
            onKeyDown={(event) => {
              if (!interactive) return;
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onSelect(key);
              }
            }}
            fillRule="evenodd"
          >
            <title>{label}</title>
          </path>
        );
      })}
      <g
        className={`map-caba-marker${selectedKey === 'CAPITAL FEDERAL' ? ' is-selected' : ''}`}
        role={interactive ? 'button' : 'presentation'}
        tabIndex={interactive ? 0 : -1}
        aria-label={cabaLabel}
        aria-pressed={interactive ? selectedKey === 'CAPITAL FEDERAL' : undefined}
        onClick={(event) => {
          if (!interactive) return;
          event.stopPropagation();
          onSelect('CAPITAL FEDERAL');
        }}
        onKeyDown={(event) => {
          if (!interactive) return;
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onSelect('CAPITAL FEDERAL');
          }
        }}
      >
        <rect className="map-caba-marker-hit" x={cabaX - 16} y={cabaY - 16} width="32" height="32" rx="8" />
        <circle className="map-caba-marker-halo" cx={cabaX} cy={cabaY} r="12" />
        <circle
          className={`map-caba-marker-point${cabaDatum ? '' : ' is-missing'}`}
          cx={cabaX}
          cy={cabaY}
          r="6"
          style={{ '--map-fill': cabaFill ?? '#eee9df' } as CssVars}
        />
        <title>{cabaLabel}</title>
      </g>
    </svg>
  );
}

type TerritoryDatum = MarginDatum & { recipients?: number };

const LIST_REPORT_URL = 'https://cresi.incucai.gov.ar/cresi/OpenDocument.do?accion=%2Fcresi_le.do%3FCLICK_AND_LIST_HABILITADO%3Dtrue';
const DONOR_REPORT_URL = 'https://cresi.incucai.gov.ar/cresi/OpenDocument.do?accion=%2Fcresi_donante.do%3FCLICK_AND_LIST_HABILITADO%3Dtrue';
const WAIT_REPORT_URLS: Record<string, string> = {
  RENAL: 'https://cresi.incucai.gov.ar/cresi/OpenDocument.do?accion=%2Fcresi_renal.do%3FCLICK_AND_LIST_HABILITADO%3Dtrue',
  RENOPANCREATICA: 'https://cresi.incucai.gov.ar/cresi/OpenDocument.do?accion=%2Fcresi_renal.do%3FCLICK_AND_LIST_HABILITADO%3Dtrue',
  HEPATICA: 'https://cresi.incucai.gov.ar/cresi/OpenDocument.do?accion=%2Fcresi_hepatico.do%3FCLICK_AND_LIST_HABILITADO%3Dtrue',
  HEPATORRENAL: 'https://cresi.incucai.gov.ar/cresi/OpenDocument.do?accion=%2Fcresi_hepatico.do%3FCLICK_AND_LIST_HABILITADO%3Dtrue',
  CARDIACA: 'https://cresi.incucai.gov.ar/cresi/OpenDocument.do?accion=%2Fcresi_intratoracico.do%3FCLICK_AND_LIST_HABILITADO%3Dtrue',
  PULMONAR: 'https://cresi.incucai.gov.ar/cresi/OpenDocument.do?accion=%2Fcresi_intratoracico.do%3FCLICK_AND_LIST_HABILITADO%3Dtrue',
  CORNEAS: 'https://cresi.incucai.gov.ar/cresi/OpenDocument.do?accion=%2Fcresi_corneas.do%3FCLICK_AND_LIST_HABILITADO%3Dtrue',
};

function TerritoryNarrative({
  data,
  selectedListId,
  selectedKey,
  activeFocus, onFocus, waitYear, onYear, waitAge, onAge,
  onSelectList,
  onSelectProvince,
}: {
  data: StoryData;
  selectedListId: string;
  selectedKey: string | null;
  activeFocus: TerritoryFocus; onFocus: (focus: TerritoryFocus) => void;
  waitYear: number; onYear: (year: number) => void; waitAge: string; onAge: (age: string) => void;
  onSelectList: (id: string) => void;
  onSelectProvince: (key: string | null) => void;
}) {
  const [profileLens, setProfileLens] = useState<ProfileLens>('sex');
  const [showMapInfo, setShowMapInfo] = useState(false);
  const { provinceShapes, mapError } = useProvinceShapes();
  const view = buildStoryView(data);
  const fallbackRenal: ListSnapshot = {
    id: 'RENAL', label: 'Renal', total: view.renal, province: data.currentSnapshot.renalProvince ?? [],
    age: data.currentSnapshot.renalAge, sex: data.currentSnapshot.renalSex, seniority: data.currentSnapshot.renalSeniority,
  };
  const allLists = data.currentSnapshot.byList?.length ? data.currentSnapshot.byList : [fallbackRenal];
  const selectedList = allLists.find((item) => item.id === selectedListId);
  const availableLists = allLists.filter((item) => (
    item.total > 0
    && (activeFocus !== 'wait' || (item.id !== 'TOTAL' && hasWaitData(item.id, waitYear, waitAge)))
  ));
  const activeList = selectedList ?? availableLists.find((item) => item.id === 'RENAL') ?? fallbackRenal;
  const lists = activeFocus === 'wait' && selectedList && !availableLists.some((item) => item.id === selectedList.id)
    ? [selectedList, ...availableLists]
    : availableLists;
  const selectedProvince = selectedKey ? PROVINCES.find((province) => province.key === selectedKey) ?? null : null;
  const totalList = allLists.find((item) => item.id === 'TOTAL');
  const populationDatum = selectedKey ? totalList?.province.find((item) => provinceKey(item.label) === selectedKey) : undefined;
  const derivedProvincePopulation = populationDatum?.pmh && populationDatum.pmh > 0
    ? Math.round((populationDatum.value / populationDatum.pmh) * 1_000_000)
    : undefined;
  const activePopulation = selectedKey ? derivedProvincePopulation : data.currentSnapshot.population;
  const donorSnapshot = data.donorSnapshot;
  const waitSummary = (province: string | null) => summarizeWait(WAIT_TIME_PROVINCE.cells, waitYear, activeList.id, province, waitAge);
  const nationalWait = waitSummary(null);
  const waitUnit = nationalWait.unit;
  const waitPeriod = waitYear === 2026 ? '01/01–29/08/2026 · parcial' : `01/01–31/12/${waitYear}`;
  const ageLabel = waitAge === 'menor_18' ? 'menores de 18 años' : '18 años o más';
  const allTransplants = TRANSPLANT_SNAPSHOT.byType.find((item) => item.id === 'TOTAL');
  const transplantBreakdown = TRANSPLANT_SNAPSHOT.byType
    .filter((item) => ['ORGANOS', 'COR', 'OTROS_TEJIDOS'].includes(item.id))
    .map((item) => ({ label: item.label, value: selectedKey ? item.province.find((province) => provinceKey(province.label) === selectedKey)?.value ?? 0 : item.total }))
    .filter((item) => item.value > 0);
  const displayedTransplants = selectedKey ? allTransplants?.province.find((item) => provinceKey(item.label) === selectedKey)?.value : allTransplants?.total;

  const patientByProvince = new Map(activeList.province.map((item) => [provinceKey(item.label), item]));
  const donorByProvince = new Map(donorSnapshot?.province.map((item) => [provinceKey(item.label), item]) ?? []);
  const selectedDonor = selectedKey ? donorByProvince.get(selectedKey) : undefined;
  const nationalOrganDonors = donorSnapshot?.province.reduce((sum, item) => sum + item.organDonors, 0) ?? 0;
  const nationalPopulation = data.currentSnapshot.population;
  const nationalOrganPmh = nationalPopulation && nationalPopulation > 0
    ? (nationalOrganDonors / nationalPopulation) * 1_000_000
    : Number.NaN;
  const displayedOrganDonors = selectedKey ? selectedDonor?.organDonors : nationalOrganDonors;
  const displayedOrganPmh = selectedKey ? selectedDonor?.organPmh : nationalOrganPmh;

  const patientItems: TerritoryDatum[] = activeList.province;
  const donorItems: TerritoryDatum[] = donorSnapshot?.province ?? [];
  const waitItems: TerritoryDatum[] = PROVINCES.flatMap(province => { const summary = waitSummary(province.key); return summary.average === null ? [] : [{ label: province.key, value: summary.average, recipients: summary.n }]; });
  const activeItems = activeFocus === 'patients' ? patientItems : activeFocus === 'donors' ? donorItems : waitItems;
  const mapValues = new Map<string, TerritoryDatum>(activeItems.flatMap((item) => {
    const value = activeFocus === 'wait' ? item.value : item.pmh;
    return Number.isFinite(value) ? [[provinceKey(item.label), { ...item, value: value as number }] as const] : [];
  }));
  const numericValues = Array.from(mapValues.values()).map((item) => item.value).filter(Number.isFinite);
  const mapMin = numericValues.length ? Math.min(...numericValues) : 0;
  const mapMax = numericValues.length ? Math.max(...numericValues) : 0;
  const mapMid = (mapMin + mapMax) / 2;
  const currentCoverage = PROVINCES.filter((province) => mapValues.has(province.key)).length;
  const focusStyle = {
    patients: { accent: '#126762', soft: '#dcece7' },
    donors: { accent: '#ac5b23', soft: '#f2e2c8' },
    wait: { accent: '#5b4a6f', soft: '#e6deec' },
  }[activeFocus];
  const mapMetricLabel = activeFocus === 'wait'
    ? `${waitUnit} promedio hasta el trasplante · ${activeList.label.toLocaleLowerCase('es-AR')}`
    : activeFocus === 'donors' ? 'donantes por millón de habitantes' : 'registros por millón de habitantes';
  const formatMapValue = (value: number) => formatDecimal(value);

  const provinceProfile = selectedKey
    ? (activeList.provinceProfiles as Record<string, ProvinceProfile> | undefined)?.[selectedKey]
    : undefined;
  const profileItems = selectedKey
    ? provinceProfile ? profileLens === 'age' ? provinceProfile.age : provinceProfile.sex : []
    : profileLens === 'age' ? activeList.age : activeList.sex;
  const seniority = selectedKey
    ? activeList.seniorityByProvince?.find((item) => provinceKey(item.province) === selectedKey)?.items ?? []
    : activeList.seniority;
  const seniorityTotal = seniority.reduce((sum, item) => sum + item.value, 0);
  const oneYearIndex = seniority.findIndex((item) => item.label.includes('1~2') || item.label.includes('1–2'));
  const atLeastOneYear = seniority.slice(oneYearIndex >= 0 ? oneYearIndex : seniority.length).reduce((sum, item) => sum + item.value, 0);
  const displayedWait = waitSummary(selectedKey);
  return (
    <section className="question-atlas" id="territorio" aria-labelledby="atlas-title" style={{ '--territory-accent': focusStyle.accent, '--territory-accent-soft': focusStyle.soft } as CssVars}>
      <header className="atlas-heading">
        <div>
          <p className="eyebrow">03 · La espera tiene un lugar</p>
          <h2 id="atlas-title">Un país.<br /><em>Muchas esperas.</em></h2>
          <p>De una cifra nacional a tu provincia. Elegí un territorio y mirá sus listas, sus tiempos y la donación.</p>
        </div>
      </header>

      <div className="atlas-filters">
        {activeFocus !== 'donors' && <label>Lista<select value={activeList.id} onChange={event => onSelectList(event.target.value)}>{lists.map(item => <option key={item.id} value={item.id} disabled={activeFocus === 'wait' && !hasWaitData(item.id, waitYear, waitAge)}>{item.label}{activeFocus === 'wait' && !hasWaitData(item.id, waitYear, waitAge) ? ' · sin datos en este período' : ''}</option>)}</select></label>}
        <label>Región<select value={selectedKey ?? ''} onChange={event => onSelectProvince(event.target.value || null)}><option value="">Argentina</option>{PROVINCES.map(province => <option key={province.key} value={province.key}>{province.name}</option>)}</select></label>
        {activeFocus === 'wait' && <><label>Período de trasplante<select value={waitYear} onChange={event => onYear(Number(event.target.value))}>{WAIT_TIME_PROVINCE.periods.map(year => <option key={year} value={year}>{year === 2026 ? '2026 · al 29/08 (parcial)' : `${year} · año completo`}</option>)}</select></label><fieldset className="atlas-age-filter"><legend>Edad de los receptores</legend><div role="group" aria-label="Edad de los receptores"><button type="button" aria-pressed={waitAge === 'menor_18'} onClick={() => onAge('menor_18')}>Menores de 18</button><button type="button" aria-pressed={waitAge === '18_mas'} onClick={() => onAge('18_mas')}>18 años o más</button></div></fieldset></>}
      </div>
      <div className="atlas-tabs" role="group" aria-label="Elegir pregunta para el atlas">
        <button type="button" aria-pressed={activeFocus === 'patients'} aria-controls="atlas-panel" onClick={() => onFocus('patients')}><span>01</span> Quiénes esperan</button>
        <button type="button" aria-pressed={activeFocus === 'wait'} aria-controls="atlas-panel" onClick={() => onFocus('wait')}><span>02</span> Cuánto esperaron</button>
        <button type="button" aria-pressed={activeFocus === 'donors'} aria-controls="atlas-panel" onClick={() => onFocus('donors')}><span>03</span> La donación</button>
      </div>

      <div className="atlas-layout" id="atlas-panel">
        <section className="atlas-map-panel" aria-labelledby="atlas-map-title">
          <div className="atlas-map-toolbar">
            <div><span id="atlas-map-title">{activeFocus === 'wait' ? `Promedio hasta el trasplante · ${waitUnit}` : activeFocus === 'patients' ? 'En lista por millón de habitantes' : 'Donantes por millón de habitantes'}</span><strong>{currentCoverage}/24 con registro</strong></div>
            {activeFocus !== 'wait' && <span className="map-fixed-metric">PMH</span>}
          </div>
          <ProvinceMapSvg provinceShapes={provinceShapes} mapError={mapError} values={mapValues} selectedKey={selectedKey} onSelect={onSelectProvince} metricLabel={mapMetricLabel} formatMetric={(datum) => formatMapValue(datum.value)} palette={TERRITORY_PALETTES[activeFocus]} interactive />
          <div className="numeric-map-scale" aria-label={`Escala numérica de ${mapMetricLabel}`}>
            <i aria-hidden="true" style={{ '--scale-light': `rgb(${TERRITORY_PALETTES[activeFocus].light.join(' ')})`, '--scale-dark': `rgb(${TERRITORY_PALETTES[activeFocus].dark.join(' ')})` } as CssVars} />
            <span>{numericValues.length ? formatMapValue(mapMin) : 's/d'}</span><span>{numericValues.length ? formatMapValue(mapMid) : 's/d'}</span><span>{numericValues.length ? formatMapValue(mapMax) : 's/d'}</span>
          </div>
          <p className="map-missing-key"><i aria-hidden="true" /> Tramado: sin promedio o dato disponible. Cero conserva el color de la escala.</p>
          <button type="button" className="territory-info-button" aria-expanded={showMapInfo} aria-controls="atlas-map-info" onClick={() => setShowMapInfo((visible) => !visible)}>Qué significa la métrica</button>
          {showMapInfo && <p className="territory-map-info" id="atlas-map-info">
            {activeFocus === 'wait'
              ? 'Promedio observado entre receptores efectivamente trasplantados. Cuando se reúnen grupos, se pondera por cantidad de receptores; no pronostica la espera de una persona.'
              : activeFocus === 'donors'
                ? 'La geografía corresponde a la provincia del establecimiento de origen del proceso, no al domicilio del donante.'
                : 'La geografía corresponde a provincia de residencia. PMH divide el conteo por la población provincial publicada por CRESI y multiplica por un millón.'}
          </p>}
        </section>

        <section className="atlas-evidence">
          {activeFocus === 'patients' && <>
            <h3>{selectedProvince?.name ?? 'Argentina'}</h3>
            {selectedKey && !patientByProvince.has(selectedKey)
              ? <MissingMetric>La tabla no publica esta combinación. No se reemplaza por Renal ni se interpreta como cero.</MissingMetric>
              : <div className="territory-primary-stat"><strong>{formatInteger(selectedKey ? patientByProvince.get(selectedKey)?.value ?? 0 : activeList.total)}</strong><span>{listPeoplePhrase(activeList)}</span><em>{formatDecimal(selectedKey ? patientByProvince.get(selectedKey)?.pmh ?? 0 : activeList.pmh ?? Number.NaN)} por millón</em><small>Provincia de residencia · {view.snapshotDate}</small></div>}
            <div className="territory-profile"><div className="territory-profile-heading"><div><span>Perfil publicado</span><strong>{profileLens === 'sex' ? 'Sexo' : 'Grupo etario'}</strong></div><div className="profile-switcher" role="group" aria-label="Perfil de pacientes"><button type="button" aria-pressed={profileLens === 'sex'} onClick={() => setProfileLens('sex')}>Sexo</button><button type="button" aria-pressed={profileLens === 'age'} onClick={() => setProfileLens('age')}>Edad</button></div></div>{profileItems.length ? <Bars compact items={profileItems} /> : <MissingMetric>CRESI no devolvió este perfil para la selección.</MissingMetric>}</div>
            <p className="territory-boundary">Una tasa alta de personas inscriptas no prueba por sí sola peor acceso: también intervienen prevalencia, detección, derivación e inscripción, dimensiones que este gráfico no separa.</p>
          </>}

          {activeFocus === 'wait' && <>
            <p className="territory-kicker">Dos relojes que no miden a las mismas personas</p>
            <div className="time-populations">
              <section className="time-population-completed"><span>B · La espera hasta un evento</span><h3>¿Cuánto esperaron hasta el trasplante?</h3><div className="time-path completed"><span>Inscripción</span><i aria-hidden="true" /><span>Trasplante ●</span></div><p>{activeList.label} · {selectedProvince?.name ?? 'Argentina (24 provincias)'} · {ageLabel} · trasplantados durante {waitPeriod}.</p>{displayedWait.average !== null ? <><strong>{formatDecimal(displayedWait.average)} {waitUnit}</strong><small>Promedio {displayedWait.rows.length > 1 ? 'ponderado por nosotros' : 'publicado por CRESI'} · {formatInteger(displayedWait.n)} receptores</small>{displayedWait.n < 10 && <p className="small-base">Base pequeña: menos de 10 receptores. Interpretá las diferencias con cautela.</p>}{displayedWait.median !== null && displayedWait.p25 !== null && displayedWait.p75 !== null ? <TimeSummary average={displayedWait.average} median={displayedWait.median} p25={displayedWait.p25} p75={displayedWait.p75} n={displayedWait.n} unit={waitUnit} /> : <p>Mediana y percentiles conjuntos: no disponibles. No se pueden obtener promediando percentiles de provincias o edades.</p>}</> : <MissingMetric>{displayedWait.status === 'sin_observaciones' ? 'El reporte no devuelve observaciones para esta combinación. No hay un tiempo que estimar; no equivale a cero días de espera.' : 'Este indicador no está disponible para esta combinación. Se conserva la selección.'}</MissingMetric>}<p>Describe a quienes fueron trasplantados. No estima cuánto les falta a quienes siguen en lista.</p></section>
              <section className="time-population-ongoing"><span>A · La espera sigue abierta</span><h3>¿Cuántas personas siguen esperando y desde cuándo?</h3><div className="time-path ongoing"><span>Inscripción</span><i aria-hidden="true" /><span>Hasta {view.snapshotDate}<small>datos capturados en esa fecha</small></span></div><p>{activeList.label} · {selectedProvince?.name ?? 'Argentina'} · todas las edades. Esta fotografía no cambia al elegir otro período o edad de trasplante.</p><strong>{seniorityTotal ? formatInteger(atLeastOneYear) : '—'}</strong><small>registros llevan un año o más · base total: {formatInteger(seniorityTotal)}</small>{seniority.length ? <WaitBinsChart items={seniority} /> : <MissingMetric>Este indicador no está disponible para esta combinación. Se conserva la lista y provincia.</MissingMetric>}</section>
            </div>
          </>}

          {activeFocus === 'donors' && donorSnapshot && <>
            <p className="territory-kicker">La donación hace posible el trasplante</p>
            <p>El número de donantes ayuda a entender las posibilidades de trasplante. No se traduce directamente en un tiempo de espera: también intervienen la compatibilidad y las reglas de asignación.</p>
            <h3>{selectedProvince?.name ?? 'Argentina'}</h3>
            {selectedKey && !donorByProvince.has(selectedKey) ? <MissingMetric>La captura no contiene un registro para esta provincia; no se supone cero.</MissingMetric> : <div className="territory-primary-stat"><strong>{formatInteger(selectedKey ? selectedDonor?.value ?? 0 : donorSnapshot.total)}</strong><span>donantes fallecidos: reales de órganos y donantes de tejidos</span><em>{formatDecimal(selectedKey ? selectedDonor?.pmh ?? 0 : donorSnapshot.pmh)} por millón</em><div className="donor-organ-stat"><span><b>{formatInteger(displayedOrganDonors ?? 0)}</b> donantes reales de órganos</span><em>{displayedOrganPmh !== undefined && Number.isFinite(displayedOrganPmh) ? formatDecimal(displayedOrganPmh) : 's/d'} por millón</em></div><small>No incluye donantes vivos · provincia del establecimiento de origen · {donorSnapshot.periodLabel}</small></div>}
            <div className="territory-transplant-stat"><span>Trasplantes de órganos y tejidos</span><strong>{displayedTransplants === undefined ? 's/d' : formatInteger(displayedTransplants)}</strong><small>{TRANSPLANT_SNAPSHOT.periodLabel} · por provincia de residencia del receptor</small><div className="transplant-organ-breakdown">{transplantBreakdown.map((item) => <span key={item.label}>{item.label}<b>{formatInteger(item.value)}</b></span>)}</div><p>Un proceso de donación puede posibilitar más de un trasplante.</p></div>
          </>}
        </section>
      </div>

      <DataMethod title="Datos y método · selección territorial" links={[
        {label:'Reporte oficial de listas',href:LIST_REPORT_URL},
        {label:activeFocus === 'wait' ? 'Reporte de trasplante seleccionado' : 'Reporte de donantes',href:activeFocus === 'wait' ? displayedWait.rows[0]?.reportUrl ?? 'https://cresi.incucai.gov.ar/' : DONOR_REPORT_URL},
        {label:'Descargar tiempos, consultas y fuentes (JSON)',href:'/datos/tiempos-y-fuentes.json'},
      ]} fields={[
        {label:'Fuente y consulta',value:activeFocus === 'wait' ? `CRESI/SINTRA. Consultas del recorte: ${[...new Set(displayedWait.rows.map(row=>row.consulted.split(' ')[0]))].join(', ') || 'sin captura aplicable'}. Fila TOTAL de Variables estadísticas del tiempo de espera hasta el trasplante.` : `CRESI/SINTRA. Listas: fotografía ${view.snapshotDate}; donantes: ${donorSnapshot?.periodLabel}. Reportes de listas de espera y donantes fallecidos.`},
        {label:'Universo y unidad',value:activeFocus === 'wait' ? `${activeList.label}; residencia ${selectedProvince?.name ?? '24 provincias argentinas'}; ${ageLabel}; ${waitPeriod}. ${waitUnit} desde inscripción efectiva hasta desclampeo. Se excluyen residencias extranjeras o no informadas del agregado provincial.` : 'Lista de espera: registros inscriptos por provincia de residencia. Donación: donantes por provincia del establecimiento de origen. Trasplantes: provincia de residencia del receptor. Son roles geográficos distintos. Los perfiles de edad y sexo son tablas separadas; no se cruzan entre sí.'},
        {label:'Publicado y calculado',value:activeFocus === 'wait' ? 'CRESI publica n, promedio, mediana y percentiles por celda. Nosotros calculamos sumatoria(n × promedio) / sumatoria(n) sólo con cobertura completa. El agregado puede diferir por redondeo. No combinamos cuantiles. Sin resultado explícito se conserva como sin observaciones; una captura ausente impide el agregado.' : activeFocus === 'donors' ? 'CRESI publica por provincia donantes reales de órganos, donantes de tejidos y sus tasas. Para Argentina sumamos las 24 provincias y calculamos la tasa de donantes de órganos con la población nacional publicada por CRESI. No incluye donación en vida.' : 'Conteos y PMH del mapa publicados por CRESI. Porcentajes, diferencias y longitudes de barras calculados para esta pieza. No interpretamos una tasa de inscripción como una medida directa de acceso.'},
        {label:'Denominador de PMH',value:`Por millón de habitantes. Población de referencia ${activePopulation ? formatInteger(activePopulation) : 'no disponible'}${selectedKey ? ', aproximada a partir de conteo/PMH publicados' : ', publicada por CRESI'}. Año base no explicitado; no se compara con un denominador externo.`},
      ]} />

    </section>
  );
}

export default function WaitingStory({ data }: { data: StoryData }) {
  const view = useMemo(() => buildStoryView(data), [data]);
  const [activeChapter, setActiveChapter] = useState('inicio');
  useEffect(() => {
    const chapters = ['inicio', 'magnitud', 'quienes', 'por-que-esperar', 'historia', 'territorio', 'asignacion', 'cierre'];
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) setActiveChapter(entry.target.id);
    }, { rootMargin: '-18% 0px -65% 0px' });
    chapters.forEach(id => { const section = document.getElementById(id); if (section) observer.observe(section); });
    return () => observer.disconnect();
  }, []);
  const [selection, setSelection] = useState({list:'RENAL',province:null as string|null,focus:'patients' as TerritoryFocus,year:2026,age:'18_mas'});
  useEffect(() => {
    const restore = () => {
      const query = new URLSearchParams(window.location.search);
      const requestedFocus = ['patients','wait','donors'].includes(query.get('vista') ?? '')
        ? query.get('vista') as TerritoryFocus
        : 'patients';
      const requestedList = data.currentSnapshot.byList?.some(item => item.id === query.get('lista'))
        ? query.get('lista')!
        : 'RENAL';
      setSelection({
        list: requestedFocus === 'wait' && !WAIT_LIST_IDS.has(requestedList) ? 'RENAL' : requestedList,
        province: PROVINCES.some(item=>item.key===query.get('provincia')) ? query.get('provincia') : null,
        focus: requestedFocus,
        year: WAIT_TIME_PROVINCE.periods.includes(Number(query.get('periodo'))) ? Number(query.get('periodo')) : 2026,
        age: ['menor_18','18_mas'].includes(query.get('edad') ?? '') ? query.get('edad')! : '18_mas',
      });
    };
    restore(); window.addEventListener('popstate',restore); return () => window.removeEventListener('popstate',restore);
  }, [data]);
  const changeSelection = (patch: Partial<typeof selection>) => {
    const next={...selection,...patch}; setSelection(next);
    const url=new URL(window.location.href); url.searchParams.set('lista',next.list); url.searchParams.set('vista',next.focus); url.searchParams.set('periodo',String(next.year)); url.searchParams.set('edad',next.age);
    if(next.province) url.searchParams.set('provincia',next.province); else url.searchParams.delete('provincia');
    window.history.pushState(null,'',url);
  };
  const selectedListId=selection.list, selectedProvince=selection.province;
  const setSelectedListId=(list:string)=>changeSelection({list});
  const setSelectedProvince=(province:string|null)=>changeSelection({province});
  const setTerritoryFocus=(focus: TerritoryFocus) => changeSelection({
    focus,
    ...(focus === 'wait' && !WAIT_LIST_IDS.has(selection.list) ? { list: 'RENAL' } : {}),
  });
  const exploreTerritory = () => { document.getElementById('territorio')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' }); };
  const reference=historyData.find(row=>row.year===2025)!;

  return (
    <main className="waiting-story">
      <a className="skip-link" href="#territorio">Saltar al explorador</a>
      <header className="story-header">
        <a className="wordmark" href="#inicio" aria-label="Volver al inicio">
          LA <span>ESPERA</span>
        </a>
        <nav aria-label="Secciones de la narrativa">
          <a href="#quienes" aria-current={activeChapter === 'quienes' ? 'location' : undefined}><span>01</span> Listas</a>
          <a href="#historia" aria-current={activeChapter === 'historia' ? 'location' : undefined}><span>02</span> Años</a>
          <a href="#territorio" aria-current={activeChapter === 'territorio' ? 'location' : undefined}><span>03</span> País</a>
          <a href="#asignacion" aria-current={activeChapter === 'asignacion' ? 'location' : undefined}><span>04</span> Encuentro</a>
          <a href="#cierre" aria-current={activeChapter === 'cierre' ? 'location' : undefined}><span>05</span> Posibilidad</a>
        </nav>
      </header>

      <section className="cover" id="inicio" aria-labelledby="cover-title">
        <div className="cover-copy">
          <p className="eyebrow">La Espera · Argentina</p>
          <h1 id="cover-title">¿Cuánto tarda una segunda oportunidad?</h1>
          <p className="cover-deck">Un recorrido interactivo por las listas de espera y donación de órganos en Argentina.</p>
        </div>
        <nav className="cover-atlas" aria-label="Atlas de preguntas">
          <span className="cover-atlas-center"><strong>{formatInteger(view.total)}</strong></span>
          <a href="#quienes"><small>01</small><strong>¿Qué esperan?</strong></a>
          <a href="#territorio"><small>02</small><strong>¿Dónde?</strong></a>
          <a href="#territorio" onClick={()=>changeSelection({focus:'wait'})}><small>03</small><strong>¿Cuánto?</strong></a>
          <a href="#asignacion"><small>04</small><strong>¿Cómo?</strong></a>
        </nav>
      </section>

      <section className="opening" id="magnitud" aria-labelledby="opening-title">
        <div className="opening-copy">
          <p className="opening-number">{formatInteger(view.total)}</p>
          <h2 id="opening-title">personas en listas de espera de órganos y tejidos</h2>
        </div>
      </section>

      <WaitingComposition data={data} selectedListId={selectedListId} onSelectList={setSelectedListId} onExploreTerritory={exploreTerritory} />

      <section className="story-question" id="por-que-esperar" aria-labelledby="why-wait-title">
        <p className="eyebrow">Entre la espera y la posibilidad</p>
        <h2 id="why-wait-title">Mientras alguien espera,<br /><em>una donación puede abrir una posibilidad.</em></h2>
        <div className="waiting-process" aria-label="La espera y la donación se encuentran mediante la compatibilidad y las prioridades de asignación">
          <div className="process-inputs"><div><i aria-hidden="true" /><span>Personas en lista</span><strong>La espera sigue</strong></div><div><i aria-hidden="true" /><span>Donación</span><strong>Un órgano disponible</strong></div></div>
          <svg className="process-merge" viewBox="0 0 140 180" aria-hidden="true"><path d="M0 42H35C85 42 55 90 100 90H140M0 138H35C85 138 55 90 100 90" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
          <div className="process-match"><span>El encuentro</span><strong>Compatibilidad<br />+ prioridades</strong><a href="#asignacion">Cómo se asigna <span aria-hidden="true">↗</span></a></div>
          <span className="process-arrow" aria-hidden="true">→</span>
          <div className="process-outcome"><span>La posibilidad</span><strong>Un trasplante</strong></div>
        </div>
        <p>La donación hace posible el trasplante. La compatibilidad y las reglas de asignación intervienen en cada encuentro. El tiempo corre, pero no es una cuenta regresiva.</p>
      </section>

      <HistoricalSeries />

      <TerritoryNarrative activeFocus={selection.focus} onFocus={setTerritoryFocus} waitYear={selection.year} onYear={year=>changeSelection({year})} waitAge={selection.age} onAge={age=>changeSelection({age})} data={data} selectedListId={selectedListId} selectedKey={selectedProvince} onSelectList={setSelectedListId} onSelectProvince={setSelectedProvince} />
      <AllocationExplainer />

      <section className="evidence-closing" id="cierre" aria-label="Entender la espera">
        <header className="closing-message"><p className="eyebrow">05 · La posibilidad</p><h2>La espera se vive de a uno.<br /><em>La esperanza se construye entre todos.</em></h2><p>Detrás de cada cifra, una vida que sigue. En cada donación, la posibilidad de un encuentro.</p></header>
        <div className="closing-findings"><article><span>01 · Personas</span><h3>Muchas esperas.</h3><p>Una lista, un territorio y una historia distinta. La antigüedad en lista y el tiempo hasta el trasplante describen poblaciones diferentes.</p></article><article><span>02 · Tiempo</span><h3>Sin fecha prometida.</h3><p>En renal nacional 2025: {formatDecimal(reference.median)} meses de mediana y {formatDecimal(reference.average)} de promedio. Describen trasplantes que ocurrieron, no una espera individual futura.</p></article><article><span>03 · Donación</span><h3>Una posibilidad real.</h3><p>La donación permite que haya órganos disponibles. La compatibilidad y las prioridades definen cada proceso de asignación.</p></article></div>
        <aside className="donation-action">
          <div><p className="eyebrow">Una decisión personal, un canal oficial</p><h3>Manifestá tu voluntad de donar</h3><p>En Argentina, rige el régimen de donante presunto para personas capaces mayores de 18 años: puede realizarse la extracción después del fallecimiento salvo que haya dejado constancia expresa de su oposición. También podés registrar de forma expresa una voluntad afirmativa o negativa.</p><small>La visualización no contiene formularios ni solicita datos personales.</small></div>
          <a href="https://www.argentina.gob.ar/manifestar-la-voluntad-hacia-la-donacion-de-organos-y-tejidos" target="_blank" rel="noreferrer">Ir al trámite oficial <span aria-hidden="true">↗</span></a>
        </aside>
        <DataMethod
          title="Datos y métodos"
          links={[
            { label: 'CRESI/SINTRA', href: 'https://cresi.incucai.gov.ar/' },
            { label: 'Reporte oficial de listas de espera', href: LIST_REPORT_URL },
            { label: 'Reporte oficial de donantes', href: DONOR_REPORT_URL },
            { label: 'Reporte oficial renal', href: WAIT_REPORT_URLS.RENAL },
            { label: 'Criterios oficiales de distribución renal', href: 'https://www.argentina.gob.ar/salud/incucai/pacientes/distribucion-renal' },
          ]}
          fields={[
            { label: 'Consulta', value: 'Datos consultados en SINTRA al día 28/08/2026. Los reportes de tiempos y trasplantes tienen cortes propios indicados en cada panel.' },
            { label: 'Universo y unidad', value: 'La fotografía inicial cuenta inscripciones activas publicadas por tipo de lista de órgano o tejido. Una misma persona puede integrar más de una lista; por eso la unidad es el registro publicado por lista y no una persona deduplicada entre listas.' },
            { label: 'Tratamiento de los datos', value: 'Se preservaron los originales publicados por SINTRA. Los porcentajes, diferencias y promedios ponderados se calculan para esta visualización y se identifican en cada panel. Se recopilaron múltiples tablas agregadas con distintos cruces y se conservaron como tablas separadas; no se reconstruyeron microdatos ni cruces ausentes.' },
            { label: 'Territorio', value: 'Lista de espera: provincia de residencia. Trasplantes: provincia de residencia del receptor. PMH es el valor publicado o el conteo dividido por la población de referencia publicada, multiplicado por un millón.' },
            { label: 'Tiempos', value: 'La antigüedad de quienes siguen esperando describe el stock activo. El tiempo hasta el trasplante describe sólo receptores trasplantados, desde la inscripción efectiva hasta el desclampeo. Los promedios provinciales 2026 combinan dos grupos etarios ponderando por receptores; medianas y percentiles no se recombinan.' },
            { label: 'Donación y trasplantes', value: 'La captura de donantes corresponde a donantes fallecidos reales de órganos y donantes de tejidos; no incluye donantes vivos. El reporte de trasplantes admite todos los tipos de donante. Un proceso de donación puede posibilitar más de un trasplante.' },
            { label: 'Asignación', value: 'La explicación de asignación resume los conceptos de compatibilidad y prioridad a partir del ejemplo renal. Las reglas son específicas por órgano; no se simulan puntajes ni puestos individuales.' },
            { label: 'Historia', value: 'Series nacionales 2005–2025. La espera renal es mediana entre receptores trasplantados; la franja es P25–P75. Cada año describe a receptores diferentes; no se sigue a una misma cohorte.' },
          ]}
        />
      </section>

      <footer className="story-footer">
        <div>
          <strong>Fuente</strong>
          <span>CRESI/SINTRA · datos públicos agregados</span>
        </div>
        <div>
          <strong>Corte de la fotografía</strong>
          <span>{view.snapshotDate}</span>
        </div>
      </footer>
    </main>
  );
}
