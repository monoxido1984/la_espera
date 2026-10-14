'use client';
import {useEffect,useRef,useState,type MutableRefObject} from 'react';
import {decimal,integer} from './universe-model';
import {journeyPosition,journeyState,cumulativeCalendar,type JourneyMetric} from './temporal-journey-model';

export type PointRelay={x:number;y:number};
export function JourneyControls({metric,onMetric,progress,onProgress}:{metric:JourneyMetric;onMetric:(m:JourneyMetric)=>void;progress:number;onProgress:(p:number)=>void}) {
  return <div className="v2-journey-controls">
    <div className="v2-tabs" role="group" aria-label="El recorrido del tiempo"><button aria-pressed={metric==='dialysis'} onClick={()=>onMetric('dialysis')}>Diálisis</button><button aria-pressed={metric==='list'} onClick={()=>onMetric('list')}>Lista de espera</button></div>
    {metric==='dialysis'&&<p className="v2-journey-rhythm">En hemodiálisis, en general se realizan 3 sesiones por semana, de unas 4 horas cada una.</p>}
    <p className="v2-journey-instruction">{progress<.62?'Arrastrá para hacer pasar el tiempo.':'Seguí arrastrando. Alejá la mirada.'}</p>
    <label className="v2-sr-only" htmlFor="v2-time-drag">Arrastrar para acumular tiempo</label>
    <input id="v2-time-drag" type="range" min="0" max="1000" step="1" value={Math.round(progress*1000)} onChange={e=>onProgress(Number(e.target.value)/1000)} aria-valuetext={progress<.62?`${Math.round(progress/.62*100)}% del recorrido individual`:`${Math.round((progress-.62)/.38*100)}% de la perspectiva colectiva`} />
    <div className="v2-journey-ends"><span>Una persona</span><span>El conjunto</span></div>
  </div>;
}

