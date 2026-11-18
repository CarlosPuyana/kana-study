# Islas Puyi · Integración privada y paso a P7.2

Islas Puyi tiene una entrada propia en **Mazos → Islas Puyi**. La ruta `#/anki/puyi-islands` carga bajo demanda las vistas de P3–P5.1 y usa la sesión existente de Kana Study. La demo y la autoría P6 tienen entradas locales distintas. El módulo público distribuye la interfaz y las llamadas de lectura. El catálogo y los MP3 se obtienen desde el servidor con autorización.

## Modelo y controles

Las migraciones `202611180001_puyi_private_islands.sql` y `202611180002_puyi_island_editorial.sql` crean las tablas y funciones del módulo. La membresía requiere UUID de Auth, fecha de verificación y ausencia de revocación. La función de acceso usa `auth.uid()` y rechaza Auth anónima aunque figure como `authenticated`. El rol del mazo Puyi público es independiente. La migración empieza con la membresía vacía.

Los UUID de isla, bloque y entrada se conservan entre revisiones. Frases y preguntas comparten el formato de texto y audio y se distinguen por tipo. Las relaciones llevan FK a la isla, revisión y tipo de ambas entradas. Una isla apunta a una revisión de trabajo y, opcionalmente, a una publicada. El lector ve la revisión publicada y sus objetos, mientras el propietario puede consultar el historial y los contextos separados. Las escrituras pasan por funciones que comprueban rol, propietario y revisión esperada, y bloquean la fila durante la operación. El servidor exige las marcas de aprobación textual y auditiva y verifica las relaciones, la coincidencia entre texto, lectura y audio, y la presencia, el MIME y el tamaño del objeto. La revisión humana y la verificación byte a byte del MP3 se documentan localmente.

El bucket `puyi-islands-private` se crea con publicidad desactivada, tamaño máximo de 2 MiB y MIME `audio/mpeg`. Cada objeto usa `UUID-isla/UUID-audio/rN-SHA256.mp3`. El propietario puede cargar únicamente objetos reservados por la revisión de trabajo. Las políticas restrictivas previenen el acceso mediante políticas permisivas de otros módulos e impiden modificar, borrar o convertir el bucket en público mediante un cliente ordinario. Las migraciones comprueban que RLS ya esté activa en las tablas de Storage.

## Audio y sesión

La biblioteca carga primero las cabeceras. Al abrir una isla obtiene sus bloques y la primera selección. Mantiene los datos de un solo bloque y descarga únicamente el MP3 solicitado. Cada descarga usa la sesión del cliente Supabase y solicita `cache: 'no-store'`. El reproductor conserva un Blob temporal y libera su URL al cambiar de clip, detener o salir. Si el navegador exige un segundo gesto para reproducir tras la descarga, **Reintentar** arranca el clip preparado. No se guardan MP3 o textos privados en almacenamiento del navegador.

El cambio de cuenta o workspace invalida la lectura y el reproductor. También se consulta el acceso y la revisión al volver a la vista y cada 20 s mientras la vista permanece activa. Un cambio detectado cancela las solicitudes pendientes y descarta los datos anteriores. La latencia de una revocación en pantalla depende de cuándo pueda ejecutarse la comprobación. RLS aplica a cada nueva petición al servidor. Los bytes ya descargados no pueden retirarse retroactivamente.

El cliente intenta primero la descarga autenticada. WebKit de Windows aceptó el mismo MP3 por HTTP, pero rechazó sus URLs de Blob y de datos. Ante un error de formato al iniciar el Blob, el reproductor solicita solo la URL firmada del clip actual, por 150 s. El margen cubre clips admitidos de hasta 120 s y sus peticiones de red. Si caduca durante una pausa, continuar solicita otro enlace y vuelve a empezar esa misma frase. Si falla la autorización, se detiene.

Una URL firmada actúa como un enlace al portador y la sesión local no la invalida inmediatamente. En P7.2 hay que probar el enlace antes y después del plazo con una petición sin caché, registrar su comportamiento tras cerrar sesión o revocar la membresía y comprobar `Range` / `206`, CORS y caché del servicio. La aplicación pide un TTL de 150 s para su alternativa. Ese valor no impone un máximo a otros clientes que puedan solicitar sus propios enlaces. Las transiciones y la parada en segundo plano siguen a prueba en dispositivos físicos.

