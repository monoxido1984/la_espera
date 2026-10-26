import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {annualPmh} from '../app/v2/annual-pmh.ts';

test('annual PMH uses the selected provincial population and preserves missing values',()=>{
  assert.equal(annualPmh(100,'CORDOBA',2005),100/3254279*1_000_000);
  assert.equal(annualPmh(0,'CORDOBA',2005),0);
  assert.equal(annualPmh(null,'CORDOBA',2005),null);
  assert.equal(annualPmh(100,'CORDOBA',2026),null);
  assert.equal(annualPmh(100,'UNKNOWN',2005),null);
  const data=JSON.parse(readFileSync(new URL('../app/v2/annual-population.generated.json',import.meta.url),'utf8'));
  for(const [year,rows] of Object.entries(data.population))for(const [province,denominator] of Object.entries(rows)){
    assert.equal(annualPmh(denominator,province,Number(year)),1_000_000);
  }
});
