# RELEASE-MANGA-1 — Auditoría previa al lanzamiento local-first

Auditoría y pruebas: 2026-10-24. Informe finalizado: 2026-10-25.

**Decisión: NO-GO para activar Manga × Mazos públicamente.** La creación y el estudio
local tienen evidencia funcional favorable, pero falta una copia de seguridad de
usuario restaurable y la experiencia Guest/login/sincronización puede hacer creer que
las tarjetas se perdieron o están protegidas en la nube. Los tests verdes no cierran
estos riesgos. RELEASE-MANGA-1 queda completado como diagnóstico; RELEASE-MANGA-2 no
se inicia ni se aplica su propuesta.

## 1. Estado del código actual

Rama `main`, HEAD `0979315` (`feat(manga): add vocabulary decks, FSRS study and OCR integration`).
El árbol estaba limpio al comenzar: los cambios de los hitos anteriores ya estaban
incorporados a ese commit. Al reanudar se comprobaron de nuevo status, HEAD, diff y
logs. No se hizo fetch, reset, clean, checkout, commit ni push. Se audita el código
local, no el despliegue remoto ni las variables de GitHub.

Se revisaron DESIGN, H2B-A, H3A, H3B-A/B0/B1, H4B-D1/D2, H2B-UX1/UX1.1/UX2, la
corrección del diccionario, SUPABASE_SETUP y su implementación actual. Los informes
históricos describen estados sucesivos: D2 posterior sustituye las limitaciones de
integración de D1. UX2 sigue incompleto: no hay traducción persistente del ejemplo en
tarjetas. No se amplía ese hito aquí.

Los cuatro gates de producción permanecen false. Los únicos cambios existentes son
de pruebas y herramientas de auditoría; no se ha modificado la aplicación productiva.

## 2. Arquitectura propuesta para la V1 pública

Mantener `src/main.ts` → `appConfig`, hash routing y features lazy. Tras resolver los
bloqueos, incorporar un provider estático y explícito a la entrada normal. Propuesta
ilustrativa, **no implementada ni importada**:

```ts
// Futuro productionMangaLocalProviders(), añadido deliberadamente a appConfig.
{provide: CUSTOM_DECKS_ENABLED, useFactory: () => signal(true).asReadonly()},
{provide: MANGA_DECK_ASSISTED_ENABLED, useFactory: () => signal(true).asReadonly()},
{provide: CUSTOM_DECK_SYNC_ENABLED, useFactory: () => signal(false).asReadonly()},
{provide: CUSTOM_REMOTE_UPLOAD_APPROVED, useValue: false},
```

No hace falta otro entrypoint/configuración Angular si se añade ese provider a la
configuración normal. Un build aislado de ensayo sería opcional. No publicar
`manga-manual`, forzar Guest ni sustituir el cliente legacy por el stub manual en
Pages. No introducir activación mediante URL, localStorage, preferencias o controles
cloud. El inspector de desarrollo usado por fixtures no existe en el build optimizado;
los gates de features no deben confundirse con una frontera de seguridad ante alguien
que modifica el JavaScript de su propio navegador.

### Auditoría de gates y entradas remotas

| Gate | Ahora | Objetivo futuro |
| --- | --- | --- |
| CUSTOM_DECKS_ENABLED | false | true |
| MANGA_DECK_ASSISTED_ENABLED | false | true |
| CUSTOM_DECK_SYNC_ENABLED | false | false |
| CUSTOM_REMOTE_UPLOAD_APPROVED | false | false |

Se inspeccionaron las entradas del transporte, además de observar peticiones:

- `DeckPersistenceRouter.bind` dirige `md-*` a CustomDeckRepository y mantiene el
  builtin en DeckDatabaseService. El repositorio custom no inyecta SyncService,
  outbox legacy ni transporte; sus reviews no se convierten en upserts legacy.
