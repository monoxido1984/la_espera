import data from './registration-context.generated.json';
import {registrationSelection,registrationStages} from './registration-model';
import {organLabel} from './organ-labels';
import {decimal,integer} from './universe-model';
export default function RegistrationGraphic({list,showStages=false}:{list:string;showStages?:boolean}){
 const selected=registrationSelection(data,list);
 if(!selected)return <p>Sin tiempo publicado para esta lista en 2025.</p>;
 const label=(id:string)=>id==='TOTAL'?'Todas las listas':organLabel(id,id);
 const maximum=Math.max(...data.rows.map(row=>row.months),data.total.months);
 const rows=list==='TOTAL'?[data.total]:[data.total,selected];
 return <figure className="v2-number-registration" aria-live="polite">
  <figcaption>Antes de la lista · {data.year} · {label(selected.id)}</figcaption>
  <p className="v2-number-time"><strong>{decimal(selected.months)}</strong> meses <span>de promedio · {selected.days} días</span></p>
  {showStages?<div className="v2-registration-stages"><div className="v2-registration-stagebar" role="img" aria-label={registrationStages(selected).map(stage=>`${stage.label}: ${stage.days??'s/d'} días`).join('; ')}>{registrationStages(selected).map(stage=><i key={stage.id} style={{width:`${(stage.share??0)*100}%`,background:stage.color}}/>)}</div><div className="v2-registration-stage-values">{registrationStages(selected).map(stage=><div key={stage.id}><i style={{background:stage.color}}/><span>{stage.label}</span><strong>{stage.days===null?'s/d':`${stage.days} días`}</strong></div>)}</div><small>{integer(selected.n)} inscripciones · Etapas y total redondeados por separado.</small></div>:<div className="v2-registration-comparison">{rows.map(row=><div key={row.id}>
   <div><span>{label(row.id)}</span><strong>{decimal(row.months)} meses</strong></div>
   <div className="v2-number-bar-track" role="img" aria-label={`${label(row.id)}: media ${decimal(row.months)} meses; ${integer(row.n)} inscripciones`}><i style={{width:`${row.months/maximum*100}%`,background:row.id==='TOTAL'?'#687c78':'#b74d38'}}/></div>
   <small>{integer(row.n)} inscripciones</small>
  </div>)}</div>}
 </figure>;
}
