# RELEASE-MANGA-2A — Copia y restauración de Mazos locales

Fecha: 2026-10-25. Alcance: C1 de RELEASE-MANGA-1, sin activación pública.

## Contrato y ámbito

Se implementa una copia integral del **workspace Guest local compatible**, con fichero
JSON verificable y restauración en un Guest vacío. Incluye los once stores de
`kana-study-custom-decks-v1`, IndexedDB versión 3. No añade stores/versiones ni usa RPC;
la apertura conserva la actualización aditiva v3 existente cuando es necesaria.
No se añade ningún kind de operación al journal o contrato remoto V1/V2.

El formato declara `format: kana-study-local-decks`, `version: 1`, `databaseVersion: 3`,
`exporter: release-manga-2a.1`, `scope: guest`, `exportedAt`,
`compatibility: guest-local-empty-only`, counts por store, records cerrados y sha256.
El hash SHA-256 cubre el cuerpo JSON canónico completo sin el propio sha256: incluye
metadatos, conteos y registros. Espacios y orden de claves no cambian su significado.
El hash no es cifrado, autenticación, firma de autor ni protección por contraseña.

Se mantiene exactamente la representación JSON finita de los registros y sus números,
IDs, fechas, peticiones originales y evidencia. El único tratamiento de ausencia es
omitir `daily.completedAt: undefined` en el clon leído, como hace `guestInventory()`;
no se introduce ninguna fecha ni se modifica el registro de origen en IndexedDB.

| Store | Contenido conservado |
| --- | --- |
| decks | Título, configuración, estado, timestamps y count |
| cards | ID, identidad, lectura, glosas/idioma, contexto/procedencia, versión/orden |
| progress | Snapshot FSRS completo, head; también snapshot explícitamente null tras undo |
| events | Todos los eventos originales, incluidos los anulados, parent head y voidedBy |
| daily | Introducciones, límites y completedAt original cuando existe |
| identities | Entidades permanentes y anclas/hashes originales |
| registry-meta | Marcador validado y namespace original |
| confirmations | Operaciones/recibos originales completos, con sus metadatos |
| volume-links | Vínculo original de volumen/mazo |
| journal | Secuencia original, IDs, localRevision, request, payload y contexto |
| reconciliation | Se conserva si es el estado local inicial compatible; otros estados se bloquean |

### Compatibilidad y propietarios

Solo se admite Guest→Guest. No se exportan/restauran cuentas ni se reescriben owners,
identidades o confirmaciones para conseguir portabilidad. Una cuenta muestra un error
específico y acciones deshabilitadas. Esto es una limitación explícita de V1; no se
anuncia un backup universal de todas las cuentas/workspaces.

El destino debe tener los once stores Guest vacíos, también metadata y coordinación.
No se sobrescribe ni fusiona. Otra copia no vacía ya restaurada es rechazada sin
duplicar contenido, tiempo, recibos ni eventos. La copia vacía representa un inventario
vacío y no inventa un marcador de importación.

Un backfill histórico verificado puede carecer de la fila opcional local-namespace.
Se conserva esa ausencia: el journal demuestra el namespace y no se sintetiza metadata.
Si faltan registros obligatorios o no se puede demostrar el inventario completo, se
rechaza la copia sin repararla.

Versión desconocida, versión de base distinta, propietario incompatible, registros
extra o incompatibles y linaje incompleto se rechazan. No se desactivan los validadores
actuales ni se convierte evidencia faltante en una tarjeta New artificial.

### Reconciliación no portable

Un archivo local no puede autenticar receipts, staging, consentimiento o checkpoints
remotos. Por tanto esta versión solo admite ausencia de reconciliation o su estado
inicial exacto (`version:0, entities:[], prepared:{}, conflicts:{}, stage:null`).
Cualquier coordinación posterior bloquea exportación/restauración con mensaje específico:
no se pierde esa evidencia, no se descarta del fichero para hacerlo pasar y no se
infiere ningún ACK o estado Synced al restaurar.

