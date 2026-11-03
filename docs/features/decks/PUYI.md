# Mazo Puyi

Implementación del 3 de noviembre de 2026, preparada para publicación autorizada por el propietario. Base Git: `f92a2d846bdb530eac6c0bada3d5ab6115415050`. Se conserva el workflow existente de GitHub Pages: push a `main`, build `production,manga-candidate`, artefacto `dist/kana-study-candidate/browser`. La revisión comprende únicamente Puyi; no incluye credenciales ni el UUID real del administrador.

## Recorrido

Mazos incluye **Mazo Puyi** para Guest y cuentas autenticadas, con los enlaces existentes a estudio, palabras, estadísticas y ajustes. Sin configuración Supabase aparece vacío; Ajustes explica la falta de configuración. Un error remoto se comunica y no impide usar Japanese 1500. No se crean palabras de demostración ni se inventa contenido.

El contenido procede de `puyi_cards`; las fotografías de un bucket dedicado. El catálogo se consulta al entrar/actualizar Mazos y al cargar una ruta de Puyi. No hay suscripción realtime ni descarga de todas las imágenes. La actualización publica contenido para todos sin recrear el mazo; los límites diarios de SCHEDULER-1 siguen vigentes. Para introducir más tarjetas tras cerrar el día se conserva el ajuste existente de nuevas para hoy.

Estudio usa `DeckStudyService`, `DeckSchedulerService` y `ts-fsrs`, con las mismas calificaciones y reglas. No hay un segundo scheduler. Las entradas tienen ID `puyi-<UUID>` y mazo `mazo-puyi`. Una edición no cambia ese ID. El progreso, ajustes, diario y eventos siguen en los almacenes existentes, separados por Guest/cuenta. Guest es local a cada perfil de navegador, no una identidad remota. Las cuentas utilizan la sincronización legacy privada existente cuando esté configurada; no se activa cloud custom ni upload custom.

El anverso no muestra significado, traducción ni foto. El reverso conserva palabra, kana, ejemplo y el control existente para revelar su traducción; carga la foto solo cuando corresponde y puede seguir estudiándose si falla. No se inventa furigana por carácter, audio ni frecuencia. ES/EN/CA localizan la interfaz; el contenido introducido permanece en japonés y español.

Las estadísticas por mazo y las dificultades del resumen diario funcionan con los eventos existentes. La página global **Mis débiles** no consume eventos de mazos (tampoco los de Japanese 1500); no se le añade una conversión artificial. Las dificultades del resumen permiten la práctica continua existente.

## Modelo y autorización real

Migración aditiva: `supabase/migrations/202611030001_puyi_public_deck.sql`. No se modifican las migraciones anteriores ni sus políticas, índices o datos.

- `puyi_administrator`: un único UUID de `auth.users`, sin permiso de lectura/escritura para clientes. Vacío por defecto.
- `puyi_cards`: cinco campos obligatorios, UUID estable, orden monotónico, autor, timestamps, versión CAS, referencia de imagen y `deleted_at`.
- `puyi_media`: reservas y cola duradera de limpieza, sin almacenar bytes/base64 en las filas.
- Lectura pública de tarjetas activas mediante RLS para `anon`/`authenticated`. INSERT/UPDATE/DELETE directos revocados. `puyi_save_card` y RPC de imágenes comprueban `auth.role()='authenticated'`, `auth.uid()` y la asignación confiable en cada escritura.
- No hay isAdmin enviado por el navegador, clave administrativa, email/nombre como autorización ni asignación desde preferencias. La consulta `is_puyi_admin()` solo decide la presentación; falsificarla en Angular no evita los controles SQL.
- RPC de edición con versión esperada; conflictos de otra pestaña se rechazan. Misma UUID y contenido tras una respuesta perdida no duplica la creación. La detección de duplicado palabra/kana ocurre en el servidor, serializada; admite confirmación explícita para homógrafos legítimos.
- Borrado lógico, sin reutilizar ni resucitar UUID. Se retira la foto y se excluye la palabra de colas activas; eventos y snapshots históricos no se eliminan. Las estadísticas de estado cuentan tarjetas activas y las métricas históricas conservan eventos anteriores.

