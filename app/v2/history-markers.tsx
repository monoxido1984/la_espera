export default function HistoryMarkers({x,bottom,top=40,labelTop=17}:{x:(year:number)=>number;bottom:number;top?:number;labelTop?:number}){
  return <g className="v2-history-markers" aria-label="COVID-19: franja de contexto entre 2020 y 2022">
    <rect x={x(2020)} y={top} width={Math.max(0,x(2022)-x(2020))} height={Math.max(0,bottom-top)} fill="currentColor" fillOpacity=".07"/>
    <text x={(x(2020)+x(2022))/2} y={labelTop} textAnchor="middle">COVID-19</text>
  </g>;
}
