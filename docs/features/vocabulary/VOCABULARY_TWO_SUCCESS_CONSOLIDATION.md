# Vocabulario: consolidación con dos aciertos consecutivos

Entrega local del 07/11/2026 sobre `d681be57dcc09e2e6ecbe716c3dc6a38633642c0`. Sin commit, push, despliegue, migraciones SQL ni acceso a datos personales. Conserva los cambios previos sin commit y los dos commits de Mazos.

## Selección fija, práctica limitada al contenido

Se conserva el [selector diario de 10/15 palabras](VOCABULARY_SHORT_DAILY_LESSONS.md): predeterminado 10, objetivos 7 repasos+3 nuevas o 10+5, redistribución flexible, calendario Madrid, orden por vencimiento y desempate estable, una plaza por `entryId` y una dirección por palabra. No se modifica el builder ni la configuración. Las direcciones adicionales siguen su política limitada, separada de las palabras realmente nuevas.

La composición no crece durante la lección. El número de respuestas sí puede superar 10/15: **no se establece un máximo de intentos que complete automáticamente una palabra**. Mazos conserva su sistema intensivo independiente.

## Racha y ejemplos completos

Cada palabra nueva de contrato V2 empieza con racha 0. SÍ incrementa; NO y CASI reinician a cero. En opciones, acierto incrementa y error reinicia. Solo racha 2 completa la palabra.

| Respuestas | Rachas sucesivas | Intentos reales | Eventos FSRS |
|---|---|---:|---:|
| SÍ → SÍ | 1 → 2 | 2 | 1: Good inicial |
| SÍ → NO → SÍ → SÍ | 1 → 0 → 1 → 2 | 4 | 1: Good inicial |
| NO → CASI → SÍ → SÍ | 0 → 0 → 1 → 2 | 4 | 1: Again inicial |
| CASI → SÍ → CASI → SÍ → SÍ | 0 → 1 → 0 → 1 → 2 | 5 | 1: Hard inicial |

Por ejemplo, 部屋 nueva con NO recibe Again, mantiene el `due` real a un minuto y sigue pendiente de consolidación. SÍ posterior deja racha 1 y el siguiente SÍ racha 2. Estas dos respuestas posteriores no cambian ni vuelven a escribir el progreso FSRS o su historial. Para nuevas Hard y Good se conservan igualmente los 6/10 minutos del motor actual. En palabras ya estudiadas se usa su snapshot real, sin imponer esos intervalos ni cambiar parámetros.

La palabra completada sale de la cola aunque su repaso continúe programado hoy. «Completada» significa terminar esta práctica, no memorización definitiva. La elegibilidad de otro día se calcula desde la programación guardada.

## Cola interna determinista

Se utiliza una **cola circular FIFO de palabras pendientes**, inicialmente con el orden equilibrado del selector. Al responder:

1. Se retira la palabra de la cabeza.
2. Se actualizan racha, contadores y estado.
3. Si aún no está completada, se añade al final; si se completó, no se reinserta.
4. Se presenta la nueva cabeza, sin consultar `due`.

Con tres pendientes se obtiene A,B,C,A,B,C; con dos, A,B,A,B; con una, A,A. Con más palabras se presenta una vuelta completa antes de repetir: respeta la separación de dos alternativas cuando siguen disponibles y conserva la primera presentación equilibrada. Si otras palabras se completan, dejan de ser alternativas y la separación se adapta a las que quedan. Cada pendiente aparece una vez por vuelta, por lo que no se bloquea ninguna. No existen empates aleatorios ni bucles de búsqueda; el orden inicial y las operaciones FIFO determinan todos los turnos. No se usa el sistema de mezcla de Mazos.

## Primera respuesta FSRS, intentos posteriores

`SessionItem.attempts===0` determina si corresponde la primera valoración. No se añade un booleano redundante. Se conservan `initialRating`, conteos NO/CASI/SÍ y dificultad de sesión; se añade `consecutiveCorrect` solo para Vocabulario V2.

