# SCHEDULER-1 — política vigente de Mazos

Implementación local del 28 de octubre de 2026. Sustituye las reglas de cola y graduación de [la referencia histórica](DECK_SCHEDULER.md), conservada como documento trasladado con hash de higiene. Base de trabajo: `6ea575dbbd6695dac7e151fb824d62550c88a14a`. Sin commit, push ni despliegue.

## Transiciones

Motor `ts-fsrs` 5.4.2, short term activado, pasos `1m,10m`, reaprendizaje `10m`, pesos oficiales, retención configurable y fuzz conservados. Dos respuestas: Otra vez = Again (1), Bien = Good (3).

| Estado anterior | Otra vez | Bien |
| --- | --- | --- |
| Nueva | Learning paso 0, 1 min | Learning paso 1, 10 min |
| Learning paso 0 | Learning paso 0, 1 min | Learning paso 1, 10 min |
| Learning paso 1 | Learning paso 0, 1 min | Review mañana |
| Review | Relearning, 10 min | Intervalo oficial FSRS |
| Relearning | Relearning, 10 min | Review mañana |

“Mañana” significa el comienzo del siguiente día Europe/Madrid. Se calcula por calendario, también en días de 23/25 horas. Solo graduación/recuperación cambia `due` y `scheduledDays=1`; estabilidad, dificultad, reps, lapses y log previo permanecen oficiales. No se reprograman tarjetas existentes al abrir la aplicación.

La previsualización se calcula una vez al revelar. Al responder se conserva esa misma rama, incluido fuzz, y se ancla su intervalo a la hora real de la respuesta (`lastReview`, `reviewedAt`, `fsrsLog.review`). Si se cruza medianoche, “mañana” corresponde al día de la respuesta. No se inventa una respuesta en el vencimiento futuro. Los campos de memoria representan el cálculo congelado al revelar, sin un segundo cálculo FSRS.

## Cola, cupo y cierre

1. Learning/Relearning vencidos primero, por vencimiento e ID como desempate.
2. Review atrasados o de hoy, desde medianoche Madrid, sin esperar la antigua hora. Se conserva prioridad de riesgo FSRS y desempate por vencimiento/ID.
3. Nuevas y Review conservan la preferencia antes/después/mezcladas.
4. Solo cuando no queda trabajo listo, se adelanta el Learning/Relearning más próximo, dentro de 20 minutos inclusive y debido hoy. No se adelanta Review ni un paso de mañana.

El cupo cuenta IDs introducidos distintos, no respuestas. Repeticiones no consumen otra plaza. Las tarjetas pendientes fuera de la ventana generan espera, no nuevas extra ni cierre diario. Los pasos que cruzan medianoche pertenecen al día siguiente y no se adelantan desde el anterior.

Una marca histórica `completedAt` conserva su registro y los IDs introducidos: bloquea nuevas introducciones, pero no oculta Review elegible ni aprendizaje válido. `completedToday` es un valor derivado que exige ausencia de trabajo existente para hoy. El aumento explícito del cupo permite reabrir nuevas; deshacer reabre el día y restaura el snapshot original. No hay migración masiva ni cambios de IDs o formato FSRS.

## Persistencia y consumidores

Se mantienen transacciones IndexedDB, snapshots, controles de propietario, recibos idempotentes custom y journal original. El repositorio custom permite continuar trabajo existente pese a una marca histórica, manteniendo la comprobación de progreso obsoleto. El validador de backup reproduce estas operaciones y admite los registros antiguos con su resultado histórico, sin reescribirlos ni programar durante restauración.

Estudio, listado y estadísticas separan aprendizaje listo y pendiente. Daily usa el mismo snapshot, incluye adelantos disponibles sin duplicarlos en el contador y conserva espera pendiente. Home no tiene otro contador de Mazos: enlaza al listado y al plan Daily. Profile conserva sus cálculos: el primer Bien ahora contribuye a Learning, no Review.

La pantalla de estudio refresca al entrar en la ventana, vencer, cambiar de día o volver a primer plano. Una tarjeta activa y su preview permanecen intactos; solo cambian contadores. Los timers se limpian al destruir las pantallas. El reloj de respuesta existente pausa espera, guardados y pestaña oculta y conserva su límite de crédito por aparición.

Configuración explica las cuatro reglas en ES/EN/CA. No hay edición libre de pasos ni nuevos ajustes avanzados. Contenido Japanese 1500, Kana/Kanji/Vocabulario Aprender, Grammar, RUSH y Manga Saved FSRS no se modifican. Gates, sincronización legacy, SQL y custom cloud no cambian.

## Archivos modificados (33)

