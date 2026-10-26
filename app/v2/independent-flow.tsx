'use client';
import {useId,useState,type ReactNode} from 'react';
import entries from './annual-entries.generated.json';
import {integer,decimal} from './universe-model';
import type {flowGroups} from './annual-flow-model';

import {flowBands,type Item} from './independent-flow-model';
type Entry={total:number|null;diagnoses:{code:string;label:string;value:number}[]};
export default function IndependentFlow({list,year,province,age,groups,exits,stock,children}:{list:string;year:number;province:string|null;age:string;groups:ReturnType<typeof flowGroups>;exits:number|null;flowEntries:number|null;stock:number|null;children:ReactNode}){
  const [expanded,setExpanded]=useState(false),[exitKind,setExitKind]=useState<string|null>(null),[selected,setSelected]=useState<string|null>(null);
  const patternId=useId().replace(/:/g,'');
  const entry=age==='all'?(entries.rows as Record<string,Entry>)[`${list}|${year}|${province??'ARGENTINA'}`]:undefined;
  const diagnoses=[...(entry?.diagnoses??[])].sort((a,b)=>b.value-a.value||a.code.localeCompare(b.code));
  const incomingColors=['#b74d38','#c77c53','#a8664d','#d09a6d'];
  const incoming:Item[]=diagnoses.slice(0,4).map((d,index)=>({id:`in-${d.code}`,label:d.label,value:d.value,color:incomingColors[index]}));
  const rest=diagnoses.slice(4);
  if(rest.length)incoming.push({id:'in-rest',label:'Otros diagnósticos',value:rest.reduce((s,d)=>s+d.value,0),color:'#a87964'});
  const [dc,dv,death,other]=groups;
  const outgoing:Item[]=exits===null?[]:[...(exitKind==='transplant'?[dc,dv]:[{id:'transplant',label:'Trasplantes',value:dc.value+dv.value,color:dc.color}]),death,...(exitKind==='other'?other.items.map(d=>({id:d.canonicalId,label:d.label,value:d.value,color:other.color})):[other])];
  const detail=flowBands(diagnoses.map(d=>({id:`in-${d.code}`,label:d.label,value:d.value,color:'#a87964'})));
  const chosen=[...flowBands(incoming).map(d=>({...d,side:'Diagnósticos'})),...detail.map(d=>({...d,side:'Diagnósticos'})),...flowBands(outgoing).map(d=>({...d,side:'Egresos'}))].find(d=>`${d.side}:${d.id}`===selected);
  function column(items:Item[],side:string){return <div className={`v2-independent-side ${side==='Diagnósticos'?'v2-independent-in':'v2-independent-out'}`}><h4>{side==='Diagnósticos'?'Ingresos':'Egresos'}</h4><div className="v2-independent-items">{flowBands(items).map(d=><button type="button" key={d.id} aria-pressed={selected===`${side}:${d.id}`} onClick={()=>setSelected(selected===`${side}:${d.id}`?null:`${side}:${d.id}`)} style={{borderLeftColor:d.color}}><span>{d.label}</span><strong>{integer(d.value)} <small>· {decimal(d.percent)}%</small></strong><i className="v2-flow-dot-bar" aria-hidden="true" style={{color:d.color,width:`${Math.max(5,d.percent)}%`}}/></button>)}</div>{side==='Diagnósticos'?<>{!entry||entry.total===null?<p>Sin desglose publicado para este cruce.</p>:<p>{integer(entry.total)} por fecha de inscripción</p>}{rest.length>0&&<><button type="button" aria-expanded={expanded} onClick={()=>{if(expanded&&detail.slice(4).some(d=>selected===`Diagnósticos:${d.id}`))setSelected(null);setExpanded(!expanded);}}>{expanded?'Cerrar diagnósticos':'Desplegar diagnósticos'} {expanded?'−':'+'}</button>{expanded&&<div className="v2-independent-detail" role="group" aria-label="Otros diagnósticos"><p>Otros diagnósticos</p>{detail.slice(4).map(d=><button type="button" key={d.id} aria-pressed={selected===`Diagnósticos:${d.id}`} onClick={()=>setSelected(selected===`Diagnósticos:${d.id}`?null:`Diagnósticos:${d.id}`)}><span>{d.label}</span><strong>{integer(d.value)} · {decimal(d.percent)}%</strong></button>)}</div>}</>}</>:<>{exits===null?<p>Sin egresos publicados para este cruce.</p>:<div className="v2-independent-expand">{['transplant','other'].map(kind=><button type="button" key={kind} aria-expanded={exitKind===kind} onClick={()=>setExitKind(exitKind===kind?null:kind)}>{kind==='transplant'?'Trasplantes':'Otros motivos'} {exitKind===kind?'−':'+'}</button>)}</div>}</>}</div>;}
  const diagramHeight=Math.max(430,incoming.length*76+50,outgoing.length*76+50);
  function ribbon(items:Item[],side:'Diagnósticos'|'Egresos'){
    const total=items.reduce((sum,item)=>sum+item.value,0);
    let center=diagramHeight*.22;
    return items.map((item,index)=>{
      const thickness=total?Math.max(item.value/total*diagramHeight*.52,3):0;
      const row=46+index*76+25;
      const start=side==='Diagnósticos'?260:640,end=side==='Diagnósticos'?380:520;
      const middle=(start+end)/2;
      const path=`M${start},${row-thickness/2} C${middle},${row-thickness/2} ${middle},${center} ${end},${center} L${end},${center+thickness} C${middle},${center+thickness} ${middle},${row+thickness/2} ${start},${row+thickness/2}Z`;
      center+=thickness;
      const id=`${patternId}-${side}-${index}`;
      const active=!selected||selected===`${side}:${item.id}`||(side==='Diagnósticos'&&item.id==='in-rest'&&detail.slice(4).some(d=>selected===`Diagnósticos:${d.id}`));
      return <g key={id} opacity={active?.9:.16}><defs><pattern id={id} width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="2.5" cy="2.5" r="1.45" fill={item.color}/></pattern></defs><path d={path} fill={`url(#${id})`}/></g>;
    });
  }
  return <div className="v2-independent-flow">
    <svg viewBox={`0 0 900 ${diagramHeight}`} preserveAspectRatio="none" className="v2-independent-bands" style={{height:diagramHeight}} aria-hidden="true">{ribbon(incoming,'Diagnósticos')}{ribbon(outgoing,'Egresos')}</svg>
    {column(incoming,'Diagnósticos')}
    <div className="v2-independent-center"><h4>Lista de espera</h4><strong>{stock===null?'s/d':integer(stock)}</strong><span>Stock publicado al cierre</span><div className="v2-independent-animation">{children}</div></div>
    {column(outgoing,'Egresos')}
    {chosen&&<div className="v2-independent-caption" aria-live="polite"><p><strong>{chosen.label}</strong> · {integer(chosen.value)} · {decimal(chosen.percent)}% de {chosen.side.toLowerCase()} del reporte.</p></div>}
  </div>;
}
