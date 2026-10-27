import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {buildUniverseData} from '../app/v2/universe-model.ts';
import {mapUniverseData,describeMapDiscrepancy} from '../app/v2/map-demographics-model.ts';
const raw=name=>JSON.parse(readFileSync(new URL('../app/'+name,import.meta.url),'utf8'));
const original=buildUniverseData(raw('story-data.generated.json'),raw('history.generated.json'),raw('transplant-snapshot.generated.json'));
const snapshot=raw('v2/map-demographics.generated.json');
const source=readFileSync(new URL('../app/v2/linked-exploration.ts',import.meta.url),'utf8').replace("'./universe-model'",JSON.stringify(new URL('../app/v2/universe-model.ts',import.meta.url).href));
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {allWaiting,explorationGroups}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
test('nine demographic cohorts preserve provincial cells, opening snapshot and linked dot totals',()=>{
  const originalTotal=original.total;
  for(const age of ['all','menor18','18mas'])for(const sex of ['all','FEMENINO','MASCULINO']){
    const data=mapUniverseData(original,snapshot,age,sex);
    for(const dimension of ['organ','territory','seniority']){
      const groups=explorationGroups(data,dimension,allWaiting).groups;
      assert.equal(groups.reduce((sum,g)=>sum+g.value,0),data.total,`${age}/${sex}/${dimension}`);
      for(const group of groups)assert.equal(group.value,group.unitKeys.length);
    }
    assert.equal(data.history,original.history);
  }
  assert.equal(original.total,originalTotal);
  assert.equal(original.snapshot,'28/08/2026');
});
test('renal province, sex, age and seniority selections retain the jointly published counts',()=>{
  for(const age of ['all','menor18','18mas'])for(const sex of ['all','FEMENINO','MASCULINO']){
    const data=mapUniverseData(original,snapshot,age,sex),renal=data.lists.find(l=>l.id==='RENAL');
    for(const province of renal.seniorityByProvince){
      for(const band of province.items){
        const selection={...allWaiting,listId:'RENAL',province:province.province,seniority:band.label};
        for(const dimension of ['organ','territory','seniority'])assert.equal(explorationGroups(data,dimension,selection).groups.reduce((n,g)=>n+g.value,0),band.value);
      }
    }
  }
});
test('no-result provinces retain their map shape without a published rate, and the national discrepancy is retained',()=>{
  const children=mapUniverseData(original,snapshot,'menor18','FEMENINO');
  for(const name of snapshot.cohorts['menor18|FEMENINO'].missingProvinces){
    const row=children.lists.find(l=>l.id==='TOTAL').province.find(p=>p.label===name);
    assert.ok(row);assert.equal(row.value,0);assert.equal(row.pmh,undefined);
  }
  const all=mapUniverseData(original,snapshot,'all','all');
  assert.equal(snapshot.date,'27/10/2026');
  assert.equal(all.total,9641);assert.equal(snapshot.cohorts['all|all'].nationalTotal,9642);
  assert.ok(all.lists.every(l=>l.province.every(p=>Number.isFinite(p.pmh))));
  const discrepancy=snapshot.discrepancies.find(row=>row.kind==='provincias_vs_nacional'&&row.scope==='all|all|CORNEAS');
  assert.ok(discrepancy);assert.equal(discrepancy.observed,2190);assert.equal(discrepancy.expected,2191);
  assert.ok(describeMapDiscrepancy(discrepancy).includes('2190'));
});

 test('current PMH reuses exact 2026 denominators for all jointly observed selections',()=>{
  const population=raw('v2/population-2026.json');
  assert.equal(Object.values(population.provinces).reduce((a,b)=>a+b,0),46466688);
  for(const age of ['all','menor18','18mas'])for(const sex of ['all','FEMENINO','MASCULINO']){
   const data=mapUniverseData(original,snapshot,age,sex);
   for(const selection of [allWaiting,{...allWaiting,listId:'RENAL'},{...allWaiting,listId:'RENAL',seniority:'1~2años'}]){
    for(const group of explorationGroups(data,'territory',selection).groups){
     assert.equal(group.pmh,group.value/population.provinces[group.sourceKey]*1000000);
    }
   }
  }
  assert.ok(snapshot.cohorts['all|all'].lists.every(l=>l.province.every(p=>p.pmh===undefined)),'source is not mutated');
 });

test('male and female time distributions use their own published provincial cells',()=>{
 for(const age of ['all','menor18','18mas'])for(const sex of ['FEMENINO','MASCULINO']){
  const current=mapUniverseData(original,snapshot,age,sex);
  const selection={...allWaiting,listId:'RENAL',province:'CORDOBA'};
  const observed=snapshot.cohorts[age+'|'+sex].lists.find(l=>l.id==='RENAL').seniorityByProvince.find(p=>p.province==='CORDOBA').items;
  const result=explorationGroups(current,'seniority',selection);
  for(const row of observed)assert.equal(result.groups.find(g=>g.sourceKey===row.label).value,row.value);
  assert.equal(result.groups.reduce((n,g)=>n+g.value,0),observed.reduce((n,g)=>n+g.value,0));
 }
});
