# Auditoría funcional y visual de Ajustes de Mazos

**Estado posterior:** los hallazgos siguientes describen la auditoría original.
Se han implementado [correcciones y refinamiento](DECK_SETTINGS_IMPROVEMENTS.md),
incluida persistencia local de mixed, guardado, validación, copy, foco y contraste.
Consultar esa entrega para el comportamiento y los resultados vigentes.

06/11/2026. Investigación sobre el estado local de [cola dinámica](DECK_DYNAMIC_DAILY_QUEUE.md),
sin modificar su implementación ni la pantalla auditada. Los cambios previos se conservan.
Solo se añaden pruebas, su configuración Playwright y documentación. Sin commit, push,
despliegue, migraciones ni datos de usuarios reales.

## Resultado ejecutivo y clasificación

Los tres ajustes tienen efecto real: controles → persistencia → selección/FSRS → evento.
La selección de nuevas por order es independiente de su posición antes/después/mezclada.
No se ha encontrado una nueva corrupción de memoria, fechas o cupos causada por la cola.
Sí hay explicaciones obsoletas, excepciones poco visibles y problemas de guardado/accesibilidad.
Recomiendo conservar la estructura visual y realizar un refinamiento, no un rediseño completo.

| Clasificación | Hallazgo | Prioridad propuesta |
| --- | --- | --- |
| Verificado | Cupo independiente de repasos, order estable, tres posiciones y FSRS con retención elegida | Conservar |
| Problema confirmado | Sigue visible la explicación de adelanto de hasta 20 minutos, contraria a la nueva cola | P1 antes de publicar |
| Problema confirmado | Fallo de localStorage: la página confirma guardado aunque solo cambia memoria; el aviso global sí notifica el fallo | P1 antes de publicar |
| Problema confirmado | Radios operables por teclado con indicador de foco invisible | P1 accesibilidad |
| Problema confirmado | Contraste: GUARDAR oscuro 3,68:1 y aviso naranja claro 3,07:1 | P1 accesibilidad |
| Problema confirmado | Custom admite 10001 en el formulario pero su repositorio rechaza >10000; el error persiste después de guardar un valor válido | P2 validación/mensajes |
| Política con comunicación insuficiente | El override de hoy prevalece sobre el cupo base; cambiar el base no reabre un día completado | P2 explicar, sin cambiarlo automáticamente |
| Decisión a especificar | mixed conserva acumulador durante la página, pero lo reinicia al recrearla; puede cambiar la próxima posición | P2 decidir persistencia |
| Recomendación visual | Reducir ayuda inicial y situar los ajustes principales antes de multimedia | P2 refinamiento |
| Riesgo potencial | Restauración de preferencias builtin no valida semánticamente el JSON; valores manipulados/obsoletos podrían llegar al scheduler | P2 investigación posterior, no evidencia de datos reales corruptos |

Los tests de caracterización de problemas describen el comportamiento actual; que pasen
no significa que el problema haya sido corregido. No se modifica ninguna decisión funcional.

## Arquitectura: funciones concretas

| Responsabilidad | Código real |
| --- | --- |
| Ruta y mazo activo | `createDeckRouteResource`, `DeckCatalogService.get/load/index`, fences de owner/epoch/revision |
| Controles y borrador | `features/anki-settings/anki-settings.page.ts/html/scss`; `draft`, `setNewCards`, `setOrder`, `setRetention` |
| Guardado builtin/Puyi | `AnkiSettingsPage.save` → `DeckSettingsService.save(deckId, draft)` |
| Guardado custom | `AnkiSettingsPage.save` → `CustomDeckRepository.saveSettings(opId, deckId, draft, owner)` |
| Preferencias efectivas | `DeckSettingsService.settingsFor`: builtin/Puyi desde mapa por ID; custom desde `deck.settings` del catálogo |
| Almacenamiento builtin/Puyi | `StorageService.set/get`, `workspaceStorageSignal`; clave `kana-study.deck-settings.v1` |
| Workspace | Guest sin prefijo, usuarios bajo `kana-study.workspace.<id>.`; signals recargan al cambiar workspace |
| Almacenamiento custom | Registro de mazo en IndexedDB por workspace, operación local `settings`, validación y revisión existentes |
| Límite efectivo | `DeckStudyService.snapshot` y guard de `rate`; daily-state por deckId/fecha Madrid |
| Selección/posición | `snapshot`: nuevas por order; `chooseNext`: orden elegido + `separatedDeckChoice` |
| Retención | `DeckStudyService.preview` → `DeckSchedulerService.preview` → `generatorParameters({request_retention})` → `fsrs.repeat` |
| Historial/fechas | `rate` → commit transaccional de tarjeta/evento/daily; `deckTimeGroups` e historial leen los resultados guardados |

