# Manga × Mazos — RELEASE-MANGA-2C: candidato público local-first

Fecha: 2026-10-26. Windows, Node v24.21.0, Chromium de Playwright. Datos sintéticos;
sin cuentas privadas, SQL desplegado, commit, push ni promoción del candidato.

## Decisión

**GO condicionado para el candidato Guest local-first. C3 técnico implementado y validado en Chromium; promoción pendiente de aprobación y de las comprobaciones externas indicadas al final.**

La decisión no constituye autorización para publicar. La entrada habitual de GitHub Pages
sigue sin activar Manga × Mazos. La configuración candidata y los artefactos se mantienen
separados; la subida custom permanece desactivada en ambos casos.

## Estado recibido y preservación

Se partió del árbol con cambios anteriores sin commit de RELEASE-1/2A/2B. Se inspeccionaron
status/diffs, providers, configuración, rutas, escrituras, backup, sincronización, informes y
las incidencias heredadas. El estado y SHA-256 recibidos están en
`.cache/release2c-status-initial.txt` y `.cache/release2c-baseline.json`.
No se usó reset, clean, checkout destructivo ni se sobrescribieron implementaciones previas.
La comparación final está en `.cache/release2c-scope.json`.

## Arquitectura del candidato

- Entrada nueva `src/main.manga-candidate.ts`, con el mismo App, appConfig, servicios,
  rutas hash y SDK Supabase de la aplicación. Añade únicamente los providers de publicación.
- `src/app/release/manga-candidate.providers.ts` suministra gates locales readonly true,
  gates cloud false y la política Guest-only. No importa providers del modo manual, no
  fuerza un workspace, no suplanta Auth/Sync ni expone controles de activación.
- Configuración Angular `production,manga-candidate`: optimización, hashes, sin sourcemaps,
  tsconfig propio y salida `dist/kana-study-candidate/browser`. Conserva la base `/kana-study/`.
- La configuración normal continúa utilizando `src/main.ts`, sin estos providers, con salida
  `dist/kana-study/browser`. Ni main.ts ni deploy-pages.yml fueron promovidos/modificados.
- No hay nuevas dependencias. El candidato no usa `manga-manual` ni el inspector de Angular.

| Gate/política | Entrada habitual | Candidato |
| --- | --- | --- |
| CUSTOM_DECKS_ENABLED | false | true, readonly |
| MANGA_DECK_ASSISTED_ENABLED | false | true, readonly |
| CUSTOM_DECK_SYNC_ENABLED | false | false, readonly |
| CUSTOM_REMOTE_UPLOAD_APPROVED | false | false |
| CUSTOM_DECK_GUEST_ONLY | false, sin efecto con features apagadas | true |

Los valores son providers de compilación/entrada. Ninguna URL, preferencia, runtime config
Supabase ni localStorage los cambia. El ensayo intenta apagar los gates locales, encender
cloud y desactivar Guest-only mediante storage/query; la política compilada prevalece.
La auditoría normal hace el intento inverso: no logra activar features ocultas.

## Autorización Guest-only y conservación de cuentas

`CustomDeckAccess` es una política pequeña basada en workspace y activationRevision, sin
repositorios, red ni efectos de migración. Su valor por defecto conserva las configuraciones
internas anteriores; el provider candidato activa explícitamente la restricción.

Se aplica a catálogo/carga de mazos, persistencia custom, entradas asistidas, biblioteca,
lector/popup, vocabulario por volumen, explorador/localización OCR y rutas profundas.
Los mazos builtin siguen pasando por su persistencia legacy y no quedan restringidos.

La comprobación de escritura reside también en CustomDeckRepository: antes de abrir IDB,
tras abrirlo, antes de procesar las filas y en los éxitos de escrituras antes del commit.
Los métodos con validación asíncrona capturan y comprueban la activación original. Incluye
create/edit/settings, confirmation, lifecycle delete/archive/restore, daily, review/undo,
coordinación y publicación. El backfill del registro rechaza una cuenta antes de abrir o
actualizar IndexedDB. No se añade una migración ni se cambia la versión v3 de la base.

