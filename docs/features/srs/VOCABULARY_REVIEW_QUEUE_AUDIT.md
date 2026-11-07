# Auditoría de la cola de Vocabulario

> Actualización local 06/11/2026: la política diaria de Vocabulario queda sustituida por [lecciones cortas de 10/15 palabras](../vocabulary/VOCABULARY_SHORT_DAILY_LESSONS.md). El contenido siguiente conserva el diagnóstico y los resultados de su fase; no describe la cola normal vigente.

Política sustituida posteriormente por [FSRS diario y RUSH de sesión](../vocabulary/VOCABULARY_FSRS_RUSH_REDESIGN.md). Las reproducciones siguientes conservan las observaciones anteriores; las pruebas de cola se actualizan con regresiones de la nueva política autorizada.

Fecha: 06/11/2026. Base: `7cba37d67ec1b935ff7a1eb389d391a0fa6b89c2`.
Investigación local con datos sintéticos, sin acceso al historial del usuario.
No se modifican producción, FSRS, progreso, traducciones, sincronización ni gates.

## Conclusión

La reaparición temprana es reproducible. Hay dos colas con reglas distintas:
la selección inicial de la ronda respeta `due`; las repeticiones de refuerzo dentro
de esa ronda dependen de posiciones, no del tiempo. No son nuevas valoraciones FSRS.
Por tanto, el minuto NO es una espera mínima para volver a ver la palabra.

Es una decisión existente de sesión, comprobada además por el test previo
`VocabularySessionService > repeats Again sooner than Hard`, que exige la repetición
tras dos/cuatro preguntas. Es técnicamente deliberada, pero poco recomendable cuando
quedan otras tarjetas disponibles y se espera un recorrido temporal FSRS.
No se cambia sin aprobación: el encargo exige conservar decisiones de producto.
No hay evidencia de corrupción de fechas ni de un error segundos/milisegundos.

El caso literal 部屋 → 声 → 部屋 se reproduce con una ronda de dos unidades en cinco
segundos. En una ronda con más unidades pendientes, Again deja normalmente DOS
preguntas intermedias, no una. Sin el estado original de esa sesión no se puede
afirmar cuál era su tamaño, cola restante, dirección de pregunta o versión ejecutada.
Que existan otras palabras en el catálogo no implica que estén en la ronda actual.

## Configuración real y botones

Según lock, instalación y [auditoría anterior](01-ARQUITECTURA-FSRS.md):
`ts-fsrs 5.4.2`, FSRS-6.0, retención 90 %, sin fuzz en Vocabulario,
corto plazo activo, aprendizaje `1m / 10m`, reaprendizaje `10m`.

| Vocabulario | Rating | Nueva, primera respuesta | Repetición interna |
| --- | --- | --- | --- |
| NO | Again (1) | Learning, due +1 minuto | Reinserta tras 2 posiciones |
| CASI | Hard (2) | Learning, due +6 minutos | Reinserta tras 4 posiciones |
| SÍ | Good (3) | Learning, due +10 minutos | Resuelve la unidad, sin reinserción |

En Review, Again pasa a Relearning con +10 minutos; Hard/Good los calcula el motor
con la memoria previa. No equivalen a los intervalos de una tarjeta nueva.
En práctica rápida, error/acierto equivalen a Again/Good, y la reinserción ocurre
al pulsar Continuar, después de registrar la respuesta.
Solo la primera respuesta por unidad de una ronda normal modifica FSRS y crea
evento before/after. Las siguientes solo actualizan contadores de práctica.
La práctica libre no programa FSRS. Máximo cuatro apariciones por unidad.

Mazos tiene Otra vez/Again y Bien/Good; NO tiene CASI/Hard. Su política de cola,
predicciones y adelanto acotado no se trasladan a Vocabulario.
Ver [comparación](02-VOCABULARIO-VS-MAZOS.md).

## Selección y prioridad

1. `VocabularyProgressService.buildRound(now)` llama a `buildVocabularyRound`.
2. Parte de las unidades habilitadas por selección. Una unidad es palabra + dirección:
   distintas direcciones de una misma palabra tienen memorias independientes.
3. Incluye registros con `Date(due).getTime() <= now.getTime()`, por due ascendente.
   No existe prioridad especial Learning/Relearning por encima de Review.
4. Después incorpora nuevas sin registro, barajadas. Intenta elegir palabras distintas;
   las direcciones adicionales de una misma palabra se difieren hasta necesitar relleno.
5. Limita a diez unidades. No rellena con tarjetas futuras aunque la ronda quede pequeña.
   Empates de due conservan el orden de entrada de la ordenación estable.
6. `initialize` copia sus claves a una cola en memoria. NO reconstruye la ronda tras
   responder ni incorpora automáticamente el resto del catálogo.
