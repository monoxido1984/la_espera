import {createHash} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';

const source=new URL('../public/datos/poblacion_indec_2005_2025_por_provincia.csv',import.meta.url);
const destination=new URL('../app/v2/annual-population.generated.json',import.meta.url);
const counts=JSON.parse(readFileSync(new URL('../app/v2/annual-list-counts.generated.json',import.meta.url),'utf8'));
const expectedProvinces=new Set(Object.keys(counts.lists.RENAL[0].provinces));
const bytes=readFileSync(source);
const lines=bytes.toString('utf8').trimEnd().split(/\r?\n/);
if(lines.shift()?.replace(/^\uFEFF/,'')!=='anio,provincia,poblacion,base_censal,referencia,fuente_indec')throw new Error('Encabezado de población inesperado');

const population={};
const provenance={};
for(const line of lines){
  const columns=line.split(',');
  if(columns.length!==6)throw new Error(`Fila inválida: ${line}`);
  const [rawYear,name,rawValue,baseCensal,reference,sourceIndec]=columns;
  const year=Number(rawYear),value=Number(rawValue);
  const normalized=name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
  const province=normalized==='CABA'?'CAPITAL FEDERAL':normalized==='TOTAL PAIS'?'ARGENTINA':normalized;
  if(!Number.isInteger(year)||year<2005||year>2025||!Number.isSafeInteger(value)||value<=0)throw new Error(`Población inválida: ${line}`);
  if(province!=='ARGENTINA'&&!expectedProvinces.has(province))throw new Error(`Provincia desconocida: ${name}`);
  population[year]??={};
  if(population[year][province]!==undefined)throw new Error(`Población duplicada: ${year} ${province}`);
  population[year][province]=value;
  const sourceRow={baseCensal,reference,sourceIndec};
  if(provenance[year]&&JSON.stringify(provenance[year])!==JSON.stringify(sourceRow))throw new Error(`Fuentes mezcladas en ${year}`);
  provenance[year]=sourceRow;
}
for(let year=2005;year<=2025;year++){
  if(Object.keys(population[year]??{}).length!==25)throw new Error(`Cobertura incompleta: ${year}`);
  for(const province of expectedProvinces)if(population[year][province]===undefined)throw new Error(`Falta ${year} ${province}`);
}
const result={sourceSha256:createHash('sha256').update(bytes).digest('hex'),population,provenance};
writeFileSync(destination,JSON.stringify(result)+'\n');
console.log(`Población anual verificada: ${lines.length} filas, 2005–2025, 24 provincias y total país.`);
