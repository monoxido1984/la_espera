"""Deriva dos agregados de órganos de 2025 sin unir cohortes ni alterar originales."""
import sys
import csv
import hashlib
import json
from pathlib import Path

WEB = Path(__file__).resolve().parents[1]
ROOT = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else WEB.parents[2]
INS = 'datos/extraidos/reportes_dinamicos/inscripcion_listas_2025/tiempos_inscripcion_todas_listas_2025/'
TX = 'datos/extraidos/reportes_dinamicos/historia_2015_2026/trasplantes_todos_anio_completo_2025/'
ALLOWED = {'RENAL','RENOPANCREATICA','HEPATICA','HEPATORRENAL','HEPATOPANCREATICA',
           'HEPATOINTESTINAL','CARDIOHEPATICA','CARDIACA','CARDIOPULMONAR','CARDIORRENAL',
           'PULMONAR','PANCREATICA','PANCREOINTESTINAL','INTESTINAL'}


def rows(path):
    with (ROOT / path).open(encoding='utf-8-sig', newline='') as handle:
        return list(csv.reader(handle))


def main():
    ins_criteria = (ROOT / (INS+'tabla_01.csv')).read_text(encoding='utf-8-sig')
    tx_criteria = (ROOT / (TX+'tabla_01.csv')).read_text(encoding='utf-8-sig')
    assert all('desde 1-1-2025 hasta 31-12-2025' in text for text in [ins_criteria, tx_criteria])
    assert 'método normal' in ins_criteria and 'Tipo de donante: TODOS' in tx_criteria
    inscriptions = [{'id': row[0].split('*')[-1], 'n': int(row[1])}
                    for row in rows(INS+'tabla_02.csv')[2:] if row[0].split('*')[-1] in ALLOWED]
    transplants = [{'id': row[0].split('*')[-1], 'n': int(row[10])}
                   for row in rows(TX+'tabla_02.csv')[2:] if row[0].split('*')[-1] in ALLOWED]
    sources = [INS+'tabla_01.csv', INS+'tabla_02.csv', TX+'tabla_01.csv', TX+'tabla_02.csv',
               'datos/originales/reportes_dinamicos/inscripcion_listas_2025/tiempos_inscripcion_todas_listas_2025/resultado.html',
               'datos/originales/reportes_dinamicos/historia_2015_2026/trasplantes_todos_anio_completo_2025/resultado.html']
    data = {'year': 2025, 'scope': 'Órganos exclusivamente; excluye córneas, escleras y otros tejidos',
            'inscriptions': {'total': sum(row['n'] for row in inscriptions), 'lowerBound': True, 'rows': inscriptions,
                             'population': 'Inscripciones por método normal con indicación posterior al 12-07-2005, completadas en 2025'},
            'transplants': {'total': sum(row['n'] for row in transplants), 'rows': transplants,
                            'population': 'Pacientes trasplantados; fecha de desclampeo del receptor en 2025; todos los tipos de donante'},
            'note': 'Dos agregados del mismo año, no las mismas personas ni un seguimiento de cohorte. No restar para estimar crecimiento de la lista ni convertir en probabilidad de trasplante. Las listas sin fila de inscripción no se consideran cero. No vincula donantes individuales con trasplantes.',
            'sources': [{'path': path, 'sha256': hashlib.sha256((ROOT/path).read_bytes()).hexdigest()} for path in sources]}
    assert data['inscriptions']['total'] == 3350 and data['transplants']['total'] == 2488
    for output in ['app/v2/allocation-context.generated.json', 'public/datos/asignacion-organos-2025.json']:
        (WEB/output).write_text(json.dumps(data, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    print(json.dumps({'inscripciones_minimas': data['inscriptions']['total'], 'trasplantes': data['transplants']['total']}))


if __name__ == '__main__':
    main()