7. `enqueue` inserta en `min(queueIndex + 1 + gap, queue.length)`, gap 2/4.
   Al final puede repetirse tras una sola pregunta o inmediatamente si no queda otra.
8. `advance` incrementa el índice. NO consulta `due`, el tiempo transcurrido,
   la prioridad FSRS ni las otras tarjetas elegibles fuera de esta cola.

No hay función temporal de adelantar Learning en este servicio. Su efecto aparente
es adelanto, pero el mecanismo real es práctica por posiciones, sin límite temporal.
Se puede repetir tanto antes como después de due. Esperar sesenta segundos no cambia
automáticamente la pregunta actual; hay que avanzar las posiciones de la cola.

Los due persistidos y los usados al construir la ronda son los mismos. Las
repeticiones internas no usan una segunda fecha equivocada: no usan fecha alguna.
ISO/UTC se compara en milisegundos absolutos. Europe/Madrid interviene en el bloqueo
diario, no en si ha transcurrido un minuto. Las pruebas cubren ambos cambios de hora
2026 y medianoche UTC, incluido el límite exacto de 59.999/60.000 ms.

## Presentación, guardado y ciclo de vida

El HTML actual de `VocabularyPlayPage` muestra NO/CASI/SÍ sin predicción de intervalos.
No se ha reproducido un texto «volverá dentro de 1 minuto» en esa pantalla. No se puede
atribuir ese detalle observado a esta versión sin evidencia adicional.
El temporizador de cabecera es tiempo de estudio activo, con un máximo acreditado
por aparición; no es un contador de espera FSRS ni una medida del tiempo de pared.

`recordReview` calcula y guarda inmediatamente due, lastReview, estado y evento.
Los refuerzos posteriores conservan exactamente ese snapshot, aunque se acierten.
Se verifica tras destruir/recrear TestBed: datos y eventos sobreviven sin recomputarse.
La sesión/cola NO se persiste y no se restaura al recargar; la página sin sesión
muestra el aviso correspondiente. Destruir la página llama a `clear()`.
Una nueva ronda antes del vencimiento excluye esa unidad.

No existe Deshacer de respuestas en este flujo de Vocabulario. `StudyClock.undo`
es una operación del reloj compartido, no una API de deshacer respuestas del servicio.
No se presenta ni se implementa una restauración de sesión o Undo inexistentes.

Una ronda normal completada bloquea otra ronda de Vocabulario ese día de Madrid.
Por ello una unidad Good con +10 minutos puede estar vencida después, pero no
accesible desde una segunda ronda normal ese día. Si se interrumpe antes de completar,
no se registra ese cierre diario. Este desacoplamiento ya figuraba como decisión
pendiente en [hallazgo H5](04-AUDITORIA-Y-MEJORAS.md).

## Reproducciones con el motor real

Prueba nueva: `src/app/core/services/vocabulary-review-queue-audit.spec.ts`.
Reloj `Date` simulado; no sleeps, reintentos ni timers falsos pendientes. Servicios
reales de sesión, progreso, almacenamiento, bloqueo diario y FSRS. El conjunto inicial
se acota a unidades sintéticas del catálogo y se fija el barajado usando el constructor
real; se sustituyen únicamente estadísticas de intentos, debilidades y medallas.
Esto no acredita una sesión personal ni añade trazas de producción.

En A/B/C/E, A identifica `vocab:n5-6wvtrn:japanese-to-meaning` del catálogo de prueba.
El caso literal usa `vocab:n5-jykdaw:japanese-to-meaning` (部屋) y
`vocab:n5-vxii86:japanese-to-meaning` (声), buscados por su expresión en el catálogo.
Todos los instantes de la tabla son UTC del 06/11/2026; estado previo New = sin registro.

| Caso | Estado previo / respuesta | Respuesta | Intervalo / due guardado | Siguiente aparición de A / diferencia |
| --- | --- | --- | --- | --- |
| A, diez alternativas iniciales | New / Again | 11:00:00 | 60 s / 11:01:00 | 11:00:05 / 5 s, quedan 8 elegibles al reconstruir |
| B, solo A | New / Again | 11:00:00 | 60 s / 11:01:00 | 11:00:00 / 0 s |
| Literal 部屋, 声 | New / Again | 11:00:00 | 60 s / 11:01:00 | 11:00:05 / 5 s |
| C, tiempo exacto | New / Again | 11:00:00 | 60 s / 11:01:00 | 11:01:00 / 60 s, después de avanzar dos preguntas |
| E, Good | New / Good | 11:00:00 | 600 s / 11:10:00 | No reaparece en esa ronda; sí es elegible a 11:10 |
| E, reaprendizaje | Review / Again | 11:00:00 | 600 s / 11:10:00 | 11:00:05 / 5 s; no recalcula FSRS |
| Hard | New / Hard | 11:00:00 | 360 s / 11:06:00 | 11:00:05 / 5 s, tras cuatro preguntas |

