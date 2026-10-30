import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {profileCells,simulatedProfile} from '../app/v2/simulated-waiting-profile.ts';
const source=JSON.parse(readFileSync(new URL('../app/v2/map-demographics.generated.json',import.meta.url),'utf8'));
test('fictional profiles sample published joint cells reproducibly, preserve age bands and never exceed age',()=>{
 const cells=profileCells(source);assert.ok(cells.length>0);
 assert.equal(cells.at(-1).end,cells.reduce((sum,c)=>sum+c.n,0));
 for(let point=0;point<9641;point++){
  const p=simulatedProfile(cells,point);assert.deepEqual(p,simulatedProfile(cells,point));
  assert.ok(p.months<=p.age*12);assert.ok(p.minor?p.age<18:p.age>=18);
  const cohort=source.cohorts[(p.minor?'menor18':'18mas')+'|'+p.sex];
  const row=cohort.lists.find(l=>l.id===p.list).seniorityByProvince.find(r=>r.province===p.province);
  assert.equal(row.items.find(r=>r.label===p.band).value,p.n);
  assert.ok(!cohort.missingProvinces.includes(p.province));
 }
 assert.equal(simulatedProfile([],1),null);
});
