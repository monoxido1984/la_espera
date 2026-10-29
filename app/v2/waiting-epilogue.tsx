'use client';
import {useEffect,useRef,useState,type MouseEvent} from 'react';
import {epiloguePoints,epiloguePosition} from './epilogue-model';
import {hourglassPoints} from './narrative-layouts';
import {integer} from './universe-model';
import {numberPoints} from './waiting-universe';

export default function WaitingEpilogue({count,paused,focused,onFocus}:{count:number;snapshot:string;paused:boolean;focused:number|null;onFocus:(index:number|null)=>void}){
  const box=useRef<HTMLDivElement>(null),canvas=useRef<HTMLCanvasElement>(null);
  const positions=useRef<{x:number;y:number}[]>([]),hover=useRef<number|null>(null);
  const gathered=useRef(0);
  const [size,setSize]=useState({width:0,height:0});
  useEffect(()=>{const observer=new ResizeObserver(rows=>{const {width,height}=rows[0].contentRect;setSize({width,height});});if(box.current)observer.observe(box.current);return()=>observer.disconnect();},[]);
  useEffect(()=>{
    const element=canvas.current,ctx=element?.getContext('2d');if(!element||!ctx||!size.width)return;
    const {width,height}=size,dpr=Math.min(devicePixelRatio||1,2);
    const mobile=width<=520;
    const radius=Math.max(.55,Math.min(1.2,Math.sqrt(width*height/Math.max(1,count))*.15));
    const cx=width*.5,cy=height*.45,s=Math.min(width*(mobile?.38:.34),height*.37),oldS=Math.min(width*.3,height*.4);
    const rawSand=hourglassPoints(count,width,height,.42,radius);
    const sandTargets=rawSand.map(g=>({
      x:cx+(g.x-width*.72)*s/oldS,
      y:cy+(g.y-height*.48)*s/oldS,
    }));
    const points=epiloguePoints(count,width,height,sandTargets,numberPoints(count,width,height,1));
    element.width=Math.round(width*dpr);element.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
    let frame=0,progress=paused?1:gathered.current,last=performance.now();
    function draw(now:number){
      const rect=document.getElementById('escena-4')?.getBoundingClientRect();
      const target=paused?1:Math.max(0,Math.min(1,(innerHeight*.8-(rect?.top??0))/(innerHeight*.55)));
      const dt=Math.min(64,now-last);last=now;
      progress+=(target-progress)*(1-Math.exp(-dt/130));
      if(Math.abs(target-progress)<.0002)progress=target;
      gathered.current=progress;
      const selected=focused??hover.current;
      ctx!.clearRect(0,0,width,height);

      // Draw hourglass vessel contour as points gather into the hourglass
      const vesselAlpha=Math.max(0,(progress-.18)/.82)*(selected===null?.75:.28);
      if(vesselAlpha>.01){
        ctx!.strokeStyle='#b74d38';
        ctx!.lineWidth=mobile?1.5:2;
        ctx!.lineCap='round';
        ctx!.globalAlpha=vesselAlpha;
        ctx!.beginPath();
        ctx!.moveTo(cx-s*.79,cy-s);ctx!.lineTo(cx+s*.79,cy-s);
        ctx!.moveTo(cx-s*.79,cy-s*1.045);ctx!.lineTo(cx+s*.79,cy-s*1.045);
        for(const direction of [-1,1]){
          ctx!.moveTo(cx+direction*s*.7,cy-s*.92);
          ctx!.bezierCurveTo(cx+direction*s*.6,cy-s*.35,cx+direction*s*.04,cy-s*.12,cx+direction*s*.04,cy);
          ctx!.bezierCurveTo(cx+direction*s*.04,cy+s*.12,cx+direction*s*.6,cy+s*.35,cx+direction*s*.7,cy+s*.92);
        }
        ctx!.moveTo(cx-s*.75,cy+s);ctx!.lineTo(cx+s*.75,cy+s);
        ctx!.moveTo(cx-s*.79,cy+s*1.045);ctx!.lineTo(cx+s*.79,cy+s*1.045);
        ctx!.stroke();
      }

      ctx!.fillStyle='#b74d38';ctx!.globalAlpha=selected===null?.88:.18;ctx!.beginPath();
      positions.current=points.map((point,i)=>{
        const p=epiloguePosition(i,progress,point.from,point.to);
        ctx!.moveTo(p.x+radius,p.y);ctx!.arc(p.x,p.y,radius,0,Math.PI*2);return p;
      });
      ctx!.fill();ctx!.globalAlpha=1;
      const point=selected===null?undefined:positions.current[selected];
      if(point){
        const pulse=paused?0:(Math.sin(now/800)+1)*.5;
        ctx!.strokeStyle='#b74d38';ctx!.lineWidth=1.2;ctx!.globalAlpha=.55;
        ctx!.beginPath();ctx!.arc(point.x,point.y,10+pulse*6,0,Math.PI*2);ctx!.stroke();
        ctx!.globalAlpha=1;ctx!.beginPath();ctx!.arc(point.x,point.y,Math.max(3.2,radius+1.2),0,Math.PI*2);ctx!.fill();
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
    <button type="button" className="v2-epilogue-points" aria-label="Acercarse a una espera entre todas en el reloj de arena. Usá las flechas para detenerte en otro punto." onPointerMove={event=>{hover.current=nearest(event);}} onPointerLeave={()=>{hover.current=null;}} onClick={event=>{const index=nearest(event);if(index===null)next();else onFocus(focused===index?null:index);}} onKeyDown={event=>{if(event.key.startsWith('Arrow')){event.preventDefault();next();}if(event.key==='Escape')onFocus(null);}}><canvas ref={canvas} aria-hidden="true"/></button>
    <div className="v2-epilogue-reading" aria-live="polite"><p>{focused===null?'Una espera a contrarreloj.':'Una persona entre miles que esperan.'}</p><span>{integer(count)} inscripciones activas</span></div>
  </div>;
}
