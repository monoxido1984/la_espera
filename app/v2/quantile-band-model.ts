export type QuantileYear={year:number;median:number|null;p25:number|null;p75:number|null;partial?:boolean};
export function hasQuantileBand(row:QuantileYear):boolean {
  return !row.partial&&row.median!==null&&row.p25!==null&&row.p75!==null&&[row.median,row.p25,row.p75].every(Number.isFinite)&&row.p25<=row.median&&row.median<=row.p75;
}
export function quantileBandPath(rows:QuantileYear[],x:(year:number)=>number,y:(value:number)=>number):string {
  const segments:QuantileYear[][]=[];let segment:QuantileYear[]=[];
  for(const row of rows){
    if(!hasQuantileBand(row)){if(segment.length)segments.push(segment);segment=[];continue;}
    if(segment.length&&segment.at(-1)!.year!==row.year-1){segments.push(segment);segment=[];}
    segment.push(row);
  }
  if(segment.length)segments.push(segment);
  return segments.map(group=>group.map((row,i)=>`${i?'L':'M'}${x(row.year)},${y(row.p75!)}`).join(' ')+group.toReversed().map(row=>`L${x(row.year)},${y(row.p25!)}`).join(' ')+'Z').join(' ');
}