## De P6 a un paquete local

1. Guarda un borrador P6, revisa el japonés y confirma el texto. Prepara y sintetiza los trabajos AivisSpeech 1.2.0 / Aida Shigeru normal. Escucha cada MP3 y registra su decisión para su huella.
2. Para una revisión P2, conserva el original y aprueba el archivo de revisión concreto por SHA-256. La herramienta de audio acepta `--review ARCHIVO.json`. El paquete exige el recibo del texto exacto y una decisión `accepted` sobre cada MP3 de esa revisión. La revisión personal pendiente se conserva tal como está.
3. Prepara y verifica el paquete local. Los tres comandos leen o escriben dentro de la zona privada de autoría. Se mantienen separados de GitHub Pages y de la demo.

```powershell
node experiments/phrase-islands-puyi-editor/publication.mjs draft UUID_ISLA REVISION
node experiments/phrase-islands-puyi-editor/publication.mjs review REVISION_P2.json REFERENCIA_P2.json
node experiments/phrase-islands-puyi-editor/publication.mjs verify UUID_PAQUETE
```

El paquete queda en `.phrase-islands-authoring/puyi/releases-p71/`. Contiene `manifest.json`, `payload.json` y los MP3 por key opaca. Solo incluye una isla. Su manifiesto liga los hashes al paquete y se escribe al final. El convertidor P2 usa los UUID originales de isla, bloque y entrada y asigna un UUID de audio reproducible por candidato verificado. El archivo local de referencia y la revisión personal quedan intactos.

## Pruebas locales

- PostgreSQL local mediante PGlite 0.3.14. Pasaron seis escenarios de Islas privadas y los 17 escenarios SQL previos del mazo público. Se simularon las claims de Auth y las tablas de Storage. Se ejercitaron las RLS incluyendo políticas permisivas ajenas al módulo.
- Pasaron las seis pruebas de Playwright de la ruta integrada y las 36 de la demo y el editor en Edge y WebKit. La integración usa un servicio HTTP ficticio con un MP3 real. Para la alternativa de WebKit en Windows, la prueba comprueba la petición de firma y entrega el MP3 genérico por HTTP local. Se verificó la interrupción del audio tras detectar una revocación simulada. La renovación de un enlace caducado se probó con reloj simulado.
- Pasaron 38 pruebas dirigidas, las 3617 pruebas de la suite Angular global (291 archivos), nueve pruebas Node del editor y del paquete editorial, 14 pruebas móviles de Islas generales y 15 pruebas de recuperación de FSRS y Undo. También se validaron los hashes de los 36 MP3 generales.
- Compilaron la aplicación normal, el editor y el candidato de Pages. El candidato ocupa **709.288 bytes iniciales** de un máximo estricto de 750.000. El módulo de Islas Puyi carga bajo demanda y el grafo público excluye la demo y el editor. La auditoría de 4015 archivos de texto de ambos builds públicos obtuvo cero coincidencias con los marcadores de Grappling y verificó que el borrador conserva su SHA-256.

```powershell
node --test supabase/tests/puyi-private-contract.mjs
node scripts/test-puyi-sql.mjs
node --test experiments/phrase-islands-puyi-editor/editor.test.mjs experiments/phrase-islands-puyi-editor/publication.test.mjs
npm test
npm run build:manga-candidate
npx playwright test --config playwright.puyi-private.config.ts
```

El runner SQL reutiliza PGlite instalado en `.cache/h4a-sql-runtime`. Los logs y el resultado de la auditoría del artefacto están en `.cache/phrase-islands-puyi-p71/`.

## P7.2 · Checklist de operación autorizada

