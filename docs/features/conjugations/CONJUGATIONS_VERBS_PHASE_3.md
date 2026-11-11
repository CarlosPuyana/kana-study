# /more y verbos — fase 3

## C4 — imperativo, prohibitivo y cópulas (11/11/2026)

Se completan las cuatro categorías pendientes. Las categorías originales están
implementadas; el catálogo visible mantiene 23 tarjetas tras la reorganización C3.1.
- Imperativo: 47 verbos. Godan en え, ichidan ろ／よ, する y compuestos しろ／せよ,
  来る→来い（こい）. Las variantes escritas/solemnes no se presentan como cortesía.
- Prohibitivo: 47 verbos. Respuestas literales en forma de diccionario + な,
  incluido 来るな（くるな）, distintas de las negativas en ない y de なさい.
- Ambas omiten ある existencial, できる de capacidad y 分かる «entender», por
  inadecuación para este ejercicio de órdenes directas sin contexto adicional.
  No se afirma imposibilidad de otros usos literarios/contextuales.
- Cópula simple y cortés: 13 predicados cada una (学生, 先生, 友達 y los diez な
  existentes), cuatro transformaciones y 52 preguntas por registro. Datos propios
  de predicados completos; no se convierten los 50 verbos en supuestas cópulas.
  Afirmativo cambia de registro para no copiar la pregunta; negativo/pasados parten
  de la afirmativa del registro correspondiente. No hay adjetivos い ni な atributivo.

Simple admite じゃない／ではない y sus pasados. Cortés admite ではありません,
じゃありません, ではないです, じゃないです y sus pasados adecuados; se explican
las diferencias de formalidad. No se aceptan terminaciones simples como corteses
ni variantes de otras transformaciones. Feedback completo C3.1 y entrada progresiva,
incluido el ん final de ありません, sin cambiar el validador.

Preferencias v6, misma clave y escritura estricta por workspace: los registros v1–v5
no conceden permisos C4. Se conservan selecciones y permisos válidos anteriores,
los tipos de adjetivo y la opción de conversión de v5. Las cuatro formas exigen
acción manual, también por URL/mezcla; bloquear deselecciona sin borrar contadores.
Los buckets históricos de adjetivos no se alteran. Respuestas verbales anteriores
comparadas exactamente con el estado previo, y hash del catálogo de adjetivos intacto.

