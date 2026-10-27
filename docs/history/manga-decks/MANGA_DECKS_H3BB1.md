# Manga × Mazos — H3B-B1: navegación OCR precisa

Fecha de cierre: 2026-10-23. Alcance terminado y validado localmente; funcionalidad experimental oculta. No se inicia otro hito.

## Auditoría y arquitectura

Se preservó el árbol de trabajo anterior. La captura inicial de estado y hashes está en `.cache/h3bb1-status.txt` y `.cache/h3bb1-baseline.json` (evidencia local ignorada por Git). Se revisaron DESIGN, H3B-A, H3B-B0 y las partes pertinentes de H2B-A/H3A, junto con Reader, overlay, selección, diccionario y confirmación existentes.

Mokuro proporciona texto y polígonos por línea, no coordenadas verificables por carácter. El overlay conserva sus spans y nodos de texto originales: el único marco nuevo rodea la línea validada. El panel situado antes de la imagen muestra la secuencia exacta y `[start,end)` en UTF-16 base cero, más contexto desplegable. No se simula una caja de caracteres ni se presenta una coincidencia como identidad léxica.

El explorador conserva el enlace al Reader con página base uno. Transporta `mangaOcrOccurrence` mediante estado de navegación/historial, sin nuevos parámetros privilegiados. El contrato versión 1 contiene volumeId, índices base cero de página/bloque/línea, rango UTF-16, texto encontrado, SHA-256 de página, fingerprint opcional de captura, workspace y revisión de activación. No contiene glosas, LexicalIdentity ni progreso FSRS. El fingerprint de página es la prueba utilizada en Reader; el de captura conserva procedencia, sin sustituir la validación fresca.

## Validación y ciclo de vida

Toda referencia se trata como entrada no confiable. Se rechazan campos extra, versiones desconocidas, índices no enteros/no seguros, rangos incompatibles, hashes inválidos y sustitutos UTF-16 aislados. Antes de leer se comprueban gates, volumen, página, propietario y revisión de activación. Después se lee el OCR real de esa página y se comparan tanto su hash como el del OCR renderizado con la referencia. Se comprueba la línea original, límites que no corten pares sustitutos y `slice(start,end) === found`.

No se busca otra aparición cuando algo falla. OCR cambiado produce estado obsoleto; referencia inválida, fuente eliminada, volumen reimportado con otro ID o lectura fallida producen localización no disponible. Texto comprobado sin geometría válida ofrece contexto fuera de la imagen sin marco. La página mantiene la lectura normal cuando existe.

La localización se elimina al cambiar página, idioma, ruta, volumen, workspace, cerrar o descartarla. Descartar devuelve el foco al visor. Atrás/adelante vuelve a validar el estado del historial. AbortController, limpieza del effect, generación de lectura y revisión de activación impiden resultados tardíos, incluido A→B→A. Se adapta el reinicio del Reader cuando Angular reutiliza el componente entre volúmenes; se guarda el progreso normal anterior y se invalidan sus recursos. No se cambian puntuaciones, scheduler ni reglas temporales de lectura.

La navegación no cambia la selección DOM, no consulta el diccionario, no crea tarjetas ni escribe FSRS/journal. El usuario continúa seleccionando OCR y utilizando el mismo flujo H2B-A: elegir propuesta, significado e idioma, revisar y confirmar explícitamente. Una subcadena o un homógrafo no hereda la identidad de la tarjeta desde la que se buscó.

## Rendimiento, gates y límites

Se valida una página, sin volver a escanear el volumen. Se mantienen los límites de B0: consulta de 256 unidades UTF-16, línea de 4000 y página OCR de 2 MiB. El catálogo puede necesitar cargar su documento JSON OCR completo mediante el adaptador existente; no se convierte esto en una exploración de todas las páginas. La precarga ordinaria del Reader permanece independiente.

Build final GitHub Pages: **749,43 kB iniciales**, frente a 748,19 kB documentados en B0; presupuesto intacto de 750 kB. Sin dependencias nuevas. El grafo real de `browser-stats.json` confirma:

- Reader: `chunk-DUpch4G1.js`, 98 015 bytes.
- Localización: `chunk-M1O06he7.js`, 6835 bytes; importación dinámica desde Reader, fuera de la clausura estática inicial y de Reader.
- Explorador: `chunk-Cq5gYrPk.js`, fuera de la clausura estática de Reader.

Los cuatro gates conservan sus fábricas false: CUSTOM_DECKS_ENABLED, MANGA_DECK_ASSISTED_ENABLED, CUSTOM_DECK_SYNC_ENABLED y CUSTOM_REMOTE_UPLOAD_APPROVED. URL e historial no los activan. Playwright habilita los dos gates de UI exclusivamente en su fixture de desarrollo.

