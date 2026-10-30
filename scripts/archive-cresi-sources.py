"""Empaqueta fuentes públicas ya archivadas. No realiza solicitudes HTTP."""
import argparse,ast,base64,csv,hashlib,json,re,sys,io
from pathlib import Path
parser=argparse.ArgumentParser();parser.add_argument('--root',type=Path,required=True);args=parser.parse_args()
root=args.root.resolve();web=Path(__file__).resolve().parents[1];dest=web/'public/datos';out=dest/'fuentes-archivadas';out.mkdir(exist_ok=True)
sys.path.insert(0,str(root/'scripts'))
from bs4 import BeautifulSoup
from recolectar_trayectoria_renal import campos_paso_final
refs={}; indicators={}
def walk(x,paths):
 if isinstance(x,str) and x.startswith(('datos/originales/','datos/extraidos/')):paths.add(x)
 elif isinstance(x,dict):
  if isinstance(x.get('path'),str) and x.get('sha256'):refs[x['path']]=x['sha256']
  for k,v in x.items():
   if k.startswith(('datos/originales/','datos/extraidos/')):
    paths.add(k)
    if isinstance(v,str) and re.fullmatch('[0-9a-f]{64}',v):refs[k]=v
   walk(v,paths)
 elif isinstance(x,list):
  for v in x:walk(v,paths)
for f in sorted(dest.glob('*.json')):
 if f.name in ('fuentes-archivadas.json','parametros-extraccion.json'):continue
 paths=set();walk(json.loads(f.read_text(encoding='utf-8')),paths)
 indicators[f.name]=sorted(p for p in paths if p.endswith('.csv') or p.endswith('/resultado.html'))
paths=sorted(set(p for v in indicators.values() for p in v));catalog={};manifest={};criteria={}
for f in sorted((root/'metadatos').rglob('catalogo_cresi.csv')):
 for row in csv.DictReader(f.open(encoding='utf-8-sig',newline='')):
  if row.get('ruta_local'):catalog[row['ruta_local']]=row
for f in sorted((root/'metadatos').rglob('manifiesto_descargas.csv')):
 for row in csv.DictReader(f.open(encoding='utf-8-sig',newline='')):
  key=row.get('ruta_local','')
  if key.endswith('/paso2.html') and row.get('observaciones','').startswith('Filtros: '):
   try:criteria[key.rsplit('/',1)[0]]=ast.literal_eval(row['observaciones'][9:])
   except (ValueError,SyntaxError):pass
  if key:manifest[key]=row
queries={};all_records=[];parts=[];chunk=[];chunk_size=0
for p in paths:
 file=root/p
 if not file.exists():raise FileNotFoundError(p)
 raw=file.read_bytes();sha=hashlib.sha256(raw).hexdigest()
 if p in refs and sha!=refs[p]:raise ValueError('SHA256 distinto: '+p)
 parent=str(Path(p).parent).replace('\\','/').replace('datos/extraidos/','datos/originales/')
 result=parent+'/resultado.html';meta=catalog.get(result,{})
 if parent not in queries:
  obs=meta.get('observaciones','') or manifest.get(result,{}).get('observaciones','')
  outputs=re.findall(r'(?:Salidas: | \| )(\d+)\.',obs)
  q={'id':parent,'form_url':meta.get('url_origen'),'result_url':meta.get('url_descarga') or manifest.get(result,{}).get('url_final'),'method':manifest.get(result,{}).get('metodo_http'),'extracted_at':meta.get('fecha_descarga') or manifest.get(result,{}).get('fecha_hora'),'period_from':meta.get('periodo_desde'),'period_to':meta.get('periodo_hasta'),'year':meta.get('anio'),'criteria':criteria.get(parent),'outputs':outputs,'literal_description':obs,'http_status':manifest.get(result,{}).get('codigo_http'),'script':manifest.get(result,{}).get('script')}
  step=root/parent/'paso2.html'
  if step.exists() and outputs:
   try:
    action,fields,labels=campos_paso_final(BeautifulSoup(step.read_bytes(),'html.parser'),tuple(outputs))
    q['final_post_url']=action;q['final_post_fields']=[list(v) for v in fields if not re.search('cookie|session|token|password',v[0],re.I)];q['output_labels']=labels
   except Exception as e:q['post_recovery_status']=type(e).__name__+': '+str(e)
  else:q['post_recovery_status']='No hay formulario intermedio o números de salida recuperables; usar criterios y descripción literal archivados.'
  queries[parent]=q
 record={'path':p,'kind':'original_response' if p.endswith('.html') else 'extracted_table','sha256':sha,'bytes':len(raw),'encoding':'base64','content':base64.b64encode(raw).decode('ascii'),'query':parent}
 if p.endswith('.csv'):
  try:record['rows']=list(csv.reader(io.StringIO(raw.decode('utf-8-sig'))))
  except UnicodeDecodeError:record['rows']=list(csv.reader(io.StringIO(raw.decode('latin-1'))))
 if chunk and chunk_size+len(raw)>12_000_000:
  name=f'fuentes-{len(parts)+1:03d}.json';body=json.dumps({'schema':1,'files':chunk},ensure_ascii=False,separators=(',',':')).encode();(out/name).write_bytes(body);parts.append({'file':'fuentes-archivadas/'+name,'sha256':hashlib.sha256(body).hexdigest(),'files':len(chunk),'bytes':len(body)});chunk=[];chunk_size=0
 chunk.append(record);chunk_size+=len(raw);all_records.append({'path':p,'sha256':sha,'query':parent})
if chunk:
 name=f'fuentes-{len(parts)+1:03d}.json';body=json.dumps({'schema':1,'files':chunk},ensure_ascii=False,separators=(',',':')).encode();(out/name).write_bytes(body);parts.append({'file':'fuentes-archivadas/'+name,'sha256':hashlib.sha256(body).hexdigest(),'files':len(chunk),'bytes':len(body)})
(dest/'fuentes-archivadas.json').write_text(json.dumps({'schema':1,'note':'Respuestas HTML originales y CSV extraídos, bytes completos en base64 sin normalización. Decodificar content y verificar SHA256. No son microdatos.','parts':parts,'indicators':indicators,'files':all_records},ensure_ascii=False,separators=(',',':')),encoding='utf-8')
(dest/'parametros-extraccion.json').write_text(json.dumps({'schema':1,'note':'Metadatos archivados, no nuevas consultas. final_post_fields recupera los campos públicos del paso 2; excluye nombres de sesión y seguridad. Si falta un campo histórico no se inventa y se indica post_recovery_status.','queries':list(queries.values())},ensure_ascii=False,separators=(',',':')),encoding='utf-8')
print(json.dumps({'files':len(paths),'queries':len(queries),'parts':len(parts),'archive_mb':round(sum(p['bytes'] for p in parts)/1048576,1),'criteria_recovered':sum(q['criteria'] is not None for q in queries.values()),'posts_recovered':sum('final_post_fields' in q for q in queries.values())}))
