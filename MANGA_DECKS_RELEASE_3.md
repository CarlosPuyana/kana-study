# RELEASE-MANGA-3 — Revisión final, promoción y rollback Guest-only


**Actualización de preparación definitiva — 26/10/2026:** el propietario comunica siete
comprobaciones funcionales superadas en Chrome de escritorio. No es autorización de
publicación. Supabase Auth real sigue pendiente (última comprobación: §15, 27/10/2026).
Véase §14 para el estado vigente,
validaciones nuevas y conjuntos exactos A/B; los resultados anteriores se conservan.

Fecha del cierre técnico inicial: 2026-10-26. **GO de preparación técnica; publicación pendiente de aceptación humana y aprobación explícita del propietario.**

No se ha hecho commit, push, despliegue, SQL ni promoción efectiva. El workflow activo y
src/main.ts permanecen intactos. Este informe prepara una decisión y dos cambios revisables;
no concede autorización para publicar.

## 1. Estado inicial y alcance de la revisión

Se leyeron íntegramente RELEASE_AUDIT y RELEASE-2A/2B/2C. Se revisaron status, diffs,
HEAD, provider, configuraciones, scripts, guardas de UI/persistencia, contratos de backup,
versiones IDB y entradas de sincronización. No se rediseña la experiencia aceptada.

HEAD/rama recibidos: `main`, `09793158fbdfa52b7ecf20d135f1e7c3cc42a789`.
El árbol ya contenía **49 archivos versionados modificados y 32 archivos nuevos** respecto
al último commit. Son los cambios acumulados de auditoría/2A/2B/2C, no cambios atribuidos a R3.
Lista exacta: `release/manga-guest-accumulated-changes.json`; diff versionado completo en
`.cache/release3-accumulated-tracked.patch`; SHA-256 de 1585 archivos recibidos en
`.cache/release3-baseline.json`. Los archivos nuevos están enumerados, no cubiertos por
el diff de archivos versionados. No se pierde trabajo al preparar los parches.

En R3 no se modifican páginas/componentes, Auth, FSRS, Stats V2, Japanese 1500, Manga Saved,
backups ni SQL. El único ajuste a un verificador previo exige ahora **<750000** bytes en
vez de aceptar exactamente 750000. Se agregan herramientas de revisión/rollback y documentación.
Los ficheros de revisión no se importan ni copian al bundle de aplicación.

## 2. Referencia pública verificada, no inferida del HEAD

Consulta readonly de GitHub Actions el 26/10/2026:

- Último run del repositorio y último run exitoso: **Deploy to GitHub Pages #40**.
- Run: https://github.com/CarlosPuyana/kana-study/actions/runs/40119335388
- Commit: `09793158fbdfa52b7ecf20d135f1e7c3cc42a789`.
- Árbol Git: `13426a20766d375057a6900b888e8af0289ea1d5`.
- Job build: success; npm test, TypeScript app/spec, build y upload terminaron correctamente.
- Job deploy y paso Deploy to GitHub Pages: success, terminado el 24/10/2026 a las
  18:11:54 UTC (20:11:54 Europe/Madrid).
- Job de despliegue: https://github.com/CarlosPuyana/kana-study/actions/runs/40119335388/job/120947716974

Evidencia mínima sin credenciales: `release/manga-guest-public-baseline.json`.
No se cambiaron variables, credenciales, permisos ni configuración de GitHub/Supabase.

La consulta no devolvió un artefacto github-pages descargable. Por ello se **reconstruyó
el commit publicado**, con su lockfile idéntico al disponible localmente, en una carpeta
ignorada nueva usando git archive. No se presenta como el binario original descargado ni
como una reproducción bit a bit de Node 24.15.0/Ubuntu: la reconstrucción usa Windows y
Node 24.21.0. El contenido fuente sí procede del commit exacto, con finales LF equivalentes
al checkout de Linux. La primera copia con conversión CRLF produjo un error de comparación
textual en el prebuild; se extrajo de nuevo con core.autocrlf=false, sin editar código histórico.

## 3. Diferencias entre los cuatro estados

| Estado | Entrada/comando | Gates local/local/cloud/aprobación | Artefacto |
| --- | --- | --- | --- |
| Público verificado #40 | src/main.ts; npm run build -- --base-href /kana-study/ | false/false/false/false | dist/kana-study/browser |
| Build normal del árbol preparado | Mismo entry y comando; contiene correcciones 2A/2B/2C, sin activarlas | false/false/false/false | dist/kana-study/browser |
| Candidato optimizado | main.manga-candidate.ts; npm run build:manga-candidate | true/true/false/false; Guest-only=true | dist/kana-study-candidate/browser |
| Futuro build habitual de Pages tras promover | Workflow selecciona exactamente el comando/artefacto candidato | true/true/false/false; Guest-only=true | dist/kana-study-candidate/browser |

Incluso después de esa futura promoción, `npm run build` sin configuración candidata
seguiría siendo el build normal apagado. No se hace creer que ese comando cambia de
significado automáticamente: la selección está en los dos campos del workflow.
`manga-manual` no participa en ninguno de los artefactos de publicación.

### Parche de promoción preparado — no aplicado al workflow activo

`release/manga-guest-promote.patch` cambia exclusivamente:

```diff
- run: npm run build -- --base-href /kana-study/
+ run: npm run build:manga-candidate
- path: ./dist/kana-study/browser
+ path: ./dist/kana-study-candidate/browser
```

Se conservan npm ci, npm test, TypeScript, runtime config público, permisos, jobs, needs,
triggers y acciones de upload/deploy. Se validó git apply --check contra el workflow actual.
Se aplicó el parche y su inverso únicamente en una copia ignorada y se cotejó igualdad
exacta al volver. El hash del workflow activo no cambió. Resultado:
`.cache/release3-proposal-result.json`.

## 4. Validación Guest-only y experiencia aceptada

