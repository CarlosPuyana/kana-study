# Tiempo de estudio y anti-AFK V2

Entrega local del 9 de noviembre de 2026. Base revisada: `4140464`.
El árbol estaba limpio; los cambios anteriores de Conjugaciones y Más ya estaban
versionados. No se realizan commit, push, despliegue ni cambios/migraciones SQL.

## Funcionamiento anterior y auditoría

`src/app/core/services/card-study-time.ts` aplicaba `CARD_STUDY_LIMIT_MS = 10_000`
a cada aparición de tarjeta. Usaba `performance.now()` y acumulaba segundos enteros
al confirmar la aparición. `StudyClock` conectaba el motor con el componente
`StudyTimer`, escuchaba visibilidad y mantenía un intervalo cada 250 ms, incluso
cuando no había una tarjeta montada.

Había un segundo recorte a 10.000 ms al crear `DeckReviewEvent.elapsedAnswerMs` en
`DeckStudyService.rate()`, y otro en el validador local de eventos personalizados.
Aunque el nombre del campo sugiera latencia de respuesta, en este flujo contiene
el tiempo de estudio acreditado; Perfil lo suma como tal. No es un parámetro FSRS.

No se cambian otros valores de 10 segundos o 10.000: timeouts de acceso/HTTP, límites
de tarjetas nuevas, tamaños de contenido, paginación o importaciones.

## Nuevo presupuesto: 180 segundos por aparición

El máximo compartido pasa a **180.000 ms**. Se conserva un único presupuesto desde
que se presenta una tarjeta/pregunta hasta su confirmación. Revelar, abrir una regla,
consultar el contador, pausar o volver a la pestaña no lo reinicia.

| Tiempo activo observado | Tiempo acreditado |
| ---: | ---: |
| 5 s | 5 s |
| 10 s | 10 s |
| 25 s | 25 s |
| 60 s | 60 s |
| 120 s | 120 s |
| 179 s | 179 s |
| 180 s | 180 s |
| 181 s | 180 s |
| 240 s | 180 s |
| 300 s | 180 s |
| 600 s | 180 s |

El tope no termina el ejercicio, no revela, no responde, no cambia calificaciones y
no interviene en la programación. Una persona puede responder después de tres minutos;
solo el contador deja de aumentar para esa aparición. La siguiente pregunta recibe
su propio presupuesto. Una repetición posterior de la misma unidad también es una
nueva aparición, como antes. No es un máximo de toda la sesión.

Se preserva el redondeo anterior: se acumulan milisegundos internamente y se confirman
segundos enteros por aparición. Confirmar dos veces no acredita tiempo adicional.
Descartar una tarjeta, Deshacer y restaurar tiempos confirmados conservan su semántica.

## Visibilidad y recursos

`StudyClock` escucha `visibilitychange` y consulta `document.hidden`, equivalente al
estado de visibilidad de la página. Si la tarjeta empieza oculta no se crea un ancla
activa. Al ocultarla, se recoge el último intervalo visible, se conserva lo acumulado
y se detiene el heartbeat. Al volver se establece un ancla nueva, sin contar el hueco.

Ejemplo comprobado: **40 s visibles + 5 min ocultos + 20 s visibles = 60 s**.
Varias pausas no crean presupuestos adicionales. Se mantienen `pagehide`/`pageshow`
para navegación y ciclo de vida. No se añaden listeners de `blur` o pérdida de foco:
abrir un IME u otra ventana que no oculte la página no introduce una pausa nueva.

Solo existe un intervalo de 250 ms por reloj montado y activo. Attach/resume repetidos
son idempotentes. Pausar detiene el intervalo; detach, confirmar/descartar una aparición
y DestroyRef limpian los listeners y recursos. La siguiente aparición los vuelve a
crear cuando corresponde. Configuración, carga inicial y resultados no generan tiempo.

Las pausas explícitas de los flujos existentes, como guardar una respuesta o congelar
la latencia al revelar en Manga, siguen siendo pausas. Un evento de visibilidad no
deshace una pausa explícita. No se añade tiempo de feedback donde antes se excluía.

