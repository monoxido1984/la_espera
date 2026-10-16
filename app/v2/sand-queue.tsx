'use client';
import {useEffect,useRef,useState,type MutableRefObject} from 'react';
import {numberPoints} from './waiting-universe';
import {hourglassPoints} from './narrative-layouts';
import {integer,type Dot} from './universe-model';
import {crowdOrder,crowdProgress,crowdPosition,sandScrollState} from './crowd-release-model';
import {introScrollLayout} from './intro-scroll-model';
import type {PointRelay} from './temporal-journey';

export type SandHandoff={points:Dot[];left:number;top:number};
export default function SandQueue({count,forming,paused,relay,handoff}:{count:number;forming:boolean;paused:boolean;relay:MutableRefObject<PointRelay>;handoff?:MutableRefObject<SandHandoff|null>}) {
  const box=useRef<HTMLDivElement>(null),canvas=useRef<HTMLCanvasElement>(null);
  const drawn=useRef<number|null>(null);
  const [size,setSize]=useState({width:0,height:0});
  useEffect(()=>{const observer=new ResizeObserver(entries=>{const {width,height}=entries[0].contentRect;setSize({width,height});});if(box.current)observer.observe(box.current);return()=>observer.disconnect();},[]);
  useEffect(()=>{
    const ctx=canvas.current?.getContext('2d');if(!ctx||!canvas.current||!size.width)return;
    const {width:w,height:h}=size,dpr=Math.min(2,devicePixelRatio||1);
    canvas.current.width=Math.round(w*dpr);canvas.current.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
    const mobile=w<=760,radius=Math.max(.45,Math.min(1.05,w/1000));
    const numeral=numberPoints(count,w*.88,h*.64,radius);
    const bounds=numeral.reduce((b,p)=>({left:Math.min(b.left,p.x),right:Math.max(b.right,p.x),top:Math.min(b.top,p.y),bottom:Math.max(b.bottom,p.y)}),{left:Infinity,right:-Infinity,top:Infinity,bottom:-Infinity});
    // Center the actual glyph bounds, rather than the font's baseline box.
    const targets=numeral.map(p=>({...p,x:p.x+w*.5-(bounds.left+bounds.right)/2,y:p.y+h*.5-(bounds.top+bounds.bottom)/2}));
    const order=crowdOrder(count);
    let frame=0,last=performance.now();
    const draw=(now:number)=>{
      const openingSection=document.getElementById('escena-0'),numberSection=document.getElementById('escena-1');
      if(!openingSection||!numberSection)return;
      const target=paused?(forming?1:0):sandScrollState(-openingSection.getBoundingClientRect().top,numberSection.offsetTop-openingSection.offsetTop).progress;
      const dt=Math.min(64,now-last);last=now;
      drawn.current=paused||drawn.current===null?target:drawn.current+(target-drawn.current)*(1-Math.exp(-dt/90));
      if(Math.abs(target-drawn.current)<.0002)drawn.current=target;
      const timeline=sandScrollState(drawn.current,1),progress=timeline.progress;
      const nextSection=document.getElementById('escena-2'),story=box.current?.closest<HTMLElement>('.waiting-v2');
      if(nextSection&&story){
        const layout=introScrollLayout(progress,nextSection.getBoundingClientRect().top,window.innerHeight);
        story.style.setProperty('--v2-intro-exit',`${layout.exit}px`);
        story.style.setProperty('--v2-opening-opacity',String(layout.openingOpacity));
        story.style.setProperty('--v2-number-opacity',String(layout.numberOpacity));
        story.dataset.introCopy=layout.openingOpacity>0?'opening':layout.numberOpacity>0?'number':'transition';
      }
      const cx=w*(mobile?.5:.80),cy=h*(mobile?.66:.45),s=Math.min(w*(mobile?.30:.14),h*(mobile?.17:.28)),oldS=Math.min(w*.3,h*.4);
      const sand=hourglassPoints(count,w,h,timeline.fall,radius);
      ctx.clearRect(0,0,w,h);ctx.strokeStyle='#b74d38';ctx.lineWidth=mobile?1.5:2;ctx.lineCap='round';
      ctx.globalAlpha=Math.max(0,1-progress*1.5)*.75;
      ctx.beginPath();ctx.moveTo(cx-s*.79,cy-s);ctx.lineTo(cx+s*.79,cy-s);
      ctx.moveTo(cx-s*.79,cy-s*1.045);ctx.lineTo(cx+s*.79,cy-s*1.045);
      for(const direction of [-1,1]){
        ctx.moveTo(cx+direction*s*.7,cy-s*.92);
        ctx.bezierCurveTo(cx+direction*s*.6,cy-s*.35,cx+direction*s*.04,cy-s*.12,cx+direction*s*.04,cy);
        ctx.bezierCurveTo(cx+direction*s*.04,cy+s*.12,cx+direction*s*.6,cy+s*.35,cx+direction*s*.7,cy+s*.92);
      }
      const opening=Math.min(1,timeline.elapsed/.8)*s*.15;
      ctx.moveTo(cx-s*.75,cy+s);ctx.lineTo(cx-opening,cy+s);
      ctx.moveTo(cx+opening,cy+s);ctx.lineTo(cx+s*.75,cy+s);
      ctx.moveTo(cx-s*.79,cy+s*1.045);ctx.lineTo(cx+s*.79,cy+s*1.045);ctx.stroke();
      ctx.globalAlpha=1;ctx.fillStyle='#b74d38';ctx.beginPath();
      const current:Dot[]=[];
      for(let i=0;i<count;i++){
        const grain=sand[i],from={x:cx+(grain.x-w*.72)*s/oldS,y:cy+(grain.y-h*.48)*s/oldS};
        const travel=crowdProgress(i,timeline.elapsed);
        const point=crowdPosition(i,travel,from,targets[order[i]],w,h,{x:cx,y:cy+s});
        if(point){ctx.moveTo(point.x+radius,point.y);ctx.arc(point.x,point.y,radius,0,Math.PI*2);current.push({...point,radius,color:'#b74d38',group:'total'});}
      }
      ctx.fill();
      if(handoff&&box.current){const rect=box.current.getBoundingClientRect();handoff.current={points:current,left:rect.left,top:rect.top};}
      const anchor=targets.at(-1);if(anchor)relay.current={x:anchor.x/w,y:anchor.y/h};
      frame=!paused&&drawn.current!==target?requestAnimationFrame(draw):0;
    };
    const schedule=()=>{if(!frame){last=performance.now();frame=requestAnimationFrame(draw);}};
    window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);
    schedule();return()=>{cancelAnimationFrame(frame);window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);};
  },[size,count,forming,paused,relay,handoff]);
  return <div ref={box} className="v2-sand-queue"><canvas ref={canvas} aria-hidden="true"/><p className="v2-sr-only">{integer(count)} inscripciones. Una puerta se abre en la base del reloj. Los puntos salen hacia lugares diferentes de la cifra y llegan en momentos distintos. La composición permanece fija mientras avanzan los textos.</p>{forming&&<p className="v2-sand-unit">Un punto · una inscripción en lista de espera</p>}</div>;
}
