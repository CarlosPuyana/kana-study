# Gramática: beta cerrada (GRAMMAR-ACCESS-1)

Implementación local sobre UX-1, HEAD inicial `597e9dee6ffbde8ece86060ec7756a8f8ffe6329`.
No se ha publicado ni aplicado SQL remoto. Esta fase limita el uso normal de la interfaz;
no protege la confidencialidad del temario distribuido como archivos públicos.

## Autorización y sesión

`GrammarAccessService` consulta exclusivamente `grammar_beta_access.enabled`, filtrando el
UUID actual de Auth. RLS vuelve a exigir la identidad del JWT en PostgreSQL. No se usan
correos, perfiles, user_metadata, localStorage, URL ni configuración pública como permiso.
Guest, cuentas nuevas, filas ausentes o deshabilitadas y workspaces que no coinciden con
la cuenta quedan sin acceso. Error técnico y comprobación pendiente tampoco conceden acceso.

La inicialización de Auth y la consulta tienen un límite de espera de 10 segundos.
El servicio distingue checking/authorized/denied/error. No persiste permisos positivos.
Las consultas concurrentes de la misma identidad se agrupan, pero cada entrada al módulo
y cada navegación hija fuerzan una comprobación nueva antes de resolvers/actividades.
La primera guarda canMatch evita cargar el árbol de rutas del curso al rechazar una entrada.

La autorización en memoria caduca a los **60 segundos**. Se bloquea la interfaz y se consulta
de nuevo; una cuenta autorizada continúa en la misma actividad cuando se confirma el permiso.
También se invalida y revalida al recibir focus o visibilitychange hacia primer plano.
El temporizador se mantiene mientras viva el servicio y exista un permiso positivo, incluso
si se ha salido del curso; una denegación/error no inicia sondeos automáticos indefinidos.
No existe revocación instantánea: en una pestaña activa, sin navegación o focus intermedios,
puede utilizarse el permiso hasta su caducidad. Los temporizadores de una pestaña suspendida
pueden retrasarse; al volver al primer plano se bloquea antes de revalidar.

Durante una revalidación de la misma cuenta el outlet queda oculto e inert. Ante denegación
o error se sale a `/grammar-access`; al cambiar identidad/workspace se destruye el outlet
inmediatamente. Las respuestas antiguas no pueden conceder acceso a otra cuenta o sobrescribir
su resultado, incluidos A→B→A, logout y eventos de sesión de otra pestaña enviados por Auth.
No se elimina progreso. La pantalla privada tiene foco inicial, estado accesible, inicio,
login para Guest y reintento; el retorno de login es una ruta interna de Gramática validada.
Login por sí solo no autoriza y la ruta de regreso vuelve a pasar las guardas.

## Integraciones y exposición pública

- Más oculta tarjeta y origen Gramática hasta estar autorizado.
- Daily Study elimina candidatos Grammar antes de distribuir las recomendaciones, conservando
  las evidencias históricas y los datos originales. No inicia sesiones ni altera registros.
- Debilidades conserva historial, pero no ofrece el enlace de práctica restringida.
- Stats conserva sus cálculos e historial sin añadir enlaces para iniciar actividades.
- El popup Manga oculta la pestaña del curso y elimina referencias abiertas al retirar acceso.
  La referencia independiente también comprueba el servicio. Diccionario, OCR, traducción
  contextual y Añadir a Mazos conservan sus contratos y los gates existentes.
- Los retornos existentes desde selección Kana pueden terminar en una URL Grammar; la guarda
  los conduce a la pantalla privada si no hay permiso. No constituyen acceso alternativo.
- Sincronización legacy y sus merges de progreso Grammar siguen funcionando con historial
  existente: no se borran pendientes ni se cambia su formato por una restricción de interfaz.

**Exposición restante auditada:** los catálogos `src/app/data/grammar/` y
`src/app/features/grammar/data/`, los ejercicios y `src/assets/i18n/grammar.generated.ts`
siguen en chunks públicos. Daily, Stats y Debilidades importan catálogos/etiquetas para
historial y proyecciones; sus resolvers cargan traducciones del curso. El lector conserva
imports de referencias y traducciones existentes. Sync puede importar el catálogo para
validar merges históricos. No hay preloading global del router, pero conocer una URL de
asset permite descargarlo y versiones públicas anteriores siguen existiendo. Manipular
JavaScript localmente puede evitar controles de UI. Los guards y la tabla de permisos
**no son DRM ni protección confidencial**. Servir contenidos privados desde un backend
autorizado, retirar artefactos públicos y controlar versiones antiguas sería otra fase.

## SQL administrativo: únicamente en un contexto de confianza

