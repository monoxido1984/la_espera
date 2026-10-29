import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
const data=JSON.parse(readFileSync(new URL('../app/v2/annual-entry-context.generated.json',import.meta.url),'utf8'));
test('intro annual admissions remain a documented minimum, with absent reports preserved',()=>{
 assert.deepEqual(data.years.map(row=>row.documentedEntries),[5064,6364,6682,6413,6751]);
 assert.equal(data.meanDocumented,6254.8);assert.equal(data.displayFloor,6200);assert.ok(data.displayFloor<data.meanDocumented);
 for(const row of data.years){assert.equal(row.observed.length+row.missing.length,data.listsCount);assert.equal(row.observed.reduce((sum,r)=>sum+r.n,0),row.documentedEntries);assert.ok(row.missing.length>0);assert.equal(new Set([...row.observed.map(r=>r.list),...row.missing]).size,data.listsCount);}
});
test('intro admissions source hashes match archived reports when available',t=>{
 const root=new URL('../../../../',import.meta.url);if(!existsSync(new URL(data.sources[0].path,root))){t.skip('Acquisition originals external');return;}
 for(const source of [data.parent,...data.sources])assert.equal(createHash('sha256').update(readFileSync(new URL(source.path,root))).digest('hex'),source.sha256,source.path);
});
