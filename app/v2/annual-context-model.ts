export type ContextUnit='pmh'|'absolute';
export function contextValue(value:number|null|undefined,population:number|null|undefined,unit:ContextUnit):number|null{
 if(value==null||!Number.isFinite(value)||value<0)return null;
 if(unit==='absolute')return value;
 return population!=null&&Number.isFinite(population)&&population>0?value/population*1000000:null;
}
