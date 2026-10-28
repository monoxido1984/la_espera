import {test} from 'node:test';
import assert from 'node:assert/strict';
import diagnoses from '../app/v2/current-diagnoses.generated.json' with {type:'json'};

test('active diagnoses preserve jointly selected list, province, age and sex',()=>{
  assert.equal(diagnoses.date,'27/10/2026');
  assert.equal(Object.keys(diagnoses.rows).length,16*25*3*3);
  assert.equal(diagnoses.rows['RENAL|ARGENTINA|all|all'].total,5585);
  for(const [key,row] of Object.entries(diagnoses.rows)){
    assert.equal(key.split('|').length,4);
    if(row.total===null){assert.equal(row.state,'sin_resultado');assert.deepEqual(row.diagnoses,[]);}
    else {assert.ok(['publicado','parcial'].includes(row.state));if(row.state==='parcial')assert.ok(row.missingProvinces.length>0);assert.equal(row.diagnoses.reduce((sum,d)=>sum+d.value,0),row.total);}
  }
});
