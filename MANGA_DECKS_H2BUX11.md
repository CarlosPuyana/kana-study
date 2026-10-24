# H2B-UX1.1 — Añadir rápido: guardado y panel compacto

Fecha: 2026-10-24. Implementación correctiva local. **La aceptación de UX queda pendiente de una nueva prueba manual del usuario.** Los tests no sustituyen esa aceptación ni cambian su valoración 2/5.

## Diagnóstico reproducido antes de cambiar producción

Se conservaron `git status` y hashes del árbol recibido en `.cache/ux11-baseline.json`. Se inspeccionó el recorrido real selección → JapaneseLookupService → MangaDeckReview → preview/confirm asistidos → repositorio/recibo/journal → señal de éxito del Reader.

Se extrajeron las entradas de **public/dictionaries/JMdict_spanish.zip**, sin inventar traducciones ni modificarlo. El archivo distribuido contiene dos filas de 大丈夫, ambas con tres glosas:

| Lectura | Glosas del archivo |
| --- | --- |
| だいじょうぶ | estar a salvo; estar bien; OK |
| だいじょぶ | estar a salvo; estar bien; OK |

Las filas cumplen el contrato del parser existente. Se cargaron en el repositorio de prueba con el mapeo de ese parser y la consulta exacta real devuelve ambas. El Reader recibió dos términos y el servicio asistido produjo dos propuestas; no se perdió una propuesta por filtros, idioma o contrato de selección. H2B-UX1 dejaba lectura y significado vacíos cuando había varias alternativas para evitar elegir arbitrariamente. El problema era que representaba ese estado con guiones y un formulario largo, sin una elección compacta suficientemente clara. No se reimportó el paquete completo en el perfil privado del usuario: esta evidencia procede del activo distribuido y contextos Guest efímeros. SHA-256 del archivo: `968c7ca9c63203315b97b0d1bdf0d021444ae9e65d8ff08c5359ba212c5abe10`.

La reproducción utilizó **大丈夫、大丈夫。一緒に行こう。**, arrastrando los primeros tres caracteres en el overlay Mokuro real. Se ejecutó también con el diccionario activo pero sin una entrada para la selección. Se instrumentaron temporalmente, solo en el script de prueba, el handler, preview y confirm; no quedan trazas de depuración en producción.

| Estado anterior observado después de pulsar Añadir vacío | Diccionario auténtico | Sin propuesta |
| --- | --- | --- |
| Propuestas disponibles | 2 | 0 |
| Handler ejecutado | 1 | 1 |
| Llamadas a preview | 0 | 0 |
| Llamadas a confirm/persistencia | 0 | 0 |
| Operaciones en journal | 0 | 0 |
| Edición avanzada | se abría | se abría |
| Foco resultante | Palabra japonesa (ya válida) | Palabra japonesa (ya válida) |

**Causa demostrada del no guardado en esta reproducción: validación de lectura/significado vacíos, anterior a persistencia.** Era correcto no guardar una tarjeta incompleta. Era incorrecto que la reacción abriera toda la edición y enfocara un campo válido, dificultando entender y reparar el problema.

### Separación de los cuatro resultados

- **A — Validación:** reproducida en ambos casos; no llega al repositorio. Ahora muestra los errores junto a los datos pendientes y enfoca el primero sin abrir toda la edición.
- **B — Acción del botón:** el handler sí se ejecutaba. No se reprodujo un botón sin handler. La reacción visual/foco anteriores explican una acción poco perceptible; no se atribuye a pérdida de clic sin evidencia.
- **C — Confirmación/persistencia:** no falló en la reproducción base porque no se llamó. Las pruebas provocan separadamente una excepción controlada de almacenamiento: el panel conserva valores y operación; el reintento usa el mismo recibo y guarda una sola vez. Un error de preparación se distingue del error de confirmar/guardar.
- **D — Escritura correcta no reconocida:** las pruebas comprueban el commit real, exactamente una tarjeta/operación, aviso, cierre y foco. No se ha reproducido un commit correcto ignorado por la interfaz.

