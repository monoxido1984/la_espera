import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {waitingFacts,waitingAnchor,diagnosisAnchor} from '../app/v2/exploration-findings.ts';
import {roundedDifference} from '../app/v2/comparison-display.ts';
const snapshot=JSON.parse(readFileSync(new URL('../app/v2/map-demographics.generated.json',import.meta.url),'utf8'));
const lists=snapshot.cohorts['all|all'].lists;
const renal=lists.find(row=>row.id==='RENAL');
const selection={listId:'RENAL',province:null,seniority:null,smallLists:false};

test('waiting findings use full published time bands and retain incomplete data',()=>{
  const national=waitingFacts([renal],null),ba=waitingFacts([renal],'BUENOS AIRES');
  assert.equal(national.total,renal.total);assert.equal(national.long,renal.seniority.filter(row=>['3~años','3~7años','7~10años','>10años'].includes(row.label)).reduce((sum,row)=>sum+row.value,0));
  assert.equal(ba.total,renal.province.find(row=>row.label==='BUENOS AIRES').value);assert.ok(ba.long>0);
  const incomplete={...renal,seniority:renal.seniority.slice(1)};
  assert.equal(waitingFacts([incomplete],null).long,null);
  const data={total:lists[0].total,lists,organs:lists.filter(row=>row.id!=='TOTAL').map(row=>({id:row.id,value:row.total}))};
  assert.match(waitingAnchor({data,selection,defaultView:true,missing:false,dialysis:31431,sex:'all'}),/población y un período distintos/);
  assert.match(diagnosisAnchor({total:10,diagnoses:[{label:'B',value:2},{label:'A',value:8}]},true,null),/A.*80,0%/);
  assert.match(diagnosisAnchor(undefined,true,null),/No hay diagnósticos publicados/);
});
test('displayed differences exactly subtract the rounded values shown in the table',()=>{
  assert.equal(roundedDifference(113.345,112.274,2),-1.08);
  assert.equal(roundedDifference(53.485,52.464,2),-1.03);
  assert.equal(roundedDifference(32.44,27.46,1),-4.9);
  assert.equal(roundedDifference(1.001,1.004,2),0);
  assert.equal(roundedDifference(null,2,2),null);
});


test('active diagnoses conserve the same list/province/age/sex totals as the map',()=>{
  const diagnoses=JSON.parse(readFileSync(new URL('../app/v2/current-diagnoses.generated.json',import.meta.url),'utf8'));
  assert.equal(diagnoses.date,snapshot.date);
  assert.equal(diagnoses.started,snapshot.started);
  for(const [key,entry] of Object.entries(diagnoses.rows)){
    const [list,province,age,sex]=key.split('|');
    const cohort=snapshot.cohorts[`${age}|${sex}`];
    if(province!=='ARGENTINA'&&cohort.missingProvinces.includes(province)){
      assert.equal(entry.total,null,key);continue;
    }
    const detail=cohort.lists.find(row=>row.id===list);
    const expected=province==='ARGENTINA'?detail.total:detail.province.find(row=>row.label===province).value;
    assert.equal(entry.total,expected,key);
    assert.equal(entry.diagnoses.reduce((sum,row)=>sum+row.value,0),expected,key);
  }
});

test('diagnosis and province findings describe active people in their selected scope',()=>{
  const diagnoses=JSON.parse(readFileSync(new URL('../app/v2/current-diagnoses.generated.json',import.meta.url),'utf8'));
  const entry=diagnoses.rows['RENAL|ARGENTINA|all|all'];
  const category=entry.diagnoses[0];
  const anchor=diagnosisAnchor(entry,true,null,category,'RENAL');
  assert.match(anchor,/inscripciones activas/);
  assert.doesNotMatch(anchor,/ingresos|lo que va de/);
  const data={total:lists[0].total,lists};
  const scoped=waitingAnchor({data,selection:{...selection,province:'BUENOS AIRES'},dimension:'organ',mapSnapshot:snapshot});
  assert.ok(scoped.includes(baValue()));
  function baValue(){return renal.province.find(row=>row.label==='BUENOS AIRES').value.toLocaleString('es-AR');}
});
