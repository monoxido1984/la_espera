# La Espera — Guía de consultas CRESI y reproducción de datos

Documentación técnica de la versión actual (26/10/2026).  
Fuente estadística oficial: [CRESI / SINTRA · INCUCAI](https://cresi.incucai.gov.ar/).  
Se utilizaron exclusivamente reportes numéricos públicos accesibles sin credenciales ni autenticación. No se recolectaron microdatos ni información nominal de pacientes, donantes o profesionales.

---

## 1. Principios antes de comparar y reproducir

1. **Estructura en dos pasos:** Toda consulta pública en CRESI consta de dos pantallas consecutivas:
   - **Paso 1 (Criterios de evaluación):** Define los filtros poblacionales, territoriales, demográficos y de fecha.
   - **Paso 2 (Salidas seleccionadas):** Define los agrupamientos tabulares y las variables que devolverá el servidor.
2. **Fecha de ejecución frente a período evaluado:** La fecha impresa en el encabezado del resultado registra el instante exacto en que se ejecutó la consulta. El período describe el intervalo de tiempo de los datos contenidos.
3. **Reproducibilidad exacta frente a repetición en línea:**
   - Para reportes de **situación actual** (como la fotografía del 24/10/2026): repetir hoy la consulta en CRESI devolverá el estado del registro al momento de la nueva consulta. Para auditar bit a bit los 9.649 registros y las celdas publicadas en esta web, se debe cotejar contra los HTML y CSV originales archivados en `datos/originales/` con sus firmas SHA256 inmutables.
   - Para reportes de **años cerrados** (2005–2025): las consultas son reproducibles con los filtros documentados, aunque eventuales revisiones posteriores del registro institucional pueden alterar sutilmente los valores históricos respecto a las fechas de captura archivadas.

---

## 2. Separación de universos

Para evitar interpretaciones metodológicas erróneas, la visualización distingue cinco universos independientes:

| Universo | Qué mide | Población y corte | Unidad |
| --- | --- | --- | --- |
| **Stock actual en lista** | Inscripciones activas al momento de la consulta | Fotografía del 24/10/2026 (10:43–10:47) | Inscripciones activas (una persona puede figurar en más de una lista; no son personas únicas deduplicadas). |
| **Inscripciones en un período (altas)** | Personas registradas entre fechas, en cualquier situación posterior | 01/01/2026 al 24/10/2026 (diagnósticos 2026) y 01/01 a 31/12 (ingresos 2005–2025) | Inscripciones registradas en el período evaluado. |
| **Egresos (bajas permanentes)** | Personas dadas de baja definitiva de la lista durante el año | Años calendario cerrados 2005–2025 | Bajas permanentes (reúne trasplantes con donante fallecido, con donante vivo, fallecimientos y otras causas). |
| **Población en diálisis** | Pacientes en tratamiento de insuficiencia renal crónica terminal (IRCT) | Al 31/12/2025 | Personas en diálisis al cierre (31.431 pacientes en `Total IRCT`). |
| **Receptores trasplantados** | Personas que efectivamente accedieron a un trasplante | Años calendario cerrados 2005–2025 (por fecha de desclampeo) | Receptores de trasplante evaluados en tiempo de espera. |

---

## 3. Guía por formulario de CRESI

### A. Reporte de pacientes inscriptos en lista de espera (`cresi_le.do`)
URL: `https://cresi.incucai.gov.ar/cresi/OpenDocument.do?accion=%2Fcresi_le.do%3FCLICK_AND_LIST_HABILITADO%3Dtrue`

#### Parámetros de Paso 1 (Criterios de evaluación):
* **Reporte:** `COMPLETO - TODAS LAS LISTAS DE ESPERA` (para ver todas las listas en una misma tabla) o seleccionar una lista particular.
* **Situación en lista de espera:**
  * Para stock actual: `PACIENTES INSCRIPTOS EN LISTA DE ESPERA`.
  * Para diagnósticos de inscripciones en un período: `PACIENTES INSCRIPTOS EN CUALQUIER SITUACION`.
* **Filtros de cruce utilizados:**
  * `Provincia del paciente`: seleccionar una de las 24 provincias (o dejar sin filtro para el total nacional).
  * `Edad del paciente`: `PEDIATRICOS (<18)` o `ADULTOS (>=18)` (o sin filtro para todas las edades).
  * `Sexo del paciente`: `FEMENINO` o `MASCULINO` (o sin filtro para ambos sexos).
  * `Período de evaluación (fecha inscripción)`: `ESPECIFICAR: desde 01-01-2026 hasta 24-10-2026` (para diagnósticos actuales) o `OTRO AÑO: desde 1-1-AAAA hasta 31-12-AAAA` (para ingresos históricos).

#### Parámetros de Paso 2 (Salidas seleccionadas):
* `2. Pacientes agrupados por provincia de residencia`: genera tabla provincial cruzada por lista de espera.
* `10. Pacientes agrupados por diagnóstico principal`: genera tabla de frecuencias por diagnóstico clínico de ingreso.
* `16. Pacientes agrupados por antiguedad en lista de espera`: genera tabla con las 9 bandas oficiales de permanencia (`<1mes`, `1~3meses`, `3~6meses`, `6~12meses`, `1~2años`, `2~3años`, `3~7años`, `7~10años`, `>10años`).

---

### B. Reporte de prevalencia e incidencia en diálisis y lista de espera (`cresi_pre.do`)
URL: `https://cresi.incucai.gov.ar/cresi/OpenDocument.do?accion=%2Fcresi_pre.do%3FCLICK_AND_LIST_HABILITADO%3Dfalse`

#### Parámetros de Paso 1:
* **Evaluar:** `PACIENTES EN LISTA DE ESPERA` (para stock y movimientos de lista) o `PACIENTES EN DIALISIS` (para stock de diálisis).
* **Período de evaluación:** `desde 1-1-AAAA hasta 31-12-AAAA`.
* **Lista de espera:** elegir una de las 13 listas: `RENAL`, `CORNEAS`, `HEPATICA`, `CARDIACA`, `PULMONAR`, `RENOPANCREATICA`, `ESCLERAS`, `HEPATORRENAL`, `HEPATOINTESTINAL`, `HEPATOPANCREATICA`, `CARDIOHEPATICA`, `CARDIOPULMONAR` o `CARDIORRENAL`.

#### Parámetros de Paso 2:
* `2. Pacientes agrupados por provincia de residencia`.
* **Columnas de lectura:**
  * `Total LE`: pacientes inscriptos contabilizados al final del año evaluado (stock al cierre).
  * `Ing LE`: pacientes ingresados a la lista de espera durante el año evaluado.
  * `Total IRCT`: pacientes en diálisis contabilizados al final del año evaluado.

---

### C. Reporte de exclusiones de lista de espera (`cresi_exclusiones.do`)
URL: `https://cresi.incucai.gov.ar/cresi/OpenDocument.do?accion=%2Fcresi_exclusiones.do%3FCLICK_AND_LIST_HABILITADO%3Dtrue`

#### Parámetros de Paso 1:
* **Situación en lista de espera:** `PACIENTES CON EXCLUSION PERMANENTE`.
* **Lista de espera:** seleccionar lista.
* **Provincia del paciente:** fijar provincia para cruce provincial o dejar sin filtro para el total nacional.
* **Período de evaluación (fecha exclusión):** `OTRO AÑO: desde 1-1-AAAA hasta 31-12-AAAA` (nota: el encabezado del resultado impreso titula `fecha inscripción`, aunque el criterio fijado en el formulario sea fecha de exclusión).

#### Parámetros de Paso 2:
* `12. Pacientes agrupados por motivo de exclusión`.
* **Columnas de lectura:** `Tx c/DC` (trasplante donante fallecido), `Tx c/DV` (trasplante donante vivo), `Defunciones`, `Otras` y `TOTAL`. Los desgloses de motivos individuales se interpretan bajo el contrato versionado `nomenclatura_egresos.v1.json`.

---

### D. Reportes de distribución y tiempo de espera hasta trasplante

| Distribución | Formulario CRESI | Salida de tiempo | Unidad de tiempo |
| --- | --- | --- | --- |
| **Renal** | `cresi_renal.do` | Salida 29 | Meses |
| **Hepático** | `cresi_hepatico.do` | Salida 34 | Días |
| **Intratorácico** | `cresi_intratoracico.do` | Salida 28 | Meses |
| **Córneas** | `cresi_corneas.do` | Salida 28 | Meses |

#### Parámetros de Paso 1:
* **Período de evaluación:** `FECHA DESCLAMPEO: OTRO AÑO: desde 1-1-AAAA hasta 31-12-AAAA`.
* **Lista de espera del receptor:** seleccionar lista.
* **Provincia de residencia del receptor:** seleccionar provincia o dejar nacional.
* **Edad del receptor:** `ESPECIFICAR desde 0 hasta 17 años` o `desde 18 hasta 119 años`.

#### Parámetros de Paso 2:
* `Variables estadísticas del tiempo de espera hasta el trasplante`.
* **Campos leídos en la fila TOTAL:** `Total` (número de receptores $n$), `AVG*` (media), `MED*` (mediana), `P(0.25)*` (percentil 25) y `P(0.75)*` (percentil 75).

---

## 4. Cinco ejemplos reproducibles de control

### Ejemplo 1: Fotografía coordinada del mapa (24/10/2026)
* **Consulta:** `mapa_buenos_aires_18mas_femenino` (ejecutada el 24/10/2026 a las 10:44).
* **Criterios (Paso 1):** Formulario `cresi_le.do` · Reporte: `COMPLETO - TODAS LAS LISTAS DE ESPERA` · Situación: `PACIENTES INSCRIPTOS EN LISTA DE ESPERA` · Provincia: `BUENOS AIRES` · Edad: `ADULTOS (>=18)` · Sexo: `FEMENINO`.
* **Salidas (Paso 2):**
  * Salida 2 (Provincia): fila Buenos Aires TOTAL = 2.062 (Renal 993, Córneas 781, Hepática 147, Pulmonar 79, Renopancreática 36, Cardíaca 11, etc.).
  * Salida 16 (Antigüedad): fila Renal: `<1mes` = 31, `1~3meses` = 66, `3~6meses` = 85, `6~12meses` = 136, `1~2años` = 191, `2~3años` = 167, `3~7años` = 238, `7~10años` = 54, `>10años` = 25 (suma total = 993).
* **Trazabilidad:** `datos/extraidos/reportes_dinamicos/mapa_conjunto_20261024/mapa_buenos_aires_18mas_femenino/tabla_02.csv` (SHA256: `c58c783415796d517150685c4925606a696ac2bc36d6125d08c75f0c56f21dd1`).

### Ejemplo 2: Diagnósticos actuales de inscripción (2026)
* **Consulta:** `ingresos_2026_1024_renal_buenos_aires_18mas_femenino` (ejecutada el 25/10/2026 a las 18:46).
* **Criterios (Paso 1):** Formulario `cresi_le.do` · Reporte: `COMPLETO - TODAS LAS LISTAS DE ESPERA` · Situación: `PACIENTES INSCRIPTOS EN CUALQUIER SITUACION` · Lista: `RENAL` · Provincia: `BUENOS AIRES` · Edad: `ADULTOS (>=18)` · Sexo: `FEMENINO` · Período fecha inscripción: `desde 01-01-2026 hasta 24-10-2026`.
* **Salidas (Paso 2):** Salida 10 (Diagnóstico principal): TOTAL = 327 inscripciones en el período; diagnósticos principales: `1*DESCONOCIDA` = 83 (25,4%), `2*GLOMERULONEFRITIS` = 49 (15,0%), `5*NEFROANGIOESCLEROSIS` = 42 (12,8%), `6*POLIQUISTOSIS RENAL` = 39 (11,9%), `12*OTRA` = 36, `9*NEFROPATIA DIABETICA` = 27, `8*NEFROPATIA LUPICA` = 25.
* **Trazabilidad:** `datos/extraidos/reportes_dinamicos/ingresos_2026_corte_20261024/ingresos_2026_1024_renal_buenos_aires_18mas_femenino/tabla_03.csv` (SHA256: `dfec4bebe784793796cb54c5e31e5058ec473fe31f452077978f8cb08bb2dcda`).

### Ejemplo 3: Ingresos anuales históricos por diagnóstico
* **Consulta:** `ingresos_renal_2025_buenos_aires_todas` (ejecutada el 23/10/2026 a las 09:37).
* **Criterios (Paso 1):** Formulario `cresi_le.do` · Reporte: `COMPLETO - TODAS LAS LISTAS DE ESPERA` · Situación: `PACIENTES INSCRIPTOS EN CUALQUIER SITUACION` · Lista: `RENAL` · Provincia: `BUENOS AIRES` · Período fecha inscripción: `desde 1-1-2025 hasta 31-12-2025`.
* **Salidas (Paso 2):** Salida 10 (Diagnóstico principal): TOTAL = 980 inscripciones; `1*DESCONOCIDA` = 267 (27,2%), `2*GLOMERULONEFRITIS` = 173 (17,7%), `5*NEFROANGIOESCLEROSIS` = 122 (12,4%), `12*OTRA` = 105 (10,7%), `9*NEFROPATIA DIABETICA` = 100, `6*POLIQUISTOSIS RENAL` = 95. (En el reporte de prevalencia anual, la variable `Ing LE` registra 981).
* **Trazabilidad:** `datos/extraidos/reportes_dinamicos/ingresos_cruzados_20261023/ingresos_renal_2025_buenos_aires_todas/tabla_03.csv` (SHA256: `b1f8bbe53361377c32ea6872048b4f1c7a27899ab9fba92101f5e33a41dc713e`).

### Ejemplo 4: Egresos provinciales anuales por motivo
* **Consulta:** `egresos_renal_2025_buenos_aires_todas` (ejecutada el 23/10/2026 a las 09:31).
* **Criterios (Paso 1):** Formulario `cresi_exclusiones.do` · Situación: `PACIENTES CON EXCLUSION PERMANENTE` · Lista: `RENAL` · Provincia: `BUENOS AIRES` · Período fecha inscripción [sic]: `desde 1-1-2025 hasta 31-12-2025`.
* **Salidas (Paso 2):** Salida 12 (Motivo de exclusión): TOTAL = 982 bajas permanentes; `Tx c/DC` = 606 (61,7%), `Tx c/DV` = 79 (8,0%), `Defunciones` = 184 (18,7%), `Otras` = 113 (11,5%, desglosadas en `21*OTRA CAUSA` = 36, `4*PATOLOGIA CARDIACA` = 19, `18*ABANDONO` = 18, `81*RECHAZO TRASPLANTE` = 9, `7*PATOLOGIA NEOPLASICA` = 6, etc.).
* **Trazabilidad:** `datos/extraidos/reportes_dinamicos/egresos_cruzados_20261023/egresos_renal_2025_buenos_aires_todas/tabla_07.csv` (SHA256: `d866a2e99e288925d4f3b23e8006e232938f292394c259858544e6db6032b43b`).

### Ejemplo 5: Tiempo hasta el trasplante
* **Consulta:** `tiempo_trasplante_renal_renal_2025_cordoba_18_mas` (ejecutada el 26/09/2026 a las 20:10).
* **Criterios (Paso 1):** Formulario `cresi_renal.do` · Período: `FECHA DESCLAMPEO: OTRO AÑO: desde 1-1-2025 hasta 31-12-2025` · Lista: `RENAL` · Provincia receptor: `CORDOBA` · Edad receptor: `ESPECIFICAR desde 18 hasta 119 años`.
* **Salidas (Paso 2):** Salida 29 (Variables estadísticas del tiempo de espera hasta el trasplante): fila TOTAL: `Total` = 88 receptores; `AVG*` = 29,91 meses; `MED*` = 22,72 meses; `P(0.25)*` = 9,24 meses; `P(0.75)*` = 45,26 meses.
* **Trazabilidad:** `datos/extraidos/reportes_dinamicos/tiempos_trasplante_fotos_reducidas_faltantes_2005_2025/tiempo_trasplante_renal_renal_2025_cordoba_18_mas/tabla_02.csv` (SHA256: `5d8205a9f59b92ff50e8d08fb3f95268ead1fd145c57357ceaaae25286171cda`).

---

## 5. Reglas de cálculo y procesamiento

### A. Tasas por millón de habitantes (PMH)
$$\text{PMH} = \frac{\text{inscripciones seleccionadas en la provincia}}{\text{población provincial}} \times 1.000.000$$

* **Denominador del mapa:** Proyecciones provinciales de población INDEC al 01/07/2026, base Censo 2022, ambos sexos (total nacional: 46.466.688 habitantes), conservadas en la columna Población del reporte de situación actual del Registro Nacional de IRCT archivado (`foto_2026_08_28_dialisis/dialisis_activos_confirmados_foto_actual_base/tabla_02.csv`, SHA256: `f6ef954c8327673d1a5a759049b73be67bade241868f92e73cb1a302c8d9af9c`).
* **Denominador de la comparación anual (2005–2025):** Proyecciones poblacionales provinciales anuales de INDEC archivadas en `poblacion_indec_2005_2025_por_provincia.csv`.
* **Regla de filtrado demográfico:** El denominador es invariablemente la **población provincial total**, aun cuando el numerador esté filtrado por edad (`<18`, `≥18`) o sexo (`femenino`, `masculino`). CRESI no provee denominadores desagregados por edad y sexo para cada provincia en esa fuente.

### B. Balance anual no conciliado (Caso Renal 2025)
La animación de movimientos es un recurso ilustrativo que suma ingresos y resta egresos a partir del cierre del año anterior. Sin embargo, no debe interpretarse como un balance contable cerrado:

* **Nivel nacional Renal 2025:**
  * Stock al 31/12/2024: 5.166
  * Ingresos 2025 (`Ing LE`): 2.417 (en reporte por fecha de inscripción: 2.559)
  * Egresos 2025 (exclusiones permanentes): 2.388 (1.524 Tx DC + 225 Tx DV + 429 defunciones + 210 otras)
  * Cálculo ilustrativo: $5.166 + 2.417 - 2.388 = 5.195$ (coincide exactamente con el stock publicado al cierre 2025: 5.195).
* **Nivel provincial Buenos Aires Renal 2025:**
  * Stock al 31/12/2024: 2.042
  * Ingresos 2025: 981 (`Ing LE`) ó 980 (por fecha de inscripción)
  * Egresos 2025: 941 (en tabla nacional) ó 982 (en consulta provincial filtrada con fecha de exclusión)
  * Stock publicado al 31/12/2025: 2.081
  * Saldo calculado: $2.042 + 981 - 982 = 2.041 \neq 2.081$ (discrepancia de 40 casos).

Esta diferencia se origina en que las consultas evalúan criterios no idénticos (fecha de exclusión vs fecha de inscripción) y no rastrean traslados de domicilio entre provincias a lo largo del año. La visualización expone ambas cifras sin forzar conciliaciones artificiales.

---

## 6. Inventario de descargas y trazabilidad

Todos los archivos están disponibles en la carpeta pública `public/datos/`:

### Fotografía actual y mapa (24/10/2026)
* `mapa-demografia.json`: 225 consultas agregadas del mapa cruzadas por lista, provincia, edad, sexo y antigüedad.
* `auditoria-mapa-demografia.json`: Detalle de 6.278 controles de sumas, celdas sin resultado y fuentes con SHA256.

### Diagnósticos de inscripción 2026
* `diagnosticos-inscripcion-2026.json`: Diagnóstico principal de inscripciones 01/01 al 24/10/2026 por lista, provincia, edad y sexo.
* `fuentes-diagnosticos-inscripcion-2026.json`: 2.925 consultas con ruta al HTML original y SHA256 verificado.

### Movimientos y egresos anuales (2005–2025)
* `conteos-anuales-por-lista.json`: Total LE por lista, año y provincia (273 combinaciones lista-año).
* `flujos-anuales-lista.json`: Movimientos anuales e ingresos/egresos nacionales clasificados bajo nomenclatura v1.0.0.
* `ingresos-anuales.json`: Diagnósticos de ingreso por lista, año y provincia (6.825 consultas).
* `fuentes-ingresos-anuales.json`: Fuentes y firmas SHA256 de ingresos anuales.
* `egresos-provinciales.json`: Egresos provinciales anuales desglosados por causas (6.552 consultas).
* `fuentes-egresos-provinciales.json`: Fuentes y firmas SHA256 de egresos provinciales.
* `nomenclatura_egresos.v1.json`: Contrato versionado de categorías de egreso.

### Tiempos hasta el trasplante e historia
* `tiempos-y-fuentes.json`: 13.104 celdas de tiempo (mediana, P25, P75, n y media) para 2005–2025 por lista, provincia y edad.
* `percentiles-nacionales-por-lista.json`: Percentiles nacionales de listas hepáticas extraídos de filas explícitas.
* `historia-y-fuentes.json`: Serie renal nacional histórica y fuentes de donantes.

### Población en diálisis y demografía
* `poblacion-dialisis-2025.json`: Población en diálisis al 31/12/2025 (31.431 pacientes) y fuente.
* `tiempo-dialisis.json`: Diálisis previa al trasplante en receptores renales trasplantados.
* `poblacion_indec_2005_2025_por_provincia.csv`: Población provincial anual INDEC 2005–2025 para cálculo de PMH.

### Documentación técnica y material archivado
* `guia-consultas-cresi.md`: Este documento técnico.
* `parcial-2026.json`: Material archivado del corte parcial enero–julio 2026, conservado exclusivamente con fines de trazabilidad histórica.
