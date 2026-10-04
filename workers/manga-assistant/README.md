# Manga Assistant V1 — Translate listo, no desplegado

Estado final de producto: solo **Traducir**, con Gemma (`@cf/google/gemma-4-26b-a4b-it`) en Cloudflare Workers AI, thinking=false, plain JSON, una inferencia máxima, sin retries ni fallback automático. Prompt translate congelado. Study permanece implementado experimentalmente, pero el botón no se renderiza y el popup rechaza invocaciones study. Known limitation: Study se aplaza porque el análisis léxico generado puede ser pedagógicamente incorrecto (segmentación/baseForm de させたかった).

Translate está preparado en el flujo existente: disponible solo con endpoint, selección/contexto separados, loading, cancelación, caché y natural/literal/notes como texto; errores no inutilizan JMdict. Sin endpoint configurado, reader y JMdict siguen funcionando sin IA. No se envían imágenes ni usuario/email/IDs privados: location se usa solo para clave de caché local.

Activación posterior: desplegar el Worker y añadir en `src/index.html`, dentro de `<head>`, `<meta name="kana-study-manga-assistant" content="URL_REAL_DEL_WORKER/assist">` con la URL pública real. El factory existente de `MANGA_ASSISTANT_ENDPOINT` lee ese meta; también puede proporcionarse mediante el token Angular. No introducir claves/API keys ni modificar Supabase. Todavía no existe URL configurada y esta tarea no despliega.

BENCHMARK.md y MODEL_OUTPUT_DIAGNOSTIC.md se conservan como evidencia histórica de la decisión de aplazar Study; no constituyen requisitos pendientes para publicar Translate ni se han ampliado en esta fase. Sus recomendaciones anteriores evaluaban Translate+Study conjuntamente. Sin nuevas inferencias ni benchmarks en el cierre de V1.

Validación de cierre: 114/114 tests Worker y 42/42 Angular afectados, TypeScript Worker/app/spec y build correctos (avisos de presupuesto existentes). Sin inferencias reales. El endpoint aún requiere deploy y configuración posterior.

Worker independiente de Kana Study y del relay Mokuro. El frontend no se modifica ni configura en esta fase. JMdict, desconjugación y selección siguen siendo locales; solo una acción explícita «Traducir»/«Estudiar frase» podrá enviar texto cuando se configure el endpoint posteriormente.

## Coste y configuración

Usar exclusivamente **Workers Free**, sin tarjeta, sin billing, sin Workers Paid ni AI Gateway de pago. Workers AI ofrece actualmente 10.000 Neurons/día gratis, con reinicio a las 00:00 UTC; en Free superar la asignación falla en vez de generar consumo facturable. La asignación se comparte a nivel de cuenta: no equivale a 10.000 traducciones. Confirmar el plan y las condiciones vigentes antes de autenticar/probar/desplegar. El código no puede comprobar ni impedir que el propietario cambie el plan de la cuenta a Paid.

