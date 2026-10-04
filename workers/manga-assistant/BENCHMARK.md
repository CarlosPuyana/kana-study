# Benchmark real Manga Assistant V1 — 2026-10-04

Actualización: ver «Tercera ejecución: Gemma plain JSON sin thinking — comparación final TRANSLATE» al final. Las tandas anteriores se conservan como histórico, incluidos todos los resultados y puntuaciones Llama.

Fase 1, exclusivamente translate/es. Worker local Wrangler 4.147.0 + binding AI remoto real. 18 peticiones POST /assist, seis por modelo, secuenciales, una por combinación, sin reintentos. Pausa de 6,5 s entre peticiones; seis por sesión, por debajo de 10/min. Se detuvieron los tres procesos dev al terminar. Sin deploy, conexión Angular, cambios de endpoint, secrets ni imágenes.

## Método y alcance

Se reutilizaron README, wrangler.jsonc y scripts/benchmark.mjs. Corrección técnica autorizada exclusivamente en el script: ahora acepta contextText/previousText/nextText opcionales y registra errores de transporte sin retry. No se cambió Worker, prompt, validador, modelo default ni configuración persistente. Los modelos se seleccionaron con flags --var durante dev. Llama: AI_JSON_MODE=schema; GLM/Gemma: prompt, según el flujo opcional previsto. La comparación combina modelo y modo de output, no aísla ambos factores.

OCR procedente de los bloques de pages.zip observados en la prueba real previa. No se extrajeron/copiaran imágenes. Los valores de input siguientes se enviaron exactamente, sin correcciones visuales, bases JMdict, traducciones esperadas ni instrucciones adicionales al modelo. CASO B usa selectedText del bloque final «します！» y previousText del bloque «よろしくお願い»: se preserva la separación real, no se fabrica un bloque combinado. CASO D selecciona la superficie y envía el bloque contenedor completo. Target es se aplica en todos.

Las latencias son elapsedMs del script: tiempo extremo a extremo (HTTP local + AI remoto + validación), no tiempo puro de generación. La medición no incluye la pausa entre requests. success significa HTTP 200 + resultado aceptado por el Worker; error significa HTTP 502 con el error público.

## Métricas objetivas

| Modelo | JSON mode | Requests | Traducciones aceptadas | Errores | Media ms | Mediana ms | Tokens / Neurons |
|---|---|---:|---:|---|---:|---:|---|
| LLAMA | schema | 6 | 6/6 | ninguno | 2213.0 | 2031.0 | no disponible |
| GLM | prompt | 6 | 0/6 | 6 × invalid_ai_response (502) | 6886.3 | 6978.5 | no disponible |
| GEMMA | prompt | 6 | 0/6 | 6 × invalid_ai_response (502) | 12359.5 | 11821.0 | no disponible |

Workers AI real funcionó para Llama y se alcanzó la fase de respuesta/validación de AI en los otros dos (no hubo ai_unavailable). No hay traducciones aceptadas GLM/Gemma visibles a través de /assist. Los doce errores no demuestran mala traducción ni JSON generado inválido: pueden ser incompatibilidad del formato de salida del binding.

