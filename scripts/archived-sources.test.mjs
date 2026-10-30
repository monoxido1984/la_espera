import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root=new URL('../public/datos/',import.meta.url);
const read=file=>readFileSync(new URL(file,root));
const index=JSON.parse(read('fuentes-archivadas.json'));
test('archived source packages contain the complete bytes matching all published source references',()=>{
 const files=new Map();
 for(const part of index.parts){
  const bytes=read(part.file);assert.equal(createHash('sha256').update(bytes).digest('hex'),part.sha256);
  const data=JSON.parse(bytes);assert.equal(data.files.length,part.files);
  for(const f of data.files){const raw=Buffer.from(f.content,'base64');assert.equal(raw.length,f.bytes);assert.equal(createHash('sha256').update(raw).digest('hex'),f.sha256);assert.ok(!files.has(f.path));files.set(f.path,f.sha256);}
 }
 assert.equal(files.size,index.files.length);
 for(const f of index.files)assert.equal(files.get(f.path),f.sha256);
 for(const paths of Object.values(index.indicators))for(const path of paths)assert.ok(files.has(path),path);
});
test('extraction parameters and guide describe current means and public archived queries',()=>{
 const data=JSON.parse(read('parametros-extraccion.json'));const guide=read('guia-consultas-cresi.md').toString();
 assert.ok(data.queries.length>0);assert.doesNotMatch(guide,/modo automático prioriza|Sólo Mediana tiene banda/);
 for(const q of data.queries){assert.ok(q.criteria||q.literal_description);assert.ok(q.final_post_fields||q.post_recovery_status);for(const key of ['form_url','result_url','final_post_url'])if(q[key])assert.equal(new URL(q[key]).hostname,'cresi.incucai.gov.ar');}
});
