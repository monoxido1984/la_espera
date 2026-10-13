'use client';
import {useEffect,useState} from 'react';
import {decimal,integer} from './universe-model';
import {timeScales,type TimeScale} from './time-scale-model';

export default function TimeScaleControls({metric,onMetric,listMonths,dialysisMonths,records,accumulated,onAccumulated,sessions,onSessions,scale,onScale}:{metric:'list'|'dialysis';onMetric:(value:'list'|'dialysis')=>void;listMonths:number;dialysisMonths:number;records:number;accumulated:boolean;onAccumulated:(value:boolean)=>void;sessions:boolean;onSessions:(value:boolean)=>void;scale:TimeScale;onScale:(value:TimeScale)=>void}) {
  const [open,setOpen]=useState(false);
  useEffect(()=>{if(accumulated||sessions)setOpen(true);},[accumulated,sessions]);
  return <>
    <div className="v2-time-comparison">
      <button aria-pressed={metric==='dialysis'} onClick={()=>onMetric('dialysis')}><strong>{decimal(dialysisMonths)}</strong><span>meses en diálisis</span></button>
      <button aria-pressed={metric==='list'} onClick={()=>onMetric('list')}><strong>{decimal(listMonths)}</strong><span>meses en lista</span></button>
    </div>
    <button className="v2-time-toggle" aria-pressed={accumulated} onClick={()=>onAccumulated(!accumulated)}>{accumulated?'← Volver al tiempo por persona':`Reunir el tiempo de ${integer(records)} registros →`}</button>
    <button className="v2-time-toggle v2-session-toggle" aria-pressed={sessions} onClick={()=>onSessions(!sessions)}>{sessions?'← Volver al calendario':'¿Cuántas horas dentro de una sesión? ↗'}</button>
    {sessions&&<p className="v2-scenario">Escenario: 4 horas × 3 sesiones por semana.</p>}
    <details className="v2-time-scales" open={open} onToggle={event=>setOpen(event.currentTarget.open)}><summary>Ver el tiempo en otra escala</summary><div role="group" aria-label="Unidad del tiempo">{timeScales.map(unit=><button key={unit.id} aria-pressed={scale===unit.id} onClick={()=>onScale(unit.id)}>{unit.label}</button>)}</div></details>
  </>;
}
