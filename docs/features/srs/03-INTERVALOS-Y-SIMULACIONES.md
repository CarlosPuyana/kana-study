# Intervalos y simulaciones reproducibles

Estas son tarjetas **sintéticas**, no historiales del propietario. 明日 (あした) solo ilustra una palabra:
el motor recibe estado, fechas y rating; no analiza su escritura ni decide que esa palabra sea fácil por su significado.
No se ha medido la frecuencia real de intervalos largos en tu cuenta.

## Ejecutar el diagnóstico

Desde la raíz: `node scripts/audit-srs.mjs`.
Compila un arnés separado con esbuild y ejecuta las clases Angular auténticas en Node, sin arrancar
la app ni abrir sus bases de datos, cuentas o red. Solo escribe `.cache/srs-audit/runtime.mjs`,
`results.json` (valores íntegros) y `tables.md` (redondeo a cuatro decimales).
Fecha fija de inicio: 04/11/2026 11:00 UTC. Proceso TZ=UTC; políticas de día explícitas Europe/Madrid.
Versión exigida 5.4.2. No se modifica la configuración de producción.

`vocab`: `SpacedRepetitionService.review`, 90 %, fuzz=false.
`deck`: `DeckSchedulerService.preview/branch`, 90 %, fuzz=false inyectado solo en el arnés para comparación.
`deck-fuzz`: mismo scheduler con fuzz=true, configuración productiva.
La semilla real de biblioteca deriva de fecha de evaluación, reps y producto D*S; fijar estos valores hace
reproducible el fuzz. Distintos instantes de revelado pueden producir días distintos; al pulsar no se recalcula.

A estudia cada botón disponible desde New. B son 1–3 aciertos; C extiende la cadena; D fuerza
una historia muy larga, **incluidos años futuros, no una recomendación de esperar décadas**.
E es una bifurcación del sexto acierto: olvidar y recuperar; D continúa la rama correcta original.
F incluye Hard en Learning y en Review; G usa la misma tarjeta Review S=30,D=5,reps=8,t=30.
Las cadenas principales responden justo en due, aislando el motor. No incluyen todos los límites diarios
ni adelantos de la cola: la cadena adicional «Vocabulario diario» espera al menos un día entre respuestas,
compatible con su límite de ronda, y demuestra el efecto de posponer un paso de minutos.

## Qué explica los meses

Con Good de nueva, la D inicial ≈2,118 es baja; varios recuerdos correctos separados por tiempo
producen un crecimiento fuerte de S con pesos genéricos. No hay un contador oculto de repasos.

| Cadena Good | Intervalos sucesivos calculados |
| --- | --- |
| Motor Vocabulario, respuesta exactamente en due | 10m → 2d → 11d → 46d → 163d |
| Vocabulario, primer paso retomado al día siguiente | 10m → 7d → 32d → 118d → 373d |
| Mazos sin fuzz, respuesta exactamente en due | 10m → mañana → 3d → 14d → 57d |
| Mazos con fuzz, fechas de este experimento | 10m → mañana → 3d → 16d → 61d |

Una nueva genuina **no salta a meses en su primera respuesta disponible**. Una palabra conocida en pantalla
puede tener un historial previo aunque el usuario acabe de abrir esa sesión. Tampoco «pocos repasos»
garantiza pocos días: la tercera respuesta de la cadena diaria ya da 32 días. Es resultado reproducible de
pesos, respuestas y fechas; no prueba que su estimación sea óptima para ese alumno o para japonés.

Caso G: Good produce S'=85,0279 y D'=4,9902; 85d sin fuzz, 86d con fuzz de esta semilla.
Again produce S'=2,3240,D'=8,3418 y 10m de reaprendizaje. Olvidar no conserva el intervalo de meses.
En E, después de fallar, Good recupera Review según FSRS en Vocabulario y a mañana en Mazos.
Un acierto tardío puede aumentar más S que uno temprano, porque demuestra recuerdo con menor R;
no implica que convenga retrasar deliberadamente los repasos.

Para **idéntica** Review de G y Good, cambiar solo la retención da:

| Retención | S' idéntica | Intervalo sin fuzz |
| --- | --- | --- |
| 80 % | 85,0279 | 282d |
| 85 % | 85,0279 | 162d |
| 90 % | 85,0279 | 85d |
| 95 % | 85,0279 | 34d |
| 97 % | 85,0279 | 19d |

