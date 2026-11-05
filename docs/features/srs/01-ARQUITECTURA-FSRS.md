# Arquitectura real de FSRS

Auditoría de lectura y simulación: 04/11/2026, base Git `0a61adff148abb6573fb0a2ba769bccd91cf2eb5`.
No se modifican producción, pesos, retención, datos, SQL ni fechas de usuarios.
Continuar con [comparación](02-VOCABULARIO-VS-MAZOS.md), [simulaciones](03-INTERVALOS-Y-SIMULACIONES.md),
[hallazgos y validación](04-AUDITORIA-Y-MEJORAS.md) y [guía sencilla](05-GUIA-PARA-EL-USUARIO.md).

## Motor y configuración comprobados

`package.json` permite `ts-fsrs ^5.4.2`; el lock y la instalación auditada resuelven **5.4.2, FSRS-6.0**.
El script falla expresamente si cambia esa versión, para no presentar resultados de otro motor como equivalentes.
No hay entrenamiento personal ni optimizador de pesos conectado a estos dos módulos.

Los 21 pesos, en orden `w[0]…w[20]`, son:

```text
[0.212,1.2931,2.3065,8.2956,6.4133,0.8334,3.0194,0.001,
 1.8722,0.1666,0.796,1.4835,0.0614,0.2629,1.6483,0.6014,
 1.8729,0.5425,0.0912,0.0658,0.1542]
```

| Parámetro | Vocabulario | Mazos: Japanese 1500, Puyi, custom |
| --- | --- | --- |
| Servicio | `SpacedRepetitionService` | `DeckSchedulerService` |
| Retención | 0,90 fija | 0,90 predeterminada, configurable por mazo/workspace |
| Pasos iniciales | Predeterminados: 1m, 10m | Explícitos: 1m, 10m |
| Reaprendizaje | Predeterminado: 10m | Explícito: 10m |
| Corto plazo | Activado | Activado |
| Fuzz | Desactivado por defecto de biblioteca | Activado por token Angular |
| Intervalo máximo solicitado | 36.500 días | 36.500 días |
| Graduación y recuperación | Resultado de biblioteca | Due a próxima medianoche Madrid y `scheduledDays=1`; conserva S/D |

En Mazos la interfaz ofrece 80/85/90/95/97 %. `DeckSettingsService.save` admite cualquier número
finito estrictamente entre 0 y 1; el lector del almacenamiento no vuelve a validar esos ajustes.
Esto es una superficie de validación a revisar, no evidencia de preferencias corruptas reales.
10 nuevas/día y orden mixto son los defaults de Japanese 1500 y Puyi. La cuota y el orden no son pesos FSRS.
Custom utiliza su definición y ajustes propios. Una retención distinta afecta a cálculos futuros, no reescribe por sí sola todo el calendario.

## Variables y decisiones matemáticas

S es estabilidad en días: tiempo estimado para que el recuerdo baje al 90 %. D es dificultad modelada
entre 1 y 10. R es una probabilidad estimada para un instante, no un porcentaje de aciertos observado
ni un campo de memoria que deba acumularse. `reps` cuenta actualizaciones del motor; `lapses` fallos
desde Review, no todos los intentos de práctica.

Los siguientes contrastes independientes están en `srs-audit.spec.ts` y `scripts/srs-audit/runner.ts`.
Se ejecuta el motor auténtico; las ecuaciones solo sirven como oráculo de comprobación.

Con `f = 0.9^(-1/w20)-1`, la curva es `R=(1+f*t/S)^(-w20)`.
El intervalo teórico objetivo es `I=S*(r^(-1/w20)-1)/f`. A r=0,90 equivale a S antes de los ajustes.
La inicialización usa `S0=w[G-1]` y `D0raw=w4-exp((G-1)*w5)+1`, guardando `clamp(D0raw,1,10)`.
Por eso una primera respuesta Good parte de S=2,3065 y D≈2,1181, aunque el paso mostrado sea 10 minutos.

