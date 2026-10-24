# H2B-UX2 — Auditoría de traducción híbrida de ejemplos

Fecha: 2026-10-24. **Estado: bloqueado por persistencia compatible; funcionalidad NO terminada.**
No se ha añadido «Traducir ejemplo» ni edición de traducciones en Mazos. No hay un
campo local que parezca guardarse y se pierda al transferir Guest. H2B-UX1.1 permanece
operativo. Esta entrega documenta el bloqueo permitido expresamente por el criterio
de aceptación y separa la extensión SQL/RPC necesaria, sin desplegarla.

## IA existente: contrato comprobado en código

- Angular: `src/app/core/services/manga-context.service.ts`, token público
  `MANGA_ASSISTANT_ENDPOINT`, leído de un meta de `src/index.html`. Admite HTTPS sin
  credenciales y HTTP del mismo origen. `available` indica configuración, no salud.
- Backend: `workers/manga-assistant/src/index.ts`, contrato, validación, prompts y
  estrategias en ese directorio. Cloudflare Workers AI, binding privado `env.AI`;
  modelo configurado/default `@cf/google/gemma-4-26b-a4b-it`. No claves privadas en
  Angular. No se han leído secretos ni consultado cuentas.
- POST `/assist`: `{schemaVersion:1,mode:'translate',request:{selectedText,
  targetLanguage:'es'}}`. `selectedText` es el único texto que debe traducirse;
  contexto, expresión y textos vecinos solo desambiguan. Soporta es/en/ca. Respuesta
  JSON con `natural` requerido, `literal` y `notes` opcionales.
- El cliente limita selectedText/contextText a 1200 unidades UTF-16, expresión a
  100 y vecinos a 300; respuesta transmitida a 100000 bytes. El Worker limita
  entrada a 24 kB, salida a 90 kB, cadenas a 6000 y notas a 20. Comprueba japonés,
  campos permitidos y texto sin HTML/URLs/controles. El cliente no replica toda esa
  validación: no se presenta como equivalente al Worker.
- Gemma usa JSON, thinking desactivado, temperatura 0.1 y máximo 512 tokens de
  completion para translate (1536 study), sin streaming. Hay estrategias explícitas
  para otros modelos, sin fallback ni reintentos automáticos.
- Los prompts exigen preservar el fragmento, no inventar sujetos, conversación ni
  imágenes y expresar incertidumbre. Un fragmento incompleto no se convierte en
  una página o conversación ficticia.
- El popup actual puede enviar la palabra seleccionada como selectedText y el
  bocadillo como contextText. Esa respuesta NO es una traducción del ejemplo entero.
  Para el ejemplo se debe enviar exactamente `source.fragment` como selectedText,
  sin imágenes, página completa ni identificadores. `pageTexts` no se transmite en
  el cliente acotado y el Worker lo rechaza.

Un test nuevo del Worker verifica el recorrido completo con el binding AI simulado,
no solo una lectura del prompt. El servicio sí puede traducir una frase aislada;
la limitación que impide cerrar este hito está en la persistencia, no en el proveedor.

### Configuración, privacidad y coste

`src/index.html` ya contiene la URL pública del Worker. El comentario/README que
indica que no hay endpoint desplegado no describe esa configuración actual; no se
ha comprobado que el endpoint esté desplegado o disponible. Wrangler permite
GitHub Pages y localhost/127.0.0.1:4200, no el puerto manual 4401.

No se envían cookies (`credentials:'omit'`), tokens Supabase, IDs de volumen/página,
cuentas ni imágenes en el body. El Worker rechaza cabeceras de autenticación/cookies.
CORS comprueba orígenes permitidos, pero no equivale a autenticación: un cliente sin
Origin puede acceder. El limitador es 10 peticiones/60 segundos por IP, falla cerrado
si no está disponible; no constituye un presupuesto global de facturación.

