'use client';
import {useState} from 'react';
import diagnoses from './current-diagnoses.generated.json' with {type:'json'};
import {decimal,integer} from './universe-model';
import type {MapAge,MapSex} from './map-demographics-model';

type Diagnosis={code:string;label:string;value:number};
type Entry={total:number|null;diagnoses:Diagnosis[];state:string};
const colors=['#b74d38','#c77c53','#a8664d','#d09a6d','#a87964'];

export function currentDiagnosisFor(list:string|null,province:string|null,age:MapAge,sex:MapSex):Entry|undefined{
  if(!list)return undefined;
  return (diagnoses.rows as Record<string,Entry>)[`${list}|${province??'ARGENTINA'}|${age}|${sex}`];
}

export default function CurrentDiagnoses({list,province,age,sex,seniority,onChooseList}:{list:string|null;province:string|null;age:MapAge;sex:MapSex;seniority:string|null;onChooseList:()=>void}){
  const [selected,setSelected]=useState<string|null>(null);
  const entry=currentDiagnosisFor(list,province,age,sex);
  const ordered=[...(entry?.diagnoses??[])].sort((a,b)=>b.value-a.value||a.code.localeCompare(b.code));
  const first=ordered.slice(0,4),rest=ordered.slice(4);
  const bars=[...first.map(d=>({id:d.code,label:d.label,value:d.value})),...(rest.length?[{id:'other',label:'Otros diagnósticos',value:rest.reduce((sum,d)=>sum+d.value,0)}]:[])];
  const maximum=Math.max(1,...bars.map(d=>d.value));
  const chosen=bars.find(d=>d.id===selected)||rest.find(d=>d.code===selected);
  return <div className="v2-current-diagnoses">
    <header><p>Inscripciones · 01/01–24/10/2026</p><h3>Diagnóstico principal</h3><span>{list?`${list} · ${province??'Argentina'}`:'Elegí una lista para ver sus diagnósticos'}</span></header>
    {!list?<button type="button" className="v2-current-select" onClick={onChooseList}>Elegir una lista ↗</button>:!entry?<p>Este cruce no está disponible.</p>:entry.total===null?<p>CRESI no publicó resultado para esta selección. No se interpreta como cero.</p>:<>
      <p className="v2-current-total"><strong>{integer(entry.total)}</strong> inscripciones en este cruce</p>
      <div className="v2-current-bars">{bars.map((bar,index)=>{
        const percent=entry.total?bar.value/entry.total*100:0;
        return <button type="button" key={bar.id} aria-pressed={selected===bar.id} onClick={()=>setSelected(selected===bar.id?null:bar.id)}>
          <span className="v2-current-bar-label"><span>{bar.label}</span><strong>{integer(bar.value)} · {decimal(percent)}%</strong></span>
          <i className="v2-current-dot-track" aria-hidden="true"><i style={{width:`${bar.value/maximum*100}%`,color:colors[index]}}/></i>
        </button>;
      })}</div>
      {chosen&&<p className="v2-current-reading" aria-live="polite">{chosen.label}: {integer(chosen.value)} de {integer(entry.total)} inscripciones ({decimal(entry.total?chosen.value/entry.total*100:0)}%).</p>}
      {rest.length>0&&<details className="v2-current-details"><summary>Desplegar otros diagnósticos</summary><div>{rest.map(d=><button type="button" key={d.code} aria-pressed={selected===d.code} onClick={()=>setSelected(selected===d.code?null:d.code)}><span>{d.label}</span><strong>{integer(d.value)} · {decimal(entry.total?d.value/entry.total*100:0)}%</strong></button>)}</div></details>}
      {seniority&&<p className="v2-current-unavailable">El reporte de diagnósticos no incluye el cruce por antigüedad elegido.</p>}
    </>}
  </div>;
}
