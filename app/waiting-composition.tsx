'use client';

import { CSSProperties, useState } from 'react';
import { formatDecimal, formatInteger, StoryData } from './story-model';

const MAJOR_COLORS = ['#176b67', '#d9573f', '#c58b2c', '#6d5b87', '#397590', '#9b4b61'];
const MINOR_COLOR = '#c7bcac';
type IconKind = 'all' | 'kidney' | 'cornea' | 'liver' | 'lungs' | 'pancreas' | 'heart' | 'other';

function OrganIcon({ kind }: { kind: IconKind }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (kind === 'all') return <svg viewBox="0 0 28 28" aria-hidden="true"><circle cx="9" cy="9" r="4" {...common} /><circle cx="19" cy="9" r="4" {...common} /><circle cx="9" cy="19" r="4" {...common} /><circle cx="19" cy="19" r="4" {...common} /></svg>;
  if (kind === 'kidney') return <svg viewBox="0 0 28 28" aria-hidden="true"><path d="M12 4C7 3 4 7 4 12c0 6 4 10 8 8 3-2 1-6 3-8 2-3 1-7-3-8Z" {...common} /><path d="M16 4c5-1 8 3 8 8 0 6-4 10-8 8-3-2-1-6-3-8-2-3-1-7 3-8Z" {...common} /></svg>;
  if (kind === 'cornea') return <svg viewBox="0 0 28 28" aria-hidden="true"><path d="M3 14s4-7 11-7 11 7 11 7-4 7-11 7S3 14 3 14Z" {...common} /><circle cx="14" cy="14" r="3.5" {...common} /></svg>;
  if (kind === 'liver') return <svg viewBox="0 0 28 28" aria-hidden="true"><path d="M4 15c2-6 7-9 14-8 4 1 6 4 6 8-4 0-7 1-9 4-4 4-10 2-11-4Z" {...common} /></svg>;
  if (kind === 'lungs') return <svg viewBox="0 0 28 28" aria-hidden="true"><path d="M13 13V4m2 9V4M12 9c-4 1-7 5-7 10 0 3 2 4 4 3 3-1 4-5 4-9M16 9c4 1 7 5 7 10 0 3-2 4-4 3-3-1-4-5-4-9" {...common} /></svg>;
  if (kind === 'heart') return <svg viewBox="0 0 28 28" aria-hidden="true"><path d="M14 23S4 17 4 10c0-5 6-7 10-2 4-5 10-3 10 2 0 7-10 13-10 13Z" {...common} /></svg>;
  if (kind === 'pancreas') return <svg viewBox="0 0 28 28" aria-hidden="true"><path d="M4 15c4-5 7-6 11-4 4 2 6 0 9 1-1 5-5 7-9 6-5-1-7 2-11-3Z" {...common} /></svg>;
  return <svg viewBox="0 0 28 28" aria-hidden="true"><path d="M6 8h16M6 14h16M6 20h10" {...common} /></svg>;
}

function iconFor(label: string): IconKind {
  const value = label.toLocaleLowerCase('es-AR');
  if (value.includes('renal')) return value.includes('pancre') ? 'pancreas' : 'kidney';
  if (value.includes('córnea')) return 'cornea';
  if (value.includes('hepática')) return 'liver';
  if (value.includes('pulmonar')) return 'lungs';
  if (value.includes('cardíaca')) return 'heart';
  return 'other';
}

export default function WaitingComposition({ data, selectedListId, onSelectList, onExploreTerritory }: { data: StoryData; selectedListId: string; onSelectList: (id: string) => void; onExploreTerritory: () => void }) {
  const items = [...data.currentWaiting].sort((a, b) => b.value - a.value);
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const majorItems = items.filter((item) => item.value / total > 0.01);
  const minorItems = items.filter((item) => item.value / total <= 0.01);
  const minorTotal = minorItems.reduce((sum, item) => sum + item.value, 0);
  const renal = items.find((item) => item.label.toLowerCase() === 'renal') ?? items[0];
  const lists = data.currentSnapshot.byList ?? [];
  const [showOther, setShowOther] = useState(false);
  const activeKey = selectedListId === 'TOTAL' ? 'ALL' : selectedListId;
  const active = activeKey === 'ALL' ? { label: 'Todas las listas', value: total } : activeKey === 'OTHER' ? { label: 'Otros', value: minorTotal } : items.find((item) => item.label === lists.find((list) => list.id === activeKey)?.label) ?? renal;
  const itemColor = (label: string) => {
    const majorIndex = majorItems.findIndex((item) => item.label === label);
    return majorIndex >= 0 ? MAJOR_COLORS[majorIndex % MAJOR_COLORS.length] : MINOR_COLOR;
  };
  const select = (id: string) => {
    if (id === 'OTHER') { setShowOther(!showOther); return; }
    onSelectList(id === 'ALL' ? 'TOTAL' : id);
  };
  const listIdFor = (label: string) => lists.find((list) => list.label === label)?.id ?? label;

  return (
    <section className="composition-story composition-dashboard" id="quienes" aria-labelledby="composition-title">
      <div className="composition-visual">
        <p className="eyebrow">Pregunta 1 · ¿Qué esperan?</p>
        <h2 id="composition-title">No hay una sola espera</h2>
        <div className="composition-readout" aria-live="polite"><strong aria-label={`${formatInteger(active.value)} ${activeKey === 'ALL' ? 'en todas las listas' : `en la lista ${active.label}`}`}>{formatInteger(active.value)}</strong></div>
        <div className="composition-stack" role="group" aria-label="Composición proporcional por lista">{items.map((item) => { const id = listIdFor(item.label); return <button type="button" key={item.label} aria-pressed={activeKey === id} aria-label={`${item.label}: ${formatInteger(item.value)} registros, ${formatDecimal(item.value / total * 100)} por ciento. Mostrar cantidad.`} title={`${item.label}: ${formatInteger(item.value)} · ${formatDecimal(item.value / total * 100)}%`} onClick={() => select(id)} style={{ flexGrow: item.value, background: itemColor(item.label) }} />; })}</div>
        <div className="organ-picker" role="group" aria-label="Elegir una lista de espera">
          <button type="button" aria-pressed={activeKey === 'ALL'} onClick={() => select('ALL')}><OrganIcon kind="all" /><span>Todas</span></button>
          {majorItems.map((item) => { const id = lists.find((list) => list.label === item.label)?.id ?? item.label; return <button key={item.label} type="button" aria-pressed={activeKey === id} onClick={() => select(id)} style={{ '--organ-color': itemColor(item.label) } as CSSProperties}><OrganIcon kind={iconFor(item.label)} /><span>{item.label}</span></button>; })}
          <button type="button" aria-expanded={showOther} onClick={() => select('OTHER')} style={{ '--organ-color': MINOR_COLOR } as CSSProperties}><OrganIcon kind="other" /><span>Otros</span></button>
        </div>
        {showOther && <div className="other-lists" aria-live="polite"><strong>Listas incluidas en Otros</strong>{minorItems.map((item) => <button type="button" key={item.label} aria-pressed={activeKey===listIdFor(item.label)} onClick={()=>select(listIdFor(item.label))}>{item.label}<b>{formatInteger(item.value)}</b></button>)}</div>}
        <button type="button" className="composition-explore" onClick={onExploreTerritory}>Explorar esta lista por territorio <span aria-hidden="true">→</span></button>
      </div>
      <aside className="composition-insight"><strong>{formatDecimal(renal.value/total*100)}%</strong><h3>de los registros corresponden a la lista renal</h3><button type="button" onClick={() => select('RENAL')}>Ver foco renal</button></aside>
    </section>
  );
}
