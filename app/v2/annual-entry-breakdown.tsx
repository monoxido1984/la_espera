'use client';
import {useId,useRef} from 'react';
import data from './annual-entries.generated.json';
import {integer} from './universe-model';
type Entry={total:number|null;state:string;diagnoses:{code:string;label:string;value:number}[]};
export default function AnnualEntryBreakdown({list,year,province,age,flowEntries}:{list:string;year:number;province:string|null;age:string;flowEntries:number|null}){
  const dialog=useRef<HTMLDialogElement>(null),id=useId();
  if(age!=='all')return <p>Ingresos por diagnóstico: sin cruce por edad.</p>;
  const entry=(data.rows as Record<string,Entry>)[`${list}|${year}|${province??'ARGENTINA'}`];
  if(!entry)return null;
  const sorted=[...entry.diagnoses].sort((a,b)=>b.value-a.value||a.code.localeCompare(b.code));
  const top=sorted.slice(0,10),others=sorted.slice(10);
  const bars=[...top.map(d=>({label:d.label,value:d.value})),{label:'Otros',value:others.reduce((sum,d)=>sum+d.value,0)}];
  const maximum=Math.max(1,...bars.map(d=>d.value));
  const colors=['#0052cc','#008a3b','#d60036','#7400bd','#e24b13','#007f86','#a63c87','#536d20','#a15200','#334cb3','#617f87'];
  const step=Math.min(3,Math.sqrt(32*205/maximum)),cols=Math.max(1,Math.floor(32/step));
  return <div className="v2-entry-breakdown">
    {entry.total===null?<p>CRESI respondió «no existe resultado» para estos ingresos.</p>:<svg viewBox="0 0 600 360" role="img" aria-label={`Diagnósticos de ingreso: ${bars.map(d=>`${d.label}: ${integer(d.value)}`).join('; ')}`} style={{width:'100%',display:'block'}}>
      {bars.map((d,i)=>{
        const center=40+i*52;
        return <g key={d.label+'-'+i}>
          <title>{d.label}: {integer(d.value)}</title>
          {Array.from({length:d.value},(_,n)=><circle key={n} cx={center-16+(n%cols+.5)*step} cy={245-(Math.floor(n/cols)+.5)*step} r={step*.43} fill={colors[i]}/>)}
          <text x={center} y={Math.max(20,235-Math.ceil(d.value/cols)*step)} fontSize="12" textAnchor="middle">{integer(d.value)}</text>
          <text x={center} y="265" fontSize="12" textAnchor="middle">{i===bars.length-1?'Otros':i+1}</text>
        </g>;
      })}
      <line x1="20" x2="580" y1="247" y2="247" stroke="currentColor" opacity=".16"/>
      <text x="20" y="300" fontSize="13">Diez diagnósticos más frecuentes y el resto agrupado · {integer(entry.total)} ingresos</text>
    </svg>}
    {entry.total!==null&&<div style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:'6px 18px',maxHeight:'150px',overflowY:'auto',fontSize:'14px'}} aria-label="Referencias de diagnósticos de ingreso">
      {bars.map((d,i)=><div key={i} style={{display:'flex',gap:'7px',alignItems:'baseline'}}><i aria-hidden="true" style={{background:colors[i],width:'8px',height:'8px',flexShrink:0}}/><span>{i===bars.length-1?'Otros':`${i+1}. ${d.label}`}</span><strong style={{marginLeft:'auto'}}>{integer(d.value)}</strong></div>)}
    </div>}
    <button type="button" className="v2-exit-trigger" aria-haspopup="dialog" aria-controls={id} onClick={()=>dialog.current?.showModal()}>Otros · ver todos los diagnósticos ↗</button>
    <dialog ref={dialog} id={id} className="v2-exit-dialog" aria-labelledby={`${id}-title`}>
      <header><h4 id={`${id}-title`}>Ingresos por diagnóstico · {year}</h4><button type="button" onClick={()=>dialog.current?.close()} aria-label="Cerrar diagnósticos">Cerrar ×</button></header>
      <div className="v2-exit-dialog-body">
        <p>{province??'Argentina'} · todas las edades. Inscripciones durante el año, en cualquier situación posterior.</p>
        {entry.total===null?<p>CRESI respondió «no existe resultado». No se interpreta como cero.</p>:<>
          <p>Total por fecha de inscripción: <strong>{integer(entry.total)}</strong>.</p>
          {flowEntries!==null&&entry.total!==flowEntries&&<p>La barra usa «Ing LE» del reporte de prevalencia: {integer(flowEntries)}. Difiere de este reporte en {integer(entry.total-flowEntries)} registros; no se mezclan ambos totales.</p>}
          {entry.diagnoses.map(d=><div className="v2-exit-row" key={d.code}><span>{d.label}<small>Código CRESI: {d.code}</small></span><strong>{integer(d.value)}</strong></div>)}
        </>}
        <p>Diagnóstico principal publicado; no identifica una causa administrativa de ingreso ni demuestra causalidad. Se conservan los códigos y etiquetas originales.</p>
        <a href={`${process.env.NEXT_PUBLIC_BASE_PATH??''}/datos/ingresos-anuales.json`} download>Descargar cifras ↗</a>{' · '}<a href={`${process.env.NEXT_PUBLIC_BASE_PATH??''}/datos/fuentes-ingresos-anuales.json`} download>Fuentes y SHA256 ↗</a>
      </div>
    </dialog>
  </div>;
}
