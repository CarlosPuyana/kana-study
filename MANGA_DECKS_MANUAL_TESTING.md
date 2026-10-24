# Pruebas manuales locales de Manga × Mazos hasta H3B-B1

## Arranque y datos

Desde `C:\Users\pacam\Desktop\kana-study`:

```powershell
npm run start:manga-manual
```

Abre **http://127.0.0.1:4401/#/manga** en un perfil de navegador separado para pruebas. Mantén ese host y puerto: `localhost` y otros puertos tienen almacenamientos distintos. Para detener el servidor, Ctrl+C en su terminal. Si ya está arrancado, basta con abrir la dirección.

El modo utiliza Guest y almacenamiento local persistente. No borra ni migra datos existentes: un perfil separado evita mezclar tus datos habituales con estas pruebas. No inicia sesión ni restaura cuentas. No contiene semillas ni crea mangas, tarjetas o diccionarios automáticamente.

## Recorrido manual

1. En Manga, utiliza **Añadir manga** con un ZIP/CBZ local compatible que incluya imágenes y OCR Mokuro. Puedes consultar la guía de importación existente. Para estas pruebas usa la importación local, no enlaces de descarga remotos.
2. Instala el diccionario desde el control existente de Manga si el perfil nuevo no lo tiene. Abre **Leer** y activa OCR y diccionario en los ajustes del lector si hace falta.
3. Selecciona texto OCR manualmente. Tras H2B-UX1.1 aparece **Añadir rápido** con pie de guardado accesible, contexto desplegable y destino abreviado. Si la propuesta es única y completa, revisa y pulsa **Añadir al mazo**. Con varias lecturas/sentidos, elige dentro del panel. Sin propuesta, aparecen directamente Lectura y Significado; un envío vacío enfoca el primer campo pendiente sin abrir toda la edición. **Editar** despliega los campos avanzados. No hay casilla de otra identidad; solo ante tarjetas relacionadas se ofrece reutilizar una para añadir contexto o crear explícitamente otra identidad. Solo la confirmación final guarda; después el panel se cierra y vuelves al lector.
4. Vuelve a Biblioteca y abre **Vocabulario confirmado** del volumen. Desde una tarjeta confirmada, pulsa **Buscar en OCR** y después **Abrir página…** en una aparición concreta.
5. Comprueba la página, el marco discontinuo de la línea y el rango UTF-16 del panel. El marco no representa caracteres exactos. Prueba atrás/adelante, cambiar de página y **Quitar localización**. Para añadir otra tarjeta, vuelve a seleccionar y confirmar manualmente.
6. **Estudiar este mazo** permite probar el repaso local existente. Sus calificaciones modifican únicamente el historial local correspondiente; este cambio no modifica el scheduler ni FSRS.

Las traducciones y explicaciones remotas están deshabilitadas en este modo; no forman parte de este recorrido. No hay sincronización de estas tarjetas ni uso de Supabase. Los cambios de workspace se cubren con pruebas automatizadas: no es necesario iniciar sesión para simularlos durante la prueba manual Guest.

## Aislamiento técnico

Para repetir el caso H2B-UX1.1, recarga completamente con Ctrl+F5 sin borrar almacenamiento. Selecciona `大丈夫` en `大丈夫、大丈夫。一緒に行こう。`. El ZIP distribuido contiene dos lecturas y tres glosas: su elección requiere intervención humana. Si tu instalación no devuelve propuesta, completa los campos manuales. Diagnóstico, capturas anteriores/nuevas y resultados están en `MANGA_DECKS_H2BUX11.md`. La aceptación de UX sigue pendiente de tu nueva prueba manual.

`start:manga-manual` selecciona una configuración Angular explícita, un tsconfig propio y `src/main.manga-manual.ts`. Solo esa entrada importa los providers de `src/app/development/manga-manual.providers.ts`. El arranque exige `isDevMode()` y hostname exactamente `localhost` o `127.0.0.1`; cualquier otro host o modo de producción se rechaza antes del bootstrap.

