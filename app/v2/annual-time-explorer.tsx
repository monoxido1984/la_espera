'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import raw from './annual-time.generated.json';
import {annualTimeDetail,unpackAnnualTimes,annualListLabels,annualAgeLabels,type CompactAnnualTime,type AnnualTimeDetail,type AnnualTimeSelection} from './annual-time-model';

const source=raw as CompactAnnualTime;
const cells=unpackAnnualTimes(source);
export default function AnnualTimeExplorer({year,provinceNames,onSummary}:{year:number;provinceNames:Map<string,string>;onSummary:(value:AnnualTimeDetail)=>void}) {
  const [selection,setSelection]=useState<AnnualTimeSelection>({list:'RENAL',province:null,age:'all'});
  const [choosing,setChoosing]=useState<'list'|'province'|'age'|null>(null);
  const dialog=useRef<HTMLDialogElement>(null);
  const series=useMemo(()=>source.years.map(y=>annualTimeDetail(cells,y,selection)),[selection]);
  const summary=useMemo(()=>({...series[source.years.indexOf(year)],maxAverage:Math.max(1,...series.map(row=>row.average??0))}),[series,year]);
  useEffect(()=>onSummary(summary),[summary,onSummary]);
  useEffect(()=>{if(choosing)dialog.current?.showModal();else dialog.current?.close();},[choosing]);
  const choices=choosing==='list'?source.lists.map(value=>({value,label:annualListLabels[value]})):choosing==='province'?[{value:'all',label:'Argentina · 24 provincias'},...source.provinces.map(value=>({value,label:provinceNames.get(value)??value}))]:Object.entries(annualAgeLabels).map(([value,label])=>({value,label}));
  function pick(value:string) { if(!choosing)return;setSelection({...selection,[choosing]:choosing==='province'&&value==='all'?null:value});setChoosing(null); }
  return <div className="v2-annual-explorer">
    <div className="v2-annual-choices" role="group" aria-label="Cruzar el tiempo anual">
      <button aria-haspopup="dialog" onClick={()=>setChoosing('list')}>{annualListLabels[selection.list]} <span>↗</span></button>
      <button aria-haspopup="dialog" onClick={()=>setChoosing('province')}>{selection.province?provinceNames.get(selection.province):'Argentina'} <span>↗</span></button>
      <button aria-haspopup="dialog" onClick={()=>setChoosing('age')}>{annualAgeLabels[selection.age]} <span>↗</span></button>
    </div>
    <p className="v2-annual-base" aria-live="polite">{summary.status==='observado'?`${new Intl.NumberFormat('es-AR').format(summary.n)} receptores en este cruce · promedio` : summary.status==='sin_observaciones'?'Sin observaciones para esta selección.':'Cruce incompleto: no se calcula un promedio.'}</p>
    <dialog ref={dialog} className="v2-choice-dialog" aria-labelledby="v2-choice-title" onCancel={()=>setChoosing(null)} onClose={()=>setChoosing(null)}>
      <div><h3 id="v2-choice-title">{choosing==='list'?'¿Qué lista?':choosing==='province'?'¿Dónde?':'¿A qué edad?'}</h3><button aria-label="Cerrar opciones" onClick={()=>setChoosing(null)}>×</button></div>
      <div className="v2-choice-options">{choices.map(choice=><button key={choice.value} aria-pressed={(choosing==='province'?selection.province??'all':choosing?selection[choosing]:null)===choice.value} onClick={()=>pick(choice.value)}>{choice.label}</button>)}</div>
    </dialog>
  </div>;
}
