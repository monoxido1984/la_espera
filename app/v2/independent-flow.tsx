'use client';
import {useState,type ReactNode} from 'react';
import entries from './annual-entries.generated.json';
import {integer,decimal} from './universe-model';
import type {flowGroups} from './annual-flow-model';
import {isGenericDiagnosis,toSentenceCase} from './current-diagnoses';

import {flowBands,type Item} from './independent-flow-model';
type Entry={total:number|null;diagnoses:{code:string;label:string;value:number}[]};

export default function IndependentFlow({list,year,province,age,groups,exits,flowEntries,stock,children}:{list:string;year:number;province:string|null;age:string;groups:ReturnType<typeof flowGroups>;exits:number|null;flowEntries:number|null;stock:number|null;children:ReactNode}){
  const [expanded,setExpanded]=useState(false),[exitKind,setExitKind]=useState<string|null>(null),[selected,setSelected]=useState<string|null>(null),[openSide,setOpenSide]=useState<'entries'|'exits'|null>(null);
  const entry=age==='all'?(entries.rows as Record<string,Entry>)[`${list}|${year}|${province??'ARGENTINA'}`]:undefined;
  const allDiagnoses=entry?.diagnoses??[];
  const specific=allDiagnoses.filter(d=>!isGenericDiagnosis(d.label)).sort((a,b)=>b.value-a.value||a.code.localeCompare(b.code));
  const generic=allDiagnoses.filter(d=>isGenericDiagnosis(d.label));
  const genericTotal=generic.reduce((sum,d)=>sum+d.value,0);
  const firstSpecific=specific.slice(0,4);
  const restSpecific=specific.slice(4);
  const restSpecificTotal=restSpecific.reduce((sum,d)=>sum+d.value,0);
  const otherTotal=genericTotal+restSpecificTotal;
  const incomingColors=['#b74d38','#c77c53','#a8664d','#d09a6d'];
  const incoming:Item[]=[
    ...firstSpecific.map((d,index)=>({id:`in-${d.code}`,label:toSentenceCase(d.label),value:d.value,color:incomingColors[index]??'#a8664d'})),
    ...(otherTotal>0?[{id:'in-rest',label:'Otros diagnósticos o sin especificar',value:otherTotal,color:'#a87964'}]:[])
  ];
  const [dc,dv,death,other]=groups;
  const outgoing:Item[]=exits===null?[]:[{id:'transplant',label:'Trasplantes',value:dc.value+dv.value,color:dc.color},death,other];
  const detail=flowBands([
    ...restSpecific.map(d=>({id:`in-${d.code}`,label:toSentenceCase(d.label),value:d.value,color:'#a87964'})),
    ...generic.map(d=>({id:`in-${d.code}`,label:toSentenceCase(d.label),value:d.value,color:'#a87964'}))
  ]);
  const exitDetail=flowBands([dc,dv,death,...other.items.map(d=>({id:d.canonicalId,label:d.label,value:d.value,color:other.color}))]);
  const chosen=[...flowBands(incoming).map(d=>({...d,side:'Diagnósticos'})),...detail.map(d=>({...d,side:'Diagnósticos'})),...flowBands(outgoing).map(d=>({...d,side:'Egresos'})),...exitDetail.map(d=>({...d,side:'Egresos'}))].find(d=>`${d.side}:${d.id}`===selected);
  type Side = 'entries' | 'exits';
  function toggleSide(side: Side) {
    setOpenSide(openSide === side ? null : side);
    setExpanded(false);
    setExitKind(null);
    setSelected(null);
  }
  function itemButton(item: ReturnType<typeof flowBands>[number], side: Side, nested = false) {
    const name = side === 'entries' ? 'Diagnósticos' : 'Egresos';
    const key = name + ':' + item.id;
    const expandable = !nested && (item.id === 'in-rest' || item.id === 'transplant' || item.id === other.id);
    const opened = item.id === 'in-rest' ? expanded : item.id === 'transplant' ? exitKind === 'transplant' : item.id === other.id ? exitKind === 'other' : false;
    return <button type="button" className="v2-flow-summary-row" key={key} aria-pressed={selected === key} aria-expanded={expandable ? opened : undefined} onClick={() => {
      setSelected(selected === key ? null : key);
      if (item.id === 'in-rest') setExpanded(!expanded);
      if (item.id === 'transplant') setExitKind(exitKind === 'transplant' ? null : 'transplant');
      if (item.id === other.id) setExitKind(exitKind === 'other' ? null : 'other');
    }}>
      <i aria-hidden="true" style={{background: item.color}}/>
      <span>{item.label}{expandable ? (opened ? ' −' : ' +') : ''}</span>
      <strong>{integer(item.value)} · {decimal(item.percent)}%</strong>
    </button>;
  }
  function column(side: Side) {
    const isEntry = side === 'entries';
    const count = isEntry ? flowEntries : exits;
    const open = openSide === side;
    const rows = flowBands(isEntry ? incoming : outgoing);
    const nested = isEntry ? (expanded ? detail : []) : exitKind === 'transplant' ? exitDetail.slice(0,2) : exitKind === 'other' ? exitDetail.slice(3) : [];
    const label = isEntry ? 'Ingresos' : 'Egresos';
    return <div className={'v2-independent-side ' + (isEntry ? 'v2-independent-in' : 'v2-independent-out')}>
      <h4>{label}</h4>
      <div className="v2-flow-col-header">
        <strong className="v2-independent-total">{count === null ? 's/d' : integer(count)}</strong>
        <span className="v2-independent-total-label">{isEntry ? 'Ingresos registrados en el año' : 'Egresos registrados en el año'}</span>
        <button type="button" className="v2-flow-summary-action" aria-expanded={open} onClick={() => toggleSide(side)}>
          {isEntry ? 'Explorar motivos de ingreso' : 'Explorar motivos de egreso'} {open ? '−' : '+'}
        </button>
      </div>
      {open && <div className="v2-flow-summary-panel" role="group" aria-label={isEntry ? 'Diagnósticos de ingreso' : 'Motivos de egreso'}>
        <div className="v2-independent-detail-header"><p>{isEntry ? 'Diagnósticos' : 'Motivos de egreso'}</p><button type="button" onClick={() => toggleSide(side)}>Cerrar ×</button></div>
        {rows.length ? rows.map(item => itemButton(item, side)) : <p>Sin desglose publicado para este cruce.</p>}
        {isEntry && entry?.total != null && entry.total !== flowEntries && <p>{integer(entry.total)} por fecha de inscripción</p>}
        {nested.length > 0 && <div className="v2-flow-summary-nested">{nested.map(item => itemButton(item, side, true))}</div>}
      </div>}
    </div>;
  }
  return <div className="v2-independent-flow v2-flow-summary">
    {column('entries')}
    <div className="v2-independent-center"><h4>Lista de espera</h4><strong>{stock === null ? 's/d' : integer(stock)}</strong><span>Personas registradas al cierre</span></div>
    {column('exits')}
    <div className="v2-flow-summary-animation">{children}</div>
    {chosen && <div className="v2-independent-caption" aria-live="polite"><p><strong>{chosen.label}</strong> · {integer(chosen.value)} · {decimal(chosen.percent)}% de {chosen.side.toLowerCase()} del reporte.</p></div>}
  </div>;
}
