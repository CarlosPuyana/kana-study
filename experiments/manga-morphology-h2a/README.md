# Manga × Mazos H2A — experimento local

Este directorio no se importa desde Angular, no publica recursos y no crea tarjetas.
Los resultados **no autorizan selección automática**. Ver [informe](../../MANGA_DECKS_H2A.md).

## Reproducir

Desde la raíz del repositorio, con Node 24 y las dependencias de la aplicación instaladas
(`npm ci`), ejecutar:

```sh
npm ci --prefix experiments/manga-morphology-h2a --ignore-scripts --no-audit --no-fund
npm run setup-resources --prefix experiments/manga-morphology-h2a
npm run audit --prefix experiments/manga-morphology-h2a
npm run evaluate --prefix experiments/manga-morphology-h2a
npm run benchmark:node --prefix experiments/manga-morphology-h2a
npm run browser --prefix experiments/manga-morphology-h2a
npm test --prefix experiments/manga-morphology-h2a
npm run typecheck --prefix experiments/manga-morphology-h2a
```

`setup-resources` necesita Internet para descargar fuentes y diccionario con versiones
fijas. Comprueba el SHA-256 del ZIP IPADIC antes de extraerlo y compara el ZIP español
oficial con el ya incluido; no lo reemplaza. `audit` transpila funciones del parser y
desconjugador actuales en memoria, sin editar sus archivos.
Los demás pasos usan recursos locales. El benchmark de navegador requiere el Chromium
de Playwright instalado para el proyecto (`npx playwright install chromium` si falta).
Utiliza un servidor temporal loopback bajo `/kana-study/spike/`, perfiles efímeros y
su propia caché/SW, sin abrir ni cambiar datos de Kana Study.

TypeScript, zip.js y Playwright se reutilizan desde las dependencias de desarrollo de
la raíz. Kuromoji y Lindera tienen su propio package-lock; no se añaden al package.json
de la aplicación. `resources/` y `node_modules/` quedan ignorados; las mediciones JSON,
licencias y corpus sí forman parte del experimento.

## Referencias y métricas

`corpus.tsv` contiene 100 frases o fragmentos originales escritos y anotados por el
agente antes de medir los motores, con 80 casos difíciles y justificación por fila.
No se generaron etiquetas con los analizadores evaluados. **Cero casos han sido
revisados por un experto humano independiente**: no es un corpus manual certificado
de 200 casos. No contiene textos ni imágenes de mangas externos.

Cada fila tiene 12 campos separados por `|`: ID, categoría, dificultad, texto,
segmentación de referencia (`?` si no certificable), foco, lema, lectura del lema,
lectura superficial, POS general, clasificación y justificación. `\n` representa un
salto real. El foco delimita la unidad evaluada; en conjugaciones puede ser el
morfema léxico, sin los auxiliares. No se pretende evaluar sentidos completos de toda
una obra con esta muestra.

`evaluation.mjs` separa coincidencia exacta de spans del tokenizador y candidatos del
filtro léxico. No usa etiquetas del corpus para decidir. Este filtro provisional
puede devolver la etiqueta experimental `verified`, pero siempre lleva
`experimentalOnly: true` e `identity: null`. Los falsos positivos son resultados a
medir, no identidades certificadas. `gate.mjs` mantiene bloqueada la selección pública;
no resolverlo con listas de excepciones aprendidas de estas referencias.

`reports/linguistic.json` guarda salidas por caso, denominadores, errores y matriz.
El intervalo Wilson es nominal/descriptivo: las referencias son pequeñas, curadas,
correlacionadas y no revisadas independientemente. `unknownRecall` es solo presencia
de algún token desconocido en el span, no acierto de clasificación del pipeline.
Los ceros de lema/lectura/POS de Intl significan capacidad ausente; no una predicción
morfológica. Una precisión `null` con cero aceptados no significa 100 %.

## Rendimiento y límites

`reports/node-performance.json` usa tres procesos nuevos por motor; el máximo RSS es
de todo Node, no memoria exclusiva del motor. La caché del SO no se vacía.
`reports/browser.json` mide Chromium de escritorio, Worker nuevo frío/caliente,
cancelación, repetición, interacción, caché offline y peticiones por contexto.
Sus 100/500 páginas son **repeticiones sintéticas** de 60 líneas del microcorpus, de
221–264 unidades UTF-16 por página; no son volúmenes reales ni validación de cobertura.
Los tiempos totales incluyen cesiones cooperativas entre páginas. `uiClick` incluye
la ida/vuelta de Playwright; no es latencia pura del dispositivo.
La memoria heap no disponible se registra como `null`; WASM no incluye toda la memoria
del navegador. No hay pruebas físicas Android/iOS/Safari ni medición de pico móvil.

`contracts.ts` propone contratos para revisión H2B; no implementa un adaptador léxico
certificado ni integra los motores en el bundle Angular.

## H2A.1 — léxico enriquecido local

Ver [MANGA_DECKS_H2A1.md](../../MANGA_DECKS_H2A1.md). Se mantiene el corpus original
byte a byte y los informes H2A originales. No se necesita repetir la comparativa de
motores ni el benchmark browser H2A para ejecutar esta extensión.

