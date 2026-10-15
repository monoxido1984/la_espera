import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {annualTrend} from '../app/v2/annual-trend-model.ts';
const history=JSON.parse(readFileSync(new URL('../app/history.generated.json',import.meta.url),'utf8'));

test('annual traces keep each observed value, end at the selected year and rewind without future points',()=>{
  const forward=[];
  for(const {year} of history){
    const paths={};
    for(const metric of ['waitlist','donors','average']){
      paths[metric]=annualTrend(history,year,metric,700,520,.48);
      assert.equal(paths[metric].at(-1).year,year);
      assert.deepEqual(paths[metric].map(p=>p.value),history.filter(r=>r.year<=year).map(r=>r[metric]));
      for(const p of paths[metric])assert.ok(p.x>=0&&p.x<=700&&p.y>=0&&p.y<=520);
    }
    forward.push(paths);
  }
  const backward=history.toReversed().map(({year})=>Object.fromEntries(['waitlist','donors','average'].map(metric=>[metric,annualTrend(history,year,metric,700,520,.48)])));
  assert.deepEqual(backward,forward.toReversed());
  const donors=annualTrend(history,2020,'donors',700,520,.74);
  assert.ok(donors.at(-1).value<donors.at(-2).value);
  assert.ok(donors.at(-1).y>donors.at(-2).y,'observed decline is displayed, not forced');
  const wait=annualTrend(history,2025,'average',700,520,.48);
  assert.equal(wait[0].value,51.24);assert.equal(wait.at(-1).value,28.12);
  assert.ok(wait.at(-1).y>wait[0].y,'lower waiting time is drawn lower');
  assert.ok(wait[1].value>wait[0].value,'the actual 2006 increase is preserved');
});
