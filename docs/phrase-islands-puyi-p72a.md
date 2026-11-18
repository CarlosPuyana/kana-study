# Islas Puyi · P7.2A · Validación aislada

**Estado al 18 de noviembre de 2026** · Pasaron las pruebas de PostgreSQL y PostgREST nativos, el reproductor con un servicio de ensayo y las regresiones de la aplicación. La validación extremo a extremo queda pendiente de ejecutar con Supabase Auth y el servicio de objetos de Storage. P7.2B permanece pendiente.

## Entorno y alcance de la evidencia

| Capa | Entorno empleado | Evidencia |
| --- | --- | --- |
| Motor de datos y API REST | PostgreSQL 17.5 nativo y PostgREST 16.5, en procesos temporales limitados a `127.0.0.1` | Se aplicaron las dos migraciones P7.1 al clúster desechable. PostgREST evaluó los JWT y ejecutó contra PostgreSQL cada petición REST/RPC. |
| Identidades | UUID ficticios generados para cada ejecución; JWT de prueba firmados por el runner y verificados por PostgREST | RLS y las funciones evaluaron `sub`, `is_anonymous` y la membresía en base de datos. Emisión, confirmación, renovación y cierre de sesión de GoTrue quedan pendientes. |
| Storage en base de datos | Tablas de metadatos de ensayo `storage.objects` y `storage.buckets` con RLS, expuestas por el PostgREST temporal | Inserción y lectura autorizadas y denegadas según rol. Dos políticas permisivas de ensayo amplían deliberadamente los permisos de partida de esas tablas. |
| Reproducción integrada | Edge y WebKit de Windows, aplicación compilada, SDK real con respuestas HTTP simuladas y un MP3 público genérico | Se observaron las peticiones, la reproducción, el descarte de un MP3 que llegaba tarde y la limpieza al revocar. El servicio de objetos y la firma se simularon. |

En Windows, `docker`, `supabase` y `psql` no estaban en `PATH`. No había procesos de Docker Desktop ni acceso al canal local `docker_engine`, y `wsl --list --verbose` indicó que WSL no está instalado. El runtime previamente instalado en `.cache/h4a1-runtime` trae PostgreSQL y PostgREST. Supabase Auth y Storage necesitan una instalación independiente para completar el ensayo. Se usaron exclusivamente datos inventados y medios públicos genéricos en las pruebas. Los informes guardan casos y estados, sin tokens de sesión ni URLs firmadas.

## Seguridad comprobada

| Perfil | Catálogo, isla y bloque | Escritura y permisos | Metadatos por clave conocida |
| --- | --- | --- | --- |
| Propietario | Consulta el historial y los contextos de su isla. El catálogo enseña lo publicado. | Guarda borradores y publica, retira o vuelve a una revisión anterior con la revisión esperada. | Puede insertar la clave reservada por el borrador actual. La clave desconocida recibe `403` y repetir la existente recibe `409`. |
| Lectores 1, 2 y 3 | Ven las cinco frases y la pregunta publicada y su relación. Sin filas de contextos, entradas/objetos exclusivos del borrador ni acceso a `current_revision`. | `403` al editar, publicar, marcar aprobaciones directamente, asignarse rol o insertar un objeto. | Ven la clave de la revisión publicada. La del borrador produce `200 []`. |
| Cuenta ajena, administrador del mazo Puyi público y membresía sin verificar | Acceso `null`, catálogo `[]` e isla y bloque `null`, incluso con sus UUID. | `403` al publicar o insertar un objeto. | `200 []` al consultar el ID del audio o la clave. |
| Anónimo sin sesión | `401` en las RPC de acceso y bloque. | Sin permisos de escritura. | `200 []` por clave. |
| Auth anónima simulada | Acceso `null` incluso con la membresía de prueba activa, catálogo `[]` y bloque `null`. | `403` al publicar o insertar un objeto. | `200 []` por clave. |
| Cuenta revocada | Antes podía leer. Tras revocar el registro, el **mismo JWT** obtiene catálogo `[]` e isla y bloque `null` en nuevas peticiones. | `403` al publicar o insertar un objeto. | `200 []` por clave tras revocar. |

