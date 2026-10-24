# Supabase setup

Kana Study remains local-first. Without this configuration, every study module continues to work as Guest and writes only to the browser.

## 1. Create the project

Create a Supabase project. Never place a `service_role`, secret key, or Admin API credential in this repository or browser application.

## 2. Run the migration

Open **SQL Editor**, paste and execute `supabase/migrations/202609300001_local_first_accounts.sql`. This creates the profile, progress, event, session, medal, deck, RUSH and preference tables, their indexes, timestamp/merge triggers, and owner-only RLS policies.

After the initial migration, execute `supabase/migrations/202610040002_profile_leaderboard.sql` to enable Profile's leaderboard. The application calls `get_leaderboard_v1()` only when Classification is opened; Refresh synchronizes local activity before reloading it. This migration must be applied separately by the project operator; it is not run automatically by the frontend.

The leaderboard shares only display name, username, synchronized study seconds and medal count with authenticated users, plus ranking position and a current-user flag. It exposes no UUIDs, emails, bios, private dates, progress or activity payloads. Its narrowly scoped `SECURITY DEFINER` function uses an empty search path and fully qualified table names; only `authenticated` can execute it. Existing owner-only RLS policies and table permissions remain unchanged.

Study time sums completed-session `durationSeconds`, rounded total deck `elapsedAnswerMs / 1000`, and RUSH `active_seconds` for finished sessions with at least one completed card. Invalid or negative JSON durations contribute zero. Profiles without activity remain in the ranking with zero time; equal times share a position, ordered by username within ties. Medal count includes normal and RUSH unlocks. No activity beyond the existing synchronized records is counted.

Before synchronizing Grammar sessions, also execute
`supabase/migrations/202610080004_completed_sessions_grammar.sql` manually in the project's SQL Editor.
It extends `completed_sessions_module_check` to accept `grammar` alongside `kana`, `flags`, `kanji`
and `vocabulary`. The replacement is transactional and validates historical rows; sessions, payloads,
durations, indexes, primary keys, timestamps, grants and RLS remain unchanged. Deploying the frontend
does not apply this migration. A missing migration causes PostgreSQL `23514`; preserve pending
operations and retry synchronization after applying it. Session IDs remain stable on retry.

## 3. Obtain the public browser values

In **Project Settings â†’ API**, copy:

- Project URL
- Publishable key (the browser-safe key; older projects may label it `anon`)

Do not use a secret or `service_role` key.

## 4. Configure the application

For local development, edit `public/supabase-config.js`:

```js
window.__KANA_STUDY_CONFIG__ = {
  supabaseUrl: 'https://PROJECT.supabase.co',
  supabasePublishableKey: 'YOUR_PUBLISHABLE_KEY',
};
```

Both values are public browser configuration. Leave them empty to run in Guest-only mode.

For GitHub Pages, create Repository Variables named `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`. The deployment workflow writes them into the generated public configuration. Do not create a secret containing `service_role`.

## 5. Configure Site URL

In **Authentication â†’ URL Configuration**, set:

```text
Site URL: https://carlospuyana.github.io/kana-study/
```

## 6. Configure redirect URLs

Add all of these exact redirect patterns:

```text
https://carlospuyana.github.io/kana-study/
https://carlospuyana.github.io/kana-study/?auth=confirm
https://carlospuyana.github.io/kana-study/?auth=recovery
http://localhost:4200/
http://localhost:4200/?auth=confirm
http://localhost:4200/?auth=recovery
```

The recovery callback uses a query parameter before the hash. Angular then opens `#/auth?mode=recovery`; it does not require a server route that GitHub Pages could return as 404.

## 7. Create the first account

Open `#/auth`, choose **Create account**, and supply display name, username, email and password. When email confirmation is enabled, confirm using the received link. The database trigger creates the private profile from signup metadata.

## 8. Validate synchronization

Complete a local study action, open Profile, and select **Sync now**. Confirm that Profile reports Synced and zero pending changes. Sign out to verify Guest data, then sign in on a second browser and synchronize. Static datasets are never uploaded; cloud rows contain stable IDs and progress only.

## Operational notes

- Auth and sync are eventual and never gate local study writes.
- Realtime, PWA/service workers, image uploads and Admin APIs are intentionally absent.
- A daily round completed simultaneously on two offline devices creates two valid completed-session records after sync. Both are preserved.
- Normal FSRS event histories cannot safely reconstruct one deterministic state after concurrent devices because practice attempts are not full FSRS events. V1 unions events and chooses the progress snapshot with the newest `lastSeenAt`; `updated_at` is only a server sync cursor.


