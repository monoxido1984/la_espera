import counts from './annual-list-counts.generated.json' with {type:'json'};
import entries from './annual-entries.generated.json' with {type:'json'};
import flows from './annual-flows.generated.json' with {type:'json'};
import rawTimes from './annual-time.generated.json' with {type:'json'};
import nationalQuantiles from './annual-national-quantiles.generated.json' with {type:'json'};
import partial from './partial-2026.generated.json' with {type:'json'};
import {annualTimeDetail,unpackAnnualTimes,type CompactAnnualTime} from './annual-time-model';
import {comparisonHistory} from './annual-comparison-model';
import {annualPmh} from './annual-pmh';
import {flowGroups,selectFlow} from './annual-flow-model';
import type {HistoryYear} from './universe-model';

export const comparisonYears=counts.years;
export type TerritoryMetric='waitlist'|'entries'|'exits'|'transplants'|'deaths'|'entryCause'|'exitCause'|'time'|'median'|'average'|'p25'|'p75'|'recipients';
export type TerritoryOptions={list:string;territory:string;metric:TerritoryMetric;age:string;cause:string};
export type CauseOption={id:string;label:string;value:number};
export type TerritoryPoint={year:number;value:number|null;amount:number|null;reportTotal:number|null;n:number|null;median:number|null;p25:number|null;p75:number|null;statistic?:'median'|'average'|null};
type Entry={total:number|null;diagnoses:{code:string;label:string;value:number}[]};
const cells=unpackAnnualTimes(rawTimes as CompactAnnualTime);
export const timeMetric=(metric:TerritoryMetric)=>['time','median','average','p25','p75'].includes(metric);
export const timePopulation=(metric:TerritoryMetric)=>timeMetric(metric)||metric==='recipients';
export const causeMetric=(metric:TerritoryMetric)=>metric==='entryCause'||metric==='exitCause';
const province=(territory:string)=>territory==='ARGENTINA'?null:territory;

export function territoryCauses(list:string,territory:string,year:number,kind:'entryCause'|'exitCause'):{total:number|null;items:CauseOption[]}{
  if(kind==='entryCause'){
    const row=(entries.rows as Record<string,Entry>)[list+'|'+year+'|'+territory];
    return {total:row?.total??null,items:(row?.diagnoses??[]).map(item=>({id:JSON.stringify([item.code,item.label]),label:item.label,value:item.value}))};
  }
  const row=selectFlow(flows,list,year,province(territory),'all');
  return {total:row?.exits??null,items:flowGroups(row?.causes??[]).flatMap(group=>group.items.map(item=>({id:item.canonicalId,label:item.label,value:item.value})))};
}
export function territoryCauseOptions(list:string,territories:string[],kind:'entryCause'|'exitCause',selectedYear:number){
  const options=new Map<string,CauseOption>();
  for(const year of comparisonYears)for(const territory of territories)for(const item of territoryCauses(list,territory,year,kind).items){
    const old=options.get(item.id);
    options.set(item.id,{...item,value:(old?.value??0)+(year===selectedYear?item.value:0)});
  }
  return [...options.values()].sort((a,b)=>b.value-a.value||a.label.localeCompare(b.label));
}
export function territorySeries(options:TerritoryOptions,history:HistoryYear[]):TerritoryPoint[]{
  const {list,territory,metric,age,cause}=options;
  const selectedProvince=province(territory),selection={list,province:selectedProvince,age};
  const details=timePopulation(metric)?comparisonYears.map(year=>annualTimeDetail(cells,year,selection)):[];
  const times=timePopulation(metric)?comparisonHistory(history,selection,details,counts,partial,nationalQuantiles.rows):[];
  return comparisonYears.map(year=>{
    const time=times.find(row=>row.year===year),detail=details.find(row=>row.year===year);
    let amount:number|null=null,reportTotal:number|null=null,n:number|null=null;
    if(timeMetric(metric)){
      const statistic=metric==='time'?(time?.median!=null?'median':time?.average!=null?'average':null):metric==='average'?'average':'median';
      const value=metric==='time'?(time?.median??time?.average??null):time?.[metric as 'median'|'average'|'p25'|'p75']??null;
      n=statistic==='average'?(time?.n??null):(time?.quantileN??null);
      return {year,value,amount:null,reportTotal:null,n,median:time?.median??null,p25:time?.p25??null,p75:time?.p75??null,statistic};
    }
    if(metric==='waitlist'){
      const row=(counts.lists as Record<string,{year:number;total:number;provinces:Record<string,number>}[]>)[list]?.find(row=>row.year===year);
      amount=selectedProvince?row?.provinces[selectedProvince]??null:row?.total??null;
    }else if(metric==='recipients'){
      amount=list==='RENAL'&&!selectedProvince&&age==='all'?time?.n??null:detail?.complete?detail.n:null;
    }else if(causeMetric(metric)){
      const row=territoryCauses(list,territory,year,metric as 'entryCause'|'exitCause');
      reportTotal=row.total;
      amount=row.total===null?null:row.items.find(item=>item.id===cause)?.value??null;
    }else{
      const row=selectFlow(flows,list,year,selectedProvince,'all');
      if(metric==='entries')amount=row?.entries??null;
      if(metric==='exits')amount=row?.exits??null;
      if(row?.exits!=null&&(metric==='transplants'||metric==='deaths')){
        const groups=flowGroups(row.causes);
        amount=metric==='transplants'?groups[0].value+groups[1].value:groups[2].value;
      }
    }
    return {year,value:annualPmh(amount,territory,year),amount,reportTotal,n,median:null,p25:null,p75:null};
  });
}
