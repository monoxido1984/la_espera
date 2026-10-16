import test from 'node:test';
import assert from 'node:assert/strict';
import {introScrollLayout} from '../app/v2/intro-scroll-model.ts';
import {crowdProgress,sandScrollState} from '../app/v2/crowd-release-model.ts';

test('the opening clears before grains leave and the numeral copy waits for every arrival',()=>{
  for(let step=0;step<=100;step++){
    const progress=step/100,timeline=sandScrollState(progress,1),layout=introScrollLayout(progress,1000,800);
    if(timeline.elapsed>0)assert.equal(layout.openingOpacity,0);
    if(layout.numberOpacity>0)for(let i=0;i<9721;i++)assert.equal(crowdProgress(i,timeline.elapsed),1);
    assert.equal(layout.exit,0);
  }
});

test('the pinned scene holds, exits above the next chapter and reverses at the same positions',()=>{
  for(const height of [568,764,844]){
    const positions=[2,1.6,1,.8,.45,0].map(top=>introScrollLayout(1,top*height,height));
    assert.equal(positions[0].exit,0);assert.equal(positions[2].exit,0);
    for(const [i,top] of [2,1.6,1,.8,.45,0].entries()){
      assert.ok(positions[i].exit+height<=top*height+1e-8,'the outgoing viewport never crosses the next scene');
    }
    const reverse=[0,.45,.8,1,1.6,2].map(top=>introScrollLayout(1,top*height,height));
    assert.deepEqual(reverse,positions.toReversed());
  }
});
