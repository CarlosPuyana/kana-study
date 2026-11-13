# Mazos — reconstrucción del contrato Anki/FSRS

## Corrección acotada de la vista de Deshacer (10/11/2026)

Dos regresiones sintéticas demuestran que una lectura fallida después de
`undoReview` eliminaba `lastEvent` antes de restaurar la tarjeta, y que Reintentar
tras un fallo de escritura refrescaba la cola en lugar de reintentar Deshacer.
La vista conserva ahora el evento hasta completar las lecturas y restaurar la
tarjeta; pausa nuevas respuestas, cierre y refrescos mientras la reversión está
pendiente. Reintentar vuelve a la misma operación mediante la persistencia
idempotente existente. No se atribuye esta reproducción al historial real de la
usuaria ni se cambia la sincronización, FSRS o el formato de guardado.

La continuación de esta corrección se describe en J: incorpora origen durable,
reapertura atómica y recuperación local. La limitación de la primera entrega
queda sustituida por ese contrato, conservando las dos regresiones originales.

Contrato vigente: sección I para cola/sesión diaria y J para cierre/Deshacer.
Las secciones anteriores conservan la auditoría de la reconstrucción.

Trabajo local iniciado el 09/11/2026 sobre b334e69. El roadmap Kanji queda
detenido y sus 30 archivos locales se conservan. Sin cuentas reales, SQL,
commit, push ni despliegue. Validación cerrada el 10/11/2026; resultados y límites a continuación.

## A. Auditoría previa a modificar producción

| Comportamiento | Anki | Kana Study antes | Diferencia | Corrección aplicada |
|---|---|---|---|---|
| Botones | Again/Good son suficientes | Again=1, Good=3 | Ninguna | Conservar |
| Cada respuesta | Actualiza memoria/historial | Todas pasan por ts-fsrs | No hay regla de primera respuesta por ronda | Conservar |
| Pasos | Configurables; 1m/10m es una elección | 1m/10m y 10m fijos | No configurables | Exponer configuración validada |
| Hora de Learning/Relearning | Vencimiento intradiario | Cualquier due del día se ofrece inmediatamente | Adelanta minutos/horas | Comparar instante exacto |
| Fin de Learning/Relearning | Intervalo FSRS | Sobrescribe due a mañana y scheduledDays=1 | Política casera; UI también fuerza «mañana» | Retirar sobrescritura |
| Orden | Pasos intradiarios vencidos prioritarios; nuevas/Review configurables | Mezcla todo y separa hasta dos tarjetas distintas | Separación posicional propia | Retirar separación del aprendizaje normal |
| Fin de sesión | No elimina pasos programados | completedAt cierra nuevas; se reabren estados elegibles | No es un límite a reviews, pero adelanto distorsiona el final | Conservar historial, reabrir pasos cuando venzan |
| Refuerzos | Pasos del scheduler | Separación propia de presentación; no contador de consolidación | RUSH/intensivo es independiente | Conservar RUSH sin FSRS |
| Reintentos | Una respuesta confirmada | Caché de recibos solo custom; builtin add(event) puede duplicar tras fallo posterior | Contrato desigual | Recibo estable y CAS/idempotencia builtin |
| Aislamiento | Colección/perfil | Router comprueba epoch para custom/Puyi, solo owner para Japanese | A→B→A no detectado por ese guard | Aplicar epoch a todos |
| Historial | Respuestas, estado y memoria | Before/log/after, due, retención, duración por evento | Se dispone de evidencia; no historial de Nora | Preservar sin reescritura |

Versión efectiva instalada: ts-fsrs **5.4.2**, FSRS-6, parámetros predeterminados,
short-term activado, fuzz activado en producción y máximo 36500 días. El motor
ya contempla New/Learning/Review/Relearning; no se necesita reset ni inferir
estados nuevos. `DeckStudyService`, scheduler y vista son comunes a Japanese
1500, Puyi y personalizados; almacenamiento y permisos siguen separados.

## Fuentes primarias

