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
  return <div className="v2-entry-breakdown">
    <button type="button" className="v2-exit-trigger" aria-haspopup="dialog" aria-controls={id} onClick={()=>dialog.current?.showModal()}>Ingresos · diagnósticos principales ↗</button>
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
