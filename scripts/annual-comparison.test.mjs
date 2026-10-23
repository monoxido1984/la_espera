import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
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
const counts=read('annual-list-counts.generated.json'),partial=read('partial-2026.generated.json'),cells=unpackAnnualTimes(read('annual-time.generated.json'));
const make=selection=>comparisonHistory(history,selection,history.map(r=>annualTimeDetail(cells,r.year,selection)),counts,partial);

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
test('July is the last year of the same history with no substitute August or full-year counts',()=>{
  const renal=make({list:'RENAL',province:null,age:'all'}),last=renal.at(-1);
  assert.equal(renal.length,22);assert.equal(last.year,2026);assert.equal(last.partial,true);
  assert.equal(last.average,partial.renal.average);assert.equal(last.n,892);assert.equal(last.donors,1278);assert.equal(last.waitlist,null);
  for(const selection of [{list:'CORNEAS',province:null,age:'all'},{list:'RENAL',province:'CORDOBA',age:'all'}]){
    const last=make(selection).at(-1);assert.equal(last.average,null);assert.equal(last.waitlist,null);
  }
});
test('a freshly changed selection never reuses the previous list mean while its details load',()=>{
  const old={list:'RENAL',province:null,age:'all'};
  const oldDetails=history.map(r=>annualTimeDetail(cells,r.year,old));
  const rows=comparisonHistory(history,{...old,list:'HEPATICA'},oldDetails,counts,partial);
  assert.ok(rows.every(r=>r.average===null));assert.ok(rows.every(r=>r.unit==='días'));
});

test('published waiting counts preserve provincial totals and their source hashes',t=>{
  assert.equal(Object.keys(counts.lists).length,13);
  for(const series of Object.values(counts.lists))assert.deepEqual(series.map(row=>row.year),Array.from({length:21},(_,i)=>2005+i));
  if(process.cwd().endsWith('github-la-espera')){t.skip('Acquisition originals are kept in the source checkout');return;}
  for(const series of Object.values(counts.lists))for(const row of series){
    assert.equal(Object.keys(row.provinces).length,24);
    assert.equal(Object.values(row.provinces).reduce((sum,n)=>sum+n,0),row.total);
    for(const source of row.sources){
      const bytes=readFileSync(new URL('../../'+source.path,import.meta.url));
      assert.equal(createHash('sha256').update(bytes).digest('hex'),source.sha256);
    }
  }
});
