# Manga × Mazos — Hito 2A.2: entrada, identidad, sentido y tarjeta

Evaluación experimental del 22 de octubre de 2026. No se inicia H2B ni se modifica
producción. H1/H1.1, Stats V2, corpus y resultados históricos permanecen intactos.

## Resultado y decisión

Separar niveles recupera **45 de los 52 focos positivos compatibles con lema, lectura
y span de referencia**. La política H2A.1 recuperaba cero. Se producen propuestas de
entrada única en 69 casos, pero no hay referencia independiente de ent_seq que permita
llamarlas 69 identificaciones correctas. Son hipótesis de forma léxica, no traducciones
contextuales ni identidades H1 verificadas.

En el corpus siguen existiendo **cero identidades permanentes demostradas, cero
sentidos contextuales certificados y cero tarjetas autoelegibles**. Las tres políticas
dejan 68 casos con propuestas sujetas a revisión y 32 no elegibles. De esos 68, 65
incluyen una propuesta única de entrada y 45 son compatibles con focos positivos.
No se ha realizado ninguna confirmación humana. No son 68 tarjetas ni 68 palabras
aprovechables de una obra real.

**Recomendar una futura V1 asistida con confirmación humana explícita**, en lugar de
seguir exigiendo desambiguación automática completa para mostrar candidatos. Requiere
autorización posterior, contrato estable de identidad y revisión de permisos/distribución.
No se implementa esa V1, no se activa el gate custom y no se aprueba automáticamente H2B.
El objetivo ≥98 % sigue pendiente de evaluación independiente.

## 1. Diagnóstico de los 52 falsos negativos de H2A.1

El validador estricto mezclaba reconocimiento de entrada con una condición suficiente
para una identidad: una sola entrada/lectura viable **y un único registro de sentido
de fuente**. Una entrada reconocible podía tener sentidos distintos y traducciones
en registros separados, sin que eso invalidase reconocer su forma léxica.

La auditoría nueva examina todos los candidatos del token aunque la política estricta
se haya detenido antes por una guarda contextual. No recibe etiquetas como entrada;
solo después selecciona los 52 focos positivos para diagnosticar. Son **presencias de
condiciones solapadas**, no causas mutuamente excluyentes ni prueba de causalidad de
cada alternativa descartada.

| Condición medida, denominador 52 | Casos |
|---|---:|
| Varias entradas antes de aplicar evidencia de lectura | 10 |
| Varias lecturas brutas de entrada antes de evidencia morfológica | 16 |
| Varios registros de sentido aplicables en una misma entrada | 48 |
| Registros con grupos de idiomas diferentes | 47 |
| Varias glosas dentro de algún sentido | 48 |
| Restricciones de grafía/lectura/sentido podan alternativas | 13 |
| Alguna alternativa con POS incompatible | 9 |
| Ninguna alternativa con POS compatible | 1 |
| Guardas de contexto insuficiente | 5 |
| Guardas de corrupción/fragmentación en estos positivos | 0 |
| Alguna entrada reconocible pero bloqueada por la política estricta de sentidos | 46 |
| Grupo homógrafo H1 no demostrado por la política previa | 52 |
| No hay token individual que coincida con todo el foco | 2 |
| Token desconocido o lectura ausente | 3 |

«Lecturas» distingue inicialmente los valores brutos, incluso variantes kana de la
misma entrada. La capa posterior puede agrupar una lectura canónica dentro de **esa
misma entrada**, conservando grafías, restricciones y lecturas originales; no fusiona
entradas por lectura. «POS incompatible» y «restricción» significan poda, no que todas
las alternativas fueran inválidas. Solo en un caso no queda POS compatible.

Solapamientos comprobados:

- 47 tienen tanto varios sentidos como registros de idiomas separados.
- Los diez con varias entradas y los 16 con varias lecturas también tienen varios sentidos.
- Doce tienen varios sentidos y poda por restricciones; once tienen registros de idiomas
  separados y poda por restricciones.