Se mantienen los providers reales de appConfig y el SDK real; no hay stubs/proveedores
manuales dentro del candidato. Los tokens locales son readonly true, cloud readonly false
y aprobación remota false. Ninguna URL, localStorage o preferencia activa custom cloud.

La política de publicación comprueba workspace/activationRevision en UI y rutas, bindings
retenidos y operaciones persistentes. CustomDeckRepository rechaza cuentas antes de abrir
IDB para escribir o ejecutar backfill; repite la guarda alrededor de las operaciones
asíncronas y antes de comprometer cambios. Se cubren creación, edición, settings, lifecycle,
review/undo, daily, coordinación y publicación. No se cambia la versión 3 ni sus once stores.

Las cuentas siguen utilizando lector, diccionario, Manga Saved, Japanese 1500 y funciones
legacy. Los datos custom previos de cuenta se conservan sin modificaciones, aunque el
candidato no los exponga para estudiar o modificar progreso. El aviso lo explica y no los
presenta como perdidos ni sincronizados. Los deep links custom remiten a Mazos con esa
explicación. Logout devuelve Guest; no existe copia automática Guest→cuenta.

Caso 大丈夫, sobre archivos optimizados servidos estáticamente bajo /kana-study/:

1. Importación CBZ/Mokuro mediante UI y diccionario con filas reales del ZIP distribuido.
2. Palabra, だいじょうぶ, significados españoles, alternativa だいじょぶ y Más significados.
3. Contexto/Gramática y acción Añadir a Mazos secundaria; no formulario automático.
4. Selección humana de lectura/significado, panel compacto, guardado real y retorno al lector.
5. Catálogo, FSRS, undo antes del cierre diario, stats y vocabulario por volumen.
6. Dos apariciones OCR, línea validada y rango [0,3), sin coordenadas ficticias por carácter.
7. Exportación, restauración exacta en otro perfil vacío, reinicio y continuación del estudio.
8. SDK con HTTP controlado, cuentas A/B/A, recarga, dos pestañas, datos de cuenta intactos
   y peticiones legacy compatibles; cero REST/RPC custom e intentos externos.

El SDK frente a HTTP controlado no valida Supabase Auth real, gateway JWT ni RLS. No se
utilizaron cuentas privadas ni se anuncia backend validado. Las fixtures quedan en scripts,
.cache y perfiles sintéticos, ausentes del artefacto. No se alteran la UI aprobada ni FSRS.

## 5. Protección del progreso y ensayo de rollback real local

El backup sigue siendo RELEASE-2A versión 1: Guest compatible → Guest vacío, inventario de
once stores y validación/commit atómico. Se preservan identidades, recibos, journal, fechas,
eventos anulados y snapshots originales; restaurar no ejecuta el scheduler ni envía el JSON.
Se mantiene el aviso visible de pérdida local, fichero privado y exclusión de archivos Manga.
No hay backup portable ni sincronización custom de cuentas.

El ensayo nuevo usa un perfil Chromium aislado y **el mismo origen, puerto y ruta** para
alternar artefactos, cerrando y relanzando el navegador en cada fase:

```text
candidato → normal preparado con gates apagados
          → reconstrucción del commit público 0979315
          → candidato nuevamente
```

Se parte de una copia creada por el recorrido real de creación/FSRS/undo del candidato de
esta revisión y se restaura por UI en el perfil de ensayo. Se añaden únicamente como setup
datos sintéticos históricos de cuenta para comprobar conservación de todos los owners.
La comparación usa transacciones readonly de los once stores, sin reparar ni migrar datos.

Resultado: **PASS en Chromium 153.0.8010.12**. Los once stores permanecen en versión 3 y todos los registros de Guest y cuenta sintética son exactamente iguales tras cada cambio de artefacto. Identidades, FSRS y journal quedan intactos. Al volver al candidato se recupera el estudio y la exportación reproduce el contenido original. Cero intentos externos. Evidencia: `.cache/release3-rollback-results.json`; capturas `.cache/release3-rollback-chromium-*.png`. Chrome instalado no disponible; no se cuenta como aprobado.

No se ha ejecutado un rollback Git o de Pages: solo se alternaron archivos estáticos locales
sobre datos de prueba. Tampoco se borró IndexedDB, localStorage ni almacenamiento de usuarios.
Una función oculta por rollback no equivale a pérdida de datos. La preparación y el commit
público se probaron separadamente: volver al normal preparado no se llama falsamente volver
al contenido exacto del commit público.

## 6. Resultados de validación serial

| Validación ejecutada | Resultado real | Evidencia local |
| --- | --- | --- |
| Dirigidos, nueve specs | 135/135 | .cache/release3-directed.log |
| Suite Angular actual | 2087/2087; 202 archivos | .cache/release3-suite.log |
| Playwright pertinente, tres proyectos | 42/42 | .cache/release3-playwright.log |
| Build candidato optimizado, repetido con guard estricto final | Correcto | .cache/release3-final-candidate-build.log |
| TypeScript app/spec/candidato | Los tres exit 0 | .cache/release3-ts-app.log, release3-ts-spec.log, release3-ts-candidate.log |
| Build normal Pages | Correcto | .cache/release3-normal-build.log |
| Auditoría de fronteras y grafo normal | Correcta | .cache/release3-normal-graph.log |
| Recorrido normal optimizado | 3/3 | .cache/release3-normal-browser.log |
| Recorrido candidato optimizado ES/EN/CA | 3/3 | .cache/release3-candidate-browser.log |
| Reconstrucción del commit público exacto | Build correcto; Angular 2019/2019 en 196 archivos | .cache/release3-prepare-stable.log, release3-public-unit.log |
| Rollback sobre mismo origen/perfil | PASS, cuatro etapas, once stores exactos | .cache/release3-rollback-results.json |
| Borde del presupuesto | 3/3 casos sintéticos | .cache/release3-budget-boundary.json |
| Parche e inverso en copia | Round trip exacto; workflow activo intacto | .cache/release3-proposal-result.json |
| Sintaxis Node de los seis scripts R3 | Correcta | .cache/release3-final-checks.json |
| git diff --check y whitespace nuevo | Correctos | .cache/release3-final-checks.json |

