import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
import {buildUniverseData} from '../app/v2/universe-model.ts';
const raw=name=>JSON.parse(readFileSync(new URL('../app/'+name,import.meta.url),'utf8'));
const data=buildUniverseData(raw('story-data.generated.json'),raw('history.generated.json'));
const source=readFileSync(new URL('../app/v2/linked-exploration.ts',import.meta.url),'utf8').replace("'./universe-model'",JSON.stringify(new URL('../app/v2/universe-model.ts',import.meta.url).href));
const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {allWaiting,explorationGroups,selectExploration,identifyDots,alignGraphicUnits,OTHER_LISTS,UNAVAILABLE}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const sum=groups=>groups.reduce((n,g)=>n+g.value,0);
const keys=groups=>groups.flatMap(g=>g.unitKeys).sort();
const group=(selection,dimension,key)=>explorationGroups(data,dimension,selection).groups.find(g=>g.sourceKey===key||g.id===key);
const band=data.lists.find(l=>l.id==='RENAL').seniority.find(row=>row.label.startsWith('3~7')).label;

test('small lists collapse to one exact group and expand without losing categories or units',()=>{
  const initial=explorationGroups(data,'organ',allWaiting).groups;
  assert.equal(initial.length,7);
  assert.equal(sum(initial),9721);
  const other=initial.find(g=>g.id===OTHER_LISTS);
  assert.equal(other.value,115);
  assert.equal(other.members.length,7);
  const expanded=selectExploration(allWaiting,'organ',other);
  assert.equal(expanded.dimension,'organ');
  const details=explorationGroups(data,'organ',expanded.selection).groups;
  assert.equal(details.length,7);
  assert.equal(sum(details),115);
  assert.deepEqual(keys(details),other.unitKeys.toSorted());
});

test('organ opens province and joint filters retain exact units in both directions',()=>{
  const renal=group(allWaiting,'organ','RENAL');
  const first=selectExploration(allWaiting,'organ',renal);
  assert.equal(first.dimension,'territory');
  assert.equal(sum(explorationGroups(data,first.dimension,first.selection).groups),5638);
  const second=selectExploration(first.selection,'seniority',group(first.selection,'seniority',band));
  assert.equal(second.dimension,'territory');
  const third=selectExploration(second.selection,'territory',group(second.selection,'territory','CORDOBA'));
  assert.equal(third.dimension,'organ');
  assert.deepEqual(third.selection,{...allWaiting,listId:'RENAL',province:'CORDOBA',seniority:band});
  for(const dimension of ['organ','seniority','territory']) assert.equal(sum(explorationGroups(data,dimension,third.selection).groups),107);
  const sets=['organ','seniority','territory'].map(d=>keys(explorationGroups(data,d,third.selection).groups));
  assert.deepEqual(sets[0],sets[1]);assert.deepEqual(sets[1],sets[2]);
  const remove=selectExploration(third.selection,'organ',group(third.selection,'organ','RENAL'));
  assert.equal(remove.selection.listId,null);
  assert.equal(remove.selection.province,'CORDOBA');assert.equal(remove.selection.seniority,band);
  const expected=data.lists.find(l=>l.id==='TOTAL').seniorityByProvince.find(p=>p.province==='CORDOBA').items.find(i=>i.label===band).value;
  assert.equal(sum(explorationGroups(data,'organ',remove.selection).groups),expected);
});

test('published cells keep their exact counts for every available list/province/time crossing',()=>{
  for(const list of data.lists.filter(l=>l.id!=='TOTAL')) for(const p of list.seniorityByProvince??[]) for(const row of p.items) {
    const selection={...allWaiting,listId:list.id,province:p.province,seniority:row.label};
    for(const dimension of ['organ','seniority','territory']) {
      const result=explorationGroups(data,dimension,selection);
      assert.equal(result.unavailable,false);
      assert.equal(sum(result.groups),row.value,`${list.id}/${p.province}/${row.label}/${dimension}`);
      assert.equal(keys(result.groups).length,row.value);
      assert.equal(new Set(keys(result.groups)).size,row.value);
    }
  }
});

test('unpublished time stays unavailable, explicit zeros stay zero, and missing-list residuals are never apportioned',()=>{
  const missing={...allWaiting,listId:'HEPATORENAL'};
  const missingAge=explorationGroups(data,'seniority',missing).groups.find(g=>g.kind==='unavailable');
  assert.equal(missingAge.value,14);
  assert.equal(selectExploration(missing,'seniority',missingAge).dimension,'territory');
  assert.equal(explorationGroups(data,'organ',{...missing,seniority:band}).unavailable,true);
  const zero={...missing,province:'SALTA'};
  assert.equal(sum(explorationGroups(data,'territory',zero).groups),0);
  const residual=explorationGroups(data,'organ',{...allWaiting,smallLists:true,seniority:band}).groups.find(g=>g.id===UNAVAILABLE);
  assert.equal(residual.value,4);
  assert.equal(residual.kind,'unavailable');
  for(const p of data.lists.find(l=>l.id==='TOTAL').province) {
    let remainder=0;
    for(const age of data.lists.find(l=>l.id==='TOTAL').seniority) remainder+=explorationGroups(data,'organ',{...allWaiting,smallLists:true,province:p.label,seniority:age.label}).groups.find(g=>g.id===UNAVAILABLE)?.value??0;
    const unavailable=data.lists.filter(l=>['HEPATORENAL','CARDIORENAL'].includes(l.id)).reduce((n,l)=>n+l.province.find(row=>row.label===p.label).value,0);
    assert.equal(remainder,unavailable,'joint-cell remainder matches known undistributed lists in '+p.label);
  }
});

test('PMH is retained for a list and withheld for unsupported time or grouped-list rates',()=>{
  assert.equal(group({...allWaiting,listId:'RENAL'},'territory','BUENOS AIRES').pmh,130.5);
  assert.equal(group({...allWaiting,listId:'RENAL',seniority:band},'territory','BUENOS AIRES').pmh,undefined);
  assert.equal(group({...allWaiting,smallLists:true},'territory','BUENOS AIRES').pmh,undefined);
});

test('surviving graphic units move from their own positions when a subset reorganizes',()=>{
  const selection={...allWaiting,listId:'RENAL'};
  const all=explorationGroups(data,'seniority',selection).groups;
  const dots=groups=>identifyDots(groups.flatMap(g=>Array.from({length:g.value},(_,i)=>({x:i,y:1,radius:1,color:g.color,group:g.id}))),groups);
  const previous=dots(all);
  const selected=explorationGroups(data,'territory',{...selection,seniority:band,province:'CORDOBA'}).groups;
  const target=dots(selected);
  const pairs=alignGraphicUnits(previous,target);
  assert.equal(target.length,107);
  assert.equal(pairs.filter(p=>p.to).length,107);
  assert.equal(pairs.filter(p=>!p.to).length,5638-107);
  for(const pair of pairs.filter(p=>p.to)) {assert.ok(pair.from);assert.equal(pair.from.key,pair.to.key);}
});


test('expanding filtered smaller lists also preserves the unallocated time residual',()=>{
  const selection={...allWaiting,province:'CORDOBA',seniority:band};
  const other=group(selection,'organ',OTHER_LISTS);
  const expanded=selectExploration(selection,'organ',other);
  const details=explorationGroups(data,'organ',expanded.selection).groups;
  assert.equal(other.value,5);
  assert.equal(sum(details),other.value);
  assert.deepEqual(keys(details),other.unitKeys.toSorted());
});
