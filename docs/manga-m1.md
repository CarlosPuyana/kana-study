# Manga M1: índice local por tomo

## Infraestructura y aislamiento

Se reutilizan `MangaImportService`/Mokuro, `MangaOcrSourceService`, `MangaRepository`,
`DictionaryRepository`, `Intl.Segmenter`, las reglas existentes de
`japanese-deinflection.service` y `LexicalKnowledgeProjectionService`.
No se instala otro analizador ni se envía texto OCR a ningún servicio.

La nueva ruta diferida `/manga/analysis/:volumeId` está disponible desde la ficha del
tomo importado y la cabecera de Reader. La vista experimental anterior de tarjetas
confirmadas sigue en `/manga/vocabulary/:volumeId`.

IndexedDB Manga pasa de versión 2 a 3 de forma aditiva: `ocr-revisions` y
`vocabulary-index`. No se reescriben los registros existentes en la migración.
Las escrituras de páginas/metadatos incrementan una revisión y eliminan el índice
en la misma transacción. El progreso de lectura no lo invalida. La caché comprueba
la revisión, metadatos, versión del analizador y versión del diccionario. Una
escritura concurrente o borrado impide guardar un análisis obsoleto.
Los errores de lectura quedan registrados, pero se reintentan en la siguiente visita.

El índice contiene exclusivamente contenido derivado, sin estados del usuario;
es serializable y reutilizable como contenido. Se almacena bajo el mismo
aislamiento de workspace que el tomo. Los formatos existentes de importación y
backup no cambian: esta caché derivada se regenera cuando falte. No se altera FSRS,
respuestas, estadísticas, imágenes, Mokuro, tarjetas ni vocabulario aprendido.

## Conteo y evidencia

Se recorren líneas OCR sin concatenar líneas ni bocadillos. Los offsets guardados
son UTF-16 del texto original. Se usan límites de palabra de `Intl.Segmenter`;
se pueden unir hasta cinco segmentos contiguos únicamente para flexiones
validadas por las reglas de clase gramatical del diccionario existente.

Solo se cuenta una aparición cuando todos los candidatos léxicos devueltos
coinciden en una clave: diccionario, secuencia (o ID local si no existe), lema y
lectura NFC. Distintas lecturas o entradas homógrafas quedan ambiguas. Las
flexiones fiables comparten lema y conservan la forma encontrada en cada
aparición. No se elige un candidato por puntuación de frecuencia del diccionario.
Puntuación, texto latino y números no cuentan como palabras japonesas.
Los nombres solo cuentan cuando tienen evidencia inequívoca en el diccionario.

Cada aparición conserva página, bloque, línea, rango, forma y contexto. Las
incidencias conservan razón y localización disponible; no son palabras inventadas.
Los límites son 2.000 páginas, 8 millones de unidades de texto por análisis y
4.000 por línea; la UI pagina palabras y limita la presentación de contextos e
incidencias sin descartar las referencias del índice.

## Conocimiento y métricas

El índice no guarda conocimiento. Una segunda proyección reacciona a la clave de
revisión del servicio existente de conocimiento. Solo una confirmación validada
de la aparición exacta (tomo, página, bloque, línea, rango, contexto, forma, lema
y lectura) enlaza una identidad curada. Las identidades contradictorias sin
equivalencia probada no se fusionan. Los números de secuencia de un Yomitan
importado no garantizan autoridad JMdict y no se usan como prueba de equivalencia.

- Conocidas y aprendiendo: estados acreditados por la proyección existente.
- Desconocida confirmada: identidad enlazada cuyo estado es `unknown`.
- Sin vínculo de conocimiento: evidencia ausente, ambigua, pendiente o indeterminada; no significa
  que el usuario desconozca la palabra.
- Cobertura de lectura: apariciones conocidas / apariciones analizadas.
- Porcentaje único conocido: tipos léxicos conocidos / tipos léxicos analizados.

Los porcentajes son mínimos acreditados sobre la parte analizada. No se afirma
cobertura del tomo completo si hay OCR ausente o segmentos sin resolver. El
denominador no incluye incidencias cuyo número de palabras es desconocido.

## Limitaciones y M2

La segmentación depende de ICU del navegador; no sustituye un análisis morfológico
editorial. Si falta `Intl.Segmenter`, se registra la falta de segmentación sin
inventar límites. Sin diccionario, los fragmentos japoneses quedan sin resolver.
Una lectura kanji ambigua no se desambigua por contexto automáticamente. La
proyección es deliberadamente conservadora: el vocabulario no enlazado a una
confirmación exacta no recibe conocimiento por coincidencia de escritura/lectura.
Las actualizaciones desde otra pestaña mantienen la limitación existente del
servicio de conocimiento: requieren invalidación explícita o recarga.