Observabilidad desactivada y sin almacenamiento propio de prompts/respuestas en
KV/R2. El proveedor recibe el texto elegido; esto no garantiza la política de
retención externa. Los tests usan únicamente respuestas controladas y no generan
inferencias reales ni cargos. Las credenciales pertenecen al entorno del Worker,
no al repositorio cliente. No se ha alterado configuración ni desplegado nada.

La documentación oficial consultada indica 10000 neuronas diarias gratuitas,
reinicio a las 00:00 UTC y $0.011 por 1000 neuronas adicionales en el plan de pago.
Algunos modelos requieren método de pago. No se ha verificado el plan de esta cuenta
ni un coste por frase/modelo; el límite por IP no evita costes agregados.
Fuente: [Cloudflare Workers AI pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/).

El modo manual `manga-manual.providers.ts` fuerza endpoint IA nulo, Guest y Supabase
desactivado. Se conserva así: habilitar los gates locales no autoriza enviar OCR a
un proveedor. Cualquier prueba futura real necesita configurar deliberadamente la
asistencia local y revisar el origen/puerto permitido, conservando ambos gates cloud
false y una acción explícita del usuario por petición.

## Caché y adaptación mínima futura

La caché actual es localStorage `kana-study-manga-context-v1`, últimos 20 resultados
válidos, sin TTL. La clave incorpora endpoint, schemaVersion, modo, idioma, ubicación,
petición acotada y texto original completo: dos fuentes truncadas distintas no se
confunden. No guarda ediciones manuales. La ubicación no sale por red.

No incluye propietario/workspace, epoch de activación, versión del prompt/modelo ni
procedencia verificable. Tampoco deduplica peticiones simultáneas. Por tanto una
entrada legacy no debe convertirse automáticamente en traducción confirmada de una
tarjeta, ni reutilizarse solo por compartir una palabra o parecerse al OCR.

La extensión posterior debe usar un adaptador pequeño del servicio actual: petición
explícita del fragmento exacto, español, clave con huella del texto exacto, endpoint,
versión de contrato/prompt y ámbito de workspace. Sin fallback a caché legacy cuya
procedencia no se pueda comprobar. Compartir peticiones idénticas en curso dentro
del mismo ámbito, abortar al cerrar/cambiar página/volumen y descartar resultados por
epoch A→B→A o revisión del borrador. Una respuesta tardía nunca reemplaza edición
manual. No insertar glosas o traducciones de usuario en la caché global.

Actualmente se comprueba abort antes y después del fetch. El nuevo test cubre una
respuesta tardía después de abortar y verifica que no se cachea. Esto NO implementa
todavía todos los guards del futuro panel.

## Bloqueo de persistencia reproducido

1. `deck-catalog.model.ts`: tarjeta V1 y vista de estudio solo contemplan contexto
   japonés, título y página. DeckCatalog proyecta esos campos conocidos.
2. `custom-deck-validation.ts`: validateCard reconstruye campos conocidos. Un campo
   contextTranslation en raíz o contexto se elimina. Un editCard genérico puede
   finalizar correctamente y perder el campo tanto en lectura como en journal.
3. `manga-deck-confirmation.ts`: contexto de tarjeta debe coincidir exactamente con
   fragmento/título/página del recibo original. Añadir propiedades al contexto rompe
   la confirmación. El recibo no debe reescribirse para acomodar la traducción.
4. `custom-deck-sync-contract.ts`: comparación canónica con validateCard rechaza la
   extensión desconocida. Las operaciones internas del transporte V2 siguen ese
   contrato V1; un wrapper V2 no vuelve compatible una tarjeta extendida.
5. `202610220001_custom_decks_foundation.sql`: cd_payload_v1 y cd_keys_v1 solo admiten
   las claves V1 de tarjeta/contexto; CHECK de entidades y publicación de confirmación
   mantienen esos invariantes. `202610220002_custom_transfers_v2.sql` reutiliza ese
   validador para registros internos, con sus propios manifiestos y hashes.
6. `custom-guest-transfer-builder.ts`: el inventario Guest incluye once stores, no
   metadatos de traducción. Rechaza explícitamente journals edit-card; proyecta y
   compara inventarios exactos. El test demuestra primero que el inventario original
   sí prepara transferencia y después que el journal editado la bloquea.