Los builds actual normal/candidato e histórico conservan los cuatro warnings SCSS conocidos de Grammar; no bloquean. Los 2019 tests históricos corresponden al commit público, no al árbol preparado ni a los 2023 que incluía una auditoría previa con tests entonces sin commit.

Las validaciones de la aplicación se ejecutaron una tras otra, sin build/Playwright en
paralelo con la suite. Los logs son `.cache/release3-*`, separados de resultados de 2C.
La reconstrucción pública tiene sus propios tests y no se suman a los de la aplicación
actual para inventar una cifra mayor de cobertura.

### Tamaño y dependencia real

| Artefacto real | Bytes iniciales | Margen hasta 750000 |
| --- | ---: | ---: |
| Público 0979315 reconstruido | 749794 | 206 |
| Normal preparado, gates apagados | 747917 | 2083 |
| Candidato Guest-only | **748760** | **1240** |

Fuente: stats de cada build y .cache/release3-public-graph.json / .cache/release2c-bundle.json. El candidato registra exclusiveMaximum=true. Todos están estrictamente por debajo del límite; el margen candidato es reducido y debe comprobarse de nuevo tras cualquier cambio.

El script de build candidato rechaza ahora **750000 también**, no solo 750001. Se probaron
metafiles sintéticos de 749999/750000/750001 con el mismo guard real: aceptado/rechazado/
rechazado. Es una prueba del borde, no la medición del artefacto; los bytes de la tabla
proceden de los stats reales. El repositorio/asistente/backup/i18n permanecen lazy y no
se arrastran fuentes de tests, fixtures, inspector ni providers manga-manual a producción.
El build normal excluye el provider y entrada candidatos. No hay dependencias nuevas.

## 7. Compatibilidad, soporte y aceptación humana

La checklist exacta está en `release/manga-guest-acceptance.md`; todos sus checks humanos
permanecen pendientes de firma. Incluye instalación del diccionario, fixture CBZ local,
大丈夫, teclado, cancelación/foco, temas, ES/EN/CA, backup entre perfiles, reinicio y cuenta
solo en un entorno autorizado.

Generar la fixture sin crear tarjetas ni tocar el navegador:

```powershell
node scripts/create-manga-release-manual-fixture.mjs
npm run preview:manga-candidate
```

Abrir `http://127.0.0.1:4402/kana-study/#/manga` en un perfil normal separado. Importar
`C:\Users\pacam\Desktop\kana-study\.cache\release3-manual-volume.cbz`; instalar el diccionario
completo desde la biblioteca. Su contenido es una página sintética con 大丈夫 y 猫.
El preview sirve Auth vacío, no credenciales reales. Para probar undo, dejar otra tarjeta
pendiente: se conserva la restricción existente al completar el día, sin modificarla.
El segundo perfil para restaurar debe usar el mismo origen/puerto y un Guest vacío.

Compatibilidad comprobada y restricciones que deberán comunicarse:

- Chromium de Playwright en Windows, automatizado; viewports móviles no son dispositivos físicos.
- Chrome instalado: no disponible en la ruta instalada comprobada; no ejecutado.
- Firefox y WebKit: ejecutables no instalados, no probados; WebKit tampoco sería Safari físico.
- Chrome Android, Safari iOS y Safari macOS reales: no disponibles/probados aquí.
- Chrome escritorio humano, teclado/foco y lectura manual: aceptación pendiente, no firmada por un bot.
- Supabase Auth real: pendiente de un entorno aislado autorizado; no se anuncia validado por fixtures.
- Cuota, evicción y modo privado varían por navegador/dispositivo. No se garantiza persistencia
  indefinida, arranque frío offline ni comportamiento móvil por una prueba de IndexedDB sintética.

Las notas para usuarios están en `release/manga-guest-release-notes.md`. No anuncian
custom cloud, backup de cuenta, traducción persistente del ejemplo ni generación/cobertura
lingüística automática. Recomiendan copia fuera del navegador y conservan el aviso de pérdida.
No anunciar soporte validado de Safari/Android/iOS hasta completar su aceptación o restringir
explícitamente el soporte del lanzamiento. No cambiar las variables públicas como atajo de QA.

## 8. Incidencias heredadas y límites de esta revisión

- El timeout léxico de 2B coincidió con validaciones pesadas simultáneas; esa relación era
  una hipótesis, no prueba de estabilidad absoluta. Aquí no se solaparon las suites con otras
  cargas pesadas. No se añaden sleeps, retries ni timeouts mayores.
- Los tests cloud que requieren H4BA_USERS/H4BA_HTTP_URL no se declaran verdes ni se ejecutan
  contra cuentas privadas. No se repiten SQL/PostgREST ni se activa cloud para poder validarlos.
- El caso de navigation.spec sobre /grammar/n5/00/1 conserva su expectativa heredada;
  sus tres proyectos fallidos conocidos no se presentan como validados por estos 42 casos.
  No se modifican tests ajenos para ocultarlo.
- El preparador histórico necesita LF: git archive con autocrlf activo produjo una comparación
  textual distinta en el prebuild de traducciones. Se solucionó extrayendo una nueva copia
  con core.autocrlf=false; no se modificó el árbol activo ni el commit histórico.
- En el script nuevo de rollback, un selector de input sin scope encontró todavía la biblioteca
  mientras cargaba la ruta lazy de backup. Se espera explícitamente app-anki-backup antes
  de seleccionar el fichero. No se cambia la aplicación ni se reintenta la restauración.

## 9. Promoción futura — comandos preparados, NO ejecutados

Antes de tocar el workflow: aceptación humana y aprobación explícita del propietario,
review de los 81 archivos acumulados y los entregables R3, rama remota/último despliegue
comprobados de nuevo, copia de seguridad externa y árbol limpio para la operación concreta.
La revisión técnica no autoriza ningún commit/push.

