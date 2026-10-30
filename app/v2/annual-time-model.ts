import {summarizeWait,type WaitSummaryCell} from '../wait-statistics';
export type CompactAnnualTime = {years:number[];lists:string[];provinces:string[];ages:string[];units:string[];rows:(number|null)[][];sourceSha256:string};
export type AnnualTimeSelection = {list:string;province:string|null;age:string};
export type AnnualTimeDetail = {year:number;n:number;average:number|null;median:number|null;p25:number|null;p75:number|null;unit:string;status:string;label:string;list:string;province:string|null;age:string;complete:boolean;maxAverage?:number};
export const annualListLabels:Record<string,string>={TOTAL:'Listas relevadas',RENAL:'Renal',RENOPANCREATICA:'Renopancreática',HEPATICA:'Hepática',HEPATORRENAL:'Hepatorrenal',HEPATOINTESTINAL:'Hepatointestinal',HEPATOPANCREATICA:'Hepatopancreática',CARDIACA:'Cardíaca',CARDIORRENAL:'Cardiorrenal',CARDIOPULMONAR:'Cardiopulmonar',CARDIOHEPATICA:'Cardiohepática',PULMONAR:'Pulmonar',CORNEAS:'Córneas',ESCLERAS:'Escleras'};
export const annualAgeLabels:Record<string,string>={all:'Todas las edades',menor_18:'Menores de 18', '18_mas':'18 años y más'};
const DAYS_PER_MONTH=365.2425/12;
export function unpackAnnualTimes(data:CompactAnnualTime):WaitSummaryCell[] {
  return data.rows.map(row=>({year:row[0]!,list:data.lists[row[1]!],province:data.provinces[row[2]!],age:data.ages[row[3]!],unit:data.units[row[1]!],n:row[4]!,average:row[5],median:row[6],p25:row[7],p75:row[8],status:row[4]===0?'sin_observaciones':'observado'}));
}
export function annualTimeDetail(cells:WaitSummaryCell[],year:number,selection:AnnualTimeSelection):AnnualTimeDetail {
  if(selection.list==='TOTAL'){
    const rows=cells.filter(row=>row.year===year&&(selection.province===null||row.province===selection.province)&&(selection.age==='all'||row.age===selection.age));
    const n=rows.reduce((sum,row)=>sum+row.n,0);
    const valid=rows.filter(row=>row.n>0&&row.average!==null);
    const validN=valid.reduce((sum,row)=>sum+row.n,0);
    const expectedLists=new Set(cells.map(row=>row.list)).size;
    const expectedProvinces=selection.province===null?new Set(cells.map(row=>row.province)).size:1;
    const expectedAges=selection.age==='all'?new Set(cells.map(row=>row.age)).size:1;
    const complete=rows.length===expectedLists*expectedProvinces*expectedAges&&validN===n;
    const average=complete&&validN>0?valid.reduce((sum,row)=>sum+(row.unit==='días'?row.average!/DAYS_PER_MONTH:row.average!)*row.n,0)/validN:null;
    const status=rows.length===0?'sin_datos':n===0?'sin_observaciones':average!==null?'observado':'sin_datos';
    return {year,n,average,median:null,p25:null,p75:null,unit:'meses',status,complete,...selection,label:annualListLabels.TOTAL};
  }
  const summary=summarizeWait(cells,year,selection.list,selection.province,selection.age);
  return {year,n:summary.n,average:summary.average,median:summary.median,p25:summary.p25,p75:summary.p75,unit:summary.unit,status:summary.status,complete:summary.complete,...selection,label:annualListLabels[selection.list]??selection.list};
}
