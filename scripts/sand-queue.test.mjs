import test from 'node:test';
import assert from 'node:assert/strict';
import {sandQueueState,queuePosition,QUEUE_GRAINS} from '../app/v2/sand-queue-model.ts';
test('every inscription is in the clock, in the single queue or settled in the numeral',()=>{
  let previous=0;
  for(let step=0;step<=1000;step++){
    const s=sandQueueState(9721,step/1000);
    assert.equal(s.settled+s.flowing+s.waiting,9721);
    assert.ok(s.settled>=previous);assert.ok(s.flowing>=0&&s.flowing<=QUEUE_GRAINS);assert.ok(s.waiting>=0);
    previous=s.settled;
  }
  assert.equal(sandQueueState(9721,1).settled,9721);
  assert.equal(sandQueueState(9721,1).flowing,0);
  assert.equal(sandQueueState(9721,1).waiting,0);
});
test('the queue descends continuously from the clock outlet into every numeral destination',()=>{
  for(const [w,h] of [[331,388],[700,657]])for(const x of [w*.05,w*.5,w*.95]){
    const target={x,y:h*.8};let previousY=0;
    for(let i=0;i<=100;i++){
      const p=queuePosition(i/100,w,h,target);
      assert.ok(p.y>=previousY);assert.ok(p.x>=0&&p.x<=w&&p.y<=h);previousY=p.y;
    }
    assert.deepEqual(queuePosition(1,w,h,target),target);
  }
});
