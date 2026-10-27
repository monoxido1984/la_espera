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

const rankingOrdinals: Record<string, string> = {
  CORNEAS: 'segunda',
  HEPATICA: 'tercera',
  PULMONAR: 'cuarta',
  RENOPANCREATICA: 'quinta',
  CARDIACA: 'sexta',
};

export function waitingAnchor({
  data,
  selection,
  dimension = 'organ',
  mapAge = 'all',
  mapSex = 'all',
  provinceNames,
  defaultView,
  missing,
  dialysis = 31431,
  sex = 'all',
  mapSnapshot,
  count,
}: {
  data: UniverseData;
  selection: ExplorationSelection;
  dimension?: 'organ' | 'territory' | 'seniority';
  mapAge?: string;
  mapSex?: string;
  provinceNames?: Map<string, string>;
  defaultView?: boolean;
  missing?: boolean;
  dialysis?: number;
  sex?: string;
  mapSnapshot?: any;
  count?: number;
}) {
  if (missing) return 'Este cruce no tiene resultado publicado. Probá otra combinación para seguir explorando.';

  const nationalTotal = mapSnapshot?.cohorts?.['all|all']?.lists?.find((l: ListDetail) => l.id === 'TOTAL')?.total ?? data.total;
  const effectiveSex = sex !== 'all' ? sex : mapSex;
  const isFiltered = mapAge !== 'all' || effectiveSex !== 'all';
  const cohortKey = `${mapAge}|${effectiveSex}`;
  const cohort = mapSnapshot?.cohorts?.[cohortKey];
  const allAllCohort = mapSnapshot?.cohorts?.['all|all'];

  // Total de personas en el recorte demográfico actual
  const subTotal = cohort?.lists?.find((l: any) => l.id === 'TOTAL')?.total ?? (count ?? nationalTotal);

  // Si se solicita la vista clásica (usada en tests unitarios)
  if (defaultView) {
    const renal = data.lists.find(list => list.id === 'RENAL')?.total ?? 0;
    return 'Riñón reúne ' + number(renal) + ' de las ' + number(data.total) + ' inscripciones activas (' + percent(renal, data.total) + '%). La exploración renal abre otra dimensión de la espera: ' + number(dialysis) + ' personas en diálisis al cierre de 2025, una población y un período distintos.';
  }

  if (selection.province || (dimension === 'seniority' && selection.listId)) {
    const lists = data.lists.filter(l => l.id !== 'TOTAL' && (!selection.listId || l.id === selection.listId));
    const facts = waitingFacts(lists, selection.province);
    const scope = [selection.listId ? organLabel(selection.listId) : 'Todas las listas', selection.province ? provinceNames?.get(selection.province) ?? selection.province : 'Argentina', getDemographicNoun(mapAge, effectiveSex)].join(' · ');
    if (facts.total === null) return 'Este cruce no tiene resultado publicado.';
    if (selection.seniority) {
      const amount = facts.bands.get(selection.seniority) ?? 0;
      return `${scope}: ${number(amount)} inscripciones (${percent(amount, facts.total)}%) llevan ${bandLabel(selection.seniority)} en lista. Este tiempo ya transcurrió; no predice cuánto falta.`;
    }
    return `${scope}: ${number(facts.total)} inscripciones activas.` + (facts.long !== null && facts.total > 0 ? ` ${number(facts.long)} (${percent(facts.long, facts.total)}%) llevan 3 años o más en lista. Este tiempo ya transcurrió; no predice cuánto falta.` : '');
  }

  // 1. VISTA LISTA (organ)
  if (dimension === 'organ') {
    const renalList = data.lists.find(list => list.id === 'RENAL');

    // A. Estado inicial (sin lista seleccionada)
    if (!selection.listId) {
      if (!isFiltered) {
        return `No hay una sola fila: las ${number(nationalTotal)} personas esperan diferentes órganos y tejidos con urgencias y dinámicas propias. La mayor demanda está en la lista Renal con ${number(renalList?.total ?? 0)} personas esperando (${percent(renalList?.total ?? 0, nationalTotal)}%). Elegí una lista para explorar en detalle.`;
      }

      const cohortLists = (cohort?.lists ?? data.lists)
        .filter((l: any) => l.id !== 'TOTAL' && l.total > 0)
        .sort((a: any, b: any) => b.total - a.total);

      const pct_sub = percent(subTotal, nationalTotal);
      const top1 = cohortLists[0];
      const top2 = cohortLists[1];
      const top3 = cohortLists[2];

      const noun = getDemographicNoun(mapAge, effectiveSex);
      let res = `Hay ${number(subTotal)} ${noun} esperando un trasplante en el país (el ${pct_sub}% de las ${number(nationalTotal)} esperas activas).`;
      if (top1) {
        res += ` La mayor demanda se concentra en ${organLabel(top1.id).toLowerCase()} (${number(top1.total)} pacientes, ${percent(top1.total, subTotal)}%)`;
        if (top2) res += `, seguido por ${organLabel(top2.id).toLowerCase()} (${number(top2.total)} pacientes)`;
        if (top3) res += ` y ${organLabel(top3.id).toLowerCase()}`;
        res += '.';
      }
      return res;
    }

    // B. Al hacer clic en una lista puntual
    const listId = selection.listId;
    const listDetail = data.lists.find(l => l.id === listId);
    const nombre_lista = organLabel(listId, listDetail?.label ?? listId);

    // Totales nacionales sin filtro
    const natList = allAllCohort?.lists?.find((l: any) => l.id === listId)?.total ?? listDetail?.total ?? 0;
    const natMasc = mapSnapshot?.cohorts?.['all|MASCULINO']?.lists?.find((l: any) => l.id === listId)?.total ?? 0;
    const natFem = mapSnapshot?.cohorts?.['all|FEMENINO']?.lists?.find((l: any) => l.id === listId)?.total ?? 0;
    const natPed = mapSnapshot?.cohorts?.['menor18|all']?.lists?.find((l: any) => l.id === listId)?.total ?? 0;

    // Totales en el recorte actual
    const cohortList = cohort?.lists?.find((l: any) => l.id === listId)?.total ?? 0;
    const cohortMasc = mapSnapshot?.cohorts?.[`${mapAge}|MASCULINO`]?.lists?.find((l: any) => l.id === listId)?.total ?? 0;
    const cohortFem = mapSnapshot?.cohorts?.[`${mapAge}|FEMENINO`]?.lists?.find((l: any) => l.id === listId)?.total ?? 0;

    // Si es Riñón (Renal)
    if (listId === 'RENAL') {
      if (!isFiltered) {
        const pct_varones = percent(natMasc, natList);
        const pct_mujeres = percent(natFem, natList);
        return `Riñón concentra más de la mitad de toda la espera del país: ${number(natList)} personas (${percent(natList, nationalTotal)}%). El ${pct_varones}% son varones (${number(natMasc)}) y el ${pct_mujeres}% mujeres (${number(natFem)}). Mirar esta lista abre además una dimensión previa: al cierre de 2025 había ${number(dialysis)} personas en diálisis, una población y un período distintos.`;
      }

      if (mapAge === '18mas' && effectiveSex === 'all') {
        const pct_var = percent(cohortMasc, cohortList);
        const pct_adu = percent(cohortList, natList);
        return `De las ${number(natList)} personas en lista de Riñón, ${number(cohortList)} son adultas (${pct_adu}%), entre las cuales el ${pct_var}% son varones (${number(cohortMasc)}) y el ${percent(cohortFem, cohortList)}% mujeres (${number(cohortFem)}). Mirar esta lista abre además una dimensión previa: al cierre de 2025 había ${number(dialysis)} personas en diálisis, una población y un período distintos.`;
      }
      if (mapAge === 'menor18' && effectiveSex === 'all') {
        const pct_ped = percent(cohortList, natList);
        return `De las ${number(natList)} personas en lista de Riñón, ${number(cohortList)} son pacientes pediátricos menores de 18 años (${pct_ped}%), entre quienes el ${percent(cohortMasc, cohortList)}% son varones (${number(cohortMasc)}) y el ${percent(cohortFem, cohortList)}% mujeres (${number(cohortFem)}).`;
      }
      if (effectiveSex === 'FEMENINO' && mapAge === 'all') {
        const aduFem = mapSnapshot?.cohorts?.['18mas|FEMENINO']?.lists?.find((l: any) => l.id === 'RENAL')?.total ?? 0;
        const pedFem = mapSnapshot?.cohorts?.['menor18|FEMENINO']?.lists?.find((l: any) => l.id === 'RENAL')?.total ?? 0;
        return `De las ${number(natList)} personas en lista de Riñón, ${number(cohortList)} son mujeres (${percent(cohortList, natList)}%), de las cuales ${number(aduFem)} son adultas (${percent(aduFem, cohortList)}%) y ${number(pedFem)} pediátricas (${percent(pedFem, cohortList)}%). Mirar esta lista abre además una dimensión previa: a fines de 2025 había 31.431 personas en diálisis en el país.`;
      }
      if (effectiveSex === 'MASCULINO' && mapAge === 'all') {
        const aduMasc = mapSnapshot?.cohorts?.['18mas|MASCULINO']?.lists?.find((l: any) => l.id === 'RENAL')?.total ?? 0;
        const pedMasc = mapSnapshot?.cohorts?.['menor18|MASCULINO']?.lists?.find((l: any) => l.id === 'RENAL')?.total ?? 0;
        return `De las ${number(natList)} personas en lista de Riñón, ${number(cohortList)} son varones (${percent(cohortList, natList)}%), de los cuales ${number(aduMasc)} son adultos (${percent(aduMasc, cohortList)}%) y ${number(pedMasc)} pediátricos (${percent(pedMasc, cohortList)}%). Mirar esta lista abre además una dimensión previa: a fines de 2025 había 31.431 personas en diálisis en el país.`;
      }

      const noun = getDemographicNoun(mapAge, effectiveSex);
      return `De las ${number(natList)} personas en lista de Riñón, ${number(cohortList)} son ${noun} (${percent(cohortList, natList)}% de la lista renal). Mirar esta lista abre además una dimensión previa: a fines de 2025 había 31.431 personas en diálisis en el país.`;
    }

    // Para el resto de las listas
    const pct_total = percent(natList, nationalTotal);

    // Si hay un filtro demográfico activo
    if (isFiltered) {
      const noun = getDemographicNoun(mapAge, effectiveSex);
      const pct_recorte = percent(cohortList, natList);

      if (mapAge !== 'all' && effectiveSex === 'all') {
        const subMascPct = percent(cohortMasc, cohortList);
        const subFemPct = percent(cohortFem, cohortList);
        return `De las ${number(natList)} personas en lista de ${nombre_lista}, ${number(cohortList)} son ${noun} (${pct_recorte}%), entre las cuales el ${subMascPct}% son varones (${number(cohortMasc)}) y el ${subFemPct}% mujeres (${number(cohortFem)}).`;
      }
      if (effectiveSex !== 'all' && mapAge === 'all') {
        const pedInSex = mapSnapshot?.cohorts?.[`menor18|${effectiveSex}`]?.lists?.find((l: any) => l.id === listId)?.total ?? 0;
        const pedPct = percent(pedInSex, cohortList);
        return `De las ${number(natList)} personas en lista de ${nombre_lista}, ${number(cohortList)} son ${noun} (${pct_recorte}%), con un ${pedPct}% de pacientes menores de 18 años (${number(pedInSex)}).`;
      }
      return `En la lista de ${nombre_lista}, ${number(cohortList)} personas corresponden a ${noun} (${pct_recorte}% del total de esta lista).`;
    }

    // Sin filtro demográfico:
    // Córneas o Hígado (2ª y 3ª)
    if (listId === 'CORNEAS' || listId === 'HEPATICA') {
      const ordinal = rankingOrdinals[listId] ?? 'segunda';
      const mayorMasc = natMasc >= natFem;
      const pctMayor = percent(mayorMasc ? natMasc : natFem, natList);
      const sexoMayor = mayorMasc ? 'varones' : 'mujeres';
      const pctPed = percent(natPed, natList);
      let text = `${nombre_lista} es la ${ordinal} lista con mayor demanda del país tras la renal, con ${number(natList)} personas esperando (${pct_total}% del total). Presenta una distribución de ${pctMayor}% de ${sexoMayor} y un ${pctPed}% de pacientes menores de 18 años (${number(natPed)}).`;
      if (listId === 'CORNEAS') {
        text += ' Es la principal lista de tejidos del país y la segunda en volumen total.';
      } else {
        text += ' A diferencia de la espera renal, no cuenta con un tratamiento sustitutivo crónico equivalente a la diálisis, lo que imprime otra urgencia clínica a los tiempos de espera.';
      }
      return text;
    }

    // Sesgo por sexo > 60%
    const ratioMasc = natMasc / (natList || 1);
    const ratioFem = natFem / (natList || 1);
    if (ratioMasc >= 0.60 || ratioFem >= 0.60) {
      const mayorMasc = ratioMasc >= ratioFem;
      const pctMayor = percent(mayorMasc ? natMasc : natFem, natList);
      const sexoMayor = mayorMasc ? 'varones' : 'mujeres';
      const nMayor = mayorMasc ? natMasc : natFem;
      const mayoria = mayorMasc ? 'masculina' : 'femenina';
      let text = `En la lista de ${nombre_lista} (${number(natList)} personas, ${pct_total}% del total) se observa una marcada mayoría ${mayoria}: el ${pctMayor}% son ${sexoMayor} (${number(nMayor)} de ${number(natList)}).`;
      if (['CARDIACA', 'PULMONAR'].includes(listId)) {
        text += ' A diferencia de la espera renal, no cuenta con un tratamiento sustitutivo crónico equivalente a la diálisis, lo que imprime otra urgencia clínica a los tiempos de espera.';
      }
      return text;
    }

    // Listas multiorgánicas
    if (['RENOPANCREATICA', 'HEPATORRENAL', 'CARDIOPULMONAR', 'CARDIORRENAL', 'CARDIOHEPATICA', 'HEPATOINTESTINAL', 'HEPATOPANCREATICA', 'PANCREOINTESTINAL'].includes(listId)) {
      return `La lista de ${nombre_lista} reúne ${number(natList)} personas en espera. Corresponde a pacientes que requieren el trasplante simultáneo de más de un órgano o tejido en un mismo acto quirúrgico.`;
    }

    return `La lista de ${nombre_lista} reúne ${number(natList)} de las ${number(nationalTotal)} personas en espera (${pct_total}%), con un ${percent(natMasc, natList)}% de varones y ${percent(natPed, natList)}% de pacientes pediátricos.`;
  }

  // 2. VISTA PROVINCIA (territory)
  if (dimension === 'territory') {
    if (!selection.province) {
      if (!isFiltered) {
        return `El mapa de la espera refleja dónde vive la población, pero también las capacidades locales de detección, derivación e inscripción en lista. Buenos Aires, Córdoba, Santa Fe y CABA concentran el mayor volumen absoluto de personas esperando, aunque el peso cambia al mirar las tasas en relación con la población de cada provincia. Elegí una jurisdicción para ver su perfil.`;
      }
      const noun = getDemographicNoun(mapAge, effectiveSex);
      const provTotalList = cohort?.lists?.find((l: any) => l.id === 'TOTAL');
      const sortedProvs = [...(provTotalList?.province ?? [])].sort((a: any, b: any) => b.value - a.value);
      const topProv = sortedProvs[0];
      const topProvName = topProv ? (provinceNames?.get(topProv.label) ?? topProv.label) : 'Buenos Aires';
      const topProvVal = topProv ? number(topProv.value) : '0';
      const topProvPct = topProv ? percent(topProv.value, subTotal) : '0,0';
      return `Entre las ${number(subTotal)} ${noun} en espera, la mayor concentración territorial se encuentra en ${topProvName} (${topProvVal} casos, ${topProvPct}%), seguido por Córdoba y Santa Fe. Elegí una jurisdicción para ver su perfil.`;
    }

    const provName = provinceNames?.get(selection.province) ?? selection.province;
    const provLists = data.lists.filter(l => l.id !== 'TOTAL').map(l => ({
      id: l.id,
      label: l.label,
      val: l.province.find(p => p.label === selection.province)?.value ?? 0
    })).sort((a, b) => b.val - a.val);

    const n_provincia = provLists.reduce((sum, item) => sum + item.val, 0);
    const pct_nacional = percent(n_provincia, subTotal);
    const topList = provLists[0] ?? { id: 'RENAL', label: 'RENAL', val: 0 };
    const lista_principal_prov = organLabel(topList.id, topList.label);
    const n_lista_principal = topList.val;
    const pct_lista_principal = n_provincia > 0 ? percent(n_lista_principal, n_provincia) : '0,0';

    return `${provName} registra ${number(n_provincia)} personas en espera (${pct_nacional}% del recorte seleccionado). En esta jurisdicción, la mayor demanda se concentra en ${lista_principal_prov} (${number(n_lista_principal)} personas, el ${pct_lista_principal}% de la provincia).`;
  }

  // 3. VISTA ANTIGÜEDAD (seniority)
  if (dimension === 'seniority') {
    if (!selection.seniority) {
      const noun = getDemographicNoun(mapAge, effectiveSex);
      const seniorityList = cohort?.lists?.find((l: any) => l.id === 'TOTAL')?.seniority ?? [];
      const lessThan1Year = new Set(['<1mes', '1~3meses', '3~6meses', '6~12meses']);
      const moreThan3Years = new Set(['3~7años', '7~10años', '>10años']);
      const n_menos_1 = seniorityList.filter((r: any) => lessThan1Year.has(r.label)).reduce((s: number, r: any) => s + r.value, 0);
      const n_mas_3 = seniorityList.filter((r: any) => moreThan3Years.has(r.label)).reduce((s: number, r: any) => s + r.value, 0);
      return `De las ${number(subTotal)} ${noun} en lista de espera, ${number(n_menos_1)} (${percent(n_menos_1, subTotal)}%) llevan menos de 1 año inscriptas, mientras que ${number(n_mas_3)} (${percent(n_mas_3, subTotal)}%) superan los 3 años de espera. Tocá un tramo de antigüedad para desglosarlo.`;
    }

    const etiqueta_banda = bandLabel(selection.seniority);
    const bandLists = data.lists.filter(l => l.id !== 'TOTAL').map(l => ({
      id: l.id,
      label: l.label,
      val: l.seniority?.find(s => s.label === selection.seniority)?.value ?? 0
    })).sort((a, b) => b.val - a.val);

    const n_banda = bandLists.reduce((sum, item) => sum + item.val, 0);
    const pct_banda = percent(n_banda, subTotal);
    const topList = bandLists[0] ?? { id: 'RENAL', label: 'RENAL', val: 0 };
    const lista_dominante = organLabel(topList.id, topList.label);
    const pct_dominante = n_banda > 0 ? percent(topList.val, n_banda) : '0,0';

    return `Hay ${number(n_banda)} personas (${pct_banda}% del grupo seleccionado) que llevan ${etiqueta_banda} esperando un trasplante. Dentro de este tramo de antigüedad, el ${pct_dominante}% corresponde a la lista ${lista_dominante}.`;
  }

  return `Exploración de la espera activa (${number(nationalTotal)} inscripciones).`;
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
