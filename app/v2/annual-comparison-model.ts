import {annualListLabels,type AnnualTimeDetail,type AnnualTimeSelection} from './annual-time-model';
import type {HistoryYear} from './universe-model';
export type AnnualListCounts={lists:Record<string,{year:number;total:number;provinces:Record<string,number>}[]>};
export type ComparisonYear={year:number;waitlist:number|null;donors:number;average:number|null;n:number;unit:string;label:string;partial:boolean;countReason:string};
type PartialCut={year:number;donors:number;renal:{n:number;average:number}};

export function comparisonHistory(history:HistoryYear[],selection:AnnualTimeSelection,details:AnnualTimeDetail[],counts:AnnualListCounts,partial:PartialCut):ComparisonYear[]{
  const label=annualListLabels[selection.list]??selection.list;
  const nationalRenal=selection.list==='RENAL'&&!selection.province&&selection.age==='all';
  const unit=['HEPATICA','HEPATORRENAL','HEPATOINTESTINAL','HEPATOPANCREATICA'].includes(selection.list)?'días':'meses';
  const full=history.map(row=>{
    const time=details.find(d=>d.year===row.year&&d.list===selection.list&&d.province===selection.province&&d.age===selection.age),stock=counts.lists[selection.list]?.find(r=>r.year===row.year);
    const waitlist=selection.age!=='all'?null:stock?(selection.province?stock.provinces[selection.province]??null:stock.total):null;
    return {year:row.year,donors:row.donors,waitlist,average:nationalRenal?row.average:time?.average??null,n:nationalRenal?row.n:time?.n??0,unit,label,partial:false,
      countReason:waitlist!==null?'':selection.age!=='all'?'Este conjunto no incluye conteos históricos de lista por edad.':'Conteo de esta lista no disponible para este año.'};
  });
  return [...full,{year:partial.year,donors:partial.donors,waitlist:null,average:nationalRenal?partial.renal.average:null,n:nationalRenal?partial.renal.n:0,unit,label,partial:true,
    countReason:'Sin conteo de lista al 31/07/2026 en esta base.'}];
}