Los defaults Japanese 1500/Puyi son 10 nuevas, mixed y 90 %. Custom nace con los
valores de su definición; el fixture usa los mismos defaults. La pantalla restaura
su borrador al cargar el recurso/cambiar workspace. No guarda hasta pulsar GUARDAR,
salvo las preferencias multimedia, que tienen su propio mecanismo y no son estos tres ajustes.

Builtin/Puyi usan el almacenamiento legacy que puede encolarse para una cuenta cuando
corresponda; custom registra su journal local. Esta auditoría no activa sync/upload
custom ni comprueba entrega cloud de preferencias. Un catálogo público Puyi no comparte
la configuración o progreso privado de sus estudiantes.

## Tarjetas nuevas por día

Regla exacta:
`effectiveNewLimit = daily.newLimitOverride ?? settings.newCardsPerDay`.
Quedan `max(0, effectiveNewLimit - introducedEntryIds únicos)` introducciones;
se limita además por el número de nuevas disponibles. El índice activo se ordena por
order e ID; únicamente se selecciona ese prefijo. No hay selección aleatoria.

Pruebas UI → servicio → cola: 40 Review de días/horas distintas del día actual y 100
nuevas sintéticas. Con 0/1/10/120 configuradas se obtienen 0/1/10/100 nuevas y siempre
40 repasos. Dentro de la lección una nueva puede recibir varias valoraciones FSRS:
solo su primera introducción consume un ID del cupo. No es un máximo de respuestas.

Recarga/salida no reinician daily-state. Se verifica una introducción real, snapshot
exacto y un solo evento tras recrear TestBed; el cupo restante sigue en uno de dos.
La interfaz de navegador confirma el mismo comportamiento al salir y recargar.
La siguiente medianoche Madrid reinicia el contador del nuevo día, sin borrar progreso.
Los tests de la cola cubren además cambio de mes/año y ambos DST (23/25 horas).

Reducir el límite no elimina progreso ni oculta repasos. Aumentarlo permite introducir
más si el día está abierto y no hay override. Excepciones verificadas:

- Tres introducidas, base 5: quedan 2. Tras crear override=10 con el control «más nuevas
  hoy», guardar base 0 en Ajustes conserva effectiveNewLimit=10 y quedan 7 ese día.
  El cero base rige el día siguiente, no sustituye ese override.
- Un día completado con base 0 permanece sin nuevas al guardar base 10. El control
  explícito de ampliar hoy reabre el día y en el fixture permite 15.

Son reglas existentes, no pérdida de configuración. El formulario no muestra ese
valor efectivo ni explica ambas excepciones: puede parecer que el ajuste no funciona.
Recomiendo diferenciar «límite habitual» y «límite de hoy», indicando cuándo entra en vigor,
antes de decidir si se altera alguna precedencia.

## Order, before-reviews, after-reviews y mixed

Nombres visibles ES: «Antes de los repasos», «Después de los repasos», «Mezcladas con
los repasos». Cambian posiciones, no qué palabras nuevas se seleccionan.
Los fixtures n0/order67 y n1/order68 siempre se introducen en ese orden.

Se consumió con el motor real una lección de 40 repasos y dos nuevas para cada opción.
Cada una termina con 42 tarjetas únicas y 44 eventos: las dos nuevas necesitan dos
Good para graduar mañana. Los 40 Review conservan su orden cronológico relativo.
Antes introduce n0/n1 al comienzo; después consume primero los 40 Review; mixed
intercala nuevas antes de acabar los 40. También se prueban cero repasos, cero nuevas,
reinserción, separación y compatibilidad con los fixtures custom/Puyi.