La primera respuesta válida guarda una transición real y un `VocabularyReviewEvent`, marcado `lessonVersion:2`. Las posteriores usan `recordInternalAttempt`: no llaman al motor ni escriben los contenedores canónicos de progreso/eventos. Cada acción confirmada, incluida la inicial, lleva un `AttemptEvent` con ID estable `sessionId:vocabulary:learn:ordinal`, procedencia objetiva/autoevaluada y `firstAttempt` verdadero únicamente en la primera respuesta de esa palabra.

Los contadores de memoria FSRS siguen reflejando valoraciones reales; los intentos completos se consultan en Stats V2 y en la lección, no se mezclan con los repasos programados. Se conserva la actualización habitual de debilidades para cada respuesta; RUSH no consulta ese histórico global para decidir las difíciles de esta sesión.

## Journal, recuperación y aislamiento

Se amplía **el journal existente**, sin crear un segundo sistema de persistencia:

- Primera respuesta: snapshot, evento FSRS, intento y recibo de lección.
- Práctica interna: intento y recibo; sin snapshot ni evento FSRS.

La intención se escribe estrictamente antes de aplicar sus partes. La lista durable de intentos pendientes se conserva para Stats V2; el repositorio IndexedDB ya deduplica por ID. Solo se publica el nuevo estado en pantalla cuando termina la escritura del recibo. Si falla, se muestra Reintentar y no se avanza ni se muestra una racha no confirmada. La recuperación completa la intención con las mismas identidades y sin otra valoración. Si falla antes de persistir la intención, la acción no se considera confirmada; reintentar puede calcular de nuevo esa transición todavía no guardada, pero nunca añade dos eventos.

El contrato `version:2` conserva composición, dirección, ID/modo, rachas, intentos, conteos, primeras respuestas, completadas, tiempo confirmado y `pendingKeys`, que es la cola de pendientes ya rotada. La cola es el dato necesario para recuperar exactamente el siguiente turno. El repositorio valida identidades, contadores, rachas y correspondencia exacta de pendientes; rechaza regresiones, cambios de composición y conflictos de un mismo ordinal. No concede otra lección si hay datos corruptos.

Recargar después de responder en opciones puede omitir el feedback ya confirmado, pero conserva la racha y el siguiente turno. El tiempo confirmado se restaura sin acreditar la ausencia. El feedback hasta Continuar sigue contando dentro del límite existente por aparición. No se modifican reglas compartidas de tiempo.

Se mantiene el aislamiento por workspace y revisión de activación; A→B→A conserva cada selección y evita aplicar acciones de la activación anterior. La composición es local al navegador/workspace, no una cuota coordinada entre dispositivos.

## Finalización, resumen y RUSH

La lección termina al quedar vacía su cola: todas las palabras V2 alcanzaron 2/2. Nueve completas y una a 1/2 no finaliza. Se conserva una lección normal al día, la reanudación y la política de medianoche: completar primero la selección pendiente y cerrar también el día de finalización.

El resumen mantiene palabras distintas, completadas, intentos, NO/CASI/SÍ, porcentaje por primera respuesta, tiempo y listado. Añade valoraciones FSRS iniciales y palabras que necesitaron más de los dos intentos mínimos. Cada palabra del listado muestra su primera respuesta y sus intentos. El contador de la cabecera representa completadas, con etiqueta accesible y tooltip traducidos. No aparecen explicaciones técnicas ni vencimientos de repeticiones durante el ejercicio.

RUSH de toda la sesión y de difíciles conservan su mecanismo y tokens. NO/CASI/error fijan la dificultad de esa palabra dentro de la sesión aunque luego complete su racha. RUSH no modifica FSRS; una lección con solo aciertos mantiene su estado vacío de difíciles.

## Compatibilidad histórica y transición

La clave de almacenamiento existente se mantiene; el contenido lleva versión. Las lecciones V1 ya completadas quedan intactas. Al reanudar una V1 incompleta, se guarda una transición V2 antes de presentar preguntas:

