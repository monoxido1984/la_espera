import { groupsFor, readableLabel, type Dimension, type Dot, type Group, type ListDetail, type UniverseData } from './universe-model';

export type ExplorationSelection = { listId: string | null; province: string | null; seniority: string | null; smallLists: boolean };
export const allWaiting: ExplorationSelection = { listId:null, province:null, seniority:null, smallLists:false };
export const OTHER_LISTS = 'OTHER_LISTS', UNAVAILABLE = 'UNAVAILABLE';
const unpublished = (label: string) => label.startsWith('SIN DISTRIBU');
export const smallListIds = (data: UniverseData) => data.organs.filter(g => g.value < 100).map(g => g.id);
const sourcesFor = (data: UniverseData, selection: ExplorationSelection) => data.lists.filter(l => l.id !== 'TOTAL' && (selection.listId ? l.id === selection.listId : !selection.smallLists || smallListIds(data).includes(l.id)));

// A cell is a jointly published aggregate. Graphic keys are slots inside that
// cell, never patient IDs or synthetic microdata. They only preserve motion.
function cellKeys(list: string, province: string, band: string, value: number) {
  return Array.from({length:value},(_,i) => `${list}|${province}|${band}|${i}`);
}
function valueFor(list: ListDetail, province: string | null, band: string | null): number | undefined {
  if (!band) return province ? list.province.find(p => p.label === province)?.value : list.total;
  if (!province) {
    if (list.seniority.some(p => unpublished(p.label))) return undefined;
    return list.seniority.find(p => p.label === band)?.value;
  }
  const row = list.seniorityByProvince?.find(p => p.province === province);
  if (row) return row.items.find(p => p.label === band)?.value;
  // An explicit empty province has no observations in any time band.
  return list.province.find(p => p.label === province)?.value === 0 ? 0 : undefined;
}
function keysFor(list: ListDetail, province: string | null, band: string | null) {
  const keys: string[] = [];
  for (const p of list.province) {
    if (province && province !== p.label) continue;
    const rows = list.seniorityByProvince?.find(row => row.province === p.label)?.items;
    if (rows) {
      for (const row of rows) if (!band || row.label === band) keys.push(...cellKeys(list.id,p.label,row.label,row.value));
    } else if (!band) keys.push(...cellKeys(list.id,p.label,UNAVAILABLE,p.value));
  }
  return keys;
}
function mergedKeys(sources: ListDetail[], province: string | null, band: string | null) {
  return sources.flatMap(list => keysFor(list,province,band));
}
// When TOTAL publishes a time cell but its smaller lists do not publish the
// breakdown, retain the exact residual as unallocated. Never apportion it.
function unresolvedKeys(data: UniverseData, province: string | null, band: string) {
  const total = data.lists.find(l => l.id === 'TOTAL')!;
  const keys: string[] = [];
  for (const p of total.province) {
    if (province && province !== p.label) continue;
    const expected = valueFor(total,p.label,band);
    if (expected === undefined) continue;
    const known = data.lists.filter(l => l.id !== 'TOTAL').reduce((sum,l) => sum+(valueFor(l,p.label,band) ?? 0),0);
    if (known > expected) throw new Error('El cruce supera el total publicado.');
    keys.push(...cellKeys(UNAVAILABLE,p.label,band,expected-known));
  }
  return keys;
}
function resolveKeys(data: UniverseData, selection: ExplorationSelection, province: string | null, band: string | null) {
  const sources = sourcesFor(data,selection);
  const keys = mergedKeys(sources,province,band);
  if (band && !selection.listId) keys.push(...unresolvedKeys(data,province,band));
  return keys;
}

