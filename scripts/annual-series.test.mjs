import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {perMillion,seriesPath,sharedStatistic,timeAnchor,timeValue} from '../app/v2/annual-series-model.ts';
const row=(year,median,average)=>({year,median,average,unit:'meses',p25:null,p75:null,partial:false});
test('both territories use one statistic without substituting a missing median with a mean',()=>{
 const a=[row(2005,10,12),row(2006,null,15)],b=[row(2005,null,21),row(2006,20,23)];
 assert.equal(sharedStatistic(a,b,true),'mean');
 assert.equal(sharedStatistic(a,b,false),'median');
 assert.equal(timeValue(a[1],'median'),null);assert.equal(timeValue(b[0],'mean'),21);
 b[0].median=0;assert.equal(sharedStatistic(a,b,true),'median');assert.equal(timeValue(b[0],'median'),0);
 b[0].unit='días';assert.equal(sharedStatistic(a,b,true),'mean');
});
test('PMH uses each yearly territorial denominator, keeps zero and withholds absent values',()=>{
 assert.equal(perMillion(100,2e6),50);assert.equal(perMillion(100,4e6),25);assert.equal(perMillion(0,2e6),0);
 for(const value of [null,undefined])assert.equal(perMillion(value,2e6),null);
 for(const population of [undefined,0,-1,Infinity])assert.equal(perMillion(100,population),null);
});
test('time traces keep missing years as gaps and the anchor only describes the chosen statistic',()=>{
 const rows=[row(2005,10,100),row(2006,null,200),row(2007,0,300)];
 assert.equal(seriesPath(rows,row=>timeValue(row,'median'),year=>year,n=>n),'M2005,10  M2007,0');
 assert.match(timeAnchor(rows,2007,'median','Córdoba'),/mediana.*disminuyó 10,0 meses/);
 assert.match(timeAnchor(rows,2007,'mean','Córdoba'),/media.*aumentó 200,0 meses/);
 assert.doesNotMatch(timeAnchor(rows,2007,'median','Córdoba'),/donación|PMH|correlación/);
});
test('annual populations match their archived CSV and preserve all 24 jurisdictions each year',()=>{
 const source=readFileSync(new URL('../public/datos/poblacion_indec_2005_2025_por_provincia.csv',import.meta.url));
 const data=JSON.parse(readFileSync(new URL('../app/v2/annual-population.generated.json',import.meta.url),'utf8'));
 assert.equal(createHash('sha256').update(source).digest('hex'),data.sourceSha256);
 assert.equal(Object.keys(data.population).length,21);
 for(const row of Object.values(data.population)){assert.equal(Object.keys(row).length,25);assert.equal(Object.entries(row).filter(([key])=>key!=='ARGENTINA').reduce((sum,[,n])=>sum+n,0),row.ARGENTINA);}
});
