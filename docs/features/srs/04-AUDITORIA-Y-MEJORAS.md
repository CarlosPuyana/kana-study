# Auditoría, hallazgos y propuestas

04/11/2026. Base `0a61adff148abb6573fb0a2ba769bccd91cf2eb5`.
Alcance: código, motor instalado, pruebas y simulaciones sintéticas. Sin acceder a historiales reales,
sin cambiar programación ni publicar nada. [Arquitectura](01-ARQUITECTURA-FSRS.md),
[comparación](02-VOCABULARIO-VS-MAZOS.md), [evidencia numérica](03-INTERVALOS-Y-SIMULACIONES.md),
[guía](05-GUIA-PARA-EL-USUARIO.md).

## Dictamen

**Los intervalos de meses son reproducibles con la configuración vigente y pocas respuestas correctas.**
No hace falta una importación antigua ni un fallo de unidades para obtenerlos. Esto acredita la ejecución
del modelo, no la calibración pedagógica individual. No hay datos de esta cuenta que permitan concluir
que su frecuencia sea adecuada o inadecuada para el propietario.

El núcleo contrastado coincide con FSRS-6; se detectaron inconsistencias de tiempo/diagnóstico y un
caso límite upstream. No se ha demostrado un error de multiplicación por 60/24/30 ni una inicialización
que programe una tarjeta genuinamente nueva a meses en la primera respuesta disponible.

## Causas investigadas

| Hipótesis | Resultado y alcance |
| --- | --- |
| Estabilidad histórica alta | Causa matemática suficiente; G con S=30 da Good≈85d. No comprobado en tus datos |
| Retención baja | Causa suficiente; mismo caso a 80 % da 282d frente a 85d al 90 %. Tu preferencia real no se leyó |
| Pesos erróneos | Coinciden con los defaults oficiales de FSRS-6; falta calibración individual, no hay optimizador conectado |
| Parámetros mezclados | Motor compartido, instancias/configuración separadas; no se encontró retención de otro mazo inyectada |
| Datos migrados | Se conservan S/D/due, no se reinicializan al abrir. Falta learningSteps se adapta a 0; no hay muestra real para valorar su impacto |
| Inicialización nueva | Test: Again=1m, Hard=6m, Good=10m; S/D iniciales oficiales |
| Estados incorrectos | Estados/transiciones probados; no se encontró conversión indebida de New→Review en el primer rating disponible |
| Repeticiones duplicadas | Vocabulario solo reprograma la primera aparición; Mazos bloquea doble pulsación mientras guarda, custom conserva evento en reintentos. No se probó cada posible carrera multi pestaña/fallo de almacenamiento |
| Contadores como más repasos | S se calcula desde memoria/fecha/rating, no desde `totalAttempts`; practicar no infla reps FSRS |
| UTC/Madrid | Diferencias reales descritas abajo; no convierten dos días en dos meses |
| Predicción distinta del guardado | Misma rama y fuzz; etiquetas redondeadas, hora desplazada al responder, elegibilidad diaria y vigencia de preview requieren explicación |
| Pocos aciertos, crecimiento fuerte | Confirmado: Vocabulario diario 10m→7d→32d→118d; D inicial baja y recuerdos espaciados explican crecimiento |

## Hallazgos confirmados

### H1 — Recuperabilidad registrada y utilizada no siempre coinciden

Reproducción en `srs-audit.spec.ts` y arnés: Review S=30,D=5, lastReview=04/11/2026 23:59Z,
evaluación=05/11 00:01Z. `dateDiffInDays` usado por `next/repeat` da t=1 y R=0,99505387.
`get_retrievability` usado por `DeckSchedulerService` da t=0 y R=1.
No hay pérdida de precisión flotante: son convenciones de tiempo distintas en ts-fsrs 5.4.2.

Impacto: `retrievabilityBefore` del evento no describe exactamente la probabilidad usada en su cálculo;
la ordenación por riesgo puede diferir. El núcleo actualiza con su t UTC, conservado en elapsedDays.
No se ha medido cuánto cambia una cola real. Propuesta: elegir un contrato explícito, comprobar upstream
y alinear diagnóstico/ordenación con el t del scheduler antes de pensar en alterar el motor.
Sin corrección implementada en esta auditoría.

### H2 — Preview sin caducidad conserva memoria de días anteriores

Reproducción: generar preview de G el 04/11 11:00Z, mantener respuesta abierta, valorar el 06/11 11:00Z.
`branch` desplaza due y lastReview a la respuesta pero conserva S/D/elapsedDays calculados con t=30;
un cálculo nuevo usaría t=32 y otra S. `AnkiStudyPage.refreshAvailability` no invalida la tarjeta revelada.
Con una espera de segundos el congelado evita que cambie la opción elegida: es una decisión útil.
El defecto es no acotar su vigencia al cruzar días/cambios relevantes de memoria.

