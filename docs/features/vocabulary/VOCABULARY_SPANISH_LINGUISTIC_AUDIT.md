# Auditoría lingüística española del catálogo propio de Vocabulario

> **Informe histórico de la primera fase española.** La [revisión final](VOCABULARY_LINGUISTIC_FINAL_REVIEW.md) amplía el alcance autorizado a escrituras, lecturas y metadata propias de Vocabulario; conserva las 82 correcciones y añade 11. Los conteos, hashes de campos protegidos y limitaciones de esta página describen la primera fase. Para el estado vigente, los 155 IDs revisados, las 62 fichas modificadas y los 49 casos aún abiertos, consultar la revisión final y `finalReview` del inventario. No se ha hecho commit, push ni despliegue de ninguna corrección lingüística.

Fecha de revisión: 7–8 de noviembre de 2026. Correcciones locales, sin commit, push, despliegue ni SQL.

## A. Cierre previo de estadísticas

Commit local `d6215556436d6aff566072ebcaed10e733dbe347`:
`feat(vocabulary): add advanced statistics and per-direction history`.

Incluye los 29 archivos delimitados en [estadísticas avanzadas](VOCABULARY_ADVANCED_STATS.md), apartado «Inventario del diff pendiente de estadísticas» (inventario histórico, ya registrado en ese commit): servicios, componentes, traducciones de interfaz, pruebas y documentación. Se revisaron diff completo, staging explícito, integridad de los hashes y ausencia de archivos sensibles o temporales. Antes de confirmar: **2480/2480 tests, 237 archivos**. El árbol quedó limpio después de confirmar; no se hizo push. Parent: `80e385c7d03b951224f66a16c17486eceed9855d`; commits anteriores de Mazos intactos.

## Alcance y fuente de verdad

Únicamente [vocabulary-n5.generated.ts](../../../src/app/data/vocabulary-n5.generated.ts), consumido por Vocabulario. **Japanese 1500, Puyi y los demás mazos no son fuentes de esta auditoría y no se han revisado editorialmente ni modificado.** Las regresiones de Mazos comprueban su funcionamiento, no auditan su contenido.

- **662** entradas: **499** con kanji y **163** sin kanji según `kanjiCharacters`.
- **183** tienen más de un elemento en `readings`; una cadena con barra sigue siendo un solo elemento y se señala aparte.
- **0** entradas tienen varias glosas españolas; **0** tienen ejemplos. No se dispone de frases propias que resuelvan contextos dudosos.
- `meanings.es` contiene la lista de equivalencias; `quizMeaning.es`, la etiqueta principal de ejercicio. Ambas se actualizan coherentemente. No se crea un campo ni un esquema nuevo.
- Generador: [generate-vocabulary.mjs](../../../scripts/generate-vocabulary.mjs), fuente OpenJLPT fijada en `c42fd9fa3777bfc1775446f7c418d549dfd6e4cf`, y caché histórica de localizaciones `scripts/vocabulary-localizations.json`. Esta caché se indexa por glosa inglesa y no sirve para desambiguar homónimos: **no se modifica**.
- La capa editorial [vocabulary-spanish-editorial.json](../../../scripts/vocabulary-spanish-editorial.json) es la fuente de las 82 correcciones por ID. El generador la aplica al final y rechaza identidades o español de origen inesperados. No se ejecutó el generador en red para evitar regenerar campos ajenos.

SHA-256 del archivo original completo: `ffe9c1223279f1e2760423a7a6cc413024f8c6746fdc5c1304959712370e44db`.
SHA-256 canónico de **todos los campos salvo `meanings.es` y `quizMeaning.es`**, incluyendo orden: `b18057f0fed8d0c9a736b1a3091c4a3bfce8174400d39649f8db23234ef47833`, idéntico antes y después.

## Fuentes, procedencia y licencia