Los recursos de rutas invalidan capturas por owner/epoch/generación. Las páginas retenidas
de estudio/cards/stats/settings dejan de mostrar el contenido custom al entrar en una
cuenta; la comprobación de escritura sigue siendo obligatoria aunque se retenga una acción.
El catálogo despeja también una carga pendiente al cambiar a un ámbito restringido.

| Ámbito | Comportamiento |
| --- | --- |
| Guest | Confirmar desde Manga, mazos/FSRS/undo, stats/settings, vocabulario/OCR y backup 2A |
| Cuenta | Lector/diccionario y funciones legacy disponibles; no crear ni modificar custom |
| Japanese 1500 | Catálogo, rutas, estudio y persistencia legacy disponibles en cuenta |
| Custom previo de cuenta | Preservado sin cambios; no se expone como mazo estudiable/editable en este candidato |
| Deep link custom de cuenta | Redirige a Mazos, con explicación Guest-only y conservación de datos |
| Página custom retenida al login | Oculta el contenido anterior inmediatamente y muestra el ámbito aplicable |
| Logout | Recupera Guest original, sin copiar ni borrar registros de cuenta |

Mazos/Perfil explican en ES/EN/CA que los datos anteriores de cuenta siguen guardados,
que no están disponibles en este lanzamiento y que cerrar sesión permite usar Guest.
No se les asigna un nuevo dueño ni se anuncian como perdidos. La advertencia de pérdida
local y la falta de backup portable de cuentas siguen siendo explícitas. No se recomienda
exportar Guest como protección de una cuenta. No hay avisos nuevos intrusivos en el lector.
El antiguo Guardar para estudiar de Manga Saved y su FSRS no se confunden con Añadir a Mazos:
la acción custom se restringe; las funciones legacy de Manga permanecen disponibles.

## Backup y round-trip optimizado real

Formato RELEASE-2A versión 1, base v3 y once stores intactos. Servicio/contrato no se
modifican. Continúa Guest compatible → Guest vacío, validación y commit atómico;
cuentas no admitidas. La ruta de cuenta conduce a la explicación; el servicio mantiene
su propia denegación de export/restore fuera de Guest.

El ensayo importa un CBZ/Mokuro por el input real, instala por UI un Yomitan controlado
con tres filas reales del diccionario distribuido (dos 大丈夫 y una 猫) y confirma dos
tarjetas mediante controles reales, eligiendo lectura/significado explícitamente.
No modifica gates desde consola ni inserta las tarjetas Guest directamente en IDB.

Tras good → undo → good se conservan dos eventos, uno anulado, snapshots y journal reales.
Se exporta el JSON y se compara exactamente su inventario con los once stores. Otro perfil
Chromium vacío restaura por UI; se comprueba igualdad exacta, recarga y cierre/reinicio real
del navegador. Sin archivos Manga en destino, se continúa con la tarjeta 猫 y se verifica
un evento nuevo conservando íntegros los anteriores. La copia contiene contextos y referencias,
no los archivos Manga, imágenes, OCR completo ni diccionario; la UI lo explica.

El ensayo no reproduce el scheduler ni inventa intervalos. Las APIs de review/undo de
cuentas se prueban con snapshots/eventos/journal reales generados por el motor existente,
preparados como datos históricos sintéticos antes de probar las denegaciones.

## Validación de navegador sobre el artefacto

Se sirve estáticamente el directorio optimizado bajo `/kana-study/`, en loopback. Sin
ng serve, sin inspector window.ng, sin providers manuales y sin fixtures dentro del bundle.
Los recorridos se repiten en ES oscuro 1280 px, EN claro 390 px y CA oscuro 320 px.

1. Guest limpio, importación CBZ/Mokuro por UI, diccionario y 大丈夫.
2. Lecturas だいじょうぶ/だいじょぶ y glosas de las filas originales, pestañas Palabra,
   Contexto y Grammar conservadas; Añadir a Mazos sigue siendo una acción secundaria.
