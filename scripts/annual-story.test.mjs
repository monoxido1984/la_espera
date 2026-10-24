import test from 'node:test';
import assert from 'node:assert/strict';
import {annualMovementFrame,annualStoryLayout,historyTime} from '../app/v2/annual-story-model.ts';
const groups=[{value:4,color:'#0052cc'},{value:2,color:'#008a3b'},{value:3,color:'#d60036'},{value:1,color:'#7400bd'}];
const history=[{year:2005,waitlist:100,average:40,median:12,p75:12,partial:false},{year:2006,waitlist:null,average:null,median:null,p75:null,partial:false},{year:2007,waitlist:250,average:50,median:18,p75:18,partial:false}];
const config={entries:20,exits:10,groups,maximum:250,history,metric:'stock'};
test('narrative moments retain the same mark identities and never compute a closing stock',()=>{
 const layouts=['movements','causes','history'].map(moment=>annualStoryLayout({...config,moment}));
 for(const dots of layouts){assert.equal(dots.length,30);assert.equal(new Set(dots.map(d=>d.id)).size,30);for(const d of dots)assert.ok(d.x>=0&&d.x<=600&&d.y>=0&&d.y<=360&&Number.isFinite(d.r));}
 assert.deepEqual(layouts[0].map(d=>d.id),layouts[1].map(d=>d.id));assert.deepEqual(layouts[1].map(d=>d.id),layouts[2].map(d=>d.id));
 assert.equal(layouts[0].filter(d=>d.alpha>0&&d.id.startsWith('in-')).length,20);
 assert.equal(layouts[0].filter(d=>d.alpha>0&&d.id.startsWith('out-')).length,10);
 assert.ok(layouts[0].filter(d=>d.id.startsWith('in-')).every(d=>d.x<250));
 assert.ok(layouts[0].filter(d=>d.id.startsWith('out-')).every(d=>d.x>350));
 // Published stock is never manufactured from entries - exits.
 assert.equal(layouts[0].filter(d=>d.alpha>0).length,config.entries+config.exits);
 assert.equal(layouts[1].filter(d=>d.alpha>0).length,10);
 for(const g of groups)assert.equal(layouts[1].filter(d=>d.alpha>0&&d.color===g.color).length,g.value);
 assert.equal(layouts[2].filter(d=>d.alpha>0).length,2,'the missing year never becomes a zero marker');
 assert.ok(layouts[2].filter(d=>d.alpha>0).every(d=>d.id.startsWith('out-')));
});
test('missing exits, explicit zeros, partial years and absent means stay distinct',()=>{
 const noExits=annualStoryLayout({...config,moment:'causes',exits:null,groups:[]});assert.ok(noExits.every(d=>d.alpha===0));
 assert.deepEqual(annualStoryLayout({...config,moment:'movements',entries:0,exits:0,groups:[]}),[]);
 const rows=[...history,{year:2026,waitlist:1000,average:1000,median:1000,p75:1000,partial:true}];
 const time=annualStoryLayout({...config,history:rows,metric:'time',moment:'history'}).filter(d=>d.alpha>0);assert.equal(time.length,2);assert.equal(time[1].x,96);assert.equal(time[1].y,60);
 const zero=annualStoryLayout({...config,history:[{year:2005,waitlist:0,average:null,median:null,p75:null,partial:false}],moment:'history'}).filter(d=>d.alpha>0);assert.equal(zero.length,1);assert.equal(zero[0].y,285);
});

test('central animation adds and subtracts without substituting the observed closing stock',()=>{
 const args={previous:100,current:117,entries:30,exits:20,maximum:200};
 const first=annualMovementFrame({...args,progress:0}),middle=annualMovementFrame({...args,progress:.45}),last=annualMovementFrame({...args,progress:1});
 assert.equal(first.count,100);assert.ok(middle.count>=100&&middle.count<=130);assert.equal(last.count,110);assert.notEqual(last.count,args.current);
 assert.equal(first.dots.length,130);assert.deepEqual(first.dots.map(d=>d.id),last.dots.map(d=>d.id));
 assert.equal(last.dots.filter(d=>d.x>400).length,20);assert.equal(last.dots.filter(d=>d.x>200&&d.x<400).length,110);
 for(let i=0;i<=100;i++)for(const dot of annualMovementFrame({...args,progress:i/100}).dots)assert.ok(dot.x>=0&&dot.x<=600&&dot.y>=0&&dot.y<=360);
});
test('incomplete movements and impossible arithmetic use the available published stock without animation',()=>{
 for(const missing of [{previous:null},{entries:null},{exits:null},{previous:1,entries:1,exits:20}]){
  const state=annualMovementFrame({previous:100,current:117,entries:30,exits:20,maximum:200,progress:.5,...missing});
  assert.equal(state.valid,false);assert.equal(state.count,117);
 }
 const zero=annualMovementFrame({previous:0,current:0,entries:0,exits:0,maximum:1,progress:1});assert.equal(zero.valid,true);assert.equal(zero.count,0);assert.deepEqual(zero.dots,[]);
});

test('time history prioritizes median and falls back to mean without fabricating a band',()=>{
 assert.deepEqual(historyTime({median:0,average:10}),{value:0,kind:'median'});
 assert.deepEqual(historyTime({median:null,average:12.4}),{value:12.4,kind:'mean'});
 assert.deepEqual(historyTime({median:null,average:null}),{value:null,kind:'mean'});
 const dots=annualStoryLayout({...config,moment:'history',metric:'time',history:[{year:2005,waitlist:100,average:12.4,median:null,p75:null,partial:false}]}).filter(dot=>dot.alpha>0);
 assert.equal(dots.length,1);assert.equal(dots[0].y,60);
});

test('entries and exits overlap; blue list marks become purple when departing',()=>{
 const args={previous:100,current:117,entries:30,exits:20,maximum:200};
 const initial=annualMovementFrame({...args,progress:0});
 const originalDepartures=initial.dots.filter(dot=>dot.id.startsWith('out-'));
 assert.equal(originalDepartures.length,20);assert.ok(originalDepartures.every(dot=>dot.color==='#0052cc'&&dot.x>200&&dot.x<400));
 const simultaneous=annualMovementFrame({...args,progress:.1});
 assert.ok(simultaneous.dots.some(dot=>dot.color==='#b74d38'&&dot.x>150&&dot.x<245),'incoming marks are in flight');
 assert.ok(simultaneous.dots.some(dot=>dot.color==='#7400bd'&&dot.x>350&&dot.x<435),'outgoing marks are in flight at the same time');
 const last=annualMovementFrame({...args,progress:1});
 assert.ok(last.dots.filter(dot=>dot.id.startsWith('out-')).every(dot=>dot.color==='#7400bd'));
 assert.ok(last.dots.filter(dot=>!dot.id.startsWith('out-')).every(dot=>dot.color==='#0052cc'));
 assert.equal(last.dots.filter(dot=>dot.x>400).length,20);
 const short={...args,previous:5,entries:30,exits:20};
 for(let step=0;step<=100;step++)assert.ok(annualMovementFrame({...short,progress:step/100}).count>=0,'an incoming mark cannot leave before arriving');
 const continued=annualMovementFrame({...short,progress:1});assert.equal(continued.count,15);assert.equal(continued.dots.filter(dot=>dot.x>400).length,20);
});
