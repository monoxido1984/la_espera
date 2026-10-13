import { provinceShapes } from './province-shapes.generated';
import { discPoints, packGroups, type Cluster, type Dot, type Group, type Dimension, type TerritoryMetric } from './universe-model';
import { cartogramWarp, provinceKey, inProvince } from './territory-cartogram';

// Graphic silhouettes only: these positions are never patient locations or linked records.
function insideOrgan(id: string, x: number, y: number): boolean {
  const combined: Record<string, [string, string]> = { RENOPANCREATICA: ['RENAL', 'PANCREATICA'], HEPATORENAL: ['HEPATICA', 'RENAL'], CARDIORENAL: ['CARDIACA', 'RENAL'], CARDIOPULMONAR: ['CARDIACA', 'PULMONAR'], HEPATOINTESTINAL: ['HEPATICA', 'INTESTINAL'] };
  if (combined[id]) return insideOrgan(combined[id][0], x * 2 + .9, y * 1.2) || insideOrgan(combined[id][1], x * 2 - .9, y * 1.2);
  if (id === 'INTESTINAL') return Math.abs(x) < .83 && Math.abs(y) < .9 && Math.abs(x - .62 * Math.sin(y * 11)) < .19;
  if (id.includes('RENAL') || id.includes('RENOPANCREATICA')) {
    const body = (x / .72) ** 2 + (y / .96) ** 2 < 1;
    return body && !((x - .65) ** 2 + (y + .02) ** 2 < .38 ** 2);
  }
  if (id.includes('CORNE') || id.includes('ESCL')) return Math.abs(y) < .55 * Math.sin(Math.PI * (x + 1) / 2);
  if (id.includes('HEPAT')) return x > -.95 && x < .95 && y > -.65 + .12 * x && y < .55 - .45 * x && (x / 1.05) ** 2 + (y / .85) ** 2 < 1;
  if (id.includes('PULMON')) return Math.abs(x) > .09 && ((Math.abs(x) - .47) / .43) ** 2 + ((y - .1) / .85) ** 2 < 1;
  if (id.includes('CARD')) return (x * x + y * y - .58) ** 3 - x * x * (-y) ** 3 < 0;
  if (id.includes('PANCRE')) return (x / .96) ** 2 + ((y + .2 * x) / .32) ** 2 < 1;
  return Math.abs(x) + Math.abs(y) < .95;
}

export function organPoints(cluster: Cluster, radius: number): Dot[] {
  const points: Dot[] = [];
  for (let i = 0; points.length < cluster.value; i++) {
    const x = ((i * .754877666) % 1) * 2 - 1;
    const y = ((i * .569840296) % 1) * 2 - 1;
    if (insideOrgan(cluster.id, x, y)) points.push({ x: cluster.x + x * cluster.radius, y: cluster.y + y * cluster.radius,
      radius, color: cluster.color, group: cluster.id });
  }
  return points;
}

function age(label: string) {
  if (label.includes('Sin distribución')) return 999;
  const n = Number(label.match(/\d+/)?.[0] ?? 0);
  return label.includes('año') ? n * 12 : n;
}