3. Confirmación de lectura/significado, catálogo, FSRS/undo, estadísticas y copia local.
4. Restauración exacta entre perfiles, recarga, reinicio y continuación del estudio.
5. Vocabulario confirmado, dos apariciones de 大丈夫 en OCR y navegación al contexto.
   Se resalta una sola línea validada y se muestra `[0, 3)`; no se inventan cajas por carácter
   ni se abre automáticamente el diccionario al localizar.
6. Login/logout con el SDK real y respuestas HTTP controladas: separación, avisos, rutas
   de cuenta restringidas, diccionario sin creación custom y estudio de Japanese 1500.
7. Datos custom sintéticos de cuenta preexistentes conservados exactamente y Guest intacto.
8. Cuentas A/B/A mediante logout/login, sesión persistida/recarga, dos pestañas y eventos
   de sesión del SDK entre ellas; no se sustituyen señales de AuthService desde consola.
9. Avisos de cuenta y ajustes de idioma/tema elegidos por UI en ES/EN/CA y claro/oscuro.

El host sintético `release-candidate-fixture.supabase.co` se intercepta en Playwright;
ninguna petición llega a Supabase. Se sirven sesiones y REST legacy controlados. Se
observan peticiones legacy compatibles al estudiar Japanese 1500, pero no se valida aquí
su backend, RLS, el gateway JWT ni Supabase Auth real. El preview manual no sirve ninguna
configuración privada. Las cuentas y tokens son sintéticos, no secretos de usuario.

Se registran por separado REST/RPC custom y red externa: deben ser cero. Guardar,
repasar, restaurar, abrir pantallas y login/logout no activan transferencias V2 ni importación
custom. No se modifica SyncService, outbox ni los protocolos/migraciones remotos.

## Tamaño y grafo

| Artefacto | Bytes iniciales JS+CSS | Margen hasta 750000 |
| --- | ---: | ---: |
| Última referencia 2B | 748134 | 1866 |
| Entrada habitual, sin activar | 747917 | 2083 |
| Candidato Guest-only | 748760 | 1240 |

Ambos builds terminan correctamente, con los cuatro warnings SCSS de Grammar conocidos.
El candidato no excede el presupuesto. Repositorio custom, asistente y backup permanecen
fuera del cierre inicial; los providers manuales y fixtures están ausentes del artefacto.
La auditoría confirma que el provider/entry candidato no se filtra al build normal.

`npm run build:manga-candidate` ejecuta una auditoría obligatoria tras compilar: falla si
el cierre estático JS+CSS supera 750.000 bytes aunque Angular emita solo un warning.
Se comprueba que repositorio/servicios custom, asistente, backup y su copy siguen lazy,
que no hay código manual/test en el artefacto y que el build normal excluye el provider
candidato. No se aumenta ningún presupuesto, dependencia ni umbral de test.

## Resultados de validación

| Validación | Resultado real |
| --- | --- |
| Dirigidos afectados, nueve archivos | 135/135 |
| Suite Angular, sin validaciones pesadas concurrentes | 2087/2087, 202 archivos, 15,49 s de ejecución |
| TypeScript app/spec/candidato --noEmit | Tres códigos 0 |
| Build normal Pages + grafo | Correcto, 747917 bytes |
| Navegador optimizado normal, gates apagados | 3/3 escenarios ES/EN/CA |
| Build candidato + límite estricto y grafo | Correcto, 748760 bytes |
| Playwright sobre candidato optimizado | 3/3 recorridos completos, repetidos después de fijar la espera load |
| Intentos hostiles URL/storage en candidato | 3/3, política fija mantenida; cloud custom no se activa |
| REST/RPC custom y red externa | 0/0/0 por recorrido |
| Solicitudes legacy compatibles controladas | 4 escrituras observadas por recorrido; no son validación del backend real |
| Playwright de regresión en desarrollo | 42/42: Auth local, backup y Añadir rápido UX1.1, tres proyectos |
| Firefox/WebKit adicionales | No disponibles: ejecutables ausentes |
| git diff --check | Correcto |

