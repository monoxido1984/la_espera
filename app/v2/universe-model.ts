import type { StoryData, TransplantSnapshot } from '../story-model';

export type Group = { id: string; label: string; value: number; color: string };
export type HistoryYear = { year: number; waitlist: number; donors: number; median: number; average: number; p25: number; p75: number; n: number };
export type ListDetail = { id: string; label: string; total: number; province: { label: string; value: number }[]; seniority: { label: string; value: number }[] };
export type UniverseData = {
  total: number; snapshot: string; organs: Group[]; lists: ListDetail[];
  history: HistoryYear[]; organDonors: number; allDonors: number; donorPeriod: string;
  organTransplants: number; allTransplants: number; transplantPeriod: string; transplantGroups: Group[];
};
export type Dimension = 'organ' | 'seniority' | 'territory';
export type UniverseMode = 'intro' | 'number' | 'all' | Dimension | 'history' | 'duration' | 'donation' | 'transplants' | 'end';
export type Dot = { x: number; y: number; color: string; group: string; radius: number };
export type Cluster = Group & { x: number; y: number; radius: number };

// Categories remain the published lists: combined-organ lists are not split.
const COLORS: Record<string, string> = {
  RENAL: '#b74d38', CORNEAS: '#617f87', HEPATICA: '#7d865f',
  PULMONAR: '#9b7859', RENOPANCREATICA: '#8d594d', CARDIACA: '#82738d',
};
const COLOR_OTHER = '#77796f';
const PROVINCE_LABELS: Record<string, string> = { 'CAPITAL FEDERAL': 'Ciudad de Buenos Aires', CORDOBA: 'Córdoba', TUCUMAN: 'Tucumán', NEUQUEN: 'Neuquén', 'RIO NEGRO': 'Río Negro', 'ENTRE RIOS': 'Entre Ríos' };
export const integer = (value: number) => new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(value);
export const decimal = (value: number) => new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1, minimumFractionDigits: 1 }).format(value);

export function buildUniverseData(data: StoryData, history: HistoryYear[], transplants: TransplantSnapshot): UniverseData {
  const lists = (data.currentSnapshot.byList ?? []).map(({ id, label, total, province, seniority }) => ({ id, label, total, province: province.map(({ label, value }) => ({ label, value })), seniority }));
  const organs = data.currentWaiting.map(item => {
    const id = lists.find(list => list.label === item.label)?.id ?? item.label;
    return { ...item, id, color: COLORS[id] ?? COLOR_OTHER };
  }).sort((a, b) => b.value - a.value);
  const total = organs.reduce((sum, item) => sum + item.value, 0);
  if (total !== data.facts.current.total) throw new Error('La composición no coincide con el total publicado.');
  const donor = data.donorSnapshot;
  if (!donor) throw new Error('Falta la fotografía de donación.');
  const organIds = ['RN', 'H', 'C', 'RP', 'PUL', 'HR', 'PAN', 'CRR'];
  const colorIds: Record<string, string> = { RN: 'RENAL', H: 'HEPATICA', C: 'CARDIACA', RP: 'RENOPANCREATICA', PUL: 'PULMONAR' };
  const transplantGroups = transplants.byType.filter(item => organIds.includes(item.id)).map(item => ({ id: item.id, label: item.label, value: item.total, color: COLORS[colorIds[item.id]] ?? COLOR_OTHER }));
  if (transplantGroups.reduce((sum, item) => sum + item.value, 0) !== transplants.organTotal) throw new Error('Los tipos de trasplante no cubren el total de órganos.');
  return {
    total, snapshot: data.currentSnapshot.snapshotDate ?? data.facts.current.fechaConsulta,
    organs, lists, history: history.map(({ year, waitlist, donors, median, average, p25, p75, n }) => ({ year, waitlist, donors, median, average, p25, p75, n })),
    organDonors: donor.province.reduce((sum, item) => sum + item.organDonors, 0), allDonors: donor.total, donorPeriod: donor.periodLabel,
    organTransplants: transplants.organTotal, allTransplants: transplants.total, transplantPeriod: transplants.periodLabel, transplantGroups,
  };
}

function readableLabel(label: string) {
  if (label === 'SIN DISTRIBUCIÓN PUBLICADA') return 'Sin distribución publicada';
  return label.replaceAll('~', '–').replace(/(\d)(mes|año)/g, '$1 $2').replace('<1mes', '<1 mes').replace('>10años', '>10 años');
}

export function groupsFor(data: UniverseData, dimension: Dimension, listId: string | null): Group[] {
  if (dimension === 'organ') return data.organs;
  const list = data.lists.find(item => item.id === (listId ?? 'TOTAL'));
  if (!list) return [];
  const color = data.organs.find(item => item.id === listId)?.color ?? '#b74d38';
  const rows = dimension === 'seniority' ? list.seniority : list.province;
  return rows.map((row, index) => ({ id: `${dimension}-${index}`, label: dimension === 'seniority' ? readableLabel(row.label) : PROVINCE_LABELS[row.label] ?? row.label.toLocaleLowerCase('es-AR').replace(/(^|\s)\S/g, letter => letter.toLocaleUpperCase('es-AR')), value: row.value, color }));
}

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

// Every dot is one published unit, never a sampled or inferred individual.
export function discPoints(count: number, cx: number, cy: number, radius: number, group: string, color: string, dotRadius: number): Dot[] {
  return Array.from({ length: count }, (_, index) => {
    const distance = radius * Math.sqrt((index + .5) / Math.max(1, count));
    const angle = index * GOLDEN_ANGLE;
    return { x: cx + Math.cos(angle) * distance, y: cy + Math.sin(angle) * distance, color, group, radius: dotRadius };
  });
}

// Equal area per unit across every cluster in one view. Empty groups have no dots.
export function packGroups(groups: Group[], width: number, height: number): Cluster[] {
  const total = groups.reduce((sum, item) => sum + item.value, 0);
  if (!total) return [];
  const padding = width < 450 ? 12 : 18;
  for (const scale of [.38, .34, .30, .26, .22, .18, .14]) {
    const placed: Cluster[] = [];
    let complete = true;
    for (const group of [...groups].sort((a, b) => b.value - a.value)) {
      if (!group.value) continue;
      const radius = Math.sqrt(group.value / total) * Math.min(width, height) * scale;
      let found = false;
      for (let step = 0; step < 6000; step++) {
        const distance = Math.sqrt(step) * Math.min(width, height) / 130;
        const angle = step * GOLDEN_ANGLE;
        const x = width / 2 + Math.cos(angle) * distance;
        const y = height / 2 + Math.sin(angle) * distance;
        if (x - radius < 10 || x + radius > width - 10 || y - radius < 14 || y + radius > height - 14) continue;
        if (placed.some(other => Math.hypot(x - other.x, y - other.y) < radius + other.radius + padding)) continue;
        placed.push({ ...group, x, y, radius }); found = true; break;
      }
      if (!found) { complete = false; break; }
    }
    if (complete) return placed;
  }
  throw new Error('No se pudo distribuir el universo en el espacio disponible.');
}

export function clusterPoints(clusters: Cluster[], dotRadius: number): Dot[] {
  return clusters.flatMap(group => discPoints(group.value, group.x, group.y, group.radius, group.id, group.color, dotRadius));
}

