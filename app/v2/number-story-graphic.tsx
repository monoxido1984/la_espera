'use client';
import timingData from './dialysis-context.generated.json';
import {numberStoryFacts} from './number-story-model';
import {decimal,integer} from './universe-model';
export default function NumberStoryGraphic({step,count,renalCount}:{step:number;count:number;renalCount:number}){
 const facts=numberStoryFacts(count,renalCount),timing=timingData.timing;
 if(step===0)return null;
 return <div className="v2-number-story-graphic" data-block={step}>
  {step===1&&<figure className="v2-number-composition"><figcaption>Qué se espera · {integer(count)} inscripciones</figcaption>
   {[{label:'Riñón',n:facts.renal,p: facts.renalPercent,other:false},{label:'Otros órganos y tejidos',n:facts.other,p:facts.otherPercent,other:true}].map(row=><div className="v2-number-bar-row" key={row.label}>
    <div><span>{row.label}</span><strong>{integer(row.n)} <small>{decimal(row.p)}%</small></strong></div>
    <div className="v2-number-bar-track" role="img" aria-label={`${row.label}: ${integer(row.n)} de ${integer(count)} inscripciones (${decimal(row.p)}%)`}><i data-other={row.other} style={{width:`${row.p}%`}}/></div>
   </div>)}<p>La longitud representa la proporción del total.</p>
  </figure>}
  {step===2&&<figure className="v2-number-registration"><figcaption>Antes de la lista · foco renal de {timing.year}</figcaption>
   <p className="v2-number-time"><strong>{decimal(timing.months)}</strong> meses <span>de promedio · {timing.days} días</span></p>
   <div className="v2-number-timebar" role="img" aria-label={timing.stages.map(row=>`${row.label}: ${row.days} días`).join('; ')}>{timing.stages.map(row=><i key={row.id} style={{width:`${row.days/timing.days*100}%`,background:row.color}}/>)}</div>
   <div className="v2-number-time-labels">{timing.stages.map((row,index)=><div key={row.id} style={{borderLeft:`2px solid ${row.color}`,paddingLeft:8}}><span>{['1ª autorización','Evaluación médica','Estudios, 2ª autorización y registro'][index]}</span><strong>{row.days} días</strong></div>)}</div>
  </figure>}
  {step===3&&<figure className="v2-number-criteria"><figcaption>De la donación al trasplante</figcaption><dl>
   <div><dt>Donación</dt><dd>Un órgano disponible</dd></div><div><dt>Compatibilidad</dt><dd>Entre donante y receptor</dd></div><div><dt>Asignación</dt><dd>Prioridad clínica y distribución</dd></div>
  </dl><p>El tiempo transcurrido no es el único criterio.</p></figure>}
 </div>;
}