Logs de cierre: release2c-directed-verified.log, release2c-suite-verified.log,
release2c-ts-{app,spec,candidate}-verified.log, release2c-normal-build-verified.log,
release2c-normal-browser-verified.log, release2c-candidate-build-verified.log,
release2c-candidate-browser-verified.log, release2c-candidate-browser-hostile-storage.log
 y release2c-dev-playwright-verified.log, todos bajo .cache.

Los logs completos son locales en `.cache/release2c-*`. Inventario de navegador:
`.cache/release2c-browser-results.json`. Grafo: `.cache/release2c-bundle.json`; la entrada
habitual tiene su auditoría independiente y ningún gate activado.

## Incidencias de 2B y del ensayo

- Timeout de proyección léxica bajo carga simultánea en 2B: infraestructura/contención
  como hipótesis, sin demostrar estabilidad absoluta. En este hito las suites completas
  se ejecutaron sin build ni navegador paralelos. No se aumentan timeouts ni se añaden retries.
- H4BA_USERS/H4BA_HTTP_URL ausentes: las suites cloud ampliadas requieren esa fixture.
  No se configuran cuentas privadas ni se repite SQL/PostgREST, pues cloud no cambia.
  No se declara la suite cloud verde ni se confunde el SDK controlado con Supabase real.
- El caso Grammar de navigation.spec sigue esperando /grammar/n5/00/1, ruta antigua;
  sus tres proyectos quedaron fallidos en 2B. Archivo conservado, fuera de este cambio.
  No se altera Grammar ni se selecciona una expectativa artificial para ocultarlo.
- Carrera de fixture 2B: conservada la espera de pantalla lazy. En el nuevo script estático
  se detectó otra carrera al leer storage durante la recarga explícita de login/logout;
  se corrige esperando el evento real load, registrado antes de pulsar el botón.
- Se adaptaron los selectores nuevos a la interfaz existente: lectura y significado son
  decisiones explícitas para 大丈夫. Para probar undo se usan dos tarjetas, conservando
  el cierre diario que ya existe al completar el mazo. No se cambian sus mecánicas.
- Se corrigió el estado loading del catálogo al pasar a cuenta durante una lectura y se
  añade denegación del backfill antes de abrir IDB. Son protecciones de ámbito, no cambios
  del scheduler, datos históricos ni formatos.

## QA visual y limitaciones

Capturas locales en .cache, de datos sintéticos y fuera del bundle:

| Pantalla | ES oscuro escritorio | EN claro móvil | CA oscuro estrecho |
| --- | --- | --- | --- |
| Diccionario | release2c-dictionary-es.png | release2c-dictionary-en.png | release2c-dictionary-ca.png |
| Estadísticas | release2c-stats-es.png | release2c-stats-en.png | release2c-stats-ca.png |
| Copia descargada | release2c-backup-es.png | release2c-backup-en.png | release2c-backup-ca.png |
| Restauración/reinicio | release2c-restored-es.png | release2c-restored-en.png | release2c-restored-ca.png |
| Localización OCR | release2c-location-es.png | release2c-location-en.png | release2c-location-ca.png |
| Perfil y aviso de cuenta | release2c-account-es.png | release2c-account-en.png | release2c-account-ca.png |

Se inspeccionaron visualmente el diccionario estrecho CA, el Perfil de cuenta móvil claro EN
 y la localización OCR de escritorio ES. Se comprueba línea única, rango textual, ausencia
 de diccionario automático y lectura sin creación custom en cuenta. Las glosas españolas
 proceden del diccionario ES instalado y se identifican como tales; cambiar el idioma de
 UI no se presenta como traducción IA de las glosas.

