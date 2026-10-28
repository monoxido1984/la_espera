# La Espera

Exploración visual de las listas de espera de órganos y tejidos en Argentina, con estadísticas públicas agregadas de CRESI / SINTRA · INCUCAI. Actualización: 23/10/2026.

Sitio: https://monoxido1984.github.io/la_espera/

## Recorrido actual

Cuatro escenas: reloj de arena, cifra de inscripciones, listas/provincias/antigüedad y comparación anual. Al seleccionar Riñón en la escena 02 se puede abrir la exploración contextual de diálisis y regresar a los mismos filtros. «Sobre los datos» abre un panel desplegable que explica reportes, filtros, salidas, cruces, cálculos y límites e incluye descargas para auditar los valores.

La sección anual permite elegir lista y provincia, siempre con todas las edades en el período 2005–2025. Se recorre en dos momentos reversibles: Movimientos e Historia. El año y los filtros se conservan al avanzar. Movimientos muestra los totales de ingresos y egresos sobre sus columnas, sus motivos dentro del mismo diagrama y la cantidad publicada de personas en lista al cierre. La animación suma ingresos y resta egresos desde el cierre anterior; su resultado ilustrativo se distingue de la cifra publicada. Si faltan cantidades necesarias o el cálculo sería negativo, no se anima la operación. En Historia el foco inicial es la mediana de espera con banda P25–P75, con las cantidades como vista alternativa; sus años se pueden seleccionar también desde el gráfico. Las ramas de ingresos y egresos tienen escalas independientes y no representan trayectorias individuales. Incluye dos curvas alternativas: tamaño de la lista y mediana de espera de receptores trasplantados con banda P25–P75, con unidades y faltantes explícitos. Los egresos ya incluyen trasplantes y fallecimientos: no se suman de nuevo. La diferencia entre el cálculo ilustrativo y la cifra publicada se explica en «Sobre los datos», porque los reportes no constituyen un balance conciliado.

Diálisis presenta un escenario hipotético de 52 semanas × 3 sesiones × 4 horas para los 31.431 pacientes al cierre de 2025: no son horas observadas. El tiempo previo al trasplante renal usa un universo distinto de 1.542 receptores. Los puntos son unidades gráficas de agregados, no pacientes identificados ni trayectorias clínicas.

## Revisión local del recorrido · 23/10/2026

Las escenas incorporan invitaciones breves para avanzar, explorar los grupos y recorrer los años. Las instrucciones cambian con la dimensión elegida y con el avance del control de diálisis. El cierre permite volver a explorar o abrir «Sobre los datos». Las notas sobre movimientos, conciliación, fuentes y tamaño de la cohorte del año seleccionado se consultan en ese panel; las unidades y los estados sin dato siguen junto a los gráficos. Se conservan los datos, las categorías, los gráficos y la apertura. Esta revisión forma parte de la versión unificada.

## Ejecutar y validar

Requiere Node.js 22.13 o superior.

```sh
npm ci
npm run dev
```

Abrir http://localhost:3000/la_espera/.

```sh
npm run lint
npm test
npm run build
```

Las pruebas verifican conteos, celdas, filtros, unidades, escenarios y recorridos reversibles. Las comprobaciones de bytes de originales sólo se ejecutan cuando está presente el proyecto de adquisición; en esta copia independiente se omiten explícitamente. Los controles de sumas, cobertura y coincidencia entre datos internos y descargas sí se ejecutan aquí y en GitHub Actions.

## Datos y reproducción

- [Guía de búsquedas CRESI, filtros y preparación](public/datos/guia-consultas-cresi.md).
- `public/datos/`: agregados descargables, períodos y referencias de origen.
- `app/v2/annual-time.generated.json`: 13.104 celdas conjuntas de 2005–2025, con huella del derivado padre.
- `app/wait-time-province.generated.json` y `app/dialysis-history.generated.json`: referencias usadas para validar las celdas y cohortes, además de las descargas correspondientes.

Los reportes dinámicos pueden cambiar: la fotografía de situación actual del 28/08/2026 sólo puede reproducirse exactamente con las respuestas conservadas en el proyecto de adquisición. Los JSON conservan rutas y hashes, no todos los HTML originales. Esta web compila con archivos locales; no consulta CRESI ni necesita credenciales.

## Publicación y mantenimiento

