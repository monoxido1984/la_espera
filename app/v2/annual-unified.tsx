'use client';
import {useMemo,useState} from 'react';
import raw from './annual-time.generated.json';
import counts from './annual-list-counts.generated.json';
import donation from './donation-context.generated.json';
import quantiles from './annual-national-quantiles.generated.json';
import {annualTimeDetail,unpackAnnualTimes,type CompactAnnualTime,type AnnualTimeSelection} from './annual-time-model';
import {comparisonHistory,type ComparisonYear} from './annual-comparison-model';
import {activitySeries,type ActivityCounts} from './waiting-activity-model';
import {historyTime} from './annual-story-model';
import {quantileBandPath} from './quantile-band-model';
import {decimal,integer,type HistoryYear} from './universe-model';
import HistoryMarkers from './history-markers';
const cells=unpackAnnualTimes(raw as CompactAnnualTime);
type Metric='time'|'donors'|'stock';
export default function AnnualUnified({record,history,selection,onYear,provinceNames,renalNational,scope}:{record:ComparisonYear;history:ComparisonYear[];selection:AnnualTimeSelection;onYear:(year:number)=>void;provinceNames:Map<string,string>;renalNational:HistoryYear[];scope:string}){
 const [metric,setMetric]=useState<Metric>('time'),[compare,setCompare]=useState('none');
 const reference=compare==='ARGENTINA'?null:compare;
 const comparison=useMemo(()=>{const target={...selection,province:reference};return comparisonHistory(renalNational,target,raw.years.map(year=>annualTimeDetail(cells,year,target)),counts,quantiles.rows);},[selection,reference,renalNational]);
 const activity=activitySeries(counts as ActivityCounts,donation.rows,selection.list,selection.province,'all');
 const otherActivity=activitySeries(counts as ActivityCounts,donation.rows,selection.list,reference,'all');
 const value=(row:ComparisonYear|undefined,other=false)=>!row?null:metric==='time'?historyTime(row).value:metric==='stock'?row.waitlist:(other?otherActivity:activity).find(p=>p.year===row.year)?.donors??null;
 const primary=history.filter(p=>!p.partial&&p.year<=2025),secondary=comparison.filter(p=>!p.partial&&p.year<=2025);
 const comparing=compare!=='none'&&reference!==selection.province;
 const maximum=Math.max(1,...[primary,...(comparing?[secondary]:[])].flatMap(rows=>rows.flatMap(row=>[value(row,rows===secondary)??0,metric==='time'?row.p75??0:0])));
 const x=(year:number)=>52+(year-2005)/20*500,y=(n:number)=>278-n/maximum*218;
 function path(rows:ComparisonYear[],other:boolean,kind?:'median'|'mean'){return rows.map((row,i)=>{const v=value(row,other),valid=v!==null&&(!kind||historyTime(row).kind===kind);if(!valid)return '';const prev=rows[i-1];return `${prev&&prev.year===row.year-1&&value(prev,other)!==null&&(!kind||historyTime(prev).kind===kind)?'L':'M'}${x(row.year)},${y(v)}`;}).join(' ');}
 const unit=metric==='time'?record.unit:metric==='stock'?'inscripciones al cierre':'donantes reales de órganos';
 const usable=primary.filter(row=>row.year<=record.year&&value(row)!==null&& (metric!=='time'||historyTime(row).kind===historyTime(record).kind));
 const first=usable[0],last=usable.at(-1),delta=first&&last?value(last)!-value(first)!:null;
 const anchor=first&&last&&first.year!==last.year?`Entre ${first.year} y ${last.year}, ${metric==='time'?'el tiempo observado':metric==='stock'?'la lista al cierre':'la donación'} ${delta===0?'se mantuvo':delta!>0?'aumentó':'disminuyó'}${delta===0?'':` ${metric==='time'?decimal(Math.abs(delta!)):integer(Math.abs(delta!))} ${unit}`}.`:'Elegí otro año para recorrer la evolución disponible.';
 const label=selection.province?provinceNames.get(selection.province)??selection.province:'Argentina',otherLabel=reference?provinceNames.get(reference)??reference:'Argentina';
 return <div className="v2-annual-parallel v2-list-flow v2-annual-story">
  <header className="v2-story-scope">{record.label} · {scope}</header>
  <div className="v2-tabs" role="group" aria-label="Indicador de la serie">{([['time','Tiempos'],['donors','Donación'],['stock','Cantidad']] as const).map(([id,label])=><button key={id} aria-pressed={metric===id} onClick={()=>setMetric(id)}>{label}</button>)}</div>
  <label className="v2-unified-compare">Comparar con <select aria-label="Territorio de comparación" value={compare} onChange={e=>setCompare(e.target.value)}><option value="none">Sin comparación</option>{selection.province&&<option value="ARGENTINA">Argentina</option>}{[...provinceNames].filter(([id])=>id!==selection.province).map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label>
  <p className="v2-context-finding" aria-live="polite">{anchor}</p>
  <div className="v2-story-visual v2-history-visual-full"><svg viewBox="0 0 600 340" className="v2-story-history-full" role="group" aria-label={`Evolución de ${unit}: ${label}${comparing?` y ${otherLabel}`:''}`}>
   <HistoryMarkers x={x} bottom={278} top={48} labelTop={24}/>
   {[0,maximum/2,maximum].map(n=><g key={n}><line x1="52" x2="552" y1={y(n)} y2={y(n)} stroke="currentColor" opacity=".12"/><text x="44" y={y(n)+4} textAnchor="end">{metric==='time'?decimal(n):integer(Math.round(n))}</text></g>)}
   {[{rows:primary,other:false,color:'var(--v2-accent)'},...(comparing?[{rows:secondary,other:true,color:'#a34e35'}]:[])].map(({rows,other,color})=><g key={String(other)}>
    {metric==='time'&&<path d={quantileBandPath(rows,x,y)} fill={color} fillOpacity=".1"/>}
    {metric==='time'?<><path d={path(rows,other,'median')} fill="none" stroke={color} strokeWidth="2.5"/><path d={path(rows,other,'mean')} fill="none" stroke={color} strokeWidth="2.5" strokeDasharray="6 4"/></>:<path d={path(rows,other)} fill="none" stroke={color} strokeWidth="2.5"/>}
    {rows.filter(row=>value(row,other)!==null).map(row=><circle key={row.year} cx={x(row.year)} cy={y(value(row,other)!)} r={row.year===record.year?5:3} fill={color} tabIndex={0} role="button" aria-label={`${other?otherLabel:label}, ${row.year}: ${decimal(value(row,other)!)} ${unit}`} onClick={()=>onYear(row.year)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onYear(row.year);}}}><title>{row.year}: {decimal(value(row,other)!)} {unit}</title></circle>)}
   </g>)}
   <line x1={x(record.year)} x2={x(record.year)} y1="48" y2="278" stroke="currentColor" strokeDasharray="3 4" opacity=".3"/>
   <text x="52" y="310">2005</text><text x="552" y="310" textAnchor="end">2025</text>
  </svg></div>
  <div className="v2-story-reading" aria-live="polite"><p><span style={{color:'var(--v2-accent)'}}>● {label}</span>: {value(record)===null?'s/d':decimal(value(record)!)} {unit} · {record.year}{comparing&&<><br/><span style={{color:'#a34e35'}}>● {otherLabel}</span>: {value(secondary.find(r=>r.year===record.year)!,true)===null?'s/d':decimal(value(secondary.find(r=>r.year===record.year)!,true)!)} {unit}</>}</p>
  {metric==='time'&&<p className="v2-quantile-legend">— Mediana y banda P25–P75 cuando están disponibles. ⋯ Media sin banda. Tiempos de quienes recibieron un trasplante; no predicen una espera individual.</p>}
  {metric==='donors'&&<p className="v2-quantile-legend">Donantes reales de todos los órganos, por establecimiento de origen. El filtro de lista no modifica esta serie.</p>}
  {metric==='stock'&&<p className="v2-quantile-legend">Inscripciones en la lista elegida al cierre anual, por residencia. Las cantidades no ajustan por población.</p>}
  </div>
 </div>;
}
