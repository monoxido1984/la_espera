'use client';
import {useId,useMemo,useRef,useState} from 'react';
import AnnualPointPile from './annual-point-pile';
import AnnualEntryBreakdown from './annual-entry-breakdown';
import {historyTime,type AnnualMoment,type HistoryMetric} from './annual-story-model';
import {decimal,integer} from './universe-model';
import type {ComparisonYear} from './annual-comparison-model';
import {hasQuantileBand,quantileBandPath} from './quantile-band-model';
import {flowGroups,selectFlow} from './annual-flow-model';
import flows from './annual-flows.generated.json';
import type {AnnualTimeSelection} from './annual-time-model';

export function ExitBreakdown({groups,showCodes=false}:{groups:ReturnType<typeof flowGroups>;showCodes?:boolean}){
  const [deceased,living,death,other]=groups;
  const [kind,setKind]=useState<'transplant'|'other'|null>(null);
  const dialog=useRef<HTMLDialogElement>(null),id=useId();
  function open(next:'transplant'|'other'){setKind(next);dialog.current?.showModal();}
  return <div className="v2-exit-breakdown">
    <button type="button" className="v2-exit-row v2-exit-trigger" aria-haspopup="dialog" aria-controls={id} onClick={()=>open('transplant')}><i className="v2-exit-transplant-color"/><span>Trasplante</span><strong>{integer(deceased.value+living.value)}</strong><span aria-hidden="true" className="v2-exit-chevron">↗</span></button>
    <div className="v2-exit-row"><i style={{background:death.color}}/><span>Fallecimiento</span><strong>{integer(death.value)}</strong></div>
    <button type="button" className="v2-exit-row v2-exit-trigger" aria-haspopup="dialog" aria-controls={id} onClick={()=>open('other')}><i style={{background:other.color}}/><span>Otros motivos de egreso</span><strong>{integer(other.value)}</strong><span aria-hidden="true" className="v2-exit-chevron">↗</span></button>
    <dialog ref={dialog} id={id} className="v2-exit-dialog" aria-labelledby={`${id}-title`} onClose={()=>setKind(null)}>
      <header><h4 id={`${id}-title`}>{kind==='transplant'?'Trasplante':'Otros motivos de egreso'} <strong>{integer(kind==='transplant'?deceased.value+living.value:other.value)}</strong></h4><button type="button" onClick={()=>dialog.current?.close()} aria-label="Cerrar desglose">Cerrar ×</button></header>
      <div className="v2-exit-dialog-body">{kind==='transplant'?[deceased,living].map(g=><div className="v2-exit-row" key={g.id}><i style={{background:g.color}}/><span>{g.id==='trasplante_dc'?'Donante fallecido':'Donante vivo'}</span><strong>{integer(g.value)}</strong></div>):other.items.map(c=><div className="v2-exit-row" key={c.canonicalId}><span>{c.label}{showCodes&&c.sourceCodes.length>0&&<small>Códigos CRESI: {c.sourceCodes.join(', ')}</small>}</span><strong>{integer(c.value)}</strong></div>)}</div>
    </dialog>
  </div>;
}

