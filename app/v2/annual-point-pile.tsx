'use client';
import {useEffect,useRef,useState} from 'react';
import {integer} from './universe-model';
type Props={scaleMaximum:number;previous:number|null;current:number|null;entries:number|null;exits:number|null;groups:{value:number;color:string}[];paused:boolean;replay:number};
const clamp=(n:number)=>Math.max(0,Math.min(1,n));
const smooth=(n:number)=>{const t=clamp(n);return t*t*(3-2*t);};
const scatter=(i:number)=>{const n=Math.sin(i*127.1+311.7)*43758.5453;return n-Math.floor(n);};

export default function AnnualPointPile({scaleMaximum,previous,current,entries,exits,groups,paused,replay}:Props){
  const canvas=useRef<HTMLCanvasElement>(null),time=useRef(0);
  const [reading,setReading]=useState({count:previous??current,phase:'Lista al inicio'});
  const start=previous??current??0,added=entries??0,removed=exits??0;
  const end=start+added-removed;
  const animate=previous!==null&&current!==null&&entries!==null&&end>=0;
  useEffect(()=>{time.current=0;},[previous,current,entries,exits,replay]);
  useEffect(()=>{
    const element=canvas.current,ctx=element?.getContext('2d');if(!ctx||!element)return;
    const media=matchMedia('(prefers-reduced-motion: reduce)');
    const dpr=Math.min(devicePixelRatio||1,2);element.width=1200*dpr;element.height=560*dpr;
    ctx.setTransform(2*dpr,0,0,2*dpr,0,0);
    const step=Math.min(2.7,Math.sqrt(130*165/Math.max(scaleMaximum,start,end,current??0,added,removed,1)));
    const columns=Math.floor(130/step),sideColumns=columns,r=step*.47;
    const point=(i:number,left:number,cols:number)=>({x:left+(i%cols+.5)*step,y:234-r-Math.floor(i/cols)*step});
    const dot=(x:number,y:number,color:string,alpha=1)=>{ctx.globalAlpha=alpha;ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();};
    const exitColor=(i:number)=>{let sum=0;for(const g of groups){sum+=g.value;if(i<sum)return g.color;}return '#b7ad9d';};
    let frame=0,last=0,lastReading=-1;
    const draw=(now:number)=>{
      if(!last)last=now;
      if(!paused&&!document.hidden)time.current=Math.min(2600,time.current+Math.min(now-last,50));
      last=now;
      const t=time.current/2600,still=media.matches||!animate;
      ctx.clearRect(0,0,600,280);
      let arrived=0,left=0;
      if(still){
        for(let i=0;i<(current??0);i++){const p=point(i,235,columns);dot(p.x,p.y,'#0047ab');}
        for(let i=0;i<added;i++){const p=point(i,45,sideColumns);dot(p.x,p.y,'#ed3900');}
        for(let i=0;i<removed;i++){const p=point(i,425,sideColumns);dot(p.x,p.y,exitColor(i));}
      }else{
        // New marks attach underneath while the top leaves at the same time.
        const departures=clamp(t/.70)*removed;
        const progress=Array.from({length:added},(_,j)=>clamp((t-j/Math.max(added,1)*.70)/.19));
        arrived=progress.filter(p=>p===1).length;
        const departed=Math.min(Math.floor(departures),start+arrived);
        left=departed;
        const removedNew=Math.max(0,departed-start),keptIncoming=arrived-removedNew;
        for(let i=0;i<start-departed;i++){const p=point(i+keptIncoming,235,columns);dot(p.x,p.y,'#0047ab');}
        let settled=0;
        for(let j=0;j<added;j++){
          const p=progress[j];
          if(p===1&&settled++<removedNew)continue;
          const a=point(added-1-j,45,sideColumns),b=point(p===1?arrived-settled:j%columns,235,columns),e=smooth(p);
          // Dip below the pile, then rise into its new bottom row.
          const bend=Math.sin(e*Math.PI)*(16+scatter(j+31)*34);
          dot(a.x+(b.x-a.x)*e,a.y+(b.y-a.y)*e+bend,'#ed3900');
        }
        // Top points leave the central pile and remain stacked on the exit base.
        for(let j=0;j<removed;j++){
          const p=clamp((t-j/Math.max(removed,1)*.70)/.19);
          if(!p)continue;
          const enteredAtDeparture=Math.floor(clamp((j/Math.max(removed,1)*.70-.19)/.70)*added);
          const a=point(Math.max(0,start-1-j+enteredAtDeparture),235,columns),b=point(j,425,sideColumns),e=smooth(p);
          dot(a.x+(b.x-a.x)*e,a.y+(b.y-a.y)*e-Math.sin(e*Math.PI)*(18+scatter(j+55)*45),exitColor(j));
        }
      }
      ctx.globalAlpha=1;
      if(now-lastReading>90){
        const phase=still?'Lista al cierre publicado':t<.91?(exits===null?'Ingresan por abajo':'Entran por abajo · salen por arriba'):exits===null?'Sin egresos verificados':'Resultado de los movimientos*';
        setReading({count:still?current:start+arrived-left,phase});lastReading=now;
        element.dataset.phase=phase;element.dataset.count=String(still?current:start+arrived-left);
      }
      frame=requestAnimationFrame(draw);
    };
    frame=requestAnimationFrame(draw);return()=>cancelAnimationFrame(frame);
  },[scaleMaximum,previous,current,entries,exits,start,end,added,removed,groups,paused,animate,replay]);
  return <div className="v2-point-pile">
    <canvas ref={canvas} aria-hidden="true"/>
    <svg viewBox="0 0 600 280" role="img" aria-label={`Ingresos ${entries===null?'sin dato':integer(entries)}; lista al cierre publicada ${current===null?'sin dato':integer(current)}; exclusiones permanentes ${exits===null?'sin dato':integer(exits)}. Un punto representa una inscripción o un registro de exclusión, sin vinculación individual.`}>
      <text x="110" y="27" textAnchor="middle" className="v2-flow-number">{entries===null?'s/d':integer(entries)}</text>
      <text x="300" y="38" textAnchor="middle" className="v2-flow-stock">{reading.count===null?'s/d':integer(reading.count)}</text>

      <text x="490" y="27" textAnchor="middle" className="v2-flow-number">{exits===null?'s/d':integer(exits)}</text>
      <line x1="35" x2="570" y1="234" y2="234" stroke="currentColor" opacity=".16"/>
      <g className="v2-flow-label"><text x="110" y="253" textAnchor="middle">Ingresos</text><text x="300" y="253" textAnchor="middle">La lista</text><text x="490" y="253" textAnchor="middle">Egresos*</text></g>
    </svg>
    <p className="v2-pile-observed">Cierre publicado: <strong>{current===null?'s/d':integer(current)}</strong>{animate&&exits!==null&&current!==end&&<span> · diferencia sin conciliar: {integer(current!-end)}</span>}</p>
  </div>;
}