Los inventarios cloud/Guest importados desde coordinación experimental y los owners
de cuenta necesitan un contrato posterior de portabilidad/autorización. Permanecen
bloqueados. No se usa el constructor V2 como restaurador local: restringe operaciones
que sí forman parte de la historia local, como create/edit-card.

## Validación e integridad

Antes de descargar se valida el inventario completo. Antes de confirmar una restauración
se verifica tamaño, JSON, envelope, versión/ámbito, SHA-256 y conteos, y se valida otra
vez antes de escribir. La UI no confía en un objeto mutable mostrado en preview:
conserva el texto y lo vuelve a decodificar al confirmar.

Se reutilizan validateDeck/validateCard, validadores de eventos/snapshots/daily y de
confirmación Manga. Se exige igualdad con sus proyecciones para no perder campos
desconocidos silenciosamente. Se admiten únicamente campos cerrados, JSON finito,
objetos planos y claves seguras. No se incluyen tokens, cookies, sesiones, claves,
diccionarios ni imágenes desde otros sistemas de almacenamiento.

La validación contrasta el contenido final contra las operaciones del journal en orden
contiguo. Comprueba fingerprint original, ámbito, antes/después de snapshots, parent
head, referencias de tarjetas/mazos/días, nulidad tras undo, voidedBy, identidades y
recibos. El estado esperado se deriva de documentos ya persistidos, **sin ejecutar
ts-fsrs, calcular intervalos ni reproducir decisiones del scheduler**. Esto verifica
coherencia del fichero, no demuestra autoría del texto ni certificación lingüística.

Se conserva el comportamiento de lifecycle local existente: registra intención sin
aplicar por sí mismo una publicación remota. No se transforma esa intención en una
eliminación, restauración o ACK nuevo durante el backup.

## Restauración atómica y cancelación

DeckBackupService es un adaptador diferido a la misma base v3. Exporta con cursores en
una transacción readonly consistente. Restaura con una única transacción readwrite
que abarca los once stores:

1. Captura Guest y activationRevision, y exige gate UI activo con ambos cloud false.
2. Valida el archivo antes de abrir la transacción escritora.
3. Comprueba vacío por índice Guest **dentro de la misma transacción**; otra pestaña
   no puede escribir entre esa comprobación y los inserts.
4. Añade las filas sin reasignar datos, controlando owner/epoch/abort en las callbacks.
5. Relee todos los stores después de los inserts en esa transacción y coteja la copia;
   cualquier discrepancia aborta antes del commit.
6. Solo anuncia éxito después de oncomplete. Invalida las revisiones locales y notifica
   otras pestañas; no crea un journal de restore, un recibo remoto ni eventos FSRS.

Una cuota, error de escritura, cancelación o A→B→A durante el trabajo revierte los
registros de la transacción. Puede quedar creado el esquema vacío de una base nueva;
no queda contenido parcial estudiable. Cambiar workspace o salir destruye el borrador
UI y aborta la operación pendiente. La cancelación posterior al commit no puede
deshacer una transacción ya finalizada.

## UX, privacidad y ausencia de Manga

Acceso local: **Mazos → Datos y progreso → Copias de seguridad de Mazos**
(`/anki/backups`). El enlace y ruta están protegidos por CUSTOM_DECKS_ENABLED. Los
cuatro gates de producción siguen false: no existe activación por URL/storage.

La pantalla ofrece Exportar copia y selección de archivo para Restaurar copia. Muestra
conteos, fecha y ámbito; preview verificado y checkbox de confirmación. Incluye aviso
de pérdida de datos, privacidad, ausencia de archivos Manga y significado del hash.
Explica errores de integridad/linaje, versión, owner, coordinación, límites, destino
ocupado, DB bloqueada y cuota. Los textos ES/EN/CA se sirven mediante TranslationService.

