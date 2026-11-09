# Kanji — Auditoría funcional, lingüística y UX

Fecha: 9 de noviembre de 2026. Rama `main`, base `c59da61ff0da8e7744fd37a7ff59db661040f957`. Árbol inicialmente limpio. Solo análisis y documentación: sin cambios productivos, de catálogo, FSRS, SQL, autenticación ni otros módulos. Sin commit, push o despliegue.

## 1. Resumen ejecutivo

Kanji ofrece 80 caracteres, dos direcciones, opciones y autoevaluación, escritura, catálogo, RUSH, puntos débiles, medallas y estadísticas generales. Sus reglas actuales difieren del Vocabulario moderno.

Antes del rediseño conviene atender dos problemas de integridad reproducidos en perfiles sintéticos: una sesión anterior puede guardar respuestas en otro workspace; un fallo de almacenamiento permite avanzar sin guardar progreso. Además, los vencimientos del panel pueden quedar obsoletos y bloquear el inicio de repasos disponibles. Los 178 tests existentes ejecutados pasan: no cubren estas reproducciones.

El principal problema UX es vertical: al revelar se repite contenido y las lecturas desplazan las valoraciones fuera de pantalla. En dirección inversa el lienzo permanece encima de las opciones incluso en escritorio. La prioridad pedagógica es contextualizar lecturas, no añadir más modos.

No se ha corroborado un dato lingüístico gravemente erróneo. Lecturas y metadatos de los 80 registros coinciden con su fuente actual; esto no certifica la frecuencia, selección pedagógica o traducción de cada acepción ni sustituye una revisión humana independiente.

## 2. Inventario funcional y arquitectura

Entrada lazy en `src/app/app.routes.ts`; rutas en `src/app/features/kanji/kanji.routes.ts`:

| Ruta bajo `#/kanji` | Función | Implementación bajo `src/app/` |
| --- | --- | --- |
| raíz | Progreso, Aprender, RUSH, Escritura y accesos | `features/kanji/kanji.page.*` |
| `/selection` | N5 y dos direcciones | `features/kanji-selection/*` |
| `/play` | Opciones, autoevaluación y resultados | `features/kanji-play/*` |
| `/all` | Buscar, agrupar, ficha y escritura individual | `features/kanji-all/*` |
| `/writing` | Escritura por temas, individual o débil | `features/kanji-writing/*` |
| `/rush` | Mostrar respuesta → Siguiente | `features/rush/kanji-rush.page.*` |
| `/medals` | 18 medallas Kanji | `features/kanji-medals/*`, `data/kanji-medals.ts` |

Servicios principales en `src/app/core/services/`: `kanji-settings.service.ts`, `kanji-selection.ts`, `kanji-round-builder.ts`, `kanji-options.ts`, `kanji-progress.service.ts`, `kanji-session.service.ts`, `kanji-writing-session.ts`, `kanji-medal.service.ts` y `kanji-medal-rules.ts`.

Modelos: `core/models/kanji.model.ts`, `kanji-study.model.ts`, `kanji-session.model.ts`. Integraciones: SpacedRepetitionService, DailyLearningService, SessionHistoryService, AttemptRecordingService, WeaknessService, JapaneseGlyphService, StudyClock y RUSH. Presentación compartida: LearningWritingPrompt, KanaWritingCanvas, StudyTimer, LearningSessionList y ModalFocus.

Preferencias y progreso se guardan por workspace mediante StorageService. Desactivar contenido no borra progreso. La ronda de Aprender es solo de memoria: recargar no la reanuda, aunque sus primeras respuestas confirmadas sí persisten.

## 3. Inventario del catálogo y auditoría lingüística

