import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const web=resolve(dirname(fileURLToPath(import.meta.url)),'..'),root=resolve(process.argv[2]??resolve(web,'../../..'));
const source='visualizacion/app/v2/annual-entries.generated.json';
const parent=JSON.parse(readFileSync(resolve(root,source),'utf8'));
const hashes=JSON.parse(readFileSync(resolve(root,'visualizacion/public/datos/fuentes-ingresos-anuales.json'),'utf8'));
const lists=[...new Set(Object.keys(parent.rows).map(key=>key.split('|')[0]))].sort(),sources=new Map();
function verify(path){const hash=createHash('sha256').update(readFileSync(resolve(root,path))).digest('hex');if(hashes[path]!==hash)throw Error('Source mismatch: '+path);sources.set(path,hash);}
const years=[];
for(let year=2021;year<=2025;year++){
 const observed=[],missing=[];
 for(const list of lists){
  const row=parent.rows[`${list}|${year}|ARGENTINA`];if(!row)throw Error('Missing record');
  const folder=`reportes_dinamicos/ingresos_cruzados_20261023/ingresos_${list.toLowerCase()}_${year}_nacional_todas`;
  const original=`datos/originales/${folder}/resultado.html`,criteria=`datos/extraidos/${folder}/tabla_01.csv`;
  verify(original);verify(criteria);
  const text=readFileSync(resolve(root,criteria),'utf8');
  if(!text.includes('PACIENTES INSCRIPTOS EN CUALQUIER SITUACION')||!text.includes(`desde 1-1-${year} hasta 31-12-${year}`)||text.includes('Provincia del paciente:'))throw Error('Unexpected cohort');
  if(row.total===null){if(row.state!=='sin_resultado_publicado'||!readFileSync(resolve(root,original),'utf8').toLowerCase().includes('no existe resultado'))throw Error('Invalid missing record');missing.push(list);continue;}
  const path=`datos/extraidos/${folder}/tabla_03.csv`;verify(path);
  const lines=readFileSync(resolve(root,path),'utf8').replace(/^\uFEFF/,'').trim().split(/\r?\n/),column=lines[1].split(',').indexOf('TOTAL');
  const total=Number(lines.find(line=>line.startsWith('TOTAL,')).split(',')[column].replaceAll('.',''));
  if(column<0||total!==row.total)throw Error('Total mismatch: '+path);
  observed.push({list,n:total});
 }
 years.push({year,documentedEntries:observed.reduce((sum,row)=>sum+row.n,0),observed,missing});
}
const meanDocumented=years.reduce((sum,row)=>sum+row.documentedEntries,0)/years.length;
const data={from:2021,to:2025,unit:'inscripciones',listsCount:lists.length,meanDocumented,displayFloor:Math.floor(meanDocumented/100)*100,years,note:'Mínimo documentado de inscripciones por fecha de ingreso, cualquier situación posterior. Trece listas relevadas, sin deduplicar personas entre listas. Las ausencias de reporte no se convierten en cero; se excluyen de cada subtotal observado. La media de estos subtotales es un límite inferior, no un total nacional completo.',parent:{path:source,sha256:createHash('sha256').update(readFileSync(resolve(root,source))).digest('hex')},sources:[...sources].map(([path,sha256])=>({path,sha256}))};
writeFileSync(resolve(web,'app/v2/annual-entry-context.generated.json'),JSON.stringify(data,null,2)+'\n');writeFileSync(resolve(web,'public/datos/contexto-inscripciones-2021-2025.json'),JSON.stringify(data,null,2)+'\n');console.log(JSON.stringify({years:years.map(row=>[row.year,row.documentedEntries]),meanDocumented,displayFloor:data.displayFloor,sources:sources.size}));