mixed no usa RNG. Si hay nuevas y programadas, acumula:
`debt += nuevasRestantes / (nuevasRestantes + programadasRestantes)`.
Cuando llega a 1 prefiere una nueva y descuenta 1 si esa es la selección final.
Las programadas incluyen Learning/Relearning: no se rebarajan. Se recalcula la
proporción con las candidatas reales tras cada respuesta; no es una posición fija
precalculada para toda la sesión ni una garantía de «cada N preguntas».

La separación puede prevalecer temporalmente sobre esa preferencia, usando identidades
distintas y sin cambiar due. La página conserva `decision.cursor` entre respuestas.
Pero su cursor privado comienza con `{debt:0}` al recrearse y no se reconstruye desde
eventos. Reproducción verificada: 40 Review +10 nuevas, cuatro Review Good; con el
cursor acumulado la siguiente es nueva, con cursor cero la siguiente es Review.
No cambian selección, cupo, eventos ni memoria; sí la posición siguiente.
No lo llamaría «mezcla estable al recargar» ni «barajado aleatorio». Conviene acordar
si el producto necesita conservar esa fase o si basta documentar el reinicio.

## Retención: efecto matemático y ciclo de vida

UI: 80/85/90/95/97 %, default 90 %. `DesiredRetention` es number; el servicio acepta
cualquier finito `0<r<1`, no solamente esos cinco. Custom aplica el mismo rango.
En nuevos por día el builtin acepta finitos no negativos y redondea hacia abajo;
custom exige entero seguro entre 0 y 10000. El input HTML exige mínimo 0 y step=1,
pero no declara máximo. Los cinco radios no permiten un porcentaje arbitrario desde UI.

Motor instalado: ts-fsrs 5.4.2 / FSRS-6.0, parámetros/pesos sin modificar.
Comparación reproducible mediante controles reales que guardan la retención, después
`DeckStudyService.preview`, misma tarjeta Review S=30/D=5/reps=8/lapses=0,
lastReview 07/10/2026 11:00Z; respuesta Good el 06/11/2026 11:00Z.
Fuzz desactivado solo por token en los tests para aislar el efecto de r:

| Retención | Intervalo Good | Due UTC | Estabilidad posterior | Dificultad posterior |
| --- | --- | --- | --- | --- |
| 85 % | 162 días | 17/04/2027 11:00 | 85,02789144 | 4,99022837 |
| 90 % | 85 días | 30/01/2027 11:00 | 85,02789144 | 4,99022837 |
| 95 % | 34 días | 10/12/2026 11:00 | 85,02789144 | 4,99022837 |

La retención cambia el intervalo objetivo, no necesariamente S/D de la misma respuesta.
New Good sigue siendo +10 minutos con los tres valores. Graduación/recuperación conserva
la regla de mañana Madrid; no todos los estados deben dar fechas diferentes.
Los tests de navegador mantienen el fuzz productivo: verifican el parámetro guardado
en el evento y el efecto consolidado sin exigir un número exacto incompatible con fuzz.

Cambiar 90→95 guarda la preferencia, no reprograma snapshots ni crea eventos. Por Tiempo
queda igual hasta que una valoración posterior cambia realmente un due. El evento
registra `desiredRetention` y el historial individual lo expone cuando existe ese campo.
Guardar una preferencia no completa ni duplica una respuesta.

Excepción: una respuesta ya revelada conserva su preview anterior. El test revela a
90, guarda 95, responde usando ese preview y confirma evento a 90 /85 días. El siguiente
preview usa 95. Es el contrato de preview congelado, no una retención ignorada por FSRS.
Recomiendo explicar «se aplica a los próximos cálculos» y no reprogramar históricos
automáticamente. Persistencia por mazo/workspace, recarga y Puyi están verificadas.
Custom usa ajustes en su registro del catálogo: guardar un mapa legacy con su ID no
sustituye los ajustes del repositorio custom.

## Problemas funcionales: reproducción y propuesta, sin arreglar

1. **Guardado builtin falso positivo.** Provocar QuotaExceededError sintético solo al
   escribir la clave de ajustes; cambiar a 95 % y guardar. `StorageService` marca
   persistenceFailed, pero `DeckSettingsService.save` devuelve true y la página muestra
   guardado. Al recrear servicios vuelven defaults. Hay aviso global de persistencia,
   por lo que no se afirma que el fallo sea totalmente silencioso. Propuesta: propagar
   el resultado de escritura y no confirmar éxito; definir rollback o estado sin guardar.