- Construir DeckCatalog no inicia red. Su getter customSync es explícito; las páginas
  de Mazos no programan sincronización custom.
- `CustomDeckSyncAdapter.run` devuelve false con sync apagado antes de receipt/apply/
  changes/bundle. Su inspección remota también exige el gate.
- `CustomTransferCoordinator.capture` exige sync, principal, workspace y epoch antes
  del trabajo remoto. Guest import/archivo reutilizan esa guarda; resolución y
  recuperación también comprueban sus guardas antes de consultar.
- Perfil/Auth ocultan herramientas cloud con sync=false; el panel exige además los
  gates UI. Consentir no activa esos gates.
- `SupabaseCustomDeckTransport.apply/transferApply` exigen uploadApproved. **Las lecturas
  directas del transporte no comprueban sync**, sino la sesión/owner: confían en los
  callers. El test preexistente de sesión llama a changes directamente. Por tanto no
  se afirma que toda llamada programática al transporte sea imposible con sync=false;
  los flujos públicos locales sí están cercados y no lo invocan. Una guarda central
  adicional sería defensa en profundidad, sin cambiar ahora el contrato cloud.

El test nuevo invoca expresamente syncNow/start con ambos gates cloud false y verifica
cero llamadas a los métodos remotos observados, también en un workspace de cuenta
sintética. Los navegadores registran intentos y abortan tráfico externo preventivamente:
en las pasadas correctas hubo cero intentos externos/POST. El sistema legacy puede
seguir sincronizando una cuenta configurada; desactivar custom no desactiva legacy.

## 3. Guest y autenticados

| Situación | Comportamiento comprobado / riesgo |
| --- | --- |
| Navegador limpio sin cuenta configurada | Guest, sin mazos custom; Japanese 1500 disponible |
| Crear/estudiar Guest con gates UI de prueba | Tarjetas, recibos y FSRS locales, sin cloud custom |
| Login con solo tarjetas custom Guest y sync=false | **Hueco de lanzamiento reproducido:** customAllowed exige custom&&manga&&sync; hasCustomGuestData devuelve false. Sin otro progreso legacy, hasGuestData también devuelve false. Auth activa user:A sin decisión ni explicación custom |
| Login con progreso legacy Guest | Puede aparecer decisión legacy. Su merge copia almacenes legacy/guardados Manga, no los mazos custom con sync=false; no debe prometer importación integral |
| Crear desde user:A con cloud custom apagado | Se permite localmente; user:B y Guest no ven sus datos |
| Logout | Activa Guest; sus tarjetas reaparecen intactas. Los datos user:A permanecen en su partición local |
| Recarga | Persistencia conservada; la partición depende de Workspace/Auth. No se ha cualificado el ciclo real GoTrue/session restore |

La prueba usa SIGNED_IN simulado con AuthService real y un cliente controlado sin red:
no es prueba de Supabase Auth, gateway, JWT ni cuenta privada. Demuestra ocultación
sin borrado, aislamiento y retorno Guest. No se importan tarjetas automáticamente.

Perfil muestra `sync.status()`/lastSyncedAt del SyncService legacy, separado del adapter
custom. La etiqueta general «Sincronizado» puede interpretarse como protección de los
mazos locales; falta una explicación persistente local-only en ese recorrido.

Cambio mínimo futuro: detectar Guest custom sin depender de cloud, explicar ámbitos y
mantener Guest intacto. Permitir entrar sin copiar sus mazos y explicar cómo volver.
Si se conserva merge legacy, nombrar lo incluido/excluido. No conectar V2 experimental
para resolver esta UX ni improvisar una transferencia local entre propietarios.

Mensajes propuestos (implementar ES/EN/CA en RELEASE-MANGA-2):

