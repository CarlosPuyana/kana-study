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
# Copias de seguridad locales — RELEASE-MANGA-2A

En el modo manual Guest, abrir **Mazos → Datos y progreso → Copias de seguridad de Mazos**.
Exportar copia descarga un JSON validado con tarjetas, contextos, identidad, configuración,
historial completo y journal. No incluye archivos Manga, imágenes, OCR completo,
diccionario ni credenciales. El fichero puede contener texto privado; no está cifrado.

Para recuperar, abrir un perfil de navegador limpio en el mismo origen/puerto local,
sin crear tarjetas ni abrir borradores primero. Entrar en la misma pantalla, seleccionar
el fichero, revisar la vista previa, marcar la confirmación y restaurar. Esperar el
mensaje de commit confirmado. Las tarjetas pueden estudiarse aunque el perfil no tenga
el Manga original. Recargar/cerrar/reabrir conserva los datos restaurados.

V1 admite Guest local y destino vacío. Rechaza cuentas, coordinación cloud no portable,
datos corruptos y destinos ocupados sin sobrescribir ni descartar evidencia. No ofrece
merge ni limpieza destructiva. Conservar copias fuera del perfil: borrar datos del sitio
o perder el dispositivo puede eliminar todo el progreso local.

Los gates de producción continúan false y la publicación sigue bloqueada. Detalles,
límites y resultados: MANGA_DECKS_RELEASE_2A.md. No usar cuentas privadas en las pruebas.

# Espacios locales Guest y cuenta — RELEASE-MANGA-2B

Mazos indica qué espacio estás utilizando. Las tarjetas personalizadas y su progreso
se guardan solo en ese navegador: iniciar sesión no las sube a tu cuenta.

Al entrar con mazos Invitado, lee el aviso y elige **Continuar sin copiar mazos** para
usar el espacio local de la cuenta. Invitado se conserva. **Cancelar y seguir en Invitado**,
la cruz o Escape cancelan la elección local; no se importan tarjetas. Si también hay
progreso compatible, la fusión opcional se limita al alcance descrito en el diálogo:
no incorpora los mazos personalizados. Tab y Mayús+Tab recorren sus controles.

Cerrar sesión devuelve a Invitado; los mazos de la cuenta quedan en su propio espacio.
El estado de sincronización de Perfil corresponde al sistema legacy compatible y excluye
mazos custom. «Solo local · sin nube» no significa que haya una copia descargada.

En Invitado: **Mazos → Datos y progreso** permite la copia compatible 2A. Guarda el JSON
fuera del navegador; restaurar requiere un espacio Invitado vacío. En cuentas esa versión
no cubre los mazos locales: los controles de copia están bloqueados y exportar Invitado
no protege los datos de la cuenta. Borrar datos del sitio o perder el dispositivo puede
hacer perder las tarjetas de cualquier espacio.

El modo manual sigue siendo Guest local y no utiliza Supabase real. Para comprobar los
flujos de cuenta se usan clientes sintéticos controlados en los tests de RELEASE-2B;
no configurar cuentas privadas como atajo. La funcionalidad sigue oculta en producción.
Ver MANGA_DECKS_RELEASE_2B.md para resultados y riesgos pendientes de lanzamiento.

# Revisión del candidato optimizado — RELEASE-MANGA-2C

Para revisar el candidato que podría publicarse, usar un perfil de navegador separado:

```powershell
npm run build:manga-candidate
npm run preview:manga-candidate
```

Abrir `http://127.0.0.1:4402/kana-study/#/manga`. Este modo sirve archivos optimizados
reales; es distinto de start:manga-manual. Su preview no conecta cuentas privadas:
no tiene runtime Supabase configurado. Puedes importar Manga/diccionario, confirmar tarjetas
Guest, estudiar/undo, consultar vocabulario/OCR y usar copias locales. No se generan tarjetas
de muestra al iniciar. Para probar undo, dejar otra tarjeta pendiente antes de completar el día.

Guardar la copia JSON fuera del navegador y restaurar solamente en otro perfil Guest vacío.
Los archivos Manga no están incluidos: reimportarlos aparte para volver al contexto visual.
Evitar modo privado para conservar el progreso; cuotas, expulsión de datos y pérdida del
dispositivo pueden eliminarlo. El JSON puede incluir texto privado y no está cifrado.

El alcance público propuesto permite custom solo en Guest. En cuentas, los mazos previos
se conservan sin cambios y se explica su indisponibilidad; no hay custom cloud ni backup de
cuenta. Japanese 1500, lector, diccionario y funciones legacy continúan disponibles. Cerrar
sesión devuelve al Guest original. No se copian mazos automáticamente.

`npm run test:manga-candidate` ejecuta la auditoría de producción con perfiles sintéticos y
el SDK real frente a respuestas HTTP controladas. No es una validación de Supabase Auth
real ni debe utilizarse su fixture como configuración pública. Ver MANGA_DECKS_RELEASE_2C.md.
La entrada habitual desplegada sigue desactivada; publicar requiere aprobación expresa.

# Aceptación humana y retirada segura — RELEASE-MANGA-3

La lista firmable y las instrucciones exactas están en `release/manga-guest-acceptance.md`.
`node scripts/create-manga-release-manual-fixture.mjs` crea únicamente el volumen sintético
`.cache/release3-manual-volume.cbz`, sin crear tarjetas ni tocar el navegador. Instalar el
diccionario por UI y crear las tarjetas manualmente en el preview optimizado, en perfil separado.

MANGA_DECKS_RELEASE_3.md documenta la diferencia entre build normal apagado y candidato,
la referencia pública verificada, los parches de promoción no aplicados y dos niveles de
rollback mediante nuevos commits. Retirar temporalmente la función no debe borrar IndexedDB.
Conservar copias fuera del navegador y no borrar datos del sitio para intentar recuperar mazos.
La reversión local automatizada solo utiliza datos sintéticos y no sustituye el QA físico.
