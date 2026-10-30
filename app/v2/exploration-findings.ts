import type {ListDetail,UniverseData} from './universe-model';
import type {ExplorationSelection} from './linked-exploration';

export function isGenericDiagnosis(label: string): boolean {
  const norm = label.trim().toUpperCase();
  return (
    norm === 'DESCONOCIDA' ||
    norm === 'DESCONOCIDO' ||
    norm === 'OTRA' ||
    norm === 'OTRO' ||
    norm === 'OTRAS' ||
    norm === 'OTROS' ||
    norm === 'SIN DATOS' ||
    norm === 'NO ESPECIFICADO' ||
    norm === 'NO ESPECIFICADA' ||
    norm === 'SIN ESPECIFICAR' ||
    norm === 'OTRAS CAUSAS' ||
    norm === 'OTRO DIAGNOSTICO' ||
    norm === 'OTROS DIAGNOSTICOS' ||
    norm.endsWith(' (OTRA)') ||
    norm.endsWith(' (OTRO)') ||
    norm.endsWith(' OTRA') ||
    norm.endsWith(' OTRO')
  );
}

export function toSentenceCase(str: string): string {
  if (!str) return str;
  const lower = str.toLowerCase();
  const res = lower.charAt(0).toUpperCase() + lower.slice(1);
  return res.replace(/\b(i|ii|iii|iv)\b/gi, m => m.toUpperCase());
}

const organNames: Record<string, string> = {
  RENAL: 'Riñón', HEPATICA: 'Hígado', CARDIACA: 'Corazón', PULMONAR: 'Pulmón',
  RENOPANCREATICA: 'Riñón y páncreas', HEPATORRENAL: 'Hígado y riñón', HEPATORENAL: 'Hígado y riñón',
  CARDIORRENAL: 'Corazón y riñón', CARDIORENAL: 'Corazón y riñón', CARDIOPULMONAR: 'Corazón y pulmón',
  CARDIOHEPATICA: 'Corazón e hígado', HEPATOPANCREATICA: 'Hígado y páncreas',
  HEPATOINTESTINAL: 'Hígado e intestino', PANCREATICA: 'Páncreas', INTESTINAL: 'Intestino',
  PANCREOINTESTINAL: 'Páncreas e intestino', CORNEAS: 'Córneas', ESCLERAS: 'Escleras',
};
export const organLabel = (id: string, fallback?: string) => organNames[id] ?? fallback ?? id;

const number = (n: number) => n.toLocaleString('es-AR');
const percent = (value: number, total: number) =>
  total > 0
    ? (value / total * 100).toLocaleString('es-AR', {minimumFractionDigits: 1, maximumFractionDigits: 1})
    : '0,0';

const longBands = new Set(['3~7años', '7~10años', '>10años']);
export const bandLabel = (label: string) =>
  label
    .replace('~', ' a ')
    .replace('años', ' años')
    .replace('meses', ' meses')
    .replace('<1mes', 'menos de 1 mes')
    .replace('>10', 'más de 10');

export function waitingFacts(lists: ListDetail[], province: string | null) {
  let total = 0, complete = lists.length > 0;
  const bands = new Map<string, number>();
  for (const list of lists) {
    const amount = province ? list.province.find(row => row.label === province)?.value : list.total;
    if (amount === undefined) return {total: null, long: null, bands};
    total += amount;
    const rows = province ? list.seniorityByProvince?.find(row => row.province === province)?.items : list.seniority;
    if (!rows) { if (amount > 0) complete = false; continue; }
    if (rows.some(row => row.label.startsWith('SIN DISTRIB')) || rows.reduce((sum, row) => sum + row.value, 0) !== amount) complete = false;
    for (const row of rows) bands.set(row.label, (bands.get(row.label) ?? 0) + row.value);
  }
  return {total, long: complete ? [...bands].reduce((sum, [label, value]) => sum + (longBands.has(label) ? value : 0), 0) : null, bands};
}

function getDemographicNoun(age: string, sex: string): string {
  if (age === 'menor18' && sex === 'all') return 'niñas, niños y adolescentes';
  if (age === 'menor18' && sex === 'FEMENINO') return 'niñas y adolescentes mujeres';
  if (age === 'menor18' && sex === 'MASCULINO') return 'niños y adolescentes varones';
  if (age === '18mas' && sex === 'all') return 'personas adultas';
  if (age === '18mas' && sex === 'FEMENINO') return 'mujeres adultas';
  if (age === '18mas' && sex === 'MASCULINO') return 'varones adultos';
  if (age === 'all' && sex === 'FEMENINO') return 'mujeres';
  if (age === 'all' && sex === 'MASCULINO') return 'varones';
  return 'personas';
}

