# Historial de aprendizaje y almacenamiento contextual

Entrega local de 05/11/2026, sobre el trabajo sin commit de
[Por Tiempo y resumen](DECK_TIME_AND_LEARNING_SUMMARY.md). Se conservan esos cambios y la
[auditoría FSRS](../srs/01-ARQUITECTURA-FSRS.md). Sin publicación ni acceso a datos reales.

## Acceso y arquitectura

Tarjetas de cualquier mazo → abrir una palabra desde Todos o Por Tiempo → **Historial de aprendizaje**.
El detalle conserva palabra, lectura, significado, contexto y medios anteriores. Consultar el historial
no inicia estudio, no llama a `rate`, no calcula un próximo intervalo ni escribe en el repositorio.

`AnkiCardsPage` reutiliza `DeckScheduleReader`: lectura por `DeckPersistenceRouter`, con fence de
workspace/epoch y descarte por generación/recurso del componente. Todos solo lee progreso al abrir
el detalle; Por Tiempo aprovecha la lectura que ya necesita. Abrir/cerrar el detalle no recarga los
grupos de Por Tiempo ni destruye el botón al que debe volver el foco.

`deck-card-history.ts` es una proyección pura: filtra deckId/entryId, deduplica IDs efectivos y ordena.
`shared/components/deck-card-history/` presenta esa proyección sin conocer transporte ni escribir datos.
La lista empieza por el más reciente, con páginas de 20. El gráfico invierte esa página para mostrar
el crecimiento temporal de izquierda a derecha. Si disminuye la historia efectiva, se acota la página.
La paginación limita el DOM; el lector común sigue recuperando los eventos del mazo desde el repositorio
local. No es paginación de base de datos y no se ha medido rendimiento con historiales masivos de usuarios reales.
Se usan fecha real, contador previo registrado para desempatar el mismo milisegundo e ID como último
desempate determinista; un empate sin contador no acredita una secuencia temporal más precisa.

## Datos existentes y límites

El modelo `DeckReviewEvent` ya conserva: ID, mazo/entrada, reviewedAt, Again/Good, estados antes/después,
due antes/después, S y D antes/después, R de diagnóstico cuando existe, retención y cardBefore.
El `fsrsLog` es un log del estado **anterior**: su scheduledDays no es el intervalo posterior.
Los snapshots actuales contienen S, D, reps, lapses, scheduledDays, due y lastReview.

No se necesita una nueva tabla, campo obligatorio, migración local/SQL ni evento duplicado.
Los próximos repasos continúan registrándose por el mismo commit transaccional y protocolo existentes.
Se verifican guardado real de nuevas respuestas, reintento idempotente custom, undo y exportación del
backup sin cambiar su esquema estricto. No se modifican payloads de sincronización.

El historial no siempre es completo: se avisa si reps supera los registros disponibles, faltan fechas/estado,
hay registros no representables o la primera respuesta conservada no parte de New. Un historial vacío
con reps>0 muestra tanto la ausencia de eventos como el aviso de parcialidad. No se inventan respuestas.
Los datos avanzados históricos se muestran solo si existen; no se reconstruye S/D anterior desde la memoria actual.

No constan en todos los eventos el intervalo nominal posterior, la versión íntegra de parámetros,
la semilla de fuzz ni el instante original de cálculo de la R del preview. Se omiten esos datos o se
explica su falta; no se asigna retroactivamente FSRS-6 a todos los eventos antiguos.

## Qué representa el gráfico

**Espera programada al responder = dueAfter − reviewedAt**, solo con fechas válidas y diferencia no negativa.
Es una duración derivada de dos fechas registradas, no una reproducción del motor con parámetros actuales.
Por ejemplo, una graduación a mañana puede tener scheduledDays=1 y una espera real de doce horas.
El detalle distingue este valor, el intervalo nominal actual guardado y el tiempo restante desde ahora.
Las etiquetas humanas muestran días/horas/minutos; los milisegundos exactos están en Datos registrados
del repaso, junto a las fechas con segundos. No se redondea a meses en esta vista.

