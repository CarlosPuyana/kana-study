# Manga × Mazos V1 — Hito 2A

Evaluación realizada el 21 de octubre de 2026. Spike aislado en
`experiments/manga-morphology-h2a/`; no hay integración pública ni comienzo de H2B.

## Decisión

**Ningún motor queda aprobado para alimentar automáticamente tarjetas.** Kuromoji e
IPADIC sobre Lindera dan buenos resultados morfológicos en esta muestra, pero el
filtro léxico provisional consigue 28 candidatos correctos de 42 aceptados: 66,67 %,
con 14 falsos positivos y 11 fixtures no verificables indebidamente aceptados.
La meta de producto del 98 % no se cumple. La etiqueta experimental `verified` nunca
genera una `LexicalIdentity`: `identity` es `null` y el gate público permanece cerrado.

Para continuar la investigación, se recomienda **Lindera WASM 6.2.0 con
lindera-ipadic 6.2.0** por inicialización y memoria medidas, condicionada a resolver
identidad y ambigüedad. No se selecciona como motor productivo todavía. Intl.Segmenter
no aporta lema, lectura ni categoría; sirve de baseline y no sustituye la morfología.

La muestra contiene **100 casos originales, 80 difíciles, cero revisados por un
experto humano independiente**. No se presenta como el corpus certificado de 200
casos solicitado como objetivo. Ampliación y revisión independiente quedan pendientes.
La recomendación negativa está sustentada por errores reproducibles; no acredita
calidad de uso en mangas reales ni compatibilidad móvil.

## Alcance conservado

Se añaden únicamente este informe y el directorio experimental, y se amplía
`MANGA_DECKS_DESIGN.md`. No se modifican `src/`, `public/`, package/lock de la raíz,
configuración Angular, FSRS, SQL, sincronización, datos Japanese 1500 ni Stats V2.
Los cambios previos de H1/H1.1 se preservan. `CUSTOM_DECKS_ENABLED` sigue en `false`.
No hay nuevas pantallas, mazos, estadísticas de obra ni migraciones de diccionarios.

## A. Auditoría del léxico actual

Se ejecuta el parser real de Yomitan sobre el ZIP incluido y se inspeccionan importador,
repositorio, modelo y desconjugador. Los scripts transpilan funciones a memoria;
no alteran el parser instalado. Evidencia: `reports/dictionary-audit.json`,
`jmdict-provenance.json`, `source-manifest.json` y `deinflection-audit.json`.

| Evidencia | Resultado |
|---|---|
| Paquete | JMdict (Spanish) [2026-10-01], formato Yomitan 3, revisión JMdict.2026-10-01 |
| ZIP | 1.332.798 bytes; idéntico byte a byte a la distribución oficial fijada |
| SHA-256 | `968c7ca9c63203315b97b0d1bdf0d021444ae9e65d8ff08c5359ba212c5abe10` |
| Bancos | 55.017 filas; 34.310 valores sequence distintos; todos enteros positivos |
| IDs locales | `${dictionaryId}:${ordinal}`; dictionaryId cambia por UUID en cada importación |
| sequence | Se conserva entre importaciones; el parser también acepta un 42 inventado |
| Glosas | Español en el recurso auditado; sin idioma/procedencia explícitos por glosa en el modelo instalado |

