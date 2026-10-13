import { provinceShapes } from './province-shapes.generated';
import { territoryValue, type Group, type TerritoryMetric } from './universe-model';

export const provinceKey = (label: string) => {
  const key = label.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  return key === 'CAPITAL FEDERAL' || key.includes('CIUDAD') && key.includes('BUENOS AIRES') ? 'CABA' : key;
};
export function inRing(x: number, y: number, ring: number[][]) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i], b = ring[j];
    if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;
  }
  return inside;
}
export const inProvince = (x: number, y: number, polygons: number[][][][]) =>
  polygons.some(p => inRing(x, y, p[0]) && !p.slice(1).some(hole => inRing(x, y, hole)));

// A shared monotone warp keeps provincial adjacency and the north-south reading.
// Area is a restrained editorial deformation, not an exact proportional scale.
// The same transform is applied to contours and points; no location is individual.
const NX = 72, NY = 120, MAP_WIDTH = 21 * .78, MAP_HEIGHT = 35;
let geography: { cells: Int16Array; areas: number[] } | undefined;
function geographicGrid() {
  if (geography) return geography;
  const cells = new Int16Array(NX * NY).fill(-1);
  const areas = provinceShapes.map(() => 0);
  for (let y = 0; y < NY; y++) for (let x = 0; x < NX; x++) {
    const lon = -74 + (x + .5) / NX * 21, lat = -21 - (y + .5) / NY * MAP_HEIGHT;
    const index = provinceShapes.findIndex(shape => inProvince(lon, lat, shape.polygons));
    cells[y * NX + x] = index;
    if (index >= 0) areas[index]++;
  }
  geography = { cells, areas };
  return geography;
}
type Warp = (lon: number, lat: number) => number[];
const cache = new Map<string, Warp>();
export function cartogramWarp(groups: Group[], metric: TerritoryMetric): Warp {
  const key = metric + groups.map(g => `${provinceKey(g.label)}:${territoryValue(g, metric) ?? 'missing'}`).join('|');
  const cached = cache.get(key);
  if (cached) return cached;
  const { cells, areas } = geographicGrid();
  const weights = provinceShapes.map(shape => {
    const group = groups.find(g => provinceKey(g.label) === provinceKey(shape.label));
    return group ? territoryValue(group, metric) : undefined;
  });
  const validWeight = weights.reduce<number>((sum, weight, i) => sum + (areas[i] && weight !== undefined ? weight : 0), 0);
  const land = areas.reduce((sum, value) => sum + value, 0);
  let density = Float64Array.from(cells, index => {
    if (index < 0 || weights[index] === undefined || !validWeight) return 1;
    return .18 + .82 * weights[index]! / validWeight * land / Math.max(1, areas[index]);
  });
  // Low-pass diffusion removes literal coastline details and sharp row kinks.
  for (let pass = 0; pass < 8; pass++) {
    const next = new Float64Array(density.length);
    for (let y = 0; y < NY; y++) for (let x = 0; x < NX; x++) {
      const i = y * NX + x;
      next[i] = (density[i] * 4 + density[y * NX + Math.max(0, x - 1)] + density[y * NX + Math.min(NX - 1, x + 1)] + density[Math.max(0, y - 1) * NX + x] + density[Math.min(NY - 1, y + 1) * NX + x]) / 8;
    }
    density = next;
  }
  const rows = new Float64Array(NY), vertical = new Float64Array(NY + 1);
  const horizontal = new Float64Array(NY * (NX + 1));
  for (let y = 0; y < NY; y++) {
    for (let x = 0; x < NX; x++) rows[y] += density[y * NX + x];
    for (let x = 0; x < NX; x++) horizontal[y * (NX + 1) + x + 1] = horizontal[y * (NX + 1) + x] + density[y * NX + x] / rows[y];
    vertical[y + 1] = vertical[y] + rows[y];
  }
  const mass = vertical[NY];
  for (let y = 0; y <= NY; y++) vertical[y] /= mass;
  const strength = metric === 'count' ? .88 : .56;
  const warp: Warp = (lon, lat) => {
    const u = Math.max(0, Math.min(1, (lon + 74) / 21));
    const v = Math.max(0, Math.min(1, (-lat - 21) / MAP_HEIGHT));
    const gx = Math.min(NX - 1, Math.floor(u * NX)), fx = u * NX - gx;
    const gy = Math.min(NY - 1, Math.floor(v * NY));
    const rowY = Math.max(0, Math.min(NY - 1, v * NY - .5)), y0 = Math.floor(rowY), y1 = Math.min(NY - 1, y0 + 1), fy = rowY - y0;
    const at = (y: number) => horizontal[y * (NX + 1) + gx] * (1 - fx) + horizontal[y * (NX + 1) + gx + 1] * fx;
    const dx = at(y0) * (1 - fy) + at(y1) * fy;
    const dy = vertical[gy] + (vertical[gy + 1] - vertical[gy]) * (v * NY - gy);
    return [(u + (dx - u) * strength) * MAP_WIDTH, (v + (dy - v) * strength) * MAP_HEIGHT];
  };
  if (cache.size > 30) cache.clear();
  cache.set(key, warp);
  return warp;
}