- Las palabras que V1 ya daba por completadas mantienen ese estado mediante `legacyResolvedKeys`, con racha 0: **no se inventan dos aciertos históricos** ni se vuelven a valorar.
- Las palabras sin responder empiezan con racha 0 y siguen la consolidación V2.
- Se conserva ID, orden, configuración, contadores, modo, tiempo, snapshot y eventos. No se reinicia el día.

Un journal V1 pendiente se recupera antes de transicionar. Si falla la transición, no se presenta una sesión nueva y el contrato anterior sigue recuperable. Los eventos antiguos no se anotan retroactivamente ni se reconstruyen; la marca `lessonVersion:2` solo se escribe en nuevos eventos iniciales. Las sesiones antiguas sin composición durable conservan sus resúmenes y eventos originales. La práctica voluntaria compatible y el RUSH original conservan sus propias reglas.

## Archivos de esta fase

- Modelos `vocabulary-lesson.model.ts`, `learning-session.model.ts`, `vocabulary-study.model.ts`: versión, cola, excepción histórica, racha y marca de evento.
- `vocabulary-lesson.repository.ts`: validación, transición y protección de recibos.
- `vocabulary-review-store.ts`: journal compartido para valoración inicial y práctica interna.
- `vocabulary-progress.service.ts`, `vocabulary-session.service.ts`: primera valoración, intentos, FIFO, consolidación y resumen.
- Página de Vocabulario y lista presentacional compartida: notas opcionales por palabra; Kanji no las recibe y mantiene su vista.
- ES/EN/CA y dominio de estudio generado: textos diferidos y accesibles.
- Pruebas de sesión, repositorio, tiempo, debilidades, lista, pantalla e integración; Playwright de lecciones y FSRS/RUSH.
- Este documento, guía de lecciones cortas e índice documental.

No se modifican Mazos, motores FSRS, Japanese 1500, gates, workflows, SQL, backup ni protocolo cloud. Se preserva el árbol anterior sin reset, clean ni checkout destructivo.

## Validación

Validación del 07/11/2026 sobre el código final:

- Angular completo: **2451/2451**, 234 archivos (`full-second.log`).
- TypeScript app/spec correctos (`ts-app.log`, `ts-spec.log`).
- Builds GitHub Pages normal/candidato correctos, ambos con `/kana-study/`. Inicial **747.061 / 747.947 bytes**, estrictamente por debajo de 750.000 (`build-normal.log`, `build-candidate.log`, `bundle-audit.log`). Conservan los cinco avisos SCSS de la entrega previa: cuatro de Gramática y Vocabulario con 8.280 bytes frente al umbral de aviso de 8.000. No se elevan presupuestos.
- Playwright de consolidación: **15/15**, ES/EN/CA, escritorio oscuro, móvil claro y 320 px oscuro (`playwright-verified.log`). Incluye opciones, rachas reiniciadas, fallo de escritura interna y reintento, cuatro completas/tres 1/2/tres 0/2 tras recarga, tamaño 10/15 y ausencia de contenido de relleno.
- Auditoría FSRS: **67 transiciones correctas**; equivalencia, logs, serialización, UTC y DST Madrid (`srs-audit.log`).
- Auditoría de bundle/medios, separación de entradas normal/candidata y áreas protegidas: correcta. Despliegue total generado normal/candidato **150.211.576 / 150.211.331 bytes**; los medios estáticos existentes no forman parte del inicial.
- ES/EN/CA: mismas claves y placeholders, dominios generados exactos (`i18n.log`).
- Fuentes idénticas a las utilizadas en las validaciones, HEAD conservado, staging vacío, motores FSRS/Mazos/datos/gates/workflow/SQL intactos (`integrity.log`). `git diff --check` y whitespace de archivos sin seguimiento correctos.

La primera suite completa detectó cuatro expectativas de integración que todavía completaban la lección con una respuesta. Se sustituyó esa cobertura por finalización real de dos aciertos, manteniendo las comprobaciones de tiempo, debilidades, lista, contadores y escrituras. En Playwright, la primera ejecución pasó 13/15: el aviso general de almacenamiento interceptaba Continuar en dos tamaños tras el fallo simulado. El recorrido corregido cierra ese aviso con su botón nativo después de Reintentar; no usa force, no desactiva el aviso y no cambia producción. La ejecución completa posterior pasa 15/15.

