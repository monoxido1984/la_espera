'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import WaitingUniverse from './waiting-universe';
import {organLabel} from './organ-labels';
import AnnualParallel from './annual-flow-view';
import partial2026 from './partial-2026.generated.json';
import annualCounts from './annual-list-counts.generated.json';
import {comparisonHistory} from './annual-comparison-model';
import YearMilestone from './year-milestone';
import DataMethod from './data-method';
import SandQueue,{type SandHandoff} from './sand-queue';
import dynamic from 'next/dynamic';
import TemporalJourney,{JourneyControls,type PointRelay} from './temporal-journey';
import type {AnnualTimeDetail,AnnualTimeSelection} from './annual-time-model';
import { decimal, groupsFor, integer, readableLabel, territoryColors, territoryValue, type TerritoryMetric, type Dimension, type UniverseData, type UniverseMode } from './universe-model';
import { allWaiting, explorationGroups, selectExploration, type ExplorationSelection } from './linked-exploration';
import './experience.css';

const AnnualTimeExplorer=dynamic(()=>import('./annual-time-explorer'),{ssr:false,loading:()=> <p className="v2-note">Cargando los cruces…</p>});

const chapters = ['El silencio', 'La cifra', 'Qué se espera', 'Esperar antes de esperar · foco renal', 'Los años'];
const modes: UniverseMode[] = ['intro', 'number', 'organ', 'comparison', 'history'];

