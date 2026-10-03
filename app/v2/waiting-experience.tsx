'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import WaitingUniverse from './waiting-universe';
import { publicPath } from '../public-path';
import { decimal, groupsFor, integer, type Dimension, type UniverseData, type UniverseMode } from './universe-model';
import './experience.css';

const chapters = ['El silencio', 'La cifra', 'Las personas', 'Muchas esperas', 'Los años', 'El tiempo', 'La donación', 'La oportunidad', 'Volver'];
const modes: UniverseMode[] = ['intro', 'number', 'all', 'organ', 'history', 'duration', 'donation', 'transplants', 'end'];

export default function WaitingExperience({ data }: { data: UniverseData }) {
  const stage = useRef<HTMLDivElement>(null);
  const [scene, setScene] = useState(0);
  const [dimension, setDimension] = useState<Dimension>('organ');
  const [listId, setListId] = useState<string | null>(null);
  const [focus, setFocus] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [year, setYear] = useState(data.history.at(-1)!.year);
  const [annualMetric, setAnnualMetric] = useState<'waitlist' | 'donors' | 'time'>('waitlist');
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    update(); media.addEventListener('change', update);
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) { setScene(Number((entry.target as HTMLElement).dataset.scene)); setHover(null); }
    }, { rootMargin: '-45% 0px -45% 0px' });
    document.querySelectorAll('.v2-scene').forEach(element => observer.observe(element));
    return () => { observer.disconnect(); media.removeEventListener('change', update); };
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
  const groups = useMemo(() => groupsFor(data, dimension, listId), [data, dimension, listId]);
  const record = data.history.find(item => item.year === year)!;
  const latest = data.history.at(-1)!;
  const selected = data.organs.find(item => item.id === listId);
  const mode = scene === 3 ? dimension : modes[scene];
  const dark = scene === 6 || scene === 7;
  const visibleGroups = focus ? groups.filter(group => group.id === focus) : groups;
  const count = scene === 3 ? visibleGroups.reduce((sum, group) => sum + group.value, 0) : scene === 4 ? annualMetric === 'time' ? record.n : record[annualMetric] : scene === 5 ? latest.n : scene === 6 ? data.organDonors : scene === 7 ? data.organTransplants : data.total;
  const population = scene === 4 ? `annual-${annualMetric}` : scene === 5 ? 'renal-recipients' : scene === 6 ? 'donors' : scene === 7 ? 'transplants' : 'waiting';
  const unit = scene === 4 ? annualMetric === 'donors' ? 'Un punto · un donante de órganos y/o tejidos' : annualMetric === 'time' ? 'Un punto · un trasplante renal con tiempo registrado' : 'Un punto · una inscripción en el total anual' : scene === 5 ? 'Un punto · un trasplante renal con tiempo registrado' : scene === 6 ? 'Un punto · un donante fallecido de órganos' : scene === 7 ? 'Un punto · un trasplante de órganos' : 'Un punto · una inscripción en lista de espera';
  function changeDimension(next: Dimension) { setDimension(next); setFocus(next === 'organ' ? listId : null); setHover(null); }
  function selectGroup(id: string) { setFocus(focus === id ? null : id); if (dimension === 'organ') setListId(focus === id ? null : id); setHover(null); }
  function reset() { setListId(null); setFocus(null); setHover(null); }
  return <main className="waiting-v2" data-dark={dark} data-paused={paused || reduced}>
    <a href="#escena-1" className="v2-skip">Saltar la apertura</a>
    <header className="v2-header"><a href="#escena-0" className="v2-brand">LA ESPERA <span>Argentina</span></a><div><a href="#sobre-los-datos">Sobre los datos</a><button type="button" onClick={() => setPaused(!paused)} aria-pressed={paused || reduced} disabled={reduced}>{reduced ? 'Movimiento reducido' : paused ? 'Activar movimiento' : 'Pausar movimiento'}</button></div></header>
    <nav className="v2-progress" aria-label="Capítulos">{chapters.map((chapter, index) => <a href={`#escena-${index}`} key={chapter} aria-label={`${index + 1}. ${chapter}`} aria-current={scene === index ? 'step' : undefined}><span>{chapter}</span></a>)}</nav>
    <div className="v2-story">
      <div ref={stage} className="v2-stage" aria-hidden={scene === 0 ? true : undefined}>
        <div className="v2-figure"><WaitingUniverse mode={mode} groups={groups} count={count} total={scene === 6 || scene === 7 ? data.organTransplants : data.total} focus={scene === 3 ? focus : null} hover={scene === 3 ? hover : null} paused={paused || reduced} dark={dark} population={population} label={scene === 0 ? 'Un círculo de puntos respira lentamente.' : `${integer(count)} unidades. ${unit}.`} unit={unit} onHover={setHover} onSelect={selectGroup} />
          {scene === 4 && <div className="v2-ring-label"><strong>{annualMetric === 'time' ? decimal(record.median) : integer(record[annualMetric])}</strong><span>{annualMetric === 'time' ? 'meses · mediana renal' : annualMetric === 'donors' ? 'donantes de órganos y/o tejidos' : 'inscripciones'} · {year}</span></div>}
          {scene === 5 && <div className="v2-ring-label"><strong>{decimal(latest.median)}</strong><span>meses · mediana</span></div>}
        </div>
      </div>
      <section id="escena-0" data-scene="0" className="v2-scene v2-opening"><div className="v2-opening-content"><p className="v2-kicker">Una historia sobre el tiempo y la posibilidad</p><h1>LA<br /><span>ESPERA</span></h1><p className="v2-opening-line">Esperar un órgano no significa<br />esperar lo mismo.</p><a className="v2-scroll" href="#escena-1">Tomate un momento. Después, seguí. <span>↓</span></a></div></section>
      <section id="escena-1" data-scene="1" className="v2-scene"><div className="v2-copy"><p className="v2-kicker">01 / Una cifra</p><h2>La espera<br />se cuenta.</h2><p>Hay <strong>{integer(data.total)} inscripciones</strong> en las listas de espera de órganos y tejidos de Argentina.</p><p className="v2-note">Una fotografía al {data.snapshot}.</p></div></section>
      <section id="escena-2" data-scene="2" className="v2-scene"><div className="v2-copy"><p className="v2-kicker">02 / Una vida detrás de cada punto</p><h2>Pero no se<br />vive en total.</h2><p>Se vive de a uno.<br />Con planes, rutinas y un futuro pendiente.</p><p className="v2-note">Cada punto representa una inscripción, no una identidad. Una persona puede integrar más de una lista.</p></div></section>
      <section id="escena-3" data-scene="3" className="v2-scene v2-explore"><div className="v2-copy"><p className="v2-kicker">03 / Desarmar la cifra</p><h2>¿Esperar<br />qué?</h2><p>{dimension === 'organ' ? 'Un mismo total. Distintas esperas.' : dimension === 'seniority' ? 'El tiempo que ya llevan esperando.' : 'La espera se extiende por todo el país.'}</p><div className="v2-tabs" role="group" aria-label="Mirar la espera por">{([['organ', 'Lista'], ['seniority', 'Antigüedad'], ['territory', 'Provincia']] as const).map(([id, label]) => <button type="button" aria-pressed={dimension === id} key={id} onClick={() => changeDimension(id)}>{label}</button>)}</div><p className="v2-note">{selected ? `${selected.label} · ${integer(selected.value)} inscripciones` : 'Órganos y tejidos · todas las listas'}<br />Tocá un grupo para acercarte.</p>{(listId || focus) && <button className="v2-back" onClick={reset}>← Toda la espera</button>}<details className="v2-exact"><summary>Ver cada grupo</summary><div>{groups.map(group => <button key={group.id} disabled={group.value === 0} onClick={() => selectGroup(group.id)} aria-pressed={focus === group.id}><span>{group.label}</span><strong>{integer(group.value)}</strong></button>)}</div></details></div></section>
      <section id="escena-4" data-scene="4" className="v2-scene"><div className="v2-copy"><p className="v2-kicker">04 / Año tras año</p><h2>Los años pasan.<br />La espera cambia.</h2><p>Recorré dos décadas. Mirá la espera, la donación y el tiempo, un año a la vez.</p><label className="v2-year" htmlFor="v2-year">{year}</label><input id="v2-year" aria-label="Año del registro" className="v2-range" type="range" min={data.history[0].year} max={latest.year} value={year} onChange={event => setYear(Number(event.target.value))} aria-valuetext={`${year}: ${annualMetric === 'time' ? decimal(record.median) + ' meses de mediana renal' : integer(record[annualMetric]) + (annualMetric === 'donors' ? ' donantes' : ' inscripciones')}`} /><div className="v2-range-ends"><span>{data.history[0].year}</span><span>{latest.year}</span></div><div className="v2-tabs" role="group" aria-label="Dimensión del año">{([['waitlist', 'Espera'], ['donors', 'Donación'], ['time', 'Tiempo']] as const).map(([metric, label]) => <button type="button" key={metric} aria-pressed={annualMetric === metric} onClick={() => setAnnualMetric(metric)}>{label}</button>)}</div><p className="v2-note">{annualMetric === 'waitlist' ? 'Total LE anual. No equivale a la fotografía actual.' : annualMetric === 'donors' ? 'Donantes de órganos y/o tejidos del año completo.' : 'Mediana de espera de quienes recibieron un trasplante renal.'}<br />Registros agregados de poblaciones distintas.</p></div></section>
      <section id="escena-5" data-scene="5" className="v2-scene"><div className="v2-copy"><p className="v2-kicker">05 / El tiempo vivido</p><h2>Para algunos,<br />la espera<br /><em>terminó.</em></h2><p>Entre quienes recibieron un trasplante renal en {latest.year}, la mediana de espera fue de <strong>{decimal(latest.median)} meses.</strong></p><p className="v2-note">{integer(latest.n)} trasplantes con tiempo registrado. Describe a quienes llegaron al trasplante; no predice cuánto esperará quien sigue en lista.</p></div></section>
      <section id="escena-6" data-scene="6" className="v2-scene"><div className="v2-copy"><p className="v2-kicker">06 / Otra posibilidad comienza</p><h2>Una donación<br />abre una<br /><em>posibilidad.</em></h2><p className="v2-big-value">{integer(data.organDonors)}</p><p>donantes fallecidos de órganos<br />en establecimientos argentinos.</p><p className="v2-note">{data.donorPeriod}</p></div></section>
      <section id="escena-7" data-scene="7" className="v2-scene"><div className="v2-copy"><p className="v2-kicker">07 / De la posibilidad al trasplante</p><h2>La oportunidad<br />toma forma.</h2><p className="v2-big-value">{integer(data.organTransplants)}</p><p>trasplantes de órganos.<br /><span className="v2-note">{data.transplantPeriod}</span></p><ol className="v2-flow"><li>Donación</li><li>Órganos disponibles</li><li>Compatibilidad y prioridad</li><li>Trasplante</li></ol><p className="v2-note">El recorrido es conceptual. Estas cifras tienen cortes distintos; los trasplantes incluyen donantes vivos y fallecidos.</p></div></section>
      <section id="escena-8" data-scene="8" className="v2-scene"><div className="v2-copy"><p className="v2-kicker">08 / Volver a mirar</p><h2>Una cifra.<br />Muchas esperas.<br /><em>Una vida<br />en cada una.</em></h2><p>Ahora, el total cuenta otra historia.</p><a className="v2-text-link" href="#escena-3">Volver a desarmar la cifra ↗</a><a className="v2-text-link" href={publicPath('/espera-v1/')}>Explorar todos los datos · Versión 1 ↗</a></div></section>
    </div>
    <footer className="v2-method" id="sobre-los-datos"><p className="v2-kicker">La historia detrás de la historia</p><h2>Sobre los datos.</h2><p>Fuente: <a href="https://cresi.incucai.gov.ar/">CRESI / SINTRA · INCUCAI</a>. Estadísticas públicas agregadas. La versión anterior conserva el explorador completo, sus gráficos y referencias.</p><details><summary>Qué representa cada punto</summary><p>En la espera actual, una inscripción en una lista: {integer(data.total)} al {data.snapshot}. No son personas únicas deduplicadas. Las listas combinadas se mantienen como fueron publicadas; las córneas y escleras son tejidos. La posición de los puntos es una composición gráfica, no una localización geográfica ni un registro individual.</p><p>Antigüedad y provincia son distribuciones marginales publicadas para cada lista. Las reorganizaciones no reconstruyen cruces entre variables ni trayectorias personales. Una categoría sin distribución publicada permanece explícita.</p></details><details><summary>Tiempo, donación y trasplante: universos diferentes</summary><p>La serie 2005–2025 usa el «Total LE» anual publicado. La serie de donantes reales de órganos y de tejidos incluye establecimientos extranjeros cuando están publicados. La fotografía actual, el total anual, los donantes y los trasplantes no comparten una misma población. Las transiciones entre ellos disuelven los puntos; no representan personas que pasan de una etapa a otra.</p><p>El tiempo de espera corresponde a trasplantes renales con tiempo registrado en {latest.year}: n = {integer(latest.n)}, mediana {decimal(latest.median)} meses, percentiles 25 y 75: {decimal(latest.p25)} y {decimal(latest.p75)} meses. No estima el tiempo futuro de quienes esperan hoy.</p><p>Donación: {data.donorPeriod}; {integer(data.organDonors)} donantes fallecidos de órganos, dentro de {integer(data.allDonors)} donantes de órganos y/o tejidos en establecimientos argentinos. Se excluyen establecimientos extranjeros. Trasplantes: {data.transplantPeriod}; {integer(data.organTransplants)} de órganos dentro de {integer(data.allTransplants)} de órganos y tejidos. Incluye donantes vivos y fallecidos, por residencia del receptor. No se calcula una tasa de conversión entre estas cifras.</p></details><details><summary>Las listas, sin simplificar sus categorías</summary><dl>{data.organs.map(group => <div key={group.id}><dt>{group.label}</dt><dd>{integer(group.value)}</dd></div>)}</dl></details><div className="v2-footer-links"><a href={publicPath('/espera-v1/')}>Versión 1 · Exploración completa ↗</a><a href="#escena-0">Volver al principio ↑</a><span>LA ESPERA / V.02</span></div></footer>
  </main>;
}
