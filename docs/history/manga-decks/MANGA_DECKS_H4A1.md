# Manga × Mazos — Hito 4A.1: validación nativa y HTTP

Fecha: 22/10/2026. **Resultado parcial: concurrencia PostgreSQL y JWT/PostgREST validados; Supabase Auth sigue pendiente. H4A.1 no se declara completamente cerrado. No se inicia H4B.**

El usuario confirmó que no existe un entorno Supabase aislado autorizado y pidió documentar Supabase Auth como pendiente. No se usaron credenciales ni datos productivos y no se desplegó ninguna migración remota.

## Recuperación y cambios

Se ejecutó `git status` antes de editar y se revisaron H4A, DESIGN, SETUP, repositorio, contratos, migración y tests. `.cache/h4a1-baseline.json` registra SHA256 de los 1466 archivos versionados o no ignorados existentes al empezar. Se conserva el trabajo previo sin reset, clean ni checkout.

No se cambian SQL, contratos productivos, FSRS, Japanese 1500, Stats V2, Manga Saved FSRS ni gates. Se añaden:

- `scripts/test-custom-decks-native.mjs`: clúster aislado, barreras multisesión y HTTP/JWT.
- `supabase/tests/native-pg-adapter.mjs`: adapta los 23 escenarios existentes a otra base nativa del mismo clúster de prueba.
- Este informe.

Se modifica solo la etiqueta de entorno del runner anterior `scripts/test-custom-decks-sql.mjs`, para distinguir PGlite y PostgreSQL nativo. Se actualizan H4A, DESIGN y SETUP con resultados y pendientes. No hay funcionalidad H4B.

## Entorno exacto y aislamiento

No estaban disponibles psql, postgres, pg_ctl, initdb, Docker ni Supabase CLI en PATH. No se localizaron instalaciones en directorios habituales, servicios PostgreSQL/Docker ni listeners en los puertos habituales comprobados. `wsl --list --quiet` informó que WSL no está instalado. No se instaló un servicio del sistema, Docker ni WSL.

Se prepararon binarios portátiles solo en `.cache/h4a1-runtime`, ignorada por Git:

| Componente | Versión ejecutada |
| --- | --- |
| Sistema | Windows x64 |
| Node | 24.21.0 |
| PostgreSQL nativo | 17.5, x86_64-windows, compilado por msvc-19.43.34808, 64-bit |
| Distribución del binario | `embedded-postgres@17.5.0-beta.15`, paquete windows-x64 |
| Cliente node-postgres | 8.16.3 |
| PostgREST | 16.5, binario oficial Windows x86-64 |
| PGlite de regresión | 0.3.14 |

El runner ejecuta initdb con SCRAM, UTF-8 y locale C, arranca postgres únicamente en 127.0.0.1 y crea un directorio nuevo y dos bases sintéticas por ejecución. No acepta una URL de base externa. Se aplican las cinco migraciones anteriores y H4A a esas bases vacías. Los roles y usuarios A/B existen solo dentro del clúster temporal.

PostgREST escucha también únicamente en loopback. Su autenticador es LOGIN NOINHERIT, sin superuser/BYPASSRLS, miembro de anon/authenticated; no es el administrador PostgreSQL. El secreto HS256 y la contraseña se generan aleatoriamente en memoria en cada ejecución; no se versionan ni se imprimen, ni se usa service_role. El archivo de contraseña initdb se elimina. La configuración de PostgREST no contiene secretos: se transmiten al proceso por entorno. Los procesos se detienen al terminar; datos sintéticos, resultados y logs redactados permanecen en caché para inspección, sin limpieza destructiva del repositorio.

## Concurrencia nativa: 16 pruebas y 15 solapamientos por ejecución

Cada carrera usa dos conexiones con PID distintos y transacciones explícitas. La primera ejecuta la operación y retiene el commit. La segunda entra en la RPC y el observador espera hasta que `pg_blocking_pids(segundo_pid)` contiene al primer PID. Solo entonces libera el commit. Esta barrera demuestra solapamiento real en PostgreSQL, no simultaneidad aparente sobre una sola conexión.

Se repiten tres veces: escrituras sobre el mismo mazo, dos reviews desde la misma base y review/undo en ambos órdenes. Además se comprueban adición de dos tarjetas, delete frente a edit obsoleto, restore frente a operaciones anteriores, pérdida de respuesta y visibilidad de publicación antes/después del commit.

En cada conflicto se conserva la evidencia exacta y el recibo original; reintentar ambas operaciones devuelve sus resultados originales. La adición perdedora no deja identidad o tarjeta parcial y puede publicarse mediante un rebase explícito con otro opId. El manifest queda coherente. El snapshot y evento ganadores conservan sus campos, la rama perdedora no se aplica, y undo conserva el evento anulado. No se llama a ningún scheduler ni se reconstruye historia.

La prueba de relojes publica primero un cambio con updatedAt del año 2000 y enfrenta uno con updatedAt de 2099 desde la misma revisión: gana la revisión transaccional, no la fecha del dispositivo. Los timeouts de sentencia/lock son guardas que hacen fallar la prueba; no reintentan operaciones. El polling breve consulta disponibilidad del servicio o la condición de bloqueo; no añade esperas arbitrarias para estabilizar resultados.

No se detectaron deadlocks en las ejecuciones correctas. Esta evidencia cubre los escenarios controlados, no demuestra ausencia absoluta de deadlocks en cualquier carga o configuración futura.

## HTTP/JWT real: 8 grupos

Se envían peticiones HTTP a las tres RPC. PostgREST verifica JWT HS256 reales con firma y expiración antes de cambiar el rol de la conexión. Los JWT se emiten por el propio arnés para dos identidades sintéticas existentes en auth.users; no son tokens obtenidos de GoTrue.