export default function WaitingExperience({ data }: { data: UniverseData }) {
  const stage = useRef<HTMLDivElement>(null);
  const [scene, setScene] = useState(0);
  const [dimension, setDimension] = useState<Dimension>('organ');
  const [territoryMetric, setTerritoryMetric] = useState<TerritoryMetric>('count');
  const [selection, setSelection] = useState<ExplorationSelection>(allWaiting);
  const [notice, setNotice] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [methodOpen,setMethodOpen]=useState(false);
  const [reduced, setReduced] = useState(false);
  const [annualReplay,setAnnualReplay]=useState(0);
  const [year, setYear] = useState(data.history.at(-1)!.year);
  const [journeyProgress,setJourneyProgress]=useState(0);
  const pointRelay=useRef<PointRelay>({x:.84,y:.58});
  const sandHandoff=useRef<SandHandoff|null>(null);
  const [annualRefine,setAnnualRefine]=useState(false);
  const [annualSelection,setAnnualSelection]=useState<AnnualTimeSelection>({list:'RENAL',province:null,age:'all'});
  const [annualTimes,setAnnualTimes]=useState<AnnualTimeDetail[]>([]);
  useEffect(()=>{if(location.hash==='#sobre-los-datos')setMethodOpen(true);},[]);
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
  const groups = useMemo(() => dimension === 'territory' ? exploration.groups.map(g => ({...g,color:territoryReference.find(row => row.id === g.id)?.color ?? g.color})) : dimension === 'organ' ? exploration.groups.map(g=>({...g,label:organLabel(g.sourceKey??g.id,g.label)})) : exploration.groups, [exploration,dimension,territoryReference]);
  const selectedKey = dimension === 'organ' ? selection.listId : dimension === 'seniority' ? selection.seniority : selection.province;
  const focus = groups.find(g => g.sourceKey === selectedKey)?.id ?? null;
  const provinceNames = useMemo(() => {
    const labels=groupsFor(data,'territory',null);
    return new Map(data.lists.find(l => l.id === 'TOTAL')!.province.map((p,i) => [p.label,labels[i].label]));
  },[data]);
  const canUsePmh = groups.some(g => g.pmh !== undefined);
  const territorialScale = [...territoryReference].filter(g => territoryValue(g, territoryMetric) !== undefined).sort((a,b) => territoryValue(a, territoryMetric)!-territoryValue(b, territoryMetric)!);
  const metricText = (group: typeof groups[number]) => territoryMetric === 'count' ? integer(group.value) : group.pmh === undefined ? 's/d' : decimal(group.pmh);
  const annualComparison=useMemo(()=>comparisonHistory(data.history,annualSelection,annualTimes,annualCounts,partial2026),[data.history,annualSelection,annualTimes]);
  const record=annualComparison.find(item=>item.year===year)!;
  const timeN = data.dialysisPopulation?.count ?? 0;
  const selected = data.organs.find(item => item.id === selection.listId);
  const mode = scene === 2 ? dimension : modes[scene];
  const dark = false;
  const visibleGroups = focus ? groups.filter(group => group.id === focus) : groups;
  const count = scene === 3 ? timeN : scene === 2 ? visibleGroups.reduce((sum, group) => sum + group.value, 0) : data.total;
  const population = scene === 3 ? 'dialysis-year-end-2025' : 'waiting';
  const unit = scene===2&&dimension==='territory'?'Inscripciones por provincia':scene === 3 ? 'Un punto · un paciente en diálisis al cierre de 2025' : 'Un punto · una inscripción en lista de espera';
  function toggleAnnualRefinement(){setAnnualRefine(!annualRefine);}
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
  return <main className="waiting-v2" data-dark={dark} data-paused={reduced} data-intro={scene<2}>
    <a href="#escena-1" className="v2-skip">Saltar la apertura</a>
    <header className="v2-header"><a href="#escena-0" className="v2-brand">LA ESPERA <span>Argentina</span></a><div><button type="button" aria-haspopup="dialog" aria-controls="sobre-los-datos" aria-expanded={methodOpen} onClick={()=>setMethodOpen(true)}>Sobre los datos</button>{scene===4&&<button type="button" className="v2-header-replay" onClick={()=>setAnnualReplay(value=>value+1)}>Repetir ↻</button>}</div></header>
    <nav className="v2-progress" aria-label="Capítulos">{chapters.map((chapter, index) => <a href={`#escena-${index}`} key={chapter} aria-label={`${index + 1}. ${chapter}`} aria-current={scene === index ? 'step' : undefined}><span>{chapter}</span></a>)}</nav>
    <div className="v2-story">
      <div ref={stage} className="v2-stage" data-sand={scene<2} aria-hidden={scene === 0 ? true : undefined}>
        <div className="v2-figure">{scene<2?<SandQueue count={data.total} forming={scene===1} paused={reduced} relay={pointRelay} handoff={sandHandoff}/>:scene===3?<TemporalJourney progress={journeyProgress} metric="dialysis" months={12} records={timeN} paused={reduced} relay={pointRelay}/>:scene===4?<AnnualParallel replay={annualReplay} record={record} history={annualComparison} selection={annualSelection} scope={`${annualSelection.province?provinceNames.get(annualSelection.province):'Argentina'} · ${annualSelection.age==='all'?'todas las edades':annualSelection.age==='menor_18'?'menores de 18':'18 años y más'}`}/>:<WaitingUniverse entry={sandHandoff} mode={mode} groups={groups} count={count} total={data.total} focus={scene === 2 ? focus : null} hover={scene === 2 ? hover : null} paused={reduced} dark={dark} population={population} label={`${integer(count)} unidades. ${unit}.`} unit={unit} territoryMetric={territoryMetric} territoryContext={territoryReference} relay={pointRelay} onHover={setHover} onSelect={selectGroup} />}
        </div>
      </div>
      <section id="escena-0" data-scene="0" className="v2-scene v2-opening"><div className="v2-opening-content"><p className="v2-kicker">¿Cuánto tarda una segunda posibilidad?</p><h1>LA<br /><span>ESPERA</span></h1><a className="v2-scroll" href="#escena-1">Una exploración visual sobre la lista de espera de órganos y tejidos en Argentina <span>↓</span></a></div></section>
      <section id="escena-1" data-scene="1" className="v2-scene v2-number-scene"><div className="v2-copy"><p className="v2-kicker">01 / Una cifra</p><h2>La espera se cuenta.</h2><p><strong>personas esperando un órgano o tejido en Argentina.</strong></p><p className="v2-note">Datos al {data.snapshot}.</p></div></section>
      <section id="escena-2" data-scene="2" className="v2-scene v2-explore"><div className="v2-copy">
        <p className="v2-kicker">02 / Desarmar la cifra</p>
        <h2>Esperar…<br />{dimension==='organ'?'¿qué?':dimension==='territory'?'¿dónde?':'¿hace cuánto?'}</h2>
        <p>{dimension === 'organ' ? selection.smallLists ? 'Las otras esperas, una por una.' : 'Distintas esperas.' : dimension === 'seniority' ? 'El tiempo que ya llevan esperando. Todavía no tuvieron su oportunidad.' : ''}</p>
        <div className="v2-tabs" role="group" aria-label="Mirar la espera por">{([['organ','Lista'],['territory','Provincia'],['seniority','Antigüedad']] as const).map(([id,label]) => <button type="button" aria-pressed={dimension === id} key={id} onClick={() => changeDimension(id)}>{label}</button>)}</div>
        <div className="v2-selection" aria-label="Selecciones conectadas">
          {selection.smallLists && <button type="button" onClick={regroup} aria-label="Salir del desglose de otras listas">Otras listas <span>×</span></button>}
          {selected && <button type="button" onClick={() => clearSelection('listId')} aria-label={`Quitar lista ${selected.label}`}>{organLabel(selected.id,selected.label)} <span>×</span></button>}
          {selection.seniority && <button type="button" onClick={() => clearSelection('seniority')} aria-label={`Quitar antigüedad ${readableLabel(selection.seniority)}`}>{readableLabel(selection.seniority)} <span>×</span></button>}
          {selection.province && <button type="button" onClick={() => clearSelection('province')} aria-label={`Quitar provincia ${provinceNames.get(selection.province)}`}>{provinceNames.get(selection.province)} <span>×</span></button>}
        </div>
        {(exploration.unavailable || selection.listId || selection.province || selection.seniority || selection.smallLists) && <p className="v2-exploration-total" aria-live="polite">{exploration.unavailable ? 'Cruce no publicado' : <><strong>{integer(visibleGroups.reduce((sum,g) => sum+g.value,0))}</strong> inscripciones{selection.listId || selection.province || selection.seniority || selection.smallLists ? ' en esta selección' : ' · todas las listas'}</>}</p>}
        {dimension === 'territory' && <div className="v2-territory-controls">
          <div className="v2-tabs v2-map-switch" role="group" aria-label="Color del mapa">{([['count','Cantidad'],['pmh','Por millón']] as const).map(([id,label]) => <button type="button" key={id} aria-pressed={territoryMetric === id} disabled={id === 'pmh' && !canUsePmh} onClick={() => { setTerritoryMetric(id); setHover(null); }}>{label}</button>)}</div>
          <p className="v2-map-caption">{territoryMetric === 'count' ? 'Inscripciones por provincia.' : 'Inscripciones por millón de habitantes.'}{!canUsePmh && <><br /><span>PMH no disponible para este cruce.</span></>}</p>
          {territorialScale.length > 0 && <div className="v2-map-legend" aria-label={`Color: de ${metricText(territorialScale[0])} a ${metricText(territorialScale.at(-1)!)} ${territoryMetric === 'pmh' ? 'por millón de habitantes' : 'inscripciones'}`}><span style={{background:`linear-gradient(90deg,${territorialScale[0].color},${territorialScale.at(-1)!.color})`}} /><div><span>{metricText(territorialScale[0])}</span><span>{metricText(territorialScale.at(-1)!)}</span></div></div>}
        </div>}
        <p className="v2-note">{dimension === 'organ' ? 'Elegí una lista y explorá cómo se desglosa la espera.' : dimension === 'seniority' ? 'Elegí un tiempo para ver sus provincias.' : 'Elegí una provincia para ver sus listas.'}{dimension==='organ'&&<><br />Cada ilustración representa un tipo de lista de espera.</>}</p>
        {notice && <p role="status" className="v2-availability">{notice}</p>}
        {exploration.unavailable && <p className="v2-availability">Quitá una selección para volver a los datos disponibles.</p>}
        {!exploration.unavailable && !count && scene === 2 && <p className="v2-availability">No hay inscripciones para esta selección.</p>}
        {(selection.listId || selection.province || selection.seniority || selection.smallLists) && <button className="v2-back" onClick={reset}>← Toda la espera</button>}
        {dimension === 'organ' && groups.some(g => g.kind === 'collection') && <button className="v2-small-switch" onClick={() => selectGroup('OTHER_LISTS')}>Desglosar las listas menores ↗</button>}
        {dimension === 'organ' && selection.smallLists && <button className="v2-small-switch" onClick={regroup}>← Reagrupar las listas menores</button>}
        <details className="v2-exact"><summary>Ver cada grupo</summary><div>{groups.map(group => <button key={group.id} disabled={group.value === 0} onClick={() => selectGroup(group.id)} aria-pressed={focus === group.id}><span>{group.label}{group.kind === 'collection' ? ' · desglosar' : ''}</span><strong>{dimension === 'territory' ? metricText(group)+(territoryMetric === 'pmh' ? ' PMH' : '') : integer(group.value)}</strong></button>)}</div></details>
      </div></section>
      <section id="escena-3" data-scene="3" className="v2-scene v2-time-scene"><div className="v2-copy"><p className="v2-kicker">03 / Foco renal</p><h2>Esperar…<br />antes de esperar</h2><p>En la espera renal, el tiempo puede empezar en diálisis, antes de entrar en lista.</p>
        <JourneyControls progress={journeyProgress} onProgress={setJourneyProgress}/>
      </div></section>
      <section id="escena-4" data-scene="4" className="v2-scene v2-annual-scene"><div className="v2-copy"><p className="v2-kicker">04 / Año tras año</p><h2>La espera fue<br />cambiando.</h2><p>La lista recibe inscripciones y registra egresos. Elegí un año para ver sus movimientos y los motivos publicados.</p>
        <label className="v2-year" htmlFor="v2-year">{year}{record.partial&&<small> parcial</small>}</label><input id="v2-year" aria-label="Año del registro" className="v2-range" type="range" min={data.history[0].year} max={2025} value={year} onChange={event=>setYear(Number(event.target.value))} aria-valuetext={`${year}${record.partial?' parcial al 31 de julio':''}: ${record.waitlist===null?'conteo de lista no disponible':integer(record.waitlist)+' en lista'}`}/>
        <div className="v2-range-ends"><span>{data.history[0].year}</span><span>2025</span></div>
        {record.partial?<><p className="v2-partial-warning">Corte al 31/07/2026 · enero–julio. Las cantidades son parciales y no equivalen a un año completo.</p><div className="v2-year-milestone"><div><span>Mayo de 2026 · récord mensual</span><strong>109 procesos de donación de órganos</strong><p>El mayor registro mensual informado para el país.</p><a href={partial2026.record.url}>INCUCAI · fuente del récord ↗</a></div></div></>:<YearMilestone year={year}/>}
        {scene===4&&<AnnualTimeExplorer year={year} provinceNames={provinceNames} selection={annualSelection} onSelection={setAnnualSelection} onSeries={setAnnualTimes} showFilters={annualRefine} renalNational={data.history}/>}
        <button className="v2-small-switch" aria-expanded={annualRefine} onClick={toggleAnnualRefinement}>{annualRefine?'← Ocultar filtros de provincia y edad':'Agregar provincia y edad ↗'}</button>

      </div></section>
    </div>
    <DataMethod data={data} open={methodOpen} onClose={()=>setMethodOpen(false)}/>
  </main>;
}
