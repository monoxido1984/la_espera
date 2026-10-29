'use client';
import RegistrationGraphic from './registration-graphic';
export default function NumberStoryGraphic({step,count:_count,renalCount:_renalCount,registrationList='TOTAL'}:{step:number;count:number;renalCount:number;registrationList?:string}){
 if(step<=1)return null;
 return <div className="v2-number-story-graphic" data-block={step}>
  {step===2&&<RegistrationGraphic list={registrationList}/>}
  {step===3&&<figure className="v2-number-criteria"><figcaption>De la donación al trasplante</figcaption><dl>
   <div><dt>Donación</dt><dd>Un órgano disponible</dd></div><div><dt>Compatibilidad</dt><dd>Entre donante y receptor</dd></div><div><dt>Asignación</dt><dd>Prioridad clínica y distribución</dd></div>
  </dl><p>El tiempo transcurrido no es el único criterio.</p></figure>}
 </div>;
}