Migración nueva: `supabase/migrations/202610270001_grammar_beta_access.sql`.
Tabla separada, UUID FK a auth.users, enabled=false por defecto, fechas, RLS y privilegios
explícitos. Authenticated solo puede leer sus filas; anon no puede leer y ningún cliente
puede insertar, actualizar, borrar o truncar. No hay RPC de concesión ni seeds autorizados.
Los clientes no pueden modificar `updated_at`; el administrador lo actualiza al cambiar acceso.

Los comandos siguientes son instrucciones para el propietario; **no se han ejecutado**.
En psql conectado como administrador al entorno elegido:

```sql
\prompt 'UUID real de auth.users que se desea administrar: ' grammar_user_uuid

-- Comprobar identidad, únicamente desde el contexto administrativo.
select id, created_at from auth.users where id = :'grammar_user_uuid'::uuid;

-- Conceder acceso explícito. Revisar que INSERT devuelve exactamente una fila.
insert into public.grammar_beta_access(user_id, enabled)
select id, true from auth.users where id = :'grammar_user_uuid'::uuid
on conflict(user_id) do update set enabled=true, updated_at=now()
returning user_id, enabled, created_at, updated_at;

-- Retirar acceso sin borrar progreso ni historial.
update public.grammar_beta_access set enabled=false, updated_at=now()
where user_id = :'grammar_user_uuid'::uuid
returning user_id, enabled, updated_at;

-- Consultar permiso.
select user_id, enabled, created_at, updated_at from public.grammar_beta_access
where user_id = :'grammar_user_uuid'::uuid;
```

Supabase SQL Editor no interpreta los metacomandos psql: usar una variable UUID declarada
en un bloque administrativo o sustituir el parámetro por el UUID real verificado. Nunca
incluir claves administrativas en el navegador ni compartirlas en logs.

## Aplicación y despliegue posteriores (requieren autorización independiente)

1. Revisar la migración y probar primero en un proyecto Supabase aislado autorizado.
2. Aplicar la migración antes del frontend nuevo, sin conceder permisos todavía. Si falta
   tabla/configuración/red, el frontend nuevo bloquea; no hay fallback abierto.
3. Desplegar ambos guards y filtros juntos usando el build manga-candidate habitual, sin
   tocar los gates: custom/assisted conservan la beta Guest-only; sync/upload siguen false.
4. Comprobar Guest, cuenta sin fila y rutas hijas en Pages; solo después conceder acceso
   a la primera cuenta real desde administración y verificar entrada, logout y revocación.
5. No volver a una versión anterior pública como rollback de acceso: retirar permisos en
   esta versión o mantener el bloqueo. Conservar los datos de progreso.

No hay una nueva ventana abierta por ausencia de la migración: la versión nueva falla cerrada.
La versión actualmente publicada sigue siendo pública hasta desplegar el cambio, y una copia
antigua ya cargada no se cierra remotamente. Si se requiere un corte sin esa coexistencia,
el propietario deberá autorizar una ventana de mantenimiento/retirada temporal y considerar
la exposición de assets; esta tarea no cambia Pages ni permite prometer confidencialidad.

## Validación local

Resultados locales, 27/10/2026:

| Comprobación | Resultado |
| --- | --- |
| Dirigidos: servicio, rutas, Daily, referencias, debilidades y contrato de rutas | 86/86, siete archivos |
| Angular completo | 2136/2136, 206 archivos, sin errores asíncronos no capturados |
| TypeScript app/spec | Ambos correctos, sin emitir archivos |
| SQL PostgreSQL/PGlite | 7/7 escenarios, incluida lectura propia, aislamiento, ausencia de sujeto, anon, autoasignación y revocación |
| Playwright, Chromium escritorio/390/320 | 92 correctos; 16 omisiones preexistentes de auditorías solo escritorio. Segunda pasada de acceso: 12/12, incluido logout SDK entre pestañas, sin errores de navegador |
| Regresión del candidato Manga × Mazos optimizado | 3/3 ES/EN/CA; FSRS/undo, backup/restauración, Guest/cuentas, Japanese 1500 y ausencia de cloud custom |
| Build normal GitHub Pages | Correcto; 733789 bytes iniciales |
| Build manga-candidate GitHub Pages | Correcto; 734675 bytes iniciales, estrictamente <750000 |
| Frontera del presupuesto | El guard real acepta 749999 y rechaza 750000/750001 en metadatos sintéticos |
| Auditoría de límites de carga | Correcta; no se introduce código de pruebas/manual en el artefacto |
| Documentación y whitespace | Enlaces válidos y `git diff --check` correcto |

