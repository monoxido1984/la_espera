# La Espera · Consultas y reproducción

Documentación de la versión vigente, 30/10/2026. Fuente: [CRESI / SINTRA · INCUCAI](https://cresi.incucai.gov.ar/). Sólo reportes agregados públicos sin autenticación; sin información nominal.

## Lectura y trazabilidad

Cada consulta tiene dos pasos: criterios de evaluación y selección de salidas. Los JSON descargables conservan filtros, fechas, rutas y huellas SHA256 de los reportes de origen según cada conjunto. Las respuestas HTML originales y los CSV extraídos se publican completos en los paquetes JSON enlazados desde [fuentes-archivadas.json](fuentes-archivadas.json). Cada archivo conserva sus bytes en base64, ruta y SHA256; no se normalizan ni corrigen los valores de origen. El índice relaciona cada descarga utilizada por la web con sus archivos.

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
- Todas las edades; por residencia. Las cantidades originales son inscripciones al cierre; el eje auxiliar las muestra por millón de habitantes del mismo territorio y año.
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

La escena 03 utiliza exclusivamente medias aritméticas, sin selección automática, medianas ni bandas de percentiles. Compara por provincia o por lista de forma excluyente. Las medias se ponderan por N, sin sustituir ausencias. Cuando se comparan listas con unidades distintas se usa 365,2425/12 días por mes. «Todas» reúne las 13 listas con series disponibles, no todas las categorías posibles. Estos tiempos describen a quienes recibieron un trasplante y no predicen la espera futura de quienes continúan en lista. Los percentiles siguen archivados como datos de fuente, pero no se muestran.

Descargas: `tiempos-y-fuentes.json`, `percentiles-nacionales-por-lista.json` e `historia-y-fuentes.json`. La fuente compacta tiene 13.104 celdas conjuntas.

## Donación

Los reportes de donantes reales de órganos y donantes de tejidos se evalúan por fecha de clampeo/ablación y establecimiento de origen. Los períodos y parámetros precisos se conservan en cada descarga:

- `contexto-donacion-espera.json`: años completos 2005–2025. El contexto auxiliar Donación utiliza donantes reales de todos los órganos en PMH, independientemente de la lista elegida.
- `donantes-corte-20261027.json`: acumulado 01/01–27/10/2026, consultado el 28/10. El contexto actual conserva órganos, tejidos y tasas publicadas; el control nacional incluye registros del exterior. Las jurisdicciones sin fila no se convierten en cero.

Los donantes por establecimiento de origen no se enlazan con receptores ni inscripciones por residencia. Las series no demuestran efectos causales de la donación sobre los tiempos.

## Diálisis

Prevalencia e incidencia (`cresi_pre.do`), pacientes en diálisis al 31/12/2025, salida provincial (2), columna `Total IRCT`. Descarga: `poblacion-dialisis-2025.json`.

El explorador usa un escenario de 52 semanas × 3 sesiones × 4 horas = 624 horas/año por persona. No son sesiones individuales observadas ni tiempo medio en tratamiento. El régimen de sesiones es un supuesto del escenario. El tiempo de diálisis previo al trasplante renal (`tiempo-dialisis.json`) describe otra cohorte. No dividir la lista renal actual por la población en diálisis de otra fecha para inferir una proporción clínica.

## Comparación temporal y contexto en PMH

La espera es siempre la serie principal, en meses o días y con medias para ambas series. Azul y naranja distinguen provincias o listas, según la modalidad elegida. Los faltantes permanecen como huecos. No se mezclan medias con medianas ni se calculan diferencias entre ellas.

Donación, lista al cierre y receptores de las cohortes con tiempos publicados sólo se agregan opcionalmente como líneas punteadas en un eje auxiliar derecho. Pueden mostrarse en cantidades absolutas o PMH. Sus tasas se calculan como cantidad original ÷ población del mismo territorio y año × 1.000.000, usando las proyecciones archivadas en `poblacion_indec_2005_2025_por_provincia.csv`. El CSV conserva las bases censales y fechas de referencia de cada tramo; los cambios de base pueden afectar la continuidad. La población nacional es la suma provincial. Los tiempos no se convierten a PMH.

Los ejes tienen escalas independientes. Una proximidad visual no estima correlación ni demuestra causalidad. No se emparejan individuos entre poblaciones. El mensaje ancla describe exclusivamente el cambio del tiempo de espera del territorio principal, con el mismo estadístico, entre el primer y último año disponible hasta el año seleccionado.


## Parámetros exactos de cada consulta archivada

El archivo [parametros-extraccion.json](parametros-extraccion.json) contiene una entrada por consulta: identificador/ruta, URL de formulario y de ejecución, método, fecha de extracción, período, criterios literales (nombres y valores de los campos), números y etiquetas de salidas y, cuando se conserva el paso intermedio, campos del POST final. No incluye cookies ni credenciales. Las ausencias históricas se declaran mediante post_recovery_status; no se inventan parámetros. No es un registro de nuevas consultas.

Para repetir una consulta, localizar su ruta mediante el índice de fuentes, abrir form_url en una sesión pública de CRESI, aplicar criteria, seleccionar outputs y ejecutar la acción pública indicada. Los campos de sesión se generan de nuevo en el sitio; no se reutilizan tokens archivados. Los nombres y valores literales prevalecen sobre esta guía resumida. Una nueva extracción puede diferir por revisiones del registro.

## Inscripción y asignación de 2025

- Trámite: cresi_tp.do, PERIODO=OTRO AÑO y OTRO_ANIO=2025, salida 2, sin lista ni jurisdicción seleccionadas. El encabezado de la respuesta delimita inscripciones completadas por método normal e indicación posterior al 12/07/2005. Se usa la fila TOTAL (5.823; 6,1 meses; 184 días) y se preservan medias y redondeos de las cinco etapas; no se promedian promedios de listas.
- Asignación: se suman ocho filas de órganos de esa consulta para el mínimo documentado de 3.350 inscripciones; se excluyen tejidos. Los 2.488 trasplantes suman nueve tipos de órganos/combinaciones del reporte de 2025 por fecha de desclampeo, todas las edades y tipos de donante. Los 956 donantes reales de órganos proceden del reporte anual de donación por establecimiento de origen. Los tres conjuntos no son una cohorte vinculada ni una correspondencia uno a uno. Sus respuestas se enlazan en el índice por asignacion-organos-2025.json y contexto-donacion-espera.json.
- Ingresos 2021–2025: se conservan los subtotales documentados de 13 listas y sus ausencias; la media anual se comunica como mínimo documentado redondeado hacia abajo. No se reconcilia con el conjunto de trámites completados.

## Reglas de transformación y comprobación

| Indicador | Operación aplicada |
| --- | --- |
| Fotografía y filtros | Sumar las celdas provinciales conjuntas de lista/edad/sexo; conservar discrepancias con controles nacionales, sin corregir originales. No deduplicar personas entre listas. |
| Espera de 3 años o más | Sumar 3–7, 7–10 y más de 10 años del mismo cruce. Antigüedad acumulada, no tiempo restante. |
| Media anual | Suma de N × media / suma de N con cobertura válida; renal nacional usa su cohorte nacional archivada. No promediar medianas. Faltantes quedan como huecos. |
| PMH | Cantidad / población del mismo territorio × 1.000.000. Mapa: INDEC 01/07/2026; serie: población anual archivada. El denominador no cambia al filtrar sexo o edad. |
| Diálisis ilustrativa | 52 × 3 × 4 = 624 horas por año; 624/24 = 26 días. Multiplicar por 31.431 para el escenario colectivo; no es tiempo clínico observado. |
| Contexto COVID | Comparar 2020 contra la media 2017–2019 de receptores de las 13 listas relevadas y, por separado, donantes nacionales de órganos. No atribuir causalidad con estas series. |

Los parámetros por consulta indican el período efectivo; la fecha de descarga es distinta. Las cifras cero publicadas se conservan y las ausencias no se convierten en cero.

## Perfiles simulados del reloj

Se muestrea con peso N una celda conjunta publicada de lista, provincia, sexo, grupo etario y tramo de antigüedad. Se excluyen celdas sin desglose. Una semilla determinista por punto devuelve siempre el mismo perfil. La edad exacta es ilustrativa (menores 0–17; adultos 18–85), restringida para no ser menor que la espera. La duración exacta se asigna uniformemente dentro del tramo; más de diez años se acota ilustrativamente a veinte (diecisiete para menores). No son microdatos, receptores identificados, una curva de supervivencia ni una predicción del trasplante. Implementación: app/v2/simulated-waiting-profile.ts.

## Recuperar los archivos originales desde JSON

1. Descargar el índice y los paquetes que correspondan al indicador.
2. Decodificar content en base64 de cada entrada files.
3. Calcular SHA256 de los bytes y contrastarlo con sha256 y con las referencias de la descarga del indicador. HTML es la respuesta original; CSV es su tabla extraída, conservada sin modificar.
4. Leer las tablas con sus encabezados originales y aplicar las reglas anteriores. La extracción y sus discrepancias son auditables por separado.

La exportación se reproduce sin red con scripts/archive-cresi-sources.py --root RUTA_DEL_PROYECTO_DE_ADQUISICION. Requiere Python, BeautifulSoup y los scripts y originales preservados de ese proyecto. No ejecuta solicitudes HTTP.


## Ejemplo manual: receptores del reporte de trasplante renal en 2025

**Qué número vamos a comprobar:** 1.542 receptores del reporte nacional de trasplante Renal en el archivo consultado el 12/08/2026 a las 20:20. Su población es «Pacientes trasplantados asignados en distribución renal». No es el número de personas actualmente en lista ni una consulta adicional restringida a una lista individual.

1. Entrar en la [sección pública de CRESI](https://cresi.incucai.gov.ar/) y abrir el reporte de trasplante Renal. También se conserva el [enlace directo al formulario](https://cresi.incucai.gov.ar/cresi/OpenDocument.do?accion=%2Fcresi_renal.do%3FCLICK_AND_LIST_HABILITADO%3Dtrue). Si el enlace directo requiere iniciar una sesión pública, entrar primero por la portada; no hace falta iniciar sesión con credenciales.
2. En el **paso 1, criterios de evaluación**, elegir el tipo de período **FECHA DE DESCLAMPEO**. Es la fecha del trasplante utilizada por esta consulta; no elegir fecha de inscripción en lista.
3. Elegir **OTRO AÑO** y escribir/seleccionar **2025**. El resultado debe mostrar desde **01/01/2025 hasta 31/12/2025**.
4. Dejar el resto de los criterios sin restricciones adicionales: sin filtrar provincia, sexo, edad, tipo de donante ni lista individual. Así se reproduce la población nacional del reporte archivado; agregar un filtro cambia el conjunto y puede cambiar el total. Continuar al paso 2.
5. En el **paso 2, salidas**, seleccionar **4. Receptores agrupados por provincia de residencia** y generar el reporte. Para reproducir además las otras salidas del archivo original, marcar también **12. Receptores agrupados por grupo etáreo del receptor**, **14. Receptores agrupados por sexo del receptor**, **27. Receptores agrupados por tiempo en lista de espera** y **29. Variables estadísticas del tiempo de espera hasta el trasplante**. Son agrupamientos del mismo conjunto: no se deben sumar los totales de distintas tablas.
6. En la salida 4, buscar la fila **TOTAL** y leer la columna **Total**: el archivo conserva **1.542**. No leer sólo la columna Vivo: hay 1.539 en Vivo y 3 en Fallecido. Esas columnas describen la situación a las 24 horas del implante, no mortalidad anual. Si se eligió la salida 29, su fila TOTAL también tiene **Total = 1.542** y **AVG = 28,12 meses**; la web redondea esa media a **28,1 meses**.
7. Contrastar con la fila year=2025 de [historia-y-fuentes.json](historia-y-fuentes.json): n=1542 y average=28.12. En [parametros-extraccion.json](parametros-extraccion.json), buscar el identificador datos/originales/reportes_dinamicos/trayectoria_renal/trasplante_renal_2025. En el [índice de originales](fuentes-archivadas.json), localizar esa consulta y la tabla datos/extraidos/reportes_dinamicos/trayectoria_renal/trasplante_renal_2025/tabla_06.csv; el paquete correspondiente permite recuperar sus bytes y verificar el SHA256.

Los campos literales registrados para el paso 1 son:

| Campo técnico | Valor |
| --- | --- |
| TIPO_PERIODO_TRASPLANTE_HEPATICO | FECHA DE DESCLAMPEO |
| PERIODO | OTRO AÑO |
| OTRO_ANIO | 2025 |

El nombre técnico del primer campo contiene HEPATICO también en este formulario renal: se conserva tal como lo envió CRESI; no indica que se haya consultado un reporte hepático. La ejecución final es un POST a https://cresi.incucai.gov.ar/reporte/resumenestadistico/EjecutarConsultaTrasplante.do?reporte=renal. Debe generarse desde el formulario público, que mantiene los criterios de la sesión; abrir esa URL final por sí sola no reproduce la consulta.

**Transformación aplicada:** usar el Total nacional publicado, sin multiplicar por población ni sumar varias salidas; para la media, tomar AVG de la misma cohorte y redondear sólo al mostrar. Una nueva consulta puede arrojar cifras revisadas. El ejemplo permite comprobar el archivo histórico y repetir sus criterios, no garantiza que CRESI mantenga hoy el mismo valor.
