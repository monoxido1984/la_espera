import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {registrationSelection,registrationStages} from '../app/v2/registration-model.ts';
const data=JSON.parse(readFileSync(new URL('../app/v2/registration-context.generated.json',import.meta.url),'utf8'));
test('every reported registration list exposes its five published stages without adjusting their rounding',()=>{
 for(const row of [data.total,...data.rows]){
  const stages=registrationStages(row);
  assert.equal(stages.length,5);
  for(const stage of stages)assert.equal(stage.days,row.stageDays[stage.id]);
  assert.ok(Math.abs(stages.reduce((sum,stage)=>sum+stage.share,0)-1)<1e-9);
 }
 assert.equal(registrationStages(registrationSelection(data,'CORNEAS')).find(stage=>stage.id==='secondAuthorization').days,40);
 assert.equal(registrationStages(data.total).reduce((n,stage)=>n+stage.days,0),183);
 assert.equal(data.total.days,184);
});
test('registration uses the published national TOTAL for 2025 and reconciles all reported list counts',()=>{
 assert.equal(data.year,2025);assert.equal(data.total.n,5823);assert.equal(data.total.months,6.1);assert.equal(data.total.days,184);
 assert.equal(data.rows.length,10);assert.equal(data.rows.reduce((sum,row)=>sum+row.n,0),data.total.n);
 assert.deepEqual(registrationSelection(data,'TOTAL'),data.total);
 assert.equal(registrationSelection(data,'RENAL').months,11.2);
 assert.equal(registrationSelection(data,'CORNEAS').months,2);
 assert.equal(registrationSelection(data,'CARDIORRENAL').n,1);
 assert.equal(data.rows.reduce((sum,row)=>sum+row.months,0)/data.rows.length===data.total.months,false);
});
test('absent inscription lists remain absent and published stage rounding is preserved',()=>{
 assert.equal(data.offeredLists.length,17);assert.equal(data.missingLists.length,7);
 for(const id of data.missingLists)assert.equal(registrationSelection(data,id),null);
 assert.equal(Object.values(data.total.stageDays).reduce((a,b)=>a+b,0),183);
 assert.equal(data.total.days,184); // Independent rounding in CRESI, not silently corrected.
});
test('registration sources retain their archived SHA256 and scope when acquisition originals are available',t=>{
 const root=new URL('../../../../',import.meta.url);
 if(!data.sources.every(source=>existsSync(new URL(source.path,root))))return t.skip('Acquisition originals external');
 for(const source of data.sources)assert.equal(createHash('sha256').update(readFileSync(new URL(source.path,root))).digest('hex'),source.sha256);
 const criteria=readFileSync(new URL(data.sources.find(source=>source.path.endsWith('tabla_01.csv')).path,root),'utf8');
 assert.match(criteria,/desde 1-1-2025 hasta 31-12-2025/);assert.doesNotMatch(criteria,/Lista de espera:|Jurisdicción:/);
});