Los dos builds conservan únicamente los cuatro avisos SCSS conocidos de Grammar.
La primera ejecución completa detectó fixtures que asumían acceso público y mocks parciales
de Auth: ahora el permiso está definido explícitamente por fixture. Playwright también
encontró dos recorridos antiguos de Tema 00 y una selección OCR antes de existir su nodo:
se prueban una lección vigente con su práctica inline, el enlace directo de práctica y la
redirección antigua; la selección espera el elemento OCR real. Se resuelve sin relajar
aserciones, añadir sleeps, ampliar tiempos ni omitir escenarios.
El fixture de perfil de la prueba entre pestañas incorpora las fechas exigidas por el
contrato real de profiles; su pasada final comprueba también errores de consola/página.

Evidencia local ignorada: `.cache/grammar-access/` (logs de cada comando, resultados SQL,
auditoría de scope y capturas de pantalla privada en claro/oscuro y escritorio/móvil estrecho).
El índice Git permanece vacío y HEAD no cambia. Los 29 archivos modificados y 11 nuevos
se limitan a esta fase; no se han eliminado archivos ni modificado el workflow/gates.

Comandos de cierre desde la raíz, en serie:

```powershell
node scripts/test-grammar-access-sql.mjs
npm test
npx tsc -p tsconfig.app.json --noEmit
npx tsc -p tsconfig.spec.json --noEmit
npm run build -- --base-href /kana-study/ --stats-json
node scripts/audit-local-deck-boundaries.mjs
npm run build:manga-candidate
node scripts/check-manga-release-budget-boundary.mjs
npm run test:manga-candidate
npx playwright test e2e/grammar-access.spec.ts e2e/manga-grammar.spec.ts e2e/navigation.spec.ts e2e/ux-feedback.spec.ts e2e/audit-corrections.spec.ts e2e/manga-quick-add-ux11.spec.ts
node scripts/audit-repo-docs.mjs --links-only
git diff --check
```

Las cuentas de Playwright son sintéticas: SDK/HTTP interceptados, sin tráfico a un Supabase
real. Las pruebas unitarias conceden permiso explícito en sus fixtures de contenido; no hay
override global en configuración de aplicación o test. No se han desactivado tests ni aumentado
timeouts/retries para permitir el acceso.

SQL ejecutable: `node scripts/test-grammar-access-sql.mjs [ruta-a-pglite/dist/index.js]`.
Usa el runtime PGlite ya disponible en `.cache/h4a-sql-runtime/`, sin nuevas dependencias.
Verifica RLS y privilegios con roles reales en PostgreSQL/WASM, no con mocks de SQL.
No prueba el gateway JWT de Supabase/PostgREST, refresh de Supabase Auth real, concurrencia
entre conexiones independientes ni el despliegue de la migración en producción.
Firefox y WebKit no están instalados en el runtime de Playwright. Safari/dispositivos físicos
y la aceptación humana final quedan pendientes.

Archivos funcionales: servicio y guardas Grammar Access, shell/pantalla privada, app.routes,
Más, adaptador Daily, Debilidades, popup/referencia Manga y traducciones ES/EN/CA compiladas.
Pruebas: servicio/rutas/integraciones, fixtures afectados y escenarios SQL/Playwright.
No se modifican algoritmos FSRS, contratos de persistencia, servicios de sincronización,
feature gates, workflow, dependencias o migraciones anteriores.

| Área | Archivos |
| --- | --- |
| Permiso central y rutas | `src/app/core/services/grammar-access.service.ts`, `grammar-access.guard.ts`, `src/app/app.routes.ts` |
| Pantalla y bloqueo de sesión | `src/app/features/grammar-access/grammar-access.page.ts`, `grammar-access-shell.ts` |
| Integraciones | `features/more/more.page.ts`, `features/weaknesses/weaknesses.page.ts`, `core/services/daily-study-planner.service.ts`, `shared/components/dictionary-popup/{dictionary-popup,manga-grammar-reference}.ts` bajo `src/app/` |
| Navegación y textos | `src/app/navigation-audit.ts`, `src/assets/i18n/{es,en,ca}.json`, `core.generated.ts` |
| Base de datos y ejecución local | `supabase/migrations/202610270001_grammar_beta_access.sql`, `scripts/test-grammar-access-sql.mjs` |
| Pruebas nuevas | `grammar-access.service.spec.ts`, `features/grammar-access/grammar-access.spec.ts`, `e2e/grammar-access.spec.ts`, `e2e/grammar-access.fixture.ts` |
| Fixtures existentes | Daily/planner, app-modules, sync-reconciliation, navigation-ux, grammar-weakness, stats, manga-assistance/reference y navigation-audit specs; E2E navigation, audit-corrections, ux-feedback, manga-grammar y manga-quick-add-ux11 |
| Regresión de release | `scripts/audit-manga-candidate.mjs`: comprueba dos pestañas Guest y ausencia de referencias del curso; conserva todas las comprobaciones de mazos/FSRS/backup/cuentas |
| Documentación | Esta guía, `SUPABASE_SETUP.md` y `docs/INDEX.md`; se conserva el documento V1 de integración Manga como antecedente |
