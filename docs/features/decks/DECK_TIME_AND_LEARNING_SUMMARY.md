# Mazos: Por Tiempo y resumen del aprendizaje

Política posterior de Aprender: [cola diaria dinámica](DECK_DYNAMIC_DAILY_QUEUE.md).
Por Tiempo conserva sus fechas y agrupaciones; las tarjetas de hoy más tarde también son elegibles.

Implementado localmente el 05/11/2026 sobre `0a61adff148abb6573fb0a2ba769bccd91cf2eb5`.
Se preserva el trabajo local previo de la [auditoría FSRS](../srs/01-ARQUITECTURA-FSRS.md).
Ampliación posterior del mismo día: [Historial por tarjeta](DECK_CARD_HISTORY.md) añade lectura al abrir
el detalle de Todos y foco modal en ambas vistas; sus cambios y validaciones complementan esta entrega.
Sin commit, push, despliegue, SQL, cambios de gates ni acceso a datos reales de usuarios.

## Tarjetas: Todos / Por Tiempo

Todos es el modo predeterminado, sin preferencia persistida nueva. Mantiene el bucle original,
orden editorial, búsqueda, filtros, overlay y paginación de 120 en 120. Solo se incorpora el selector,
con la misma estructura y estilos semánticos de KANA. No se consulta progreso para presentar Todos.

Por Tiempo aplica la misma búsqueda y agrupa las entradas activas del mazo según `progress.card.due`
persistido. Nunca usa previews, `scheduledDays` como sustituto de due, ni el historial de otro mazo.
Cada entrada pertenece a un grupo; los grupos vacíos no se crean. La primera semana es diaria y los
rangos siguientes se muestran explícitos en lugar de «meses» aproximados:

| Grupo | Regla exacta |
| --- | --- |
| Pendientes y vencidas | Estado distinto de New y due ≤ ahora, incluida la igualdad |
| Hoy, más tarde | Due > ahora y misma fecha de Europe/Madrid |
| Mañana / en 2…7 días | Diferencia de fechas Madrid de 1…7 |
| En 8–14 / 15–21 días | Diferencia inclusiva de fechas dentro de cada rango |
| En 22–30 / 31–60 / 61–90 días | Rangos inclusivos, sin solapamiento |
| En más de 90 días | Diferencia de fechas >90 |
| Nuevas, sin programar | Sin registro o estado FSRS New=0; nunca se considera vencida |
| Fecha no disponible | Registro programado con due no finito; no se inventa una fecha |

Se ordena por grupo cronológico; dentro, por due, orden editorial e ID con comparación estable.
Las nuevas conservan orden editorial. Los grupos empiezan cerrados y crean componentes únicamente
al abrirse: 60 tarjetas por grupo, con carga adicional de 60. Se puede buscar sin abrir 1500 tarjetas.

El detalle reutiliza el existente y añade, solo en Por Tiempo:

- Fecha exacta con hora y zona Europe/Madrid; `<time datetime>` conserva su ISO UTC.
- Tiempo restante desde ahora: días de 24h y horas, o horas y minutos para menos de un día;
  no se convierte en meses aproximados. Un día de otoño de 25h se muestra como 1 día · 1h, no 2 días.
- Intervalo programado guardado: `scheduledDays` cuando es positivo. En pasos cortos se puede
  derivar de `due-lastReview` si existen fechas coherentes. Sin datos suficientes se omite.
- Última valoración únicamente si el evento efectivo coincide con lastReview y con el estado
  posterior guardado (due, estado, S y D). Esto evita elegir una UUID arbitraria cuando varias
  respuestas comparten un milisegundo. Si el historial no acredita esa valoración, se omite.

Un intervalo de 30 días que tiene 25 días transcurridos se agrupa por los cinco restantes.
No se confunden duración asignada y espera restante. «1 día» nominal en una graduación de Mazos
puede significar la próxima medianoche, no 24 horas: la fecha exacta es la referencia.

La apertura del detalle en Por Tiempo reutiliza `ModalFocusDirective`, con enfoque inicial,
Tab/Shift+Tab dentro del diálogo y retorno al botón que lo abrió. Su nueva entrada opcional
`modalFocusEnabled` permite desactivarla en Todos, preservando allí el comportamiento anterior.
El valor predeterminado de la directiva sigue siendo true para sus consumidores existentes.
Los controles desplegables son botones semánticos, con aria-expanded y un destino aria-controls existente.

## Resumen: sesión como día de estudio

Se reutiliza el contrato vigente de Mazos: **sesión de hoy = eventos efectivos del mazo durante
el día Europe/Madrid**, no cada visita a la ruta ni cada apertura de navegador. La cabecera lo explicita.
Volver al mazo, recargar o reabrir el resumen el mismo día reconstruye sus datos del almacenamiento.
No se crea una tabla de sesiones, snapshot paralelo ni contador acumulativo que pueda duplicarse.
Al cambiar de día, la aplicación pasa al día de estudio nuevo, igual que antes; no se añade un archivo
navegable de resúmenes históricos en esta entrega.

