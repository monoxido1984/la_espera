'use client';
import donation from './current-donation.generated.json';
import {decimal,integer} from './universe-model';
type Row={organs:number;tissues:number;total:number;organPmh:number|null;tissuePmh:number|null};
const rows=donation.rows as Record<string,Row|null>;

export default function DonationContext({province,provinceLabel,list}:{province:string|null;provinceLabel:string;list:string|null}){
  const selected=rows[province??'ARGENTINA'];
  const tissues=list==='CORNEAS'||list==='ESCLERAS';
  const metric=tissues?'tissues':'organs',rate=tissues?'tissuePmh':'organPmh';
  const name=tissues?'donantes de tejidos':'donantes reales de órganos';
  return <details className="v2-donation-context" key={`${province}|${list}`}>
    <summary>Donación al 27/10 · {provinceLabel} <span>↗</span></summary>
    <div className="v2-donation-body">
      <p>{donation.period} · fecha de clampeo/ablación</p>
      {selected?<>
        <p className="v2-donation-number"><strong>{integer(selected[metric])}</strong> {name}<span>{selected[rate]===null?'PMH s/d':`${decimal(selected[rate]!)} por millón de habitantes`}</span></p>
        <p className="v2-donation-other">{tissues?`${integer(selected.organs)} donantes reales de órganos`:`${integer(selected.tissues)} donantes de tejidos`}</p>
      </>:<p>Sin resultado publicado para este territorio. No se interpreta como cero.</p>}
      <p className="v2-donation-scope">Por establecimiento de origen · todos los {tissues?'tejidos':'órganos'}, edades y sexos. No es un cruce con las personas de esta lista.</p>
    </div>
  </details>;
}