- «Estos mazos y su progreso se guardan solo en este navegador y perfil. No se sincronizan con tu cuenta.»
- «Al entrar verás los mazos locales de esta cuenta. Tus mazos de Invitado se conservan; cierra sesión para volver a ellos.»
- «La sincronización de tu cuenta no incluye estos mazos locales.»
- «Borrar los datos del sitio, usar otro navegador o perder este dispositivo puede eliminar tus tarjetas. Guarda una copia de seguridad.»

Un aviso no sustituye una copia restaurable. No anunciar un botón de backup hasta
que exista y se haya demostrado su restauración.

## 4. Funcionalidades candidatas a habilitar

Condicionadas a cerrar los requisitos críticos; esta tabla no activa funciones.

| Funcionalidad local | Evidencia / límites |
| --- | --- |
| Diccionario informativo y Más significados | JS público optimizado, 大丈夫 real del ZIP, lectura/glosas visibles, sin formulario automático |
| Añadir a Mazos secundario y panel compacto | Playwright de desarrollo: elección humana y guardado real, no al consultar |
| Lectura, significado, contexto y página | Lookup y recibos reales; no identidad por coincidencia superficial |
| Catálogo/tarjetas/estadísticas/configuración | H1 y servicios reales; Japanese 1500 conserva contenido/IDs |
| Repaso Again/Good y undo | Scheduler existente, snapshots propios, anulaciones conservadas; misma restricción UI al completar el día |
| Vocabulario confirmado por volumen | Lectura validada/readonly, sin porcentaje de comprensión |
| Explorador OCR y navegación | Coincidencias textuales, línea validada y rango UTF-16; sin coordenadas ficticias por carácter |
| Borrar Manga conservando mazo | Regresión de estudio/contexto después del borrado; no garantiza recuperar la imagen ni unir reimportaciones |
| Recarga y reinicio de navegador | Once stores custom exactos conservados en perfil sintético de desarrollo; prueba pública separada mantiene diccionario/datos del volumen |

Local-first significa que estudio/escrituras custom no necesitan Supabase. No equivale
a arranque PWA garantizado sin red: no hay service worker configurado. Cargar inicialmente
Pages y sus chunks/assets requiere conectividad o caché; no se certificó arranque frío
en modo avión. El catálogo Manga puede necesitar assets del mismo origen.

## 5. Funcionalidades que deben seguir bloqueadas

| Funcionalidad | Motivo |
| --- | --- |
| Gates UI en Pages, por ahora | Requisitos críticos sin cerrar |
| Sync custom, subida, Guest V2, resolución/archivo remoto | Fuera de V1 local; Auth/gateway reales, retención/purga y operación cloud pendientes |
| Traducción persistente/editable de ejemplos | UX2 bloqueado por compatibilidad local/V1/V2; no anunciar como disponible |
| Generación automática y cobertura/identidad lingüística certificada | Falta evidencia independiente; OCR literal no es análisis léxico |
| Unión por escritura/título/reimportación | No demuestra identidad ni procedencia |
| Backup prometido mediante archivos cloud experimentales | No es copia local integral restaurable ni cubre datos nunca enviados |
| Gestión pública nueva archive/delete/restore | Lifecycle es una API interna, no una UI local completa que pueda anunciarse al activar gates |

La traducción general del Contexto Manga es una función anterior opcional, con acción
explícita y red. No guarda una traducción del ejemplo en una tarjeta. La glosa española
no es una traducción del ejemplo. No se amplía UX2 ni se certifican ejemplos generados.

## 6. Copias de seguridad y restauración

**No existe export/import de usuario suficiente para backup integral custom ni una
restauración local verificada. Es un bloqueo crítico.** Se buscaron UI, servicios y
métodos en Settings, Mazos, Manga y herramientas custom. Settings ofrece reset Kana,
no exportación. Importar Manga/JMdict no restaura tarjetas ni FSRS custom.

`guestInventory()` es captura interna readonly para transferencias, no un formato de
backup ni restaurador. El archivo remoto requiere owner/consentimiento/protocolo y
no sustituye una copia local. Los once stores de DB v3 son:

| Stores | Datos que deben conservarse | Backup/restore de usuario |
| --- | --- | --- |
| decks, cards | Contenido, lectura, glosas, contexto, configuración, orden/count/estado | No disponible |
| progress | Snapshot FSRS completo y head | No disponible |
| events | Eventos raw, canonical/voidedBy y anulaciones, no solo eventos efectivos | No disponible |
| daily | Límites, introducciones, completedAt | No disponible |
| identities, registry-meta | Identidad permanente y namespace | No disponible |
| confirmations, volume-links | Recibos originales, binding/procedencia y vínculos | No disponible |
| journal | Peticiones originales, contexto y localRevision | No disponible |
| reconciliation | Evidencia/checkpoints retenidos | No disponible |

Guest inventory no exporta otros propietarios. Imágenes/OCR del volumen están en otra
base; no afirmar que forman parte de este inventario.

Propuesta concreta de backup local versionado:

1. Envelope de producto/versión/esquema/ámbito original, fecha, inventario cerrado y
   hashes de bytes. Preservar IDs, timestamps, request strings y números FSRS. Hash
   comprueba integridad, no autenticidad ni cifrado.
2. Captura consistente por workspace de todos los stores, incluyendo eventos anulados.
   No usar solo getDeckReviewEvents, que filtra historia. No migrar/reparar ni ejecutar
   scheduler al exportar. Excluir tokens, cookies, diccionarios e imágenes salvo alcance separado.
3. Importación no confiable: límites medidos de bytes UTF-8/filas/profundidad/versiones,
   validación de identidad/recibos/referencias/head/eventos, Unicode escapado y prototipo.
   Rechazar exceso explícitamente o usar partes verificables; nunca truncar la historia.
4. Preview de ámbito/contenido y confirmación explícita. Inicialmente restaurar a destino
   vacío compatible; rechazar owners/namespaces incompatibles o conflictos sin sobrescribir.
   No reasignar silenciosamente recibos Guest firmados a otra cuenta.
5. Publicación atómica local, con fence de owner/epoch y CAS del destino. Cuota/cierre/fallo
   no deben dejar contenido parcial estudiable. No generar reviews ni nuevos kinds V1,
   no marcar cloud ACK ni subir el fichero.
6. Round-trip a perfil vacío, recarga, cierre/reinicio, estudio/undo y reimportación
   idempotente. Comparar snapshots, tiempos, eventos/voidedBy, settings, IDs, recibos y
   journal exactos. Probar archivo corrupto/truncado/incompatible, límites, cuota,
   cancelación, owner distinto y destino no vacío, conservando ambos lados ante rechazo.

Separar respaldo del estudio y respaldo del Manga. Un contexto textual debe sobrevivir
sin la imagen, indicando fuente ausente; nunca unir una reimportación por parecido.
El fichero contiene texto potencialmente privado: advertir al exportar y no enviarlo
ni incorporar glosas de usuario a un caché global.

## 7. Riesgos de pérdida y compatibilidad

| Escenario | Protección / riesgo actual |
| --- | --- |
| Borrar datos del sitio, perfil privado/eliminado, pérdida de dispositivo | Sin backup/restauración ni cloud custom, pérdida real posible |
| Cuota/evicción | Rollback/reintento con errores sintéticos probados; no equivale a disco físico lleno ni políticas iOS |
| Cambio de cuenta | Datos separados; ocultación puede parecer pérdida sin mensajes claros |
| Sincronización legacy | No protege journal custom; etiqueta general puede inducir a error |
| Actualización desde versión pública anterior | Bases legacy separadas; custom v3 añade stores faltantes. Registros históricos se migran desde evidencia/recibos verificados, no por texto |
| Parciales/corrupción | Conteos y validadores producen error; transacciones revierten, sin presentar un vacío utilizable o reparar destructivamente |
| Archivado/borrado | Catálogo solo active; vocabulario exige contenido y confirmación demostrables. APIs lifecycle internas no equivalen a UI completa de gestión/restore local |
| Borrar/reimportar Manga | Contexto/mazo conservados; nuevos IDs no se fusionan por título |
| Otro host, perfil o puerto local | Es otro ámbito de almacenamiento; iniciar sesión no transporta esos mazos |
| ES/EN/CA | UI traducida; JMdict distribuido es español, no inventa glosas CA/EN |