| Métrica | Definición |
| --- | --- |
| Tarjetas estudiadas | EntryIds únicos de eventos efectivos del mazo y día |
| Valoraciones guardadas | Eventos efectivos distintos por ID del mazo y día, sin eventos futuros |
| Aciertos de hoy | Good / (Good + Again), mostrado redondeado a entero; sin respuestas se muestra — |
| Palabras para reforzar | Entradas aún disponibles de la lista vigente de dificultades del día |

Esto mide las valoraciones de la sesión, **no retención a largo plazo**, ni palabras aprendidas de una vez.
Una tarjeta respondida Again, Good, Good aporta 1 tarjeta, 3 valoraciones y 67 % de aciertos.
Deshacer retira el evento efectivo y restaura la tarjeta mediante la implementación previa; el resumen
se vuelve a derivar. No se cuentan recibos duplicados como respuestas nuevas.

Se conservan los criterios de `deckDayDifficulties`: al menos un Again efectivo del día para ese
mazo, agrupado por entrada. Orden: más fallos, fallo más reciente e ID. No se inventan intentos.
La tarjeta de refuerzo muestra palabra, lectura, significado español (o fallback existente cuando
una entrada custom no tiene glosa ES) y número de fallos. Se mantienen selección y práctica intensiva;
no hay botones ni componentes independientes de audio/imagen en este resumen. La tarjeta de estudio
y sus medios siguen usando el código anterior.

Las métricas y la previsión también admiten una cola vacía sin respuestas o una pausa hasta el próximo
paso; la cabecera conserva el motivo anterior de finalización/espera. La lista de refuerzo y su práctica
mantienen la condición previa de día completado.

## Gráficos sin librería nueva

El componente presentacional `shared/components/deck-learning-summary/` recibe datos derivados.
Usa barras CSS semánticas y una tabla equivalente para lectores de pantalla; no requiere interacción
con un canvas ni incorpora dependencias. Los números y la leyenda evitan depender solo del color.
Usa variables de tema, se adapta a 320px y no añade animaciones.

La previsión muestra siete fechas Madrid, desde mañana hasta dentro de siete días, incluyendo ceros.
Cada entrada activa programada aporta **solo su próximo due actual**, aunque tenga muchos eventos.
No es una simulación de respuestas futuras ni cuenta todas las repeticiones que podrían producirse.
Las vencidas, las de hoy más tarde, las nuevas y las posteriores a siete días se indican aparte.
Las fechas no disponibles se notifican si existen. Solo entran tarjetas de ese mazo y workspace.

La barra de progreso utiliza estados reales: nuevas (sin progreso o New), aprendizaje/reaprendizaje
(Learning/Relearning) y repaso (Review). No crea «Consolidadas»: el estado Review no acredita por sí
solo dominio ni una respuesta correcta equivale a consolidación pedagógica.

## Tiempo, actualización y privacidad

La diferencia de días compara claves de calendario Madrid mediante ordinales UTC de dichas fechas;
no divide la duración entre 24h. Los pasos de primavera/otoño de 23/25h no desplazan los grupos.
El navegador puede tener otra zona; el contrato de día de la aplicación sigue siendo Madrid.
La cifra de días restantes del detalle sí representa duración de 24h, y se distingue de la fecha calendario.
Se omiten minutos en duraciones de al menos un día; menos de un minuto se indica explícitamente.

Por Tiempo actualiza el reloj cada segundo estando visible, y vuelve a leer al ganar foco/visibilidad,
al cambiar el recurso de ruta o la revisión de progreso local. El resumen actualiza sus datos tras rate,
undo, carga y restauración; actualiza su reloj cada minuto en la pantalla final y la cola conserva su
refresco previo al cambiar de día. Se limpian timers al destruir el componente.
En otra pestaña, el refresco de foco vuelve a leer el estado: no se añade un protocolo de eventos entre pestañas.

`DeckScheduleReader` lee por `DeckPersistenceRouter`, con su fence de propietario/epoch, y verifica
otra vez el fence después de las lecturas. El componente también captura recurso, propietario, epoch
y generación, descarta resultados tardíos y vacía su vista al cambiar de cuenta/ruta. Se prueba A→B→A.
Japanese 1500 y Puyi usan las bases IndexedDB separadas por workspace, y custom su repositorio habitual.
El contenido editorial público de Puyi no contiene ni expone el progreso de sus estudiantes.
No hay consultas nuevas a RPC públicas para obtener estadísticas ni modificaciones de RLS/Auth/cloud.

## Relación con la auditoría

Se usa programación persistida, por lo que no es necesario corregir H1 (recuperabilidad), H2
(preview antigua), H3 (máximo upstream) o H5 (ronda diaria de Vocabulario) para calcular estas vistas.
Permanecen pendientes, con el alcance descrito en la [auditoría](../srs/04-AUDITORIA-Y-MEJORAS.md).
Esta entrega aborda la presentación de H4 para Por Tiempo mediante rangos explícitos y fecha exacta;
no cambia el formateo de intervalos de los botones del estudio, pesos, retención, fuzz o políticas.
El resumen representa lo que se guardó, incluso si una valoración provino de una preview antigua;
no la recalcula retrospectivamente.