El validador actual parseAiOutput exige output.response. Las fichas oficiales de [GLM](https://developers.cloudflare.com/workers-ai/models/glm-4.7-flash/) y [Gemma](https://developers.cloudflare.com/workers-ai/models/gemma-4-26b-a4b-it/) documentan un envelope de salida con choices y usage. Esto identifica una incompatibilidad documentada con el adaptador actual y explica plausiblemente el rechazo, pero el output upstream crudo no fue capturado, así que no se afirma su contenido ni el motivo exacto de cada rechazo. No se modificó el adaptador ni se hicieron llamadas adicionales para inspeccionarlo.

El Worker no expone usage y no se añadió instrumentación. Tokens/Neurons: **no disponible** en las 18 respuestas observadas. No se estima consumo. No se distingue «dato descartado por Worker» de «dato ausente en proveedor». No se consultaron credenciales ni headers sensibles.

## Casos y outputs completos

### CASO A

Input real común para los tres modelos:

```json
{
  "schemaVersion": 1,
  "mode": "translate",
  "request": {
    "selectedText": "ありがとう",
    "targetLanguage": "es",
    "contextText": "ありがとう\nございました。",
    "previousText": "ああのっ",
    "nextText": "二つまく言うえたなあ\n変わちゃん"
  }
}
```

#### LLAMA

Modelo: `@cf/meta/llama-3.3-70b-instruct-fp8-fast`. mode: translate. caseId: A. HTTP 200; success. Latencia: 1820 ms. Tokens/Neurons: no disponible.

Natural: gracias

Literal: no devuelto

Notas:
- La traducción se basa en el contexto de agradecimiento

Output JSON íntegro recibido por el script:

```json
{
  "natural": "gracias",
  "notes": [
    "La traducción se basa en el contexto de agradecimiento"
  ]
}
```

#### GLM

Modelo: `@cf/zai-org/glm-4.7-flash`. mode: translate. caseId: A. HTTP 502; error. Latencia: 6440 ms. Tokens/Neurons: no disponible.

Natural/literal/notas: no disponibles; el Worker rechazó la respuesta upstream. No se oculta una traducción recibida por el script: /assist solo entregó el error siguiente, sin texto del modelo.

Output JSON íntegro recibido por el script:

```json
{
  "error": "invalid_ai_response"
}
```

#### GEMMA

Modelo: `@cf/google/gemma-4-26b-a4b-it`. mode: translate. caseId: A. HTTP 502; error. Latencia: 10821 ms. Tokens/Neurons: no disponible.

Natural/literal/notas: no disponibles; el Worker rechazó la respuesta upstream. No se oculta una traducción recibida por el script: /assist solo entregó el error siguiente, sin texto del modelo.

Output JSON íntegro recibido por el script:

```json
{
  "error": "invalid_ai_response"
}
```

Evaluación cualitativa Llama: Agradecimiento conservado y español comprensible. La nota sobre el contexto aporta poco. No inventa sujeto ni género; el vecino dudoso no es necesario para traducir la selección.

GLM/Gemma: calidad lingüística no evaluable; ningún texto de traducción accesible.

### CASO B

Input real común para los tres modelos:

```json
{
  "schemaVersion": 1,
  "mode": "translate",
  "request": {
    "selectedText": "します！",
    "targetLanguage": "es",
    "previousText": "よろしくお願い"
  }
}
```

#### LLAMA

Modelo: `@cf/meta/llama-3.3-70b-instruct-fp8-fast`. mode: translate. caseId: B. HTTP 200; success. Latencia: 3546 ms. Tokens/Neurons: no disponible.

Natural: ¡Haré!

Literal: no devuelto

Notas:
- La traducción se basa en el contexto de una solicitud o petición, por lo que 'します' se traduce como 'Haré' para mantener el tono coloquial y la cortesía.

Output JSON íntegro recibido por el script:

```json
{
  "natural": "¡Haré!",
  "notes": [
    "La traducción se basa en el contexto de una solicitud o petición, por lo que 'します' se traduce como 'Haré' para mantener el tono coloquial y la cortesía."
  ]
}
```

#### GLM

Modelo: `@cf/zai-org/glm-4.7-flash`. mode: translate. caseId: B. HTTP 502; error. Latencia: 5601 ms. Tokens/Neurons: no disponible.

Natural/literal/notas: no disponibles; el Worker rechazó la respuesta upstream. No se oculta una traducción recibida por el script: /assist solo entregó el error siguiente, sin texto del modelo.

Output JSON íntegro recibido por el script:

```json
{
  "error": "invalid_ai_response"
}
```

#### GEMMA

Modelo: `@cf/google/gemma-4-26b-a4b-it`. mode: translate. caseId: B. HTTP 502; error. Latencia: 16534 ms. Tokens/Neurons: no disponible.

Natural/literal/notas: no disponibles; el Worker rechazó la respuesta upstream. No se oculta una traducción recibida por el script: /assist solo entregó el error siguiente, sin texto del modelo.

Output JSON íntegro recibido por el script:

```json
{
  "error": "invalid_ai_response"
}
```

Evaluación cualitativa Llama: Fallo semántico importante: «¡Haré!» convierte la parte final de よろしくお願いします en una promesa en primera persona. No integra adecuadamente el bloque anterior; nota explicativa falsa seguridad.

GLM/Gemma: calidad lingüística no evaluable; ningún texto de traducción accesible.

### CASO C

Input real común para los tres modelos:

```json
{
  "schemaVersion": 1,
  "mode": "translate",
  "request": {
    "selectedText": "ひまわりには負けぬ",
    "targetLanguage": "es",
    "previousText": "あるさあは",
    "nextText": "わいとラフな\nカッコが合うかも"
  }
}
```

#### LLAMA

Modelo: `@cf/meta/llama-3.3-70b-instruct-fp8-fast`. mode: translate. caseId: C. HTTP 200; success. Latencia: 2087 ms. Tokens/Neurons: no disponible.

Natural: No me dejo vencer por los girasoles

Literal: no devuelto

Notas:
- La traducción intenta mantener el tono poético y la metáfora del original.

Output JSON íntegro recibido por el script:

```json
{
  "natural": "No me dejo vencer por los girasoles",
  "notes": [
    "La traducción intenta mantener el tono poético y la metáfora del original."
  ]
}
```

#### GLM

Modelo: `@cf/zai-org/glm-4.7-flash`. mode: translate. caseId: C. HTTP 502; error. Latencia: 6562 ms. Tokens/Neurons: no disponible.

Natural/literal/notas: no disponibles; el Worker rechazó la respuesta upstream. No se oculta una traducción recibida por el script: /assist solo entregó el error siguiente, sin texto del modelo.

Output JSON íntegro recibido por el script:

```json
{
  "error": "invalid_ai_response"
}
```

#### GEMMA

Modelo: `@cf/google/gemma-4-26b-a4b-it`. mode: translate. caseId: C. HTTP 502; error. Latencia: 11211 ms. Tokens/Neurons: no disponible.

Natural/literal/notas: no disponibles; el Worker rechazó la respuesta upstream. No se oculta una traducción recibida por el script: /assist solo entregó el error siguiente, sin texto del modelo.

Output JSON íntegro recibido por el script:

```json
{
  "error": "invalid_ai_response"
}
```

Evaluación cualitativa Llama: Reconoce el negativo, pero interpreta ひまわり como girasoles (plural) y añade primera persona. La lectura como nombre propio Himawari sigue siendo plausible en este manga. La nota atribuye tono poético/metáfora sin evidencia suficiente. No se fuerza como verdad una identidad no demostrada por estos textos.

GLM/Gemma: calidad lingüística no evaluable; ningún texto de traducción accesible.

### CASO D

Input real común para los tres modelos:

```json
{
  "schemaVersion": 1,
  "mode": "translate",
  "request": {
    "selectedText": "させたかった",
    "targetLanguage": "es",
    "contextText": "あかりにもともたちゃんコス\nさせたかったんですけど\nこの髪型に耳は\nバランスが悪かった\nいいです．．．",
    "previousText": "まんてん",
    "nextText": "さあ～"
  }
}
```

#### LLAMA

Modelo: `@cf/meta/llama-3.3-70b-instruct-fp8-fast`. mode: translate. caseId: D. HTTP 200; success. Latencia: 2412 ms. Tokens/Neurons: no disponible.

Natural: Quería que se disfrazara

Literal: no devuelto

Notas:
- La expresión 'させたかった' se refiere a un deseo o intención del hablante de que alguien hiciera algo, en este caso, disfrazarse.

Output JSON íntegro recibido por el script:

```json
{
  "natural": "Quería que se disfrazara",
  "notes": [
    "La expresión 'させたかった' se refiere a un deseo o intención del hablante de que alguien hiciera algo, en este caso, disfrazarse."
  ]
}
```

#### GLM

Modelo: `@cf/zai-org/glm-4.7-flash`. mode: translate. caseId: D. HTTP 502; error. Latencia: 7852 ms. Tokens/Neurons: no disponible.

Natural/literal/notas: no disponibles; el Worker rechazó la respuesta upstream. No se oculta una traducción recibida por el script: /assist solo entregó el error siguiente, sin texto del modelo.

Output JSON íntegro recibido por el script:

```json
{
  "error": "invalid_ai_response"
}
```

#### GEMMA

Modelo: `@cf/google/gemma-4-26b-a4b-it`. mode: translate. caseId: D. HTTP 502; error. Latencia: 10663 ms. Tokens/Neurons: no disponible.

Natural/literal/notas: no disponibles; el Worker rechazó la respuesta upstream. No se oculta una traducción recibida por el script: /assist solo entregó el error siguiente, sin texto del modelo.

Output JSON íntegro recibido por el script:

```json
{
  "error": "invalid_ai_response"
}
```

Evaluación cualitativa Llama: Aprovecha コス del contexto y ofrece una interpretación causativa coherente («disfrazara»), sin recibir una base JMdict indicada por nosotros. No demuestra que sea la única interpretación; no reconoce la ambigüedad ni el OCR raro del nombre. «Quería» no distingue primera/tercera persona ni género.

GLM/Gemma: calidad lingüística no evaluable; ningún texto de traducción accesible.

### CASO E

Input real común para los tres modelos:

```json
{
  "schemaVersion": 1,
  "mode": "translate",
  "request": {
    "selectedText": "百合姫谷も",
    "targetLanguage": "es",
    "previousText": "二つまく言うえたなあ\n変わちゃん",
    "nextText": "よろしくお願い"
  }
}
```

#### LLAMA

Modelo: `@cf/meta/llama-3.3-70b-instruct-fp8-fast`. mode: translate. caseId: E. HTTP 200; success. Latencia: 1975 ms. Tokens/Neurons: no disponible.

Natural: la princesa del valle de los lirios también

Literal: no devuelto

Notas:
- Posible referencia a un personaje o título de una obra, la traducción es literal y puede variar dependiendo del contexto

Output JSON íntegro recibido por el script:

```json
{
  "natural": "la princesa del valle de los lirios también",
  "notes": [
    "Posible referencia a un personaje o título de una obra, la traducción es literal y puede variar dependiendo del contexto"
  ]
}
```

#### GLM

Modelo: `@cf/zai-org/glm-4.7-flash`. mode: translate. caseId: E. HTTP 502; error. Latencia: 7395 ms. Tokens/Neurons: no disponible.

Natural/literal/notas: no disponibles; el Worker rechazó la respuesta upstream. No se oculta una traducción recibida por el script: /assist solo entregó el error siguiente, sin texto del modelo.

Output JSON íntegro recibido por el script:

```json
{
  "error": "invalid_ai_response"
}
```

#### GEMMA

Modelo: `@cf/google/gemma-4-26b-a4b-it`. mode: translate. caseId: E. HTTP 502; error. Latencia: 12431 ms. Tokens/Neurons: no disponible.

Natural/literal/notas: no disponibles; el Worker rechazó la respuesta upstream. No se oculta una traducción recibida por el script: /assist solo entregó el error siguiente, sin texto del modelo.

Output JSON íntegro recibido por el script:

```json
{
  "error": "invalid_ai_response"
}
```

Evaluación cualitativa Llama: Traduce componentes como «princesa/valle/lirios», lo que resulta poco prudente para un posible nombre/título con OCR defectuoso. La nota reconoce posible título/personaje y variación contextual, pero no señala claramente la anomalía OCR. No reconstruye explícitamente un supuesto original visual.

GLM/Gemma: calidad lingüística no evaluable; ningún texto de traducción accesible.

### CASO F

Input real común para los tres modelos:

```json
{
  "schemaVersion": 1,
  "mode": "translate",
  "request": {
    "selectedText": "そういう\nいやがたより\nこっちかなぁ",
    "targetLanguage": "es",
    "nextText": "いかた"
  }
}
```

#### LLAMA

Modelo: `@cf/meta/llama-3.3-70b-instruct-fp8-fast`. mode: translate. caseId: F. HTTP 200; success. Latencia: 1438 ms. Tokens/Neurons: no disponible.

Natural: Me pregunto si será más bien así

Literal: no devuelto

Notas:
- La traducción intenta capturar el tono informal y la incertidumbre de la expresión original

Output JSON íntegro recibido por el script:

```json
{
  "natural": "Me pregunto si será más bien así",
  "notes": [
    "La traducción intenta capturar el tono informal y la incertidumbre de la expresión original"
  ]
}
```

#### GLM

Modelo: `@cf/zai-org/glm-4.7-flash`. mode: translate. caseId: F. HTTP 502; error. Latencia: 7468 ms. Tokens/Neurons: no disponible.

Natural/literal/notas: no disponibles; el Worker rechazó la respuesta upstream. No se oculta una traducción recibida por el script: /assist solo entregó el error siguiente, sin texto del modelo.

Output JSON íntegro recibido por el script:

```json
{
  "error": "invalid_ai_response"
}
```

#### GEMMA

Modelo: `@cf/google/gemma-4-26b-a4b-it`. mode: translate. caseId: F. HTTP 502; error. Latencia: 12497 ms. Tokens/Neurons: no disponible.

Natural/literal/notas: no disponibles; el Worker rechazó la respuesta upstream. No se oculta una traducción recibida por el script: /assist solo entregó el error siguiente, sin texto del modelo.

Output JSON íntegro recibido por el script:

```json
{
  "error": "invalid_ai_response"
}
```

Evaluación cualitativa Llama: Conserva cierta duda coloquial, pero omite parte del contraste より y no explica いやがた, que es OCR dudoso. Añade «Me pregunto» sin sujeto explícito; nota genérica y sin advertencia del fragmento corrupto.

GLM/Gemma: calidad lingüística no evaluable; ningún texto de traducción accesible.

## Evaluación cualitativa (separada de medidas objetivas)

Escala 1 malo, 2 problemático, 3 correcto, 4 bueno, 5 excelente. Juicio provisional sobre estas seis muestras, sin traducción humana de referencia completa ni revisión de imágenes en esta ejecución. Cuando no hay evidencia de un problema, la puntuación no prueba una capacidad general.

| Llama / caso | Fidelidad | Naturalidad | Sujeto omitido | Género | Tono | Ambigüedad | Prudencia OCR | Concisión |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| A | 5 | 4 | 5 | 5 | 4 | 3 | 5 | 3 |
| B | 1 | 1 | 1 | 5 | 1 | 1 | 4 | 2 |
| C | 2 | 4 | 2 | 5 | 2 | 1 | 4 | 2 |
| D | 4 | 5 | 4 | 5 | 4 | 3 | 4 | 4 |
| E | 2 | 2 | 5 | 5 | 3 | 3 | 2 | 3 |
| F | 2 | 4 | 2 | 5 | 4 | 2 | 1 | 3 |

Llama: media orientativa de estas 48 valoraciones **3,19/5**. GLM/Gemma: **N/E**, no asignar 1/5 lingüístico por un fallo del adaptador. JSON y latencia se mantienen como métricas objetivas: 6/6 resultados aceptados Llama; 0/6 para los otros modelos en la integración actual, sin evidencia de su JSON interno.

Sujetos: Llama introduce primera persona en B («Haré»), C («me dejo») y F («Me pregunto») sin explicitar la ambigüedad. No se observó género de hablante inventado en los textos disponibles; «princesa» en E viene de 姫, pero la identificación del nombre/título sigue siendo problemática. No hubo corrección explícita a 百合姫S: aun así, E/F muestran falta de prudencia OCR y las notas tienden a ser genéricas.

## Recomendación provisional

No hay ganador definitivo ni comparación lingüística válida de los tres: solo Llama es evaluable a través del Worker actual. Para una siguiente fase propongo provisionalmente **Llama + GLM**, condicionada a una corrección del adaptador de output expresamente autorizada antes de nuevas inferencias. Llama aporta baseline funcional; GLM es el candidato alternativo con menor latencia observada que Gemma (medidas de peticiones rechazadas, no rapidez hasta una traducción validada). Esto es una elección operativa para investigar, **no una conclusión de superioridad lingüística**. Gemma no se descarta por calidad, que sigue desconocida.

No ejecutar study todavía. Resolver compatibilidad y confirmar outputs antes de sacar conclusiones comparativas. Se agotó únicamente la batería autorizada de 18 peticiones; no se hicieron retries, pruebas extra ni inferencias para diagnóstico.

## Segunda ejecución: adaptación de output — 2026-10-04

Esta sección actualiza el estado; los resultados y valoraciones de la primera ejecución permanecen arriba como histórico. Se corrigió EXCLUSIVAMENTE la extracción del output en validation.ts y se añadió test/ai-output.test.ts. No se modificaron prompts, temperatura, max_tokens, schemas, criterios de evaluación, script, config persistente ni frontend.

### Formatos soportados y validación

extractAssistantContent es una función pura con rutas explícitas: output.response como string o objeto (Llama / JSON Mode), o una única choices[0].message.content textual (GLM/Gemma), con role assistant o ausente. No busca strings recursivamente, no toma reasoning_content como respuesta, no serializa el envelope como traducción. Objetos solo admitidos en response según el caso estructurado documentado de JSON Mode; no se asume contenido objeto/array en chat completions. Envelopes ambiguos, choices vacío/múltiple, message ausente, contenido vacío y shapes desconocidos fallan. parseAiOutput conserva límite 90 KB, JSON.parse solo para strings y validación de schema posterior. No Markdown stripping, eval, reparaciones ni inferencia adicional.

Fuentes oficiales: [Llama](https://developers.cloudflare.com/workers-ai/models/llama-3.3-70b-instruct-fp8-fast/), [JSON Mode estructurado](https://developers.cloudflare.com/workers-ai/features/json-mode/), [GLM](https://developers.cloudflare.com/workers-ai/models/glm-4.7-flash/), [Gemma](https://developers.cloudflare.com/workers-ai/models/gemma-4-26b-a4b-it/).

### Ejecución real y límites de lo observado

Exactamente 12 nuevos POST: seis GLM + seis Gemma, translate/es, secuenciales y sin retries. No se repitió Llama ni se ejecutó study real. Mismos inputs verificados por igualdad exacta con los de la primera ejecución; prompts sin cambios, SHA256 488C648A35CDD9B3D3946A3B27E6952611D02BEAEB94FE82533FA522CC5B3779. Wrangler 4.147.0 local + AI remoto, AI_JSON_MODE=prompt para ambos igual que antes. Pausa 6,5 s tras cada petición, una sesión dev por modelo, procesos detenidos al terminar. No deploy.

**Resultado: 12/12 siguen devolviendo HTTP 502 invalid_ai_response.** La corrección de soporte de envelopes documentados no basta para obtener traducciones aceptadas bajo las condiciones fijadas. El error público es compatible con shape no admitido, contenido vacío/JSON inválido/schema incompatible, entre otras causas; sin output upstream crudo no se determina cuál ocurrió. No se afirma ahora que los doce fallos se deban exclusivamente a response frente a choices. No se cambiaron prompts ni se relajó validación para conseguir éxito artificialmente.

El script conserva únicamente request, HTTP, elapsedMs y resultado público de /assist. No conserva el output original de AI.run, y los errores del Worker lo ocultan por diseño. Por eso no hay natural/literal/notes reales que recuperar para estas doce llamadas: todos los outputs accesibles completos aparecen debajo. No se fabrican traducciones ni puntuaciones lingüísticas para suplirlos. Usage/neuron usage permanece **no disponible a través del Worker**; no se estima consumo ni se afirma que Cloudflare no lo haya generado.

### Tabla final comparable: seis casos translate

| Modelo | Tanda utilizada | A | B | C | D | E | F | JSON traducido válido | Media ms | Mediana ms | Calidad cualitativa |
|---|---|---|---|---|---|---|---|---|---:|---:|---|
| Llama | original, no repetida | 200 | 200 | 200 | 200 | 200 | 200 | 6/6 | 2213,0 | 2031,0 | 3,19/5, misma valoración anterior |
| GLM | segunda | 502 | 502 | 502 | 502 | 502 | 502 | 0/6 | 6555.5 | 6452.5 | N/E |
| GEMMA | segunda | 502 | 502 | 502 | 502 | 502 | 502 | 0/6 | 11207.3 | 12353.0 | N/E |

Latencias extremo a extremo, mismas definiciones anteriores. Los errores públicos sí son JSON parseable, pero **no** cumplen el schema de traducción; eso no mide validez del JSON que pudiera haber generado el modelo. No confundir menor tiempo hasta un error con mejor latencia hasta una traducción útil.

### Inputs y outputs íntegros de la segunda tanda

#### CASO A — mismo OCR sin corregir

Input para ambos modelos (idéntico al histórico):

```json
{
  "schemaVersion": 1,
  "mode": "translate",
  "request": {
    "selectedText": "ありがとう",
    "targetLanguage": "es",
    "contextText": "ありがとう\nございました。",
    "previousText": "ああのっ",
    "nextText": "二つまく言うえたなあ\n変わちゃん"
  }
}
```

**GLM**, model `@cf/zai-org/glm-4.7-flash`, case A, mode translate. HTTP 502, error; latencyMs 7849; tokens/Neurons no disponible.

Natural: no disponible. Literal: no disponible. Notes: no disponibles. El Worker no devolvió texto de traducción.

Output público completo:

```json
{
  "error": "invalid_ai_response"
}
```

**GEMMA**, model `@cf/google/gemma-4-26b-a4b-it`, case A, mode translate. HTTP 502, error; latencyMs 15487; tokens/Neurons no disponible.

Natural: no disponible. Literal: no disponible. Notes: no disponibles. El Worker no devolvió texto de traducción.

Output público completo:

```json
{
  "error": "invalid_ai_response"
}
```

#### CASO B — mismo OCR sin corregir

Input para ambos modelos (idéntico al histórico):

```json
{
  "schemaVersion": 1,
  "mode": "translate",
  "request": {
    "selectedText": "します！",
    "targetLanguage": "es",
    "previousText": "よろしくお願い"
  }
}
```

**GLM**, model `@cf/zai-org/glm-4.7-flash`, case B, mode translate. HTTP 502, error; latencyMs 5376; tokens/Neurons no disponible.

Natural: no disponible. Literal: no disponible. Notes: no disponibles. El Worker no devolvió texto de traducción.

Output público completo:

```json
{
  "error": "invalid_ai_response"
}
```

**GEMMA**, model `@cf/google/gemma-4-26b-a4b-it`, case B, mode translate. HTTP 502, error; latencyMs 3554; tokens/Neurons no disponible.

Natural: no disponible. Literal: no disponible. Notes: no disponibles. El Worker no devolvió texto de traducción.

Output público completo:

```json
{
  "error": "invalid_ai_response"
}
```

#### CASO C — mismo OCR sin corregir

Input para ambos modelos (idéntico al histórico):

```json
{
  "schemaVersion": 1,
  "mode": "translate",
  "request": {
    "selectedText": "ひまわりには負けぬ",
    "targetLanguage": "es",
    "previousText": "あるさあは",
    "nextText": "わいとラフな\nカッコが合うかも"
  }
}
```

**GLM**, model `@cf/zai-org/glm-4.7-flash`, case C, mode translate. HTTP 502, error; latencyMs 7729; tokens/Neurons no disponible.

Natural: no disponible. Literal: no disponible. Notes: no disponibles. El Worker no devolvió texto de traducción.

Output público completo:

```json
{
  "error": "invalid_ai_response"
}
```

**GEMMA**, model `@cf/google/gemma-4-26b-a4b-it`, case C, mode translate. HTTP 502, error; latencyMs 9654; tokens/Neurons no disponible.

Natural: no disponible. Literal: no disponible. Notes: no disponibles. El Worker no devolvió texto de traducción.

Output público completo:

```json
{
  "error": "invalid_ai_response"
}
```

#### CASO D — mismo OCR sin corregir

Input para ambos modelos (idéntico al histórico):

```json
{
  "schemaVersion": 1,
  "mode": "translate",
  "request": {
    "selectedText": "させたかった",
    "targetLanguage": "es",
    "contextText": "あかりにもともたちゃんコス\nさせたかったんですけど\nこの髪型に耳は\nバランスが悪かった\nいいです．．．",
    "previousText": "まんてん",
    "nextText": "さあ～"
  }
}
```

**GLM**, model `@cf/zai-org/glm-4.7-flash`, case D, mode translate. HTTP 502, error; latencyMs 5474; tokens/Neurons no disponible.

Natural: no disponible. Literal: no disponible. Notes: no disponibles. El Worker no devolvió texto de traducción.

Output público completo:

```json
{
  "error": "invalid_ai_response"
}
```

**GEMMA**, model `@cf/google/gemma-4-26b-a4b-it`, case D, mode translate. HTTP 502, error; latencyMs 11768; tokens/Neurons no disponible.

Natural: no disponible. Literal: no disponible. Notes: no disponibles. El Worker no devolvió texto de traducción.

Output público completo:

```json
{
  "error": "invalid_ai_response"
}
```

#### CASO E — mismo OCR sin corregir

Input para ambos modelos (idéntico al histórico):

```json
{
  "schemaVersion": 1,
  "mode": "translate",
  "request": {
    "selectedText": "百合姫谷も",
    "targetLanguage": "es",
    "previousText": "二つまく言うえたなあ\n変わちゃん",
    "nextText": "よろしくお願い"
  }
}
```

**GLM**, model `@cf/zai-org/glm-4.7-flash`, case E, mode translate. HTTP 502, error; latencyMs 7003; tokens/Neurons no disponible.

Natural: no disponible. Literal: no disponible. Notes: no disponibles. El Worker no devolvió texto de traducción.

Output público completo:

```json
{
  "error": "invalid_ai_response"
}
```

**GEMMA**, model `@cf/google/gemma-4-26b-a4b-it`, case E, mode translate. HTTP 502, error; latencyMs 13843; tokens/Neurons no disponible.

Natural: no disponible. Literal: no disponible. Notes: no disponibles. El Worker no devolvió texto de traducción.

Output público completo:

```json
{
  "error": "invalid_ai_response"
}
```

#### CASO F — mismo OCR sin corregir

Input para ambos modelos (idéntico al histórico):

```json
{
  "schemaVersion": 1,
  "mode": "translate",
  "request": {
    "selectedText": "そういう\nいやがたより\nこっちかなぁ",
    "targetLanguage": "es",
    "nextText": "いかた"
  }
}
```

**GLM**, model `@cf/zai-org/glm-4.7-flash`, case F, mode translate. HTTP 502, error; latencyMs 5902; tokens/Neurons no disponible.

Natural: no disponible. Literal: no disponible. Notes: no disponibles. El Worker no devolvió texto de traducción.

Output público completo:

```json
{
  "error": "invalid_ai_response"
}
```

**GEMMA**, model `@cf/google/gemma-4-26b-a4b-it`, case F, mode translate. HTTP 502, error; latencyMs 12938; tokens/Neurons no disponible.

Natural: no disponible. Literal: no disponible. Notes: no disponibles. El Worker no devolvió texto de traducción.

Output público completo:

```json
{
  "error": "invalid_ai_response"
}
```

### Evaluación humana y recomendación actualizada

Se mantienen la escala y criterios anteriores. Llama conserva su 3,19/5 y las observaciones de B (persona/tiempo impuesto), C (girasoles frente a posible nombre propio), D (uso del contexto コス) y E/F (insuficiente prudencia OCR); no se reevaluó mediante llamadas nuevas. GLM y Gemma no tienen texto accesible: no es posible evaluar fidelidad, naturalidad, sujetos/género, tono, ambigüedad, OCR ni concisión. No se les asigna una nota inventada ni 1/5 por un fallo técnico.

**No hay evidencia suficiente para recomendar dos finalistas lingüísticos para study.** Llama sigue siendo el único baseline evaluable. La propuesta operativa previa Llama + GLM continúa sin demostrar calidad de GLM y no debe tomarse como selección de finalistas. Antes de seleccionar el segundo, una tarea autorizada de diagnóstico deberá capturar de forma segura el output no sensible del binding y determinar la causa restante; esta fase no hace llamadas extra ni cambia condiciones. No se ejecutó study.

### Validación y alcance

23 tests nuevos; **68/68 tests Worker pasan**, sin consumir Workers AI real en tests. TypeScript Worker pasa. Prompts comprobados por hash, frontend sin diff en src/public. Los 705 tests Angular no se repitieron conforme a la petición. Cambios de esta tarea: src/validation.ts, test/ai-output.test.ts y este BENCHMARK.md; se conservan los cambios anteriores sin commit. Sin deploy, conexión Angular, secrets, commit ni push.

## Tercera ejecución: Gemma plain JSON sin thinking — comparación final TRANSLATE

Actualización de 2026-10-04. Las tandas anteriores se conservan como histórico. **Exactamente seis inferencias nuevas, todas Gemma/translate/es**. No llamadas Llama, GLM ni study; no retries. Wrangler 4.147.0 local, binding AI remoto, loopback, LOCAL_MODEL_BENCHMARK=1. Se detuvo el proceso tras seis llamadas. Inputs comparados por igualdad exacta con el histórico (incluidos contextText/previousText/nextText); no se corrigió OCR.

### Estrategias centralizadas

src/model-strategies.ts define Llama=json-schema/thinking n/a, Gemma=plain-json/thinking disabled y GLM=experimental/v1Benchmark false. Llama conserva literalmente sus instrucciones lingüísticas, schema mode, max_tokens=512 y temperature=0.1. Gemma comparte exactamente ese prompt y contenido de usuario, añade solo la instrucción técnica final «Return only one valid JSON object matching this structure. No Markdown. No code fences. No text before or after JSON.»; no recibe response_format y recibe chat_template_kwargs: {enable_thinking:false}, max_completion_tokens=512, temperature=0.1. AI_JSON_MODE legado no puede sobrescribir la estrategia del modelo. No JSON repair, regex, fences stripping, eval ni segunda inferencia.

El entry point scripts/benchmark-local.mjs delega en el Worker real y captura exclusivamente usage numérico del resultado AI.run. No está referenciado por producción ni Angular; máximo seis inferencias por sesión, translate solamente y modelos elegibles V1. GLM se rechaza antes de inferir. Producción conserva su respuesta bare y no añade telemetry al frontend.

### Medidas objetivas

| Modelo | Referencia | JSON válido | Media ms | Mediana ms | Neurons total | Neurons promedio |
|---|---|---|---:|---:|---:|---:|
| Llama | seis outputs originales, no repetidos | 6/6 | 2213,0 | 2031,0 | no disponible | no disponible |
| Gemma | seis nuevos outputs, misma semántica del prompt | 6/6 | 2144.8 | 1317.5 | 33.554544 | 5.592424 |

Latencias del script, extremo a extremo; no incluyen pausas de 6,5 segundos entre requests. Una muestra por caso/modelo, no múltiples repeticiones estadísticas. Gemma tiene menor mediana en esta tanda, pero sus casos D/F son más lentos y la media es similar a Llama; no generalizar como rendimiento estable. Los Neurons son exclusivamente cifras oficiales del provider, suma/promedio de estas seis llamadas, no consumo diario. No se usa el diagnóstico GLM como benchmark lingüístico.

### Usage oficial por caso Gemma

| Caso | Input/prompt tokens | Output/completion tokens | Total tokens | Neurons | Latency ms | HTTP |
|---|---:|---:|---:|---:|---:|---:|
| A | 412 | 13 | 425 | 4.099999904632568 | 980 | 200 |
| B | 390 | 66 | 456 | 5.345454216003418 | 869 | 200 |
| C | 412 | 27 | 439 | 4.481818199157715 | 1507 | 200 |
| D | 433 | 128 | 561 | 7.427272796630859 | 4714 | 200 |
| E | 407 | 92 | 499 | 6.209090709686279 | 1128 | 200 |
| F | 401 | 86 | 487 | 5.990908622741699 | 3671 | 200 |
| TOTAL | 2455 | 412 | 2867 | 33.55454444885254 | — | 6/6 success |
| PROMEDIO | 409.167 | 68.667 | 477.833 | 5.592424074808757 | 2144.833 | — |

### Seis casos, outputs completos en paralelo

#### CASO A

Japonés y contexto exactos, enviados sin traducciones esperadas ni correcciones:

```json
{
  "schemaVersion": 1,
  "mode": "translate",
  "request": {
    "selectedText": "ありがとう",
    "targetLanguage": "es",
    "contextText": "ありがとう\nございました。",
    "previousText": "ああのっ",
    "nextText": "二つまく言うえたなあ\n変わちゃん"
  }
}
```

| Campo | LLAMA original | GEMMA nuevo |
|---|---|---|
| natural | gracias | Gracias |
| literal | no devuelto | Gracias |
| notes completas | ["La traducción se basa en el contexto de agradecimiento"] | [] |
| latencyMs | 1820 | 980 |
| success/error | success, HTTP 200 | success, HTTP 200 |
| model | @cf/meta/llama-3.3-70b-instruct-fp8-fast | @cf/google/gemma-4-26b-a4b-it |

Output JSON Gemma íntegro:

```json
{
  "natural": "Gracias",
  "literal": "Gracias",
  "notes": []
}
```

Evaluación humana: Gemma conserva el agradecimiento con salida limpia y sin notas redundantes; Llama añade una nota genérica. Ninguno inventa sujeto/género.

#### CASO B

Japonés y contexto exactos, enviados sin traducciones esperadas ni correcciones:

```json
{
  "schemaVersion": 1,
  "mode": "translate",
  "request": {
    "selectedText": "します！",
    "targetLanguage": "es",
    "previousText": "よろしくお願い"
  }
}
```

| Campo | LLAMA original | GEMMA nuevo |
|---|---|---|
| natural | ¡Haré! | ¡Mucho gusto! |
| literal | no devuelto | ¡Lo haré! |
| notes completas | ["La traducción se basa en el contexto de una solicitud o petición, por lo que 'します' se traduce como 'Haré' para mantener el tono coloquial y la cortesía."] | ["La frase completa es 'Yoroshiku onegaishimasu'. Aunque la traducción literal de 'shimasu' es 'hacer', en este contexto es la fórmula estándar para presentarse o pedir un favor."] |
| latencyMs | 3546 | 869 |
| success/error | success, HTTP 200 | success, HTTP 200 |
| model | @cf/meta/llama-3.3-70b-instruct-fp8-fast | @cf/google/gemma-4-26b-a4b-it |

Output JSON Gemma íntegro:

```json
{
  "natural": "¡Mucho gusto!",
  "literal": "¡Lo haré!",
  "notes": [
    "La frase completa es 'Yoroshiku onegaishimasu'. Aunque la traducción literal de 'shimasu' es 'hacer', en este contexto es la fórmula estándar para presentarse o pedir un favor."
  ]
}
```

Evaluación humana: Gemma reconoce la fórmula completa a partir de previousText, pero «¡Mucho gusto!» impone una situación de presentación no establecida. Literal «¡Lo haré!» sigue imponiendo primera persona/futuro. Su nota reconoce también el uso para pedir un favor; no corrige el problema por sí sola. Llama «¡Haré!» impone persona/tiempo y no integra bien la fórmula.

#### CASO C

Japonés y contexto exactos, enviados sin traducciones esperadas ni correcciones:

```json
{
  "schemaVersion": 1,
  "mode": "translate",
  "request": {
    "selectedText": "ひまわりには負けぬ",
    "targetLanguage": "es",
    "previousText": "あるさあは",
    "nextText": "わいとラフな\nカッコが合うかも"
  }
}
```

| Campo | LLAMA original | GEMMA nuevo |
|---|---|---|
| natural | No me dejo vencer por los girasoles | No perderé ante los girasoles |
| literal | no devuelto | No perderé contra los girasoles |
| notes completas | ["La traducción intenta mantener el tono poético y la metáfora del original."] | [] |
| latencyMs | 2087 | 1507 |
| success/error | success, HTTP 200 | success, HTTP 200 |
| model | @cf/meta/llama-3.3-70b-instruct-fp8-fast | @cf/google/gemma-4-26b-a4b-it |

Output JSON Gemma íntegro:

```json
{
  "natural": "No perderé ante los girasoles",
  "literal": "No perderé contra los girasoles",
  "notes": []
}
```

Evaluación humana: Ambos imponen girasoles (plural) y primera persona; ninguno advierte que ひまわり podría ser Himawari, nombre propio contextual. Gemma añade futuro en «No perderé». No se afirma que el texto por sí solo pruebe una identidad concreta.

#### CASO D

Japonés y contexto exactos, enviados sin traducciones esperadas ni correcciones:

```json
{
  "schemaVersion": 1,
  "mode": "translate",
  "request": {
    "selectedText": "させたかった",
    "targetLanguage": "es",
    "contextText": "あかりにもともたちゃんコス\nさせたかったんですけど\nこの髪型に耳は\nバランスが悪かった\nいいです．．．",
    "previousText": "まんてん",
    "nextText": "さあ～"
  }
}
```

| Campo | LLAMA original | GEMMA nuevo |
|---|---|---|
| natural | Quería que se disfrazara | Quería que Akari se vistiera de Momotaro, pero con este peinado y las orejas, no se veía equilibrado. |
| literal | no devuelto | Quería haber hecho que Akari hiciera el cosplay de Momotaro, pero con este peinado las orejas tenían un mal equilibrio. |
| notes completas | ["La expresión 'させたかった' se refiere a un deseo o intención del hablante de que alguien hiciera algo, en este caso, disfrazarse."] | ["'させたかった' indica un deseo no realizado en el pasado.","'ちゃんコス' es una abreviatura coloquial de 'cosplay de [personaje]'.","'バランスが悪かった' se refiere a la falta de armonía visual entre el peinado y las orejas."] |
| latencyMs | 2412 | 4714 |
| success/error | success, HTTP 200 | success, HTTP 200 |
| model | @cf/meta/llama-3.3-70b-instruct-fp8-fast | @cf/google/gemma-4-26b-a4b-it |

Output JSON Gemma íntegro:

```json
{
  "natural": "Quería que Akari se vistiera de Momotaro, pero con este peinado y las orejas, no se veía equilibrado.",
  "literal": "Quería haber hecho que Akari hiciera el cosplay de Momotaro, pero con este peinado las orejas tenían un mal equilibrio.",
  "notes": [
    "'させたかった' indica un deseo no realizado en el pasado.",
    "'ちゃんコス' es una abreviatura coloquial de 'cosplay de [personaje]'.",
    "'バランスが悪かった' se refiere a la falta de armonía visual entre el peinado y las orejas."
  ]
}
```

Evaluación humana: Llama usa el contexto コス prudentemente para «Quería que se disfrazara», sin asignar un personaje. Gemma traduce más que selectedText y añade peinado/orejas; inventa «Momotaro» a partir de un nombre OCR dudoso que no contiene esa grafía ni lectura inequívoca. Sus notas no advierten la incertidumbre y la explicación afirma un deseo no realizado sin matizar. Ambos usan Quería (primera/tercera persona indistinguibles); no hay género de hablante inventado.

#### CASO E

Japonés y contexto exactos, enviados sin traducciones esperadas ni correcciones:

```json
{
  "schemaVersion": 1,
  "mode": "translate",
  "request": {
    "selectedText": "百合姫谷も",
    "targetLanguage": "es",
    "previousText": "二つまく言うえたなあ\n変わちゃん",
    "nextText": "よろしくお願い"
  }
}
```

| Campo | LLAMA original | GEMMA nuevo |
|---|---|---|
| natural | la princesa del valle de los lirios también | Yuri-hime, Tani-mo |
| literal | no devuelto | Princesa Lirio, Tani también |
| notes completas | ["Posible referencia a un personaje o título de una obra, la traducción es literal y puede variar dependiendo del contexto"] | ["El OCR parece incorrecto o fragmentado. '百合姫' (Yuri-hime) es un nombre o título, pero '谷も' (Tani-mo) sugiere 'Tani también'. La frase carece de coherencia gramatical completa debido a la calidad del texto original."] |
| latencyMs | 1975 | 1128 |
| success/error | success, HTTP 200 | success, HTTP 200 |
| model | @cf/meta/llama-3.3-70b-instruct-fp8-fast | @cf/google/gemma-4-26b-a4b-it |

Output JSON Gemma íntegro:

```json
{
  "natural": "Yuri-hime, Tani-mo",
  "literal": "Princesa Lirio, Tani también",
  "notes": [
    "El OCR parece incorrecto o fragmentado. '百合姫' (Yuri-hime) es un nombre o título, pero '谷も' (Tani-mo) sugiere 'Tani también'. La frase carece de coherencia gramatical completa debido a la calidad del texto original."
  ]
}
```

Evaluación humana: Gemma reconoce explícitamente OCR incorrecto/fragmentado y propone lecturas como nombre/título, con cautela. «Yuri-hime, Tani-mo» resulta poco natural y el análisis de 谷も como nombre Tani también sigue incierto. Llama literaliza princesa/valle/lirios y solo advierte posible título. Ninguno afirma haber visto la imagen ni reconstruye aquí 百合姫S.

#### CASO F

Japonés y contexto exactos, enviados sin traducciones esperadas ni correcciones:

```json
{
  "schemaVersion": 1,
  "mode": "translate",
  "request": {
    "selectedText": "そういう\nいやがたより\nこっちかなぁ",
    "targetLanguage": "es",
    "nextText": "いかた"
  }
}
```

| Campo | LLAMA original | GEMMA nuevo |
|---|---|---|
| natural | Me pregunto si será más bien así | O tal vez sea más bien así... |
| literal | no devuelto | Ese tipo de... ¿o será más bien por aquí? |
| notes completas | ["La traducción intenta capturar el tono informal y la incertidumbre de la expresión original"] | ["El OCR 'いやがたより' parece ser un error de lectura de 'いかがより' o una forma coloquial/dialectal de 'いかがより' (más bien).","'こっちかなぁ' es una expresión de duda o reflexión personal."] |
| latencyMs | 1438 | 3671 |
| success/error | success, HTTP 200 | success, HTTP 200 |
| model | @cf/meta/llama-3.3-70b-instruct-fp8-fast | @cf/google/gemma-4-26b-a4b-it |

Output JSON Gemma íntegro:

```json
{
  "natural": "O tal vez sea más bien así...",
  "literal": "Ese tipo de... ¿o será más bien por aquí?",
  "notes": [
    "El OCR 'いやがたより' parece ser un error de lectura de 'いかがより' o una forma coloquial/dialectal de 'いかがより' (más bien).",
    "'こっちかなぁ' es una expresión de duda o reflexión personal."
  ]
}
```

Evaluación humana: Gemma conserva una traducción natural sin primera persona y advierte rareza OCR. Pero propone いかがより sin apoyo y atribuye una interpretación «más bien» no fiable: una hipótesis de corrección no equivale a texto observado en imagen. Llama introduce Me pregunto y no advierte OCR defectuoso. Ambos pierden información del fragmento corrupto; no puede declararse fidelidad completa.

### Puntuación lingüística comparable, escala 1–5

Mismos ocho criterios cualitativos y puntuaciones Llama originales conservadas. La nota de calidad sigue siendo su media, sin introducir JSON/latencia en esa media retroactivamente. 1 malo, 2 problemático, 3 correcto, 4 bueno, 5 excelente. Valoraciones humanas provisionales con estas seis muestras, sin ground truth completo ni nueva inspección de imágenes.

| Caso/modelo | Fidelidad | Naturalidad | No inventar sujeto | No inventar género | Tono | Ambigüedad | Prudencia OCR | Concisión | Media |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| A Llama | 5 | 4 | 5 | 5 | 4 | 3 | 5 | 3 | 4.250 |
| A Gemma | 5 | 5 | 5 | 5 | 4 | 3 | 5 | 5 | 4.625 |
| B Llama | 1 | 1 | 1 | 5 | 1 | 1 | 4 | 2 | 2.000 |
| B Gemma | 2 | 3 | 1 | 5 | 3 | 3 | 4 | 2 | 2.875 |
| C Llama | 2 | 4 | 2 | 5 | 2 | 1 | 4 | 2 | 2.750 |
| C Gemma | 2 | 4 | 2 | 5 | 2 | 1 | 4 | 4 | 3.000 |
| D Llama | 4 | 5 | 4 | 5 | 4 | 3 | 4 | 4 | 4.125 |
| D Gemma | 1 | 3 | 3 | 5 | 3 | 1 | 1 | 1 | 2.250 |
| E Llama | 2 | 2 | 5 | 5 | 3 | 3 | 2 | 3 | 3.125 |
| E Gemma | 3 | 2 | 5 | 5 | 3 | 3 | 4 | 3 | 3.500 |
| F Llama | 2 | 4 | 2 | 5 | 4 | 2 | 1 | 3 | 2.875 |
| F Gemma | 2 | 4 | 5 | 5 | 4 | 2 | 2 | 3 | 3.375 |

| Caso | Llama calidad | Gemma calidad | Llama JSON | Gemma JSON | Llama latencia (1–5) | Gemma latencia (1–5) |
|---|---:|---:|---:|---:|---:|---:|
| A | 4.250 | 4.625 | 5 | 5 | 4 | 5 |
| B | 2.000 | 2.875 | 5 | 5 | 2 | 5 |
| C | 2.750 | 3.000 | 5 | 5 | 3 | 4 |
| D | 4.125 | 2.250 | 5 | 5 | 3 | 2 |
| E | 3.125 | 3.500 | 5 | 5 | 4 | 4 |
| F | 2.875 | 3.375 | 5 | 5 | 4 | 2 |

JSON: 5 para cada output completamente parseable y aceptado sin rescate. Latencia: criterio objetivo adicional en esta comparación, <=1.000 ms=5, <=2.000=4, <=3.000=3, <=5.000=2, >5.000=1. Se muestran además los milisegundos medidos; estas puntuaciones no cambian la nota histórica lingüística.

Calidad global: **Llama 3.19/5; Gemma 3.27/5**. Diferencia mínima, no evidencia de superioridad general. Gemma gana claridad/concisión en A y avisos OCR en E/F; su D inventa un nombre y amplía la selección, un fallo importante que no debe esconderse detrás de la media.

Sujetos/género: Llama impone primera persona en B/C/F. Gemma impone primera persona en el literal B y ambas versiones C; en D añade Momotaro sin respaldo y traduce contexto fuera de selectedText. No se observó género de hablante inventado en los outputs de ninguno; Quería no distingue primera/tercera persona. Momotaro es una identidad inventada, no debe confundirse con un hallazgo genérico sobre género gramatical.

OCR: Gemma sí advierte E/F, pero en F propone una reconstrucción no sustentada. En D no avisa al inventar Momotaro. Llama E ofrece cautela genérica y F ninguna advertencia útil. Ambos imponen girasoles en C pese a la posibilidad de un nombre propio. Ningún modelo vio imágenes.

### Recomendación provisional y validación

**Ambos pasan a una futura fase study**, solo como candidatos para evaluación y cuando el usuario la autorice. No hay ganador definitivo ni recomendación de uso sin revisión humana. Gemma ya ofrece 6/6 JSON válido sin reasoning y coste oficial acotado; Llama mantiene un baseline y resolvió D mejor. La fase study deberá vigilar especialmente reconstrucciones de OCR, nombres propios, selección frente a contexto y sujetos implícitos. **No se ejecutó study en esta tarea.** GLM queda fuera de V1 sin más inferencias.

7 tests nuevos, **75/75 tests Worker pasan** sin IA real en tests; TypeScript Worker correcto. Frontend sin diff en src/public. Sin dependencias nuevas, deploy, conexión Angular, commit ni push. Los cambios de esta tarea se limitan al Worker (estrategias/input), tests, scripts locales de métricas y documentación. El normalizador y el validador no se relajaron.

# Study benchmark

Fecha: 2026-10-04. **12 inferencias reales, secuenciales: seis Llama y seis Gemma. Sin retries, translate, GLM, deploy ni frontend.** Las doce recibieron exactamente los request del benchmark translate; selectedExpression sigue ausente. Las respuestas fallidas cuentan y no se sustituyen.

## Método y límites de observación

Modo study y contrato MangaStudyExplanation existentes. Llama conserva JSON Schema/max_tokens=1536; Gemma conserva plain JSON/max_completion_tokens=1536/enable_thinking=false. Temperatura 0.1; mismo prompt lingüístico y mismo contenido por caso. No se modificaron prompts, estrategias, schema, normalizador ni validación durante la prueba. Único cambio de ejecución: el entry local acepta study mediante LOCAL_BENCHMARK_MODE explícito y conserva el máximo de seis llamadas por proceso. Los procesos locales se han detenido al terminar.

SHA256 antes/después idénticos:

- src/prompts.ts: 74CC21CB288167EC2E6F346CD8B9874FD1D721CA3DA17E22029E892AA452B4A4
- src/model-strategies.ts: 46368ADC19426688C876CC74ABC42BD88E1E4FB12C01ED808F13A0D289569464
- src/validation.ts: 7966F1B734D1F28479F2FDE01CC87D2A3A60DAA66E65C028878F301C1A27FF56

**Limitación importante:** el helper existente conserva respuesta HTTP validada y usage oficial, pero no el output original anterior al normalizador. En los ocho HTTP 502 se recibió únicamente {"error":"invalid_ai_response"}; no están disponibles natural/vocabulary/grammar ni la causa interna exacta (extracción, JSON o contrato). No sería honesto inventar contenido, errores lingüísticos ni notas A–I para ellos. Tampoco se afirma que un 502 demuestre JSON sintácticamente inválido. Se registran como fallos de entrega/contrato y no se hicieron inferencias extra para recuperar sus outputs. Por ello no puede completarse la comparación pedagógica de Llama ni de E/F Gemma en esta corrida.

Latencia: tiempo de fetch HTTP local de extremo a extremo, no solo GPU; incluye remote binding y red. Usage procede directamente del objeto retornado por env.AI.run, capturado antes de validar incluso cuando falla. No se estiman valores. Una muestra por caso; no hay conclusiones estadísticas generales.

## Referencia independiente

Se leyó el asset JMdict español instalado (55.017 registros de term_bank) sin modificar DB ni ZIP: ありがとう es agradecimiento; する tiene POS vs; 負ける, lectura まける, significa perder/ser derrotado; ひまわり tiene sentido girasol; 百合, 姫 y 谷 tienen entradas independientes, pero eso no demuestra cómo segmentar el OCR 百合姫谷も; そういう y こっち tienen sentidos ese tipo de y por aquí/este. No apareció una entrada いやがた que permita reconstruir ese OCR con seguridad; ausencia en este diccionario no prueba inexistencia.

Se ejecutaron las funciones puras existentes de japanese-deinflection.service.ts, sin cambios, contra las selecciones:

- します → する, razones [polite], clase vs, lectura reconstruida します.
- 負けぬ → 負ける, razones [negative-nu], clase v1, lectura reconstruida まけぬ.
- させたかった → する, razones [past, desire, causative], clase vs, lectura reconstruida させたかった.

Estas son candidatas morfológicas, no prueba de un sujeto o relato. El contexto de disfraz apoya el causativo de する en D; no autoriza reconstruir nombres. させる es también una forma diccionario causativa válida, por lo que no se marca como base errónea por no llegar hasta する. Referencias docentes independientes: [Japan Foundation: causativo, incluido する→させる](https://ba.jpf.go.jp/wp-content/uploads/2022/03/Akiko6_bunpoo382002.pdf) y [Tae Kim: negativo ぬ en lugar de ない](https://guidetojapanese.org/learn/grammar/negativeverbs2). No se usa la respuesta de un modelo como referencia del otro.

## Resultados objetivos y usage oficial

| Modelo | Válidas | Latencia media ms | Mediana ms | Prompt total / media | Completion total / media | Tokens total / media | Neurons total / media |
|---|---:|---:|---:|---:|---:|---:|---:|
| LLAMA | 0/6 | 3875.667 | 3589 | 3354 / 559.000000 | 598 / 99.666667 | 3952 / 658.666667 | 211.916952 / 35.319492 |
| GEMMA | 4/6 | 10981.833 | 3235 | 3481 / 580.166667 | 507 / 84.500000 | 3988 / 664.666667 | 45.472727 / 7.578788 |

Gemma B tardó 52.785 ms. Se incluye en la media y mediana, sin descartar ni sustituir el dato. No se atribuye a razonamiento, GPU o cold start sin evidencia. Las métricas de este apartado son solo study.

## Casos y contenido íntegro recibido

### Caso A

INPUT (idéntico a translate, targetLanguage es):

```json
{
  "selectedText": "ありがとう",
  "targetLanguage": "es",
  "contextText": "ありがとう\nございました。",
  "previousText": "ああのっ",
  "nextText": "二つまく言うえたなあ\n変わちゃん"
}
```

#### LLAMA

HTTP: 502. Latency: 2600 ms.

Usage oficial, sin redondear los valores recibidos:

```json
{
  "prompt_tokens": 562,
  "completion_tokens": 39,
  "total_tokens": 601,
  "neurons": 22.974637985229492
}
```

Respuesta íntegra: `{"error":"invalid_ai_response"}`.

Natural: no disponible. Vocabulary: no disponible. Grammar: no disponible.

Evaluación: fallo objetivo del flujo existente. Contenido previo al rechazo no capturado; no puede puntuarse su exactitud lingüística, alucinaciones, OCR o contexto. J=1 por no entregar el contrato; A–I=N/E. No se repitió la inferencia.

#### GEMMA

HTTP: 200. Latency: 947 ms.

Usage oficial, sin redondear los valores recibidos:

```json
{
  "prompt_tokens": 584,
  "completion_tokens": 30,
  "total_tokens": 614,
  "neurons": 6.127272605895996
}
```

Natural: Gracias

Vocabulary:

```json
[
  {
    "expression": "ありがとう",
    "reading": "ありがとう",
    "baseForm": "ありがとう",
    "meaning": "gracias"
  }
]
```

Grammar:

```json
[]
```

Evaluación cualitativa: Vocabulario y lectura correctos; baseForm idéntica es redundante pero válida. Sin gramática inventada ni palabras del contexto. No procede exigir análisis gramatical a una interjección. No identifica expresamente el OCR vecino, pero tampoco lo usa.

### Caso B

INPUT (idéntico a translate, targetLanguage es):

```json
{
  "selectedText": "します！",
  "targetLanguage": "es",
  "previousText": "よろしくお願い"
}
```

#### LLAMA

HTTP: 502. Latency: 2111 ms.

Usage oficial, sin redondear los valores recibidos:

```json
{
  "prompt_tokens": 540,
  "completion_tokens": 46,
  "total_tokens": 586,
  "neurons": 23.82158660888672
}
```

Respuesta íntegra: `{"error":"invalid_ai_response"}`.

Natural: no disponible. Vocabulary: no disponible. Grammar: no disponible.

Evaluación: fallo objetivo del flujo existente. Contenido previo al rechazo no capturado; no puede puntuarse su exactitud lingüística, alucinaciones, OCR o contexto. J=1 por no entregar el contrato; A–I=N/E. No se repitió la inferencia.

#### GEMMA

HTTP: 200. Latency: 52785 ms.

Usage oficial, sin redondear los valores recibidos:

```json
{
  "prompt_tokens": 561,
  "completion_tokens": 50,
  "total_tokens": 611,
  "neurons": 6.46363639831543
}
```

Natural: ¡Lo haré! / ¡Lo hago!

Vocabulary:

```json
[]
```

Grammar:

```json
[
  {
    "expression": "します",
    "explanation": "Forma cortés (masu-form) del verbo する (suru), que significa 'hacer'."
  }
]
```

Evaluación cualitativa: Reconoce する y su forma cortés します; no hay confusión con 汁/しる. Vocabulary vacío es válido, aunque resta cobertura pedagógica al no aportar la entrada します → する. La explicación gramatical contiene esa base correctamente. Natural impone primera persona y trata la pieza literalmente; no explica su función dentro de よろしくお願いします, aunque el vecino permite desambiguarla. No añade お願い al vocabulario.

### Caso C

INPUT (idéntico a translate, targetLanguage es):

```json
{
  "selectedText": "ひまわりには負けぬ",
  "targetLanguage": "es",
  "previousText": "あるさあは",
  "nextText": "わいとラフな\nカッコが合うかも"
}
```

#### LLAMA

HTTP: 502. Latency: 3063 ms.

Usage oficial, sin redondear los valores recibidos:

```json
{
  "prompt_tokens": 563,
  "completion_tokens": 88,
  "total_tokens": 651,
  "neurons": 33.036766052246094
}
```

Respuesta íntegra: `{"error":"invalid_ai_response"}`.

Natural: no disponible. Vocabulary: no disponible. Grammar: no disponible.

Evaluación: fallo objetivo del flujo existente. Contenido previo al rechazo no capturado; no puede puntuarse su exactitud lingüística, alucinaciones, OCR o contexto. J=1 por no entregar el contrato; A–I=N/E. No se repitió la inferencia.

#### GEMMA

HTTP: 200. Latency: 2787 ms.

Usage oficial, sin redondear los valores recibidos:

```json
{
  "prompt_tokens": 583,
  "completion_tokens": 118,
  "total_tokens": 701,
  "neurons": 8.518181800842285
}
```

Natural: No perderé ante los girasoles

Vocabulary:

```json
[
  {
    "expression": "ひまわり",
    "reading": "ひまわり",
    "meaning": "girasol"
  },
  {
    "expression": "負けぬ",
    "reading": "まけぬ",
    "baseForm": "負ける",
    "meaning": "no perder (forma literaria/arcaica)"
  }
]
```

Grammar:

```json
[
  {
    "expression": "〜には",
    "explanation": "Partícula que marca el objetivo o el agente contra el cual se realiza la comparación o la acción."
  },
  {
    "expression": "〜ぬ",
    "explanation": "Forma negativa clásica/literaria equivalente al moderno 「〜ない」."
  }
]
```

Evaluación cualitativa: 負けぬ → 負ける y lectura まけぬ correctas; ～ぬ se reconoce como negativa literaria equivalente a ～ない. ひまわり=girasol es un sentido JMdict válido, pero puede ser nombre propio y no avisa de esa ambigüedad. Natural fija primera persona sin sujeto explícito. ～には se describe vagamente como objetivo/agente de comparación: aquí に marca el oponente y は aporta contraste; no es un marcador general de agente. Las expresiones ～には y ～ぬ son etiquetas de patrones presentes, no vocabulario extra.

### Caso D

INPUT (idéntico a translate, targetLanguage es):

```json
{
  "selectedText": "させたかった",
  "targetLanguage": "es",
  "contextText": "あかりにもともたちゃんコス\nさせたかったんですけど\nこの髪型に耳は\nバランスが悪かった\nいいです．．．",
  "previousText": "まんてん",
  "nextText": "さあ～"
}
```

#### LLAMA

HTTP: 502. Latency: 7104 ms.

Usage oficial, sin redondear los valores recibidos:

```json
{
  "prompt_tokens": 584,
  "completion_tokens": 201,
  "total_tokens": 785,
  "neurons": 56.73979187011719
}
```

Respuesta íntegra: `{"error":"invalid_ai_response"}`.

Natural: no disponible. Vocabulary: no disponible. Grammar: no disponible.

Evaluación: fallo objetivo del flujo existente. Contenido previo al rechazo no capturado; no puede puntuarse su exactitud lingüística, alucinaciones, OCR o contexto. J=1 por no entregar el contrato; A–I=N/E. No se repitió la inferencia.

#### GEMMA

HTTP: 200. Latency: 3683 ms.

Usage oficial, sin redondear los valores recibidos:

```json
{
  "prompt_tokens": 604,
  "completion_tokens": 108,
  "total_tokens": 712,
  "neurons": 8.436363220214844
}
```

Natural: Quería hacer que Akari se vistiera de Mochatan, pero con este peinado y las orejas, no quedaba bien equilibrado.

Vocabulary:

```json
[
  {
    "expression": "させたかった",
    "reading": "させたかった",
    "baseForm": "させる",
    "meaning": "quería hacer que (alguien hiciera algo)"
  }
]
```

Grammar:

```json
[
  {
    "expression": "～させたかった",
    "explanation": "Forma pasada de la forma causativa con el deseo (~tai). Indica la intención o el deseo de haber hecho que alguien realizara una acción."
  }
]
```

Evaluación cualitativa: La única entrada de vocabulary es realmente la selección: lectura correcta y baseForm させる aceptable como forma diccionario derivada, aunque llegar a する sería más informativo. La deinflexión independiente confirma pasado + deseo + causativo. La gramática apunta al análisis correcto y no debe confundirse con potencial; sería más clara descomponiendo する→させる→させたい→させたかった. Natural amplía indebidamente la selección con Akari, peinado, orejas y balance; Mochatan no está sustentado por el OCR. Quería que hiciera/se pusiera el disfraz expresa el núcleo sin esa reconstrucción. Vocabulary/grammar no incorporan las palabras externas, pero natural sí. No avisa de incertidumbre OCR.

### Caso E

INPUT (idéntico a translate, targetLanguage es):

```json
{
  "selectedText": "百合姫谷も",
  "targetLanguage": "es",
  "previousText": "二つまく言うえたなあ\n変わちゃん",
  "nextText": "よろしくお願い"
}
```

#### LLAMA

HTTP: 502. Latency: 4115 ms.

Usage oficial, sin redondear los valores recibidos:

```json
{
  "prompt_tokens": 558,
  "completion_tokens": 90,
  "total_tokens": 648,
  "neurons": 33.31304168701172
}
```

Respuesta íntegra: `{"error":"invalid_ai_response"}`.

Natural: no disponible. Vocabulary: no disponible. Grammar: no disponible.

Evaluación: fallo objetivo del flujo existente. Contenido previo al rechazo no capturado; no puede puntuarse su exactitud lingüística, alucinaciones, OCR o contexto. J=1 por no entregar el contrato; A–I=N/E. No se repitió la inferencia.

#### GEMMA

HTTP: 502. Latency: 1985 ms.

Usage oficial, sin redondear los valores recibidos:

```json
{
  "prompt_tokens": 577,
  "completion_tokens": 84,
  "total_tokens": 661,
  "neurons": 7.53636360168457
}
```

Respuesta íntegra: `{"error":"invalid_ai_response"}`.

Natural: no disponible. Vocabulary: no disponible. Grammar: no disponible.

Evaluación: fallo objetivo del flujo existente. Contenido previo al rechazo no capturado; no puede puntuarse su exactitud lingüística, alucinaciones, OCR o contexto. J=1 por no entregar el contrato; A–I=N/E. No se repitió la inferencia.

### Caso F

INPUT (idéntico a translate, targetLanguage es):

```json
{
  "selectedText": "そういう\nいやがたより\nこっちかなぁ",
  "targetLanguage": "es",
  "nextText": "いかた"
}
```

#### LLAMA

HTTP: 502. Latency: 4261 ms.

Usage oficial, sin redondear los valores recibidos:

```json
{
  "prompt_tokens": 547,
  "completion_tokens": 134,
  "total_tokens": 681,
  "neurons": 42.0311279296875
}
```

Respuesta íntegra: `{"error":"invalid_ai_response"}`.

Natural: no disponible. Vocabulary: no disponible. Grammar: no disponible.

Evaluación: fallo objetivo del flujo existente. Contenido previo al rechazo no capturado; no puede puntuarse su exactitud lingüística, alucinaciones, OCR o contexto. J=1 por no entregar el contrato; A–I=N/E. No se repitió la inferencia.

#### GEMMA

HTTP: 502. Latency: 3704 ms.

Usage oficial, sin redondear los valores recibidos:

```json
{
  "prompt_tokens": 572,
  "completion_tokens": 117,
  "total_tokens": 689,
  "neurons": 8.390909194946289
}
```

Respuesta íntegra: `{"error":"invalid_ai_response"}`.

Natural: no disponible. Vocabulary: no disponible. Grammar: no disponible.

Evaluación: fallo objetivo del flujo existente. Contenido previo al rechazo no capturado; no puede puntuarse su exactitud lingüística, alucinaciones, OCR o contexto. J=1 por no entregar el contrato; A–I=N/E. No se repitió la inferencia.

## Valoración cualitativa STUDY (independiente de translate)

Escala 1–5: 1 fallo grave, 3 parcial, 5 correcto y adecuado para este fragmento. A vocabulario, B baseForm, C lecturas, D gramática, E utilidad, F no alucinación, G contexto prudente, H OCR/incertidumbre, I concisión, J contrato. La media usa igual peso para los diez criterios; natural se comenta y afecta F/G/H cuando inventa o amplía, sin convertirse en otra puntuación de traducción. Un array vacío apropiado no es error; ausencia de vocabulario útil sí limita cobertura (B). La falta de errores no demuestra cobertura completa. N/E no equivale a una respuesta lingüísticamente mala, sino a contenido no observado.

| Caso / modelo | A | B | C | D | E | F | G | H | I | J | Media |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| A LLAMA | N/E | N/E | N/E | N/E | N/E | N/E | N/E | N/E | N/E | 1 | N/E |
| A GEMMA | 5 | 5 | 5 | 5 | 4 | 5 | 5 | 4 | 5 | 5 | 4.80 |
| B LLAMA | N/E | N/E | N/E | N/E | N/E | N/E | N/E | N/E | N/E | 1 | N/E |
| B GEMMA | 3 | 5 | 5 | 4 | 3 | 4 | 3 | 4 | 5 | 5 | 4.10 |
| C LLAMA | N/E | N/E | N/E | N/E | N/E | N/E | N/E | N/E | N/E | 1 | N/E |
| C GEMMA | 4 | 5 | 5 | 3 | 4 | 3 | 4 | 2 | 5 | 5 | 4.00 |
| D LLAMA | N/E | N/E | N/E | N/E | N/E | N/E | N/E | N/E | N/E | 1 | N/E |
| D GEMMA | 5 | 5 | 5 | 4 | 3 | 1 | 1 | 2 | 4 | 5 | 3.50 |
| E LLAMA | N/E | N/E | N/E | N/E | N/E | N/E | N/E | N/E | N/E | 1 | N/E |
| E GEMMA | N/E | N/E | N/E | N/E | N/E | N/E | N/E | N/E | N/E | 1 | N/E |
| F LLAMA | N/E | N/E | N/E | N/E | N/E | N/E | N/E | N/E | N/E | 1 | N/E |
| F GEMMA | N/E | N/E | N/E | N/E | N/E | N/E | N/E | N/E | N/E | 1 | N/E |

**Media pedagógica STUDY: Llama N/E (0 outputs observados); Gemma 4,10/5 solo sobre sus cuatro respuestas aceptadas.** No es una media sobre seis ni evidencia comparativa de superioridad lingüística: excluir fallos sesga la muestra. J sobre todas las peticiones: Llama 1,00/5; Gemma 3,67/5. No se rellenan A–I de los fallos con notas inventadas.

## Errores y límites concretos

- Vocabulario: en Gemma C el sentido girasol existe, pero se elige sin cautela ante un posible nombre propio. B omite vocabulario útil aunque explica する en grammar. No aparecen 汁/しる ni palabras externas en los cuatro vocabulary aceptados.
- baseForm: no se observan bases incompatibles en Gemma; A es redundante, C correcta y D admite させる como base derivada. B no tiene entrada de vocabulary pero sí identifica する en grammar. Llama y E/F Gemma no evaluables.
- Lecturas: las recibidas de A/C/D son kana correctos; B no entrega readings en vocabulary. No se observan errores en las lecturas disponibles; no puede afirmarse lo mismo sobre outputs rechazados.
- Gramática: Gemma C explica bien ～ぬ, pero ～には no distingue に (oponente) de は (contraste) y añade agente de manera imprecisa. B explica forma cortés pero no su función pragmática con el vecino. D reconoce deseo pasado causativo; no descompone claramente ～たい/～かった. No afirma potencial ni JLPT. No se estudia gramática que solo esté en vecinos en los cuatro outputs aceptados.
- Alucinaciones: Gemma D reconstruye Mochatan y amplía natural con acciones/descripción externa; C fija girasol y sujeto de primera persona pese a ambigüedad. B también fija primera persona. Llama: imposible valorar por los 502; no se afirma que no alucine.
- OCR: E/F fallan en ambos modelos. No sabemos si el contenido original era prudente o inventado. Gemma D no avisa de la reconstrucción incierta; A ignora ruido vecino sin propagarlo. No hay imágenes ni correcciones del OCR enviadas.
- Contexto: Gemma mantiene vocabulary/grammar centrados en selectedText en A–D, pero incumple claramente esa frontera en natural D. En B infrautiliza el vecino para explicar la fórmula. No hay evidencia suficiente para comparar su prudencia con Llama study.

## Recomendación study y global

**STUDY: GEMMA como candidato operativo provisional**, por 4/6 respuestas entregadas frente a 0/6, no como ganador lingüístico demostrado. Los 502 de ambos requieren un diagnóstico posterior que conserve output prevalidación antes de gastar más cuota; no se repara ni diagnostica mediante nuevas inferencias aquí. Gemma todavía necesita revisión humana por la ampliación y nombre inventado de D, ambigüedad de C y fallos de E/F.

**Global: GEMMA provisional, con límites.** Translate sigue 6/6 en ambos y notas históricas 3,19 Llama / 3,27 Gemma (criterios distintos, no se promedian con study). Translate media/mediana: Llama 2.213/2.031 ms, Gemma 2.144,833/1.317,5 ms. Study favorece entrega de Gemma y mediana algo menor, pero su media es mucho peor por B. Neurons study: Gemma 45,472727 frente a Llama 211,916952 (4,66 veces menos en esta muestra, incluyendo fallos). Gemma translate+study total oficial 79,027271, media sobre doce 6,585606; usage de translate Llama no está disponible, por lo que NO se estima ni se afirma un coste global comparable. No es un resultado estadístico general ni una autorización de producción; no se cambia el modelo predeterminado.

## Validación y estado del trabajo

Helper local + README + un test mock de modo study; BENCHMARK.md ampliado conservando las secciones translate. 76/76 tests Worker sin inferencias reales en tests. TypeScript Worker correcto; hashes de producción idénticos. Build Angular correcto (exit 0), con avisos existentes del bundle inicial de 1,09 MB y cuatro SCSS de Gramática por encima de presupuesto. Sin dependencias nuevas, frontend, deploy, commit ni push.

Git status --short:

```text
 M MANGA_READER.md
?? workers/
```

MANGA_READER.md y el directorio workers ya tenían ese estado al comenzar. El status no distingue los archivos internos del directorio completo no trackeado; no se hizo staging ni se tocaron cambios ajenos.

# Validación final Gemma V1 — 2026-10-04

Decisión de producto aplicada: Gemma es default en contract.ts y wrangler.jsonc para translate/study. Llama y GLM siguen configurables explícitamente, sin fallback. Frontend y endpoint intactos. No deploy, commit ni push.

## Cambios y comprobaciones locales

- Prompts translate: solo selectedText; vecinos solo desambiguación; sin hechos/nombres/acciones añadidos; no asumir sujeto/persona/tiempo/intención; conservar ambigüedad nombre/palabra común; literal comprensible y función pragmática de fórmulas; notas breves y útiles.
- Prompts study: misma frontera de selección, expression substring literal sin símbolos de plantilla; campos opcionales desconocidos se omiten; bases pueden diferir; sin duplicados; arrays vacíos y natural de incertidumbre son válidos ante OCR dudoso. No reconstruir con seguridad el original ni rellenar análisis.
- Validación: Worker pasa selectedText a validResult; cada expression de vocabulary/grammar debe ser substring exacto; duplicados de expression se rechazan dentro de cada array. Una expresión puede aparecer en ambas categorías legítimamente. Se mantienen límites, filtro de texto, JSON.parse estricto, sin Markdown repair ni inferencias extra. La validación no pretende entender japonés ni garantizar que natural respete semánticamente la selección.
- Gemma mantiene plain JSON, thinking=false y temperature=0,1. Budgets conservados: max_completion_tokens 512 translate y 1536 study. No se reducen basándose en seis muestras ni se amplían: acotan generación sin forzar truncado; ninguno de los seis completion_tokens oficiales llega al límite. Sin response_format, streaming, retries o fallback.
- Helper local: modo mixed para máximo seis llamadas totales y flag RAW explícito. Solo registra assistant content al rechazar; no reasoning/envelope/headers/credentials. No modifica errores HTTP de producción.
- 16 tests nuevos, 92/92 Worker correctos; TypeScript Worker correcto; build Angular correcto, avisos existentes de presupuesto del bundle y cuatro SCSS de Gramática. No se repitieron tests Angular porque frontend no cambia. Los tests de prompts prueban instrucciones, no prometen cumplimiento semántico de la IA real.

## Seis inferencias finales (no benchmark comparativo)

Solo Gemma: translate B/C/D y study C/D/E, elegidos como prioriza el usuario. Inputs idénticos a las versiones históricas. Secuenciales, sin retries ni sustituciones. Ningún cambio de prompt/validación entre llamadas. SHA256 antes/después: prompts 9AC9CA182F65A0F56AB7A5F1E5A3BAD367F30886793F7350BFB162F2AE3A2BD1; validation 39B92CE3B3B63A6969795280ED65D7AE0AE812389073A7DA0EFA7D553DB78D49. Proceso Wrangler local detenido al terminar.

| Caso | HTTP | Latencia ms | Neurons |
|---|---:|---:|---:|
| translate B | 200 | 2330 | 7.863636493682861 |
| translate C | 200 | 1566 | 7.690908908843994 |
| translate D | 200 | 2001 | 8.07272720336914 |
| study C | 200 | 3005 | 11.436363220214844 |
| study D | 502 | 1252 | 11.009090423583984 |
| study E | 200 | 2604 | 10.672727584838867 |

### translate B

INPUT:

```json
{
  "selectedText": "します！",
  "targetLanguage": "es",
  "previousText": "よろしくお願い"
}
```

Resultado HTTP íntegro:

```json
{
  "natural": "¡Lo haré!",
  "literal": "¡Hago!",
  "notes": [
    "El sujeto está omitido. Dependiendo del contexto, puede significar 'lo haré', 'lo hago' o ser parte de una expresión de cortesía como 'mucho gusto' (yoroshiku onegaishimasu)."
  ]
}
```

Usage oficial:

```json
{
  "prompt_tokens": 661,
  "completion_tokens": 68,
  "total_tokens": 729,
  "neurons": 7.863636493682861
}
```

Evaluación: HTTP 200, contrato válido. Sigue imponiendo primera persona/futuro: ¡Lo haré!; la nota reconoce sujeto omitido y alternativas, pero no neutraliza natural. El vecino permite reconocer una fórmula pragmática, no demuestra tiempo/intención. Literal ¡Hago! también fija primera persona. Objetivo B no cumplido.

### translate C

INPUT:

```json
{
  "selectedText": "ひまわりには負けぬ",
  "targetLanguage": "es",
  "previousText": "あるさあは",
  "nextText": "わいとラフな\nカッコが合うかも"
}
```

Resultado HTTP íntegro:

```json
{
  "natural": "No perderé contra Himawari",
  "literal": "A Himawari no perderé",
  "notes": [
    "ひまわり puede ser el nombre propio Himawari o la flor girasol; se ha mantenido como nombre propio por el contexto."
  ]
}
```

Usage oficial:

```json
{
  "prompt_tokens": 684,
  "completion_tokens": 54,
  "total_tokens": 738,
  "neurons": 7.690908908843994
}
```

Evaluación: HTTP 200, contrato válido. Conserva Himawari y señala explícitamente nombre/flor, por lo que no impone girasoles. La nota atribuye elección de nombre al contexto sin evidencia concluyente y natural aún fija primera persona/futuro; literal A Himawari no perderé resulta poco natural. Ambigüedad nombre/común razonablemente advertida; neutralidad de sujeto no resuelta.

### translate D

INPUT:

```json
{
  "selectedText": "させたかった",
  "targetLanguage": "es",
  "contextText": "あかりにもともたちゃんコス\nさせたかったんですけど\nこの髪型に耳は\nバランスが悪かった\nいいです．．．",
  "previousText": "まんてん",
  "nextText": "さあ～"
}
```

Resultado HTTP íntegro:

```json
{
  "natural": "quería que hiciera",
  "literal": "quería haber hecho que hiciera",
  "notes": [
    "El verbo está en forma causativa-pasada (sasetakatta), indicando el deseo de haber hecho que alguien realizara una acción (en este caso, usar un cosplay)."
  ]
}
```

Usage oficial:

```json
{
  "prompt_tokens": 705,
  "completion_tokens": 61,
  "total_tokens": 766,
  "neurons": 8.07272720336914
}
```

Evaluación: HTTP 200, contrato válido. Natural querida acción causativa sin Akari, Momotaro, Mochatan ni peinado. La nota menciona cosplay como interpretación contextual, no lo incorpora en natural. El literal quería haber hecho que hiciera añade matiz perfectivo no exigido por たかった, y etiqueta causativa-pasada no descompone explícitamente deseo. Mejora selección/nombres, no traducción perfecta.

### study C

INPUT:

```json
{
  "selectedText": "ひまわりには負けぬ",
  "targetLanguage": "es",
  "previousText": "あるさあは",
  "nextText": "わいとラフな\nカッコが合うかも"
}
```

Resultado HTTP íntegro:

```json
{
  "natural": "No perderé ante Himawari",
  "vocabulary": [
    {
      "expression": "ひまわり",
      "reading": "ひまわり",
      "meaning": "Himawari (nombre propio o girasol)"
    },
    {
      "expression": "負けぬ",
      "reading": "まけぬ",
      "baseForm": "負ける",
      "meaning": "no perder (forma literaria/arcaica)"
    }
  ],
  "grammar": [
    {
      "expression": "には",
      "explanation": "Partícula que marca el objeto o referente contra el cual se realiza la comparación o acción."
    },
    {
      "expression": "ぬ",
      "explanation": "Auxiliar verbal que indica negación (forma literaria de ない)."
    }
  ]
}
```

Usage oficial:

```json
{
  "prompt_tokens": 898,
  "completion_tokens": 120,
  "total_tokens": 1018,
  "neurons": 11.436363220214844
}
```

Evaluación: HTTP 200, contrato válido; expressions son substrings literales. 負けぬ→負ける/まけぬ y negativo literario ぬ correctos. Meaning de ひまわり conserva nombre/girasol. には sigue sin explicar は contrastivo y su explicación es demasiado genérica. Natural aún impone primera persona/futuro.

### study D

INPUT:

```json
{
  "selectedText": "させたかった",
  "targetLanguage": "es",
  "contextText": "あかりにもともたちゃんコス\nさせたかったんですけど\nこの髪型に耳は\nバランスが悪かった\nいいです．．．",
  "previousText": "まんてん",
  "nextText": "さあ～"
}
```

Resultado HTTP íntegro:

```json
{
  "error": "invalid_ai_response"
}
```

Usage oficial:

```json
{
  "prompt_tokens": 920,
  "completion_tokens": 97,
  "total_tokens": 1017,
  "neurons": 11.009090423583984
}
```

Evaluación: HTTP 502 invalid_ai_response, una inferencia. El RAW local es JSON sintácticamente válido y las expressions sí pertenecen a selectedText. La explicación contiene ->, cuyo > incumple plain() (filtro existente de caracteres angulares). Comprobación local sin IA: validResult(raw,study,selection)=false; en una copia solo en memoria con -> reemplazado por a pasa=true. No se cambia ni repara la respuesta de producción. Además, たい -> た es lingüísticamente erróneo: el pasado desiderativo es たかった. Natural añade usar no presente en la selección (proviene del contexto). No inventa personajes, pero no cumple fiabilidad/contrato.

RAW assistant content capturado únicamente en consola local (parseado para presentarlo, sin reparación):

```json
{
  "natural": "quería haberle hecho usar",
  "vocabulary": [
    {
      "expression": "させたかった",
      "reading": "させたかった",
      "baseForm": "させる",
      "meaning": "quería hacer que (alguien) hiciera algo (forma pasada de la forma causativa)"
    }
  ],
  "grammar": [
    {
      "expression": "させたかった",
      "explanation": "Combinación de la forma causativa (させる) con la forma desiderativa pasada (たい -> た), indicando el deseo de haber hecho que alguien realizara una acción."
    }
  ]
}
```

### study E

INPUT:

```json
{
  "selectedText": "百合姫谷も",
  "targetLanguage": "es",
  "previousText": "二つまく言うえたなあ\n変わちゃん",
  "nextText": "よろしくお願い"
}
```

Resultado HTTP íntegro:

```json
{
  "natural": "También la princesa de los lirios",
  "vocabulary": [
    {
      "expression": "百合",
      "reading": "ゆり",
      "meaning": "lirio"
    },
    {
      "expression": "姫",
      "reading": "ひめ",
      "meaning": "princesa"
    },
    {
      "expression": "谷",
      "reading": "たに",
      "meaning": "valle"
    },
    {
      "expression": "も",
      "reading": "も",
      "meaning": "también"
    }
  ],
  "grammar": [
    {
      "expression": "も",
      "explanation": "Partícula que indica inclusión o adición (también/incluso)."
    }
  ]
}
```

Usage oficial:

```json
{
  "prompt_tokens": 892,
  "completion_tokens": 94,
  "total_tokens": 986,
  "neurons": 10.672727584838867
}
```

Evaluación: HTTP 200, contrato válido, pero NO prudente. Segmenta 百合/姫/谷/も con lecturas léxicas plausibles y explica も; no advierte OCR dudoso ni ambigüedad de segmentación/nombre. Natural También la princesa de los lirios inventa una relación no establecida y omite 谷. La existencia de palabras en JMdict no valida esa lectura de la frase. Objetivo de cautela OCR no cumplido.

## Métricas y decisión de aprobación

- Contrato aceptado: **5/6**. Contenido JSON parseable observado: **6/6**, contando el RAW rechazado. No confundir JSON sintáctico con aceptación del contrato.
- Neurons oficiales total: **56.74545383453369**; media: **9.45757563908895**. Incluye D study rechazado.
- Latencia HTTP media: **2126.3333333333335 ms**; mediana: **2165.5 ms**. No es latencia GPU ni se mezcla con benchmarks previos.
- No se observan Momotaro/Mochatan u otros personajes inventados. Persisten sujeto/tiempo no demostrado en B/C, reconstrucción semántica de E, análisis erróneo たい→た y acción externa en D study.
- C mejora ambigüedad nombre/común y reconoce 負ける + ぬ; D translate mejora la frontera de selección. E no responde con la prudencia requerida. Arrays vacíos están permitidos, pero la IA no los eligió en E.

**NO recomiendo desplegar todavía Gemma V1.** No cumple 6/6 contratos ni la prudencia OCR E, y B sigue sin neutralidad de persona/tiempo. Decisión de modelo aplicada, pero V1 no queda aprobada para despliegue con estos resultados. No se hizo una séptima inferencia, no se optimizó tras ver resultados y no se relajó seguridad ni reparó JSON para maquillar el criterio. La optimización/validación posterior necesitará una nueva tarea autorizada.

Archivos cambiados en esta tarea: src/contract.ts, src/model-strategies.ts, src/prompts.ts, src/validation.ts, src/index.ts, wrangler.jsonc, scripts/benchmark-local.mjs, test/assistant.test.ts, test/model-strategies.test.ts, README.md, BENCHMARK.md; creado test/v1-hardening.test.ts (todos dentro de workers/manga-assistant).

Git status --short al finalizar:

```text
 M MANGA_READER.md
?? workers/
```

Estado externo igual al inicial; MANGA_READER.md no se modificó en esta tarea. Sin staging, commit, push, deploy ni conexión frontend.

# Último hardening y tres comprobaciones Gemma — 2026-10-04

Solo B translate, D study y E study: tres inferencias secuenciales, inputs históricos exactos, sin retry ni otras llamadas. Ningún ajuste de prompts o validación entre llamadas; Wrangler local detenido al terminar. Gemma conserva plain JSON, thinking=false, temperature 0,1 y budgets 512/1536. No deploy, endpoint, commit ni push.

## Cambios

Output permite comparación/símbolos < y > aislados y flechas. Regex acotada por longitud rechaza etiquetas con nombre y cierre > (incluidos script/div/img/a), comentarios y doctype; controles/URLs siguen rechazados. Input conserva filtro anterior. No parser HTML ni innerHTML.

Contrato compatible: natural obligatorio, vocabulary/grammar arrays obligatorios, notes?: string[] opcional con máximo cinco strings no vacíos de 500 caracteres, texto plano sin HTML/URLs/controles. Schema, Worker y MangaContextService validan notes; tipo Worker hereda el modelo Angular como antes. Popup interpola notas bajo natural con estilos existentes, sin label nuevo ni claves de traducción necesarias. Respuestas previas sin notes permanecen válidas. Substring literal y rechazo de duplicados no cambian.

Prompt study prefiere poco análisis correcto, permite abstención/arrays vacíos con nota de OCR, no reconstruye imagen, describe forma conjugada observada sin derivaciones falsas, permite ambigüedad léxica en notas. Translate permite fragmentos y exige advertir incertidumbre de persona/tiempo en vez de completar lo ausente. No se intenta validar japonés semánticamente en TypeScript.

22 tests Worker nuevos: 114/114 pasan; siete Angular nuevos: 40/40 afectados pasan en dos archivos. TypeScript Worker/app/spec pasan; build pasa con avisos de presupuesto existentes. La primera ejecución Angular en sandbox falló por permisos de lectura del compilador y se repitió fuera del sandbox correctamente, sin cambios de código para evitarlo. No se ejecutó suite Angular completa.

## Resultados íntegros

### B translate

HTTP 200; latency 1872 ms.

INPUT:

```json
{
  "selectedText": "します！",
  "targetLanguage": "es",
  "previousText": "よろしくお願い"
}
```

RESULTADO:

```json
{
  "natural": "¡Lo haré!",
  "literal": "¡Hago!",
  "notes": [
    "Dependiendo del contexto, puede significar 'lo haré', 'lo hago' o ser parte de una expresión de cortesía como 'lo haré con gusto'. El sujeto es ambiguo."
  ]
}
```

USAGE oficial:

```json
{
  "prompt_tokens": 705,
  "completion_tokens": 60,
  "total_tokens": 765,
  "neurons": 8.045454025268555
}
```

### D study

HTTP 200; latency 1406 ms.

INPUT:

```json
{
  "selectedText": "させたかった",
  "targetLanguage": "es",
  "contextText": "あかりにもともたちゃんコス\nさせたかったんですけど\nこの髪型に耳は\nバランスが悪かった\nいいです．．．",
  "previousText": "まんてん",
  "nextText": "さあ～"
}
```

RESULTADO:

```json
{
  "natural": "quería haberle hecho hacer",
  "vocabulary": [
    {
      "expression": "させた",
      "reading": "させた",
      "baseForm": "させる",
      "meaning": "causativo de hacer/dejar hacer"
    },
    {
      "expression": "かった",
      "reading": "かった",
      "baseForm": "い",
      "meaning": "terminación de pasado para adjetivos"
    }
  ],
  "grammar": [
    {
      "expression": "させたかった",
      "explanation": "Forma pasada del deseo (たい) aplicada al causativo (させる). Indica el deseo de haber hecho que alguien hiciera algo."
    }
  ],
  "notes": [
    "El texto seleccionado es una forma conjugada compuesta que implica el deseo de haber causado una acción en otra persona."
  ]
}
```

USAGE oficial:

```json
{
  "prompt_tokens": 1062,
  "completion_tokens": 126,
  "total_tokens": 1188,
  "neurons": 13.09090805053711
}
```

### E study

HTTP 200; latency 2902 ms.

INPUT:

```json
{
  "selectedText": "百合姫谷も",
  "targetLanguage": "es",
  "previousText": "二つまく言うえたなあ\n変わちゃん",
  "nextText": "よろしくお願い"
}
```

RESULTADO:

```json
{
  "natural": "Yuri-hime, Tani-mo también",
  "vocabulary": [
    {
      "expression": "百合姫",
      "reading": "ゆりひめ",
      "meaning": "Yuri-hime (posible nombre propio)"
    },
    {
      "expression": "谷",
      "reading": "たに",
      "meaning": "valle o Tani (posible apellido)"
    },
    {
      "expression": "も",
      "reading": "も",
      "meaning": "también"
    }
  ],
  "grammar": [
    {
      "expression": "も",
      "explanation": "Partícula que indica inclusión, equivalente a 'también'."
    }
  ],
  "notes": [
    "El OCR es incierto; '百合姫谷も' podría ser una combinación de un nombre y un apellido o un error de lectura de un nombre compuesto."
  ]
}
```

USAGE oficial:

```json
{
  "prompt_tokens": 1034,
  "completion_tokens": 137,
  "total_tokens": 1171,
  "neurons": 13.13636302947998
}
```

## Evaluación independiente y aprobación

B: mantiene Lo haré / Hago pero la nota presenta otras posibilidades temporales y reconoce sujeto ambiguo. Cumple el objetivo actualizado de no presentarlo como única lectura, aunque literal y fórmula pragmática siguen poco naturales.

D: contrato válido, sin nombres inventados ni narración externa explícita. La entrada grammar completa reconoce deseo pasado causativo; ya no contiene el falso たい→た. Sin embargo, vocabulary divide させたかった en させた y かった, asignando a este último baseForm い. Que estos segmentos sean substrings no convierte esa segmentación en un análisis léxico fiable. La composición independiente verificada es する→させる→させたい→させたかった (deinflexión existente: pasado/deseo/causativo). させた no debe presentarse como un verbo pasado independiente dentro de ese deseo compuesto, y い no es una base léxica útil para esa entrada. Natural añade matiz perfecto haberle hecho hacer no exigido por el deseo pasado. La nota repite explicación sin aportar incertidumbre. No es aceptable afirmar que todo D queda lingüísticamente resuelto solo por HTTP 200.

E: lectura parcial 百合姫/谷/も con advertencia clara de OCR e hipótesis de nombre/apellido; se expresa como posibilidad. も como inclusión es defendible. No puede verificarse la lectura del nombre compuesto sin imagen; se mantiene como incierta. Natural Yuri-hime, Tani-mo también resulta poco natural y duplica la idea de も, pero no presenta reconstrucción segura. Cumple prudencia pedida, con traducción imperfecta.

JSON parseable **3/3**, contrato aceptado **3/3**. No Momotaro/Mochatan ni personajes nuevos inventados observados; persisten análisis léxico dudoso en D y traducciones poco naturales. Neurons oficiales total **34.272725105285645**, media **11.424241701761881**. Latencia HTTP media **2060 ms**, mediana **1872 ms**. No se estiman usage ausente ni coste monetario; la muestra no demuestra capacidad general ni gratuidad de una cuenta. Se conserva configuración Free prevista.

**Recomendación: NO deploy todavía**, por la segmentación/base léxica incorrecta de D. El falso positivo de > está corregido, los contratos y la advertencia OCR mejoran, pero no se debe ocultar un análisis pedagógico erróneo detrás de 3/3 aceptadas. No se gastó una cuarta inferencia ni se optimizó tras observar resultados.

Git status --short:

```text
 M MANGA_READER.md
 M src/app/core/models/manga-context.model.ts
 M src/app/core/services/manga-context.service.spec.ts
 M src/app/core/services/manga-context.service.ts
 M src/app/features/manga/manga-assistance.spec.ts
 M src/app/shared/components/dictionary-popup/dictionary-popup.ts
?? workers/
```

No nuevos labels: ES/EN/CA intactos. Sin cambios en DB, OCR/selección, FSRS, otros módulos o configuración del endpoint.
