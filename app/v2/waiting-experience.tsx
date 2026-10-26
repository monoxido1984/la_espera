'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import WaitingUniverse from './waiting-universe';
import SeniorityComparison from './seniority-comparison';
import CurrentDiagnoses from './current-diagnoses';
import {organLabel} from './organ-labels';
import AnnualParallel from './annual-flow-view';
import type {AnnualMoment} from './annual-story-model';
import partial2026 from './partial-2026.generated.json';
import annualCounts from './annual-list-counts.generated.json';
import nationalQuantiles from './annual-national-quantiles.generated.json';
import {comparisonHistory} from './annual-comparison-model';
import YearMilestone from './year-milestone';
import ExplorationComparison from './exploration-comparison';
import DataMethod from './data-method';
import SandQueue,{type SandHandoff} from './sand-queue';
import dynamic from 'next/dynamic';
import TemporalJourney,{JourneyControls,type PointRelay} from './temporal-journey';
import {annualListLabels,type AnnualTimeDetail,type AnnualTimeSelection} from './annual-time-model';
import { decimal, groupsFor, integer, readableLabel, territoryColors, territoryValue, type TerritoryMetric, type Dimension, type UniverseData, type UniverseMode } from './universe-model';
import { allWaiting, explorationGroups, selectExploration, type ExplorationSelection } from './linked-exploration';
import './experience.css';
import mapSnapshotRaw from './map-demographics.generated.json';
import {mapUniverseData,type MapAge,type MapSex,type MapSnapshot} from './map-demographics-model';
const mapSnapshot=mapSnapshotRaw as MapSnapshot;

const AnnualTimeExplorer=dynamic(()=>import('./annual-time-explorer'),{ssr:false,loading:()=> <p className="v2-note">Cargando los cruces…</p>});

const annualMoments: {id:AnnualMoment;label:string;title:string;hint:string}[]=[
  {id:'movements',label:'Movimientos',title:'Un año de entradas y salidas.',hint:'Elegí una categoría; desplegá diagnósticos o motivos sin perder el año.'},
  {id:'causes',label:'Motivos',title:'Los motivos de ingreso y egreso.',hint:'Seleccioná las bandas o abrí los detalles de cada lado.'},
  {id:'history',label:'Historia',title:'¿Cómo cambió la espera?',hint:'Explorá cómo cambió el tiempo de espera. Tocá un año o mové el control.'},
];
const chapters = ['El silencio', 'La cifra', 'Qué se espera', 'Los años'];
function NextScene({to,children}:{to:number;children:React.ReactNode}) {
  return <a className="v2-next-scene" href={`#escena-${to}`}><span>{children}</span><span aria-hidden="true">↓</span></a>;
}

const modes: UniverseMode[] = ['intro', 'number', 'organ', 'history'];

