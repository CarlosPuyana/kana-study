# REPO-HYGIENE-1 — Organización y preservación

Fecha: 26/10/2026. Organización documental, sin autorización de publicación.

## Situación inicial e inventario

HEAD: 09793158fbdfa52b7ecf20d135f1e7c3cc42a789. Se registraron status completo, diff binario y hashes antes de mover
archivos en .cache/hygiene1/. Había cambios anteriores de RELEASE-1/2A/2B/2C/3 sin commit,
conservados; no se reinició ningún hito. Se leyeron los cinco informes RELEASE y su checklist.

El inventario recorre el proyecto, experimentos y outputs locales: **144817 archivos**,
**9284863771 bytes** (sin .git ni node_modules; .cache/hygiene1 se excluye para no
inventariarse a sí mismo). Incluye **246 Markdown y 1094 logs**: 59 Markdown de proyecto
y 39 logs fuera de outputs, más copias históricas de builds/perfiles/herramientas ignoradas.

Se listaron además los Markdown/logs de dependencias por separado: **497 Markdown y cero
logs**. Total encontrado incluyendo dependencias: **743 Markdown y 1094 logs**, sin contar
archivos nuevos creados por esta tarea. No son 743 documentos mantenidos por el proyecto.
No se cambian dependencias ni .git. Inventario principal: inventory-before.json; listado
complementario: dependency-docs-logs.json, ambos bajo .cache/hygiene1/.

Clasificación principal de todos los archivos inventariados: 1553 versionados, 143218 ignorados
y 46 sin seguimiento. Solo Markdown/logs: tracked: 52; ignored: 1281; untracked: 7.
Fuera de outputs: tracked: 52; ignored: 39; untracked: 7. Las dependencias son ignoradas.
No había logs versionados que retirar del índice: los 39 de raíz ya estaban ignorados.

## Estructura y navegación

README enlaza visiblemente a [INDEX](INDEX.md). El índice permite consultar estado actual,
arquitectura, guías por módulo, experimentos, recursos, pruebas, evidencias e historia.

~~~text
docs/
  INDEX.md
  CONTRIBUTING-DOCS.md
  REPO_ORGANIZATION_REPORT.md
  repo-path-map.json
  architecture/
  features/ (manga/, decks/, grammar/, stats/, Daily/RUSH/UX)
  guides/
  history/ (manga-decks/, releases/)
release/  (operación de promoción y rollback, sin mover)
.cache/   (evidencias locales, ignoradas)
  archive/repo-root-logs/
  hygiene1/
~~~

Se trasladan **33 documentos y 39 logs**. Se usó git mv con rutas individuales para los
documentos versionados, por lo que sus renombres quedan staged; no se añadieron ni se
stagearon indiscriminadamente las modificaciones anteriores. El primer git mv falló por
permisos del sandbox al crear index.lock, antes de mover archivos. El mismo listado acotado
se ejecutó con autorización de la revisión automática, sin commit ni cambios destructivos.

## Rutas antiguas → nuevas

Todos los hashes iniciales/finales, clasificación Git, tamaños y tipo de movimiento están
en [repo-path-map.json](repo-path-map.json). Los logs continúan ignorados y presentes.