Fuente local: `src/app/data/kanji-n5.generated.ts`; generador: `scripts/generate-kanji.mjs`; atribución: `src/app/data/KANJI_DATA.md`. Lecturas, trazos, grado y frecuencia proceden de KANJIDIC2 mediante [kanjiapi.dev](https://kanjiapi.dev/). Los significados y ejemplos ES/EN/CA son selección editorial literal del generador. No se consultan esos servicios durante el estudio.

| Propiedad | Resultado comprobado |
| --- | --- |
| Caracteres / habilitados / IDs únicos | 80 / 80 / 80 |
| ID | Carácter; clave de progreso como `kanji:日:kanji-to-meaning` |
| Direcciones | 80 unidades por dirección; 160 con ambas |
| Significados ES/EN/CA | Presentes en los 80; glosas, no definiciones completas |
| On / kun | On en los 80; kun vacía en `校` y `電` |
| Ejemplos | 80, uno por carácter: 61 kun y 19 on; ninguno etiquetado irregular |
| Ejemplos idénticos al carácter aislado | 32; no son 80 compuestos distintos |
| Trazos | De 1 a 14; sin discrepancias con recursos gráficos |
| Radicales | Campo opcional; 0 registros informados |
| Nivel | N5 aproximado editorial; solo N5 habilitado |
| Agrupaciones | 8 temas pedagógicos en `kanji-n5-categories.ts` |
| Orden | Estable en catálogo; nuevas aleatorias, no secuencia didáctica |

Contraste externo: **80/80 lecturas on/kun** y **80/80 trazos/grado/frecuencia** coinciden con la API fuente consultada. Cero consultas inaccesibles. Todos los ejemplos contienen el carácter objetivo. Sin duplicados, glosas vacías o trazos ausentes. Es consistencia con la misma fuente, no validación pedagógica independiente.

El [JLPT explica que ya no publica las antiguas especificaciones cerradas de contenido](https://www.jlpt.jp/e/faq/). La selección de la aplicación ya avisa que N5 es orientativo; conservarlo y no anunciar estos 80 como cobertura oficial exhaustiva.

### Casos concretos para revisión editorial

| IDs | Evidencia | Interpretación y siguiente comprobación |
| --- | --- | --- |
| `生` | 18 kun, puntos/guiones, solo ejemplo 生きる | Falta jerarquía/contexto; no eliminar lecturas correctas de referencia |
| `行` | コウ・ギョウ・アン y 8 kun; solo 行く | No son lecturas intercambiables; verificar frecuencia y uso antes de etiquetar rareza |
| `女` | ジョ・ニョ・ニョウ / おんな・め; ejemplo 女 | Coincide con fuente, pero no explica usos diferentes |
| `日` | ニチ・ジツ / ひ・-び・-か; ejemplo 日 | No enseñar una lectura única; contextualizar palabras |
| `学` | 学校 がっこう y objetivo ガク | La palabra es correcta; falta explicar la variación en contexto. No cambiarla a がくこう |
| `先` / `前` | Comparten «antes» / «abans», aunque difieren sus listas completas | Riesgo de ambigüedad en preguntas/distractores; no es evaluación incorrecta demostrada |
| `校` / `電` | Kun vacía | Ausencia legítima en la fuente; no inventar relleno |
| `一` | «1 trazos» en interfaz | Pluralización incorrecta del texto, no del dato |

La entrada [校 de Kanjipedia](https://www.kanjipedia.jp/kanji/0002236900) documenta 学校（ガッコウ）; [生](https://www.kanjipedia.jp/kanji/0003833400) y [生きる](https://www.kanjipedia.jp/kotoba/0003835000) permiten contrastar usos distintos. Estas muestras no verifican todas las traducciones del catálogo.

La notación de diccionario `まな.ぶ`, `-び`, etc. se muestra literalmente sin explicar okurigana o sufijos. No es una respuesta que deba introducir el alumno. Falta una presentación pedagógica; no corresponde modificar automáticamente el dato original.

No hay audio específico de Kanji, pitch accent, frases completas o relación estructural con entradas de Vocabulario. No se convierten automáticamente en requisitos.

## 4. Preguntas y evaluación

Solo dos direcciones; no existen ejercicios de lectura escrita ni un validador de pronunciaciones libres.

| Dirección / modo | Antes de responder | Respuesta y revelado | Evaluación |
| --- | --- | --- | --- |
| Kanji→significado / opciones | Carácter y cuatro glosas | Clic; resultado y Continuar | Objetiva por ID |
| Significado→kanji / opciones | Glosas y lienzo sin guía | Dibujar o continuar sin dibujo; cuatro caracteres | Se evalúa el clic, no el dibujo |
| Kanji→significado / autoevaluación | Carácter | Mostrar respuesta: significado, on/kun y ejemplo | NO/CASI/SÍ, procedencia self |
| Significado→kanji / autoevaluación | Glosas y lienzo sin guía | Mostrar respuesta: carácter, ayudas y ficha | Misma autoevaluación; sin reconocimiento |

Cada respuesta registra intento y debilidad. Solo la primera por unidad/ronda normal actualiza FSRS. Espacio revela y 1/2/3 valoran en autoevaluación. Opciones admite Tab/Enter en botones; no anuncia atajos numéricos. Se permite continuar sin dibujar. En las muestras no se observa guía ni carácter resuelto antes de evaluar el sentido inverso.

`kanji-options.ts` elimina cadenas completas duplicadas, no solapamientos semánticos. Una alternativa parcialmente equivalente puede ser penalizada por ID; `先/前` requiere revisión editorial, no una corrección automática. «Rechazar otra lectura correcta escrita» no aplica porque no se introducen lecturas.

Opciones no presenta la ficha explicativa completa tras responder: resalta la solución y resultado. El detalle de lecturas/ejemplo aparece en autoevaluación y catálogo. Reconocer una opción no demuestra recordar cómo escribir o leer una palabra.

## 5. Escritura

KanjiWritingPage usa KanjiWritingSession y KanaWritingCanvas. Hay selección por 8 temas, práctica individual desde Todos y hasta 10 débiles. Todos los temas están activos inicialmente; la ronda puede contener 80 caracteres, barajados y deduplicados.

Con guía es trazado deliberado, no recuerdo sin pistas. Sin guía revela después, permitiendo dibujo vacío. La práctica individual muestra carácter/guía desde el principio; Volver a practicar limpia. En ronda, Repetir recoloca al final y Correcto resuelve. No tiene máximo de repeticiones ni objetivo corto configurable como Vocabulario.

SVG con Pointer Events, captura de puntero, coordenadas normalizadas, bloqueo de scroll sobre el dibujo, Deshacer/Limpiar, guía y animación. Se comprobó ratón y táctil emulado: un trazo, Deshacer a cero y animación disponible. No se probó lápiz físico/Safari ni se implementa reconocimiento.

`public/vocabulary-writing/kanji.json`: recursos para los 80, conteos coincidentes, **427.865 bytes** para ese fichero. JapaneseGlyphService carga también `kana-extra.json` al primer uso y reutiliza la promesa; no descarga solo un carácter ni consulta KanjiVG en ejecución. [KanjiVG](https://kanjivg.tagaini.net/) proporciona forma, dirección y orden de trazos bajo CC BY-SA 3.0.

La carga protege contra resultados de otra pregunta mediante generación y tiene fallback/aviso de recurso ausente; libera el caché al fallar para un intento posterior. Esto se verificó por código, no mediante todas las averías de red.

Escritura independiente registra autoevaluación y débiles, **no FSRS**, no guarda dibujos, duración de sesión o cola reanudable. Aprender inverso sí comparte FSRS de la dirección con opciones/autoevaluación.

La composición responsive anterior de Aprender Kana está en `features/learn/learn.page.scss` (`writing-session`, `writing-exercise`, columnas desde 900 px y ajuste a altura). KanjiPlay no utiliza ese layout; compartir canvas no lo hereda. Escritura Kanji independiente usa el SCSS común de página de escritura y carece de una composición lateral propia. Puede inspirarse en el principio sin copiar algoritmos ni modificar el componente compartido indiscriminadamente.

## 6. Aprendizaje, FSRS y persistencia

Ronda de **hasta 10 unidades totales**: vencidas por hora exacta primero, nuevas después hasta llenar. No son repasos más diez nuevas. Intenta evitar ambas direcciones del mismo carácter en la ronda; las usa si es necesario para llenar. Nuevas aleatorias.

Memoria separada por carácter/dirección, compartida entre opciones y autoevaluación. No hay memoria de exactitud física del dibujo. SpacedRepetitionService usa `ts-fsrs`, `fsrs()` y Again/Hard/Good. No equivale a las reglas particulares de SCHEDULER-1 de Mazos.

Solo primera respuesta por unidad/ronda genera KanjiReviewEvent con before/after FSRS. Refuerzos actualizan contadores/débiles, no scheduler. NO reaparece tras hasta dos alternativas, CASI hasta cuatro; con pocas tarjetas puede volver antes. SÍ resuelve. Máximo cuatro apariciones: el cuarto fallo cierra esa unidad como necesitada de práctica, sin convertir su FSRS en Review.

Una ronda normal completada bloquea Aprender ese día Europe/Madrid, incluso si contiene menos de diez o quedan otros vencidos. Con 30 vencidas se atienden hasta 10 y no hay otra ronda normal ese día. Los lapsos cortos pueden vencer tras cerrar la ronda sin poder repasarse normalmente hasta el día siguiente. Es política explícita de producto, no fallo de las ecuaciones FSRS; requiere decisión antes de cambiarla.

La práctica voluntaria de débiles no cambia FSRS ni completa el día. RUSH permanece disponible. Ronda no durable y sin Deshacer de valoración. Persistencia: `kana-study.kanji-selection.v1`, `kanji-progress.v1`, `kanji-review-events.v1` (estas dos últimas con el mismo prefijo completo), resúmenes `completed-sessions.v1`, AttemptEvent en IndexedDB, debilidades locales y repositorio RUSH.

StudyClock acredita hasta 180 s por aparición con pausa de visibilidad y protección de suspensión. Revelar mantiene el presupuesto. En opciones el commit está en `advance()`, al continuar: la espera del feedback también entra en el presupuesto. Solo la ronda normal terminada guarda resumen de duración. Salir antes descarta total de sesión aunque se hayan guardado primeras respuestas FSRS. No representa todo el tiempo posible de actividad Kanji.

## 7. RUSH

Preferencias inicializadas desde selección normal, luego independientes. N5 y dos direcciones: hasta 80/160 unidades, no solo vencidas/débiles. RushEngine baraja por ciclos e intenta separar el mismo carácter consecutivo.

Mostrar respuesta→Siguiente, Espacio/Enter; inversa con lienzo opcional. Revela solución y on/kun. No introduce opciones, ratings ni corrección del dibujo. Continúa hasta salir; guarda tarjetas completadas, únicos, ciclos y tiempo. La aparición sin completar se descarta y hay resumen si existen tarjetas confirmadas. Tiene controles de guardado/reintento en su servicio.

No modifica FSRS ni registra aciertos/errores de Kanji: no hay valoración para inferirlos. Comparte motor con Kana, con contenido y direcciones propios. Incluir cambios de workspace en su futura regresión; no se afirma haber validado Auth/concurrencia reales ni se abre auditoría de todos los consumidores del servicio compartido.

## 8. Puntos débiles

Identidad módulo/actividad/ID/dirección. Aprender: NO/CASI/SÍ suma +2/+1/−1 a score limitado 0..10; débil desde 3. Failures suma solo NO. Escritura independiente usa correcto/incorrecto sin dirección. Son habilidades distintas, no una sola lista FSRS.

Puntos débiles muestra hasta 5 de escritura; la práctica puede recoger hasta 10. Aprender respeta direcciones débiles y puede practicar contenido fuera de selección sin cambiarla. No actualiza FSRS. Orden: score, proporción de fallos y fecha reciente; sin desempate adicional total, sin intermitencia reproducida por ello. RUSH no alimenta debilidad.

Falta acceso directo desde resultados a RUSH de los difíciles de esa ronda como en Vocabulario; hay contador y lista de estudiados. Es limitación, no error que el entrenamiento voluntario conserve la programación.

## 9. Estadísticas e historial

| Dato | Disponible | Límite |
| --- | --- | --- |
| Nuevos/pendientes/memorizados | Estado FSRS de unidades activas | Review etiquetado memorizado no prueba dominio; dos direcciones pueden contar dos veces |
| Estudiados en Perfil | IDs únicos con progreso | No implica aprobación |
| Vencidos | Due al construir ronda | Panel cacheado puede quedar obsoleto |
| Intentos y repeticiones | SessionItem y AttemptEvent | La ronda desaparece al salir; eventos nuevos distinguen objective/self |
| Aciertos | Objetivos en opciones; self separado en Stats V2 | No confundir SÍ con acierto objetivo |
| Evolución | Stats V2, 7/30/90 días por módulo/actividad | No es retención FSRS ni historial individual |
| Tiempo | Resúmenes normales terminados y RUSH | Sin duración para escritura independiente o rondas abandonadas |
| Historial FSRS | Eventos por carácter/dirección con snapshots | No hay modal/timeline individual equivalente a Mazos |
| Memoria | Due, estabilidad, dificultad, reps, lapses, etc. guardados | No se presenta recuperabilidad calculada/fechada individual |
| Rachas/medallas | Racha general y 18 medallas Kanji | Sin racha de aciertos propia del ejercicio |

LearningAnalyticsService agrega WeaknessRecord: `attempts - failures` incluye CASI como no-fallo. No equivale a SÍ ni precisión objetiva. Stats V2 distingue Again/Hard/Good y calcula precisión solo sobre objetivos.

Inconsistencia localizada por código: primer CASI no incrementa KanjiStudyProgress.totalFailures; una repetición CASI sí, al recibir `recordPracticeAttempt(rating === 'good')`. No convertir esas fuentes en una tasa histórica homogénea. No se cambió dato ni añadió un test en esta auditoría.

Frente a Vocabulario faltan sesión durable/consolidación explícita, resumen analítico equivalente, difíciles de sesión, historial individual y exploración por próxima fecha. No copiar todo: primero decidir objetivo de reconocimiento, escritura o lectura contextual. Los refuerzos antiguos no deben recibir snapshots FSRS inventados.

## 10. UX responsive, traducción y accesibilidad

Se observaron nueve configuraciones distintas: siete resoluciones, ambos temas y ES/EN/CA; a 320 px, los tres idiomas. No es un producto cartesiano de todas las combinaciones. **134 PNG únicos**: 90 estados principales, 35 selección/medallas/resultados/débiles/estadísticas y 9 de zoom real 125 %. Geometría en `.cache/kanji-audit/visual.json`, `extra-visual.json`, `zoom.json`. Son observaciones, no 134 tests de aceptación.

| Viewport / muestra | Fin valoraciones, px | Alto página revelada, px | Última opción inversa, px | Lado canvas Escritura, px |
| --- | ---: | ---: | ---: | ---: |
| 1920×1080 ES oscuro | 905 | 1080 | 1067 | 408 |
| 1536×864 EN claro | 900 | 954 | 1062 | 408 |
| 1366×768 CA oscuro | 895 | 949 | 1057 | 408 |
| 1280×720 ES claro | 893 | 947 | 1055 | 408 |
| 390×844 EN oscuro | 856 | 910 | 1177 | 318 |
| 375×812 CA claro | 825 | 879 | 1161 | 303 |
| 320×800 ES oscuro | 848 | 902 | 1149 | 248 |

Mediciones desde scroll 0, contenido aleatorio: no máximos universales. En la muestra CA 320 px, valoraciones a 1056 px. No se considera defecto el scroll natural del catálogo/listado.

Zoom real 125 %, ventana 1366×768: viewport CSS 1074×541; valoraciones a 889 px ES / 910 px EN y CA. Controles de escritura individual a 675 px y reinicio a 736 px. Requiere scroll para responder. Sin simulación CSS del zoom.

Sin overflow horizontal ni claves crudas en estados capturados. **138 claves** Kanji/escritura con ES/EN/CA presentes y placeholders iguales. No certifica calidad idiomática independiente.

Problemas observados: repetición de carácter/glosa al revelar, ficha larga antes de valorar, columna desaprovechada en portátil; lienzo inverso sin colapsar al continuar sin dibujo; cuatro opciones verticales en 320 px. Escritura individual tiene unos 248 px útiles en 320 px, sin demostrar insuficiencia física. Resultados duplica tiempo y anuncia Siguiente ronda aunque Aprender está bloqueado. Lecturas brutas largas desplazan la tarea.

Fortalezas: botones semánticos, foco visible, foco modal y alternativa sin dibujo. Mejoras posibles: pluralización «1 trazos», marcado `lang=ja` no sistemático, atajos de Escritura Kanji sin paridad con Kana. No se hizo auditoría WCAG, contraste, lector de pantalla o movimiento reducido. Emulación no sustituye dispositivos físicos/Safari.

## 11. Fallos demostrados y reproducciones

### K-01 — P0: sesión y escritura cruzan workspace

Abrir Aprender en perfil desechable; activar workspace sintético A e iniciar ronda; activar B, permitir render y responder SÍ. Persiste el sessionId anterior y se escribe `kanji:一:kanji-to-meaning` con un evento en `kana-study.workspace.audit-kanji-b.kana-study.kanji-progress.v1`.

También en Escritura: ronda iniciada en A conserva 中; Repetir en B escribe su WeaknessRecord en B. AttemptRecordingSession captura owner al empezar, mientras la debilidad guarda en activo: riesgo de dividir una respuesta entre propietarios.

Causa: KanjiSessionService.state y la ronda KanjiWritingPage no invalidan por owner/epoch. El reloj invalida su tiempo, pero no protege estas escrituras. StorageService elige destino al guardar. Evidencia: `functional-probes.json`, `extra-probes.json` en caché. Se invocó WorkspaceService real localmente; no se simula ni verifica login Supabase real.

### K-02 — P0: valoración perdida ante fallo de almacenamiento

Inyectar QuotaExceededError solo en setItem de progreso/eventos. SÍ resuelve y avanza: existe estado en memoria, pero registros persistidos null. Tras recarga siguen null. Se activa `persistenceFailed`; hay advertencia general, no fallo completamente silencioso.

recordReview cambia signals y hace dos escrituras no estrictas/atómicas. StorageService captura error; sesión no distingue éxito/fallo ni conserva intento durable de recuperación. Un fallo entre escrituras podría desalinear progreso/eventos: inferencia del orden, no segunda inyección parcial ejecutada. Evidencia: `functional-probes.json`, código de KanjiProgressService/StorageService. Pérdida demostrada bajo fallo local, no corrupción masiva observada.

### K-03 — P1: vencidos disponibles con inicio disabled

Reloj virtual: valorar 80 unidades Again, calcular panel con todos en futuro → due/ronda 0. Avanzar dos minutos → buildRound devuelve 10, pero stats.dueCount y roundSummary.roundSize siguen 0; botón real disabled. Causa: `new Date()` dentro de computed sin dependencia temporal; refrescar DailyLearningService no invalida estos computed. Due guardados correctos; proyección obsoleta. Evidencia: `extra-probes.json`. Sin modificar reloj de producción ni scheduler.

### K-04 — P1: desplazamiento necesario para evaluar

Tabla/capturas de sección 10: valoraciones a 893 px en viewport de 720 px y alrededor de 900 px con zoom que deja 541 px CSS. En inversa el canvas empuja opciones. Problema de composición, no de cálculos FSRS.

### Lo que no se declara error confirmado

Ronda única diaria, cuatro apariciones, refuerzo posicional, RUSH sin FSRS y trazado con guía son políticas explícitas. Costes pedagógicos requieren decisión de producto. Ambigüedad de glosas y prioridad de lecturas requieren revisión editorial. No hay base para borrar lecturas automáticamente.

## 12. Propuestas priorizadas

| Prioridad / propuesta | Impacto aprendizaje / UX | Complejidad / regresión | Dependencias / datos |
| --- | --- | --- | --- |
| P0 K-01: invalidación owner/epoch de sesiones/escrituras Kanji | Evitar atribución a otra cuenta | Media / medio-alto | Workspace; sin catálogo/auth nuevos |
| P0 K-02: confirmación durable recuperable e idempotente | Evitar perder valoraciones | Alta / alto; diseñar atomicidad primero | Persistencia Kanji; posible esquema local, no SQL cloud por defecto |
| P1 K-03: coherencia temporal panel/ronda | Acceder a vencidos reales | Baja-media / bajo | Proyección temporal; sin cambiar due históricos |
| P1 K-04: composición por altura y ancho | Responder sin scroll innecesario | Media / medio por componentes compartidos | Plantillas/SCSS Kanji; preservar dibujo/atajos |
| P1: decidir continuidad de repasos y bloqueo diario | Atender backlog/lapsos cortos | Media-alta / alto | Decisión de producto; no copiar cola Vocabulario |
| P1: lecturas contextualizadas y jerarquía | Evitar listas sin uso | Media / medio lingüístico | Revisor competente; ediciones por ID con fuentes |
| P2: métricas/historial por dirección | Comprender errores/programación | Media / medio | Definir CASI; proyecciones read-only |
| P2: difíciles/resultados, pluralización/lang/atajos | Recorrido y comprensión | Baja-media / bajo-medio | Reutilizar flujos tras aprobar alcance; ES/EN/CA |
| P3: audio u otros modos | Utilidad no demostrada aquí | Variable / riesgo de alcance | Fuera de primeras entregas; sin proponer reconocimiento |

No se recomienda cambiar el motor FSRS, reprogramar históricos o ampliar catálogo como primera entrega.

## 13. Roadmap propuesto, no implementado

| Fase | Objetivo / módulos | Dependencias y pruebas | Riesgos / aceptación |
| --- | --- | --- | --- |
| K0 — integridad | K-01/02; KanjiSession, KanjiWriting, KanjiProgress, contratos Storage/AttemptRecorder | Convertir reproducciones en regresiones: A→B→A/Guest, cuota/guardado parcial, recarga/reintento/doble respuesta | Diseñar persistencia antes de cambiarla; cero escrituras ajenas, pérdidas o duplicados; mismas valoraciones y FSRS |
| K1 — disponibilidad | K-03 y mensajes de bloqueo; KanjiProgress, portada/start/resultados | Due antes/en/después, medianoche Madrid/DST, backlog; decisión separada de política diaria | Panel y buildRound coherentes sin recargar; cambios de política requieren aprobación |
| K2 — estudio compacto | KanjiPlay/Write, estilos propios; reutilizar canvas | Siete tamaños, 125 %, ES/EN/CA/temas; dibujo/atajos/ayudas/resets | No revelar antes ni perder dibujo; acordar visibilidad por estado, no prohibir todo scroll |
| K3 — pedagogía contextual | Catálogo/generador, fichas/ejemplos | Revisión lingüística documentada por ID; formato nuevo solo si necesario | IDs/orden/progreso conservados; referencias completas y sin lectura única inventada |
| K4 — entender progreso | KanjiAll/resultados/proyecciones y acceso a difíciles | Históricos incompletos, vacío, objetivos/self, 7/30/90, workspace | Mostrar desconocidos sin inventar snapshots; sin eventos nuevos ni memoria recalculada |

Primero K0 y K1. K2 puede diseñarse mientras se acuerda política, sin ocultar problemas de integridad. K3 requiere revisión lingüística; K4 después de estabilizar lo principal. Cada fase necesita alcance aprobado independiente.

## 14. Evidencias, validación y limitaciones

Todo bajo `.cache/kanji-audit/`, ignorado por Git: `catalog.json`, `source-check.json`; `functional-probes.json`, `extra-probes.json`; `pointer-probes.json`; `visual.json`, `extra-visual.json`, `zoom.json`, `compact.log`; 134 PNG. Los archivos permiten inspeccionar evidencias, sin depender de una afirmación de estabilidad absoluta.

- `tests.log`: **113/113**, 14 archivos de Kanji, rondas/opciones/selección/persistencia/medallas/escritura, débiles, RUSH y canvas.
- `stats-tests.log`: **65/65**, 5 archivos de intentos, integración, analítica, histórico y límite diario. Total: **178/178**, 19 archivos.
- `build.log`: build normal Pages correcto, `npm run build -- --base-href /kana-study/`; inicial mostrado por Angular 748,67 kB. Seis warnings SCSS existentes fuera de Kanji; sin ampliar presupuestos.

Comandos de pruebas:

```text
npm test -- --include='src/app/**/*kanji*.spec.ts' --include='src/app/core/services/weakness.service.spec.ts' --include='src/app/core/services/learn-weakness-integration.spec.ts' --include='src/app/core/services/rush-session.service.spec.ts' --include='src/app/shared/components/kana-writing-canvas/kana-writing-canvas.spec.ts'
npm test -- --include='src/app/core/services/attempt-analytics.spec.ts' --include='src/app/core/services/attempt-integration.spec.ts' --include='src/app/core/services/learning-analytics.service.spec.ts' --include='src/app/features/stats/historical-stats.spec.ts' --include='src/app/core/services/japanese-glyph.service.spec.ts' --include='src/app/core/services/daily-learning.service.spec.ts'
```

No existe spec separado `japanese-glyph.service.spec.ts`; ese glob no aporta casos. No se afirma cobertura inexistente. La escritura se contrasta con los demás specs y pruebas de recursos/puntero.

No se ejecutó suite Angular completa ni TS app/spec en esta auditoría sin cambios de código; no se reutilizan resultados antiguos como nuevas ejecuciones. Scripts de observación no son una suite de aceptación. Edge/Chromium, perfiles desechables y táctil emulado: pendientes Safari, dispositivos/lápiz físico, lector de pantalla, concurrencia entre pestañas y todas las averías de red. Supabase bloqueado: sin Auth/RLS reales ni cuentas privadas. Revisión humana independiente de glosas/frecuencia pendiente; coincidencia de fuente no la sustituye.

Los pendientes antiguos de logout de Gramática y scheduler de Mazos siguen fuera de alcance, sin repararlos.

### Incidencia adicional de Más durante la auditoría

El usuario informó que en producción solo abrían Kana/Conjugaciones. En perfiles nuevos funcionaron los diez enlaces visibles de `https://carlospuyana.github.io/kana-study/#/more`, sin errores JavaScript; también con la configuración pública publicada y Supabase bloqueado. El usuario confirmó que Ctrl+Shift+R resolvió el fallo. Compatible con una pestaña que conservaba archivos de la versión anterior; no se capturó su error original, por lo que no se atribuye a un chunk/hash concreto. No se modificaron rutas, datos ni producción. Evidencia local: `more-production*.json`/logs.

Único cambio versionable: este informe. No se implementa ninguna fase.

## Anexo — Catálogo por ID

Extraído sin modificar datos. Glosas literales, no lista nueva de respuestas ni certificación lingüística. Lecturas completas en el catálogo fuente y `catalog.json`.

| ID | Significados ES | EN | CA | Ejemplo | Lectura de palabra | Tipo / objetivo |
| --- | --- | --- | --- | --- | --- | --- |
| 一 | uno | one | un | 一つ | ひとつ | kun / ひと |
| 七 | siete | seven | set | 七つ | ななつ | kun / なな |
| 万 | diez mil | ten thousand | deu mil | 一万 | いちまん | on / マン |
| 三 | tres | three | tres | 三つ | みっつ | kun / みっ |
| 上 | arriba · encima | above · up | dalt · sobre | 上げる | あげる | kun / あ |
| 下 | abajo · debajo | below · down | baix · sota | 下げる | さげる | kun / さ |
| 中 | medio · interior | middle · inside | mig · interior | 中学校 | ちゅうがっこう | on / チュウ |
| 九 | nueve | nine | nou | 九つ | ここのつ | kun / ここの |
| 二 | dos | two | dos | 二つ | ふたつ | kun / ふた |
| 五 | cinco | five | cinc | 五つ | いつつ | kun / いつ |
| 人 | persona | person | persona | 人 | ひと | kun / ひと |
| 今 | ahora | now | ara | 今 | いま | kun / いま |
| 休 | descansar | rest | descansar | 休む | やすむ | kun / やす |
| 何 | qué | what | què | 何 | なに | kun / なに |
| 先 | antes · anterior | ahead · previous | abans · anterior | 先生 | せんせい | on / セン |
| 入 | entrar | enter | entrar | 入る | はいる | kun / はい |
| 八 | ocho | eight | vuit | 八つ | やっつ | kun / やっ |
| 六 | seis | six | sis | 六つ | むっつ | kun / むっ |
| 円 | yen · círculo | yen · circle | ien · cercle | 百円 | ひゃくえん | on / エン |
| 出 | salir · salida | exit · go out | sortir · sortida | 出る | でる | kun / で |
| 分 | parte · minuto | part · minute | part · minut | 分かる | わかる | kun / わ |
| 前 | antes · delante | before · front | abans · davant | 前 | まえ | kun / まえ |
| 北 | norte | north | nord | 北 | きた | kun / きた |
| 十 | diez | ten | deu | 十 | じゅう | on / ジュウ |
| 千 | mil | thousand | mil | 千 | せん | on / セン |
| 午 | mediodía | noon | migdia | 午後 | ごご | on / ゴ |
| 半 | mitad | half | meitat | 半分 | はんぶん | on / ハン |
| 南 | sur | south | sud | 南 | みなみ | kun / みなみ |
| 友 | amigo | friend | amic | 友達 | ともだち | kun / とも |
| 右 | derecha | right | dreta | 右 | みぎ | kun / みぎ |
| 名 | nombre | name | nom | 名前 | なまえ | kun / な |
| 四 | cuatro | four | quatre | 四つ | よっつ | kun / よっ |
| 国 | país | country | país | 国 | くに | kun / くに |
| 土 | tierra · suelo | earth · soil | terra · sòl | 土 | つち | kun / つち |
| 外 | exterior · fuera | outside | exterior · fora | 外 | そと | kun / そと |
| 大 | grande | big | gran | 大きい | おおきい | kun / おお |
| 天 | cielo | heaven · sky | cel | 天気 | てんき | on / テン |
| 女 | mujer | woman | dona | 女 | おんな | kun / おんな |
| 子 | niño · hijo | child | infant · fill | 子ども | こども | kun / こ |
| 学 | estudio · aprender | study | estudi · aprendre | 学校 | がっこう | on / ガク |
| 小 | pequeño | small | petit | 小さい | ちいさい | kun / ちい |
| 山 | montaña | mountain | muntanya | 山 | やま | kun / やま |
| 川 | río | river | riu | 川 | かわ | kun / かわ |
| 左 | izquierda | left | esquerra | 左 | ひだり | kun / ひだり |
| 年 | año | year | any | 年 | とし | kun / とし |
| 後 | después · detrás | after · behind | després · darrere | 後 | あと | kun / あと |
| 日 | día · sol | day · sun | dia · sol | 日 | ひ | kun / ひ |
| 時 | tiempo · hora | time · hour | temps · hora | 時 | とき | kun / とき |
| 書 | escribir | write | escriure | 書く | かく | kun / か |
| 月 | mes · luna | month · moon | mes · lluna | 月 | つき | kun / つき |
| 木 | árbol · madera | tree · wood | arbre · fusta | 木 | き | kun / き |
| 本 | libro · origen | book · origin | llibre · origen | 本 | ほん | on / ホン |
| 来 | venir | come | venir | 来る | くる | kun / く |
| 東 | este | east | est | 東京 | とうきょう | on / トウ |
| 校 | escuela | school | escola | 学校 | がっこう | on / コウ |
| 母 | madre | mother | mare | 母 | はは | kun / はは |
| 毎 | cada | every | cada | 毎日 | まいにち | on / マイ |
| 気 | ánimo · sensación | spirit · feeling | ànim · sensació | 天気 | てんき | on / キ |
| 水 | agua | water | aigua | 水 | みず | kun / みず |
| 火 | fuego | fire | foc | 火 | ひ | kun / ひ |
| 父 | padre | father | pare | 父 | ちち | kun / ちち |
| 生 | vida · nacimiento | life · birth | vida · naixement | 生きる | いきる | kun / い |
| 男 | hombre · varón | man · male | home · mascle | 男 | おとこ | kun / おとこ |
| 白 | blanco | white | blanc | 白い | しろい | kun / しろ |
| 百 | cien | hundred | cent | 百 | ひゃく | on / ヒャク |
| 聞 | oír · escuchar | hear · listen | sentir · escoltar | 聞く | きく | kun / き |
| 行 | ir | go | anar | 行く | いく | kun / い |
| 西 | oeste | west | oest | 西 | にし | kun / にし |
| 見 | ver | see | veure | 見る | みる | kun / み |
| 話 | hablar · conversación | speak · talk | parlar · conversa | 話す | はなす | kun / はな |
| 語 | idioma · palabra | language · word | llengua · paraula | 日本語 | にほんご | on / ゴ |
| 読 | leer | read | llegir | 読む | よむ | kun / よ |
| 車 | coche · vehículo | car · vehicle | cotxe · vehicle | 車 | くるま | kun / くるま |
| 金 | oro · dinero | gold · money | or · diners | お金 | おかね | kun / かね |
| 長 | largo · jefe | long · leader | llarg · cap | 長い | ながい | kun / なが |
| 間 | intervalo · espacio | interval · space | interval · espai | 時間 | じかん | on / カン |
| 雨 | lluvia | rain | pluja | 雨 | あめ | kun / あめ |
| 電 | electricidad | electricity | electricitat | 電車 | でんしゃ | on / デン |
| 食 | comer · alimento | eat · food | menjar · aliment | 食べる | たべる | kun / た |
| 高 | alto · caro | high · expensive | alt · car | 高い | たかい | kun / たか |
