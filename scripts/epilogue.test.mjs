import test from 'node:test';
import assert from 'node:assert/strict';
import {epiloguePoints,epiloguePosition,thresholdPoints} from '../app/v2/epilogue-model.ts';

test('the epilogue reunites every mark at a distinct position inside desktop and mobile bounds',()=>{
  for(const [width,height] of [[720,560],[320,360]]){
    const points=epiloguePoints(9649,width,height);
    assert.equal(points.length,9649);
    assert.equal(new Set(points.map(point=>point.to.x+','+point.to.y)).size,9649);
    points.forEach((point,index)=>{
      const start=epiloguePosition(index,0,point.from,point.to),end=epiloguePosition(index,1,point.from,point.to);
      assert.deepEqual(start,point.from);
      assert.ok(Math.abs(end.x-point.to.x)<1e-8&&Math.abs(end.y-point.to.y)<1e-8);
      for(const position of [start,end])assert.ok(position.x>=0&&position.x<=width&&position.y>=0&&position.y<=height);
    });
  }
  assert.deepEqual(epiloguePoints(0,320,360),[]);
});

test('closing choreography preserves supplied numeral and letter positions',()=>{
const origins=[{x:1,y:2},{x:3,y:4}],targets=[{x:10,y:20},{x:30,y:40}];
const points=epiloguePoints(2,100,100,targets,origins);
points.forEach((point,i)=>{assert.deepEqual(point.from,origins[i]);assert.deepEqual(epiloguePosition(i,1,point.from,point.to),targets[i]);});
});

test('the open threshold keeps every point inside desktop and mobile bounds without filling its opening',()=>{
for(const [w,h] of [[720,560],[320,360]]){
 const points=thresholdPoints(9641,w,h);assert.equal(points.length,9641);assert.equal(new Set(points.map(p=>p.x+','+p.y)).size,9641);
 assert.ok(points.every(p=>p.x>=0&&p.x<=w&&p.y>=0&&p.y<=h));
 assert.ok(points.every(p=>!(p.x>w*.42&&p.x<w*.58&&p.y>h*.5&&p.y<h*.8)));
}
assert.deepEqual(thresholdPoints(0,320,360),[]);
});