| Ruta original | Ruta final | Integridad de contenido |
| --- | --- | --- |
| PERSISTENCE.md | docs/architecture/PERSISTENCE.md | SHA-256 idéntico |
| NAVIGATION_UX.md | docs/architecture/NAVIGATION_UX.md | SHA-256 idéntico |
| LOCAL_MANGA.md | docs/features/manga/LOCAL_MANGA.md | SHA-256 idéntico |
| MANGA_READER.md | docs/features/manga/MANGA_READER.md | SHA-256 idéntico |
| MANGA_FSRS.md | docs/features/manga/MANGA_FSRS.md | SHA-256 idéntico |
| MANGA_GRAMMAR.md | docs/features/manga/MANGA_GRAMMAR.md | SHA-256 idéntico |
| MANGA_STUDY_INTEGRATION.md | docs/features/manga/MANGA_STUDY_INTEGRATION.md | SHA-256 idéntico |
| DECK_SCHEDULER.md | docs/features/decks/DECK_SCHEDULER.md | SHA-256 idéntico |
| TEMARIO.md | docs/features/grammar/TEMARIO.md | SHA-256 idéntico |
| STATS_V2.md | docs/features/stats/STATS_V2.md | SHA-256 idéntico |
| DAILY_STUDY_V2.md | docs/features/DAILY_STUDY_V2.md | SHA-256 idéntico |
| RUSH.md | docs/features/RUSH.md | SHA-256 idéntico |
| UX_FEEDBACK_V1.md | docs/features/UX_FEEDBACK_V1.md | SHA-256 idéntico |
| MANGA_DECKS_DICTIONARY_UX_FIX.md | docs/history/manga-decks/MANGA_DECKS_DICTIONARY_UX_FIX.md | Solo destinos de enlaces locales |
| MANGA_DECKS_H1.md | docs/history/manga-decks/MANGA_DECKS_H1.md | SHA-256 idéntico |
| MANGA_DECKS_H2A.md | docs/history/manga-decks/MANGA_DECKS_H2A.md | SHA-256 idéntico |
| MANGA_DECKS_H2A1.md | docs/history/manga-decks/MANGA_DECKS_H2A1.md | SHA-256 idéntico |
| MANGA_DECKS_H2A2.md | docs/history/manga-decks/MANGA_DECKS_H2A2.md | SHA-256 idéntico |
| MANGA_DECKS_H2BA.md | docs/history/manga-decks/MANGA_DECKS_H2BA.md | SHA-256 idéntico |
| MANGA_DECKS_H2BUX1.md | docs/history/manga-decks/MANGA_DECKS_H2BUX1.md | Solo destinos de enlaces locales |
| MANGA_DECKS_H2BUX11.md | docs/history/manga-decks/MANGA_DECKS_H2BUX11.md | Solo destinos de enlaces locales |
| MANGA_DECKS_H2BUX2.md | docs/history/manga-decks/MANGA_DECKS_H2BUX2.md | SHA-256 idéntico |
| MANGA_DECKS_H3A.md | docs/history/manga-decks/MANGA_DECKS_H3A.md | SHA-256 idéntico |
| MANGA_DECKS_H3BA.md | docs/history/manga-decks/MANGA_DECKS_H3BA.md | SHA-256 idéntico |
| MANGA_DECKS_H3BB0.md | docs/history/manga-decks/MANGA_DECKS_H3BB0.md | SHA-256 idéntico |
| MANGA_DECKS_H3BB1.md | docs/history/manga-decks/MANGA_DECKS_H3BB1.md | SHA-256 idéntico |
| MANGA_DECKS_H4A.md | docs/history/manga-decks/MANGA_DECKS_H4A.md | SHA-256 idéntico |
| MANGA_DECKS_H4A1.md | docs/history/manga-decks/MANGA_DECKS_H4A1.md | SHA-256 idéntico |
| MANGA_DECKS_H4BA.md | docs/history/manga-decks/MANGA_DECKS_H4BA.md | SHA-256 idéntico |
| MANGA_DECKS_H4BB.md | docs/history/manga-decks/MANGA_DECKS_H4BB.md | SHA-256 idéntico |
| MANGA_DECKS_H4BC.md | docs/history/manga-decks/MANGA_DECKS_H4BC.md | SHA-256 idéntico |
| MANGA_DECKS_H4BD1.md | docs/history/manga-decks/MANGA_DECKS_H4BD1.md | SHA-256 idéntico |
| MANGA_DECKS_H4BD2.md | docs/history/manga-decks/MANGA_DECKS_H4BD2.md | SHA-256 idéntico |
| grammar-related-tests.log | .cache/archive/repo-root-logs/grammar-related-tests.log | SHA-256 idéntico |
| grammar-roadmap-build.log | .cache/archive/repo-root-logs/grammar-roadmap-build.log | SHA-256 idéntico |
| grammar-roadmap-preview.log | .cache/archive/repo-root-logs/grammar-roadmap-preview.log | SHA-256 idéntico |
| grammar-roadmap-tests.log | .cache/archive/repo-root-logs/grammar-roadmap-tests.log | SHA-256 idéntico |
| grammar-topic02-build.log | .cache/archive/repo-root-logs/grammar-topic02-build.log | SHA-256 idéntico |
| grammar-topic02-tests.log | .cache/archive/repo-root-logs/grammar-topic02-tests.log | SHA-256 idéntico |
| grammar-topic02-validation.log | .cache/archive/repo-root-logs/grammar-topic02-validation.log | SHA-256 idéntico |
| grammar-topic03-build.log | .cache/archive/repo-root-logs/grammar-topic03-build.log | SHA-256 idéntico |
| grammar-topic03-tests.log | .cache/archive/repo-root-logs/grammar-topic03-tests.log | SHA-256 idéntico |
| grammar-topic04-before.log | .cache/archive/repo-root-logs/grammar-topic04-before.log | SHA-256 idéntico |
| grammar-topic04-build.log | .cache/archive/repo-root-logs/grammar-topic04-build.log | SHA-256 idéntico |
| grammar-topic04-final-tests.log | .cache/archive/repo-root-logs/grammar-topic04-final-tests.log | SHA-256 idéntico |
| grammar-topic04-tests.log | .cache/archive/repo-root-logs/grammar-topic04-tests.log | SHA-256 idéntico |
| grammar-topic05-before.log | .cache/archive/repo-root-logs/grammar-topic05-before.log | SHA-256 idéntico |
| grammar-topic05-build.log | .cache/archive/repo-root-logs/grammar-topic05-build.log | SHA-256 idéntico |
| grammar-topic05-tests.log | .cache/archive/repo-root-logs/grammar-topic05-tests.log | SHA-256 idéntico |
| grammar-topic05-weakness.log | .cache/archive/repo-root-logs/grammar-topic05-weakness.log | SHA-256 idéntico |
| grammar-topic06-before.log | .cache/archive/repo-root-logs/grammar-topic06-before.log | SHA-256 idéntico |
| grammar-topic06-build.log | .cache/archive/repo-root-logs/grammar-topic06-build.log | SHA-256 idéntico |
| grammar-topic06-tests.log | .cache/archive/repo-root-logs/grammar-topic06-tests.log | SHA-256 idéntico |
| grammar-topic07-before.log | .cache/archive/repo-root-logs/grammar-topic07-before.log | SHA-256 idéntico |
| grammar-topic07-build.log | .cache/archive/repo-root-logs/grammar-topic07-build.log | SHA-256 idéntico |
| grammar-topic07-tests.log | .cache/archive/repo-root-logs/grammar-topic07-tests.log | SHA-256 idéntico |
| grammar-topic08-before.log | .cache/archive/repo-root-logs/grammar-topic08-before.log | SHA-256 idéntico |
| grammar-topic08-build.log | .cache/archive/repo-root-logs/grammar-topic08-build.log | SHA-256 idéntico |
| grammar-topic08-tests.log | .cache/archive/repo-root-logs/grammar-topic08-tests.log | SHA-256 idéntico |
| grammar-topic09-before.log | .cache/archive/repo-root-logs/grammar-topic09-before.log | SHA-256 idéntico |
| grammar-topic09-build.log | .cache/archive/repo-root-logs/grammar-topic09-build.log | SHA-256 idéntico |
| grammar-topic09-tests.log | .cache/archive/repo-root-logs/grammar-topic09-tests.log | SHA-256 idéntico |
| grammar-topic10-before.log | .cache/archive/repo-root-logs/grammar-topic10-before.log | SHA-256 idéntico |
| grammar-topic10-build.log | .cache/archive/repo-root-logs/grammar-topic10-build.log | SHA-256 idéntico |
| grammar-topic10-tests.log | .cache/archive/repo-root-logs/grammar-topic10-tests.log | SHA-256 idéntico |
| grammar-topic11-before.log | .cache/archive/repo-root-logs/grammar-topic11-before.log | SHA-256 idéntico |
| grammar-topic11-build.log | .cache/archive/repo-root-logs/grammar-topic11-build.log | SHA-256 idéntico |
| grammar-topic11-tests.log | .cache/archive/repo-root-logs/grammar-topic11-tests.log | SHA-256 idéntico |
| grammar-v2-build.log | .cache/archive/repo-root-logs/grammar-v2-build.log | SHA-256 idéntico |
| grammar-v2-tests.log | .cache/archive/repo-root-logs/grammar-v2-tests.log | SHA-256 idéntico |
| qa-two-fixes-build.log | .cache/archive/repo-root-logs/qa-two-fixes-build.log | SHA-256 idéntico |
| qa-two-fixes-tests.log | .cache/archive/repo-root-logs/qa-two-fixes-tests.log | SHA-256 idéntico |

