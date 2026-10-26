export function contextFinding(current:number|null,previous:number|null,entries:number|null,exits:number|null){
  if(current!==null&&previous!==null){
    const delta=current-previous;
    return delta===0?'El stock publicado no cambió respecto del cierre anterior. Explorá los movimientos del año.':`El stock publicado ${delta>0?'aumentó':'disminuyó'} en ${Math.abs(delta).toLocaleString('es-AR')} inscripciones respecto del cierre anterior. Compará otro año o provincia.`;
  }
  if(entries!==null&&exits!==null)return `El año registra ${entries.toLocaleString('es-AR')} ingresos y ${exits.toLocaleString('es-AR')} egresos. Desplegá sus categorías; estos movimientos no equivalen al stock.`;
  return 'Falta información para describir el cambio anual. Probá otro año o consultá los datos disponibles.';
}
