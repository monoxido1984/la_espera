import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { buildUniverseData, groupsFor, territoryColors } from '../app/v2/universe-model.ts';
const source = name => readFileSync(new URL('../app/v2/' + name, import.meta.url), 'utf8');
const transpile = text => 'data:text/javascript;base64,' + Buffer.from(ts.transpileModule(text, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText).toString('base64');
const resolveData = text => text.replace("'./universe-model'", JSON.stringify(new URL('../app/v2/universe-model.ts', import.meta.url).href)).replace("'./province-shapes.generated'", JSON.stringify(new URL('../app/v2/province-shapes.generated.ts', import.meta.url).href));
const cartogramURL = transpile(resolveData(source('territory-cartogram.ts')));
const { cartogramWarp, inRing } = await import(cartogramURL);
const layoutURL = transpile(resolveData(source('narrative-layouts.ts')).replace("'./territory-cartogram'", JSON.stringify(cartogramURL)));
const { narrativeLayout, hourglassPoints, timePoints, foldedTimePoints } = await import(layoutURL);
const read = name => JSON.parse(readFileSync(new URL('../app/' + name, import.meta.url)));
const data = buildUniverseData(read('story-data.generated.json'), read('history.generated.json'));
test('narrative silhouettes, map and ordered time bands keep exact group counts and finite coordinates', () => {
  for (const [width, height] of [[700,520],[346,450],[346,330],[276,250]]) for (const dimension of ['organ','territory','seniority']) {
    const groups = groupsFor(data, dimension, null);
    const { points } = narrativeLayout(groups, dimension, width, height, false, .8);
    assert.equal(points.length, data.total);
    for (const group of groups) assert.equal(points.filter(p => p.group === group.id).length, group.value);
    for (const p of points) assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y) && p.x >= 0 && p.x <= width && p.y >= 0 && p.y <= height);
  }
});
test('sand and time aggregation preserve every unit and do not create new people', () => {
  for (const phase of [0,.5,1,1.08]) assert.equal(hourglassPoints(data.total,700,520,phase,.8).length, data.total);
  const latest = data.history.at(-1), dialysis = read('dialysis-history.generated.json').at(-1);
  assert.equal(latest.year, dialysis.year);
  assert.equal(latest.n, dialysis.n, 'Comparison must disclose equal published recipient counts');
  for (const accumulated of [false,true]) assert.equal(timePoints(latest.n,700,520,accumulated,latest.average/dialysis.average,.8).length, latest.n);
});

test('folded time ribbons preserve units and remain inside desktop, notebook and mobile bounds',()=>{
  for(const [width,height] of [[700,520],[500,520],[331,360]]) for(const folds of [2,3,4,5,6,7,12]) for(const extent of [.12,.42,1]) {
    for(const count of [1,1542,9000]) {
      const points=foldedTimePoints(count,width,height,extent,1,folds);
      assert.equal(points.length,count);
      for(const p of points) assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=0&&p.x<=width&&p.y>=0&&p.y<=height);
    }
  }
});

test('editorial map keeps exact inscriptions and fixed geometry between count and PMH', () => {
  const groups=groupsFor(data,'territory',null);
  assert.equal(groups.find(g=>g.label==='Buenos Aires').pmh,266.4);
  const count=narrativeLayout(groups,'territory',700,520,false,.8,'count');
  const pmh=narrativeLayout(groups,'territory',700,520,false,.8,'pmh');
  assert.deepEqual(count.points.map(p=>p.group),pmh.points.map(p=>p.group));
  assert.deepEqual(count.points.map(p=>[p.x,p.y]),pmh.points.map(p=>[p.x,p.y]));
  assert.deepEqual(count.borders.map(b=>b.path),pmh.borders.map(b=>b.path));
  for (const metric of ['count','pmh']) {
    const warp=cartogramWarp(groups,metric);
    for (let lat=-55;lat<-22;lat+=2) for (let lon=-73;lon<-54;lon+=1) {
      assert.ok(warp(lon+.1,lat)[0]>warp(lon,lat)[0], 'no horizontal folding');
      assert.ok(warp(lon,lat-.1)[1]>warp(lon,lat)[1], 'no vertical folding');
    }
    const layout=metric==='count'?count:pmh;
    assert.equal(layout.points.length,9721);
    assert.equal(layout.borders.length,24);
    for (const label of ['Salta','Santa Fe','Misiones']) {
      const group=groups.find(g=>g.label===label);
      const border=layout.borders.find(b=>b.id===group.id);
      const points=layout.points.filter(p=>p.group===group.id);
      assert.equal(points.length,group.value);
      // Slight subpixel contour discretization at the coastline is tolerated.
      for (const p of points) assert.ok(border.rings.some(r=>inRing(p.x,p.y,r)) || border.rings.some(r=>r.some(v=>Math.hypot(p.x-v[0],p.y-v[1])<.75)),label);
    }
  }
});