Evidencias ignoradas por Git en `.cache/vocabulary-consolidation/`. Capturas `study-*`, `results-*`, `settings-*` en los tres perfiles. Revisados visualmente resultados de escritorio oscuro, móvil claro y 320 px oscuro, con notas por palabra, contadores y botones sin desbordamiento. Regresiones finales:

- FSRS/RUSH de sesión **15/15** (`session-rush-final.log`): toda la sesión/difíciles, memoria intacta antes/después de RUSH, retorno, vacíos y tokens inválidos.
- Mazos **33/33** (`deck-regression.log`): cola, programación, historial, undo, resumen y fechas.
- Atajos RUSH originales **33/33** (`rush-shortcuts-regression.log`): Kana, Kanji y las cuatro direcciones de Vocabulario.
- Total de las cuatro suites Playwright: **96/96**, sin reintentos automáticos ni timeouts ampliados.

Al adaptar el helper de finalización de las pruebas RUSH se introdujo una llamada recursiva accidental. Se detuvo esa ejecución, se corrigió el helper y la suite completa posterior pasó 15/15; fue un error de prueba, sin cambios correctivos en producción.

- Tests dirigidos finales: **236/236**, 21 archivos (`directed-final.log`): Vocabulario, builder, configuración, repositorio, recuperación, sesión, selección, pantalla, Stats, Daily Study, tiempo, debilidades y lista. Incluyen 45 escenarios de sesión y 8 de repositorio/configuración.
- Regresión Manga candidato: **3/3** (`manga-regression.log`), con SDK controlado y datos de prueba. No equivale a Supabase Auth real. Los smoke opcionales Firefox/WebKit no se ejecutaron por falta de sus binarios y no se cuentan como aprobados.
- Auditoría documental de enlaces y manifiesto de movimientos: correcta (`docs-audit.log`).

Comandos principales desde la raíz:

```powershell
npm test
npx tsc -p tsconfig.app.json --noEmit
npx tsc -p tsconfig.spec.json --noEmit
npm run build -- --base-href /kana-study/ --stats-json
npm run build:manga-candidate
npx playwright test --config playwright.vocabulary-short-lessons.config.ts
npx playwright test --config playwright.vocabulary-fsrs-rush.config.ts
npx playwright test --config playwright.deck-learning.config.ts
npx playwright test --config .cache/vocabulary-fsrs-rush/rush-edge.config.ts
node --import ./.cache/deck-daily-queue/edge-audit-loader.mjs scripts/audit-manga-candidate.mjs
node scripts/audit-srs.mjs
node scripts/audit-kaishi-media.mjs
node scripts/audit-repo-docs.mjs --links-only
git diff --check
```

Las dos referencias dentro de `.cache` son adaptadores Edge locales existentes, ignorados por Git; no cambian las pruebas ni el producto. TEMP/TMP de las pruebas Angular apuntan a `.cache/vocabulary-consolidation/tmp` para evitar el problema EPERM del temporal del entorno documentado en la fase anterior. Las suites se ejecutan en procesos independientes y sin Playwright en paralelo con Angular.

## Limitaciones

- No hay exclusión mutua nueva entre pestañas ni coordinación del límite diario entre dispositivos. Se mantienen el alcance local y las limitaciones previas.
- Es posible necesitar muchos intentos; se permite salir y reanudar, sin completar artificialmente por un límite.
- En una transición V1, las completadas heredadas son una excepción explícita al requisito nuevo; exigirles dos respuestas adicionales alteraría una finalización ya confirmada.
- Safari, dispositivos físicos y Supabase Auth/RLS real no quedan validados por pruebas locales Chromium/SDK controlado.
- El almacenamiento local conserva sus límites y errores recuperables; no se borra historial para liberar espacio.