Retención modifica el objetivo de fecha, no la evidencia de esa respuesta ni los pesos. No debe
inferirse una reducción exacta de carga diaria a partir de un caso: cambia el historial futuro de toda la cola.

## Presentación y calendario

| Días enteros guardados | Etiqueta de Mazos |
| --- | --- |
| 30–44 | 1 mes |
| 45–74 | 2 meses |
| 75–104 | 3 meses |
| 105 | 4 meses |
| 364 / 365 | 12 meses / 1 año |

Para pasos, 59,6m puede aparecer como 60min y 23,6h como 24h. No se redondea el dato persistido.
Graduación de Mazos el 04/11 a las 11:10Z: due=04/11 23:00Z (05/11 00:00 Madrid), no 24h después.
Estado Review se ofrece por día Madrid, aunque due tenga una hora posterior; Learning puede adelantarse
20m si no quedan otras entradas. Ambos son decisiones de SCHEDULER-1, no errores aritméticos.

## Casos límite comprobados

- UTC: 23:59→00:01 son dos minutos, pero t del scheduler=1. En la R de diagnóstico t=0.
  Con S=30, R usada=0,99505387 y R registrada=1. El arnés compara ambas explícitamente.
- Mismo día UTC 00:01→23:59: t de scheduler=0. No asumir que es `floor(horas/24)`.
- Madrid: los días 29/03 y 25/10/2026 duran respectivamente 23h y 25h; el siguiente inicio se comprueba.
- Preview abierta 48h: mantiene t=30 y S'=85,02789144 (85d); recalcular en ese momento usaría t=32
  y S'=87,60568090 (88d). Se conserva el intervalo elegido, pero no equivale al cálculo fresco.
- Límite extremo de biblioteca: S=36.500,D=1,Review,t=365,90 %, sin fuzz puede producir Good=36.501d
  por la restricción Good≥Hard+1. No explica intervalos de 30–90d.
- Serialización: round-trip exacto de todos los campos; persistencia Vocabulario conserva before/after
  tras reiniciar TestBed, y práctica adicional no incrementa reps FSRS.

## Tabla completa de la ejecución

Estados 0=New,1=Learning,2=Review,3=Relearning. S en días, D adimensional, R en [0,1].
«t UTC» es el t que usa la actualización del motor; no siempre coincide con R de diagnóstico.
«Intervalo / nominal» distingue duración efectiva hasta due y `scheduledDays` (0 en pasos cortos,
1 en mañana). Fecha UTC y retención se incluyen por fila. Para Learning nuevo R no se estima (—).

<!-- SRS-AUDIT-TABLES -->