2. **Custom, máximo y error persistente.** Introducir 10001: HTML y newCardsValid lo
   consideran válido, el repositorio rechaza el máximo y sale storageError genérico.
   Guardar después 2: el repositorio guarda 2 pero `error()` permanece true. Propuesta:
   alinear validación con límites reales y limpiar errores al editar/reintentar con éxito.
3. **Texto de política obsoleto.** Ajustes aún promete adelanto máximo de 20m, cuando
   la cola ya admite todas las programadas hoy por fecha. Actualizar ES/EN/CA y su copia
   compilada en una entrega autorizada; no volver a cambiar la cola para ajustarse al texto.

Los dos primeros son anteriores a esta auditoría; no son pruebas de que la cola dinámica
corrompa las preferencias. No se cambian almacenamiento, RLS, protocolo ni FSRS.

## Auditoría visual y accesibilidad

Capturas de artefacto candidato real con perfil limpio, Edge y datos sintéticos,
sin CSS inyectado. Temas oscuros/claros y rutas bajo `/kana-study/`.

| Perfil | Pantalla | Alto total | Inicio retención | GUARDAR desde arriba |
| --- | --- | --- | --- | --- |
| Escritorio oscuro/claro | 1440×1000 | 1829px | 705px | 1701px |
| Portátil oscuro | 1280×800 | 1829px | 705px | 1701px |
| Tablet claro | 768×1024 | 1912px | 726px | 1784px |
| Móvil claro | 390×844 | 2377px | 804px | 2249px |
| Móvil estrecho oscuro | 320×800 | 2620px | 924px | 2492px |

Fortalezas: estructura semántica form/fieldset/legend, opciones con labels completos,
radio-card de 66px o más, input/botón de 48px, retorno de 44px. Sin overflow horizontal
en los seis perfiles. Estado seleccionado por radio/borde, controles nativos con
teclado y un estado de guardado role=status. La estética de superficies/bordes usa
los tokens actuales y encaja con Kana Study. Los temas son coherentes.

Debilidades verificadas:

- Política y multimedia preceden a los tres controles principales. En 320px ni siquiera
  empieza retención en el primer viewport. GUARDAR queda a más de tres alturas de pantalla.
  Las recomendaciones añaden otro bloque entre retención y el límite diario.
- Los subtítulos de las retenciones son 11,52px: contraste medido suficiente en la
  muestra no seleccionada (6,00 oscuro /6,08 claro), pero pequeños y secundarios.
- GUARDAR usa blanco sobre primary: 3,68:1 oscuro y 5,17:1 claro, fuente 16px/850.
  A ese tamaño no es texto grande según la regla de contraste AA (normal ≥4,5:1).
  Referencia primaria: [W3C, contraste mínimo](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).
- El aviso naranja de recomendaciones en claro mide 3,07:1 (`#d97706` sobre `#f8fbff`),
  también insuficiente para su texto normal. En oscuro ese aviso da 9,22:1.
- Los radios responden a flechas y seleccionan 95 % desde 90 %. El input enfocado
  tiene opacity=0; el label tiene outline-style:none y box-shadow:none. El anillo global
  está en el input invisible, mientras el borde del label solo indica selección, no foco.
  Falta un indicador perceptible para distinguir dónde está el teclado, también al
  enfocar una opción ya seleccionada. Referencia: [W3C, foco visible](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible).

Esto no es una certificación WCAG completa: no se midieron todas las combinaciones
de color ni se realizó una sesión con lector de pantalla o dispositivo físico.

### Evidencias visuales

Directorio local ignorado: `.cache/deck-settings-audit/` desde la raíz.
Archivos `settings-{desktop-dark,desktop-light,laptop-dark,tablet-light,mobile-light,narrow-dark}.png`
y `focus-{mismos perfiles}.png`, 12 capturas completas. Métricas en `metrics-*.json`;
ratios calculados con luminancia sRGB en `visual-measurements.json`.
Se inspeccionaron las capturas de escritorio oscuro y móvil claro/estrecho.

### Hasta dos alternativas

