type Point={x:number;y:number};
const fraction=(n:number)=>{const value=Math.sin(n*127.1+41.7)*43758.5453;return value-Math.floor(value);};
export function epiloguePoints(count:number,width:number,height:number,targets?:Point[],origins?:Point[]){
  const columns=Math.max(1,Math.ceil(Math.sqrt(count*width/Math.max(1,height)))),rows=Math.max(1,Math.ceil(count/columns));
  return Array.from({length:count},(_,i)=>({
    from:origins?.[i]??{x:(.04+fraction(i+1)*.92)*width,y:(.06+fraction(i+37)*.88)*height},
    to:targets?.[i]??{x:(.05+.9*((i%columns)+.5)/columns)*width,y:(.05+.9*(Math.floor(i/columns)+.5)/rows)*height}
  }));
}
// Arrival offsets are graphic choreography, not observed individual waiting times.
export function epiloguePosition(index:number,progress:number,from:Point,to:Point):Point{
  const t=Math.max(0,Math.min(1,(progress-fraction(index+8)*.22)/.78)),ease=t*t*(3-2*t);
  const bend=Math.sin(t*Math.PI)*(fraction(index+53)-.5)*34;
  return {x:from.x+(to.x-from.x)*ease+bend,y:from.y+(to.y-from.y)*ease-bend*.45};
}

// Abstract open threshold. Every inscription retains one distinct graphic mark.
export function thresholdPoints(count:number,width:number,height:number):Point[]{
 const radius=Math.min(width*.29,height*.31),cx=width*.5,cy=height*.43,bottom=height*.84;
 const vertical=Math.max(1,bottom-cy),length=vertical*2+Math.PI*radius;
 const thickness=Math.max(5,radius*.13);
 return Array.from({length:count},(_,i)=>{
  const distance=(i+.5)/Math.max(1,count)*length,offset=(fraction(i+101)-.5)*thickness;
  if(distance<vertical)return {x:cx-radius+offset,y:bottom-distance};
  if(distance<vertical+Math.PI*radius){const angle=Math.PI+(distance-vertical)/radius;return {x:cx+(radius+offset)*Math.cos(angle),y:cy+(radius+offset)*Math.sin(angle)};}
  return {x:cx+radius+offset,y:cy+distance-vertical-Math.PI*radius};
 });
}