Fuentes: [NINJAL, formas](https://www2.ninjal.ac.jp/bunkeibank/about.html),
[Japan Foundation, órdenes y prohibiciones](https://www.jpf.go.jp/j/project/japanese/teach/tsushin/grammar/201603.html),
[TUFS, predicados nominales](https://www.coelang.tufs.ac.jp/mt/ja/gmod/contents/explanation/041.html)
y [TUFS, variantes de cortesía](https://cblle.tufs.ac.jp/assets/files/publications/handbooks_04/index.pdf).

Validación: 466 regresiones dirigidas + 98 tests C4 y 2 tests nuevos de interfaz,
tipos spec, i18n y build correctos. Playwright 15/15 en ES/EN/CA, 320/390/1280 px,
claro/oscuro: individual, mezcla, bloqueo, recarga, workspaces, feedback, estadísticas
(y capturas revisadas). Suite global única: 3451/3451, 276 archivos. Inicial:
749883 bytes, 117 de margen; todo Conjugaciones y el nuevo catálogo de cópulas
fuera del grafo inicial. Siete avisos SCSS previos, ninguno nuevo. Sin validar
Safari/IME físico en este entorno.

## C3.1 — adjetivos por forma, feedback e input (11/11/2026)

Cinco categorías de adjetivos: negativo, pasado, pasado negativo, て y adverbial.
Cada tarjeta permite い / な / ambos (15/10/25 palabras), también en mezcla.
Se reutilizan exactamente las 125 respuestas existentes; los dos catálogos,
incluido el verbal C1–C3, conservan sus hashes previos a C3.1. Catálogo visible:
23 categorías, de las que cuatro siguen planificadas.

Preferencias v5 en la misma clave por workspace. Las selecciones antiguas de
adjective-i/adjective-na se retiran con un aviso, sin activar cinco formas de
manera implícita; sus rutas quedan inactivas. Los permisos y selecciones verbales
válidos se mantienen. Las cinco formas existentes están disponibles, sin candado
nuevo. Tipos por tarjeta y conversión automática se guardan con escritura estricta,
sin publicar cambios fallidos. La ronda conserva una copia de los tipos elegidos.

Los agregados históricos i/na permanecen en los mismos buckets v1, visibles como
legado; no se reparten ni se reinician. Las prácticas individuales nuevas registran
por transformación, compartiendo tipos; las mezclas mantienen su agregado mixed.
No se reconstruyen estadísticas históricas por forma.

Feedback correcto/incorrecto/desconocido: escritura, lectura, romaji, glosa base,
función/significado orientativo, transformación y regla. Marcos gramaticales
estáticos ES/EN/CA, con tratamiento propio de 好き/嫌い y nota de いい→よ;
sin traducción automática de oraciones ni equivalencia universal. Se distinguen
pasado/negación, enlace て y función adverbial. Referencia de contraste:
[TUFS, adjetivos](https://www.coelang.tufs.ac.jp/mt/ja/gmod/courses/c01/lesson10/step1/explanation/035.html).

Conversor local y diferido, activo por defecto, con opción para desactivarlo por
workspace. Conserva fragmentos incompletos, selección/cursor, kana y kanji;
respeta composición IME y borrado/undo nativo. Los alias romaji explícitos como
dewa y los compuestos con espacio conservan su correspondencia con kana. El
validador no cambia: no se admiten nuevas respuestas ni formas coloquiales.

Validación dirigida final: 466/466; tipos spec y claves ES/EN/CA correctos.
Playwright 24/24, 320/390/1280 px, ES/EN/CA, claro/oscuro: cinco formas,
feedback, legado, mezcla, recarga, A→B→A, IME simulado, edición y C1–C3.
Capturas de feedback revisadas. Sin prueba de IME físico/Safari en este entorno.
Suite global única: 3351/3351 en 275 archivos. Tras corregir la etiqueta antigua
de «20 formas», 7/7 tests afectados e i18n correctos y build definitivo correcto.
Inicial: 749883 bytes (117 de margen); todo Conjugaciones, incluido el conversor,
fuera del grafo inicial. Siete avisos SCSS previos de otros módulos, ninguno nuevo.

## C3 — potencial, pasiva y causativas (11/11/2026)

Se añaden 188 conjuntos de respuestas literales, sin conjugación en ejecución:
- Potencial: 47. Se excluyen ある existencial, できる de capacidad y 分かる
  «entender», que no reciben aquí otra potencial regular. 居る admite いられる
  para poder estar/permanecer; no se confunde con 要る. Sin variantes sin ら.
- Pasiva: 45. Se omiten esos tres verbos y, por criterio pedagógico para tarjetas
  sin oración, いる existencial y なる «convertirse». No se niegan usos posibles
  con un contexto especial; no se presentan formas honoríficas como pasivas.
  Sí se incluyen pasivas de afectación como 死なれる o 帰られる.
- Causativa: 48. Se omiten ある y できる en sus sentidos del catálogo; se incluyen
  いさせる, 分からせる y ならせる. No se añaden sinónimos léxicos como respuestas.
- Causativa-pasiva: los mismos 48. Se acepta la forma larga y, para godan que no
  terminan en す, la corta: 書かせられる／書かされる. 話さされる, 出さされる,
  探さされる y contracciones de ichidan/する/来る se rechazan.

Lecturas de 来る con こ en las cuatro formas; する → できる／される／させる／
させられる y sus compuestos. Se conservan grafías y alias romaji del catálogo.
Las explicaciones ES/EN/CA separan potencial y pasiva aun cuando coinciden,
explican afectación, obligación/permiso y matices contextuales de la causativa-pasiva.

Preferencias v4, misma clave y almacenamiento por workspace. Los registros v1–v3
no conceden permisos C3, aunque contengan IDs antes planificados; los permisos y
selecciones válidos de C1/C2 se conservan. Desbloquear sigue siendo manual;
bloquear deselecciona y protege rutas/sesiones sin borrar estadísticas. Imperativo,
prohibitivo y cópulas だ/です permanecen planificados, sin ejercicios ni desbloqueo.

Fuentes: [Irodori L16, p. 30](https://www.irodori.jpf.go.jp/assets/data/pre-intermediate/pdf/ZZ_L16.pdf)
(causativa-pasiva y excepción de す),
[NINJAL, tablas de formas y lecturas](https://www2.ninjal.ac.jp/bunkeibank/about.html),
[Japan Foundation, potencial y exclusiones](https://www.kyozai.jpf.go.jp/kyozai/material/BTS00063/ja/render.do)
y [pasiva de afectación](https://www.jpf.go.jp/j/project/japanese/teach/tsushin/grammar/201407.html).
Las exclusiones adicionales de pasiva son una decisión editorial conservadora,
no una afirmación de imposibilidad gramatical universal.

Validación dirigida: 330 tests de Conjugaciones (71 nuevos), más comprobación
ES/EN/CA y tipos spec. Playwright 15/15: cuatro formas y mezcla, desbloqueo,
recarga, respuesta, bloqueo, conservación de estadísticas y rutas bloqueadas;
ES/EN/CA, 1280/390/320 px y claro/oscuro. Respuestas anteriores de los 50 verbos
comparadas exactamente con el estado previo a C3, sin cambios. Suite global única:
3215/3215 en 273 archivos. Build correcto; inicial 749636 bytes (364 de margen),
Conjugaciones fuera del grafo inicial. Persisten los siete avisos SCSS previos
de otros módulos; ninguno nuevo.

## C2 — condicionales y volitiva (11/11/2026)

Se añaden respuestas literales para 〜たら (50 verbos), 〜ば (50) y volitiva
(48), integradas en práctica individual, mezcla y estadísticas existentes.
Se contrastan godan, ichidan, する/compuestos y las lecturas de 来る:
したら/すれば/しよう, 来たら（きたら）/来れば（くれば）/来よう（こよう）;
行く conserva 行ったら. Se mantienen las grafías kana y alias romaji explícitos.
No se aceptan formas corteses como sustituto de la volitiva simple.

Se excluyen únicamente de volitiva el ある existencial y できる de capacidad,
por no ser adecuados para este ejercicio de intención/propuesta; no se niegan
otros usos contextuales de sus formas. Las explicaciones ES/EN/CA distinguen
condición particular/secuencia con たら y condición general o hipotética con ば,
sin equivalencia universal. La volitiva depende del contexto.

Las tres categorías empiezan bloqueadas. Preferencias v3 en la misma clave:
los registros C1 v2 conservan permisos/selecciones anteriores, sin conceder
permisos C2; la siguiente acción manual guarda v3. Bloquear deselecciona e impide
acceso directo sin borrar estadísticas. Las ocho categorías restantes siguen
planificadas. No cambian el corrector ni las reglas de las categorías anteriores.

Fuentes: [TUFS, condiciones](https://www.coelang.tufs.ac.jp/mt/ja/gmod/contents/explanation/083.html),
[NINJAL, formas y lecturas](https://www2.ninjal.ac.jp/bunkeibank/about.html)
y las fuentes de voluntad de C1 citadas debajo.

Validación C2: 198 regresiones dirigidas y 61 tests nuevos correctos; Playwright
12/12 en ES/EN/CA, 1280/390/320 px, claro/oscuro, desbloqueo, recarga, práctica,
mezcla, bloqueo y conservación de estadísticas. Suite global única: 3144/3144
en 272 archivos; tipos spec y build correctos. Bundle inicial 749636 bytes,
364 de margen; catálogo, preferencias y traducciones continúan diferidos.
Persisten siete avisos SCSS previos de otros módulos; ninguno nuevo en Conjugaciones.

## C1 — desbloqueo manual y tres formas (11/11/2026)

Se separan implementación (`availability`), permiso manual y selección. Las seis
categorías anteriores empiezan desbloqueadas; continuo, deseo y cortesía empiezan
bloqueadas. Las once restantes siguen planificadas y no pueden habilitarse. No hay
reglas de XP o progreso. Preferencias v2 en la misma clave local v1, con ambos
conjuntos por workspace; los registros v1 conservan su selección practicable y no
conceden permisos nuevos. Bloquear deselecciona sin borrar contadores. Los fallos
no publican el estado como guardado y una lectura corrupta/denegada falla cerrada.
El motor comprueba permisos en inicio (incluidas URLs y mezcla) y al responder.

Respuestas literales nuevas, sin conjugación en ejecución:
- 〜ている: 48 verbos. Usa las formas て ya contrastadas, incluido 行っている.
  Se omiten ある e いる existenciales para no enseñar una construcción aislada
  poco adecuada. Se explican progresión y estado resultante, sin equivalencia
  universal con «estar haciendo».
- 〜たい: 48 verbos. Se omiten できる en su sentido de capacidad y ある
  existencial. No se acepta できたい; ありたい requeriría otro contexto/uso.
- 〜ます afirmativo no pasado: 50 verbos. No se implementa toda la familia cortés.

Bases godan de fila い (incluidos 言う→言い, 話し, 待ち), ichidan sin る,
する/compuestos→し y 来る→き/来. Se conservan los alias romaji explícitos
con espacio de los compuestos; las grafías normalmente en kana siguen sin kanji
inventados. Para 〜ている se solicita la forma completa, no la contracción 〜てる.
Los recuentos son de ejercicios válidos; el catálogo base mantiene sus 50 IDs.

Fuentes japonesas contrastadas:
- [TUFS, Vたい](https://www.coelang.tufs.ac.jp/mt/ja/gmod/contents/explanation/067.html).
- [NINJAL, formas Vます](https://www2.ninjal.ac.jp/bunkeibank/about.html).
- [NINJAL, 来る](https://www2.ninjal.ac.jp/verbhandbook/headwords/%E6%9D%A5%E3%82%8B.html).
- [Japan Foundation, usos de ている](https://www.jpf.go.jp/j/project/japanese/teach/tsushin/grammar/201312.html).
- [Japan Foundation, voluntad y tipos de verbo](https://www.kyozai.jpf.go.jp/kyozai/material/BTS00003/ja/render.do).

Validación C1: 198/198 dirigidos (57 nuevos), 3083/3083 globales en una única
ejecución, TypeScript app/spec y build correctos. Playwright 12/12 en ES/EN/CA,
1280/390/320 px, claro/oscuro; también se verifica el contador/racha de la
categoría tras bloquear. Bundle inicial 749636 bytes (364 de margen), datos,
preferencias y traducciones de Conjugaciones diferidos; sin advertencias nuevas.

La fase histórica siguiente describe el alcance anterior a C1.

## Plan y alcance

1. Reordenar /more: Kana, Vocabulario, Mazos, Conjugaciones, Kanji, Manga, Gramática, Banderas. Mostrar el módulo de origen y conservar su enlace de retorno. Mantener las restricciones de acceso existentes de Gramática.
2. Colocar Mis débiles y Estadísticas debajo de los módulos, con diseño responsive y colores semánticos.
3. Incorporar un único catálogo editorial de 50 verbos: 30 godan (las nueve terminaciones), 15 ichidan y 5 irregulares (する, 来る y tres compuestos con する). Selección por utilidad cotidiana, sin filtrar ni clasificar por JLPT; no pretende ser un ranking estadístico de frecuencia.
4. Activar negativo, pasado, negativo pasado y て: 200 conjuntos de respuestas explícitas. Mantener 14 categorías pendientes y las dos familias de adjetivos disponibles.
5. Ampliar preguntas, navegación, reglas y contadores conservando normalización exacta, guardado local por workspace y datos v1 anteriores.
6. Verificar tipos, pruebas, idiomas, compilación normal/candidata y navegador en escritorio/móvil y temas claro/oscuro. Sin commit, push, despliegue ni SQL.

## Decisiones

El catálogo `src/app/data/conjugation-verbs.ts` es común a las cuatro formas y será la base de futuras ampliaciones. Las formas bloqueadas no tienen respuestas inventadas ni pueden abrirse por URL. El entrenador selecciona registros literales; no conjuga ni translitera en ejecución. Romaji Hepburn con vocales largas escritas como en kana (benkyou, ryouri); se aceptan también alias explícitos con un espacio antes de las formas de する en compuestos. Las palabras normalmente escritas en kana no reciben kanji artificiales.

Hay 50 preguntas en cada ronda verbal, 75/50 en adjetivos y 325 en una mezcla con las seis categorías disponibles. Cada categoría individual mantiene su récord; las mezclas conservan el contador mixto existente. Los nuevos contadores se inicializan a cero al leer estadísticas v1 antiguas sin perder los de adjetivos. Cambiar de workspace cancela la ronda.

La referencia gramatical de contraste es la tabla de verbos de Japan Foundation MARUGOTO: https://a2.marugotoweb.jp/en/grammar/reference/002.html y las respuestas de Irodori: https://www.irodori.jpf.go.jp/assets/data/resources/Grammar_Worksheets_Answer.pdf. La selección de palabras y sus traducciones es editorial. No sustituye una revisión lingüística humana independiente.

## Validación

- Pruebas Angular/Vitest: **2.626/2.626**, 248 archivos.
- TypeScript app/spec: correcto.
- Auditoría de traducciones Conjugaciones: **1/1**, claves ES/EN/CA sincronizadas.
- Compilación normal y candidata con `/kana-study/`: correctas. Tamaño inicial **748.669 / 749.555 bytes**, ambos por debajo de 750.000. Catálogo y entrenador fuera de la carga inicial.
- Auditoría gramatical, traducciones y publicación estática Kaishi del prebuild: correctas.
- Navegador: **60 escenarios verificados** (58 en la pasada completa y los 2 restantes correctos al repetirlos tras añadir una espera explícita de carga al test). Escritorio 1920/1536/1366/1280, móvil 390/375/320, temas claro/oscuro, idiomas ES/EN/CA y zoom 125 %. Sin errores JS ni desbordamiento horizontal en los escenarios comprobados. Candidato optimizado bajo `/kana-study/`: orden de módulos, seis categorías disponibles, catorce bloqueadas, cuatro prácticas verbales y geometría móvil correctos.
- `git diff --check`: correcto.
- Las compilaciones conservan los avisos de tamaño de estilos de Gramática, Learn y Vocabulary, archivos ajenos a estos cambios.
- Safari, dispositivos físicos y revisión lingüística humana independiente: sin validar. El fallo histórico de logout de Gramática entre pestañas queda fuera de este alcance y no se ha reevaluado.

Se ha usado un servidor nuevo en el puerto 4414 para evitar reutilizar la versión anterior de un servidor ya abierto. Las pruebas no envían datos a Supabase.


## Archivos y comportamiento

- `src/app/features/more/more.page.{ts,html,scss}`: orden, módulo de origen visible, rejilla 4/2/1 y herramientas debajo.
- `src/app/data/conjugation-verbs.ts`: 50 objetos y 200 conjuntos de respuestas literales, reutilizables en próximas fases.
- `src/app/data/conjugations.ts`: disponibilidad y recuentos de las cuatro categorías.
- Modelo de práctica, constructor de preguntas, servicio de práctica y estadísticas: palabras de ambos tipos, mezclas y nuevos contadores compatibles con v1.
- Catálogo y entrenador: navegación, récords, grupo verbal, reglas y registro apropiado para て.
- ES/EN/CA y dominio generado: significados y ayuda localizada.
- Pruebas unitarias y Playwright: lecturas, excepciones, validador, rondas, guardado, selección, navegación, teclado, workspace, acceso a Gramática y diseño responsive.
- `playwright.conjugations-verbs.config.ts`: 60 escenarios en Edge, siete tamaños/idiomas/temas, zoom y finalización de ronda de adjetivos.

No se han modificado FSRS, módulos de estudio ajenos, SQL ni configuración de despliegue. No hay commit ni push de estos cambios.

## Catálogo revisable

Cada celda muestra escritura japonesa y romaji. Para las palabras con kanji, el objeto también incluye la respuesta completa en hiragana. Se conservan las respuestas en kana cuando no hay una grafía kanji habitual seleccionada. El código es la fuente de verdad de todos los alias aceptados.

| Verbo | Grupo | Significado | Negativo | Pasado | Negativo pasado | Forma て |
|---|---|---|---|---|---|---|
| 行く (いく) | godan | ir | 行かない · ikanai | 行った · itta | 行かなかった · ikanakatta | 行って · itte |
| 帰る (かえる) | godan | volver a casa | 帰らない · kaeranai | 帰った · kaetta | 帰らなかった · kaeranakatta | 帰って · kaette |
| ある (ある) | godan | haber, existir (cosas) | ない · nai | あった · atta | なかった · nakatta | あって · atte |
| 言う (いう) | godan | decir | 言わない · iwanai | 言った · itta | 言わなかった · iwanakatta | 言って · itte |
| 思う (おもう) | godan | pensar, opinar | 思わない · omowanai | 思った · omotta | 思わなかった · omowanakatta | 思って · omotte |
| 買う (かう) | godan | comprar | 買わない · kawanai | 買った · katta | 買わなかった · kawanakatta | 買って · katte |
| 使う (つかう) | godan | usar | 使わない · tsukawanai | 使った · tsukatta | 使わなかった · tsukawanakatta | 使って · tsukatte |
| 会う (あう) | godan | encontrarse con alguien | 会わない · awanai | 会った · atta | 会わなかった · awanakatta | 会って · atte |
| 待つ (まつ) | godan | esperar | 待たない · matanai | 待った · matta | 待たなかった · matanakatta | 待って · matte |
| 持つ (もつ) | godan | tener, llevar en la mano | 持たない · motanai | 持った · motta | 持たなかった · motanakatta | 持って · motte |
| 取る (とる) | godan | tomar, coger | 取らない · toranai | 取った · totta | 取らなかった · toranakatta | 取って · totte |
| 分かる (わかる) | godan | entender | 分からない · wakaranai | 分かった · wakatta | 分からなかった · wakaranakatta | 分かって · wakatte |
| なる (なる) | godan | convertirse, llegar a ser | ならない · naranai | なった · natta | ならなかった · naranakatta | なって · natte |
| 入る (はいる) | godan | entrar | 入らない · hairanai | 入った · haitta | 入らなかった · hairanakatta | 入って · haitte |
| 座る (すわる) | godan | sentarse | 座らない · suwaranai | 座った · suwatta | 座らなかった · suwaranakatta | 座って · suwatte |
| 飲む (のむ) | godan | beber | 飲まない · nomanai | 飲んだ · nonda | 飲まなかった · nomanakatta | 飲んで · nonde |
| 読む (よむ) | godan | leer | 読まない · yomanai | 読んだ · yonda | 読まなかった · yomanakatta | 読んで · yonde |
| 休む (やすむ) | godan | descansar | 休まない · yasumanai | 休んだ · yasunda | 休まなかった · yasumanakatta | 休んで · yasunde |
| 住む (すむ) | godan | vivir, residir | 住まない · sumanai | 住んだ · sunda | 住まなかった · sumanakatta | 住んで · sunde |
| 死ぬ (しぬ) | godan | morir | 死なない · shinanai | 死んだ · shinda | 死ななかった · shinanakatta | 死んで · shinde |
| 遊ぶ (あそぶ) | godan | jugar, pasar el rato | 遊ばない · asobanai | 遊んだ · asonda | 遊ばなかった · asobanakatta | 遊んで · asonde |
| 呼ぶ (よぶ) | godan | llamar a alguien | 呼ばない · yobanai | 呼んだ · yonda | 呼ばなかった · yobanakatta | 呼んで · yonde |
| 書く (かく) | godan | escribir | 書かない · kakanai | 書いた · kaita | 書かなかった · kakanakatta | 書いて · kaite |
| 聞く (きく) | godan | escuchar, preguntar | 聞かない · kikanai | 聞いた · kiita | 聞かなかった · kikanakatta | 聞いて · kiite |
| 働く (はたらく) | godan | trabajar | 働かない · hatarakanai | 働いた · hataraita | 働かなかった · hatarakanakatta | 働いて · hataraite |
| 歩く (あるく) | godan | caminar | 歩かない · arukanai | 歩いた · aruita | 歩かなかった · arukanakatta | 歩いて · aruite |
| 泳ぐ (およぐ) | godan | nadar | 泳がない · oyoganai | 泳いだ · oyoida | 泳がなかった · oyoganakatta | 泳いで · oyoide |
| 話す (はなす) | godan | hablar | 話さない · hanasanai | 話した · hanashita | 話さなかった · hanasanakatta | 話して · hanashite |
| 出す (だす) | godan | sacar, entregar | 出さない · dasanai | 出した · dashita | 出さなかった · dasanakatta | 出して · dashite |
| 探す (さがす) | godan | buscar | 探さない · sagasanai | 探した · sagashita | 探さなかった · sagasanakatta | 探して · sagashite |
| 食べる (たべる) | ichidan | comer | 食べない · tabenai | 食べた · tabeta | 食べなかった · tabenakatta | 食べて · tabete |
| 見る (みる) | ichidan | ver, mirar | 見ない · minai | 見た · mita | 見なかった · minakatta | 見て · mite |
| いる (いる) | ichidan | estar, existir (seres vivos) | いない · inai | いた · ita | いなかった · inakatta | いて · ite |
| 起きる (おきる) | ichidan | levantarse, despertarse | 起きない · okinai | 起きた · okita | 起きなかった · okinakatta | 起きて · okite |
| 寝る (ねる) | ichidan | dormir, acostarse | 寝ない · nenai | 寝た · neta | 寝なかった · nenakatta | 寝て · nete |
| 出る (でる) | ichidan | salir | 出ない · denai | 出た · deta | 出なかった · denakatta | 出て · dete |
| 開ける (あける) | ichidan | abrir algo | 開けない · akenai | 開けた · aketa | 開けなかった · akenakatta | 開けて · akete |
| 閉める (しめる) | ichidan | cerrar algo | 閉めない · shimenai | 閉めた · shimeta | 閉めなかった · shimenakatta | 閉めて · shimete |
| つける (つける) | ichidan | encender, poner | つけない · tsukenai | つけた · tsuketa | つけなかった · tsukenakatta | つけて · tsukete |
| 考える (かんがえる) | ichidan | pensar, reflexionar | 考えない · kangaenai | 考えた · kangaeta | 考えなかった · kangaenakatta | 考えて · kangaete |
| 忘れる (わすれる) | ichidan | olvidar | 忘れない · wasurenai | 忘れた · wasureta | 忘れなかった · wasurenakatta | 忘れて · wasurete |
| 覚える (おぼえる) | ichidan | recordar, aprender | 覚えない · oboenai | 覚えた · oboeta | 覚えなかった · oboenakatta | 覚えて · oboete |
| 教える (おしえる) | ichidan | enseñar, informar | 教えない · oshienai | 教えた · oshieta | 教えなかった · oshienakatta | 教えて · oshiete |
| 借りる (かりる) | ichidan | pedir prestado, alquilar | 借りない · karinai | 借りた · karita | 借りなかった · karinakatta | 借りて · karite |
| できる (できる) | ichidan | poder, ser capaz | できない · dekinai | できた · dekita | できなかった · dekinakatta | できて · dekite |
| する (する) | irregular | hacer | しない · shinai | した · shita | しなかった · shinakatta | して · shite |
| 来る (くる) | irregular | venir | 来ない · konai | 来た · kita | 来なかった · konakatta | 来て · kite |
| 勉強する (べんきょうする) | irregular | estudiar | 勉強しない · benkyoushinai | 勉強した · benkyoushita | 勉強しなかった · benkyoushinakatta | 勉強して · benkyoushite |
| 料理する (りょうりする) | irregular | cocinar | 料理しない · ryourishinai | 料理した · ryourishita | 料理しなかった · ryourishinakatta | 料理して · ryourishite |
| 運転する (うんてんする) | irregular | conducir | 運転しない · untenshinai | 運転した · untenshita | 運転しなかった · untenshinakatta | 運転して · untenshite |

## Integración Anti-AFK V2 (9 de noviembre de 2026)

El entrenador utiliza el reloj compartido: hasta 180 segundos activos por pregunta,
pausa automática por visibilidad y cero tiempo de feedback/espera. El marcador muestra
el total de la ronda. La duración y cobertura se guardan con el intento en los siete
buckets locales por workspace, conservando los datos históricos sin tiempo como
medición desconocida. El aprendizaje, las respuestas y las rachas no cambian.

Arquitectura, archivos, compatibilidad y validación final:
[Anti-AFK V2 — integración Conjugaciones](../study/STUDY_TIME_ANTI_AFK_V2.md#integración-posterior-conjugaciones-9-de-noviembre-de-2026).
