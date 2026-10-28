'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import WaitingUniverse from './waiting-universe';
import SeniorityComparison from './seniority-comparison';
import CurrentDiagnoses,{currentDiagnosisFor} from './current-diagnoses';
import {diagnosisAnchor,waitingAnchor} from './exploration-findings';
import WaitingEpilogue from './waiting-epilogue';
import {organLabel} from './organ-labels';
import AnnualParallel from './annual-unified';
import DialysisDialog from './dialysis-dialog';
import DonationContext from './donation-context';

import partial2026 from './partial-2026.generated.json';
import annualCounts from './annual-list-counts.generated.json';
import nationalQuantiles from './annual-national-quantiles.generated.json';
import {comparisonHistory} from './annual-comparison-model';


import DataMethod from './data-method';
import SandQueue,{type SandHandoff} from './sand-queue';
import dynamic from 'next/dynamic';
import type {PointRelay} from './temporal-journey';
import {annualListLabels,type AnnualTimeDetail,type AnnualTimeSelection} from './annual-time-model';
import { decimal, groupsFor, integer, territoryColors, type TerritoryMetric, type Dimension, type UniverseData, type UniverseMode } from './universe-model';
import { allWaiting, explorationGroups, selectExploration, type ExplorationSelection } from './linked-exploration';
import './experience.css';
import mapSnapshotRaw from './map-demographics.generated.json';
import {mapUniverseData,type MapAge,type MapSex,type MapSnapshot} from './map-demographics-model';
const mapSnapshot=mapSnapshotRaw as MapSnapshot;

const AnnualTimeExplorer=dynamic(()=>import('./annual-time-explorer'),{ssr:false,loading:()=> <p className="v2-note">Cargando los cruces…</p>});

const chapters = ['El silencio', 'La cifra', 'Qué se espera', 'Los años', 'Cada espera'];
function NextScene({to,children}:{to:number;children:React.ReactNode}) {
  return <a className="v2-next-scene" href={`#escena-${to}`}><span>{children}</span><span aria-hidden="true">↓</span></a>;
}