export default function TemporalJourney({progress,metric,months,records,paused,relay}:{progress:number;metric:JourneyMetric;months:number;records:number;paused:boolean;relay:MutableRefObject<PointRelay>}) {
  const box=useRef<HTMLDivElement>(null),canvas=useRef<HTMLCanvasElement>(null);
  const [size,setSize]=useState({width:0,height:0});
  const drawn=useRef(progress),entered=useRef<number|null>(null);
  const state=journeyState(progress,metric,months,records);
  useEffect(()=>{const observer=new ResizeObserver(entries=>{const {width,height}=entries[0].contentRect;setSize({width,height});});if(box.current)observer.observe(box.current);return()=>observer.disconnect();},[]);
  useEffect(()=>{
    const context=canvas.current?.getContext('2d');if(!context||!canvas.current||!size.width)return;
    const {width:w,height:h}=size,dpr=Math.min(2,devicePixelRatio||1);
    canvas.current.width=Math.round(w*dpr);canvas.current.height=Math.round(h*dpr);context.setTransform(dpr,0,0,dpr,0,0);
    let frame=0;if(entered.current===null)entered.current=performance.now();
    const draw=(now:number)=>{
      drawn.current=paused?progress:drawn.current+(progress-drawn.current)*.22;
      if(Math.abs(progress-drawn.current)<.0001)drawn.current=progress;
      const s=journeyState(drawn.current,metric,months,records);
      const arrival=paused?1:Math.min(1,(now-entered.current!)/1100);
      const easing=1-(1-arrival)**3;
      context.clearRect(0,0,w,h);
      // Each completed session/day retains its own slot; weeks never reset the ledger.
      const calendar=cumulativeCalendar(drawn.current,metric,months);
      const columns=metric==='dialysis'?24:28,rows=Math.ceil(calendar.total/columns);
      const cellW=w*.76/columns,cellH=h*.18/rows;
      context.globalAlpha=easing*.8;context.fillStyle='#b74d38';
      for(let i=0;i<calendar.steps;i++){
        const x=w*.12+(i%columns)*cellW,y=h*.46+Math.floor(i/columns)*cellH;
        context.fillRect(x,y,cellW*.6,cellH*.65);
      }
      context.globalAlpha=easing;context.font=`${w<400?9:11}px Arial`;context.fillStyle='#182321';
      context.fillText(`${integer(calendar.steps)} ${metric==='dialysis'?'sesiones de 4 horas':'días acumulados'} · de ${integer(calendar.total)}`,w*.12,h*.41);
      const position=journeyPosition(0,1,w,h,s.individual,0);
      const origin={x:relay.current.x*w,y:relay.current.y*h};
      if(!s.collective){
        context.strokeStyle='#b74d38';context.globalAlpha=.32*easing;context.lineWidth=1;
        context.beginPath();context.moveTo(w*.16,h*.8);context.lineTo(position.x,h*.8);context.stroke();
        // Successive calendar marks fold into one continuous path.
        const ticks=Math.round(s.individual*56);
        for(let i=0;i<ticks;i++){const x=w*.16+(i/56)*w*.68;context.beginPath();context.moveTo(x,h*.8-3);context.lineTo(x,h*.8+3);context.stroke();}
      }
      const radius=s.collective?Math.min(2,Math.sqrt(w*h*.1/(Math.PI*s.people))*.65):5;
      context.fillStyle='#b74d38';context.globalAlpha=easing;context.beginPath();
      for(let i=0;i<s.people;i++){
        const p=journeyPosition(i,s.people,w,h,s.individual,s.expansion);
        const x=origin.x+(p.x-origin.x)*easing,y=origin.y+(p.y-origin.y)*easing;
        context.moveTo(x+radius,y);context.arc(x,y,radius,0,Math.PI*2);
      }
      context.fill();
      if(s.collective){
        context.strokeStyle='#b74d38';context.globalAlpha=.14;context.lineWidth=.5;context.beginPath();
        for(let i=0;i<s.people;i++){
          const p=journeyPosition(i,s.people,w,h,s.individual,s.expansion),length=Math.min(w*.07,12+s.expansion*8);
          context.moveTo(p.x-length,p.y);context.quadraticCurveTo(p.x-length*.55,p.y-3*(1-s.expansion),p.x,p.y);
        }context.stroke();
      }
      context.globalAlpha=1;
      if(arrival<1||drawn.current!==progress)frame=requestAnimationFrame(draw);
    };frame=requestAnimationFrame(draw);return()=>cancelAnimationFrame(frame);
  },[size,progress,metric,months,records,paused,relay]);
  const scale=state.collective?(state.duration.fullYears>=100?'siglos':'años'):metric==='dialysis'?'horas en sesiones':'días en lista';
  const value=state.collective?state.duration.fullYears/(state.duration.fullYears>=100?100:1):state.duration.value;
  return <div ref={box} className="v2-temporal-journey">
    <canvas ref={canvas} aria-hidden="true"/>
    <div className="v2-journey-counter" aria-live="off"><strong>{progress?'≈ ':''}{state.collective?decimal(value):integer(value)}</strong><span>{scale}{state.collective?metric==='dialysis'?' acumulados dializándose en un año':' acumulados':''}{metric==='dialysis'?' · escenario anual':''}</span><p>{state.collective?`${integer(state.people)} ${metric==='dialysis'?'pacientes · 2025':'receptores'} · ${integer(state.duration.value)} ${metric==='dialysis'?'horas':'días en lista'}`:state.individual===1?`${decimal(months)} meses ${metric==='dialysis'?'del escenario · un año completo':'de calendario · un recorrido medio'}`:'Un recorrido. Una persona.'}</p></div>
    <p className="v2-journey-caption">{metric==='dialysis'?'Un punto · un paciente registrado en 2025 (corte al 31/12)':state.collective?'Un punto · un receptor renal trasplantado en 2025':'Recorrido ilustrativo del promedio · receptores renales 2025'}</p>
    <span className="v2-sr-only" role="status">{integer(state.people)} {state.collective?metric==='dialysis'?'pacientes al cierre de 2025 en un escenario hipotético':'receptores trasplantados':'recorrido ilustrativo'}, {decimal(value)} {scale}.</span>
  </div>;
}
