'use client';
import {useEffect,useRef} from 'react';
import {flowGroups,selectFlow} from './annual-flow-model';
import {ExitBreakdown} from './annual-flow-view';
import flows from './annual-flows.generated.json';
import type {AnnualTimeSelection} from './annual-time-model';
import type {ComparisonYear} from './annual-comparison-model';
import {MILESTONES} from '../historical-milestones';
import mapSnapshot from './map-demographics.generated.json';
import {decimal,integer,type UniverseData} from './universe-model';

const report=(name:string,enabled=true)=>`https://cresi.incucai.gov.ar/cresi/OpenDocument.do?accion=%2Fcresi_${name}.do%3FCLICK_AND_LIST_HABILITADO%3D${enabled}`;
const base=process.env.NEXT_PUBLIC_BASE_PATH??'';
const timeReports=[
  {module:'Renal',form:'cresi_renal.do',lists:'Renal y renopancreática',url:report('renal'),output:'29',unit:'meses'},
  {module:'Hepático',form:'cresi_hepatico.do',lists:'Hepática, hepatorrenal, hepatopancreática y hepatointestinal',url:report('hepatico'),output:'34',unit:'días'},
  {module:'Intratorácico',form:'cresi_intratoracico.do',lists:'Cardíaca, cardiohepática, cardiopulmonar, cardiorrenal y pulmonar',url:report('intratoracico'),output:'28',unit:'meses'},
  {module:'Córneas',form:'cresi_corneas.do',lists:'Córneas y escleras',url:report('corneas'),output:'28',unit:'meses'},
];

