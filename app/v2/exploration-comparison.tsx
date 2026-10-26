'use client';
import {useMemo,useState} from 'react';
import raw from './annual-time.generated.json';
import flows from './annual-flows.generated.json';
import counts from './annual-list-counts.generated.json';
import quantiles from './annual-national-quantiles.generated.json';
import partial from './partial-2026.generated.json';
import {annualTimeDetail,unpackAnnualTimes,type CompactAnnualTime,type AnnualTimeSelection} from './annual-time-model';
import {comparisonHistory,type ComparisonYear} from './annual-comparison-model';
import {historyTime} from './annual-story-model';
import {selectFlow} from './annual-flow-model';
import {annualPmh} from './annual-pmh';
import {decimal,integer,type HistoryYear} from './universe-model';
const cells=unpackAnnualTimes(raw as CompactAnnualTime);
export default function ExplorationComparison({selection,record,renalNational,provinceNames}:{selection:AnnualTimeSelection;record:ComparisonYear;history:ComparisonYear[];renalNational:HistoryYear[];provinceNames:Map<string,string>}){
  const [province,setProvince]=useState(()=>{const keys=[...provinceNames.keys()];return keys.find(p=>p!==(selection.province??keys[0]))??'';});
  const [firstProvince,setFirstProvince]=useState(()=>[...provinceNames.keys()][0]??'');
  const firstSelection={...selection,province:selection.province??firstProvince};
  const secondProvince=province===firstSelection.province?[...provinceNames.keys()].find(p=>p!==firstSelection.province)??province:province;
  const target={...selection,province:secondProvince};
  const firstHistory=useMemo(()=>comparisonHistory(renalNational,firstSelection,raw.years.map(y=>annualTimeDetail(cells,y,firstSelection)),counts,partial,quantiles.rows),[renalNational,selection.list,selection.province,selection.age,firstProvince]);
  const first=firstHistory.find(r=>r.year===record.year);
  const alternate=useMemo(()=>comparisonHistory(renalNational,target,raw.years.map(y=>annualTimeDetail(cells,y,target)),counts,partial,quantiles.rows),[renalNational,selection.list,selection.province,selection.age,secondProvince]); // target is derived entirely from these filters
  const other=alternate.find(r=>r.year===record.year);
  if(!first||!other)return null;
  const format=(n:number,unit:string)=>unit==='inscripciones'?integer(n):decimal(n);
  const pmh=(n:number)=>new Intl.NumberFormat('es-AR',{minimumFractionDigits:2,maximumFractionDigits:2}).format(n);
  const name=(p:string|null)=>p?provinceNames.get(p)??p:'Argentina';
  const labelA=`${name(firstSelection.province)} · ${first.year}`,labelB=`${name(target.province)} · ${other.year}`;
  const flowA=selectFlow(flows,firstSelection.list,first.year,firstSelection.province,firstSelection.age),flowB=selectFlow(flows,target.list,other.year,target.province,target.age);
  const metrics=[{label:'Personas en lista al cierre',a:first.waitlist,b:other.waitlist,unit:'inscripciones'},{label:'Ingresos · Ing LE',a:flowA?.entries??null,b:flowB?.entries??null,unit:'inscripciones'},{label:'Egresos',a:flowA?.exits??null,b:flowB?.exits??null,unit:'inscripciones'}];
  const timeA=historyTime(first),timeB=historyTime(other);
  if(timeA.kind===timeB.kind)metrics.push({label:`${timeA.kind==='median'?'Mediana':'Media'} hasta trasplante`,a:timeA.value,b:timeB.value,unit:record.unit});
  const provinceMode=true;
  const rate=(value:number|null,province:string|null,year:number)=>annualPmh(value,province,year);
  const chartA=firstHistory;
  const chartValue=(row:ComparisonYear,province:string|null)=>provinceMode?rate(row.waitlist,province,row.year):row.waitlist;
  const ceiling=Math.max(1,...chartA.map(r=>chartValue(r,firstSelection.province)??0),...alternate.map(r=>chartValue(r,target.province)??0));
  const x=(y:number)=>30+(y-2005)/20*540,py=(n:number)=>150-n/ceiling*125;
  function path(rows:ComparisonYear[],province:string|null){return rows.filter(r=>!r.partial).map((r,i,all)=>{const value=chartValue(r,province);return value===null?'':`${i&&chartValue(all[i-1],province)!==null&&all[i-1].year===r.year-1?'L':'M'}${x(r.year)},${py(value)}`;}).join(' ');}
  const shown=(value:number|null,unit:string,province:string|null,selectedYear:number)=>provinceMode&&unit==='inscripciones'?rate(value,province,selectedYear):value;
  const formatted=(value:number|null,unit:string)=>value===null?'s/d':provinceMode&&unit==='inscripciones'?pmh(value):format(value,unit);
  return <div><div className="v2-comparison-controls">
    {!selection.province&&<label>Primera provincia<select value={firstProvince} onChange={e=>setFirstProvince(e.target.value)}>{[...provinceNames].map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>}
    <label>Segunda provincia<select value={secondProvince} onChange={e=>setProvince(e.target.value)}>{[...provinceNames].map(([id,label])=><option key={id} value={id} disabled={id===firstSelection.province}>{label}</option>)}</select></label>
  </div>
    <p>Azul: {labelA} · Violeta discontinuo: {labelB}</p>
    <svg viewBox="0 0 600 180" role="img" aria-label={provinceMode?'Personas en lista por millón de habitantes: ambas curvas con una escala común desde cero':'Personas en lista al cierre: ambas curvas con una escala común desde cero'}><line x1="30" x2="570" y1="150" y2="150" stroke="currentColor" opacity=".25"/><path d={path(chartA,firstSelection.province)} fill="none" stroke="#0052cc" strokeWidth="2"/><path d={path(alternate,target.province)} fill="none" stroke="#7400bd" strokeWidth="2" strokeDasharray="6 4"/>{[[first,'#0052cc',firstSelection.province],[other,'#7400bd',target.province]].map(([r,color,prov],i)=>{const row=r as ComparisonYear;const val=chartValue(row,prov as string|null);return val===null?null:<circle key={i} cx={x(row.year)} cy={py(val)} r="5" fill={color as string}/>;})}<text x="30" y="170">2005</text><text x="570" y="170" textAnchor="end">2025</text><text x="30" y="16">{provinceMode?`${pmh(ceiling)} PMH`:`${integer(ceiling)} inscripciones`}</text><text x="15" y="150">0</text></svg>
    <table><caption>Diferencias: segunda selección menos primera</caption><thead><tr><th>Medida</th><th>{labelA}</th><th>{labelB}</th><th>Diferencia</th></tr></thead><tbody>{metrics.map(m=>{const a=shown(m.a,m.unit,firstSelection.province,first.year),b=shown(m.b,m.unit,target.province,other.year),asRate=provinceMode&&m.unit==='inscripciones';return <tr key={m.label}><th>{m.label}<small>{asRate?'PMH':m.unit}</small></th><td>{formatted(a,m.unit)}{asRate&&m.a!==null&&<small>{integer(m.a)} registros</small>}</td><td>{formatted(b,m.unit)}{asRate&&m.b!==null&&<small>{integer(m.b)} registros</small>}</td><td>{a===null||b===null?'s/d':`${b-a>0?'+':''}${formatted(b-a,m.unit)}`}</td></tr>;})}</tbody></table>
    {timeA.kind!==timeB.kind&&<p>Los tiempos usan estadísticas distintas (mediana y media); no se calcula su diferencia.</p>}<p>Las cantidades en lista y los movimientos son registros de distintas poblaciones; el tiempo describe a quienes recibieron un trasplante. Los faltantes no son cero.</p>
  </div>;
}
