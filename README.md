# La Espera

Recorrido interactivo por las listas de espera y la donación de órganos en Argentina. Versión 2 actualizada el 3 de octubre de 2026.

Página: https://monoxido1984.github.io/la_espera/

## Versiones

- Versión 2: entrada principal y rutas /espera/ y /espera-v2/.
- Versión 1: oculta; no tiene ruta pública ni enlaces en la página. Se conserva en el archivo y el historial de Git.
- La copia congelada está en versiones/v1-20261002/, con manifiesto SHA256 y el commit de origen.

La V2 empieza sin estadísticas y transforma un mismo universo de puntos durante nueve escenas. Cada punto representa una unidad publicada: inscripción, donante o trasplante, según la escena. Las poblaciones distintas se disuelven entre escenas; no se crean registros individuales ni conversiones entre donación y trasplantes. Antigüedad y provincia preservan las distribuciones marginales de cada lista. La explicación completa permanece al final de la página.

## Ejecutar

Requiere Node.js 22.13 o superior.

```sh
npm ci
npm run dev
```

Abrir http://localhost:3000/la_espera/espera/.

## Publicación

GitHub Pages usa GitHub Actions como origen. Cada actualización de `main` verifica los tipos, ejecuta las pruebas, compila una exportación estática de Next.js y publica `out/`.

```sh
npm run lint
npm test
npm run build
```

## Datos y límites

Los JSON de `app/*.generated.json` y `public/datos/` conservan el corte y las referencias de los agregados públicos usados en la página. El mapa está en `public/geo/`. La compilación usa estas instantáneas y no consulta CRESI ni requiere el repositorio de adquisición.

El detalle de fuentes, fechas, universos y limitaciones aparece en los paneles «Datos y método» y las descargas de la página. Las tablas marginales no representan microdatos ni permiten reconstruir trayectorias individuales. Los tiempos hasta trasplante corresponden a receptores efectivamente trasplantados. Las ausencias se muestran como datos no disponibles.

La narrativa, los datos y el diseño de la versión local se conservan. La copia publicada adapta únicamente la compilación y las rutas a `/la_espera/`.
