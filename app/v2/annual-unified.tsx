'use client';
import {useEffect,useMemo,useState} from 'react';
import raw from './annual-time.generated.json';
import counts from './annual-list-counts.generated.json';
import donation from './donation-context.generated.json';
import populations from './annual-population.generated.json';
import quantiles from './annual-national-quantiles.generated.json';
import {annualTimeDetail,unpackAnnualTimes,type CompactAnnualTime,type AnnualTimeSelection} from './annual-time-model';
import {comparisonHistory,type ComparisonYear} from './annual-comparison-model';
import {seriesPath,timeAnchor,timeValue,type PopulationTable,type TimeStatistic} from './annual-series-model';
import {decimal,integer,type HistoryYear} from './universe-model';
import {contextValue,type ContextUnit} from './annual-context-model';
import {changeFromBaseline} from './annual-insights-model';
import HistoryMarkers from './history-markers';
const cells=unpackAnnualTimes(raw as CompactAnnualTime),population=populations.population as PopulationTable;
const donors=donation.rows as Record<string,{organs:number}|null>;
export type AnnualContext='none'|'donors'|'stock'|'transplants';
const colors=['#1768ac','#c45116'];

const covidGlobal=(()=>{
 const years=[2017,2018,2019,2020];
 const expected=raw.lists.length*raw.provinces.length*raw.ages.length;
 const tx=years.map(year=>{const rows=cells.filter(c=>c.year===year);return {year,value:rows.length===expected?rows.reduce((sum,c)=>sum+c.n,0):null};});
 const d=years.map(year=>({year,value:donors[`${year}|ARGENTINA`]?.organs??null}));
 return {tx:changeFromBaseline(tx,2020,[2017,2018,2019]),donors:changeFromBaseline(d,2020,[2017,2018,2019])};
})();

