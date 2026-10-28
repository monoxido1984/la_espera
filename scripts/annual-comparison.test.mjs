import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import ts from 'typescript';
const url=name=>new URL('../app/v2/'+name,import.meta.url);
const read=name=>JSON.parse(readFileSync(url(name),'utf8'));
const transpile=text=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(text,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64');
const stats=transpile(readFileSync(new URL('../app/wait-statistics.ts',import.meta.url),'utf8'));
const time=transpile(readFileSync(url('annual-time-model.ts'),'utf8').replace("'../wait-statistics'",JSON.stringify(stats)));
const {annualTimeDetail,unpackAnnualTimes}=await import(time);
const model=transpile(readFileSync(url('annual-comparison-model.ts'),'utf8').replace("'./annual-time-model'",JSON.stringify(time)));
const {comparisonHistory}=await import(model);
const history=JSON.parse(readFileSync(new URL('../app/history.generated.json',import.meta.url),'utf8'));
const counts=read('annual-list-counts.generated.json'),cells=unpackAnnualTimes(read('annual-time.generated.json'));
const make=selection=>comparisonHistory(history,selection,history.map(r=>annualTimeDetail(cells,r.year,selection)),counts);

test('one list selection controls the waiting count and the mean without changing donor scope',()=>{
  const renal=make({list:'RENAL',province:null,age:'all'}),corneas=make({list:'CORNEAS',province:null,age:'all'});
  const r=renal.find(r=>r.year===2025),c=corneas.find(r=>r.year===2025);
  assert.equal(r.average,28.12);assert.equal(r.n,1542);
  assert.equal(r.waitlist,counts.lists.RENAL.find(r=>r.year===2025).total);
  assert.equal(c.waitlist,2188);assert.notEqual(c.waitlist,r.waitlist);
  assert.ok(Math.abs(c.average-12.4)<.1);assert.equal(c.n,1850);
  assert.equal(c.donors,r.donors);assert.equal(c.donors,2264);
  const hepatic=make({list:'HEPATICA',province:null,age:'all'}).find(r=>r.year===2025);
  assert.equal(hepatic.unit,'días');assert.equal(c.unit,'meses');
});
test('province counts are observed and an age filter never fabricates a waiting stock',()=>{
  const renal=make({list:'RENAL',province:'CORDOBA',age:'all'}).find(r=>r.year===2025);
  assert.equal(renal.waitlist,443);
  const pediatric=make({list:'RENAL',province:'CORDOBA',age:'menor_18'}).find(r=>r.year===2025);
  assert.equal(pediatric.waitlist,null);assert.ok(pediatric.countReason.includes('edad'));
});
test('annual history contains only complete years 2005–2025',()=>{const rows=make({list:'RENAL',province:null,age:'all'});assert.equal(rows.length,21);assert.equal(rows.at(-1).year,2025);assert.ok(rows.every(row=>!row.partial));});
test('a freshly changed selection never reuses the previous list mean while its details load',()=>{
  const old={list:'RENAL',province:null,age:'all'};
  const oldDetails=history.map(r=>annualTimeDetail(cells,r.year,old));
  const rows=comparisonHistory(history,{...old,list:'HEPATICA'},oldDetails,counts);
  assert.ok(rows.every(r=>r.average===null));assert.ok(rows.every(r=>r.unit==='días'));
});

test('published waiting counts preserve provincial totals',()=>{
  assert.equal(Object.keys(counts.lists).length,13);
  for(const series of Object.values(counts.lists)){
    assert.deepEqual(series.map(row=>row.year),Array.from({length:21},(_,i)=>2005+i));
    for(const row of series){
      assert.equal(Object.keys(row.provinces).length,24);
      assert.equal(Object.values(row.provinces).reduce((sum,n)=>sum+n,0),row.total);
    }
  }
});
test('source hashes match acquisition originals when available',t=>{
  const sources=Object.values(counts.lists).flatMap(series=>series.flatMap(row=>row.sources));
  if(!sources.some(source=>existsSync(new URL('../../'+source.path,import.meta.url)))){t.skip('Acquisition originals are kept in the source checkout');return;}
  for(const source of sources){
    const bytes=readFileSync(new URL('../../'+source.path,import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'),source.sha256);
  }
});

test('renal national medians and bands use the published national cohort, not provincial quantiles',()=>{
 const row=make({list:'RENAL',province:null,age:'all'}).find(row=>row.year===2025);
 assert.deepEqual([row.median,row.p25,row.p75,row.quantileN],[16.12,4.97,39.46,1542]);
 assert.notEqual(row.median,row.average);
 const aggregate=make({list:'CORNEAS',province:null,age:'all'}).find(row=>row.year===2025);
 assert.equal(aggregate.median,null);assert.equal(aggregate.p25,null);assert.equal(aggregate.p75,null);assert.ok(aggregate.average>0);
 const exact=make({list:'CORNEAS',province:'BUENOS AIRES',age:'18_mas'}).find(row=>row.year===2025);
 const source=cells.find(row=>row.year===2025&&row.list==='CORNEAS'&&row.province==='BUENOS AIRES'&&row.age==='18_mas');
 assert.deepEqual([exact.median,exact.p25,exact.p75],[source.median,source.p25,source.p75]);
 const bothAges=make({list:'CORNEAS',province:'BUENOS AIRES',age:'all'}).find(row=>row.year===2025);assert.equal(bothAges.median,null);
});
test('explicit hepatic list rows apply only to their exact national list and keep their own cohort',()=>{
 const rows=read('annual-national-quantiles.generated.json').rows;
 const build=selection=>comparisonHistory(history,selection,history.map(row=>annualTimeDetail(cells,row.year,selection)),counts,rows);
 const row=build({list:'HEPATICA',province:null,age:'all'}).find(row=>row.year===2025);
 assert.deepEqual([row.median,row.p25,row.p75,row.quantileN,row.unit],[105.73,21.61,349.35,445,'días']);
 const filtered=build({list:'HEPATICA',province:'CORDOBA',age:'all'}).find(row=>row.year===2025);assert.equal(filtered.median,null);
 const oldDetails=history.map(row=>annualTimeDetail(cells,row.year,{list:'RENAL',province:null,age:'all'}));
 const stale=comparisonHistory(history,{list:'CORNEAS',province:null,age:'all'},oldDetails,counts,rows);assert.ok(stale.every(row=>row.median===null));
 for(const source of rows){assert.ok(source.p25<=source.median&&source.median<=source.p75);const path=new URL('../../../../'+source.source,import.meta.url);if(existsSync(path))assert.equal(createHash('sha256').update(readFileSync(path)).digest('hex'),source.sha256);}
});
