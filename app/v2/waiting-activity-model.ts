export type ActivityPoint={year:number;waiting:number|null;transplants:number|null;donors:number|null};
export type ActivityCounts={years:number[];lists:Record<string,{year:number;total:number;provinces:Record<string,number>}[]>};
export function activitySeries(counts:ActivityCounts,transplants:Record<string,number|null>,donors:Record<string,{organs:number}|null>,list:string,province:string|null,age:string):ActivityPoint[]{
  return counts.years.filter(year=>year>=2005&&year<=2025).map(year=>{
    const stock=counts.lists[list]?.find(row=>row.year===year);
    return {year,
      waiting:age!=='all'?null:province?stock?.provinces[province]??null:stock?.total??null,
      transplants:age!=='all'?null:transplants[`${list}|${year}|${province??'ARGENTINA'}`]??null,
      donors:donors[`${year}|${province??'ARGENTINA'}`]?.organs??null};
  });
}
export function activityPath(points:ActivityPoint[],key:'waiting'|'transplants'|'donors',x:(year:number)=>number,y:(value:number)=>number){
  return points.map((point,i)=>{
    const value=point[key];if(value===null)return '';
    const connected=i>0&&points[i-1][key]!==null&&points[i-1].year===point.year-1;
    return `${connected?'L':'M'}${x(point.year)},${y(value)}`;
  }).join(' ');
}