const listAdjectives: Record<string,string> = {
  RENAL:'renal', HEPATICA:'hepática', CARDIACA:'cardíaca', PULMONAR:'pulmonar', RENOPANCREATICA:'renopancreática',
  HEPATORRENAL:'hepatorrenal', HEPATORENAL:'hepatorrenal', CARDIORRENAL:'cardiorrenal', CARDIORENAL:'cardiorrenal',
  CARDIOPULMONAR:'cardiopulmonar', PANCREATICA:'pancreática', INTESTINAL:'intestinal', CORNEAS:'de córneas', ESCLERAS:'de escleras',
};
const listAdjective=(id:string)=>listAdjectives[id]??`de ${organLabel(id).toLowerCase()}`;

export function waitingAnchor({data,selection,dimension='organ',mapAge='all',mapSex='all',provinceNames,defaultView,missing,dialysis=31431,sex='all',mapSnapshot:_mapSnapshot}: {
  data: UniverseData; selection: ExplorationSelection;
  dimension?: 'organ'|'territory'|'seniority'; mapAge?: string; mapSex?: string;
  provinceNames?: Map<string,string>; defaultView?: boolean; missing?: boolean;
  dialysis?: number; sex?: string; mapSnapshot?: {cohorts:Record<string,{lists:ListDetail[]}>}; count?: number;
}) {
  if(missing)return 'Este cruce no tiene resultado publicado. Probá otra combinación para seguir explorando.';
  if(defaultView){
    const renal=data.lists.find(list=>list.id==='RENAL')?.total??0;
    return `Riñón reúne ${number(renal)} de las ${number(data.total)} inscripciones activas (${percent(renal,data.total)}%). La exploración renal abre otra dimensión de la espera: ${number(dialysis)} personas en diálisis al cierre de 2025, una población y un período distintos.`;
  }
  const selectedSex=sex!=='all'?sex:mapSex;
  const lists=data.lists.filter(list=>list.id!=='TOTAL'&&(selection.listId?list.id===selection.listId:!selection.smallLists||list.total<100));
  const facts=waitingFacts(lists,selection.province);
  if(facts.total===null)return 'Este cruce no tiene resultado publicado.';
  const location=selection.province?provinceNames?.get(selection.province)??selection.province:'Argentina';
  const scope=[selection.listId?organLabel(selection.listId):selection.smallLists?'Listas menores':'Todas las listas',location,getDemographicNoun(mapAge,selectedSex)].join(' · ');
  if(dimension==='seniority')return `Así se distribuyen los tiempos de espera ${selection.province?'en '+location:'en el país'}. Elegí una franja o una barra para ver cómo se distribuyen por provincia quienes llevan ese tiempo esperando.`;
  if(dimension==='territory'&&!selection.province){
    const territories=(data.lists.find(l=>l.id==='TOTAL')?.province??[]).map(row=>{
      const own=waitingFacts(lists,row.label),value=selection.seniority?own.bands.get(selection.seniority)??0:own.total??0;
      const denominator=data.populationByProvince?.[row.label];
      return {label:provinceNames?.get(row.label)??row.label,value,pmh:denominator?value/denominator*1_000_000:undefined};
    });
    const most=territories.filter(g=>g.value>0).sort((a,b)=>b.value-a.value)[0];
    const rate=territories.filter(g=>g.pmh!==undefined&&g.value>0).sort((a,b)=>b.pmh!-a.pmh!)[0];
    const intro=selection.seniority?`Así se distribuyen por provincia de residencia quienes llevan ${bandLabel(selection.seniority)} esperando.`:'Explorá cómo varían los tiempos según la provincia de residencia.';
    return intro+(most?` ${most.label} reúne la mayor cantidad: ${number(most.value)} ${getDemographicNoun(mapAge,selectedSex)} esperando.`:'')+(rate?` ${rate.label} tiene la mayor proporción en relación con su población (${percent(rate.pmh!,100)} por millón de habitantes).`:'');
  }
  if(selection.seniority){
    const amount=facts.bands.get(selection.seniority);
    if(amount===undefined)return 'No hay una distribución publicada para este tramo y selección.';
    return `${scope}: ${number(amount)} inscripciones (${percent(amount,facts.total)}%) llevan ${bandLabel(selection.seniority)} en lista. Es tiempo transcurrido, no una predicción de cuánto falta.`;
  }
  if(!facts.total)return `${scope}: no hay inscripciones publicadas para esta selección.`;
  const time=facts.long===null?'La distribución de tiempos no está completa.':`${number(facts.long)} (${percent(facts.long,facts.total)}%) llevan 3 años o más en lista.`;
  if(dimension==='organ'&&!selection.smallLists){
    const noun=getDemographicNoun(mapAge,selectedSex);
    const where=selection.province?` en ${location}`:'';
    const listSentence=(list:ListDetail)=>{
      const own=waitingFacts([list],selection.province);
      const base=`La lista de espera ${listAdjective(list.id)}${where} reúne ${number(own.total??0)} ${noun}`;
      return own.long===null?`${base}; la distribución de tiempos no está completa.`:`${base}, de las cuales ${number(own.long)} llevan al menos 3 años esperando.`;
    };
    if(!selection.listId&&(mapAge!=='all'||selectedSex!=='all')){
      const totalList=data.lists.find(list=>list.id==='TOTAL');
      const filtered=totalList?waitingFacts([totalList],selection.province):facts;
      const ending=filtered.long===null?'La distribución de tiempos no está completa.':`De ese total, ${number(filtered.long)} ${filtered.long===1?'lleva':'llevan'} esperando al menos 3 años.`;
      return `Hay ${number(filtered.total??0)} ${noun} esperando un trasplante${where}. ${ending}`;
    }
    if(!selection.listId){
      const active=lists.filter(list=>(waitingFacts([list],selection.province).total??0)>0);
      const renalList=lists.find(list=>list.id==='RENAL');
      return `Hay ${number(active.length)} listas de espera${where}. ${renalList?listSentence(renalList)+' ':''}Elegí una lista para explorar sus tiempos.`;
    }
    const chosen=lists.find(list=>list.id===selection.listId);
    if(chosen)return `${listSentence(chosen)} Seguí por una provincia para comparar cuánto llevan esperando.`;
  }
  return `${scope}: ${number(facts.total)} inscripciones activas. ${time} `+(dimension==='territory'&&!selection.province?'Elegí una provincia para ver sus tiempos.':dimension==='organ'?'Seguí por una provincia para comparar cuánto llevan esperando.':'Este tiempo ya transcurrió; no predice cuánto falta.');
}