M2 puede reutilizar directamente el modelo `MangaVocabularyIndex`, claves
léxicas locales, frecuencias, lemas/lecturas, contextos y referencias completas,
incidencias, persistencia/invalidez y funciones de proyección/métricas. No hay
algoritmo RUSH, generador de tarjetas ni escrituras de aprendizaje en M1.

## Validación

Pruebas dirigidas de segmentación, repeticiones/flexiones, homógrafos, nombres,
ausencia de segmentador, OCR parcial, dos tomos, persistencia entre instancias,
invalidación, borrado, cancelación, aislamiento y cambios de conocimiento.
Prueba de componente para traducciones, métricas y filtros. Fixture E2E ZIP/Mokuro
sintética para importación real, recarga, cambios y layouts oscuro/claro de
1280, 390 y 320 px. Las tres variantes E2E han pasado con Edge instalado, usando
la configuración local `.cache/m1-playwright.config.ts` (el Chromium de Playwright
no está instalado). Se han inspeccionado las capturas de los temas claro y oscuro.
La suite global pasa: 264 archivos, 2.941 pruebas. El build de producción y la
auditoría del grafo de imports confirman carga diferida y un inicial de
749.613 bytes, por debajo de 750.000. Permanecen avisos SCSS preexistentes de otras
pantallas, sin exceder el límite inicial.

## Refinamiento M1.5 (histórico; clasificación corregida en M1.6)

La ficha del tomo conserva el diseño de Reader y utiliza una pila de acciones
con el estilo principal existente para «Continuar leyendo» y una acción
secundaria con borde para el vocabulario. La pila admite futuras acciones,
sin botones ficticios de práctica ni cambios de aprendizaje.

La lectura del resumen de cada palabra se omite solo si la comparación visual
es equivalente tras NFKC y conversión uno a uno katakana/hiragana, incluidas
marcas de iteración. No se equiparan vocales largas, kana pequeños, kana
históricos ni pronunciaciones de partículas (`は`/`わ`). Los datos, identidades,
lemas y lecturas originales del detalle no se alteran.

`manga-vocabulary-presentation.ts` expone categorías, filtros, comparación visual
y `isMangaLexicalCandidate` para M2. Las categorías proceden de `definitionTags`
de los términos del diccionario JMdict/Yomitan existente:

- Léxicas: sustantivos (`n` y variantes admitidas), verbos con clase reconocida,
  adjetivos, adverbios, expresiones (`exp`) e interjecciones (`int`).
- Funcionales: partículas (`prt`), auxiliares (`aux`, `aux-v`, `aux-adj`),
  cópulas (`cop`, `cop-da`), conjunciones (`conj`) y pronombres (`pn`).
- Sin clasificar: etiquetas ausentes, no admitidas, `unc`, sentidos con evidencia
  faltante o categorías léxicas/funcionales contradictorias. No se deduce clase
  mediante caracteres, glosas ni `Intl.Segmenter`.

Las reglas de flexión se conservan como evidencia en el detalle, pero por sí
solas no distinguen verbo léxico de auxiliar. `aux-v v1` acredita auxiliar con
clase de conjugación; `n prt` no acredita una categoría única. Se guarda la
evidencia de todos los candidatos y se reconcilia al agrupar apariciones.
La versión `m1.5-segmenter-dictionary-pos-2` invalida las cachés M1 mediante el
mecanismo existente; no cambia la versión de IndexedDB ni las claves léxicas.
La segmentación, frecuencias, formas, contextos e incidencias M1 se conservan.
Consumidores de registros antiguos sin categoría reciben «Sin clasificar».

La vista abre en Vocabulario. Los tres contadores de sección representan tipos
únicos. Los filtros y la ordenación solo afectan al listado, mientras que las
métricas superiores, rotuladas «Todo el tomo analizado», incluyen todas las
categorías. Las incidencias de identidad ambigua/no resuelta permanecen
separadas de la clasificación gramatical y del conocimiento del workspace.

El conocimiento usa cuatro indicadores discretos y accesibles en el resumen,
con estado y explicación completa en el detalle. Una tarjeta `pending` ya no se
interpreta como desconocimiento confirmado: necesita evidencia más fuerte.
Se conservan los enlaces exactos de M1 y sus restricciones de seguridad.

