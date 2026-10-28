import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
const data=JSON.parse(readFileSync(new URL('../app/v2/donation-context.generated.json',import.meta.url),'utf8'));

test('donation context keeps published categories separate and does not fill missing territorial cells',()=>{
  assert.equal(Object.keys(data.rows).length,21*25);
  for(const row of Object.values(data.rows)){
    if(row===null)continue;
    assert.equal(row.organs+row.tissues,row.total);
    assert.ok(row.organs>=0&&row.tissues>=0);
    for(const key of ['organPmh','tissuePmh'])assert.ok(row[key]===null||row[key]>=0);
  }
  assert.equal(data.rows['2009|LA PAMPA'],null);
  assert.equal(data.rows['2015|CHUBUT'],null);
  assert.equal(data.rows['2018|TIERRA DEL FUEGO'],null);
  assert.equal(data.rows['2025|BUENOS AIRES'].organs,377);
  assert.equal(data.rows['2025|BUENOS AIRES'].tissues,300);
  assert.equal(data.rows['2025|ARGENTINA'].total,2264);
});

test('archived donation tables and originals retain their source hashes when present',t=>{
  const root=new URL('../../../../',import.meta.url);
  if(!existsSync(new URL('datos/originales/',root))){t.skip('Acquisition originals remain in the source checkout');return;}
  for(const [path,hash] of Object.entries(data.sources))assert.equal(createHash('sha256').update(readFileSync(new URL(path,root))).digest('hex'),hash,path);
});
