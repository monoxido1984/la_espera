'use client';
import {useId,useMemo,useRef,useState} from 'react';
import AnnualPointPile from './annual-point-pile';
import IndependentFlow from './independent-flow';
import {contextFinding} from './context-finding';
import HistoryMarkers from './history-markers';
import {historyTime,type AnnualMoment,type HistoryMetric} from './annual-story-model';
import {decimal,integer,type HistoryYear} from './universe-model';
import type {ComparisonYear} from './annual-comparison-model';
import {hasQuantileBand,quantileBandPath} from './quantile-band-model';
import {flowGroups,selectFlow} from './annual-flow-model';
import flows from './annual-flows.generated.json';
import type {AnnualTimeSelection} from './annual-time-model';
import {ComparisonPanel,type ComparisonState} from './exploration-comparison';

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

export default function AnnualFlowView({
  record,
  history,
  scope,
  selection,
  replay,
  moment,
  onYear,
  paused,
  renalNational,
  provinceNames,
  comparisonState,
}:{
  record:ComparisonYear;
  history:ComparisonYear[];
  scope:string;
  selection:AnnualTimeSelection;
  replay:number;
  moment:AnnualMoment;
  onYear:(year:number)=>void;
  paused:boolean;
  renalNational?:HistoryYear[];
  provinceNames?:Map<string,string>;
  comparisonState?:ComparisonState;
}){
  const [metric,setMetric]=useState<HistoryMetric>('time');
  const previous=history.find(row=>row.year===record.year-1)?.waitlist??null;
  const flow=useMemo(()=>selectFlow(flows,selection.list,record.year,selection.province,selection.age),[selection.list,record.year,selection.province,selection.age]);
  const groups=useMemo(()=>flowGroups(flow?.causes??[]),[flow?.causes]);
  const maximum=Math.max(1,flow?.entries??0,flow?.exits??0,...history.map(row=>row.waitlist??0),...(flows.lists[selection.list as keyof typeof flows.lists]??[]).map(row=>selection.province?row.provinces[selection.province as keyof typeof row.provinces]??0:Math.max(row.entries,row.exits??0)));
  const series=history.filter(row=>!row.partial&&row.year<=2025);
  const value=(row:ComparisonYear)=>metric==='stock'?row.waitlist:historyTime(row).value;
  const ceiling=Math.max(1,...series.map(row=>value(row)??0),...(metric==='time'?series.map(row=>hasQuantileBand(row)?row.p75!:0):[]));
  const x=(year:number)=>45+(year-2005)/20*510,y=(n:number)=>285-n/ceiling*225;
  const path=series.map((row,i)=>value(row)===null?'':`${i&&value(series[i-1])!==null&&series[i-1].year===row.year-1?'L':'M'}${x(row.year)},${y(value(row)!)}`).join(' ');
  const statistic=historyTime(record).kind==='median'?'Mediana':'Media';
  const timePath=(kind:'median'|'mean')=>series.map((row,i)=>{const point=historyTime(row);return point.kind!==kind||point.value===null?'':`${i&&historyTime(series[i-1]).kind===kind&&historyTime(series[i-1]).value!==null&&series[i-1].year===row.year-1?'L':'M'}${x(row.year)},${y(point.value)}`;}).join(' ');
  const mixedTime=new Set(series.filter(row=>historyTime(row).value!==null).map(row=>historyTime(row).kind)).size>1;
  const band=metric==='time'?quantileBandPath(series,x,y):'';

  if(moment==='compare'&&comparisonState&&renalNational&&provinceNames){
    return <div className="v2-annual-parallel v2-list-flow v2-annual-story" data-moment="compare" data-year={record.year} data-list={selection.list}>
      <ComparisonPanel
        state={comparisonState}
        record={record}
        renalNational={renalNational}
        provinceNames={provinceNames}
        selectionList={selection.list}
        selectionProvince={selection.province}
        onYear={onYear}
      />
    </div>;
  }

  return <div className="v2-annual-parallel v2-list-flow v2-annual-story" data-moment={moment} data-year={record.year} data-list={selection.list}>
    <header className="v2-story-scope">{record.label} · {scope}</header>
    {moment==='movements'&&<>
      <p className="v2-context-finding" aria-live="polite">{contextFinding(record.waitlist,previous,flow?.entries??null,flow?.exits??null)}</p>
      <p className="v2-flow-clarification">El saldo anual al cierre contempla ingresos, bajas permanentes y también suspensiones médicas transitorias o reactivaciones en lista.</p>
      <IndependentFlow key={selection.list+'|'+record.year+'|'+selection.province+'|'+selection.age} list={selection.list} year={record.year} province={selection.province} age={selection.age} groups={groups} exits={flow?.exits??null} flowEntries={flow?.entries??null} stock={record.waitlist}>
        <div className="v2-story-visual">
          <AnnualPointPile previous={previous} current={record.waitlist} moment="movements" metric={metric} entries={flow?.entries??null} exits={flow?.exits??null} groups={groups} maximum={maximum} history={history} paused={paused} replay={replay}/>
        </div>
      </IndependentFlow>
    </>}

    {moment==='history'&&<div className="v2-history-clean-stage">
      <div className="v2-history-header-actions">
        <div className="v2-tabs v2-history-metric" role="group" aria-label="Qué evolución explorar">
          <button type="button" aria-pressed={metric==='time'} onClick={()=>setMetric('time')}>Tiempo de espera</button>
          <button type="button" aria-pressed={metric==='stock'} onClick={()=>setMetric('stock')}>Ver cantidades</button>
        </div>
      </div>
      <div className="v2-story-visual v2-history-visual-full">
        <svg viewBox="0 0 600 360" className="v2-story-history-full" role="group" aria-label={metric==='stock'?'Evolución de la cantidad de personas en lista':'Evolución del tiempo hasta el trasplante: mediana con rango intercuartílico P25 a P75'}>
          <HistoryMarkers x={x} bottom={285} top={48} labelTop={24}/>
          {[0,ceiling/2,ceiling].map(n=><g key={n}><line x1="45" x2="555" y1={y(n)} y2={y(n)} stroke="currentColor" opacity=".12"/><text x="36" y={y(n)+4} textAnchor="end">{metric==='stock'?integer(Math.round(n)):decimal(n)}</text></g>)}
          {metric==='time'&&<path d={band} fill="var(--v2-accent)" fillOpacity=".16" stroke="none"/>}
          {metric==='stock'?<path d={path} fill="none" stroke="var(--v2-accent)" strokeWidth="2.4"/>:<><path d={timePath('median')} fill="none" stroke="var(--v2-accent)" strokeWidth="2.4"/><path d={timePath('mean')} fill="none" stroke="var(--v2-accent)" strokeWidth="2" strokeDasharray="6 4"/></>}
          <line x1={x(record.year)} x2={x(record.year)} y1="48" y2="285" stroke="currentColor" opacity=".4" strokeDasharray="3 4"/>
          {series.filter(row=>value(row)!==null).map(row=>{
            const isSelected = row.year === record.year;
            const pt = historyTime(row);
            const tooltip = metric === 'stock'
              ? `${row.year}: ${integer(row.waitlist!)} personas en lista al cierre`
              : `${row.year}: Mediana ${decimal(pt.value!)} ${row.unit}${hasQuantileBand(row) ? ` · P25–P75: ${decimal(row.p25!)}–${decimal(row.p75!)} ${row.unit}` : ''}${row.n != null ? ` · ${integer(row.n)} receptores` : ''}`;
            return (
              <circle
                key={row.year}
                cx={x(row.year)}
                cy={y(value(row)!)}
                r={isSelected ? 6 : 3.6}
                fill={isSelected ? 'var(--v2-accent)' : 'var(--v2-paper)'}
                stroke="var(--v2-accent)"
                strokeWidth={isSelected ? 2.5 : 1.5}
                tabIndex={0}
                role="button"
                aria-pressed={isSelected}
                aria-label={tooltip}
                onClick={()=>onYear(row.year)}
                onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();onYear(row.year);}}}
              >
                <title>{tooltip}</title>
              </circle>
            );
          })}
          {metric==='time'&&hasQuantileBand(record)&&<line x1={x(record.year)} x2={x(record.year)} y1={y(record.p25!)} y2={y(record.p75!)} stroke="var(--v2-accent)" strokeWidth="2.5"/>}
          <text x="45" y="318" fontSize="11" fill="currentColor">2005</text>
          <text x="555" y="318" fontSize="11" fill="currentColor" textAnchor="end">2025</text>
        </svg>
      </div>
      <div className="v2-story-reading" aria-live="polite">
        {metric==='time'&&record.median===null&&record.average!==null&&<p className="v2-quantile-legend">No hay mediana publicada para este cruce; se muestra la media, sin banda P25–P75.</p>}
        <p>
          {metric==='stock'?'Inscripciones al cierre':`${statistic} hasta el trasplante · ${record.unit}`} · {value(record)===null?'s/d':metric==='stock'?integer(value(record)!):decimal(value(record)!)} en {record.year}
          {metric==='time'&&hasQuantileBand(record)&&` (P25–P75: ${decimal(record.p25!)}–${decimal(record.p75!)} ${record.unit})`}
          {metric==='time'&&record.n!=null&&` · ${integer(record.n)} receptores`}
        </p>
        {metric==='time'&&mixedTime&&<p className="v2-quantile-legend">— Mediana · ⋯ Media</p>}
        {!series.some(row=>value(row)!==null)&&<p>{metric==='time'?'Sin datos de tiempo para esta selección.':'Sin datos para esta selección.'}</p>}
      </div>
    </div>}
  </div>;
}