M2 puede seleccionar por defecto con `isMangaLexicalCandidate`: exige categoría
léxica acreditada y alguna glosa no vacía. Esto no certifica un sentido en
contexto ni la calidad editorial de la glosa. El diccionario incluido, por
ejemplo, puede ofrecer `は` como interjección: no se convierte automáticamente
en partícula por su grafía. La desambiguación contextual, cobertura del
diccionario, OCR incompleto y la escasez de enlaces de conocimiento siguen
siendo limitaciones que M2 deberá respetar.

Las nuevas fixtures cubren equivalencias Unicode/kana, lecturas informativas,
POS ausente/contradictoria, preservación de frecuencias/contextos, caché antigua
y filtros independientes del conocimiento. Playwright usa contextos aislados,
ES/EN/CA, ambos temas y 320/390/1280 px, con cambio de tomo, recarga y cambio
de workspace en vivo. El ejemplo real utiliza copias de las dos primeras
páginas OCR de `public/manga/default/hajimete-no-irai.zip` y sus términos reales
de `public/dictionaries/JMdict_spanish.zip`; los archivos y los datos de usuario
no se modifican. La prueba M1 de importación ZIP/Mokuro sigue incluida.

Validación final M1.5: 2.975 pruebas en 265 archivos y 9 pruebas Playwright
correctas con Edge. Build de producción correcto; 749.636 bytes iniciales
(23 bytes más por el texto de continuación). El grafo confirma que la pantalla
y la lógica M1.5 quedan fuera del arranque. Persisten solo los avisos SCSS de
otras pantallas ya presentes en M1. Las capturas de fichas y del análisis se han
inspeccionado en claro/oscuro, incluidos móvil de 320 px y textos ES/EN/CA.

## Corrección lingüística M1.6

Diagnóstico dirigido usando el ZIP JMdict español existente, las páginas OCR
10, 14 y 20 del manga incluido y el `JMdict.gz` local de los experimentos
(snapshot EDRDG de 2026-10-22). No se usa ni modifica la biblioteca del usuario.

| Caso | Cadena y causa | Resultado M1.6 |
| --- | --- | --- |
| お母さん / おかあさん | ICU conserva la palabra completa. Registro 1002650, lectura おかあさん, POS `n pn`. M1.5 enfrentaba sustantivo y pronombre como léxico/funcional. El índice solo consultaba escritura y no resolvía el OCR enteramente en kana. | Nominal léxico: `n` y `pn` pertenecen a vocabulario referencial. Se reutiliza el índice de lectura después de un fallo exacto, únicamente con una identidad candidata inequívoca. Ambas formas conservan el mismo lema/clave; cada aparición guarda su forma original. |
| する | Registro 1157170, POS agregado `vs-i vi vt suf aux-v` en sus diferentes glosas españolas. M1.5 priorizaba `aux-v` y borraba la posibilidad léxica. | Ambigua. Las etiquetas agregadas no determinan si el uso es verbo o auxiliar en esa oración. |
| 見る | Registro 1259290, lectura みる, POS `v1 vt aux-v` repetido para sentidos léxicos y auxiliares. La segmentación de 見る es completa; el problema es la prioridad de categorías y la asociación de sentidos, no el OCR. | Ambigua. No se fuerza a Gramática ni se asigna un sentido por frecuencia. |
| いる | Registro 1577980, POS `v1 vi aux-v`. La exportación mezcla existencia y uso tras forma -te. | Ambigua, incluso en contextos que una persona puede interpretar: no hay un analizador sintáctico que lo certifique. |
| は | La búsqueda exacta devuelve 2069620 (`int`); su glosa española incluye además la partícula temática. El XML conserva una entrada separada 2028920 (`prt`), ausente del diccionario español. | Ambigua por alternativas documentadas de interjección/partícula. No se convierte siempre en partícula. |
| と | La exportación 2872968 tiene `n` para sentidos gramaticales españoles y el peón promovido de shogi. El XML documenta también una identidad de partícula. | Ambigua. No se deduce POS a partir de la traducción «con» ni de la grafía. |
| うん | Registro 1001090, lectura うん, POS `int` y glosas afirmativas; la cadena no pierde evidencia. | Interjección léxica, sin cambios forzados por ser hiragana. |

La clasificación agregada ya no da prioridad automática a auxiliares frente a
clases verbales. `vs-i vt` acredita verbo léxico; `aux-v` por sí solo acredita
función auxiliar; ambos juntos o en acepciones diferentes conservan ambigüedad.
Solo un POS de sentido explícito de la fuente puede indicar que `v1` describe
la clase de conjugación de un auxiliar. Esta evidencia nunca se interpreta como
selección de ese sentido en una aparición concreta.

