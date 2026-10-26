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
import {decimal,integer,type HistoryYear} from './universe-model';
const cells=unpackAnnualTimes(raw as CompactAnnualTime);
export default function ExplorationComparison({selection,record,history,renalNational,provinceNames}:{selection:AnnualTimeSelection;record:ComparisonYear;history:ComparisonYear[];renalNational:HistoryYear[];provinceNames:Map<string,string>}){
  const [mode,setMode]=useState('year'),[year,setYear]=useState(2024),[province,setProvince]=useState(()=>[...provinceNames.keys()].find(p=>p!==selection.province)??'');
  const target={...selection,province:mode==='province'?province:selection.province};
  const alternate=useMemo(()=>comparisonHistory(renalNational,target,raw.years.map(y=>annualTimeDetail(cells,y,target)),counts,partial,quantiles.rows),[renalNational,selection.list,selection.province,selection.age,mode,province]); // target is derived entirely from these filters
  const other=alternate.find(r=>r.year===(mode==='year'?year:record.year));
  if(!other)return null;
  const format=(n:number,unit:string)=>unit==='inscripciones'?integer(n):decimal(n);
  const name=(p:string|null)=>p?provinceNames.get(p)??p:'Argentina';
  const labelA=`${name(selection.province)} · ${record.year}`,labelB=`${name(target.province)} · ${other.year}`;
  const flowA=selectFlow(flows,selection.list,record.year,selection.province,selection.age),flowB=selectFlow(flows,target.list,other.year,target.province,target.age);
  const metrics=[{label:'Stock al cierre',a:record.waitlist,b:other.waitlist,unit:'inscripciones'},{label:'Ingresos · Ing LE',a:flowA?.entries??null,b:flowB?.entries??null,unit:'inscripciones'},{label:'Egresos',a:flowA?.exits??null,b:flowB?.exits??null,unit:'inscripciones'}];
  const timeA=historyTime(record),timeB=historyTime(other);
  if(timeA.kind===timeB.kind)metrics.push({label:`${timeA.kind==='median'?'Mediana':'Media'} hasta trasplante`,a:timeA.value,b:timeB.value,unit:record.unit});
  const ceiling=Math.max(1,...history.map(r=>r.waitlist??0),...alternate.map(r=>r.waitlist??0));
  const x=(y:number)=>30+(y-2005)/20*540,py=(n:number)=>150-n/ceiling*125;
  function path(rows:ComparisonYear[]){return rows.filter(r=>!r.partial).map((r,i,all)=>r.waitlist===null?'':`${i&&all[i-1].waitlist!==null&&all[i-1].year===r.year-1?'L':'M'}${x(r.year)},${py(r.waitlist)}`).join(' ');}
  return <details className="v2-comparison"><summary>Comparar dos años o provincias</summary><div className="v2-comparison-controls"><label>Comparar<select value={mode} onChange={e=>setMode(e.target.value)}><option value="year">Dos años</option><option value="province">Dos provincias</option></select></label>{mode==='year'?<label>Segundo año<select value={year} onChange={e=>setYear(Number(e.target.value))}>{history.filter(r=>!r.partial).map(r=><option key={r.year}>{r.year}</option>)}</select></label>:<label>Segunda provincia<select value={province} onChange={e=>setProvince(e.target.value)}>{[...provinceNames].map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>}</div>
    <p>Azul: {labelA} · Violeta discontinuo: {labelB}</p>
    <svg viewBox="0 0 600 180" role="img" aria-label="Stock publicado: ambas curvas con una escala común desde cero"><line x1="30" x2="570" y1="150" y2="150" stroke="currentColor" opacity=".25"/><path d={path(history)} fill="none" stroke="#0052cc" strokeWidth="2"/><path d={path(alternate)} fill="none" stroke="#7400bd" strokeWidth="2" strokeDasharray="6 4"/>{[[record,'#0052cc'],[other,'#7400bd']].map(([r,color],i)=>{const row=r as ComparisonYear;return row.waitlist===null?null:<circle key={i} cx={x(row.year)} cy={py(row.waitlist)} r="5" fill={color as string}/>;})}<text x="30" y="170">2005</text><text x="570" y="170" textAnchor="end">2025</text><text x="30" y="16">{integer(ceiling)} inscripciones</text><text x="15" y="150">0</text></svg>
    <table><caption>Diferencias: segunda selección menos primera</caption><thead><tr><th>Medida</th><th>{labelA}</th><th>{labelB}</th><th>Diferencia</th></tr></thead><tbody>{metrics.map(m=><tr key={m.label}><th>{m.label}<small>{m.unit}</small></th><td>{m.a===null?'s/d':format(m.a,m.unit)}</td><td>{m.b===null?'s/d':format(m.b,m.unit)}</td><td>{m.a===null||m.b===null?'s/d':`${m.b-m.a>0?'+':''}${format(m.b-m.a,m.unit)}`}</td></tr>)}</tbody></table>
    {timeA.kind!==timeB.kind&&<p>Los tiempos usan estadísticas distintas (mediana y media); no se calcula su diferencia.</p>}<p>Stock y movimientos son inscripciones; el tiempo describe receptores trasplantados. Los faltantes no son cero.</p>
  </details>;
}
