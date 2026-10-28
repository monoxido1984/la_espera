import test from 'node:test';
import assert from 'node:assert/strict';
import {historyTime} from '../app/v2/annual-story-model.ts';
test('time history preserves zero medians and explicit missing means',()=>{
assert.deepEqual(historyTime({median:0,average:10}),{value:0,kind:'median'});
assert.deepEqual(historyTime({median:null,average:12.4}),{value:12.4,kind:'mean'});
assert.deepEqual(historyTime({median:null,average:null}),{value:null,kind:'mean'});
});
