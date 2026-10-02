import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {summarizeWait} from '../app/wait-statistics.ts';
const {cells,periods}=JSON.parse(await readFile(new URL('../app/wait-time-province.generated.json',import.meta.url),'utf8'));
test('each published period has 13 lists, 24 provinces and 2 ages with verified responses',()=>{
 assert.ok(periods.length > 0);
 assert.equal(cells.length,periods.length * 13 * 24 * 2);
 assert.equal(new Set(cells.map(c=>`${c.year}|${c.list}|${c.province}|${c.age}`)).size,cells.length);
 for(const year of periods) for(const list of new Set(cells.map(c=>c.list))) assert.equal(summarizeWait(cells,year,list,null,'all').complete,true);
});
test('hepatic means are days; renal means are months, verified against original footnotes',()=>{
 const hepatic=cells.find(c=>c.year===2026&&c.list==='HEPATICA'&&c.province==='BUENOS AIRES'&&c.age==='18_mas');
 assert.equal(hepatic.unit,'días');assert.equal(hepatic.average,310.29);assert.equal(hepatic.n,124);
 assert.equal(cells.find(c=>c.list==='RENAL').unit,'meses');
});
test('a missing age prevents aggregation; explicit no observations never yields a zero waiting time',()=>{
 const selection=cells.filter(c=>c.year===2026&&c.list==='RENAL'&&c.province==='BUENOS AIRES');
 assert.equal(summarizeWait(selection.slice(0,1),2026,'RENAL','BUENOS AIRES','all').average,null);
 const empty=cells.find(c=>c.n===0);const result=summarizeWait(cells,empty.year,empty.list,empty.province,empty.age);
 assert.equal(result.status,'sin_observaciones');assert.equal(result.average,null);
});
test('quantiles are not averaged across cells, even when their means can be combined',()=>{
 const combined=summarizeWait(cells,2026,'RENAL','BUENOS AIRES','all');
 assert.ok(combined.average>0);assert.equal(combined.median,null);assert.equal(combined.p25,null);
 const single=summarizeWait(cells,2026,'RENAL','BUENOS AIRES','18_mas');assert.ok(single.median>0);
 assert.equal(summarizeWait(cells,2026,'TOTAL',null,'all').average,null);
});
test('national aggregate is receptor-weighted, not a mean of provinces',()=>{
 const result=summarizeWait(cells,2026,'RENAL',null,'all');
 const source=cells.filter(c=>c.year===2026&&c.list==='RENAL');
 assert.equal(result.average,source.reduce((sum,c)=>sum+(c.average??0)*c.n,0)/source.reduce((sum,c)=>sum+c.n,0));
});
test('renal 2025 reference uses the same year, cohort definition and published source',async()=>{
 const history=JSON.parse(await readFile(new URL('../app/history.generated.json',import.meta.url),'utf8'));
 const reference=history.find(r=>r.year===2025);
 assert.deepEqual([reference.average,reference.median,reference.p25,reference.p75,reference.n],[28.12,16.12,4.97,39.46,1542]);
 assert.equal(history.length,21);assert.ok(reference.sourceId.startsWith('sal_'));
});
