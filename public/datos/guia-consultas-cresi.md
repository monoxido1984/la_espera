# La Espera — guía de consultas y preparación de datos

Documentación de la versión local del 15/10/2026. Fuente estadística: https://cresi.incucai.gov.ar/ (CRESI / SINTRA, INCUCAI). Sólo reportes numéricos públicos, sin autenticación ni datos identificables.

## Antes de comparar resultados

Cada consulta tiene dos pasos: criterios de evaluación y salidas o agrupamientos. Al terminar, guardar el encabezado completo con filtros, período, salidas y fecha/hora de ejecución, además de las tablas. Los números y nombres de salida de esta guía corresponden a las capturas conservadas; CRESI puede revisarlos.

No confundir período evaluado con fecha de consulta. Los reportes históricos pueden cambiar por actualizaciones del registro. La foto actual del 28/08/2026 no se reproduce retrospectivamente cambiando un filtro: repetir hoy esa consulta devuelve la situación actual. Para auditar exactamente 9.721 se necesitan las respuestas archivadas de ese día, con sus horas respectivas. La captura de varias tablas no fue una transacción simultánea.

## 1. Fotografía actual: cifra, listas, provincias y antigüedad

Formulario: **Reporte de pacientes inscriptos en lista de espera**.

https://cresi.incucai.gov.ar/cresi/OpenDocument.do?accion=%2Fcresi_le.do%3FCLICK_AND_LIST_HABILITADO%3Dtrue

Paso 1:

- Reporte: COMPLETO - TODAS LAS LISTAS DE ESPERA.
- Situación en lista de espera: PACIENTES INSCRIPTOS EN LISTA DE ESPERA.
- Total nacional: sin restricción de provincia, sexo o edad.

Paso 2:

- 2. Pacientes agrupados por provincia de residencia.
- 16. Pacientes agrupados por antiguedad en lista de espera.

Las columnas distinguen tipos de lista. Para lista × provincia × antigüedad, volver al paso 1, fijar Provincia del paciente (ejemplo: CORDOBA) y solicitar la salida 16. Repetir para las 24 jurisdicciones. No multiplicar una proporción provincial por otra proporción de antigüedad.

La foto total reúne 9.721 inscripciones, no personas únicas deduplicadas. Las listas combinadas y los tejidos se mantienen. La tabla provincial de antigüedad tiene desgloses no publicados para algunas listas; se conserva la diferencia entre total conjunto y subtotales conocidos como residual, sin repartirla. No se fabrican cruces de diagnóstico, sexo, edad y antigüedad desde tablas marginales.

Trazabilidad local: `datos/originales/reportes_dinamicos/foto_2026_08_28_lista_espera/` y ruta homóloga bajo `datos/extraidos/`; cada `tabla_01.csv` conserva criterios. Vistas derivadas: `foto 28-08/lista_provincia.csv` y `foto 28-08/lista_antiguedad_provincia.csv`.

## 2. Cantidades anuales de inscripciones

Formulario: **Reporte de prevalencia e incidencia en diálisis y lista de espera**.

https://cresi.incucai.gov.ar/cresi/OpenDocument.do?accion=%2Fcresi_pre.do%3FCLICK_AND_LIST_HABILITADO%3Dfalse

Paso 1: Evaluar = PACIENTES EN LISTA DE ESPERA; año elegido (ejemplo 2025); Lista de espera elegida (ejemplo RENAL o CORNEAS).

Paso 2: 2. Pacientes agrupados por provincia de residencia. Leer **Total LE** por provincia y TOTAL: la nota del reporte lo define como pacientes inscriptos contabilizados al final del año de evaluación. No usar Ing LE, Prev LE ni Total IRCT.

Cobertura: 13 listas × 21 años (2005–2025) = 273 combinaciones lista–año, con 24 provincias cada una. Controles 2025: Renal 5.195; Córneas 2.188. Son cantidades anuales publicadas, distintas de la foto actual y del número de receptores de trasplante. No hay conteos por edad en esta capa: al elegir edad, la cantidad es s/d.

Listas: RENAL, CORNEAS, HEPATICA, CARDIACA, PULMONAR, RENOPANCREATICA, ESCLERAS, HEPATORRENAL, HEPATOINTESTINAL, HEPATOPANCREATICA, CARDIOHEPATICA, CARDIOPULMONAR y CARDIORRENAL.