- Ocho tienen varios sentidos y alternativas POS incompatibles; siete tienen idiomas
  separados y POS incompatibles.
- De los 46 con alguna entrada reconocible, 45 tienen registros de idiomas separados.
- Los cinco con contexto insuficiente también tienen varios sentidos.

La matriz completa de solapamientos por pares y la lista exacta de los 52 casos están
en `reports/layered-comparison.json`, sección `diagnosis`. La suma de filas supera 52
por diseño. El valor 52 del grupo H1 expresa ausencia de prueba **bajo esa política**,
no una imposibilidad lingüística permanente de construir identidades.

Los cinco positivos afectados por contexto son `a10`, `n02`, `n06`, `n07`, `e03`.
El POS sin alternativa compatible es `c07`. No hay span completo para `e03` y `k07`;
faltan lecturas/evidencia en `k06`, `k07`, `k08`. Ningún positivo de esta muestra
lleva una guarda de corrupción, aunque esas guardas sí actúan en referencias ambiguas.

## 2. Implementación por niveles y contratos

Se añaden `layered-validation.mjs`, `evaluate-layered.mjs`, contratos y tests al
experimento. Se reutilizan el léxico autenticado, sus consultas completas y las
funciones de restricciones/morfología de H2A.1. No se cambia el validador anterior.

| Nivel | Resultado ejecutable | Lo que no demuestra |
|---|---|---|
| MorphologicalRecognition | Superficie original, lema/lectura/POS propuestos, spans normalizado/original UTF-16 y versión/hashes de motor | Interpretación de sentido o lectura contextual independiente |
| LexicalResolution | Entradas y formas compatibles, pruebas/restricciones, alternativas y estado identified/ambiguous/unresolved/excluded | Identidad permanente solo por encontrar una entrada |
| SenseResolution | Sentidos aplicables separados, glosas con idioma/procedencia reales, POS/restricciones e incertidumbre | Alineación de traducciones o selección contextual automática |
| CardEligibility | eligible/requires-review/ineligible por política, motivos, confirmación pendiente y gate de aprobación | Que una propuesta pueda convertirse ya en tarjeta |

El estado `identified` está limitado explícitamente a
`token-form-under-morphological-hypothesis`. En OCR corrupto una forma puede coincidir
con el diccionario pero su aparición sigue `unconfirmed-fragment`; no se cuenta como
palabra del texto verificada. Si varias entradas siguen siendo compatibles se conserva
`ambiguous`, sin ordenar por frecuencia para elegir una.

La referencia provisional incluye autoridad real, ent_seq, lectura, hash de fuente,
`scope: source-revision-only`, `synchronizable:false` y `homographGroup:null`.
No tiene una clave falsa `lex1-` ni sustituye una `LexicalIdentity`. La rama permanente
solo reutiliza una identidad realmente demostrada por el validador estricto previo.
En los 100 casos no hay ninguna; el control técnico externo a las métricas sí prueba
esa rama. No se cambia una identidad FSRS existente.

Los sentidos no se deduplican por glosas parecidas. Una referencia de sentido continúa
vinculada al hash/ordinal de fuente, marcada no estable entre revisiones. El código
mantiene `selectedSense:null`, `contextualInterpretationCertified:false` y conserva
las interpretaciones documentadas para revisión.

`layered-contracts.ts` usa el tipo H1 real. Las comprobaciones negativas de TypeScript
impiden asignar una referencia provisional a H1, marcar interpretación certificada o
autorizar aceptación automática. Son pruebas de contratos, no type checking exhaustivo
de todo JS/Python. `demonstratedKnownCardMatch` comprueba solo la igualdad de una
identidad permanente demostrada; jamás una propuesta provisional.

## 3. Polisemia y registros multilingües

