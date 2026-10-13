import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import ts from 'typescript';
import {timeMagnitude,DAYS_PER_MONTH} from '../app/v2/time-scale-model.ts';
const read=name=>JSON.parse(readFileSync(new URL('../app/'+name,import.meta.url),'utf8'));
const compact=read('v2/annual-time.generated.json');
const parent=read('wait-time-province.generated.json');
const source=readFileSync(new URL('../app/v2/annual-time-model.ts',import.meta.url),'utf8').replace("'../wait-statistics'",JSON.stringify(new URL('../app/wait-statistics.ts',import.meta.url).href));
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {unpackAnnualTimes,annualTimeDetail}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const cells=unpackAnnualTimes(compact);
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);

test('calendar units are the same duration and accumulation is person-time, never new patients',()=>{
  const m=66.39,n=1542;
  near(timeMagnitude(m,n,false,false,'months').value,m);
  near(timeMagnitude(m,n,false,false,'days').value,m*DAYS_PER_MONTH);
  near(timeMagnitude(m,n,false,false,'minutes').value,timeMagnitude(m,n,false,false,'seconds').value/60);
  near(timeMagnitude(m,n,false,false,'hours').value,timeMagnitude(m,n,false,false,'days').value*24);
  for(const scale of ['seconds','minutes','hours','days','months','years']) near(timeMagnitude(m,n,true,false,scale).value,timeMagnitude(m,n,false,false,scale).value*n);
});

test('the four-hour, three-times-weekly scenario uses session hours rather than calendar hours',()=>{
  const estimate=timeMagnitude(66.39,1542,false,true,'hours');
  near(estimate.value,3464.064225);
  near(estimate.sessionCount,866.01605625);
  near(estimate.fullDays,144.336009375);
  near(estimate.value/timeMagnitude(66.39,1542,false,false,'hours').value,12/168);
  near(timeMagnitude(66.39,1542,true,true,'years').value,609.3653571428573);
  assert.equal(estimate.estimated,true);
  assert.equal(timeMagnitude(66.39,1542,false,false,'months').estimated,false);
});

test('the compact annual source preserves all 13,104 original joint cells and their units',()=>{
  assert.equal(cells.length,21*13*24*2);
  assert.equal(compact.sourceSha256,createHash('sha256').update(readFileSync(new URL('../app/wait-time-province.generated.json',import.meta.url))).digest('hex'));
  const byKey=new Map(parent.cells.filter(c=>c.year<=2025).map(c=>[`${c.year}/${c.list}/${c.province}/${c.age}`,c]));
  for(const c of cells) {
    const original=byKey.get(`${c.year}/${c.list}/${c.province}/${c.age}`);
    assert.ok(original);
    for(const field of ['n','average','median','p25','p75','unit','status']) assert.equal(c[field],original[field]);
  }
});

test('annual joint summaries retain the territorial cohort, original days, and absent observations',()=>{
  const national=annualTimeDetail(cells,2025,{list:'RENAL',province:null,age:'all'});
  assert.equal(national.n,1528);
  near(national.average,28.236446335078533);
  assert.notEqual(national.n,read('history.generated.json').at(-1).n);
  const hepatic=annualTimeDetail(cells,2025,{list:'HEPATICA',province:'BUENOS AIRES',age:'18_mas'});
  assert.equal(hepatic.unit,'días');
  const empty=cells.find(c=>c.n===0);
  const summary=annualTimeDetail(cells,empty.year,{list:empty.list,province:empty.province,age:empty.age});
  assert.equal(summary.status,'sin_observaciones');assert.equal(summary.average,null);
  const subset=cells.filter(c=>c.year===2025&&c.list==='RENAL'&&c.province==='CORDOBA').slice(0,1);
  assert.equal(annualTimeDetail(subset,2025,{list:'RENAL',province:'CORDOBA',age:'all'}).average,null);
});