Impacto: evento con reviewedAt nuevo y memoria calculada con fecha antigua; no es equivalencia exacta
con FSRS al instante real de responder. No se encontró evidencia de que ocurra en tu sesión habitual.
Propuesta: invalidar y volver a mostrar predicción cuando cambie el día FSRS o la versión de la tarjeta,
sin valorar automáticamente ni recalcular silenciosamente lo que el usuario vio.

### H3 — El máximo puede excederse en un día por ordenación upstream

Review S=36.500,D=1,t=365, r=0,90, fuzz=false: Hard=36.500, Good=36.501 por Good≥Hard+1.
Código: `ts-fsrs/impl/basic_scheduler.next_interval`. El arnés lo verifica; no es un parche de Kana Study.
Impacto extremadamente acotado al máximo de ~100 años; **no explica 1–3 meses**.
Propuesta: reportar/seguir versión upstream y decidir un clamp final con pruebas si se autoriza.

### H4 — UX: meses aproximados y práctica distinta de programación

Etiqueta «2 meses» abarca 45–74 días; «3 meses» 75–104. El dato guardado es exacto, la etiqueta no.
Review aparece por día Madrid y puede preceder su hora due; Learning puede adelantarse 20m.
«Mañana» representa una fecha local aunque falten minutos, no un intervalo de 24h.
Vocabulario no muestra estos intervalos junto a botones y denomina CASI a un recuerdo difícil.
Clasificación: presentación/política, no error matemático de FSRS.

### H5 — Incoherencia pedagógica de pasos cortos y una ronda diaria en Vocabulario

`VocabularySessionService.start` bloquea otra ronda normal tras completar la diaria; una primera
Good termina esa unidad, aunque programe 10m. La práctica libre no realiza el paso FSRS pendiente.
Por tanto ese paso puede retomarse al día siguiente y producir 7d, luego 32d en la simulación diaria.
Esto no es duplicación: el motor aprende de recuerdos separados un día. No garantiza que el itinerario
de aprendizaje de minutos diseñado por la biblioteca se pueda seguir desde esa pantalla.
Clasificación: incompatibilidad entre política de sesión y pasos, a decidir como producto antes de cambiar código.

## Propuestas ordenadas; ninguna implementada

Actualización 05/11/2026: una entrega posterior implementa [Por Tiempo y resumen de Mazos](../decks/DECK_TIME_AND_LEARNING_SUMMARY.md),
con fecha exacta y rangos explícitos en la nueva vista. Las incidencias del motor y las propuestas siguientes
conservan su estado original salvo esa mejora de presentación; no se alteran los resultados de esta auditoría.
Otra ampliación local implementa el [historial por tarjeta](../decks/DECK_CARD_HISTORY.md), con eventos reales,
S/D registrados y R actual etiquetada con la convención UTC del scheduler. No corrige el diagnóstico histórico
ni previews obsoletas, no rellena lagunas y no modifica el motor.

| Prioridad / propuesta | Evidencia y beneficio | Inconvenientes / carga diaria | Riesgo histórico |
| --- | --- | --- | --- |
| P1: fecha exacta y días junto a etiqueta aproximada | H4; aclarar 61d vs «2 meses», explicar mañana y adelantos | Más información; no añade repasos | Bajo, solo presentación |
| P1: explicar CASI como recuerdo conseguido con esfuerzo | F; evita registrar olvido como Hard y crecer S indebidamente | Requiere texto y ejemplos; podrían aumentar reaprendizajes honestos | Bajo si solo cambia explicación; no reclasificar eventos pasados |
| P1: decidir la relación entre ronda diaria y Learning pendiente de Vocabulario | H5; hacer viable el recorrido esperado y coherente con Mazos | Permitir pasos posteriores cambia sesiones/carga y sus resúmenes; requiere especificación y pruebas | Medio; conservar IDs/snapshots y no recalcular en bloque |
| P1: vigencia de preview y protección frente a snapshot cambiado | H2; no persistir cálculos obsoletos | Puede pedir revelar otra vez; sin carga habitual añadida | Medio, cambia solo valoraciones futuras; nunca reescribir historia |
| P2: alinear R del diagnóstico con scheduler | H1; estadísticas/ordenación explicables | Revisar contrato upstream; podría cambiar orden, no número de repasos por sí solo | Bajo/medio; anotar semántica histórica en vez de reemplazar registros |
| P2: historial por tarjeta, estado y vista avanzada S/D/R/retención/due | Sin datos reales no se puede explicar una tarjeta individual | UI más compleja, no genera carga FSRS | Bajo si lectura privada/local |
| P2: registrar versión y pesos/configuración de cálculo | Históricos carecen de trazabilidad completa de motor | Payload extra, compatibilidad backup/sync y privacidad | Medio, esquema aditivo; no inventar versión de eventos viejos |
| P2: validar anomalías semánticas en ajustes/importaciones | S/D y relaciones no todas validadas | Evitar rechazos de históricos legítimos; revisión y cuarentena en vez de borrar | Medio/alto si se rechazaran/restablecieran datos, por eso no hacerlo aquí |
| P2: evaluar 95 % frente a 90 % en un mazo con datos de recuerdo real | G: 85d frente a 34d; útil si hay más olvidos de los deseados | Más repasos; 97 % da 19d y no es una mejora gratuita | Bajo al cambiar futuros ratings; no reprogramación masiva |
| P3: evaluar pesos personalizados con suficientes eventos fiables | Los pesos son poblacionales, no ajustados al japonés del usuario | Requiere evaluación separada sin sobreajuste y coste de mantenimiento | Alto si se aplicara replay/reprogramación masiva; fuera de alcance |
| P3: decidir convergencia de políticas entre módulos | G coincide sin overrides, colas no; reducir sorpresas | No trasladar sin más pasos/retención/ratings; cambia carga y ritmo | Medio, solo tras decisión de producto |
| P3: máximo upstream y mayor cobertura de saturación | H3, clamp de un día a ~100 años | Beneficio práctico mínimo | Bajo para futuros cálculos; sin tocar due históricos |

