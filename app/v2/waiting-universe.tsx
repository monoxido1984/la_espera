'use client';

import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import type { PointRelay } from './temporal-journey';
import { discPoints, integer, decimal, type Cluster, type Dot, type Group, type UniverseMode, type Dimension, type TerritoryMetric } from './universe-model';
import { hourglassPoints, narrativeLayout, timePoints, foldedTimePoints, borderPath, type NarrativeLayout, type ProvinceBorder } from './narrative-layouts';
import { identifyDots, alignGraphicUnits } from './linked-exploration';
import type {SandHandoff} from './sand-queue';
import {crowdOrder} from './crowd-release-model';

type Particle = Dot & { alpha: number };
function mixColor(from: string, to: string, amount: number) {
  return '#' + [1,3,5].map(offset => {
    const a = parseInt(from.slice(offset,offset+2),16), b = parseInt(to.slice(offset,offset+2),16);
    return Math.round(a+(b-a)*amount).toString(16).padStart(2,'0');
  }).join('');
}
type Props = {
  mode: UniverseMode; groups: Group[]; count: number; total: number;
  focus: string | null; hover: string | null; paused: boolean; dark: boolean;
  population: string; label: string; unit: string;
  relay?: MutableRefObject<PointRelay>;
  entry?: MutableRefObject<SandHandoff|null>;
  accumulated?: boolean; timeRatio?: number; timeFolds?: number; historyRatio?: number; territoryMetric?: TerritoryMetric; territoryContext?: Group[];
  onHover: (id: string | null) => void; onSelect: (id: string) => void;
};

export function numberPoints(count: number, width: number, height: number, radius: number, glyph?:string): Dot[] {
  const scratch = document.createElement('canvas');
  scratch.width = Math.ceil(width); scratch.height = Math.ceil(height);
  const context = scratch.getContext('2d', { willReadFrequently: true });
  if (!context) return discPoints(count, width / 2, height / 2, width * .38, 'total', '#b74d38', radius);
  context.font = `600 ${glyph?Math.min(width*.34,height*.45):Math.min(width * .275, height * .62)}px Arial, sans-serif`;
  context.textAlign = 'center'; context.textBaseline = 'middle';
  if(glyph){const lines=glyph.split('\n');lines.forEach((line,i)=>context.fillText(line,width/2,height*(.27+i*.43),width*.97));}
  else context.fillText(integer(count), width / 2, height / 2, width * .97);
  const pixels = context.getImageData(0, 0, scratch.width, scratch.height).data;
  const candidates: { x: number; y: number }[] = [];
  for (let y = 0; y < scratch.height; y += 2) {
    const row: {x:number;y:number}[]=[];
    for (let x = 0; x < scratch.width; x += 2) if (pixels[(y * scratch.width + x) * 4 + 3] > 140) row.push({x,y});
    if(Math.floor(y/2)%2)row.reverse();candidates.push(...row);
  }
  if (!candidates.length) return [];
  return Array.from({ length: count }, (_, index) => {
    const point = candidates[Math.min(candidates.length-1,Math.floor(index/count*candidates.length))];
    return { x: point.x + Math.sin(index * 7.3) * .35, y: point.y + Math.cos(index * 3.7) * .35, radius, color: '#b74d38', group: 'total' };
  });
}

