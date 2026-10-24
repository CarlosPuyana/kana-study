# Manga × Mazos — Hito 2A.1: validación léxica enriquecida

22 de octubre de 2026. Investigación local sobre H2A; no integración pública ni H2B.

## Resultado y recomendación

Se implementó un adaptador del XML auténtico de JMdict, un índice consultable por
entrada y un validador conservador que puede construir el contrato real de identidad
de H1. Las once regresiones inseguras dejan de producir aceptaciones. Sin embargo,
**en el corpus original el nuevo validador no acepta ninguna palabra: cobertura y
recall cero, 52 falsos negativos**. No hay muestra con la que estimar precisión.
Esto es una limitación funcional grave, no una mejora demostrada de calidad de producto.

La política exige un único sentido de fuente compatible; no sabe relacionar de forma
fiable sentidos de lenguas distintas ni resolver polisemia contextual. Las entradas
multilingües contienen varios registros de sentido incluso cuando podrían ser
traducciones equivalentes. No se inventa esa equivalencia. El precio es abstenerse
también en palabras que las referencias de desarrollo consideran válidas.

**Recomendar continuar investigación y no iniciar H2B**, tampoco presentarlo como listo
para un modo experimental integrado. Mantener bloqueada toda generación automática.
Un control positivo auténtico fuera del corpus confirma que la rama de identidad no
está deshabilitada; no compensa la cobertura cero ni valida precisión independiente.

## 1. Fuente auténtica y trazabilidad

