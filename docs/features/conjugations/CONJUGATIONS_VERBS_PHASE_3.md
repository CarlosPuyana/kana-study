# /more y verbos — fase 3

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
