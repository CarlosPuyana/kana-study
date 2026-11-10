# Kanji K1 — disponibilidad de repasos

09/11/2026. Base inicial `e89104b4e4ba8f119a4f90cd75f85e320084eb1b`, K0 presente
y árbol inicialmente limpio. K1 permanece local, sin commit, push, SQL ni despliegue.
Durante su cierre se atendió y publicó por autorización independiente el hotfix
de Vocabulario `ef67089`; ese commit no contiene cambios de K1.
El ajuste del test asíncrono de CI quedó en `b334e69`, también sin K1. Su
[workflow](https://github.com/CarlosPuyana/kana-study/actions/runs/42690262196)
completó tests, TypeScript, build, upload y deploy. En la web pública se verificó
el guardado de una respuesta de 30 segundos y Continuar con la misma lección,
un único evento FSRS y un perfil Guest desechable sin operaciones cloud.

## Causa de K-03

`KanjiProgressService.stats` y `roundSummary` son `computed`: consultaban la fecha
real pero solo dependían reactivamente de selección/progreso. El paso del tiempo
no invalida un `computed`. Una vez calculado cero, seguían mostrando cero,
aunque `buildRound(new Date())` ya encontraba unidades vencidas. El botón
heredaba el resumen obsoleto. No era un error del scheduler ni del due guardado.

## Actualización

`KanjiAvailabilityService` es lazy y solo trabaja mientras alguna vista monta
`KanjiAvailabilityNotice`. Comparte un único timeout entre portada, modal,
selección y resultados. Programa el mínimo entre el siguiente due futuro de
la selección y la próxima medianoche de Europe/Madrid. No añade polling.

El timeout actualiza una señal de tiempo compartida por estadísticas/resumen y
el aviso. Cambiar selección, progreso o revisión de activación vuelve a calcular
el plazo. Se reutilizan las funciones existentes de calendario de Madrid,
incluidos los días de 23 y 25 horas. El constructor de rondas conserva sus reglas
y consulta una fecha fresca al iniciar: no usa un reloj congelado para decidir.

Ocultar la pestaña suspende el timeout de K1; visibilitychange, focus y pageshow
recalculan con la fecha actual. pagehide y la destrucción limpian el timer;
la última vista retira efecto/listeners y libera el reloj de presentación.
DailyLearningService conserva su mecanismo previo, sin cambios ni nuevos intervalos.

## Disponibilidad frente a bloqueo diario

Se cuentan unidades de estudio seleccionadas, no caracteres deduplicados:

- Nueva: no existe progreso para su clave, igual que el constructor de rondas.
- Vencida: tiene progreso y su due es menor o igual al instante actual.
- Futura: su due es posterior; se muestra la próxima fecha en hora de Madrid.
- Sin selección: no permite iniciar y pide revisar la selección.
- Aprender se habilita si hay nuevas/vencidas y no se completó la ronda diaria.
- Si el día está completado, los vencimientos se siguen contando y se explica
  que el límite impide otra ronda normal. No se afirma que faltan repasos.

Se conservan máximo diez unidades, dos direcciones, FSRS, refuerzos, NO/CASI/SÍ,
registros, K0 y prácticas voluntarias. No se escribe progreso al actualizar tiempo.
RUSH y Escritura mantienen sus accesos y contratos independientes.

## Día, navegación y workspace

Al alcanzar medianoche Madrid se refresca el bloqueo, aunque todavía no sea
medianoche UTC. Los días con cambio de hora no usan un incremento fijo de 24 h.
`KanjiSessionService.start` refresca el día antes de verificar el bloqueo, también
en entrada directa o tras una recuperación asíncrona.

A→B→A refresca selección/progreso/historial del workspace actual mediante la
revisión de activación. No se alteran las barreras de persistencia de K0.
Los resultados eliminan la previsión de «siguiente ronda» y el falso botón diario;
muestran disponibilidad actual y retorno a Kanji. No ofrecen una segunda ronda.
En selección el aviso especifica que corresponde a la selección guardada; el
borrador y Guardar conservan su funcionamiento. Se revisó el resumen de `/daily`:
su planificador ya programa próximos vencimientos/medianoche y no necesitó cambios.

## Archivos

- Servicios nuevos: `kanji-availability.service.ts`, su spec y helper exclusivo
  de tests. Servicios ajustados: `kanji-progress.service.ts`, `kanji-session.service.ts`
  y su regresión de entrada directa tras actualizar el día.
- Componente nuevo: `features/kanji/components/kanji-availability-notice.ts`.
- Integración TS/HTML en portada, start-panel, selección y kanji-play.
- Once claves `kanji.availability.*` ES/EN/CA, `compile-i18n.mjs` y el dominio
  lazy existente `deck-study.generated.ts`; no se añade otro cargador de traducciones.
- Mocks de presentación adaptados en app-modules, kanji-play, study-time-flows,
  learning-session-list y learning-writing-prompt. La aserción de refresh en
  learn-weakness-integration cuenta ahora también el refresh de entrada Kanji.
- `playwright.kanji-k1.config.ts`, `manual-tests/kanji-k1/availability.spec.ts`,
  este documento y `docs/INDEX.md`.

## Validación

| Comprobación | Resultado |
|---|---|
| Regresiones nuevas K1 | 12 del reloj + 1 de entrada directa |
| Kanji dirigido, incluidos K0 y persistencia | 94/94, 11 archivos |
| Suite Angular completa | 2723/2723, 252 archivos; incluye el hotfix publicado |
| Playwright K1 | 15/15, ES/EN/CA, escritorio/390/320, claro/oscuro y zoom real 125 % |
| Playwright K0 | 15/15, guardado fallido/parcial, reintento, recarga, doble clic y workspace |
| TypeScript app/spec | Correcto |
| Builds normal/candidato `/kana-study/` | Correctos |
| Bundle inicial normal/candidato | 748894 / 749780 bytes, sin crecimiento inicial |
| FSRS | Auditoría existente: 67 transiciones correctas |
| i18n | Auditoría y 4 contratos de dominios/traducciones correctos |
| Integridad | Diez archivos protegidos conservan su SHA-256; diff --check correcto |

La regresión cubre 119999/120000/121000 ms, sucesivos vencimientos, nuevas,
bloqueo con/sin repasos, medianoche, DST, pestaña oculta, A→B→A, dos consumidores
sin duplicar timers y destrucción. El navegador completa una ronda real,
cierra las medallas existentes y vuelve a una portada bloqueada sin otra ronda.

Logs/capturas sintéticos en `.cache/kanji-k1/`; perfiles sin cuentas privadas y
sin Supabase. Configuración con live-reload/HMR desactivados durante K1.
La primera suite no ejecutó tests por EPERM en el caché temporal del sandbox;
se repitió fuera del sandbox. Se adaptaron mocks incompletos y el control del
reloj/diálogo de medallas en Playwright; no se relajaron aserciones productivas.
Se inspeccionaron capturas claras/oscuras, móvil y zoom. Persisten seis warnings
SCSS anteriores, sin ampliar presupuestos. Reloj, catálogo, constructor de rondas,
almacén K0, Storage, debilidades, DailyLearning, RUSH y FSRS no cambian.

## Límites

Un navegador puede retrasar timers si bloquea el hilo o suspende una pestaña;
al regresar se recalcula la fecha real y nunca se adelanta un vencimiento.
Un cambio manual del reloj sin eventos se detecta en el siguiente plazo o al
recuperar foco/visibilidad. No se promete ejecución en background a cada milisegundo.
Safari y dispositivos físicos, Auth remoto y concurrencia real entre pestañas
no se han validado. Los pendientes de scheduler antiguo y logout de Gramática
siguen fuera de alcance; K1 no inicia K2/K3 ni enseñanza mediante palabras.