La copia contiene contextos/glosas potencialmente privados y solo se descarga al
dispositivo. No se envía a Supabase/IA ni se incorpora a cachés globales. El input no
acepta HTML ejecutable: los textos se presentan con interpolación Angular.

El navegador limpio no necesita el Manga original para estudiar las tarjetas: mantiene
el contexto japonés, título/página y glosa guardados. No se incluye imagen, OCR completo
ni diccionario. No se afirma que pueda abrirse una imagen ausente ni se une una
reimportación por título. No se modifica Reader, FSRS, Stats V2, Japanese 1500,
Manga Saved FSRS o sincronización legacy/custom.

## Límites y rendimiento

| Límite | Valor |
| --- | --- |
| Fichero UTF-8 | 16 MiB |
| Filas totales | 30.000 |
| Fila individual | 3 MiB |
| Complejidad JSON | 400.000 nodos y profundidad 40 |
| Contenido | Se mantienen los límites existentes, incluidos 1000 cards/mazo |

El tamaño del Blob se comprueba antes de leerlo. Los cursores de exportación acotan
filas/bytes antes de continuar; un exceso se rechaza explícitamente y nunca se trunca.
La lectura de un único registro IndexedDB ya implica su structured clone: estos límites
no son una garantía física de RAM previa a ese clone. Validación/hash/preview mantienen
copias acotadas, pero no hay streaming multipart en V1.

Se midieron inventarios controlados de 1, 100 y 500 tarjetas con fake-indexeddb en
Node/Vitest. `.cache/release2a-performance.json` registra bytes, tiempos de export/restore
y deltas de heap Node. Los deltas pueden ser negativos por GC; no son picos físicos
ni medidas de RAM móvil. No se certifica aquí Safari/dispositivos físicos ni publicación
de un inventario máximo completo. Las medidas finales se resumen tras las pruebas.

## Carga diferida y presupuesto

La ruta tiene loadComponent. Servicio, contrato y diccionario de backup se cargan con
la feature, sin importar esos validadores desde App/Auth/TranslationService global.
El compilador i18n genera `deck-backup.generated.ts` separado; el core anterior no
incorpora las copias nuevas. La pantalla usa una instancia derivada y scoped de
TranslationService para esas claves, conservando las cadenas JSON como fuente.

El acceso usa la etiqueta global existente Datos y progreso. Se evita añadir copias
pesadas al bundle inicial. No hay dependencias nuevas ni cambio de presupuestos.
El build final mide **749,89 kB** iniciales (antes 749,79 kB). Pantalla, contrato, servicio
y diccionario están en `chunk-tVnT0yzW.js`, 30.722 bytes, fuera del cierre estático
inicial. Evidencia: `.cache/release2a-graph.json`. La entrada/providers manuales no
se incluyen en producción. El presupuesto de 750 kB no cambia.

## Pruebas y round-trip

Unitarios: inventario cerrado, mazo vacío, varios mazos/tarjetas, identidades, Review/
Learning/Relearning serializados, elapsedAnswerMs, undo/eventos anulados, snapshots null,
daily y ausencia de completedAt, settings, recibos y journal. Incluyen hash/JSON/versión,
referencias/head/voidedBy/conteos, campos secretos, owner, coordinación remota, límites,
destino ocupado, doble restauración/concurrencia, cuota, cancelación y A→B→A. Se
comprueba ausencia de fetch y se ensaya continuar con el mismo servicio de estudio.

Los casos Learning/Relearning de contrato son variantes controladas que conservan
intervalos reales serializados; no se presentan como una ejecución independiente de
esas transiciones del scheduler. El E2E sí genera su historia con el motor real.

E2E fundamental, sin éxito de persistencia simulado:

- Crea dos tarjetas Guest mediante selección OCR, diccionario y confirmación UI reales,
  con volumen y entradas controlados, no material privado ni certificación lingüística.
