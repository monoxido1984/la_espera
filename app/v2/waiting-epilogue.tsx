'use client';
import {useEffect,useRef,useState,type MouseEvent} from 'react';
import {epiloguePoints,epiloguePosition} from './epilogue-model';
import {integer} from './universe-model';

export default function WaitingEpilogue({count,snapshot,paused,focused,onFocus}:{count:number;snapshot:string;paused:boolean;focused:number|null;onFocus:(index:number|null)=>void}){
  const box=useRef<HTMLDivElement>(null),canvas=useRef<HTMLCanvasElement>(null);
  const positions=useRef<{x:number;y:number}[]>([]),hover=useRef<number|null>(null);
  const gathered=useRef(0);
  const [size,setSize]=useState({width:0,height:0});
  useEffect(()=>{const observer=new ResizeObserver(rows=>{const {width,height}=rows[0].contentRect;setSize({width,height});});if(box.current)observer.observe(box.current);return()=>observer.disconnect();},[]);
  useEffect(()=>{
    const element=canvas.current,ctx=element?.getContext('2d');if(!element||!ctx||!size.width)return;
    const {width,height}=size,dpr=Math.min(devicePixelRatio||1,2),points=epiloguePoints(count,width,height);
    element.width=Math.round(width*dpr);element.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
    const radius=Math.max(.5,Math.min(1.2,Math.sqrt(width*height/Math.max(1,count))*.15));
    let frame=0,progress=paused?1:gathered.current,last=performance.now();
    function draw(now:number){
      const rect=document.getElementById('escena-4')?.getBoundingClientRect();
      const target=paused?1:Math.max(0,Math.min(1,(innerHeight*.65-(rect?.top??0))/(innerHeight*.9)));
      const dt=Math.min(64,now-last);last=now;
      progress+= (target-progress)*(1-Math.exp(-dt/130));
      if(Math.abs(target-progress)<.0002)progress=target;
      gathered.current=progress;
      const selected=focused??hover.current;
      ctx!.clearRect(0,0,width,height);ctx!.fillStyle='#b74d38';ctx!.globalAlpha=selected===null?.72:.28;ctx!.beginPath();
      positions.current=points.map((point,i)=>{
        const p=epiloguePosition(i,progress,point.from,point.to);
        ctx!.moveTo(p.x+radius,p.y);ctx!.arc(p.x,p.y,radius,0,Math.PI*2);return p;
      });
      ctx!.fill();ctx!.globalAlpha=1;
      const point=selected===null?undefined:positions.current[selected];
      if(point){
        const pulse=paused?0:(Math.sin(now/800)+1)*.5;
        ctx!.strokeStyle='#b74d38';ctx!.lineWidth=1;ctx!.globalAlpha=.45;
        ctx!.beginPath();ctx!.arc(point.x,point.y,10+pulse*6,0,Math.PI*2);ctx!.stroke();
        ctx!.globalAlpha=1;ctx!.beginPath();ctx!.arc(point.x,point.y,radius+1,0,Math.PI*2);ctx!.fill();
      }
      frame=!paused?requestAnimationFrame(draw):0;
    }
    draw(performance.now());
    return()=>cancelAnimationFrame(frame);
  },[count,size,paused,focused]);
  function nearest(event:MouseEvent<HTMLButtonElement>){
    const rect=event.currentTarget.getBoundingClientRect(),x=event.clientX-rect.left,y=event.clientY-rect.top;
    let found:number|null=null,distance=28*28;
    positions.current.forEach((point,i)=>{const d=(point.x-x)**2+(point.y-y)**2;if(d<distance){distance=d;found=i;}});
    return found;
  }
  function next(){onFocus(((focused??0)+Math.max(1,Math.floor(count*.381966)))%Math.max(1,count));}
  return <div ref={box} className="v2-epilogue-visual">
    <button type="button" className="v2-epilogue-points" aria-label="Mirar una espera entre todas. Usá las flechas para detenerte en otro punto." onPointerMove={event=>{hover.current=nearest(event);}} onPointerLeave={()=>{hover.current=null;}} onClick={event=>{const index=nearest(event);if(index===null)next();else onFocus(focused===index?null:index);}} onKeyDown={event=>{if(event.key.startsWith('Arrow')){event.preventDefault();next();}if(event.key==='Escape')onFocus(null);}}><canvas ref={canvas} aria-hidden="true"/></button>
    <div className="v2-epilogue-reading" aria-live="polite"><p>{focused===null?'Juntas en una cifra.':'Una espera. Una vida.'}</p><span>{integer(count)} inscripciones · {snapshot}</span></div>
  </div>;
}