```sh
npm run setup:enriched --prefix experiments/manga-morphology-h2a
npm run evaluate:enriched --prefix experiments/manga-morphology-h2a
npm run benchmark:enriched --prefix experiments/manga-morphology-h2a
npm test --prefix experiments/manga-morphology-h2a
npm run test:enriched-parser --prefix experiments/manga-morphology-h2a
npm run typecheck --prefix experiments/manga-morphology-h2a
```

Preparación: Python 3 con biblioteca estándar; Node 24 con `node:sqlite`; dependencias
de H2A ya instaladas. `setup:enriched` descarga el XML oficial únicamente si falta,
verifica los SHA-256 gzip/XML de `enriched-source.json` y crea un SQLite local de
214.196.224 bytes, gzip por entrada e índices de grafías/lecturas. **Solo se ejecuta
una vez por índice**: si el archivo existe, se conserva y el script avisa en lugar de
sobrescribirlo. Las ejecuciones siguientes comienzan con `evaluate:enriched`, que
verifica el hash del índice y del adaptador antes de leerlo. El primer prototipo sin
compresión ocupa más disco local, pero no se usa ni se distribuye.

La URL EDRDG es diaria/rotativa; la medición fija los bytes del 22-10-2026 por hash y
Last-Modified. Si el servidor ha cambiado, la descarga fallará por hash; hace falta la
copia local retenida de esa revisión. No se promete que el servidor archive esa URL
de forma permanente ni se acepta otra revisión silenciosamente. Para actualizarla,
usar una nueva revisión y repetir auditoría/evaluación. No desactivar TLS ni hashes.

Todo el XML, SQLite y resultados temporales con datos léxicos quedan bajo `resources/`
ignorado. No publicar estos recursos ni las glosas españolas: faltan permisos/atribución
completos de sus compiladores. Los informes versionables contienen hashes, recuentos,
identidades/motivos y ejemplos propios del corpus, sin exportar glosas del nuevo léxico.

El validador exige un sentido de fuente único y no equipara automáticamente sentidos
de idiomas diferentes. Esta política se abstiene en los 100 casos originales: **cero
cobertura no es 100 % de precisión**. Un control positivo real demuestra que la rama de
identidad funciona; no cuenta como referencia independiente ni entra en esas métricas.
`corpus-independent/` documenta el protocolo y reserva 100 slots **vacíos**, no casos.
Por instrucción del usuario, la revisión humana y los textos autorizados quedan pendientes.

Los tests Node ahora incluyen H2A.1 y requieren el índice local. El test browser sigue
comprobando los resultados registrados de H2A, no prueba un nuevo Worker del léxico
enriquecido. `validation-contracts.ts` usa el tipo real `LexicalIdentity` de H1; el
harness transpila su función pura sin editarla ni crear tarjetas. Los contratos TS
se comprueban como contratos; no se afirma que TypeScript haya auditado todo el JS/Python.

## H2A.2 — reconocimiento, entrada, sentido y tarjeta

Ver [MANGA_DECKS_H2A2.md](../../MANGA_DECKS_H2A2.md). Reutiliza exactamente los recursos
y el corpus H2A.1 sin sobrescribir sus informes ni su validador:

```sh
npm run evaluate:layered --prefix experiments/manga-morphology-h2a
npm run audit:layered-resources --prefix experiments/manga-morphology-h2a
npm test --prefix experiments/manga-morphology-h2a
npm run typecheck --prefix experiments/manga-morphology-h2a
```

`layered-validation.mjs` propone entradas bajo una hipótesis morfológica y preserva
lecturas/sentidos/ambigüedades. Una referencia provisional está vinculada al hash de
fuente y lleva `synchronizable:false`, `homographGroup:null`; no es una identidad H1.
Se conserva la función estricta anterior para la rama de identidad demostrada; sobre
el corpus original sigue habiendo cero identidades permanentes y cero tarjetas
autoelegibles. El control positivo externo al corpus no se añade a las métricas.

Se recuperan 45/52 focos compatibles con lema/lectura/span de referencia, sin gold
independiente de IDs o sentidos. Esa compatibilidad **no** mide precisión de tarjetas.
Los 68 casos con propuestas para revisión son carga potencial, no confirmaciones
humanas ni palabras útiles por volumen. Las anotaciones no se usan para decidir.

`reports/layered-comparison.json` tiene los diagnósticos de los 52 FN anteriores y
solapamientos, métricas separadas, proyección histórica y decisiones por caso. Los
campos `verified`/`acceptedFP` dentro de `legacyWholeUnitProxy` son nombres heredados
para conservar el comparador: allí significan propuestas de entrada reproyectadas
sobre las etiquetas globales originales, nunca aceptación de identidad o tarjeta.
La proyección exportada elimina todas las glosas; el resultado íntegro queda en
`resources/enriched/layered-full-local.json` ignorado, con idioma/procedencia reales.

Los contratos nuevos incluyen comprobaciones negativas de tipos para impedir confundir
referencia provisional, interpretación contextual y autorización de tarjeta.
`audit-layered-resources.py` mide readonly el SQLite existente. No crea un formato
compacto ni mide su memoria en navegador; las alternativas de shards/offsets del informe
son propuestas aún sin benchmark. No se ha iniciado H2B ni implementado una interfaz
de revisión humana o una página de cobertura.