Se propone separar **dos commits futuros**:

1. Preparación A: fuentes/pruebas/docs acumulados, sin activar Pages. Propuesta de mensaje:
   `release/manga-guest-preparation-commit.txt`. Revisar y seleccionar archivos explícitamente;
   no añadir .cache, perfiles, backups JSON, dist o node_modules. No usar un add indiscriminado
   que incorpore trabajo ajeno. Registrar el SHA real de A una vez autorizado y creado.
2. Promoción B: exclusivamente el parche de los dos campos del workflow. Mensaje propuesto:
   `release/manga-guest-promotion-commit.txt`. Registrar el SHA real de B y la ejecución de CI.

Solo después de esa aprobación, con A ya revisado y un árbol limpio:

```powershell
git status --short
node scripts/check-manga-promotion-proposal.mjs
git apply --check release/manga-guest-promote.patch
git apply release/manga-guest-promote.patch
git diff -- .github/workflows/deploy-pages.yml
```

El diff debe contener exactamente el comando candidato y su ruta de upload, sin tocar
runtime config/vars, permisos ni tests. Ejecutar en serie los comandos de validación de §12.
Después, y únicamente con autorización para publicar B:

```powershell
git add -- .github/workflows/deploy-pages.yml
git diff --cached --name-only
git diff --cached -- .github/workflows/deploy-pages.yml
git commit -F release/manga-guest-promotion-commit.txt
git push origin main
```

La lista staged debe contener solo el workflow. Verificar en Actions que el run corresponde
al SHA de B y todos los pasos/jobs terminan success. Confirmar el origen público/base hash,
artefacto candidato, lectura/guardado Guest y advertencias. No ejecutar pruebas con cuentas
privadas sin autorización. No desplegar SQL ni modificar la configuración Supabase.

## 10. Rollback verificable — preparado, NO ejecutado

Antes de un rollback real: conservar fuera del repo este procedimiento, los SHAs A/B y
copias descargadas. Un revert exacto de A eliminaría también los nuevos scripts/docs;
no depender de que sigan en el árbol para leer las instrucciones. No borrar el perfil.
Trabajar con árbol limpio y review humana; detenerse ante conflictos, sin reset/clean,
forzar merges ni reescribir la rama compartida.

### A. Desactivar el lanzamiento con el código preparado

Es la primera reversión funcional ensayada. Con B aún aplicado:

```powershell
$promotionCommit = 'SUSTITUIR_POR_SHA_REAL_DE_B'
git show --stat $promotionCommit
git revert $promotionCommit
```

Crea un nuevo commit que devuelve los dos campos a build normal/artifact normal; A y sus
correcciones permanecen. `release/manga-guest-disable.patch` contiene el mismo diff inverso
para revisión, pero no hace falta aplicarlo además de revert B. No ejecutar ambas acciones.
El nuevo workflow mantiene tests/TypeScript y las variables legacy. No es un retorno exacto
al árbol del commit público; es desactivación segura sobre el código preparado, probada aparte.

Revisar el nuevo commit, ejecutar tests/build normal y su auditoría, y hacer push solo con
la autorización correspondiente. La publicación volverá a ocultar custom; no borra stores.

### B. Volver al contenido de la última versión pública verificada

Si A y B son exactamente los commits de preparación y promoción, B sigue aplicado y no hay
cambios posteriores sin revisar:

```powershell
$preparationCommit = 'SUSTITUIR_POR_SHA_REAL_DE_A'
$promotionCommit = 'SUSTITUIR_POR_SHA_REAL_DE_B'
git status --short
git show --stat $preparationCommit
git show --stat $promotionCommit
git revert --no-commit $promotionCommit $preparationCommit
git diff --cached --stat
git diff --cached --exit-code 09793158fbdfa52b7ecf20d135f1e7c3cc42a789 -- .
```

El último comando debe dar 0 si no hay otros commits y se quiere la igualdad exacta del
árbol. Ante diferencias/conflictos, no forzar ni publicar: revisar los cambios posteriores.
Si B ya se revirtió mediante el procedimiento de desactivación de §10.A, no revertir B otra vez; evaluar únicamente la reversión del
commit de preparación sobre el estado actual, con diff completo y review.

Repetir las validaciones de la versión recuperada. Tras revisión y autorización:

```powershell
git commit -m 'revert: restore Pages behavior from 0979315'
git push origin main
```

El SHA del nuevo commit será distinto de 0979315: se restaura su contenido mediante historia
aditiva, no se mueve main hacia atrás. Conservar el runtime/variables de GitHub existentes.
El workflow antiguo sigue ejecutando npm test, tsc app/spec y build Pages normal.

### Comprobación del despliegue revertido y los datos

- Actions debe mostrar el SHA NUEVO del revert, con build/upload/deploy success.
- Confirmar comando normal, ruta normal y gates apagados. No esperar el antiguo SHA como
  HEAD de la nueva ejecución, ni reutilizar un artefacto inexistente sin reconstruirlo.
- En un perfil de aceptación con copia externa, recargar sin borrar datos del sitio,
  comprobar Japanese 1500/legacy y que custom queda oculto; un deep link puede decir
  que el mazo no está disponible. No interpretar esa ocultación como borrado.
- Conservar el mismo host/esquema/perfil. No hay garantía de los datos si el usuario borra
  el sitio, usa modo privado, cambia de dispositivo o el navegador expulsa almacenamiento.
- El ensayo local demuestra igualdad exacta v3/once stores para Guest y owner de cuenta
  sintético. Al reactivar un candidato compatible se recuperan catálogo/estudio y se exporta
  la misma copia con sus identidades/FSRS/journal. No se promete downgrade universal a
  versiones futuras con schemas distintos.
- Publicar el mensaje de retirada temporal preparado en las notas; no recomendar borrar
  datos ni resetear progreso para intentar que vuelvan los mazos.

## 11. Propuesta de commit, notas y riesgos pendientes

