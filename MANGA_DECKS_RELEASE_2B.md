# RELEASE-MANGA-2B — Guest, login y claridad de almacenamiento local

Fecha: 2026-10-25. Entorno Windows, Node v24.21.0, Chromium local y datos sintéticos.
Estado: C2 resuelto en el alcance local probado; publicación pública todavía bloqueada.

## Alcance y estado inicial

Se inspeccionaron git status, RELEASE_AUDIT, RELEASE_2A, DESIGN, H4BD2, SUPABASE_SETUP,
Auth/Workspace/Migration, repositorios, catálogo, sincronización legacy, Perfil, Mazos,
backup y gates. HEAD recibido: 0979315. Había numerosos cambios sin commit de la auditoría
y RELEASE-2A. Se conservaron: no se usó reset, clean, checkout destructivo, commit o push.
SHA-256 inicial: `.cache/release2b-baseline.json`; comparación: `.cache/release2b-scope.json`.
Este informe describe exclusivamente los cambios de 2B, no se atribuye la implementación
previa del backup ni de otros hitos.

## Causas y correcciones

1. `hasCustomGuestData()` exigía custom && assisted && sync. Con cloud apagado, un
   inventario Guest custom existente no participaba en la decisión al entrar en una cuenta.
   Ahora la presencia local exige únicamente el gate local custom; se consulta aparte
   del progreso legacy y de la disponibilidad de importación cloud.
2. Instanciar repositorios para detectar presencia podía abrir, actualizar o recuperar
   almacenamiento. `custom-local-presence.ts` inspecciona únicamente bases existentes,
   sin solicitar versiones nuevas: aborta la creación de bases ausentes, usa transacciones
   readonly y cierra conexiones. No repara registros ni invoca migraciones, registry,
   transportes o reconciliación. También se comprueban readonly los stores legacy, con
   filtro Guest para intentos compartidos. Una base histórica v1 no se convierte en v3.
3. AuthPage esperaba un tick después del SDK. Eso no garantiza que haya terminado una
   inspección IndexedDB. AuthService registra sincrónicamente la promesa del evento y
   signIn/signUp esperan la selección local efectiva. El callback del SDK retorna de
   inmediato para no bloquear su lock de autenticación. No se añaden sleeps ni retries.
   La consulta remota opcional de perfil se ejecuta aparte: no bloquea el aviso ni el
   acceso a la cuenta; una respuesta antigua se descarta mediante generación + usuario.
4. Una fusión legacy podía quedar esperando prueba custom después de corregir la
   detección. Ahora ese estado adicional requiere disponibilidad explícita de importación
   custom. Con sync=false, la fusión legacy termina como antes, sin copiar custom.
   El protocolo experimental V1/V2 y sus autorizaciones/recibos permanecen intactos.
5. Se reprodujeron dos defectos de lectura A→B→A: refresh aceptaba un inventario antiguo
   y load devolvía ready después de volver al mismo nombre de propietario. Dos regresiones
   fallaron antes de la corrección. Catálogo y contadores de Mazos comprueban ahora
   owner + activationRevision + generación; el efecto de Mazos observa la activación.
   Esto solo invalida capturas antiguas: no copia ni elimina datos.

La copia legacy existente se trasladó sin cambiar su política a `workspace-legacy-copy.ts`,
cargado únicamente ante una fusión explícita. Así la detección no construye los servicios
con efectos de inicialización, y se libera presupuesto inicial para la coordinación Auth.
No se han añadido dependencias.

## Comportamiento por workspace

| Situación | Resultado |
| --- | --- |
| Guest custom con cloud=false | Se detecta y se explica la separación antes de activar una cuenta nueva |
| Continuar sin copiar | Activa el espacio de cuenta; Guest permanece intacto |
| Cancelar / cerrar / Escape durante la elección local | Cierra la sesión controlada y conserva Guest, sin marcar importación |
| Guest custom + legacy | Un único diálogo; fusión opcional limitada a datos legacy compatibles |
| Inventario no comprobable | Aviso conservador; permite continuar sin copiar, sin reparar ni borrar |
| Cuenta A | Solo sus mazos locales; no recibe tarjetas Guest automáticamente |
| Cuenta B | No ve datos de A ni Guest |
| Logout | Retorna a Guest y sus mazos originales; conserva los de cada cuenta |
| Recarga y sesión controlada | Recupera la cuenta elegida; no repite una importación |
| A→B→A durante una lectura | No publica la respuesta de una activación antigua |

