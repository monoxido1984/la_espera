'use client';
import {integer,type Group} from './universe-model';
export type SenioritySeries={label:string;color:string;groups:Group[];unavailable:boolean};
export default function SeniorityComparison({series,onSelect}:{series:SenioritySeries[];onSelect:(id:string,sex:'FEMENINO'|'MASCULINO')=>void}){
  const categories=[...new Map(series.flatMap(s=>s.groups).filter(g=>g.kind!=='unavailable').map(g=>[g.id,g])).values()];
  const totals=series.map(s=>s.groups.reduce((n,g)=>n+g.value,0));
  const value=(s:SenioritySeries,id:string)=>{const g=s.groups.find(g=>g.id===id);return s.unavailable||!g?null:g.value;};
  const max=Math.max(1,...series.flatMap(s=>categories.map(g=>value(s,g.id)??0)));
  return <div className="v2-seniority-comparison">
    <div className="v2-seniority-legend">{series.map((s,i)=><span key={s.label} style={{color:s.color}}>{i?'●':'●'} {s.label} · {s.unavailable?'s/d':integer(totals[i])}</span>)}</div>
    <svg viewBox="0 0 600 650" role="group" aria-label="Antigüedad en lista: barras de puntos de mujeres y hombres, con escala común de inscripciones">
      {categories.map((g,j)=><g key={g.id}>
        <text x="4" y={30+j*68}>{g.label}</text>
        {series.map((s,i)=>{
          const v=value(s,g.id),marks=v??0;
          const step=365/Math.max(1,Math.ceil(max/3));
          return <g key={s.label} role="button" tabIndex={0} aria-label={`${s.label}, ${g.label}: ${v===null?'sin datos':integer(v)}. Explorar este tiempo.`} onClick={()=>{if(v!==null)onSelect(g.id,s.label==='Mujeres'?'FEMENINO':'MASCULINO');}} onKeyDown={e=>{if((e.key==='Enter'||e.key===' ')&&v!==null){e.preventDefault();onSelect(g.id,s.label==='Mujeres'?'FEMENINO':'MASCULINO');}}}>
            <title>{s.label} · {g.label} · {v===null?'s/d':integer(v)}</title>
            <rect x="140" y={15+j*68+i*23} width="450" height="21" fill="transparent"/>
            {v!==null&&<rect x="150" y={17+j*68+i*23} width={v/max*365} height="12" rx="2" fill={s.color} opacity=".13"/>}
            {Array.from({length:marks},(_,n)=><circle key={n} cx={150+Math.floor(n/3)*step} cy={20+j*68+i*23+n%3*3.4} r={Math.min(1.3,step*.42)} fill={s.color}/>)}
            <text x="590" y={28+j*68+i*23} textAnchor="end" style={{fill:s.color}}>{v===null?'s/d':integer(v)}</text>
          </g>;
        })}
      </g>)}
    </svg>
    {series.filter(s=>s.unavailable).map(s=><p key={s.label}>{s.label}: sin desglose publicado para esta selección.</p>)}
    <details className="v2-exact"><summary>Ver valores por tiempo</summary><table><thead><tr><th>Antigüedad</th>{series.map(s=><th key={s.label}>{s.label}</th>)}</tr></thead><tbody>{categories.map(g=><tr key={g.id}><th>{g.label}</th>{series.map(s=><td key={s.label}>{value(s,g.id)===null?'s/d':integer(value(s,g.id)!)}</td>)}</tr>)}</tbody></table></details>
  </div>;
}