| Escenario / módulo | Respuesta / fecha UTC / retención | Antes: estado, reps, S, D | t UTC / R del cálculo | Después: estado, reps, S, D | Intervalo días / nominal | Due UTC |
| --- | --- | --- | --- | --- | --- | --- |
| A: nueva / vocab | again / 2026-11-04T11:00:00.000Z / 0.9 | 0, 0, 0, 0 | 0 / — | 1, 1, 0.212, 6.4133 | 0.0007 / 0 | 2026-11-04T11:01:00.000Z |
| A: nueva / vocab | hard / 2026-11-04T11:00:00.000Z / 0.9 | 0, 0, 0, 0 | 0 / — | 1, 1, 1.2931, 5.1122 | 0.0042 / 0 | 2026-11-04T11:06:00.000Z |
| A: nueva / vocab | good / 2026-11-04T11:00:00.000Z / 0.9 | 0, 0, 0, 0 | 0 / — | 1, 1, 2.3065, 2.1181 | 0.0069 / 0 | 2026-11-04T11:10:00.000Z |
| B: bien #1 / vocab | good / 2026-11-04T11:00:00.000Z / 0.9 | 0, 0, 0, 0 | 0 / — | 1, 1, 2.3065, 2.1181 | 0.0069 / 0 | 2026-11-04T11:10:00.000Z |
| B: bien #2 / vocab | good / 2026-11-04T11:10:00.000Z / 0.9 | 1, 1, 2.3065, 2.1181 | 0 / 1 | 2, 2, 2.3065, 2.1112 | 2 / 2 | 2026-11-06T11:10:00.000Z |
| B: bien #3 / vocab | good / 2026-11-06T11:10:00.000Z / 0.9 | 2, 2, 2.3065, 2.1112 | 2 / 0.9095 | 2, 3, 10.971, 2.1043 | 11 / 11 | 2026-11-17T11:10:00.000Z |
| C: bien #4 / vocab | good / 2026-11-17T11:10:00.000Z / 0.9 | 2, 3, 10.971, 2.1043 | 11 / 0.8998 | 2, 4, 46.3169, 2.0975 | 46 / 46 | 2027-01-02T11:10:00.000Z |
| C: bien #5 / vocab | good / 2027-01-02T11:10:00.000Z / 0.9 | 2, 4, 46.3169, 2.0975 | 46 / 0.9005 | 2, 5, 162.9998, 2.0906 | 163 / 163 | 2027-06-14T11:10:00.000Z |
| C: bien #6 / vocab | good / 2027-06-14T11:10:00.000Z / 0.9 | 2, 5, 162.9998, 2.0906 | 163 / 0.9 | 2, 6, 497.8766, 2.0837 | 498 / 498 | 2028-10-24T11:10:00.000Z |
| E: olvido tras intervalo largo / vocab | again / 2028-10-24T11:10:00.000Z / 0.9 | 2, 6, 497.8766, 2.0837 | 498 / 0.9 | 3, 7, 6.8904, 7.3832 | 0.0069 / 0 | 2028-10-24T11:20:00.000Z |
| E: recuperación / vocab | good / 2028-10-24T11:20:00.000Z / 0.9 | 3, 7, 6.8904, 7.3832 | 0 / 1 | 2, 8, 6.8904, 7.371 | 7 / 7 | 2028-10-31T11:20:00.000Z |
| D: bien #7 / vocab | good / 2028-10-24T11:10:00.000Z / 0.9 | 2, 6, 497.8766, 2.0837 | 498 / 0.9 | 2, 7, 1347.9186, 2.0769 | 1348 / 1348 | 2032-07-03T11:10:00.000Z |
| D: bien #8 / vocab | good / 2032-07-03T11:10:00.000Z / 0.9 | 2, 7, 1347.9186, 2.0769 | 1348 / 0.9 | 2, 8, 3298.6456, 2.07 | 3299 / 3299 | 2041-07-15T11:10:00.000Z |
| D: bien #9 / vocab | good / 2041-07-15T11:10:00.000Z / 0.9 | 2, 8, 3298.6456, 2.07 | 3299 / 0.9 | 2, 9, 7414.5334, 2.0632 | 7415 / 7415 | 2061-11-02T11:10:00.000Z |
| D: bien #10 / vocab | good / 2061-11-02T11:10:00.000Z / 0.9 | 2, 9, 7414.5334, 2.0632 | 7415 / 0.9 | 2, 10, 15504.1739, 2.0563 | 15504 / 15504 | 2104-04-15T11:10:00.000Z |
| A: nueva / deck | again / 2026-11-04T11:00:00.000Z / 0.9 | 0, 0, 0, 0 | 0 / — | 1, 1, 0.212, 6.4133 | 0.0007 / 0 | 2026-11-04T11:01:00.000Z |
| A: nueva / deck | good / 2026-11-04T11:00:00.000Z / 0.9 | 0, 0, 0, 0 | 0 / — | 1, 1, 2.3065, 2.1181 | 0.0069 / 0 | 2026-11-04T11:10:00.000Z |
| B: bien #1 / deck | good / 2026-11-04T11:00:00.000Z / 0.9 | 0, 0, 0, 0 | 0 / — | 1, 1, 2.3065, 2.1181 | 0.0069 / 0 | 2026-11-04T11:10:00.000Z |
| B: bien #2 / deck | good / 2026-11-04T11:10:00.000Z / 0.9 | 1, 1, 2.3065, 2.1181 | 0 / 1 | 2, 2, 2.3065, 2.1112 | 0.4931 / 1 | 2026-11-04T23:00:00.000Z |
| B: bien #3 / deck | good / 2026-11-04T23:00:00.000Z / 0.9 | 2, 2, 2.3065, 2.1112 | 0 / 1 | 2, 3, 2.3065, 2.1043 | 3 / 3 | 2026-11-07T23:00:00.000Z |
| C: bien #4 / deck | good / 2026-11-07T23:00:00.000Z / 0.9 | 2, 3, 2.3065, 2.1043 | 3 / 0.8809 | 2, 4, 13.8448, 2.0975 | 14 / 14 | 2026-11-21T23:00:00.000Z |
| C: bien #5 / deck | good / 2026-11-21T23:00:00.000Z / 0.9 | 2, 4, 13.8448, 2.0975 | 14 / 0.8992 | 2, 5, 57.0481, 2.0906 | 57 / 57 | 2027-01-17T23:00:00.000Z |
| C: bien #6 / deck | good / 2027-01-17T23:00:00.000Z / 0.9 | 2, 5, 57.0481, 2.0906 | 57 / 0.9001 | 2, 6, 196.5684, 2.0837 | 197 / 197 | 2027-08-02T23:00:00.000Z |
| E: olvido tras intervalo largo / deck | again / 2027-08-02T23:00:00.000Z / 0.9 | 2, 6, 196.5684, 2.0837 | 197 / 0.8998 | 3, 7, 5.0408, 7.3832 | 0.0069 / 0 | 2027-08-02T23:10:00.000Z |
| E: recuperación / deck | good / 2027-08-02T23:10:00.000Z / 0.9 | 3, 7, 5.0408, 7.3832 | 0 / 1 | 2, 8, 5.0408, 7.371 | 0.9514 / 1 | 2027-08-03T22:00:00.000Z |
| D: bien #7 / deck | good / 2027-08-02T23:00:00.000Z / 0.9 | 2, 6, 196.5684, 2.0837 | 197 / 0.8998 | 2, 7, 588.9216, 2.0769 | 589 / 589 | 2029-03-13T23:00:00.000Z |
| D: bien #8 / deck | good / 2029-03-13T23:00:00.000Z / 0.9 | 2, 7, 588.9216, 2.0769 | 589 / 0.9 | 2, 8, 1567.3369, 2.07 | 1567 / 1567 | 2033-06-27T23:00:00.000Z |
| D: bien #9 / deck | good / 2033-06-27T23:00:00.000Z / 0.9 | 2, 8, 1567.3369, 2.07 | 1567 / 0.9 | 2, 9, 3780.5887, 2.0632 | 3781 / 3781 | 2043-11-03T23:00:00.000Z |
| D: bien #10 / deck | good / 2043-11-03T23:00:00.000Z / 0.9 | 2, 9, 3780.5887, 2.0632 | 3781 / 0.9 | 2, 10, 8395.3966, 2.0563 | 8395 / 8395 | 2066-10-28T23:00:00.000Z |
| A: nueva / deck-fuzz | again / 2026-11-04T11:00:00.000Z / 0.9 | 0, 0, 0, 0 | 0 / — | 1, 1, 0.212, 6.4133 | 0.0007 / 0 | 2026-11-04T11:01:00.000Z |
| A: nueva / deck-fuzz | good / 2026-11-04T11:00:00.000Z / 0.9 | 0, 0, 0, 0 | 0 / — | 1, 1, 2.3065, 2.1181 | 0.0069 / 0 | 2026-11-04T11:10:00.000Z |
| B: bien #1 / deck-fuzz | good / 2026-11-04T11:00:00.000Z / 0.9 | 0, 0, 0, 0 | 0 / — | 1, 1, 2.3065, 2.1181 | 0.0069 / 0 | 2026-11-04T11:10:00.000Z |
| B: bien #2 / deck-fuzz | good / 2026-11-04T11:10:00.000Z / 0.9 | 1, 1, 2.3065, 2.1181 | 0 / 1 | 2, 2, 2.3065, 2.1112 | 0.4931 / 1 | 2026-11-04T23:00:00.000Z |
| B: bien #3 / deck-fuzz | good / 2026-11-04T23:00:00.000Z / 0.9 | 2, 2, 2.3065, 2.1112 | 0 / 1 | 2, 3, 2.3065, 2.1043 | 3 / 3 | 2026-11-07T23:00:00.000Z |
| C: bien #4 / deck-fuzz | good / 2026-11-07T23:00:00.000Z / 0.9 | 2, 3, 2.3065, 2.1043 | 3 / 0.8809 | 2, 4, 13.8448, 2.0975 | 16 / 16 | 2026-11-23T23:00:00.000Z |
| C: bien #5 / deck-fuzz | good / 2026-11-23T23:00:00.000Z / 0.9 | 2, 4, 13.8448, 2.0975 | 16 / 0.8898 | 2, 5, 61.292, 2.0906 | 61 / 61 | 2027-01-23T23:00:00.000Z |
| C: bien #6 / deck-fuzz | good / 2027-01-23T23:00:00.000Z / 0.9 | 2, 5, 61.292, 2.0906 | 61 / 0.9003 | 2, 6, 208.9942, 2.0837 | 197 / 197 | 2027-08-08T23:00:00.000Z |
| E: olvido tras intervalo largo / deck-fuzz | again / 2027-08-08T23:00:00.000Z / 0.9 | 2, 6, 208.9942, 2.0837 | 197 / 0.904 | 3, 7, 5.1142, 7.3832 | 0.0069 / 0 | 2027-08-08T23:10:00.000Z |
| E: recuperación / deck-fuzz | good / 2027-08-08T23:10:00.000Z / 0.9 | 3, 7, 5.1142, 7.3832 | 0 / 1 | 2, 8, 5.1142, 7.371 | 0.9514 / 1 | 2027-08-09T22:00:00.000Z |
| D: bien #7 / deck-fuzz | good / 2027-08-08T23:00:00.000Z / 0.9 | 2, 6, 208.9942, 2.0837 | 197 / 0.904 | 2, 7, 604.0985, 2.0769 | 611 / 611 | 2029-04-10T23:00:00.000Z |
| D: bien #8 / deck-fuzz | good / 2029-04-10T23:00:00.000Z / 0.9 | 2, 7, 604.0985, 2.0769 | 611 / 0.8992 | 2, 8, 1611.5233, 2.07 | 1619 / 1619 | 2033-09-15T23:00:00.000Z |
| D: bien #9 / deck-fuzz | good / 2033-09-15T23:00:00.000Z / 0.9 | 2, 8, 1611.5233, 2.07 | 1619 / 0.8997 | 2, 9, 3884.5066, 2.0632 | 3917 / 3917 | 2044-06-06T23:00:00.000Z |
| D: bien #10 / deck-fuzz | good / 2044-06-06T23:00:00.000Z / 0.9 | 2, 9, 3884.5066, 2.0632 | 3917 / 0.8994 | 2, 10, 8632.5809, 2.0563 | 8948 / 8948 | 2068-12-05T23:00:00.000Z |
| F: CASI #1 / vocab | hard / 2026-11-04T11:00:00.000Z / 0.9 | 0, 0, 0, 0 | 0 / — | 1, 1, 1.2931, 5.1122 | 0.0042 / 0 | 2026-11-04T11:06:00.000Z |
| F: CASI #2 / vocab | hard / 2026-11-04T11:06:00.000Z / 0.9 | 1, 1, 1.2931, 5.1122 | 0 / 1 | 1, 2, 1.2931, 6.7405 | 0.0042 / 0 | 2026-11-04T11:12:00.000Z |
| F: CASI #3 / vocab | hard / 2026-11-04T11:12:00.000Z / 0.9 | 1, 2, 1.2931, 6.7405 | 0 / 1 | 1, 3, 1.2931, 7.8214 | 0.0042 / 0 | 2026-11-04T11:18:00.000Z |
| F: CASI #4 / vocab | hard / 2026-11-04T11:18:00.000Z / 0.9 | 1, 3, 1.2931, 7.8214 | 0 / 1 | 1, 4, 1.2931, 8.539 | 0.0042 / 0 | 2026-11-04T11:24:00.000Z |
| F: CASI #5 / vocab | hard / 2026-11-04T11:24:00.000Z / 0.9 | 1, 4, 1.2931, 8.539 | 0 / 1 | 1, 5, 1.2931, 9.0153 | 0.0042 / 0 | 2026-11-04T11:30:00.000Z |
| G: historia equivalente / vocab | again / 2026-11-04T11:00:00.000Z / 0.9 | 2, 8, 30, 5 | 30 / 0.9 | 3, 9, 2.324, 8.3418 | 0.0069 / 0 | 2026-11-04T11:10:00.000Z |
| G: historia equivalente / deck | again / 2026-11-04T11:00:00.000Z / 0.9 | 2, 8, 30, 5 | 30 / 0.9 | 3, 9, 2.324, 8.3418 | 0.0069 / 0 | 2026-11-04T11:10:00.000Z |
| G: historia equivalente / deck-fuzz | again / 2026-11-04T11:00:00.000Z / 0.9 | 2, 8, 30, 5 | 30 / 0.9 | 3, 9, 2.324, 8.3418 | 0.0069 / 0 | 2026-11-04T11:10:00.000Z |
| G: historia equivalente / vocab | good / 2026-11-04T11:00:00.000Z / 0.9 | 2, 8, 30, 5 | 30 / 0.9 | 2, 9, 85.0279, 4.9902 | 85 / 85 | 2027-01-28T11:00:00.000Z |
| G: historia equivalente / deck | good / 2026-11-04T11:00:00.000Z / 0.9 | 2, 8, 30, 5 | 30 / 0.9 | 2, 9, 85.0279, 4.9902 | 85 / 85 | 2027-01-28T11:00:00.000Z |
| G: historia equivalente / deck-fuzz | good / 2026-11-04T11:00:00.000Z / 0.9 | 2, 8, 30, 5 | 30 / 0.9 | 2, 9, 85.0279, 4.9902 | 86 / 86 | 2027-01-29T11:00:00.000Z |
| Retención: misma historia / deck | good / 2026-11-04T11:00:00.000Z / 0.8 | 2, 8, 30, 5 | 30 / 0.9 | 2, 9, 85.0279, 4.9902 | 282 / 282 | 2027-08-13T11:00:00.000Z |
| Retención: misma historia / deck | good / 2026-11-04T11:00:00.000Z / 0.85 | 2, 8, 30, 5 | 30 / 0.9 | 2, 9, 85.0279, 4.9902 | 162 / 162 | 2027-04-15T11:00:00.000Z |
| Retención: misma historia / deck | good / 2026-11-04T11:00:00.000Z / 0.9 | 2, 8, 30, 5 | 30 / 0.9 | 2, 9, 85.0279, 4.9902 | 85 / 85 | 2027-01-28T11:00:00.000Z |
| Retención: misma historia / deck | good / 2026-11-04T11:00:00.000Z / 0.95 | 2, 8, 30, 5 | 30 / 0.9 | 2, 9, 85.0279, 4.9902 | 34 / 34 | 2026-12-08T11:00:00.000Z |
| Retención: misma historia / deck | good / 2026-11-04T11:00:00.000Z / 0.97 | 2, 8, 30, 5 | 30 / 0.9 | 2, 9, 85.0279, 4.9902 | 19 / 19 | 2026-11-23T11:00:00.000Z |
| Vocabulario diario: bien #1 / vocab | good / 2026-11-04T11:00:00.000Z / 0.9 | 0, 0, 0, 0 | 0 / — | 1, 1, 2.3065, 2.1181 | 0.0069 / 0 | 2026-11-04T11:10:00.000Z |
| Vocabulario diario: bien #2 / vocab | good / 2026-11-05T11:00:00.000Z / 0.9 | 1, 1, 2.3065, 2.1181 | 1 / 0.9468 | 2, 2, 7.3153, 2.1112 | 7 / 7 | 2026-11-12T11:00:00.000Z |
| Vocabulario diario: bien #3 / vocab | good / 2026-11-12T11:00:00.000Z / 0.9 | 2, 2, 7.3153, 2.1112 | 7 / 0.903 | 2, 3, 31.6792, 2.1043 | 32 / 32 | 2026-12-14T11:00:00.000Z |
| Vocabulario diario: bien #4 / vocab | good / 2026-12-14T11:00:00.000Z / 0.9 | 2, 3, 31.6792, 2.1043 | 32 / 0.8993 | 2, 4, 117.6689, 2.0975 | 118 / 118 | 2027-04-11T11:00:00.000Z |
| Vocabulario diario: bien #5 / vocab | good / 2027-04-11T11:00:00.000Z / 0.9 | 2, 4, 117.6689, 2.0975 | 118 / 0.8998 | 2, 5, 373.218, 2.0906 | 373 / 373 | 2028-04-18T11:00:00.000Z |
| F: CASI consolidada #1 / vocab | hard / 2026-11-04T11:00:00.000Z / 0.9 | 2, 8, 30, 5 | 30 / 0.9 | 2, 9, 63.0938, 6.666 | 63 / 63 | 2027-01-06T11:00:00.000Z |
| F: CASI consolidada #2 / vocab | hard / 2027-01-06T11:00:00.000Z / 0.9 | 2, 9, 63.0938, 6.666 | 63 / 0.9001 | 2, 10, 107.4647, 7.772 | 107 / 107 | 2027-04-23T11:00:00.000Z |
| F: CASI consolidada #3 / vocab | hard / 2027-04-23T11:00:00.000Z / 0.9 | 2, 10, 107.4647, 7.772 | 107 / 0.9003 | 2, 11, 158.8705, 8.5062 | 159 / 159 | 2027-09-29T11:00:00.000Z |
