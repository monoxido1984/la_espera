export type RegistrationRow={id:string;n:number;months:number;days:number;stageDays?:Record<string,number>};
export type RegistrationData={total:RegistrationRow;rows:RegistrationRow[]};
export function registrationSelection(data:RegistrationData,list:string):RegistrationRow|null{
 return list==='TOTAL'?data.total:data.rows.find(row=>row.id===list)??null;
}
export const registrationStageLabels=[
 {id:'firstAuthorization',label:'1ª autorización',color:'#1768ac'},
 {id:'evaluation',label:'Evaluación médica',color:'#b74d38'},
 {id:'immunology',label:'Estudios inmunológicos',color:'#727b4d'},
 {id:'secondAuthorization',label:'2ª autorización',color:'#7d608d'},
 {id:'registration',label:'Registro en lista',color:'#776654'},
];
export function registrationStages(row:RegistrationRow){
 const stages=registrationStageLabels.map(stage=>({...stage,days:row.stageDays?.[stage.id]??null}));
 const sum=stages.reduce((n,stage)=>n+(stage.days??0),0);
 return stages.map(stage=>({...stage,share:stage.days===null?null:sum>0?stage.days/sum:0}));
}