Límites por puntos Unicode: palabra/kana 200, significado 1.000, ejemplo/traducción 2.000; kana hiragana/katakana, sin campos vacíos ni controles/saltos de línea. Payload JSONB hasta 30.000 bytes y máximo 10.000 tarjetas activas. Las entradas máximas aceptadas localmente caben en el contrato SQL; no se interpreta HTML introducido.

## Activación manual por el propietario

1. Usar primero un proyecto Supabase aislado autorizado. Aplicar las migraciones legacy necesarias y esta migración nueva mediante administración confiable, con copia de seguridad y revisión habitual. Requiere el esquema **Supabase Storage**; un PostgreSQL vacío no proporciona por sí solo el servicio de archivos.
2. En Supabase Dashboard → **Authentication → Users**, localizar la cuenta real del propietario y copiar su **User UID**, verificando la identidad. Es el UUID de `auth.users.id`, no el nombre público ni un token. No hay UUID real configurado en el repositorio.
3. En SQL Editor del proyecto correcto, sustituir el marcador y ejecutar únicamente tras autorización:

```sql
insert into public.puyi_administrator(singleton,user_id)
values (true,'<UUID_VERIFICADO_DE_AUTH_USERS>'::uuid);
```

La restricción permite una sola cuenta. Para sustituirla, actualizar esa fila desde administración confiable; para revocar, eliminar únicamente esa asignación. No borrar tarjetas ni historiales. Los clientes no pueden cambiarla. Verificación confiable:

```sql
select singleton,user_id from public.puyi_administrator;
```

4. Mantener el mecanismo público existente de `supabase-config.js` con URL y publishable key del mismo proyecto. No introducir service_role ni secretos en frontend/GitHub. No es necesario cambiar los gates de Manga/cloud custom.
5. Iniciar sesión y abrir **Mazos → Mazo Puyi → Ajustes → Administración del mazo**. Crear/editar con el mismo modal, buscar por palabra/kana/significado y confirmar eliminaciones. Probar también Guest y una segunda cuenta con llamadas directas rechazadas.

El propietario confirma haber aplicado la migración, asignado su UUID y aceptado manualmente el funcionamiento local. Codex no repite la migración ni modifica esa asignación. En la comprobación remota previa a publicar, la lectura pública devuelve HTTP 200 y **0 tarjetas**, `is_puyi_admin()` devuelve false para anónimos y la RPC de escritura rechaza al anónimo con HTTP 401 / `42501`. La configuración pública de Pages corresponde al mismo proyecto Supabase. No hay una fotografía real disponible que comprobar mientras el mazo siga vacío. Estos resultados no sustituyen una comprobación autenticada del propietario en producción.

## Fotografías e integridad

Bucket público `puyi-images`, máximo **2 MiB** por objeto, MIME JPEG/PNG/WebP. Cliente comprueba firma, decodificación y máximo 16 megapíxeles antes de guardar. El bucket y la RPC comprueban tipo/tamaño; las rutas son UUID inmutables con extensión. Sin URLs arbitrarias, SVG, overwrite ni base64 en PostgreSQL. El límite de píxeles es una validación del formulario; no se afirma una inspección binaria completa en SQL.

Se reserva la ruta → se sube con la sesión del propietario → la RPC adjunta una imagen ya subida al publicar la tarjeta. Sustituir/eliminar retira la imagen anterior. Si falla, se solicita descartar la reserva; una respuesta perdida **no** puede borrar una foto que el servidor ya adjuntó. Un estado `retired` no puede reutilizarse en una tarjeta. Las políticas restrictivas de Storage limitan también políticas permisivas generales ajenas al bucket.

