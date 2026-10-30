# La Espera

Exploración visual de las listas de espera de órganos y tejidos en Argentina, con estadísticas públicas agregadas de CRESI / SINTRA · INCUCAI.

**[Abrir la versión publicada](https://monoxido1984.github.io/la_espera/)**

## Recorrido

- Apertura y cifra de inscripciones activas.
- Listas, provincias, antigüedad y diagnósticos, con filtros conjuntos de edad y sexo. Mapa en cantidades o por millón de habitantes. Contextos de donación actual y diálisis.
- Una serie principal de tiempos 2005–2025, con comparación entre provincias o Argentina usando la misma estadística. Donación y lista al cierre son contextos opcionales en PMH sobre un eje auxiliar.
- Cierre que retoma «¿Cuánto tarda una segunda oportunidad?»; los puntos forman un umbral abierto.

«Sobre los datos» reúne las fuentes, períodos, criterios de lectura, límites y descargas de la versión vigente. Las inscripciones no equivalen a personas únicas deduplicadas. Los tiempos de receptores trasplantados no predicen una espera individual. El escenario de diálisis es ilustrativo.

## Ejecutar

Node.js 22.13 o superior.

```sh
npm ci
npm run dev
```

Abrir `http://localhost:3000/la_espera/`.

```sh
npm run lint
npm test
npm run build
```

## Estructura y datos

- `app/v2/`: recorrido, modelos y agregados usados por la aplicación.
- `app/`: entradas de Next.js y fuentes compartidas. `wait-time-province.generated.json` se conserva como referencia de validación de las celdas compactas; no se carga en la web.
- `public/datos/`: descargas y auditorías de los conjuntos utilizados. La [guía de consultas](public/datos/guia-consultas-cresi.md) explica cómo reproducir las búsquedas.
- `public/og.png`: imagen de vista previa al compartir.
- `scripts/`: comprobaciones de datos, filtros, unidades y representación.

La fotografía actual corresponde al 27/10/2026; las series anuales cubren 2005–2025. Los archivos conservan referencias y hashes de origen. Los originales completos permanecen en el proyecto de adquisición, fuera de este repositorio web. Las verificaciones que requieren originales externos se omiten explícitamente si no están disponibles. La web compila con datos locales y no requiere credenciales.

## Publicación

Al actualizar `main`, GitHub Actions ejecuta instalación, lint, pruebas y exportación estática, y publica `out/` en GitHub Pages. `/`, `/espera/` y `/espera-v2/` abren el mismo recorrido bajo `/la_espera/`.

El árbol publicado contiene la versión vigente. Las implementaciones y los conjuntos retirados siguen recuperables en el historial de Git. Dependencias, compilaciones y archivos de entorno están excluidos de Git.

## Introducción y cierre · revisión local

Se conserva la versión GitHub origin/main f1755d7, incluidas las escenas 02 y 03. Sólo se incorporan tres bloques introductorios (necesidad de órganos, trámite de inscripción y asignación) y el cierre con el reloj. El trámite de inscripción de 2025 permite comparar las diez listas con datos contra el total nacional publicado. Los nuevos contextos conservan fuentes y descargas en Sobre los datos. Versión preparada para publicación en GitHub Pages.

Corrección de apertura: pregunta y título en flujo normal y número formado por puntos en el primer bloque de la escena 01. Se retira el desplegable jurisdiccional del trámite renal. Escena 03 exclusivamente con medias, sin deslizador de años; los puntos conservan el detalle anual.

## Antes de la lista · todas las listas de 2025
La vista inicial usa la media TOTAL publicada: 6,1 meses, 184 días, 5.823 inscripciones completadas por método normal. El selector compara con una de las diez listas con datos y muestra su cantidad; no se convierte en cero una lista sin fila. `node scripts/prepare-registration-context.mjs` genera el contexto desde la consulta nacional archivada en `inscripcion_listas_2025`, sin consultas adicionales. La descarga y los criterios están en Sobre los datos.

La asignación incorpora dos agregados de órganos de 2025: al menos 3.350 inscripciones y 2.488 trasplantes. No son una cohorte vinculada ni se resta para estimar el crecimiento de la lista. Datos y SHA256 en allocation-context.generated.json y su descarga; reproducción local con `python scripts/prepare-allocation-context.py <raíz_adquisición>`, que sólo lee fuentes archivadas.

## Jerarquía visual y comparación temporal
Se unifican tamaños de títulos, resultados y lectura. La serie anual ocupa su propia sección completa y tiene leyenda por territorio y tipo de trazo. El contexto alterna cantidades y PMH, sin normalizar los tiempos por población. Antes de la lista permite alternar el total y las cinco etapas ya publicadas para cada lista de 2025, conservando redondeos y faltantes. El diálogo renal se titula Esperar, antes de esperar.

## Comparación y perfiles simulados
La escena 03 compara por provincia o por lista de forma excluyente. La opción Todas pondera las 13 listas con tiempos publicados; los tiempos se convierten a una unidad común. El reloj genera perfiles ficticios reproducibles a partir de celdas conjuntas publicadas de lista, residencia, sexo, edad agrupada y antigüedad. Edad y duración exactas son ilustrativas; reglas y límites en Sobre los datos. Validación: scripts/simulated-waiting-profile.test.mjs.
