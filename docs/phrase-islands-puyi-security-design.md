# Islas Puyi — P0: datos y acceso privado

18/11/2026. **Diseño sin SQL, tablas creadas, comprobación de UUID reales ni concesión de permisos.** El prototipo solo sirve muestras genéricas ya públicas. No debe conectarse a datos personales hasta validar el servidor.

## Arquitectura existente que reutilizar

`AuthService` usa Supabase Auth, usuario de sesión y cambios de identidad; `SupabaseClientService` inicializa el SDK con clave pública publicable, persistencia/refresco de sesión y detección del retorno de Auth. `WorkspaceService.activationRevision` permite invalidar trabajo asíncrono al cambiar cuenta. Reutilizar esos servicios y el flujo de login; no crear otro sistema de contraseñas.

`PuyiService`/migración `202611030001_puyi_public_deck.sql` usan `is_puyi_admin()` y una asignación singleton por UUID, RPC con autorización de servidor y revisiones esperadas. **Sus tarjetas se leen públicamente y `puyi-images` es público.** Ni ese bucket, ni los permisos de lectura actuales, ni los assets de Islas generales son apropiados para textos/audio personales. La administración existente tampoco demuestra que su UUID sea el propietario de este módulo: no se ha leído esa asignación desplegada.

GitHub Pages seguirá sirviendo la carcasa Angular, nunca el catálogo privado ni sus MP3. Supabase ya disponible servirá contenido autorizado y Storage privado. Una futura ampliación de datos/RLS está justificada por este requisito privado; no se aplica en P0/P1.

## Modelo propuesto y revisiones

Tipos de referencia en `experiments/phrase-islands-puyi-p1/puyi-island.model.ts`. Propuesta de entidades relacionales futuras:

| Entidad | Datos/relaciones | Lectura futura |
| --- | --- | --- |
| `puyi_islands_members` | UUID Auth verificado, rol propietario/lector, estado de revocación | Cada cuenta conoce solo su concesión; gestión fuera del cliente. |
| `puyi_islands` | UUID, título JA/traducido, descripción, posición y revisión | Miembros, solo contenido revisado; propietario puede revisar borradores. |
| `puyi_blocks` | FK isla, nombre, posición/revisión, práctica opcional | Mismo ámbito que isla; no cantidades fijas. |
| `puyi_phrases` | FK bloque, japonés/lectura/furigana, traducciones, explicación/vocabulario, registro, posición, revisión, referencia audio/contexto | Miembros para versiones revisadas. |
| `puyi_prompts` | FK bloque, pregunta/lectura/traducción, revisión/audio | Miembros para versiones revisadas. |
| `puyi_prompt_answers` | FK pregunta y frase, orden | Validar que ambas pertenecen al ámbito autorizado. |
| `puyi_original_contexts` | Fuente original privada y revisión | Propietario; el lector recibe el contexto curado necesario, no todo el historial. |
| `puyi_audio_assets` | ID, destino frase **o** pregunta, revisión, object key opaca, voz/motor/modelo, hash/duración/bytes/MIME, fingerprint/procedencia | Referencias de medios revisados; URL firmada no persistida. |

FKs, unicidad de posición/ID donde corresponda, UUID real, revisiones esperadas y XOR frase/pregunta se validarán en servidor. Los arrays de IDs del contrato son DTO de lectura, no otra fuente de relaciones. No permitir que IDs de otra isla, object keys arbitrarias o revisiones incompatibles entren desde un JSON. Una pregunta conserva relaciones a varias respuestas; un audio pertenece a frase/pregunta, no a los minutos de sesión.

Guardar borrador no aprueba japonés/audio. Revisar texto/lectura antes de sintetizar; no limitar el vocabulario a N5. Generar localmente con AivisSpeech 1.2.0/Aida Shigeru normal reutilizando primitivas verificadas de I6.2, pero con **destino privado independiente**. Nunca llamar al publicador I3 para estos datos ni añadirlos a los sidecars públicos.