- El catálogo de PostgreSQL confirmó siete funciones `SECURITY DEFINER` con `search_path` vacío y propietario igual al rol que aplicó las migraciones en el ensayo. `PUBLIC` carece de `EXECUTE`. `authenticated` puede invocar las siete, sujetas a sus comprobaciones internas. `anon` solo puede invocar el predicado de Storage, que devuelve falso sin membresía. Las RPC del lector se ejecutan con sus permisos y RLS. Será necesario comparar el propietario y los grants efectivos del stack completo con estos resultados.
- Escritura y publicación comprueban el UUID de sesión, la membresía vigente y la revisión. Un hash cambiado en un activo existente y una relación con una frase inexistente abortaron toda la revisión. Publicar con metadatos de MP3 ausentes, un tamaño incorrecto o una aprobación pendiente falló. La base valida el formato y la inmutabilidad de la huella declarada, la identidad del activo y los metadatos de Storage. La comprobación de los bytes y la aprobación humana se hacen con el paquete editorial local y su SHA-256.
- Dos peticiones HTTP llegaron a esperar la misma fila al mismo tiempo, según `pg_blocking_pids`. Una guardó la revisión 3 y la otra recibió `puyi_conflict`. La publicación con un número de revisión antiguo falló. El rollback de 3 a 1 cambió la revisión que veía el lector. Retirar la publicación eliminó la lectura del bloque y el acceso por clave.
- Las guardas restrictivas bloquearon cambios y borrados de objetos privados y conservaron `public = false` pese a la política permisiva superpuesta. PostgREST puede devolver `204` para un `PATCH` o `DELETE` que RLS deja sin filas. Se verificó el estado posterior del objeto, la publicación y la visibilidad del bucket público de Puyi.
- Las capas ejecutadas no reprodujeron un fallo de autorización o reproducción que exigiera un cambio de producto. Los cambios de P7.2A se limitan a pruebas y documentación.

## Audio privado y URLs firmadas

| Comprobación | Resultado |
| --- | --- |
| Subir o descargar bytes por `/storage/v1/object`, acceso anónimo y endpoint público con clave conocida | Pendiente en el servicio real de Storage. Se comprobaron las políticas de sus filas de ensayo mediante PostgREST. |
| Reproducir al tocar y cancelar al revocar o cambiar de cuenta con la descarga retenida | Verificado en Edge y WebKit de Windows con respuestas simuladas. Tras el cambio de cuenta, desapareció el contenido anterior y ningún elemento inició la reproducción del MP3 retenido. |
| Blob y alternativa WebKit | Edge reprodujo por Blob. WebKit de Windows ensayó la petición de firma de 150 s si el Blob se rechaza. Su proceso multimedia recibió la muestra por HTTP local mediante una sustitución de prueba. Queda pendiente reproducir una URL entregada por el Storage real. |
| Enlace firmado antes y después de caducar, `Range` y `206`, CORS y caché | Pendientes en el servicio real. La prueba unitaria de renovación usa reloj simulado. |
| Bloque, Shadowing y Escucha continua | Probados con MP3 genéricos en la demo. Pendiente completar los tres modos con el mismo catálogo publicado por Supabase y descargado en una sesión Auth real. |
| iPhone 17 Pro con Safari y Lenovo con Chrome, especialmente con pantalla bloqueada | Pendientes en dispositivos físicos. WebKit de Windows no cubre el ciclo de suspensión de iOS. |

