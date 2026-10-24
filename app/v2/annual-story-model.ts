export type AnnualMoment='movements'|'causes'|'history';
export type HistoryMetric='stock'|'time';
export function historyTime(row:{median?:number|null;average:number|null}){
  if(row.median!=null)return {value:row.median,kind:'median' as const};
  return {value:row.average,kind:'mean' as const};
}
export type StoryDot={id:string;x:number;y:number;color:string;alpha:number;r:number};
type Group={value:number;color:string};
type Year={year:number;waitlist:number|null;average:number|null;median?:number|null;p75?:number|null;partial:boolean};
export function annualStoryLayout({moment,entries,exits,groups,maximum,history,metric}:{moment:AnnualMoment;entries:number|null;exits:number|null;groups:Group[];maximum:number;history:Year[];metric:HistoryMetric}):StoryDot[]{
  const incoming=entries??0,outgoing=exits??0;
  const step=Math.min(4,Math.sqrt(120*210/Math.max(1,maximum,incoming,outgoing)));
  const cols=Math.max(1,Math.floor(120/step));
  const pile=(i:number,center:number)=>({x:center-60+(i%cols+.5)*step,y:285-(Math.floor(i/cols)+.5)*step});
  const series=history.filter(row=>!row.partial&&row.year<=2025);
  const values=series.map(row=>metric==='stock'?row.waitlist:historyTime(row).value);
  const scale=Math.max(1,...values.filter((value):value is number=>value!==null),...(metric==='time'?series.map(row=>row.p75??0):[]));
  const marks=series.flatMap((row,i)=>values[i]===null?[]:[{x:45+(row.year-2005)/20*510,y:285-values[i]!/scale*225}]);
  const result:StoryDot[]=[];
  for(let i=0;i<incoming;i++)result.push({id:`in-${i}`,...pile(i,155),r:step*.43,color:'#b74d38',alpha:moment==='movements'?1:0});
  let boundary=0;
  const transplant=(groups[0]?.value??0)+(groups[1]?.value??0);
  for(let i=0;i<outgoing;i++){
    let index=0;boundary=0;
    while(index<groups.length-1&&i>=boundary+groups[index].value){boundary+=groups[index].value;index++;}
    const lane=i<transplant?0:i<transplant+(groups[2]?.value??0)?1:2;
    const offset=lane===0?0:lane===1?transplant:transplant+(groups[2]?.value??0);
    result.push({id:`out-${i}`,...pile(moment==='causes'?i-offset:i,moment==='causes'?[115,300,485][lane]:445),r:step*.43,color:moment==='movements'?'#7400bd':groups[index]?.color??'#617f87',alpha:moment==='history'?0:1});
  }
  // Historical marks are a graphic relay, not counts or linked patient records.
  if(moment==='history')[...result.filter(dot=>dot.id.startsWith('out-')),...result.filter(dot=>dot.id.startsWith('in-'))].forEach((dot,i)=>{const mark=marks[i];if(mark){dot.x=mark.x;dot.y=mark.y;dot.r=3;dot.color='#b74d38';dot.alpha=1;}else dot.alpha=0;});
  return result;
}

export function annualMovementFrame({previous,current,entries,exits,maximum,progress}:{previous:number|null;current:number|null;entries:number|null;exits:number|null;maximum:number;progress:number}){
  const valid=previous!==null&&entries!==null&&exits!==null&&previous+entries>=exits;
  const start=previous??current??0,added=entries??0,removed=exits??0;
  const end=valid?start+added-removed:current;
  const clamp=(n:number)=>Math.max(0,Math.min(1,n));
  const smooth=(n:number)=>{const t=clamp(n);return t*t*(3-2*t);};
  const step=Math.min(3,Math.sqrt(110*210/Math.max(1,maximum,start+added,removed,current??0)));
  const cols=Math.max(1,Math.floor(110/step)),r=step*.43;
  const pile=(i:number,center:number)=>({x:center-55+(i%cols+.5)*step,y:285-(Math.floor(i/cols)+.5)*step});
  const dots:StoryDot[]=[];let arrived=0,departed=0;
  if(!valid){
    for(let i=0;i<(current??0);i++)dots.push({id:`base-${i}`,...pile(i,300),color:'#0052cc',r,alpha:1});
    for(let i=0;i<added;i++)dots.push({id:`in-${i}`,...pile(i,110),color:'#b74d38',r,alpha:1});
    for(let i=0;i<removed;i++)dots.push({id:`out-${i}`,...pile(i,490),color:'#7400bd',r,alpha:1});
    return {dots,count:current,end,valid};
  }
  const total=start+added;
  const entering=Array.from({length:added},(_,j)=>clamp((progress-j/Math.max(1,added)*.65)/.15));
  arrived=entering.filter(value=>value===1).length;
  for(let i=0;i<total;i++){
    const incoming=i>=start,j=i-start;
    const enter=incoming?entering[j]:1;
    // New marks attach below the blue list; the original blue top leaves first.
    const departure=incoming?start+j:start-1-i,isLeaving=departure<removed;
    const exitStart=Math.max(departure/Math.max(1,removed)*.65,incoming?j/Math.max(1,added)*.65+.16:0);
    const leave=isLeaving?clamp((progress-exitStart)/.16):0;
    if(isLeaving&&leave===1)departed++;
    const centralIndex=incoming?Math.max(0,arrived-1-j):i+arrived;
    const a=incoming?pile(added-1-j,110):pile(centralIndex,300),b=pile(centralIndex,300),c=isLeaving?pile(departure,490):b;
    const e=smooth(enter),l=smooth(leave);
    const x=a.x+(b.x-a.x)*e,y=a.y+(b.y-a.y)*e+Math.sin(e*Math.PI)*(incoming?25:0);
    dots.push({id:isLeaving?`out-${departure}`:incoming?`in-${j}`:`base-${i}`,x:x+(c.x-x)*l,y:y+(c.y-y)*l-Math.sin(l*Math.PI)*25,r,color:leave>0?'#7400bd':incoming&&enter<1?'#b74d38':'#0052cc',alpha:1});
  }
  return {dots,count:start+arrived-departed,end,valid};
}