Las barras se basan únicamente en las esperas verificables. Su altura usa `log(1 + minutos)` para que
los pasos de minutos sean legibles junto a meses; la escala se anuncia explícitamente, con referencias
superior/inferior. Cada página tiene su escala, no debe compararse la altura entre páginas como escala fija.
No es un gráfico de memoria perfecta ni una estimación de dominio. Los colores distinguen Again/Good;
la lista textual equivalente ofrece orden, fecha, valoración, duración, próximo due y estado resultante.
No se añade librería de gráficos. Una página renderiza como máximo 20 registros y barras; el gráfico
puede desplazarse horizontalmente por teclado/móvil sin desbordar el documento. Sin intervalos verificables
no se dibuja una curva o barras ficticias.

## Detalles FSRS y fechas

El desplegable avanzado muestra memoria actual, reps/lapses FSRS y retención configurada por mazo/workspace.
Lapses cuenta fallos desde Review, no todas las equivocaciones de práctica. New/Learning/Review/Relearning
tienen descripciones comprensibles; Review no significa consolidación perfecta.

La R actual es una lectura con `forgetting_curve(default_w, dateDiffInDays(lastReview, now), S)` de
ts-fsrs 5.4.2, empleando la convención de fechas UTC de la actualización real del scheduler. Se indica
su fecha de cálculo y su carácter estimado. No modifica parámetros ni llama a `next/repeat`.
La R histórica se etiqueta como valor **registrado con el evento**, indicando la fecha del evento;
no se afirma que se calculó exactamente entonces: el preview pudo producirse antes y su timestamp no está guardado.
También se advierte la diferencia temporal documentada entre `get_retrievability` y el scheduler.

Las fechas visibles usan Europe/Madrid en ES/EN/CA. Las duraciones entre timestamps no se convierten
en diferencias de días de calendario: el cambio de otoño de 25h conserva exactamente 90.000.000ms.
La información actual se refresca con el reloj del detalle; no se reutilizan previews para mostrar due.
Las incidencias H1/H2/H3/H5 de la auditoría siguen pendientes: este historial no las corrige ni reescribe
sus resultados, solo permite observar los datos realmente guardados.

## Privacidad y sistemas existentes

Japanese 1500 y Puyi leen `DeckDatabaseService` en la base correspondiente al workspace. Puyi comparte
contenido público, no historial. El administrador editorial no obtiene permiso adicional en estas lecturas.
Custom usa el historial efectivo de `CustomDeckRepository` (canónico, excluyendo voided/undone), con journal
y recibos existentes. El historial no interpreta como respuestas nuevos recibos o reintentos.

Se revisó `202609300001_local_first_accounts.sql`: `deck_review_events` almacena payload y user_id,
con políticas own mediante auth.uid(). La fundación custom conserva entidades por user_id y lectura RLS
del propietario. No se añaden consultas públicas, RPC, políticas ni se ejecutan migraciones PostgreSQL/PGlite/Supabase.
La validación local no sustituye una prueba de Supabase Auth real: el navegador usa datos sintéticos y HTTP interceptado.
El aislamiento local se comprueba con los fences existentes de cambio de workspace, incluidos A→B→A.

## Aviso de almacenamiento

El aviso sigue siendo cierto para mazos personalizados: cloud/upload siguen apagados; el contenido y
progreso son locales al navegador/workspace. El backup vigente de custom cubre Guest, no los mazos
locales de cuentas. Login no cambia esto y cambiar de dispositivo no traslada automáticamente esos datos.
La sincronización legacy de Japanese 1500/Puyi no equivale a activar custom cloud.

La portada `/anki` muestra solo un enlace discreto **Personalizados: almacenamiento local · Información**,
condicionado a los mismos gates anteriores, sin un aside con todos los párrafos. Conduce a
`/settings?return=/anki#deck-storage`, abre el contexto de almacenamiento y permite volver a Mazos.
Allí se reutiliza íntegra la explicación según Guest/cuenta, incluyendo límites del backup y Guest-only.
Los avisos completos de rutas restringidas, perfil y backup, así como confirmaciones de restauración
y borrado, permanecen. No se eliminan traducciones que siguen usándose.