Se descargó [JMdict XML multilingüe de EDRDG](https://www.edrdg.org/pub/Nihongo/JMdict.gz),
sin leer ni enviar un manga del usuario. El primer host `ftp.edrdg.org` presentó un
error de certificado; se usó `www.edrdg.org` con TLS válido, sin desactivar verificación.

| Recurso fijado | Valor |
|---|---|
| Last-Modified de la fuente | Thu, 22 Oct 2026 03:30:22 GMT |
| gzip / XML | 22.204.622 / 120.578.678 bytes |
| SHA-256 gzip | `038a98ddefa4382fc49b98eb839506a776e7fec0c6f2c8b6cf36a711f098d63c` |
| SHA-256 XML | `b289a5ee1e9fa787ccc427261b49cd7026ff2059aaf7c909753ea5eca73b300a` |
| Entradas auténticas | 218.945 |
| Lecturas con re_restr / re_nokanji | 4.769 / 6.648 |
| Sentidos con stagk / stagr | 625 / 1.040 |
| Glosas eng / spa | 443.815 / 68.288 |
| Otros idiomas realmente presentes | dut, ger, rus, hun, swe, fre, slv |

`enriched-source.json` fija fuente, hash y fecha. `reports/enriched-source.json`
registra hash del adaptador, índice, dimensiones, idiomas y recuentos. La URL es
rotativa: una descarga posterior puede fallar por hash; conservar la copia local de
esta revisión o generar explícitamente una nueva evaluación. No existe promesa de
archivo histórico permanente en esa URL.

`build-enriched.py` verifica gzip y XML antes de convertir. Preserva códigos de
entidades DTD (por ejemplo `v1`), sin deducirlos a partir de descripciones. Rechaza
entidades externas; no es un importador de archivos arbitrarios. Se conservan:

- ent_seq, grafías, variantes, metadatos y prioridades;
- lecturas, `re_restr`, `re_nokanji`, información y prioridades;
- `stagk`, `stagr`, POS declarado y POS efectivo heredado según la DTD;
- sentidos, dominios, dialectos, misc, notas, referencias, antónimos y fuentes de préstamos;
- cada glosa y sus atributos, idioma ISO de tres letras real (por defecto `eng`), procedencia;
- hash de fuente, hash canónico de contenido de entrada y revisión del adaptador.

El hash de entrada es de su representación canónica convertida, no de los bytes XML
originales de esa entrada. El índice de sentido se conserva como referencia local
`hashXML:ent_seq:ordinal`, marcada **no estable entre revisiones**. No entra en la
identidad permanente. No se reconstruyen relaciones desde filas Yomitan.

### Restricciones y límites de interpretación

La [DTD de JMdict](https://www.edrdg.org/jmdict/jmdict_dtd_h.html) especifica que
`re_restr` limita las grafías a las que corresponde una lectura; sin él se consideran
las grafías de la entrada. `re_nokanji` impide tratar esa lectura como lectura de sus
grafías kanji. `stagk`/`stagr` limitan la aplicabilidad del sentido. El adaptador
conserva esos campos; el validador aplica su intersección y no los sustituye por ranking.
Para texto kana solo permite una forma `reb` registrada exactamente, sin inventar
una equivalencia ortográfica por parecido fonético.

No hay identificador de sentido permanente demostrado ni alineación multilingüe
completa. Una entrada con cinco registros no demuestra cinco palabras distintas,
pero tampoco autoriza a unirlos automáticamente. Esa carencia bloquea el uso práctico
de la política actual y exige revisar el modelo de grupos léxicos con evidencia adicional.

## 2. Licencias y distribución

La [licencia oficial EDRDG](https://www.edrdg.org/edrdg/licence.html), revisada en esta
fase, cubre componentes japonés/inglés con CC BY-SA 4.0 y exige atribución,
documentación y un procedimiento de actualización. Los equivalentes de otras
lenguas tienen derechos de sus compiladores. No se ha acreditado una autorización
completa para redistribuir las glosas españolas de un recurso derivado nuevo.

Por ello XML, SQLite y datos temporales enriquecidos quedan **solo en `resources/`
ignorado**, sin assets públicos ni exportación de glosas. Falta identificar titulares,
términos y atribución de español, o limitar explícitamente un futuro recurso al
componente japonés/inglés bajo sus condiciones. Tampoco se certifica automáticamente
que la licencia inglesa cubra otros idiomas. El índice conserva sus idiomas reales
para auditoría local, sin traducirlos ni equipararlos.

Los informes contienen metadatos, referencias, motivos y ejemplos originales del
corpus, no un nuevo diccionario de glosas. La documentación enlaza la fuente y sus
términos. No se altera el ZIP instalado por usuarios.

## 3. Arquitectura implementada y contratos

Todo vive en `experiments/manga-morphology-h2a/`:

| Componente | Función ejecutable |
|---|---|
| build-enriched.py | XML fijado → SQLite local, gzip por entrada y lookup por grafía/lectura |
| enriched-lexicon.mjs | Verifica hashes de índice/adaptador, abre SQLite readonly, consultas completas e índice, LRU 128 |
| lexical-validation.mjs | Restricciones, integridad/contexto, alternativas, abstención y prueba de identidad |
| h1-identity.mjs | Transpila en memoria la función pura real `lexicalIdentity` de H1, sin editarla |
| evaluate-enriched.mjs | Mismo corpus y salidas Lindera, comparador antiguo/nuevo, errores e identidades |
| benchmark-enriched.mjs | Proceso separado sin cargar filas antiguas para medir coste del léxico |
| validation-contracts.ts | Contratos del experimento que importan el tipo `LexicalIdentity` real de H1 |

Entrada del validador: token, superficie original, lema/lectura/POS propuestos, tokens
vecinos del mismo fragmento, texto normalizado, rango original UTF-16, candidatos
enriquecidos y contexto de integridad opcional. La pertenencia del objeto al léxico
verificado se comprueba antes de aceptar; un clon o paquete inventado no se acredita
por tener un ent_seq numérico. Es una frontera local de confianza, no una firma de
EDRDG sobre el índice generado por el desarrollador.

Salida: clasificación, motivos, candidatos/lecturas relevantes, alternativas de
sentido, rango, original e identidad o `null`. Si se acepta, conserva fuente, hash de
entrada, prueba de restricciones y referencia de sentido local; `cardCreationAllowed`
es siempre `false`. No se escribe ninguna tarjeta ni snapshot FSRS.

La identidad utiliza H1: autoridad `jmdict`, ent_seq auténtico, lectura compatible y
grupo explícito `entry-reading-single-source-sense-v1`; clave SHA-256 de su ancla.
Este grupo solo se asigna cuando hay una única entrada/lectura viable y un único
sentido aplicable de fuente, con glosa inglesa real y POS/morfología compatibles.
No equivale una fila única a un sentido único. No se elige el primer candidato.
La evidencia se versiona por hash de fuente; futuras ambigüedades invalidarán la
prueba para nueva aceptación, sin modificar identidades o historiales existentes.

Se usa el mapa NFC/UTF-16 del spike original, manteniendo original y rangos, incluidos
emoji y dakuten. No se aplica NFKC, corrección OCR, búsqueda difusa ni unión entre
líneas/bloques. La comparación katakana/hiragana de una lectura es controlada; no
certifica por sí sola equivalencia entre entradas. No se unen por lectura o traducción.

Los contratos se comprueban con TypeScript; esto no convierte los módulos JS/Python
en código íntegramente tipado. No hay provider Angular, Worker enriquecido integrado,
servicio público o persistencia de estudio. Los contratos generales de H2A siguen
siendo propuestas de integración futura.

## 4. Reglas generales y diagnóstico de los once fixtures inseguros

Las reglas no reciben IDs, categoría de corpus, etiquetas ni respuestas esperadas.
Los IDs siguientes se usan exclusivamente para localizar regresiones y medir.

| Caso | Causa del falso positivo anterior / evidencia que faltaba | Regla general y regresión nueva |
|---|---|---|
| v17 食べられる | Una raíz válida no resuelve potencial/pasiva | Abstención ante auxiliares ambiguos, también cuando IPADIC los etiqueta verbo sufijo |
| c10 うわあああ | Aceptaba fragmentos de elongación como palabras completas | Repetición expresiva no normalizada: abstenerse, sin comprimir letras |
| e04 春さん | Sustantivo común interpretado como nombre posible | Vecino nominal sufijo y cadena nominal sin desambiguar |
| o03 百合姫谷も | Segmentos conocidos dentro de cadena OCR/nombre incierta | No certificar partes de una secuencia nominal contigua no resuelta |
| o05 読め□い | La raíz conocida ocultaba un carácter perdido | Marcas de corrupción y metadatos de integridad fuerzan abstención |
| o07 食べな | Posible truncamiento/imperativo sin evidencia de final | Fragmento con partícula terminal no anclada; no completar una conjugación |
| k05 スーパー | Una fila exportada ocultaba sentidos | Conservar sentidos originales: 16 aplicables, tres ingleses en la fuente medida; identidad no única |
| s02 目 | Carácter aislado sin contexto de lectura/sentido | Fragmento de un carácter no certificable automáticamente |
| s03 手 | Mismo problema, no resuelto por ranking | Misma regla, sin excepción literal |
| s04 火 | Lecturas/usos posibles no acreditados | Misma regla, preservar alternativas |
| s05 雨 | Lectura contextual sin prueba | Misma regla, no inferir del token más probable |

Se prueban los once contra el motor real; cada salida relevante tiene motivo e
`identity: null`. Los candidatos se conservan incluso cuando una guarda contextual
impide llegar al filtro de sentidos. Estas pruebas demuestran abstención, no acierto
semántico independiente ni una solución general de OCR.

Otras comprobaciones:

- 生 permanece ambiguo, sin elegir lectura por ranking. 橋/箸 apuntan a entradas
  distintas y no se fusionan por はし.
- ここ/此処 conservan su relación real con 1288810; no se fabrica una identidad
  definitiva mientras sus sentidos no estén resueltos. Esto pierde dos referencias válidas.
- 来ました ahora tiene prueba explícita `vk-polite-stem`: lectura superficial き
  frente a base くる solo con `vk` y auxiliar ます. 来ない exige la otra forma.
  No produce identidad: la entrada 1547720 conserva 22 sentidos aplicables, cinco ingleses,
  y alternativas de lectura; resolver la flexión no resuelve todos los sentidos.
- そういう encuentra la entrada auténtica 1394680, ausente del filtro español anterior.
  Conserva tres sentidos de fuente (uno inglés); sigue absteniéndose. Recuperar el
  candidato no equivale a resolver su identidad.
- Las coincidencias parciales dentro de expresiones completas registradas como `exp`
  quedan ambiguas. No se concatenan tokens de bloques diferentes ni se cuenta una
  expresión y su fragmento como la misma unidad.

### Controles positivos y falsos negativos

`アメリシウム`, entrada real 1018910, satisface la política y genera la misma clave H1
al repetir el análisis, también con puntuación. Con sufijo nominal, corrupción o
fragmentación, se abstiene. El test usa ese control fuera del corpus congelado.
Es un control de implementación escogido tras inspección estructural, **no una nueva
referencia independiente ni parte del denominador de precisión**.

La política pierde los 28 focos válidos antes recuperados y tampoco recupera los
24 ya perdidos. Esos 52 FN se mantienen visibles. Las reglas sobre caracteres,
cadenas nominales, repeticiones y terminales también pueden rechazar usos legítimos;
no hay evidencia independiente de que ese coste sea necesario en general. Los controles
positivos prueban que no se rechaza todo por un interruptor, pero **no demuestran que
se hayan evitado falsos negativos innecesarios**. Esa parte sigue bloqueada.

## 5. Comparativa reproducible sobre las mismas referencias

Se conserva intacto `corpus.tsv`, SHA-256
`8d34a714ce1f53ac67260e65686febefa61b3d81a8910a1218a59c79c6b4379d`:
100 casos originales, 80 difíciles, cero revisados por experto independiente.
Mismo motor Lindera 6.2.0 + IPADIC 6.2.0 y mismos tokens para ambos filtros.
El comparador antiguo vuelve a producir exactamente 28 TP y 14 FP.

**Factor de confusión declarado:** se compara el pipeline antiguo con Yomitan español
del 1 de octubre y el nuevo con XML multilingüe del 22. No se atribuye la diferencia
exclusivamente al algoritmo ni se presenta un ensayo controlado de una sola variable.

Se conservan denominadores H2A: todos los candidatos aceptados que solapan el foco;
TP exige span, lema, lectura base y etiqueta verificable. El recall usa 52 focos
válidos; cobertura es casos con alguna aceptación entre 100. Abstención significa
predicción `ambiguous` o `unknown`; exclusión se informa separadamente.

| Métrica | Antiguo, reevaluado | Enriquecido |
|---|---:|---:|
| Candidatos aceptados | 42 | 0 |
| TP / FP | 28 / 14 | 0 / 0 |
| FN sobre 52 válidos | 24 | 52 |
| Precisión | 66,67 % | Indefinida, sin muestra |
| Wilson 95 % nominal | 51,55–78,99 % | No procede |
| Recall | 53,85 % | 0 % |
| Cobertura por caso | 39 % | 0 % |
| Abstenciones por caso | 42 % | 81 % |
| Exclusiones por caso | 19 % | 19 % |
| Fixtures inseguros aceptados | 11 | 0 |
| Identidades H1 verificadas en el corpus | No construidas | 0 |
| Ocurrencias de tokens sin identidad | No comparable al filtro provisional | 177 |

Cero falsos positivos con cero aceptados no demuestra ≥98 %, ni siquiera una precisión
estimable. No se ocultan FN o fixtures difíciles ni se suman controles al denominador.
Los intervalos anteriores son nominales sobre desarrollo, no garantías de producto.
No hay volúmenes reales medidos ni cantidad útil de palabras por volumen acreditada.

Matriz nueva, filas referencia y columnas predicción, cada una de las 100 referencias:

| Referencia / predicción | Verified | Ambiguous | Unknown | Excluded |
|---|---:|---:|---:|---:|
| Verified (52) | 0 | 49 | 1 | 2 |
| Ambiguous (32) | 0 | 28 | 0 | 4 |
| Unknown (4) | 0 | 1 | 0 | 3 |
| Excluded (12) | 0 | 2 | 0 | 10 |

La matriz anterior permanece en `reports/enriched-comparison.json` y en H2A; no se
reemplaza por la nueva. La clasificación de desconocidos continúa sin aciertos
completos: el indicador morfológico 4/4 de presencia de unknown no la soluciona.

Errores de desarrollo nuevos agrupados (detalle de las 31 categorías en el JSON):

| Categoría | FN válidos | Otros errores relevantes |
|---|---:|---|
| Verbos negativos/literarios/pasados/formas de cortesía/te/irregulares/causativo/volitivo/progresivo | 19 | La morfología no acredita grupo de sentido |
| Adjetivos | 9 | Polisemia y sentidos multilingües no agrupados |
| Sustantivos/homófonos/variantes | 5 | Abstención también en referencias de una sola letra válidas |
| Interjecciones | 1 | Coincidencia de lectura no basta |
| Coloquial/onomatopeyas | 6 | Además un desconocido excluido incorrectamente |
| Expresiones compuestas | 4 | Unidad completa y partes no resueltas |
| Katakana | 7 | Desconocidos, lecturas alternativas y sentidos |
| Offsets con emoji | 1 | Rango correcto, identidad no demostrada |

Los FP aceptados nuevos son cero en todas las categorías porque no se acepta nada.
Persisten errores de clasificación en auxiliares, nombres, Unicode y fragmentos
desconocidos; no se confunden con candidatos verificados incorrectos.

La tokenización no cambia: spans 146 TP / 6 FP / 6 FN (96,05 % precisión y recall),
lema/lectura 54/58, POS 68/71 y offsets 177/177. Este hito evalúa validación, no aporta
una nueva comparación de tokenizadores ni pruebas móviles de ellos.

## 6. Rendimiento nuevo del léxico

Node 24.21.0, Windows x64, Ryzen 9 3900XT. Medición local, sin vaciar caché del SO.
Los informes H2A originales permanecen intactos y no se atribuyen como benchmarks
nuevos. No se ha medido un navegador ni móvil físico para el léxico enriquecido.

| Recurso/coste | Medición nueva |
|---|---:|
| Fuente gzip / XML | 22.204.622 / 120.578.678 bytes |
| Índice compacto SQLite completo | 214.196.224 bytes |
| Construcción compacta, una ejecución | 46,86 s |
| Primer índice local sin compresión | 835.923.968 bytes; descartado como formato de uso, sin borrar datos ajenos |
| Apertura+verificación streaming del índice (comparador) | 292,35 ms |
| 177 consultas de candidatos, total / mediana / p95 | 84,17 / 0,28 / 1,50 ms |
| Validación total / mediana / p95 de esas llamadas | 15,99 / 0,013 / 0,37 ms |
| Capa léxica de 100 fragmentos, primer recorrido | 104,00 ms, sin tokenización |
| Lecturas warm de candidatos, sin revalidación | 47,94 ms; no es un análisis completo |
| Escritura+lectura temporal de decisiones, local | 13,42 ms; 63.534 bytes |

Las consultas internas de expresiones completas se incluyen en tiempo de validación,
no en la lista de 177 consultas iniciales. El índice ofrece acceso por grafía/lectura,
sin cargar todas las entradas JS; cada entrada se descomprime al consultar. Caché LRU
con límite 128, límite de 1024 candidatos sin truncado silencioso y descompresión por
entrada acotada. No se mide aquí una distribución de red ni descarga inicial móvil.

`reports/enriched-performance.json` usa un **proceso separado** que no carga las filas
Yomitan del comparador. Fuerza GC en snapshots para reducir ese factor, sin atribuir
RSS exclusivamente al léxico:

- Apertura/verificación 229,59 ms. Primer recorrido léxico completo 89,13 ms.
- Cinco recorridos completos adicionales: 69,55 / 67,65 / 66,58 / 70,48 / 64,15 ms.
  Todos mantienen cero aceptados; no se omite la validación en la repetición.
- RSS antes del léxico / tras abrir / tras primer recorrido / tras cinco repeticiones:
  192.012.288 / 193.499.136 / 216.059.904 / 280.530.944 bytes.
- HeapUsed en esos snapshots: 18.544.672 / 15.521.592 / 20.978.272 / 21.134.216 bytes.
- Pico RSS del proceso al final: 277.272 KiB. Incluye Node, TypeScript del harness H1,
  WASM, SQLite y asignador; crecimiento RSS con heap casi estable no demuestra por sí
  solo una fuga ni memoria incremental exclusiva del motor.
- WASM Lindera: 97.124.352 bytes, separado de RSS. Memoria de navegador y pico móvil:
  **no medidos**, registrados `null`.
- Caché: 529 hits / 959 misses en seis recorridos, incluidos lookups internos.
  La caché acotada evita retener todo, pero tiene churn; no se afirma reutilización perfecta.

El tamaño y memoria siguen siendo demasiado grandes para aprobar distribución móvil
sin más trabajo. Proponer índices compactos de IDs+offsets y shards de entradas,
separación de lenguas solo con política explícita, metadatos no duplicados y acceso
por bloques. Son propuestas; no se ha medido una implementación browser/OPFS/IndexedDB
ni se ha introducido `node:sqlite` en Angular. No trasladar cifras de Node a Safari/Android.

## 7. Corpus independiente y reglas de anotación

Por respuesta explícita del usuario se continúa con el corpus experimental existente.
La revisión humana independiente queda pendiente; no se inventan revisor, ubicación
de manga ni permisos. La generación de tarjetas y H2B permanecen bloqueados.

`corpus-independent/ANNOTATION.md` define procedencia/derechos, spans UTF-16, capas
morfológica/léxica separadas, alternativas de entrada/lectura/sentido, razones,
desacuerdos, adjudicación y congelación antes de evaluar. `slots.jsonl` reserva
100 huecos vacíos con fuente, autorización, familia de fuga y revisión pendientes:
**no son casos ni referencias validadas**. Hay cero casos independientes disponibles.

Separar por obra, unidad léxica y familia de flexión/contexto, además de hashes de texto.
Cambiar una terminación o nombre de un ejemplo de desarrollo no lo hace independiente.
La detección de equivalencias y competencia del revisor requieren revisión humana;
no se presume que un flag JSON la acredite. Los desacuerdos/no certificables se
conservan, no se excluyen para elevar cifras. El objetivo de ≥200 referencias fiables,
≥50 difíciles, no se ha alcanzado. Los ejemplos del agente no cuentan como expertos.

## 8. Bloqueos y próximos pasos

1. Definir con revisión lingüística qué constituye un grupo homógrafo/sentido estable
   para tarjetas. No usar ordinales, similitud de glosas ni lectura como atajo.
2. Investigar fuente/relación explícita que permita alinear traducciones con sentidos,
   o justificar una política de autoridad por componente lingüístico separada. No
   convertir todos los sentidos multilingües en equivalentes sin prueba.
3. Recuperar cobertura y evaluar el coste de reglas de integridad con pares positivos
   y negativos revisados. La política de un sentido completo es demasiado restrictiva;
   el resultado actual no satisface utilidad ni evita FN innecesarios.
4. Obtener corpus independiente autorizado y revisión competente antes de reclamar
   ≥98 % de precisión. Incluir recall, abstenciones, tamaño, intervalos y utilidad por obra.
5. Resolver licencias ES y estrategia de recurso versionado/actualización. El índice
   permanece local; distribución y base-href/browser se evaluarían en una fase posterior.
6. Medir arquitectura de léxico compacta en móviles físicos antes de integración.

Se termina la implementación y evaluación experimental solicitada con bloqueo
documentado. No se recomienda iniciar H2B con estos resultados. No se ha habilitado
`CUSTOM_DECKS_ENABLED`, modificado FSRS, Stats V2, cloud, SQL, datos Japanese 1500,
identidades históricas ni el diccionario de usuarios.

## 9. Validaciones y archivos

Nuevos scripts, contratos, protocolo/slots, tests y tres informes JSON en el directorio
experimental; se actualizan su README, scripts npm, tsconfig y gitignore. Se añade
este informe y una sección a DESIGN. Sin dependencias nuevas en la raíz ni en el
experimento (Python estándar y SQLite de Node); recursos grandes ignorados.

Resultados nuevos ejecutados en H2A.1:

- Corpus completo y comparativa antiguo/nuevo: 100 casos intactos, ambos sobre Lindera;
  resultados y motivos registrados, sin repetir comparativa completa de motores.
- Prototipo Node: **31/31 tests**, incluidos 21 nuevos y las diez pruebas H2A.
- Parser XML Python: **3/3**, restricciones, idioma/POS heredado y entidades externas.
- TypeScript de contratos, app y specs: **correctos**.
- Suite de aplicación: **1735/1735 tests, 173 archivos**, una ejecución nueva.
- Build `npm run build -- --base-href /kana-study/`: **correcto**, cuatro warnings SCSS
  conocidos de Grammar; ningún motor/recurso experimental incorporado a la app.

Pruebas dirigidas de la aplicación (`custom-deck.repository`,
`japanese-deinflection.service` y `features/manga/dictionary`): **65/65 tests en tres
archivos**, ejecución nueva. `git diff --check` correcto; solo avisa de LF/CRLF en el
archivo generado preexistente, sin errores de whitespace. Se comprobaron también los
textos nuevos porque el diff de Git no incluye archivos todavía sin seguimiento.

La comparación SHA-256 del estado previo confirma que los únicos cinco archivos
preexistentes cambiados son DESIGN y README/package/tsconfig/gitignore del experimento.
El corpus original, todos sus informes H2A y los archivos de producción conservan sus
bytes. package.json/lock de la raíz siguen sin cambios.

La pasada Node vuelve a comprobar resultados browser **registrados de H2A**; no es una
nueva medición Chromium del validador enriquecido. El benchmark de Node y la construcción
del índice sí son nuevos. No se atribuyen a esta fase ejecuciones anteriores de H1.1.

No commit. No push.