Cambio solo de traducción: nueva revisión editorial, posible reutilización del audio si texto/lectura/síntesis conservan fingerprint. Cambio japonés/lectura/síntesis: audio/revisión nuevos, ruta inmutable y originales conservados. Subir MP3 revisados al bucket privado; WAV, consulta, notas y conversaciones permanecen en el archivo local privado/backup. La base conserva referencias e historial; actualizar no sobrescribe un MP3 diferente bajo la misma key.

## Cuatro cuentas y verificación de identidad

Un propietario administrador y tres lectores: **todos sus UUID están pendientes de verificación**. La asignación nominal pedida se mantiene solo en el archivo local privado `membership-request.json`; no se añade a assets o código público. No se buscan coincidencias por nombre/email de visualización ni se inventan UUID.

Procedimiento futuro de confianza: el operador autorizado verifica los registros reales de Auth en administración de Supabase y la titularidad de cada cuenta, confirma el UUID exacto con cada destinatario y registra la aprobación por canal privado. No usar `profiles.display_name`, metadatos editables, un workspace o un parámetro `userId` enviado por Angular como autoridad. El alta/revocación de membresías no se concede al navegador. No hace falta una service-role en el cliente.

La autorización futura debe ser **fail closed**: JWT válido, `auth.uid()` presente, sesión no anónima y membresía activa por ese UUID. [Una cuenta de Auth anónima](https://supabase.com/docs/guides/auth/auth-anonymous) puede tener rol `authenticated`; no basta comprobar ese rol. Rechazar también `is_anonymous` y no crear membresías para usuarios anónimos. La pertenencia se consulta en tabla de servidor para no depender de claims de rol obsoletos en un JWT de larga vida.

| Actor | Leer revisados | Descargar medios nuevos | Editar/revisar | Cambiar miembros |
| --- | --- | --- | --- | --- |
| Propietario verificado y activo | Sí | Sí | Sí, RPC con CAS/revisión | Solo procedimiento de administración de confianza. |
| Cada uno de los tres lectores verificados | Sí | Sí | No | No |
| Sin sesión, Auth anónima, otra cuenta o revocada | No | No | No | No |

## RLS de textos y objetos: contrato verificable futuro

Activar RLS en **todas** las tablas privadas, sin políticas públicas de lectura. SELECT requiere membresía y estado revisado, o permiso del propietario para borradores. RPC de escritura vuelven a comprobar propietario/membresía y revisión; no confiar en `approved`, `owner`, rol o UUID del payload. Revocar escrituras directas del cliente cuando la operación necesite validación transaccional. Helpers de seguridad con `search_path` cerrado, acceso mínimo y sin parámetro que permita suplantar usuario; evitar recursión de políticas de miembros.

Bucket propuesto `puyi-islands-private`, `public=false`; keys opacas como `island-uuid/audio-uuid/r1-hash.mp3`, sin nombres personales ni títulos de conversaciones. SELECT del objeto requiere una referencia de asset autorizada/revisada **y** miembro activo; no basta pertenecer a cualquier cuenta autenticada o ser dueño del upload. Los lectores comparten la biblioteca autorizada, no el prefijo de sus propios uploads. INSERT/DELETE solo propietario y flujo editorial controlado; no upsert/UPDATE de objetos ya referenciados.

Auditar políticas Storage existentes: las políticas permisivas se combinan con OR, por lo que una política amplia ajena podría eludir la específica. Diseñar guardas restrictivas limitadas a este bucket, preservando los demás, y probar lectura/listado/upload/delete de cada actor. Las comprobaciones de nombres y tipos del cliente son ayuda, **no seguridad**. Ninguna de estas políticas se ha ejecutado aquí.

## URLs, expiración, Range y revocación

[Buckets privados](https://supabase.com/docs/guides/storage/buckets/fundamentals) y [RLS Storage](https://supabase.com/docs/guides/storage/security/access-control): la descarga requiere autorización o URL firmada. `<audio src>` no adjunta por sí solo un header Authorization arbitrario; las opciones son URL firmada corta o fetch autenticado → Blob temporal. La precarga de P1 ensaya este segundo transporte con muestras genéricas, sin JWT.

Una URL firmada es un **bearer**: quien la copie puede usarla mientras sea válida. Comprobar miembro al firmar no vuelve a comprobarlo mágicamente en cada reproducción. [La documentación de caché/revocación](https://supabase.com/kb/troubleshooting/storage-private-bucket-files-still-accessible-after-remove-access-or-logout) advierte además que logout/revocación no borra bytes ya descargados. No prometer DRM ni revocación de copias locales.

Propuesta inicial a validar: firmar solo los clips necesarios con TTL corto y metadatos `cacheControl` reducido; renovar al acercarse la caducidad y revalidar al reanudar. Si Safari suspende JS no puede renovar, por lo que una sesión de 30 minutos necesita una decisión explícita entre lease suficiente, URLs renovables o bytes precargados en memoria. Una pausa manual no prolonga la caducidad de la URL. No convertir silenciosamente en público para resolver un 403.

Prefetch/Blob: acotar a actual+siguiente y un presupuesto de bytes, usar AbortController en la implementación futura, descartar descargas antiguas y revocar Blob URLs al salir/cambiar usuario. No guardar texto/MP3 privados en Cache Storage, localStorage, IndexedDB ni service worker en P0/P1. Logout, revocación detectada o cambio de identidad: detener audio, cancelar pendientes, limpiar memoria, URLs y metadatos de pantalla bloqueada. Lo que ya oyó/descargó una persona autorizada no puede retirarse retrospectivamente.

[Smart CDN](https://supabase.com/docs/guides/storage/cdn/smart-cdn) distingue tokens, caché y endpoints autenticados. Para revocación inmediata de **nuevas solicitudes** podría justificarse un endpoint de confianza que compruebe sesión/membresía y gestione Range con `private, no-store`; no está implementado ni es necesario contratar un servicio nuevo ahora. [URL signing keys](https://supabase.com/docs/guides/storage/security/signing-keys): rotar no equivale por sí solo a revocar la clave anterior; revocarla es una operación amplia, no un logout individual. La página completa no fue recuperable durante esta investigación; se contrastaron el resultado oficial indexado y la guía oficial de descargas. Confirmar esa operación en el proyecto antes de usarla.

Para iOS se deberán verificar HEAD/GET, `Range: bytes=0-1`, rangos abiertos/sufijos, 206/Content-Range/MIME/tamaño, expiración a mitad de lectura y nuevas peticiones tras revocar. **El laboratorio local sí implementa y prueba Range; no se ha probado un bucket privado Supabase real ni URLs firmadas reales.** TLS/CORS de la URL real también forman parte de P2/P7.

## Matriz de aceptación de seguridad pendiente

Probar con identidades reales de ensayo verificadas, sin utilizar datos personales como fixture:

1. Anónimo sin JWT, Auth anónima y cuenta ajena: no lista ni texto ni assets, ni puede firmar/descargar por UUID/key conocido.
2. Tres lectores: solo lectura revisada, sin borradores/contexto bruto ni INSERT/UPDATE/DELETE/RPC administrativa.
3. Propietario: escritura válida y conflictos CAS; un ID de pregunta/bloque ajeno, aprobación falsa, path externo o hash incorrecto se rechaza.
4. Revocado: nueva lectura/firma denegada; medir acceso residual por URL/cache previamente entregada y contrastarlo con TTL documentado.
5. Storage: endpoint público denegado, listado bloqueado según rol, políticas amplias no eluden el bucket; validar Range/expiración.
6. Cambio A→B/logout durante fetch/play: no se muestra ni reproduce la respuesta tardía de A. Inspeccionar artefacto Pages/red/logs por textos, tokens o medios privados.

Todos estos casos de servidor están **pendientes**, porque en esta fase no se aplica SQL ni se conceden permisos. El laboratorio no simula que un botón o una lista JavaScript protegen una biblioteca privada.

## Coste y mantenimiento

Reutilizar Supabase existente y Aivis local; no hay nuevos servicios de pago ni recursos remotos creados. El espacio/egreso real depende del plan y cuotas restantes del proyecto, no comprobados. Los textos son pequeños; MP3 y retención de revisiones dominan. Véanse cifras medidas y fórmulas en investigación. Mantener backup privado de conversaciones/másteres y política explícita de retención; no asumir que el backup de base de datos incluye bytes de Storage. Las revisiones y rollback no alteran FSRS, Undo ni sincronización existentes.
