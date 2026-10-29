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

Se conserva la versión GitHub origin/main f1755d7, incluidas las escenas 02 y 03. Sólo se incorporan tres bloques introductorios (necesidad de órganos, trámite renal y asignación) y el cierre con el reloj. El trámite puede explorarse por organismo jurisdiccional, no por residencia ni por tipo de lista. Los nuevos contextos conservan fuentes y descargas en Sobre los datos. Versión preparada para publicación en GitHub Pages.