La nueva D aplica amortiguación `delta=-w6*(G-3)`, `damped=D+delta*(10-D)/9`,
y reversión `clamp(w7*D0raw(4)+(1-w7)*damped,1,10)`. La biblioteca usa el objetivo bruto
en esa reversión y acota el resultado; no debe sustituirse por la D inicial ya acotada de una tarjeta Easy.
La recuperación correcta tras días usa
`S'=S*(1+exp(w8)*(11-D)*S^(-w9)*(exp(w10*(1-R))-1)*h*e)`;
h=w15 solo para Hard y e=w16 solo para Easy. En los demás casos valen 1.
Tras olvido, se calcula `w11*D^(-w12)*((S+1)^w13-1)*exp(w14*(1-R))`,
limitado también por `S/exp(w17*w18)` con corto plazo activo.
En corto plazo se usa `S'=S*exp(w17*(G-3+w18))*S^(-w19)`;
para G≥2 el multiplicador no puede bajar de 1. No conviene sustituir esto por fórmulas de FSRS-4/5.

El código instalado redondea estados a ocho decimales y acota S a [0,001,36.500].
`next_interval` redondea días, aplica límites y fuzz. En Review se ordenan Hard/Good/Easy,
con Good al menos Hard+1; **no siempre basta con redondear S**. Esto opera aunque la UI oculte Hard/Easy.
El límite máximo tiene una excepción upstream comprobada: en saturación, esa ordenación puede producir
Good=36.501; véase el hallazgo de baja prioridad en [auditoría](04-AUDITORIA-Y-MEJORAS.md).

## Estados y tiempo

New=0, Learning=1, Review=2, Relearning=3. Nueva Again→Learning 1m; nueva Good→Learning 10m.
En Review, Again aumenta lapses, reduce S y pasa a Relearning 10m. Fallos durante Relearning mantienen
ese paso sin sumar otro lapse. Good avanza los pasos y finalmente vuelve a Review.
Hard inicial da 6m por redondear la media 1m/10m, y no equivale a reconocer que se ha olvidado.

`abstract_scheduler.init` calcula t por **diferencia de fechas UTC** (`dateDiffInDays`), no por horas completas.
`FSRS.get_retrievability`, en cambio, usa horas completas/24 truncadas. Es una discrepancia verificable
de diagnóstico y ordenación, no una conversión de días a meses. Los due de la biblioteca suman milisegundos
(día=86.400.000), independientes de la zona del ordenador.
La aplicación usa Europe/Madrid para cola diaria y graduación, incluso en otro huso del navegador.
`nextLocalStudyDayStart` respeta días de 23/25h; los intervalos largos conservan duración en días de 24h.

## Flujos y almacenamiento

Todas las rutas de código siguientes son relativas a `src/app/`.

**Vocabulario:** `features/vocabulary-play/vocabulary-play.page` →
`core/services/vocabulary-session.service.ts` (`answerQuick`/`rate`/`register`) →
`VocabularyProgressService.recordReview` → `SpacedRepetitionService.review` → `fsrs.next` →
guardar snapshot y evento before/after. Identidad `vocab:<entryId>:<questionType>`.
ISO en `kana-study.vocabulary-progress.v1` y `kana-study.vocabulary-review-events.v1` mediante `StorageService`.
Este añade el prefijo del workspace y genera operaciones legacy de outbox cuando corresponde.
El estado se restaura como snapshot; no se vuelve a inferir S contando todos los AttemptEvent.
Solo la primera aparición de una unidad en una ronda normal reprograma; las repeticiones posteriores
actualizan contadores. Práctica libre no reprograma. Una ronda normal por día Madrid puede dejar
el paso de 10m vencido hasta el día siguiente: un due es elegibilidad, no una promesa de presentación.

