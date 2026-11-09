# Conjugaciones — adjetivos, fase 2

Entrega local del 9 de noviembre de 2026. Base: 6f87d8dc819cfc60e0d5bdf897d3cdfd32941cc9,
con la fase 1 ya versionada y el árbol inicialmente limpio. Sin commit, push, despliegue ni SQL.

## Acceso y alcance

Más → Conjugaciones → pulsar la tarjeta de Adjetivos い o Adjetivos な.
No hay un botón de práctica individual separado: el área completa de la tarjeta abre
la práctica mediante un control nativo accesible por teclado. La casilla queda fuera
de esa acción. Las 18 tarjetas pendientes muestran candado y Próximamente, borde
discontinuo y título atenuado; no tienen acción de apertura. Sus casillas de mezcla
siguen permitiendo una selección explícita, con el aviso de disponibilidad descrito debajo.
Las casillas y **Practicar mi mezcla** permiten combinar ambas o una sola familia.
Las otras 18 categorías conservan su estado Próximamente. No hay ejercicios verbales.
Adjetivos い y Adjetivos な son las dos primeras tarjetas de la pantalla. Este orden
visual no cambia los IDs ni el orden canónico de las selecciones persistidas.

Si la mezcla incluye categorías pendientes, se enumeran y la práctica no comienza.
**Practicar solo las disponibles** requiere una segunda acción explícita y conserva
exactamente las casillas guardadas, incluidas las pendientes. Sin disponibles no hay
botón de continuación. Los contadores reales del catálogo son 15 y 10.

## Arquitectura y datos

- Contratos de familia, transformación, respuestas, pregunta, ronda y contadores en
  src/app/core/models/conjugation-practice.model.ts.
- Fuente única de respuestas: src/app/data/conjugation-adjectives.ts. Objetos literales,
  25 IDs estables y 125 conjuntos, con arrays romaji/kana/kanji explícitos.
- Validador genérico puro: conjugation-answer-validator.ts.
- Selección y mezcla de preguntas: conjugation-questions.ts.
- Estadísticas: ConjugationStatsService; ronda efímera: ConjugationPracticeService,
  proporcionado exclusivamente por la página de práctica.
- Ruta independiente y lazy /conjugations/practice con categorías y modo validados.
  Cambios de query e historial en la misma instancia reconstruyen o rechazan la ronda.
- Copy de ejercicios y reglas dentro del dominio diferido conjugations.generated.ts.
  No se modifica TranslationService ni se añaden dependencias o providers globales.

El código publicado no contiene un conjugador, transliterador ni derivador de respuestas.
La elección de una pregunta devuelve una referencia al conjunto literal correspondiente.
Las herramientas locales usadas para serializar tablas no se importan en la aplicación.

## Catálogo editorial de 25 adjetivos

| ID / base / lectura | Familia | Significado |
| --- | --- | --- |
| takai · 高い · たかい | i | alto / caro |
| yasui · 安い · やすい | i | barato |
| ookii · 大きい · おおきい | i | grande |
| chiisai · 小さい · ちいさい | i | pequeño |
| atarashii · 新しい · あたらしい | i | nuevo |
| furui · 古い · ふるい | i | viejo / antiguo |
| atsui · 暑い · あつい | i | caluroso |
| samui · 寒い · さむい | i | frío |
| isogashii · 忙しい · いそがしい | i | ocupado |
| tanoshii · 楽しい · たのしい | i | divertido |
| muzukashii · 難しい · むずかしい | i | difícil |
| yasashii · 易しい · やさしい | i | fácil |
| omoshiroi · 面白い · おもしろい | i | interesante / divertido |
| oishii · おいしい · おいしい | i | delicioso |
| ii · いい · いい | i | bueno |
| shizuka · 静か · しずか | na | tranquilo / silencioso |
| genki · 元気 · げんき | na | sano / con energía |
| benri · 便利 · べんり | na | práctico |
| kirei · きれい · きれい | na | bonito / limpio |
| yuumei · 有名 · ゆうめい | na | famoso |
| shinsetsu · 親切 · しんせつ | na | amable |
| kantan · 簡単 · かんたん | na | sencillo / fácil |
| taisetsu · 大切 · たいせつ | na | importante / valioso |
| suki · 好き · すき | na | que gusta |
| kirai · 嫌い · きらい | na | que desagrada |

## Las 125 transformaciones y respuestas