El [ZIP español oficial](https://github.com/yomidevs/jmdict-yomitan/releases/download/2026-10-01/JMdict_spanish.zip)
se descargó exclusivamente para cotejar su hash. En el
[convertidor auditado](https://github.com/yomidevs/yomitan-import/blob/d2d4722ed2a22086be4dad214711012112a66706/jmdict.go),
`Sequence: entry.Sequence` conserva el valor que el
[parser XML](https://github.com/yomidevs/jmdict-go/blob/36b8b64ae145/jmdict.go) lee como
`ent_seq`. Esto respalda el significado de sequence para esta fuente, pero no hace
auténtico cualquier paquete manual con título parecido. Tampoco se ha probado que
ese commit exacto del convertidor sea el binario que generó la release de octubre:
el futuro manifiesto debe fijar fuente XML, convertidor y hashes de extremo a extremo.

La importación actual conserva expresión, lectura (con fallback a expresión si está
vacía), tags de definición, reglas, score, glosas aplanadas y sequence. El convertidor
aplica restricciones `stagk`/`stagr` al generar filas, pero su grafo original no queda
disponible al consumidor. El parser aplana contenido estructurado y descarta medios;
no preserva entradas XML, relaciones completas entre grafías/lecturas, límites e IDs
de sentidos, restricciones explícitas, idioma y procedencia individual de glosas.
En este ZIP no hay filas con glosas estructuradas ni lecturas vacías.

`definitionTags` permite observar `v1`, familias `v5`, `vk`, `vs`, `adj-i`, `adj-na`,
`n`, `exp`, `prt`, auxiliares y otros; `rules` resume clases de desconjugación y no es
una taxonomía léxica completa. Un sustantivo con reglas vacías no es desconocido.
El repositorio activo y su ranking de búsquedas (límite 32) son adecuados para consulta
interactiva; no prueban unicidad ni certifican una tarjeta. La futura consulta de
validación debe considerar todas las alternativas, sin elegir `terms[0]`.

Ejemplos comprobados en el recurso:

- 食べる: 1358280. 来る/くる: 1547720, diferente de 来る/きたる: 1591270.
- 橋/はし: 1237410; 橋/きょう: 2151440; 箸/はし: 1476410. Igual lectura no implica equivalencia.
- 生 tiene entradas/lecturas diferentes: うぶ 2036160, せい/しょう 2088240,
  き 1378440, なま 1378450. Deben conservarse alternativas y sentidos.
- ここ y 此処 comparten sequence 1288810 y lectura ここ en este recurso: existe
  evidencia de variante en esa entrada, no una regla general de unión por lectura.

El paquete auditado proporciona glosas españolas. No contiene una oferta demostrada
de inglés o catalán; las traducciones de la interfaz ES/EN/CA no traducen el léxico.
Una glosa ausente debe quedar ausente, nunca inventarse.

La desconjugación actual limita longitud (32 puntos de código), candidatos (96) y
profundidad (4); es una búsqueda acotada, no análisis sintáctico de frases. Reconoce
食べなかった→食べる y 負けぬ→負ける. Para 来ました genera 来る, pero la regla genérica
puede producir `くました` y la alternativa `vk` no aporta lectura superficial:
no se debe convertir eso en evidencia. Los dos analizadores sí devuelven 来/き→来る.
No se cambia este servicio en H2A; la integración futura deberá resolver explícitamente
lecturas irregulares y restricciones, con regresiones propias.

## B. Comparación técnica y distribución

| Opción fijada | Recursos e información | Distribución y compatibilidad comprobada |
|---|---|---|
| kuromoji 0.1.2 + IPADIC 2.7.0-20070801 | JS UMD, diccionarios binarios gzip; lema, lectura, POS, desconocido; offset inicial en puntos de código, base 1 | Worker clásico local, sin WASM; carga diferida con dicPath relativo funciona bajo subruta |
| lindera-wasm 6.2.0 + lindera-ipadic 6.2.0 | JS ESM + WASM, nueve archivos de diccionario; lema, lectura, POS, desconocido; offsets UTF-8 | Worker clásico con import dinámico, WASM local y diccionario externo explícito; subruta comprobada |
| Intl.Segmenter ja/word | ICU del runtime; spans y `isWordLike`; sin lema, lectura, POS ni desconocido | API nativa en Node 24.21.0/ICU 78.3 y Chromium 153.0.8010.12 evaluados; sin diccionario descargado |

Los [recursos Lindera](https://github.com/lindera/lindera/releases/tag/v6.2.0)
se fijan al ZIP `lindera-ipadic-6.2.0.zip`, SHA-256
`5ed4bba6b429030b0387df67d40d5751d35dedef0306f4bac6d957cad5f04b72`.
Se usa el paquete WASM genérico con diccionario externo; no se confunde con una
distribución que lleve otro diccionario embebido. Su [API de diccionarios](https://lindera.github.io/lindera/lindera-wasm/dictionary_management.html)
permite cargar estos bytes. Las versiones npm están fijadas en el lock experimental.

Angular 22 no incorpora estos motores. Se verificó el protocolo Worker y URLs bajo
`/kana-study/spike/`, sin dependencia del hash del router. Esto es evidencia de
ejecución de recursos en una subruta, **no una prueba de empaquetado Angular ni un
despliegue GitHub Pages**. H2B requeriría entrada browser separada, copia explícita de
assets seleccionados y prueba del MIME WASM/base-href real. Los imports Node del
adaptador experimental no deben introducirse en el bundle de producción.

No se necesita red para analizar tras instalar/cachear los recursos. El aprovisionamiento
descarga diccionarios y fuentes; no envía corpus ni texto OCR a un servicio.
Durante las pruebas de análisis solo hubo peticiones loopback, incluidas las del Worker.

## C–D. Corpus, método y resultados lingüísticos

`corpus.tsv`: 100 fragmentos originales, 80 difíciles, 91 con segmentación completa
de referencia y nueve deliberadamente no certificables. Etiquetas de foco:
52 verificables, 32 ambiguas, cuatro desconocidas y 12 excluidas.
Anotados por el agente antes de medir; no por el analizador. Cero revisiones humanas
independientes. No se han incorporado obras externas ni corpus autoetiquetado presentado
como gold independiente. El SHA-256 actual figura en `reports/linguistic.json`.

Incluye verbos/adjetivos e irregulares, partículas/auxiliares consecutivos, coloquial,
expresiones, interjecciones/onomatopeyas, nombres comunes/propios, homógrafos/homófonos,
variantes, katakana/medio ancho, una letra, saltos verticales, bloques fragmentados,
OCR corrupto y frases incompletas. Cada fila tiene justificación. El objetivo de 200
referencias fiables queda pendiente; 100 ejemplos escritos por el agente no equivalen
a 100 validaciones expertas.

Se compara la segmentación completa mediante spans UTF-16 exactos sobre NFC, excluyendo
espacios. Aquí «boundary» significa coincidencia de span de token, no solo extremos.
Lema, lectura superficial y POS se miden sobre el foco anotado, cuyo span puede ser el
morfema verbal y no toda la conjugación. Por separado, un filtro genérico cruza todos
los tokens relevantes con filas reales españolas y exige fila única, lectura y POS
compatibles; no consulta etiquetas para decidir. No contiene adaptación de restricciones
XML ni resolución semántica/contextual. Sus aceptaciones son exclusivamente provisionales.

| Métrica del tokenizador | Kuromoji | Lindera | Intl |
|---|---:|---:|---:|
| Spans TP / FP / FN | 146 / 6 / 6 | 146 / 6 / 6 | 91 / 91 / 61 |
| Precisión / recall spans | 96,05 / 96,05 % | 96,05 / 96,05 % | 50,00 / 59,87 % |
| Segmentación exacta | 87/91 (95,60 %) | 87/91 (95,60 %) | 49/91 (53,85 %) |
| Lema | 54/58 (93,10 %) | 54/58 (93,10 %) | No disponible |
| Lectura superficial | 54/58 (93,10 %) | 54/58 (93,10 %) | No disponible |
| POS general | 68/71 (95,77 %) | 68/71 (95,77 %) | No disponible |
| Algún token unknown en foco desconocido | 4/4 | 4/4 | No disponible |
| Spans originales conservados | 177/177 | 177/177 | 208/208 |

El 4/4 es solo un indicador de presencia de algún token desconocido, **no** cuatro
clasificaciones correctas del pipeline. Este último no acierta ninguno de los cuatro
focos desconocidos (matriz inferior). Los ceros internos del JSON para capacidades
ausentes de Intl no deben interpretarse como predicciones morfológicas.

| Pipeline provisional | Kuromoji | Lindera | Intl |
|---|---:|---:|---:|
| Candidatos aceptados | 42 | 42 | 0 |
| Correctos / incorrectos | 28 / 14 | 28 / 14 | 0 / 0 |
| Precisión | 66,67 % | 66,67 % | Indefinida, sin muestra |
| Wilson 95 % nominal | 51,55–78,99 % | 51,55–78,99 % | No procede |
| Focos válidos recuperados / perdidos | 28 / 24 | 28 / 24 | 0 / 52 |
| Recall sobre 52 válidos | 53,85 % | 53,85 % | 0 % |
| Casos con alguna aceptación | 39/100 | 39/100 | 0/100 |
| Fixtures no verificables aceptados | 11 | 11 | 0 |

Se cuentan **todos** los aceptados que solapan el foco: algunos fixtures producen más
de uno, por eso 42 candidatos y 39 casos. Correcto exige span, lema, lectura base y
referencia verificable. El intervalo es descriptivo, no garantía estadística de producto:
la muestra es pequeña, curada y correlacionada, sin revisión independiente. No se afirma
que IPADIC alcance universalmente estas cifras. Los motores coinciden aquí sobre casos
individuales; en páginas concatenadas el contexto puede producir salidas diferentes.

Matriz por caso de Kuromoji y Lindera, filas referencia y columnas predicción:

| Referencia / predicción | Verificada provisional | Ambigua | Desconocida | Excluida |
|---|---:|---:|---:|---:|
| Verificable (52) | 28 | 16 | 6 | 2 |
| Ambigua (32) | 11 | 12 | 5 | 4 |
| Desconocida (4) | 0 | 1 | 0 | 3 |
| Excluida (12) | 0 | 2 | 0 | 10 |

La matriz completa de Intl y las salidas originales de cada caso están en el JSON.
Intl acepta cero: no se le atribuye una precisión del 100 % por rechazar todo.

Errores y aciertos concretos, reproducibles por ID:

- `v01`, `v02`: 食べなかった→食べる y 負けぬ→負ける correctos, auxiliares separados.
- `v03`: 来ました tokeniza 来/き, まし, た y obtiene 来る correctamente; el filtro
  léxico no demuestra la lectura irregular y mantiene ambigüedad: falso negativo.
- `n01`–`n05`: no fusiona 橋 con 箸; 生 queda ambiguo. ここ/此処 encuentran 1288810,
  evidencia útil para un adaptador futuro, sin fabricar todavía identidad final.
- `e01`: そういう es un token reconocido; falta coincidencia española en el filtro,
  por lo que pierde una expresión válida. Saber tokenizar no garantiza glosa.
- `e04`: 春さん acepta 春 como sustantivo aunque podría ser nombre: falso positivo.
- `o05`: 読め□い acepta 読め pese al OCR incompleto: no se puede completar lo perdido.
- `k05`: スーパー tiene lecturas/sentidos contextuales que una sola fila exportada
  no resuelve. También fallan caracteres aislados como 目/手/火/雨 sin contexto.
- Los 11 fixtures inseguros son `v17`, `c10`, `e04`, `o03`, `o05`, `o07`, `k05`,
  `s02`, `s03`, `s04`, `s05`. No se añaden excepciones por ID para mejorar la cifra.

No hay conteo de candidatos aceptables **por volumen real**: las páginas de rendimiento
son sintéticas y no permiten extrapolar si habrá 20 palabras fiables seleccionables.
No se evalúan frecuencias de una obra con material protegido o no autorizado.

## E–G. Identidad, contexto y arquitectura propuesta

`contracts.ts` contiene contratos estrictos de diseño, no servicios registrados.
`JapaneseMorphologyPort` ofrece `initialize(resources, AbortSignal)`, análisis
asíncrono por job y fragmentos, y `dispose`. Tokens conservan superficie, lema/lectura
opcionales, POS, desconocido nullable, spans originales y evidencia de motor,
versión, hash y unidad original de offsets. Desconocido no equivale a falso cuando
el motor no ofrece ese dato.

El adaptador enriquecido deberá leer una fuente JMdict auténtica, conservar `ent_seq`,
hash de entrada/fuente, revisión de convertidor, grafías, lecturas, `re_nokanji`,
restricciones `re_restr`/`stagk`/`stagr`, POS, dominios/dialectos y glosas con idioma y
procedencia. No se puede reconstruir todo esto de las filas aplanadas actuales.
No se propone migración del diccionario instalado; sería un recurso versionado y
separado, cuya distribución requiere revisión de licencias.

Una identidad verificable debe usar autoridad+ent_seq+lectura canónica+grupo homógrafo
demostrado según el contrato H1, no el UUID de importación. Su prueba incluye las
restricciones aplicadas, política de equivalencia y referencia del grupo. Los sentidos
XML no tienen aquí una estabilidad demostrada entre revisiones: un ordinal de sentido
no sirve como ID permanente. Si no puede probarse la agrupación de sentidos/variantes,
se conservan candidatos distintos y `identity: null`. Nunca unir por traducción o
lectura sola, ni elegir la primera fila/ranking como certificación.

Se preserva original y normalizado NFC con mapa de offsets. El prototipo convierte
offsets UTF-8 de Lindera y puntos de código de Kuromoji a UTF-16 en tiempo lineal,
incluyendo emoji y dakuten combinantes. No aplica NFKC ni elimina vocales largas,
pequeñas kana o diferencias de ancho. Conversión de lectura katakana→hiragana es
comparación controlada, no fusión de identidades ni traducción.

Mokuro conserva página, bloque, líneas, orientación y coordenadas; no proporciona
confianza léxica OCR fiable. Proponer un extractor ligero por metadatos, sin blobs de
imágenes, con referencias página/bloque/línea/rango. Analizar primero por fragmento;
el contexto vecino se pasa como evidencia separada. No unir ciegamente líneas
verticales o bloques para fabricar palabras. Contexto insuficiente, varias lecturas,
OCR roto o nombre propio posible deben permanecer ambiguos/provisionales.

Worker único por sesión de análisis, carga solo tras acción explícita y selección
del motor. Jobs con generación y AbortSignal; descartar respuestas de jobs antiguos,
cancelar entre fragmentos/páginas y terminar Worker al cambiar recurso/workspace.
El prototipo cede al event loop entre páginas y permite cancelación; no implementa
persistencia de análisis o integración con workspace. Se encontró y corrigió durante
el spike un double-free experimental: `Tokenizer` consume el diccionario Lindera,
por lo que se libera el tokenizer una sola vez.

Cachear recursos por versión+SHA-256 con manifiesto y verificación antes de uso;
clave de resultado propuesta: hash del OCR + extracción + normalización + motor +
diccionario + léxico + desconjugación + política de ambigüedad/equivalencia.
Invalidar solo análisis al cambiar cualquiera, nunca FSRS ni datos de usuario.
Recursos compartibles; resultados limitados al workspace/documento que los originó.
Imponer límites de páginas/bytes y cuotas antes de cargar. La caché SW del experimento
solo demuestra viabilidad offline en un perfil temporal, no modifica el SW de la app.

## F. Rendimiento medido

Windows x64, AMD Ryzen 9 3900XT, Node 24.21.0/ICU 78.3; Chromium de escritorio
153.0.8010.12 mediante Playwright. Sin emulación de red o pruebas físicas móviles.
JSON registra valores completos; las tablas redondean. Bytes decimales salvo MiB/KiB.

| Recursos seleccionados | Almacenados/raw bytes | Expandidos bytes | gzip bytes |
|---|---:|---:|---:|
| Kuromoji runtime + diccionarios | 18.099.923 | 100.568.355 | 17.859.719 |
| Lindera JS + WASM | 1.850.827 | 1.850.827 | 718.744 |
| Diccionario Lindera IPADIC | 47.528.940 | 47.528.940 | 11.629.845 |

El ZIP Lindera ocupa 10.519.550 bytes y se descargó en 615,25 ms en una medición de
escritorio; no representa una distribución de latencias de red. gzip del diccionario
es suma por archivo, no el ZIP. El servidor del benchmark sirve archivos raw de
Lindera, por lo que esos tamaños comprimidos **no son su transporte medido**.
Hashes y tamaños por archivo se conservan en `reports/resources.json`.

Tres procesos Node independientes por motor, sin vaciar caché de archivos del SO:

| Motor | Inicialización de cada proceso (ms) | Máximo RSS por proceso (KiB) |
|---|---|---|
| Intl | 14,13 / 14,27 / 14,33 | 56.968 / 57.364 / 57.140 |
| Kuromoji | 345,60 / 319,79 / 333,71 | 459.068 / 390.824 / 460.388 |
| Lindera | 95,10 / 94,92 / 95,74 | 206.820 / 206.792 / 206.676 |

RSS es el pico **de todo el proceso Node**, no memoria exclusiva del motor ni pico
del navegador. La memoria WASM Lindera observada es 97.124.352 bytes (92,625 MiB);
no incluye JS, recursos descargados ni el resto del navegador. El heap no disponible
del Worker se registra `null`, no cero. No existe todavía un límite móvil validado.

Benchmark Chromium, Worker nuevo frío/caliente en el mismo contexto HTTP, carga
sintética de 60 líneas por página, 221–264 unidades UTF-16 por página:

| Motor | Inicio frío/caliente E2E ms | 100 / 500 páginas ms | Repetición 100 ms | Mediana / p95 por página (100) ms |
|---|---:|---:|---:|---:|
| Intl | 35,7 / 7,4 | 465,3 / 2.467,6 | 470,2 | 0,1 / 0,2 |
| Kuromoji | 1.066,9 / 744,9 | 558,9 / 2.808,7 | 537,2 | 1,1 / 1,6 |
| Lindera | 185,9 / 138,5 | 568,5 / 2.907,9 | 557,5 | 1,3 / 1,6 |

Estos son 100/500 **páginas sintéticas**, no volúmenes reales de tamaño representativo.
El total incluye cesiones cooperativas (timers entre páginas), mientras la distribución
por página mide cómputo de tokenización. No se multiplican tiempos de frases para
presentarlos como mediciones de una obra real. Deben repetirse con datos autorizados
de densidad real y pipeline léxico completo.

Cancelación observada: Intl 0,1 ms; Kuromoji 1,1 ms; Lindera 1,1 ms, con dos páginas
terminadas tras solicitarla al primer progreso. Timer principal de 5 ms: mayor hueco
11,8 / 6 / 6 ms respectivamente. Un click real de Playwright durante inicialización
se atendió en todos; ida/vuelta de automatización 269,4 / 58,7 / 53,0 ms. Ese dato
incluye automatización, y el outlier de Intl impide afirmar latencia universal baja.
No mide FPS ni toda la interfaz Angular.

Inicialización offline de un Worker nuevo tras cachear recursos: tres motores correctos.
Peticiones externas durante análisis: cero, auditadas en todo el contexto de navegador.
Bytes origin servidos durante frío+caliente: Intl 6.023; Kuromoji 18.105.946; Lindera
82.056.431. Incluyendo precarga de caché offline, Lindera alcanza 114.731.789 bytes.
No son bytes de una única descarga fría: incluye repeticiones y archivos grandes que
pueden retransmitirse. Hay margen pendiente para empaquetado/compresión/caché; no se
publica este esquema como solución de red final.

Safari, Safari iOS y Chrome Android no probados. Ninguna conclusión de compatibilidad
o consumo aceptable móvil se deriva de Chromium de escritorio. La velocidad no
compensa la falta de certeza léxica.

## Licencias y fuentes

- [Kuromoji.js 0.1.2](https://github.com/takuyaa/kuromoji.js): Apache-2.0;
  [NOTICE](https://github.com/takuyaa/kuromoji.js/blob/master/NOTICE.md) de IPADIC
  2.7.0-20070801 con condiciones NAIST/ICOT. Copias en `licenses/`.
- [Lindera 6.2.0](https://github.com/lindera/lindera/releases/tag/v6.2.0): MIT para
  el motor; IPADIC conserva aviso propio. `lindera-LICENSE` y
  `lindera-IPADIC-NOTICE.txt` preservan textos originales.
- [JMdict/EDRDG](https://www.edrdg.org/edrdg/licence.html): atribución y términos
  del recurso son necesarios; la página distingue derechos japonés/inglés de los
  derechos de compiladores de otras lenguas. **No se ha resuelto completamente la
  atribución/licencia de las traducciones españolas para una nueva redistribución
  enriquecida**. No asumir que la licencia del convertidor cubre las glosas.
- [JMdict Yomitan](https://github.com/yomidevs/jmdict-yomitan) y
  [yomitan-import](https://github.com/yomidevs/yomitan-import): fuentes de la auditoría,
  con commits y SHA en `source-manifest.json`. No se redistribuye un léxico nuevo.
- Intl utiliza implementación/datos ICU del runtime; no se añade un recurso al bundle.

Los ejemplos del corpus son originales del spike; no proceden de manga ajeno. No se
envió texto de manga a IA ni servicios externos. La descarga de recursos es independiente
del análisis local.

## Pendientes antes de H2B

1. Revisar este informe y el bloqueo de precisión; ningún motor tiene aprobación pública.
2. Conseguir al menos 200 referencias fiables con revisión humana independiente,
   mantener al menos 50 difíciles, separar desarrollo de evaluación y ampliar datos
   autorizados de manga. Revisar referencias actuales, no solo añadir frases fáciles.
3. Implementar en experimento el léxico enriquecido con autoridad/restricciones y
   resolver licencias ES antes de redistribuirlo; certificar identidades con regresiones
   para irregulares, sentidos, nombres propios, OCR y fragmentos.
4. Cero fixtures no verificables autoaceptados; medir precisión ≥98 % con muestra e
   intervalo, recall/cobertura y palabras aceptables por volumen real. No bastan cero
   aceptados ni listas de excepciones ajustadas al corpus.
5. Repetir cargas reales de 100/500 páginas y determinar límites de bytes/memoria en
   dispositivos físicos Android/iOS, Safari, offline y bajo presión de caché.
6. Seleccionar un solo motor/paquete público, verificar bundle Angular/base-href/MIME,
   cuotas, cancelación/workspace, versiones y licencias. Sin modificar FSRS ni cloud.

H2A entrega una recomendación negativa fundamentada y un prototipo reproducible.
El objetivo de corpus certificado, calidad automática y validación móvil permanece
abierto; no se comienza H2B.

## Validación

Prototipo: 10/10 tests Node, incluidos motores reales, offsets, identidad no fabricada,
gate fallido, y resultados Worker/offline/cancelación. Contratos TypeScript correctos.
Se ejecutaron auditorías, corpus, tres procesos independientes por motor y benchmark
Chromium completo. La guía de reproducción está en el README experimental.

Aplicación existente, ejecución adicional del 21 de octubre:

| Comprobación ejecutada | Resultado |
|---|---|
| `npm test` | 173 archivos y 1735 tests correctos; incluye H1, Stats V2 y demás integración existente |
| `npx tsc -p tsconfig.app.json --noEmit` | Correcto |
| `npx tsc -p tsconfig.spec.json --noEmit` | Correcto |
| `npm run build -- --base-href /kana-study/` | Correcto; cuatro warnings SCSS conocidos de Grammar |
| `git diff --check` | Correcto; aviso de conversión LF/CRLF del archivo generado previo, sin errores de whitespace |
| Hashes de 65 archivos preexistentes al spike | Solo cambia DESIGN por su ampliación solicitada; resto conservado byte a byte |

El spike tiene su propio `npm test` (10/10) y `npm run typecheck`; no se suman sus tests
a los 1735 de Angular. El script typecheck experimental se corrigió para invocar
TypeScript mediante Node y funcionar también en Windows. Se comprobaron también los
archivos nuevos de autoría propia para whitespace final, preservando los avisos legales
originales. No se repitió Playwright funcional
de la app en este hito porque no se cambió interfaz productiva; sí se ejecutó el
benchmark Chromium mediante Playwright descrito arriba. Las 27 pruebas funcionales
de H1.1 son evidencia previa, no se atribuyen de nuevo a H2A.

Estas comprobaciones no certifican integración Angular de los motores, que no se ha
implementado. La suite se ejecutó una vez más en H2A; las cuatro ejecuciones con
distintos órdenes/sin caché corresponden a H1.1. No se afirma estabilidad absoluta.
No se hizo commit ni push.
