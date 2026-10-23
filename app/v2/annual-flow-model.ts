export type FlowYear={year:number;entries:number;provinces:Record<string,number>;exits:number|null;causes:{label:string;value:number}[];residual:number|null;exitsState?:string};
export type FlowData={lists:Record<string,FlowYear[]>};
export function selectFlow(data:FlowData,list:string,year:number,province:string|null,age:string){
  const row=data.lists[list]?.find(r=>r.year===year);
  if(!row||age!=='all')return null;
  return {...row,entries:province?row.provinces[province]??null:row.entries,exits:province?null:row.exits,causes:province?[]:row.causes,residual:province?null:row.residual,exitsState:province?'no_adquirido':row.exitsState};
}
export function flowGroups(causes:FlowYear['causes']){
  const value=(pattern:RegExp)=>causes.filter(c=>pattern.test(c.label)).reduce((s,c)=>s+c.value,0);
  return [{label:'Trasplante · donante fallecido',value:value(/^TRASPLANTE CON DONANTE FALLECIDO$/),color:'#0052cc'},
    {label:'Trasplante · donante vivo',value:value(/^TRASPLANTE CON DONANTE VIVO$/),color:'#008a3b'},
    {label:'Fallecimiento',value:value(/^FALLECIMIENTO$/),color:'#d60036'},
    {label:'Otras causas',value:causes.filter(c=>!/^TRASPLANTE CON DONANTE (FALLECIDO|VIVO)$|^FALLECIMIENTO$/.test(c.label)).reduce((s,c)=>s+c.value,0),color:'#7400bd'}];
}
