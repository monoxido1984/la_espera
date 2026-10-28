# La Espera · Consultas y reproducción

Documentación de la versión vigente, 28/10/2026. Fuente: [CRESI / SINTRA · INCUCAI](https://cresi.incucai.gov.ar/). Sólo reportes agregados públicos sin autenticación; sin información nominal.

## Lectura y trazabilidad

Cada consulta tiene dos pasos: criterios de evaluación y selección de salidas. Los JSON descargables conservan filtros, fechas, rutas y huellas SHA256 de los reportes de origen según cada conjunto. Los HTML y CSV originales permanecen en el proyecto de adquisición, fuera de este repositorio web.

La fecha de ejecución no equivale al período evaluado. Repetir una consulta de situación actual devuelve el estado del registro en el momento de la nueva consulta; no reconstruye la fotografía archivada. Las series de años cerrados también pueden recibir revisiones.

## Fotografía activa, mapa y diagnósticos

- Formulario: `cresi_le.do`, reporte completo de listas de espera.
- Situación: `PACIENTES INSCRIPTOS EN LISTA DE ESPERA`.
- Sin restringir el período de inscripción.
- Cruces: lista, provincia de residencia, edad pediátrica/adulta y sexo, según los filtros conservados.
- Salidas: provincia de residencia (2), diagnóstico principal (10) y antigüedad en lista (16).
- Fotografía: 27/10/2026. Los instantes de consulta están en `mapa-demografia.json` y sus auditorías. No es una transacción instantánea.

Cada registro representa una inscripción, no una persona única deduplicada entre listas. Los diagnósticos describen inscripciones activas, no altas de un período. La antigüedad es tiempo ya transcurrido en lista; no es una predicción hasta el trasplante. Los faltantes permanecen ausentes.

El mapa PMH divide las inscripciones seleccionadas por la población provincial total INDEC al 01/07/2026 y multiplica por 1.000.000. Incluso al filtrar edad o sexo, utiliza el total provincial como denominador. La procedencia del denominador está archivada en los datos y la auditoría del mapa.

## Cantidad anual en lista

- Formulario: prevalencia e incidencia, `cresi_pre.do`.
- Evaluar pacientes en lista de espera; elegir lista y un año completo, 01/01–31/12, de 2005 a 2025.
- Salida provincial (2), columna `Total LE`.
- Todas las edades; por residencia. Las cantidades son inscripciones al cierre y no están ajustadas por población.
- Descarga: `conteos-anuales-por-lista.json`.

## Tiempos hasta el trasplante

| Formulario | Listas | Salida | Unidad |
| --- | --- | --- | --- |
| `cresi_renal.do` | Renal y renopancreática | 29 | meses |
| `cresi_hepatico.do` | Hepática y combinaciones hepáticas | 34 | días |
| `cresi_intratoracico.do` | Cardíaca, pulmonar y combinaciones intratorácicas | 28 | meses |
| `cresi_corneas.do` | Córneas y escleras | 28 | meses |

Elegir fecha de desclampeo, año completo 2005–2025, lista del receptor y provincia de residencia. Las celdas de edades 0–17 y 18–119 años se conservan en la fuente; la escena anual utiliza todas las edades.

La salida de estadísticas contiene N, media, mediana, P25 y P75 cuando se publican para esa cohorte. No promediar medianas ni percentiles entre celdas. Una media agregada requiere ponderar por N y contar con las celdas necesarias. La serie renal nacional conserva la referencia nacional archivada; los percentiles hepáticos nacionales proceden de filas explícitas por lista. No usar un TOTAL que mezcle listas como estadística de una lista individual.

La web muestra mediana y banda P25–P75 cuando están disponibles; en su ausencia, media discontinua sin banda. Un hueco conserva el dato faltante. Estos tiempos describen a quienes recibieron un trasplante, no la espera futura de quienes continúan en lista.

Descargas: `tiempos-y-fuentes.json`, `percentiles-nacionales-por-lista.json` e `historia-y-fuentes.json`. La fuente compacta tiene 13.104 celdas conjuntas.

## Donación

Los reportes de donantes reales de órganos y donantes de tejidos se evalúan por fecha de clampeo/ablación y establecimiento de origen. Los períodos y parámetros precisos se conservan en cada descarga:

- `contexto-donacion-espera.json`: años completos 2005–2025. El selector Donación utiliza donantes reales de todos los órganos, independientemente de la lista elegida.
- `donantes-corte-20261027.json`: acumulado 01/01–27/10/2026, consultado el 28/10. El contexto actual conserva órganos, tejidos y tasas publicadas; el control nacional incluye registros del exterior. Las jurisdicciones sin fila no se convierten en cero.

Los donantes por establecimiento de origen no se enlazan con receptores ni inscripciones por residencia. Las series no demuestran efectos causales de la donación sobre los tiempos.

## Diálisis

Prevalencia e incidencia (`cresi_pre.do`), pacientes en diálisis al 31/12/2025, salida provincial (2), columna `Total IRCT`. Descarga: `poblacion-dialisis-2025.json`.

El explorador usa un escenario de 52 semanas × 3 sesiones × 4 horas = 624 horas/año por persona. No son sesiones individuales observadas ni tiempo medio en tratamiento. El régimen de sesiones es un supuesto del escenario. El tiempo de diálisis previo al trasplante renal (`tiempo-dialisis.json`) describe otra cohorte. No dividir la lista renal actual por la población en diálisis de otra fecha para inferir una proporción clínica.

## Comparación temporal

La escena anual utiliza una escala común para el indicador elegido y conserva los faltantes de cada territorio. No calcula diferencias entre media y mediana. El mensaje ancla compara el primer y último año disponible hasta el año seleccionado, para el territorio principal; en tiempos exige el mismo estadístico que el año seleccionado. Es una diferencia descriptiva absoluta, sin inferencia causal.
