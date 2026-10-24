'use client';
import {useEffect,useRef} from 'react';
import {annualMovementFrame,annualStoryLayout,type AnnualMoment,type HistoryMetric,type StoryDot} from './annual-story-model';
import type {ComparisonYear} from './annual-comparison-model';
type Props={moment:AnnualMoment;metric:HistoryMetric;entries:number|null;exits:number|null;groups:{value:number;color:string}[];maximum:number;history:ComparisonYear[];paused:boolean;replay:number;previous:number|null;current:number|null;onBalance:(n:number|null)=>void};
export default function AnnualPointPile({moment,metric,entries,exits,groups,maximum,history,paused,replay,previous,current,onBalance}:Props){
  const canvas=useRef<HTMLCanvasElement>(null),displayed=useRef<StoryDot[]>([]);
  useEffect(()=>{
    const element=canvas.current,ctx=element?.getContext('2d');if(!element||!ctx)return;
    const target=annualStoryLayout({moment,metric,entries,exits,groups,maximum,history});
    const old=new Map(displayed.current.map(dot=>[dot.id,dot]));
    const from=target.map(dot=>old.get(dot.id)??{...dot,alpha:0});
    const dpr=Math.min(devicePixelRatio||1,2);element.width=600*dpr;element.height=360*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
    const media=matchMedia('(prefers-reduced-motion: reduce)');let frame=0,start:number|null=null,lastReading=-1;
    const draw=(now:number)=>{
      if(start===null)start=now;
      const t=paused||media.matches?1:Math.min(1,(now-start)/(moment==='movements'?3200:850)),e=t*t*(3-2*t);
      ctx.clearRect(0,0,600,360);
      if(moment==='movements'){
        const state=annualMovementFrame({previous,current,entries,exits,maximum,progress:t});displayed.current=state.dots;
        if(now-lastReading>80||t===1){onBalance(state.count);lastReading=now;}
      }else displayed.current=target.map((dot,i)=>{const a=from[i];return {...dot,x:a.x+(dot.x-a.x)*e,y:a.y+(dot.y-a.y)*e,r:a.r+(dot.r-a.r)*e,alpha:a.alpha+(dot.alpha-a.alpha)*e};});
      for(const dot of displayed.current){if(dot.alpha<.005)continue;ctx.globalAlpha=dot.alpha;ctx.fillStyle=dot.color;ctx.beginPath();ctx.arc(dot.x,dot.y,dot.r,0,Math.PI*2);ctx.fill();}
      ctx.globalAlpha=1;if(t<1)frame=requestAnimationFrame(draw);
    };
    const update=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(draw);};media.addEventListener('change',update);update();
    return()=>{cancelAnimationFrame(frame);media.removeEventListener('change',update);};
  },[moment,metric,entries,exits,groups,maximum,history,paused,replay,previous,current,onBalance]);
  return <canvas ref={canvas} className="v2-annual-story-canvas" aria-hidden="true"/>;
}
