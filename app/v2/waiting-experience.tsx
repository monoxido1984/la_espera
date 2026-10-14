'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import WaitingUniverse from './waiting-universe';
import SandQueue from './sand-queue';
import dynamic from 'next/dynamic';
import TemporalJourney,{JourneyControls,type PointRelay} from './temporal-journey';
import type {AnnualTimeDetail} from './annual-time-model';
import { decimal, groupsFor, integer, readableLabel, territoryColors, territoryValue, type TerritoryMetric, type Dimension, type UniverseData, type UniverseMode } from './universe-model';
import { allWaiting, explorationGroups, selectExploration, type ExplorationSelection } from './linked-exploration';
import './experience.css';

const AnnualTimeExplorer=dynamic(()=>import('./annual-time-explorer'),{ssr:false,loading:()=> <p className="v2-note">Cargando los cruces…</p>});

const chapters = ['El silencio', 'La cifra', 'Cuánto tiempo', 'Muchas esperas', 'Los años', 'El tiempo', 'La donación', 'La oportunidad', 'Volver'];
const modes: UniverseMode[] = ['intro', 'number', 'comparison', 'organ', 'history', 'duration', 'donation', 'transplants', 'end'];

export default function WaitingExperience({ data }: { data: UniverseData }) {
  const stage = useRef<HTMLDivElement>(null);
  const [scene, setScene] = useState(0);
  const [dimension, setDimension] = useState<Dimension>('organ');
  const [territoryMetric, setTerritoryMetric] = useState<TerritoryMetric>('count');
  const [selection, setSelection] = useState<ExplorationSelection>(allWaiting);
  const [notice, setNotice] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [year, setYear] = useState(data.history.at(-1)!.year);
  const [timeMetric, setTimeMetric] = useState<'list' | 'dialysis'>('dialysis');
  const [journeyProgress,setJourneyProgress]=useState(0);
  const pointRelay=useRef<PointRelay>({x:.84,y:.58});
  const [annualRefine,setAnnualRefine]=useState(false);
  const [annualDetail,setAnnualDetail]=useState<AnnualTimeDetail|null>(null);
  const [annualMetric, setAnnualMetric] = useState<'waitlist' | 'donors' | 'time'>('waitlist');
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    update(); media.addEventListener('change', update);
    let frame = 0, activeScene = 0;
    const updateScene = () => {
      const middle = window.innerHeight * .45;
      const active = Array.from(document.querySelectorAll<HTMLElement>('.v2-scene')).find(section => {
        const rect = section.getBoundingClientRect();
        return rect.top <= middle && rect.bottom > middle;
      });
      if (!active) return;
      const next = Number(active.dataset.scene);
      if (next !== activeScene) { activeScene = next; setScene(next); setHover(null); }
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(updateScene); };
    window.addEventListener('scroll', schedule, { passive:true });
    window.addEventListener('resize', schedule);
    schedule();
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule); media.removeEventListener('change', update); };
  }, []);
  useEffect(() => {
    const section = document.getElementById(`escena-${scene}`);
    const copy = section?.querySelector('.v2-copy, .v2-opening-content');
    if (!section || !copy || !stage.current) return;
    const update = () => {
      stage.current?.style.setProperty('--v2-scene-top', `${section.offsetTop}px`);
      stage.current?.style.setProperty('--v2-scene-height', `${section.offsetHeight}px`);
      stage.current?.style.setProperty('--v2-copy-bottom', `${copy.getBoundingClientRect().bottom - section.getBoundingClientRect().top}px`);
    };
    const observer = new ResizeObserver(update);
    observer.observe(section); observer.observe(copy); update();
    return () => observer.disconnect();
  }, [scene]);
  const exploration = useMemo(() => explorationGroups(data,dimension,selection), [data,dimension,selection]);
  const territoryReference = useMemo(() => territoryColors(explorationGroups(data,'territory',{...selection,province:null}).groups,territoryMetric),[data,selection,territoryMetric]);
  const groups = useMemo(() => dimension === 'territory' ? exploration.groups.map(g => ({...g,color:territoryReference.find(row => row.id === g.id)?.color ?? g.color})) : exploration.groups, [exploration,dimension,territoryReference]);
  const selectedKey = dimension === 'organ' ? selection.listId : dimension === 'seniority' ? selection.seniority : selection.province;
  const focus = groups.find(g => g.sourceKey === selectedKey)?.id ?? null;
  const provinceNames = useMemo(() => {
    const labels=groupsFor(data,'territory',null);
    return new Map(data.lists.find(l => l.id === 'TOTAL')!.province.map((p,i) => [p.label,labels[i].label]));
  },[data]);
  const canUsePmh = groups.some(g => g.pmh !== undefined);
  const territorialScale = [...territoryReference].filter(g => territoryValue(g, territoryMetric) !== undefined).sort((a,b) => territoryValue(a, territoryMetric)!-territoryValue(b, territoryMetric)!);
  const metricText = (group: typeof groups[number]) => territoryMetric === 'count' ? integer(group.value) : group.pmh === undefined ? 's/d' : decimal(group.pmh);
  const record = data.history.find(item => item.year === year)!;
  const latest = data.history.find(item=>item.year===2025)!;
  const dialysis = data.dialysis?.find(item => item.year === 2025);
  const meanMonths = timeMetric === 'dialysis' ? 12 : latest.average;
  const timeN = timeMetric === 'dialysis' ? data.dialysisPopulation?.count ?? 0 : latest.n;
  const annualReady=annualDetail?.year===year;
  const annualTimeNumber=annualRefine?(annualReady?annualDetail.average:null):record.median;
  const annualTimeN=annualRefine?(annualReady?annualDetail.n:0):record.n;
  const annualTimeUnit=annualRefine?(annualReady?annualDetail.unit:'meses'):'meses';
  const annualValue=annualMetric==='time'?annualTimeNumber:record[annualMetric];
  const annualReference=annualMetric==='time'?annualRefine?(annualDetail?.maxAverage??1):Math.max(...data.history.map(row=>row.median)):Math.max(...data.history.map(row=>row[annualMetric]));
  const historyRatio=(annualValue??0)/Math.max(1,annualReference);
  const selected = data.organs.find(item => item.id === selection.listId);
  const mode = scene === 3 ? dimension : modes[scene];
  const dark = scene === 6 || scene === 7;
  const visibleGroups = focus ? groups.filter(group => group.id === focus) : groups;
  const count = scene === 2 ? timeN : scene === 3 ? visibleGroups.reduce((sum, group) => sum + group.value, 0) : scene === 4 ? annualMetric === 'time' ? annualTimeN : record[annualMetric] : scene === 5 ? latest.n : scene === 6 ? data.organDonors : scene === 7 ? data.organTransplants : data.total;
  const population = scene === 2 ? timeMetric==='dialysis'?'dialysis-year-end-2025':'renal-recipients' : scene === 4 ? `annual-${annualMetric}-${year}-${annualRefine?annualDetail?.list+'-'+annualDetail?.province+'-'+annualDetail?.age:'nacional'}` : scene === 5 ? 'renal-recipients' : scene === 6 ? 'donors' : scene === 7 ? 'transplants' : 'waiting';
  const unit = scene === 2 ? timeMetric==='dialysis'?'Un punto · un paciente en diálisis al cierre de 2025':'Un punto · un registro de receptor renal trasplantado en 2025' : scene === 4 ? annualMetric === 'donors' ? 'Un punto · un donante de órganos y/o tejidos' : annualMetric === 'time' ? annualRefine?'Un punto · un receptor registrado en este cruce anual':'Un punto · un trasplante renal con tiempo registrado' : 'Un punto · una inscripción en el total anual' : scene === 5 ? 'Un punto · un trasplante renal con tiempo registrado' : scene === 6 ? 'Un punto · un donante fallecido de órganos' : scene === 7 ? 'Un punto · un trasplante de órganos' : 'Un punto · una inscripción en lista de espera';
  function chooseTimeMetric(next:'list'|'dialysis'){setTimeMetric(next);setJourneyProgress(0);}
  function chooseAnnualMetric(next:'waitlist'|'donors'|'time'){setAnnualMetric(next);if(next!=='time'){setAnnualRefine(false);setAnnualDetail(null);}}
  function toggleAnnualRefinement(){setAnnualRefine(!annualRefine);setAnnualDetail(null);}
  function changeDimension(next: Dimension) { setDimension(next); setHover(null); setNotice(null); }
  function selectGroup(id: string) {
    const group=groups.find(g => g.id === id);
    if (!group) return;
    const next=selectExploration(selection,dimension,group);
    setSelection(next.selection); setDimension(next.dimension); setHover(null);
    if (next.selection.seniority || next.selection.smallLists && !next.selection.listId) setTerritoryMetric('count');
    setNotice(group.kind === 'unavailable' ? dimension === 'seniority' ? 'Esta lista no tiene antigüedad publicada. Podés explorar sus provincias.' : 'El total está disponible, pero su desglose por lista no está publicado para este cruce.' : null);
  }
  function clearSelection(field: 'listId' | 'seniority' | 'province') {
    setSelection({...selection,[field]:null}); setHover(null); setNotice(null);
    setDimension(field === 'listId' ? 'organ' : field === 'seniority' ? 'seniority' : 'territory');
  }
  function reset() { setSelection(allWaiting); setDimension('organ'); setHover(null); setNotice(null); setTerritoryMetric('count'); }
  function regroup() { setSelection({...selection,smallLists:false,listId:null}); setDimension('organ'); setHover(null); setNotice(null); }
  return <main className="waiting-v2" data-dark={dark} data-paused={paused || reduced}>
    <a href="#escena-1" className="v2-skip">Saltar la apertura</a>
    <header className="v2-header"><a href="#escena-0" className="v2-brand">LA ESPERA <span>Argentina</span></a><div><a href="#sobre-los-datos">Sobre los datos</a><button type="button" onClick={() => setPaused(!paused)} aria-pressed={paused || reduced} disabled={reduced}>{reduced ? 'Movimiento reducido' : paused ? 'Activar movimiento' : 'Pausar movimiento'}</button></div></header>
    <nav className="v2-progress" aria-label="Capítulos">{chapters.map((chapter, index) => <a href={`#escena-${index}`} key={chapter} aria-label={`${index + 1}. ${chapter}`} aria-current={scene === index ? 'step' : undefined}><span>{chapter}</span></a>)}</nav>
    <div className="v2-story">
      <div ref={stage} className="v2-stage" data-sand={scene<2} aria-hidden={scene === 0 ? true : undefined}>
        <div className="v2-figure">{scene<2?<SandQueue count={data.total} forming={scene===1} paused={paused||reduced} relay={pointRelay}/>:scene===2?<TemporalJourney progress={journeyProgress} metric={timeMetric} months={meanMonths} records={timeN} paused={paused||reduced} relay={pointRelay}/>:<WaitingUniverse mode={mode} groups={groups} count={count} total={scene === 6 || scene === 7 ? data.organTransplants : data.total} focus={scene === 3 ? focus : null} hover={scene === 3 ? hover : null} paused={paused || reduced} dark={dark} population={population} label={`${integer(count)} unidades. ${unit}.`} unit={unit} territoryMetric={territoryMetric} territoryContext={territoryReference} historyRatio={historyRatio} relay={pointRelay} onHover={setHover} onSelect={selectGroup} />}
          {scene === 4 && <div className="v2-time-label v2-annual-value" aria-live="polite"><strong>{annualValue===null?'—':annualMetric==='time'?decimal(annualValue):integer(annualValue)}</strong><span>{annualMetric==='time'?`${annualTimeUnit} · ${annualRefine?'promedio del cruce':'mediana renal'}`:annualMetric==='donors'?'donantes de órganos y/o tejidos':'inscripciones'} · {year}</span></div>}
          {scene === 5 && <div className="v2-time-label"><strong>{decimal(latest.median)}</strong><span>meses · mediana</span></div>}
        </div>
      </div>
      <section id="escena-0" data-scene="0" className="v2-scene v2-opening"><div className="v2-opening-content"><p className="v2-kicker">¿Cuánto tarda una segunda posibilidad?</p><h1>LA<br /><span>ESPERA</span></h1><a className="v2-scroll" href="#escena-1">Una historia sobre la lista de espera de órganos en Argentina <span>↓</span></a></div></section>
      <section id="escena-1" data-scene="1" className="v2-scene"><div className="v2-copy"><p className="v2-kicker">01 / Una cifra</p><h2>La espera<br />se cuenta.</h2><p><strong>{integer(data.total)} personas esperando un órgano o tejido en Argentina.</strong></p><p className="v2-note">Datos al {data.snapshot}.</p></div></section>
      <section id="escena-2" data-scene="2" className="v2-scene v2-time-scene"><div className="v2-copy"><p className="v2-kicker">02 / El tiempo se acumula</p><h2>¿Cuánto<br />tiempo?</h2><p>La espera puede empezar en diálisis, antes de entrar en lista.</p>
        <JourneyControls metric={timeMetric} onMetric={chooseTimeMetric} progress={journeyProgress} onProgress={setJourneyProgress}/>
        <p className="v2-note">Datos del año 2025.{timeMetric==='dialysis'&&<><br/>Escenario hipotético: un año completo para cada paciente registrado al 31/12. No son horas observadas.</>}</p>
      </div></section>
      <section id="escena-3" data-scene="3" className="v2-scene v2-explore"><div className="v2-copy">
        <p className="v2-kicker">03 / Desarmar la cifra</p>
        <h2>¿Esperar<br />{dimension === 'territory' ? 'dónde?' : dimension === 'seniority' ? 'desde cuándo?' : 'qué?'}</h2>
        <p>{dimension === 'organ' ? selection.smallLists ? 'Las otras esperas, una por una.' : 'Un mismo total. Distintas esperas.' : dimension === 'seniority' ? 'El tiempo que ya llevan esperando.' : territoryMetric === 'count' ? 'La espera cambia el territorio.' : 'La escala cambia. La espera permanece.'}</p>
        <div className="v2-tabs" role="group" aria-label="Mirar la espera por">{([['organ','Lista'],['seniority','Antigüedad'],['territory','Provincia']] as const).map(([id,label]) => <button type="button" aria-pressed={dimension === id} key={id} onClick={() => changeDimension(id)}>{label}</button>)}</div>
        <div className="v2-selection" aria-label="Selecciones conectadas">
          {selection.smallLists && <button type="button" onClick={regroup} aria-label="Salir del desglose de otras listas">Otras listas <span>×</span></button>}
          {selected && <button type="button" onClick={() => clearSelection('listId')} aria-label={`Quitar lista ${selected.label}`}>{selected.label} <span>×</span></button>}
          {selection.seniority && <button type="button" onClick={() => clearSelection('seniority')} aria-label={`Quitar antigüedad ${readableLabel(selection.seniority)}`}>{readableLabel(selection.seniority)} <span>×</span></button>}
          {selection.province && <button type="button" onClick={() => clearSelection('province')} aria-label={`Quitar provincia ${provinceNames.get(selection.province)}`}>{provinceNames.get(selection.province)} <span>×</span></button>}
        </div>
        <p className="v2-exploration-total" aria-live="polite">{exploration.unavailable ? 'Cruce no publicado' : <><strong>{integer(visibleGroups.reduce((sum,g) => sum+g.value,0))}</strong> inscripciones{selection.listId || selection.province || selection.seniority || selection.smallLists ? ' en esta selección' : ' · todas las listas'}</>}</p>
        {dimension === 'territory' && <div className="v2-territory-controls">
          <div className="v2-tabs v2-map-switch" role="group" aria-label="Escala del cartograma">{([['count','Cantidad'],['pmh','Por millón']] as const).map(([id,label]) => <button type="button" key={id} aria-pressed={territoryMetric === id} disabled={id === 'pmh' && !canUsePmh} onClick={() => { setTerritoryMetric(id); setHover(null); }}>{label}</button>)}</div>
          <p className="v2-map-caption">{territoryMetric === 'count' ? 'Más esperas, más espacio.' : 'Inscripciones por millón de habitantes.'}{!canUsePmh && <><br /><span>PMH no disponible para este cruce.</span></>}</p>
          {territorialScale.length > 0 && <div className="v2-map-legend" aria-label={`Color: de ${metricText(territorialScale[0])} a ${metricText(territorialScale.at(-1)!)} ${territoryMetric === 'pmh' ? 'por millón de habitantes' : 'inscripciones'}`}><span style={{background:`linear-gradient(90deg,${territorialScale[0].color},${territorialScale.at(-1)!.color})`}} /><div><span>{metricText(territorialScale[0])}</span><span>{metricText(territorialScale.at(-1)!)}</span></div></div>}
        </div>}
        <p className="v2-note">{dimension === 'organ' ? 'Elegí una lista para ver su antigüedad.' : dimension === 'seniority' ? 'Elegí un tiempo para ver sus provincias.' : 'Elegí una provincia para ver sus listas.'}<br />Las selecciones te acompañan entre vistas.</p>
        {notice && <p role="status" className="v2-availability">{notice}</p>}
        {exploration.unavailable && <p className="v2-availability">Quitá una selección para volver a los datos disponibles.</p>}
        {!exploration.unavailable && !count && scene === 3 && <p className="v2-availability">No hay inscripciones para esta selección.</p>}
        {(selection.listId || selection.province || selection.seniority || selection.smallLists) && <button className="v2-back" onClick={reset}>← Toda la espera</button>}
        {dimension === 'organ' && groups.some(g => g.kind === 'collection') && <button className="v2-small-switch" onClick={() => selectGroup('OTHER_LISTS')}>Desglosar las listas menores ↗</button>}
        {dimension === 'organ' && selection.smallLists && <button className="v2-small-switch" onClick={regroup}>← Reagrupar las listas menores</button>}
        <details className="v2-exact"><summary>Ver cada grupo</summary><div>{groups.map(group => <button key={group.id} disabled={group.value === 0} onClick={() => selectGroup(group.id)} aria-pressed={focus === group.id}><span>{group.label}{group.kind === 'collection' ? ' · desglosar' : ''}</span><strong>{dimension === 'territory' ? metricText(group)+(territoryMetric === 'pmh' ? ' PMH' : '') : integer(group.value)}</strong></button>)}</div></details>
      </div></section>
      <section id="escena-4" data-scene="4" className="v2-scene v2-annual-scene"><div className="v2-copy"><p className="v2-kicker">04 / Año tras año</p><h2>Los años pasan.<br />La espera cambia.</h2><p>Recorré dos décadas. Mirá la espera, la donación y el tiempo, un año a la vez.</p>
        <label className="v2-year" htmlFor="v2-year">{year}</label><input id="v2-year" aria-label="Año del registro" className="v2-range" type="range" min={data.history[0].year} max={latest.year} value={year} onChange={event => setYear(Number(event.target.value))} aria-valuetext={`${year}: ${annualValue===null?'tiempo no disponible':annualMetric==='time'?decimal(annualValue)+' '+annualTimeUnit:integer(annualValue)+' '+(annualMetric==='donors'?'donantes':'inscripciones')}`} />
        <div className="v2-range-ends"><span>{data.history[0].year}</span><span>{latest.year}</span></div>
        <div className="v2-tabs" role="group" aria-label="Dimensión del año">{([['waitlist','Espera'],['donors','Donación'],['time','Tiempo de espera']] as const).map(([metric,label])=><button type="button" key={metric} aria-pressed={annualMetric===metric} onClick={()=>chooseAnnualMetric(metric)}>{label}</button>)}</div>
        {annualMetric==='time'&&<><button className="v2-small-switch" aria-expanded={annualRefine} onClick={toggleAnnualRefinement}>{annualRefine?'← Volver al tiempo nacional':'Explorar por lista, provincia y edad ↗'}</button>{annualRefine&&<AnnualTimeExplorer year={year} provinceNames={provinceNames} onSummary={setAnnualDetail}/>}</>}
      </div></section>
      <section id="escena-5" data-scene="5" className="v2-scene"><div className="v2-copy"><p className="v2-kicker">05 / El tiempo vivido</p><h2>Para algunos,<br />la espera<br /><em>terminó.</em></h2><p>Entre quienes recibieron un trasplante renal en {latest.year}, la mediana de espera fue de <strong>{decimal(latest.median)} meses.</strong></p><p className="v2-note">{integer(latest.n)} trasplantes con tiempo registrado. Describe a quienes llegaron al trasplante; no predice cuánto esperará quien sigue en lista.</p></div></section>
      <section id="escena-6" data-scene="6" className="v2-scene"><div className="v2-copy"><p className="v2-kicker">06 / Otra posibilidad comienza</p><h2>Una donación<br />abre una<br /><em>posibilidad.</em></h2><p className="v2-big-value">{integer(data.organDonors)}</p><p>donantes fallecidos de órganos<br />en establecimientos argentinos.</p><p className="v2-note">{data.donorPeriod}</p></div></section>
      <section id="escena-7" data-scene="7" className="v2-scene"><div className="v2-copy"><p className="v2-kicker">07 / De la posibilidad al trasplante</p><h2>La oportunidad<br />toma forma.</h2><p className="v2-big-value">{integer(data.organTransplants)}</p><p>trasplantes de órganos.<br /><span className="v2-note">{data.transplantPeriod}</span></p><ol className="v2-flow"><li>Donación</li><li>Órganos disponibles</li><li>Compatibilidad y prioridad</li><li>Trasplante</li></ol><p className="v2-note">El recorrido es conceptual. Estas cifras tienen cortes distintos; los trasplantes incluyen donantes vivos y fallecidos.</p></div></section>
      <section id="escena-8" data-scene="8" className="v2-scene"><div className="v2-copy"><p className="v2-kicker">08 / Volver a mirar</p><h2>Una cifra.<br />Muchas esperas.<br /><em>Una vida<br />en cada una.</em></h2><p>Ahora, el total cuenta otra historia.</p><a className="v2-text-link" href="#escena-3">Volver a desarmar la cifra ↗</a></div></section>
    </div>
    <footer className="v2-method" id="sobre-los-datos"><p className="v2-kicker">La historia detrás de la historia</p><h2>Sobre los datos.</h2><p>Fuente: <a href="https://cresi.incucai.gov.ar/">CRESI / SINTRA · INCUCAI</a>. Estadísticas públicas agregadas.</p><details><summary>Qué representa cada punto</summary><p>En la espera actual, una inscripción en una lista: {integer(data.total)} al {data.snapshot}. No son personas únicas deduplicadas. Las listas combinadas se mantienen como fueron publicadas; las córneas y escleras son tejidos. La posición de los puntos es una composición gráfica, no una localización geográfica ni un registro individual.</p><p>La expresión editorial «personas esperando» representa inscripciones, no un conteo de personas únicas. Las selecciones de lista, antigüedad y provincia utilizan las tablas conjuntas de antigüedad por provincia y lista disponibles en la captura, además de los totales publicados. Los puntos mantienen posiciones identificadas sólo como unidades gráficas de celdas agregadas, no como pacientes. Cuando falta un desglose por lista, el resto del total conjunto se conserva sin asignarlo a una lista particular; se obtiene restando los subtotales conocidos de ese mismo total. No se reconstruyen microdatos ni trayectorias personales. Hepatorrenal y cardiorrenal no publican antigüedad individual por lista en esta captura. «Otras listas» reúne las siete listas con menos de 100 inscripciones en la fotografía; el desglose conserva sus categorías y cifras originales. Una categoría sin distribución publicada permanece explícita. El cartograma deforma una base provincial del IGN: conserva relaciones territoriales, pero los límites y superficies son una composición gráfica. Cantidad acentúa el volumen de inscripciones; Por millón reorganiza la forma y codifica el color según las tasas PMH del archivo derivado de CRESI, con una deformación más contenida. Las superficies no son una escala proporcional exacta: los valores precisos se consultan sobre cada provincia o en «Ver cada grupo». PMH significa inscripciones por millón de habitantes; se reutiliza la tasa calculada con el denominador de población de CRESI, cuyo año base no está explicitado, sin inferir nuevos denominadores ni combinar tasas. La vista filtrada por antigüedad no dispone de PMH; se conserva el conteo y se deshabilita esa opción. Un dato ausente se indica como s/d y no se sustituye por cero. Ambas vistas conservan exactamente las mismas inscripciones por provincia. CABA aparece ampliada y conectada con su posición; se muestra el territorio continental y la Isla Grande de Tierra del Fuego.</p></details><details><summary>Tiempo, donación y trasplante: universos diferentes</summary><p>La serie 2005–2025 usa el «Total LE» anual publicado. El total anual de lista no equivale a la fotografía actual. La exploración anual de tiempo consulta 13 listas × 24 provincias × 2 grupos de edad (menores de 18 y 18 o más) de los años completos 2005–2025. Conserva días para hepática y meses para las demás listas según las fuentes verificadas. El promedio conjunto es ponderado por número de receptores; los cuantiles no se promedian. Esta base territorial y etaria puede diferir de la nacional: renal 2025 reúne 1.528 registros en estos cruces, frente a 1.542 del reporte nacional. Las celdas sin observaciones no representan una espera de cero. Los cruces sólo se cargan al abrir la exploración de tiempo. La serie de donantes fallecidos reales de órganos y de tejidos incluye establecimientos extranjeros cuando están publicados. La fotografía actual, el total anual, los donantes y los trasplantes no comparten una misma población. Las transiciones entre ellos disuelven los puntos; no representan personas que pasan de una etapa a otra.</p><p>El tiempo de espera corresponde a trasplantes renales con tiempo registrado en {latest.year}: n = {integer(latest.n)}, mediana {decimal(latest.median)} meses, percentiles 25 y 75: {decimal(latest.p25)} y {decimal(latest.p75)} meses. No estima el tiempo futuro de quienes esperan hoy. La vista Lista usa los 1.542 receptores renales trasplantados en 2025 y su tiempo previo en lista. La vista Diálisis usa el stock de 31.431 pacientes en tratamiento al 31/12/2025 del reporte de prevalencia: no es la cantidad de todas las personas que pasaron por diálisis durante el año. El total real de horas de 2025 no está disponible. Se presenta un escenario hipotético: un año completo de 52 semanas, 156 sesiones de cuatro horas por cada integrante de ese stock. Se incluyen ficticiamente doce meses para todos; no se imputan esos meses a los datos ni se utilizan los 66,39 meses de los receptores trasplantados como promedio de esta población. El punto que sale de la cifra funciona como relevo visual: no identifica una persona del total actual como integrante del reporte de 2025. El calendario de Lista ilustra el promedio publicado; el de Diálisis construye el escenario anual. Los cuadrados completados se conservan, sin reiniciar una semana. Las trayectorias no reconstruyen duraciones individuales. Primero se acumulan sesiones completas de cuatro horas o días enteros; después se amplía el conjunto hasta el número de registros del reporte. Los equivalentes colectivos se calculan con ese escenario redondeado y se presentan como aproximaciones. Como referencia separada, el reporte de receptores conserva los promedios publicados: lista {decimal(latest.average)} meses y diálisis {decimal(dialysis?.average ?? latest.average)} meses. El tiempo reunido es una estimación: número de registros × promedio publicado ÷ 12; el promedio está redondeado y no reconstruye duraciones individuales. Los dos tiempos se superponen y no se suman entre sí. La serie de diálisis 2005–2025 conserva sus fuentes y SHA256 en el archivo descargable. Las conversiones de calendario adoptan 365,2425 días por año y 12 meses por año. La suma es tiempo-persona aproximado de esos registros, no una suma de lista y diálisis. Las horas de sesión son un escenario ilustrativo de hemodiálisis de 4 horas, 3 sesiones por semana, mantenido durante todo el período: no son horas registradas por CRESI ni describen todos los tratamientos o toda la vida de una persona. Los equivalentes de días, años o siglos en sesiones expresan bloques continuos de 24 horas, aunque las sesiones del escenario están distribuidas por semanas. Las cintas se pliegan como una representación gráfica del tiempo; los pliegues no son pacientes nuevos ni categorías clínicas.</p><p>El ritmo de hemodiálisis del escenario se basa en la <a href="https://buenosaires.gob.ar/gcaba_historico/salud/red-de-dialisis-y-neforlogia">Red de Diálisis y Nefrología del Gobierno de la Ciudad de Buenos Aires</a>: en general, tres sesiones semanales de unas cuatro horas cada una. Describe un régimen de tratamiento, no las horas observadas de la población CRESI.</p><p>Donación: {data.donorPeriod}; {integer(data.organDonors)} donantes fallecidos de órganos, dentro de {integer(data.allDonors)} donantes de órganos y/o tejidos en establecimientos argentinos. Se excluyen establecimientos extranjeros. Trasplantes: {data.transplantPeriod}; {integer(data.organTransplants)} de órganos dentro de {integer(data.allTransplants)} de órganos y tejidos. Incluye donantes vivos y fallecidos, por residencia del receptor. No se calcula una tasa de conversión entre estas cifras.</p></details><details><summary>Las listas, sin simplificar sus categorías</summary><dl>{data.organs.map(group => <div key={group.id}><dt>{group.label}</dt><dd>{integer(group.value)}</dd></div>)}</dl></details><div className="v2-footer-links"><a href={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/datos/tiempo-dialisis.json`} download>Diálisis hasta el trasplante ↗</a><a href={`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/datos/poblacion-dialisis-2025.json`} download>Pacientes en diálisis al 31/12/2025 ↗</a><a href="#escena-0">Volver al principio ↑</a><span>LA ESPERA / V.02</span></div></footer>
  </main>;
}