La matriz ampliada detectó además una carrera real: abrir Editar y escribir inmediatamente en Lectura podía coincidir con un enfoque diferido a Palabra; se observó Palabra=`猫ねこ` y Lectura vacía. Se protege ese enfoque para no quitarlo de otro campo editable al que el usuario ya se haya desplazado. La regresión comprueba ambos valores, además del guardado.

## Casilla de identidad

En las dos reproducciones iniciales `newIdentity` era false, antes y después del envío inválido. No se ha demostrado que se marcase automáticamente en la sesión del usuario y no se atribuye a autofill/HMR sin evidencia. Antes aparecía al abrir la edición avanzada incluso sin conflicto, lo que introducía una decisión innecesaria. Además, editar campos con el handler genérico no retiraba una decisión de identidad previa.

Se elimina la casilla. Sin identidades relacionadas no aparece ninguna decisión de identidad. Con igualdad de escritura/lectura se muestran las tarjetas candidatas, pero no se fusiona ni selecciona ninguna automáticamente. El usuario puede elegir explícitamente una para añadir contexto conservando repasos, o pulsar **Crear otra identidad (sin heredar repasos)**. Esta acción comienza sin seleccionar y solo se activa por intervención del usuario. Cambiar escritura/lectura borra la elección previa. La identidad completa, CAS y confirmación siguen siendo validados por los servicios existentes.

## Nuevo diseño

El panel conserva una única zona de scroll de contenido: el popup existente, aparte del comportamiento nativo de los campos multilínea. Muestra palabra, lectura/significado disponibles o sus controles mínimos, contexto breve expandible y destino abreviado con el título completo accesible. No muestra guiones como si fuera una tarjeta lista. El título completo y la procedencia detallada quedan bajo el contexto; se conserva el fragmento/página original en los datos.

El pie de **Añadir al mazo / Editar** permanece visible mediante sticky dentro del panel. Se compacta la fila de pestañas y cierre para ventanas estrechas. No hay fieldset «Editar propuesta» permanente, metadatos duplicados ni aviso experimental largo en la primera vista. Editar es un desplegable explícito; se mantienen campos editables, idioma, foco, Escape y conservación de valores entre pestañas.

- **Propuesta completa única:** lectura y glosa visibles para revisión, edición cerrada, una confirmación final.
- **Varias lecturas/sentidos:** controles compactos con alternativas reales. El usuario elige lectura/propuesta y significado; no se convierte la entrada del diccionario en certificación.
- **Sin propuesta:** aviso breve y campos mínimos inmediatos, foco en Lectura. Si solo falta un dato, se enfoca ese dato al enviar. Los datos válidos ya disponibles no se inventan ni se pierden.
- **Error:** la validación permanece junto al campo; preparación y confirmación/guardado tienen mensajes diferentes. El error no cierra el panel ni publica éxito.
- **Éxito:** se espera la misma operación atómica existente, se anuncia, se cierra el popup y se devuelve el foco al Reader en la misma página.

No se modifica la lógica del diccionario, scheduler, Stats V2, Japanese 1500, Manga Saved FSRS, SQL ni sincronización. Se conservan los fences de página/volumen/workspace/A→B→A y los guards transaccionales de H2B-UX1. Los cuatro gates de producción permanecen false y el modo manual localhost conserva Guest y cloud desactivado.

## Interacciones observadas

Se cuentan selección OCR, elección de opción, introducción de un campo y pulsación de guardado; no las letras individuales ni tiempos humanos. Los casos nuevos se realizan sobre el Reader Chromium, no llamando a confirm para simular el flujo.

| Caso | Recorrido válido nuevo | Acciones |
| --- | --- | --- |
| Propuesta completa única controlada | selección → añadir | 2 |
| 大丈夫 con las dos entradas auténticas | selección → elegir lectura → elegir significado → añadir | 4 |
| 大丈夫 sin propuesta | selección → introducir lectura → introducir significado → añadir | 4 |
| Envío vacío seguido de corrección manual | selección → añadir inválido → lectura → significado → añadir | 5 |

