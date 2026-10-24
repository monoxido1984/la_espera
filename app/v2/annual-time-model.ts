import {summarizeWait,type WaitSummaryCell} from '../wait-statistics';
export type CompactAnnualTime = {years:number[];lists:string[];provinces:string[];ages:string[];units:string[];rows:(number|null)[][];sourceSha256:string};
export type AnnualTimeSelection = {list:string;province:string|null;age:string};
export type AnnualTimeDetail = {year:number;n:number;average:number|null;median:number|null;p25:number|null;p75:number|null;unit:string;status:string;label:string;list:string;province:string|null;age:string;complete:boolean;maxAverage?:number};
export const annualListLabels:Record<string,string>={RENAL:'Renal',RENOPANCREATICA:'Renopancreática',HEPATICA:'Hepática',HEPATORRENAL:'Hepatorrenal',HEPATOINTESTINAL:'Hepatointestinal',HEPATOPANCREATICA:'Hepatopancreática',CARDIACA:'Cardíaca',CARDIORRENAL:'Cardiorrenal',CARDIOPULMONAR:'Cardiopulmonar',CARDIOHEPATICA:'Cardiohepática',PULMONAR:'Pulmonar',CORNEAS:'Córneas',ESCLERAS:'Escleras'};
export const annualAgeLabels:Record<string,string>={all:'Todas las edades',menor_18:'Menores de 18', '18_mas':'18 años y más'};
export function unpackAnnualTimes(data:CompactAnnualTime):WaitSummaryCell[] {
  return data.rows.map(row=>({year:row[0]!,list:data.lists[row[1]!],province:data.provinces[row[2]!],age:data.ages[row[3]!],unit:data.units[row[1]!],n:row[4]!,average:row[5],median:row[6],p25:row[7],p75:row[8],status:row[4]===0?'sin_observaciones':'observado'}));
}
export function annualTimeDetail(cells:WaitSummaryCell[],year:number,selection:AnnualTimeSelection):AnnualTimeDetail {
  const summary=summarizeWait(cells,year,selection.list,selection.province,selection.age);
  return {year,n:summary.n,average:summary.average,median:summary.median,p25:summary.p25,p75:summary.p75,unit:summary.unit,status:summary.status,complete:summary.complete,...selection,label:annualListLabels[selection.list]??selection.list};
}