### Evidencia suplementaria local y reproducible

`scripts/build-manga-pos-evidence.py` genera
`src/app/data/manga-pos-alternatives.generated.ts` desde dos archivos locales,
comprobando sus SHA-256 antes de generar:

- ZIP español: `968c7ca9c63203315b97b0d1bdf0d021444ae9e65d8ff08c5359ba212c5abe10`.
- JMdict.gz: `038a98ddefa4382fc49b98eb839506a776e7fec0c6f2c8b6cf36a711f098d63c`.

La regla es general: cruza escritura y lectura atestiguadas, respeta restricciones
de escritura/lectura por sentido y recoge únicamente POS explícitos del XML.
No hereda el último POS inglés a traducciones sin asociación de POS. No incorpora
otra palabra escrita en kanji solo porque comparta pronunciación. Conserva los
casos donde existen alternativas léxicas y funcionales: 358 huellas de filas,
102 grupos, unos 31 KB de fuente TypeScript, cargados exclusivamente con Manga.
La atribución de los datos sigue siendo JMdict/EDRDG; la URL, snapshot y hashes
quedan en el artefacto generado.

En ejecución, `mangaDictionaryPosEvidence` coteja SHA-256 del registro completo
analizado: escritura, lectura, secuencia, etiquetas, reglas y glosas. Cambiar solo
la glosa impide aplicar el suplemento. No basta una secuencia, una grafía o el
título del diccionario. Las alternativas solo amplían la incertidumbre: no
reescriben registros instalados, inventan sentidos, agregan palabras al conteo
ni prueban equivalencia de identidades o conocimiento. Otros diccionarios sin
esas huellas conservan sus propias etiquetas y sus limitaciones de cobertura.

La versión `m1.6-segmenter-pos-ambiguity-3`, junto con la procedencia del suplemento,
invalida únicamente la caché derivada al cargarla. Se conservan las claves M1 y
las referencias originales. La consulta por lectura puede recuperar una aparición
antes no resuelta (por ejemplo おかあさん); no elimina apariciones existentes ni
fusiona homógrafos. Los contadores superiores siguen abarcando todo lo analizado.

En «Sin clasificar» hay diagnósticos separados para entradas identificadas sin
POS suficiente, entradas identificadas con función ambigua y fragmentos sin
identidad léxica resuelta. Estos últimos son incidencias, no palabras ficticias;
no entran en las frecuencias. La falta de POS no se presenta como fallo de OCR.
El estado de conocimiento es independiente y no se ha modificado en M1.6.

«Módulos» enlaza con el destino canónico existente `/more`. Se retira
`from=manga`, que configuraba el retorno de la cabecera del portal al propio
Manga. La navegación se comprueba por URL final y presencia de la cuadrícula
de módulos mediante ratón, Enter y toque en móvil, sin cambios en otros módulos.

Las regresiones usan 35 filas reales del diccionario, lecturas, homógrafos,
sentidos agregados, ausencia de POS, etiquetas contradictorias y ejemplos OCR
copiados. No se afirma desambiguación contextual en 料理をする, 勉強する,
映画を見る, 見てみる, ここにいる ni 歩いている: se verifica la ambigüedad.
Siguen siendo límites para M2 la sintaxis contextual, las restricciones por
sentido ausentes en la exportación, la cobertura del diccionario y el OCR.
No se ha añadido otro segmentador ni una dependencia de análisis japonés.

Validación: 58 pruebas dirigidas correctas; suite global final de 2.989 pruebas
en 266 archivos correcta; 15 pruebas Playwright correctas con Edge, incluidos
M1/M1.5, navegación y regresiones M1.6 a 320/390/1280 px.
Build de producción correcto: 749.636/750.000 bytes iniciales, sin crecimiento
respecto a M1.5. El grafo de imports confirma que ni la evidencia suplementaria
ni la lógica M1.6 forman parte del arranque. Se mantienen los avisos SCSS
preexistentes de otras pantallas. ES/EN/CA sincronizados; capturas revisadas.

## Consumidor M2

RUSH por tomo reutiliza este índice mediante la nueva lectura exclusiva de
caché `MangaVocabularyIndexService.cached()`, sin recalcular OCR ni cambiar el
clasificador. La práctica y sus respuestas son temporales y no modifican el
conocimiento ni FSRS. Véase [manga-m2.md](manga-m2.md) para filtros, elegibilidad,
selección, aislamiento y verificación.
