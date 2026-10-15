export const ANNUAL_COLORS={waitlist:'#c2432c',donors:'#087e8b'};
type TrendYear={year:number;waitlist:number|null;donors:number;average:number|null;partial?:boolean};
export function annualTrend(history:TrendYear[],year:number,metric:'waitlist'|'donors'|'average',width:number,height:number,baseline:number){
  const first=Math.min(...history.map(r=>r.year)),last=Math.max(...history.map(r=>r.year));
  const max=Math.max(1,...history.map(r=>r[metric]??0));
  const amplitude=metric==='average'?.10:.065;
  return history.filter(r=>r.year<=year&&r[metric]!==null).map(r=>({year:r.year,value:r[metric]!,partial:Boolean(r.partial),x:width*(.09+.82*(r.year-first)/Math.max(1,last-first)),y:height*(baseline-amplitude*r[metric]!/max)}));
}