- `docs/INDEX.md`
- `docs/features/decks/SCHEDULER_1.md`
- `e2e/custom-decks-h1.spec.ts`
- `e2e/deck-scheduler.spec.ts`
- `src/app/core/models/daily-study.model.ts`
- `src/app/core/models/deck-study.model.ts`
- `src/app/core/services/custom-deck.repository.spec.ts`
- `src/app/core/services/custom-deck.repository.ts`
- `src/app/core/services/daily-study-planner.service.ts`
- `src/app/core/services/daily-study-planner.spec.ts`
- `src/app/core/services/daily-study-planner.ts`
- `src/app/core/services/deck-backup-contract.ts`
- `src/app/core/services/deck-backup.spec.ts`
- `src/app/core/services/deck-scheduler-policy.spec.ts`
- `src/app/core/services/deck-scheduler.service.spec.ts`
- `src/app/core/services/deck-scheduler.service.ts`
- `src/app/core/services/deck-study-time.ts`
- `src/app/core/services/deck-study.service.spec.ts`
- `src/app/core/services/deck-study.service.ts`
- `src/app/features/anki-settings/anki-settings.page.html`
- `src/app/features/anki-stats/anki-stats.page.html`
- `src/app/features/anki-stats/anki-stats.page.ts`
- `src/app/features/anki-study/anki-study.page.html`
- `src/app/features/anki-study/anki-study.page.spec.ts`
- `src/app/features/anki-study/anki-study.page.ts`
- `src/app/features/anki/anki.page.ts`
- `src/app/features/anki/components/deck-card/deck-card.html`
- `src/app/features/anki/components/deck-card/deck-card.spec.ts`
- `src/app/features/anki/components/deck-card/deck-card.ts`
- `src/assets/i18n/ca.json`
- `src/assets/i18n/core.generated.ts`
- `src/assets/i18n/en.json`
- `src/assets/i18n/es.json`

## Validación reproducible

Evidencias locales ignoradas en `.cache/scheduler1/` (logs y capturas); no forman parte del producto ni del commit.

- Dirigidos finales: **191/191**, 16 archivos. `npm test -- --include=src/app/core/services/deck*.spec.ts --include=src/app/core/services/custom-deck.repository.spec.ts --include=src/app/core/services/daily-study*.spec.ts --include=src/app/features/anki*/**/*.spec.ts --include=src/app/features/anki*/*.spec.ts`. Log `directed-final.log`.
- Suite Angular final: **2171/2171**, 209 archivos, `npm test`. Log `full-final.log`. La ejecución anterior también pasó (2170/2170, antes de añadir el último caso de backup histórico).
- Playwright final: **33/33**, tres proyectos Chromium (1280 oscuro, 390 claro, 320 oscuro), sin reintentos. `npx playwright test e2e/deck-scheduler.spec.ts e2e/custom-decks-h1.spec.ts e2e/deck-backup.spec.ts e2e/daily-study.spec.ts e2e/local-decks-auth.spec.ts --output=.cache/scheduler1/playwright-final-output`. Log `playwright-final.log`.
- TypeScript app y spec: correctos con `npx tsc -p tsconfig.app.json --noEmit` y `npx tsc -p tsconfig.spec.json --noEmit`.
- Build normal: `npm run build -- --base-href /kana-study/ --stats-json`, **737.698 bytes** iniciales. `node scripts/audit-local-deck-boundaries.mjs` correcto; log `normal-audit.log`.
- Candidato: `npm run build:manga-candidate`, **738.584 bytes** iniciales, estrictamente <750.000. Mantiene lazy loading y excluye fixtures, código manual y tests. Cuatro warnings SCSS conocidos en cada build; no se amplían presupuestos.
- Frontera: `node scripts/check-manga-release-budget-boundary.mjs` acepta 749.999, rechaza 750.000 y 750.001.
- Regresión Manga optimizada: `npm run test:manga-candidate`, **3/3** ES/EN/CA, incluye diccionario, FSRS/undo, backup/reinicio, restricción por cuenta y SDK Auth controlado. No prueba Supabase Auth real.
- `git diff --check`: correcto. Sin cambios en workflow, SQL, gates, dependencias ni contenido de estudio. HEAD original conservado.
- Documentación: `node scripts/audit-repo-docs.mjs --links-only`, correcto, sin documentos trasladados alterados.
- Revisión visual de capturas de Ajustes y estudio/espera, oscuro/claro; sin overflow en los tres tamaños.

Los tests de política usan el adaptador FSRS y la persistencia reales con IndexedDB aislada: diez introducciones y veinte reviews con 42 respuestas, frontera inclusiva de 20 min, waits, recarga, undo, fallos de escritura, recibos, cupo obsoleto y workspaces. Los tests de calendario cubren medianoche y los cambios de hora de marzo/octubre. Los consumidores tienen expectativas separadas de listo/pendiente. Backup cubre tanto nuevos undo que reabren el día como journals históricos que retenían su marca, sin reescribirlos.

La primera suite completa detectó dos expectativas relacionadas con esta política: Profile esperaba Review tras el primer Bien; aumentar el cupo introducía un null innecesario en completedAt. Se corrigieron sin relajar las comprobaciones de backup. La preparación inicial del nuevo Playwright congelaba el renderizado antes de arrancar Angular: se sustituyó por Date fija (y reloj que avanza en el escenario de espera), conservando las aserciones de intervalos y eventos.

## Comprobaciones manuales pendientes

Aceptación humana de textos y experiencia; Safari real y dispositivos físicos. Chromium automatizado no sustituye estas comprobaciones. No se ha usado una cuenta Supabase real ni validado un despliegue remoto en esta fase.
