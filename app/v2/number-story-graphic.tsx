'use client';
import {useEffect,useRef} from 'react';
import allocation from './allocation-context.generated.json';
import donation from './donation-context.generated.json';
import {integer} from './universe-model';
import RegistrationGraphic from './registration-graphic';
const organDonors2025=donation.rows['2025|ARGENTINA'].organs;
export default function NumberStoryGraphic({step,count:_count,renalCount:_renalCount,registrationList='TOTAL',showRegistrationStages=false}:{step:number;count:number;renalCount:number;registrationList?:string;showRegistrationStages?:boolean}){
 const graphic=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const element=graphic.current;if(!element)return;
  const root=element.closest<HTMLElement>('.waiting-v2');
  const update=()=>root?.style.setProperty('--v2-intro-graphic-height',element.getBoundingClientRect().height+'px');
  const observer=new ResizeObserver(update);observer.observe(element);update();
  return()=>{observer.disconnect();root?.style.removeProperty('--v2-intro-graphic-height');};
 },[step,registrationList,showRegistrationStages]);
 if(step<=1)return null;
 return <div ref={graphic} className="v2-number-story-graphic" data-block={step}>
  {step===2&&<RegistrationGraphic list={registrationList} showStages={showRegistrationStages}/>}
  {step===3&&<figure className="v2-number-criteria"><figcaption>Órganos · Argentina · {allocation.year}</figcaption><div className="v2-allocation-counts"><div><small>Al menos</small><strong>{integer(allocation.inscriptions.total)}</strong><span>inscripciones relevadas</span></div><div><small>En el mismo año</small><strong>{integer(allocation.transplants.total)}</strong><span>trasplantes realizados</span></div><div><small>En el mismo año</small><strong>{integer(organDonors2025)}</strong><span>donantes de órganos</span></div></div><dl>
   <div><dt>Disponibilidad</dt><dd>Un órgano disponible</dd></div><div><dt>Compatibilidad</dt><dd>Entre donante y receptor</dd></div><div><dt>Asignación</dt><dd>Prioridad clínica y distribución</dd></div>
  </dl><p>El tiempo transcurrido no es el único criterio.</p></figure>}
 </div>;
}
