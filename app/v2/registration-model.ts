export type RegistrationRow={id:string;n:number;months:number;days:number};
export type RegistrationData={total:RegistrationRow;rows:RegistrationRow[]};
export function registrationSelection(data:RegistrationData,list:string):RegistrationRow|null{
 return list==='TOTAL'?data.total:data.rows.find(row=>row.id===list)??null;
}