| Propuesta | Qué cambiaría | Ventajas | Costes/inconvenientes |
| --- | --- | --- | --- |
| A. Refinamiento minimalista, recomendada | Conservar tarjetas/controles; corregir textos, foco y contraste; poner los tres ajustes al inicio; ayudas extensas plegables y multimedia después; explicar límite efectivo de hoy/guardado | Menor riesgo, mejora claridad y recorrido sin rehacer estructura | Sigue siendo una página vertical; requiere probar estados sucios y errores |
| B. Secciones más compactas | Agrupar «Carga diaria» y «Programación FSRS», con ayuda lateral en escritorio y una columna móvil | Menos scroll, jerarquía más explícita, separa ajustes de información | Más CSS/tab-order/responsive que validar; puede comprimir opciones o fragmentar la lectura |

No recomiendo rediseño completo, adornos ni nuevas dependencias. Una barra de guardado
persistente podría ayudar, pero debe decidirse después de resolver éxito/error y probar
zoom, teclado virtual y que no tape contenido. Ninguna propuesta está implementada.

## Pruebas, preservación y límites

Archivos añadidos: `src/app/features/anki-settings/deck-settings-audit.spec.ts`,
`manual-tests/deck-settings-audit/deck-settings-audit.spec.ts`,
`playwright.deck-settings-audit.config.ts` y este documento. `docs/INDEX.md` enlaza la auditoría.
No se modifica ningún test anterior ni archivo de producción.

Los tests Angular usan controles reales, componentes/servicios y IndexedDB reales con
fake-indexeddb nuevo por caso. Se sustituyen solo red/Puyi editorial, outbox y carga
multimedia; no se sustituye settings, cola, repositorio custom o scheduler. El reloj es
fijo para los cálculos y los procesos se destruyen/restauran entre tests.
Playwright usa perfiles temporales, preferencias reales y HTTP público Puyi controlado;
todo Supabase externo se bloquea. No se toca un proyecto remoto ni una cuenta real.

Resultados finales:

- Auditoría Angular nueva: 20/20 casos. Dirigidos combinados: 49/49 en cuatro archivos
  (auditoría nueva, pantalla previa, servicio de preferencias y cola dinámica).
- Suite Angular final: 2370/2370, 230 archivos. Una ejecución anterior, antes de añadir
  el caso de máximo/error custom, pasó 2369/2369. Sin exclusiones ni reintentos automáticos.
- Playwright: 18/18 sobre el build candidato; seis perfiles, tres pruebas cada uno,
  cubriendo UI→guardado→cola/evento, recarga, Puyi, teclado y diseño. Se repitieron además
  los seis casos visuales para completar las métricas del foco, sin modificar CSS.
- TypeScript app/spec: correctos (`npx tsc -p tsconfig.app.json --noEmit` y spec).
- Build normal y candidato: correctos bajo `/kana-study/`, iniciales 747.078/747.964 bytes,
  sin incremento respecto al comienzo de la auditoría y ambos <750.000. Solo los cuatro
  warnings SCSS conocidos de Gramática. Pasan sus auditorías previas de Gramática,
  traducciones, publicación Kaishi y el presupuesto candidato.
- Enlaces locales de documentación y `git diff --check`: correctos. También se comprueba
  whitespace de archivos nuevos, que aún no están en el índice Git.
- Preservación: se compararon SHA-256 de 7595 archivos existentes al iniciar, incluidos
  los cambios locales de la cola/Vocabulario. Solo cambia `docs/INDEX.md`, para enlazar
  este informe. Se conserva exactamente el código productivo y el trabajo anterior.

Logs de las ejecuciones y `preservation-check.json` están en `.cache/deck-settings-audit/`.
El script de preview bloquea configuración real; el proyecto/credenciales de Supabase
no se consultaron ni se modificaron. No se ha realizado ninguna corrección funcional o visual.

Riesgos al corregir después: cambiar precedencia del override/completado podría abrir
introducciones inesperadas; persistir debt debe aislar mazo/workspace/día y convivir
con undo; invalidar previews puede cambiar una respuesta ya elegida; reprogramar todos
los due alteraría progreso/históricos. Las correcciones visuales deben preservar semántica,
foco y los controles nativos. Nada de ello se implementa en esta entrega.

No comprobado: Supabase Auth/RLS real, llegada cloud de preferencias, Safari, dispositivos
físicos, lector de pantalla, cierre abrupto durante una escritura o historial masivo.
No se afirma estabilidad absoluta ni validez de una cuenta real usando los fixtures.