Esta tabla refleja la fuente única de datos; no se utiliza como un segundo catálogo
runtime. Un guion en kanji significa lista vacía, no una respuesta literal admisible.

| Adjetivo | Transformación | Romaji admitido | Hiragana admitido | Kanji admitido |
| --- | --- | --- | --- | --- |
| 高い | Negativo | takakunai | たかくない | 高くない |
| 高い | Pasado | takakatta | たかかった | 高かった |
| 高い | Pasado negativo | takakunakatta | たかくなかった | 高くなかった |
| 高い | Forma て | takakute | たかくて | 高くて |
| 高い | Adverbial | takaku | たかく | 高く |
| 安い | Negativo | yasukunai | やすくない | 安くない |
| 安い | Pasado | yasukatta | やすかった | 安かった |
| 安い | Pasado negativo | yasukunakatta | やすくなかった | 安くなかった |
| 安い | Forma て | yasukute | やすくて | 安くて |
| 安い | Adverbial | yasuku | やすく | 安く |
| 大きい | Negativo | ookikunai | おおきくない | 大きくない |
| 大きい | Pasado | ookikatta | おおきかった | 大きかった |
| 大きい | Pasado negativo | ookikunakatta | おおきくなかった | 大きくなかった |
| 大きい | Forma て | ookikute | おおきくて | 大きくて |
| 大きい | Adverbial | ookiku | おおきく | 大きく |
| 小さい | Negativo | chiisakunai | ちいさくない | 小さくない |
| 小さい | Pasado | chiisakatta | ちいさかった | 小さかった |
| 小さい | Pasado negativo | chiisakunakatta | ちいさくなかった | 小さくなかった |
| 小さい | Forma て | chiisakute | ちいさくて | 小さくて |
| 小さい | Adverbial | chiisaku | ちいさく | 小さく |
| 新しい | Negativo | atarashikunai | あたらしくない | 新しくない |
| 新しい | Pasado | atarashikatta | あたらしかった | 新しかった |
| 新しい | Pasado negativo | atarashikunakatta | あたらしくなかった | 新しくなかった |
| 新しい | Forma て | atarashikute | あたらしくて | 新しくて |
| 新しい | Adverbial | atarashiku | あたらしく | 新しく |
| 古い | Negativo | furukunai | ふるくない | 古くない |
| 古い | Pasado | furukatta | ふるかった | 古かった |
| 古い | Pasado negativo | furukunakatta | ふるくなかった | 古くなかった |
| 古い | Forma て | furukute | ふるくて | 古くて |
| 古い | Adverbial | furuku | ふるく | 古く |
| 暑い | Negativo | atsukunai | あつくない | 暑くない |
| 暑い | Pasado | atsukatta | あつかった | 暑かった |
| 暑い | Pasado negativo | atsukunakatta | あつくなかった | 暑くなかった |
| 暑い | Forma て | atsukute | あつくて | 暑くて |
| 暑い | Adverbial | atsuku | あつく | 暑く |
| 寒い | Negativo | samukunai | さむくない | 寒くない |
| 寒い | Pasado | samukatta | さむかった | 寒かった |
| 寒い | Pasado negativo | samukunakatta | さむくなかった | 寒くなかった |
| 寒い | Forma て | samukute | さむくて | 寒くて |
| 寒い | Adverbial | samuku | さむく | 寒く |
| 忙しい | Negativo | isogashikunai | いそがしくない | 忙しくない |
| 忙しい | Pasado | isogashikatta | いそがしかった | 忙しかった |
| 忙しい | Pasado negativo | isogashikunakatta | いそがしくなかった | 忙しくなかった |
| 忙しい | Forma て | isogashikute | いそがしくて | 忙しくて |
| 忙しい | Adverbial | isogashiku | いそがしく | 忙しく |
| 楽しい | Negativo | tanoshikunai | たのしくない | 楽しくない |
| 楽しい | Pasado | tanoshikatta | たのしかった | 楽しかった |
| 楽しい | Pasado negativo | tanoshikunakatta | たのしくなかった | 楽しくなかった |
| 楽しい | Forma て | tanoshikute | たのしくて | 楽しくて |
| 楽しい | Adverbial | tanoshiku | たのしく | 楽しく |
| 難しい | Negativo | muzukashikunai | むずかしくない | 難しくない |
| 難しい | Pasado | muzukashikatta | むずかしかった | 難しかった |
| 難しい | Pasado negativo | muzukashikunakatta | むずかしくなかった | 難しくなかった |
| 難しい | Forma て | muzukashikute | むずかしくて | 難しくて |
| 難しい | Adverbial | muzukashiku | むずかしく | 難しく |
| 易しい | Negativo | yasashikunai | やさしくない | 易しくない |
| 易しい | Pasado | yasashikatta | やさしかった | 易しかった |
| 易しい | Pasado negativo | yasashikunakatta | やさしくなかった | 易しくなかった |
| 易しい | Forma て | yasashikute | やさしくて | 易しくて |
| 易しい | Adverbial | yasashiku | やさしく | 易しく |
| 面白い | Negativo | omoshirokunai | おもしろくない | 面白くない |
| 面白い | Pasado | omoshirokatta | おもしろかった | 面白かった |
| 面白い | Pasado negativo | omoshirokunakatta | おもしろくなかった | 面白くなかった |
| 面白い | Forma て | omoshirokute | おもしろくて | 面白くて |
| 面白い | Adverbial | omoshiroku | おもしろく | 面白く |
| おいしい | Negativo | oishikunai | おいしくない | — |
| おいしい | Pasado | oishikatta | おいしかった | — |
| おいしい | Pasado negativo | oishikunakatta | おいしくなかった | — |
| おいしい | Forma て | oishikute | おいしくて | — |
| おいしい | Adverbial | oishiku | おいしく | — |
| いい | Negativo | yokunai | よくない | — |
| いい | Pasado | yokatta | よかった | — |
| いい | Pasado negativo | yokunakatta | よくなかった | — |
| いい | Forma て | yokute | よくて | — |
| いい | Adverbial | yoku | よく | — |
| 静か | Negativo | shizukajanai / shizukadewanai | しずかじゃない / しずかではない | 静かじゃない / 静かではない |
| 静か | Pasado | shizukadatta | しずかだった | 静かだった |
| 静か | Pasado negativo | shizukajanakatta / shizukadewanakatta | しずかじゃなかった / しずかではなかった | 静かじゃなかった / 静かではなかった |
| 静か | Forma て | shizukade | しずかで | 静かで |
| 静か | Adverbial | shizukani | しずかに | 静かに |
| 元気 | Negativo | genkijanai / genkidewanai | げんきじゃない / げんきではない | 元気じゃない / 元気ではない |
| 元気 | Pasado | genkidatta | げんきだった | 元気だった |
| 元気 | Pasado negativo | genkijanakatta / genkidewanakatta | げんきじゃなかった / げんきではなかった | 元気じゃなかった / 元気ではなかった |
| 元気 | Forma て | genkide | げんきで | 元気で |
| 元気 | Adverbial | genkini | げんきに | 元気に |
| 便利 | Negativo | benrijanai / benridewanai | べんりじゃない / べんりではない | 便利じゃない / 便利ではない |
| 便利 | Pasado | benridatta | べんりだった | 便利だった |
| 便利 | Pasado negativo | benrijanakatta / benridewanakatta | べんりじゃなかった / べんりではなかった | 便利じゃなかった / 便利ではなかった |
| 便利 | Forma て | benride | べんりで | 便利で |
| 便利 | Adverbial | benrini | べんりに | 便利に |
| きれい | Negativo | kireijanai / kireidewanai | きれいじゃない / きれいではない | — |
| きれい | Pasado | kireidatta | きれいだった | — |
| きれい | Pasado negativo | kireijanakatta / kireidewanakatta | きれいじゃなかった / きれいではなかった | — |
| きれい | Forma て | kireide | きれいで | — |
| きれい | Adverbial | kireini | きれいに | — |
| 有名 | Negativo | yuumeijanai / yuumeidewanai | ゆうめいじゃない / ゆうめいではない | 有名じゃない / 有名ではない |
| 有名 | Pasado | yuumeidatta | ゆうめいだった | 有名だった |
| 有名 | Pasado negativo | yuumeijanakatta / yuumeidewanakatta | ゆうめいじゃなかった / ゆうめいではなかった | 有名じゃなかった / 有名ではなかった |
| 有名 | Forma て | yuumeide | ゆうめいで | 有名で |
| 有名 | Adverbial | yuumeini | ゆうめいに | 有名に |
| 親切 | Negativo | shinsetsujanai / shinsetsudewanai | しんせつじゃない / しんせつではない | 親切じゃない / 親切ではない |
| 親切 | Pasado | shinsetsudatta | しんせつだった | 親切だった |
| 親切 | Pasado negativo | shinsetsujanakatta / shinsetsudewanakatta | しんせつじゃなかった / しんせつではなかった | 親切じゃなかった / 親切ではなかった |
| 親切 | Forma て | shinsetsude | しんせつで | 親切で |
| 親切 | Adverbial | shinsetsuni | しんせつに | 親切に |
| 簡単 | Negativo | kantanjanai / kantandewanai | かんたんじゃない / かんたんではない | 簡単じゃない / 簡単ではない |
| 簡単 | Pasado | kantandatta | かんたんだった | 簡単だった |
| 簡単 | Pasado negativo | kantanjanakatta / kantandewanakatta | かんたんじゃなかった / かんたんではなかった | 簡単じゃなかった / 簡単ではなかった |
| 簡単 | Forma て | kantande | かんたんで | 簡単で |
| 簡単 | Adverbial | kantanni | かんたんに | 簡単に |
| 大切 | Negativo | taisetsujanai / taisetsudewanai | たいせつじゃない / たいせつではない | 大切じゃない / 大切ではない |
| 大切 | Pasado | taisetsudatta | たいせつだった | 大切だった |
| 大切 | Pasado negativo | taisetsujanakatta / taisetsudewanakatta | たいせつじゃなかった / たいせつではなかった | 大切じゃなかった / 大切ではなかった |
| 大切 | Forma て | taisetsude | たいせつで | 大切で |
| 大切 | Adverbial | taisetsuni | たいせつに | 大切に |
| 好き | Negativo | sukijanai / sukidewanai | すきじゃない / すきではない | 好きじゃない / 好きではない |
| 好き | Pasado | sukidatta | すきだった | 好きだった |
| 好き | Pasado negativo | sukijanakatta / sukidewanakatta | すきじゃなかった / すきではなかった | 好きじゃなかった / 好きではなかった |
| 好き | Forma て | sukide | すきで | 好きで |
| 好き | Adverbial | sukini | すきに | 好きに |
| 嫌い | Negativo | kiraijanai / kiraidewanai | きらいじゃない / きらいではない | 嫌いじゃない / 嫌いではない |
| 嫌い | Pasado | kiraidatta | きらいだった | 嫌いだった |
| 嫌い | Pasado negativo | kiraijanakatta / kiraidewanakatta | きらいじゃなかった / きらいではなかった | 嫌いじゃなかった / 嫌いではなかった |
| 嫌い | Forma て | kiraide | きらいで | 嫌いで |
| 嫌い | Adverbial | kiraini | きらいに | 嫌いに |

