'use client';
import {useEffect,useRef,useState,type MutableRefObject} from 'react';
import {decimal,integer} from './universe-model';
import {journeyPosition,journeyState,cumulativeCalendar,dialysisBlock,type JourneyMetric} from './temporal-journey-model';

export type PointRelay={x:number;y:number};
export function JourneyControls({progress,onProgress,records}:{progress:number;onProgress:(p:number)=>void;records:number}) {
  return <div className="v2-journey-controls">
    <p className="v2-journey-label">Diálisis</p>
    <p className="v2-journey-rhythm">En este escenario: 3 sesiones por semana, de 4 horas, durante un año.</p>
    <p className="v2-journey-instruction" id="v2-time-help" aria-live="polite">{progress<.62?'Arrastrá para hacer pasar el tiempo.':progress<.70?'156 sesiones se reúnen en una persona.':progress<1?'Seguí arrastrando. Sumá personas y tiempo.':'Llegaste al conjunto. Podés volver atrás y recorrerlo a tu ritmo.'}</p>
    <label className="v2-sr-only" htmlFor="v2-time-drag">Arrastrar para acumular tiempo</label>
    <input id="v2-time-drag" aria-describedby="v2-time-help" type="range" min="0" max="1000" step="1" value={Math.round(progress*1000)} onChange={e=>onProgress(Number(e.target.value)/1000)} aria-valuetext={progress<.62?`${Math.round(progress/.62*100)}% del recorrido individual`:progress<.70?'Las 156 sesiones se reúnen en 624 horas para una persona':`${Math.round((progress-.70)/.30*100)}% de la perspectiva colectiva`} />
    <div className="v2-journey-ends"><span>Una persona · 624 h</span><span>El conjunto · {integer(records)} personas</span></div>
    {progress<.62?<button type="button" className="v2-small-switch" onClick={()=>onProgress(.62)}>Recorrer un año: 624 horas →</button>:progress<1?<button type="button" className="v2-small-switch" onClick={()=>onProgress(1)}>Sumar el tiempo de las {integer(records)} personas →</button>:<button type="button" className="v2-small-switch" onClick={()=>onProgress(.62)}>← Volver a una persona</button>}
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
      if(!canvas.current)return;
      drawn.current=paused?progress:drawn.current+(progress-drawn.current)*.22;
      if(Math.abs(progress-drawn.current)<.0001)drawn.current=progress;
      const s=journeyState(drawn.current,metric,months,records);
      const arrival=paused?1:Math.min(1,(now-entered.current!)/1100);
      const easing=1-(1-arrival)**3;
      context.clearRect(0,0,w,h);
      if(metric==='dialysis'){
        const calendar=cumulativeCalendar(drawn.current,metric,months),columns=24,rows=Math.ceil(calendar.total/columns);
        const cellW=w*.82/columns,cellH=h*.30/rows,collapse=s.collapse*s.collapse*(3-2*s.collapse);
        context.globalAlpha=easing;context.fillStyle='#b74d38';
        if(!s.collective&&s.collapse<1){
          for(let i=0;i<calendar.steps;i++){
            const x=w*.09+(i%columns+.5)*cellW,y=h*.56+(Math.floor(i/columns)+.5)*cellH;
            const side=Math.min(cellW*.67,cellH*.67),size=side+(18-side)*collapse;
            const px=x+(w*.5-x)*collapse,py=y+(h*.73-y)*collapse;
            context.fillRect(px-size/2,py-size/2,size,size);
          }
        }else{
          for(let i=0;i<s.people;i++){const b=dialysisBlock(i,s.people,w,h,s.expansion);context.fillRect(b.x-b.size/2,b.y-b.size/2,b.size,b.size);}
        }
        context.fillStyle='#182321';context.font=`${w<400?10:12}px Arial`;
        context.fillText(s.collapse===0?'Un cuadrado = 4 horas · una sesión':s.collapse<1?'156 sesiones → 624 horas → una persona':`Un cuadrado = 624 horas · un año por persona`,w*.09,h*.52);
        canvas.current!.dataset.sessions=String(calendar.steps);canvas.current!.dataset.people=String(s.people);canvas.current!.dataset.collapse=s.collapse.toFixed(3);canvas.current!.dataset.hours=String(s.duration.hours);
        context.globalAlpha=1;
        if(arrival<1||drawn.current!==progress)frame=requestAnimationFrame(draw);
        return;
      }
      // Each completed session/day retains its own slot; weeks never reset the ledger.
      const calendar=cumulativeCalendar(drawn.current,metric,months);
      const columns=28,rows=Math.ceil(calendar.total/columns);
      const cellW=w*.76/columns,cellH=h*.12/rows;
      context.globalAlpha=easing*.8;context.fillStyle='#b74d38';
      for(let i=0;i<calendar.steps;i++){
        const x=w*.12+(i%columns)*cellW,y=h*.56+Math.floor(i/columns)*cellH;
        context.fillRect(x,y,cellW*.6,cellH*.65);
      }
      context.globalAlpha=easing;context.font=`${w<400?9:11}px Arial`;context.fillStyle='#182321';
      context.fillText(`${integer(calendar.steps)} días acumulados · de ${integer(calendar.total)}`,w*.12,h*.52);
      const position=journeyPosition(0,1,w,h,s.individual,0);
      const origin={x:relay.current.x*w,y:relay.current.y*h};
      if(!s.collective){
        context.strokeStyle='#b74d38';context.globalAlpha=.32*easing;context.lineWidth=1;
        context.beginPath();context.moveTo(w*.16,h*.84);context.lineTo(position.x,h*.84);context.stroke();
        // Successive calendar marks fold into one continuous path.
        const ticks=Math.round(s.individual*56);
        for(let i=0;i<ticks;i++){const x=w*.16+(i/56)*w*.68;context.beginPath();context.moveTo(x,h*.84-3);context.lineTo(x,h*.84+3);context.stroke();}
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
    <div className="v2-journey-counter" data-collective={state.collective} aria-live="off"><strong>{progress?'≈ ':''}{state.collective?decimal(value):integer(value)}</strong><span>{state.collective?<><b className="v2-accumulated-title">{scale} de tiempo colectivo</b>{metric==='dialysis'&&<small className="v2-accumulated-detail">en sesiones de diálisis · escenario de un año</small>}</>:<>{scale}{metric==='dialysis'?' · escenario anual':''}</>}</span><p>{state.collective?`${integer(state.people)} ${metric==='dialysis'?'pacientes · 2025':'receptores'} · ${integer(state.duration.value)} ${metric==='dialysis'?'horas':'días en lista'}`:state.individual===1?`${decimal(months)} meses ${metric==='dialysis'?'del escenario · un año completo':'de calendario · media publicada'}`:'Un recorrido. Una persona.'}</p></div>
    <p className="v2-journey-caption">{metric==='dialysis'?(state.collapse===0?'Un cuadrado · una sesión de 4 horas':state.collapse<1?'Las sesiones se reúnen, su tiempo se conserva.':'Un cuadrado · 156 sesiones · 624 horas por persona'):state.collective?'Un punto · un receptor renal trasplantado en 2025':'Recorrido ilustrativo de la media · receptores renales 2025'}</p>
    <span className="v2-sr-only" role="status">{integer(state.people)} {state.collective?metric==='dialysis'?'pacientes al cierre de 2025 en un escenario hipotético':'receptores trasplantados':'recorrido ilustrativo'}, {decimal(value)} {scale}.</span>
  </div>;
}