## Manga Saved Sync V1 (manual migration)

After `202609300001_local_first_accounts.sql` and `202610040002_profile_leaderboard.sql`, apply
`202610080003_manga_saved_sync.sql` manually in the correct Supabase project's SQL Editor.
GitHub Actions and the Angular deployment do **not** apply SQL. SQL pendiente de aplicar manualmente
until the project operator executes it and verifies RLS with two separate authenticated accounts and an anonymous client.

`manga_saved_items` is a private, lightweight collection keyed by `(user_id,item_id)`. It stores the
schema V1 snapshot, a deletion tombstone, server timestamps, revision, restoration revision and last
operation token. Its physical primary key is `(user_id,item_key)`, where `item_key` is a generated
SHA-256 digest of the original `item_id`; stable IDs are never truncated or replaced. This avoids
PostgreSQL B-tree key-size failures for long dictionary identities. The key indexes each user's rows,
which are sorted by the original `item_id` for pagination. RLS policies scope all four
operations to the owner. Anonymous access is revoked. Authenticated clients can SELECT their own rows;
all writes use `apply_manga_saved_change_v1`, whose narrow SECURITY DEFINER scope derives the owner
from `auth.uid()` (there is no caller-supplied user ID), locks each row and validates the payload.
Direct REST INSERT/UPDATE/DELETE is deliberately denied, so a client cannot bypass version checks or
set timestamps/revisions. No service_role key is used in the browser.

The first sync fetches every remote page before reconciling old local items. Only previously unmigrated
items absent remotely become durable bootstrap operations. Active remote records keep their confirmed
first context; tombstones suppress historical and Guest copies. An empty local collection does not
delete remote rows. Bootstrap state and local intentions live alongside saved-items in an additive
IndexedDB V1-to-V2 migration; saved-items is never rebuilt or cleared during migration.

Deletion wins against stale saves and concurrent initial saves. An explicit save can restore a
confirmed tombstone only with its exact known revision. A stale deletion cannot erase a later explicit
restoration. A stable operation token makes retries idempotent, and the first server-confirmed active
context wins duplicate saves. These rules use server row locking and versions, never device clocks.

Guest stays local. Only the existing explicit Merge and sync decision copies Guest words as initial
incorporations; Guest remains intact and remote tombstones prevail. Use my account imports nothing.
The existing Profile sync status/count includes Manga operations. Offline changes and failed outbox
enqueues remain recoverable in the local journal. Missing table/RPC, network, RLS or transaction errors
preserve local data and show an error/pending state, never a false Synced result. Retry after applying
the migration. Images, pages, dictionaries and files are never uploaded; study time/FSRS are unchanged.

Deployment order: apply SQL, verify RLS/CAS behavior, then deploy the compatible application. Validate
real PC/mobile save, delete, offline, restore and account-switch scenarios separately: automated tests
with simulated cloud devices do not establish real cross-device validation.

Optional local SQL validation (no Supabase credentials): install `@electric-sql/pglite` in a temporary
directory outside this repository, then run `node scripts/test-manga-saved-sql.mjs <absolute-path-to-pglite/dist/index.js>`.
This executes the actual migration and checks payload rejection, both save/delete orders, revision
checks, idempotency, owner isolation and anonymous/direct-write denial. PGlite has one backend;
separate-session row-lock contention must still be verified against PostgreSQL in the target project.

Local and SQL limits: IDs are bounded to 19,218 UTF-8 bytes (the worst JSON-escaped identity for two
1600-unit strings); the projected snapshot is bounded to 65,536 bytes in PostgreSQL `jsonb::text`
format, including escapes, multibyte text and structural spaces. Existing per-field caps remain.
Local validation rejects NUL and unpaired surrogates, which PostgreSQL jsonb cannot represent.
Page numbers and creation timestamps must be safe integers, matching server validation and numeric
serialization. The SQL validation script imports the same local validator and shared boundary fixtures
(requires Node 22.18+ with TypeScript stripping); it checks accepted items through the actual RPC.

## Manga Study V3: contextual review (manual migration)

Grammar's correction is already documented by `202610080004_completed_sessions_grammar.sql`;
do not repeat or edit the initial migration. After it, manually apply
`supabase/migrations/202610080005_manga_study_v3.sql` in the correct Supabase SQL Editor.
**The V3 migration is pending manual execution until the operator applies it.** Frontend builds
and GitHub Actions do not execute SQL. It extends only the module CHECKs: completed sessions
retain `grammar` and add `manga`; review events retain their four original modules and add `manga`.
Saved-word tables, tombstones, RPCs, RLS, indexes, permissions and leaderboard logic are untouched.