- [ ] **Elegir un Supabase de ensayo separado.** Confirmar el identificador del proyecto y bloquear cualquier conexión accidental al de producción. Revisar `pg_policies` y los grants efectivos de las tablas privadas, `storage.buckets` y `storage.objects`, y confirmar RLS en ambas tablas de Storage. Aplicar en el entorno de ensayo las dos migraciones por orden. Confirmar que el bucket sea privado y la membresía esté vacía.
- [ ] **Verificar las cuatro identidades.** Carlos, Nora, Antonio y Ana inician sesión en su propia cuenta confirmada de Kana Study. En una sesión controlada por cada persona, comprobar su propia respuesta autenticada `GET /auth/v1/user` y registrar solamente `id` y si la cuenta está confirmada y es no anónima. Por un canal privado, confirmar con cada persona que controla esa cuenta. El operador autorizado contrasta cada UUID exacto con **Authentication → Users → User UID** del proyecto correcto. Guardar la relación UUID/rol y la evidencia fuera del repositorio. Si falta una cuenta, su titular se registra mediante el flujo existente, confirma el correo e inicia sesión antes de verificar el UUID. Mantener tokens, contraseñas y datos de sesiones fuera de mensajes y documentos.
- [ ] **Con autorización explícita, conceder los roles.** Registrar la membresía verificada de Carlos como `owner` y las tres restantes como `reader`, por los UUID comprobados, con `verified_at` y `revoked_at = null`. Hacerlo desde una sesión administrativa de confianza. Comprobar la asignación antes de confirmar la transacción. Para revocar, establecer `revoked_at` del UUID. No usar el rol del mazo público, nombres o correos de visualización para asignar acceso.
- [ ] **Validar con una isla ficticia.** Probar el propietario y cada lector en sesiones separadas. Probar invitado, Auth anónima, cuenta ajena, no verificada y revocada. Probar ID y key conocida, contexto original, operaciones directas de escritura y RPC, endpoint público de Storage, creación de URL firmada, carga como lector, sobrescritura y cambio de la visibilidad del bucket. Asegurar que un conflicto de edición conserve la versión anterior.
- [ ] **Medir el transporte real.** Verificar autenticación, caché, 401/403/404 según endpoint, Range, TTL y acceso residual firmado. Revocar durante descarga, durante reproducción y en una sesión diferente. Confirmar mediante el navegador que el logout y el cambio de usuario eliminan la vista y descartan una respuesta tardía. Repetir con red lenta y comprobar que solo se solicitan los clips necesarios.
- [ ] **Preparar la isla personal tras P2.2.** Obtener confirmación explícita del texto y de las doce escuchas. Preparar y verificar el paquete local. La lista de pruebas de ensayo utiliza muestras genéricas.
- [ ] **Autorizar por separado los cambios en producción.** Revisar políticas reales y configuración del proyecto antes de SQL, creación de bucket y membresías. Repetir pruebas negativas con una muestra ficticia en el entorno autorizado antes de usar datos personales.
- [ ] **Publicar mediante una sesión de propietario verificada.** Consultar `puyi_island_editor_state(p_island)`. Pasar `p_island`, `p_expected` (0 solo para nueva isla) y el JSON de `payload.json` como `p_document` a `puyi_island_save`. Conservar la revisión devuelta. Para cada objeto del manifiesto, verificar SHA-256 y tamaño antes de enviar al bucket por la key exacta con `upsert: false`, `contentType: 'audio/mpeg'`, `cacheControl: '0'`. Para objetos existentes, verificar que el contenido coincide y reutilizarlos. Con un conflicto, consultar las revisiones y reconciliar antes de reintentar.
- [ ] **Activar la revisión explícitamente.** Llamar a `puyi_island_publish(p_island, p_expected, p_expected_published, p_revision)` con la revisión de trabajo y el puntero publicado esperados. Comprobar en una sesión de lector que la revisión es visible, en una cuenta ajena que queda oculta y en el editor que se mantiene el historial. Para rollback, usar el mismo RPC con los punteros esperados y una revisión anterior válida. Pasar `p_revision = null` para retirar de la biblioteca. El historial y los MP3 se conservan.
- [ ] **Autorizar y revisar Pages.** Ejecutar las pruebas y el build candidato. Inspeccionar el artefacto, la carga diferida y el límite estricto de 750.000 bytes iniciales. El workflow de Pages se activa con un push a `main` o manualmente. Usar solo URL y clave publicable en la configuración Angular. Tras el despliegue autorizado por HTTPS, probar iPhone y Lenovo con altavoz, auriculares y pantalla bloqueada.

La P7.1 se valida con PostgreSQL local y un servicio HTTP simulado en Playwright. Las comprobaciones de Auth real, RLS detrás de PostgREST, Storage real, URLs firmadas y dispositivos físicos pertenecen a la lista de P7.2. [Diseño previo de seguridad](phrase-islands-puyi-security-design.md) · [Pruebas físicas](phrase-islands-puyi-device-test-plan.md).