Archivo web: `conteos-anuales-por-lista.json`. `lists[lista]` contiene año, total, provincias y fuentes con SHA256. Se comprueba que 24 valores provinciales sumen el total de cada consulta.

Adquisición local: `scripts/recolectar_conteos_historicos_por_lista.py`, colección `conteos_anuales_por_lista_2026_10_15`. Se reutilizaron la serie renal y Hepática 2005 ya verificadas; se completaron 251 consultas nuevas, sin forzar reemplazos. Preparación: `scripts/construir_conteos_anuales_por_lista_web.py --require-complete`.

## 3. Tiempo hasta el trasplante: consultas conjuntas

El período se selecciona por **FECHA DE DESCLAMPEO**: es el año del trasplante, no el del comienzo de la espera. En OTRO AÑO se elige 2005–2025.

| Distribución / formulario | Listas | Salida | Unidad verificada |
| --- | --- | --- | --- |
| Renal: `cresi_renal.do` | RENAL, RENOPANCREATICA | 29. Variables estadísticas del tiempo de espera hasta el trasplante | meses |
| Hepática: `cresi_hepatico.do` | HEPATICA, HEPATORRENAL, HEPATOPANCREATICA, HEPATOINTESTINAL | 34. Variables estadísticas del tiempo de espera hasta el trasplante | días |
| Intratorácica: `cresi_intratoracico.do` | CARDIACA, CARDIOHEPATICA, CARDIOPULMONAR, CARDIORRENAL, PULMONAR | 28. Variables estadísticas del tiempo de espera hasta el trasplante | meses |
| Córneas: `cresi_corneas.do` | CORNEAS, ESCLERAS | 28. Variables estadísticas del tiempo de espera hasta el trasplante | meses |

Enlaces a los cuatro formularios:

- https://cresi.incucai.gov.ar/cresi/OpenDocument.do?accion=%2Fcresi_renal.do%3FCLICK_AND_LIST_HABILITADO%3Dtrue
- https://cresi.incucai.gov.ar/cresi/OpenDocument.do?accion=%2Fcresi_hepatico.do%3FCLICK_AND_LIST_HABILITADO%3Dtrue
- https://cresi.incucai.gov.ar/cresi/OpenDocument.do?accion=%2Fcresi_intratoracico.do%3FCLICK_AND_LIST_HABILITADO%3Dtrue
- https://cresi.incucai.gov.ar/cresi/OpenDocument.do?accion=%2Fcresi_corneas.do%3FCLICK_AND_LIST_HABILITADO%3Dtrue

Para cada celda, fijar simultáneamente: año, Lista de espera del receptor, Provincia de residencia del receptor y Edad del receptor = ESPECIFICAR desde 0 hasta 17 o desde 18 hasta 119 años. La interfaz rotula esos dos intervalos como menores de 18 y 18 o más. No se consultó sexo como filtro en estos formularios.

Ejemplo: Córneas, FECHA DE DESCLAMPEO, OTRO AÑO 2025, lista CORNEAS, provincia CORDOBA, edad 0–17, salida 28. De la fila TOTAL guardar n y media en meses. La nota de la salida identifica la unidad. Para hepáticas conservar días; no asumir que todas las tablas usan meses.

Cobertura: 13 × 24 × 2 × 21 = 13.104 celdas agregadas. Al elegir una provincia y todas las edades, se reúnen sus dos celdas; para Argentina, las 24 jurisdicciones. Sólo agregar cuando están todas las celdas esperadas y la unidad coincide.

Fórmula: **media conjunta = Σ(nᵢ × mediaᵢ) / Σnᵢ**. Los grupos reunidos deben ser disjuntos. No es un promedio simple de provincias; no se promedian medianas ni percentiles. Las medias publicadas están redondeadas y limitan la precisión. Un resultado sin observaciones conserva n = 0 y media ausente, no media cero. Una celda faltante impide publicar el agregado como completo.

La referencia nacional de distribución renal es una consulta separada sin provincia, edad ni lista adicional. En 2025 publica n = 1.542 y media = 28,12 meses. Los cruces renales territoriales/etarios reúnen 1.528: no se imputa la diferencia ni se infiere su causa. Renal nacional usa el reporte nacional; las selecciones específicas usan su propio n y media.

