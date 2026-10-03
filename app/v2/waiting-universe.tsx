'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { clusterPoints, discPoints, integer, packGroups, type Cluster, type Dot, type Group, type UniverseMode } from './universe-model';

type Particle = Dot & { alpha: number };
type Props = {
  mode: UniverseMode; groups: Group[]; count: number; total: number;
  focus: string | null; hover: string | null; paused: boolean; dark: boolean;
  population: string; label: string; unit: string;
  onHover: (id: string | null) => void; onSelect: (id: string) => void;
};

function numberPoints(count: number, width: number, height: number, radius: number): Dot[] {
  const scratch = document.createElement('canvas');
  scratch.width = Math.ceil(width); scratch.height = Math.ceil(height);
  const context = scratch.getContext('2d', { willReadFrequently: true });
  if (!context) return discPoints(count, width / 2, height / 2, width * .38, 'total', '#b74d38', radius);
  context.font = `600 ${Math.min(width * .275, height * .62)}px Arial, sans-serif`;
  context.textAlign = 'center'; context.textBaseline = 'middle';
  context.fillText(integer(count), width / 2, height / 2, width * .97);
  const pixels = context.getImageData(0, 0, scratch.width, scratch.height).data;
  const candidates: { x: number; y: number }[] = [];
  for (let y = 0; y < scratch.height; y += 3) for (let x = 0; x < scratch.width; x += 3) {
    if (pixels[(y * scratch.width + x) * 4 + 3] > 140) candidates.push({ x, y });
  }
  if (!candidates.length) return [];
  return Array.from({ length: count }, (_, index) => {
    const point = candidates[index % candidates.length];
    return { x: point.x + Math.sin(index * 7.3) * 1.1, y: point.y + Math.cos(index * 3.7) * 1.1, radius, color: '#b74d38', group: 'total' };
  });
}

export default function WaitingUniverse({ mode, groups, count, total, focus, hover, paused, dark, population, label, unit, onHover, onSelect }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const previousPopulation = useRef(population);
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

  const layout = useMemo(() => {
    const { width, height } = size;
    if (!width || !height) return { points: [] as Dot[], clusters: [] as Cluster[] };
    const base = Math.min(width, height);
    const dotRadius = Math.max(.6, Math.min(1.5, base / 380));
    const color = dark ? '#efbb87' : '#b74d38';
    if (interactive) {
      const visible = focus ? groups.filter(group => group.id === focus) : groups;
      const clusters = packGroups(visible, width, height);
      // Small groups are still exact and independently selectable.
      const radius = Math.max(.45, Math.min(dotRadius, base / 420));
      return { points: clusterPoints(clusters, radius), clusters };
    }
    if (mode === 'number') return { points: numberPoints(count, width, height, dotRadius * .82), clusters: [] };
    if (mode === 'intro' || mode === 'history' || mode === 'duration') {
      const radius = base * (mode === 'intro' ? .37 : .36);
      const thickness = mode === 'intro' ? .08 : mode === 'history' ? .23 : .07;
      const ringDotRadius = Math.max(.25, Math.min(dotRadius, Math.sqrt(radius * radius * thickness / Math.max(1, count)) * .65));
      const points = Array.from({ length: count }, (_, index) => {
        const angle = index * Math.PI * (3 - Math.sqrt(5));
        const distance = radius * Math.sqrt(1 - thickness + thickness * ((index + .5) / count));
        return { x: width / 2 + Math.cos(angle) * distance, y: height / 2 + Math.sin(angle) * distance, radius: ringDotRadius, color, group: 'total' };
      });
      return { points, clusters: [] };
    }
    const radius = base * .4 * Math.sqrt(count / Math.max(total, count));
    return { points: discPoints(count, width / 2, height / 2, radius, 'total', color, dotRadius), clusters: [] };
  }, [size, interactive, groups, focus, count, total, mode, dark]);

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
    const previous = particles.current;
    const length = Math.max(previous.length, target.length);
    const starts = Array.from({ length }, (_, index) => previous[index] ?? { ...(target[index] ?? target[0]), alpha: 0 });
    const end = Array.from({ length }, (_, index) => {
      const point = target[index];
      return point ? { ...point, alpha: hover && point.group !== hover ? .08 : mode === 'intro' ? .13 : 1 } : { ...starts[index], alpha: 0 };
    });
    let frame = 0;
    const started = performance.now();
    const duration = paused ? 0 : crossfade ? 1000 : hover ? 200 : 1350;
    const draw = (now: number) => {
      const progress = duration ? Math.min(1, (now - started) / duration) : 1;
      const eased = 1 - (1 - progress) ** 3;
      context.clearRect(0, 0, size.width, size.height);
      const buckets = new Map<string, { color: string; alpha: number; dots: Particle[] }>();
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
        current.push(point);
        const opacity = Math.round(Math.max(0, point.alpha) * 12) / 12;
        if (opacity <= 0) continue;
        const key = point.color + '/' + opacity;
        if (!buckets.has(key)) buckets.set(key, { color: point.color, alpha: opacity, dots: [] });
        buckets.get(key)!.dots.push(point);
      }
      for (const bucket of buckets.values()) {
        context.fillStyle = bucket.color; context.globalAlpha = bucket.alpha; context.beginPath();
        for (const point of bucket.dots) { context.moveTo(point.x + point.radius, point.y); context.arc(point.x, point.y, point.radius, 0, Math.PI * 2); }
        context.fill();
      }
      context.globalAlpha = 1;
      particles.current = progress === 1 ? current.slice(0, target.length) : current;
      if (progress < 1) frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [layout, size, hover, paused, population, mode]);

  return (
    <div ref={container} className={`v2-universe${mode === 'intro' && !paused ? ' is-breathing' : ''}`} data-mode={mode}>
      <canvas ref={canvas} aria-hidden="true" />
      <p className="v2-sr-only">{label}</p>
      {failed && <p className="v2-canvas-fallback">{integer(count)}<span>{unit}</span></p>}
      {interactive && <div className="v2-clusters" role="group" aria-label="Explorar las partes de la espera">
        {layout.clusters.map(group => <button key={group.id} type="button" className={`v2-cluster${group.radius < 34 ? ' is-small' : ''}${hover === group.id ? ' is-highlighted' : ''}`} aria-label={`${group.label}: ${integer(group.value)} inscripciones. Acercar.`} aria-pressed={focus === group.id} style={{ left: group.x, top: group.y, width: Math.max(30, group.radius * 2), height: Math.max(30, group.radius * 2), opacity: hover && hover !== group.id ? .22 : 1 }} onPointerEnter={() => onHover(group.id)} onPointerLeave={() => onHover(null)} onFocus={() => onHover(group.id)} onBlur={() => onHover(null)} onClick={() => onSelect(group.id)}>
          <span className="v2-cluster-label"><span>{group.label}</span><strong>{integer(group.value)}</strong></span>
        </button>)}
      </div>}
      {mode !== 'intro' && <p className="v2-unit">{unit}</p>}
    </div>
  );
}
