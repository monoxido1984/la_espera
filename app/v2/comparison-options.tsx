'use client';
import {useState,type ComponentProps} from 'react';
import ProvinceComparison from './exploration-comparison';
import entries from './annual-entries.generated.json';
import flows from './annual-flows.generated.json';
import snapshotRaw from './map-demographics.generated.json';
import {flowGroups,selectFlow} from './annual-flow-model';
import {decimal,integer,readableLabel} from './universe-model';
import type {MapSnapshot} from './map-demographics-model';

type Props=ComponentProps<typeof ProvinceComparison>;
type Mode='province'|'entries'|'exits'|'sex'|'age';
type Pair={label:string;a:number|null;b:number|null;unit?:string};
type Cause={id:string;label:string;value:number};
type Entry={total:number|null;diagnoses:{code:string;label:string;value:number}[]};
const snapshot=snapshotRaw as MapSnapshot;

function PairChart({rows,labelA,labelB}:{rows:Pair[];labelA:string;labelB:string}){
  const maximum=Math.max(1,...rows.flatMap(row=>[row.a??0,row.b??0]));
  const x=(i:number)=>30+i/Math.max(1,rows.length-1)*540,y=(n:number)=>150-n/maximum*125;
  const path=(side:'a'|'b')=>rows.map((row,i)=>row[side]===null?'':(i&&rows[i-1][side]!==null?'L':'M')+x(i)+','+y(row[side]!)).join(' ');
  return <><p>Azul: {labelA} · Violeta discontinuo: {labelB}</p><svg viewBox="0 0 600 180" role="img" aria-label={labelA+' y '+labelB+', escala común de cantidades desde cero'}>
    <line x1="30" x2="570" y1="150" y2="150" stroke="currentColor" opacity=".25"/>
    <path d={path('a')} fill="none" stroke="#0052cc" strokeWidth="2"/><path d={path('b')} fill="none" stroke="#7400bd" strokeWidth="2" strokeDasharray="6 4"/>
    {(['a','b'] as const).map((side,index)=>rows.map((row,i)=>row[side]===null?null:<circle key={side+i} cx={x(i)} cy={y(row[side]!)} r="3" fill={index?'#7400bd':'#0052cc'}><title>{row.label+' · '+(index?labelB:labelA)+': '+integer(row[side]!)}</title></circle>))}
    <text x="30" y="16">{integer(maximum)} registros</text><text x="15" y="150">0</text><text x="30" y="170">{rows[0]?.label}</text><text x="570" y="170" textAnchor="end">{rows.at(-1)?.label}</text>
  </svg></>;
}
function PairTable({rows,labelA,labelB}:{rows:Pair[];labelA:string;labelB:string}){
  const format=(n:number,unit?:string)=>unit==='%'?decimal(n):integer(n);
  return <table><caption>Diferencia: segunda selección menos primera</caption><thead><tr><th>Medida</th><th>{labelA}</th><th>{labelB}</th><th>Diferencia</th></tr></thead><tbody>{rows.map(row=><tr key={row.label}><th>{row.label}{row.unit&&<small>{row.unit}</small>}</th><td>{row.a===null?'s/d':format(row.a,row.unit)}</td><td>{row.b===null?'s/d':format(row.b,row.unit)}</td><td>{row.a===null||row.b===null?'s/d':(row.b-row.a>0?'+':'')+format(row.b-row.a,row.unit)}</td></tr>)}</tbody></table>;
}
function causesFor(kind:'entries'|'exits',props:Props,year:number):{total:number|null;items:Cause[]}{
  const {selection}=props;
  if(selection.age!=='all')return {total:null,items:[]};
  if(kind==='entries'){
    const row=(entries.rows as Record<string,Entry>)[selection.list+'|'+year+'|'+(selection.province??'ARGENTINA')];
    return {total:row?.total??null,items:(row?.diagnoses??[]).map(d=>({id:JSON.stringify([d.code,d.label]),label:d.label,value:d.value}))};
  }
  const row=selectFlow(flows,selection.list,year,selection.province,selection.age);
  return {total:row?.exits??null,items:flowGroups(row?.causes??[]).flatMap(group=>group.items.map(d=>({id:d.canonicalId,label:d.label,value:d.value})))};
}
function CauseComparison({kind,props}:{kind:'entries'|'exits';props:Props}){
  const [choiceA,setChoiceA]=useState(''),[choiceB,setChoiceB]=useState('');
  const current=causesFor(kind,props,props.record.year);
  const options=[...current.items].sort((a,b)=>b.value-a.value||a.label.localeCompare(b.label));
  const a=options.find(row=>row.id===choiceA)??options[0];
  const b=options.find(row=>row.id===choiceB&&row.id!==a?.id)??options.find(row=>row.id!==a?.id);
  if(!a||!b)return <p>Sin dos causas publicadas para comparar en {props.record.year} y esta selección.</p>;
  const rows=props.history.filter(row=>!row.partial).map(row=>{const data=causesFor(kind,props,row.year);return {label:String(row.year),a:data.total===null?null:data.items.find(item=>item.id===a.id)?.value??null,b:data.total===null?null:data.items.find(item=>item.id===b.id)?.value??null};});
  return <><p>{kind==='entries'?'Diagnósticos de inscripción':'Motivos de egreso'} · {props.record.label} · {props.selection.province?props.provinceNames.get(props.selection.province):'Argentina'} · {props.record.year}</p>
    <div className="v2-comparison-controls"><label>Primera causa<select value={a.id} onChange={e=>setChoiceA(e.target.value)}>{options.map(row=><option value={row.id} key={row.id}>{row.label}</option>)}</select></label><label>Segunda causa<select value={b.id} onChange={e=>setChoiceB(e.target.value)}>{options.map(row=><option value={row.id} key={row.id} disabled={row.id===a.id}>{row.label}</option>)}</select></label></div>
    <PairChart rows={rows} labelA={a.label} labelB={b.label}/><PairTable labelA={a.label} labelB={b.label} rows={[{label:'Registros en '+props.record.year,a:a.value,b:b.value},{label:'Porcentaje del reporte',a:current.total?a.value/current.total*100:null,b:current.total?b.value/current.total*100:null,unit:'%'}]}/>
  </>;
}
function DemographicComparison({mode,props}:{mode:'sex'|'age';props:Props}){
  const age=props.selection.age==='menor_18'?'menor18':props.selection.age==='18_mas'?'18mas':'all';
  const keys=mode==='sex'?[age+'|FEMENINO',age+'|MASCULINO']:['menor18|all','18mas|all'];
  const labels=mode==='sex'?['Mujeres','Hombres']:['Menores de 18','18 años y más'];
  const groups=keys.map(key=>{
    const cohort=snapshot.cohorts[key],list=cohort?.lists.find(row=>row.id===props.selection.list),province=props.selection.province;
    if(!list||province&&cohort.missingProvinces.includes(province))return {total:null,bands:[]};
    return {total:province?list.province.find(row=>row.label===province)?.value??null:list.total,bands:province?list.seniorityByProvince?.find(row=>row.province===province)?.items??[]:list.seniority};
  });
  const bands=[...new Set(groups.flatMap(group=>group.bands.map(row=>row.label)))];
  const rows=bands.map(label=>({label:readableLabel(label),a:groups[0].bands.find(row=>row.label===label)?.value??null,b:groups[1].bands.find(row=>row.label===label)?.value??null}));
  return <><p>En lista · {snapshot.date} · {props.record.label} · {props.selection.province?props.provinceNames.get(props.selection.province):'Argentina'}{mode==='sex'?' · '+(age==='all'?'todas las edades':age==='menor18'?'menores de 18':'18 años y más'):''}</p>
    <PairChart rows={rows} labelA={labels[0]} labelB={labels[1]}/><PairTable rows={[{label:'Inscripciones en lista',a:groups[0].total,b:groups[1].total}]} labelA={labels[0]} labelB={labels[1]}/>
    <details><summary>Ver detalle por antigüedad</summary><PairTable rows={rows} labelA={labels[0]} labelB={labels[1]}/></details>
  </>;
}
export default function ComparisonOptions(props:Props){
  const [mode,setMode]=useState<Mode>('province');
  return <details className="v2-comparison"><summary>Comparar</summary><div className="v2-comparison-controls"><label>Comparar por<select value={mode} onChange={e=>setMode(e.target.value as Mode)}><option value="province">Provincia</option><option value="entries">Causas de ingreso</option><option value="exits">Causas de egreso</option><option value="sex">Sexo</option><option value="age">Edad</option></select></label></div>
    {mode==='province'?<ProvinceComparison {...props}/>:mode==='entries'||mode==='exits'?<CauseComparison key={mode} kind={mode} props={props}/>:<DemographicComparison mode={mode} props={props}/>}
  </details>;
}