export type ProvinceBorder = { id: string; path: string; rings: number[][][]; fill: string; fillOpacity: number; inset?: { x: number; y: number; anchorX: number; anchorY: number } };
export type NarrativeLayout = { clusters: Cluster[]; points: Dot[]; borders?: ProvinceBorder[] };
export function containsProvince(label: string, x: number, y: number) {
  const shape = provinceShapes.find(p => provinceKey(p.label) === provinceKey(label));
  return shape ? inProvince(x,y,shape.polygons) : false;
}
export function borderPath(rings: number[][][]) {
  return rings.map(ring => ring.map((p,i) => `${i ? 'L' : 'M'}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ') + 'Z').join(' ');
}
function provinceLayout(groups: Group[], width: number, height: number, focus: boolean, radius: number, metric: TerritoryMetric, contextGroups: Group[]): NarrativeLayout {
  const clusters: Cluster[] = [], points: Dot[] = [], borders: ProvinceBorder[] = [];
  const warp = cartogramWarp(contextGroups, metric);
  const mainScale = Math.min(width * .84 / (21 * .78), height * .88 / 35);
  const mainProject = (x: number, y: number) => [width / 2 + (x - 21 * .78 / 2) * mainScale, height * .06 + y * mainScale];
  for (const group of groups) {
    const shape = provinceShapes.find(p => provinceKey(p.label) === provinceKey(group.label));
    if (!shape) {
      const cluster = { ...group, x: width * .88, y: height * .1, radius: 12 };
      clusters.push(cluster); points.push(...discPoints(group.value, cluster.x, cluster.y, 12, group.id, group.color, radius)); continue;
    }
    const coordinates = shape.polygons.flatMap(p => p[0]);
    const minX = Math.min(...coordinates.map(p => p[0])), maxX = Math.max(...coordinates.map(p => p[0]));
    const minY = Math.min(...coordinates.map(p => p[1])), maxY = Math.max(...coordinates.map(p => p[1]));
    const transformed = coordinates.map(p => warp(p[0],p[1]));
    const left = Math.min(...transformed.map(p => p[0])), right = Math.max(...transformed.map(p => p[0]));
    const top = Math.min(...transformed.map(p => p[1])), bottom = Math.max(...transformed.map(p => p[1]));
    const cx = (left + right) / 2, cy = (top + bottom) / 2;
    const inset = !focus && shape.id === '02';
    const scale = focus || inset ? Math.min((focus ? width * .7 : width * .09) / (right-left), (focus ? height * .78 : height * .09) / (bottom-top)) : mainScale;
    const project = focus || inset ? (x: number, y: number) => [(inset ? width * .83 : width / 2)+(x-cx)*scale, (inset ? height * .47 : height / 2)+(y-cy)*scale] : mainProject;
    const center = project(cx,cy);
    const rings = shape.polygons.flatMap(p => p.map(ring => ring.flatMap((vertex, i) => {
      const next = ring[(i+1)%ring.length];
      const steps = Math.max(1, Math.ceil(Math.hypot(next[0]-vertex[0],next[1]-vertex[1])/.25));
      return Array.from({length:steps},(_,j) => project(...warp(vertex[0]+(next[0]-vertex[0])*j/steps,vertex[1]+(next[1]-vertex[1])*j/steps) as [number,number]));
    })));
    const path = borderPath(rings);
    const area = rings.reduce((sum,ring) => sum + Math.abs(ring.reduce((a,p,i) => {
      const next=ring[(i+1)%ring.length]; return a+p[0]*next[1]-next[0]*p[1];
    },0))/2,0);
    // Keep point coverage modest in rate mode, so the PMH fill remains readable.
    const pointRadius = metric === 'pmh' ? Math.min(radius,.6,Math.sqrt(area*.11/(Math.PI*Math.max(1,group.value)))) : Math.min(radius,.85);
    const anchor = mainProject(cx,cy);
    borders.push({ id: group.id, path, rings, fill:group.color, fillOpacity:metric === 'pmh' ? .88 : 0, ...(inset ? { inset: { x:center[0],y:center[1],anchorX:anchor[0],anchorY:anchor[1] } } : {}) });
    clusters.push({ ...group, x:center[0], y:center[1], radius: Math.max(16, (right-left)*scale/2) });
    let produced = 0;
    for (let i = 1; produced < group.value; i++) {
      if (i > Math.max(10000, group.value * 500)) throw new Error(`No se pudo muestrear la provincia ${group.label}`);
      const x = minX + ((i*.754877666) % 1) * (maxX-minX);
      const y = minY + ((i*.569840296) % 1) * (maxY-minY);
      if (!inProvince(x,y,shape.polygons)) continue;
      const warped = warp(x,y), position = project(warped[0],warped[1]);
      points.push({ x:position[0],y:position[1],group:group.id,color:metric === 'pmh' ? '#f2efe7' : group.color,radius:pointRadius }); produced++;
    }
  }
  return { clusters,points,borders };
}

export function narrativeLayout(groups: Group[], dimension: Dimension, width: number, height: number, focus: boolean, radius: number, metric: TerritoryMetric = 'count', contextGroups: Group[] = groups): NarrativeLayout {
  if (dimension === 'organ') {
    const clusters = packGroups(groups, width, height - 55, width < 450 ? 32 : 42).map(c => ({ ...c, y: c.y + 5 }));
    return { clusters, points: clusters.flatMap(c => organPoints(c, radius)) };
  }
  if (dimension === 'territory') return provinceLayout(groups, width, height, focus, radius, metric, contextGroups);
  const ordered = [...groups].filter(g => g.value > 0).sort((a, b) => age(a.label) - age(b.label));
  const max = Math.max(...ordered.map(g => g.value), 1);
  const rowHeight = Math.min(50, height * .8 / Math.max(1, ordered.length));
  const clusters = ordered.map((g, i) => ({ ...g, x: width * .5, y: height * .1 + (i + .5) * rowHeight, radius: rowHeight * .45 }));
  const points = clusters.flatMap(c => {
    const barWidth = width * .64 * c.value / max;
    const columns = Math.max(1, Math.ceil(barWidth / (radius * 2.7)));
    return Array.from({ length: c.value }, (_, i) => ({ x: width * .30 + (i % columns + .5) / columns * barWidth,
      y: c.y + (Math.floor(i / columns) / Math.ceil(c.value / columns) - .5) * rowHeight * .58,
      color: c.color, radius: Math.min(radius, .9), group: c.id }));
  });
  return { clusters, points };
}

// Two chambers and a pile share the exact same units as the number scene.
export function hourglassPoints(count: number, width: number, height: number, phase: number, radius: number): Dot[] {
  const cx = width * .72, cy = height * .48, scale = Math.min(width * .3, height * .4);
  const fallen = Math.min(count, Math.floor(count * phase));
  return Array.from({ length: count }, (_, i) => {
    const u = (i * .754877666) % 1, v = (i * .569840296) % 1;
    const lower = i < fallen;
    const pileHeight = .72 * Math.sqrt(Math.min(1, phase));
    const y = lower ? .86 - pileHeight + Math.sqrt(v) * pileHeight : -.88 + v * .77 * (1 - phase);
    const half = lower ? Math.max(.005, (y - (.86 - pileHeight)) * .78) : Math.max(.035, -y * .78);
    const fall = phase - i / count;
    const moving = lower && fall < .06;
    return { x: cx + (u * 2 - 1) * (moving ? .018 : half) * scale, y: cy + (moving ? y * fall / .06 : y) * scale, color: '#b74d38', group: 'total', radius };
  });
}

// A continuous line folds back on itself: time can be unfolded without a ring.
// Folds are graphic, not bins of patients or individual treatment schedules.
export function foldedTimePoints(count: number,width: number,height: number,extent: number,radius: number,folds=5): Dot[] {
  const spacing=height*.44/folds, bend=Math.min(spacing/2,width*.08);
  const dotRadius=Math.min(radius,Math.sqrt(width*height*.055/Math.max(1,count))*.52);
  return Array.from({length:count},(_,i)=>{
    const t=(i+.5)/Math.max(1,count)*Math.max(0,Math.min(1,extent))*folds;
    const row=Math.min(folds-1,Math.floor(t)), local=t-row, direction=row%2?-1:1;
    const start=direction>0?width*.12:width*.84, end=direction>0?width*.84:width*.12;
    const center=height*.36+row*spacing;
    const turn=Math.max(0,(local-.86)/.14)*Math.PI;
    const jitter=(((i*.6180339887)%1)-.5)*Math.min(height*.038,spacing*.32);
    const x=local<.86?start+(end-start)*local/.86:end+direction*Math.sin(turn)*bend;
    const y=local<.86?center:center+(1-Math.cos(turn))*spacing/2;
    return {x,y:y+jitter,radius:dotRadius,color:'#b74d38',group:'total'};
  });
}
export function timePoints(count: number, width: number, height: number, accumulated: boolean, ratio: number, radius: number, folds=3): Dot[] {
  return foldedTimePoints(count,width,height,ratio,radius,accumulated?Math.min(12,folds*2):folds);
}
