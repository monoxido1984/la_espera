# La Espera

Recorrido interactivo por las listas de espera y la donación de órganos en Argentina. Versión de trabajo publicada el 2 de octubre de 2026.

Página: https://monoxido1984.github.io/la_espera/

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
