type Point={x:number;y:number};
const fraction=(n:number)=>{const value=Math.sin(n*127.1+41.7)*43758.5453;return value-Math.floor(value);};
export function epiloguePoints(count:number,width:number,height:number){
  const radius=Math.min(width*.42,height*.37),angle=Math.PI*(3-Math.sqrt(5));
  return Array.from({length:count},(_,i)=>{
    const r=Math.sqrt((i+.5)/Math.max(1,count))*radius;
    return {from:{x:(.04+fraction(i+1)*.92)*width,y:(.06+fraction(i+37)*.88)*height},to:{x:width*.5+Math.cos(i*angle)*r,y:height*.48+Math.sin(i*angle)*r}};
  });
}
// Arrival offsets are graphic choreography, not observed individual waiting times.
export function epiloguePosition(index:number,progress:number,from:Point,to:Point):Point{
  const t=Math.max(0,Math.min(1,(progress-fraction(index+8)*.22)/.78)),ease=t*t*(3-2*t);
  const bend=Math.sin(t*Math.PI)*(fraction(index+53)-.5)*34;
  return {x:from.x+(to.x-from.x)*ease+bend,y:from.y+(to.y-from.y)*ease-bend*.45};
}
