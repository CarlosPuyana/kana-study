# KAISHI-MEDIA-1 — multimedia local de Japanese 1500

> Referencia de la fase anterior. [KAISHI-MEDIA-AUTO](KAISHI_MEDIA_AUTO.md) actualiza el recorrido principal y el valor tonal predeterminado. El almacén e importador descritos aquí se conservan como alternativa opcional.

Implementación local, 29 de octubre de 2026. Base inspeccionada limpia: `bad859a635a9ca91ae23c637dbc4ed3a098ef3de` (SCHEDULER-1). Sin commit, push, despliegue ni cambios remotos.

## Uso

Ejecuta `npm start`, abre Mazos → Mi primer mazo de japonés → Ajustes → Audio e imágenes Kaishi. Selecciona el APKG compatible guardado en tu dispositivo. No se envía el archivo a un servidor. La descarga se ofrece como enlace externo explícito; el importador no la realiza por su cuenta.

Paquete único aceptado: [Kaishi ESP v1.0.1 del traductor](https://github.com/Dogi5/Kaishi-ESP/releases/download/v1.0.1/Kaishi.1.5k.Espanol.apkg), 102049547 bytes, SHA256 `3fdaef081150b09e1f58be4637d261903b95a9e7d60374467d5facee5b0387df`. Un archivo de AnkiWeb o una versión distinta no se identifica por nombre: se rechaza si no coincide el fingerprint completo.

Tras instalar, revela una tarjeta de Japanese 1500 para ver los botones independientes de palabra/frase y la imagen disponible. El audio solo se reproduce manualmente. El acento tonal se activa desde los mismos Ajustes y empieza desactivado en cada workspace. El anverso continúa siendo textual y no reproduce sonido.

Eliminar/reinstalar medios no borra tarjetas, configuración del scheduler, progreso ni eventos. En otro perfil, navegador, origen o dispositivo hay que importar otra copia; `localhost` y `127.0.0.1` son orígenes diferentes.

## Arquitectura y seguridad

- `kaishi-media.model`: límites, fingerprint fijo, protocolo y tipos.
- Manifiesto técnico diferido en `src/app/data/kaishi-media.manifest.ts`: solo entryId actual, índice ZIP numérico, tamaño, SHA1 y MIME. Sin GUID externos, nombres de archivos externos, colecciones ni textos importados.
- Worker dedicado: SHA256 completo primero; después ZIP existente (`@zip.js/zip.js`), inventario exacto, CRC, descompresión Zstandard acotada, tamaño final, SHA1 y firma de formato. No se abre SQLite ni se interpreta el mapa protobuf: la correspondencia auditada ya está fijada.
- Inventario permitido: cuatro entradas de metadatos conocidas y los índices numéricos 0–4353. No se ejecutan plantillas, HTML, CSS ni scripts del paquete. Los nombres externos nunca se usan como rutas. No se siguen enlaces del contenido.
- Decoder nuevo: [`fzstd` 0.1.1](https://github.com/101arrowz/fzstd), licencia MIT, puro JavaScript (upstream indica unos 8 kB minificados). Se usa únicamente en el worker diferido; no depende de `DecompressionStream`, de un CDN ni de WASM/SQLite. El lockfile fija versión e integridad. No se añaden otras dependencias.
- Se admite una única trama Zstandard con el layout verificado en este paquete: sin checksum de trama, ventana limitada a 8 MiB (el paquete usa 2 MiB), bloques completos y sin tramas concatenadas. Tamaño final máximo por recurso: 512 KiB; máximo observado: 433825 bytes. ZIP interno por entrada limitado a 1 MiB. La comprobación SHA1 protege además los bytes finales; CRC y SHA256 protegen el paquete completo.
- Extracción secuencial con lotes de 16 recursos (como máximo 8 MiB de medios finales por lote). No se materializan simultáneamente todos los medios descomprimidos. SHA256 WebCrypto necesita un buffer del archivo comprimido de unos 102 MB dentro del worker, más memoria transitoria; no se promete un consumo total inferior al tamaño del archivo.

## Almacenamiento y ciclo de vida

IndexedDB dedicado `kana-study-kaishi-media-v1`, versión 1, almacenes `meta`, `links` y `resources`. No abre ni modifica las bases de progreso. Una generación temporal tiene su UUID, referencias y contadores. Los blobs se deduplican por índice ZIP.

Solo una transacción final cambia el puntero `active`, después de validar 4353 recursos y 109484291 bytes. Fallo/cancelación nunca activa una generación parcial ni borra la copia anterior. Tras reemplazarla con éxito se puede descartar exactamente la generación previa, siempre comprobando que ya no sea activa. La eliminación solicitada por el usuario también comprueba el puntero en una transacción.

Cancelar termina el worker y descarta solo su UUID. El identificador pendiente se guarda en sessionStorage para recuperar una recarga interrumpida. Web Locks se usa opcionalmente para no interferir con otra pestaña; hay ejecución transaccional sin esa API. Si el navegador no permite limpiar el almacenamiento, se conserva el identificador para volver a intentarlo. Sin sessionStorage no se puede garantizar la limpieza inmediata de temporales tras terminar abruptamente el proceso; permanecen invisibles y no sustituyen una instalación válida.

Antes de importar se consulta `navigator.storage.estimate()` si existe y se exige una reserva aproximada del 15% sobre el tamaño final. Es una estimación, no una garantía. Un fallo real `QuotaExceededError` aborta la escritura y se comunica. Reinstalar necesita espacio para mantener temporalmente ambas copias. El almacenamiento está sujeto a cuota y posible eliminación por el navegador; no sustituye la posibilidad de reimportar el archivo original.

El contenido es común entre workspaces del mismo origen/perfil. La preferencia `kana-study.kaishi-pitch.v1` usa la clave local del workspace, sin outbox ni nuevo contrato cloud; no se copia automáticamente al iniciar sesión y no se añade a backups de progreso. Los blobs tampoco forman parte de esos backups.

El reverso crea URLs Blob únicamente para los recursos existentes. Detiene el audio y revoca todas las URLs al cambiar tarjeta, cerrar la vista o activar otro workspace. Las respuestas asíncronas de una vista destruida se ignoran. Sin recursos, con recurso ausente o con error de reproducción, el estudio textual sigue disponible. No hay autoplay ni sonido en el anverso.

## Acento y cobertura del contenido

El renderer reconoce la notación limitada del catálogo y emite texto y flags de tono alto/caída mediante bindings de Angular. No inserta HTML, estilos externos ni usa bypass de seguridad. Conserva las marcas textuales de ensordecimiento; los colores originales no se importan. Se admiten las dos notaciones de línea alta y los spans decorativos vacíos existentes. Se prueba estructuralmente todo el acento disponible (1499 entradas), no su corrección lingüística.

1500 entryId y orden coinciden con el catálogo actual. Hay 1499 enlaces de palabra, 1499 enlaces de frase y 1500 imágenes (1475 WebP, 23 JPEG y 2 PNG). Son 4498 enlaces a 4353 blobs únicos (109484291 bytes). Falta un audio de palabra en origen. El candidato de frase de 永遠 (`n-jp1500-en-CGA2j9S)g.`) está excluido: no se copia su referencia pendiente al manifiesto de ejecución. No se cambia テーマ por 手間 ni se altera ningún texto, ejemplo, lectura, traducción u orden.

Las otras excepciones auditadas se conservan como correspondencias de medios, sin adoptar las diferencias del texto externo. No se copia el APKG ni sus medios al repositorio/bundle. No se importa programación Anki ni se crean tarjetas. SCHEDULER-1, Japanese 1500, Grammar restringida, Guest-only y cloud custom/upload apagados permanecen intactos.

## Validación y evidencias

Logs y capturas locales ignorados en `.cache/kaishi-media1/`. Resultados del código final:

| Comprobación | Resultado | Evidencia |
| --- | --- | --- |
| Dirigidos de Kaishi y páginas afectadas | 39/39, 7 archivos | `directed-final.log` |
| Suite Angular final | 2191/2191, 214 archivos | `full-final.log` |
| TypeScript app/spec/worker | Correcto | `ts-app.log`, `ts-spec.log`, `ts-worker.log` |
| Playwright de scheduler, custom decks, backup, Daily y cuentas | 33/33, cero reintentos | `regression-browser.log` |
| APKG real en candidato optimizado | 3/3, cero reintentos; 1280 oscuro / 390 claro / 320 oscuro | `browser-final-verified.log` |
| Build normal de Pages | 744767 bytes iniciales | `build-normal.log`, `normal-audit.log` |
| Build candidato | 745653 bytes iniciales, estrictamente <750000 | `build-candidate.log` |
| Worker / manifiesto / ZIP / decoder diferidos | Correcto; worker de 527549 bytes, sin medios ni APKG en el artefacto | `media-audit.log` |
| Frontera de presupuesto | 749999 aceptado; 750000 y 750001 rechazados | `budget-boundary.log` |
| Manifiesto técnico derivado del JSON auditado externo | Coincide exactamente; 1500 IDs y orden comprobados contra el catálogo | `manifest-check.log` |
| Regresión Manga × Mazos | 3/3 ES/EN/CA sobre candidato optimizado | `manga-regression-final.log` |
| Enlaces de documentación y whitespace | Correcto | `docs-audit.log`, `diff-check.log` |

Ambos builds conservan únicamente los cuatro warnings SCSS conocidos de Grammar. No se amplían presupuestos. Hubo además una suite completa anterior correcta (2190/2190, antes del caso de cancelación sin UUID).

El recorrido real valida paquete correcto, paquete de tamaño distinto y una copia manipulada del tamaño correcto; cancelación con recursos ya escritos, recarga en mitad de staging, conservación de una copia válida previa, sustitución completa sobre una instalación válida (la anterior sigue activa durante staging y después se recuperan exactamente 4353 recursos), eliminación/reinstalación, todos los hashes/tamaños/tipos de los 4353 blobs y la comparación exacta de progreso e historial antes/después. Se bloquearon solicitudes externas: cero observadas. No se ejecutaron plantillas ni colección SQL.

Se verificaron mecánicamente el audio de palabra de あなた hasta `ended`, y el inicio y parada del audio de su frase al salir. Se comprobó imagen con dimensiones decodificadas y acento estructurado, sin controles ni reproducción en el anverso. Esto no equivale a escucha humana.

Las pruebas iniciales detectaron variantes adicionales de notación tonal; el parser reconoce las 1499 entradas sin insertar HTML. Los fixtures de almacenamiento se mantuvieron mínimos para probar sus transacciones sin hacer 1500 inserciones por cada caso unitario. La captura inicial del test de navegador leía el progreso antes de terminar el rating de referencia; se hizo determinista esperando el siguiente anverso y leyendo ambos stores en una misma transacción. No se relajaron comparaciones ni se añadieron sleeps/reintentos.

Comandos de comprobación complementarios:

```text
npm test -- --include=src/app/core/services/kaishi*.spec.ts --include=src/app/shared/components/kaishi*/*.spec.ts --include=src/app/features/anki-study/anki-study.page.spec.ts --include=src/app/features/anki-settings/anki-settings.page.spec.ts
npm test
npx tsc -p tsconfig.app.json --noEmit
npx tsc -p tsconfig.spec.json --noEmit
npx tsc -p tsconfig.worker.json --noEmit
npm run build -- --base-href /kana-study/ --stats-json
npm run build:manga-candidate
node scripts/audit-kaishi-media.mjs
node scripts/audit-local-deck-boundaries.mjs
node scripts/check-manga-release-budget-boundary.mjs
npm run test:manga-candidate
node scripts/audit-repo-docs.mjs --links-only
git diff --check
```

El generador `scripts/generate-kaishi-media-manifest.mjs` recibe la ruta al crosswalk de investigación externo. Por defecto solo comprueba correspondencia byte a byte; `--write` regenera exclusivamente el manifiesto técnico. No necesita ni copia el APKG.

Capturas verificadas (locales, no versionadas): `importing-{desktop-dark,mobile-light,narrow-dark}.png`, `installed-{desktop-dark,mobile-light,narrow-dark}.png` y `back-{desktop-dark,mobile-light,narrow-dark}.png` en la carpeta de evidencias.

Prueba real separada de la suite Playwright ordinaria, porque exige el paquete autorizado fuera del repositorio:

```powershell
$env:KAISHI_MEDIA_PACKAGE = 'RUTA_LOCAL_AL_PAQUETE_COMPATIBLE.apkg'
$env:KAISHI_MEDIA_CANDIDATE = '1' # Usa el candidato ya construido, servido bajo /kana-study/
npx playwright test -c playwright.kaishi.config.ts --output=.cache/kaishi-media1/browser-final-verified
```

Sin KAISHI_MEDIA_CANDIDATE se puede ejecutar el mismo recorrido contra el servidor de desarrollo. Las lecturas de comprobación usan IndexedDB nativo; el test no depende de `window.ng` ni de APIs de depuración de Angular.

La configuración usa perfiles Chromium nuevos y aislados, tres proyectos (1280 oscuro, 390 claro, 320 oscuro), un worker y cero reintentos. El timeout de ese recorrido es de 180 segundos por la extracción/instalación de más de cien MB y varias reinstalaciones; no se cambian los timeouts de los tests de producción existentes. Un paquete ausente falla explícitamente; no hay bypass de fingerprint en UI, URL o localStorage.

Los fixtures unitarios son mínimos y explícitos: una trama Zstandard raw sintética con cabecera ID3, inventarios numéricos sintéticos y filas IDB temporales para probar transacciones. No se presentan como un APKG válido. La aceptación del fingerprint y la activación completa se comprueban únicamente con el APKG real. El test real modifica una copia temporal fuera del repositorio y la elimina al terminar, conservando el original.

## Límites y aceptación humana pendiente

- La reproducción automatizada de las muestras visibles prueba carga, decodificación, play/ended y parada; no certifica escucha humana ni pronunciación. Las 2998 grabaciones habilitadas no se han escuchado individualmente. 永遠 sigue pendiente de escucha y deshabilitado.
- Safari real/iOS, dispositivos físicos, memoria limitada, eviction de almacenamiento y todas las circunstancias de navegación/bfcache requieren aceptación manual. Se usan APIs estándar con decoder JavaScript, pero no se afirma una prueba Safari que no se haya ejecutado.
- Sin red funcionan los blobs ya instalados y el recorrido cargado de la aplicación. No se añade un service worker ni se garantiza arrancar una URL nueva o cargar por primera vez un chunk del sitio cuando el servidor no está disponible.
- No se han usado cuentas Supabase reales ni se ha validado un despliegue remoto en esta fase.

## Archivos cambiados (36)

- `angular.json`
- `docs/INDEX.md`
- `docs/features/decks/KAISHI_MEDIA_1.md`
- `manual-tests/kaishi-media/kaishi-media.spec.ts`
- `package-lock.json`
- `package.json`
- `playwright.kaishi.config.ts`
- `scripts/audit-kaishi-media.mjs`
- `scripts/generate-kaishi-media-manifest.mjs`
- `src/app/core/models/kaishi-media.model.ts`
- `src/app/core/services/kaishi-media-parser.spec.ts`
- `src/app/core/services/kaishi-media-parser.ts`
- `src/app/core/services/kaishi-media-store.spec.ts`
- `src/app/core/services/kaishi-media-store.ts`
- `src/app/core/services/kaishi-media.service.spec.ts`
- `src/app/core/services/kaishi-media.service.ts`
- `src/app/core/services/kaishi-media.worker.ts`
- `src/app/core/services/kaishi-pitch.spec.ts`
- `src/app/core/services/kaishi-pitch.ts`
- `src/app/data/kaishi-media.manifest.ts`
- `src/app/features/anki-settings/anki-settings.page.html`
- `src/app/features/anki-settings/anki-settings.page.ts`
- `src/app/features/anki-study/anki-study.page.html`
- `src/app/features/anki-study/anki-study.page.ts`
- `src/app/shared/components/kaishi-card-media/kaishi-card-media.html`
- `src/app/shared/components/kaishi-card-media/kaishi-card-media.scss`
- `src/app/shared/components/kaishi-card-media/kaishi-card-media.spec.ts`
- `src/app/shared/components/kaishi-card-media/kaishi-card-media.ts`
- `src/app/shared/components/kaishi-media-settings/kaishi-media-settings.html`
- `src/app/shared/components/kaishi-media-settings/kaishi-media-settings.scss`
- `src/app/shared/components/kaishi-media-settings/kaishi-media-settings.ts`
- `src/assets/i18n/ca.json`
- `src/assets/i18n/core.generated.ts`
- `src/assets/i18n/en.json`
- `src/assets/i18n/es.json`
- `tsconfig.worker.json`