Prueba real en PGlite, cargando ambas migraciones actuales sin cambios:
tarjeta histórica aceptada (`true`), extensión raíz y extensión anidada rechazadas
(`false`). Tres comprobaciones correctas. Script/log diagnóstico local:
`.cache/ux2-sql-contract.mjs` y `.cache/ux2-sql-contract.log`.

La confirmación local puede conservar temporalmente un campo desconocido en una
operación raw; esto no garantiza persistencia utilizable: lectura/proyección y
preflight remoto siguen eliminándolo/rechazándolo. No basta con un cast TypeScript.
Tampoco sirve meter la traducción en glosas, título o texto OCR: altera significado
y procedencia. No se ha añadido un sidecar local que desaparezca al importar Guest,
exportar inventario o recuperar una rama.

### Extensión versionada que debe separarse

Propuesta técnica, NO implementada ni desplegada: metadato opcional versionado y
separado del recibo V1, identificado por owner/deck/card y SHA-256 del contexto exacto.
Contendría text, language (es), source (ai-suggested/user-edited/manual), confirmación
explícita del usuario, originalContextFingerprint y version. Aplicar límite razonable
de texto, validación estricta y revisiones/CAS e idempotencia propias; nunca generar
eventos de repaso por editarlo. Las tarjetas históricas siguen válidas sin metadato.

Se requiere acordar y probar almacenamiento IndexedDB, composición de la vista,
journal propio, export/import, recuperación, negociación de capacidad y extensión
versionada del protocolo/SQL/RPC. No inyectar nuevas claves/kinds en un feed V1 de
clientes antiguos, ni modificar payloads, manifiestos o recibos ya congelados.
Transferencias nuevas deben incluir el metadato con hashes versionados; transferencias
ya preparadas conservan su snapshot. El servidor antiguo debe producir una
incompatibilidad explícita conservando datos offline, no confirmar un dato perdido.
Esto requiere trabajo separado de contrato remoto y sus regresiones SQL/RLS antes
de poder declarar completa la funcionalidad solicitada.

## UX y ejemplo (diseño pendiente)

En el apartado Ejemplo existente: japonés exacto, traducción confirmada si existe,
acción explícita Traducir ejemplo, indicador de carga y edición manual compacta.
Sin modal obligatorio ni segunda previsualización. Añadir permanece habilitado
mientras la sugerencia opcional carga; guardar sin traducción cancela/descarta la
respuesta tardía y no confirma una sugerencia tácitamente. Fallos de proveedor,
offline, JSON inválido o persistencia conservan el borrador y permiten seguir sin
traducción. La confirmación explícita se distingue de recibir la IA.

Ejemplo de prueba controlado facilitado en el encargo:

- Palabra: 大丈夫; lectura: だいじょうぶ; significado: estar bien.
- OCR original: `大丈夫、大丈夫。一緒に行こう。`
- Sugerencia controlada: «Tranquilo, tranquilo. Vamos juntos».
- Es orientativa; no es el resultado medido de una inferencia ni validación lingüística
  independiente. El Worker simulado devuelve ese contrato sin llamadas de pago.

En Mazos la vista futura compondrá metadato confirmado bajo el japonés y permitirá
editarlo explícitamente, conservando página, identidad y recibo original. No se ha
implementado esta UI ni nuevas cadenas ES/EN/CA porque su guardado compatible está
bloqueado. No se han modificado estilos ni mecánicas de repaso.

## Cambios realizados

- `manga-context.service.ts`: rechaza respuestas natural y textos requeridos con solo
  espacios, como ya hacía el Worker; no las presenta ni cachea como traducciones.
- `manga-context-example-contract.spec.ts`: ocho pruebas de petición explícita del
  fragmento completo, caché exacta, vacío/espacios, JSON inválido, abort tardío y
  endpoint ausente. Fetch simulado, sin proveedores externos.