Enlaces locales: [Cuenta EN](C:/Users/pacam/Desktop/kana-study/.cache/release2c-account-en.png),
[Diccionario CA](C:/Users/pacam/Desktop/kana-study/.cache/release2c-dictionary-ca.png),
[OCR ES](C:/Users/pacam/Desktop/kana-study/.cache/release2c-location-es.png).

Firefox y WebKit se intentaron ejecutar, pero sus binarios no están instalados. No se
instalan dependencias nuevas ni se declara QA en Safari/iOS/Android físicos. Las capturas
son Chromium de escritorio con viewports móviles, no pruebas de dispositivos reales.

En móviles y navegación privada la cuota y persistencia del navegador pueden variar,
puede haber expulsión de almacenamiento y no hay garantía de conservación indefinida.
Recomendar un perfil normal separado y guardar copias fuera del navegador. No usar
modo privado como archivo permanente. El JSON puede contener contexto privado y no está
cifrado. Los mazos históricos de cuentas aún carecen de backup portable: se conservan,
se advierte de ello y no se permite generar nuevo progreso custom en ese ámbito.

## Revisión manual del candidato

Desde la carpeta del repositorio:

```powershell
npm run build:manga-candidate
npm run preview:manga-candidate
```

Abrir `http://127.0.0.1:4402/kana-study/#/manga` en un perfil de navegador separado.
El servidor solo escucha en loopback y sirve configuración Auth vacía: la revisión manual
se realiza en Guest, sin utilizar proyectos ni cuentas privadas. Es la aplicación optimizada
real en su modo natural sin sesión, no manga-manual ni un stub de Auth/Workspace.

Instalar el diccionario, importar un CBZ/ZIP con Mokuro, seleccionar OCR y elegir Añadir a
Mazos. Confirmar lectura/significado y estudiar; para probar undo, dejar otra tarjeta pendiente.
Abrir Mazos → Datos y progreso, exportar, conservar fuera del perfil y restaurar en otro
perfil Guest vacío. Reimportar los archivos Manga por separado si se quiere volver al lector.
El preview no crea tarjetas de ejemplo automáticamente.

La prueba automatizada completa, con perfiles sintéticos propios y sesión SDK controlada,
se ejecuta separadamente:

```powershell
npm run test:manga-candidate
```

No usar esa fixture como configuración pública. No copiar sus tokens/clientes a producción.

## Cambios mínimos para una promoción posterior — NO ejecutados

Tras aprobación explícita y revisión de las condiciones de QA:

1. En `.github/workflows/deploy-pages.yml`, cambiar la orden del paso Build for GitHub Pages
   a `npm run build:manga-candidate`, manteniendo npm test y TypeScript.
2. Cambiar únicamente la ruta de Upload Pages artifact a
   `./dist/kana-study-candidate/browser`.
3. Conservar los gates cloud false, Guest-only true y la generación de configuración pública
   Supabase ya existente para las funciones legacy. No publicar el runtime vacío del preview
   ni la fixture HTTP del test; el workflow normal de configuración no se ha modificado.
4. Repetir las validaciones del artefacto exacto y aprobar el alcance/mensajes de conservación
   de cuentas. No cambiar SQL ni activar Guest import V2 para esta publicación.

No es necesario habilitar flags en URL/storage, usar manga-manual ni activar herramientas
de desarrollo. El provider candidato no se ha integrado en main.ts ni en el workflow actual.

## Archivos de este hito

Lista exacta respecto al árbol recibido; los cambios anteriores de 2A/2B no se atribuyen
a este hito. Los archivos generados se mantienen desde sus JSON de origen.

Modificados:

- `src/app/shared/components/local-deck-notice/local-deck-notice.ts`
- `src/assets/i18n/local-decks.generated.ts`
- `MANGA_DECKS_DESIGN.md`
- `MANGA_DECKS_MANUAL_TESTING.md`
- `angular.json`
- `package.json`
- `src/app/core/services/custom-deck.repository.ts`
- `src/app/core/services/deck-catalog.service.ts`
- `src/app/core/services/deck-persistence-router.ts`
- `src/app/core/services/deck-route-resource.ts`
- `src/app/core/services/manga-deck-assisted.service.ts`
- `src/app/core/services/manga-volume-vocabulary.service.ts`
- `src/app/features/anki-cards/anki-cards.page.html`
- `src/app/features/anki-cards/anki-cards.page.ts`
- `src/app/features/anki-settings/anki-settings.page.html`
- `src/app/features/anki-settings/anki-settings.page.ts`
- `src/app/features/anki-stats/anki-stats.page.html`
- `src/app/features/anki-stats/anki-stats.page.ts`
- `src/app/features/anki-study/anki-study.page.html`
- `src/app/features/anki-study/anki-study.page.ts`
- `src/app/features/anki/anki.routes.ts`
- `src/app/features/manga/manga-ocr-explorer.ts`
- `src/app/features/manga/manga-ocr-location.ts`
- `src/app/features/manga/manga-reader.page.ts`
- `src/app/features/manga/manga-volume-vocabulary.page.ts`
- `src/app/features/manga/manga.page.ts`
- `src/app/features/manga/manga.routes.ts`
- `src/app/shared/components/dictionary-popup/dictionary-popup.ts`
- `src/assets/i18n/ca.json`
- `src/assets/i18n/en.json`
- `src/assets/i18n/es.json`

Nuevos:

- `MANGA_DECKS_RELEASE_2C.md`
- `scripts/audit-manga-candidate-bundle.mjs`
- `scripts/audit-manga-candidate.mjs`
- `scripts/serve-manga-candidate.mjs`
- `src/app/core/services/custom-deck-access.ts`
- `src/app/core/services/custom-deck-route.guard.ts`
- `src/app/release/manga-candidate.providers.ts`
- `src/app/release/manga-candidate.spec.ts`
- `src/main.manga-candidate.ts`
- `tsconfig.manga-candidate.json`

Las implementaciones previas se preservan. Permanecen sin modificar los parámetros FSRS,
Stats V2, contenido/IDs de Japanese 1500, Manga Saved FSRS, contrato/servicio de backup 2A,
AuthService de 2B, protocolos cloud, SQL y workflow de despliegue. No hay nuevos algoritmos,
traducción persistida de ejemplos ni promesa de cobertura lingüística automática.

## Condiciones y validaciones pendientes

No se observaron bloqueos críticos en el flujo Guest validado. La autorización Guest-only,
la restauración exacta y el límite inicial se han comprobado también sobre la aplicación
optimizada real. C3 técnico queda resuelto para el candidato, sin activar el despliegue.

Antes de promoverlo:

1. Aprobar expresamente el alcance Guest-only y los mensajes sobre datos anteriores de
   cuentas, que siguen sin backup portable y no deben borrarse del navegador.
2. Completar QA manual en Safari y dispositivos móviles reales del alcance que se vaya
   a anunciar, especialmente importación, descarga/restauración y persistencia/cuota.
3. Si se anuncia acceso de cuenta, realizar el smoke de login/logout legacy contra un
   entorno Supabase Auth aislado autorizado. El SDK con HTTP controlado aporta cobertura
   de cliente, pero no valida ese servicio ni su gateway/RLS.
4. Revisar las incidencias heredadas de la suite ampliada si pasan a ser requisito de
   publicación. No se declara verde esa suite ni se activa cloud para hacerla pasar.
5. Revisar y aprobar los dos cambios de promoción descritos, manteniendo la auditoría
   estricta y ambos gates cloud false.

Decisión: GO condicionado para revisión del candidato Guest; no un GO incondicional para
publicar ni para habilitar mazos de cuenta/cloud. Las comprobaciones pendientes son explícitas;
no se han sustituido por fixtures ni por aumentos de timeout.

La ausencia de incidencias en estas ejecuciones no demuestra estabilidad absoluta ni permite
publicar sin autorización. Este hito entrega un candidato revisable, no un despliegue.
