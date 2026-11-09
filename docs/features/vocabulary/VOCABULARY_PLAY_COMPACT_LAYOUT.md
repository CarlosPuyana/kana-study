# Aprender Vocabulario: presentación compacta

Trabajo exclusivamente local sobre `main`, base `6a82ceb`. Se conserva el rediseño
de Escritura Kana ya versionado. No hay commit, push, despliegue, SQL ni cambios de
catálogo, Mazos, Japanese 1500, gates o algoritmos FSRS.

## Problema y reproducción

La misma palabra se mostraba en la pregunta y otra vez en una tarjeta de respuesta
con furigana grande, lectura, romaji, significado, categoría y ejemplo. La tarjeta
era idéntica para las cuatro direcciones. A ello se sumaban el margen de pregunta
y una zona de evaluación de altura mínima considerable. Se reprodujo con 毎月 en
un perfil sintético limpio, ES oscuro, reloj fijo `2026-11-08T11:00:00Z`, una palabra
pendiente y el resto programado para diciembre. No se usa el perfil del usuario.

Las capturas originales se recrean antes de modificar la aplicación. No se afirma
que sean la captura original del propietario. Se mide desde scrollY=0; para esa
medición previa el botón fuera de pantalla se activa mediante DOM, evitando que
Playwright desplace automáticamente el viewport y falsee el scroll necesario.

| Dirección, 1366×768 | Scroll para evaluación antes | Después | Altura de respuesta antes → después |
| --- | ---: | ---: | ---: |
| Japonés → significado | 71,47 px | 0 px | 377 → 143,27 px |
| Significado → japonés | 10,47 px | 0 px | 377 → 196,78 px |
| Japonés → lectura | 11,47 px | 0 px | 377 → 199,05 px |
| Lectura → japonés | 75,47 px | 0 px | 377 → 193,78 px |

Para japonés → significado el documento pasa de 887 a 768 px. En 375×812 el ejemplo
normal ya permitía alcanzar la evaluación sin scroll en el diseño anterior: se
mantiene en cero y la respuesta baja de 310,47 a 133,53 px. No se atribuye una
reducción de scroll inexistente en esa condición.

## Diseño según dirección

| Dirección | Pregunta | Respuesta principal |
| --- | --- | --- |
| Japonés → significado | Japonés con furigana y lecturas alternativas legítimas | Significado, sin repetir japonés ni lectura principal |
| Significado → japonés | Significado | Japonés con furigana; alternativas de lectura cuando existen |
| Japonés → lectura | Escritura sin pistas de lectura | Lectura principal y variantes; significado secundario |
| Lectura → japonés | Lectura y el contexto de significado que ya existía | Escritura japonesa, sin repetir la lectura del enunciado; variantes distintas si existen |

Se reutiliza `vocabularyReadingVariants`, que conserva la asociación entre grafías
y lecturas restringidas. Es presentación: no se añaden respuestas aceptadas ni se
alteran opciones, identificadores o evaluación.

`VocabularyStudyAnswer` es un componente de esta pantalla, utilizado tanto en
autoevaluación como tras responder opciones. Romaji, categoría, formas y ejemplos
se conservan en un `details` nativo accesible, cerrado inicialmente y titulado
«Ver detalles» (ES/EN/CA). Los ejemplos pueden contener la palabra como contexto,
pero no se repite como una segunda cabecera grande.

La pregunta usa un japonés legible y más compacto. Se reducen espacios de la zona
de ejercicio y la evaluación queda inmediatamente tras la respuesta. No se cambia
la portada, el resumen ni las estadísticas. La composición es una columna; no se
necesitan dos para este contenido. En ventanas bajas la cabecera de estudio se
organiza en una sola fila, sin cambiar los resultados.

Antes de revelar no se monta el componente de respuesta ni sus detalles. Las
direcciones de lectura conservan oculto el furigana que revelaría la solución.
Al valorar se destruye la respuesta anterior; la siguiente pregunta empieza sin
solución y con los detalles cerrados. No se añade scroll por JavaScript ni sticky.
El contenido largo envuelve o desplaza naturalmente; no hay recorte con overflow
hidden ni reducción de controles táctiles.

## Pruebas

Se prueban 1920×1080, 1536×864, 1366×768, 1280×720, 390×844, 375×812 y 320×800,
claro/oscuro, cuatro direcciones y dos modos. Los casos de autoevaluación usan
NO → CASI → SÍ → SÍ: cuatro intentos y un único evento FSRS, conservando la
consolidación 2/2. Opciones finaliza con dos respuestas correctas y un evento.
Las suites previas comprueban lecciones 10/15, reanudación, estadísticas y RUSH.

