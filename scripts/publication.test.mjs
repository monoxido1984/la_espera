import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,existsSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const read=file=>readFileSync(new URL(file,root),'utf8');
test('methodology downloads exist and contain no retired datasets',()=>{
 const source=read('app/v2/data-method.tsx');
 const files=[...source.matchAll(/\['[^']+','([^']+\.(?:json|md|csv))'\]/g)].map(match=>match[1]);
 assert.equal(files.length,16);
 for(const file of files)assert.ok(existsSync(new URL('public/datos/'+file,root)),file);
 assert.deepEqual(readdirSync(new URL('public/datos/',root)).sort(),files.sort());
 assert.doesNotMatch(source,/ExitBreakdown|Movimientos|Ing LE|parcial-2026|egresos-provinciales|trasplantes-registrados/);
});
test('published downloads match the actual application aggregates',()=>{
 for(const [download,source] of [
 ['contexto-inscripciones-2021-2025.json','v2/annual-entry-context.generated.json'],
 ['tramite-renal-2025.json','v2/dialysis-context.generated.json'],
 ['mapa-demografia.json','v2/map-demographics.generated.json'],
 ['diagnosticos-activos.json','v2/current-diagnoses.generated.json'],
 ['donantes-corte-20261027.json','v2/current-donation.generated.json'],
 ['contexto-donacion-espera.json','v2/donation-context.generated.json'],
 ['conteos-anuales-por-lista.json','v2/annual-list-counts.generated.json'],
 ['percentiles-nacionales-por-lista.json','v2/annual-national-quantiles.generated.json'],
 ['poblacion-dialisis-2025.json','dialysis-population-2025.generated.json'],
 ['tiempo-dialisis.json','dialysis-history.generated.json']
 ])assert.deepEqual(JSON.parse(read('public/datos/'+download)),JSON.parse(read('app/'+source)),download);
});
