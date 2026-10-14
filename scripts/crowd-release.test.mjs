import test from 'node:test';
import assert from 'node:assert/strict';
import {crowdOrder,crowdProgress,crowdPosition,sandScrollState} from '../app/v2/crowd-release-model.ts';

test('scroll rewinds the same grains and paths without a completion latch',()=>{
  const forward=[0,120,300,500,800,1000].map(y=>sandScrollState(y,1000));
  const reverse=[1000,800,500,300,120,0].map(y=>sandScrollState(y,1000));
  assert.deepEqual(reverse,forward.toReversed());
  assert.deepEqual(sandScrollState(-100,1000),forward[0]);
  assert.deepEqual(sandScrollState(1200,1000),forward.at(-1));
  const from={x:450,y:200},to={x:150,y:550};
  for(let i=0;i<100;i++){
    const positions=forward.map(t=>crowdPosition(i,crowdProgress(i,t.elapsed),from,to,700,700));
    const back=reverse.map(t=>crowdPosition(i,crowdProgress(i,t.elapsed),from,to,700,700));
    assert.deepEqual(back,positions.toReversed());
    assert.deepEqual(positions[0],from);assert.deepEqual(positions.at(-1),to);
  }
});
test('destinations form an exact dispersed permutation, with independently timed arrivals',()=>{
  const order=crowdOrder(9721);assert.equal(new Set(order).size,9721);assert.equal(Math.min(...order),0);assert.equal(Math.max(...order),9720);
  assert.deepEqual(order,crowdOrder(9721));assert.ok(order.slice(0,50).some(v=>v>9000));assert.ok(order.slice(0,50).some(v=>v<500));
  const atFour=order.map((_,i)=>crowdProgress(i,4));
  assert.ok(atFour.some(v=>v===0));assert.ok(atFour.some(v=>v===1));assert.ok(atFour.some(v=>v>0&&v<1));
  assert.ok(order.every((_,i)=>crowdProgress(i,16)===1));
});
test('each path leaves the base through the door and settles at its own destination within the canvas',()=>{
  for(const [w,h] of [[331,388],[700,657]])for(let i=0;i<100;i++){
    const from={x:w*.65,y:h*.34},to={x:w*(.08+(i%10)*.09),y:h*(.67+(i%4)*.04)};
    assert.deepEqual(crowdPosition(i,0,from,to,w,h),from);assert.deepEqual(crowdPosition(i,1,from,to,w,h),to);
    for(let p=0;p<=1;p+=.05){const v=crowdPosition(i,p,from,to,w,h);assert.ok(Number.isFinite(v.x)&&Number.isFinite(v.y));assert.ok(v.x>=0&&v.x<=w&&v.y>=0&&v.y<=h);}
  }
});