**Mazos:** `features/anki-study/anki-study.page` (`reveal`, `rate`, `intervalLabel`) →
`DeckStudyService.preview/rate` → `DeckSchedulerService.preview/branch` → `fsrs.repeat` →
política de mañana y serialización → `DeckPersistenceRouter.bind` → repositorio correspondiente.
Revelar congela ambas ramas; pulsar guarda esa misma rama, anclando due/lastReview a la hora de respuesta.
No hay una segunda tirada de fuzz al pulsar. El tiempo de respuesta se registra limitado a 10s para
estadísticas, **no es un parámetro del motor**.

Japanese 1500 y Puyi usan `DeckDatabaseService`: IndexedDB `kana-study-decks` por workspace,
clave `[deckId,entryId]`, stores progreso/eventos/estado diario. `commitReview` guarda los tres en
una transacción y luego encola operaciones. `undoReview` restaura exactamente `cardBefore` o borra
la introducción nueva y retira su evento; no recalcula un estado aproximado. Custom enruta a
`CustomDeckRepository`, con journal, confirmación y revisión propios; conserva el mismo scheduler.
`deck-study-serialization.ts` convierte fechas a epoch-ms y viceversa sin cambiar S/D.
El `fsrsLog` de biblioteca describe la memoria anterior: su intervalo no tiene por qué coincidir
con `dueAfter`; el evento de aplicación conserva ambos estados. No es un bug que el log sea distinto.

## Históricos, sincronización y límites de la revisión

`study-progress-validation.ts` acepta snapshots válidos, incluso contenido desactivado; añade
`learningSteps=0` en memoria si falta en registros compatibles antiguos. No recalcula fechas antiguas.
No restringe todos los rangos semánticos D/S ni coherencia estado-fechas: posible endurecimiento futuro.
`sync-merge.ts/mergeProgressSnapshots` elige por `fsrs.lastReview` y une contadores por máximo,
sin sumar estabilidad; eventos se reconcilian por ID. `DeckDatabaseService.mergeFromCloud` elige
el snapshot con lastReview más reciente y hace put por ID para eventos. No supone un repaso nuevo.
Backups conservan snapshots y eventos; no hay optimización de pesos durante restauración.
Los eventos de Mazos guardan retención, pero no identifican todos los pesos/versiones de cada cálculo:
reconstruir exactamente historiales de motores anteriores requiere ese contexto externo.

El aislamiento es **workspace + mazo + entrada**: el contenido público Puyi no comparte la memoria de
sus estudiantes. Guest pertenece al perfil/origen local; no equivale a una cuenta individual si se comparte navegador.
Las pruebas de la suite cubren workspace/undo/backups/sync; no se accedió a cuentas o datos personales ni se validó Supabase Auth real aquí.

Kana/Kanji/Flags también inyectan `SpacedRepetitionService`. Escucha y escritura independientes de
Vocabulario registran intentos/debilidades desde sus páginas, sin llamar a `recordReview` ni actualizar
este snapshot FSRS. Tampoco un AttemptEvent es, por sí solo, un repaso programado.
Manga Saved FSRS utiliza otro scheduler
con pesos congelados FSRS-6 y Again/Good, sin graduación propia a mañana. Gramática/RUSH y práctica
intensiva de Mazos no deben interpretarse como actualizaciones FSRS de estos mismos historiales.

## Fuentes primarias

Consultadas el 04/11/2026; para resultados exactos manda el tag instalado, no la wiki cambiante:

- [Algoritmo del tag 5.4.2](https://github.com/open-spaced-repetition/ts-fsrs/blob/v5.4.2/packages/fsrs/src/algorithm.ts).
- [Defaults e inicialización](https://github.com/open-spaced-repetition/ts-fsrs/blob/v5.4.2/packages/fsrs/src/default.ts).
- [Scheduler corto y orden de ramas](https://github.com/open-spaced-repetition/ts-fsrs/blob/v5.4.2/packages/fsrs/src/impl/basic_scheduler.ts).
- [Tiempo UTC y unidades](https://github.com/open-spaced-repetition/ts-fsrs/blob/v5.4.2/packages/fsrs/src/help.ts).
- [Especificación FSRS-6 y versiones previas](https://github.com/open-spaced-repetition/awesome-fsrs/wiki/The-Algorithm).
