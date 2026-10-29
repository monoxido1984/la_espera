import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root=new URL('../../../../',import.meta.url);
const data=JSON.parse(readFileSync(new URL('../app/v2/dialysis-context.generated.json',import.meta.url),'utf8'));
test('registration timing preserves its 2025 cohort, grouped stage means and jurisdictional scope',()=>{
 assert.equal(data.timing.n,2396);assert.equal(data.timing.days,336);assert.equal(data.timing.months,11.2);
 assert.deepEqual(data.timing.rawStageDays,{'1AUT':69,EVA:235,EST:16,'2AUT':9,INS:7});
 assert.deepEqual(data.timing.stages.map(row=>row.days),[69,235,32]);
 assert.equal(data.timing.stages.reduce((sum,row)=>sum+row.days,0),336);
 assert.equal(Object.keys(data.timing.jurisdictions).length,24);
 for(const [province,months,n] of [['RIO NEGRO',20,42],['CORDOBA',9.2,184],['SAN LUIS',6.3,60],['BUENOS AIRES',11.2,925],['SANTA FE',10.2,206]]){const row=data.timing.jurisdictions[province];assert.equal(row.months,months);assert.equal(row.n,n);}
 assert.ok(Math.abs(32/336*100-9.5238095238)<1e-8);
});
test('coverage keeps national IRCT snapshot and all-patient denominators distinct from LE plus IND',()=>{
 assert.equal(data.coverage.consulted,'14/08/2026 17:27');assert.equal(data.coverage.total,30970);
 assert.equal(data.coverage.rows.length,6);assert.equal(new Set(data.coverage.rows.map(row=>row.code)).size,6);
 const prepaga=data.coverage.rows[0];assert.equal(prepaga.le,583);assert.equal(prepaga.ind,541);assert.equal(prepaga.total,1854);
 assert.equal(data.coverage.rows.find(row=>row.label==='PAMI').le,1264);
 for(const row of data.coverage.rows){assert.ok(row.le>=0&&row.ind>=0);assert.ok(row.le+row.ind<row.total);}
 assert.equal(data.coverage.indDefinition,'Indicación de evaluación pretrasplante');
});
test('local source hashes preserve original timing and coverage reports',t=>{
 if(!existsSync(new URL(data.sources[0].path,root))){t.skip('Originals remain in acquisition project');return;}
 for(const source of data.sources)assert.equal(createHash('sha256').update(readFileSync(new URL(source.path,root))).digest('hex'),source.sha256,source.path);
});
