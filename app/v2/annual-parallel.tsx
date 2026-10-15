'use client';
import {useEffect,useRef,useState} from 'react';
import {decimal,integer} from './universe-model';
import {annualTrend,ANNUAL_COLORS} from './annual-trend-model';
import {MILESTONES} from '../historical-milestones';
import type {ComparisonYear} from './annual-comparison-model';

export default function AnnualParallel({record,history,countMaximum,scope}:{record:ComparisonYear;history:ComparisonYear[];countMaximum:number;scope:string}){
  const box=useRef<HTMLDivElement>(null),canvas=useRef<HTMLCanvasElement>(null);
  const [size,setSize]=useState({width:0,height:0});
  useEffect(()=>{const observer=new ResizeObserver(entries=>{const {width,height}=entries[0].contentRect;setSize({width,height});});if(box.current)observer.observe(box.current);return()=>observer.disconnect();},[]);
  useEffect(()=>{
    if(!canvas.current||!size.width)return;
    const ctx=canvas.current.getContext('2d');if(!ctx)return;
    const {width:w,height:h}=size,dpr=Math.min(devicePixelRatio||1,2);
    canvas.current.width=Math.round(w*dpr);canvas.current.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
    const rows=w<400?16:24,columns=Math.ceil(countMaximum/rows);
    const dx=w*.82/columns,dy=h*.07/rows,radius=Math.max(.36,Math.min(dx*.62,dy*.42));
    for(const [value,y,color] of [[record.waitlist,h*.50,ANNUAL_COLORS.waitlist],[record.donors,h*.76,ANNUAL_COLORS.donors]] as const){
      if(value===null)continue;
      ctx.fillStyle=color;ctx.beginPath();
      for(let i=0;i<value;i++){const x=w*.09+(Math.floor(i/rows)+.5)*dx,py=y+(i%rows+.5)*dy;ctx.moveTo(x+radius,py);ctx.arc(x,py,radius,0,Math.PI*2);}
      ctx.fill();
    }
    canvas.current.dataset.waitlist=record.waitlist===null?'unavailable':String(record.waitlist);canvas.current.dataset.donors=String(record.donors);canvas.current.dataset.year=String(record.year);canvas.current.dataset.list=record.label;
  },[record,countMaximum,size]);
  return <div ref={box} className="v2-annual-parallel" data-partial={record.partial}>
    <canvas ref={canvas} aria-hidden="true"/>
    <div className="v2-parallel-median"><span>Media de espera · {record.label}{record.partial?' · enero–julio':''}</span><strong data-available={record.average!==null}>{record.average===null?'s/d':decimal(record.average)}{record.average!==null&&<small> {record.unit}</small>}</strong><p>{record.average===null?'Sin tiempo disponible para esta selección.':`${integer(record.n)} ${record.n===1?'receptor trasplantado':'receptores trasplantados'} en ${record.year}${record.partial?' hasta el 31/07':''}.`}<br/>{scope}</p></div>
    <div className="v2-parallel-row" data-series="waitlist" style={{top:'30%'}}><span>En lista · {record.label}<small className="v2-trend-unit">Línea: media de espera · {record.unit}</small></span><strong>{record.waitlist===null?'s/d':integer(record.waitlist)}</strong></div>
    {record.waitlist===null&&<p className="v2-parallel-unavailable">{record.countReason}</p>}
    <div className="v2-parallel-row" data-series="donors" style={{top:'58%'}}><span>Donantes de órganos y tejidos · total nacional{record.partial?' · enero–julio':''}</span><strong>{integer(record.donors)}</strong></div>
    <svg className="v2-parallel-trends" viewBox={`0 0 ${size.width||1} ${size.height||1}`} role="img" aria-label={`Evolución de la media de espera de ${record.label}, en ${record.unit}, y del total nacional de donantes entre 2005 y ${record.year}. Escalas independientes desde cero. Los donantes parciales de 2026 no se conectan a los años completos.`}>
      {(['average','donors'] as const).map((metric,index)=>{
        const points=annualTrend(history,record.year,metric,size.width,size.height,index?.74:.48),full=points.filter(p=>!p.partial),last=points.at(-1),previous=full.at(-1);
        return <g key={metric} style={{color:ANNUAL_COLORS[metric==='average'?'waitlist':metric]}}>
          <path className="v2-trend-baseline" d={`M${size.width*.09},${size.height*(index?.74:.48)}H${size.width*.91}`}/>
          <path className="v2-trend-line" data-series={metric} d={full.map((p,i)=>`${i&&full[i-1].year===p.year-1?'L':'M'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')}/>
          {metric==='average'&&last?.partial&&previous?.year===last.year-1&&<path className="v2-trend-line v2-trend-partial" data-series="average-partial" d={`M${previous.x},${previous.y}L${last.x},${last.y}`}/>}
          {full.filter(p=>MILESTONES.some(e=>e.year===p.year)).map(p=><circle key={p.year} cx={p.x} cy={p.y} r={p.year===record.year?4:2.4} className="v2-trend-event"/>)}
          {last&&<circle cx={last.x} cy={last.y} r={last.partial?4:3.4} fill={last.partial?'var(--v2-paper)':'currentColor'} stroke="currentColor" strokeWidth={last.partial?2:0}/>}
          {metric==='average'&&points.filter((_,i)=>i===0||i===points.length-1).map((p,i)=><text className="v2-trend-value" key={p.year} x={p.x} y={p.y+14} textAnchor={i?'end':'start'}>{p.year}{p.partial?'*':''} · {decimal(p.value)} {record.unit==='días'?'d':'m'}</text>)}
          {metric==='donors'&&last?.partial&&<text className="v2-trend-value" x={last.x} y={last.y+14} textAnchor="end">2026 parcial</text>}
        </g>;
      })}
    </svg>
    <p className="v2-parallel-caption">Filas: misma escala de cantidad. Una marca · una inscripción o un donante.<br/>Arriba: media de espera de {record.label} ({record.unit}). Abajo: donantes, todas las listas.<br/>{record.partial?`2026*: corte al 31/07. ${record.average===null?'Sin media disponible para julio en esta selección.':'Media con tramo discontinuo.'} Donantes parciales sin unión con años completos.`:'Cada curva utiliza su propia escala desde cero. Los tiempos describen receptores trasplantados.'}</p>
  </div>;
}
