# Vocabulario frente a Mazos

Base, fuentes y fórmulas: [arquitectura](01-ARQUITECTURA-FSRS.md).
Resultados numéricos: [simulaciones](03-INTERVALOS-Y-SIMULACIONES.md).

| Aspecto | Vocabulario | Mazos |
| --- | --- | --- |
| Unidad de memoria | Palabra y dirección de pregunta | Entrada dentro de cada mazo |
| Comienzo | Primera respuesta de ronda normal | Primera valoración después de revelar |
| Nuevas | Due primero, luego nuevas; ronda de 10, evita repetir palabra si puede | Cuota predeterminada 10/día, orden de entradas estable |
| Selección de antiguas | Due exacto ISO ≤ ahora | Review por fecha Madrid; Learning/Relearning por instante |
| Antiguas atrasadas | Motor usa t desde lastReview, no la fecha prevista como si se hubiera estudiado | Igual; prioriza Review por recuperabilidad estimada |
| Repetición interna | Máximo 4 apariciones; solo primera cambia FSRS | Cada valoración de estudio actualiza FSRS; pasos pueden adelantarse ≤20m al quedar vacía la cola |
| Otro estudio el mismo día | Nueva ronda normal bloqueada tras completar; práctica no cambia FSRS | Permite pasos y Review pendientes aunque termine la introducción diaria |
| Predicción visible | No hay intervalo en los botones de Vocabulario | Ramas Again/Good visibles tras revelar |
| Retención/fuzz | 90 %, sin fuzz | Ajuste por mazo, fuzz activo |
| Graduación/recuperación | Intervalo calculado por biblioteca | Mañana Madrid, conservando memoria calculada |
| Práctica libre | Sin programación FSRS | `DeckIntensiveSession`: circular, sin ratings ni persistencia FSRS |
| Guardado | Snapshot ISO y eventos before/after en localStorage | IndexedDB, fechas numéricas, evento detallado, transacción |

Ambos usan **el mismo motor y pesos**. Con misma tarjeta Review, fecha, retención 90 % y fuzz desactivado,
Again y Good coinciden exactamente: caso G y test permanente. Con configuración pública actual
no se exige igualdad: el mismo caso Good da 85 días en Vocabulario y 86 en Mazos por fuzz.
En graduación/reaprendizaje divergen incluso sin fuzz por la regla de mañana. Con historias creadas
por cada cola, además divergen sus instantes y S: no basta con que la palabra escrita sea la misma.

## Botones y aprendizaje

| Pantalla / botón ES | Rating real | Efecto |
| --- | --- | --- |
| Vocabulario autoevaluación: NO (1) | Again=1 | Reconoce olvido; reduce S, sube D; vuelve a paso corto |
| Vocabulario autoevaluación: CASI (2) | Hard=2 | Se interpreta como recuerdo difícil, no olvido; sube D y puede aumentar S en Review |
| Vocabulario autoevaluación: SÍ (3) | Good=3 | Recuerdo correcto; D baja ligeramente y S suele crecer si transcurrieron días |
| Vocabulario opciones: acierto/error | Good=3 / Again=1 | La corrección de opción elegida hace la valoración objetiva |
| Mazos: OTRA VEZ (1) | Again=1 | Nueva/Learning 1m; Review/Relearning 10m; lapse solo al salir de Review |
| Mazos: BIEN (2) | Good=3 | Nueva 10m, graduación/recuperación mañana, Review calculado por motor |

No hay Easy=4 en estas interfaces, ni Hard en Mazos. Las teclas no son números de rating:
la tecla 2 de Mazos es Good=3. Definiciones en `progress.model.ts`, `deck-study.model.ts` y los templates.
No se usa la velocidad de respuesta para convertir Good en Easy.

**CASI es ambiguo:** FSRS Hard significa que se recordó con esfuerzo. Si no se recordó antes de revelar,
Again es la señal adecuada. Marcar CASI porque se reconoció la respuesta después puede sobreestimar la memoria.
La simulación F de una Review consolidada da Hard 63→107→159 días: Hard no promete intervalos breves.
En cambio Hard repetido durante Learning permanece en ~6m. Las repeticiones internas de una misma ronda
normal de Vocabulario no producen cinco actualizaciones: F representa invocaciones independientes del motor,
no cinco pulsaciones efectivas de una única ronda. La tabla diaria representa mejor el uso normal.

## Puyi y personalización

`puyi.model.ts` define `mazo-puyi` como mazo público con los mismos defaults que Japanese 1500.
El catálogo remoto aporta palabras/fotos; no determina S/D de alumnos ni ejecuta FSRS en Supabase.
`DeckPersistenceRouter` lo dirige al mismo almacenamiento de progreso que Japanese 1500, separado por deckId.
La autorización editorial RLS/RPC no confiere acceso a un historial FSRS común. Las entradas eliminadas
se filtran de la cola activa sin reescribir el histórico guardado.
Custom comparte `DeckSchedulerService`, pero usa su repositorio y configuración; no hereda la memoria
de Japanese 1500 por compartir expresión/lectura. El workspace cambia la base local y los servicios invalidan
su lectura. No se activan transportes cloud custom en esta auditoría.

## ¿Coincide el tiempo visible con el guardado?

En Mazos la misma rama calculada al revelar se guarda al pulsar, con due desplazado al instante de respuesta.
Se conservan sus S/D/intervalo y el fuzz no se vuelve a lanzar. Los minutos se muestran según diferencia
de timestamps; Review según `scheduledDays`. La graduación muestra **Mañana**, no 24 horas.
`formatStudyInterval` redondea meses a 30 días y años a 365; no modifica la fecha almacenada.
La tarjeta puede volver antes de la hora nominal en su día Review o adelantarse ≤20m durante Learning:
la cifra visible representa la programación, no una espera mínima garantizada por la cola.

Al dejar la respuesta abierta varios días, el snapshot congelado no recalcula memoria con el nuevo t.
Es un defecto de vigencia documentado con reproducción en [hallazgos](04-AUDITORIA-Y-MEJORAS.md).
No hay una predicción visual comparable en Vocabulario: atribuirle los meses de los botones de Mazos
confundiría dos pantallas distintas. Su snapshot sí contiene el intervalo calculado y se prueba su restauración exacta.