GitHub Actions ejecuta instalación, lint, pruebas y exportación estática al actualizar `main`, y publica `out/` en GitHub Pages. Las rutas `/`, `/espera/` y `/espera-v2/` muestran el recorrido actual bajo `/la_espera/`.

Este árbol conserva los archivos de la versión actual y sus pruebas. La versión anterior y sus recursos retirados se recuperan del historial de Git. `public/og.png` se mantiene porque lo usan Open Graph y Twitter al compartir el enlace. Dependencias y resultados de compilación están excluidos de Git.


## Egresos: detalle desplegable y nomenclatura auditada

La leyenda muestra Trasplante, Fallecimiento y Otros motivos de egreso. Trasplante y Otros motivos abren ventanas superpuestas con desplazamiento propio, cierre por botón o Escape y retorno del foco, sin aumentar la altura de los gráficos. La curva de tiempo medio aparece antes que la evolución del tamaño de la lista. Los desgloses se cierran al cambiar año o filtros. Se conserva la clasificación oficial: el subtotal Otras puede incluir córnea del exterior; no equivale a la categoría individual Otros motivos no especificados.

La nomenclatura v1.0.0 conserva códigos y rótulos originales, presenta nombres uniformes y une solo categorías idénticas aprobadas. Auditoría nacional 2005–2025: 273 casos, 234 con cifras y 39 ausencias explícitas; ocho reportes con etiquetas repetidas; totales preservados. Evidencia y correspondencias: docs/auditoria_egresos_20261023/. Diccionario público: datos/nomenclatura_egresos.v1.json. La visualización incorpora los cruces de egresos por lista, provincia y año cuando CRESI publicó un resultado.

## Mediana y banda P25–P75

La línea de tiempo prioriza medianas publicadas para la selección; cuando faltan, utiliza la media disponible, identificada como Media y con trazo discontinuo, sin banda. Los tramos de distintas estadísticas no se unen; el sombreado usa P25 y P75 de la misma cohorte y se interrumpe en los faltantes. No se agregan cuantiles de provincias ni edades y no se construyen percentiles a partir de la media. La serie renal nacional conserva su referencia archivada. Las filas hepáticas nacionales explícitas se extraen mediante `scripts/construir_percentiles_nacionales_web.py` del proyecto de adquisición (sin descargas); cada fila conserva fuente, SHA256 y contexto de consulta. La mediana nacional no se deriva del TOTAL de los módulos intratorácico o de córneas. En los cruces de provincia y edad se conservan los percentiles originales de cada celda. Las selecciones sin mediana muestran la media disponible; si faltan ambas, se conserva el hueco. Las medias siguen disponibles en «Sobre los datos».

Versión local canónica: http://127.0.0.1:3015/la_espera/ (npm run dev -- --hostname 127.0.0.1 --port 3015). Incluye diagnósticos de ingresos por lista/año/provincia. Generación desde la raíz de adquisición: scripts/construir_ingresos_web.py. El servidor previo 3002 queda retirado.

## Ingresos por diagnóstico

En Movimientos, el desplegable de ingresos muestra los diagnósticos principales por lista, año (2005–2025) y provincia, todas las edades. Incluye 6.825 reportes verificados: 3.508 con datos y 3.317 sin resultado, que no se convierten en cero. Conserva códigos y etiquetas originales. El reporte por fecha de inscripción y el indicador Ing LE se muestran por separado cuando difieren. Cifras y fuentes SHA256 disponibles como descargas.


Actualización 24/10/2026: Ingresos y Egresos llevan a Motivos. Los ingresos muestran los diez diagnósticos más frecuentes y el resto en Otros, en barras de puntos con escala común. La etiqueta central incluye un asterisco cuya explicación de discrepancia está en Sobre los datos; se retira el renglón Cierre publicado. El filtro de edad anual fue retirado sin modificar las fuentes originales.

## Cruces incorporados — 26/10/2026

«Esperar… ¿por qué?» se abre como cuarta vista de la escena 02. Muestra los diagnósticos principales de las inscripciones del 01/01 al 24/10/2026, cruzados por lista, provincia, edad y sexo. Se verificaron 2.925 consultas originales: 1.090 con resultado y 1.835 con ausencia explícita. Esta población del período no equivale al stock actual.