La fusión opcional describe ajustes, selecciones, progreso/medallas de Kana, Banderas,
Kanji, Vocabulario y Grammar; sesiones/intentos, Japanese 1500, RUSH y guardados Manga.
**Excluye mazos personalizados, sus tarjetas y su progreso.** Se prueba una copia legacy
real de daily-state de Japanese 1500 coexistiendo con un inventario custom que no cambia.
No se fuerza Guest import V2 ni se traslada custom al outbox legacy.

## Mensajes y UX

Se añade un componente contextual compartido y lazy, con traducciones ES/EN/CA a través
de un TranslationService de ámbito de feature. La copia no entra en el diccionario inicial.

- Mazos muestra el espacio actual, almacenamiento solo en este navegador y riesgo de
  pérdida al borrar datos del sitio o perder el dispositivo.
- Cada tarjeta de mazo custom se identifica como «Solo local · sin nube».
- Perfil conserva el estado, fecha, contador y botón de sincronización legacy originales.
  Un mensaje visible explica su alcance y excluye expresamente los mazos custom.
- El punto del acceso global de cuenta continúa siendo un indicador decorativo aria-hidden
  sin promesa textual de backup; conduce al Perfil, que aclara el alcance de sincronización.
- Guest ofrece Datos y progreso y recomienda guardar el JSON fuera del navegador.
  Se explica que una descarga no es sincronización activa y que restaurar exige Guest vacío.
- En cuentas no se recomienda exportar Guest para proteger sus datos. Mazos explica la
  carencia y no ofrece ese enlace como protección; la ruta de backup continúa bloqueando
  exportación/restauración con controles deshabilitados y explicación explícita.
- Login presenta una sola decisión, con continuar, fusión legacy cuando exista y cancelar.
  Foco inicial en continuar; Tab/Mayús+Tab permanecen dentro del diálogo; Escape cancela.
  Se corrigió el manejo de Mayús+Tab tras detectarlo en navegador.
- No hay nuevos avisos intrusivos ni cambios del lector, diccionario, análisis lingüístico
  o flujo FSRS. No hay modales repetidos por pregunta.

## Backup y protección real

El formato RELEASE-2A versión 1 y su servicio/contrato no cambian: Guest compatible →
Guest vacío, once stores, validación/linaje y commit atómico. No se amplía a cuentas.
**Los mazos locales de cuentas carecen de backup portable en esta versión.** Iniciar sesión
no los protege en Supabase. La UI lo dice expresamente; es un riesgo de lanzamiento que
requiere revisión antes de publicar. Ni Guest ni las cuentas tienen custom sync activa.

## Pruebas y evidencia

Las pruebas nuevas usan AuthService y WorkspaceService reales, un cliente de eventos SDK
controlado y repositorios IndexedDB reales/fake-indexeddb según el nivel. No se han usado
cuentas privadas, tokens reales ni servicios cloud. Playwright bloquea los destinos externos
y exige cero RPC en la fixture local. El estado Synced legacy se fija como fixture de UI;
no se presenta como una validación del transporte remoto.

Cobertura nueva: presencia sin cloud, ausencia de escrituras/esquemas nuevos, v1 histórica,
login esperado tras IDB, continuar/cancelar, copia legacy real sin custom, aislamiento
Guest/A/B, logout, lectura inválida A→B→A, sesión controlada, perfil remoto pendiente,
respuestas de perfil antiguas, protección Guest/cuenta, traducciones y gates.
Playwright recorre login/logout, dos pestañas, recarga, cambio de cuenta, backup bloqueado
para cuenta, copia Guest round-trip con reinicio Chromium, temas y tamaños 1280/390/320.
Los eventos entre pestañas se entregan explícitamente como lo haría el SDK controlado:
no se afirma haber validado Supabase Auth ni su canal real de sesión entre pestañas.