No se presenta una reducción artificial de acciones frente a H2B-UX1 para datos válidos: ya permitía esos recorridos. La mejora de esta corrección es que los controles necesarios y el guardado son visibles, los errores enfocan el campo adecuado y no fuerzan la edición avanzada. Antes, un envío vacío añadía esa expansión y foco incorrecto; su handler y cero escrituras están medidos en la tabla de diagnóstico. No se han medido tiempos de personas ni una nueva puntuación de usabilidad.

## Capturas y evidencia local

Capturas completas de Chromium en contextos de prueba, con el mismo OCR y títulos sintéticos; no son imágenes del manga del usuario. Los artefactos locales se conservan en `.cache/` y no se versionan:

- [Anterior: sin propuesta, después de enviar vacío, 320×560](.cache/ux11-before-absent-attempt.png).
- [Anterior: dos propuestas auténticas, antes de enviar](.cache/ux11-before-actual.png).
- [Nuevo: diccionario auténtico, escritorio oscuro](.cache/ux11-after-actual-desktop-dark.png).
- [Nuevo: diccionario auténtico, móvil claro](.cache/ux11-after-actual-mobile-light.png).
- [Nuevo: lectura y significado elegidos del diccionario auténtico](.cache/ux11-after-reviewed-narrow-dark.png).
- [Nuevo: sin propuesta/errores y pie accesible, 320×480 oscuro](.cache/ux11-after-absent-narrow-dark.png).
- [Nuevo: sin propuesta/errores, claro](.cache/ux11-after-absent-mobile-light.png).
- [Nuevo: propuesta completa, móvil estrecho oscuro](.cache/ux11-after-complete-narrow-dark.png).

El antes se capturó antes de editar producción; no se reconstruyó con un reset. Los escenarios anteriores tenían una página y los nuevos usan dos para verificar origen, contexto adicional y retorno: no se comparan alturas como una métrica cuantitativa entre esas capturas. Evidencia del diagnóstico: `.cache/ux11-before.json`, `.cache/ux11-real-terms.json`, `.cache/ux11-before.cjs` y `.cache/ux11-dictionary.mjs`.

## Validación final

El código final se comprobó en secuencia, sin aumentar timeouts, presupuestos ni reintentos del runner:

| Comprobación | Resultado |
| --- | --- |
| Tests dirigidos (panel, confirmación asistida, diccionario, Reader y selección) | **100/100**, 5 archivos |
| Suite Angular `npm test` | **2000/2000**, 194 archivos |
| Playwright afectado, ambos archivos | **81/81**, 27 escenarios × 3 proyectos Chromium |
| TypeScript app/spec y tsconfig manual `--noEmit` | correctos, salida 0 |
| Build GitHub Pages `--base-href /kana-study/ --stats-json` | correcto; **749,67 kB iniciales**, presupuesto intacto de 750 kB |
| Grafo productivo | entrada `src/main.ts`, providers manuales excluidos, H3B-B1 diferido |
| `git diff --check`, whitespace y ES/EN/CA | correctos |

El inicial anterior era 749,04 kB; esta corrección añade 0,63 kB. Permanecen únicamente los cuatro warnings SCSS conocidos de Grammar. No hay librerías nuevas. En el grafo final Reader es `chunk-CC9KyGAB.js` (108 363 bytes); localización `chunk-CGLKsmvJ.js` (6834 bytes) y explorador `chunk-CXZ1SIq5.js` siguen fuera de su clausura estática; la localización se importa dinámicamente. No se incluyó el arranque manual en producción ni se cambió ninguno de sus cuatro gates.

Se cubren los 18 criterios de aceptación: propuestas reales de 大丈夫 y ausencia, lectura/glosa/ambos vacíos, entrada manual válida, elección de sentidos, recibo recibido, doble clic, fallo controlado/reintento estable, contexto adicional, identidades iguales en escritura pero separadas, FSRS original, retorno/foco, Escape/Tab, 320×480 y temas claro/oscuro, además de gates y las regresiones H3B-B1 existentes. Los casos nuevos arrastran el texto real del overlay y consultan el repositorio de diccionario; no rellenan directamente los inputs del componente con propuestas simuladas. Las excepciones de cuota se inyectan exclusivamente en la fixture para distinguir ese fallo de la validación vacía. No se ejecuta SQL/PostgREST porque no cambia ningún contrato remoto.

