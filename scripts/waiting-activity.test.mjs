import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {activitySeries,activityPath} from '../app/v2/waiting-activity-model.ts';
const load=name=>JSON.parse(readFileSync(new URL(`../app/v2/${name}`,import.meta.url),'utf8'));
const counts=load('annual-list-counts.generated.json');
const tx=load('annual-transplant-counts.generated.json');
const donors=load('donation-context.generated.json');

test('activity uses explicit transplant counts, independently of time-statistic cohorts or exclusions',()=>{
  const national=activitySeries(counts,tx.rows,donors.rows,'RENAL',null,'all');
  assert.equal(national.length,21);assert.ok(national.every(row=>row.year<=2025));
  assert.deepEqual(national.find(row=>row.year===2025),{year:2025,waiting:5195,transplants:1766,donors:956});
  const provincial=activitySeries(counts,tx.rows,donors.rows,'RENAL','BUENOS AIRES','all');
  assert.equal(provincial.find(row=>row.year===2015).transplants,451);
  assert.equal(provincial.find(row=>row.year===2025).transplants,null);
  assert.equal(provincial.find(row=>row.year===2025).donors,377);
});

test('missing joint geography, age and organ breakdowns remain absent; real donors cover all organs',()=>{
  const adults=activitySeries(counts,tx.rows,donors.rows,'RENAL','BUENOS AIRES','18_mas');
  assert.ok(adults.every(row=>row.waiting===null&&row.transplants===null));
  assert.equal(adults.find(row=>row.year===2025).donors,377);
  const corneas=activitySeries(counts,tx.rows,donors.rows,'CORNEAS','BUENOS AIRES','all');
  assert.equal(corneas.find(row=>row.year===2025).donors,377);
  assert.equal(tx.rows['ESCLERAS|2025|ARGENTINA'],null);
  const pampa=activitySeries(counts,tx.rows,donors.rows,'RENAL','LA PAMPA','all');
  assert.equal(pampa.find(row=>row.year===2009).donors,null);
});

test('time paths preserve missing years as gaps and keep explicit zeros',()=>{
  const points=[{year:2005,waiting:5},{year:2006,waiting:null},{year:2007,waiting:0},{year:2008,waiting:3}];
  const path=activityPath(points,'waiting',year=>year,value=>value);
  assert.match(path,/M2005,5/);assert.match(path,/M2007,0/);assert.match(path,/L2008,3/);
  assert.doesNotMatch(path,/L2007/);
});

test('current donation cutoff stays separate from the full-year activity series',()=>{
  const current=load('current-donation.generated.json');
  assert.equal(current.cutoff,'27/10/2026');assert.equal(current.from,'01/01/2026');
  assert.equal(current.rows.ARGENTINA.total,1835);assert.equal(current.rows.ARGENTINA.organs,838);
  assert.equal(current.rows['LA PAMPA'],null);assert.equal(current.rows['SANTA CRUZ'],null);
  const provincial=Object.entries(current.rows).filter(([k,v])=>k!=='ARGENTINA'&&v!==null).reduce((sum,[,row])=>sum+row.total,0);
  assert.equal(provincial+current.foreignTotal,current.rows.ARGENTINA.total);
});
