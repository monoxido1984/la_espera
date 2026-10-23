import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const file=n=>new URL('../app/v2/'+n,import.meta.url);
const data=JSON.parse(readFileSync(file('annual-flows.generated.json'),'utf8'));
const module=ts.transpileModule(readFileSync(file('annual-flow-model.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {selectFlow,flowGroups}=await import('data:text/javascript;base64,'+Buffer.from(module).toString('base64'));
test('renal exits are counted once, categories preserve all source causes',()=>{
  for(const row of data.lists.RENAL.filter(r=>r.exits!==null)){
    assert.equal(row.causes.reduce((s,c)=>s+c.value,0),row.exits);
    assert.equal(flowGroups(row.causes).reduce((s,c)=>s+c.value,0),row.exits);
  }
  const r=selectFlow(data,'RENAL',2025,null,'all');
  assert.equal(r.entries,2559);assert.equal(r.exits,2388);assert.equal(r.residual,-86);
  assert.deepEqual(flowGroups(r.causes).map(r=>r.value),[1524,225,429,210]);
});
test('missing age, province exits and July never inherit national annual exits',()=>{
  assert.equal(selectFlow(data,'RENAL',2025,'CORDOBA','all').exits,null);
  assert.equal(selectFlow(data,'RENAL',2025,'CORDOBA','all').causes.length,0);
  assert.equal(selectFlow(data,'RENAL',2025,null,'menor_18'),null);
  assert.equal(selectFlow(data,'RENAL',2026,null,'all'),null);
  assert.equal(selectFlow(data,'CORNEAS',2004,null,'all'),null);
});
test('renal history covers 2005 to 2025 without inventing an opening stock for 2005',()=>{
  assert.deepEqual(data.lists.RENAL.filter(r=>r.exits!==null).map(r=>r.year),Array.from({length:21},(_,i)=>2005+i));
  const r=selectFlow(data,'RENAL',2005,null,'all');
  assert.equal(r.entries,1116);assert.equal(r.exits,1178);assert.equal(r.residual,null);
  assert.deepEqual(flowGroups(r.causes).map(c=>c.value),[594,132,256,196]);
});
test('other-list pilots preserve observed 2025 totals and unpublished results',()=>{
  const expected={CORNEAS:2815,HEPATICA:933,CARDIACA:181,PULMONAR:94,RENOPANCREATICA:68,ESCLERAS:167,HEPATORRENAL:36,CARDIOPULMONAR:1,CARDIORRENAL:5};
  for(const [list,total] of Object.entries(expected)){
    const r=selectFlow(data,list,2025,null,'all');
    assert.equal(r.exits,total);assert.equal(flowGroups(r.causes).reduce((s,c)=>s+c.value,0),total);
  }
  for(const list of ['CARDIOHEPATICA','HEPATOINTESTINAL','HEPATOPANCREATICA'])assert.equal(selectFlow(data,list,2025,null,'all').exits,null);
});
test('all thirteen annual lists have an acquired report or explicit published absence for 2005-2025',()=>{
  assert.equal(Object.keys(data.lists).length,13);
  for(const [list,rows] of Object.entries(data.lists)){
    assert.equal(rows.length,21,list);
    for(const r of rows){
      assert.ok(['publicado','sin_resultado_publicado'].includes(r.exitsState),`${list} ${r.year}: pendiente`);
      if(r.exitsState==='sin_resultado_publicado'){assert.equal(r.exits,null);assert.deepEqual(r.causes,[]);}
      else assert.equal(r.causes.reduce((sum,c)=>sum+c.value,0),r.exits);
    }
  }
});

test('Corneas 2017 distinguishes the grouped subtotal from individual repeated cause labels',()=>{
  const r=selectFlow(data,'CORNEAS',2017,null,'all');
  const groups=flowGroups(r.causes),other=groups[3];
  assert.equal(other.value,1143);
  assert.equal(other.rawItems.find(c=>c.label==='ABANDONO DE LOS CONTROLES POR VOLUNTAD DEL PACIENTE').value,165);
  assert.equal(other.rawItems.filter(c=>c.label==='OTRA CAUSA').reduce((s,c)=>s+c.value,0),124);
  assert.equal(other.rawItems.find(c=>c.label==='TRASPLANTE CON CORNEA DEL EXTERIOR').value,620);
  for(const g of groups)assert.equal(g.items.reduce((s,c)=>s+c.value,0),g.value);
  assert.equal(groups.flatMap(g=>g.rawItems).length,r.causes.length);
  assert.equal(groups.reduce((s,g)=>s+g.value,0),2263);
});

test('every source group matches the published subtotal and standard names never repeat within it',()=>{
  for(const rows of Object.values(data.lists))for(const row of rows){
    if(row.exits===null)continue;
    const groups=flowGroups(row.causes);
    for(const g of groups){
      assert.equal(g.value,row.publishedGroups[g.id]);
      assert.equal(g.items.reduce((s,c)=>s+c.value,0),g.value);
      assert.equal(new Set(g.items.map(c=>c.canonicalId)).size,g.items.length);
      assert.equal(g.label,data.groups.find(r=>r.id===g.id).label);
    }
    assert.equal(groups.reduce((s,c)=>s+c.value,0),row.exits);
  }
  const other=flowGroups(selectFlow(data,'CORNEAS',2017,null,'all').causes)[3];
  const unspecified=other.items.find(c=>c.label==='Otros motivos no especificados');
  assert.equal(unspecified.value,124);assert.deepEqual(unspecified.sourceCodes,['21','79']);
});
