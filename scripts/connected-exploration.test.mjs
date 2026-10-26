import test from 'node:test';
import assert from 'node:assert/strict';
import {flowBands} from '../app/v2/independent-flow-model.ts';
import {contextFinding} from '../app/v2/context-finding.ts';
test('independent bands conserve proportions and never divide by zero',()=>{
 const rows=flowBands([{id:'a',label:'A',value:10,color:'red'},{id:'b',label:'B',value:30,color:'red'}]);
 assert.equal(rows[0].percent,25);assert.equal(rows[1].height,rows[0].height*3);assert.equal(rows.reduce((s,r)=>s+r.height,0),170);
 assert.equal(flowBands([{id:'zero',label:'Zero',value:0,color:'red'}])[0].height,0);
 assert.deepEqual(flowBands([]),[]);
});
test('context findings distinguish missing values, zero and observed changes in people waiting',()=>{
 assert.match(contextFinding(0,5,0,0),/5 personas registradas menos/);
 assert.match(contextFinding(5,5,null,null),/no cambió/);
 assert.match(contextFinding(null,null,0,0),/0 ingresos y 0 egresos/);
 assert.match(contextFinding(null,5,null,0),/Falta información/);
});
