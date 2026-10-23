'use client';
import AnnualPointPile from './annual-point-pile';
import {decimal,integer} from './universe-model';
import type {ComparisonYear} from './annual-comparison-model';
import {flowGroups,selectFlow} from './annual-flow-model';
import flows from './annual-flows.generated.json';
import type {AnnualTimeSelection} from './annual-time-model';

export default function AnnualFlowView({record,history,scope,selection,replay}:{record:ComparisonYear;history:ComparisonYear[];scope:string;selection:AnnualTimeSelection;replay:number}){
  const flow=selectFlow(flows,selection.list,record.year,selection.province,selection.age);
  const groups=flowGroups(flow?.causes??[]);
  const maximum=Math.max(1,...history.map(r=>r.waitlist??0),...(flows.lists[selection.list as keyof typeof flows.lists]??[]).map(r=>selection.province?r.provinces[selection.province as keyof typeof r.provinces]??0:Math.max(r.entries,r.exits??0)));
  const previous=history.find(r=>r.year===record.year-1)?.waitlist??null;
  const points=history.filter(r=>!r.partial&&r.waitlist!==null);
  const x=(year:number)=>40+(year-2005)/20*520;
  const y=(value:number)=>95-value/maximum*70;
  const path=points.map((r,i)=>`${i&&points[i-1].year===r.year-1?'L':'M'}${x(r.year)},${y(r.waitlist!)}`).join(' ');
  const timePoints=history.filter(r=>!r.partial&&r.year<=2025&&r.average!==null);
  const timeMaximum=Math.max(1,...timePoints.map(r=>r.average!));
  const timeY=(value:number)=>145-value/timeMaximum*120;
  const timePath=timePoints.map((r,i)=>`${i&&timePoints[i-1].year===r.year-1?'L':'M'}${x(r.year)},${timeY(r.average!)}`).join(' ');
  return <div className="v2-annual-parallel v2-list-flow" data-year={record.year} data-list={selection.list}>
    <header className="v2-flow-heading"><span>{record.label} · {scope}</span><h3>Un año en la lista</h3><p>{record.year}{record.partial?' · enero–julio':''}</p></header>
    <div className="v2-flow-bars-and-causes"><div className="v2-flow-bars">
    <AnnualPointPile scaleMaximum={maximum} key={`${record.year}-${selection.list}-${selection.province}-${selection.age}`} previous={previous} current={record.waitlist} entries={flow?.entries??null} exits={flow?.exits??null} groups={groups} paused={false} replay={replay}/>
    </div><div className="v2-flow-causes" aria-live="polite">{flow?.exits!=null?groups.map(g=><div key={g.label}><i style={{background:g.color}}/><span>{g.label}</span><strong>{integer(g.value)}</strong></div>):<p>{record.partial?'Sin flujos comparables al 31/07/2026.':selection.age!=='all'?'Sin conteos históricos de ingresos y egresos por edad.':flow?.exitsState==='sin_resultado_publicado'?'CRESI respondió «no existe resultado» para estos egresos.':'Sin desglose de egresos verificado para esta selección.'}</p>}</div>
    </div>
    <div className="v2-flow-history"><span>Cómo cambió el tamaño de la lista · {record.waitlist===null?"sin dato":integer(record.waitlist)+" en "+record.year}</span><svg viewBox="0 0 600 118" role="img" aria-label={`Evolución de inscripciones en lista de ${record.label}. Año seleccionado ${record.year}.`}>
      <path d={path} fill="none" stroke="#617f87" strokeWidth="3.5"/>
      {!record.partial&&<line x1={x(record.year)} x2={x(record.year)} y1="15" y2="98" stroke="var(--v2-accent)" strokeDasharray="3 4"/>}
      {record.waitlist!==null&&!record.partial&&<circle cx={x(record.year)} cy={y(record.waitlist)} r="4" fill="var(--v2-accent)"/>}
      <text x="40" y="115">2005</text><text x="560" y="115" textAnchor="end">2025</text>
    </svg></div>
    <div className="v2-flow-history v2-flow-time"><span>Tiempo medio de espera de receptores trasplantados · {record.average===null?'sin dato para '+record.year:decimal(record.average)+' '+record.unit+' en '+record.year}</span>
      {timePoints.length?<svg viewBox="0 0 600 175" role="img" aria-label={`Tiempo medio de espera de receptores trasplantados de ${record.label}, en ${record.unit}. Año seleccionado ${record.year}.`}>
        {[0,timeMaximum/2,timeMaximum].map(value=><g key={value}><line x1="40" x2="560" y1={timeY(value)} y2={timeY(value)} stroke="currentColor" opacity=".12"/><text x="34" y={timeY(value)+5} textAnchor="end">{decimal(value)}</text></g>)}
        <path d={timePath} fill="none" stroke="var(--v2-accent)" strokeWidth="3.5"/>
        <line x1={x(record.year)} x2={x(record.year)} y1="10" y2="148" stroke="var(--v2-accent)" strokeDasharray="3 4"/>
        {record.average!==null&&<circle cx={x(record.year)} cy={timeY(record.average)} r="4" fill="var(--v2-accent)"/>}
        <text x="40" y="172">2005</text><text x="560" y="172" textAnchor="end">2025</text>
      </svg>:<p>Sin datos de tiempo medio para esta selección.</p>}
    </div>
    <details className="v2-flow-detail"><summary>Causas y alcance de los datos</summary>
      <p>*Egresos: exclusiones permanentes publicadas, que ya incluyen trasplantes y fallecimientos. No se agregan exclusiones transitorias. Los ingresos cuentan inscripciones; no necesariamente personas nuevas.</p>
      {flow?.causes.map(c=><div className="v2-flow-cause" key={c.label}><span>{c.label.toLocaleLowerCase('es-AR')}</span><strong>{integer(c.value)}</strong></div>)}
      {flow?.exits!=null&&<p>El formulario indica fecha de exclusión y el resultado imprime fecha de inscripción. Por esa discrepancia, no presentamos un balance conciliado.{flow.residual!==null&&` Diferencia sin conciliar en ${record.year}: ${flow.residual>0?'+':''}${integer(flow.residual)} registros entre stock observado y stock anterior + ingresos − exclusiones.`}</p>}
      <a href={`${process.env.NEXT_PUBLIC_BASE_PATH??''}/datos/flujos-anuales-lista.json`} download>Descargar cifras y fuentes con SHA256 ↗</a>
    </details>
    <p className="v2-flow-footnote">Un punto · una inscripción o un registro de exclusión. La secuencia muestra cantidades agregadas, sin vincular personas entre reportes.{flow?.exits!=null?' *Exclusiones permanentes; balance sin conciliar.':''}{record.average!==null&&` Media de espera de receptores trasplantados: ${decimal(record.average)} ${record.unit}.`}</p>
  </div>;
}
