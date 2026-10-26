import type {ListDetail,UniverseData} from './universe-model';
import population from './population-2026.json' with {type:'json'};
export type MapAge='all'|'menor18'|'18mas';
export type MapSex='all'|'FEMENINO'|'MASCULINO';
export type MapDiscrepancy={kind:string;scope:string;observed:number|number[]|null;expected:number|number[]};
export type MapSnapshot={date:string;started:string;ended:string;note:string;discrepancies:MapDiscrepancy[];cohorts:Record<string,{lists:ListDetail[];nationalTotal:number|null;missingProvinces:string[]}>};
export function describeMapDiscrepancy(issue:MapDiscrepancy){
  const [age,sex,list]=issue.scope.split('|');
  const context=`${list} · ${age==='all'?'todas las edades':age==='menor18'?'menores de 18':'18 años o más'} · ${sex==='all'?'todos los sexos':sex.toLowerCase()}`;
  if(Array.isArray(issue.observed)&&Array.isArray(issue.expected)){
    const names=['<1 mes','1–3 meses','3–6 meses','6–12 meses','1–2 años','2–3 años','3–7 años','7–10 años','>10 años'];
    const observed=issue.observed,expected=issue.expected;
    return `${context}: ${names.flatMap((band,i)=>observed[i]===expected[i]?[]:[`${band}: suma provincial ${observed[i]}, control nacional ${expected[i]}`]).join('; ')}.`;
  }
  return `${context}: suma provincial ${issue.observed}, control nacional ${issue.expected}.`;
}
export function mapUniverseData(original:UniverseData,snapshot:MapSnapshot,age:MapAge,sex:MapSex):UniverseData{
  const cohort=snapshot.cohorts[`${age}|${sex}`];
  if(!cohort)throw new Error('Falta el cruce demográfico publicado');
  const populationByProvince:Record<string,number>=population.provinces;
  const provinceOrder=original.lists.find(list=>list.id==='TOTAL')?.province.map(row=>row.label)??[];
  const lists=cohort.lists.map(list=>({...list,label:original.lists.find(old=>old.id===list.id)?.label??list.label,province:provinceOrder.map(label=>list.province.find(row=>row.label===label)??{label,value:0}).map(p=>{
    const denominator=populationByProvince[p.label];
    return {...p,pmh:cohort.missingProvinces.includes(p.label)?undefined:denominator>0?p.value/denominator*1_000_000:undefined};
  })}));
  const organs=lists.filter(list=>list.id!=='TOTAL').map(list=>({id:list.id,label:list.label,value:list.total,color:original.organs.find(old=>old.id===list.id)?.color??'#77796f'})).sort((a,b)=>b.value-a.value);
  return {...original,populationByProvince,total:organs.reduce((sum,list)=>sum+list.value,0),snapshot:snapshot.date,lists,organs};
}
