import {MILESTONES} from '../historical-milestones';
const short:Record<number,string>={
  2005:'La Ley 26.066 establece el principio de donante presunto.',
  2013:'Educación sobre donación y estrategia Hospital Donante.',
  2018:'Entra en vigencia la Ley Justina de donación y trasplante.',
  2020:'La pandemia afectó la actividad de donación y trasplante. INCUCAI documenta su impacto y las medidas para sostener el sistema.',
  2022:'PROCURAR impulsa las Unidades Hospitalarias de Procuración.',
};
export default function YearMilestone({year}:{year:number}){
  const event=MILESTONES.find(e=>e.year===year);
  return <div className="v2-year-milestone" aria-live="polite">{event&&<div key={event.id}><span>{year} / {event.type}</span><strong>{event.title}</strong><p>{short[year]}</p></div>}</div>;
}