La propuesta de preparación no engloba a ciegas trabajo ajeno: usar el manifiesto recibido,
este informe y los diffs actuales para revisar cada fichero. A/B no existen todavía.
Las notas de publicación son borradores, sin enviar mensajes a terceros.

Pendientes antes de publicar: firma humana del alcance Guest-only y advertencias, Chrome
real/teclado, decidir soporte móvil/Safari según QA físico, smoke de Auth legacy real solo
en entorno autorizado y aprobación de A/B/push. Los mazos históricos de cuenta siguen sin
backup portable: se conservan y se advierte su indisponibilidad pública, sin nuevas escrituras.

No quedan defectos bloqueantes observados en el alcance Guest automatizado. Sí quedan
validaciones humanas/externas sin completar: no se eliminan del informe por una suite verde.

## 12. Reproducción serial de la revisión

No ejecutar estos procesos simultáneamente. La checklist contiene el flujo humano detallado.

```powershell
npm test -- --include=src/app/release/manga-candidate.spec.ts --include=src/app/core/services/custom-deck.repository.spec.ts --include=src/app/features/anki-study/custom-deck-pages.spec.ts --include=src/app/core/services/manga-deck-assisted.spec.ts --include=src/app/features/manga/manga-deck-review.spec.ts --include=src/app/features/manga/manga-volume-vocabulary.page.spec.ts --include=src/app/features/manga/manga-ocr-location.spec.ts --include=src/app/core/services/deck-backup.spec.ts --include=src/app/core/services/custom-local-auth.spec.ts
npm test
npx playwright test e2e/local-decks-auth.spec.ts e2e/deck-backup.spec.ts e2e/manga-quick-add-ux11.spec.ts
npm run build:manga-candidate
npx tsc -p tsconfig.app.json --noEmit
npx tsc -p tsconfig.spec.json --noEmit
npx tsc -p tsconfig.manga-candidate.json --noEmit
node scripts/check-manga-release-budget-boundary.mjs
node scripts/check-manga-promotion-proposal.mjs
npm run build -- --base-href /kana-study/ --stats-json
node scripts/audit-local-deck-boundaries.mjs
node scripts/audit-manga-public-build.mjs
npm run test:manga-candidate
node scripts/create-manga-release-manual-fixture.mjs
node scripts/prepare-manga-rollback-baseline.mjs
node scripts/audit-manga-release-rollback.mjs
git diff --check
```

El preparador de baseline crea una copia ignorada NUEVA del commit fijo verificado,
compara su lock con las dependencias existentes, ejecuta prebuild/build histórico y
registra `.cache/release3-stable-rebuild.json`. Si cambia el lock, se detiene; no sustituye
las dependencias del árbol activo. El último auditor sirve los tres artefactos en loopback
con un mismo origen y usa perfiles nuevos, no la cuenta/perfil habitual.

## 13. Archivos de R3 y preservación final

Archivos recibidos modificados únicamente en R3:

- `scripts/audit-manga-candidate-bundle.mjs`
- `MANGA_DECKS_DESIGN.md`
- `MANGA_DECKS_MANUAL_TESTING.md`

Archivos nuevos de esta revisión:

- `MANGA_DECKS_RELEASE_3.md`
- `release/manga-guest-acceptance.md`
- `release/manga-guest-accumulated-changes.json`
- `release/manga-guest-disable.patch`
- `release/manga-guest-preparation-commit.txt`
- `release/manga-guest-promote.patch`
- `release/manga-guest-promotion-commit.txt`
- `release/manga-guest-public-baseline.json`
- `release/manga-guest-release-notes.md`
- `scripts/audit-manga-release-rollback.mjs`
- `scripts/check-manga-promotion-proposal.mjs`
- `scripts/check-manga-release-budget-boundary.mjs`
- `scripts/create-manga-release-manual-fixture.mjs`
- `scripts/prepare-manga-rollback-baseline.mjs`

La comparación con los hashes recibidos debe confirmar que el único fichero anterior
alterado por R3, además de los apéndices de documentación, es el verificador de presupuesto.
El árbol de la aplicación candidata de 2C, la experiencia aprobada, el workflow, los cuatro
reports previos, fuentes FSRS, Stats, Japanese 1500, Manga Saved y SQL se conservan.
Comparación final: 1585 archivos recibidos, cero eliminados, solo tres modificados por R3 y catorce nuevos; evidencia `.cache/release3-scope.json`. HEAD sigue en 09793158fbdfa52b7ecf20d135f1e7c3cc42a789 y el índice no tiene cambios staged. Workflow, package/lock, fuentes de aplicación y reportes anteriores idénticos a los hashes recibidos. Sin commit, push, despliegue, SQL, activación cloud ni operaciones sobre datos reales.

## 14. Preparación definitiva posterior a REPO-HYGIENE-1

### Estado Git y localización operativa

HEAD/main sigue en 09793158fbdfa52b7ecf20d135f1e7c3cc42a789; no se crean commits.
Se inspeccionaron git status, log, diff del working tree, diff staged y cambios contra HEAD.
Los 33 renombres documentales anteriores permanecen staged; no se altera ese índice.
El nuevo [índice](docs/INDEX.md) localiza los cinco RELEASE, DESIGN, manual y [checklist](release/manga-guest-acceptance.md).
Los cinco RELEASE y release/ permanecen en raíz; sus rutas operativas no se han roto.
Los históricos H1–H4 están en docs/history/manga-decks; las guías en docs/architecture y
docs/features. Mapeo exacto: [repo-path-map](docs/repo-path-map.json). Los nombres antiguos
en manifiestos previos son referencias históricas; no se usan a ciegas como staging de A.

Se conservan .gitignore y .git/info/exclude: .cache, dist, node_modules, .angular,
test-results y playwright-report están ignorados; .env y config local también. No se añaden
perfiles, logs ni backups privados al conjunto de commits. Se copiaron 486 resultados previos
(13500887 bytes) a .cache/release-final/prior-outputs antes de ejecutar pruebas que regeneran
salidas. Playwright utiliza un outputDir nuevo; no se limpia el test-results previo.