## Vigente frente a histórico

Architecture/features describen sistemas vigentes, con sus límites; el índice indica qué
leer antes de modificar cada uno. DESIGN sigue siendo acumulativo: usar su sección reciente
y RELEASE-3 para el estado público. [Historia Manga × Mazos](history/manga-decks/INDEX.md)
explica alcance, resultado declarado, complementos y bloqueos de los veinte informes.
[Historia de releases](history/releases/INDEX.md) distingue NO-GO inicial, C1/C2 resueltos,
candidato y GO solo de preparación. No se convierten resultados antiguos en nuevas pruebas.

Los veinte informes históricos se conservaron; tres necesitaron únicamente ajustar destinos
de enlaces a capturas por su nueva profundidad. Ninguna cifra, decisión o comando de esos
informes se reescribió. Los comandos de todos los documentos se ejecutan desde la raíz.
Las menciones literales antiguas (backticks/texto/bloques de código) son parte del registro:
se localizan por el manifiesto; no son enlaces navegables rotos ni rutas consumidas por tooling.

## Duplicados y volumen local

Se encontraron **75 grupos de Markdown/logs con SHA-256 idéntico en el inventario principal, sin dependencias**, principalmente copias
de informes dentro de reconstrucciones .cache y salidas repetidas de build. Se conserva la
lista íntegra en inventory-before.json. En fuentes mantenidas hay un par literal:

- scripts/vocabulary-audio-license.md
- public/audio/vocabulary/n5/PROVENANCE.md

Es una copia intencionada de licencia/proveniencia: generate-vocabulary-audio.py la publica
y export-vocabulary-audio.py conserva la atribución. No se consolida ni borra. Una futura
limpieza de snapshots/logs requerirá aprobación específica y retención de evidencias R3.
.cache ocupa 7982600980 bytes y experiments 1141971445 bytes en este inventario sin
node_modules; .cache contiene perfiles, runtimes y reconstrucciones. No se promete reducción
de disco: esta tarea organiza, no elimina evidencias.

## Archivos no movidos y motivos

- README y AGENTS permanecen en raíz como entradas y reglas del proyecto.
- DESIGN y MANUAL_TESTING permanecen por referencias operativas y documentación acumulada.
- Los cinco RELEASE, release/, scripts de promoción/rollback, baseline y manifiestos anteriores
  mantienen contenido/rutas. Sus hashes son evidencia histórica, no se recalculan tras higiene.
- SUPABASE_SETUP permanece en raíz por sus comandos y referencias; solo se actualizan enlaces
  Markdown que apuntaban a los documentos movidos. No se modifica SQL ni sincronización.
- GRAMMAR_AUDIT permanece por la referencia de grammar-n5-audit.mjs y su alcance histórico/técnico
  mixto; se enlaza desde la guía de Grammar, sin convertirlo en instrucciones nuevas.
- Licencias, proveniencia, datos, experimentos, worker y documentos de scripts permanecen junto
  a sus consumidores. El README experimental actualiza sus tres enlaces a H2A.
- Tres parches Grammar ignorados permanecen en raíz: son evidencia histórica, no salidas
  de scripts activos inspeccionados; no se aplican ni se consolidan. El índice/manifiesto local
  registra su ubicación. palabras.json es un recurso de datos, no se presume basura por tamaño.
- .cache/release3-* y sus dependencias release2c*, perfiles, CBZ y reconstrucción pública no
  se mueven ni borran. test-results/playwright-report/dist/.angular ya tienen destinos propios.

## Ignores y generadores

Se inspeccionaron .gitignore y .git/info/exclude. **No se cambió ninguna regla**: .cache,
dist, .angular, coverage, node_modules, test-results y playwright-report ya estaban ignorados;
la regla *.log también era previa. No se añaden ignores generales de Markdown/JSON/logs.
Los logs movidos quedan además cubiertos por /.cache. No se retira ningún log del índice.

Se inspeccionaron scripts, e2e, package.json, configuración y workflow. Los productores actuales
guardan capturas/JSON/perfiles/CBZ bajo .cache o test-results; generan builds/stats en dist.
Los 39 logs de raíz proceden de redirecciones históricas, no de un script fuente que haya que
reprogramar. No se cambia semántica de tests para mover stdout. La guía de desarrollo propone
un subdirectorio nuevo y preserva el exit code al redirigir.

## Validaciones y preservación

| Comprobación nueva de higiene | Resultado / evidencia |
| --- | --- |
| Auditoría documental | 65 Markdown, 118 enlaces locales; todos alcanzables desde README; cero rotos y cero destinos antiguos; doc-audit.json |
| Integridad documental | 30 documentos movidos byte a byte; tres con solo destinos de enlaces ajustados; comprobación textual adicional de los 58 Markdown previos distintos de README |
| Logs movidos | 39/39 SHA-256 idénticos, ignorados; ningún log retirado del índice |
| Referencias antiguas | 107 menciones de basename/etiqueta en Markdown, cero en código/tooling; old-name-references.json |
| Parche de promoción y reversión | PASS en copia ignorada; workflow activo idéntico; promotion-roundtrip.log |
| Presupuesto estricto | 749999 aceptado; 750000 y 750001 rechazados; budget-boundary.log |
| Sintaxis del nuevo auditor | node --check correcto; auditor ejecutado sobre rutas, hashes y contenido reales |
| Suite Angular | **2087/2087**, 202 archivos, 16,92 s de runner; angular-verified.log |
| TypeScript app/spec | Ambos exit 0; ts-app.log y ts-spec.log |
| Build normal Pages | Correcto; 747917 bytes, fronteras lazy verificadas; build-normal.log, boundaries.log |
| Build candidato | Correcto; **748760 bytes**, margen 1240, máximo exclusivo; build-candidate.log |
| Gates y producto | Providers, main, workflow, fuentes, SQL, FSRS y contratos idénticos al inventario; doc-audit.json |
| Diff y whitespace | git diff --check y git diff --cached --check correctos; final-checks.json |
| Inventario final | inventory-after.json y preservation.json comparan originales con sus destinos y hashes |

