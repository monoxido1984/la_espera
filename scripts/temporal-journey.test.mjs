import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const source=readFileSync(new URL('../app/v2/temporal-journey-model.ts',import.meta.url),'utf8').replace("'./time-scale-model'",JSON.stringify(new URL('../app/v2/time-scale-model.ts',import.meta.url).href));
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {journeyState,journeyPosition,cumulativeCalendar}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
test('the individual precedes the collective, whole sessions accumulate and the 2025 cohort stays exact',()=>{
  let previous=0;
  for(let i=0;i<=1000;i++){
    const s=journeyState(i/1000,'dialysis',66.39,1542);
    assert.ok(s.people>=1&&s.people<=1542);assert.ok(s.duration.value>=previous);
    assert.equal(s.duration.value%4,0);if(i<=620)assert.equal(s.people,1);
    previous=s.duration.value;
  }
  const one=journeyState(.62,'dialysis',66.39,1542),all=journeyState(1,'dialysis',66.39,1542);
  assert.equal(one.duration.hours,3464);assert.equal(one.duration.sessionCount,866);
  assert.equal(all.people,1542);assert.equal(all.duration.hours,one.duration.hours*1542);
  const list=journeyState(1,'list',28.12,1542);
  assert.equal(list.people,1542);assert.equal(list.duration.value%1542,0);
  assert.equal(journeyState(0,'list',28.12,1542).duration.value,0);
});
test('annual dialysis uses the year-end stock and a one-year hypothetical regime, never the transplant mean',()=>{
  const data=JSON.parse(readFileSync(new URL('../app/dialysis-population-2025.generated.json',import.meta.url),'utf8'));
  assert.equal(data.count,31431);assert.equal(data.at,'31/12/2025');assert.equal(data.annualPersonTime,null);
  const one=journeyState(.62,'dialysis',12,data.count),all=journeyState(1,'dialysis',12,data.count);
  assert.equal(one.duration.sessionCount,156);assert.equal(one.duration.hours,624);
  assert.equal(all.people,31431);assert.equal(all.duration.hours,624*31431);
  assert.notEqual(all.people,journeyState(1,'list',28.12,1542).people);
});
test('the ledger accumulates every session or day without resetting after weeks or during the zoom',()=>{
  for(const [metric,months] of [['dialysis',12],['list',28.12]]){
    let previous=0;
    for(let i=0;i<=1000;i++){const c=cumulativeCalendar(i/1000,metric,months);assert.ok(c.steps>=previous);assert.ok(c.steps<=c.total);previous=c.steps;}
    assert.deepEqual(cumulativeCalendar(.62,metric,months),cumulativeCalendar(1,metric,months));
  }
});
test('the zoomed trajectories fit mobile and desktop at every stage without inventing extra dots',()=>{
  for(const [w,h] of [[331,360],[700,520]])for(const progress of [0,.3,.62,.7,.8,1]) {
    const s=journeyState(progress,'dialysis',66.39,1542);
    for(let i=0;i<s.people;i++){
      const p=journeyPosition(i,s.people,w,h,s.individual,s.expansion);
      assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));assert.ok(p.x>=0&&p.x<=w&&p.y>=0&&p.y<=h);
    }
  }
});