Los bytes se borran por **Storage API**, nunca mediante DELETE SQL sobre `storage.objects`, como exige el [diseño de Storage](https://supabase.com/docs/guides/storage/schema/design). El bucket público permite servir imágenes a lectores; las escrituras siguen protegidas por [Storage RLS](https://supabase.com/docs/guides/storage/security/access-control).

La limpieza recupera reservas de más de una hora y fotos retiradas al visitar administración o después de guardar/eliminar. Fallos de red dejan la tarea persistida y visible con botón de reintento. No existe un recolector automático en servidor: si se abandona el navegador indefinidamente, la limpieza requiere otra visita del administrador. Cada ejecución procesa hasta 100 rutas; el botón permite drenar lotes adicionales. La caché HTTP pública puede conservar una copia ya descargada tras retirar una foto; no es almacenamiento confidencial.

## Arquitectura y archivos

- `core/models/puyi.model.ts`: definición, límites, validación y adaptación a la entrada de estudio existente.
- `core/services/puyi.service.ts`: lectura paginada, permiso de presentación ligado a la identidad, RPC, subidas y limpieza.
- Catálogo, recurso de ruta y router de persistencia: tercer tipo `public`, refresco de contenido y filtrado de palabras retiradas con fence de workspace. La revisión pública es independiente de la revisión custom y no invalida la proyección léxica. La consulta pública se ejecuta en segundo plano, con plazo por petición, sin bloquear el catálogo local. No cambian algoritmos FSRS ni almacenes.
- `features/puyi/puyi-admin.{ts,html,scss}`: administración integrada en Ajustes, formulario único, vista previa, validación, duplicados, busy/errores, advertencia de cambios sin guardar y diálogo nativo con foco/teclado.
- `shared/components/public-deck-image`: presentación sin espacio vacío tras fallo; usada en estudio, detalle y práctica continua.
- Páginas existentes de catálogo, ajustes, palabras y estudio: integración mediante sus rutas actuales.
- ES/EN/CA JSON y generador de traducciones: dominio Puyi diferido. `TranslationService` conserva todos los dominios de estudio cargados, sin sobreescribirlos al cambiar de flujo.
- `puyi.spec.ts`, contrato SQL, runners PGlite/PostgreSQL/PostgREST y `manual-tests/puyi`: pruebas del nuevo circuito; expectativas del catálogo público actualizadas en dos pruebas existentes.

## Validación

Logs, bases de prueba desechables y capturas ignorados en `.cache/puyi/`.

| Comprobación | Resultado real | Log en `.cache/puyi/` |
| --- | --- | --- |
| Unitarios Puyi | 15/15 | `unit-final.log` |
| Puyi + proyección léxica | 28/28 | `scopes-final.log` |
| Suite Angular final, dos procesos independientes | 2278/2278 en ambas ejecuciones, 221 archivos | `full-closed.log`, `full-repeat.log` |
| Contrato PGlite | 17/17 | `sql-closed.log` |
| Contrato PostgreSQL nativo | 17/17 | `browser-native-closed.log` |
| HTTP directo PostgREST, JWT firmados y rechazados | 6/6 | `browser-native-closed.log` |
| Concurrencia nativa entre dos conexiones | 1/1: bloqueo observado y CAS rechaza al perdedor | `browser-native-closed.log` |
| Chromium Puyi integrado: ES oscuro, EN claro, CA Nora a 320 px | 3/3 | `browser-native-closed.log` |
| Regresión Japanese 1500/práctica/audio/persistencia | 66/66 | `mazos-closed.log` |
| Regresión Manga Guest-only | 3/3 | `manga-closed.log` |
| TypeScript app/spec | Correcto | `ts-app-closed.log`, `ts-spec-closed.log` |
| Build normal y candidato Pages | Correctos; solo cuatro warnings SCSS conocidos de Grammar | `build-normal-closed.log`, `build-candidate-closed.log` |
| Auditorías medios y límites de Mazos | Correctas | `media-closed.log`, `boundaries-closed.log` |
| Documentación: enlaces y alcance actual | Correcto (`--links-only`) | `docs-closed.log` |
| `git diff --check` | Correcto; índice vacío, HEAD inicial intacto | `diff-check.log` |

Inicial normal **747.056 bytes**; candidato **747.942 bytes**, margen **2.058 bytes** frente a 750.000. Los medios r2 y el worker siguen diferidos e intactos. Total generado normal 150.009.325 bytes; candidato 150.009.115 bytes.

Se corrigieron regresiones detectadas durante la integración: el primer await de red retrasaba la captura A→B→A del catálogo custom; se restauró su captura síncrona. Después, la revisión pública compartida podía invalidar una lectura léxica en curso; se separaron los contadores y se añadió regresión. Se actualizaron las expectativas que suponían un solo mazo público, manteniendo las comprobaciones de restricción custom, persistencia, FSRS y ausencia de solicitudes cloud custom. Los primeros fallos de navegador fueron fixtures: selector que incluía el título de la vista previa, cabeceras multipart/JSON duplicadas y aserción de traducción sin abrir su control. No se añadieron reintentos ni esperas arbitrarias.

El audit completo de REPO-HYGIENE no es una auditoría de este hito: compara con un HEAD histórico (`0979315`) y falla al ejecutarlo hoy. Su modo existente `--links-only` valida los enlaces actuales y los renombres preservados; no se modificó el script ni su inventario histórico.

Capturas revisadas: [modal ES escritorio](../../../.cache/puyi/editor-desktop-dark-es.png), [modal EN claro móvil](../../../.cache/puyi/editor-mobile-light-en.png), [modal CA Nora a 320 px](../../../.cache/puyi/editor-narrow-ca-nora.png), [estadísticas ES](../../../.cache/puyi/stats-desktop-dark-es.png). El modal mantiene Cerrar/Guardar visibles y desplaza únicamente los campos/vista previa.

Reproducción (runtimes SQL locales preexistentes de H4A/H4A.1 en `.cache/h4a-sql-runtime` y `.cache/h4a1-runtime`; no se añaden dependencias al producto):

```sh
npm test -- --include='src/app/core/services/puyi.spec.ts' --include='src/app/core/services/lexical-knowledge-projection.spec.ts'
node scripts/test-puyi-sql.mjs
npm test
npx tsc -p tsconfig.app.json --noEmit
npx tsc -p tsconfig.spec.json --noEmit
npm run build -- --base-href /kana-study/ --stats-json
npm run build:manga-candidate
node scripts/test-puyi-native.mjs --browser
npx playwright test --config=playwright.mazos-roadmap.config.ts
npm run test:manga-candidate
node scripts/audit-kaishi-media.mjs
node scripts/audit-local-deck-boundaries.mjs
node scripts/audit-repo-docs.mjs --links-only
git diff --check
```

Los runners SQL/HTTP crean datos sintéticos y solo usan loopback. La matriz Chromium sirve el candidato optimizado con `/kana-study/`, usa PostgreSQL/PostgREST y JWT firmados reales para las escrituras editoriales. **Supabase Auth está controlado por un fixture**, no es el gateway real de Supabase. El servicio de objetos de imágenes es un fixture; sus metadatos sí pasan por las políticas Storage reales del PostgreSQL local. No se sustituye esa limitación por una afirmación de validación de Supabase.

Pendientes de automatización en producción: login y operaciones autenticadas del administrador/otra cuenta, una palabra y fotografía reales, Safari/iOS, dispositivos físicos y lector de pantalla. La aceptación local del propietario está completada. Sin comando lint configurado en este repositorio; no se añade una herramienta distinta para simularlo. La publicación autorizada no despliega SQL ni cambia autenticación, gates o credenciales.

## Revisión de publicación

Se ejecutan de nuevo suite Angular, TypeScript app/spec, ambos builds y los escenarios nativos/Chromium de Puyi antes del commit. La prueba de subida anónima real se limita al rechazo de un formato no permitido: no demuestra por sí sola las políticas RLS de Storage. Los permisos de escritura Storage y usuarios autenticados se validan automáticamente en el backend local aislado; la comprobación real completa requiere una sesión autorizada. No se crean palabras, fotos ni usuarios de prueba en producción. Logs y manifiesto de los 41 archivos revisados: `.cache/puyi-publish/` (ignorados por Git).
