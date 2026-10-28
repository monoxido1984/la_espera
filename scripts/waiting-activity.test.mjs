import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {activitySeries,activityPath} from '../app/v2/waiting-activity-model.ts';
const load=name=>JSON.parse(readFileSync(new URL('../app/v2/'+name,import.meta.url),'utf8'));
const counts=load('annual-list-counts.generated.json'),donors=load('donation-context.generated.json');
test('annual donor series retains territory, organ scope and missing values',()=>{
const renal=activitySeries(counts,donors.rows,'RENAL','BUENOS AIRES','all'),corneas=activitySeries(counts,donors.rows,'CORNEAS','BUENOS AIRES','all');
assert.equal(renal.length,21);assert.ok(renal.every(row=>row.year<=2025));assert.equal(renal.at(-1).waiting,2081);assert.equal(renal.at(-1).donors,377);assert.equal(corneas.at(-1).donors,377);
assert.equal(activitySeries(counts,donors.rows,'RENAL','LA PAMPA','all').find(row=>row.year===2009).donors,null);
});
test('time paths preserve missing years as gaps and keep explicit zeros',()=>{const points=[{year:2005,waiting:5},{year:2006,waiting:null},{year:2007,waiting:0},{year:2008,waiting:3}];const path=activityPath(points,'waiting',year=>year,value=>value);assert.match(path,/M2005,5/);assert.match(path,/M2007,0/);assert.match(path,/L2008,3/);assert.doesNotMatch(path,/L2007/);});