test('both cartogram metrics fit every list on mobile and retain exact zero/missing data semantics', () => {
  for (const list of data.lists) for (const metric of ['count','pmh']) {
    const groups=groupsFor(data,'territory',list.id);
    const layout=narrativeLayout(groups,'territory',276,250,false,.6,metric);
    assert.equal(layout.points.length,list.total);
    for (const p of layout.points) assert.ok(p.x>=0 && p.x<=276 && p.y>=0 && p.y<=250);
  }
  const missing=[{id:'x',label:'Salta',value:3,color:'#77796f'}];
  assert.equal(narrativeLayout(missing,'territory',276,250,false,.6,'pmh').points.length,3);
  assert.equal(missing[0].pmh,undefined);
});


test('PMH color follows the published rate independently of the number of points', () => {
  const groups=territoryColors(groupsFor(data,'territory',null),'pmh');
  const ba=groups.find(g=>g.label==='Buenos Aires'), lp=groups.find(g=>g.label==='La Pampa');
  assert.ok(ba.value>lp.value);
  assert.ok(lp.pmh>ba.pmh);
  assert.ok(parseInt(lp.color.slice(1,3),16)<parseInt(ba.color.slice(1,3),16),'higher rate uses a darker fill');
  const layout=narrativeLayout(groups,'territory',700,520,false,.8,'pmh');
  assert.ok(layout.points.every(p=>p.color==='#32131a'));
  assert.equal(layout.borders.find(b=>b.id===lp.id).fill,lp.color);
  const missing=territoryColors([{id:'missing',label:'Salta',value:2,color:'#000000'}],'pmh')[0];
  assert.equal(missing.pmh,undefined);
  assert.equal(missing.color,'#77796f');
  for (const list of data.lists) {
    const rawList=read('story-data.generated.json').currentSnapshot.byList.find(x=>x.id===list.id);
    assert.deepEqual(groupsFor(data,'territory',list.id).map(g=>g.pmh),rawList.province.map(g=>g.pmh));
  }
});

test('the editorial map has no internal Catamarca gap and Malvinas add no statistical units',()=>{
  for(const [width,height] of [[700,520],[276,250]]){
    const groups=groupsFor(data,'territory',null),map=narrativeLayout(groups,'territory',width,height,false,.8);
    const scale=Math.min(width*.78/12,height*.87/27),project=([x,y])=>[width*.5+(x-6)*scale,height*.04+y*scale];
    const formerHole=project([4.53,7.13]);
    assert.ok(map.borders.some(b=>b.rings.some(r=>inRing(...formerHole,r))));
    assert.ok(map.islands.path.includes('Z M'));
    const fuegian=groups.find(g=>g.label==='Tierra Del Fuego');
    assert.equal(map.islands.group,fuegian.id);
    assert.equal(map.islands.fill,fuegian.color);
    assert.ok(map.islands.x>0&&map.islands.x<width&&map.islands.y<height);
    assert.equal(map.points.length,9721);
    assert.equal(map.clusters.length,24);
    assert.equal(narrativeLayout([groups[0]],'territory',width,height,true,.8).islands,undefined);
  }
  for(const metric of ['count','pmh']){
    const groups=territoryColors(groupsFor(data,'territory',null),metric);
    const red=groups.map(g=>parseInt(g.color.slice(1,3),16));
    assert.ok(Math.max(...red)-Math.min(...red)>100,'wide color range in both published metrics');
  }
});