export default function DataMethod({data,record,selection,open,onClose}:{data:UniverseData;record:ComparisonYear;selection:AnnualTimeSelection;open:boolean;onClose:()=>void}){
  const panel=useRef<HTMLDialogElement>(null);
  useEffect(()=>{
    const dialog=panel.current;if(!dialog)return;
    if(!open){if(dialog.open)dialog.close();return;}
    const previousOverflow=document.body.style.overflow;
    dialog.showModal();document.body.style.overflow='hidden';
    return()=>{document.body.style.overflow=previousOverflow;if(dialog.open)dialog.close();};
  },[open]);

  const year=record.year;
  const flow=selectFlow(flows,selection.list,year,selection.province,selection.age);
  const dialysisTotal=data.dialysisPopulation?.count??31431;

  return <dialog ref={panel} id="sobre-los-datos" className="v2-method-dialog" aria-labelledby="v2-method-title" onCancel={onClose} onClose={onClose} onClick={event=>{if(event.target===event.currentTarget)onClose();}}>
    <div className="v2-method-bar"><span>Fuentes y metodología</span><button type="button" onClick={onClose} aria-label="Cerrar Sobre los datos">Cerrar <span aria-hidden="true">×</span></button></div>
    <section className="v2-method">
      <p className="v2-kicker">La historia detrás de la historia</p>
      <h2 id="v2-method-title">Sobre los datos.</h2>
      <p>Esta exploración utiliza estadísticas públicas agregadas de <a href="https://cresi.incucai.gov.ar/">CRESI (Central de Reportes y Estadísticas del SINTRA · INCUCAI)</a>. Se consultaron reportes numéricos oficiales accesibles sin autenticación. No se obtuvieron fichas, identidades ni recorridos individuales.</p>
      <p><strong>«Un punto, una persona en lista de espera»:</strong> la unidad observada es una inscripción en una lista de espera. Para la representación, cada inscripción se trata como un registro único y recibe un punto. Es un supuesto de lectura de los agregados: no contamos con identificadores individuales para verificar esa unicidad ni deduplicar personas entre listas. Por eso, la cifra cuenta inscripciones y no personas únicas identificadas.</p>
      <p>Esta documentación describe exclusivamente la versión actual de la visualización: la fotografía coordinada de lista de espera al {mapSnapshot.date} ({integer(data.total)} inscripciones activas), los diagnósticos principales de esas mismas inscripciones activas, la población en diálisis al cierre de 2025 ({integer(dialysisTotal)} pacientes) y las series anuales completas 2005–2025 de stock, movimientos anuales y tiempos de espera de receptores trasplantados.</p>

      {/* APARTADO 1: QUÉ DATOS UTILIZAMOS */}
      <details open className="v2-method-section">
        <summary><strong>1. Qué datos utilizamos</strong> — Universos y fuentes por escena</summary>
        <h3>Separación de universos y poblaciones</h3>
        <p>Los datos en pantalla provienen de reportes de diseño y universos diferentes que no deben confundirse:</p>
        <ul>
          <li><strong>Stock en lista de espera (situación actual):</strong> Conteo de inscripciones con estado activo capturadas el {mapSnapshot.date} (entre {mapSnapshot.started.slice(11,16)} y {mapSnapshot.ended.slice(11,16)}). Una inscripción corresponde a una persona en una lista específica. Una misma persona puede figurar inscripta en más de una lista (por ejemplo, renal y renopancreática). Por ende, el conjunto de inscripciones no representa personas únicas deduplicadas.</li>
          <li><strong>Inscripciones en un período (altas):</strong> Personas registradas entre fechas determinadas en cualquier situación posterior (continúen inscriptas, hayan recibido un trasplante o hayan sido dadas de baja). Se usan en los ingresos anuales (2005–2025). Los diagnósticos de la escena 02 corresponden, en cambio, a las inscripciones activas de la fotografía actual. Miden ingresos a la lista durante el período, no el remanente en lista al cierre.</li>
          <li><strong>Egresos de lista de espera (bajas permanentes):</strong> Personas dadas de baja permanente de la lista durante un año calendario (2005–2025). Reúnen trasplantes con donante fallecido, trasplantes con donante vivo, fallecimientos en lista y otras causas (mejoría clínica, patologías sobrevinientes, etc.).</li>
          <li><strong>Pacientes en diálisis:</strong> Personas en tratamiento de insuficiencia renal crónica terminal (IRCT) al 31/12/2025 ({integer(dialysisTotal)} pacientes). Es una población clínica independiente de la lista de espera: sólo una fracción se encuentra inscripta.</li>
          <li><strong>Receptores trasplantados y tiempos de espera:</strong> Personas que efectivamente recibieron un trasplante durante el año evaluado (por fecha de desclampeo). Sus estadísticas de tiempo describen a la cohorte que llegó al trasplante, no la espera futura de quienes continúan esperando.</li>
        </ul>

        <h3>Fuentes y períodos de cada escena</h3>
        <div className="v2-method-table" role="region" aria-label="Fuentes y períodos de cada escena" tabIndex={0}>
          <table>
            <caption>Asignación de reportes y variables por escena</caption>
            <thead>
              <tr>
                <th scope="col">Escena y foco</th>
                <th scope="col">Población y corte</th>
                <th scope="col">Reporte oficial CRESI</th>
                <th scope="col">Variable utilizada</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">01 / La cifra (Apertura)</th>
                <td>Stock de inscripciones activas · {mapSnapshot.date} ({mapSnapshot.started.slice(11,16)}–{mapSnapshot.ended.slice(11,16)}).</td>
                <td>Reporte de pacientes inscriptos en lista de espera (<code>cresi_le.do</code>).</td>
                <td>Suma provincial de inscripciones activas ({integer(data.total)} en total; {integer(data.lists.find(list=>list.id==='RENAL')?.total??0)} en Renal).</td>
              </tr>
              <tr>
                <th scope="row">02 / Lista, provincia y antigüedad</th>
                <td>Stock en lista por órgano o tejido, jurisdicción, 2 edades (&lt;18, ≥18), sexo (F, M) y 9 bandas de antigüedad · {mapSnapshot.date}.</td>
                <td>Reporte de pacientes inscriptos en lista de espera (<code>cresi_le.do</code>) · 225 consultas agregadas.</td>
                <td>Salida 2 (Provincia de residencia) y Salida 16 (Antigüedad en lista de espera).</td>
              </tr>
              <tr>
                <th scope="row">02 / ¿Por qué? (Diagnósticos de inscripciones activas)</th>
                <td>Inscripciones activas al {mapSnapshot.date}, sin limitar el año de inscripción; cruzadas por lista, provincia, edad y sexo.</td>
                <td>Reporte de pacientes inscriptos en lista de espera (<code>cresi_le.do</code>) · Las mismas 225 consultas agregadas del mapa.</td>
                <td>Salida 10 (Diagnóstico principal).</td>
              </tr>
              <tr>
                <th scope="row">02 / Contexto renal (Diálisis)</th>
                <td>Población prevalente en diálisis · Al 31/12/2025 ({integer(dialysisTotal)} pacientes). Escenario ilustrativo de 52 semanas × 3 sesiones × 4 h.</td>
                <td>Prevalencia e incidencia en diálisis y lista de espera (<code>cresi_pre.do</code>).</td>
                <td>Salida 2 provincial, columna <code>Total IRCT</code> (pacientes en tratamiento al cierre).</td>
              </tr>
              <tr>
                <th scope="row">03 / Movimientos anuales</th>
                <td>Stock al cierre, altas anuales y bajas permanentes · Años cerrados 2005–2025, todas las edades.</td>
                <td>Prevalencia e incidencia (<code>cresi_pre.do</code>) y Exclusiones de lista (<code>cresi_exclusiones.do</code>).</td>
                <td><code>Total LE</code> (stock cierre), <code>Ing LE</code> / Diagnósticos (ingresos) y Motivos de exclusión permanente (egresos con desglose provincial).</td>
              </tr>
              <tr>
                <th scope="row">03 / Historia de tiempos</th>
                <td>Receptores trasplantados evaluados por fecha de desclampeo · Años cerrados 2005–2025.</td>
                <td>Distribución renal (<code>cresi_renal.do</code>), hepática (<code>cresi_hepatico.do</code>), intratorácica (<code>cresi_intratoracico.do</code>) y córneas (<code>cresi_corneas.do</code>).</td>
                <td>Salida <code>Variables estadísticas del tiempo de espera hasta el trasplante</code>: mediana, P25, P75, n y media.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </details>

      {/* APARTADO 2: CÓMO REPRODUCIRLOS */}
      <details className="v2-method-section">
        <summary><strong>2. Cómo reproducirlos</strong> — Formularios, filtros exactos y ejemplos paso a paso</summary>
        <p>Para repetir una búsqueda en CRESI, navegá por los reportes públicos desde la portada. Cada consulta tiene dos pasos: en el primero se configuran los filtros y períodos; en el segundo se seleccionan las salidas tabulares. Los nombres corresponden a los controles literales de CRESI.</p>

        <section className="v2-method-recipe">
          <h3>Guía por formulario de origen</h3>
          <ol>
            <li><strong>Reporte de lista de espera (<a href={report('le')}>cresi_le.do ↗</a>):</strong>
              <ul>
                <li>En <em>Reporte</em>, elegir <code>COMPLETO - TODAS LAS LISTAS DE ESPERA</code>.</li>
                <li>En <em>Situación en lista de espera</em>: para el mapa y sus diagnósticos actuales usar <code>PACIENTES INSCRIPTOS EN LISTA DE ESPERA</code>. Para ingresos anuales, usar <code>PACIENTES INSCRIPTOS EN CUALQUIER SITUACION</code> y el período de inscripción del año correspondiente.</li>
                <li>Filtros opcionales de cruce: <em>Provincia del paciente</em> (24 provincias), <em>Edad del paciente</em> (<code>PEDIATRICOS (&lt;18)</code> o <code>ADULTOS (&gt;=18)</code>), <em>Sexo del paciente</em> (<code>FEMENINO</code> o <code>MASCULINO</code>), sin restringir <em>Período de evaluación (fecha inscripción)</em> para la fotografía actual. La fecha de inscripción no reconstruye una fotografía histórica de actividad.</li>
                <li>En el segundo paso, seleccionar <code>2. Pacientes agrupados por provincia de residencia</code>, <code>10. Pacientes agrupados por diagnóstico principal</code> y/o <code>16. Pacientes agrupados por antiguedad en lista de espera</code>.</li>
              </ul>
            </li>
            <li><strong>Reporte de prevalencia e incidencia (<a href={report('pre',false)}>cresi_pre.do ↗</a>):</strong>
              <ul>
                <li>En <em>Evaluar</em>, elegir <code>PACIENTES EN LISTA DE ESPERA</code> o <code>PACIENTES EN DIALISIS</code>.</li>
                <li>En <em>Período de evaluación</em>: seleccionar el año cerrado (ejemplo: <code>desde 1-1-2025 hasta 31-12-2025</code>).</li>
                <li>En <em>Lista de espera</em>: elegir una de las 13 listas (ejemplo: <code>RENAL</code>).</li>
                <li>En el segundo paso, elegir <code>2. Pacientes agrupados por provincia de residencia</code>. Leer la columna <code>Total LE</code> (stock cierre), <code>Ing LE</code> (ingresos anuales) o <code>Total IRCT</code> (pacientes en diálisis al cierre).</li>
              </ul>
            </li>
            <li><strong>Reporte de exclusiones de lista de espera (<a href={report('exclusiones')}>cresi_exclusiones.do ↗</a>):</strong>
              <ul>
                <li>En <em>Situación en lista de espera</em>, elegir <code>PACIENTES CON EXCLUSION PERMANENTE</code>.</li>
                <li>En <em>Lista de espera</em>, seleccionar la lista. En <em>Provincia del paciente</em>, fijar la provincia deseada o dejar nacional.</li>
                <li>En <em>Período de evaluación</em>, elegir <code>OTRO AÑO: desde 1-1-AAAA hasta 31-12-AAAA</code> (el formulario titula fecha de exclusión y el resultado imprime fecha de inscripción).</li>
                <li>En el segundo paso, pedir <code>12. Pacientes agrupados por motivo de exclusión</code>. Leer las columnas <code>Tx c/DC</code>, <code>Tx c/DV</code>, <code>Defunciones</code>, <code>Otras</code> y <code>TOTAL</code>.</li>
              </ul>
            </li>
            <li><strong>Reportes de tiempo de espera hasta el trasplante:</strong>
              <ul>
                <li>Formularios por órgano: Renal (<a href={report('renal')}>cresi_renal.do ↗</a>, salida 29 en meses), Hepático (<a href={report('hepatico')}>cresi_hepatico.do ↗</a>, salida 34 en días), Intratorácico (<a href={report('intratoracico')}>cresi_intratoracico.do ↗</a>, salida 28 en meses) y Córneas (<a href={report('corneas')}>cresi_corneas.do ↗</a>, salida 28 en meses).</li>
                <li>En <em>Período de evaluación</em>, elegir <code>FECHA DESCLAMPEO: OTRO AÑO</code> y el año del trasplante.</li>
                <li>Filtros simultáneos: <em>Lista de espera del receptor</em>, <em>Provincia de residencia del receptor</em> y <em>Edad del receptor: ESPECIFICAR desde 0 hasta 17 años</em> o <em>desde 18 hasta 119 años</em>.</li>
                <li>En el segundo paso, pedir <code>Variables estadísticas del tiempo de espera hasta el trasplante</code>. De la fila <code>TOTAL</code> se leen <code>Total</code> (receptores), <code>AVG*</code> (media), <code>MED*</code> (mediana), <code>P(0.25)*</code> (P25) y <code>P(0.75)*</code> (P75).</li>
              </ul>
              <div className="v2-method-table" role="region" aria-label="Reportes de tiempo por lista" tabIndex={0} style={{margin:'14px 0'}}>
                <table>
                  <thead><tr><th scope="col">Distribución</th><th scope="col">Listas consultadas</th><th scope="col">Salida y unidad</th></tr></thead>
                  <tbody>
                    {timeReports.map(r=><tr key={r.module}><th scope="row"><a href={r.url}>{r.module} (<code>{r.form}</code>) ↗</a></th><td>{r.lists}</td><td>Salida {r.output} · {r.unit}</td></tr>)}
                  </tbody>
                </table>
              </div>
            </li>
          </ol>
        </section>

        <h3>Cinco ejemplos reproducibles con trazabilidad exacta</h3>
        <div className="v2-method-table" role="region" aria-label="Cinco ejemplos reproducibles" tabIndex={0}>
          <table>
            <caption>Parámetros literales, campo leído y archivo archivado</caption>
            <thead>
              <tr>
                <th scope="col">Ejemplo</th>
                <th scope="col">Criterios de evaluación (Paso 1)</th>
                <th scope="col">Salida y campo leído (Paso 2)</th>
                <th scope="col">Archivo y trazabilidad</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">1. Fotografía del mapa</th>
                <td><code>cresi_le.do</code> · Reporte COMPLETO · PACIENTES INSCRIPTOS EN LISTA DE ESPERA · Todas las listas · Provincia BUENOS AIRES · Edad ADULTOS (&gt;=18) · Sexo FEMENINO (captura {mapSnapshot.date}).</td>
                <td>Salida 2 (Provincia): Buenos Aires TOTAL = 2.055 (Renal 992, Córneas 774). Salida 16 (Antigüedad): Renal &lt;1m = 34, 1~3m = 64, 3~6m = 86, 6~12m = 132, 1~2a = 191, 2~3a = 167, 3~7a = 239, 7~10a = 54, &gt;10a = 25 (suma = 992).</td>
                <td><code>datos/extraidos/reportes_dinamicos/foto_actual_diagnosticos_20261027/mapa_buenos_aires_18mas_femenino/tabla_02.csv</code> (SHA256: <code>faab69845da3c308...</code>).</td>
              </tr>
              <tr>
                <th scope="row">2. Diagnósticos de inscripciones activas</th>
                <td><code>cresi_le.do</code> · Reporte COMPLETO · PACIENTES INSCRIPTOS EN LISTA DE ESPERA · Todas las listas (columna RN para Renal) · Provincia BUENOS AIRES · Edad ADULTOS (&gt;=18) · Sexo FEMENINO · Sin restricción de fecha de inscripción.</td>
                <td>Salida 10 (Diagnóstico principal), columna RN: TOTAL = 992 inscripciones activas; DESCONOCIDA = 286, GLOMERULONEFRITIS = 174, NEFROANGIOESCLEROSIS = 122 y POLIQUISTOSIS RENAL = 121. El total renal coincide con el mapa para el mismo cruce.</td>
                <td><code>datos/extraidos/reportes_dinamicos/foto_actual_diagnosticos_20261027/mapa_buenos_aires_18mas_femenino/tabla_03.csv</code> (SHA256: <code>68bea226835d5103...</code>).</td>
              </tr>
              <tr>
                <th scope="row">3. Ingresos anuales</th>
                <td><code>cresi_le.do</code> · Reporte COMPLETO · PACIENTES INSCRIPTOS EN CUALQUIER SITUACION · Lista RENAL · Provincia BUENOS AIRES · Período fecha inscripción: desde 1-1-2025 hasta 31-12-2025.</td>
                <td>Salida 10 (Diagnóstico principal): TOTAL = 980 inscripciones; DESCONOCIDA = 267 (27,2%), GLOMERULONEFRITIS = 173 (17,7%), NEFROANGIOESCLEROSIS = 122 (12,4%), OTRA = 105 (10,7%). Columna <code>Ing LE</code> en prevalencia: 981.</td>
                <td><code>datos/extraidos/reportes_dinamicos/ingresos_cruzados_20261023/ingresos_renal_2025_buenos_aires_todas/tabla_03.csv</code> (SHA256: <code>b1f8bbe53361377c...</code>).</td>
              </tr>
              <tr>
                <th scope="row">4. Egresos provinciales</th>
                <td><code>cresi_exclusiones.do</code> · PACIENTES CON EXCLUSION PERMANENTE · Lista RENAL · Provincia BUENOS AIRES · Período fecha inscripción [sic]: desde 1-1-2025 hasta 31-12-2025.</td>
                <td>Salida 12 (Motivo de exclusión): TOTAL = 982 bajas permanentes; Tx c/DC = 606 (61,7%), Tx c/DV = 79 (8,0%), Defunciones = 184 (18,7%), Otras = 113 (11,5%, desglosadas por causas individuales auditadas).</td>
                <td><code>datos/extraidos/reportes_dinamicos/egresos_cruzados_20261023/egresos_renal_2025_buenos_aires_todas/tabla_07.csv</code> (SHA256: <code>d866a2e99e288925...</code>).</td>
              </tr>
              <tr>
                <th scope="row">5. Tiempo hasta trasplante</th>
                <td><code>cresi_renal.do</code> · Período FECHA DESCLAMPEO: OTRO AÑO: desde 1-1-2025 hasta 31-12-2025 · Lista RENAL · Provincia receptor CORDOBA · Edad receptor: ESPECIFICAR desde 18 hasta 119 años.</td>
                <td>Salida 29 (Variables estadísticas), fila TOTAL: Total = 88 receptores; AVG* = 29,91 meses; MED* = 22,72 meses; P(0.25)* = 9,24 meses; P(0.75)* = 45,26 meses.</td>
                <td><code>datos/extraidos/reportes_dinamicos/tiempos_trasplante_fotos_reducidas_faltantes_2005_2025/tiempo_trasplante_renal_renal_2025_cordoba_18_mas/tabla_02.csv</code> (SHA256: <code>5d8205a9f59b92ff...</code>).</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p><strong>Distinción entre reproducibilidad exacta y repetición en línea:</strong> Repetir una consulta dinámica en CRESI hoy devolverá el estado actual del registro, no el del {mapSnapshot.date}. Para auditar y reproducir con exactitud bit a bit las cifras de esta versión, se requiere cotejar los archivos originales preservados en <code>datos/originales/</code> contra el catálogo maestro y sus SHA256.</p>
      </details>

      {/* APARTADO 3: CÓMO PROCESAMOS LOS DATOS */}
      <details className="v2-method-section">
        <summary><strong>3. Cómo procesamos los datos</strong> — Reglas de agregación, estadísticas y advertencias metodológicas</summary>
        
        <h3>Tratamiento de faltantes (s/d frente a cero)</h3>
        <p>La sigla <strong>s/d</strong> indica que CRESI no publicó un resultado para esa combinación demográfica o territorial, o que el cruce no formó parte del alcance. Una respuesta sin resultado nunca se convierte en cero ni se deduce por resta de márgenes. Los ceros explícitos se respetan exclusivamente cuando CRESI publicó <code>0</code> o <code>-</code> dentro de una tabla observada.</p>

        <h3>Diferencia entre consulta nacional y suma provincial</h3>
        <p>En la captura coordinada del {mapSnapshot.date} se auditaron 6.282 comparaciones del mapa. Cuatro controles señalan una misma diferencia en Córneas: el total de la tabla geográfica nacional es 2.191, mientras que diagnósticos, antigüedad, edades, sexos y la suma provincial dan 2.190. La visualización usa consistentemente los cruces provinciales publicados: 9.641 inscripciones activas, de las cuales 5.585 son renales. Cada desglose de diagnósticos suma el mismo total de su selección en el mapa. Los controles nacionales se conservan en las auditorías, sin forzar una conciliación. La captura se realizó entre {mapSnapshot.started.slice(11,16)} y {mapSnapshot.ended.slice(11,16)}; no es una transacción instantánea.</p>

        <h3>Medianas, medias y rango intercuartílico P25–P75</h3>
        <p>La curva histórica prioriza la <strong>mediana publicada acompañada de la banda P25–P75</strong>. Este intervalo contiene el 50% central de los tiempos observados en personas trasplantadas; no es un intervalo de confianza ni una proyección. Cuando una selección carece de mediana publicada, se recurre a la media disponible (representada con trazo discontinuo y sin sombreado). Las medianas y percentiles nunca se promedian ni combinan entre provincias o edades.</p>
        <p>Para la selección activa en el recorrido ({year} · {record.label} · {selection.province??'Argentina'}): la mediana publicada es {record.median!==null?`${decimal(record.median)} ${record.unit} (P25 ${record.p25!==null?decimal(record.p25):'s/d'} – P75 ${record.p75!==null?decimal(record.p75):'s/d'}, con ${integer(record.quantileN??0)} receptores)`:'no disponible (se recurre a la media cuando existe)'}, con una media observada de {record.average!==null?`${decimal(record.average)} ${record.unit} (${integer(record.n)} receptores)`:'s/d'}.</p>
        <p>Los hallazgos sobre antigüedad de quienes siguen en lista suman los intervalos publicados 3–7, 7–10 y más de 10 años para describir «3 años o más». No estiman un corte de 5 años dentro del intervalo 3–7. Diálisis al cierre de 2025 y lista renal al {mapSnapshot.date} son poblaciones y fechas distintas: su cociente no mide qué proporción de pacientes en diálisis está inscripta.</p>

        <h3>Tasas por millón de habitantes (PMH)</h3>
        <p>La tasa provincial se calcula como:</p>
        <p style={{fontFamily:'monospace',background:'#18232111',padding:'10px 14px',borderRadius:'4px'}}>
          PMH = (inscripciones de la selección en la provincia ÷ población provincial) × 1.000.000
        </p>
        <p>La diferencia del comparador resta los valores que se muestran: tasas redondeadas a dos decimales y tiempos a un decimal. La vista de tiempo prioriza la mediana; donde no se publica, identifica la media y omite la banda. Si un territorio tiene mediana y el otro sólo media, no se calcula la diferencia entre estadísticas distintas; puede elegirse la media para ambos.</p>
        <ul>
          <li><strong>Denominadores del mapa:</strong> Proyecciones poblacionales INDEC al 01/07/2026, base Censo 2022, ambos sexos (total nacional: 46.466.688 habitantes), archivadas en la columna Población del reporte de situación actual del Registro Nacional de IRCT (SHA256: <code>f6ef954c8327673d...</code>).</li>
          <li><strong>Denominadores de la comparación anual:</strong> Proyecciones anuales provinciales INDEC 2005–2025 (archivo <code>poblacion_indec_2005_2025_por_provincia.csv</code>).</li>
          <li><strong>Regla de filtrado fundamental:</strong> El denominador es siempre la <strong>población provincial total</strong>, aun cuando el numerador esté filtrado por edad (&lt;18, ≥18) o sexo, ya que CRESI no publica denominadores demográficos cruzados por edad y sexo para cada provincia en esa fuente.</li>
        </ul>

        <h3>Balance anual no conciliado (Ejemplo real Renal 2025)</h3>
        <p>La animación de Movimientos es ilustrativa: parte del cierre del año anterior, suma ingresos y resta egresos. Sin embargo, los reportes públicos de CRESI no constituyen una contabilidad por partida doble ni enlazan individuos:</p>
        <ul>
          <li><strong>Renal Nacional 2025:</strong> La lista publicada al cierre de 2024 tiene 5.110 inscripciones. La columna <code>Ing LE</code> del reporte utilizado registra 2.559 ingresos en 2025; los egresos son 2.388 bajas permanentes (1.524 trasplantes con donante fallecido, 225 con donante vivo, 429 defunciones y 210 por otros motivos). El cálculo ilustrativo da 5.110 + 2.559 − 2.388 = 5.281, frente a 5.195 publicados al cierre de 2025: una diferencia de 86 registros. No se reemplaza la cifra publicada por ese cálculo.</li>
          <li><strong>Buenos Aires Renal 2025:</strong> La lista publicada al cierre de 2024 tiene 2.049 inscripciones; se registran 981 ingresos y 982 egresos en la consulta provincial filtrada de 2025. El cálculo ilustrativo da 2.049 + 981 − 982 = 2.048, frente a 2.081 publicados al cierre: una diferencia de 33 registros. El reporte de diagnósticos por fecha de inscripción cuenta 980 ingresos; se conserva como otra fuente y no se intercambia con <code>Ing LE</code>.</li>
        </ul>
        <p>Esta divergencia se debe a que las fuentes evalúan momentos y criterios dispares (fecha de exclusión frente a fecha de inscripción impresa en el encabezado) y no capturan traslados interprovinciales de residencia. No se fuerza una conciliación artificial.</p>

        {flow?.exits!=null&&<div style={{margin:'20px 0'}}>
          <p><strong>Desglose de motivos de egreso para la selección activa ({year} · {selection.list} · {selection.province??'Argentina'}):</strong></p>
          <ExitBreakdown key={`method-${year}-${selection.list}-${selection.province}-${selection.age}`} groups={flowGroups(flow.causes)} showCodes/>
        </div>}

        <h3>Escenario de diálisis</h3>
        <p>Los 31.431 pacientes en tratamiento al 31/12/2025 se exploran mediante un escenario ilustrativo: 52 semanas × 3 sesiones semanales × 4 horas = 624 horas/año por persona (19.612.944 horas-persona ≈ 22,4 siglos colectivos). Es una referencia de tratamiento de la Red de Diálisis y Nefrología del GCABA, no horas acumuladas individualmente en CRESI ni duración media de la diálisis.</p>

        <h3>Hitos históricos de contexto (2005–2025)</h3>
        <p>Los hitos contextualizan las series temporales sin atribuirles causalidad directa exclusiva:</p>
        {MILESTONES.map(event=><p key={event.id}><strong>{event.year} · {event.title}.</strong> {event.reading} {event.sources.map(source=><a key={source.href} href={source.href}>{source.label} ↗ </a>)}</p>)}
      </details>

      {/* APARTADO 4: DESCARGAS Y TRAZABILIDAD */}
      <details className="v2-method-section">
        <summary><strong>4. Descargas y trazabilidad</strong> — Conjuntos de datos, códigos y fuentes con SHA256</summary>
        <p>Cada archivo publicado cuenta con su huella digital criptográfica SHA256 y referencias al reporte de origen. Los enlaces a continuación permiten descargar y auditar todos los datos utilizados:</p>
        
        <h3>Fotografía actual y mapa ({mapSnapshot.date})</h3>
        <ul className="v2-method-downloads">
          <li><a href={`${base}/datos/mapa-demografia.json`} download>Cruces del mapa por lista, provincia, edad, sexo y antigüedad (mapa-demografia.json) ↗</a></li>
          <li><a href={`${base}/datos/auditoria-mapa-demografia.json`} download>Auditoría completa, controles de sumas y fuentes SHA256 del mapa ↗</a></li>
        </ul>

        <h3>Diagnósticos de inscripciones activas ({mapSnapshot.date})</h3>
        <ul className="v2-method-downloads">
          <li><a href={`${base}/datos/diagnosticos-activos.json`} download>Diagnósticos de inscripciones activas por lista, provincia, edad y sexo ↗</a></li>
          <li><a href={`${base}/datos/auditoria-diagnosticos-activos.json`} download>Auditoría, controles nacionales y SHA256 de diagnósticos activos (225 consultas) ↗</a></li>
        </ul>

        <h3>Movimientos y egresos anuales (2005–2025)</h3>
        <ul className="v2-method-downloads">
          <li><a href={`${base}/datos/conteos-anuales-por-lista.json`} download>Conteos anuales de lista (Total LE) por provincia (2005–2025) ↗</a></li>
          <li><a href={`${base}/datos/flujos-anuales-lista.json`} download>Movimientos anuales e ingresos/egresos nacionales con causas auditadas ↗</a></li>
          <li><a href={`${base}/datos/ingresos-anuales.json`} download>Diagnósticos de ingresos anuales por lista, año y provincia (2005–2025) ↗</a></li>
          <li><a href={`${base}/datos/fuentes-ingresos-anuales.json`} download>Fuentes y SHA256 de diagnósticos de ingresos anuales ↗</a></li>
          <li><a href={`${base}/datos/egresos-provinciales.json`} download>Egresos provinciales anuales desglosados por causa (2005–2025) ↗</a></li>
          <li><a href={`${base}/datos/fuentes-egresos-provinciales.json`} download>Fuentes y SHA256 de egresos provinciales (6.552 consultas) ↗</a></li>
          <li><a href={`${base}/datos/nomenclatura_egresos.v1.json`} download>Contrato oficial de nomenclatura de egresos v1.0.0 ↗</a></li>
        </ul>

        <h3>Tiempos hasta el trasplante e historia</h3>
        <ul className="v2-method-downloads">
          <li><a href={`${base}/datos/tiempos-y-fuentes.json`} download>Celdas conjuntas de tiempo por lista, provincia y edad (2005–2025, 13.104 celdas) ↗</a></li>
          <li><a href={`${base}/datos/percentiles-nacionales-por-lista.json`} download>Percentiles nacionales hepáticos explícitos por lista, con fuentes y SHA256 ↗</a></li>
          <li><a href={`${base}/datos/historia-y-fuentes.json`} download>Serie renal nacional histórica, donantes y fuentes con SHA256 ↗</a></li>
        </ul>

        <h3>Poblaciones de diálisis y demografía</h3>
        <ul className="v2-method-downloads">
          <li><a href={`${base}/datos/poblacion-dialisis-2025.json`} download>Población en diálisis al 31/12/2025, fuente y SHA256 ↗</a></li>
          <li><a href={`${base}/datos/tiempo-dialisis.json`} download>Diálisis previa al trasplante en receptores renales ↗</a></li>
          <li><a href={`${base}/datos/poblacion_indec_2005_2025_por_provincia.csv`} download>Población provincial anual INDEC 2005–2025 para cálculo de PMH ↗</a></li>
        </ul>

        <h3>Documentación técnica y material archivado</h3>
        <ul className="v2-method-downloads">
          <li><a href={`${base}/datos/guia-consultas-cresi.md`} download>Guía técnica de consultas CRESI y criterios de reproducción ↗</a></li>
          <li><a href={`${base}/datos/parcial-2026.json`} download>Material archivado: corte parcial siete meses 2026 (conservado por trazabilidad histórica) ↗</a></li>
        </ul>
      </details>

      <div className="v2-footer-links">
        <a href={`${base}/datos/guia-consultas-cresi.md`} download>Guía de consultas CRESI ↗</a>
        <a href="#escena-0" onClick={onClose}>Volver al principio ↑</a>
        <span>LA ESPERA / V.02</span>
      </div>
    </section>
  </dialog>;
}