La primera matriz ampliada obtuvo 77/81: tres fallos eran una expectativa de whitespace del destino tras abreviarlo y el cuarto reprodujo la carrera de foco descrita arriba. Se verificó el destino por etiqueta/título completo y se corrigió el enfoque tardío en producción; no se relajó el guardado. Una matriz posterior pasó 81/81 y la ejecución secuencial final volvió a pasar 81/81 con los textos definitivos. No se afirma estabilidad absoluta ni aceptación humana de la UX.

Evidencia final: `.cache/ux11-directed-final.log`, `ux11-suite-final.log`, `ux11-browser-closed.log`, `ux11-build-final.log`, `ux11-scope.json` y capturas anteriores/nuevas enlazadas. Se inspeccionaron visualmente capturas de escritorio, móvil claro, móvil estrecho oscuro y errores a 320×480. Con errores o edición expandida puede ser necesario desplazar el contenido para leer el contexto completo; el pie de guardado permanece accesible. Se comprobó también el servidor manual Guest sin sembrar tarjetas ni realizar peticiones Supabase.

La comparación SHA-256 con el árbol recibido identifica **15 archivos de este hito: 13 existentes y 2 nuevos**, sin eliminar archivos ni modificar los demás hashes anteriores. Quedan intactos el archivo de diccionario, servicios de lookup/confirmación/repositorio/journal, identidades permanentes, scheduler, Stats V2, Japanese 1500, Manga Saved FSRS, sincronización, SQL, dependencias, presupuestos y providers/gates previos.

## Archivos del cambio

- `src/app/features/manga/manga-deck-review.ts/.html/.scss/.spec.ts`: estados, validación/foco, decisiones explícitas y diseño compacto.
- `src/app/shared/components/dictionary-popup/dictionary-popup.ts/.scss`: geometría y cabecera del popup rápido; comportamiento ordinario preservado.
- `src/assets/i18n/{es,en,ca}.json` y `core.generated.ts`: mensajes/etiquetas sincronizados.
- `e2e/manga-quick-add-ux11.spec.ts`: casos reales de 大丈夫 con las filas del ZIP distribuido, ausencia, errores, persistencia e identidad/FSRS.
- `e2e/manga-decks-assisted.spec.ts`: conserva sus escenarios, adaptando controles/ubicación de metadatos y añade verificación de la escritura rápida en Lectura.
- Este informe y documentación de diseño/prueba manual.

## Repetir la prueba manual

En un perfil separado de navegador, ejecuta `npm run start:manga-manual` y abre `http://127.0.0.1:4401/#/manga`. Si ya está arrancado, no necesitas iniciar otro servidor. Recarga completamente la app (Ctrl+F5) para probar el código nuevo; no borres tus bases ni almacenamiento. El workspace es Guest. Importa un manga local con OCR y usa el diccionario distribuido instalado con el control existente. No hay que iniciar sesión.

Selecciona **大丈夫** en la frase indicada. Con el diccionario distribuido, elige una de las dos lecturas y después un significado; revisa y pulsa Añadir al mazo. Si tu instalación no devuelve una propuesta, deben aparecer los dos campos mínimos con un aviso manual: completa lectura/significado y confirma. Un envío vacío debe enfocar el primer campo pendiente; no debe abrir todo el formulario ni mostrar una casilla de identidad.

Después, verifica la tarjeta en Vocabulario confirmado del volumen. Prueba una nueva aparición: reutiliza explícitamente la tarjeta para añadir contexto o crea otra identidad solo si es tu intención. Sus repasos anteriores deben conservarse. Comprueba también Editar, contexto desplegable, Escape y una ventana estrecha. No se crean tarjetas automáticamente en tu perfil por preparar estas pruebas.

Quedan pendientes tu nueva valoración manual y QA en Safari/dispositivos físicos. Las fixtures no son certificación lingüística ni una inspección de tu base privada. No se declara la UX aceptada solo por pasar las pruebas. No se inicia otro hito; sin commit, push ni despliegue SQL.