| Comprobación | Resultado |
| --- | --- |
| Tests dirigidos Guest/Auth/backup/aislamiento/UX/catálogo | 138/138; última regresión Auth/perfil/aislamiento: 25/25 |
| Suite Angular definitiva sin otras validaciones pesadas en paralelo | 2075/2075 en 201 archivos (15,25 s de ejecución; build de tests aparte) |
| Playwright local Auth + backup | 15/15, repetido después de la corrección de fixture y del ajuste de perfil; última ejecución 15/15 |
| TypeScript app y spec | Ambos --noEmit, código 0 |
| Build Pages con --base-href /kana-study/ --stats-json | Correcto; 748,13 kB; solo cuatro warnings SCSS de Grammar conocidos |
| Grafo inicial y presupuesto | 748134 bytes, máximo 750000; código/copy nuevos diferidos; providers manuales ausentes |
| Artefacto optimizado en navegador | 3/3: ES oscuro escritorio, EN claro móvil, CA oscuro estrecho; reinicio real, URL/storage sin activación y cero intentos remotos |
| git diff --check | Correcto |

Antes: **749,89 kB** (RELEASE-2A). Después: **748,13 kB**; margen exacto **1866 bytes**.
La copia legacy lazy compensa la coordinación Auth añadida. No se aumenta ningún límite.
Los avisos, su i18n, la presencia local y el backup están fuera del cierre estático inicial.
El script audit-local-deck-boundaries.mjs verifica el límite de 750000 bytes y los chunks.

Logs locales: .cache/release2b-directed-complete.log, release2b-profile-fence.log,
release2b-suite-serial.log, release2b-browser-verified.log, release2b-ts-app-verified.log,
release2b-ts-spec-verified.log, release2b-build-verified.log y release2b-public-verified.log.
Grafo: .cache/release2b-graph.json. Los resultados anteriores intermedios no sustituyen
estas comprobaciones del estado final.

### Incidencias observadas durante la validación

- El sandbox produjo EPERM al renombrar archivos temporales de Vitest, sin ejecutar tests.
  Las comprobaciones se ejecutaron después fuera de ese sandbox, sin cambiar la suite.
- Se corrigió el foco de Mayús+Tab y una carrera de la fixture nueva: esperaba app-root,
  pero intentaba preparar Mazos antes de que terminara su carga lazy. Ahora espera
  explícitamente la pantalla Mazos; no hay esperas temporizadas ni reintentos añadidos.
- Una ejecución adicional demasiado amplia de 63 casos terminó 35 correctos / 28 fallidos:
  24 de custom-decks-guest requieren H4BA_USERS/H4BA_HTTP_URL, ausentes; tres del test
  Grammar de navigation.spec esperan el enlace obsoleto /grammar/n5/00/1; el restante
  fue la carrera de fixture anterior, corregida. Los archivos de esas suites preexistentes
  conservan sus hashes. No se modificó Grammar ni se simuló un backend para ocultarlo.
  El conjunto local pertinente de Auth/backup se ejecutó nuevamente sin excluir casos
  internos: 15/15. Los fallos externos no se presentan como pruebas cloud superadas.
- Una ejecución simultánea de suite + build + Playwright agotó 5000 ms en el test
  preexistente lexical-knowledge-projection.spec.ts: «does not trust an arbitrary jmdict
  anchor or textual OCR, including a suggested key» (5293 ms). No hubo aserción semántica
  fallida. El archivo y el servicio de proyección conservan su hash. Se comprobaron después
  los 13 tests aislados sin esas tareas en paralelo: 13/13 en 3,11 s totales. La relación
  con la contención de recursos es una hipótesis apoyada por el contexto, no una causa
  demostrada de toda posible intermitencia. La última suite completa se ejecutó sin
  solapamiento. Se conserva constancia del fallo; no se aumenta timeout ni se introduce retry.
