# Escritura Kana: distribución responsive

## Alcance y separación de entregas

La parte A de Mazos/Vocabulario se publicó antes de comenzar este rediseño: commit
`eb470e0f6736b582146277ac8efaa6e634be0a85`, junto a los cuatro commits locales anteriores,
en `main`. [Actions 42517671547](https://github.com/CarlosPuyana/kana-study/actions/runs/42517671547)
terminó con build y deploy correctos. Se verificaron 14 casos de navegador sobre
producción y las rutas/recursos públicos; RUSH Kana y sus cuatro direcciones de
Vocabulario avanzaron y finalizaron sin cambiar FSRS en los perfiles sintéticos.
Las 49 incidencias editoriales continúan pospuestas por decisión del propietario.

**Este rediseño de Kana queda exclusivamente local, sin commit, push ni despliegue.**
No cambia aprendizaje, calificaciones, FSRS, repeticiones, límites, persistencia,
temporizadores, estadísticas, RUSH, datos ni gates. No hay SQL ni cambios de Supabase.

## Problema original y medición reproducida

Se capturó el build anterior al cambio con un perfil limpio, español, oscuro,
hiragana básico, dirección romaji → kana y primera pregunta `a`/`あ`.
La captura reproduce la disposición anterior; no se atribuye al archivo original
del usuario. Se mide desde scrollY=0, después de revelar, sin desplazamiento
automático de Playwright para activar un botón fuera de pantalla.

El frame compartido limitaba todo a 672 px, incluso en escritorio. Se apilaban:
cabecera de 80 px, padding superior, prompt, romaji de 96 px con márgenes, instrucciones,
lienzo de 400 px, herramientas, respuesta, ejemplo y evaluación. La evaluación
tenía además su propia altura mínima y separación. El problema estaba en la
distribución y el espacio acumulado; el motor de dibujo no necesitaba reescribirse.

| Medida en 1366×768 | Antes | Después |
| --- | ---: | ---: |
| Altura del documento | 1353 px | 768 px |
| Lienzo: borde superior | 421,28 px | 275,66 px |
| Tamaño del lienzo | 400×400 px | 368×368 px |
| Final de herramientas | 878,08 px | 700,45 px |
| Final de evaluación | 1305,19 px | 598,22 px |
| Scroll mínimo para mostrar toda la evaluación | 537,19 px | 0 px |

Las medidas son geométricas del DOM; no estimaciones de una captura. Los decimales
se redondean solo en esta tabla. Los JSON originales están en
`.cache/release-vocab-kana/kana-before.json` y
`.cache/kana-writing-responsive/geometry-*.json`.

## Diseño escogido

Desde 900 px se utiliza Grid con dos columnas flexibles. La izquierda agrupa
enunciado, romaji, instrucciones, lienzo y sus herramientas. La derecha agrupa
respuesta, ejemplo y valoración; también aloja las opciones/feedback/continuación
del modo rápido existente. El ancho máximo de la sesión pasa a 68 rem únicamente
cuando la pregunta es de escritura. La lectura, los resultados y los otros módulos
conservan sus marcos.

El lienzo varía entre 288 y 400 px según la altura disponible. En escritorio normal
las herramientas conservan una fila de 400 px aunque el lienzo se ajuste, evitando
envolver los cuatro controles por reducir el cuadrado. En ventanas cortas se
compactan cabecera, prompt y separaciones, conservando botones de al menos 44 px.

Antes de revelar, la columna de respuesta tiene una composición estable y contiene
únicamente la acción existente de revelar. No se muestran solución, ejemplo,
guía ni animación. Tras revelar, no se cambia el orden de los elementos del dibujo
ni se desplaza la página mediante JavaScript. Se muestran las mismas calificaciones
existentes; no se renombran ni cambian sus valores.

En móvil hay una columna. El lienzo ocupa el ancho útil en retrato, las herramientas
envuelven y la respuesta sigue inmediatamente después. No se añade sticky ni se
ocultan contenidos con overflow global. Los ejemplos largos pueden aumentar la
altura de forma natural. En horizontal de poca altura se permite scroll; no se
afirma que todo el ejercicio quepa simultáneamente en 844×390.

## Canvas y componentes compartidos

El llamado canvas es un **SVG** con `viewBox="0 0 1024 1024"`, no un bitmap con
resolución fija. Los puntos se guardan normalizados a partir del rectángulo actual.
Cambiar su tamaño CSS escala los trazos existentes sin borrarlos ni recalcular su
historia. No se modifican captura de puntero, coordenadas, guías, animaciones,
presión, reset por pregunta, persistencia o evaluación.

Dos variables CSS permiten integrar la distribución sin selectores profundos:

- `--writing-surface-max`: límite adaptable del SVG. Sin variable sigue siendo
  `65vh`, exactamente el comportamiento anterior de los otros consumidores.
- `--learning-writing-instructions-margin`: separación de las instrucciones.
  Sin variable conserva `1em 0`.

Se verifica expresamente que Escritura de Vocabulario no hereda el override y que
su superficie mantiene `min(ancho disponible, 65vh)`. Kanji se comprueba mediante
sus regresiones de dibujo, revelado y valoraciones. No se cambia su sistema.

## Accesibilidad y estados

Se conservan botones semánticos, foco visible, atajos, labels de SVG, roles de
estado y diálogo, bloqueo de teclado durante dibujo/carga y foco del modal de
salida. No hay strings nuevos ni traducciones modificadas. Se prueban claro y
oscuro, ratón y eventos táctiles reales mediante CDP, DPR 1/2/3, varios trazos,
deshacer, limpiar, guía visible/oculta, reproducción de trazos, resize/orientación,
revelado sin dibujar, tres calificaciones, cambio de pregunta, repeticiones y final.

Una sesión de escritura con las dos primeras respuestas negativas/intermedias
finaliza con 12 presentaciones y 10 eventos FSRS únicos, conservando el contrato
previo de Kana. No se traslada el algoritmo de Vocabulario a este módulo.
El estado sin ejemplo se cubre en el test de componente; el caso de traducción
excepcionalmente larga es un fixture de texto DOM, sin modificar el catálogo.
Esta pantalla no ofrece una acción de pantalla completa; no se inventa una nueva.

## Viewports y zoom

| Viewport CSS | Composición | Scroll para evaluación normal |
| --- | --- | ---: |
| 1920×1080 | Dos columnas, lienzo 400 px | 0 px |
| 1536×864 | Dos columnas, katakana, lienzo 400 px | 0 px |
| 1366×768 | Dos columnas, lienzo 368 px | 0 px |
| 1280×720 | Dos columnas, lienzo 320 px | 0 px |
| 390×844 | Una columna, lienzo 366 px | 227,89 px |
| 375×812 | Una columna, lienzo 351 px | 244,89 px |
| 320×800 | Una columna, lienzo 296 px | 222,89 px |
| 844×390 | Una columna, lienzo 253,5 px | 527,92 px |

El zoom se prueba con **zoom real de Edge al 125 %**, confirmado con
`chrome.tabs.getZoom() === 1.25`, en un perfil exclusivo de QA. No se sustituye
por CSS zoom, DPR o emulación de pinch. Una extensión efímera se genera dentro del
output del test y solo cambia el zoom de localhost; no se incluye en la aplicación.
La ventana exterior 1366×768 produce un viewport CSS 1074×541, DPR 1,25 y un lienzo
de 288 px: evaluación y herramientas visibles, sin overflow horizontal.
La captura usa CDP para evitar que el helper fullPage de Playwright altere el área
capturada al existir zoom del navegador.

## Archivos

- `src/app/features/learn/learn.page.html`: agrupación y clases solo para escritura.
- `src/app/features/learn/learn.page.scss`: distribución responsive y ventana corta.
- `src/app/features/learn/learn.page.spec.ts`: límites de revelado y alcance del layout.
- `src/app/shared/components/learning-writing-prompt/learning-writing-prompt.ts`:
  margen opcional de presentación, con fallback anterior.
- `src/app/shared/components/kana-writing-canvas/kana-writing-canvas.scss`:
  ancho máximo opcional, con fallback anterior.
- `manual-tests/kana-writing-responsive/`: geometría, dibujo, sesión, Vocabulario y zoom.
- `playwright.kana-writing-responsive.config.ts`: ocho tamaños y proyecto de zoom.
- `e2e/ux-feedback.spec.ts`: selector preciso del botón RUSH en una prueba existente.
- `manual-tests/vocabulary-short-lessons/vocabulary-short-lessons.spec.ts`:
  espera de render al cerrar una medalla en el helper de prueba.
- Esta guía y `docs/INDEX.md`.

## Pruebas y evidencias

Comando reproducible principal:
`npx playwright test --config playwright.kana-writing-responsive.config.ts`.
El config reutiliza localhost:4404 cuando ya se sirve la aplicación, o inicia
`npm run start -- --host 127.0.0.1 --port 4404`.

Las comprobaciones no utilizan `force:true`, retries, sleeps arbitrarios ni omiten
casos. Comprueban límites de viewport, overflow, proporción, separación de columnas,
estabilidad del lienzo, coordenadas y conservación de trazos; los botones se activan
mediante interacciones normales.

Durante las regresiones se detectó un test anterior cuyo selector
`button.rush-button` coincidía tanto con RUSH como con el nuevo acceso a estadísticas
de Vocabulario. Las tres variantes fallaban por strict mode. Se identifica ahora
el botón por su nombre accesible exacto `⚡ RUSH`: el flujo y las aserciones se
conservan. Las 42 regresiones existentes completas pasan después del ajuste.

Al repetir las regresiones estáticas, un caso CA/320 px también detectó una carrera
en el helper de medallas: tras cerrar el último diálogo, el siguiente `count()`
podía leer el DOM anterior y el test quedaba esperando un botón ya desaparecido.
La traza muestra el resumen de sesión completado y ningún diálogo. Se espera ahora
que cambie el texto del diálogo o que desaparezca antes de consultar el siguiente.
Se preservan las aserciones del caso de recuperación de guardado y la ausencia de
una valoración FSRS adicional. No hay sleeps, retries de test ni cambio productivo
de Vocabulario. La suite completa de lecciones se repite y pasa **21/21**.

Capturas previas: `.cache/release-vocab-kana/kana-before-1366-*.png` y
`kana-before-375-*.png`. Capturas posteriores:
`.cache/kana-writing-responsive/results/*/{front,revealed,long-example}.png`
y `*/zoom-125-revealed.png`. Son artefactos locales regenerables y no se versionan.
Se revisaron visualmente escritorio, móvil claro y oscuro y zoom, además de las
aserciones geométricas. Los logs finales están en `.cache/release-vocab-kana/`.

Validaciones finales ya terminadas:

| Comprobación | Resultado |
| --- | --- |
| Dirigidos Kana/sesión/componentes y páginas de escritura | 78/78, 11 archivos |
| Suite Angular completa | 2490/2490, 239 archivos |
| TypeScript app y spec | Ambos correctos |
| Playwright responsive: 8 tamaños × 3 casos + zoom real | 25/25 |
| Regresiones existentes de teclado, aprendizaje, RUSH, Kanji y navegación | 42/42 |
| Regresiones estáticas finales: lecciones / estadísticas / Vocabulario FSRS-RUSH / Mazos / RUSH general | 21 + 18 + 15 + 33 + 33 = 120/120 |
| Regresión Manga del candidato final | 3/3, ES oscuro / EN claro / CA 320 px |
| Auditoría FSRS | 67 transiciones correctas, UTC y cambios de hora Madrid |
| Auditoría i18n | Correcta; no se crean ni modifican traducciones |
| Auditoría multimedia/bundles | Correcta; recursos y gates protegidos intactos |
| Enlaces documentales | 95 Markdown, 316 enlaces, ninguno roto |
| `git diff --check` y scope final | Correctos; 12 archivos locales, staging vacío |
| Build normal / candidato | Ambos correctos |
| Inicial normal / candidato | 747.061 / 747.947 bytes, sin aumento |
| Artefacto total normal / candidato | 150.320.649 / 150.320.410 bytes |

Los presupuestos no se modifican. A los cinco avisos SCSS anteriores (cuatro de
Gramática y uno de Vocabulario) se añade el de `learn.page.scss`, **9,92 kB** frente
al umbral de aviso de 8 kB. Es el estilo lazy de esta pantalla, con la distribución
responsive y los ajustes para ventanas cortas; el build termina correctamente y
el bundle inicial no aumenta. No se oculta el aviso, se fragmenta el CSS para
evitarlo artificialmente ni se cambia su umbral. El incremento total del artefacto
es de unos 3,4 kB respecto a la parte A.

Una ejecución completa dentro del sandbox quedó **incompleta**, con cinco workers
Vitest terminados inesperadamente: 234 archivos/2409 tests ejecutados, sin aserción
fallida. No se cuenta como una suite aprobada. Se ejecutó de nuevo `npm test`
completo fuera del sandbox, con exactamente el mismo código y configuración:
239 archivos y 2490 tests, sin errores de workers. Los logs se conservan por
separado (`full-b.log` y `full-b-closure.log`). No se identifica con certeza la
causa interna de esas terminaciones; no se atribuyen sin evidencia al producto ni
se afirma estabilidad absoluta a partir de una ejecución. No se añadieron retries,
filtros, cambios de timeout o modificaciones de configuración para obtener el pase.

Las regresiones estáticas completas de Mazos/Vocabulario/RUSH se registran al cierre
en los logs `pw-b-final-*.log`, sin reconstruir los artefactos mientras los utiliza Edge.

## Revisión manual local

El servidor de revisión se sirve en `http://127.0.0.1:4404/`. Para iniciarlo si está
parado: `npm run start -- --host 127.0.0.1 --port 4404`. En Kana, editar selección,
activar romaji → kana, volver e iniciar Aprender → autoevaluación. Dibujar es
opcional; revelar permite comparar el lienzo con la respuesta y valorar con los
controles originales. Las pruebas automatizadas usan perfiles sintéticos propios.

## Limitaciones

No se certifica Safari ni dispositivos físicos. El touch se comprueba en Edge
con eventos táctiles de navegador; no equivale a una tableta gráfica real.
Los ejemplos excepcionalmente largos y las ventanas muy cortas pueden necesitar
scroll natural. No se añaden servicios offline, reconocimiento de escritura ni
dependencias. Auth/RLS remoto no se valida en esta entrega. No se inicia Kanji.
