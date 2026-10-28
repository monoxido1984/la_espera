'use client';
import counts from './annual-list-counts.generated.json';
import transplants from './annual-transplant-counts.generated.json';
import donation from './donation-context.generated.json';
import {activitySeries,activityPath,type ActivityCounts} from './waiting-activity-model';
import {integer} from './universe-model';
import type {AnnualTimeSelection} from './annual-time-model';

export default function WaitingActivity({selection,year,onYear}:{selection:AnnualTimeSelection;year:number;onYear:(year:number)=>void}){
  const series=activitySeries(counts as ActivityCounts,transplants.rows as Record<string,number|null>,donation.rows,selection.list,selection.province,selection.age);
  const selected=series.find(point=>point.year===year);
  const x=(year:number)=>48+(year-2005)/20*508;
  const stockMaximum=Math.max(1,...series.map(p=>p.waiting??0));
  const flowMaximum=Math.max(1,...series.flatMap(p=>[p.transplants??0,p.donors??0]));
  const amount=(value:number|null|undefined)=>value==null?'s/d':integer(value);
  const stockColor='#0052cc',transplantColor='#b74d38',donorColor='#7d865f';
  function graph(flow:boolean){
    const maximum=flow?flowMaximum:stockMaximum;
    const y=(value:number)=>126-value/maximum*91;
    const lines=flow?[{key:'transplants' as const,label:'trasplantes registrados',color:transplantColor},{key:'donors' as const,label:'donantes reales de órganos',color:donorColor}]:[{key:'waiting' as const,label:'personas en lista al cierre',color:stockColor}];
    return <svg viewBox="0 0 600 156" role="group" aria-label={flow?'Flujos anuales: trasplantes registrados de la lista elegida y donantes reales de todos los órganos. Escala independiente de la lista al cierre.':'Personas en lista al cierre de cada año. Cantidad en una fecha, no flujo anual.'}>
      {[0,maximum].map(value=><g key={value}><line x1="48" x2="556" y1={y(value)} y2={y(value)} stroke="currentColor" opacity=".12"/><text x="39" y={y(value)+4} textAnchor="end">{integer(value)}</text></g>)}
      <line x1={x(year)} x2={x(year)} y1="28" y2="126" stroke="currentColor" opacity=".25" strokeDasharray="3 4"/>
      {lines.map(line=><g key={line.key}><path d={activityPath(series,line.key,x,y)} fill="none" stroke={line.color} strokeWidth="2" strokeDasharray={line.key==='donors'?'5 3':undefined}/>{series.filter(point=>point[line.key]!==null).map(point=>{
        const label=`${point.year}: ${integer(point[line.key]!)} ${line.label}`;
        return <circle key={point.year} cx={x(point.year)} cy={y(point[line.key]!)} r={point.year===year?4.5:2.8} fill={line.color} tabIndex={0} role="button" aria-pressed={point.year===year} aria-label={label} onClick={()=>onYear(point.year)} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();onYear(point.year);}}}><title>{label}</title></circle>;
      })}</g>)}
      <text x="48" y="149">2005</text><text x="556" y="149" textAnchor="end">2025</text>
    </svg>;
  }
  return <div className="v2-waiting-activity">
    <p className="v2-activity-finding">La espera se acumula. Los trasplantes representan oportunidades concretas de finalizarla.</p>
    <div className="v2-activity-lane">
      <div className="v2-activity-heading"><span>Personas en lista · al cierre</span><strong style={{color:stockColor}}>{amount(selected?.waiting)}</strong></div>
      {graph(false)}
    </div>
    <div className="v2-activity-lane">
      <div className="v2-activity-heading"><span>Movimientos · durante el año {year}</span></div>
      <div className="v2-activity-legend"><span style={{color:transplantColor}}>● Trasplantes registrados <strong>{amount(selected?.transplants)}</strong></span><span style={{color:donorColor}}>╌ Donantes reales · todos los órganos <strong>{amount(selected?.donors)}</strong></span></div>
      {graph(true)}
    </div>
    {selected?.transplants==null&&<p className="v2-activity-unavailable">No hay un conteo de trasplantes por órgano y residencia disponible en esta base para {year}. No se sustituye por bajas de lista ni por pacientes con tiempos informados.</p>}
    <p className="v2-activity-note">Arriba: cantidad al cierre. Abajo: flujos anuales, con otra escala. Donantes de todos los órganos, no necesariamente del seleccionado. Lista y receptores por residencia; donantes por establecimiento de origen. Las series no forman un balance conciliado. s/d: desglose no disponible.</p>
  </div>;
}
