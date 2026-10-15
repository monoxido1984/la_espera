function variation(index:number,salt:number) {const v=Math.sin((index+salt)*127.1)*43758.5453;return v-Math.floor(v);}
export function sandScrollState(distance:number,length:number) {
  const progress=Math.max(0,Math.min(1,distance/Math.max(1,length)));
  return {progress,fall:Math.min(1,progress/.3),elapsed:Math.max(0,(progress-.3)/.7)*16};
}
export function crowdOrder(count:number):number[] {
  const slots=Array.from({length:count},(_,i)=>i);let seed=9721;
  for(let i=count-1;i>0;i--){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const j=seed%(i+1);[slots[i],slots[j]]=[slots[j],slots[i]];}
  return slots;
}
export function crowdProgress(index:number,elapsed:number) {
  const delay=.8+variation(index,13)*3.6,duration=2.6+variation(index,74)*6.2;
  return Math.max(0,Math.min(1,(elapsed-delay)/duration));
}
export function crowdPosition(index:number,progress:number,from:{x:number;y:number},to:{x:number;y:number},width:number,height:number,outlet?:{x:number;y:number}) {
  if(progress<=0)return from;if(progress>=1)return to;
  const gate=outlet??{x:width*.65,y:height*.385};
  if(progress<.18){const u=progress/.18;return {x:from.x+(gate.x-from.x)*u,y:from.y+(gate.y-from.y)*u};}
  const p=(progress-.18)/.82,t=1-(1-p)**2;
  const a={x:Math.max(width*.04,Math.min(width*.96,gate.x+(variation(index,9)-.5)*width*.35)),y:outlet?gate.y+(to.y-gate.y)*.3:height*.49};
  const b={x:Math.max(width*.04,Math.min(width*.96,to.x+(variation(index,8)-.5)*width*.14)),y:outlet?gate.y+(to.y-gate.y)*.7:height*.61};
  return {x:(1-t)**3*gate.x+3*(1-t)**2*t*a.x+3*(1-t)*t*t*b.x+t**3*to.x,y:(1-t)**3*gate.y+3*(1-t)**2*t*a.y+3*(1-t)*t*t*b.y+t**3*to.y};
}