- CUSTOM_DECKS_ENABLED y MANGA_DECK_ASSISTED_ENABLED: true, signals de solo lectura.
- CUSTOM_DECK_SYNC_ENABLED: false, signal de solo lectura.
- CUSTOM_REMOTE_UPLOAD_APPROVED: false.
- Workspace Guest inicializado antes de los componentes.
- SupabaseClientService sustituido por cliente no configurado que devuelve null; no instancia SDK, restaura sesión ni solicita nube aunque exista configuración pública o almacenamiento anterior.
- MANGA_ASSISTANT_ENDPOINT: null, sin modificar el servicio ni análisis lingüístico existentes.

No hay interruptor URL, localStorage o preferencias. `npm start` sigue usando los gates ordinarios false. El build predeterminado y GitHub Pages siguen utilizando `src/main.ts`, sin providers manuales. No se modifica sincronización, diccionario, estadísticas, scheduler, SQL ni datos anteriores. No hay dependencias nuevas ni cambios de presupuesto.

## Validación (2026-10-24)

Estos resultados corresponden a la preparación del entorno anterior a H2B-UX1. La validación del nuevo flujo Añadir rápido y sus capturas están en `MANGA_DECKS_H2BUX1.md`; se conserva esta evidencia histórica sin atribuirle los cambios posteriores.

Las pruebas automatizadas usan contextos temporales propios, nunca el perfil donde realizarás las pruebas manuales. Las comprobaciones de navegador sobre el servidor manual no insertan tarjetas.

- Tests dirigidos: **46/46**, cinco archivos (providers manuales, confirmación, formulario, localización y vocabulario).
- Suite Angular final: **1980/1980**, 194 archivos.
- Playwright existente de Manga × Mazos: **33/33**, escritorio oscuro/móvil claro/móvil estrecho oscuro, después del ajuste de espera descrito abajo.
- TypeScript app/spec y tsconfig manual: correctos.
- Build `npm run build -- --base-href /kana-study/ --stats-json`: correcto, **749,43 kB iniciales**, cuatro warnings SCSS conocidos. Presupuesto sin cambios.
- Grafo real de producción: entryPoint `src/main.ts`; ningún input del arranque o providers `manga-manual`. También se comprobó que su mensaje de guardia no aparece en los JS emitidos.
- Smoke Chromium del servidor manual: gates de UI activos, Guest incluso con un workspace de cuenta sintético persistido, Auth no configurado/no autenticado, ruta de vocabulario accesible, ninguna solicitud Supabase. Sin tarjetas insertadas ni creadas en ese contexto.
- `git diff --check`: correcto; únicamente avisos LF/CRLF. Comparación SHA-256 con el estado inicial: ningún archivo anterior eliminado ni modificado fuera de los ocho archivos listados abajo.

La primera pasada Playwright terminó 32/33: una aserción preexistente de H3B-A consultaba `result().entries` durante una recarga reactiva tras calificar, cuando `result()` era null. Se conserva la exigencia `{state:'learning',reasons:[]}` y se espera ese estado mediante `expect.poll`, sin sleeps ni reintentos del escenario. La segunda pasada completa terminó 33/33. No se modificó FSRS, clasificación ni código de la vista.

Archivos de esta preparación: `angular.json`, `package.json`, `tsconfig.manga-manual.json`, `src/main.manga-manual.ts`, `src/app/development/manga-manual.providers.ts`, su spec, el ajuste de aserción en `e2e/manga-decks-assisted.spec.ts` y este documento. Los gates y providers de producción permanecen intactos. Evidencia local ignorada: `.cache/manual-*.log` y smoke script.

No se han probado Safari ni dispositivos físicos en esta preparación. La ejecución automática usa datos sintéticos efímeros; no sustituye tus pruebas de usabilidad con un manga local y tus decisiones manuales. No se desplegó SQL ni se hizo commit/push. No se inicia otro hito.
