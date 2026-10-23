'use client';
import {useEffect,useRef,useState} from 'react';
import partial from './partial-2026.generated.json';
import {decimal,integer,type HistoryYear} from './universe-model';
import {ANNUAL_COLORS} from './annual-trend-model';

export default function AnnualPartial({history}:{history:HistoryYear[]}){
  const box=useRef<HTMLDivElement>(null),canvas=useRef<HTMLCanvasElement>(null);
  const [size,setSize]=useState({width:0,height:0});
  useEffect(()=>{const observer=new ResizeObserver(entries=>{const {width,height}=entries[0].contentRect;setSize({width,height});});if(box.current)observer.observe(box.current);return()=>observer.disconnect();},[]);
  useEffect(()=>{
    if(!canvas.current||!size.width)return;
    const ctx=canvas.current.getContext('2d');if(!ctx)return;
    const {width:w,height:h}=size,dpr=Math.min(devicePixelRatio||1,2);
    canvas.current.width=Math.round(w*dpr);canvas.current.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
    const max=Math.max(...history.map(r=>Math.max(r.waitlist,r.donors))),rows=w<400?16:24,columns=Math.ceil(max/rows);
    const dx=w*.82/columns,dy=h*.07/rows,radius=Math.max(.36,Math.min(dx*.62,dy*.42));
    ctx.fillStyle=ANNUAL_COLORS.donors;ctx.beginPath();
    for(let i=0;i<partial.donors;i++){const x=w*.09+(Math.floor(i/rows)+.5)*dx,y=h*.76+(i%rows+.5)*dy;ctx.moveTo(x+radius,y);ctx.arc(x,y,radius,0,Math.PI*2);}
    ctx.fill();canvas.current.dataset.donors=String(partial.donors);canvas.current.dataset.period=partial.to;
  },[size,history]);
  return <div ref={box} className="v2-annual-parallel v2-partial-view">
    <canvas ref={canvas} aria-hidden="true"/>
    <div className="v2-parallel-median"><span>Media de espera renal · enero–julio 2026</span><strong>≈ {decimal(partial.renal.average)}<small> meses</small></strong><p>{integer(partial.renal.n)} receptores renales trasplantados.<br/>Media ponderada de los siete meses publicados.</p></div>
    <div className="v2-parallel-row" data-series="waitlist" style={{top:'38%'}}><span>En lista · corte al 31/07 no disponible</span><strong>s/d</strong></div>
    <p className="v2-partial-missing">{partial.waitlistReason}</p>
    <div className="v2-parallel-row" data-series="donors" style={{top:'61%'}}><span>Donantes de órganos y tejidos · enero–julio</span><strong>{integer(partial.donors)}</strong></div>
    <p className="v2-parallel-caption">Corte parcial: 01/01–31/07/2026. Una marca · un donante.<br/>La fila conserva la escala de cantidad. Este corte no prolonga la tendencia de años completos.</p>
  </div>;
}
