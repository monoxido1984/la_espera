import { formatDecimal, formatInteger } from './story-model';

export default function TimeSummary({average,median,p25,p75,n,unit}:{average:number;median:number;p25:number;p75:number;n:number;unit:string}) {
  const domainMax = Math.max(p75, average, median, 1) * 1.12;
  const x = (value: number) => 48 + (value / domainMax) * 464;
  const p25X = x(p25);
  const medianX = x(median);
  const p75X = x(p75);
  const averageX = x(average);

  return <div className="time-summary">
    <p><strong>{formatInteger(n)} receptores</strong> · valores publicados en {unit}</p>
    <svg viewBox="0 0 560 150" role="img" aria-label={`P25 ${formatDecimal(p25)}, mediana ${formatDecimal(median)}, P75 ${formatDecimal(p75)} y promedio ${formatDecimal(average)} ${unit}. El tramo P25–P75 contiene la mitad central de los tiempos; no es un intervalo de confianza.`}>
      <line className="time-summary-axis" x1="48" x2="512" y1="78" y2="78" />
      <rect className="time-summary-central" x={p25X} y="66" width={Math.max(p75X - p25X, 2)} height="24" rx="3" />
      <text className="time-summary-band-label" x={(p25X + p75X) / 2} y="82" textAnchor="middle">50% central</text>

      <line className="time-summary-bound" x1={p25X} x2={p25X} y1="58" y2="99" />
      <line className="time-summary-bound" x1={p75X} x2={p75X} y1="58" y2="99" />
      <text className="time-summary-value-label" x={p25X} y="118" textAnchor="middle">P25 · {formatDecimal(p25)}</text>
      <text className="time-summary-value-label" x={p75X} y="118" textAnchor="middle">P75 · {formatDecimal(p75)}</text>

      <line className="time-summary-median" x1={medianX} x2={medianX} y1="49" y2="101" />
      <text className="time-summary-value-label is-median" x={medianX} y="38" textAnchor="middle">Mediana · {formatDecimal(median)}</text>

      <line className="time-summary-average-guide" x1={averageX} x2={averageX} y1="27" y2="66" />
      <path className="time-summary-average" d={`M ${averageX} 18 l 8 8 l -8 8 l -8 -8 Z`} />
      <text className="time-summary-value-label is-average" x={averageX} y="12" textAnchor="middle">Promedio · {formatDecimal(average)}</text>
    </svg>
    <dl className="quantile-labels"><div><dt>P25</dt><dd>{formatDecimal(p25)} <small>{unit}</small></dd></div><div><dt>Mediana</dt><dd>{formatDecimal(median)} <small>{unit}</small></dd></div><div><dt>P75</dt><dd>{formatDecimal(p75)} <small>{unit}</small></dd></div><div><dt>◆ Promedio</dt><dd>{formatDecimal(average)} <small>{unit}</small></dd></div></dl>
    <p>La banda muestra de P25 a P75: allí se ubica la mitad central de los tiempos observados. <strong>No es un intervalo de confianza</strong> y sus extremos no son el mínimo y el máximo.</p>
    <p>{average > median ? `El promedio supera a la mediana en ${formatDecimal(average-median)} ${unit}. Los tiempos más largos pesan sobre la media; la mediana ubica el centro de los casos ordenados.` : 'Promedio y mediana resumen aspectos diferentes: la media usa todos los tiempos y la mediana ubica el centro de los casos ordenados.'} Estos agregados no muestran la forma completa de la distribución ni pronostican una espera individual.</p>
  </div>;
}
