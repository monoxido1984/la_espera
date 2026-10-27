'use client';
import {useEffect,useRef} from 'react';
import {annualMovementFrame,annualStoryLayout,type AnnualMoment,type HistoryMetric,type StoryDot} from './annual-story-model';
import type {ComparisonYear} from './annual-comparison-model';

type Props={moment:AnnualMoment;metric:HistoryMetric;entries:number|null;exits:number|null;groups:{value:number;color:string}[];maximum:number;history:ComparisonYear[];paused:boolean;replay:number;previous:number|null;current:number|null;onBalance?:(n:number|null)=>void};

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
      const t=paused||media.matches?1:Math.min(1,(now-start)/(moment==='movements'?3000:850)),e=t*t*(3-2*t);
      ctx.clearRect(0,0,600,360);
      if(moment==='movements'){
        const incoming=entries??0,stock=current??0,outgoing=exits??0;
        const step=Math.min(3,Math.sqrt(110*210/Math.max(1,maximum,(previous??stock)+incoming,outgoing,stock)));
        const cols=Math.max(1,Math.floor(110/step)),r=step*.43;
        const pile=(i:number,center:number)=>({x:center-55+(i%cols+.5)*step,y:285-(Math.floor(i/cols)+.5)*step});

        if(t<1){
          const state=annualMovementFrame({previous,current,entries,exits,maximum,progress:t});
          displayed.current=state.dots;
          if(onBalance&&(now-lastReading>80||t===1)){onBalance(state.count);lastReading=now;}
          // Keep base grid of INGRESOS visible at 22% opacity so it never becomes an empty void during animation
          if(incoming>0){
            ctx.save();
            ctx.globalAlpha=0.22;
            ctx.fillStyle='#b74d38';
            ctx.beginPath();
            for(let i=0;i<incoming;i++){
              const p=pile(i,110);
              ctx.moveTo(p.x+r,p.y);
              ctx.arc(p.x,p.y,r,0,Math.PI*2);
            }
            ctx.fill();
            ctx.restore();
          }
        }else{
          // Animation finished: render all 3 complete blocks matching their official counts exactly
          const finalDots:StoryDot[]=[];
          for(let i=0;i<incoming;i++)finalDots.push({id:`in-${i}`,...pile(i,110),r,color:'#b74d38',alpha:1});
          for(let i=0;i<stock;i++)finalDots.push({id:`stock-${i}`,...pile(i,300),r,color:'#0052cc',alpha:1});
          for(let i=0;i<outgoing;i++)finalDots.push({id:`out-${i}`,...pile(i,490),r,color:'#7400bd',alpha:1});
          displayed.current=finalDots;
          if(onBalance)onBalance(stock);
        }
      }else displayed.current=target.map((dot,i)=>{const a=from[i];return {...dot,x:a.x+(dot.x-a.x)*e,y:a.y+(dot.y-a.y)*e,r:a.r+(dot.r-a.r)*e,alpha:a.alpha+(dot.alpha-a.alpha)*e};});
      for(const dot of displayed.current){if(dot.alpha<.005)continue;ctx.globalAlpha=dot.alpha;ctx.fillStyle=dot.color;ctx.beginPath();ctx.arc(dot.x,dot.y,dot.r,0,Math.PI*2);ctx.fill();}
      ctx.globalAlpha=1;if(t<1)frame=requestAnimationFrame(draw);
    };
    const update=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(draw);};media.addEventListener('change',update);update();
    return()=>{cancelAnimationFrame(frame);media.removeEventListener('change',update);};
  },[moment,metric,entries,exits,groups,maximum,history,paused,replay,previous,current,onBalance]);
  return <canvas ref={canvas} className="v2-annual-story-canvas" aria-hidden="true"/>;
}
