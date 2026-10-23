# La Espera

Exploración visual de las listas de espera de órganos y tejidos en Argentina, con estadísticas públicas agregadas de CRESI / SINTRA · INCUCAI. Actualización: 23/10/2026.

Sitio: https://monoxido1984.github.io/la_espera/

## Recorrido actual

Cinco escenas: reloj de arena, cifra de inscripciones, listas/provincias/antigüedad, foco renal en diálisis y lista de espera, y comparación anual. «Sobre los datos» abre un panel desplegable que explica reportes, filtros, salidas, cruces, cálculos y límites e incluye descargas para auditar los valores.

La sección anual permite elegir lista, provincia y edad en el período 2005–2025. Representa ingresos, lista y egresos mediante puntos apilados, con una escala común de cantidades. Las causas de exclusión permanente verificadas son nacionales y para todas las edades; no se trasladan a otros filtros. Incluye dos curvas: tamaño de la lista y media de espera de receptores trasplantados, con unidades y faltantes explícitos. Los egresos ya incluyen trasplantes y fallecimientos: no se suman de nuevo. La diferencia entre el balance de movimientos y el cierre publicado se conserva explícita, porque los reportes no constituyen un balance conciliado. Los nuevos cruces provinciales en adquisición aún no forman parte de esta publicación.

Diálisis presenta un escenario hipotético de 52 semanas × 3 sesiones × 4 horas para los 31.431 pacientes al cierre de 2025: no son horas observadas. El tiempo previo al trasplante renal usa un universo distinto de 1.542 receptores. Los puntos son unidades gráficas de agregados, no pacientes identificados ni trayectorias clínicas.

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