La [DTD de JMdict](https://www.edrdg.org/jmdict/jmdict_dtd_h.html) distingue entrada,
grafías/lecturas y sentidos. Cada sentido puede tener varias glosas y atributos de
idioma. Las restricciones de lectura y sentido delimitan su aplicabilidad; el POS
puede heredarse. Eso permite reconocer una entrada sin exigir que solo tenga una
glosa, pero no ofrece una alineación universal de registros español/inglés.

Se distinguen expresamente:

- varios significados documentados de una misma entrada;
- varias glosas dentro de un mismo registro, que no se cuentan como palabras nuevas;
- registros separados con diferentes idiomas, sin asumir equivalencia ni diferencia
  semántica por el solo hecho de estar separados;
- restricciones que impiden aplicar un sentido a determinadas grafías/lecturas;
- relaciones semánticas o contextuales que la fuente no documenta suficientemente.

El componente inglés puede aportar sentidos documentados aunque no haya español
compatible. Eso no bloquea reconocer la entrada ni autoriza a inventar una glosa ES.
El runtime conserva texto e idioma reales localmente; el informe versionable elimina
todas las glosas y solo guarda recuentos por idioma/referencias. El archivo completo
queda ignorado en `resources/enriched/layered-full-local.json`.

Fuente y hashes son los de H2A.1, sin descarga nueva ni alteración del diccionario de
usuarios. La [licencia EDRDG](https://www.edrdg.org/edrdg/licence.html) permite usar el
componente japonés/inglés conforme a sus condiciones de atribución/documentación y
actualización; los derechos de traducciones de otras lenguas requieren comprobar sus
titulares y términos. La redistribución de un nuevo léxico español sigue bloqueada.

## 4. Regresiones: forma, entrada, identidad, sentidos y tarjeta

Todas las identidades de las filas siguientes son **provisionales o ambiguas**, nunca
H1 permanentes. El número de sentidos indicado es después de restricciones/POS en la
capa nueva, no necesariamente el número de registros sin filtrar de la entrada completa.

| Caso | Reconocimiento / propuesta de entrada | Sentidos restantes | Decisión y motivo |
|---|---|---:|---|
| 来ました | 来/き → 来る, 1547720; prueba vk+ます; conserva きたる como alternativa no seleccionada | 22 | Revisión: entrada propuesta no selecciona significado ni grupo H1 |
| 食べなかった | 食べ/たべ → 食べる, 1358280 | 12 | Revisión de significado/identidad |
| 負けぬ | 負け/まけ → 負ける, 1497980 | 20 | Revisión de significado/identidad |
| ここ | Cuatro propuestas: 1288810, 1593190, 1639930, 1955390 | 28 entre alternativas | Ambigua; no se fuerza la entrada compartida con 此処 |
| 此処 | 1288810, lectura ここ; evidencia real de variante | 12 | Provisional, pendiente de identidad y sentido |
| 橋 / 箸 | 1237410 / 1476410, ambas con propuesta はし | 10 / 9 | Separadas; lecturas no preferidas siguen auditables |
| 生 | IPADIC propone なま y entrada 1378450; no descarta la incertidumbre de contexto | 28 | Revisión; no unir con otras entradas/lecturas de 生 |
| そういう | 1394680, forma y lectura documentadas | 3 | Reconocida provisionalmente sin inventar traducción ES |
| 春さん | 春/はる, 1341000 bajo hipótesis morfológica | 21 | Revisión explícita: podría ser nombre, no certificar sustantivo |
| スーパー | 1066710, lectura propuesta すーぱー | 3 compatibles con POS | Varias acepciones; revisión, nunca «supermercado» por defecto |
| 読め□い | Posibles partes 読む/1456360 y varias entradas para い; símbolo excluido | 25 y otras alternativas | Ineligible: reparar/verificar fragmento antes de revisar significado |

La prueba inicial de variantes esperaba equivocadamente que ここ fuera unívoco: el
XML completo demuestra cuatro alternativas. Se corrigió la aserción para exigir que
permanezca ambiguo y conserve la relación auténtica con 此処, sin cambiar algoritmo,
corpus o referencias para forzar equivalencia. También se distinguió el símbolo □
excluido de las partes léxicas que requieren reparación; no se omitió ningún test.

Estado de los once fixtures inseguros originales, política C:

| IDs | Estado nuevo | Problema conservado |
|---|---|---|
| v17 | requires-review | Potencial/pasiva no resuelto |
| c10 | ineligible | Elongación y fragmentos no equivalen a palabras completas |
| e04 | requires-review | Nombre propio frente a sustantivo |
| o03 | requires-review en algunas partes; otras excluidas | Cadena nominal/OCR incierto, no palabra validada del texto |
| o05 | ineligible | Carácter perdido y segmentación incierta |
| o07 | ineligible | Fragmento terminal no anclado |
| k05 | requires-review | Interpretación no seleccionada |
| s02, s03, s04, s05 | requires-review | Carácter aislado y contexto insuficiente |

Los once mantienen identidad permanente nula, cero aceptación automática y motivos
comprobables. Proponer una forma para revisión no significa corregir OCR ni resolver
su lectura/sentido. Ninguna regla utiliza los IDs de corpus.

## 5. Métricas separadas y comparación histórica

Corpus original congelado: 100 casos, 80 difíciles, SHA-256
`8d34a714ce1f53ac67260e65686febefa61b3d81a8910a1218a59c79c6b4379d`.
Es desarrollo/regresión anotado por el agente, sin experto independiente. No contiene
gold de sentidos contextuales ni de identidades ent_seq/grupo homógrafo.

### Morfología, donde sí hay referencias

| Nivel | Referencias | TP / FP / FN | Abstenciones | Precisión / recall |
|---|---:|---:|---:|---:|
| Spans | 91 casos anotados | 146 / 6 / 6 | No se confunde los nueve sin referencia con abstenciones | 96,05 / 96,05 % |
| Lema de foco | 58 | 54 / 0 / 4 | 4 | 100 / 93,10 % |
| Lectura superficial | 58 | 54 / 0 / 4 | 4 | 100 / 93,10 % |
| POS de foco | 71 | 68 / 2 / 3 | 1 | 97,14 / 95,77 % |

Un valor equivocado no nulo suma FP+FN; token/valor ausente suma FN y abstención.
Los 100 % condicionales de lema/lectura solo cubren 54 predicciones frente a 58
referencias; no son exactitud global ni precisión de tarjetas. Wilson nominal 95 %:
lema/lectura 93,36–100 %, POS 90,17–99,21 %. La muestra pequeña y correlacionada de
desarrollo no permite certificar producto. Se mantienen offsets correctos 177/177
y segmentación exacta 87/91. Son los mismos recursos Lindera, no un motor nuevo.

### Entrada léxica y significado

- Hay 73 propuestas de entrada única en 69 casos, **bajo hipótesis morfológica**.
  Algunas pertenecen a fragmentos no confirmados. No se conocen 69 IDs correctos por gold.
- En los 52 positivos se recuperan 45 focos con span/lema/lectura compatibles, hay una
  propuesta incompatible y siete focos perdidos. Recall de compatibilidad 45/52 = 86,54 %.
- La precisión **condicional en ese subconjunto positivo** es 45/46 = 97,83 %, Wilson
  nominal 88,66–99,62 %. Excluye 48 casos sin referencia positiva y no mide precisión
  global de identificación ent_seq, interpretación o tarjeta. No acredita el objetivo 98 %.
- Siete no recuperados: `v15` (suru sin prueba suficiente), `n04` (ここ ambiguo),
  `c07` (POS no compatible), `e03` (expresión completa frente a partes),
  `k06`, `k07`, `k08` (evidencia morfológica insuficiente/antigüedad de IPADIC).
  La propuesta incompatible positiva está en `e03`: una parte no equivale al foco completo.
- No hay gold válido de IDs/grupos o sentidos contextuales: precisión/TP/FP/FN de esos
  niveles quedan **no estimables**, no cero errores. Hay 74 casos con sentidos sin
  resolver, cero con sentido contextual certificado y cero identidades H1 en el corpus.

### Proyección histórica conservando los denominadores

El comparador legado llama `verified` a la decisión binaria del filtro original.
En `legacyWholeUnitProxy`, para H2A.2 se reproyecta la propuesta de entrada sobre esas
mismas etiquetas globales; **no** representa aceptar identidad o tarjeta. Se publica
para no esconder propuestas no certificables, no para redefinir el éxito.

| Proyección sobre el foco original | H2A | H2A.1 | H2A.2, propuestas de entrada |
|---|---:|---:|---:|
| Candidatos/propuestas | 42 | 0 | 73 |
| Compatibles TP / no certificables bajo etiqueta global | 28 / 14 | 0 / 0 | 45 / 28 |
| Focos positivos perdidos | 24 | 52 | 7 |
| Precisión de esta proyección | 66,67 % | Indefinida | 61,64 % |
| Recall de compatibilidad | 53,85 % | 0 % | 86,54 % |
| Casos con propuesta | 39 % | 0 % | 69 % |
| Abstención ambiguous/unknown | 42 % | 81 % | 12 % |
| Excluidos | 19 % | 19 % | 19 % |

Los 28 de la proyección nueva incluyen una parte incompatible en un positivo y
propuestas en casos sin verificación global; **no demuestran 28 ent_seq erróneos**.
Si se usasen sin gate como tarjetas, tampoco serían aceptaciones seguras. La precisión
de esa proyección empeora: aumenta reconocimiento, no calidad automática de tarjeta.
Wilson nominal de 45/73: 50,17–71,95 %. No se oculta ese resultado tras el 97,83 % condicionado.

Matriz de la proyección nueva por caso; «propuesta» no significa foco correcto completo:

| Referencia / salida | Propuesta | Ambigua | Sin propuesta | Excluida |
|---|---:|---:|---:|---:|
| Verified (52) | 46 | 1 | 3 | 2 |
| Ambiguous (32) | 22 | 3 | 3 | 4 |
| Unknown (4) | 0 | 0 | 1 | 3 |
| Excluded (12) | 1 | 1 | 0 | 10 |

46 casos positivos con alguna propuesta no son 46 TP: uno solo aporta una parte del
foco, por eso el recuento compatible es 45. Hay 22 fixtures globalmente no verificables
con propuesta, incluyendo los problemas originales; todos siguen sin aceptación automática.
Las matrices históricas se conservan en sus informes sin sobrescribirlas.

## 6. Políticas de tarjeta A, B y C

| Política | Ventaja | Limitación/riesgo | Corpus actual |
|---|---|---|---|
| A: significado contextual único | Evita presentar otro sentido como significado del fragmento | Falta evidencia contextual y prueba permanente de identidad | 0 eligible, 68 requieren revisión, 32 ineligible |
| B: varias acepciones documentadas | Permitiría estudiar una unidad sin fingir una interpretación única | Hay que demostrar que son la misma unidad/grupo; ruido pedagógico, carga y mezcla de lenguas | 0 eligible, 68 requieren revisión, 32 ineligible |
| C: confirmación manual | Permite aprovechar propuestas y contexto sin prometer automatización | Usuario puede equivocarse; confirmar significado no sustituye por sí solo una prueba de identidad estable | 0 confirmaciones, 68 propuestas para revisión, 32 ineligible |

Los estados por caso son mutuamente excluyentes: prioridad eligible, luego alguna
propuesta requires-review y, si no existe, ineligible. Dentro de un caso puede haber
varios tokens; no se suman como tarjetas. Las tres coinciden numéricamente porque
comparten el gate de identidad y no hay interpretación certificada. C no simula al usuario.

B solo es una hipótesis pedagógica. Mostrar varias glosas documentadas, del mismo
idioma y unidad demostrada, debe etiquetarse como acepciones de diccionario, no como
traducción del pasaje. No agrupar sentidos distintos bajo un grupo H1 inventado.
La prueba técnica con una entrada realmente de sentido único puede conservar la rama
de identidad; está fuera del corpus y no se añade para mejorar cobertura o precisión.

C necesita un recibo de confirmación real que preserve actor, fecha, contexto/hash,
entrada/lectura, referencias de sentidos de esa revisión, idioma, texto confirmado,
alternativas anteriores y prueba de identidad. `ProposedHumanConfirmationReceipt`
solo diseña ese contrato: no hay recibos reales ni personas inventadas. Corrección del
usuario conservará origen `user` y no se presentará como certificación experta.

## 7. Cobertura y frecuencias futuras

Propuesta de diseño, sin página ni persistencia nueva:

1. Cada aparición mantiene documento/hash, página, bloque, línea, rango UTF-16,
   normalización y versiones. Los fragmentos perdidos/excluidos siguen en el denominador
   declarado; no se confunde cobertura de caracteres, tokens, lexemas y sentidos.
2. Separar permanent-identity, provisional-identity, ambiguous-identity, excluded y
   unresolved. Una aparición con varias interpretaciones se cuenta una sola vez como
   ambigua, con todas sus alternativas; no como varias palabras dominadas.
3. La frecuencia provisional puede agruparse localmente por revisión+ent_seq+lectura
   para inspección, etiquetada como provisional. No se une por traducción ni lectura
   sola, y no se sincroniza como identidad verificada.
4. Para comparar con Japanese 1500 se necesita una equivalencia demostrada con su
   contenido y una identidad estable, no un string/ent_seq parecido. Una propuesta
   nunca cuenta como tarjeta conocida. El helper experimental prueba esa invariante;
   no implementa un mapping del catálogo builtin.
5. Definir una granularidad explícita para expresiones y partes solapadas antes de
   contar frecuencia; no sumar ambos como la misma unidad ni cada sentido como palabra.

No hay mediciones de cobertura de mangas reales ni «20 palabras útiles por volumen».

## 8. Recursos, medición y propuestas de reducción

Se auditó readonly el índice existente; no se implementó un formato compacto nuevo.
`reports/layered-resource-audit.json` registra hash y medidas:

| Dato físico comprobado | Valor |
|---|---:|
| SQLite completo | 214.196.224 bytes |
| Suma de payloads gzip por entrada | 156.487.414 bytes |
| Entradas / filas de lookup / formas únicas | 218.945 / 499.554 / 465.958 |
| Tamaño de página / páginas libres | 4096 bytes / 0 |
| Tiempo de auditoría | 0,475 s |

No estuvo disponible `dbstat`, por lo que no se inventa un reparto exacto por tablas.
La diferencia entre payload y archivo incluye índices/estructura/ocupación; **156 MB
sin lookup no constituyen un diccionario funcional de ese tamaño**. No se atribuye toda
esa diferencia a overhead eliminable ni se descartan restricciones para ahorrar bytes.

Alternativas para un prototipo posterior:

- Manifiesto común de fuente/versión y referencias de entrada/índices por ID+offset;
  evitar repetir hashes/procedencia largos dentro de cada glosa sin perderlos al rehidratar.
- Shards por hash de clave con índice acotado y lecturas byte-range verificables;
  lookup sin cargar todas las entradas. Medir tamaño real de índices y equivalencia de consultas.
- Recursos funcionales separados: formas/lecturas/restricciones/POS para reconocimiento;
  sentidos/glosas bajo demanda, inglés y otros idiomas identificados. No suprimir
  semántica necesaria de la decisión ni asumir alineación por separar lenguas.
- Caché de bytes/entradas limitada, cancelación y carga diferida tras acción del usuario;
  formato de archivos apropiado para browser, con integridad y estrategia offline por revisión.

Son propuestas no benchmarkeadas: no hay precisión de consultas/memoria de un nuevo
formato que publicar. No se introduce `node:sqlite` ni diccionarios en Angular.

La última evaluación nueva de los 100 casos tarda 124,23 ms en Node 24.21.0, con 79
hits/169 misses, WASM 97.124.352 bytes y RSS de todo el proceso 226.639.872 bytes.
Incluye capas y construcción de resultados, no una medición aislada de memoria
adicional del validador. OS cache no vaciada; escritorio Windows, no móviles físicos.
Memoria browser y pico móvil permanecen no medidos (`null` donde corresponde).
No se repiten ni se atribuyen como nuevos los benchmarks Chromium de H2A.

## 9. V1 asistida y bloqueos antes de autorizar H2B

La alternativa recomendada es una V1 que **proponga para revisión**, mostrando original,
contexto, lectura, entrada y sentidos documentados con idioma/procedencia. El usuario
elige o rechaza y confirma significado. OCR roto debe repararse/verificarse antes;
un nombre posible o una polisemia no se convierten solos en vocabulario.

Antes de permitir crear una tarjeta hay que resolver el grupo estable de H1 y su
evidencia. Una confirmación no permite transformar ent_seq+ordinal efímero en un grupo
permanente. Si se aprobase una política curated, deberá diseñar su propia autoridad y
registro estable, preservar referencias JMdict y origen de usuario, sin atribuir una
identidad JMdict inexistente ni modificar historiales anteriores. No se implementa aquí.

Faltan autorización posterior para H2B/V1, política de identidad y revisión pedagógica,
permisos de distribución ES o paquete JP/EN conforme a sus términos, evaluación humana
independiente y pruebas físicas browser/móvil del recurso final. Los protocolos y slots
vacíos H2A.1 se conservan: cero referencias independientes nuevas, sin inventar permisos,
material autorizado ni revisor. Ejemplos del agente siguen siendo desarrollo.

No se recomienda automatización no certificada. Sí se recomienda revisar y autorizar
por separado esta ruta asistida como alternativa práctica al bloqueo indefinido.

## 10. Validaciones nuevas y alcance

- Corpus completo H2A.2 y diagnóstico de los 52 anteriores ejecutados; comparativa de
  tres hitos registrada sin sobrescribir informes antiguos ni referencias.
- Prototipo Node: **54/54 tests**, 23 nuevos de niveles/regresiones y los 31 previos.
- Parser Python: **3/3**, comprobado de nuevo sin modificar el adaptador.
- TypeScript contratos (incluidas tres comprobaciones negativas), app y spec: correcto.
- Suite completa de aplicación: **1735/1735, 173 archivos**, una ejecución nueva.
- Build GitHub Pages: correcto, cuatro warnings SCSS conocidos de Grammar. Ningún
  módulo experimental importado al bundle de producción.

Pruebas dirigidas de aplicación: **65/65 tests, tres archivos** (`custom-deck.repository`,
`japanese-deinflection.service`, `features/manga/dictionary`). `git diff --check`
correcto, con el aviso LF/CRLF preexistente del archivo i18n generado, sin errores.
Se verificó también whitespace de los textos nuevos sin seguimiento.

Los hashes del estado inicial (118 archivos) confirman que solo cambian cuatro
archivos preexistentes: DESIGN y README/package/tsconfig del experimento. El resto,
incluidos corpus, informes anteriores, protocolos independientes y producción,
conserva sus bytes. package.json/lock de la raíz permanecen sin cambios.

No se afirma que los tests de contratos tipen todo JS/Python ni que el test de informes
browser antiguos sea una ejecución nueva de Chromium.

Cambios restringidos al directorio experimental y documentación. Sin creación de
tarjetas, habilitación del gate custom, FSRS, Stats V2, cloud, SQL o datos de usuarios.
No commit ni push. No se inicia H2B.
