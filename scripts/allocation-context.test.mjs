import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
const data=JSON.parse(readFileSync(new URL('../app/v2/allocation-context.generated.json',import.meta.url),'utf8'));
test('allocation context compares organ-only aggregates from 2025 without including tissues',()=>{
 assert.equal(data.year,2025);assert.equal(data.inscriptions.total,3350);assert.equal(data.transplants.total,2488);
 assert.equal(data.inscriptions.lowerBound,true);
 for(const kind of ['inscriptions','transplants']){
  assert.equal(data[kind].rows.reduce((n,row)=>n+row.n,0),data[kind].total);
  assert.ok(data[kind].rows.every(row=>!['CORNEAS','ESCLERAS','OTROS TEJIDOS','MEDULA OSEA'].includes(row.id)));
 }
 assert.equal(data.inscriptions.rows.length,8);assert.equal(data.transplants.rows.length,9);
 assert.match(data.note,/No restar/);assert.match(data.note,/no las mismas personas/);
});
test('allocation source hashes match archived reports when acquisition sources are available',t=>{
 const root=new URL('../../../../',import.meta.url);
 if(!data.sources.every(source=>existsSync(new URL(source.path,root))))return t.skip('Acquisition originals external');
 for(const source of data.sources)assert.equal(createHash('sha256').update(readFileSync(new URL(source.path,root))).digest('hex'),source.sha256);
});