- Repasa, deshace y vuelve a calificar. La copia incluye eventos anulados y vigentes.
- Descarga el archivo y compara sus once stores con el inventario original.
- Abre un perfil persistente Chromium limpio; muestra preview, exige checkbox y restaura.
- Compara íntegramente contenido/identidades/recibos/snapshots/daily/journal, recarga,
  cierra y relanza Chromium y vuelve a comparar.
- Continúa estudiando sin Manga original; los eventos anteriores permanecen idénticos.
- Intenta repetir la restauración y comprueba rechazo sin sobrescritura. Registra cero
  peticiones externas/POST. Tres proyectos: escritorio oscuro, móvil claro y estrecho oscuro.

| Validación final | Resultado |
| --- | --- |
| Servicio/contrato, pantalla ES/EN/CA y rutas | 36/36, 3 archivos |
| Aislamiento de pantalla/Perfil | 16/16, sin modificar producción de Perfil |
| Suite Angular completa | 2053/2053, 199 archivos, exit 0 |
| Playwright: H1, lector/asistido, diccionario y backup | 90/90, tres proyectos, 2,3 minutos, retries 0 |
| Round-trip repetido tras el último ajuste de compatibilidad | 3/3, 36,7 segundos |
| TypeScript app/spec | Ambos correctos, exit 0 |
| Build GitHub Pages | Correcto, 749,89 kB, mismos cuatro warnings SCSS de Grammar |
| Auditoría del build optimizado | 3/3 ES/EN/CA: ruta backup bloqueada pese a URL/storage; sin inspector ni peticiones externas |
| Grafo inicial | Servicio/contrato/pantalla/i18n fuera del cierre inicial |
| `git diff --check` y whitespace nuevo | Correctos, exit 0; solo avisos LF/CRLF de Git |

Medidas de la pasada Angular final (fixtures/fake-indexeddb en Node):

| Tarjetas | Bytes de copia | Exportar | Restaurar + comprobar | Delta heap Node |
| --- | --- | --- | --- | --- |
| 1 | 4.429 | 1,71 ms | 3,45 ms | +1.938.432 bytes |
| 100 | 224.276 | 67,75 ms | 100,36 ms | +26.209.088 bytes |
| 500 | 1.114.276 | 817,84 ms | 508,07 ms | +47.285.736 bytes |

Son tiempos observados, no garantías ni picos físicos; GC produce variaciones y hubo
deltas negativos en pasadas anteriores.
No se extrapola a teléfonos ni al máximo de todos los límites simultáneamente. La
cuota/cancelación/abort se inyectan para comprobar atomicidad, no llenan físicamente
un disco. Chromium sí se cierra y relanza realmente después del commit confirmado.

Capturas revisadas: `.cache/backup-preview-desktop-dark.png`,
`backup-preview-mobile-light.png`, `backup-export-narrow-dark.png`. Se comprueban
contraste semántico y adaptación; no es una prueba física de Safari/iOS/Android.

Reproducción principal:

```text
npm test -- --include=src/app/core/services/deck-backup.spec.ts --include=src/app/features/anki-backup/anki-backup.page.spec.ts --include=src/app/app.routes.spec.ts
npm test
npx playwright test e2e/custom-decks-h1.spec.ts e2e/manga-decks-assisted.spec.ts e2e/manga-quick-add-ux11.spec.ts e2e/deck-backup.spec.ts
npx tsc -p tsconfig.app.json --noEmit
npx tsc -p tsconfig.spec.json --noEmit
npm run build -- --base-href /kana-study/ --stats-json
node scripts/audit-manga-public-build.mjs
git diff --check
```

Logs `.cache/release2a-{directed,full,e2e-final,roundtrip-final,ui-isolation,ts-app,ts-spec,build,public,diffcheck}.log`.

