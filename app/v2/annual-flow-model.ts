import provincialExits from './provincial-exits.generated.json' with {type:'json'};
export type FlowCause={label:string;value:number;code?:string;canonicalId?:string;displayLabel?:string;group?:string};
export type FlowYear={year:number;entries:number;provinces:Record<string,number>;exits:number|null;causes:FlowCause[];residual:number|null;exitsState?:string};
export type FlowData={lists:Record<string,FlowYear[]>};
export function selectFlow(data:FlowData,list:string,year:number,province:string|null,age:string){
  const row=data.lists[list]?.find(r=>r.year===year);
  if(!row||age!=='all')return null;
  if(!province)return row;
  const cell=(provincialExits.rows as Record<string,{total:number|null;causes:FlowCause[];state:string}>)[`${list}|${year}|${province}`];
  return {...row,entries:row.provinces[province]??null,exits:cell?.total??null,causes:cell?.causes??[],residual:null,exitsState:cell?.state??'no_adquirido'};
}
export function flowGroups(causes:FlowYear['causes']){
  const direct=/^TRASPLANTE CON DONANTE (FALLECIDO|VIVO)$|^FALLECIMIENTO$/;
  const definitions=[
    {id:'trasplante_dc',label:'Trasplante · donante fallecido',color:'#0052cc',matches:(label:string)=>label==='TRASPLANTE CON DONANTE FALLECIDO'},
    {id:'trasplante_dv',label:'Trasplante · donante vivo',color:'#008a3b',matches:(label:string)=>label==='TRASPLANTE CON DONANTE VIVO'},
    {id:'fallecimiento',label:'Fallecimiento',color:'#d60036',matches:(label:string)=>label==='FALLECIMIENTO'},
    {id:'otros_egresos',label:'Otros motivos de egreso · agrupados',color:'#7400bd',matches:(label:string)=>!direct.test(label)}
  ];
  return definitions.map(({matches,...group})=>{
    const rawItems=causes.filter(c=>c.group?c.group===group.id:matches(c.label));
    const merged=new Map<string,{label:string;value:number;canonicalId:string;sourceCodes:string[]}>();
    for(const c of rawItems){
      const key=c.canonicalId??c.label;
      const item=merged.get(key)??{label:c.displayLabel??c.label,value:0,canonicalId:key,sourceCodes:[]};
      item.value+=c.value;
      if(c.code&&!item.sourceCodes.includes(c.code))item.sourceCodes.push(c.code);
      merged.set(key,item);
    }
    return {...group,value:rawItems.reduce((sum,c)=>sum+c.value,0),items:[...merged.values()],rawItems};
  });
}
