'use client';
import {useMemo,useState} from 'react';
import raw from './annual-time.generated.json';
import counts from './annual-list-counts.generated.json';
import donation from './donation-context.generated.json';
import populations from './annual-population.generated.json';
import quantiles from './annual-national-quantiles.generated.json';
import {annualTimeDetail,unpackAnnualTimes,type CompactAnnualTime,type AnnualTimeSelection} from './annual-time-model';
import {comparisonHistory,type ComparisonYear} from './annual-comparison-model';
import {perMillion,seriesPath,sharedStatistic,timeAnchor,timeValue,type PopulationTable,type TimeStatistic} from './annual-series-model';
import {quantileBandPath} from './quantile-band-model';
import {decimal,type HistoryYear} from './universe-model';
import HistoryMarkers from './history-markers';
const cells=unpackAnnualTimes(raw as CompactAnnualTime),population=populations.population as PopulationTable;
const donors=donation.rows as Record<string,{organs:number}|null>;
type Context='none'|'donors'|'stock';
const colors=['#1768ac','#c45116'];
export default function AnnualUnified({record,history,selection,onYear,provinceNames,renalNational,scope}:{record:ComparisonYear;history:ComparisonYear[];selection:AnnualTimeSelection;onYear:(year:number)=>void;provinceNames:Map<string,string>;renalNational:HistoryYear[];scope:string}){
 const [context,setContext]=useState<Context>('none'),[compare,setCompare]=useState('none'),[preference,setPreference]=useState<'auto'|TimeStatistic>('auto');
 const reference=compare==='ARGENTINA'?null:compare,comparing=compare!=='none'&&reference!==selection.province;
 const comparison=useMemo(()=>{const target={...selection,province:reference};return comparisonHistory(renalNational,target,raw.years.map(year=>annualTimeDetail(cells,year,target)),counts,quantiles.rows);},[selection,reference,renalNational]);
 const primary=history.filter(row=>!row.partial&&row.year<=2025),secondary=comparison.filter(row=>!row.partial&&row.year<=2025);
 const statistic=preference==='auto'?sharedStatistic(primary,secondary,comparing):preference,name=statistic==='median'?'Mediana':'Media';
 const label=selection.province?provinceNames.get(selection.province)??selection.province:'Argentina',otherLabel=reference?provinceNames.get(reference)??reference:'Argentina';
 const lines=[{rows:primary,territory:selection.province??'ARGENTINA',label,color:colors[0]},...(comparing?[{rows:secondary,territory:reference??'ARGENTINA',label:otherLabel,color:colors[1]}]:[])];
 const value=(row:ComparisonYear|undefined)=>row?.unit===record.unit?timeValue(row,statistic):null;
 const auxiliary=(row:ComparisonYear,territory:string)=>perMillion(context==='stock'?row.waitlist:donors[`${row.year}|${territory}`]?.organs,population[String(row.year)]?.[territory]);
 const maximum=Math.max(1,...lines.flatMap(line=>line.rows.flatMap(row=>[value(row)??0,statistic==='median'&&value(row)!==null?row.p75??0:0])));
 const contextMaximum=Math.max(1,...lines.flatMap(line=>line.rows.map(row=>auxiliary(row,line.territory)??0)));
 const x=(year:number)=>55+(year-2005)/20*480,y=(n:number)=>278-n/maximum*214,contextY=(n:number)=>278-n/contextMaximum*214;
 const hasTime=lines.some(line=>line.rows.some(row=>value(row)!==null));
 const contextLabel=context==='stock'?'Lista al cierre':'Donación de órganos';
 return <div className="v2-annual-parallel v2-list-flow v2-annual-story">
  <header className="v2-story-scope">{record.label} · {scope}</header>
  <div className="v2-series-controls"><label>Tiempo de espera <select aria-label="Estadística del tiempo de espera" value={preference} onChange={e=>setPreference(e.target.value as typeof preference)}><option value="auto">Automática · misma medida</option><option value="median">Mediana</option><option value="mean">Media</option></select></label>
  <label>Comparar con <select aria-label="Territorio de comparación" value={compare} onChange={e=>setCompare(e.target.value)}><option value="none">Sin comparación</option>{selection.province&&<option value="ARGENTINA">Argentina</option>}{[...provinceNames].filter(([id])=>id!==selection.province).map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label>
  <label>Contexto auxiliar <select aria-label="Contexto auxiliar en PMH" value={context} onChange={e=>setContext(e.target.value as Context)}><option value="none">Sólo la espera</option><option value="donors">Donación · PMH</option><option value="stock">Lista al cierre · PMH</option></select></label></div>
  <p className="v2-context-finding" aria-live="polite">{timeAnchor(primary,record.year,statistic,label)}</p>
  <div className="v2-story-visual v2-history-visual-full"><svg viewBox="0 0 620 350" className="v2-story-history-full" role="group" aria-label={`${name} de espera en ${record.unit}: ${label}${comparing?` y ${otherLabel}`:''}${context!=='none'?`; eje auxiliar: ${contextLabel} en PMH`:''}`}>
   <HistoryMarkers x={x} bottom={278} top={64} labelTop={40}/>
   <text x="55" y="18">{name} · {record.unit}</text>{context!=='none'&&<text x="535" y="18" textAnchor="end">Contexto · PMH</text>}
   {[0,maximum/2,maximum].map(n=><g key={n}><line x1="55" x2="535" y1={y(n)} y2={y(n)} stroke="currentColor" opacity=".12"/><text x="46" y={y(n)+4} textAnchor="end">{decimal(n)}</text></g>)}
   {context!=='none'&&[0,contextMaximum/2,contextMaximum].map(n=><text key={n} x="545" y={contextY(n)+4} opacity=".65">{decimal(n)}</text>)}
   {lines.map(line=><g key={line.territory}>
    {context!=='none'&&<path d={seriesPath(line.rows,row=>auxiliary(row,line.territory),x,contextY)} fill="none" stroke={line.color} strokeOpacity=".55" strokeWidth="1.6" strokeDasharray="3 6"/>}
    {statistic==='median'&&<path d={quantileBandPath(line.rows,x,y)} fill={line.color} fillOpacity=".09"/>}
    <path d={seriesPath(line.rows,value,x,y)} fill="none" stroke={line.color} strokeWidth="3"/>
    {line.rows.filter(row=>value(row)!==null).map(row=><circle key={row.year} cx={x(row.year)} cy={y(value(row)!)} r={row.year===record.year?5:3} fill={line.color} tabIndex={0} role="button" aria-pressed={row.year===record.year} aria-label={`${line.label}, ${row.year}: ${name} ${decimal(value(row)!)} ${record.unit}`} onClick={()=>onYear(row.year)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onYear(row.year);}}}><title>{line.label} · {row.year}: {name} {decimal(value(row)!)} {record.unit}{context!=='none'?` · ${contextLabel}: ${auxiliary(row,line.territory)===null?'s/d':decimal(auxiliary(row,line.territory)!)} PMH`:''}</title></circle>)}
   </g>)}
   <line x1={x(record.year)} x2={x(record.year)} y1="64" y2="278" stroke="currentColor" strokeDasharray="3 4" opacity=".3"/>
   <text x="55" y="310">2005</text><text x="535" y="310" textAnchor="end">2025</text>
  </svg></div>
  <div className="v2-story-reading" aria-live="polite"><p><strong>{name} de espera · {record.year}</strong>{lines.map(line=>{const row=line.rows.find(row=>row.year===record.year),n=value(row),rate=row?auxiliary(row,line.territory):null;return <span key={line.territory} className="v2-series-value"><span style={{color:line.color}}>● {line.label}</span>: {n===null?'s/d':`${decimal(n)} ${record.unit}`}{context!=='none'&&<small> ⋯ {contextLabel}: {rate===null?'s/d':`${decimal(rate)} PMH`}</small>}</span>;})}</p>
  {!hasTime&&<p>Sin {name.toLowerCase()} publicada para esta selección. Probá la otra estadística.</p>}
  <p className="v2-quantile-legend">Línea continua: {name.toLowerCase()} de espera{statistic==='median'?'; banda P25–P75 de la misma cohorte':''}. {comparing?'Ambos territorios usan la misma medida. ':''}Los faltantes quedan como huecos.</p>
  {context!=='none'&&<p className="v2-quantile-legend">⋯ {contextLabel} en el eje derecho, por millón de habitantes de cada territorio y año. Escala independiente: la proximidad de curvas no mide correlación ni demuestra causalidad.{context==='donors'?' Donantes de todos los órganos, por establecimiento de origen.':''}</p>}
  <p className="v2-quantile-legend">Tiempos de quienes recibieron un trasplante; no predicen la espera de quienes siguen en lista.</p>
  </div>
 </div>;
}