export default function WaitingUniverse({ mode, groups, count, total, focus, hover, paused, dark, population, label, unit, accumulated = false, timeRatio = 1, timeFolds=3, historyRatio=1, territoryMetric = 'count', territoryContext, relay, entry, onHover, onSelect }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const previousPopulation = useRef(population);
  const boundaries = useRef<SVGSVGElement>(null);
  const previousBorders = useRef<ProvinceBorder[]>([]);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [failed, setFailed] = useState(false);
  const interactive = ['organ', 'seniority', 'territory'].includes(mode);

  useEffect(() => {
    if (!container.current) return;
    const observer = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setSize(old => Math.abs(old.width - width) + Math.abs(old.height - height) > 2 ? { width, height } : old);
    });
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);

  const layout = useMemo<NarrativeLayout>(() => {
    const { width, height } = size;
    if (!width || !height) return { points: [] as Dot[], clusters: [] as Cluster[] };
    const base = Math.min(width, height);
    const dotRadius = Math.max(.6, Math.min(1.5, base / 380));
    const color = dark ? '#efbb87' : '#b74d38';
    if (interactive) {
      const visible = focus ? groups.filter(group => group.id === focus) : groups;
      // Small groups are still exact and independently selectable.
      const radius = Math.min(3,Math.max(.45,Math.min(dotRadius,base/420))*Math.max(1,Math.sqrt(900/Math.max(1,count))));
      const result = narrativeLayout(visible, mode as Dimension, width, height, Boolean(focus), radius, territoryMetric, territoryContext ?? groups);
      return {...result,points:identifyDots(result.points,visible)};
    }
    if (mode === 'number') return { points: numberPoints(count, width, height, dotRadius * .82), clusters: [] };
    if (mode === 'intro') return { points: hourglassPoints(count, width, height, paused ? .65 : 0, dotRadius * .7), clusters: [] };
    if (mode === 'comparison') return { points: timePoints(count, width, height, accumulated, timeRatio, dotRadius,timeFolds), clusters: [] };
    if (mode === 'history' || mode === 'duration') {
      const points=foldedTimePoints(count,width,height,mode==='history'?historyRatio:1,dotRadius,mode==='history'?5:3);
      return { points, clusters: [] };
    }
    const radius = base * .4 * Math.sqrt(count / Math.max(total, count));
    return { points: discPoints(count, width / 2, height / 2, radius, 'total', color, dotRadius), clusters: [] };
  }, [size, interactive, groups, focus, count, total, mode, dark, paused, accumulated, timeRatio, timeFolds, historyRatio, territoryMetric, territoryContext]);

  useEffect(() => {
    const element = canvas.current;
    if (!element || !size.width) return;
    const context = element.getContext('2d');
    if (!context) { setFailed(true); return; }
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    element.width = Math.round(size.width * pixelRatio); element.height = Math.round(size.height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    if (!layout.points.length) { context.clearRect(0, 0, size.width, size.height); particles.current = []; return; }
    const target = layout.points;
    const crossfade = previousPopulation.current !== population;
    previousPopulation.current = population;
    const arrival=mode==='organ'&&population==='waiting'&&!particles.current.length?entry?.current:null;
    const rect=element.getBoundingClientRect();
    if(arrival&&entry)entry.current=null;
    let wide=Boolean(arrival);
    if(wide){
      element.width=Math.round(innerWidth*pixelRatio);element.height=Math.round(innerHeight*pixelRatio);
      Object.assign(element.style,{position:'fixed',left:'0px',top:'0px',width:'100vw',height:'100vh'});
      context.setTransform(pixelRatio,0,0,pixelRatio,rect.left*pixelRatio,rect.top*pixelRatio);
    }
    const previous:Particle[]=arrival?arrival.points.map(p=>({...p,x:p.x+arrival.left-rect.left,y:p.y+arrival.top-rect.top,alpha:1})):particles.current;
    const arrivalOrder=arrival?crowdOrder(target.length):[];
    const pairs = arrival?target.map((to,i)=>({from:previous[arrivalOrder[i]%previous.length],to})):alignGraphicUnits(previous,target);
    const length = pairs.length;
    const sand=mode==='number'?hourglassPoints(count,size.width,size.height,.15,Math.max(.45,Math.min(size.width,size.height)/550)):[];
    const starts = pairs.map((pair,index) => pair.from ?? { ...(sand[index] ?? pair.to ?? target[0]), alpha: mode==='number'?1:0 });
    const borderStarts = previousBorders.current;
    const borderElements = Array.from(boundaries.current?.querySelectorAll<SVGPathElement>('[data-border-id]') ?? []);
    const leaderElements = Array.from(boundaries.current?.querySelectorAll<SVGPathElement>('[data-leader-id]') ?? []);
    let end = pairs.map((pair, index) => {
      const point = pair.to;
      return point ? { ...point, alpha: hover && point.group !== hover ? .08 : 1 } : { ...starts[index], alpha: 0 };
    });
    let frame = 0;
    const started = performance.now();
    const duration = paused ? 0 : arrival?950:mode==='number'?4200:crossfade ? 1000 : hover ? 200 : 1350;
    const draw = (now: number) => {
      const flowing = mode === 'intro' && !paused && now - started < 13000;
      if (mode === 'intro' && !paused) end = hourglassPoints(count, size.width, size.height, Math.min(1.08, (now - started) / 12000), Math.max(.45, Math.min(size.width, size.height) / 550)).map(p => ({ ...p, alpha: 1 }));
      const progress = duration ? Math.min(1, (now - started) / duration) : 1;
      const eased = 1 - (1 - progress) ** 3;
      const animatedBorders = (layout.borders ?? []).map(border => {
        const from = borderStarts.find(b => b.id === border.id);
        if (!from || from.rings.length !== border.rings.length) return border;
        const rings = border.rings.map((ring, r) => ring.map((point, i) => {
          const start = from.rings[r][i] ?? point;
          return [start[0] + (point[0]-start[0])*eased, start[1] + (point[1]-start[1])*eased];
        }));
        const inset = border.inset && from.inset ? Object.fromEntries(Object.entries(border.inset).map(([key,value]) => [key, from.inset![key as keyof typeof from.inset] + (value-from.inset![key as keyof typeof from.inset])*eased])) as ProvinceBorder['inset'] : border.inset;
        return { ...border, rings, path:borderPath(rings), inset, fill:mixColor(from.fill,border.fill,eased), fillOpacity:from.fillOpacity+(border.fillOpacity-from.fillOpacity)*eased };
      });
      for (const element of borderElements) {
        const border = animatedBorders.find(b => b.id === element.dataset.borderId);
        if (border) element.setAttribute('d',border.path);
      }
      for (const element of leaderElements) {
        const inset = animatedBorders.find(b => b.id === element.dataset.leaderId)?.inset;
        if (inset) element.setAttribute('d',`M${inset.anchorX},${inset.anchorY} L${inset.x},${inset.y}`);
      }
      previousBorders.current = animatedBorders;
      context.clearRect(wide?-rect.left:0,wide?-rect.top:0,wide?innerWidth:size.width,wide?innerHeight:size.height);
      // A province-wide rate fill avoids confusing denser point populations with PMH.
      for (const border of animatedBorders) {
        if (border.fillOpacity <= 0) continue;
        context.globalAlpha = border.fillOpacity * (hover && hover !== border.id ? .18 : 1);
        context.fillStyle = border.fill;
        context.fill(new Path2D(border.path),'evenodd');
      }
      if (mode === 'intro' || mode==='number'&&progress<.5) {
        const cx = size.width * .72, cy = size.height * .48, s = Math.min(size.width * .3, size.height * .4);
        context.strokeStyle = '#b74d38'; context.globalAlpha = .3*(mode==='number'?1-progress*2:1); context.lineWidth = 1.5;
        context.beginPath(); context.moveTo(cx - s * .75, cy - s); context.lineTo(cx + s * .75, cy - s);
        context.moveTo(cx - s * .7, cy - s * .92); context.bezierCurveTo(cx - s * .6, cy - s * .35, cx - s * .04, cy - s * .12, cx - s * .04, cy);
        context.bezierCurveTo(cx - s * .04, cy + s * .12, cx - s * .6, cy + s * .35, cx - s * .7, cy + s * .92);
        context.moveTo(cx + s * .7, cy - s * .92); context.bezierCurveTo(cx + s * .6, cy - s * .35, cx + s * .04, cy - s * .12, cx + s * .04, cy);
        context.bezierCurveTo(cx + s * .04, cy + s * .12, cx + s * .6, cy + s * .35, cx + s * .7, cy + s * .92);
        context.moveTo(cx - s * .75, cy + s); context.lineTo(cx + s * .75, cy + s); context.stroke();
      }
      const buckets = new Map<string, { color: string; alpha: number; dots: Particle[] }>();
      const colors = new Map<string, string>();
      const current: Particle[] = [];
      for (let index = 0; index < length; index++) {
        const from = starts[index], to = end[index];
        // Different populations dissolve and reappear: there is no patient-level linkage.
        const jump = crossfade && progress < 1;
        const before = progress < .45;
        const point = jump ? {
          ...(before ? from : to),
          alpha: before ? from.alpha * (1 - progress / .45) : to.alpha * ((progress - .45) / .55),
        } : {
          ...to, x: from.x + (to.x - from.x) * eased, y: from.y + (to.y - from.y) * eased,
          radius: from.radius + (to.radius - from.radius) * eased, alpha: from.alpha + (to.alpha - from.alpha) * eased,
        };
        if(arrival){
          const delay=((Math.imul(index+1,1664525)>>>0)%997)/997*.18;
          const t=paused?1:Math.max(0,Math.min(1,(progress-delay)/(1-delay))),u=1-t;
          const bend=((index* .61803398875)%1-.5)*Math.min(size.width,size.height)*.16;
          point.x=u*u*from.x+2*u*t*((from.x+to.x)/2+bend)+t*t*to.x;
          point.y=u*u*from.y+2*u*t*((from.y+to.y)/2-bend*.6)+t*t*to.y;
          point.alpha=1;
        }
        if(mode==='number'&&!paused&&progress<1) {
          // Stagger the queue: chamber -> neck -> falling grain -> its place in the numeral.
          // These are the same graphic slots, not patient identities.
          const local=Math.max(0,Math.min(1,((now-started)-index/length*1200)/3000));
          const neck={x:size.width*.72,y:size.height*.48};
          const floor={x:neck.x+Math.sin(index*2.4)*size.width*.055,y:size.height*.8};
          const waypoints=from.y<neck.y?[from,neck,floor,to]:[from,{x:from.x,y:Math.max(from.y,floor.y)},floor,to];
          const leg=Math.min(2,Math.floor(local*3)),u=local*3-leg;
          const a=waypoints[leg],b=waypoints[leg+1],smooth=u*u*(3-2*u);
          point.x=a.x+(b.x-a.x)*smooth;point.y=a.y+(b.y-a.y)*smooth;point.alpha=1;
        }
        if (!jump && from.color !== to.color && progress < 1) {
          const pair = from.color + to.color;
          if (!colors.has(pair)) colors.set(pair, mixColor(from.color,to.color,eased));
          point.color = colors.get(pair)!;
        }
        current.push(point);
        const opacity = Math.round(Math.max(0, point.alpha) * 12) / 12;
        if (opacity <= 0) continue;
        const key = point.color + '/' + opacity;
        if (!buckets.has(key)) buckets.set(key, { color: point.color, alpha: opacity, dots: [] });
        buckets.get(key)!.dots.push(point);
      }
      for (const bucket of buckets.values()) {
        // PMH is encoded by the province fill alone, without absolute-count density.
        if(mode==='territory'&&territoryMetric==='pmh')continue;
        context.fillStyle = bucket.color; context.globalAlpha = bucket.alpha; context.beginPath();
        for (const point of bucket.dots) {
          if(mode==='territory'){
            // Two graphic marks per published inscription; never doubled data.
            const offset=point.radius*1.1;
            for(const direction of [-1,1]){const x=point.x+direction*offset;context.moveTo(x+point.radius*.68,point.y);context.arc(x,point.y,point.radius*.68,0,Math.PI*2);}
          }else{context.moveTo(point.x + point.radius, point.y); context.arc(point.x, point.y, point.radius, 0, Math.PI * 2);}
        }
        context.fill();
      }
      context.globalAlpha = 1;
      particles.current = progress === 1 ? current.slice(0, target.length) : current;
      element.dataset.transition=arrival?'numeral-to-lists':'layout';element.dataset.transitionProgress=progress.toFixed(3);
      if(wide&&progress===1){
        wide=false;element.removeAttribute('style');element.width=Math.round(size.width*pixelRatio);element.height=Math.round(size.height*pixelRatio);
        context.setTransform(pixelRatio,0,0,pixelRatio,0,0);draw(now);return;
      }
      if(mode==='number'&&relay&&current.length){const anchor=current.at(-1)!;relay.current={x:anchor.x/size.width,y:anchor.y/size.height};}
      if (progress < 1 || flowing) frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => {cancelAnimationFrame(frame);element.removeAttribute('style');};
  }, [layout, size, hover, paused, population, mode, relay, entry, territoryMetric]);

  return (
    <div ref={container} className="v2-universe" data-mode={mode}>
      <canvas ref={canvas} aria-hidden="true" />
      <p className="v2-sr-only">{label}</p>
      {failed && <p className="v2-canvas-fallback">{integer(count)}<span>{unit}</span></p>}
      {mode === 'territory' && <div className="v2-clusters v2-province-map" role="group" aria-label="Explorar provincias">
        <svg ref={boundaries} viewBox={`0 0 ${size.width || 1} ${size.height || 1}`} className="v2-province-boundaries">
          {layout.islands&&<g className="v2-map-islands" aria-hidden="true" style={{fill:layout.islands.fill,fillOpacity:.88,opacity:hover && hover!==layout.islands.group ? .18 : 1}}><path d={layout.islands.path}/></g>}
          {(layout.borders ?? []).map(border => {
            const group = layout.clusters.find(c => c.id === border.id)!;
            return <g key={border.id}>
              {border.inset && <path data-leader-id={border.id} className="v2-province-leader" d={`M${border.inset.anchorX},${border.inset.anchorY} L${border.inset.x},${border.inset.y}`} />}
              <path data-border-id={border.id} d={border.path} className="v2-province-gap" />
              <path data-border-id={border.id} d={border.path} className="v2-province-outline" fillRule="evenodd" role="button" tabIndex={0} aria-label={`${group.label}: ${group.missing?'resultado no publicado para este cruce':integer(group.value)+' inscripciones; '+(group.pmh === undefined ? 'PMH no disponible para este cruce' : decimal(group.pmh) + ' por millón de habitantes')}. Explorar sus tiempos.${border.inset ? ' Vista ampliada de la ciudad.' : ''}`} aria-pressed={focus === group.id} data-highlighted={hover === group.id || focus === group.id}
                onPointerEnter={() => onHover(group.id)} onPointerLeave={() => onHover(null)} onFocus={() => onHover(group.id)} onBlur={() => onHover(null)} onClick={() => onSelect(group.id)} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(group.id); } }} />
            </g>;
          })}
        </svg>
        {layout.clusters.map(group => <div key={group.id} className="v2-province-tooltip" aria-hidden="true" style={{left:group.x,top:group.y,opacity:hover === group.id || focus === group.id ? 1 : 0}}><span>{group.label}</span><strong>{group.missing?'s/d':territoryMetric === 'pmh' ? group.pmh === undefined ? 's/d' : decimal(group.pmh) : integer(group.value)}</strong><span>{group.missing?'no publicado':territoryMetric === 'pmh' ? 'por millón de habitantes' : 'inscripciones'}</span>{territoryMetric === 'pmh' && !group.missing && <small>{integer(group.value)} inscripciones</small>}</div>)}
      </div>}
      {interactive && mode !== 'territory' && <div className="v2-clusters" role="group" aria-label="Explorar las partes de la espera">
        {layout.clusters.map(group => <button key={group.id} type="button" data-kind={group.kind} data-label-side={group.x < (layout.clusters.find(item=>item.id==='RENAL')?.x??size.width*.5)?(group.x-group.radius>125?'left':group.y<(layout.clusters.find(item=>item.id==='RENAL')?.y??size.height*.5)?'above':'below'):(size.width-group.x-group.radius>125?'right':group.y<(layout.clusters.find(item=>item.id==='RENAL')?.y??size.height*.5)?'above':'below')} className={`v2-cluster${group.radius < 34 && group.value < 100 && group.kind !== 'collection' ? ' is-small' : ''}${hover === group.id ? ' is-highlighted' : ''}`} aria-label={`${group.label}: ${integer(group.value)} inscripciones. ${group.kind === 'collection' ? 'Desglosar las listas menores.' : group.kind === 'unavailable' ? 'Consultar disponibilidad del cruce.' : 'Ver sus provincias.'}`} aria-pressed={focus === group.id} style={{ left: group.x, top: group.y, width: mode === 'seniority' ? size.width * .84 : Math.max(30, group.radius * 2), height: Math.max(30, group.radius * 2), opacity: hover && hover !== group.id ? .22 : 1 }} onPointerEnter={() => onHover(group.id)} onPointerLeave={() => onHover(null)} onFocus={() => onHover(group.id)} onBlur={() => onHover(null)} onClick={() => onSelect(group.id)}>
          <span className="v2-cluster-label"><span>{group.label}</span><strong>{integer(group.value)}</strong>{group.kind === 'collection' && <small>{group.members?.length} listas · desglosar ↗</small>}</span>
        </button>)}
      </div>}
      {mode !== 'intro' && mode !== 'territory' && <p className="v2-unit">{unit}</p>}
    </div>
  );
}