const modes: UniverseMode[] = ['intro', 'number', 'organ', 'history', 'end'];

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
  const [epilogueFocus,setEpilogueFocus]=useState<number|null>(null);
  const [year, setYear] = useState(data.history.at(-1)!.year);
  const [dialysisModalOpen,setDialysisModalOpen]=useState(false);
  const [selectedDiagnosis,setSelectedDiagnosis]=useState<{code?:string;label:string;value:number}|null>(null);
  useEffect(()=>setSelectedDiagnosis(null),[selection.listId,selection.province,mapAge,mapSex]);
  const dialysisTrigger=useRef<HTMLButtonElement>(null);
  const pointRelay=useRef<PointRelay>({x:.84,y:.58});
  const sandHandoff=useRef<SandHandoff|null>(null);
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
  const sexSeries=useMemo(()=>{
    const sexes=mapSex==='all'?(['FEMENINO','MASCULINO'] as const):([mapSex] as const);
    return sexes.map(sex=>{
      const cohort=mapSnapshot.cohorts[mapAge+'|'+sex];
      const result=explorationGroups(mapUniverseData(originalData,mapSnapshot,mapAge,sex),'seniority',selection);
      return {label:sex==='FEMENINO'?'Mujeres':'Varones',color:sex==='FEMENINO'?'#7400bd':'#0052cc',groups:result.groups,unavailable:result.unavailable||!!selection.province&&cohort.missingProvinces.includes(selection.province)||result.groups.some(g=>g.kind==='unavailable'&&g.value>0)};
    });
  },[originalData,mapAge,mapSex,selection]);
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
  const metricText = (group: typeof groups[number]) => territoryMetric === 'count' ? integer(group.value) : group.pmh === undefined ? 's/d' : decimal(group.pmh);
  const annualComparison=useMemo(()=>comparisonHistory(data.history,annualSelection,annualTimes,annualCounts,partial2026,nationalQuantiles.rows),[data.history,annualSelection,annualTimes]);
  const record=annualComparison.find(item=>item.year===year)!;

  const timeN = data.dialysisPopulation?.count ?? 0;
  const mode = scene === 2 ? dimension : modes[scene];
  const dark = false;
  const visibleGroups = focus ? groups.filter(group => group.id === focus) : groups;
  const count = scene === 2 ? visibleGroups.reduce((sum, group) => sum + group.value, 0) : data.total;
  const anchor=diagnosisOpen
    ? diagnosisAnchor(currentDiagnosisFor(selection.listId,selection.province,mapAge,mapSex),!!selection.listId,selection.seniority,selectedDiagnosis,selection.listId,mapAge,mapSex,selection.province,provinceNames)
    : waitingAnchor({data:mapData,selection,dimension,mapAge,mapSex,provinceNames,defaultView:false,missing:!!selection.province&&mapCohort.missingProvinces.includes(selection.province),dialysis:timeN,sex:mapSex,mapSnapshot,count});
  const population = 'waiting';
  const unit = scene===2&&dimension==='territory'?(territoryMetric==='pmh'?'Color: inscripciones por millón de habitantes':'Inscripciones por provincia'):'Un punto · una inscripción en lista de espera';
  function closeDialysisModal(){setDialysisModalOpen(false);requestAnimationFrame(()=>dialysisTrigger.current?.focus({preventScroll:true}));}
  function changeDimension(next: Dimension) { setDiagnosisOpen(false); setSelectedDiagnosis(null); setDimension(next); setHover(null); setNotice(null); }
  function selectGroup(id: string) {
    const group=groups.find(g => g.id === id);
    if (!group) return;
    const next=selectExploration(selection,dimension,group);
    setSelection(next.selection); setDimension(next.dimension); setHover(null);
    setNotice(group.kind === 'unavailable' ? dimension === 'seniority' ? 'Esta lista no tiene antigüedad publicada. Podés explorar sus provincias.' : 'El total está disponible, pero su desglose por lista no está publicado para este cruce.' : null);
  }
  function reset() { setSelection(allWaiting); setMapAge('all');setMapSex('all');setSelectedDiagnosis(null);setDimension('organ'); setHover(null); setNotice(null); setTerritoryMetric('count'); }
  function regroup() { setSelection({...selection,smallLists:false,listId:null}); setDimension('organ'); setHover(null); setNotice(null); }
  return <main className="waiting-v2" data-dark={dark} data-paused={reduced} data-intro={scene<2}>
    <a href="#escena-1" className="v2-skip">Saltar la apertura</a>
    <header className="v2-header"><a href="#escena-0" className="v2-brand">LA ESPERA <span>Argentina</span></a><div><button type="button" aria-haspopup="dialog" aria-controls="sobre-los-datos" aria-expanded={methodOpen} onClick={()=>setMethodOpen(true)}>Sobre los datos</button></div></header>
    <nav className="v2-progress" aria-label="Capítulos">{chapters.map((chapter, index) => <a href={`#escena-${index}`} key={chapter} aria-label={`${index + 1}. ${chapter}`} aria-current={scene === index ? 'step' : undefined}><span>{chapter}</span></a>)}</nav>
    <div className="v2-story">
      <div ref={stage} className="v2-stage" data-epilogue={scene===4} data-sand={scene<2} aria-hidden={scene === 0 ? true : undefined}>
        <div className="v2-figure">{scene===4?<WaitingEpilogue count={originalData.total} snapshot={originalData.snapshot} paused={reduced} focused={epilogueFocus} onFocus={setEpilogueFocus}/>:scene<2?<SandQueue snapshot={data.snapshot} count={data.total} forming={scene===1} paused={reduced} relay={pointRelay} handoff={sandHandoff}/>:scene===3?<AnnualParallel onYear={setYear} record={record} history={annualComparison} selection={annualSelection} scope={`${annualSelection.province?provinceNames.get(annualSelection.province):'Argentina'} · ${annualSelection.age==='all'?'todas las edades':annualSelection.age==='menor_18'?'menores de 18':'18 años y más'}`} renalNational={originalData.history} provinceNames={provinceNames}/>:scene===2&&diagnosisOpen?<CurrentDiagnoses key={`${selection.listId}|${selection.province}|${mapAge}|${mapSex}`} list={selection.listId} province={selection.province} age={mapAge} sex={mapSex} seniority={selection.seniority} onChooseList={()=>changeDimension('organ')} selectedDiagnosisId={selectedDiagnosis?.code} onSelectDiagnosis={setSelectedDiagnosis}/>:scene===2&&dimension==='seniority'?<SeniorityComparison series={sexSeries} onSelect={(id,sex)=>{setMapSex(sex);selectGroup(id);}}/>:<WaitingUniverse entry={sandHandoff} mode={mode} groups={groups} count={count} total={data.total} focus={scene === 2 ? focus : null} hover={scene === 2 ? hover : null} paused={reduced} dark={dark} population={population} label={`${integer(count)} unidades. ${unit}.`} unit={unit} territoryMetric={territoryMetric} territoryContext={territoryReference} relay={pointRelay} onHover={setHover} onSelect={selectGroup} />}
          {scene===2&&!diagnosisOpen&&dimension!=='seniority'&&<p className="v2-chart-invitation">{dimension==='territory'?'Elegí una provincia para explorar sus tiempos.':'Elegí una ilustración para explorar esa lista.'}</p>}
        </div>
      </div>
      <section id="escena-0" data-scene="0" className="v2-scene v2-opening"><div className="v2-opening-content"><p className="v2-kicker">¿Cuánto tarda una segunda oportunidad?</p><h1>LA<br /><span>ESPERA</span></h1><a className="v2-scroll" href="#escena-1">Una exploración visual sobre la lista de espera de órganos y tejidos en Argentina <span>↓</span></a></div></section>
      <section id="escena-1" data-scene="1" className="v2-scene v2-number-scene"><div className="v2-copy"><p className="v2-kicker">01 / Una cifra</p><h2>La espera se cuenta.</h2><p><strong>personas esperando un órgano o tejido en Argentina.</strong></p><NextScene to={2}>Cada punto tiene su tiempo. Empezá por una lista</NextScene></div></section>
      <section id="escena-2" data-scene="2" className="v2-scene v2-explore"><div className="v2-copy">
        <p className="v2-kicker">02 / Explorar la espera</p>
        <h2>Esperar…<br />{diagnosisOpen?'¿por qué?':dimension==='organ'?'¿qué?':dimension==='territory'?'¿dónde?':'¿hace cuánto?'}</h2>
        <p className="v2-explore-context">¿Cuánto llevan esperando? Elegí una lista y una provincia para descubrir sus tiempos. Después, profundizá por edad, sexo y diagnósticos.</p>
        <nav className="v2-tabs" role="tablist" aria-label="Dimensiones de la espera">
          <button type="button" aria-pressed={!diagnosisOpen&&dimension === 'organ'} onClick={() => changeDimension('organ')}>Lista</button>
          <button type="button" aria-pressed={!diagnosisOpen&&dimension === 'territory'} onClick={() => changeDimension('territory')}>Provincia</button>
          <button type="button" aria-pressed={!diagnosisOpen&&dimension === 'seniority'} onClick={() => changeDimension('seniority')}>Tiempo en lista</button>
          <button type="button" aria-pressed={diagnosisOpen} onClick={()=>{setDiagnosisOpen(true);setSelectedDiagnosis(null);}}>¿Por qué?</button>
        </nav>
        <p className="v2-anchor-insight" aria-live="polite">{anchor}</p>
        {dimension === 'territory' && canUsePmh && !diagnosisOpen && <div className="v2-tabs" role="group" aria-label="Métrica territorial"><button type="button" aria-pressed={territoryMetric === 'count'} onClick={() => setTerritoryMetric('count')}>Total</button><button type="button" aria-pressed={territoryMetric === 'pmh'} onClick={() => setTerritoryMetric('pmh')}>Por millón de hab.</button></div>}
        <div className="v2-demographic-controls">
          <fieldset>
            <legend>Edad</legend>
            <div>
              <button type="button" aria-pressed={mapAge==='all'} onClick={()=>setMapAge('all')}>Todas</button>
              <button type="button" aria-pressed={mapAge==='menor18'} onClick={()=>setMapAge('menor18')}>Pediátricos (&lt; 18 años)</button>
              <button type="button" aria-pressed={mapAge==='18mas'} onClick={()=>setMapAge('18mas')}>Adultos (&ge; 18 años)</button>
            </div>
          </fieldset>
          <fieldset>
            <legend>Sexo</legend>
            <div>
              <button type="button" aria-pressed={mapSex==='all'} onClick={()=>setMapSex('all')}>Todos</button>
              <button type="button" aria-pressed={mapSex==='FEMENINO'} onClick={()=>setMapSex('FEMENINO')}>Mujeres</button>
              <button type="button" aria-pressed={mapSex==='MASCULINO'} onClick={()=>setMapSex('MASCULINO')}>Varones</button>
            </div>
          </fieldset>
        </div>
        {!diagnosisOpen&&selection.listId === 'RENAL' && <div className="v2-renal-invitation"><p>La espera renal puede empezar antes de la lista. ¿Cuánto tiempo representa la diálisis?</p><button ref={dialysisTrigger} type="button" onClick={()=>setDialysisModalOpen(true)}>Mirar el tiempo en diálisis ↗</button></div>}
        {notice && <p className="v2-notice">{notice}</p>}
        {!diagnosisOpen&&exploration.unavailable && <p className="v2-availability">Quitá una selección para volver a los datos disponibles.</p>}
        {!diagnosisOpen&&!exploration.unavailable && !count && scene === 2 && <p className="v2-availability">No hay inscripciones para esta selección.</p>}
        {!diagnosisOpen&&selection.province&&<DonationContext province={selection.province} provinceLabel={provinceNames.get(selection.province)??selection.province} list={selection.listId}/>}
        {diagnosisOpen&&selection.listId&&<button type="button" className="v2-small-switch" onClick={()=>changeDimension('seniority')}>Volver a los tiempos de esta espera ↗</button>}
        <div className="v2-explore-secondary">
        {(selection.listId || selection.province || selection.seniority || selection.smallLists || mapAge!=='all' || mapSex!=='all' || selectedDiagnosis) && <button className="v2-back" onClick={reset}>← Toda la espera</button>}
        {!diagnosisOpen&&dimension === 'organ' && groups.some(g => g.kind === 'collection') && <button className="v2-small-switch" onClick={() => selectGroup('OTHER_LISTS')}>Desglosar las listas menores ↗</button>}
        {!diagnosisOpen&&dimension === 'organ' && selection.smallLists && <button className="v2-small-switch" onClick={regroup}>← Reagrupar las listas menores</button>}
        {!diagnosisOpen&&<details className="v2-exact"><summary>🔍 Buscar en la tabla de valores o elegir por nombre</summary><div>{groups.map(group => <button key={group.id} disabled={group.value === 0&&!group.missing} onClick={() => selectGroup(group.id)} aria-pressed={focus === group.id}><span>{group.label}{group.kind === 'collection' ? ' · desglosar' : ''}</span><strong>{group.missing?'s/d':dimension === 'territory' ? metricText(group)+(territoryMetric === 'pmh' ? ' PMH' : '') : integer(group.value)}</strong></button>)}</div></details>}
        </div>
      </div><div className="v2-explore-next"><NextScene to={3}>Ya viste cuánto llevan esperando. ¿Cómo cambiaron los tiempos hasta el trasplante?</NextScene></div></section>
      <section id="escena-3" data-scene="3" className="v2-scene v2-annual-scene"><div className="v2-copy">
        <p className="v2-kicker">03 / Año tras año</p>
        <h2>¿Cómo cambió la espera?</h2>
        <p className="v2-interaction-hint" id="v2-year-help">Elegí tiempos, donación o cantidad. Compará provincias o mirá la distancia con el país.</p>
        <label className="v2-year" htmlFor="v2-year">{year}</label><input id="v2-year" aria-label="Año del registro" className="v2-range" type="range" min={2005} max={2025} value={year} onChange={event=>setYear(Number(event.target.value))}/>
        <div className="v2-range-ends"><span>2005</span><span>2025</span></div>
        {scene===3&&<AnnualTimeExplorer year={year} provinceNames={provinceNames} selection={annualSelection} onSelection={selectAnnual} onSeries={setAnnualTimes} showFilters={true} renalNational={data.history} showSummary={false}/>}
        <NextScene to={4}>Volver a la pregunta inicial</NextScene>
        <div className="v2-journey-end"><button type="button" onClick={()=>setMethodOpen(true)}>Sobre los datos ↗</button></div>
      </div></section>
      <section id="escena-4" data-scene="4" className="v2-scene v2-epilogue" aria-labelledby="v2-epilogue-title"><div className="v2-copy">
        <p className="v2-kicker">04 / Cada espera</p>
        <h2 id="v2-epilogue-title">¿Cuánto tarda una<br/>segunda oportunidad?</h2>
        <p>No hay una respuesta única.<br/>Cada espera tiene sus propios tiempos.</p>
        <p className="v2-epilogue-answer">Donar puede salvar vidas. Hace posible que una espera se convierta en un trasplante.</p>
        <p className="v2-epilogue-last">Detrás de cada cifra hay alguien que sigue esperando.</p>
        <div className="v2-epilogue-actions"><button type="button" onClick={()=>setEpilogueFocus(current=>((current??0)+Math.max(1,Math.floor(originalData.total*.381966)))%originalData.total)}>{epilogueFocus===null?'Acercarse a una espera':'Mirar otra espera'} ↗</button>{epilogueFocus!==null&&<button type="button" onClick={()=>setEpilogueFocus(null)}>Volver al conjunto</button>}</div>
        <footer className="v2-epilogue-footer"><a href="#escena-0">Volver al comienzo ↑</a><button type="button" onClick={()=>setMethodOpen(true)}>Sobre los datos ↗</button></footer>
      </div></section>
    </div>
    <DataMethod data={originalData} record={record} selection={annualSelection} open={methodOpen} onClose={()=>setMethodOpen(false)}/>
    <DialysisDialog open={dialysisModalOpen} onClose={closeDialysisModal}/>
  </main>;
}
