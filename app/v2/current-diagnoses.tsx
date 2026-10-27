'use client';
import {useState} from 'react';
import diagnoses from './current-diagnoses.generated.json' with {type:'json'};
import {decimal,integer} from './universe-model';
import type {MapAge,MapSex} from './map-demographics-model';

export type Diagnosis = {code: string; label: string; value: number};
export type Entry = {total: number | null; diagnoses: Diagnosis[]; state?: string};
const colors = ['#b74d38', '#c77c53', '#a8664d', '#d09a6d', '#a87964'];

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

export function currentDiagnosisFor(list: string | null, province: string | null, age: MapAge, sex: MapSex): Entry | undefined {
  if (!list) return undefined;
  return (diagnoses.rows as Record<string, Entry>)[`${list}|${province ?? 'ARGENTINA'}|${age}|${sex}`];
}

export default function CurrentDiagnoses({
  list,
  province,
  age,
  sex,
  seniority,
  onChooseList,
  selectedDiagnosisId,
  onSelectDiagnosis,
}: {
  list: string | null;
  province: string | null;
  age: MapAge;
  sex: MapSex;
  seniority: string | null;
  onChooseList: () => void;
  selectedDiagnosisId?: string | null;
  onSelectDiagnosis?: (diag: Diagnosis | null) => void;
}) {
  const [internalSelected, setInternalSelected] = useState<string | null>(null);
  const selected = selectedDiagnosisId !== undefined ? selectedDiagnosisId : internalSelected;

  const entry = currentDiagnosisFor(list, province, age, sex);
  const allDiagnoses = entry?.diagnoses ?? [];

  const specific = allDiagnoses
    .filter(d => !isGenericDiagnosis(d.label))
    .sort((a, b) => b.value - a.value || a.code.localeCompare(b.code));

  const generic = allDiagnoses.filter(d => isGenericDiagnosis(d.label));
  const genericTotal = generic.reduce((sum, d) => sum + d.value, 0);

  const firstSpecific = specific.slice(0, 4);
  const restSpecific = specific.slice(4);
  const restSpecificTotal = restSpecific.reduce((sum, d) => sum + d.value, 0);
  const otherTotal = genericTotal + restSpecificTotal;

  const bars = [
    ...firstSpecific.map(d => ({
      id: d.code,
      label: toSentenceCase(d.label),
      value: d.value,
      isOther: false,
    })),
    ...(otherTotal > 0
      ? [{
          id: 'other',
          label: 'Otros diagnósticos o sin especificar',
          value: otherTotal,
          isOther: true,
        }]
      : []),
  ];
  const maximum = Math.max(1, ...bars.map(d => d.value));

  const toggleDiagnosis = (item: {id: string; label: string; value: number}) => {
    const isSame = selected === item.id;
    const nextId = isSame ? null : item.id;
    setInternalSelected(nextId);
    if (onSelectDiagnosis) {
      onSelectDiagnosis(isSame ? null : {code: item.id, label: item.label, value: item.value});
    }
  };

  return <div className="v2-current-diagnoses">
    {!list ? (
      <div className="v2-current-intro">
        <p>Elegí una lista para explorar sus diagnósticos de quienes siguen esperando.</p>
        <button type="button" className="v2-current-select" onClick={onChooseList}>Elegir una lista ↗</button>
      </div>
    ) : !entry ? (
      <p>Este cruce no está disponible.</p>
    ) : entry.total === null ? (
      <p>CRESI no publicó resultado para esta selección. No se interpreta como cero.</p>
    ) : (
      <>
        <div className="v2-current-bars">
          {bars.map((bar, index) => {
            const percent = entry.total ? bar.value / entry.total * 100 : 0;
            return (
              <button
                type="button"
                key={bar.id}
                aria-pressed={selected === bar.id}
                onClick={() => toggleDiagnosis(bar)}
              >
                <span className="v2-current-bar-label">
                  <span>{bar.label}</span>
                  <strong>{integer(bar.value)} · {decimal(percent)}%</strong>
                </span>
                <i className="v2-current-dot-track" aria-hidden="true">
                  <i style={{width: `${bar.value / maximum * 100}%`, color: colors[index % colors.length]}} />
                </i>
              </button>
            );
          })}
        </div>
        {(restSpecific.length > 0 || generic.length > 0) && (
          <details className="v2-current-details">
            <summary>Desplegar otros diagnósticos y sin especificar</summary>
            <div>
              {restSpecific.map(d => (
                <button
                  type="button"
                  key={d.code}
                  aria-pressed={selected === d.code}
                  onClick={() => toggleDiagnosis({id: d.code, label: toSentenceCase(d.label), value: d.value})}
                >
                  <span>{toSentenceCase(d.label)}</span>
                  <strong>{integer(d.value)} · {decimal(entry.total ? d.value / entry.total * 100 : 0)}%</strong>
                </button>
              ))}
              {generic.map(d => (
                <button
                  type="button"
                  key={d.code}
                  aria-pressed={selected === d.code}
                  onClick={() => toggleDiagnosis({id: d.code, label: toSentenceCase(d.label), value: d.value})}
                  style={{opacity: 0.75}}
                >
                  <span>{toSentenceCase(d.label)} (sin especificar)</span>
                  <strong>{integer(d.value)} · {decimal(entry.total ? d.value / entry.total * 100 : 0)}%</strong>
                </button>
              ))}
            </div>
          </details>
        )}
        {seniority && <p className="v2-current-unavailable">El reporte de diagnósticos no incluye el cruce por antigüedad elegido.</p>}
      </>
    )}
  </div>;
}