`LocalDeckNotice` añade variantes de enlace y disclosure sin cambiar su variante completa/compacta por defecto.
Se reutiliza `ModalFocusDirective` en detalles de ambas vistas y se incluyen summaries, excluyendo controles
ocultos dentro de details cerrados para no romper el ciclo de foco. ESC y retorno al origen permanecen.

## Archivos y pruebas

Fuentes nuevas: `core/services/deck-card-history.ts` y `shared/components/deck-card-history/`.
Integración: `features/anki-cards`, `features/anki`, `features/settings`, `shared/components/local-deck-notice`
y `shared/directives/modal-focus.directive`. Textos en los tres JSON y generados study/local.
Se preservan el resumen y la previsión de la entrega anterior, los datos editoriales y el scheduler.

Tests nuevos: proyección pura, componente/paginación/R, aviso contextual; integración custom con lector,
guardado/reintento/undo/backup. Navegador: `manual-tests/deck-learning/card-history.spec.ts` y ampliación
de los casos existentes para Puyi y el foco con el nuevo contenido. Evidencias en `.cache/deck-history/`.

Resultados ejecutados sobre esta ampliación:

| Validación | Resultado |
| --- | --- |
| Unitarios dirigidos iniciales, 4 archivos | 20/20 |
| Integración del lector, incluyendo custom/undo/reintentos/backup | 3/3 |
| Suite completa tras los cambios | 227 archivos, **2315/2315** |
| Suite completa final, con el caso adicional de historial incompleto y página reducida | 227 archivos, **2316/2316** |
| TypeScript app/spec `--noEmit` | Ambos exit 0 |
| Build normal `/kana-study/`, con stats | PASS; **747.078 bytes iniciales** |
| Build candidato y presupuesto estricto | PASS; **747.964 bytes iniciales < 750.000** |
| Playwright final sobre candidato optimizado | **24/24**, 40,3s; escritorio oscuro, móvil claro y 320px oscuro, ES/EN/CA |
| Repetición dirigida para capturas del gráfico/FSRS | **9/9**, 18,4s; son los mismos casos de historial, no nueve casos distintos adicionales |
| Auditoría SRS | 67 transiciones/asserts PASS, sin cambios del programador |
| Auditoría Kaishi/bundle | PASS; medios y componentes de estudio siguen diferidos |
| Documentación `--links-only` y `git diff --check` | PASS |

Se mantienen los cuatro warnings SCSS de Gramática conocidos. No hay script de lint en package.json.
TEMP/TMP de los procesos de tests se sitúan en `.cache/deck-history/tmp` por la virtualización del sandbox.
En el primer ensayo de navegador pasaron 18/21 casos: falló el retorno de foco del detalle de Por Tiempo,
porque la selección disparaba una lectura que retiraba del DOM el botón de origen. Se corrigió la dependencia
reactiva (Por Tiempo ya tenía los datos), conservando la comprobación de foco. La ejecución final pasa completa.
No se añadieron sleeps, retries, exclusiones ni timeouts para ocultar ese fallo.

Las capturas revisadas están en `.cache/deck-history/`: `history-chart-desktop-dark.png`,
`history-chart-mobile-light.png`, `history-mobile-light.png`, `history-fsrs-mobile-light.png`,
`main-narrow-dark.png` y `storage-mobile-light.png`, entre otras. Se verificó no desbordar el documento;
el desplazamiento horizontal se limita al propio gráfico cuando tiene muchas columnas.
No se afirma validación de Safari, dispositivos físicos, Supabase Auth real o RLS remoto mediante estas pruebas.
El script completo histórico de documentación conserva su baseline anterior y no se altera para forzar un PASS.

Para probar: iniciar el modo habitual del proyecto y abrir un mazo → Tarjetas → palabra → Historial de
aprendizaje. En el candidato Guest-only se reproduce el recorrido completo con
`npm run build:manga-candidate`, `npm run preview:manga-candidate` y la URL local que imprime el servidor.
Pruebas visuales reproducibles: `npx playwright test --config playwright.deck-learning.config.ts` (Edge instalado).