Archivo web: `tiempos-y-fuentes.json`, con `periods` y `cells` (año, lista, provincia, edad, unidad, n, media, cuantiles, estado, fecha, ruta, SHA256 y formulario). Incluye también un corte 2026 de otra fecha; la escena anual **sólo usa 2005–2025 de ese archivo**. Julio 2026 usa exclusivamente la fuente mensual separada descrita abajo. `historia-y-fuentes.json` conserva la referencia renal nacional y las fuentes históricas.

Preparación: `visualizacion/scripts/build-wait-time-province.mjs` extrae las celdas de las consultas conservadas; `scripts/construir_cruces_anuales_tiempo_web.py` produce el derivado compacto de 2005–2025; `visualizacion/scripts/build-history.mjs` conserva la referencia nacional. Ninguno necesita reconstruir pacientes.

## 4. Donantes anuales

Formulario: **Reporte de donantes de órganos y tejidos**.

https://cresi.incucai.gov.ar/cresi/OpenDocument.do?accion=%2Fcresi_donante.do%3FCLICK_AND_LIST_HABILITADO%3Dtrue

Paso 1: Consultar = DONANTES REALES Y DE TEJIDOS; período por fecha de clampeo/ablación = OTRO AÑO; Establecimiento origen = TODOS.

Paso 2: 2. Donantes agrupados por provincia del establecimiento origen. Se usa el total de donantes reales de órganos y/o tejidos, incluidos los establecimientos extranjeros publicados, como en la serie histórica. No se suma el número de órganos procurados para obtener donantes. No se trata de donantes vivos.

La fila azul mantiene todos los donantes del reporte nacional cuando se elige una lista: no existe en esta vista un cruce que permita asignarlos a esa lista. Tampoco se calcula una conversión inscripción → donante → receptor. La geografía de donación es la del establecimiento de origen; la del receptor es la residencia.

## 5. Diálisis: población observada y escenario ilustrativo

En el formulario de prevalencia e incidencia, elegir Evaluar = PACIENTES EN DIALISIS, año 2025 y salida 2 provincial. Leer Total IRCT en TOTAL: **31.431 pacientes en tratamiento al cierre del año**, según nota de CRESI. No equivale a todas las personas que pasaron por diálisis en 2025 ni mide su tiempo total.

No se dispone de las horas realmente acumuladas por esa población. La visualización supone 52 semanas para todos, 3 sesiones semanales de 4 horas: 156 sesiones, 624 horas por persona. El régimen es una referencia de hemodiálisis de la Red de Diálisis y Nefrología de la Ciudad de Buenos Aires, no un total registrado en CRESI:

https://buenosaires.gob.ar/gcaba_historico/salud/red-de-dialisis-y-neforlogia

**31.431 × 624 = 19.612.944 horas-persona**. Dividir por 24 × 365,2425 × 100 da aproximadamente **22,4 siglos** de bloques continuos de tiempo, aunque las sesiones del escenario se distribuyen por semanas. No describe un promedio observado de duración del tratamiento. No se aplica al stock la media de diálisis de quienes fueron trasplantados.

Archivo web: `poblacion-dialisis-2025.json`, con fuente y hashes. Preparación: `scripts/construir_poblacion_dialisis_2025_web.py`. La descarga `tiempo-dialisis.json` corresponde al universo distinto de receptores renales hasta trasplante.

En Lista de espera, la animación usa los 28,12 meses de los 1.542 receptores renales nacionales de 2025. Convierte con 12 meses/año y 365,2425 días/año y acumula días enteros: 856 × 1.542 = 1.319.952 días-persona, aproximadamente 36,1 siglos. Es una equivalencia ilustrativa con redondeo por persona, no una suma exacta de duraciones individuales. No predice la espera actual ni se suma a diálisis: ambos tiempos pueden superponerse.

## 6. Enero–julio de 2026

Donantes: formulario y criterios de la sección 4, ESPECIFICAR 01/01/2026–31/07/2026. Total conservado = 1.278.