## Archivos y validación

- Cálculos puros: `src/app/core/services/deck-learning-presentation.ts` y su spec.
- Lectura aislada: `deck-schedule-reader.ts` y su spec.
- Integración: páginas `anki-cards` y `anki-study`, estilos y specs correspondientes.
- Presentación: `shared/components/deck-learning-summary/`; foco: `shared/directives/modal-focus.directive` y spec.
- Textos ES/EN/CA en sus JSON y `deck-study.generated.ts`, conservados en el chunk diferido de Mazos.
- Navegador: `playwright.deck-learning.config.ts`, `manual-tests/deck-learning/deck-learning.spec.ts`.

Resultados ejecutados:

| Comprobación | Resultado |
| --- | --- |
| Grupo dirigido de presentación, lector, Tarjetas y estudio | 4 archivos, 31/31 |
| Regresión posterior: detalle original, duración 25h, teclado Kana y foco modal | 5 archivos, 23/23 |
| Suite Angular final `npm test` | **225 archivos, 2305/2305** |
| TypeScript app/spec, `--noEmit` | Ambos exit 0 |
| Build normal con `/kana-study/` y stats | Exit 0; **747.056 bytes iniciales** |
| Build candidato optimizado y auditor de presupuesto | Exit 0; **747.942 bytes iniciales < 750.000** |
| Navegador sobre candidato final | **15/15**, 24,8s: escritorio oscuro 1280px, móvil claro 390px y estrecho oscuro 320px |
| Traducciones nuevas | 46 claves ES/EN/CA, placeholders equivalentes; navegación EN/CA verificada |
| Simulación de auditoría FSRS | 67 transiciones y asserts originales PASS; no cambia el motor |
| `audit-kaishi-media.mjs` | PASS: medios/decodificador fuera del bundle inicial; dataset, scheduler, gates y SQL intactos |
| `audit-repo-docs.mjs --links-only` | PASS: sin enlaces rotos ni documentos inalcanzables |
| `git diff --check` | PASS |

Los builds conservan únicamente los cuatro warnings SCSS conocidos de Gramática. No hay script/configuración
de lint en el proyecto; no se afirma haber ejecutado un linter inexistente. TEMP/TMP se sitúan en
`.cache/deck-time-summary/tmp` para los procesos de tests, evitando la carpeta temporal virtualizada del sandbox.

La primera suite completa detectó dos casos del detalle original: el efecto nuevo borraba la selección
en su primer arranque. Se corrigió el efecto, conservando el comportamiento previo de Todos y sus tests
sin debilitar aserciones. Esa ejecución también tuvo un timeout de 5000ms del benchmark preexistente
de backups y un error de TestBed ya instanciado al entrar al spec de teclado Kana. Los casos dirigidos
y la suite completa final pasaron; no se modificaron esos specs, timeouts ni exclusiones para ocultarlos.
No se afirma estabilidad absoluta a partir de una única ejecución completa verde.
En los ensayos de navegador se ajustaron dos expectativas nuevas de fixtures: leer la escritura sin los
`rt` de furigana y contar también el grupo de repaso tras conservar progreso al cambiar a catalán.

Se revisaron visualmente las capturas generadas de ambas vistas, detalles y traducciones, en claro/oscuro.
La comprobación incluye ausencia de overflow, foco/Tab/restauración, recarga, undo, medianoche y Puyi.
Capturas y logs locales en `.cache/deck-time-summary/`; no se incorporan perfiles, credenciales ni datos
de usuarios al repositorio. Ejemplos: `time-desktop-dark.png`, `detail-narrow-dark.png`,
`summary-desktop-dark.png`, `summary-mobile-light.png`, `summary-ca-desktop-dark.png`.
El navegador utiliza un perfil efímero de Edge/Chromium, el candidato optimizado bajo `/kana-study/`,
IDB sintética y Supabase deshabilitado o contenido Puyi interceptado. No valida Supabase Auth real ni RLS remoto.
No se ejecutó Safari/WebKit ni se realizó aceptación en dispositivos físicos. Las incidencias de la auditoría
que no afectan al cálculo derivado de estas vistas siguen pendientes. La última revisión ajusta el contraste
del botón de práctica usando superficie primaria suave y texto semántico, sin modificar controles de estudio.

## Probar localmente

`npm start -- --host 127.0.0.1 --port 4300`, después abrir `http://127.0.0.1:4300/#/anki`.
Dentro de un mazo: Tarjetas → Por Tiempo → desplegar → abrir una tarjeta.
Estudiar hasta finalizar para consultar el resumen. Todos sigue siendo la primera vista.
Para reproducir las pruebas visuales: construir el candidato con `npm run build:manga-candidate` y
ejecutar `npx playwright test --config playwright.deck-learning.config.ts` con Edge instalado.
Recomendación adicional, no implementada: una futura vista histórica por fecha y las correcciones
temporales de la auditoría requieren una decisión separada, sin reiniciar historiales.
