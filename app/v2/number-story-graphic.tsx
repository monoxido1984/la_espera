'use client';
import allocation from './allocation-context.generated.json';
import {integer} from './universe-model';
import RegistrationGraphic from './registration-graphic';
export default function NumberStoryGraphic({step,count:_count,renalCount:_renalCount,registrationList='TOTAL',showRegistrationStages=false}:{step:number;count:number;renalCount:number;registrationList?:string;showRegistrationStages?:boolean}){
 if(step<=1)return null;
 return <div className="v2-number-story-graphic" data-block={step}>
  {step===2&&<RegistrationGraphic list={registrationList} showStages={showRegistrationStages}/>}
  {step===3&&<figure className="v2-number-criteria"><figcaption>Órganos · Argentina · {allocation.year}</figcaption><div className="v2-allocation-counts"><div><small>Al menos</small><strong>{integer(allocation.inscriptions.total)}</strong><span>inscripciones relevadas</span></div><div><small>En el mismo año</small><strong>{integer(allocation.transplants.total)}</strong><span>trasplantes realizados</span></div></div><dl>
   <div><dt>Disponibilidad</dt><dd>Un órgano disponible</dd></div><div><dt>Compatibilidad</dt><dd>Entre donante y receptor</dd></div><div><dt>Asignación</dt><dd>Prioridad clínica y distribución</dd></div>
  </dl><p>El tiempo transcurrido no es el único criterio.</p></figure>}
 </div>;
}
