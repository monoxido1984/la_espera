import {test} from 'node:test';
import assert from 'node:assert/strict';
import diagnoses from '../app/v2/current-diagnoses.generated.json' with {type:'json'};
import exits from '../app/v2/provincial-exits.generated.json' with {type:'json'};

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

test('provincial permanent exclusions preserve causes and published absences',()=>{
  assert.equal(Object.keys(exits.rows).length,6552);
  assert.equal(exits.rows['RENAL|2025|BUENOS AIRES'].total,982);
  for(const [key,row] of Object.entries(exits.rows)){
    assert.equal(key.split('|').length,3);
    if(row.total===null){assert.equal(row.state,'sin_resultado_publicado');assert.deepEqual(row.causes,[]);}
    else {assert.equal(row.state,'publicado');assert.equal(row.causes.reduce((sum,c)=>sum+c.value,0),row.total);assert.ok(row.causes.every(c=>c.group&&c.canonicalId));}
  }
});
