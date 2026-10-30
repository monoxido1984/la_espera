import test from 'node:test';
import assert from 'node:assert/strict';
import {contextValue} from '../app/v2/annual-context-model.ts';
test('absolute context keeps published counts without requiring a population denominator',()=>{
 assert.equal(contextValue(956,undefined,'absolute'),956);
 assert.equal(contextValue(0,undefined,'absolute'),0);
 assert.equal(contextValue(null,1000000,'absolute'),null);
 assert.equal(contextValue(-1,1000000,'absolute'),null);
});
test('PMH context uses the same count and own territorial population, withholding absent denominators',()=>{
 assert.equal(contextValue(30,2000000,'pmh'),15);
 assert.equal(contextValue(0,2000000,'pmh'),0);
 assert.equal(contextValue(30,null,'pmh'),null);
 assert.equal(contextValue(30,0,'pmh'),null);
 assert.equal(contextValue(undefined,2000000,'pmh'),null);
});
