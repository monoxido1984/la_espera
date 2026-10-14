'use client';
import {useEffect,useRef,useState,type MutableRefObject} from 'react';
import {numberPoints} from './waiting-universe';
import {hourglassPoints} from './narrative-layouts';
import {integer} from './universe-model';
import {crowdOrder,crowdProgress,crowdPosition,sandScrollState} from './crowd-release-model';
import type {PointRelay} from './temporal-journey';

export default function SandQueue({count,forming,paused,relay}:{count:number;forming:boolean;paused:boolean;relay:MutableRefObject<PointRelay>}) {
  const box=useRef<HTMLDivElement>(null),canvas=useRef<HTMLCanvasElement>(null);
  const drawn=useRef<number|null>(null);
  const [size,setSize]=useState({width:0,height:0});
  useEffect(()=>{const observer=new ResizeObserver(entries=>{const {width,height}=entries[0].contentRect;setSize({width,height});});if(box.current)observer.observe(box.current);return()=>observer.disconnect();},[]);
  useEffect(()=>{
    const ctx=canvas.current?.getContext('2d');if(!ctx||!canvas.current||!size.width)return;
    const {width:w,height:h}=size,dpr=Math.min(2,devicePixelRatio||1);
    canvas.current.width=Math.round(w*dpr);canvas.current.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
    const radius=Math.max(.45,Math.min(.85,w/800));
    const targets=numberPoints(count,w,h*.4,radius).map(p=>({...p,y:p.y+h*.57}));
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
      const cx=w*.65,cy=h*.22,s=Math.min(w*.17,h*.16),oldS=Math.min(w*.3,h*.4);
      const sand=hourglassPoints(count,w,h,timeline.fall,radius);
      ctx.clearRect(0,0,w,h);ctx.strokeStyle='#b74d38';ctx.lineWidth=1;
      ctx.globalAlpha=1-progress*.85;
      ctx.beginPath();ctx.moveTo(cx-s*.75,cy-s);ctx.lineTo(cx+s*.75,cy-s);
      for(const direction of [-1,1]){
        ctx.moveTo(cx+direction*s*.7,cy-s*.92);
        ctx.bezierCurveTo(cx+direction*s*.6,cy-s*.35,cx+direction*s*.04,cy-s*.12,cx+direction*s*.04,cy);
        ctx.bezierCurveTo(cx+direction*s*.04,cy+s*.12,cx+direction*s*.6,cy+s*.35,cx+direction*s*.7,cy+s*.92);
      }
      const opening=Math.min(1,timeline.elapsed/.8)*s*.15;
      ctx.moveTo(cx-s*.75,cy+s);ctx.lineTo(cx-opening,cy+s);
      ctx.moveTo(cx+opening,cy+s);ctx.lineTo(cx+s*.75,cy+s);ctx.stroke();
      ctx.globalAlpha=1;ctx.fillStyle='#b74d38';ctx.beginPath();
      for(let i=0;i<count;i++){
        const grain=sand[i],from={x:cx+(grain.x-w*.72)*s/oldS,y:cy+(grain.y-h*.48)*s/oldS};
        const travel=crowdProgress(i,timeline.elapsed);
        const point=crowdPosition(i,travel,from,targets[order[i]],w,h);
        if(point){ctx.moveTo(point.x+radius,point.y);ctx.arc(point.x,point.y,radius,0,Math.PI*2);}
      }
      ctx.fill();
      const anchor=targets.at(-1);if(anchor)relay.current={x:anchor.x/w,y:anchor.y/h};
      frame=!paused&&drawn.current!==target?requestAnimationFrame(draw):0;
    };
    const schedule=()=>{if(!frame){last=performance.now();frame=requestAnimationFrame(draw);}};
    window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);
    schedule();return()=>{cancelAnimationFrame(frame);window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);};
  },[size,count,forming,paused,relay]);
  return <div ref={box} className="v2-sand-queue"><canvas ref={canvas} aria-hidden="true"/><p className="v2-sr-only">{integer(count)} inscripciones. Una puerta se abre en la base del reloj. Los puntos salen hacia lugares diferentes de la cifra y llegan en momentos distintos. La composición permanece fija mientras avanzan los textos.</p>{forming&&<p className="v2-sand-unit">Un punto · una inscripción en lista de espera</p>}</div>;
}