export default function WaitingExperience({ data: previousData }: { data: UniverseData }) {
  const originalData=useMemo(()=>mapUniverseData(previousData,mapSnapshot,'all','all'),[previousData]);
  const stage = useRef<HTMLDivElement>(null);
  const [scene, setScene] = useState(0);
  const [mapAge,setMapAge]=useState<MapAge>('all');
  const [mapSex,setMapSex]=useState<MapSex>('all');
  const mapData=useMemo(()=>mapUniverseData(originalData,mapSnapshot,mapAge,mapSex),[originalData,mapAge,mapSex]);
  const data=scene===2?mapData:originalData;
  const mapCohort=mapSnapshot.cohorts[`${mapAge}|${mapSex}`];
  const [dimension, setDimension] = useState<Dimension>('organ');
  const [diagnosisOpen,setDiagnosisOpen]=useState(false);
  const [territoryMetric, setTerritoryMetric] = useState<TerritoryMetric>('count');
  const [selection, setSelection] = useState<ExplorationSelection>(allWaiting);
  const [notice, setNotice] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [methodOpen,setMethodOpen]=useState(false);
  const [reduced, setReduced] = useState(false);
  const [annualReplay,setAnnualReplay]=useState(0);
  const [annualMoment,setAnnualMoment]=useState<AnnualMoment>('movements');
  const annualStep=annualMoments.findIndex(item=>item.id===annualMoment);
  const annualChapter=annualMoments[annualStep];
  const [year, setYear] = useState(data.history.at(-1)!.year);
  const [journeyProgress,setJourneyProgress]=useState(0);
  const [dialysisOpen,setDialysisOpen]=useState(false);
  const dialysisTrigger=useRef<HTMLButtonElement>(null);
  const dialysisClose=useRef<HTMLButtonElement>(null);
  const pointRelay=useRef<PointRelay>({x:.84,y:.58});
  const sandHandoff=useRef<SandHandoff|null>(null);
  const [annualRefine,setAnnualRefine]=useState(false);
  const [annualSelection,setAnnualSelection]=useState<AnnualTimeSelection>({list:'RENAL',province:null,age:'all'});
  const [annualTimes,setAnnualTimes]=useState<AnnualTimeDetail[]>([]);
  // Synchronize only when a shared filter changes; scrolling never resets it.
  useEffect(()=>{
    if(selection.listId && annualListLabels[selection.listId]) setAnnualSelection(current=>({...current,list:selection.listId!,province:selection.province}));
    else setAnnualSelection(current=>({...current,province:selection.province}));
  },[selection.listId,selection.province]);
  function selectAnnual(value:AnnualTimeSelection){
    setAnnualSelection({...value,age:'all'});
    setSelection(current=>({...current,listId:value.list,province:value.province,smallLists:false}));
  }
  useEffect(()=>{if(location.hash==='#sobre-los-datos')setMethodOpen(true);},[]);
  useEffect(()=>{
    if(dialysisOpen)dialysisClose.current?.focus();
  },[dialysisOpen]);
  useEffect(()=>{
    if(!dialysisOpen)return;
    const onKeyDown=(event:KeyboardEvent)=>{
      if(event.key==='Escape'){event.preventDefault();closeDialysis();}
    };
    window.addEventListener('keydown',onKeyDown);
    return()=>window.removeEventListener('keydown',onKeyDown);
  },[dialysisOpen]);
  useEffect(()=>{if(scene!==2&&dialysisOpen)setDialysisOpen(false);},[scene,dialysisOpen]);
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
  const sexSeries=useMemo(()=>(['FEMENINO','MASCULINO'] as const).map(sex=>{
    const cohort=mapSnapshot.cohorts[mapAge+'|'+sex];
    const result=explorationGroups(mapUniverseData(originalData,mapSnapshot,mapAge,sex),'seniority',selection);
    return {label:sex==='FEMENINO'?'Mujeres':'Hombres',color:sex==='FEMENINO'?'#7400bd':'#0052cc',groups:result.groups,unavailable:result.unavailable||!!selection.province&&cohort.missingProvinces.includes(selection.province)||result.groups.some(g=>g.kind==='unavailable'&&g.value>0)};
  }),[originalData,mapAge,selection]);
  const exploration = useMemo(() => explorationGroups(mapData,dimension,selection), [mapData,dimension,selection]);
  const territoryReference = useMemo(() => territoryColors(explorationGroups(mapData,'territory',{...selection,province:null}).groups,territoryMetric),[mapData,selection,territoryMetric]);
  const groups = useMemo(() => dimension === 'territory' ? exploration.groups.map(g => {const missing=mapCohort.missingProvinces.includes(g.sourceKey??'');return {...g,color:missing?'#d8d5cc':territoryReference.find(row => row.id === g.id)?.color ?? g.color,missing};}) : dimension === 'organ' ? exploration.groups.map(g=>({...g,label:organLabel(g.sourceKey??g.id,g.label)})) : exploration.groups, [exploration,dimension,territoryReference,mapCohort.missingProvinces]);
  const selectedKey = dimension === 'organ' ? selection.listId : dimension === 'seniority' ? selection.seniority : selection.province;
  const focus = groups.find(g => g.sourceKey === selectedKey)?.id ?? null;
  const provinceNames = useMemo(() => {
    const labels=groupsFor(data,'territory',null);
    return new Map(data.lists.find(l => l.id === 'TOTAL')!.province.map((p,i) => [p.label,labels[i].label]));
  },[data]);
  const canUsePmh = groups.some(g => g.pmh !== undefined);
  const territorialScale = [...territoryReference].filter(g => territoryValue(g, territoryMetric) !== undefined).sort((a,b) => territoryValue(a, territoryMetric)!-territoryValue(b, territoryMetric)!);
  const metricText = (group: typeof groups[number]) => territoryMetric === 'count' ? integer(group.value) : group.pmh === undefined ? 's/d' : decimal(group.pmh);
  const annualComparison=useMemo(()=>comparisonHistory(data.history,annualSelection,annualTimes,annualCounts,partial2026,nationalQuantiles.rows),[data.history,annualSelection,annualTimes]);
  const record=annualComparison.find(item=>item.year===year)!;
  const timeN = data.dialysisPopulation?.count ?? 0;
  const selected = data.organs.find(item => item.id === selection.listId);
  const mode = scene === 2 ? dimension : modes[scene];
  const dark = false;
  const visibleGroups = focus ? groups.filter(group => group.id === focus) : groups;
  const count = scene === 2 ? visibleGroups.reduce((sum, group) => sum + group.value, 0) : data.total;
  const population = 'waiting';
  const unit = scene===2&&dimension==='territory'?'Inscripciones por provincia':'Un punto · una inscripción en lista de espera';
  function closeDialysis(){setDialysisOpen(false);requestAnimationFrame(()=>dialysisTrigger.current?.focus());}
  function toggleAnnualRefinement(){setAnnualRefine(!annualRefine);}
  function changeDimension(next: Dimension) { if(next==='seniority')setMapSex('all'); setDiagnosisOpen(false); setDimension(next); setHover(null); setNotice(null); }
  function selectGroup(id: string) {
    const group=groups.find(g => g.id === id);
    if (!group) return;
    const next=selectExploration(selection,dimension,group);
    if(dimension==='territory'&&next.dimension==='seniority')setMapSex('all');
    setSelection(next.selection); setDimension(next.dimension); setHover(null);
    setNotice(group.kind === 'unavailable' ? dimension === 'seniority' ? 'Esta lista no tiene antigüedad publicada. Podés explorar sus provincias.' : 'El total está disponible, pero su desglose por lista no está publicado para este cruce.' : null);
  }
  function clearSelection(field: 'listId' | 'seniority' | 'province') {
    setSelection({...selection,[field]:null}); setHover(null); setNotice(null);
    setDimension(field === 'listId' ? 'organ' : field === 'seniority' ? 'seniority' : 'territory');
  }
  function reset() { setSelection(allWaiting); setMapAge('all');setMapSex('all');setDimension('organ'); setHover(null); setNotice(null); setTerritoryMetric('count'); }
  function regroup() { setSelection({...selection,smallLists:false,listId:null}); setDimension('organ'); setHover(null); setNotice(null); }
  return <main className="waiting-v2" data-dark={dark} data-paused={reduced} data-intro={scene<2}>
    <a href="#escena-1" className="v2-skip">Saltar la apertura</a>
    <header className="v2-header"><a href="#escena-0" className="v2-brand">LA ESPERA <span>Argentina</span></a><div><button type="button" aria-haspopup="dialog" aria-controls="sobre-los-datos" aria-expanded={methodOpen} onClick={()=>setMethodOpen(true)}>Sobre los datos</button>{scene===3&&<button type="button" className="v2-header-replay" onClick={()=>setAnnualReplay(value=>value+1)}>Repetir ↻</button>}</div></header>
    <nav className="v2-progress" aria-label="Capítulos">{chapters.map((chapter, index) => <a href={`#escena-${index}`} key={chapter} aria-label={`${index + 1}. ${chapter}`} aria-current={scene === index ? 'step' : undefined}><span>{chapter}</span></a>)}</nav>
    <div className="v2-story">
      <div ref={stage} className="v2-stage" data-sand={scene<2} aria-hidden={scene === 0 ? true : undefined}>
        <div className="v2-figure">{scene<2?<SandQueue count={data.total} forming={scene===1} paused={reduced} relay={pointRelay} handoff={sandHandoff}/>:scene===2&&dialysisOpen?<TemporalJourney progress={journeyProgress} metric="dialysis" months={12} records={timeN} paused={reduced} relay={pointRelay}/>:scene===3?<AnnualParallel onMoment={setAnnualMoment} moment={annualMoment} onYear={setYear} paused={reduced} replay={annualReplay} record={record} history={annualComparison} selection={annualSelection} scope={`${annualSelection.province?provinceNames.get(annualSelection.province):'Argentina'} · ${annualSelection.age==='all'?'todas las edades':annualSelection.age==='menor_18'?'menores de 18':'18 años y más'}`}/>:scene===2&&diagnosisOpen?<CurrentDiagnoses key={`${selection.listId}|${selection.province}|${mapAge}|${mapSex}`} list={selection.listId} province={selection.province} age={mapAge} sex={mapSex} seniority={selection.seniority} onChooseList={()=>changeDimension('organ')}/>:scene===2&&dimension==='seniority'?<SeniorityComparison series={sexSeries} onSelect={(id,sex)=>{setMapSex(sex);selectGroup(id);}}/>:<WaitingUniverse entry={sandHandoff} mode={mode} groups={groups} count={count} total={data.total} focus={scene === 2 ? focus : null} hover={scene === 2 ? hover : null} paused={reduced} dark={dark} population={population} label={`${integer(count)} unidades. ${unit}.`} unit={unit} territoryMetric={territoryMetric} territoryContext={territoryReference} relay={pointRelay} onHover={setHover} onSelect={selectGroup} />}
          {scene===2&&!dialysisOpen&&!diagnosisOpen&&dimension!=='seniority'&&<p className="v2-chart-invitation">{dimension==='territory'?'Elegí una provincia para explorar sus tiempos.':'Elegí una ilustración para explorar esa lista.'}</p>}
        </div>
      </div>
      <section id="escena-0" data-scene="0" className="v2-scene v2-opening"><div className="v2-opening-content"><p className="v2-kicker">¿Cuánto tarda una segunda posibilidad?</p><h1>LA<br /><span>ESPERA</span></h1><a className="v2-scroll" href="#escena-1">Una exploración visual sobre la lista de espera de órganos y tejidos en Argentina <span>↓</span></a></div></section>
      <section id="escena-1" data-scene="1" className="v2-scene v2-number-scene"><div className="v2-copy"><p className="v2-kicker">01 / Una cifra</p><h2>La espera se cuenta.</h2><p><strong>personas esperando un órgano o tejido en Argentina.</strong></p><NextScene to={2}>Descubrí qué hay detrás de la cifra</NextScene></div></section>
      <section id="escena-2" data-scene="2" className="v2-scene v2-explore"><div className="v2-copy">
        {dialysisOpen?<div className="v2-dialysis-context" aria-labelledby="v2-dialysis-title">
          <p className="v2-kicker">02 / Contexto renal · diálisis</p>
          <button ref={dialysisClose} type="button" className="v2-back" onClick={closeDialysis}>← Volver a la exploración de Riñón</button>
          <h2 id="v2-dialysis-title">El tiempo<br/>en diálisis</h2>
          <JourneyControls progress={journeyProgress} onProgress={setJourneyProgress}/>
          <p className="v2-note">Otra población: pacientes en diálisis al cierre de 2025, no personas de la lista seleccionada. El recorrido de 12 meses es un escenario ilustrativo, no una espera observada ni una predicción individual.</p>
        </div>:<>
        <p className="v2-kicker">02 / Desarmar la cifra</p>
        <h2>Esperar…<br />{diagnosisOpen?'¿por qué?':dimension==='organ'?'¿qué?':dimension==='territory'?'¿dónde?':'¿hace cuánto?'}</h2>
        <p className="v2-explore-context">{diagnosisOpen?'Diagnósticos al inscribirse en 2026, hasta el 24/10.':dimension === 'seniority' ? 'El tiempo que ya llevan en lista.' : dimension === 'territory' ? 'La espera, provincia por provincia.' : selection.smallLists ? 'Las otras esperas, una por una.' : 'Distintas esperas'}</p>
        <div className="v2-tabs" role="group" aria-label="Mirar la espera por">{([['organ','Lista'],['territory','Provincia'],['seniority','Antigüedad']] as const).map(([id,label]) => <button type="button" aria-pressed={!diagnosisOpen&&dimension === id} key={id} onClick={() => changeDimension(id)}>{label}</button>)}<button type="button" aria-pressed={diagnosisOpen} onClick={()=>{setDiagnosisOpen(true);setHover(null);setNotice(null);}}>¿Por qué?</button></div>
        <div className="v2-demographic-controls">
          <fieldset><legend>Edad</legend><div>{([['all','Todas'],['menor18','Menores de 18'],['18mas','18 y más']] as const).map(([id,label])=><button type="button" key={id} aria-pressed={mapAge===id} onClick={()=>{setMapAge(id);setHover(null);}}>{label}</button>)}</div></fieldset>
          {diagnosisOpen&&<fieldset><legend>Sexo</legend><div>{([['all','Todos'],['FEMENINO','Mujeres'],['MASCULINO','Hombres']] as const).map(([id,label])=><button type="button" key={id} aria-pressed={mapSex===id} onClick={()=>setMapSex(id)}>{label}</button>)}</div></fieldset>}
        </div>
        {!diagnosisOpen&&selection.province&&mapCohort.missingProvinces.includes(selection.province)&&<p className="v2-availability" role="status">CRESI no publicó resultado para {provinceNames.get(selection.province)} en este cruce. No se interpreta ese faltante como cero.</p>}
        <div className="v2-selection" aria-label="Selecciones conectadas">
          {selection.smallLists && <button type="button" onClick={regroup} aria-label="Salir del desglose de otras listas">Otras listas <span>×</span></button>}
          {selected && <button type="button" onClick={() => clearSelection('listId')} aria-label={`Quitar lista ${selected.label}`}>{organLabel(selected.id,selected.label)} <span>×</span></button>}
          {selection.seniority && <button type="button" onClick={() => clearSelection('seniority')} aria-label={`Quitar antigüedad ${readableLabel(selection.seniority)}`}>{readableLabel(selection.seniority)} <span>×</span></button>}
          {selection.province && <button type="button" onClick={() => clearSelection('province')} aria-label={`Quitar provincia ${provinceNames.get(selection.province)}`}>{provinceNames.get(selection.province)} <span>×</span></button>}
        </div>
        {!diagnosisOpen&&(exploration.unavailable || selection.listId || selection.province || selection.seniority || selection.smallLists) && <p className="v2-exploration-total" aria-live="polite">{exploration.unavailable ? 'Cruce no publicado' : <><strong>{integer(visibleGroups.reduce((sum,g) => sum+g.value,0))}</strong> inscripciones</>}</p>}
        {!diagnosisOpen&&dimension === 'territory' && <div className="v2-territory-controls">
          <div className="v2-tabs v2-map-switch" role="group" aria-label="Color del mapa">{([['count','Cantidad'],['pmh','Por millón']] as const).map(([id,label]) => <button type="button" key={id} aria-pressed={territoryMetric === id} disabled={id === 'pmh' && !canUsePmh} onClick={() => { setTerritoryMetric(id); setHover(null); }}>{label}</button>)}</div>
          <p className="v2-map-caption">{territoryMetric === 'count' ? 'Inscripciones por provincia.' : 'Inscripciones por millón de habitantes.'}{!canUsePmh && <><br /><span>PMH no disponible para este cruce.</span></>}</p>
          {territorialScale.length > 0 && <div className="v2-map-legend" aria-label={`Color: de ${metricText(territorialScale[0])} a ${metricText(territorialScale.at(-1)!)} ${territoryMetric === 'pmh' ? 'por millón de habitantes' : 'inscripciones'}`}><span style={{background:`linear-gradient(90deg,${territorialScale[0].color},${territorialScale.at(-1)!.color})`}} /><div><span>{metricText(territorialScale[0])}</span><span>{metricText(territorialScale.at(-1)!)}</span></div></div>}
        </div>}

        {notice && <p role="status" className="v2-availability">{notice}</p>}
        {!diagnosisOpen&&exploration.unavailable && <p className="v2-availability">Quitá una selección para volver a los datos disponibles.</p>}
        {!diagnosisOpen&&!exploration.unavailable && !count && scene === 2 && <p className="v2-availability">No hay inscripciones para esta selección.</p>}
        <div className="v2-explore-secondary">
        {(selection.listId || selection.province || selection.seniority || selection.smallLists || mapAge!=='all' || mapSex!=='all') && <button className="v2-back" onClick={reset}>← Toda la espera</button>}
        {!diagnosisOpen&&dimension === 'organ' && groups.some(g => g.kind === 'collection') && <button className="v2-small-switch" onClick={() => selectGroup('OTHER_LISTS')}>Desglosar las listas menores ↗</button>}
        {!diagnosisOpen&&dimension === 'organ' && selection.smallLists && <button className="v2-small-switch" onClick={regroup}>← Reagrupar las listas menores</button>}
        {!diagnosisOpen&&<details className="v2-exact"><summary>Ver valores y elegir por nombre</summary><div>{groups.map(group => <button key={group.id} disabled={group.value === 0&&!group.missing} onClick={() => selectGroup(group.id)} aria-pressed={focus === group.id}><span>{group.label}{group.kind === 'collection' ? ' · desglosar' : ''}</span><strong>{group.missing?'s/d':dimension === 'territory' ? metricText(group)+(territoryMetric === 'pmh' ? ' PMH' : '') : integer(group.value)}</strong></button>)}</div></details>}
        </div>
        {!diagnosisOpen&&selection.listId==='RENAL'&&<aside className="v2-renal-invitation"><p>La espera puede empezar antes de la lista. Para muchas personas que necesitan un trasplante renal, la diálisis también forma parte de la espera. ¿Cuánto tiempo representa?</p><button ref={dialysisTrigger} type="button" onClick={()=>setDialysisOpen(true)}>Explorar el tiempo en diálisis ↗</button></aside>}
        </>}
      </div><div className="v2-explore-next"><NextScene to={3}>Seguir: los cambios de cada año</NextScene></div></section>
      <section id="escena-3" data-scene="3" className="v2-scene v2-annual-scene"><div className="v2-copy">
        <p className="v2-kicker">03 / Año tras año</p>
        <nav className="v2-annual-moments" aria-label="Momentos de Año tras año">{annualMoments.map((item,index)=><button type="button" key={item.id} aria-current={annualMoment===item.id?'step':undefined} onClick={()=>setAnnualMoment(item.id)}><span>{index+1}</span>{item.label}</button>)}</nav>
        <h2 id="v2-annual-moment-title">{annualChapter.title}</h2>
        <p className="v2-interaction-hint" id="v2-year-help">{annualChapter.hint}</p>
        <label className="v2-year" htmlFor="v2-year">{year}{record.partial&&<small> parcial</small>}</label><input id="v2-year" aria-describedby="v2-year-help" aria-label="Año del registro" className="v2-range" type="range" min={data.history[0].year} max={2025} value={year} onChange={event=>setYear(Number(event.target.value))} aria-valuetext={`${year}: ${record.waitlist===null?'conteo de lista no disponible':integer(record.waitlist)+' en lista'}`}/>
        <div className="v2-range-ends"><span>{data.history[0].year}</span><span>2025</span></div>
        {scene===3&&<AnnualTimeExplorer year={year} provinceNames={provinceNames} selection={annualSelection} onSelection={selectAnnual} onSeries={setAnnualTimes} showFilters={annualRefine||!!annualSelection.province} renalNational={data.history} showSummary={false}/>}
        {(mapAge!=='all'||mapSex!=='all'||selection.seniority)&&<p className="v2-note">El año conserva lista y provincia. Los movimientos son de todas las edades; no incluyen el cruce por sexo ni antigüedad de la escena 02.</p>}
        <button type="button" className="v2-small-switch" aria-expanded={annualRefine} onClick={toggleAnnualRefinement}>{annualRefine?'← Ocultar filtro de provincia':'Explorar por provincia ↗'}</button>
        <ExplorationComparison selection={annualSelection} record={record} history={annualComparison} renalNational={originalData.history} provinceNames={provinceNames}/>
        {annualMoment==='history'&&<details className="v2-year-context"><summary>Contexto de {year}</summary>{record.partial?<p>Mayo de 2026 · récord mensual de 109 procesos de donación de órganos.</p>:<YearMilestone year={year}/>}</details>}
        <div className="v2-annual-turns"><button type="button" disabled={annualStep===0} onClick={()=>setAnnualMoment(annualMoments[annualStep-1].id)}>← Anterior</button>{annualStep<2?<button type="button" onClick={()=>setAnnualMoment(annualMoments[annualStep+1].id)}>Seguir: {annualMoments[annualStep+1].label.toLowerCase()} →</button>:<a href="#escena-2">Volver a explorar ↑</a>}</div>
        <div className="v2-journey-end"><button type="button" onClick={()=>setMethodOpen(true)}>Sobre los datos ↗</button></div>
      </div></section>
    </div>
    <DataMethod data={originalData} record={record} selection={annualSelection} open={methodOpen} onClose={()=>setMethodOpen(false)}/>
  </main>;
}