Última ejecución pública consultada readonly de nuevo: Deploy to GitHub Pages #40, success,
SHA 09793158fbdfa52b7ecf20d135f1e7c3cc42a789, actualizada 24/10/2026 18:11:55 UTC.
[Run público verificado](https://github.com/CarlosPuyana/kana-study/actions/runs/40119335388).
No se consultan ni modifican variables privadas o credenciales.

### Aceptación y alcance de la beta

El propietario comunica haber superado el 26/10/2026: diccionario; Añadir a Mazos; FSRS y undo;
explorador OCR; backup/restauración; persistencia; interfaz, idiomas y temas. Se registra en
la checklist, con fuente explícita. No se conoce versión exacta de Chrome ni dispositivo
concreto y no se inventan capturas adicionales. Las casillas detalladas no se firman en bloque.

Alcance propuesto: **beta Guest-only, experiencia aceptada en Chrome de escritorio**.
Safari y Android/iOS físicos no están verificados. UI local true/true; cloud false/false.
Las cuentas conservan funciones legacy y datos custom históricos, pero no crean/modifican
custom público. No hay respaldo custom al hacer login, ni archivos Manga dentro del backup
Guest, traducción persistida de ejemplos IA o generación lingüística automática fiable.
Se mantiene la recomendación visible de descargar copias fuera del navegador.

### AuthService 2B: revisión y bloqueo externo

Se revisó el diff de AuthService respecto al commit público: la promesa handling se asigna
sincrónicamente y el callback SDK retorna sin esperar; signIn/signUp con sesión esperan la
elección de espacio; la presencia Guest se consulta separada de cloud con fences de generación
y activationRevision; merge legacy exige disponibilidad custom explícita antes de coordinar
custom; loadProfile es asíncrono, no bloquea elección local y descarta respuestas antiguas.
No se modifica nada de ese código durante esta preparación.

La cobertura local prueba clientes/eventos controlados y el SDK real con HTTP interceptado.
**No prueba GoTrue real, refresh real del SDK, gateway/JWT/CORS/RLS de Supabase ni disponibilidad
del servicio.** No hay entorno aislado ni cuenta de prueba autorizados aportados; el propietario
ya indicó conservar Supabase Auth como pendiente. No se usan sus cuentas privadas. No se
intenta login ni se cambia configuración remota para cerrar artificialmente este punto.

Prueba de humo mínima pendiente, en el MISMO código candidato y también el normal que A publicaría:

1. Obtener autorización del proyecto Supabase aislado y su cuenta de prueba dedicada; verificar
   el hostname del proyecto antes de cualquier solicitud. Debe tener las funciones legacy ya
   provisionadas. No desplegar SQL en esta tarea; si falta infraestructura, registrar bloqueo.
2. Servir una copia ignorada del artefacto exacto con configuración pública del entorno aislado,
   en un perfil normal de prueba separado. El preview actual sirve Auth vacío y NO permite
   esa comprobación. No modificar variables de GitHub/producción ni public/supabase-config.js
   del árbol fuente. Solo publishable/anon en el navegador; jamás secret/service_role.
3. En Guest, crear manualmente dos tarjetas con progreso/undo y descargar un backup externo.
   Conservar los once stores e identidades antes de entrar, para cotejar tras logout.
4. Login con la cuenta de prueba: elección de espacio sin copia custom automática, aviso de
   alcance y acceso al Perfil. Un rechazo real debe verse como error, no éxito simulado.
5. Abrir Japanese 1500, catálogo/estudio y funciones legacy; comprobar una operación de progreso
   pequeña y explícita en esa cuenta sintética. Si sync legacy está configurada, syncNow debe
   confirmar su operación sin tiempo duplicado; registrar si esa parte no está configurada.
6. Recargar y cerrar/reabrir el navegador sin borrar almacenamiento: restauración real de sesión,
   cuenta y espacio correctos. Probar refresh/expiración con el mecanismo real autorizado del
   entorno, sin editar tokens ni reemplazar el SDK por fixtures; registrar lo no ejercitado.
7. Logout: vuelve Guest con inventario/progreso idénticos. Repetir login/logout para confirmar
   ausencia de migración automática; la cuenta no ve ni modifica las tarjetas Guest.
8. Durante todo el recorrido, observar Network: cero escrituras/RPC custom, ninguna transferencia
   V2, solo endpoints del proyecto aislado para legacy. Guardar evidencias redactadas, sin tokens,
   contraseñas, cookies o claves secretas. Informar fecha/entorno/versión real si se conocen.

Pendiente exacto: autorización/configuración aislada y cuenta; ejecución real de los pasos
4–8 y cotejo de Guest, restauración/refresh, Japanese 1500 y sync legacy cuando esté configurada.
Se mantiene **GO condicionado**, sin certificar esta prueba mediante mocks.

### Validaciones finales de esta preparación

| Comprobación ejecutada en esta preparación | Resultado | Log .cache/release-final/ |
| --- | --- | --- |
| Dirigidos Manga/mazos/backup/Guest/Auth/aislamiento/rutas | **190/190**, 12 archivos | directed.log |
| Angular completo | **2087/2087**, 202 archivos; 15,05 s runner | angular.log |
| Playwright Manga/backup/Auth local, retries 0 | **42/42**, tres proyectos, 1,3 min | playwright.log |
| TypeScript app/spec/candidato | Los tres exit 0 | ts-app.log, ts-spec.log, ts-candidate.log |
| Build candidato optimizado | **748760 bytes**, margen 1240, máximo exclusivo 750000 | build-candidate.log |
| Build normal Pages | **747917 bytes**, gates apagados | build-normal.log |
| Borde del guard estricto | 749999 aceptado; 750000/750001 rechazados | budget.log |
| Dependencias iniciales y fronteras lazy | PASS, sin entrada manual/fixtures en inicial | boundaries.log; metadata release2c-bundle.json |
| Candidato optimizado, ES/EN/CA y temas | **3/3**; diccionario, guardado, FSRS/undo, OCR, backup/reinicio | candidate-browser.log |
| Normal optimizado, ES/EN/CA | **3/3**, funciones custom apagadas pese a URL/storage | normal-browser.log |
| Red custom y cuentas controladas | Cero REST/RPC custom e intentos externos; datos de cuenta conservados; 4 escrituras legacy controladas por recorrido | candidate-browser.log; release2c-browser-results.json |
| Rollback local tras reorganización | PASS Chromium, mismo origen/perfil, once stores v3/owners/FSRS/identidades/journal exactos y exportación exacta al volver | rollback.log; release3-rollback-results.json |
| Parches de promoción/desactivación | Parche e inverso en copia exactos; workflow activo intacto | proposal-final.log |
| Enlaces, rutas y hashes de documentos trasladados | PASS en modo links-only; navegación desde README completa | docs-final.log |
| Sintaxis y checks de diff/staged/whitespace nuevo | Correctos | final-checks.json |

Solo permanecen los cuatro warnings SCSS conocidos de Grammar. No se elevan presupuestos.
Firefox/WebKit no tienen binarios disponibles; la sonda de Chrome instalado tampoco encontró
su ruta predeterminada. Esto no invalida la aceptación Chrome comunicada por el propietario:
la automatización utiliza Chromium y no inventa los detalles del navegador manual.
Supabase Auth real no se ejecutó. No se ejecutó SQL ni se modificó la aplicación.
El servidor local normal y el candidato se probaron con configuración neutral o HTTP
controlado; esa configuración no se propone para reemplazar las variables públicas de Pages.


Los logs nuevos están en .cache/release-final/, separados de R3 y de higiene. No se reutilizan
las cifras históricas como ejecuciones nuevas. Se conserva el límite estricto <750000.
La auditoría documental usa --links-only: mantiene enlaces, navegación y hashes de movimientos,
pero no compara documentos actualizados por autorización contra el snapshot histórico de higiene.
Ese snapshot permanece intacto. Un baseline nuevo de esta fase verifica el scope y los hashes
fuera de los documentos/herramienta expresamente actualizados; no se cambian fuentes ni gates.

### Commit A: conjunto y mensaje exactos, sin staging adicional ni commit

- [Lista de archivos actuales que se prepararían](release/manga-guest-commit-a-paths.txt).
- [Manifiesto de cambios con renombres y hashes](release/manga-guest-commit-a-files.json).
- [Mensaje exacto de A](release/manga-guest-preparation-commit.txt).

El conjunto contiene **141 archivos actuales: 52 modificados, 33 renombrados y 56 nuevos**.
El manifiesto se genera desde git diff HEAD y archivos actuales sin seguimiento, después de
reorganizar. Incluye las fuentes 1/2A/2B/2C/3, tests, backup, providers/configuración candidata,
33 renombres, documentación reorganizada y esta aceptación. No usa el manifiesto antiguo como
pathspec. Todos los archivos existentes enumerados están permitidos por Git; no contiene .cache,
dist, node_modules, perfiles, JSON privados, credenciales ni logs. No incluye el workflow activo.
El propio JSON declara su hash nulo por autorreferencia; no se finge un hash de sí mismo.
El plan es un snapshot: si cambia un archivo, revisar/regenerar y validar antes de autorizar A.

Solo tras revisión y autorización explícita, en una operación futura:

~~~powershell
# Los 33 renombres ya están staged; añadir solo los archivos existentes revisados de la lista.
git add --pathspec-from-file=release/manga-guest-commit-a-paths.txt
git diff --cached --name-status
git diff --cached --check
# Cotejar cada cambio/renombre con commit-a-files.json; no debe aparecer el workflow.
git diff --cached -- .github/workflows/deploy-pages.yml
git commit -F release/manga-guest-preparation-commit.txt
git rev-parse HEAD
git push origin main
~~~

No se ejecuta ninguna de estas acciones aquí. Registrar el SHA real de A y revisar Actions.
**Push de A también dispara Pages**: seguirá usando build normal, con Manga × Mazos apagado,
pero incorpora los cambios preparados de Auth/backup/docs. No es el mismo binario ni todo el
mismo código de 0979315. Verificar web pública, gates apagados y funciones legacy, no afirmar
que el despliegue sea idéntico por mantener la función oculta. Antes de ese push, cerrar el
smoke Auth o aceptar expresamente su riesgo pendiente; la aceptación funcional Guest no lo cierra.

### Commit B: diff mínimo exacto, sin aplicar

[Parche de promoción](release/manga-guest-promote.patch) y [mensaje B](release/manga-guest-promotion-commit.txt).

~~~diff
-        run: npm run build -- --base-href /kana-study/
+        run: npm run build:manga-candidate
-          path: ./dist/kana-study/browser
+          path: ./dist/kana-study-candidate/browser
~~~

Son los únicos dos campos que cambiarían. npm ci, npm test, tsc app/spec, variables públicas
Supabase, permisos, jobs y dependencias build/upload/deploy se conservan. Gates cloud false.
El check aplica parche e inverso solo a una copia ignorada y coteja el hash del workflow activo;
no se aplica al archivo activo ni se modifica el índice.

Después de que A esté publicado/verificado y de una segunda aprobación expresa:

~~~powershell
git status --short
# Debe estar limpio, con A como base y sin cambios ajenos a B.
node scripts/check-manga-promotion-proposal.mjs
git apply --check release/manga-guest-promote.patch
git apply release/manga-guest-promote.patch
git diff -- .github/workflows/deploy-pages.yml
# Repetir validaciones pertinentes, revisar solo los dos campos y autorizar B.
git add -- .github/workflows/deploy-pages.yml
git diff --cached --name-only
git diff --cached -- .github/workflows/deploy-pages.yml
git commit -F release/manga-guest-promotion-commit.txt
git rev-parse HEAD
git push origin main
~~~

Comprobar en Actions el SHA exacto nuevo de B, todos los pasos success y el artefacto candidato.
En la beta pública verificar Guest, diccionario→añadir→estudio→backup, aviso local y conservación
tras recarga; cuenta solo con autorización. Confirmar cero escrituras custom y que la sincronización
legacy no se anuncia como respaldo de las tarjetas. No cambiar variables públicas ni SQL.

### Revert de B: nuevo commit sin borrar IndexedDB

Solo con autorización, árbol limpio y SHA real de B registrado:

~~~powershell
$promotionCommit = 'SUSTITUIR_POR_SHA_REAL_DE_B'
git show --stat $promotionCommit
git revert $promotionCommit
# Revisar dos campos inversos; repetir npm test, TypeScript, build normal y gates.
git show --stat HEAD
git push origin main
~~~

No aplicar además el parche inverso. El revert conserva A y crea un SHA nuevo; no equivale
a volver al árbol público original. Verificar Actions para ese SHA y Pages con la función
oculta. Conservar origen/perfil y backups; no borrar datos del sitio ni resetear progreso.
El ensayo local compara los once stores al alternar candidato→normal→0979315 reconstruido→
candidato; la ocultación no borra datos. El retorno exacto a la fuente 0979315, si fuese necesario,
conserva el procedimiento separado de §10.B y requiere revisar ambos commits y cambios posteriores.

### Decisión por etapa

| Etapa | Decisión técnica | Condición pendiente / autorización |
| --- | --- | --- |
| Conjunto A preparado | GO condicionado | Revisar lista/diffs; smoke Auth real pendiente. Crear A exige autorización; su push publica Auth modificado, por lo que cerrar o aceptar expresamente ese riesgo antes de publicarlo |
| Promoción B preparada | GO condicionado | A publicado/verificado, decisión sobre Auth pendiente y aprobación independiente de B/push; alcance beta Chrome escritorio |
| Publicación ejecutada | No autorizada ni ejecutada | Aceptación funcional no autoriza commits/push/deploy |

No se inicia otro hito; no se aplica SQL, se altera FSRS, se activa custom cloud ni se elimina
trabajo anterior. Rutas reorganizadas y resultados completos permanecen enlazados desde INDEX.

## 15. Última comprobación Auth antes del push — 27/10/2026

**Resultado: Supabase Auth real sigue pendiente; GO condicionado.** Se comprobaron las
variables disponibles relacionadas con Supabase/Auth smoke/H4BA, archivos .env de prueba,
configuración local Supabase, herramientas conectadas disponibles y referencias del proyecto.
No se encontró proyecto aislado con autorización ni credenciales de una cuenta de test real.
Existe public/supabase-config.js, pero una configuración pública no demuestra que sea un
entorno aislado autorizado; no se utilizó ni se expusieron sus valores. Los JWT sintéticos
del arnés H4 no sustituyen una cuenta GoTrue. No se creó ni modificó ningún proyecto. No se utilizaron cuentas de producción ni se
hicieron solicitudes remotas de Auth.

No se sirvieron artefactos con esa configuración ni se ejecutaron login/logout, restauración
de sesión, refresh, Japanese 1500 o sync legacy contra Supabase real. La conservación de
Guest y cero escrituras custom siguen respaldadas por las pruebas locales controladas de §14,
no por una prueba nueva de Auth real. Safari/móviles físicos también continúan pendientes.
La aceptación funcional Chrome del propietario permanece registrada, sin ampliar su alcance.

Antes de editar este informe se comprobó que los **141 archivos** coincidían con todos los
hashes no autorreferentes del manifiesto, su lista y base HEAD; los **33 renombres R100**
estaban preservados en el índice y el workflow activo conservaba su hash. Esta actualización
solo modifica el informe vigente y su SHA-256 en el manifiesto de A; se conserva el manifiesto
previo en .cache/auth-prepush/. No se cambia el conjunto de 141 archivos ni el índice.
Comprobaciones y resultados sin credenciales: .cache/auth-prepush/.

### Decisión explícita pendiente del propietario

- **Esperar:** aportar un proyecto Supabase aislado y una cuenta de prueba con autorización
  expresa; ejecutar el smoke de §14 antes de autorizar commit/push de A.
- **Aceptar el riesgo pendiente:** decidir expresamente publicar A sin ese smoke, reconociendo
  que los cambios Auth de 2B se desplegarán con A aunque custom continúe desactivado. Existe
  riesgo no validado de login/logout/restauración/refresh, integración legacy y alternancia
  Guest/cuenta frente al servicio real. No se interpreta el GO técnico ni la aceptación de
  Chrome Guest como aceptación de este riesgo.

Texto preparado, **no aprobado ni emitido en nombre del propietario**:

> Acepto publicar el commit A con la comprobación de Supabase Auth real pendiente y el riesgo
> descrito de sus cambios de autenticación. Autorizo crear A usando la lista revisada de 141
> archivos y hacer su push a main, que dispara Pages con custom desactivado. Esta autorización
> no incluye B, activación cloud, SQL ni promoción del candidato.

Solo después de recibir esa autorización explícita (o cerrar el smoke y recibir igualmente
la autorización de A/push), ejecutar desde la raíz, tras revalidar manifiesto y diff:

~~~powershell
git add --pathspec-from-file=release/manga-guest-commit-a-paths.txt
git diff --cached --name-status
git diff --cached --check
git diff --cached -- .github/workflows/deploy-pages.yml
# Cotejar manifiesto; el último diff debe estar vacío. Detenerse ante diferencias.
git commit -F release/manga-guest-preparation-commit.txt
git push origin main
~~~

Registrar el SHA nuevo y comprobar Actions y la web con custom apagado. B requiere otra
aprobación independiente. **En este encargo no se ejecutan esos comandos, commits, push,
despliegue, SQL ni cambios de gates.** No se crean informes nuevos ni se alteran fuentes.