- [Estudio y dos botones](https://docs.ankiweb.net/manual/studying).
- [Opciones, pasos y FSRS](https://docs.ankiweb.net/manual/deck-options).
- [Estados](https://docs.ankiweb.net/manual/getting-started).
- [Mazos filtrados](https://docs.ankiweb.net/manual/filtered-decks) y
  [estadísticas](https://docs.ankiweb.net/manual/stats).
- Backend oficial Anki **25.9.2**, instalado solo en `.cache/anki-parity/python`
  para generar referencias: [distribución](https://pypi.org/project/anki/25.9.2/).
- [Implementación de pasos 25.09.2](https://github.com/ankitects/anki/blob/25.09.2/rslib/src/scheduler/states/steps.rs).
- [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs), contrastado con
  el código efectivo instalado, sin actualizar la dependencia.

## B. Contrato antes de implementar

Con pasos iniciales 1m/10m: New Again→Learning paso 0 a 1m; New Good→Learning
paso 1 a 10m; Again reinicia el primer paso; Good avanza y al terminar usa el
intervalo que calcula FSRS. Review Again→Relearning a 10m; Relearning Again
reinicia 10m; Good termina los pasos y usa FSRS. No hay día de graduación fijo.
Se permite configurar pasos positivos intradiarios en minutos, sin inventar
intervalos de Review ni otro algoritmo. Retención 85/90/95 se conserva.

Learning/Relearning requieren due <= now, incluyendo pasos cuyo día cambió.
Review se vence por día Madrid. Primero pasos cortos vencidos; después Review
y nuevas según la preferencia. No se adelantan pasos ni se rellena con Review
de otro día. Al no quedar trabajo, se programa la actualización al siguiente
vencimiento/medianoche, sin bloquear futuros pasos por haber terminado una sesión.

Persistencia: la vista avanza solo tras confirmar; mismo recibo/snapshot al
reintentar, transacción progreso+evento+diario, CAS contra cardBefore y recibo
idempotente. Cambios A→B→A invalidan la activación. Los snapshots antiguos se
leen tal cual, incluido el due antiguo forzado a mañana; no se reprograman en
masa ni se reconstruyen fallos que no consten. Nuevas reglas desde la próxima
respuesta. Configuración ausente usa los pasos actuales sin escribir defaults.

No se declara paridad completa con todo Anki. Se fijan referencias, tolerancias
numéricas y diferencias de fuzz/calendario antes de emitir resultados.

## C. Implementación y contrato de guardado

El scheduler común usa exclusivamente Again=1 y Good=3 de ts-fsrs 5.4.2.
FSRS actualiza estabilidad y dificultad en **cada** respuesta, también en los
pasos de minutos. El planificador de pasos decide si continúa Learning/Relearning;
al acabarlos, el intervalo de Review lo proporciona FSRS. Se conservan pesos,
short-term, retención, fuzz y máximo de la configuración anterior. No hay una
segunda fórmula ni límites caseros para impedir intervalos largos.

Pasos configurables en Ajustes: de 1 a 10 valores enteros, positivos e inferiores
a 24 horas, con sufijos `m`/`h`. Defaults `[1,10]` y `[10]` cuando no hay opción
explícita. No se reprograma ninguna tarjeta al guardar Ajustes. Si se acorta la
lista, se limita el índice efectivo para interpretar la siguiente respuesta;
el snapshot previo y el log se conservan. No se admiten pasos vacíos, automáticos
ni pasos interdiarios en esta entrega.

La cola ofrece primero Learning/Relearning vencidos por instante. Review utiliza
el día Europe/Madrid y nuevas respeta el límite y orden configurado. `completedAt`
no cierra una cuota disponible ni oculta aprendizaje futuro. No hay separación
posicional de dos alternativas. Al esperar, se informa de pendientes y próximo
vencimiento, con timer al deadline/medianoche; foco y visibilidad refrescan la cola.
RUSH sigue siendo práctica independiente, sin eventos de revisión FSRS.

La vista muestra cuatro estados y los dos intervalos obtenidos de las ramas del
scheduler. Revelar no guarda una respuesta. Un preview que cruza día UTC o Madrid
se renueva visiblemente antes de aceptar una respuesta; no se guarda un cálculo
de hace dos días. Durante el mismo día el intervalo mostrado se mantiene y se
ancla a la hora real de respuesta. Se conserva el primer instante, duración y
recibo si el almacenamiento falla y hay que reintentar.

### Atomicidad, CAS y recuperación

- Japanese 1500 y Puyi usan la transacción IndexedDB existente para progreso,
  evento y diario. La nueva respuesta compara `cardBefore` con el snapshot actual,
  comprueba la cuota dentro de la transacción y fusiona IDs introducidos.
- El ID del recibo se genera una vez por valoración. Repetir un recibo ya confirmado
  no vuelve a aplicar FSRS ni duplica eventos. Un recibo conflictivo se rechaza.
- Personalizados reutiliza su transacción, journal, CAS y recibos existentes;
  se elimina su bloqueo diario paralelo y se comprueba la cuota atómicamente.
- Mientras falla el guardado se conserva la pregunta, se pausa el reloj y se ofrece
  Reintentar. Se bloquean valoraciones alternativas y Deshacer hasta resolverlo.
- Deshacer restaura el snapshot exacto y la cuota de nuevas; un undo antiguo no
  puede pisar una revisión posterior y repetir uno aplicado es un no-op local.
- Todos los bindings comprueban propietario **y revisión de activación**, también
  Japanese 1500. A→B→A invalida resultados de la activación anterior. No se reparten
  escrituras entre propietarios.

**Límite real:** outbox y datos canónicos builtin no comparten transacción. Si falla
outbox después del commit local, el reintento reconoce el recibo y vuelve a publicar
la proyección canónica actual sin retrocederla. Un cierre justo entre ambas fases
no tiene una nueva garantía de atomicidad cloud; no se ha creado otro protocolo de
sincronización. Custom conserva su journal local atómico. No se cambian SQL ni gates.

## D. Compatibilidad histórica

No hace falta migrar la base: ya se guardaban los cuatro estados FSRS. No se
escribe una versión ficticia de migración, no se infieren olvidos y no se recalcula
el mazo. Las reglas nuevas interpretan el estado existente desde su próxima respuesta.

| Registro existente | Tratamiento |
|---|---|
| Sin progreso | New, sujeto a la cuota diaria |
| Snapshot explícito State.New | Sigue siendo nueva; se conserva como cardBefore y se restaura íntegro al deshacer |
| Learning/Relearning con due futuro | Espera su instante, incluso si antes se ofrecía anticipadamente |
| Learning/Relearning ya vencido | Se ofrece sin exigir otro lote ni introducirla de nuevo |
| Review, incluso con antiguo due forzado a mañana | Conserva fecha, estabilidad y dificultad; próximo rating utiliza FSRS |
| Eventos y snapshots históricos | No se reescriben ni generan ratings retrospectivos |
| Diario/completedAt y separación antigua | Se conserva almacenado; no bloquea trabajo ni impone separación posicional |
| Configuración sin pasos | Defaults en lectura; no se sobrescribe la preferencia guardada |
| Backup/journal previo | Validación estructural y de linaje conservada; replay no aplica retroactivamente la nueva política de elegibilidad |

El contrato de backup conserva pasos opcionales y sigue comprobando snapshots,
heads, eventos y deduplicación. **La validación SQL custom actual solo admite los
campos originales de ajustes**: los pasos adicionales son locales y de backup;
antes de habilitar custom cloud habrá que adaptar explícitamente ese protocolo
con autorización independiente. Cloud/upload permanecen apagados. No se promete
sincronización remota de estos campos ni se modifica SQL para conseguirla.

## E. Investigación de これ y simulaciones

No se ha leído ni modificado el historial de Nora. El antiguo override «mañana»
acortaba intervalos, por lo que **no demuestra** el origen de tres meses. Había
adelanto de pasos y previews potencialmente obsoletos, ambos corregidos; no hay
prueba de que provocaran ese caso concreto. Una tarjeta madura sin un olvido
registrado puede producir meses legítimamente; eso tampoco demuestra que sus
fallos no se guardaran.

Para resolver el caso exacto faltan el ID/dirección/mazo/workspace, cardBefore,
ratings y logs de ayer/hoy, retención efectiva y cualquier undo o reconciliación.
No se inventa información ni se accede a su cuenta. La etiqueta «3 meses» redondea:
por ejemplo 75 días se muestran como 3 meses, sin alterar su due exacto.

Las siguientes cifras son perfiles **sintéticos**, retención .9 y fuzz desactivado
para reproducibilidad, usando el scheduler real. No son la referencia independiente
de Anki ni datos de la usuaria. La fixture `deck-kore-scenarios.json` conserva
before/after completos. Trece pruebas recorren además la transacción real y
comprueban evento persistido, snapshot y due igual al preview para cada fila.
Los casos encadenados y reanudación tienen pruebas adicionales de integración.

Estados: 0=New, 1=Learning, 2=Review, 3=Relearning. El paso es el índice interno 0-based.

| Caso | UTC de respuesta | Rating / estado | Paso posterior | S antes→después | D antes→después | Intervalo mostrado | Due UTC | Evento local |
|---|---|---|---|---|---|---|---|---|
| Kore A: nueva | 11-08T12:00 | again / 0→1 | 0 | 0.0000→0.2120 | 0.0000→6.4133 | 1 min | 2026-11-08T12:01:00.000Z | verificado #0 |
| Kore A: nueva | 11-08T12:01 | again / 1→1 | 0 | 0.2120→0.0834 | 6.4133→8.8063 | 1 min | 2026-11-08T12:02:00.000Z | verificado #1 |
| Kore A: nueva | 11-08T12:02 | good / 1→1 | 1 | 0.0834→0.1031 | 8.8063→8.7927 | 10 min | 2026-11-08T12:12:00.000Z | verificado #2 |
| Kore B: graduación | 11-08T12:12 | good / 1→2 | 0 | 0.1031→0.1258 | 8.7927→8.7792 | 1 día | 2026-11-09T12:12:00.000Z | verificado #3 |
| Kore C: olvido | 11-08T12:00 | again / 2→3 | 0 | 30.0000→2.3240 | 5.0000→8.3418 | 10 min | 2026-11-08T12:10:00.000Z | verificado #4 |
| Kore C: recuperación | 11-08T12:10 | good / 3→2 | 0 | 2.3240→2.3240 | 8.3418→8.3286 | 2 días | 2026-11-10T12:10:00.000Z | verificado #5 |
| Kore E: olvido | 11-08T12:00 | again / 2→3 | 0 | 90.0000→3.6031 | 5.0000→8.3418 | 10 min | 2026-11-08T12:10:00.000Z | verificado #6 |
| Kore E: recuperación | 11-08T12:10 | good / 3→2 | 0 | 3.6031→3.6031 | 8.3418→8.3286 | 4 días | 2026-11-12T12:10:00.000Z | verificado #7 |
| Kore E: Good sin olvido registrado | 11-08T12:00 | good / 2→2 | 0 | 90.0000→227.4725 | 5.0000→4.9902 | 8 meses | 2027-06-23T12:00:00.000Z | verificado #8 |
| Kore D: fallos ayer | 11-08T12:00 | again / 0→1 | 0 | 0.0000→0.2120 | 0.0000→6.4133 | 1 min | 2026-11-08T12:01:00.000Z | verificado #9 |
| Kore D: fallos ayer | 11-08T12:01 | again / 1→1 | 0 | 0.2120→0.0834 | 6.4133→8.8063 | 1 min | 2026-11-08T12:02:00.000Z | verificado #10 |
| Kore D: fallos ayer | 11-08T12:02 | again / 1→1 | 0 | 0.0834→0.0349 | 8.8063→9.5929 | 1 min | 2026-11-08T12:03:00.000Z | verificado #11 |
| Kore D: Good hoy | 11-09T12:00 | good / 1→1 | 1 | 0.0349→0.2473 | 9.5929→9.5785 | 10 min | 2026-11-09T12:10:00.000Z | verificado #12 |

A: dos Again y Good siguen en Learning a 10m. B: el siguiente Good termina los
pasos; aquí resulta 1 día por FSRS, no una imposición del código. C: Review con
S=30 olvidada entra en Relearning 10m y Good retorna a Review a 2 días. D: tres
Again ayer y Good hoy siguen en Learning a 10m. E: S=90 con olvido registrado
produce 10m y después 4 días; el Good alternativo **sin** olvido registrado produce
227 días. No se aplica un techo artificial a este último. En el caso G de la auditoría
SRS, S=30, D=5 y 30 días desde la última revisión, Good produce 85 días
(S=85.02789144), que la interfaz muestra como 3 meses. Así se reproduce esa
etiqueta en una Review madura sin atribuirle el historial de Nora.

Una exploración adicional de S=30/100/300/1000/5000/36500, D=1/5/9 y tiempos
1/30/90/365/3000 días, con dos Again registrados y Good al día siguiente, no
produjo 90 días (máximo observado 8). Es una exploración finita, no prueba de
imposibilidad para cualquier historial o configuración.

## F. Referencias Anki y límites de la comparación

`generate-anki-parity-reference.py` utiliza el backend oficial Python/Rust Anki
25.9.2 en una colección temporal sintética. No ejecuta SQL manual, no abre una
colección real y no añade dependencias a la aplicación. Genera la fixture
`anki-25.9.2-reference.json`, con estados Rust originales y ramas normalizadas.
Instalación de desarrollo: `python -m pip install --target .cache/anki-parity/python anki==25.9.2`;
generación: `python scripts/generate-anki-parity-reference.py`. Regenerarla obtiene
nuevas referencias temporales/fuzz; los tests ordinarios usan las referencias fijadas.

Son **30 casos oficiales** (diez situaciones × retención 85/90/95): nueva,
Learning primer/último paso y cruce de día, fallos ayer, Review joven/madura y
cruce de día, Relearning mismo día y día siguiente. Se comparan ambas ramas:
estado e índice exactos, minutos exactos y memoria a tres decimales por f32 Rust.
Anki no permite desactivar fuzz de Review: la comparación de días acepta el
sobre de fuzz explícito `ceil(max(días)*.05)+3`. **No es igualdad exacta de due
ni del RNG de Anki.** Las pruebas nativas adicionales sí comparan exactamente
las ramas con ts-fsrs sin fuzz.

Diferencias restantes:

- Anki tiene fuzz intradiario adicional; estos pasos usan las duraciones exactas
  de ts-fsrs. El PRNG de fuzz Review y el redondeo Rust f32 no son idénticos.
- Se conserva medianoche Europe/Madrid; Anki permite otro rollover y suele usar
  las 04:00. El cálculo diario interno de ts-fsrs usa días UTC; las referencias
  cubren cruces concretos, no demuestran equivalencia de todos los husos/horas.
- Pasos solo intradiarios, sin listas vacías/FSRS automáticos, pasos de días,
  optimizador, jerarquías, bury/leech ni mazos filtrados de Anki.
- Se conservan nuestros límites sin tope de Review y orden configurable; no se
  añade un límite máximo de repasos ni un learn-ahead. Estos son presets/opciones,
  no una nueva fórmula FSRS.
- Las etiquetas agrupan días en meses/años; el historial conserva due exacto.
- Atomicidad cloud builtin y custom settings remotos tienen los límites de C/D.

Por ello la entrega valida el **contrato acotado descrito**, no declara paridad
completa con toda versión, opción o colección Anki.

## G. Validación y evidencias locales

| Comprobación | Resultado |
|---|---|
| Mazos dirigido, scheduler, custom, protocolo, backup, RUSH | 314/314, 22 archivos |
| Backend oficial Anki | 30/30 casos, dentro de los límites indicados |
| Suite Angular final | 2761/2761, 252 archivos |
| TypeScript app/spec | Correcto (ambos comandos exit 0) |
| Navegador contrato común | 18/18: tres mazos, ES/EN/CA, 1280/390/320, claro/oscuro |
| Navegador artefacto `/kana-study/` | 33/33: Todos/Por Tiempo, historial, resumen, Undo, recarga, Madrid y deadlines |
| Regresión Manga × Mazos candidata | 3/3: diccionario, confirmación manual, OCR, FSRS/Undo, backup/restart, aislamiento |
| Auditoría SRS | 80 transiciones: 67 existentes + 13 simulaciones de これ |
| i18n y compiladores | audit:i18n correcto; 4/4 tests de compiladores |
| Build normal/candidato Pages | Correctos, seis warnings SCSS ya existentes |
| Inicial normal/candidato | 747650 / 748536 bytes; ambos estrictamente <750000 |
| Auditoría bundles y fronteras | Correctas; módulos/componentes de estudio diferidos; sin fixtures/test en producción |
| git diff --check | Correcto |

Logs y capturas están en `.cache/anki-parity/`; los recorridos del artefacto en
`.cache/deck-time-summary/` y la auditoría SRS en `.cache/srs-audit/`. Se inspeccionaron
capturas claras/oscuras, de ajustes, error recuperable y 320 px. Las fuentes de
pruebas quedan versionables; cachés, builds, perfiles y capturas no se incorporan.

Limitaciones del entorno: Chromium descargado no está instalado. Se usó Edge
Chromium instalado, sin descargar navegadores. La auditoría candidata es una copia
de ensayo en caché con únicamente channel=msedge y la ruta de import ajustada;
conserva todas sus aserciones. SDK/Auth usa HTTP sintético, **no valida Supabase
Auth real**. Firefox/WebKit no disponibles; Safari y dispositivos físicos pendientes.
El arnés público antiguo `audit-manga-public-build.mjs` no completó: espera un
único mazo y tres tabs de diccionario de una versión anterior (hoy hay dos mazos y dos tabs).
No se altera producto ni ese arnés ajeno para acomodarlo. La regresión candidata
vigente anterior sí completó 3/3.

Se sustituyeron las expectativas obsoletas de «graduar mañana», repetir antes del
due, separación posicional y cierre de lote, no aserciones de integridad. Los tests
de historial/resumen de navegador ahora avanzan el reloj al deadline **persistido**
antes de continuar. Se actualizaron fixtures que omitían cardBefore en DB vacía,
semillas CAS y cuotas de planificador; no se modifican Gramática/logout ni sus
reglas. Un reintento conserva la duración del primer intento (4s), no acumula la
espera del fallo (antes el test esperaba 7s). No hay sleeps, retries, skips ni only
para esconder fallos.

Una repetición detectó una aserción nueva que asumía orden cronológico en la
lectura custom (su contrato devuelve eventos por clave/ID). Se ordena explícitamente
por reviewedAt antes de comprobar la secuencia exacta [1,3,3]. No cambia el scheduler
ni se acepta otra secuencia; el navegador usa igualmente orden cronológico para
comparar recibos. También se prueba que un preview caducado no guarda hasta que
el usuario ha visto y confirmado el cálculo renovado.

## H. Archivos y alcance

Producción: scheduler/opciones/cola, persistencia común y builtin/custom,
route-resource/router, contrato de backup, ajustes/vista y contadores de Mazos,
registro diferido de copy en Stats/DeckCard, modelos y ES/EN/CA/compilador.
Pruebas: policy/daily queue/Anki references, ajustes, backup, páginas, planner,
proyección y fixtures de reconciliación; harnesses de navegador y auditoría SRS.

Los 30 archivos locales previos de K1 se compararon por SHA256 con
`.cache/anki-parity/baseline.json`: los 24 no compartidos permanecen idénticos;
solo se amplían INDEX, compilador i18n, ES/EN/CA y deck-study.generated compartidos.
No se cambian catálogos, FSRS de otros módulos, datos reales, SQL, workflow,
providers de release ni gates. Normal: cuatro gates apagados; candidato conserva
custom/assisted Guest-only activos y cloud/upload apagados, como antes.
HEAD sigue en b334e69. No hay staging, commit, push ni despliegue de esta tarea.

Inventario de esta entrega (excluye los archivos exclusivos previos de K1):
- `docs/INDEX.md`
- `docs/features/decks/DECKS_ANKI_PARITY_REBUILD.md`
- `manual-tests/deck-learning/card-history.spec.ts`
- `manual-tests/deck-learning/deck-learning.spec.ts`
- `manual-tests/deck-learning/dynamic-daily-queue.spec.ts`
- `manual-tests/deck-learning/scheduled-step.ts`
- `manual-tests/decks-anki-parity/fixture.ts`
- `manual-tests/decks-anki-parity/learning.spec.ts`
- `playwright.decks-anki-parity.config.ts`
- `scripts/compile-i18n.mjs`
- `scripts/generate-anki-parity-reference.py`
- `scripts/srs-audit/runner.ts`
- `src/app/core/models/deck-catalog.model.ts`
- `src/app/core/models/deck.model.ts`
- `src/app/core/services/custom-deck-validation.ts`
- `src/app/core/services/custom-deck.repository.spec.ts`
- `src/app/core/services/custom-deck.repository.ts`
- `src/app/core/services/daily-study-planner.service.spec.ts`
- `src/app/core/services/deck-backup-contract.ts`
- `src/app/core/services/deck-backup.spec.ts`
- `src/app/core/services/deck-database.service.ts`
- `src/app/core/services/deck-dynamic-daily-queue.spec.ts`
- `src/app/core/services/deck-learning-options.ts`
- `src/app/core/services/deck-persistence-router.ts`
- `src/app/core/services/deck-route-resource.ts`
- `src/app/core/services/deck-scheduler-policy.spec.ts`
- `src/app/core/services/deck-scheduler.service.spec.ts`
- `src/app/core/services/deck-scheduler.service.ts`
- `src/app/core/services/deck-settings.service.spec.ts`
- `src/app/core/services/deck-settings.service.ts`
- `src/app/core/services/deck-study-time.ts`
- `src/app/core/services/deck-study.service.spec.ts`
- `src/app/core/services/deck-study.service.ts`
- `src/app/core/services/fixtures/anki-25.9.2-reference.json`
- `src/app/core/services/fixtures/deck-kore-scenarios.json`
- `src/app/core/services/lexical-knowledge-projection.spec.ts`
- `src/app/core/services/srs-audit.spec.ts`
- `src/app/core/services/sync-reconciliation.spec.ts`
- `src/app/features/anki-settings/anki-settings.page.html`
- `src/app/features/anki-settings/anki-settings.page.ts`
- `src/app/features/anki-settings/deck-settings-audit.spec.ts`
- `src/app/features/anki-stats/anki-stats.page.ts`
- `src/app/features/anki-study/anki-study.page.html`
- `src/app/features/anki-study/anki-study.page.spec.ts`
- `src/app/features/anki-study/anki-study.page.ts`
- `src/app/features/anki/components/deck-card/deck-card.spec.ts`
- `src/app/features/anki/components/deck-card/deck-card.ts`
- `src/assets/i18n/ca.json`
- `src/assets/i18n/core.generated.ts`
- `src/assets/i18n/deck-study.generated.ts`
- `src/assets/i18n/en.json`
- `src/assets/i18n/es.json`


## I. Actualización de producto: Learn Ahead y una sesión diaria (10/11/2026)

Esta sección sustituye, para el contrato vigente, la espera obligatoria y la
reapertura del mismo día descritas en B/C. El resto de la auditoría y sus resultados
son históricos y se conservan. Base real de este encargo: `e4b549f`, árbol limpio.
No se ha modificado Kanji K1, Conjugaciones, otros módulos, SQL ni gates.

### Cola y transición

Ventana fija predeterminada de 20 minutos, reutilizando `DECK_LEARNING_AHEAD_MS`.
Primero Learning/Relearning ya vencidos; después Review y New según el orden y
cuota configurados. **Solo si no queda trabajo ordinario** se toma el primer paso
Learning/Relearning con due <= ahora + 20m. Desempate por due e ID. No hay
separación posicional, adelanto de Review de otro día ni introducciones extra.

La elección adelantada lleva contexto interno: añadir `advanced:true` manualmente
no autoriza una respuesta. Antes de valorar se vuelve a comprobar la cola; si
hay otro trabajo o ya no está dentro de ventana, se rechaza la selección antigua.
Un recibo de reintento conserva la respuesta real original, como antes.

Ejemplo: due 19:10 y respuesta a las 19:02. El log conserva 19:02, el snapshot previo
conserva 19:10 y el scheduler calcula desde 19:02. No se simulan ocho minutos ni
se cambia `lastReview` al vencimiento. Continúan Again=1, Good=3, pasos y matemática
FSRS originales. Una tarjeta puede requerir más respuestas reales; no se gradúa
por el hecho de haberla mostrado anticipadamente.

Fuentes: [Preferencias de Anki](https://docs.ankiweb.net/manual/preferences),
[opciones](https://docs.ankiweb.net/manual/deck-options),
[cola intradiaria oficial 25.09.2](https://github.com/ankitects/anki/blob/25.09.2/rslib/src/scheduler/queue/learning.rs).
`generate-anki-learn-ahead-reference.py` genera una colección temporal y fija
learn_ahead_secs=1200 mediante la API oficial, sin SQL manual ni datos de usuarios.
La fixture nueva conserva 12 escenarios (85/90/95): Learning primer paso a 19m,
último paso a 8m, Relearning a 19m y exclusión a 21m. Se contrasta tanto si Anki la
ofrece como ambas ramas de respuesta. Estados/pasos/minutos son exactos; memoria
f32 y fuzz de días conservan las tolerancias explícitas de F. El backend sigue
siendo Anki 25.9.2 y la librería de aplicación sigue en ts-fsrs 5.4.2.

### Una sesión por mazo, workspace y día Madrid

Se reutiliza `DeckDailyState`, sin campos nuevos ni migración de datos:

- `completedAt` ausente: todavía no se abrió la sesión. `null`: sesión iniciada
  durablemente y reanudable. Un timestamp: sesión cerrada hasta el siguiente día.
- Abrir Aprender persiste el inicio. Salir no responde, no reinicia pasos y no
  cierra la sesión; la portada ofrece **Reanudar sesión** si hay trabajo elegible.
- El cierre automático ocurre al no quedar vencidas, nuevas permitidas ni pasos
  adelantables. No se cierra por terminar un lote mientras exista ese trabajo.
- **Terminar por hoy** cierra voluntariamente en cualquier pregunta, incluso con
  cuota o pendientes. No valora la tarjeta mostrada ni modifica su memoria.
- Un paso a más de 20m conserva el due exacto. Si se cierra hoy, no se ofrece al
  vencer más tarde ese mismo día: estará disponible mañana si entonces está vencido.
- La portada bloquea Aprender, muestra la fecha de **próxima sesión**, y mantiene
  un acceso al resumen/RUSH. La fecha de sesión no se presenta como due de la tarjeta.
- El resumen se reconstruye de los eventos canónicos ya persistidos y el cierre;
  no hay otra copia de ratings ni otra fuente de estadísticas. RUSH no añade eventos
  FSRS. Se puede practicar el conjunto de palabras estudiadas hoy o las difíciles.

El límite de nuevas y la programación de memoria siguen siendo independientes.
Cambiar cuotas, Ajustes o reabrir una ruta no elimina el cierre. Se honran también
los marcadores numéricos históricos sin reescribirlos. Medianoche Europe/Madrid
abre el registro del siguiente día; probados días DST de 23 y 25 horas y recarga.

### Durabilidad, fallos, Deshacer y concurrencia local

Los commits de review builtin/custom comprueban el cierre **dentro** de su
transacción, no solo en la vista. Una respuesta antigua no puede atravesar un
cierre ya confirmado. La escritura del diario conserva el primer cierre y los
IDs introducidos actuales; iniciar de nuevo no lo sustituye por null. No se crean
sesiones paralelas por doble clic. Las transacciones serializan cierre y review:
si la revisión entra primero, queda incluida; si el cierre entra primero, se rechaza.

Un fallo de cierre conserva pregunta y memoria, pausa el reloj y permite Reintentar.
El reintento mantiene el día/instante original aun si cruza medianoche. Se comprueba
propietario y revisión de activación durante la escritura del diario. A→B→A invalida
el cierre pendiente. Una prueba de aislamiento que antes esperaba terminar una
escritura antigua ahora exige su cancelación; conserva intacto el contrato de RUSH
(captura de propietario), su outbox y los asserts de que B no recibe datos de A.

Deshacer funciona mientras la sesión está abierta. Tras cerrar, el botón queda
inactivo: no se usa para abrir una segunda sesión. Si una operación de undo llega
por API interna, restaura el snapshot pero conserva el cierre; hay regresiones
builtin/custom y backup. No se reescribe el journal histórico de versiones anteriores
que sí hubieran reabierto un día: su replay mantiene sus registros originales.

Límites: la sesión diaria es una regla **propia del producto**, no una regla universal
de Anki. No garantiza exclusión distribuida entre dispositivos offline; no se ha
introducido lease remoto ni cambiado SQL. Permanece la separación transaccional
builtin/outbox descrita en C y la limitación de ajustes cloud de D. Se conservan
las diferencias de fuzz, rollover, calendario UTC interno y opciones avanzadas de F.
No se afirma paridad completa ni se han activado cloud/upload custom.

### Validación específica de esta actualización

| Comprobación | Resultado de esta actualización |
|---|---|
| Dirigidos de Mazos/backup/protocolo/RUSH | 354/354, 23 archivos |
| Suite Angular | 2801/2801, 253 archivos; repetida correctamente tras los ajustes |
| Referencias nuevas Anki | 12 casos oficiales de cola y ambas ramas; conserva también los 30 anteriores |
| Navegador Learn Ahead/cierre | 24/24: tres mazos, ES/EN/CA, fallo de rating/cierre, recarga y workspace |
| Navegador artefacto Pages | 33/33 en escritorio oscuro, 390 claro y 320 oscuro |
| Regresión Manga × Mazos | 3/3; SDK/HTTP sintético, no Supabase Auth real |
| TypeScript app/spec | Correctos |
| FSRS | Auditoría 80 transiciones correcta; no se cambia su matemática |
| i18n | Auditoría y 4/4 tests; 34 claves de sesión con placeholders ES/EN/CA sincronizados |
| Builds Pages normal/candidato | Correctos; seis warnings SCSS previos |
| Inicial normal/candidato | 748126 / 749012 bytes, estrictamente inferiores a 750000 |
| Bundles/fronteras y git diff --check | Correctos; fixtures y código de desarrollo fuera del bundle |

Se inspeccionan capturas claras/oscuras y 320 px. RUSH se coloca dentro del encabezado
del resumen, preservando sus dos columnas. Solo se amplían el modelo de conteos,
`deck-study.service.ts`, elegibilidad, guardado de diario/review builtin y custom,
la página de estudio, DeckCard y ES/EN/CA con su dominio generado. Nuevos: generador
Python, fixture oficial y `deck-learn-ahead.spec.ts`. Las otras modificaciones son
pruebas afectadas y esta sección documental. No cambian catálogos, parámetros FSRS,
providers de release, dependencias ni sincronización experimental.

Edge Chromium instalado fue el navegador disponible. Safari/dispositivos físicos y
Supabase Auth real no se han validado. El arnés Manga se ejecuta con la misma copia
local que selecciona Edge y conserva sus aserciones; Firefox/WebKit no están instalados.
Las comprobaciones de esta entrega no acceden a cuentas reales. HEAD permanece en
`e4b549f4442ab249310105a96cb8869e60fa549f`, sin staging, commit, push ni despliegue.

Los tests que exigían esperar pasos cortos, reabrir `completedAt` o usar Deshacer
para romper el cierre se han sustituido por el contrato autorizado arriba. No se
elimina cobertura: siguen comprobándose IDs, snapshots, due, memoria, secuencia de
eventos y restauración exacta. Las fixtures de navegador inicializan ahora IndexedDB
desde Tarjetas → Por Tiempo; abrir Aprender sin trabajo ya es una sesión que puede terminar y
no debe utilizarse como simple inicializador de una base de prueba.

Los controles nuevos tienen clases propias, separadas de `.undo`: se preserva el
selector existente de Deshacer y se reutiliza su estilo sin rediseño. Los arneses
esperan la carga real de Puyi tras reload. No hay sleeps, skips, only ni retries
para ocultar fallos. Evidencias nuevas únicamente en `.cache/learn-ahead/`, capturas
Playwright en los directorios existentes. No se incluyen builds/cachés en Git.

## J. Deshacer tras cierre automático y recuperación local (10/11/2026)

Se añaden a DeckDailyState dos campos opcionales: closureOrigin (automatic o
voluntary) y closedByReviewId. No hay migración ni inferencia de cierres antiguos.
El cierre automático conserva el último evento inequívoco del día; el voluntario
y los históricos siguen cerrados. El inventario y replay de backup admiten los
campos nuevos y conservan los journals anteriores.

Deshacer valida el evento canónico, el head/snapshot actual, el día Madrid y
el origen del cierre dentro de la transacción. La misma transacción restaura
cardBefore, evento, cuota y completedAt:null en el mismo registro diario. No crea
otra sesión. Un cierre automático compara además su snapshot dentro de la
transacción: un cierre calculado antes de una reversión no puede cerrar su estado
restaurado. Una revisión posterior, un día distinto o una activación A→B→A
invalidan la operación correspondiente.

Antes de ejecutar se guarda un marcador local por workspace/mazo con el evento
inmutable y la intención de reapertura. No forma parte del protocolo cloud.
Tras recargar se reconcilia el marcador con evento, snapshot y cuota canónicos.
Una reversión confirmada se verifica y finaliza automáticamente, sin repetir sus
efectos. Una no ejecutada permite reintento seguro; si ha cambiado el día o el
cierre no permite deshacer, se archiva la solicitud intacta, sin revertir la
respuesta ni reabrir el día anterior. Un marcador ilegible o un estado posterior
incompatible conserva sus datos y muestra un diagnóstico específico, sin inventar
una recuperación. Los cierres voluntarios e históricos siguen bloqueados.

Los integrados usan desde el 12/11/2026 una ampliación aditiva de IndexedDB v2:
la misma transacción de Undo deja un recibo de publicación. Un fallo posterior
del outbox no impide continuar localmente una vez verificada la reversión. El
recibo se reintenta tras lecturas/reinicio con el estado canónico actual y compara
la revisión del outbox para no sustituir escrituras concurrentes. Los personalizados
conservan su journal/recibo existente. No cambian transporte cloud, SQL ni FSRS.
Los diagnósticos registran fase, código y tipo de excepción, sin contenido personal.

Reproducción: la versión anterior rechaza un marcador válido al pasar medianoche
incluso si Undo ya está confirmado; los rechazos poscommit también dejaban la vista
bloqueada. Esto demuestra mecanismos de fallo, no la causa concreta del perfil de
Nora, que no se ha abierto ni modificado. Para verificarlo: conservar primero una
copia completa de los datos del sitio (IndexedDB y localStorage), cerrar pestañas
antiguas, abrir la versión corregida y reanudar sin valorar tarjetas inicialmente.
Comparar tarjeta, cuota e historial; ante diagnóstico de inconsistencia conservar
el almacenamiento y solicitar revisión, sin borrar claves ni restaurar datos atrás.

Límites: la información corrupta o contradictoria requiere revisión y no se borra.
No se garantiza concurrencia distribuida entre dispositivos ni persistencia si
el navegador elimina el almacenamiento. No se han usado cuentas reales.

Validación urgente (12/11/2026): 151 tests dirigidos más 20 de integración; global
final 3493/3493. La primera global detectó dos incompatibilidades de apertura de
versión en la copia Guest, corregidas sin cambiar su política. Playwright 36/36
en los tres mazos y ES/EN/CA, con 9 reintentos recomprobados sobre la vista final.
Node 24.15.0, npm ci y build:manga-candidate: auditoría estricta 707008/750000 bytes,
sin cambiar límites. Permanecen los warnings SCSS previos de otros módulos.

Validación: 99/99 tests dirigidos finales (incluye backup exacto y cuota), 27/27
Playwright nuevos en Japanese 1500/Puyi/custom, ES/EN/CA, escritorio y móvil.
La única suite global ejecutada detectó una regresión en la conservación de
introducciones; se corrigió y su test pasó en la repetición dirigida de 99 tests.
El resto de la ejecución global pasó (2864 tests). No se repitió la suite completa.
Build correcto, seis warnings SCSS previos; límite inicial y carga diferida
comprobados en las estadísticas del artefacto. Evidencias en .cache/deck-undo-close/.

Comprobación previa a Deshacer en Vocabulario/Kanji (10/11/2026): suite completa
**2866/2866**, 258 archivos, incluida la regresión de cuota corregida. La primera
ejecución agotó los cinco segundos del benchmark de backups; la repetición completa
con cuatro workers pasó sin cambiar tests ni producción de Mazos.


## K. Retirada urgente de Deshacer en Mazos (13/11/2026)

Sustituye el acceso de usuario descrito en J: Deshacer no está disponible ni en
estudio ni en el resumen. Aprender/Reintentar no leen, validan ni ejecutan intents
antiguos. Se conservan intactos los marcadores, snapshots, eventos, diarios y
journals; no se borran claves ni se reconstruye progreso. El estado canónico de
las transacciones confirmadas determina la cola y el bloqueo diario. Los recibos
de publicación existentes siguen pendientes de publicación, sin nuevas reversiones.
Los servicios históricos permanecen por compatibilidad y pruebas, sin llamadas
desde la pantalla. Una avería real del almacenamiento conserva el error seguro.
La corrección requiere publicar la nueva versión; no se ha abierto el perfil real.