Incidencias corregidas sin ampliar timeouts ni omitir pruebas: fixture TypeScript con
tupla readonly; stub de matchMedia en las pruebas de pantalla; selector del enlace que
debía usar la etiqueta existente Datos y progreso. Se añadió una regresión para la fecha
daily opcional sin inventar un completedAt. No se cambiaron algoritmos para conseguir
que los tests pasen.

Una pasada completa detectó dos aserciones de Perfil en catalán después de la nueva
prueba multilingüe. Se aisló el idioma del fixture con un SettingsService de prueba
basado en signal, manteniendo el TranslationService real de la pantalla. Ya no escribe
preferencias globales. No se tocó Perfil ni se debilitó su comprobación; la suite
posterior pasó completa. Los logs de desarrollo no se presentan como pasadas correctas.

## Archivos y preservación

Se registró el estado inicial mediante `git status` y SHA-256 en
`.cache/release2a-baseline.json`. El árbol contenía la auditoría RELEASE-MANGA-1 y sus
herramientas sin commit; se conserva todo ese trabajo.

Nuevos: deck-backup-contract.ts, deck-backup.service.ts, deck-backup.spec.ts bajo
`src/app/core/services`; pantalla/styles/spec bajo `src/app/features/anki-backup`;
`src/assets/i18n/deck-backup.generated.ts`; `e2e/deck-backup.spec.ts`; este informe.
Integración: AnkiPage/ANKI_ROUTES, inventario y test de rutas, compilador/agregado i18n,
ES/EN/CA, comprobación de ruta bloqueada en el script de auditoría pública. DESIGN y
la guía manual describen el alcance sin alterar informes históricos.

Comparación SHA-256 final: **13 archivos anteriores modificados, 9 nuevos y ninguno
eliminado**. Lista verificable en `.cache/release2a-scope.json`. El resto de los archivos
iniciales conserva su hash, incluidos los cambios sin commit recibidos de la auditoría.
No cambian CustomDeckRepository, validadores existentes, TranslationService global,
providers/gates de producción o manuales, scheduler, Stats V2, Japanese 1500, Manga Saved
FSRS, Auth/Workspace/Sync, package/lockfiles ni SQL. El nuevo adaptador de backup lee y
restaura la base v3 mediante las transacciones descritas, sin alterar sus contratos.

## Instrucciones de prueba manual

1. `npm run start:manga-manual`, abrir `http://127.0.0.1:4401/` en un perfil separado.
   Guest, gates UI locales, Supabase/IA/cloud desactivados.
2. Crear tarjetas y estudiar. En Mazos entrar en Datos y progreso y exportar. Conservar
   el fichero fuera de ese perfil; contiene texto privado y no está cifrado.
3. Abrir otro perfil Chromium limpio en **el mismo origen/puerto**. Ir a la misma
   pantalla sin crear tarjetas ni abrir un borrador Manga antes de restaurar.
4. Seleccionar copia, revisar cantidades/fecha/ámbito, confirmar checkbox y restaurar.
   Esperar el mensaje de commit confirmado; después estudiar desde Mazos.
5. Recargar/cerrar/reabrir y comprobar progreso. Si hay stores Guest ocupados se rechaza
   la operación: esta versión no ofrece merge ni limpieza destructiva.

No utilizar un perfil habitual ni una cuenta real para estas comprobaciones.

## Estado de C1 y problemas restantes

**C1 resuelto para el criterio solicitado: Guest local compatible → navegador Guest
limpio, preservación integral y continuación de estudio.** No es una promesa de backup
de cuentas/cloud: esos ámbitos se bloquean sin descartar evidencia. Inventarios
incompletos/incompatibles o por encima de los límites se rechazan, no se anuncian
como copias completas. C2/C3 de RELEASE-MANGA-1 y la publicación pública siguen
bloqueados. No se inicia RELEASE-MANGA-2B, activa ningún gate de producción, hace
commit/push ni despliega SQL.
