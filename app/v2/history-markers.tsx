export default function HistoryMarkers({x,bottom,top=40,labelTop=17,active=false,onToggle}:{x:(year:number)=>number;bottom:number;top?:number;labelTop?:number;active?:boolean;onToggle?:()=>void}){
  const cx=(x(2020)+x(2022))/2;
  const bandWidth=Math.max(0,x(2022)-x(2020));
  return <g
    className="v2-history-markers"
    data-active={active}
    role={onToggle?'button':undefined}
    tabIndex={onToggle?0:undefined}
    aria-pressed={onToggle?active:undefined}
    aria-label="COVID-19 (2020–2022): comparar receptores y donantes de 2020 con 2017–2019"
    onClick={onToggle}
    onKeyDown={onToggle?e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onToggle();}}:undefined}
  >
    <rect x={x(2020)} y={top} width={bandWidth} height={Math.max(0,bottom-top)} fill={active?'#b74d38':'currentColor'} fillOpacity={active?.13:.07}/>
    <rect x={cx-46} y={labelTop-15} width="92" height="20" rx="10" fill={active?'#b74d38':'#18232114'} stroke={active?'#b74d38':'#18232145'} strokeWidth="1"/>
    <text x={cx} y={labelTop-1} textAnchor="middle" className="v2-covid-pill-text" style={{fill:active?'#fff':'currentColor'}}>COVID-19 ⓘ</text>
  </g>;
}