D verifica Review due −3s, Relearning −2s, Learning −1s, Learning futuro +1ms y
una nueva: ese es el orden de las tres vencidas seguido de la nueva; la futura se excluye.
Se comprueban snapshot original, rating, reviewedAt, due persistido, eventos únicos,
contadores y estados restaurados. Los errores de la primera ejecución del nuevo test
se debieron a un fixture Review construido manualmente con learningSteps de Learning;
se sustituyó por una Review obtenida con dos respuestas reales del motor. No se cambió producción.

## Alternativas y recomendación pendiente de aprobación

| Política | Beneficio | Inconveniente |
| --- | --- | --- |
| Conservar refuerzo por posiciones, explicándolo | Sin esperas; conserva ronda y estadísticas | Sigue repitiendo pronto incluso con alternativas |
| Diferir refuerzo futuro mientras queden otras elegibles | Cumple la preferencia expresada; evita repetición prematura innecesaria | Hay que definir elegibilidad dentro/fuera de ronda y cómo terminarla |
| Exigir due siempre | Espera real coherente con programación | Con una sola tarjeta puede bloquear 1–10 minutos; necesita salida y reanudación |
| Adelanto opcional y explícito solo al agotar alternativas | Evita espera forzosa sin prometer un minuto mínimo | Debe distinguir práctica de valoración FSRS y no contabilizar ambas como lo mismo |

Recomiendo diferir las repeticiones futuras mientras queden otras unidades elegibles.
Al agotarse, ofrecer finalizar/retomar después o un refuerzo anticipado explícito;
no mostrar «dentro de 1 minuto» como garantía si se permite practicar antes.
Para un recorrido FSRS temporal completo también habría que resolver el bloqueo diario
y especificar qué respuestas posteriores programan memoria. Cambiar solo `enqueue`
no resuelve ese contrato y puede dejar la ronda sin posibilidad de terminar.
No se han cambiado estas reglas, pesos, intervalos, retención ni historias.

## Validación

Archivos añadidos: este documento y `vocabulary-review-queue-audit.spec.ts`.
`01-ARQUITECTURA-FSRS.md` incorpora un enlace a esta investigación.
Ningún archivo de producción ni test previo modificado.

- Nuevas pruebas: 15 escenarios, incluidos los parámetros DST/medianoche y recarga.
- Dirigidos finales: 98/98 en ocho archivos: nueva auditoría, sesión Vocabulario,
  constructor de ronda, persistencia, auditoría SRS previa, bloqueo diario,
  página de Vocabulario y backup de Mazos. Los últimos 28 corresponden a backups;
  las pruebas directamente relacionadas con la investigación suman 70.
- Suite completa, primera ejecución: 2330 correctos y un timeout de 5000 ms en
  `deck-backup.spec.ts:107`, test de medición de rendimiento de 1/100/500 tarjetas.
  Se mantuvo intacto. Pasó posteriormente junto con los dirigidos y en la segunda
  suite completa. No se atribuye ese timeout a un defecto de Vocabulario ni se
  presenta una ejecución correcta posterior como garantía de estabilidad absoluta.
- Segunda suite completa: 2331/2331, 228 archivos, sin exclusiones ni reintentos
  configurados en el runner.
- TypeScript app y spec: correctos (`npx tsc -p tsconfig.app.json --noEmit` y
  `npx tsc -p tsconfig.spec.json --noEmit`).
- Build normal: correcto, `npm run build -- --base-href /kana-study/ --stats-json`.
- Build candidato de GitHub Pages: correcto, `npm run build:manga-candidate`;
  bundle inicial 747.964 bytes, estrictamente inferior a 750.000, sin código de pruebas.
  Ambos builds mantienen los cuatro warnings SCSS conocidos de Gramática.
  Sus auditorías previas de Gramática, traducciones y publicación Kaishi pasan.
- Auditoría de enlaces: correcta (`node scripts/audit-repo-docs.mjs --links-only`),
  después de enlazar este documento desde arquitectura. `git diff --check` correcto;
  también se comprobó whitespace en los dos archivos nuevos aún sin seguimiento.

No hay cambios visuales que verificar por tema ni se han ejecutado pruebas sobre
cuentas reales. La recarga se prueba recreando TestBed y leyendo localStorage, no
como aceptación manual de navegador. El caso personal exacto queda sin trazabilidad
histórica; sí se reproducen las reglas y los tiempos descritos con la implementación real.
Logs locales ignorados por Git: `.cache/vocabulary-queue/`.
Sin commit, push, despliegue, migraciones ni acceso a datos reales.
