import { provinceShapes } from './province-shapes.generated';
import { packGroups, type Cluster, type Dot, type Group, type Dimension, type TerritoryMetric } from './universe-model';
import { provinceKey, inProvince, inRing } from './territory-cartogram';

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
export type NarrativeLayout = { clusters: Cluster[]; points: Dot[]; borders?: ProvinceBorder[]; islands?: {path:string;x:number;y:number;group:string;fill:string} };
export function containsProvince(label: string, x: number, y: number) {
  const shape = provinceShapes.find(p => provinceKey(p.label) === provinceKey(label));
  return shape ? inProvince(x,y,shape.polygons) : false;
}
export function borderPath(rings: number[][][]) {
  return rings.map(ring => ring.map((p,i) => `${i ? 'L' : 'M'}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ') + 'Z').join(' ');
}
// Hand-drawn editorial tiles: no geographic coordinates or IGN boundaries.
const editorialTiles: Record<string, number[][]> = {
  JUJUY:[[4,0],[5.4,.3],[5.7,1.8],[4.2,2.2],[3.8,1]],
  SALTA:[[3.8,1],[4.2,2.2],[5.7,1.8],[5.4,.3],[6.4,.6],[7.1,2.2],[7,4],[4,4],[3.2,2.8]],
  FORMOSA:[[7.1,2.2],[9.8,2.7],[10.3,3.6],[9,4.5],[7,4]],
  CHACO:[[7,4],[9,4.5],[8.8,6.3],[6.4,6],[6.4,4]],
  MISIONES:[[10.4,3.4],[11.4,2.8],[11.8,3.4],[11,5.8],[10.4,6.5],[10,5.3]],
  CORRIENTES:[[9,4.5],[10,5.3],[10.4,6.5],[9.5,8.3],[8.7,7.9],[8.8,6.3]],
  CATAMARCA:[[3.2,2.8],[4,4],[4.5,5.5],[5,8.2],[4.1,7.7],[3,8],[2.4,6.2]],
  TUCUMAN:[[4,4],[5.2,4],[5.1,5.5],[4.5,5.5]],
  'SANTIAGO DEL ESTERO':[[5.2,4],[6.4,4],[6.4,6],[6.7,8.2],[5,8.2],[4.5,5.5],[5.1,5.5]],
  'LA RIOJA':[[3,8],[4.1,7.7],[4.5,8.9],[4.3,10.5],[2.5,10.5],[2.5,9]],
  'SAN JUAN':[[2.5,10.5],[4.3,10.5],[4,12.1],[2.2,12.2],[2.1,11]],
  MENDOZA:[[2.2,12.2],[4,12.1],[4.1,14.5],[3.7,16],[2.3,16],[1.9,14]],
  'SAN LUIS':[[4.3,10.5],[5.2,10.5],[5.3,14.5],[4.1,14.5],[4,12.1]],
  CORDOBA:[[4.1,7.7],[5,8.2],[6.7,8.2],[6.4,12.7],[5.3,14.5],[5.2,10.5],[4.3,10.5],[4.5,8.9]],
  'SANTA FE':[[6.4,6],[8.8,6.3],[8.7,7.9],[7.5,10.4],[7.3,13],[6.4,12.7],[6.7,8.2]],
  'ENTRE RIOS':[[8.7,7.9],[9.5,8.3],[9.1,11],[8.3,13.5],[7.3,13],[7.5,10.4]],
  'BUENOS AIRES':[[7.3,13],[8.3,13.5],[9.3,14.2],[9.4,15.6],[8.2,17.6],[6.4,18],[6,16],[6.4,12.7]],
  CABA:[[10.5,13.8],[11,13.5],[11.6,14],[11.1,14.6],[10.5,14.4]],
  'LA PAMPA':[[5.3,14.5],[6.4,12.7],[6,16],[6.4,18],[4.1,18],[3.7,16],[4.1,14.5]],
  NEUQUEN:[[2.3,16],[3.7,16],[4.1,18],[3.3,19],[1.9,18.3],[1.8,17]],
  'RIO NEGRO':[[3.3,19],[4.1,18],[6.4,18],[6.8,19.3],[5.8,20.1],[2,20],[1.9,18.3]],
  CHUBUT:[[2,20],[5.8,20.1],[6,21.8],[5.2,22.4],[2,22.4],[1.7,21.4]],
  'SANTA CRUZ':[[2,22.4],[5.2,22.4],[5,23.7],[4.3,25],[2.8,25.5],[1.5,24.4]],
  'TIERRA DEL FUEGO':[[3.6,26],[4.7,26.5],[5.8,26.5],[5,27],[4,26.9]],
};
function provinceLayout(groups: Group[], width: number, height: number, focus: boolean, radius: number, _metric: TerritoryMetric, _contextGroups: Group[]): NarrativeLayout {
  const clusters: Cluster[] = [], points: Dot[] = [], borders: ProvinceBorder[] = [];
  const mainScale=Math.min(width*.78/12,height*.87/27);
  for(const group of groups){
    const ring=editorialTiles[provinceKey(group.label)]??[[11,.2],[11.7,.2],[11.7,.9],[11,.9]];
    const minX=Math.min(...ring.map(p=>p[0])),maxX=Math.max(...ring.map(p=>p[0]));
    const minY=Math.min(...ring.map(p=>p[1])),maxY=Math.max(...ring.map(p=>p[1]));
    const cx=(minX+maxX)/2,cy=(minY+maxY)/2;
    const scale=focus?Math.min(width*.65/(maxX-minX),height*.72/(maxY-minY)):mainScale;
    const project=(x:number,y:number):number[]=>focus?[width*.5+(x-cx)*scale,height*.47+(y-cy)*scale]:[width*.5+(x-6)*scale,height*.04+y*scale];
    const center=project(cx,cy),rings=[ring.map(p=>project(p[0],p[1]))];
    const path=borderPath(rings);
    borders.push({id:group.id,path,rings,fill:group.color,fillOpacity:.88});
    clusters.push({...group,x:center[0],y:center[1],radius:Math.max(16,(maxX-minX)*scale/2)});
    let produced=0;
    for(let i=1;produced<group.value;i++){
      const x=minX+((i*.754877666)%1)*(maxX-minX),y=minY+((i*.569840296)%1)*(maxY-minY);
      if(!inRing(x,y,ring))continue;
      const position=project(x,y);
      points.push({x:position[0],y:position[1],group:group.id,color:'#32131a',radius:Math.min(radius,.8)});produced++;
    }
  }
  // Part of Tierra del Fuego's graphic territory, without duplicating its units.
  const fuegian=groups.find(g=>provinceKey(g.label)==='TIERRA DEL FUEGO');
  const islands=focus||!fuegian?undefined:{group:fuegian.id,fill:fuegian.color,path:borderPath([
    [[9,23.1],[9.5,22.7],[9.8,23.2],[9.6,23.7],[9.1,23.8],[9.3,23.4]],
    [[10,22.8],[10.6,23],[10.8,23.4],[10.3,23.8],[9.9,23.5],[10.2,23.2]],
  ].map(ring=>ring.map(([x,y])=>[width*.5+(x-6)*mainScale,height*.04+y*mainScale]))),x:width*.5+3.9*mainScale,y:height*.04+24.5*mainScale};
  return {clusters,points,borders,islands};
}

export function narrativeLayout(groups: Group[], dimension: Dimension, width: number, height: number, focus: boolean, radius: number, metric: TerritoryMetric = 'count', contextGroups: Group[] = groups): NarrativeLayout {
  if (dimension === 'organ') {
    const clusters = packGroups(groups, width, height - 55, width < 450 ? (height >= 400 ? 50 : 32) : 42).map(c => ({ ...c, y: c.y + 5 }));
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