1. Usuario A publica y consulta bundle y feed paginado.
2. B no lee entidades/recibos/conflictos de A ni modifica su tarjeta; el intento genera un conflicto propio de B.
3. Las tres RPC rechazan anon, JWT mal formado, firma incorrecta, expirado y firma manipulada.
4. Se rechazan owner falsificado en body y escalada a rol postgres.
5. Repetición exacta devuelve el ACK original; reutilización con otra petición se rechaza; CAS guarda conflicto consultable solo por su propietario.
6. POST/PATCH/DELETE REST directos se deniegan. Payload excesivo y manifest inválido se rechazan sin entidades ni recibos parciales.
7. Stage no aparece listo; el feed permite detectar cambio de generación, incluye tombstones y conserva uno mientras otro objeto se borra y restaura.
8. Catálogo: propietario postgres de las funciones; apply SECURITY DEFINER, lecturas SECURITY INVOKER; search_path vacío; RLS en las cuatro tablas; política SELECT auth.uid; sin INSERT/UPDATE/DELETE para authenticated; sin execute de helpers y sin execute RPC para anon.

Una respuesta antigua devuelve evidencia histórica y no rebobina el servidor. El guard Angular existente detecta bundles incompletos, stale o paginados. La persistencia local de identidades/recibos se prueba sin lectura del journal. **No se demuestra todavía que un reconciliador cliente impida aplicar un ACK antiguo: dicho reconciliador no existe y pertenece a H4B.**

## Resultados reales separados

| Entorno | Resultado final |
| --- | --- |
| PGlite | 23/23 escenarios anteriores, exit 0 |
| PostgreSQL nativo, regresión monoconexión | 23/23 por ejecución del nuevo runner |
| PostgreSQL nativo, batería ampliada | 16/16 en tres ejecuciones completas independientes; 15 solapamientos observados en cada una |
| PostgREST 16.5 / HTTP / JWT local | 8/8 grupos en las tres ejecuciones completas de la batería ampliada |
| Supabase Auth / GoTrue / stack Supabase | No ejecutado; pendiente explícito |
| Angular dirigido, cuatro specs H4A | 73/73; build 7.987 s, tests 3.53 s |
| Suite Angular completa | 1810/1810, 178 archivos; build 17.181 s, tests 13.64 s |
| TypeScript app/spec | Ambos exit 0 |

Los resultados nativos completos de la batería ampliada están en `.cache/h4a1-runtime/run-ohKA2W/results.json` y `run-hG92ns/results.json`. La segunda ejecución conserva también logs redactados. Hubo una ejecución inicial correcta de 15 pruebas nativas/8 HTTP antes de ampliar cobertura; no se cuenta como la batería final de 16.

La tercera ejecución final, `run-WNYY7x/results.json`, vuelve a pasar 16 nativas/8 HTTP
y 23 regresiones nativas, con 15 solapamientos. Incluye además la manipulación explícita
del sub del JWT sin volver a firmarlo y la limpieza final del archivo secreto initdb.

Durante el desarrollo, una fixture intentó usar action edit sobre contenido publicado; el contrato requiere publish con manifest. Se corrigió solo la fixture. En otra ejecución el proceso PostgREST terminó durante el arranque antes de cualquier comprobación HTTP; la instrumentación inicial no conservó el motivo. Se añadió diagnóstico redactado persistente y la batería ampliada pasó después en dos clústeres independientes. La causa de aquella salida no está demostrada; no se oculta ni se añade reintento de servicio. Si se repite, el runner falla y conserva el log. No se afirma estabilidad absoluta del arranque.

## Lo pendiente y decisión sobre H4B

La concurrencia PostgreSQL del bloqueo original queda comprobada mediante conexiones independientes. La validación JWT/roles/RLS/RPC por PostgREST también se ejecuta realmente; no se atribuye al uso de SET claims en SQL.

**Permanece pendiente la integración Supabase Auth**: emisión mediante login real, refresh/revocación, configuración de issuer/audience/JWKS y algoritmo usado por el proyecto, gateway Supabase/Kong y propagación de claims del stack. El auth.uid local reproduce el acceso a claims; no certifica el esquema completo, hooks, lifecycle ni configuración de GoTrue. No existe entorno aislado autorizado, y el usuario indicó documentar este pendiente. No se utiliza producción para cubrirlo.

No se han probado versiones/configuraciones de PostgreSQL/PostgREST distintas de las indicadas, failover, cargas prolongadas ni despliegue alojado. La salida aislada de arranque sigue siendo una incidencia local no diagnosticada, con logs habilitados para futuras reproducciones.

H4A.1 **no cumple todavía todo el criterio de cierre de autenticación integrada**. No se recomienda dar paso a H4B hasta probar Supabase Auth/gateway en un entorno aislado autorizado. No se inicia H4B ni se realiza despliegue remoto, commit o push.

## Cierre de regresión y preservación

- `npm run build -- --base-href /kana-study/`: exit 0, 16.230 s, cuatro warnings SCSS Grammar conocidos.
- `git diff --check`: exit 0; avisos LF/CRLF sin errores de whitespace.
- Comparación SHA256 con el inicio de H4A.1: 1462/1466 archivos existentes idénticos.
  Solo cambian DESIGN, H4A, SETUP y la etiqueta de entorno del runner SQL; los tres
  archivos nuevos de H4A.1 se enumeran arriba. Package/lock raíz y migraciones SQL
  permanecen intactos, así como todo el código Angular de hitos anteriores.
- Ambos gates conservan `signal(false)`. No hay procesos PostgreSQL/PostgREST del
  arnés retenidos al terminar las ejecuciones correctas. No se ejecutó Playwright:
  no se ha cambiado ninguna interfaz ni estilo, tema o traducción.