- `manga-example-translation-contract.spec.ts`: siete pruebas de tarjetas antiguas,
  pérdida por proyección, rechazo remoto/contexto inmutable, guardado genérico y
  bloqueo Guest V2; conserva ID, identidad, recibo e historial vacío de FSRS.
- `workers/manga-assistant/test/example-contract.test.ts`: contrato HTTP y binding
  simulado con el ejemplo completo, parámetros del modelo y respuesta controlada.
- Este documento y referencia en DESIGN. Sin cambios en SQL, RPC, modelos persistentes,
  i18n, scheduler, Stats V2, Japanese 1500, Manga Saved FSRS ni sincronización.

## Validación

Comprobaciones ejecutadas el 2026-10-24, sin reintentos para ocultar fallos:

| Comprobación | Resultado |
| --- | --- |
| Dos nuevos specs Angular aislados | 15/15, 2 archivos |
| Dirigidos MangaContext, asistido, repositorio, sync y contrato V2, panel | 141/141, 10 archivos (incluyen los 15 nuevos) |
| `npm test` | 2015/2015, 196 archivos, exit 0 |
| `npm test` en workers/manga-assistant | 115/115, binding simulado, sin inferencias reales |
| Sonda SQL PGlite | 3/3: histórico válido, ambas extensiones rechazadas |
| Playwright, manga-decks-assisted y manga-quick-add-ux11 | 81/81, 2.2 minutos, retries 0 |
| `npx tsc -p tsconfig.app.json --noEmit` | Correcto |
| `npx tsc -p tsconfig.spec.json --noEmit` | Correcto |
| `npx tsc -p tsconfig.manga-manual.json --noEmit` | Correcto |
| `npm run typecheck` en workers/manga-assistant | Correcto |
| `npm run build -- --base-href /kana-study/ --stats-json` | Correcto, inicial 749.67 kB, mismos cuatro warnings SCSS Grammar |
| Grafo de chunks | Localización/explorador siguen diferidos; fuera del cierre estático de main/Reader |
| Entrypoint/providers manuales en build de producción | Ausentes en estadísticas del bundle |
| Smoke navegador manual 4401 | Guest, UI local habilitada, sin Supabase, vocabulario accesible; cero tarjetas creadas |
| `git diff --check` y whitespace de archivos nuevos | Correctos; solo avisos de normalización LF/CRLF de Git |

Logs locales en `.cache/ux2-{contract,directed,full,worker,e2e,build,ts-*}.log`.
Comparación SHA-256 con el estado inicial (`.cache/ux2-baseline.json`): solo cambian
los seis archivos enumerados arriba; no se elimina ningún archivo. Los cuatro gates
de producción siguen false y los providers manuales no entran en Pages. ES/EN/CA
permanecen idénticos al inicio; el prebuild de i18n pasa. No hay nuevas dependencias.
La suite completa incluye Stats V2, Japanese 1500, Manga Saved FSRS y contratos de
hitos previos; sus fuentes permanecen idénticas. Playwright cubre los flujos existentes
en escritorio oscuro 1280, móvil claro 390 y estrecho oscuro 320, no una UI de UX2.

Los tests que rechazan la extensión son diagnóstico del bloqueo, no pruebas de
aceptación de una funcionalidad implementada. Quedan pendientes todas las
pruebas end-to-end de traducción persistente, edición/confirmación, recarga, composición
en Mazos y guards de concurrencia del panel hasta resolver el contrato separado.

## Prueba manual actual

`npm run start:manga-manual`, abrir `http://127.0.0.1:4401/` con perfil de navegador
separado y Guest. Se conserva Añadir rápido de H2B-UX1.1; no se crean tarjetas de
prueba automáticamente. Los gates custom/assisted son locales; sync/upload y endpoint
IA permanecen desactivados. La nueva traducción de ejemplo NO está disponible todavía.
No confundir el botón general de traducción del Manga normal con una traducción
confirmada y persistida en una tarjeta. No iniciar otro hito hasta resolver el bloqueo.