export default function AnnualFlowView({record,history,scope,selection,replay,moment,onYear,onMoment,paused}:{record:ComparisonYear;history:ComparisonYear[];scope:string;selection:AnnualTimeSelection;replay:number;moment:AnnualMoment;onYear:(year:number)=>void;onMoment:(moment:AnnualMoment)=>void;paused:boolean}){
  const [metric,setMetric]=useState<HistoryMetric>('time');
  const [causeKind,setCauseKind]=useState<'entries'|'exits'>('exits');
  function showCauses(kind:'entries'|'exits'){setCauseKind(kind);onMoment('causes');}
  const [balance,setBalance]=useState<number|null>(null);
  const previous=history.find(row=>row.year===record.year-1)?.waitlist??null;
  const flow=useMemo(()=>selectFlow(flows,selection.list,record.year,selection.province,selection.age),[selection.list,record.year,selection.province,selection.age]);
  const groups=useMemo(()=>flowGroups(flow?.causes??[]),[flow?.causes]);
  const maximum=Math.max(1,...history.map(row=>row.waitlist??0),...(flows.lists[selection.list as keyof typeof flows.lists]??[]).map(row=>selection.province?row.provinces[selection.province as keyof typeof row.provinces]??0:Math.max(row.entries,row.exits??0)));
  const series=history.filter(row=>!row.partial&&row.year<=2025);
  const value=(row:ComparisonYear)=>metric==='stock'?row.waitlist:historyTime(row).value;
  const ceiling=Math.max(1,...series.map(row=>value(row)??0),...(metric==='time'?series.map(row=>hasQuantileBand(row)?row.p75!:0):[]));
  const x=(year:number)=>45+(year-2005)/20*510,y=(n:number)=>285-n/ceiling*225;
  const path=series.map((row,i)=>value(row)===null?'':`${i&&value(series[i-1])!==null&&series[i-1].year===row.year-1?'L':'M'}${x(row.year)},${y(value(row)!)}`).join(' ');
  const statistic=historyTime(record).kind==='median'?'Mediana':'Media';
  const timePath=(kind:'median'|'mean')=>series.map((row,i)=>{const point=historyTime(row);return point.kind!==kind||point.value===null?'':`${i&&historyTime(series[i-1]).kind===kind&&historyTime(series[i-1]).value!==null&&series[i-1].year===row.year-1?'L':'M'}${x(row.year)},${y(point.value)}`;}).join(' ');
  const mixedTime=new Set(series.filter(row=>historyTime(row).value!==null).map(row=>historyTime(row).kind)).size>1;
  const band=metric==='time'?quantileBandPath(series,x,y):'';
  const missing=record.partial?'Sin movimientos para este corte.':selection.age!=='all'?'Sin movimientos disponibles por edad.':flow?.exitsState==='sin_resultado_publicado'?'Sin egresos publicados para este año.':'Sin egresos disponibles para esta selección.';
  return <div className="v2-annual-parallel v2-list-flow v2-annual-story" data-moment={moment} data-year={record.year} data-list={selection.list}>
    <header className="v2-story-scope">{record.label} · {scope}</header>
    <div className="v2-story-visual">
      {moment==='causes'&&causeKind==='entries'?<AnnualEntryBreakdown key={`${selection.list}-${record.year}-${selection.province}-${selection.age}`} list={selection.list} year={record.year} province={selection.province} age={selection.age} flowEntries={flow?.entries??null}/>:<AnnualPointPile previous={previous} current={record.waitlist} onBalance={setBalance} moment={moment} metric={metric} entries={flow?.entries??null} exits={flow?.exits??null} groups={groups} maximum={maximum} history={history} paused={paused} replay={replay}/>}
      {moment==='movements'&&<svg viewBox="0 0 600 360" className="v2-story-overlay" role="group" aria-label={`Ingresos: ${flow?.entries==null?'sin dato':integer(flow.entries)}. Egresos: ${flow?.exits==null?'sin dato':integer(flow.exits)}. El saldo ilustrado no es el cierre publicado.`}>
        <text x="110" y="32" textAnchor="middle">{flow?.entries==null?'s/d':integer(flow.entries)}</text><text x="490" y="32" textAnchor="middle">{flow?.exits==null?'s/d':integer(flow.exits)}</text>
        <g className="v2-egresos-trigger" role="button" tabIndex={0} aria-label="Ver motivos de ingreso" onClick={()=>showCauses('entries')} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();showCauses('entries');}}}><rect x="40" y="296" width="140" height="42" fill="transparent"/><text x="110" y="318" textAnchor="middle">Ingresos ↗</text></g><text x="300" y="32" textAnchor="middle">{balance===null?'s/d':integer(balance)}</text><text x="300" y="318" textAnchor="middle"><tspan x="300" dy="-4" fontSize="13">Cantidad de personas</tspan><tspan x="300" dy="17" fontSize="13">en lista de espera*</tspan></text><g className="v2-egresos-trigger" role="button" tabIndex={0} aria-label="Ver motivos de egreso" onClick={()=>showCauses('exits')} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();showCauses('exits');}}}><rect x="420" y="296" width="140" height="42" fill="transparent"/><text x="490" y="318" textAnchor="middle">Egresos ↗</text></g>
      </svg>}
      {moment==='causes'&&causeKind==='exits'&&<svg viewBox="0 0 600 360" className="v2-story-overlay" role="img" aria-label={flow?.exits==null?missing:`Egresos por motivo. Trasplante: ${integer(groups[0].value+groups[1].value)}. Fallecimiento: ${integer(groups[2].value)}. Otros motivos: ${integer(groups[3].value)}.`}>
      </svg>}
      {moment==='history'&&<svg viewBox="0 0 600 360" className="v2-story-overlay v2-story-history" role="group" aria-label={metric==='stock'?'Evolución del tamaño de la lista':'Evolución del tiempo hasta el trasplante: mediana con P25 a P75 cuando están disponibles; media sin banda en los demás casos'}>
        {[0,ceiling/2,ceiling].map(n=><g key={n}><line x1="45" x2="555" y1={y(n)} y2={y(n)} stroke="currentColor" opacity=".12"/><text x="36" y={y(n)+4} textAnchor="end">{metric==='stock'?integer(Math.round(n)):decimal(n)}</text></g>)}
        {metric==='time'&&<path d={band} fill="var(--v2-accent)" fillOpacity=".16" stroke="none"/>}
        {metric==='stock'?<path d={path} fill="none" stroke="var(--v2-accent)" strokeWidth="2"/>:<><path d={timePath('median')} fill="none" stroke="var(--v2-accent)" strokeWidth="2"/><path d={timePath('mean')} fill="none" stroke="var(--v2-accent)" strokeWidth="2" strokeDasharray="6 4"/></>}
        <line x1={x(record.year)} x2={x(record.year)} y1="48" y2="285" stroke="currentColor" opacity=".4" strokeDasharray="3 4"/>
        {series.filter(row=>value(row)!==null).map(row=><circle key={row.year} cx={x(row.year)} cy={y(value(row)!)} r={row.year===record.year?6:4} fill={row.year===record.year?'var(--v2-accent)':'var(--v2-paper)'} stroke="var(--v2-accent)" tabIndex={0} role="button" aria-pressed={row.year===record.year} aria-label={`${row.year}: ${metric==='time'?(historyTime(row).kind==='median'?'Mediana':'Media')+' ':''}${metric==='stock'?integer(value(row)!):decimal(value(row)!)} ${metric==='stock'?'inscripciones':record.unit}`} onClick={()=>onYear(row.year)} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();onYear(row.year);}}}><title>{row.year} · {metric==='stock'?integer(value(row)!):`${historyTime(row).kind==='median'?'Mediana':'Media'} ${decimal(historyTime(row).value!)} ${row.unit}${hasQuantileBand(row)?` · P25 ${decimal(row.p25!)} · P75 ${decimal(row.p75!)}`:''}`}</title></circle>)}
        {metric==='time'&&hasQuantileBand(record)&&<line x1={x(record.year)} x2={x(record.year)} y1={y(record.p25!)} y2={y(record.p75!)} stroke="var(--v2-accent)" strokeWidth="2"/>}
        <text x="45" y="318">2005</text><text x="555" y="318" textAnchor="end">2025</text>
      </svg>}
    </div>
    <div className="v2-story-reading" aria-live="polite">
      {moment==='movements'&&<><p className="v2-story-separate">Tocá Ingresos o Egresos para ver los motivos. *Ver Sobre los datos.</p>{flow?.exits==null&&<p>{missing}</p>}</>}
      {moment==='causes'&&<div className="v2-tabs" role="group" aria-label="Motivos de ingresos o egresos"><button type="button" aria-pressed={causeKind==='entries'} onClick={()=>setCauseKind('entries')}>Ingresos</button><button type="button" aria-pressed={causeKind==='exits'} onClick={()=>setCauseKind('exits')}>Egresos</button></div>}

      {moment==='causes'&&causeKind==='exits'&&(flow?.exits!=null?<><ExitBreakdown key={`${record.year}-${selection.list}-${selection.province}-${selection.age}`} groups={groups}/><p className="v2-story-invitation">Abrí Trasplante u Otros motivos para ver el detalle.</p></>:<p>{missing}</p>)}
      {moment==='history'&&<><div className="v2-tabs v2-history-metric" role="group" aria-label="Qué evolución explorar"><button type="button" aria-pressed={metric==='time'} onClick={()=>setMetric('time')}>Tiempo de espera</button><button type="button" aria-pressed={metric==='stock'} onClick={()=>setMetric('stock')}>Ver cantidades</button></div><p>{metric==='stock'?'Inscripciones al cierre':`${statistic} hasta el trasplante · ${record.unit}`} · {value(record)===null?'s/d':metric==='stock'?integer(value(record)!):decimal(value(record)!)} en {record.year}</p>{metric==='time'&&mixedTime&&<p className="v2-quantile-legend">— Mediana · ⋯ Media</p>}{metric==='time'&&hasQuantileBand(record)&&<p className="v2-quantile-legend">P25–P75 · {decimal(record.p25!)}–{decimal(record.p75!)} {record.unit}</p>}{!series.some(row=>value(row)!==null)&&<p>{metric==='time'?'Sin datos de tiempo para esta selección.':'Sin datos para esta selección.'}</p>}</>}
    </div>
  </div>;
}