Un enlace firmado es una credencial al portador. Cerrar sesión, revocar la membresía o retirar la revisión impide pedir una firma nueva si RLS deniega el objeto en ese momento. Una firma entregada puede seguir funcionando, y los bytes que ya están en memoria o en caché pueden persistir. Los 150 s son la duración que solicita el reproductor y no un límite demostrado para otros clientes autorizados a firmar. Queda por medir con una petición nueva sin caché y con el servicio de producción equivalente. [Acceso de Storage y RLS](https://supabase.com/docs/guides/storage/security/access-control) · [Caché de archivos privados](https://supabase.com/kb/troubleshooting/storage-private-bucket-files-still-accessible-after-remove-access-or-logout)

## Completar el ensayo local

1. Habilitar un runtime Docker compatible y la CLI oficial de Supabase. En este PC, Docker Desktop requiere un backend compatible. Registrar las versiones de Docker y Supabase CLI y las imágenes de Auth, REST y Storage que arranque. Comprobar que `docker context inspect (docker context show) --format '{{.Endpoints.docker.Host}}'` señala el motor local de Windows y que `DOCKER_HOST`, si existe, también es local. [Guía de desarrollo local de Supabase](https://supabase.com/docs/guides/local-development/overview)
2. En una carpeta de ensayo **nueva** e ignorada por Git, ejecutar `supabase init --workdir <carpeta>` y usar `project_id = "kana-study-p72a"` en su configuración. Habilitar Auth anónima solo en esa configuración. Arrancar con `supabase start --workdir <carpeta>` antes de copiar las migraciones. Confirmar que aparece `supabase_db_kana-study-p72a` en `docker ps`, que las URLs del estado usan exactamente `127.0.0.1` y sus puertos locales, y que `supabase/.temp/project-ref` no existe en esa carpeta. Consultar las credenciales de desarrollo en privado y mantenerlas fuera de los informes. Copiar únicamente las dos migraciones P7.1 a `supabase/migrations/` de esa carpeta y ejecutar `supabase migration up --local --workdir <carpeta>`. En este flujo se usan el proyecto local y los contenedores recién creados. [Referencia de la CLI](https://supabase.com/docs/reference/cli/supabase-migration-up)
3. Usar `/auth/v1/admin/users` con la credencial de servicio **local** para crear las cuentas ficticias confirmadas de propietario, tres lectores, ajena y futura revocada. Iniciar sesión con `/auth/v1/token?grant_type=password` y verificar cada UUID mediante `/auth/v1/user`. Crear también la cuenta Auth anónima en `/auth/v1/signup`. Insertar las membresías activas únicamente en el clúster desechable mediante `docker exec -i supabase_db_kana-study-p72a psql -U postgres -d postgres -v ON_ERROR_STOP=1`, con los UUID que Auth acaba de emitir. Reservar las credenciales de servicio para preparar las cuentas. Las peticiones de prueba llevan la clave publicable local y el JWT de cada perfil.
4. Repetir la matriz REST y editorial con la isla ficticia de [la prueba nativa](../supabase/tests/puyi-private-http.mjs) como modelo. Para Storage, usar archivos de `public/audio/phrase-islands/v1/` y registrar el tamaño y SHA-256 de sus bytes reales en los activos. Guardar la revisión vía RPC, subir los MP3 con el JWT del propietario a sus claves reservadas, verificar el hash al descargar y publicar con aprobaciones de ensayo. Repetir los rechazos de lectores, roles, UUID y claves conocidas, el conflicto concurrente y el rollback. Comprobar el endpoint `/storage/v1/object/public/...` además del autenticado y el de firma.
5. Pedir una firma corta y reproducir o descargar antes de caducar. Usar `Range: bytes=0-1` en una URL firmada y comprobar si devuelve `206`, `Content-Range`, MIME y los dos bytes correctos. Hacer una petición nueva con caché desactivada tras la caducidad. En ensayos separados, cerrar sesión y revocar la membresía mientras queda vigente un enlace previamente emitido. Registrar acceso residual y comprobar el rechazo de una nueva descarga o firma cuando corresponda. Conservar únicamente estados, tiempos y cabeceras sin credenciales.
6. Ejecutar el flujo de navegador contra ese mismo stack y la vista privada. La configuración pública de Angular acepta hosts HTTPS `*.supabase.co`. Para el ensayo integral hace falta una compilación temporal que acepte **solo** la dirección de loopback verificada, servida localmente y con la clave publicable de ensayo en tiempo de ejecución. Al completar esta comprobación, usar las respuestas reales del sistema local, incluidos el MP3 y la URL que recibe el proceso multimedia en WebKit. Iniciar, pausar y detener un bloque, hacer Shadowing y Escucha continua, cambiar de cuenta con una descarga retenida y revocar una sesión activa. Usar latencia inducida para la descarga sin sustituir su resultado. Mantener esta configuración de ensayo fuera de los builds públicos.

## Regresiones y artefactos públicos

| Ejecución | Resultado |
| --- | --- |
| `node scripts/test-puyi-native.mjs --private-islands` | 17 casos SQL del mazo, 6 casos HTTP del mazo y 7 casos HTTP privados. Comprobaciones separadas de ACL y concurrencia nativa del mazo. Evidencia en `.cache/phrase-islands-puyi-p72a/native.log`. |
| `node --test supabase/tests/puyi-private-contract.mjs` y `node scripts/test-puyi-sql.mjs` | Seis escenarios privados agrupados en un test padre y 17 escenarios del mazo en PGlite. |
| Playwright `playwright.puyi-private.config.ts` | 8 casos en Edge y WebKit con API simulada, incluido cambio de cuenta durante la descarga. |
| Playwright Mazo Puyi (`node scripts/test-puyi-native.mjs --private-islands --browser`) | 3 casos con PostgREST nativo, Auth e imágenes simulados. Los metadatos de imágenes pasan por PostgREST. |
| Playwright `playwright.puyi-demo.config.ts` | 36 casos de biblioteca, secuencia real, Shadowing, Escucha continua, clic en tarjeta y editor P6. |
| Playwright Islas generales y recuperación Undo | 14 casos de Islas generales en `mobile-dark` y 15 de FSRS/Undo en `desktop-es-dark`. |
| Editor y publicación Node · `editor.test.mjs`, `publication.test.mjs` | 9 casos, incluida integridad del paquete ficticio y límites del servidor local. |
| `npm test` | 3.617 tests en 291 archivos, incluidos FSRS, Undo, Auth, workspaces y sincronización local con dobles de prueba. |
| `npm run build` y `npm run build:manga-candidate` | **708.406 bytes iniciales** en el build normal y **709.288** en el candidato Pages, ambos por debajo de 750.000. La ruta privada quedó en carga diferida. Persisten avisos preexistentes de presupuesto SCSS por componente. |
| Auditoría de privacidad y de Islas generales | Se analizaron los grafos y 4.015 archivos de texto de ambos builds. Cero coincidencias con los marcadores de contenido privado o de ensayo y sin entradas de demo/editor en el grafo. El directorio de audio de Islas generales contiene sus 36 MP3 públicos, cuyos SHA-256 verificó `node scripts/test-phrase-islands-i3.mjs`. Evidencia en `.cache/phrase-islands-puyi-p72a/privacy.json`. |

## Puertas de P7.2B y aprobaciones

- [ ] Cerrar P7.2A con Auth y Storage reales en un entorno aislado. Confirmar RLS, firma, expiración y Range. Registrar revocación y el recorrido completo de reproducción. Si el acceso residual de las firmas no es aceptable, acordar el transporte antes de publicar.
- [ ] Aprobar explícitamente el proyecto de producción y la aplicación de las **dos migraciones**, con copia de seguridad, revisión de políticas vigentes y procedimiento de vuelta atrás.
- [ ] Autorizar por separado la asignación de membresías a los UUID previamente verificados del propietario y de los tres lectores. Mantener esa relación fuera del repositorio.
- [ ] Aprobar el paquete exacto que se va a subir, con texto y audio aceptados y SHA-256 verificados. Autorizar la subida al bucket privado y después la publicación de esa revisión concreta. Un rollback necesita confirmar la revisión de destino.
- [ ] Autorizar el despliegue web cuando correspondan las comprobaciones anteriores. Validar iPhone y Lenovo en HTTPS y registrar reproducción, suspensión y parada antes de dar por verificada la continuidad con pantalla bloqueada.

P7.2A no ejecutó operaciones en Supabase de producción y no hubo commit, push ni despliegue.
