import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
const data=JSON.parse(readFileSync(new URL('../app/v2/partial-2026.generated.json',import.meta.url)));
test('July 2026 keeps a partial cohort, missing list stock, and disjoint monthly renal means',()=>{
  assert.equal(data.partial,true);assert.equal(data.to,'2026-07-31');assert.equal(data.waitlist,null);
  assert.equal(data.donors,1278);assert.equal(data.organDonors+data.tissueDonors,data.donors);
  const months=data.sources.renalMonths;
  assert.deepEqual(months.map(m=>m.period),['2026-01','2026-02','2026-03','2026-04','2026-05','2026-06','2026-07']);
  assert.equal(months.reduce((n,m)=>n+m.n,0),892);
  assert.ok(Math.abs(months.reduce((sum,m)=>sum+m.n*m.meanMonths,0)/892-data.renal.average)<1e-10);
  assert.equal(data.record.month,'2026-05');assert.equal(data.record.value,109);
  assert.match(data.record.scope,/mensual/);assert.match(data.record.url,/argentina.gob.ar/);
  assert.deepEqual(JSON.parse(readFileSync(new URL('../public/datos/parcial-2026.json',import.meta.url))),data);
});
test('the source checkout can verify each partial source against its original SHA256',{skip:!existsSync(new URL('../../datos/extraidos/',import.meta.url))},()=>{
  // The export repository intentionally does not contain acquisition originals.
  for(const source of [...data.sources.renalMonths,data.sources.donors,data.sources.period,data.sources.metadata]){
    const bytes=readFileSync(new URL('../../'+source.path,import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'),source.sha256);
  }
});
