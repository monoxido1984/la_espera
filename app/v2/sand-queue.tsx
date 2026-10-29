'use client';
import {useEffect,useRef,useState,type MutableRefObject} from 'react';
import {hourglassPoints} from './narrative-layouts';
import {numberPoints} from './waiting-universe';
import {integer,type Dot} from './universe-model';
import {crowdOrder,sandScrollState} from './crowd-release-model';
import {epiloguePosition} from './epilogue-model';
import {introScrollLayout} from './intro-scroll-model';
import NumberStoryGraphic from './number-story-graphic';
import {numberStoryStep} from './number-story-model';
import type {PointRelay} from './temporal-journey';

export type SandHandoff={points:Dot[];left:number;top:number};

function centerGlyph(points:Dot[],targetX:number,targetY:number){
  if(!points.length)return {points,bounds:{left:0,right:0,top:0,bottom:0}};
  const bounds=points.reduce((b,p)=>({left:Math.min(b.left,p.x),right:Math.max(b.right,p.x),top:Math.min(b.top,p.y),bottom:Math.max(b.bottom,p.y)}),{left:Infinity,right:-Infinity,top:Infinity,bottom:-Infinity});
  const cx=(bounds.left+bounds.right)/2,cy=(bounds.top+bounds.bottom)/2;
  const dx=targetX-cx,dy=targetY-cy;
  return {
    points:points.map(p=>({...p,x:p.x+dx,y:p.y+dy})),
    bounds:{left:bounds.left+dx,right:bounds.right+dx,top:bounds.top+dy,bottom:bounds.bottom+dy},
  };
}

export default function SandQueue({count,renalCount,step=0,registrationList='TOTAL',forming,paused,relay,handoff,onStepChange}:{snapshot?:string;count:number;renalCount:number;step?:number;registrationList?:string;forming:boolean;paused:boolean;relay:MutableRefObject<PointRelay>;handoff?:MutableRefObject<SandHandoff|null>;onStepChange?:(step:number)=>void}) {
  const box=useRef<HTMLDivElement>(null),canvas=useRef<HTMLCanvasElement>(null);
  const drawn=useRef<number|null>(null);
  const lastStep=useRef<number>(0);
  const stepCallback=useRef(onStepChange);
  stepCallback.current=onStepChange;
  const [size,setSize]=useState({width:0,height:0});
  useEffect(()=>{const observer=new ResizeObserver(entries=>{const {width,height}=entries[0].contentRect;setSize({width,height});});if(box.current)observer.observe(box.current);return()=>observer.disconnect();},[]);
  useEffect(()=>{
    const ctx=canvas.current?.getContext('2d');if(!ctx||!canvas.current||!size.width)return;
    const {width:w,height:h}=size,dpr=Math.min(2,devicePixelRatio||1);
    canvas.current.width=Math.round(w*dpr);canvas.current.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
    const mobile=w<=760,radius=Math.max(.55,Math.min(1.15,w/920));
    const cx=w*(mobile?.5:.80),cy=h*(mobile?.66:.45),vesselSize=Math.min(w*(mobile?.30:.14),h*(mobile?.17:.28)),oldSize=Math.min(w*.3,h*.4);
    const origins=hourglassPoints(count,w,h,0,radius).map(p=>({...p,x:cx+(p.x-w*.72)*vesselSize/oldSize,y:cy+(p.y-h*.48)*vesselSize/oldSize}));
    const numeralRaw=numberPoints(count,w*(mobile?.80:.58),h*(mobile?.21:.29),radius);
    const numeralCentered=centerGlyph(numeralRaw,w*.5,h*(mobile?.22:.25));
    const targets=numeralCentered.points;
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

      // Compute Scene 1 internal scroll progress (0..1 across #escena-1 height)
      const scene1Span=Math.max(1,numberSection.offsetHeight-window.innerHeight);
      const scene1Progress=Math.max(0,Math.min(1,-numberSection.getBoundingClientRect().top/scene1Span));
      const activeStep=numberStoryStep(scene1Progress);
      if(activeStep!==lastStep.current){
        lastStep.current=activeStep;
        stepCallback.current?.(activeStep);
      }

      const nextSection=document.getElementById('escena-2'),story=box.current?.closest<HTMLElement>('.waiting-v2');
      if(nextSection&&story){
        const layout=introScrollLayout(progress,nextSection.getBoundingClientRect().top,window.innerHeight);
        story.style.setProperty('--v2-intro-exit',`${layout.exit}px`);
        story.style.setProperty('--v2-opening-opacity',String(layout.openingOpacity));
        story.style.setProperty('--v2-number-opacity',String(layout.numberOpacity));
        story.dataset.introCopy=layout.openingOpacity>0?'opening':layout.numberOpacity>0?'number':'transition';
        story.dataset.numberStep=String(activeStep);
      }

      ctx.clearRect(0,0,w,h);
ctx.strokeStyle='#b74d38';ctx.lineWidth=mobile?1.5:2;ctx.lineCap='round';
      ctx.globalAlpha=Math.max(0,1-progress*1.5)*.75;
      ctx.beginPath();ctx.moveTo(cx-vesselSize*.79,cy-vesselSize);ctx.lineTo(cx+vesselSize*.79,cy-vesselSize);
      ctx.moveTo(cx-vesselSize*.79,cy-vesselSize*1.045);ctx.lineTo(cx+vesselSize*.79,cy-vesselSize*1.045);
      for(const direction of [-1,1]){
        ctx.moveTo(cx+direction*vesselSize*.7,cy-vesselSize*.92);
        ctx.bezierCurveTo(cx+direction*vesselSize*.6,cy-vesselSize*.35,cx+direction*vesselSize*.04,cy-vesselSize*.12,cx+direction*vesselSize*.04,cy);
        ctx.bezierCurveTo(cx+direction*vesselSize*.04,cy+vesselSize*.12,cx+direction*vesselSize*.6,cy+vesselSize*.35,cx+direction*vesselSize*.7,cy+vesselSize*.92);
      }
      const opening=Math.min(1,timeline.elapsed/.8)*vesselSize*.15;
      ctx.moveTo(cx-vesselSize*.75,cy+vesselSize);ctx.lineTo(cx-opening,cy+vesselSize);
      ctx.moveTo(cx+opening,cy+vesselSize);ctx.lineTo(cx+vesselSize*.75,cy+vesselSize);
      ctx.moveTo(cx-vesselSize*.79,cy+vesselSize*1.045);ctx.lineTo(cx+vesselSize*.79,cy+vesselSize*1.045);ctx.stroke();

      const current:Dot[]=[];

      ctx.globalAlpha=1;ctx.fillStyle='#b74d38';ctx.beginPath();
      for(let i=0;i<count;i++){
        const from=origins[i]??{x:w*.5,y:h*.5};
        const to=targets[order[i]]??from;
        const point=epiloguePosition(i,progress,from,to);
        ctx.moveTo(point.x+radius,point.y);ctx.arc(point.x,point.y,radius,0,Math.PI*2);
        current.push({...point,radius,color:'#b74d38',group:'total'});
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
  return <div ref={box} className="v2-sand-queue" data-story-step={forming?step+1:0}>
    <canvas ref={canvas} aria-hidden="true"/>
    {forming&&<NumberStoryGraphic registrationList={registrationList} step={step+1} count={count} renalCount={renalCount}/>}
    <p className="v2-sr-only">{integer(count)} inscripciones forman el reloj de arena. Los bloques siguientes muestran proporciones, tiempos de trámite y criterios de asignación.</p>
  </div>;
}
