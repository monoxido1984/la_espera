export default function HistoryMarkers({x,bottom,top=40,labelTop=17}:{x:(year:number)=>number;bottom:number;top?:number;labelTop?:number}){
  return <g className="v2-history-markers" aria-label="Hitos de contexto: Ley Justina en 2018 y pandemia COVID-19 en 2020">
    <line x1={x(2018)} x2={x(2018)} y1={top} y2={bottom}/><line x1={x(2020)} x2={x(2020)} y1={top} y2={bottom}/>
    <text x={x(2018)-5} y={labelTop} textAnchor="end">2018 · Ley Justina<title>Ley 27.447. Hito de contexto; el gráfico no estima su efecto causal.</title></text>
    <text x={x(2020)+5} y={labelTop+14}>2020 · COVID-19<title>Pandemia de COVID-19. Hito de contexto de la serie.</title></text>
  </g>;
}