La geometría comprueba evaluación visible, ausencia de overflow horizontal,
scroll cero al revelar en escritorio y proporciones reales. Se prueban variantes
de 毎月 y una traducción larga de fixture, sin escribirla al catálogo. El zoom al
125 % es real de Edge, confirmado mediante `chrome.tabs.getZoom`, en un perfil
aislado con extensión efímera dentro del output de QA. No es CSS zoom ni emulación
de DPR. La captura de zoom se obtiene por CDP para respetar el viewport físico.

La primera pasada de zoom detectó 34,46 px de evaluación fuera de pantalla en
Lectura → Japonés. Se ajustaron únicamente la cabecera de ventana baja y la altura
mínima de evaluación. Se conserva la aserción de visibilidad; no se amplían umbrales
ni se fuerzan clics.

Comando: `npx playwright test --config playwright.vocabulary-compact.config.ts`.
Baseline: `.cache/vocabulary-compact/before/*/{before.json,before.png}`.
Después: `.cache/vocabulary-compact/measurements/*.json` y
`.cache/vocabulary-compact/results/*/{front,revealed,long-translation,zoom}.png`.
Los artefactos locales se regeneran y no se versionan.

## Validación final

| Comprobación | Resultado |
| --- | --- |
| Dirigidos Vocabulario/Kana/selección/persistencia/workspace | 284/284, 32 archivos |
| Angular completo | 2499/2499, 240 archivos |
| TypeScript app/spec | Correctos, salida 0 |
| Playwright compacto, siete tamaños y cuatro zoom reales | 60/60 |
| Playwright selección Kana, tres tamaños | 9/9 |
| Layout previo de Escritura Kana | 25/25 |
| Interacciones existentes, teclado, salida y escritura compartida | 42/42 |
| Lecciones / estadísticas / Vocabulario FSRS-RUSH / Mazos / RUSH general | 21 + 18 + 15 + 33 + 33 = 120/120 |
| Artefacto final con base `/kana-study/`, cuatro direcciones y dos modos | 8/8 |
| Regresión Manga del candidato final | 3/3, perfiles sintéticos ES/EN/CA |
| Auditoría FSRS | 67 transiciones correctas, UTC y DST Madrid |
| Auditoría i18n | Correcta; solo dos claves nuevas ES/EN/CA |
| Auditoría de multimedia/bundles | Correcta; sin dependencias nuevas ni datos de pruebas en el bundle |
| Enlaces | 97 Markdown, 320 enlaces, ninguno roto |
| Builds normal / candidato | Ambos correctos |
| Inicial normal / candidato | 748.018 / 748.904 bytes, ambos menores que 750.000 |
| Tamaño total de artefacto normal / candidato | 150.290.656 / 150.290.405 bytes |
| `git diff --check` | Correcto |

La aclaración final sobre puntos débiles repite dirigidos, suite completa,
TypeScript, builds, selección Kana y auditorías; también se comprueban ocho casos
en el artefacto final y los tres perfiles Manga. La lógica y el layout de Vocabulario
no cambian después de los 60 casos visuales. Los logs finales se distinguen con
`closure`, `final` o `regression` dentro de `.cache/vocabulary-compact/`.

Se mantienen seis avisos SCSS: cuatro de Gramática, Escritura Kana (9,92 kB) y
Vocabulario (ahora 9,27 kB frente a 8,28 kB anteriores). No se cambian umbrales ni
presupuestos; el candidato queda 1096 bytes por debajo del límite inicial.
El nuevo componente de respuesta es lazy y reutiliza presentación entre ambos modos.

Se revisaron visualmente escritorio oscuro, móvil claro y la dirección inversa,
además de las aserciones geométricas. La [auditoría de selección Kana](../kana/KANA_WRITING_SELECTION_AUDIT.md)
explica las causas legítimas y el fallo real de aislamiento corregido.

Archivos de aplicación: `vocabulary-play.page.{html,scss,ts}`, su test,
`vocabulary-study-answer.ts`, `selection.page.{html,ts}` y
`learning-session.service.ts`. Se añaden el contrato de selección Kana,
`manual-tests/vocabulary-compact/`, los dos configs Playwright, esta guía y la
auditoría Kana. Se actualizan `docs/INDEX.md`, las tres traducciones y su
`core.generated.ts`. Los archivos de la entrega previa de layout Kana no cambian.

## Límites

No se valida Safari, dispositivo físico ni Auth/RLS remoto. Los ejemplos desplegados
y las traducciones excepcionales pueden necesitar scroll natural. La redistribución
de los campos no modifica sus textos ni la programación de aprendizaje.