Review attempts are immutable, lightweight `review_events` payloads, using the stable saved-word ID
as `unit_key`, `good`/`again` as the existing rating transport, and an explicit automatic/self-assessment
mode. These ratings do not invoke FSRS. No contexts, dictionary snapshots or blobs are uploaded in events.
Manga transport row IDs are qualified as `user_id:logical_id` because the existing tables have global
text primary keys. Logical event/session IDs remain unchanged in payloads, including on Guest import;
two explicit imports into different accounts cannot collide with an owner's row or bypass RLS.
Completed Manga sessions use the existing channel and count study time exactly once via `durationSeconds`.
Abandoned attempts remain useful history but add no Profile or leaderboard time. Guest history is local;
only explicit Merge imports it by ID. Account switches cancel an active session. Failed local writes
show recovery without accepting another answer; failed outbox enqueues replay the same immutable IDs.
For interrupted enqueues, synchronization compares local immutable Manga IDs with the records already
received by the existing full pull. After revision-protected ACK cleanup, only locally present IDs absent
from that successful pull are recovered. A non-empty category is left to its current revision; recovery
uses an atomic insert-if-absent to avoid replacing concurrent work. Downloaded or confirmed history does
not create new operations, timers or repeated upserts. A failed/offline pull makes no remote confirmation
assumptions and leaves local data intact. Recovery of genuinely missing IDs leaves Pending for the next
automatic cycle; an unchanged account converges to Synced with zero pending operations.

Optional local PostgreSQL validation: install `@electric-sql/pglite` outside the repository and run
`node scripts/test-manga-review-sql.mjs <absolute-path-to-pglite/dist/index.js>`. This executes the actual
initial, leaderboard, Grammar and V3 SQL and verifies CHECK rejection/acceptance, historical rows,
session idempotency, leaderboard totals, indexes, grants, owner isolation and anonymous denial.
It is not a real Supabase PC/mobile test. After applying SQL, complete and sync on PC, synchronize
on mobile, verify one session and identical attempt IDs/time, then test two offline attempts on both.

## Inspect incomplete synchronization on an existing device

In the authenticated Profile, open **Synchronization diagnostics** and select **Inspect local diagnostics**
after attempting Sync now. This is an opt-in, memory-only snapshot; it is not uploaded or logged.
It reports entity type/category, age, attempts, journal association/revision match, whether a server
response was received, verified remote state and a confirmed operation awaiting outbox cleanup.
The failure identifies the phase and table/RPC plus a safe error code and redacted technical message.
Raw server messages, record IDs, user UUIDs, tokens and private payloads never appear. Unknown remote
state means unverified: a lost response cannot prove whether the server committed until an idempotent
retry. Reloading clears transient confirmation diagnostics; the durable outbox and Manga journal remain.

`pending` means new work remains and another automatic pass is scheduled, not a network failure.
`error` means a concrete phase failed; `offline` means no connection. Successfully verified writes are
removed by matching outbox revision even when another module fails; unverified/replaced operations stay.
A journal-free Manga outbox retry rechecks the durable operation through the RPC before cleanup.
No new SQL migration or browser-data reset is required for this synchronization correction.

On mobile after deployment, save on PC, sync on mobile, delete there, sync both, then verify zero Manga
journals/outbox entries and Synced when all modules succeeded. If two changes remain, inspect their
categories and failure target/code; do not assume they are Manga. Preserve the browser's stored data.

## Manga Study V4: optional FSRS

No additional SQL migration is required. Apply the existing Manga V3 migration
`202610080005_manga_study_v3.sql` if it is not already installed. V4 uses the same
Manga review_events and completed_sessions transport and owner RLS. FSRS payloads
add reviewKind='fsrs', fsrsVersion=1 and fsrsGrade=1|3; the rating column still
contains only 'again' or 'good'. Completed summaries add mangaSessionKind='fsrs'.
The workspace opt-in is stored through existing user_preferences under
`kana-study.manga-fsrs-settings.v1`. Saved-word RPCs and tombstones are unchanged.

See [MANGA_FSRS.md](MANGA_FSRS.md) for deterministic replay, parameters, clock
skew, offline recovery and account isolation. The local PostgreSQL script
`scripts/test-manga-review-sql.mjs` also checks both FSRS grades, preference
payloads, idempotent retries and unchanged leaderboard time/RLS.

