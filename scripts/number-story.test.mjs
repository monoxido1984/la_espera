import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {numberStoryFacts,numberStoryStep,numberStepTargets} from '../app/v2/number-story-model.ts';
const snapshot=JSON.parse(readFileSync(new URL('../app/v2/map-demographics.generated.json',import.meta.url),'utf8'));
test('scene 01 uses its current jointly acquired snapshot and exact complementary counts',()=>{
 const lists=snapshot.cohorts['all|all'].lists,total=lists.find(row=>row.id==='TOTAL').total,renal=lists.find(row=>row.id==='RENAL').total;
 const facts=numberStoryFacts(total,renal);assert.equal(total,9641);assert.equal(renal,5585);assert.equal(facts.other,4056);assert.equal(facts.renal+facts.other,facts.total);assert.equal(facts.renalPercent.toFixed(1),'57.9');assert.equal(facts.otherPercent.toFixed(1),'42.1');assert.equal(facts.renalPercent+facts.otherPercent,100);
 assert.deepEqual(numberStoryFacts(0,0),{total:0,renal:0,other:0,renalPercent:0,otherPercent:0});assert.throws(()=>numberStoryFacts(10,11));
});
test('each narrative button lands inside its own scroll block and reverses at the same boundaries',()=>{
 assert.deepEqual(numberStepTargets.map(numberStoryStep),[0,1,2]);
 assert.deepEqual([0,.32,1/3,.65,2/3,1].map(numberStoryStep),[0,0,1,1,2,2]);assert.equal(numberStoryStep(-1),0);
});