export default function AnnualUnified({record,history,selection,onYear,provinceNames,renalNational,scope,context='none',contextUnit='pmh'}:{record:ComparisonYear;history:ComparisonYear[];selection:AnnualTimeSelection;onYear:(year:number)=>void;provinceNames:Map<string,string>;renalNational:HistoryYear[];scope:string;context?:AnnualContext;contextUnit?:ContextUnit}){
 const [compare,setCompare]=useState('none');
 const [covidOpen,setCovidOpen]=useState(false);
 const [activePoint,setActivePoint]=useState<{year:number;kind:'time'|'aux';territory:string}|null>(null);
 useEffect(()=>{setActivePoint(null);setCovidOpen(false);},[selection.list,selection.province,compare]);
 useEffect(()=>{setActivePoint(null);},[context,contextUnit]);
 const reference=compare==='ARGENTINA'?null:compare,comparing=compare!=='none'&&reference!==selection.province;
 const comparison=useMemo(()=>{const target={...selection,province:reference};return comparisonHistory(renalNational,target,raw.years.map(year=>annualTimeDetail(cells,year,target)),counts,quantiles.rows);},[selection,reference,renalNational]);
 const primary=history.filter(row=>!row.partial&&row.year<=2025),secondary=comparison.filter(row=>!row.partial&&row.year<=2025);
 const statistic:TimeStatistic='mean',name='Media';
 const label=selection.province?provinceNames.get(selection.province)??selection.province:'Argentina',otherLabel=reference?provinceNames.get(reference)??reference:'Argentina';
 const lines=[{rows:primary,territory:selection.province??'ARGENTINA',label,color:colors[0]},...(comparing?[{rows:secondary,territory:reference??'ARGENTINA',label:otherLabel,color:colors[1]}]:[])];
 const value=(row:ComparisonYear|undefined)=>row?.unit===record.unit?timeValue(row,statistic):null;
 const rawAuxiliary=(row:ComparisonYear,territory:string)=>context==='stock'?row.waitlist:context==='transplants'?(row.timeStatus==='sin_datos'?null:row.n):donors[`${row.year}|${territory}`]?.organs??null;
 const auxiliary=(row:ComparisonYear,territory:string)=>contextValue(rawAuxiliary(row,territory),population[String(row.year)]?.[territory],contextUnit);
 const maximum=Math.max(1,...lines.flatMap(line=>line.rows.flatMap(row=>[value(row)??0,0])));
 const contextMaximum=Math.max(1,...lines.flatMap(line=>line.rows.map(row=>auxiliary(row,line.territory)??0)));
 const x=(year:number)=>55+(year-2005)/20*480,y=(n:number)=>278-n/maximum*214,contextY=(n:number)=>278-n/contextMaximum*214;
 const hasTime=lines.some(line=>line.rows.some(row=>value(row)!==null));
 const contextLabel=context==='stock'?'Tamaño de la lista de espera cada año':context==='transplants'?'Receptores trasplantados':'Donación de órganos';
 const axisContextLabel=context==='stock'?'Tamaño de la lista':context==='transplants'?'Receptores':'Donación de órganos';
 const absUnitLabel=context==='stock'?'inscripciones':context==='transplants'?'receptores':'donantes';
 const contextUnitLabel=contextUnit==='pmh'?'PMH':absUnitLabel;
 const formatContextDetail=(row:ComparisonYear,territory:string)=>{
  const rate=auxiliary(row,territory),rawVal=rawAuxiliary(row,territory);
  if(rate===null)return 's/d';
  if(contextUnit==='pmh')return rawVal!=null?`${decimal(rate)} PMH (${integer(rawVal)} ${absUnitLabel})`:`${decimal(rate)} PMH`;
  return `${integer(rate)} ${absUnitLabel}`;
 };
 const compact=(n:number)=>new Intl.NumberFormat('es-AR',{notation:'compact',maximumFractionDigits:1}).format(n);
 function toggleCovid(){
  if(!covidOpen)onYear(2020);
  setCovidOpen(!covidOpen);
 }
 function selectPoint(year:number,kind:'time'|'aux',territory:string){
  onYear(year);
  setActivePoint(current=>current&&current.year===year&&current.kind===kind&&current.territory===territory?null:{year,kind,territory});
 }
 const activeBadge=(()=>{
  if(!activePoint||activePoint.year!==record.year)return null;
  const line=lines.find(l=>l.territory===activePoint.territory)??lines[0];
  const row=line.rows.find(r=>r.year===record.year);
  if(!row)return null;
  if(activePoint.kind==='aux'&&context!=='none'){
   const auxVal=auxiliary(row,line.territory);
   if(auxVal===null)return null;
   const text=`${row.year} · ${formatContextDetail(row,line.territory)}`;
   return {px:x(row.year),py:contextY(auxVal),text,color:line.color};
  }
  const v=value(row);
  if(v===null)return null;
  const text=`${row.year} · ${name}: ${decimal(v)} ${record.unit}`;
  return {px:x(row.year),py:y(v),text,color:line.color};
 })();
 return <div className="v2-annual-parallel v2-list-flow v2-annual-story">
  <header className="v2-story-scope">{record.label} · {scope}</header>
  <div className="v2-series-controls"><label>Comparar con <select aria-label="Territorio de comparación" value={compare} onChange={e=>setCompare(e.target.value)}><option value="none">Sin comparación</option>{selection.province&&<option value="ARGENTINA">Argentina</option>}{[...provinceNames].filter(([id])=>id!==selection.province).map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label></div>
  <p className="v2-context-finding" aria-live="polite">{timeAnchor(primary,record.year,statistic,label)}</p>
  <div className="v2-series-legend" aria-label="Leyenda del gráfico">{lines.map(line=><div key={line.territory}><span><i style={{borderColor:line.color}}/> {line.label} · tiempo medio</span>{context!=='none'&&<span><i className="v2-legend-dashed" style={{borderColor:line.color}}/> {line.label} · {contextLabel.toLowerCase()} ({contextUnitLabel})</span>}</div>)}</div>
  <div className="v2-story-visual v2-history-visual-full"><svg viewBox="0 0 620 350" className="v2-story-history-full" role="group" aria-label={`${name} de espera en ${record.unit}: ${label}${comparing?` y ${otherLabel}`:''}${context!=='none'?`; eje auxiliar: ${contextLabel} en ${contextUnitLabel}`:''}`}>
   <HistoryMarkers x={x} bottom={278} top={64} labelTop={40} active={covidOpen} onToggle={toggleCovid}/>
   <text x="55" y="18" className="v2-axis-title">{name} · {record.unit}</text>{context!=='none'&&<text x="535" y="18" textAnchor="end" className="v2-axis-title">{axisContextLabel} · {contextUnitLabel}</text>}
   {[0,maximum/2,maximum].map(n=><g key={n}><line x1="55" x2="535" y1={y(n)} y2={y(n)} stroke="currentColor" opacity=".12"/><text x="46" y={y(n)+4} textAnchor="end">{decimal(n)}</text></g>)}
   {context!=='none'&&[0,contextMaximum/2,contextMaximum].map(n=><text key={n} x="545" y={contextY(n)+4} opacity=".65">{compact(n)}</text>)}
   {lines.map(line=><g key={line.territory}>
    {context!=='none'&&<path d={seriesPath(line.rows,row=>auxiliary(row,line.territory),x,contextY)} fill="none" stroke={line.color} strokeOpacity=".65" strokeWidth="2" strokeDasharray="4 5"/>}
    <path d={seriesPath(line.rows,value,x,y)} fill="none" stroke={line.color} strokeWidth="3"/>
    {context!=='none'&&line.rows.filter(row=>auxiliary(row,line.territory)!==null).map(row=>{
     const auxVal=auxiliary(row,line.territory)!;
     const detail=formatContextDetail(row,line.territory);
     const isPointActive=activePoint?.year===row.year&&activePoint?.kind==='aux'&&activePoint?.territory===line.territory;
     const isSelected=row.year===record.year;
     return <circle key={`aux-${row.year}`} cx={x(row.year)} cy={contextY(auxVal)} r={isSelected?5.5:3.5} fill="#fbf9f4" stroke={line.color} strokeWidth={isSelected?2.5:1.8} style={{cursor:'pointer'}} tabIndex={0} role="button" aria-pressed={isPointActive} aria-label={`${line.label}, ${row.year}: ${contextLabel} ${detail}`} onClick={()=>selectPoint(row.year,'aux',line.territory)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectPoint(row.year,'aux',line.territory);}}}><title>{`${line.label} · ${row.year}: ${contextLabel} ${detail}`}</title></circle>;
    })}
    {line.rows.filter(row=>value(row)!==null).map(row=>{
     const isPointActive=activePoint?.year===row.year&&activePoint?.kind==='time'&&activePoint?.territory===line.territory;
     return <circle key={row.year} cx={x(row.year)} cy={y(value(row)!)} r={row.year===record.year?5:3} fill={line.color} style={{cursor:'pointer'}} tabIndex={0} role="button" aria-pressed={isPointActive} aria-label={`${line.label}, ${row.year}: ${name} ${decimal(value(row)!)} ${record.unit}`} onClick={()=>selectPoint(row.year,'time',line.territory)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectPoint(row.year,'time',line.territory);}}}><title>{`${line.label} · ${row.year}: ${name} ${decimal(value(row)!)} ${record.unit}${context!=='none'?` · ${contextLabel}: ${formatContextDetail(row,line.territory)}`:''}`}</title></circle>;
    })}
   </g>)}
   <line x1={x(record.year)} x2={x(record.year)} y1="64" y2="278" stroke="currentColor" strokeDasharray="3 4" opacity=".3"/>
   {activeBadge&&(()=>{
    const w=Math.max(140,activeBadge.text.length*6.4+20);
    const bx=Math.max(55+w/2,Math.min(535-w/2,activeBadge.px));
    const by=activeBadge.py>100?activeBadge.py-26:activeBadge.py+26;
    return <g className="v2-point-badge" style={{cursor:'pointer'}} onClick={()=>setActivePoint(null)}>
     <rect x={bx-w/2} y={by-13} width={w} height={22} rx="5" fill="#181816" opacity=".92"/>
     <text x={bx} y={by+2} textAnchor="middle" fill="#fbf9f4" fontSize="11" fontWeight="600">{activeBadge.text}</text>
    </g>;
   })()}
   {(record.year===2005||record.year>=2008)&&<text x="55" y="310" fontWeight={record.year===2005?'700':undefined}>2005</text>}
   {record.year>2005&&record.year<2025&&<text x={x(record.year)} y="310" textAnchor="middle" fontWeight="700">{record.year}</text>}
   {(record.year===2025||record.year<=2022)&&<text x="535" y="310" textAnchor="end" fontWeight={record.year===2025?'700':undefined}>2025</text>}
  </svg></div>
  {covidOpen&&<aside className="v2-covid-callout" aria-live="polite">
   <div className="v2-covid-callout-header">
    <strong>COVID-19 · 2020 frente a 2017–2019</strong>
    <button type="button" onClick={()=>setCovidOpen(false)} aria-label="Cerrar detalle de COVID-19">Cerrar ×</button>
   </div>
   <p>En 2020 se observó una reducción del <strong>{covidGlobal.tx===null?'s/d':`${decimal(covidGlobal.tx.percentReduction)}%`}</strong> en los receptores de las cohortes relevadas y del <strong>{covidGlobal.donors===null?'s/d':`${decimal(covidGlobal.donors.percentReduction)}%`}</strong> en los donantes reales de órganos, respecto de la media de 2017–2019.</p>
   <small>Receptores de las 13 listas con tiempos publicados y donantes de órganos del total nacional: son conjuntos distintos. La coincidencia temporal no atribuye toda la variación a una única causa.</small>
  </aside>}
  <div className="v2-story-reading" aria-live="polite"><p><strong>{name} de espera · {record.year}</strong>{lines.map(line=>{const row=line.rows.find(row=>row.year===record.year),n=value(row);return <span key={line.territory} className="v2-series-value"><span style={{color:line.color}}>● {line.label}</span> {n===null?'s/d':`${decimal(n)} ${record.unit}`}{context!=='none'&&row&&<small> ⋯ {contextLabel}: <strong>{formatContextDetail(row,line.territory)}</strong></small>}</span>;})}</p>
  {!hasTime&&<p>Sin {name.toLowerCase()} publicada para esta selección. Elegí otra lista o territorio.</p>}
  <p className="v2-quantile-legend">Línea continua: {name.toLowerCase()} de espera{selection.list==='TOTAL'?' (media ponderada de las 13 listas relevadas, en meses)':''}. {comparing?'Ambos territorios usan la misma medida. ':''}Tocá cualquier punto de las curvas para ver u ocultar el dato exacto de ese año. Hacé clic en <strong>COVID-19 ⓘ</strong> para comparar 2020 con los años previos.</p>
  {context!=='none'&&<p className="v2-quantile-legend">⋯ {contextLabel} en el eje derecho, {contextUnit==='pmh'?'por millón de habitantes de cada territorio y año':'en cantidades absolutas'}. Los tiempos permanecen en {record.unit}. Escala independiente: la proximidad de curvas no mide correlación ni demuestra causalidad.{context==='donors'?' Donantes de todos los órganos, por establecimiento de origen.':context==='transplants'?' Receptores de las cohortes con tiempos publicados para la selección y territorio elegidos, por año de desclampeo; no representa todos los trasplantes del país.':''}</p>}
  <p className="v2-quantile-legend">Tiempos de quienes recibieron un trasplante; no predicen la espera de quienes siguen en lista.</p>
  </div>
 </div>;
}