## Protección ante suspensión y saltos

El tiempo se mide con el reloj monotónico; `Date.now()` actúa como comprobación auxiliar.
Ambos son inyectables para tests. Cada muestra compara sus deltas:

- Delta monotónico negativo o no finito: no se acredita.
- Ausencia de muestras durante más de 5.000 ms: se descarta ese intervalo y se rebasa
  el ancla. Una suspensión sin evento de visibilidad no se convierte en estudio.
- Diferencia entre delta civil y monotónico mayor de 5.000 ms: se descarta la muestra.
  Esto cubre los sistemas donde el reloj monotónico se detiene durante suspensión.

**Los 5 segundos son una tolerancia entre muestras, no un límite por tarjeta ni un
temporizador de inactividad.** Con heartbeats normales, 40, 60 o 180 segundos continuos
se contabilizan completos aunque la persona no toque el teclado.

Es una política conservadora: un bloqueo largo del hilo visible también pierde ese
intervalo no observado. Pausas muy breves sin eventos y dentro de la tolerancia no
se distinguen perfectamente de actividad normal. No se promete detectar toda suspensión
física ni ofrecer medición de atención humana. Una página visible abandonada puede
acreditar hasta 180 segundos por aparición.

Referencias de las APIs y sus límites:
[performance.now(), MDN](https://developer.mozilla.org/en-US/docs/Web/API/Performance/now)
y [visibilitychange, MDN](https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilitychange_event).

## Módulos y significado de sus campos

| Flujo existente | Afectado | Persistencia/semántica conservada |
| --- | --- | --- |
| Kana, Kanji, Banderas | Sí | `CompletedSessionSummary.durationSeconds` al terminar; prácticas internas sin nuevo historial diario |
| Vocabulario | Sí | Duración confirmada de lección y resumen, conservación al reanudar, consolidación 2/2 intacta |
| Mazos Japanese 1500, Puyi y personalizados locales | Sí | `DeckReviewEvent.elapsedAnswerMs`, sumado por Perfil; mismo evento y snapshots FSRS |
| RUSH Kana/Kanji/Vocabulario | Sí | `RushSession.activeSeconds`; solo tarjetas completadas, sin contar la tarjeta pendiente al salir |
| Gramática: práctica, integración, repaso y ejercicios de lección | Sí | Sus puntos actuales de confirmación y sus fuentes existentes de duración |
| Manga: repaso contextual V3 y sesiones Saved FSRS | Sí | Duración de sesión; se conserva el congelado al revelar donde ya existía |
| Lector Manga continuo | No | `MangaReadingClock` tiene sus propias reglas de lectura, inactividad y diccionario; no usaba el tope de 10 s |
| Conjugaciones | Sí | Integración posterior: StudyClock por pregunta, contador de ronda y duración confirmada en siete buckets locales por workspace |
| Otras pantallas sin este contador | No | No se crean fuentes nuevas de tiempo |

Ni `AttemptEvent` ni los logs FSRS adquieren campos nuevos. Timestamps de respuesta,
fechas de revisión, due, retención, estado, intervalos, rachas, puntuaciones, orden de
preguntas, repetición y valoraciones no se modifican.

## Workspaces, navegación y recarga

El reloj captura `WorkspaceService.activationRevision()`. El valor mostrado deja de
pertenecer a la cuenta anterior inmediatamente, incluso A→B→A sin lectura intermedia.
Antes de operar o en el siguiente heartbeat se descartan sus acumulados y recursos.
Resume no puede liberar este bloqueo: hace falta un reset/restauración explícito de
una nueva ronda. Se preserva la asociación física con el componente montado.

Salir de una pantalla desmonta su temporizador. No se acredita tiempo posterior por
un intervalo o listener olvidado. Recargar no deriva tiempo del timestamp anterior.
Vocabulario restaura únicamente la duración ya confirmada de su lección, como antes.
Una sesión incompleta no se convierte automáticamente en una nueva sesión histórica.

## Historial, estadísticas, backup y sincronización

No hay migración ni recálculo. Los registros históricos se leen sin aplicar el nuevo
tope a su duración total. Las estadísticas siguen sumando las mismas fuentes.
Un resumen histórico de 1.325 s se conserva literalmente; añadir sesiones nuevas de
40 y 10 s produce 1.375 s, también tras recarga y pull obsoleto en los tests.

Los nuevos eventos de Mazos se recortan únicamente al crearse, mediante la constante
compartida. El validador local admite hasta 180.000 ms, para no romper el guardado,
el journal o el backup de mazos personalizados. Un test exporta/restaura íntegramente
un evento de 180 s. No se renombra el campo ni se cambian claves o versiones.

### Restricción SQL experimental pendiente

La tabla legacy `deck_review_events` guarda el payload y la clasificación suma su
`elapsedAnswerMs` sin el recorte de 10 s; el contrato legacy mantiene los nuevos tiempos.
Sin embargo, la validación de operaciones custom de
`supabase/migrations/202610220001_custom_decks_foundation.sql` todavía exige
`elapsedAnswerMs <= 10000`. Se ha identificado, **no modificado**.

`CUSTOM_DECK_SYNC_ENABLED` y `CUSTOM_REMOTE_UPLOAD_APPROVED` permanecen apagados.
Antes de habilitar ese cloud experimental será necesaria una tarea SQL autorizada
para alinear el contrato y sus tests reales. No se ocultan ni recortan los tiempos
locales para eludir esta incompatibilidad. No se han enviado datos a cuentas reales.

## Validación

Evidencias locales regenerables: `.cache/study-time-v2/`.

| Validación | Resultado |
| --- | --- |
| Dirigidos ampliados de reloj, páginas, sesiones y backup | 230/230, 17 archivos |
| Suite Angular completa final | 2654/2654, 249 archivos |
| Playwright anti-AFK dirigido | 15/15, escritorio oscuro, móvil claro y 320 px |
| Regresiones estáticas de Mazos | 33/33 |
| Regresiones estáticas de estadísticas de Vocabulario | 18/18 |
| Manga candidato | 3/3 en Edge Chromium con SDK/HTTP controlado |
| Auditoría matemática FSRS | 67 transiciones; UTC, DST Madrid, logs y serialización correctos |
| TypeScript app/spec | Exit 0 ambos |
| Builds normal y candidato | Correctos; sin cambiar presupuestos |
| Bundle inicial | Normal 748.669 bytes; candidato 749.555 bytes, ambos < 750.000 |
| i18n | Auditoría de Gramática y dominio de Conjugaciones correctos; no hay textos nuevos de producto |
| Enlaces de documentación y `git diff --check` | Correctos |

### Comprobación adicional de tests antiguos de scheduler

Se ejecutó también `e2e/deck-scheduler.spec.ts`: sus dos casos fallan en los tres
tamaños (6 fallos). El primero busca `.scheduler-policy` con el texto 20, un elemento
que ya no existe en los componentes de Ajustes del HEAD de partida. El segundo espera
que una tarjeta programada 40 minutos después quede pendiente; el contrato actual,
documentado en [cola diaria dinámica](../decks/DECK_DYNAMIC_DAILY_QUEUE.md), admite
las tarjetas programadas para hoy aunque todavía no haya llegado su hora.

Ambos fallan antes de la parte que simula la espera del reloj. Los archivos de cola,
elegibilidad, Ajustes y el propio spec no se modifican en esta entrega. No se alteran
esas reglas para recuperar las expectativas antiguas ni se omiten los tests. Queda
pendiente revisar ese fichero en su propio scope; **no se afirma que todos los tests
Playwright del repositorio estén verdes**. Las 33 regresiones actuales de Mazos y la
auditoría matemática FSRS sí pasan.

Se prueban 5/10/25/60/120/179/180/181/240/300/600 s con muestras controladas, límites
por aparición, varias pausas, inicio oculto, pagehide/pageshow, focus/IME sin pausa
agresiva, tiempos de guardado excluidos, confirmación doble, descartes y Deshacer.
También se comprueban recursos liberados, navegación, recarga, historial de otra
versión, presupuesto después de revelar, workspace A→B→A y suspensión con solo el
reloj civil avanzando o ambos avanzando.

Los tests de navegador usan reloj virtual y eventos de visibilidad controlados. La
calibración inicial pone a cero solo el reloj de una pregunta recién abierta en un
perfil de test; nunca se reinicia al revelar o pausar. No son una prueba física de
tapa de portátil ni sustituyen la aceptación manual de Safari/dispositivos reales.
En una comprobación visual de suspensión se deja un heartbeat de margen para el
refresco de mm:ss; los tests unitarios verifican las cantidades exactas sin ese margen.

Los tests antiguos que esperaban 10 s o 21 s para 4/15/7 se actualizan a la semántica
nueva: 15 s y 26 s. No se omiten ni se cambian pruebas de aprendizaje para ocultar
fallos. Los tests de tiempos simulan muestras periódicas, en lugar de hacer pasar un
salto sin heartbeats por lectura activa.

## Archivos

Producción: `card-study-time.ts`, `study-clock.ts`, `deck-study.service.ts` y
`custom-deck-validation.ts`, todos en `src/app/core/services/`.

Pruebas: motor, StudyClock nuevo, StudyTimer, flujos comunes, Kana/historial/sync,
sesiones Kana/Kanji/Banderas/RUSH/Manga, ejercicios de Gramática, página de Mazos,
backup y reconciliación. Se añade `playwright.study-time.config.ts` y
`manual-tests/study-time-v2/study-time.spec.ts`. Documentación e índice actualizados.

Los seis warnings SCSS existentes siguen presentes; no se cambia ningún estilo.
No se modifican gates, workflows, SQL, algoritmos de aprendizaje, FSRS, datasets,
autenticación ni traducciones anteriores. La restricción cloud custom indicada arriba
y la validación física de suspensión/Safari permanecen pendientes.
El índice incorpora además el enlace a la guía existente de verbos/fase 3, que el
auditor encontró sin acceso desde README. Su contenido y su implementación se conservan.

## Integración posterior: Conjugaciones (9 de noviembre de 2026)

Conjugaciones reutiliza `createStudyClock()` y el componente `StudyTimer`; no añade
intervalos, listeners ni otro motor. Cada pregunta empieza al mostrarse y se congela
al pulsar Comprobar o No lo sé. La regla no reinicia el presupuesto. Feedback y espera
antes de Siguiente no acreditan tiempo; la siguiente pregunta abre una aparición nueva.
El máximo es 180 segundos activos por pregunta, sin caducar ni bloquear respuestas.
Ocultar la pestaña pausa; volver conserva el presupuesto consumido. Se heredan la
protección de suspensión, pagehide/pageshow y la invalidación por revisión de workspace.

La escritura estricta de los contadores guarda también `durationSeconds` (suma conocida)
y `timedAttempts` (cobertura) en los siete buckets existentes: dos de adjetivos, cuatro
de verbos y mezcla. Conserva clave y versión v1, localOnly y separación de workspaces.
La ausencia de ambos campos significa tiempo histórico desconocido, nunca cero medido.
Al primer intento nuevo se añade solo su duración y cobertura 1; los intentos antiguos
siguen sin medición. No hay migración destructiva ni escritura al cargar. Los metadatos
de tiempo inválidos se descartan conservando los contadores válidos. Un cero con
`timedAttempts: 1` sí representa una respuesta medida por debajo de un segundo.

Un fallo de almacenamiento congela la primera duración para reintentar la misma
escritura atómica sin duplicar intentos ni añadir espera. Doble envío se ignora después
del éxito. Salir, recargar o cambiar A→B→A descarta la pregunta no confirmada y libera
el reloj. La duración confirmada persiste; una ronda nueva reinicia solo su contador.
No se añade SessionHistory global ni una segunda fuente de tiempo para Perfil/cloud.

El marcador muestra racha, récord, aciertos/errores y tiempo total de la ronda. Reutiliza
`studyTime.label` ES/EN/CA y sus roles accesibles. Grid de dos columnas en móvil y cuatro
en escritorio. No cambia respuestas, validador, 25 adjetivos, 50 verbos, 325 combinaciones,
FSRS, gates, sincronización ni SQL.

Archivos de producción: modelo `conjugation-practice.model.ts`, servicios
`conjugation-practice.service.ts` / `conjugation-stats.service.ts` y plantilla, componente
y SCSS de `conjugation-practice.page`. Tests de integración nuevos en
`conjugation-study-time.spec.ts`, navegador en `manual-tests/conjugations/study-time.spec.ts`
y `playwright.conjugations-time.config.ts`; expectativas de contadores actualizadas en
los specs de práctica, página, verbos y el navegador de adjetivos.

Validación adicional: 177/177 dirigidos, 2670/2670 Angular y TypeScript app/spec correctos.
Los resultados finales de navegador y bundles se registran más abajo. Las pruebas de
navegador utilizan reloj virtual y visibilidad controlada, con un heartbeat de margen
para refrescar el contador; las duraciones persistidas se verifican exactamente.
Los pendientes antiguos de scheduler y logout de Gramática descritos arriba permanecen
fuera del alcance, al igual que Safari físico y suspensión real del equipo.

### Resultado de la validación de Conjugaciones

- Dirigidos Conjugaciones + reloj compartido: **177/177** (12 archivos).
- Angular completo: **2670/2670** (250 archivos).
- Playwright Conjugaciones: **88/88**, siete tamaños/temas/idiomas, zoom real al
  125 % ES/EN/CA y ronda completa de 50 preguntas con reinicio.
- Regresión de estadísticas Vocabulario: **18/18**. TypeScript app/spec: correcto.
- Builds normal/candidato: correctos; inicial **748.669 / 749.555 bytes**.
  Conjugaciones continúa fuera del grafo inicial; margen del candidato: 445 bytes.
- Auditoría matemática FSRS: **67 transiciones** correctas. i18n Gramática y
  dominio Conjugaciones, enlaces documentales y `git diff --check`: correctos.
- Persisten los seis warnings SCSS previos, sin ampliar presupuestos.

Revisión visual de escritorio oscuro, móvil claro, 320 px oscuro y zoom al 125 %:
contador compacto, sin desbordamiento horizontal y con los controles de respuesta
visibles. Capturas y logs locales en `.cache/conjugations-time/` (no versionados).

Los primeros ensayos del nuevo navegador detectaron coordinación incorrecta entre
carga lazy, actualización de input, navegación a la misma URL y render con reloj
virtual detenido. Se corrigió el montaje de la prueba y se mantuvieron las aserciones
exactas de duración y aislamiento. También se detectó en la regresión compartida
que Deshacer esperaba un render posterior a la resolución IndexedDB: se añade un
paso virtual de 20 ms antes de comprobar que está habilitado. El evento conservó
180.000 ms y Deshacer lo eliminó una sola vez en los tres tamaños (**3/3**).
No cambia el código productivo de Mazos ni el reloj compartido.

Preservación: HEAD `4140464`, índice vacío; 22 archivos previos idénticos byte a byte.
Las dos excepciones son esta guía solicitada y el ajuste puntual de render del test
Anti-AFK compartido, cuya reversión en memoria reproduce el hash anterior. Datasets,
validador, SQL y workflows no cambian. No hay commit, push, despliegue ni SQL.

Cierre de regresión Anti-AFK compartida después del ajuste del test: **15/15**
Playwright (Kana, Mazos/Deshacer y RUSH, escritorio, móvil claro y 320 px oscuro).
El primer ensayo adicional se interrumpió tras reproducir la espera de render;
la ejecución final completa termina correctamente, sin reintentos configurados.