export function diagnosisAnchor(
  entry: {total: number | null; diagnoses: {code?: string; label: string; value: number}[]} | undefined,
  hasList: boolean,
  _seniority: string | null,
  selectedDiagnosis?: {code?: string; label: string; value: number} | null,
  list?: string | null,
  mapAge = 'all',
  mapSex = 'all',
  province?: string | null,
  provinceNames?: Map<string, string>
) {
  let contexto = list ? `la lista de ${organLabel(list)}` : 'las principales listas de órganos y tejidos';
  if (province) {
    const prov = provinceNames?.get(province) ?? province;
    contexto += ` en ${prov}`;
  }
  const noun = getDemographicNoun(mapAge, mapSex);
  if (noun !== 'personas') {
    contexto += ` (${noun})`;
  }

  if (selectedDiagnosis) {
    const total = entry?.total ?? 0;
    const pct_diag = total > 0 ? percent(selectedDiagnosis.value, total) : '0,0';
    return `El diagnóstico «${toSentenceCase(selectedDiagnosis.label)}» figura en ${number(selectedDiagnosis.value)} inscripciones activas (${pct_diag}% de ${contexto}).`;
  }

  if (!entry && !hasList) {
    return 'Detrás de cada inscripción hay una historia clínica. Elegí una lista para explorar los diagnósticos de quienes siguen esperando.';
  }

  if (entry?.total == null) {
    return 'No hay diagnósticos publicados para esta combinación de lista, provincia, edad y sexo.';
  }
  if (entry.total === 0) {
    return 'Este cruce no registra diagnósticos de inscripción.';
  }

  const allDiagnoses = entry.diagnoses ?? [];
  const specific = allDiagnoses
    .filter(d => !isGenericDiagnosis(d.label))
    .sort((a, b) => b.value - a.value || (a.code ?? '').localeCompare(b.code ?? ''));

  const generic = allDiagnoses.filter(d => isGenericDiagnosis(d.label));
  const genericTotal = generic.reduce((sum, d) => sum + d.value, 0);
  const total = entry.total;
  const pct_desconocido_otros = percent(genericTotal, total);

  if (!specific.length) {
    return `Todas las inscripciones de este cruce (${number(genericTotal)}) figuran bajo categorías genéricas o sin diagnóstico especificado al momento de la inscripción.`;
  }

  const d1 = specific[0];
  const n_1 = number(d1.value);
  const pct_1 = percent(d1.value, total);
  const diag_1 = toSentenceCase(d1.label);

  let text = '';
  if (specific.length > 1) {
    const d2 = specific[1];
    const n_2 = number(d2.value);
    const pct_2 = percent(d2.value, total);
    const diag_2 = toSentenceCase(d2.label);
    text = `Entre los diagnósticos especificados para ${contexto}, la causa principal es ${diag_1} con ${n_1} inscripciones activas (${pct_1}%), seguida por ${diag_2} (${n_2} casos, ${pct_2}%).`;
  } else {
    text = `Entre los diagnósticos especificados para ${contexto}, la causa principal es ${diag_1} con ${n_1} inscripciones activas (${pct_1}%).`;
  }

  if (genericTotal > 0) {
    text += ` (Un ${pct_desconocido_otros}% adicional figura en los registros oficiales bajo categorías genéricas o sin diagnóstico especificado al momento de la inscripción).`;
  }

  return text;
}
