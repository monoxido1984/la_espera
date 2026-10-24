import test from 'node:test';
import assert from 'node:assert/strict';
import {hasQuantileBand,quantileBandPath} from '../app/v2/quantile-band-model.ts';
test('bands follow P75 and return along P25, without bridging missing years',()=>{
 const point=year=>({year,median:10,p25:5,p75:20});
 const rows=[point(2005),point(2006),{year:2007,median:null,p25:null,p75:null},point(2008),point(2010)];
 const path=quantileBandPath(rows,n=>n,n=>100-n);
 assert.equal((path.match(/M/g)??[]).length,3);assert.equal((path.match(/Z/g)??[]).length,3);
 assert.ok(path.startsWith('M2005,80 L2006,80L2006,95 L2005,95Z'));
 assert.ok(!path.includes('2007'));
});
test('zero is a published quantile; missing, unordered or partial bands are withheld',()=>{
 assert.ok(hasQuantileBand({year:2005,median:0,p25:0,p75:0}));
 for(const bad of [{median:null,p25:0,p75:10},{median:5,p25:null,p75:10},{median:5,p25:10,p75:2},{median:5,p25:0,p75:10,partial:true}])assert.equal(hasQuantileBand({year:2005,...bad}),false);
});