La escena anual ahora muestra egresos provinciales observados, por lista y año, con sus motivos. Se verificaron 6.552 consultas de 2005 a 2025: 3.205 con resultado y 3.347 sin resultado publicado. Un faltante se presenta como s/d, nunca como cero. Las descargas y fuentes con SHA256 están en «Sobre los datos».

## Exploración local — 24/10/2026

La selección de lista y provincia se comparte entre las escenas 02 y 03. Los filtros de edad, sexo y antigüedad del mapa no se convierten en cruces anuales inexistentes. La diálisis se abre únicamente desde Riñón dentro de la escena 02, como otra población y un escenario ilustrativo; al cerrarla se restauran lista, provincia, edad y antigüedad.

Movimientos incorpora tres columnas con bandas independientes para diagnósticos de ingreso y motivos de egreso, selección con cantidad/porcentaje y expansión en el gráfico. La cantidad publicada de personas en lista se distingue del resultado ilustrativo de la animación. Los diagnósticos usan su propio reporte por fecha de inscripción; la diferencia posible con Ing LE se explica en «Sobre los datos».

Comparar permite elegir otro año o provincia, superponer el stock con una escala común desde cero y leer diferencias de stock, ingresos, egresos y tiempos cuando tienen la misma estadística y unidad. Los egresos provinciales ausentes permanecen s/d. Los hallazgos describen diferencias de stock observadas, sin atribuir causas.

Validación: lint y 66 pruebas aprobadas, 2 omitidas por depender de originales de adquisición. Revisados en navegador de escritorio: expansión y selección, porcentajes, comparación anual/provincial y faltantes. La revisión móvil a 390×844 queda pendiente: el navegador conectado no expone emulación de viewport. No se modificaron fuentes ni se publicó.

Build final: `npm.cmd run build` completado con código 0 y las cuatro rutas estáticas generadas. Se mantiene el aviso de Next.js sobre múltiples lockfiles; no se modificó la estructura de dependencias. Lint final aprobado después de la revisión.

PMH recuperado (24/10/2026): conteos actuales / población provincial INDEC al 01/07/2026 × 1.000.000. Se conserva el mismo denominador anual auditado de agosto, extraído sin invertir tasas redondeadas; véase app/v2/population-2026.json (ruta y SHA256). Edad, sexo, lista y antigüedad filtran el numerador conjunto publicado; el denominador sigue siendo la población total de cada provincia, no la del subgrupo. Los faltantes permanecen ausentes. Cambiar filtros no restablece Cantidad. Verificado en navegador: Provincia → Por millón → Menores de 18 conserva PMH.

## Recorrido y comparación por sexo — 25/10/2026

En 02, elegir un órgano abre el mapa; elegir una provincia abre la antigüedad ya transcurrida en lista, conservando lista, provincia y filtros. Los botones de Lista, Provincia y Antigüedad permiten cambiar de vista. Edad y sexo se eligen con botones segmentados, sin desplegables. PMH sigue disponible en el mapa.

En antigüedad, «Superponer mujeres y hombres» muestra ambas distribuciones en una escala común de cantidades o porcentajes dentro de cada sexo. Utiliza las celdas conjuntas existentes de lista × provincia × edad × sexo × antigüedad. No son tiempos hasta el trasplante. Los faltantes se muestran como s/d; no se convierten en ceros. «Volver a los puntos» recupera la visualización animada. Elegir una marca de una curva conserva ese sexo al explorar la banda.

Verificación: 69 tests aprobados, 2 omitidos; navegador de escritorio y 390×844: Riñón → Córdoba → antigüedad, superposición, porcentajes, cambio de edad y selección por teclado; sin desplegables en 02, sin errores de consola y sin desbordamiento horizontal móvil (scrollWidth 375, viewport 390). Metodología únicamente en Sobre los datos. Sin modificaciones a fuentes ni publicación.

25/10/2026: la comparación de antigüedad se presenta directamente como pares de barras horizontales de puntos por tramo: mujeres violeta y hombres azul. Longitudes con escala común; cantidades o porcentajes y valores por sexo. Se conserva la vista total sin separar y la selección interactiva de bandas. Sin fuentes nuevas ni publicación.

### Escena 03 — 28/10/2026
Un único gráfico alterna tiempos, donación y cantidad, con comparación entre provincias o frente a Argentina y un mensaje calculado entre años disponibles del mismo estadístico. Los tiempos mantienen mediana/banda o media discontinua; la donación corresponde a todos los órganos. El cierre retoma la pregunta inicial.