Fuentes oficiales consultadas: [pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/), [AI binding](https://developers.cloudflare.com/workers-ai/configuration/bindings/), [JSON Mode](https://developers.cloudflare.com/workers-ai/features/json-mode/), [rate limiting binding](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/).

`wrangler.jsonc` declara el binding `AI`. Cloudflare suministra `env.AI.run(model, input)` con la identidad del Worker: no hay claves Angular, API keys propias ni peticiones a APIs externas. Modelo inicial V1 para translate/study: `@cf/google/gemma-4-26b-a4b-it`, tanto en configuración como si falta `MANGA_AI_MODEL`. Llama y GLM conservan estrategias seleccionables explícitamente, sin fallback automático. Modelos desconocidos se rechazan antes de inferir. No desplegado ni conectado al frontend. La validación final todavía no cumple los criterios de aprobación; ver BENCHMARK.md.

Capacidades centralizadas en `src/model-strategies.ts`: Llama conserva JSON Schema y `max_tokens` 512 (translate)/1536 (study). Gemma utiliza plain JSON, `chat_template_kwargs.enable_thinking=false` y el parámetro actual `max_completion_tokens` con los mismos límites. El contenido lingüístico del prompt es idéntico; solo Gemma añade una instrucción técnica final para JSON sin fences/texto adicional. GLM sigue disponible como experimental, pero queda fuera del benchmark V1. `AI_JSON_MODE` queda como configuración legada validada y no sobrescribe la estrategia del modelo. Sin streaming, temperature 0,1, validación estricta, una inferencia como máximo y ningún retry/fallback/JSON repair.

## Tests y TypeScript (sin IA ni red)

Study conserva natural/vocabulary/grammar y añade `notes?: string[]` compatible con respuestas anteriores: máximo cinco avisos de 500 caracteres, texto plano, sin HTML/URLs/controles. El modelo Angular es la fuente del tipo reexportado por el Worker. Schema y validadores Angular/Worker comprueban notes. El popup los interpola como texto bajo natural, sin innerHTML ni etiqueta nueva; no se necesitan claves ES/EN/CA nuevas. El prompt usa el idioma destino para estos avisos. Output permite símbolos <, > y flechas aislados y rechaza etiquetas reales; la entrada conserva su filtro estricto anterior. Se mantienen selección literal, rechazo de duplicados, límites y una sola inferencia.

Último hardening: 114 tests Worker y 40 Angular afectados pasan; TypeScript Worker/app/spec y build correctos. Validación real limitada a tres llamadas Gemma: 3/3 contratos aceptados, pero D mantiene vocabulario/segmentación dudosos. No se recomienda deploy todavía; resultados completos al final de BENCHMARK.md. No se ejecutó deploy ni se configuró el endpoint.

Requiere dependencias existentes de la raíz (`npm ci` si aún no están) y Node >=22.22.3. No se añaden dependencias al frontend ni SDKs al Worker. Los tests Node ejecutan TypeScript mediante strip-types y mockean ambos bindings; el compilador TypeScript comprueba el código del Worker por separado, reutilizando el instalado en la raíz.

```powershell
cd workers/manga-assistant
npm test
npm run typecheck
```

## Desarrollo y autenticación — ejecutar solo cuando se decida

Wrangler se obtiene bajo demanda con `npx wrangler@4` (>=4.36 para rate limiting). Ya se ha usado Wrangler con autenticación OAuth del usuario para benchmarks locales e inferencias reales. El Worker sigue sin desplegar.

1. Verificar que la cuenta usa Workers Free y no tiene habilitado billing de pago.
2. Desde esta carpeta: `npx wrangler@4 login`. Autenticación OAuth en navegador; no crear/pegar API keys.
3. Revisar `namespace_id: "15001"`: debe ser único dentro de la cuenta, sin compartir contadores con otro Worker. Cambiar solo este archivo si hay conflicto.
4. `npm run dev` (`npx wrangler@4 dev`). `AI.remote=true` implica **inferencia real remota** y consumo de la asignación gratuita incluso en desarrollo. El rate limiter se simula localmente. No mandar mangas privados para una prueba sin querer compartir ese texto con Cloudflare.
5. `GET http://localhost:8787/health` no consume inferencias. No activar aún el endpoint de producción del frontend.

En un futuro despliegue aprobado: volver a confirmar Free, origen/namespace/modelo y ejecutar desde esta carpeta `npx wrangler@4 deploy`. Esa orden **no se ha ejecutado**. Después, y en una tarea separada autorizada, configurar el meta/provider `MANGA_ASSISTANT_ENDPOINT` con `https://NUEVO-WORKER/assist`. No reutilizar el relay Mokuro ni cambiar `public/supabase-config.js`.

## Benchmark local opcional

Después de autenticación y `wrangler dev`, una invocación explícita envía una sola muestra al Worker local (sin loops, reintentos ni ejecución automática en tests):

```powershell
npm run benchmark -- http://localhost:8787/assist translate es "食べなかった"
npm run benchmark -- http://localhost:8787/assist study ca "させたかった"
```

El script imprime estado, duración y resultado; no guarda archivos. Para recoger usage oficial sin cambiar el contrato de producción, usar la entrada alternativa exclusivamente local:

```powershell
npx wrangler@4 dev scripts/benchmark-local.mjs --ip 127.0.0.1 --port 8789 --var MANGA_AI_MODEL:@cf/google/gemma-4-26b-a4b-it --var LOCAL_MODEL_BENCHMARK:1
```

Esta entrada delega en el Worker de producción con los mismos prompts/validadores y devuelve solo las métricas numéricas oficiales por un header local que lee benchmark.mjs. No está referenciada por wrangler.jsonc ni Angular. Admite translate por defecto, study mediante `--var LOCAL_BENCHMARK_MODE:study` o una validación combinada mediante `--var LOCAL_BENCHMARK_MODE:mixed`; máximo seis inferencias totales por proceso, modelos elegibles V1, sin Origin, hostname loopback y flag explícito. GLM se rechaza antes de AI.run. El flag opcional `--var LOCAL_BENCHMARK_RAW:1` registra únicamente assistant content en la consola LOCAL si hay HTTP 502; no registra reasoning, envelope, credentials ni headers. Los errores HTTP permanecen iguales y producción no importa el helper. No ejecutar una tanda adicional sin autorización ni conectar esta entrada al frontend. Ver resultados históricos y validación final en BENCHMARK.md.

## Contrato exacto

`POST /assist`, Content-Type application/json, sin auth/cookies. Reutiliza **tipos TypeScript** del frontend como source of truth, mediante imports solo de tipos. No crea una API distinta.

```json
{"schemaVersion":1,"mode":"translate","request":{"selectedText":"食べなかった","selectedExpression":"食べなかった","contextText":"昨日は食べなかった。","previousText":"前の文章","nextText":"次の文章","targetLanguage":"es"}}
```

`mode`: translate/study. Idioma: es/en/ca. Solo selectedText e idioma obligatorios. Límites en unidades UTF-16, iguales a `limitedMangaRequest`: selectedText/contextText 1.200, selectedExpression 100, previousText/nextText 300. Opcionales ausentes se aceptan; si presentes deben ser strings no vacíos. `pageTexts` existe en el modelo legado pero el frontend lo omite: el Worker lo rechaza, junto a cualquier campo inesperado. Selección conservada sin reescritura/truncamiento. selectedText debe contener escritura japonesa; vecinos pueden contener nombres latinos. Diálogo aparentemente imperativo se trata como DATA, no se filtra mediante palabras clave.

Respuesta bare, sin envelope:

```json
{"natural":"No comí.","literal":"No comí.","notes":["El sujeto está omitido."]}
```

```json
{"natural":"No comí.","vocabulary":[{"expression":"食べなかった","reading":"たべなかった","baseForm":"食べる","meaning":"comer"}],"grammar":[{"expression":"なかった","explanation":"Pasado negativo."}]}
```

literal/notes y reading/baseForm opcionales conforme al frontend. Natural, vocab.expression/meaning y grammar.expression/explanation obligatorios no vacíos. Máximo 6.000 caracteres por string, 20 notes, 40 vocabulary, 20 grammar. Reading, cuando aparece, en kana. Respuesta completa <=90 KB UTF-8 (cliente admite 100 KB). Sin propiedades extra, arrays en lugar de objetos, HTML/URLs ni Markdown envolviendo JSON. Validación manual también tras JSON Mode, sin eval, reparaciones o inferencia adicional.

Body <=24.000 bytes, incluyendo lectura streaming independiente de Content-Length; rechazo antes de inferir. Solo JSON válido/UTF-8; sin HTML, URLs con esquema/www, controles peligrosos o objetos inesperados. El prompt utiliza mensajes system/user separados y JSON con delimitadores OCR_DATA_JSON; valores OCR no confiables, incluso si imitan delimitadores o instrucciones. Esto reduce riesgo de inyección, no demuestra que un LLM sea inmune a ella.

Translate pide idioma natural, nombres/tono coloquial, literal separado, brevedad, ambigüedad real y ausencia de sujetos/género/relaciones inventados. Study pide vocabulario/gramática presentes, superficie y base cuando proceda, lectura kana, explicaciones útiles y breves, sin lección genérica ni etiquetas JLPT especulativas. Ambos reconocen OCR dudoso sin inventar lo que mostraba la imagen. Validador estructural no puede demostrar corrección lingüística; requiere benchmark humano posterior.

## CORS, protección y privacidad

`OPTIONS /assist` permite POST y Content-Type. `ALLOWED_ORIGINS` es lista configurable exacta: https://carlospuyana.github.io, http://localhost:4200, http://127.0.0.1:4200. Sin wildcard ni credentials. Origen ajeno/null:403. Herramientas locales sin Origin permitidas; CORS no autentica clientes ni evita abuso desde servidores.

Binding `ASSIST_RATE_LIMITER`: 10/minuto por key CF-Connecting-IP, transitoria, sin logs personalizados ni almacenamiento propio. Sin IP (dev) usa bucket local-development compartido. Límite aproximado/eventualmente consistente y por ubicación Cloudflare, no contabilidad global ni garantía antiabuso. Si falla el binding se rechaza antes de inferir. No se añaden KV/D1/R2 ni contadores propios. Configuración de observability desactivada; no console.log de input, IP, prompts o respuestas.

Recibe texto limitado, sin imágenes, archivos, IDs de volumen/usuario, email, cookies o token de Kana Study. Se rechazan auth/cookies/campos inesperados; no tracking ni cache server-side. Respuestas no-store. La cache existente sigue en el navegador. Cloudflare procesa el texto: consultar sus políticas de datos antes de habilitar la función; «no guardar server-side» describe nuestro Worker, no una promesa sobre el proveedor.

## Errores estables

| error | HTTP |
|---|---|
| invalid_request | 400 |
| origin_not_allowed | 403 |
| not_found | 404 |
| method_not_allowed | 405 |
| rate_limited | 429 |
| invalid_ai_response | 502 |
| ai_unavailable | 503 |

Error body `{"error":"..."}`; sin stack, prompt ni detalles internos. Cuota/capacidad/rate upstream/JSON Mode que falla al ejecutar se agrupan en ai_unavailable: no se atribuye causa sin señal fiable. JSON devuelto pero inválido: invalid_ai_response. Angular conserva su manejo genérico actual y JMdict sigue disponible; no se cambian i18n/UI ahora.