Las regresiones existentes cubren DB bloqueada, versionchange/cierre, VersionError,
rollback con journal, Unicode escapado, idempotencia y corrupción. Los registros
permanentes se validan contra evidencia histórica; no se recrean identidades por
coincidencia superficial. No se hizo una actualización del perfil real de una persona.

## 8. Build y UX en producción

Workflow: Ubuntu, Node 24.15.0, npm ci, npm test, tsc app/spec, build `/kana-study/`,
upload de `dist/kana-study/browser` y deploy. No omite tests. No ejecuta Playwright,
SQL ni estos scripts de auditoría: son verificaciones locales, no checks CI ya añadidos.

Entrada normal src/main.ts; manga-manual es configuración/entrada distinta. Build
auditado: **749.79 kB iniciales**, aproximadamente 0.21 kB de margen frente a 750 kB.
Angular configura warning=750 kB, pero error=1.5 MB: el workflow podría aceptar un
exceso con warning. El lanzamiento debe exigir ≤750 kB de forma efectiva, sin elevar
el presupuesto. No se ha medido todavía el provider/mensajes/backup futuros.

Grafo: localización y explorador fuera del cierre estático de main/Reader; Reader
sigue lazy. Estadísticas sin entrada/providers manuales ni tests de auditoría. Sin
dependencias nuevas. Cuatro warnings SCSS conocidos de Grammar, sin errores de build.

Se probó el JS optimizado de dist servido bajo /kana-study/ en loopback, **sin inspector
Angular**, con configuración Supabase neutral para no usar cuentas. No se sustituyó por
manga-manual. Tres escenarios ES oscuro 1280, EN claro 390, CA oscuro 320 verificaron
diccionario real/lecturas/glosas, Más significados, pestañas, responsive, recarga,
cierre/reapertura de Chromium, gates ocultos pese a URL/storage, rutas protegidas
(vocabulario cae en Home) y mazo desconocido sin estudio. Cero intentos externos/POST.

Los flujos custom están ocultos en ese artefacto por diseño. Sus recorridos funcionales
se probaron aparte en desarrollo normal con overrides de fixtures. **No se declara
validada una producción activada que todavía no existe**: el ensayo optimizado con
provider futuro es requisito de RELEASE-MANGA-2. El japonés/contexto y la glosa sí
existen; traducción persistente del ejemplo no.

Capturas revisadas visualmente: `.cache/release-public-es-dark.png`,
`release-public-en-light.png`, `release-public-ca-dark.png`. Se conserva el diccionario
informativo. No se simulan Safari/iOS/Android físicos ni Supabase Auth/gateway/CORS real.

El workflow referencia URL y publishable key públicas, no credenciales privadas de IA.
El escaneo local no encontró patrones de PEM privada, sb_secret o sk-proj reales.
No valida las variables remotas de GitHub, que no se consultaron. El lector de config
solo valida URL/longitud de key, no su rol: verificar que sea publishable/anon antes de
publicar. La URL pública preexistente del Worker no es una credencial ni se llama al consultar.

## 9. Bloqueos y requisitos mínimos