Todos estos logs están bajo .cache/hygiene1/, salvo la metadata del bundle que el verificador
existente continúa escribiendo en .cache/release2c-bundle.json. Las validaciones pesadas se
hicieron en serie, sin otros builds o pruebas simultáneos. Los cuatro warnings SCSS conocidos
de Grammar permanecen; no se cambia su presupuesto ni se afirma que desaparecieron.

La primera pasada npm test dentro del sandbox compiló pero terminó con 202 suites sin tests
por **EPERM al renombrar temporales del cliente de Vitest**. Se conserva angular.log como fallo
de infraestructura, no como ejecución de tests ni regresión del producto. La pasada autorizada
fuera del sandbox ejecutó los 2087 tests sin cambiar la suite ni añadir retries/timeouts.
No se repitió Playwright ni SQL: no cambió la aplicación, las pruebas o sus contratos; los
42 casos del informe R3 continúan siendo evidencia histórica, no una ejecución de esta tarea.
No se modificó ninguna ruta de compilación; aun así se repitieron ambos builds y TypeScript.


El verificador nuevo scripts/audit-repo-docs.mjs comprueba enlaces locales y destinos de
movimientos; con inventario local verifica también HEAD, integridad de fuentes y existencia
de cada original en su destino. Guarda resultados en .cache/hygiene1/doc-audit.json.
No se usa la mera detección de renombres de Git como prueba de igualdad.

## Comparación final del inventario

El inventario final, con las mismas exclusiones, contiene **144841 archivos**, 252 Markdown
(65 mantenidos por el proyecto) y 1094 logs; no queda ningún log en raíz. Hay seis Markdown
nuevos, un manifiesto y un auditor nuevos; los otros archivos nuevos del recorrido son copias
ignoradas creadas por los checks de parches/presupuesto. **Ninguno de los 144817 archivos
originales falta al resolver los movimientos. Los 1094 logs y las 94 capturas PNG originales
conservan exactamente su SHA-256.**

Seis documentos anteriores cambian contenido: README añade el acceso al índice; cinco solo
ajustan destinos de enlaces (tres históricos, README experimental y SUPABASE_SETUP). Los otros
30 documentos movidos son idénticos. Todos los originales sin seguimiento siguen presentes.
Las fuentes y los entregables operativos de RELEASE-3 conservan sus hashes.

Cuatro resultados regenerables cambian al ejecutar las validaciones solicitadas: el resultado
Vitest en .angular, .cache/release2a-performance.json y los dos browser-stats.json de dist.
No son logs eliminados ni cambios del producto. El inventario registra los hashes previos y
finales; no se sustituyen cifras históricas en los informes por mediciones de esta ejecución.
Todos los demás archivos con hash registrado permanecen iguales, salvo los enlaces descritos.
El HEAD permanece fijo. Los 33 renombres documentales quedan staged por git mv; los tres
ajustes de enlaces en documentos movidos y los demás cambios documentales quedan en el
working tree para revisión. No se ha stageado código anterior ni aplicado los parches al
workflow activo. Revisar tanto git diff como git diff --cached antes de cualquier futuro commit.

## Riesgos y pendientes

La evidencia ignorada no se distribuye con un clone: los enlaces históricos a .cache requieren
las evidencias locales. No se presenta ausencia en otro equipo como prueba de que existan
allí. Los nombres antiguos en texto histórico permanecen intencionadamente; buscar por basename
en el índice/manifiesto. El informe y los índices no sustituyen aceptación humana o QA físico.
Persisten las limitaciones de RELEASE-3 (Auth real, dispositivos, aprobación), UX2 bloqueado
y validación lingüística independiente pendiente. No se abre otro hito ni se publica.

Para conservar el orden: seguir [CONTRIBUTING-DOCS](CONTRIBUTING-DOCS.md), actualizar una
referencia vigente en cambios pequeños y crear historia solo cuando aporte un registro útil.
Conservar todos los outputs de esta aceptación hasta que el propietario autorice su retención/limpieza.

Sin commit, push, despliegue, SQL, nuevos gates, dependencias ni cambios del producto.