- No se repitieron SQL/PostgREST: no cambió ningún protocolo ni migración.

No se afirma estabilidad absoluta, compatibilidad física Safari ni validación completa de
Supabase Auth real. Esta última continúa pendiente de un entorno aislado autorizado.

## Capturas locales

Artefactos de fixtures sintéticas en .cache, fuera del bundle y del commit:

- `.cache/release2b-login-es-desktop-dark.png`, `release2b-login-en-mobile-light.png`,
  `release2b-login-es-narrow-dark.png`: diálogo traducido, scroll y límites de foco.
- `.cache/release2b-guest-desktop-dark.png`, `release2b-guest-mobile-light.png`,
  `release2b-guest-narrow-dark.png`: espacio Guest, advertencia y acceso a backup.
- `.cache/release2b-profile-desktop-dark.png`, `release2b-profile-mobile-light.png`,
  `release2b-profile-narrow-dark.png`: estado legacy y advertencia de cuenta local.

Se inspeccionaron visualmente el login estrecho oscuro, Mazos móvil claro y Perfil de cuenta móvil claro; los tests
comprueban visibilidad, ausencia de desbordamiento horizontal y recorrido de teclado.

## Archivos de este hito

Producción:

- `core/services/auth.service.ts`, `workspace-migration.service.ts`, `deck-catalog.service.ts`.
- Nuevos `core/services/custom-local-presence.ts` y `workspace-legacy-copy.ts`.
- `features/auth/auth.page.ts`, `.html`, `.scss`.
- `features/anki/anki.page.ts`, `.html` y `components/deck-card/deck-card.ts`, `.html`.
- `features/profile/profile.page.ts`, `.html`; `features/anki-backup/anki-backup.page.ts`.
- Nuevo `shared/components/local-deck-notice/local-deck-notice.ts`.
- `scripts/compile-i18n.mjs`, ES/EN/CA JSON, aggregate generado y nuevo `local-decks.generated.ts`.

Regresiones/auditoría:

- Nuevos `custom-local-auth.spec.ts`, `local-deck-notice.spec.ts`, `e2e/local-decks-auth.spec.ts`
  y `scripts/audit-local-deck-boundaries.mjs`.
- `auth.service.spec.ts`, `custom-guest-auth.spec.ts`, `sync-isolation.spec.ts`,
  `manga-local-release-audit.spec.ts`, `features/auth/navigation-ux.spec.ts`.
- Este informe, DESIGN y MANUAL_TESTING.

Los paths anteriores de producción parten de `src/app`, salvo scripts/assets. La lista
exacta respecto al estado recibido queda en `.cache/release2b-scope.json`.
Los mocks antiguos se adaptan a la separación de presencia legacy/custom; el test de la
auditoría que documentaba C2 pasa a comprobar su corrección. No se eliminan aserciones
de aislamiento, recibos, conservación de Guest o ausencia de red.

## Cierre y riesgos

**C2 resuelto en el alcance local comprobado:** detección independiente de cloud, elección de espacio sin copia automática, cancelación/logout conservando datos, fences A→B→A y mensajes que distinguen sync legacy, custom local y descarga de backup. No equivale a validar Supabase Auth real ni a autorizar el lanzamiento.

Los cuatro gates de producción siguen false. No se modifica CUSTOM_REMOTE_UPLOAD_APPROVED,
SyncService/outbox, SQL, contratos V1/V2, FSRS, Stats V2, Japanese 1500, Manga Saved FSRS
ni el formato de backup. No hay nuevas dependencias ni incremento del presupuesto.
No se publican proveedores experimentales ni mecanismos URL/localStorage de activación.

El lanzamiento público permanece bloqueado por C3 y por la revisión del riesgo de mazos
de cuenta sin backup portable. Las pruebas externas ajenas señaladas y Supabase Auth real
no se declaran verdes. No se inicia RELEASE-2C, no se despliega SQL y no se hace commit/push.
