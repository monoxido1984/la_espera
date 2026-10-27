import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname,extname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import ts from 'typescript';

const root=fileURLToPath(new URL('../app/v2/',import.meta.url)),modules=new Map();
function moduleUrl(path){
  if(modules.has(path))return modules.get(path);
  let code=ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
  code=code.replace(/from\s+(['"])(\.[^'"]+)\1/g,(_,quote,specifier)=>{
    const target=resolve(dirname(path),specifier+(extname(specifier)?'':'.ts'));
    return 'from '+JSON.stringify(target.endsWith('.json')?pathToFileURL(target).href:moduleUrl(target));
  });
  const url='data:text/javascript;base64,'+Buffer.from(code).toString('base64');modules.set(path,url);return url;
}
const {territorySeries,territoryCauses,territoryCauseOptions}=await import(moduleUrl(resolve(root,'territory-comparison-model.ts')));
const history=JSON.parse(readFileSync(new URL('../app/history.generated.json',import.meta.url),'utf8'));
const populations=JSON.parse(readFileSync(resolve(root,'annual-population.generated.json'),'utf8')).population;
const series=(territory,metric='waitlist',extra={})=>territorySeries({list:'RENAL',territory,metric,age:'all',cause:'',...extra},history);

test('province and Argentina compare the same 21 years with their own yearly populations',()=>{
  const province=series('CORDOBA'),national=series('ARGENTINA');
  assert.deepEqual(province.map(row=>row.year),Array.from({length:21},(_,i)=>2005+i));
  assert.deepEqual(national.map(row=>row.year),province.map(row=>row.year));
  assert.equal(province.at(-1).amount,443);assert.equal(national.at(-1).amount,5195);
  assert.equal(province.at(-1).value,443/populations[2025].CORDOBA*1_000_000);
  assert.equal(national.at(-1).value,5195/populations[2025].ARGENTINA*1_000_000);
  const zero=series('CHUBUT','waitlist',{list:'CARDIORRENAL'}).at(-1);assert.equal(zero.amount,0);assert.equal(zero.value,0);
  assert.equal(series('CHUBUT','exits',{list:'CARDIACA'})[0].value,null);
});
test('the same cause is compared across territories without inheriting national counts',()=>{
  for(const kind of ['entryCause','exitCause']){
    const a=territoryCauses('RENAL','CORDOBA',2025,kind),b=territoryCauses('RENAL','ARGENTINA',2025,kind);
    const cause=a.items.find(row=>b.items.some(other=>other.id===row.id));assert.ok(cause);
    const provincial=series('CORDOBA',kind,{cause:cause.id}).at(-1),national=series('ARGENTINA',kind,{cause:cause.id}).at(-1);
    assert.equal(provincial.amount,cause.value);
    assert.equal(national.amount,b.items.find(row=>row.id===cause.id).value);
    assert.equal(provincial.reportTotal,a.total);assert.equal(national.reportTotal,b.total);
    assert.equal(series('CORDOBA',kind,{cause:'unpublished-cause'}).at(-1).value,null);
    assert.ok(territoryCauseOptions('RENAL',['CORDOBA','ARGENTINA'],kind,2025).some(row=>row.id===cause.id));
  }
});
test('time comparisons keep the chosen statistic and do not replace absent medians with means',()=>{
  const national=series('ARGENTINA','median').at(-1);
  assert.equal(national.value,history.at(-1).median);
  const province=series('CORDOBA','median').at(-1);
  assert.equal(province.value,null);
  assert.ok(series('CORDOBA','average').at(-1).value>0);
  assert.equal(national.amount,null);
  const preferredNational=series('ARGENTINA','time').at(-1),preferredProvince=series('CORDOBA','time').at(-1);
  assert.equal(preferredNational.statistic,'median');assert.equal(preferredNational.value,national.value);
  assert.equal(preferredProvince.statistic,'average');assert.equal(preferredProvince.value,series('CORDOBA','average').at(-1).value);
});
