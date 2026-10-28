import {annualListLabels,type AnnualTimeDetail,type AnnualTimeSelection} from './annual-time-model';
import type {HistoryYear} from './universe-model';
export type AnnualListCounts={lists:Record<string,{year:number;total:number;provinces:Record<string,number>}[]>};
export type ComparisonYear={year:number;waitlist:number|null;donors:number;average:number|null;median:number|null;p25:number|null;p75:number|null;quantileN:number|null;n:number;unit:string;label:string;partial:boolean;countReason:string};
export type NationalQuantile={year:number;list:string;unit:string;median:number;p25:number;p75:number;n:number};


export function comparisonHistory(history:HistoryYear[],selection:AnnualTimeSelection,details:AnnualTimeDetail[],counts:AnnualListCounts,nationalQuantiles:NationalQuantile[]=[]):ComparisonYear[]{
  const label=annualListLabels[selection.list]??selection.list;
  const nationalRenal=selection.list==='RENAL'&&!selection.province&&selection.age==='all';
  const unit=['HEPATICA','HEPATORRENAL','HEPATOINTESTINAL','HEPATOPANCREATICA'].includes(selection.list)?'días':'meses';
  return history.filter(row=>row.year>=2005&&row.year<=2025).map(row=>{
    const time=details.find(d=>d.year===row.year&&d.list===selection.list&&d.province===selection.province&&d.age===selection.age),stock=counts.lists[selection.list]?.find(r=>r.year===row.year);
    const waitlist=selection.age!=='all'?null:stock?(selection.province?stock.provinces[selection.province]??null:stock.total):null;
    const direct=!selection.province&&selection.age==='all'?nationalQuantiles.find(q=>q.list===selection.list&&q.year===row.year&&q.unit===unit):undefined;
    const quantiles=nationalRenal?row:direct??time;
    return {median:quantiles?.median??null,p25:quantiles?.p25??null,p75:quantiles?.p75??null,quantileN:quantiles?.median!=null?quantiles.n:null,year:row.year,donors:row.donors,waitlist,average:nationalRenal?row.average:time?.average??null,n:nationalRenal?row.n:time?.n??0,unit,label,partial:false,
      countReason:waitlist!==null?'':selection.age!=='all'?'Este conjunto no incluye conteos históricos de lista por edad.':'Conteo de esta lista no disponible para este año.'};
  });
}
