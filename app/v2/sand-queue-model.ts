export const QUEUE_GRAINS=64;
export function sandQueueState(count:number,progress:number) {
  const cursor=Math.max(0,Math.min(1,progress))*count;
  const settled=Math.min(count,Math.floor(cursor));
  const flowing=Math.min(QUEUE_GRAINS,count-settled);
  return {settled,flowing,waiting:count-settled-flowing,fraction:cursor-settled};
}
// A single continuous outlet-to-numeral queue, sampled by graphic grain slots.
export function queuePosition(t:number,width:number,height:number,target:{x:number;y:number}) {
  const u=Math.max(0,Math.min(1,t));
  const source={x:width*.65,y:height*.39};
  const elbow={x:source.x,y:height*.57};
  if(u<.55)return {x:source.x,y:source.y+(elbow.y-source.y)*u/.55};
  const p=(u-.55)/.45;
  return {x:(1-p)**2*elbow.x+2*(1-p)*p*target.x+p*p*target.x,y:(1-p)**2*elbow.y+2*(1-p)*p*elbow.y+p*p*target.y};
}