export function explorationGroups(data: UniverseData, dimension: Dimension, selection: ExplorationSelection): { groups: Group[]; unavailable: boolean } {
  const sources = sourcesFor(data,selection);
  const { province, seniority } = selection;
  if (!sources.length) return {groups:[],unavailable:true};
  if (selection.listId && seniority && valueFor(sources[0],province,seniority) === undefined) return {groups:[],unavailable:true};
  if (dimension === 'organ') {
    const groups = data.organs.filter(g => sources.some(l => l.id === g.id)).map(g => {
      const list = sources.find(l => l.id === g.id)!;
      const value = valueFor(list,province,seniority);
      return value === undefined ? null : { ...g, value, sourceKey:g.id, unitKeys:keysFor(list,province,seniority) };
    }).filter((g): g is NonNullable<typeof g> => g !== null);
    if (seniority && !selection.listId) {
      const keys = unresolvedKeys(data,province,seniority);
      if (keys.length) groups.push({id:UNAVAILABLE,label:'Lista sin cruce publicado',value:keys.length,color:'#77796f',sourceKey:UNAVAILABLE,unitKeys:keys});
    }
    if (!selection.smallLists && !selection.listId) {
      const members = smallListIds(data);
      const missingAreSmall = sources.filter(l => l.seniority.some(row => unpublished(row.label))).every(l => members.includes(l.id));
      const small = groups.filter(g => members.includes(g.id) || g.id === UNAVAILABLE && missingAreSmall);
      const main = groups.filter(g => !small.includes(g));
      const keys = small.flatMap(g => g.unitKeys);
      if (keys.length) main.push({id:OTHER_LISTS,label:'Otras listas',value:keys.length,color:'#77796f',sourceKey:OTHER_LISTS,unitKeys:keys});
      return {groups:main.map(g => g.id === OTHER_LISTS ? {...g,kind:'collection',members} : g.id === UNAVAILABLE ? {...g,kind:'unavailable'} : g),unavailable:false};
    }
    return {groups:groups.map(g => g.id === UNAVAILABLE ? {...g,kind:'unavailable'} : g),unavailable:false};
  }
  const total = data.lists.find(l => l.id === 'TOTAL')!;
  const color = data.organs.find(g => g.id === selection.listId)?.color ?? '#b74d38';
  if (dimension === 'seniority') {
    const rows = total.seniority.filter(row => !seniority || row.label === seniority);
    const groups: Group[] = rows.map(row => {
      const keys = resolveKeys(data,selection,province,row.label);
      return {id:`seniority:${row.label}`,sourceKey:row.label,label:readableLabel(row.label),value:keys.length,color,unitKeys:keys};
    });
    if (!seniority && selection.listId) {
      const missing = sources.filter(l => l.seniority.some(row => unpublished(row.label)));
      const keys = mergedKeys(missing,province,null);
      if (keys.length) groups.push({id:UNAVAILABLE,sourceKey:UNAVAILABLE,label:'Antigüedad no publicada',value:keys.length,color:'#77796f',kind:'unavailable',unitKeys:keys});
    }
    return {groups,unavailable:false};
  }
  const labels = groupsFor(data,'territory',null);
  const groups = total.province.filter(row => !province || row.label === province).map(row => {
    const keys = resolveKeys(data,selection,row.label,seniority);
    // Current snapshots use the fixed population denominator; legacy snapshots retain published rates.
    const rateList = !seniority && !selection.smallLists ? sources.length === 1 ? sources[0] : total : selection.listId && !seniority ? sources[0] : undefined;
    const denominator=data.populationByProvince?.[row.label];
    return { id:`territory:${row.label}`,sourceKey:row.label,label:labels.find(g => g.label.toUpperCase() === row.label)?.label ?? labels[total.province.indexOf(row)].label,value:keys.length,color,unitKeys:keys,pmh:denominator&&denominator>0?keys.length/denominator*1_000_000:rateList?.province.find(p => p.label === row.label)?.pmh };
  });
  return {groups,unavailable:false};
}

export function selectExploration(selection: ExplorationSelection, dimension: Dimension, group: Group): { selection: ExplorationSelection; dimension: Dimension } {
  if (group.id === OTHER_LISTS) return {selection:{...selection,smallLists:true},dimension:'organ'};
  if (group.kind === 'unavailable') return {selection,dimension:dimension === 'seniority' ? 'territory' : dimension};
  const field = dimension === 'organ' ? 'listId' : dimension === 'seniority' ? 'seniority' : 'province';
  const value = group.sourceKey ?? group.id;
  const removing = selection[field] === value;
  return {selection:{...selection,[field]:removing ? null : value},dimension:removing ? dimension : dimension === 'organ' ? 'territory' : dimension === 'territory' ? 'seniority' : 'territory'};
}

export function identifyDots(points: Dot[], groups: Group[]): Dot[] {
  const counts = new Map<string,number>(), byId = new Map(groups.map(g => [g.id,g]));
  return points.map(point => {
    const index=counts.get(point.group) ?? 0; counts.set(point.group,index+1);
    return {...point,key:byId.get(point.group)?.unitKeys?.[index]};
  });
}
export function alignGraphicUnits<T extends Dot>(previous: T[], target: Dot[]) {
  if (!target.some(p => p.key) || !previous.some(p => p.key)) {
    const length=Math.max(previous.length,target.length);
    return Array.from({length},(_,i) => ({from:previous[i],to:target[i]}));
  }
  const byKey=new Map(previous.filter(p => p.key).map(p => [p.key!,p]));
  const keys=new Set(target.map(p => p.key));
  return [...target.map(to => ({from:to.key ? byKey.get(to.key) : undefined,to})),...previous.filter(from => !keys.has(from.key)).map(from => ({from,to:undefined}))];
}