Fuente principal: [JMdict de EDRDG](https://www.edrdg.org/wiki/JMdict-EDICT_Dictionary_Project.html), consultado mediante la transformación estructurada [scriptin/jmdict-simplified](https://github.com/scriptin/jmdict-simplified).

- Versión de formato: **3.6.2**. Edición: **3.6.2+20261102210542**, `dictDate: 2026-11-02`, publicada el 2/11/2026. Descargada el 7/11/2026.
- [Release exacta](https://github.com/scriptin/jmdict-simplified/releases/tag/3.6.2%2B20261102210542), archivo `jmdict-all-3.6.2+20261102210542.json.tgz` (**25.117.376 bytes**); contiene 219.009 entradas.
- SHA-256 del archivo comprimido: `0f22ce9e807edf98c8711fc41006a3330abbccd506e9302d63b2b874b41b9224`, **coincide con el digest publicado por la API de GitHub**.
- SHA-256 del JSON extraído: `3c81cf090fd99f219194dac74d89c54bb73ad067d4c7fa5c83ff60bcbc81a1f4`.
- [Licencia de EDRDG](https://www.edrdg.org/edrdg/licence.html): material japonés/inglés bajo CC BY-SA 4.0, con atribución y obligación de compartir adaptaciones en esos términos. Las glosas de otras lenguas tienen titulares y condiciones separados. La disponibilidad en un archivo no se interpretó como licencia general de todas sus traducciones.
- **No se redistribuye JMdict ni un corpus de glosas españolas**. El inventario contiene las glosas propias originales, las formulaciones españolas redactadas por el agente y referencias a IDs y números de acepción, sin volcar definiciones ajenas. Las formulaciones de esta capa editorial se ofrecen bajo **CC BY-SA 4.0**, con atribución a EDRDG/JMdict y a su transformación por scriptin.
- Se utilizaron sobre todo escritura, kana, restricciones, gramática y sentidos japoneses/ingleses de JMdict. Había referencia española en 638 candidatos, pero no se presenta esa disponibilidad como una segunda validación sistemática: sus registros de sentido no se alinean automáticamente con los ingleses.
- No se recurrió a traductores automáticos para las correcciones; no se copiaron ejemplos. No se afirma contraste sistemático con RAE, Tatoeba ni un segundo diccionario.

## Método y cobertura real

1. Emparejador **solo local**: escritura + lectura en NFC, restricciones `appliesToKanji`, candidatos primarios frente a variantes, sentidos y sus restricciones de escritura/kana. Sin depender únicamente de grafía, frecuencia o del primer resultado.
2. Resultado automático: **589** entradas con un candidato primario, **51** con varios y **22** sin par primario literal. Hay candidato literal en **640/662 (96,68 %)**. Esto **no equivale a una revisión lingüística**.
3. El agente revisó individualmente las **662/662** entradas: significado propio, lectura, candidatos y sentidos, POS, uso, naturalidad, registro, ortografía y alcance didáctico. Los casos con restricciones, homónimos o campos contradictorios tuvieron inspección adicional. Se seleccionó referencia léxica primaria en **639/662 (96,53 %)**; en 23 no se da por resuelta una identidad única y coherente. Los constituyentes de cadenas compuestas y los lemas de verbos con suru tienen referencias diagnósticas separadas; no se cuentan como coincidencias literales.
4. Se conservaron variantes regionales válidas (jalar, manteca, medias, pararse, departamento), sin convertir preferencias peninsulares en errores. No se importaron indiscriminadamente todas las acepciones como respuestas alternativas.
5. **Revisión lingüística realizada por el agente, no revisión humana independiente.** No se atribuye juicio lingüístico al script ni se afirma validación humana; el inventario lo indica por tarjeta. Una futura evaluación independiente sigue siendo recomendable.
6. Confianza de identificación y de traducción son campos separados. Solo las decisiones con ambas en alta se aplicaron. Una glosa conservada puede tener metadata japonesa pendiente: «verificada sin cambios» se refiere a su equivalencia española, **no certifica toda su ficha ni todas sus variantes**.

## Resultados

Las cinco categorías siguientes son mutuamente excluyentes y suman **662**:

| Resultado | Entradas |
| --- | ---: |
| Español verificado y conservado | 538 |
| Corrección española aplicada, alta confianza | 82 |
| Mejora propuesta, sin aplicar | 19 |
| Inconsistencia estructural pendiente | 22 |
| Conflicto ambiguo pendiente | 1 |

Confianza de identificación: **639 alta / 21 media / 2 baja**. Confianza de la decisión de traducción: **620 alta / 40 media / 2 baja**. Las dos bajas son より、ほう (combina objetivos gramaticales, sin lema único) y 伯父/叔父 con lectura おじいさん (identidades incompatibles). Sus referencias diagnósticas no resuelven qué objetivo debe conservar la ficha.

Las incidencias siguientes **se solapan** entre sí y con los resultados; no deben sumarse como total de tarjetas:

| Incidencia | Entradas |
| --- | ---: |
| Función/categoría gramatical | 38 |
| Significado | 46 |
| Alcance didáctico | 16 |
| Lecturas/formas concatenadas | 17 |
| Variante de lectura ajena al lema seleccionado | 4 |
| Ortografía | 20 |
| Naturalidad | 27 |
| Matiz cultural | 3 |
| Formas/metadatos de homófonos distintos | 17 |
| Conflicto entre sentidos/campos de origen | 5 |
| Polisemia pendiente | 7 |
| Variante con restricción de grafía no respetada | 20 |
| Desacuerdo entre escritura y lectura | 5 |

## Ejemplos de correcciones

| Japonés | Antes | Después | Problema |
| --- | --- | --- | --- |
| お皿 (おさら) | lámina | plato | お皿 es vajilla; «lámina» proviene de otra acepción de plate. |
| どなた (どなた) | OMS | quién (trato respetuoso) | OMS corresponde al acrónimo inglés WHO, no al interrogativo japonés de persona. |
| ネクタイ (ネクタイ) | atar | corbata | Tie es sustantivo, no el verbo atar. |
| ノート (ノート) | computadora portátil | cuaderno | El inglés explicita exercise book: sentido de papel, no portátil informático de otra acepción. |
| 軽い (かるい) | luz | ligero | 軽い expresa poco peso, no luz; confusión inglesa light. |
| 時計 (とけい) | mirar | reloj | 時計 es objeto; mirar es verbo, confusión de watch. |
| 出す (だす) | apagar | sacar | 出す es sacar o exteriorizar; apagar corresponde a otro sentido inglés de put out, no a este verbo. |
| 吹く (ふく) | explotar | soplar | 吹く no es explotar; confusión de acepciones inglesas de blow. |
| 貼る (はる) | palo | pegar / adherir | 貼る es verbo de fijación; palo proviene del sustantivo inglés stick. |
| 半分 (はんぶん) | medio minuto | mitad | 半分 es mitad, sin unidad temporal. Medio minuto añade información ausente; el inglés de origen también es erróneo pero queda intacto. |
| 閉まる (しまる) | cerca | cerrarse | 閉まる es intransitivo de cerrar; cerca corresponde a proximidad y confunde close. |
| 頼む (たのむ) | preguntar | pedir / solicitar | 頼む es pedir algo o un favor; preguntar busca información y confunde ask. |

Además: interrogativos con tilde, diez duraciones con «días», abrir/abrirse, poner/ponerse en fila, sustantivos frente a verbos y fórmulas familiares sin el calco moral «honorable/humilde». Cada una de las 82 correcciones tiene motivación y acepción identificada en la fuente editorial y en el inventario.

## Casos que requieren una decisión posterior

Las fichas siguientes **no se han corregido estructuralmente**. No se cambian JP, lecturas, categorías, IDs, EN ni CA para hacerlas parecer resueltas.

| Nº | ID / objetivo | Español conservado | Evidencia y siguiente decisión |
| ---: | --- | --- | --- |
| 12 | `n5-16rp5xj` いい/よい (いい/よい) | bien | La escritura y la lectura contienen literalmente dos alternativas con barra. Debe revisarse la representación de いい y よい; no se fuerza una única coincidencia literal. «Bien» no es la glosa adjetiva habitual. Referencias diagnósticas: 1605820. |
| 52 | `n5-11fsr3z` キロ/キログラム (キロ/キログラム) | kilogramo | Kilogramo correcto; dos formas literales unidas con barra no constituyen un par léxico. Referencias diagnósticas: 1042620. |
| 53 | `n5-1g1750v` キロ/キロメートル (キロ/キロメートル) | kilómetro | Kilómetro correcto; alternativas literales no normalizadas. Referencias diagnósticas: 1042650. |
| 64 | `n5-dst5fr` コピーする (コピーする) | Copiar | Copiar válido; suru no es godan. Lema compuesto no emparejado literalmente. Referencias diagnósticas: 1050590. |
| 70 | `n5-o1lvv5` じゃ/じゃあ (じゃ/じゃあ) | bueno entonces… | Dos formas literales con barra; glosa contextual plausible. Referencias diagnósticas: 1005900. |
| 83 | `n5-n1huxz` せっけん (せっけん) | economía | Formas 石鹸 indican jabón 1382590; EN y ES indican economía de 節倹 1386220. No decidir por frecuencia ni cambiar solo ES. Referencias diagnósticas: 1382590; 1386220. |
| 85 | `n5-cmt7v9` そうして/そして (そうして/そして) | y | Conectores unidos por barra; y puede ser válido pero no hay par literal único. Referencias diagnósticas: 1006730; 1612860. |
| 170 | `n5-11vyy2r` ゆっくりと (ゆっくりと) | despacio | Despacio es adecuado; falta correspondencia literal de ゆっくりと frente al lema ゆっくり más partícula. Referencias diagnósticas: 1013050. |
| 172 | `n5-1tlxcjr` より、ほう (より、ほう) | Utilizado para comparación. | Combina より y ほう: una nota gramatical no es un único lema; requiere revisión del objetivo. Referencias diagnósticas: 1013190; 1516930. |
| 174 | `n5-1rc8hqv` ラジカセ / ラジオカセット (ラジカセ / ラジオカセット) | reproductor de casetes de radio | Dos nombres unidos con barra; reproductor de casetes de radio es poco natural. Revisar formas antes de aplicar. Referencias diagnósticas: 1138900; 1138960. |
| 218 | `n5-p57dwn` 何 (なん/なに) | qué | Qué es correcto; なん/なに en lectura literal mezcla variantes y necesita representación separada. Referencias diagnósticas: 1577100; 2846738. |
| 278 | `n5-1o3ndsw` 九 (きゅう / く) | nueve | Nueve correcto; lectura literal con dos variantes y barra, no lema individual. Referencias diagnósticas: 1578150. |
| 354 | `n5-h5wg12` 散歩 (さんぽする) | paseo | Escritura nominal 散歩 con lectura verbal さんぽする y etiqueta godan; no cambiar solo español sin resolver objetivo. Referencias diagnósticas: 1303620. |
| 357 | `n5-1rmwkyr` 四 (し / よん) | cuatro | Cuatro correcto; lectura con alternativas literales. Referencias diagnósticas: 1579470. |
| 379 | `n5-n27ydh` 七 (しち / なな) | Siete | Siete correcto; lectura con alternativas literales. Referencias diagnósticas: 1319210. |
| 396 | `n5-cm95rj` 十 (じゅう とお) | diez | Diez correcto; lectura concatena じゅう y とお sin estructura. Referencias diagnósticas: 1579840. |
| 457 | `n5-1kntmso` 川/河 (かわ) | río | 川/河 no es escritura literal de diccionario. El generador añadió 佳話 por homofonía; río es correcto para las dos grafías previstas. Referencias diagnósticas: 1390020. |
| 462 | `n5-10ujywz` 掃除 (そうじする) | limpio | 掃除 nominal y lectura そうじする verbal discrepan; limpio no equivale al verbo. Resolver objetivo antes de cambiar español. Referencias diagnósticas: 1399790. |
| 558 | `n5-oka1cl` 伯父/叔父 (おじいさん) | abuelo | 伯父/叔父 significa tío y se lee おじ; おじいさん, EN y ES indican abuelo. Contradicción de identidad: no cambiar solo español ni JP/ID. Referencias diagnósticas: 1607070; 1002320. |
| 597 | `n5-rhke1n` 勉強 (べんきょうする) | estudiar | Estudiar correcto para 勉強する; escritura nominal y lectura verbal difieren, y godan es incorrecto. Referencias diagnósticas: 1512670. |
| 608 | `n5-13duv93` 毎月 (まいげつ/まいつき) | cada mes | Cada mes válido; dos lecturas concatenadas no constituyen una lectura única. Referencias diagnósticas: 1584350. |
| 612 | `n5-10kck3v` 毎年 (まいねん/まいとし) | cada año | Cada año válido; dos lecturas con barra necesitan estructura de variantes. Referencias diagnósticas: 1584360. |
| 656 | `n5-ufmxaa` 練習 (れんしゅうする) | práctica | 練習 nominal frente a lectura れんしゅうする; godan incorrecto y ES nominal frente a EN verbal. Resolver objetivo antes de aplicar. Referencias diagnósticas: 1559160. |

Especialmente:

- **せっけん**: formas 石鹸 («jabón»), glosas EN/ES de 節倹 («economía»). Hay dos identidades competidoras. No se resuelve por frecuencia N5 ni cambiando solo español.
- **伯父/叔父 / おじいさん**: las grafías corresponden a tío, lectura y glosas a abuelo. Cambiar «abuelo» por «tío» sin arreglar la lectura enseñaría otra incoherencia. Queda bloqueada esa corrección individual hasta acordar la identidad que debe conservar el ID.
- **半分**: a diferencia del caso anterior, escritura y lectura sí identifican inequívocamente mitad. Se corrige el español a «mitad» aunque EN siga diciendo half minute; se documenta el error de EN sin modificarlo.
- **22 cadenas sin par primario literal**: 17 problemas de formato y 5 desacuerdos escritura/lectura. Muchas glosas españolas son plausibles, pero la ficha japonesa no queda certificada.

### Propuestas de confianza media, sin aplicar

| Japonés | Español conservado | Propuesta | Motivo |
| --- | --- | --- | --- |
| あれ | eso | aquello | «Eso» puede ser válido en español; proponer «aquello» haría explícita la distancia de あれ, pero no se aplica sin fijar la convención deíctica del catálogo. |
| いちばん | mejor | el más / el mejor | «Mejor» es válido con contexto; «el más / el mejor» explicaría la función de superlativo, pero sin contexto no se reemplaza. |
| お弁当 | almuerzo en caja | bento (comida preparada en una caja) | «Almuerzo en caja» comunica el contenido. Una paráfrasis cultural más natural depende del registro regional; no se impone una variante. |
| かばん | bolsa | bolso / maletín | «Bolsa» puede ser válida regionalmente, pero suele convenir bolso/maletín para かばん frente a 袋. Falta contexto para una sustitución inequívoca. La etiqueta irregular-verb proviene del homófono 下番 y queda pendiente. |
| こちら | esta persona o manera | esta persona / por aquí | Manera parece calco de way direccional; varios usos deícticos sin contexto suficiente. |
| こっち | esta persona o manera | por aquí (informal) | No trasladar todos los usos de こちら a こっち: el sentido personal tiene restricciones de forma. |
| ストーブ | calentador | estufa (para calentar una habitación) | Calentador es válido regionalmente; no imponer otra denominación sin contexto. |
| たて | longitud | vertical / altura | Longitud es sentido válido; precisar eje requiere contexto. |
| では | con eso... | entonces / pues bien | Con eso resulta opaco aislado, pero la función discursiva requiere contexto. |
| はく | tener puesto | llevar (ropa de cintura para abajo) | Tener puesto es válido; precisar el ámbito de la prenda es mejora contextual, no sustitución obligatoria. Las formas guardadas incluyen 掃く (barrer), incompatibles con esa acepción: queda pendiente la metadata. |
| ポスト | correo | buzón | Correo no es buzón, pero post también designa puesto y publicación. Falta contexto curricular para sustituir inequívocamente. |
| まずい | desagradable | de mal sabor / problemático | Desagradable es posible pero muy genérico; falta contexto para escoger entre sabor y situación. |
| レコード | registro | disco (musical) | Registro es válido en informática; sin contexto no se fuerza la acepción musical por frecuencia. |
| 喫茶店 | salón de café | cafetería | Salón de café es comprensible; la forma habitual y el matiz kissaten dependen del contexto regional. |
| 差す | estirar las manos | extender el brazo (en danza) | La glosa original generaliza una acepción de danza; paraguas es otra acepción válida. Pendiente decidir sentido didáctico. |
| 食堂 | refectorio | comedor | Refectorio es válido en instituciones pero restringido; no es error inequívoco sin contexto de lugar. |
| 分かる | entenderse | entender / comprender | Entenderse puede expresar ser comprendido; el infinitivo sin se sería mejor para el uso habitual pero requiere fijar la perspectiva didáctica. |
| 磨く | cepillarse los dientes | pulir / cepillar (los dientes) | Cepillarse los dientes es contexto válido, pero restringe el verbo general de pulir. No ampliar automáticamente la glosa. |
| 旅行 | viajar | viaje | El lema sin suru es nominal, aunque admite uso verbal con suru. Revisar convención de glosado antes de cambiar viajar. |

### Variantes y restricciones

La comparación adicional produjo **36 fichas con excepciones de metadata** respecto al lema seleccionado: formas de otro homófono, lecturas no presentes en ese lema o restricciones de grafía ignoradas. No toda discrepancia de versión prueba que una lectura sea imposible; se conserva el diagnóstico preciso en `metadataEvidence` del inventario.

Ejemplos revisados: この incorpora 九/９/玖; はし con significado palillos incorpora 橋; はく con significado ropa incorpora 掃く; つける con encender incorpora 就ける/即ける; できる recoge categoría godan de 出切る; よく y また arrastran categorías nominales de 欲 y 股. とり肉 incluye lecturas restringidas a otras grafías; 眼鏡 incluye la variante kana メガネ, que el diccionario restringe a escritura en kana. Esto último es **restricción ortográfica**, no prueba de una pronunciación errónea.

El generador histórico usa una búsqueda con fallback por lectura y combina categorías/variantes; explica varias contaminaciones de homófonos. Se documenta, pero **no se rediseña en una auditoría limitada al español**. También se detectaron etiquetas ajenas en かばん, この, たぶん, できる, どう, どの, また y よく. Corregirlas requiere un encargo separado que preserve IDs y pruebe sus efectos sobre filtros y ejercicios japoneses.

## Ejercicios, equivalencias e impacto

Consumidores propios inspeccionados: `vocabulary-options.ts`, `vocabulary-round-builder.ts`, `vocabulary-selection.ts`, `vocabulary-session.service.ts`, `vocabulary-writing.ts`, `vocabulary-listening-session.ts`, `vocabulary-session-rush.ts` y las pantallas Aprender/Todos/Escritura/Listening/RUSH. Modelo: `src/app/core/models/vocabulary.model.ts`.

- Aprender, lecciones 10/15 y cuatro direcciones conservan selección, cola, consolidación, snapshot FSRS y persistencia. Solo cambian las etiquetas españolas de esas 82 fichas.
- Opciones compara **IDs** de objetivo; normaliza las etiquetas para evitar distractores duplicados. No hay un validador general de español libre al que se hayan añadido 82 sinónimos nuevos.
- Escritura y autoevaluación usan el objetivo japonés. Listening mantiene audio, objetivo y opciones. RUSH conserva revelar → siguiente y no toca FSRS.
- Las barras dentro de una glosa son texto de presentación, **no generan nuevas respuestas aceptadas**. Todas las listas `meanings.es` siguen teniendo una única entrada; no se importaron acepciones de JMdict como alternativas automáticas.
- Las lecturas y formas japonesas preexistentes potencialmente equivocadas siguen disponibles donde ya se consumían; son riesgos abiertos, no correcciones españolas completadas.
- Búsqueda, listados, historial y estadísticas mostrarán la nueva glosa del catálogo para los mismos IDs. No se reescribe ni se migra ningún evento histórico ni snapshot del usuario.
- Consumidores compartidos de Manga consultan equivalencias para integración léxica y distractores. Se ejecutan sus tests de regresión; no se editan sus implementaciones ni contenido independiente de Mazos/Gramática/Kanji.

## Reproducción, sin diccionario en el frontend

Desde la raíz del repositorio:

```powershell
# Verifica la capa ya aplicada. No red, ni modificación de archivos:
node scripts/vocabulary-spanish-editorial.mjs
node --test scripts/vocabulary-spanish-editorial.test.mjs
# Aplica únicamente esas decisiones revisadas al artefacto existente, con guardas:
node scripts/vocabulary-spanish-editorial.mjs --write
# Emparejamiento de referencia opcional; el archivo completo se guarda en caché ignorada:
python scripts/audit-vocabulary-spanish.py --dictionary .cache/vocabulary-spanish-audit/jmdict-all-3.6.2.json --out .cache/vocabulary-spanish-audit/matches-current.json
```

La descarga debe ser exactamente la release y el SHA indicados arriba; el emparejador también rechaza un JSON distinto. Su salida privada contiene glosas de referencia y `NOT_REVIEWED`: **no publicarla como inventario auditado ni distribuirla como diccionario**. La revisión individual versionada es el [inventario de 662 tarjetas](VOCABULARY_SPANISH_LINGUISTIC_INVENTORY.json). No se reconstruyen decisiones lingüísticas ejecutando el matcher.

No se añade ninguna dependencia npm, solicitud de red en estudio, diccionario en `src/assets`/`public`, servicio ni peso de diccionario al bundle inicial.

## Archivos de esta parte B

- `src/app/data/vocabulary-n5.generated.ts`: solo `meanings.es` y `quizMeaning.es`, 82 entradas.
- `src/app/data/vocabulary-spanish.spec.ts`: regresiones lingüísticas, contrastes gramaticales y casos pendientes explícitos.
- `manual-tests/vocabulary-short-lessons/spanish-meanings.spec.ts`: lección real, glosas revisadas en el detalle, temas/ancho y conservación del progreso.
- `scripts/generate-vocabulary.mjs`: integración de la capa editorial al final de la generación.
- `scripts/vocabulary-spanish-editorial.json`: 82 decisiones españolas originales revisadas, por ID y acepción.
- `scripts/vocabulary-spanish-editorial.mjs`: aplicación offline protegida e idempotente, verificación de scope.
- `scripts/vocabulary-spanish-editorial.test.mjs`: integridad de 662 decisiones, 82 cambios, protección de campos y rechazo de drift.
- `scripts/audit-vocabulary-spanish.py`: matcher offline reproducible contra la edición verificada.
- Este informe, su inventario JSON y el enlace en `docs/INDEX.md`.

## Validación final

| Comprobación final | Resultado |
| --- | --- |
| Capa editorial offline (`node --test scripts/vocabulary-spanish-editorial.test.mjs`) | **4/4**; incluye integridad de 662 decisiones y de todos los campos protegidos |
| Dirigidos (`npm test -- --include '**/vocabulary*.spec.ts' --include '**/manga-review-generator.spec.ts' --include '**/manga-study-integration.service.spec.ts'`) | **263/263**, 27 archivos |
| Suite Angular (`npm test`) | **2484/2484**, 238 archivos |
| TypeScript app y spec (`npx tsc -p tsconfig.app.json --noEmit` y `npx tsc -p tsconfig.spec.json --noEmit`) | Ambos correctos, salida 0 |
| Build normal (`npm run build -- --base-href /kana-study/ --stats-json`) | Correcto; inicial **747.061 bytes**, igual al baseline |
| Build candidato (`npm run build:manga-candidate`) | Correcto; inicial **747.947 bytes**, igual al baseline y estrictamente menor que 750.000 |
| Playwright lecciones (`playwright.vocabulary-short-lessons.config.ts`) | **18/18**: 15 regresiones ES/EN/CA y 3 nuevas comprobaciones de español en escritorio, móvil claro y 320 px oscuro |
| Playwright estadísticas (`playwright.vocabulary-stats.config.ts`) | **18/18** |
| Playwright Vocabulario FSRS/RUSH (`playwright.vocabulary-fsrs-rush.config.ts`) | **15/15** |
| Playwright RUSH general (`.cache/vocabulary-fsrs-rush/rush-edge.config.ts`) | **33/33**, cuatro direcciones de Vocabulario y regresiones Kana/Kanji |
| Playwright Mazos (`playwright.deck-learning.config.ts`) | **33/33**, con programación individual, Undo, historial, colas y Puyi |
| Regresión Manga (`node --import ./.cache/deck-daily-queue/edge-audit-loader.mjs scripts/audit-manga-candidate.mjs`) | **3/3** perfiles; importación/diccionario/FSRS/Undo/backup/reinicio/aislamiento y login/logout de SDK controlado, no Supabase Auth real |
| FSRS (`node scripts/audit-srs.mjs`) | **67 transiciones** correctas, equivalencia, registros, preview, serialización, UTC y DST Madrid |
| i18n (`npm run audit:i18n`) | Correcto (auditoría existente de Gramática ES/EN/CA); ningún archivo de traducciones UI modificado en B |
| Multimedia/bundles (`node scripts/audit-kaishi-media.mjs`) | Correcto; sin medios ni diccionario en el grafo inicial; sin cambios en recursos o gates protegidos |
| Documentación (`node scripts/audit-repo-docs.mjs --links-only`) | **93 Markdown, 310 enlaces locales, 0 rotos**, sin documentos huérfanos |
| Emparejador reproducido con el JSON de SHA verificado | Mismos **589 / 51 / 22** resultados, sin convertir su salida en revisión |
| `git diff --check` y scope protegido | Correctos; sin diferencias en FSRS, modelos, pantallas, sincronización, SQL, gates, datos de Mazos o EN/CA |

**117/117 Playwright** en los cinco configs anteriores; Manga se registra separadamente. Todas las suites de navegador utilizan Edge/Chromium, perfiles de pruebas y datos sintéticos bajo `/kana-study/`. No se usan cuentas privadas ni datos reales. La nueva prueba fuerza español también en los proyectos cuyos nombres heredados contienen en/ca; las suites existentes sí prueban esos idiomas.

Revisadas visualmente las capturas `.cache/vocabulary-spanish-audit/reveal-narrow-ca-dark.png` y `reveal-mobile-en-light.png`: la glosa larga de 着る se adapta, los tres botones siguen visibles y no hay desbordamiento horizontal. También hay capturas de detalles y de las suites existentes en sus carpetas habituales.

Tamaño total del artefacto, incluidos recursos estáticos preexistentes: **150.313.922 bytes normal / 150.313.644 candidato**. El inventario documental no forma parte de los assets ni del JavaScript de la aplicación. No se ha incorporado la descarga de JMdict a ningún artefacto.

Los dos builds muestran **cinco warnings SCSS preexistentes**: cuatro de Gramática y el de `vocabulary-play.page.scss` (8,28 kB). No se han modificado estilos.

La primera ejecución del nuevo caso E2E falló en los tres tamaños porque suponía que actualizar solo `?entry=` reinicializaría el detalle: el componente actual lo lee al crearse. Se cambió la prueba para abrir las cuatro fichas mediante sus botones reales, manteniendo las aserciones de glosa, no desbordamiento y progreso exacto. Resultado final completo: **18/18**. No se modificó producción para esta limitación preexistente de navegación solo por querystring, que queda fuera del alcance editorial. El intento inicial dentro del sandbox se interrumpió antes de ejecutar casos porque el servidor loopback no respondía; los resultados contados corresponden a las ejecuciones autorizadas fuera del sandbox.

Los logs y capturas de esta ejecución están en `.cache/vocabulary-spanish-audit/` y en las carpetas ignoradas de cada suite de navegador; no se añaden a Git.

## Limitaciones y estado de entrega

La revisión lingüística del agente cubre las 662 entradas; **no existe validación humana independiente**. Hay 42 decisiones pendientes (19 propuestas, 22 estructurales y 1 ambigua), además de incidencias de metadata que pueden solaparse con glosas correctas o corregidas. No se declara el catálogo libre de errores en todos sus campos.

Firefox y WebKit no tienen ejecutables instalados y no se cuentan como pruebas superadas. No se han validado Safari, dispositivos físicos ni Supabase Auth/RLS remoto en esta auditoría. No se han tocado FSRS, gates, datos de Mazos, SQL, cuentas o datos reales. Correcciones editoriales sin commit; estadísticas en el commit local indicado; **sin push ni despliegue**.
