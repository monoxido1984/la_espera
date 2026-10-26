export function contextFinding(current:number|null,previous:number|null,entries:number|null,exits:number|null){
  if(current!==null&&previous!==null){
    const delta=current-previous;
    return delta===0?'La cantidad de personas registradas en lista no cambió respecto del cierre anterior. Explorá los movimientos del año.':`Al cierre había ${Math.abs(delta).toLocaleString('es-AR')} ${Math.abs(delta)===1?'persona registrada':'personas registradas'} ${delta>0?'más':'menos'} en lista que el año anterior. Compará otro año o provincia.`;
  }
  if(entries!==null&&exits!==null)return `El año registra ${entries.toLocaleString('es-AR')} ingresos y ${exits.toLocaleString('es-AR')} egresos. Explorá sus motivos; son movimientos del año, distintos de las personas registradas al cierre.`;
  return 'Falta información para describir el cambio anual. Probá otro año o consultá los datos disponibles.';
}