## Pruebas y resultados finales

Ejecutadas después del último cambio de pruebas, sin reintentos Playwright, omisiones ni aumentos de timeout:

| Validación | Resultado |
| --- | --- |
| Angular dirigido: validación/panel/explorador/repaso asistido | 71/71, 6 archivos |
| Angular dirigido: Reader, lector local y selección OCR | 41/41, 3 archivos |
| `npm test` completo | 1970/1970, 193 archivos |
| `npx playwright test e2e/manga-decks-assisted.spec.ts` | 33/33; 11 escenarios en 3 proyectos |
| `npx tsc -p tsconfig.app.json --noEmit` | correcto, salida 0 |
| `npx tsc -p tsconfig.spec.json --noEmit` | correcto, salida 0 |
| `npm run build -- --base-href /kana-study/ --stats-json` | correcto; cuatro warnings SCSS conocidos de Grammar |
| Grafo de chunks de producción | localización diferida; explorador no estático en Reader |
| `git diff --check` | correcto; avisos de conversión LF/CRLF sin errores de whitespace |

Las pruebas cubren UTF-16 suplementario, subcadenas/solapamientos, bloque/línea exactos, hashes frescos/renderizados, cambios de OCR con metadata idéntica, rango manipulado, fallback textual, eliminación/reimportación, atrás/adelante, teclado, cambios de página/cierre y lecturas retenidas durante A→B→A. El recorrido manual posterior comprueba dos identidades distintas, progreso y eventos anteriores intactos y exactamente una operación de journal por confirmación explícita. Los escenarios anteriores verifican FSRS/undo, Japanese 1500 y ocultación por gates. La suite completa incluye Stats V2, sincronización y Manga Saved FSRS.

Capturas revisadas en escritorio oscuro 1280 px, móvil claro 390 px y móvil estrecho oscuro 320 px: panel fuera de la imagen, controles accesibles, una sola línea con marco discontinuo y rango exacto visible, sin desbordamiento horizontal. Evidencia local: `.cache/h3bb1-*.png` y logs `*-final.log`.

Al reanudar se comprobó que el parche rechazado no estaba aplicado. Los fallos provisionales eran de las nuevas pruebas: el helper omitía journal; el rango manipulado aún era estructuralmente válido y la obsolescencia se detectaba antes; HMR solicitaba metadata `@ng/component`, confundida con importación de código. Se corrigieron las tres causas sin debilitar las comprobaciones de UI, gates ni conservación. El test distingue metadata de desarrollo y el grafo productivo verifica la carga diferida real.

## Archivos de este hito

Comparación SHA-256 con el estado inicial (no con HEAD, que contiene trabajo previo sin commit):

- Nuevos: `core/models/manga-ocr-occurrence.model.ts`; `core/services/manga-ocr-location.ts` y su spec; `features/manga/manga-ocr-location.ts/.html/.scss` y su spec (todos bajo `src/app/`).
- Modificados: `features/manga/manga-reader.page.ts`, `manga-ocr.component.ts`, `manga-ocr-explorer.ts/.html`; `e2e/manga-decks-assisted.spec.ts`; ES/EN/CA y `core.generated.ts` en `src/assets/i18n/`.
- Documentación: este archivo y apéndice de `MANGA_DECKS_DESIGN.md`.

No hay archivos iniciales eliminados. Los hashes del resto del trabajo anterior se conservan: gates, scheduler, Stats V2, Japanese 1500, Manga Saved FSRS, sincronización, contratos SQL y documentación de hitos anteriores. Las seis claves nuevas están sincronizadas en ES/EN/CA; el generado se obtuvo con el compilador i18n existente.

## Limitaciones y próximos pasos

La geometría es de línea, no certificación de caracteres. El hash verifica la captura en el instante de lectura; no ofrece bloqueo distribuido frente a cambios posteriores. La referencia de historial persiste según el navegador y siempre se revalida; no concede autorización. No se altera zoom, posición ni preferencia de visibilidad OCR para forzar la coincidencia.

Playwright se ejecutó en Chromium con viewports/temas indicados, no en Safari ni dispositivos físicos. Una ejecución final correcta, junto con las regresiones deterministas, no demuestra ausencia absoluta de intermitencias. No se ejecutó SQL/PostgREST porque este hito no cambia contratos remotos. Supabase Auth y revisión lingüística humana independiente siguen siendo pendientes de fases anteriores; no bloquean esta localización textual ni se presentan como validados.

No quedan pruebas solicitadas de H3B-B1 pendientes. Antes de una activación pública se recomienda validación Safari/dispositivo real y mantener separados los requisitos lingüísticos y de lanzamiento. No se inicia esa fase, no se activa funcionalidad pública y no se despliega SQL. Sin commit ni push.
