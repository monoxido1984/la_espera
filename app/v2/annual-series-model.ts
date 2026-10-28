export type TimeStatistic='median'|'mean';
export type TimeRow={year:number;unit:string;median:number|null;average:number|null;p25:number|null;p75:number|null;partial:boolean};
export type PopulationTable=Record<string,Record<string,number>>;
export function timeValue(row:TimeRow|undefined,statistic:TimeStatistic):number|null{
 return !row?null:statistic==='median'?row.median:row.average;
}
export function sharedStatistic(primary:TimeRow[],secondary:TimeRow[],comparing:boolean):TimeStatistic{
 return primary.some(row=>row.median!==null&&(!comparing||secondary.some(other=>other.year===row.year&&other.unit===row.unit&&other.median!==null)))?'median':'mean';
}
export function perMillion(value:number|null|undefined,population:number|undefined):number|null{
 return value==null||population==null||!Number.isFinite(value)||!Number.isFinite(population)||population<=0?null:value/population*1e6;
}
export function seriesPath<T extends {year:number}>(rows:T[],value:(row:T)=>number|null,x:(year:number)=>number,y:(value:number)=>number):string{
 return rows.map((row,index)=>{const n=value(row);if(n===null)return '';const previous=rows[index-1];return `${previous&&previous.year===row.year-1&&value(previous)!==null?'L':'M'}${x(row.year)},${y(n)}`;}).join(' ');
}
export function timeAnchor(rows:TimeRow[],year:number,statistic:TimeStatistic,territory:string):string{
 const usable=rows.filter(row=>row.year<=year&&timeValue(row,statistic)!==null),first=usable[0],last=usable.at(-1);
 const name=statistic==='median'?'la mediana':'la media',number=(n:number)=>n.toLocaleString('es-AR',{minimumFractionDigits:1,maximumFractionDigits:1});
 if(!first||!last)return `No hay ${statistic==='median'?'medianas':'medias'} publicadas para esta selección.`;
 if(first.year===last.year)return `En ${territory}, ${name} observada fue ${number(timeValue(last,statistic)!)} ${last.unit} en ${last.year}.`;
 const change=timeValue(last,statistic)!-timeValue(first,statistic)!;
 return `En ${territory}, ${name} de espera ${change===0?'se mantuvo':change>0?'aumentó':'disminuyó'}${change===0?'':` ${number(Math.abs(change))} ${last.unit}`} entre ${first.year} y ${last.year}.`;
}