## Manga × Mazos H4A — migración preparada, sin despliegue

Nueva migración aditiva: `supabase/migrations/202610220001_custom_decks_foundation.sql`.
Crea reloj, entidades, recibos y conflictos privados por propietario, RLS de lectura
y tres RPC de operación/bundle/cambios. No modifica las tablas anteriores. No se ha
aplicado a producción y ambos gates de mazos personalizados continúan desactivados.

Para reproducir los tests locales desde la raíz, sin credenciales ni conexión remota:

```powershell
npm install --prefix .cache/h4a-sql-runtime --no-save --package-lock=false @electric-sql/pglite@0.3.14
node scripts/test-custom-decks-sql.mjs
```

El runtime se instala solo en la caché ignorada; no cambia package.json/package-lock.
El runner crea una base efímera, aplica las migraciones anteriores y la nueva, y
comprueba 23 escenarios SQL/protocolo. Usa roles PostgreSQL reales y claims de prueba
para auth.uid(); no valida firma/expiración JWT ni el gateway PostgREST de Supabase.
PGlite tiene un backend: falta contención multisesión en PostgreSQL nativo.

Antes de cualquier despliegue, ejecutar esas pruebas pendientes en una instancia
local/staging aislada, verificar catálogos/permisos y preparar backup. Aplicar esta
migración en orden mediante el procedimiento habitual de migraciones, únicamente
con autorización separada para el entorno destino. No usar una base con datos reales
para resets de pruebas. H4A no habilita transporte ni autoriza comenzar H4B.
Véase `MANGA_DECKS_H4A.md` para límites, privacidad, resultados y bloqueos.

## H4A.1 — PostgreSQL nativo y PostgREST portátiles (Windows x64)

Preparación local utilizada, sin paquetes raíz ni servicios del sistema:

```powershell
npm install --prefix .cache/h4a1-runtime --no-save --package-lock=false embedded-postgres@17.5.0-beta.15 pg@8.16.3
Invoke-WebRequest -Uri 'https://github.com/PostgREST/postgrest/releases/download/v16.5/postgrest-v16.5-windows-x86-64.zip' -OutFile .cache/h4a1-runtime/postgrest-v16.5.zip
Get-FileHash .cache/h4a1-runtime/postgrest-v16.5.zip -Algorithm SHA256
Expand-Archive -LiteralPath .cache/h4a1-runtime/postgrest-v16.5.zip -DestinationPath .cache/h4a1-runtime/postgrest-v16.5
node scripts/test-custom-decks-native.mjs
```

SHA256 observado del ZIP: `17f595b0d8dd37473d0231417dea07c5ac9f791282ff5b017fae51ff29e5de2f`.
Es una huella del artefacto descargado, no una firma independiente del proveedor.
El runner actual usa las rutas Windows del paquete; no se afirma soporte Linux/macOS.
No extraer encima de una preparación existente: reutilizar los binarios o preparar
una caché nueva. No borrar ni resetear datos del usuario para reproducir estas pruebas.

El runner crea clúster/bases nuevos, solo loopback, contraseña SCRAM y secreto JWT
aleatorios. Ejecuta los 23 escenarios previos en una base nativa y las carreras/HTTP
en otra; apaga procesos al terminar. No consume SUPABASE_URL, claves ni URLs externas.
Los logs redactados y results.json quedan dentro del directorio run-* de caché.
El polling espera condiciones observables de arranque/bloqueo; no reintenta operaciones.

Resultado: batería ampliada 16/16 nativas (15 solapamientos), 8/8 HTTP/JWT en dos
clústeres independientes. Se usa PostgREST real con autenticador NOINHERIT sin bypass
RLS, pero el emisor de JWT es local al arnés. Supabase Auth/GoTrue, login/refresh y el
gateway Supabase completo siguen pendientes, según confirmación del usuario. No deben
darse por cubiertos con SET request.jwt.claims ni con estos JWT de prueba.