Mantendría por ahora pesos y 90 % predeterminado. No fijaría un tope universal de 30d: distorsiona
la memoria de palabras conocidas y aumenta carga sin evidencia individual. Antes de subir retención,
conviene diferenciar aprendizaje con opciones (reconocimiento) de recuerdo sin pistas y verificar
la primera respuesta diaria en Review, separando Learning/repeticiones. `DeckStudyService.statistics`
ofrece proporción de Good total y de primera valoración por tarjeta/día, pero no constituye una prueba
de calibración del 90 % para Review ni una garantía causal de eficacia.

## Cambios y evidencia de esta auditoría

Solo se añaden los cinco documentos de esta carpeta, enlace en `docs/INDEX.md`,
`scripts/audit-srs.mjs`, `scripts/srs-audit/runner.ts` y `src/app/core/services/srs-audit.spec.ts`.
No hay cambios en implementación productiva, estilos, traducciones, parámetros, SQL, workflow o dependencias.
Las pruebas nuevas caracterizan también defectos conocidos; documentarlos con una aserción no los convierte
en comportamiento deseado. Cambiarlo requerirá otra tarea y actualizar esos casos con el nuevo contrato.

Comandos, resultados y limitaciones:

- `node scripts/audit-srs.mjs`: **67 transiciones**, asserts de matemáticas, igualdad de módulos,
  serialización, logs, ramas, fuzz reproducible, UTC, DST Madrid y casos límite correctos.
- Dirigidos mediante `npm test -- --include=...`: **8 archivos, 91/91** (9 pruebas nuevas).
  Incluyen scheduler, política, cola/persistencia, sesión Vocabulario y Puyi.
- Suite completa, ejecución inicial simultánea con build/TypeScript: **2287 pasan, 1 timeout** en
  `deck-backup.spec.ts`, «records bounded fixture timings and Node heap deltas, not physical mobile RAM peaks»,
  línea 107, límite 5000ms (5012ms medidos). No se cambió ese test ni sus límites.
- Suite completa sin build concurrente, proceso independiente: **222 archivos, 2288/2288**, 19,05s
  de runner tras 19,868s de compilación. Es un PASS real, no evidencia de estabilidad absoluta.
- Backup aislado posterior: **28/28**, 4,53s de runner y 1,76s de ejecución conjunta de tests.
  La sensibilidad a carga es una hipótesis compatible con estas observaciones, no una causa demostrada
  mediante un experimento controlado. Queda abierto ese riesgo de rendimiento preexistente.
- TypeScript: `npx tsc -p tsconfig.app.json --noEmit` y `npx tsc -p tsconfig.spec.json --noEmit`: **exit 0**.
- `npm run build -- --base-href /kana-study/`: **exit 0**, inicial **747,06 kB**, cuatro avisos SCSS conocidos.
  No hay cambios productivos ni recursos nuevos en ese bundle. No se desplegó.
- `node scripts/audit-repo-docs.mjs --links-only`: **PASS**, cero enlaces rotos y cero documentos inalcanzables.
  El modo completo histórico **falla** porque exige HEAD `09793158…`, anterior a la base actual `0a61adff…`.
  Se conserva ese baseline sin alterarlo para forzar éxito.
- `git diff --check` y comprobación explícita de whitespace/final de línea de los archivos nuevos: **PASS**.

La invocación directa inicial de Vitest no es el runner de este proyecto Angular y alcanzó copias históricas
en `.cache`; no ejecutó tests por EPERM al renombrar archivos temporales. El runner Angular también
encontró EPERM con el TEMP virtualizado del sandbox. Usar TEMP/TMP en `.cache/srs-audit/tmp` solo para
el proceso resolvió el bloqueo; no se modificaron configuración, exclusiones ni tests para ocultarlo.
Los logs se conservan localmente en `.cache/srs-audit/`, no se versionan.

Esta auditoría no es aceptación visual humana ni evaluación con Safari/dispositivo físico. No se alteró
la UI o temas; su análisis se basa en templates/componentes y pruebas. No se accedió a cuentas reales,
no hubo prueba nueva de Auth/SQL ni se accedió a datos privados para confirmar las hipótesis de frecuencia.