| ID | Clasificación | Criterio de cierre |
| --- | --- | --- |
| C1 | Crítico antes del lanzamiento | Backup local completo restaurado en perfil vacío con identidad, FSRS, undo, recibos y journal exactos |
| C2 | Crítico antes del lanzamiento | Detectar custom Guest sin cloud y explicar login/logout/merge legacy y estado local-only; sin importación automática |
| C3 | Crítico antes del lanzamiento | Provider normal explícito UI=true/true, cloud=false/false, solo en fase autorizada; validar artefacto activado y límite efectivo ≤750 kB |
| I1 | Importante pero no bloqueante para cerrar esta auditoría | QA Safari/iOS/Android físicos y almacenamiento; pendiente para respaldar compatibilidad anunciada |
| I2 | Importante pero no bloqueante | Escala/journal y memoria móvil; 1000 tarjetas por mazo no limita todo el workspace/historial |
| I3 | Importante pero no bloqueante | Mensajes de fuente ausente/reimportación, cuotas y gestión local, sin prometer restauración inexistente |
| I4 | Importante pero no bloqueante | Guardas centrales de lectura y validación de tipo de key; sin llamadas custom observadas desde los flujos locales |
| F1 | Futuro | Custom cloud: Auth/gateway autorizados, retención/purga y operación; gates false en V1 |
| F2 | Futuro | UX2 y extensión de persistencia compatible |
| F3 | Futuro | Análisis/generación/cobertura certificados y evidencia lingüística independiente |
| F4 | Futuro | PWA/arranque frío offline, transferencia local de propietario y backup de archivos Manga |

I1 no certifica compatibilidad ni autoriza omitir QA: debe ajustarse al alcance de
dispositivos anunciado. C1/C2 bastan para NO-GO; C3 es preparación deliberadamente
pendiente, no un defecto por obedecer que los gates sigan apagados.

## 10. Pruebas y resultados reales

| Validación | Resultado |
| --- | --- |
| Dirigidos: auditoría nueva, repositorio, migración/gates, adapter/transport y diccionario | 86/86, 6 archivos |
| Suite Angular completa | 2023/2023, 197 archivos |
| Playwright pertinente: H1, asistido/OCR, UX1.1/diccionario | 87/87, tres proyectos, 2.2 minutos, retries 0 |
| Build público optimizado en navegador | 3/3 escenarios ES/EN/CA con gates false, recarga y reinicio real |
| Reinicio real de Chromium con progreso custom | 11 stores exactos; 1 snapshot, 1 evento, 3 operaciones de journal, cero intentos remotos |
| TypeScript app/spec | Ambos correctos, exit 0, comprobados al reanudar el 25 |
| Build Pages | Correcto, 749.79 kB iniciales, cuatro warnings conocidos |
| Diff/whitespace | Correctos, exit 0; también comprobados los cuatro archivos nuevos. Solo aviso de conversión LF/CRLF de Git |

Los tests se ejecutaron el 24; al reanudar el 25 se recuperaron los logs y se revisaron
los artefactos. No se suman pasadas para inventar cobertura. La primera ejecución
ampliada de Playwright dio 85/87 por getComponent(null) antes del render en trackPanel.
Se corrigió solo el helper esperando el panel visible; la pasada final ejecutó 87/87.
No se cambiaron aserciones de persistencia, timers ni producción para ocultar el fallo.

La primera sonda de reinicio capturaba antes de completeSession y observaba después
una operación daily legítima. Se esperó end-state y saving=false, sin sleeps ni
reintentos de escritura. Las fixtures también ajustaron expectativas al título builtin
localizado, fallback Home y snapshot canónico, no a la propuesta preguardado.

Los cuatro tests nuevos demuestran creación/repaso/undo sin red custom, reapertura de
IndexedDB con datos exactos, aislamiento de cuenta y el hueco Guest/login. Este último
es diagnóstico del problema actual; en RELEASE-MANGA-2 deberá sustituirse por regresión
del comportamiento corregido acordado, no congelar una UX defectuosa.

Reproducción:

```text
npm test -- --include=src/app/core/services/manga-local-release-audit.spec.ts --include=src/app/core/services/custom-deck.repository.spec.ts --include=src/app/core/services/custom-guest-workspace-migration.spec.ts --include=src/app/core/services/custom-deck-sync-transport.spec.ts --include=src/app/core/services/custom-deck-sync-adapter.spec.ts --include=src/app/features/manga/manga-assistance.spec.ts
npm test
npx playwright test e2e/custom-decks-h1.spec.ts e2e/manga-decks-assisted.spec.ts e2e/manga-quick-add-ux11.spec.ts
npx tsc -p tsconfig.app.json --noEmit
npx tsc -p tsconfig.spec.json --noEmit
npm run build -- --base-href /kana-study/ --stats-json
node scripts/audit-manga-public-build.mjs
git diff --check
```

`node scripts/audit-manga-local-restart.cjs` necesita previamente el servidor normal
de desarrollo en 127.0.0.1:4400 (`npm run start -- --host 127.0.0.1 --port 4400`). Se
ejecutó mientras el webServer local de Playwright estaba disponible. Usa perfil
sintético e inspector solo de desarrollo; no acredita activación en producción.

Logs/resultados: `.cache/release-manga-{directed,full,e2e-final,public,restart,build,ts-app,ts-spec}.log`,
`release-public-results.json` y `release-local-restart-results.json`.
Pendientes: restaurar backup (no existe), build futuro activado, QA físico y Auth real.
No se ejecutaron SQL/PostgREST ni se reutilizan sus resultados históricos como prueba
nueva: esta fase no modifica contratos ni habilita cloud.

## 11. Archivos inspeccionados/modificados

Además de los informes: package/angular/workflow, main/app.config/app.routes/providers,
gates/rutas Manga/Anki, DictionaryPopup/MangaDeckReview/Reader/JapaneseLookup/DictionaryRepository,
DeckCatalog/PersistenceRouter/Study/Settings, CustomDeckRepository/modelos/validadores,
Workspace/Auth/WorkspaceMigration, SyncService/outbox, Adapter/Transport/GuestImport/
TransferCoordinator/ConflictRecovery/Resolution/BranchArchive y UI Perfil/Auth/Settings.

Nuevos: este informe; `src/app/core/services/manga-local-release-audit.spec.ts`;
`scripts/audit-manga-public-build.mjs`; `scripts/audit-manga-local-restart.cjs`.
Único archivo previo modificado: `e2e/manga-quick-add-ux11.spec.ts`, una línea de espera
del panel real. Cero cambios de producción, gates, traducciones, FSRS, Stats V2,
Japanese 1500, Manga Saved FSRS, sincronización, dependencias o SQL. Los scripts no
se importan en la aplicación; perfiles y artefactos sintéticos quedan en .cache.

## 12. Plan concreto para RELEASE-MANGA-2 — no iniciado

1. Acordar límites/contrato de backup §6; implementar export/restore local y sus pruebas
   de round-trip, owner, corrupción, cuota y atomicidad. No usar cloud como atajo.
2. Cerrar C2 con detección independiente de sync, mensajes ES/EN/CA y ámbito local visible;
   no importar automáticamente ni prometer una migración que no se realiza.
3. Preparar provider normal y ensayo optimizado aislado, cloud=false/false. Verificar
   diccionario→acción secundaria→guardado→catálogo→estudio/undo→stats/settings,
   vocabulario/OCR, reinicio y aislamiento Guest/cuentas sintéticas.
4. Repetir suite/navegador y medir el artefacto exacto. Reducir carga inicial si procede;
   no aumentar 750 kB. Hacer efectivo ese límite en la validación y excluir herramientas
   manuales/de auditoría del bundle.
5. QA físico del alcance anunciado y revisión humana de backup/mensajes. Emitir otro
   GO/NO-GO sobre C1–C3; una compilación correcta no autoriza publicación automática.

No desplegar SQL, activar subida, utilizar cuentas privadas ni modificar historia FSRS.
No ejecutar este plan automáticamente.