La instalación portátil sigue la documentación de
[embedded-postgres](https://github.com/leinelissen/embedded-postgres) y
[PostgREST](https://docs.postgrest.org/en/stable/explanations/install.html).
Véase `MANGA_DECKS_H4A1.md` para límites e incidencia de arranque observada. No se
habilitan gates, se despliega producción ni se inicia H4B.

## H4B-A — pruebas de transporte y dos navegadores, solo entorno aislado

```powershell
node scripts/test-custom-decks-sql.mjs
node scripts/test-custom-decks-native.mjs --browser-tests --startup-probes=3
```

Se usan exclusivamente datos sintéticos del clúster portátil. El runner nativo mantiene
PostgREST activo mientras Playwright ejecuta e2e/custom-decks-sync.spec.ts. Los JWT se
quedan en el proceso Node de prueba; el navegador recibe un transporte inyectado mediante
binding, no claves de Supabase. Los resultados se separan por SQL nativo, concurrencia,
HTTP/JWT y navegador. browser-tests.log y logs redactados quedan en .cache/h4a1-runtime/run-*.

El arnés acota db-pool=1 y normaliza LC_ALL/LANG=C. Las carreras multisesión nativas
mantienen conexiones PostgreSQL independientes; el pool HTTP no pretende demostrar
contención entre conexiones HTTP de producción. --startup-probes=3 realiza tres
arranques independientes; cualquier fallo aborta, sin reintento automático. Se volvió
a reproducir la salida 3 en Windows antes de normalizar locale, incluso con pool=1.
Los probes posteriores pasan, pero la causa exacta no se declara demostrada ni resuelta.

La migración H4A preparada (nunca desplegada a producción) corrige ahora la validación
del reloj FSRS: preview/log/card.lastReview se conservan separados de reviewedAt al
pulsar. Los escenarios SQL añaden regresión del contrato real. No ejecutar el fichero
encima de una instalación existente como parche improvisado: estos tests crean una
base nueva; cualquier despliegue o corrección en otro entorno necesita revisión y
autorización independiente. No se modifica ninguna migración legacy.

El adaptador técnico no se conecta al SyncService ni al outbox legacy. Su gate nuevo,
CUSTOM_DECK_SYNC_ENABLED, queda false igual que los dos gates custom anteriores.
No hay interruptor público o URL que active transporte. Supabase Auth/GoTrue, consentimiento,
Guest, dispositivos físicos y activación real siguen pendientes. Véase MANGA_DECKS_H4BA.md.

## H4B-B: Guest, consentimiento y resolución (2026-10-22)

Este hito no añade ni modifica migraciones y no despliega SQL. Reutiliza el contrato H4A
ya probado en bases locales nuevas. La importación Guest conserva IDs y procedencia, se
confirma explícitamente, compara destino y guarda checkpoints. Las divergencias FSRS no
se fusionan; las resoluciones admitidas requieren una nueva operación CAS.

CUSTOM_DECKS_ENABLED, MANGA_DECK_ASSISTED_ENABLED y CUSTOM_DECK_SYNC_ENABLED continúan
false. CUSTOM_REMOTE_UPLOAD_APPROVED=false bloquea además el apply del SDK real. El
consentimiento experimental es por workspace, afirmativo y versionado; retirarlo no borra
el servidor. No activar estos gates ni desplegar SQL a partir de este informe.

Arnés local: `node scripts/test-custom-decks-native.mjs --guest-tests --browser-tests --startup-probes=3`.
Ejecuta PostgreSQL 17.5, escenarios SQL, conexiones simultáneas, PostgREST 16.5 con firmas
JWT reales y flujos H4B-A/B en navegadores sintéticos. No consume una URL de base externa;
JWT y claves solo existen en el proceso Node. `node scripts/test-custom-decks-sql.mjs`
valida aparte PGlite. Los resultados de cada entorno y límites están en MANGA_DECKS_H4BB.md.

Esto no valida Supabase Auth/GoTrue ni gateway/CORS de Supabase real. Se mantienen los
probes, logs redactados y la incidencia previa de salida 3 Windows como investigación
pendiente, aunque los arranques locales de esta pasada sean correctos.

## H4B-C — Recuperación readonly y medidas de escala (2026-10-22)

No hay migración nueva ni SQL desplegado. Las lecturas de conflictos/recibos usan los
SELECT ya autorizados por RLS, fijan owner/sesión y no generan reviews, ACKs ni escrituras.
La evidencia que nunca salió del dispositivo no está en Supabase y no puede reconstruirse.
Véase MANGA_DECKS_H4BC.md para cobertura, límites, matriz de pérdida de dispositivo y bloqueos.

Reproducción en el arnés local existente, con datos exclusivamente sintéticos:

```powershell
node scripts/test-custom-decks-sql.mjs --limits
node scripts/test-custom-decks-native.mjs --hardening-tests --browser-tests --guest-tests --startup-probes=5
node scripts/measure-grammar-contention.mjs isolated-after 1
npm test
npx tsc -p tsconfig.app.json --noEmit
npx tsc -p tsconfig.spec.json --noEmit
npm run build -- --base-href /kana-study/ --stats-json
```

hardening-limits.json, postgrest-startups.json y logs redactados separan tamaño, proceso,
readiness y parada intencional. Cualquier fallo de arranque aborta; no hay retry silencioso.
Las etiquetas loaded de Grammar requieren la carga externa descrita en el informe; no
modifican timeouts. El generador de JWT sigue únicamente en Node, sin secretos en frontend.

El bundle paginado y el preflight no hacen atómica toda la migración Guest: una tarjeta
puede estar publicada antes de su historial si se interrumpe la red. Esa ventana y el
archivo de ramas no enviadas bloquean activación, junto a Auth/gateway y QA físico.
CUSTOM_DECKS_ENABLED, MANGA_DECK_ASSISTED_ENABLED, CUSTOM_DECK_SYNC_ENABLED y
CUSTOM_REMOTE_UPLOAD_APPROVED permanecen false. No activar ni desplegar desde este informe.

## H4B-D1 — Protocolo V2 preparado, solo pruebas efímeras

Nueva migración aditiva: `supabase/migrations/202610220002_custom_transfers_v2.sql`,
posterior a H4A. No se ha desplegado ni debe aplicarse a producción desde este hito.
Crea cuatro tablas privadas de transferencias/chunks/recibos/cuota y dos RPC:
apply_custom_transfer_v2 y get_custom_transfer_v2. No reemplaza las RPC V1.

```powershell
node scripts/test-custom-decks-sql.mjs --transfers --limits
node scripts/test-custom-decks-native.mjs --transfers --browser-tests --guest-tests --hardening-tests --startup-probes=3
npm test
npx tsc -p tsconfig.app.json --noEmit
npx tsc -p tsconfig.spec.json --noEmit
npm run build -- --base-href /kana-study/
git diff --check
```

El runner aplica V2 únicamente a su base sintética efímera, después de comprobar
las regresiones V1. Conserva resultados y logs redactados en caché. La recarga de
schema PostgREST espera disponibilidad observable, sin reintentar operaciones.
JWT sintéticos no certifican Supabase Auth. Véase MANGA_DECKS_H4BD1.md para estados,
frontera de visibilidad, límites y retención sin purga automática.

Angular/Guest aún usan V1: la integración corresponde a D2 y no se ha iniciado.
Todos los gates siguen false. No habilitar cuentas reales ni anunciar recuperación
de operaciones nunca enviadas; retirar consentimiento no borra los archivos remotos.

## H4B-D2 — Integración Angular V2, sin activación pública

No hay migración nueva. Se utilizan exactamente las RPC V1/V2 de las migraciones
202610220001 y 202610220002, aplicadas solo a bases efímeras del arnés. El SDK existente
mantiene Authorization por sesión y CUSTOM_REMOTE_UPLOAD_APPROVED=false. Guest no
recurre al publicador V1 si falta V2: conserva checkpoint/origen y muestra bloqueo.

```powershell
node scripts/test-custom-decks-sql.mjs --transfers --limits
node scripts/test-custom-decks-native.mjs --transfers --client-v2-tests --browser-tests --guest-tests --hardening-tests --startup-probes=3
npm test
npx tsc -p tsconfig.app.json --noEmit
npx tsc -p tsconfig.spec.json --noEmit
npm run build -- --base-href /kana-study/
git diff --check
```

--client-v2-tests añade navegadores de prueba con servicios Angular reales, FSRS,
checkpoints y PostgreSQL/PostgREST/JWT sintético; los tokens siguen en Node. Hay una
cuenta sintética de frontera de cuota, nunca una cuenta externa. Los logs separan
33 grupos nativos, HTTP/JWT, SQL anterior y Playwright. La alteración de firma de la
fixture cambia bytes efectivos, evitando una variante equivalente de base64url.

Consulta de archivos: requiere transferId conocido, owner autenticado y hashes
verificados; no descubre todos los archivos, no fusiona ramas ni purga evidencia.
Retirar consentimiento bloquea nuevas subidas, no borra commits previos. Migración
de checkpoints V1 parciales, múltiples namespaces/solapamientos y reparación de
publicaciones legacy anteriores requieren decisiones explícitas; no forzar SQL.
Véase MANGA_DECKS_H4BD2.md. Gates false, Supabase Auth/gateway/CORS y dispositivos
físicos pendientes. No desplegar ni activar desde este documento.