## Decisiones lingüísticas y fuentes

Revisión editorial realizada por el agente, con contraste documental. **No es una
validación humana independiente ni una auditoría externa.** Catálogo limitado al encargo.

- いい usa las cinco formas de raíz よ indicadas por el propietario.
- きれい, 嫌い y 好き se clasifican explícitamente como な; no se infiere el tipo por la lectura.
- Se registran じゃない/ではない y じゃなかった/ではなかった como variantes simples de な.
  No se aceptan formas con です/ありません en estos ejercicios.
- Forma て y adverbial son preguntas distintas. En な, で enlaza descripciones y に es
  la forma usada con predicados como なる/する; el uso concreto depende del significado
  y del contexto. No se afirma que todo adjetivo describa naturalmente cualquier acción.
- Se conserva kana para おいしい, いい y きれい y no se añaden grafías en kanji alternativas
  fuera del catálogo acordado. No se promete aceptar toda grafía japonesa posible.
- Romaji usa shi/chi/tsu/ja, vocales largas escritas completas (ookii, yuumei) y dewa
  para では. Los espacios interiores, macrones y otras romanizaciones no declaradas
  no se convierten silenciosamente. La respuesta esperada muestra el romaji aceptado.

Fuentes consultadas:
[adjetivos y excepciones, Tae Kim](https://guidetojapanese.org/learn/grammar/adjectives),
[formas adverbiales, Tae Kim](https://guidetojapanese.org/learn/grammar/adverbs),
[enlace con て/で, Tae Kim](https://guidetojapanese.org/learn/grammar/compound),
[pasados negativos simples, Irodori / Japan Foundation](https://www.irodori-online.jpf.go.jp/a2-1/assets/pdf/lesson-ref/lesson18-grammar-en.pdf).

## Validador determinista

Normaliza entrada y candidatos con Unicode NFKC y trim exterior. Solo en la lista romaji
ignora mayúsculas. Compara por igualdad exacta contra las tres listas de la pregunta.
No elimina espacios interiores, consonantes dobles ni vocales largas. No convierte
katakana a hiragana, ni genera otra conjugación, ni usa similitud o IA. Una respuesta
válida de otro tiempo o familia continúa siendo incorrecta.

La auditoría recorre los 125 conjuntos contra una hoja literal de respuestas kana,
separada del código de datos. Comprueba romaji mediante una lectura de kana solo de
test (incluida la pronunciación de は en では), y correspondencia de las grafías kanji.
Los tests no construyen conjugaciones usando el mismo algoritmo que la aplicación:
la aplicación no tiene tal algoritmo. También se verifican IDs, cardinalidades,
listas no vacías globalmente, duplicados, Unicode, excepciones y traducciones.

## Preguntas, sesiones y separación de familias

Cada combinación adjetivo × transformación aparece una vez por ronda: 75 preguntas
para い, 50 para な y 125 para ambas. Se barajan registros; al mezclar familias se alternan
mientras ambas tienen preguntas. No se completa una familia con palabras de otra.
No se repite inmediatamente una combinación cuando hay alternativas, también al
reiniciar. Una ronda agotada ofrece comenzar otra sin ampliar la selección.

No se reanuda una ronda incompleta tras recargar o salir: se conservan sus contadores
ya guardados y se inicia otra ronda explícita. No se implementan FSRS ni dificultad adaptativa.

El submit admite Enter y comprueba composición IME para no corregir mientras se está
seleccionando un carácter. Después del feedback, Comprobar/No lo sé quedan deshabilitados
y el servicio impide una segunda corrección aunque reciba llamadas repetidas. El campo
pasa a solo lectura, se revela la respuesta principal y su romaji y se ofrece Siguiente.
Una revelación no puede convertirse después en un acierto copiando la solución.
Después del feedback también se puede avanzar con Espacio, indicado junto a Siguiente.
El atajo no actúa mientras se escribe, durante composición IME, con modificadores o
repetición de tecla, ni sobre controles ajenos como Salir o el desplegable de la regla.

## Rachas, estadísticas y persistencia

Clave lógica kana-study.conjugation-stats.v1, versión 1. Solo tres buckets de acumulados:
adjective-i, adjective-na y mixed; cada uno contiene attempts, correct, wrong, bestStreak.
Una mezcla de una sola familia sigue siendo mezcla. Ningún récord mixto se atribuye a
las tarjetas individuales. Todas las mezclas comparten el bucket mixed en esta fase.

La racha de la ronda aumenta con un acierto verificado; error o No lo sé la ponen a cero.
Cada respuesta cuenta un intento. El récord es el máximo observado, guardado con el
intento. Una ronda nueva empieza con racha cero. Sin intentos, el contador real es cero.
La cabecera muestra aciertos / errores, no aciertos / intentos: primer número verde
con el token semántico success y segundo rojo con error, además de las etiquetas.
Un acierto aumenta solo el primero; un error o No lo sé aumenta solo el segundo.
No se guardan textos escritos, respuestas individuales ni eventos en otros módulos.

StorageService usa el namespace del workspace y escritura localOnly/strict. Primero se
guardan los acumulados, después se acepta el feedback. Si falla la escritura, no se
cuenta la respuesta y se permite reintentar una sola vez efectiva. No se crea outbox.

El cambio de workspace invalida la ronda mediante activationRevision, incluso A→B→A
sin lectura intermedia. Los contadores se vuelven a leer para el workspace activo.
La selección de fase 1 mantiene su clave propia. No se añaden estas claves a backups,
importación Guest ni sincronización cloud existentes. Borrar los datos del navegador
puede eliminar estos acumulados. No hay garantía de reconciliación entre dos pestañas
que escriban simultáneamente ni entre dispositivos.

## Diseño, idiomas y accesibilidad

Formulario compacto con cabecera, racha, récord, aciertos, transformación, palabra con
furigana, significado, familia, entrada y acciones. La regla empieza plegada y vuelve a
plegarse en cada pregunta. Explicaciones por familia/transformación; no hay ejemplos
que repitan la respuesta concreta antes de comprobar. いい se explica como raíz よ.

Se usan propiedades semánticas de tema, controles nativos, labels, foco visible,
lectura japonesa grande, mensajes status/alert y áreas de interacción de al menos 44 px.
Se conserva la legibilidad a 320 px. La pantalla de poca altura adapta el espacio
vertical para mantener Comprobar visible al 125 % sin reducir botones ni ocultar contenido.
Textos, significados y reglas completos en ES/EN/CA.

## Validación y evidencias

Resultados y capturas regenerables en .cache/conjugations-phase2/; no se versionan.

| Validación | Resultado |
| --- | --- |
| Dirigidos Angular (catálogo, validador, sesión, pantalla, selección, rutas e inventario) | 79/79, nueve archivos |
| Suite completa `npm test`, ejecución final | 2570/2570, 247 archivos |
| Playwright del módulo, ejecución final sin reintentos | 46/46 |
| Candidato optimizado bajo `/kana-study/` | 1/1; tarjeta, respuesta, contador 1/0, Espacio, recarga y cero cloud |
| Viewports | 1920×1080, 1536×864, 1366×768, 1280×720, 390×844, 375×812, 320×800 |
| Zoom real del navegador al 125 % | ES/EN/CA, catálogo y entrenador, Comprobar visible |
| TypeScript app/spec | Correctos, exit 0 ambos |
| Builds normal y candidato con base `/kana-study/` | Correctos |
| Regresión estática Mazos | 33/33 |
| Regresión estática RUSH Kana/Kanji/Vocabulario | 33/33 |
| Manga candidato, Edge Chromium | 3/3; SDK/HTTP controlado, no Supabase real |
| Auditoría FSRS | 67 transiciones correctas, incluidos UTC y DST Madrid |
| i18n | Dominio de Conjugaciones, placeholders, compilación y auditoría de Gramática correctos |
| Bundles | Catálogo, modelos, validador, servicios, interfaz y copy fuera del grafo inicial |

Los 46 casos de navegador incluyen regresiones de la fase 1, clic en el cuerpo de
la tarjeta fuera del título, casillas independientes, 18 candados, las dos categorías
disponibles primero, respuesta con Enter, avance con Espacio, contadores 1/0 y 1/2,
doble submit, mezcla con pendientes, A→B→A, URLs manipuladas, persistencia y una ronda
completa de 50 preguntas con reinicio. Se midieron controles de al menos 44×44 px.

La primera comprobación de zoom encontró Comprobar 25 px por debajo de la ventana
útil. Se compactó el espacio vertical en ventanas bajas y se repitió la batería:
46/46 en el estado definitivo. No se aumentaron timeouts ni presupuestos.

Una ejecución completa simultánea con compilación y navegador perdió tres workers
de Vitest (`Worker exited unexpectedly`), sin una aserción de producto identificada.
No se contabiliza como pasada. Las ejecuciones completas posteriores sin esa carga
simultánea pasan; la última registra los 2570 tests. No se afirma estabilidad absoluta.
Vitest directo también encontró EPERM en temporales y recogía copias históricas bajo
.cache; se utilizó el runner Angular oficial del proyecto, con `--include` para dirigidos.

### Regresión adicional de navegación y Gramática

La ejecución de los tests originales navigation, learning-ux y grammar-access produjo
77/81 correctos y cuatro fallos. Tres corresponden al mismo logout SDK entre pestañas
ya documentado en fase 1; continúa pendiente. El cuarto fue una geometría nula de
la cabecera (`boundingBox` devolvió null), no un tamaño incorrecto medido. El test
original de cabeceras pasó después de manera dirigida en los tres tamaños (3/3),
sin editarlo ni relajar sus aserciones. No se ha demostrado la causa de esa intermitencia.
Los 45 casos de learning-ux pasan. No se presenta toda la batería Playwright del
repositorio como verde ni se modifica autenticación fuera de este encargo.

### Bundle inicial y carga diferida

| Artefacto | Base fase 1 | Fase 2 final | Diferencia |
| --- | ---: | ---: | ---: |
| Normal | 748.513 bytes | 748.669 bytes | +156 bytes |
| Candidato | 749.399 bytes | 749.555 bytes | +156 bytes |

Margen candidato frente al límite estricto de 750.000: 445 bytes. No se modifican
los presupuestos. Permanecen los seis warnings SCSS de componentes anteriores;
ninguno pertenece a Conjugaciones. El auditor recorre el grafo de imports estáticos
iniciales e identifica los chunks dinámicos de la funcionalidad; todos quedan diferidos.

Capturas de referencia: catalog-desktop.png, catalog-narrow.png,
question-desktop-es-dark.png, question-mobile-en-light.png, question-narrow-es-dark.png,
exit-desktop.png, scores-desktop.png y feedback-mobile.png dentro de la carpeta de
evidencias. La batería conserva además capturas por idioma, tamaño y zoom.

## Archivos y compatibilidad

Nuevos: modelo de práctica; catálogo de adjetivos y auditoría; validador y spec;
selector de preguntas; servicios de estadísticas y de ronda y spec; página de práctica
TS/HTML/SCSS y spec; pruebas de navegador adjectives.spec.ts y round.spec.ts;
playwright.conjugations-adjectives.config.ts; esta guía.

Modificados: modelo/catálogo y specs de fase 1; selección visual TS/HTML/spec;
rutas y su spec; inventario de navegación; tres JSON y diccionario generado de
Conjugaciones; auditor de bundles y test i18n; pruebas previas de catálogo/zoom;
índice documental y enlace de continuidad de la guía de fase 1.

No se modifican módulos Kana, Kanji, Vocabulario, Gramática ni Mazos, parámetros FSRS,
workflows, feature gates, servicios de autenticación/sincronización, SQL o datos previos.

## Limitaciones y siguiente fase

Verbos, cópulas y resto de categorías siguen pendientes. No hay reconocimiento aproximado,
voz, escritura a mano, FSRS, importación de vocabulario, respuestas corteses ni analítica
remota. La ampliación futura debe añadir nuevos registros explícitos y sus pruebas;
no introducir reglas de conjugación en el validador. Safari, dispositivos físicos,
revisión humana lingüística y concurrencia real entre pestañas no están validados aquí.

## Inventario exacto de esta entrega

37 archivos locales, sin staging ni cambios de HEAD:

```text
docs/INDEX.md
docs/features/conjugations/CONJUGATIONS_MODULE_PHASE_1.md
manual-tests/conjugations/conjugations.spec.ts
manual-tests/conjugations/zoom.spec.ts
scripts/audit-conjugations-bundle.mjs
scripts/conjugations-i18n.test.mjs
src/app/app.routes.spec.ts
src/app/app.routes.ts
src/app/core/models/conjugations.model.ts
src/app/data/conjugations.spec.ts
src/app/data/conjugations.ts
src/app/features/conjugations/conjugations.page.html
src/app/features/conjugations/conjugations.page.scss
src/app/features/conjugations/conjugations.page.spec.ts
src/app/features/conjugations/conjugations.page.ts
src/app/navigation-audit.ts
src/assets/i18n/ca.json
src/assets/i18n/conjugations.generated.ts
src/assets/i18n/en.json
src/assets/i18n/es.json
docs/features/conjugations/CONJUGATIONS_ADJECTIVES_PHASE_2.md
manual-tests/conjugations/adjectives.spec.ts
manual-tests/conjugations/round.spec.ts
playwright.conjugations-adjectives.config.ts
src/app/core/models/conjugation-practice.model.ts
src/app/core/services/conjugation-answer-validator.spec.ts
src/app/core/services/conjugation-answer-validator.ts
src/app/core/services/conjugation-practice.service.spec.ts
src/app/core/services/conjugation-practice.service.ts
src/app/core/services/conjugation-questions.ts
src/app/core/services/conjugation-stats.service.ts
src/app/data/conjugation-adjectives.spec.ts
src/app/data/conjugation-adjectives.ts
src/app/features/conjugations/conjugation-practice.page.html
src/app/features/conjugations/conjugation-practice.page.scss
src/app/features/conjugations/conjugation-practice.page.spec.ts
src/app/features/conjugations/conjugation-practice.page.ts
```

## Integración Anti-AFK V2 (9 de noviembre de 2026)

El entrenador utiliza el reloj compartido: hasta 180 segundos activos por pregunta,
pausa automática por visibilidad y cero tiempo de feedback/espera. El marcador muestra
el total de la ronda. La duración y cobertura se guardan con el intento en los siete
buckets locales por workspace, conservando los datos históricos sin tiempo como
medición desconocida. El aprendizaje, las respuestas y las rachas no cambian.

Arquitectura, archivos, compatibilidad y validación final:
[Anti-AFK V2 — integración Conjugaciones](../study/STUDY_TIME_ANTI_AFK_V2.md#integración-posterior-conjugaciones-9-de-noviembre-de-2026).
