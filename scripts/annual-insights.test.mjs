import test from 'node:test';
import assert from 'node:assert/strict';
import {changeFromBaseline} from '../app/v2/annual-insights-model.ts';
test('annual change compares 2020 with all three prior years and preserves zero versus missing',()=>{
 const baseline=[{year:2017,value:100},{year:2018,value:200},{year:2019,value:300}];
 assert.deepEqual(changeFromBaseline([...baseline,{year:2020,value:100}],2020,[2017,2018,2019]),{current:100,referenceMean:200,percentReduction:50});
 assert.equal(changeFromBaseline([...baseline,{year:2020,value:0}],2020,[2017,2018,2019]).percentReduction,100);
 assert.equal(changeFromBaseline([...baseline.slice(1),{year:2020,value:100}],2020,[2017,2018,2019]),null);
 assert.equal(changeFromBaseline([...baseline,{year:2020,value:null}],2020,[2017,2018,2019]),null);
});