Media renal: formulario renal, FECHA DE DESCLAMPEO, sin provincia, edad ni lista adicional, salida 29. Repetir ESPECIFICAR por mes cerrado: 01/01–31/01, 01/02–28/02, 01/03–31/03, 01/04–30/04, 01/05–31/05, 01/06–30/06 y 01/07–31/07 de 2026. Ponderar las siete medias por n mensual (cohortes disjuntas). n = 892; media aproximada = 25,765639 meses, mostrada como 25,8.

No hay stock de lista con el corte 31/07 en esta base; queda s/d. No se sustituye con agosto. No se extrapolan los donantes parciales ni se conecta esa cantidad con el año completo. La media de julio sólo se usa en Renal, Argentina, todas las edades.

Archivo: `parcial-2026.json`, que guarda cada media/n mensual y SHA256. Preparación: `scripts/construir_parcial_2026_web.py`.

El récord contextual es **mensual: 109 procesos de donación de órganos en mayo de 2026**. Es otro período y unidad que el total enero–julio de órganos y tejidos. Fuente provista por el usuario, INCUCAI, 08/06/2026:

https://www.argentina.gob.ar/noticias/argentina-alcanzo-un-nuevo-record-mensual-de-donantes-de-organos

## 7. Mapa y PMH

**PMH = inscripciones de la lista y provincia / población provincial × 1.000.000**, redondeado a un decimal. Se vinculan por provincia los conteos de la foto con la columna Población del reporte de situación actual del Registro Nacional de IRCT capturado el 28/08/2026; las 24 provincias suman 46.466.688 habitantes. La nota del HTML original dice que la población utilizada es de 2001 y cita INDEC, Análisis Demográfico Serie 31, proyecciones 2001–2015. Se conserva el denominador numérico y esa advertencia, sin presentarlo como proyección validada de 2026 ni corregir la referencia temporal por inferencia. No se suman tasas provinciales. No se calcula PMH para una selección de antigüedad sin denominador compatible.

Para repetir el denominador, abrir el reporte del Registro Nacional de IRCT:

https://cresi.incucai.gov.ar/cresi/OpenDocument.do?accion=%2Fcresi_irct.do%3FCLICK_AND_LIST_HABILITADO%3Dfalse

Elegir CONTABILIZAR PACIENTES, PACIENTES ACTIVOS Y CONFIRMADOS y CONSULTAR LA SITUACION ACTUAL DEL REGISTRO DE IRCT. Pedir 2. Pacientes agrupados por provincia del domicilio de residencia. Conservar **Población**, no el total de pacientes. Fuente archivada: `datos/extraidos/reportes_dinamicos/foto_2026_08_28_dialisis/dialisis_activos_confirmados_foto_actual_base/tabla_02.csv`.

Preparación: `scripts/construir_metricas_territoriales_foto_2026_08_28.py`. El mapa es aproximado y las posiciones no son domicilios. Sus dos marcas por inscripción sólo mejoran legibilidad: no duplican cifras. Las islas comparten el color de Tierra del Fuego, sin añadir unidades.

## 8. Cadena de preservación y reproducción local

En el proyecto de adquisición:

1. `datos/originales/`: HTML tal como se recibió; nunca se reemplaza para corregir una cifra.
2. `datos/extraidos/`: tablas CSV separadas y vinculadas al original; `tabla_01.csv` conserva los criterios.
3. `metadatos/catalogo_cresi.csv`, `metadatos/manifiesto_descargas.csv`, `metadatos/salidas_reportes.csv` y `metadatos/tablas_reportes.csv`: identificación de recursos, URL solicitada/final, fecha, estado, tamaño, tipo, ruta y SHA256.
4. Derivados y archivos web: sólo se reconstruyen desde las fuentes verificadas mediante los scripts nombrados en cada sección. Se controlan totales, cobertura, duplicados y unidades; ausencia nunca equivale automáticamente a cero.

Una huella SHA256 identifica bytes y permite comprobar que un archivo no cambió; no certifica por sí sola calidad clínica. Las descargas web contienen agregados y referencias; no el archivo completo de todos los HTML. Para una reproducción exacta de la foto dinámica se requiere el archivo preservado del proyecto.

No es necesario volver a descargar recursos verificados para reconstruir la web. Si se consulta de nuevo CRESI, hacerlo de a una solicitud, con pausas, usando sólo opciones visibles del formulario, sin autenticación ni salidas nominales. Guardar una nueva captura y documentar diferencias; nunca sobrescribir una fuente histórica.
