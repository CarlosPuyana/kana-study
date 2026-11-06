# Ajustes de Mazos: correcciones y refinamiento

Entrega local de 06/11/2026, posterior a la [auditoría](DECK_SETTINGS_AUDIT.md).
Conserva el trabajo anterior de cola dinámica, historial y Vocabulario. Sin commit,
push, despliegue, SQL ni acceso a datos reales.

## Qué se conserva

La fórmula de mezcla, ausencia de RNG, selección por order, cupo diario, cronología,
separación por identidades, finalización y Deshacer de tarjetas conservan su contrato.
El scheduler FSRS no se modifica: pesos, retención predeterminada, fuzz, pasos,
graduación y fechas históricas permanecen intactos. La retención continúa aplicándose
a próximos cálculos; no reprograma snapshots y un preview revelado conserva su cálculo.

## Mixed: checkpoint local verificable

No se puede reproducir exactamente debt solo con eventos anteriores: faltan el tamaño
histórico de las candidatas, los cambios de cupo/selección y la fase de incorporación.
Por eso se conserva un checkpoint mínimo, en vez de inventar una reconstrucción.

`DeckMixCheckpointService` guarda `kana-study.deck-mix.v1.<deckId>` mediante
StorageService con `localOnly:true, strict:true`. La clave queda automáticamente
aislada por workspace; el registro incluye día Madrid y hasta 128 transiciones recientes.
No es una cola alternativa ni una operación FSRS, no se añade a la outbox o al journal
custom, ni cambia el contrato de backups, SQL o sincronización.

Cada selección real captura debt antes/después y los IDs de eventos efectivos del día.
Antes de confirmar la respuesta se escribe una intención con firmas SHA-256 del conjunto
de IDs antes/después. Luego se ejecuta el commit FSRS existente. Al reconstruir:

- Firma actual = después: se utiliza debt posterior, incluso si se cerró la página
  después del commit y antes de presentar la siguiente tarjeta.
- Firma actual = antes: se utiliza debt anterior. Un commit abortado no consume fase.
- Deshacer el último evento restaura la firma anterior y, por tanto, la fase anterior.
- Sin coincidencia verificable o en otro día: fase cero. No se modifican tarjetas/eventos.

Se guardan también los IDs reales de esos recibos recientes, para reconstruir el orden
de respuestas de tarjetas distintas que comparten milisegundo. Solo se usan si la firma
coincide y los IDs siguen siendo eventos efectivos. No se modifica ningún timestamp
ni se añade una valoración a la historia. El caso de tres Again simultáneos conserva
la misma siguiente tarjeta tras recrear los servicios.

El snapshot real proporciona el cursor autoritativo; no avanza por consultar Ajustes,
presentar una tarjeta, enfocar la página o recargar. Solo una respuesta confirmada
cambia la fase aplicable. Las selecciones puras sin snapshot persistido mantienen
el parámetro cursor para compatibilidad de pruebas/herramientas.

Si falla la escritura de la intención, la respuesta FSRS aún no se ha guardado: la
pantalla conserva la tarjeta revelada, notifica el error y permite reintentar sin
duplicar eventos. Si se aborta la transacción canónica, queda una intención cuyo estado previo coincide
con el historial; el reintento funciona con los recibos custom existentes.

Prueba real: 40 Review +10 nuevas, cuatro Review Good. El acumulador ronda 0,825 y
la siguiente tarjeta es la primera nueva. Tras recrear servicios/página sigue siendo
la misma; responderla y Deshacer devuelve esa misma selección y cuatro eventos.
También se verifican fallos de intención/commit, aislamiento A→B→A, otro mazo y medianoche.

Limitaciones deliberadas: el checkpoint es local, no viaja en backups ni cloud. Un
historial importado, cambios externos/concurrentes que no coincidan con una firma,
metadatos ausentes/ilegibles o una reversión fuera de la ventana reciente vuelven a
fase cero. No se afirma conservar exactamente la fase entre navegadores. Se conservan
siempre progreso, cupo, order y eventos canónicos; no se fabrican valoraciones.
La UI actual ofrece Deshacer de la última respuesta, cubierto por el checkpoint.
La ruta que vuelve a presentar directamente la tarjeta deshecha registra también la
selección restaurada. Responder de nuevo sin recargar conserva el delta de mezcla;
no se depende de que esa tarjeta haya pasado otra vez por chooseNext.

## Guardado y validación

`DeckSettingsService.save` construye el siguiente mapa, intenta escribirlo en modo
estricto y solo entonces actualiza el signal. Si falla devuelve false: la configuración
activa y lo persistido siguen coincidiendo, el borrador permanece y no aparece éxito.
El formulario muestra un error explícito junto a Guardar, bloquea envíos duplicados y
permite reintentar. Guardar correctamente limpia el error local. El aviso global de
persistencia conserva su cierre habitual, porque puede corresponder a otros datos;
no se ocultan advertencias de otros módulos.

Custom mantiene su transacción y journal. Se verifica un aborto real al escribir el
journal: no queda un cambio parcial, el borrador sigue disponible y el siguiente
guardado válido funciona. Owner/epoch y generación impiden mostrar resultados de
otro workspace o de un recurso anterior. No se modifica la autenticación.

La UI exige enteros seguros no negativos. Custom comparte con el repositorio la
constante de máximo 10000, sin cambiar su valor; el input declara max/step/min y
asocia el error accesible. Vacío, negativos, decimales, 10001 y magnitudes extremas
no llegan a persistencia. 0, 2 y 10000 se guardan. Cambiar el dato limpia errores de
guardado anteriores y el éxito también los limpia. El servicio builtin mantiene
su normalización histórica para consumidores internos; la UI no admite fracciones.

## Límite habitual frente a hoy

Los ajustes muestran primero el límite habitual y un resumen de solo lectura:
límite efectivo hoy, introducidas y disponibles aún. Indican si hay override y si
las introducciones están cerradas. La consulta reutiliza snapshot/index existentes,
sin llamar a rate/completeSession ni reiniciar contadores. Se actualiza al guardar,
cambiar recurso/workspace/día y al recuperar foco; resultados antiguos se descartan.

La prioridad `override ?? habitual` y el cierre diario no cambian. Ejemplo de navegador:
ampliar hoy a 15 y guardar habitual 0 conserva 15/0/15 para hoy, con explicación de
que el límite habitual se aplicará mañana. Cambiar el habitual no reabre el día;
se remite a los controles existentes de Mazos para ampliarlo explícitamente.

## Presentación y accesibilidad

Orden actual: nuevas habituales → posición de nuevas → retención → Guardar.
Después, ayuda desplegable de programación y opciones multimedia/secundarias.
Se conservan tarjetas, paleta y controles nativos; no hay nuevas dependencias visuales.
Las preferencias multimedia siguen disponibles sin instalar un paquete local.

No se añade barra fija: Guardar está inmediatamente después de los tres controles,
en flujo normal, con espacio inferior existente. Así no tapa contenido, zoom ni teclado.
Durante una escritura se anuncia Guardando; si el botón tenía foco se restaura al
terminar, incluso cuando el catálogo custom recarga el formulario.

- Foco de radios en su label mediante outline de 3px con focus-within; flechas nativas.
- Guardar usa primary-hover y el token semántico global on-primary. Objetivo de
  contraste normal ≥4,5:1, comprobado en oscuro/claro; también se prueba el aviso.
- La advertencia usa texto primario legible; el color de aviso queda en el icono decorativo.
- Textos secundarios mayores, errores con texto/role=alert/aria-describedby y estados
  de guardado role=status. Las opciones ocupan dos columnas en móvil para reducir altura.
- ES/EN/CA explica fecha Madrid, orden por hora, aparición anticipada dentro de hoy,
  actualización FSRS y separación de dos tarjetas. Desaparece la explicación de 20m.
  El texto nuevo se incorpora a la copia lazy de estudio, protegiendo el bundle inicial.

### Comparación real antes/después

Perfiles limpios de Edge; alturas en CSS px, ayuda cerrada, misma pantalla y tamaño:

| Perfil | Alto anterior | Alto actual | Guardar anterior (Y) | Guardar actual (Y) |
| --- | --- | --- | --- | --- |
| Escritorio oscuro 1440×1000 | 1829 | 1423 | 1701 | 870 |
| Portátil oscuro 1280×800 | 1829 | 1423 | 1701 | 870 |
| Móvil claro 390×844 | 2377 | 1731 | 2249 | 1127 |
| Móvil oscuro 320×800 | 2620 | 1854 | 2492 | 1224 |

Capturas anteriores preservadas en `.cache/deck-settings-audit/settings-*.png`.
Actuales en `.cache/deck-settings-improvements/settings-*.png` y `focus-*.png`, con
escritorio oscuro/claro, portátil, tablet, móvil claro y móvil estrecho oscuro.
Métricas por perfil en `metrics-*.json` y comparación en `comparison.json`.
Contraste medido del texto de Guardar: 5,17:1 oscuro y 6,70:1 claro;
texto del aviso: 16,62:1 oscuro y 17,85:1 claro. El foco de los radios usa
outline sólido de 3px. Estas comprobaciones concretas no constituyen una
certificación WCAG de toda la aplicación.

## Archivos

- `deck-mix-checkpoint.service.ts` nuevo; `deck-study.service.ts` y `deck-study.model.ts`:
  checkpoint y campos de lectura del cupo; la selección/separación no cambia de fórmula.
- `deck-settings.service.ts`: escribir antes de confirmar estado.
- `deck.model.ts` / `custom-deck-validation.ts`: constante compartida para el máximo vigente.
- `anki-settings.page.ts/html/scss`, `styles.scss`: formulario, lectura de hoy y accesibilidad.
- `anki-study.page.ts`: registra la tarjeta restaurada por Deshacer, conservando su presentación.
- Diccionarios ES/EN/CA, `core.generated.ts` y `deck-study.generated.ts`: copy vigente.
- Pruebas de auditoría, servicio/cola dinámica y Playwright: expectativas actualizadas
  con la misma cobertura y regresiones nuevas. La selección pura de fixtures sin commits
  ignora explícitamente el cursor persistido; las pruebas reales verifican su autoridad.
- `scripts/audit-manga-candidate.mjs`: añade guardado custom por UI y recuperación de foco.
- Auditoría, este documento, guía de cola dinámica e índice documental.

## Validación

Validación final local del 6 de noviembre de 2026, después del último ajuste de
Deshacer y respuesta inmediata:

- Tests dirigidos principales: 120/120; comprobación adicional de Deshacer/página:
  40/40. Estos grupos se solapan y no se suman como pruebas únicas.
- Suite Angular completa: 2384/2384, 230 archivos.
- Playwright Ajustes: 36/36, seis perfiles Edge, oscuro/claro y 320–1440px,
  sin reintentos. Incluye fallos de almacenamiento, recuperación, cuota efectiva,
  mixed/recarga/Deshacer y nueva respuesta inmediata, Puyi y foco.
- Playwright aprendizaje: 33/33. Regresión Manga candidato: 3/3 en ES/EN/CA;
  incluye guardar ajustes custom mediante UI, estudio, FSRS/Undo y backup/reinicio.
- TypeScript app/spec: correcto.
- Builds normal y candidato para `/kana-study/`: correctos, con los cuatro
  warnings SCSS conocidos de Grammar. Inicial: 747071 / 747957 bytes;
  ambos estrictamente inferiores a 750000. Despliegue total con medios:
  150168969 / 150168687 bytes, respectivamente.
- Auditoría SRS: 67 transiciones correctas. Auditoría multimedia: correcta,
  medios fuera del bundle inicial; 4344 recursos, 109382203 bytes de medios.
- Paridad de claves/placeholders ES/EN/CA y generados core/estudio: correcta.
- Auditoría documental `node scripts/audit-repo-docs.mjs --links-only`: correcta,
  87 documentos y 215 enlaces locales, sin destinos rotos ni documentos inaccesibles.
  El modo histórico sin esa opción compara con HEAD de REPO-HYGIENE-1 y se detiene
  porque aquella base ya no es el HEAD actual; no se modifica su inventario histórico.
  `git diff --check` y whitespace de archivos nuevos: correctos.

Logs y evidencias locales: `.cache/deck-settings-improvements/`.
No se han añadido exclusiones, sleeps ni reintentos automáticos para ocultar
fallos. No se han cambiado pesos, datos de Japanese 1500, motor, FSRS Saved Manga,
Stats V2, gates, workflows ni SQL. Sin commit, push ni despliegue.

Pendientes: Safari/dispositivos físicos y sesión con lector de pantalla; Auth/RLS real
no se valida con HTTP controlado. Tampoco se garantiza fase exacta tras restaurar en
otro navegador o modificar simultáneamente el historial, por las limitaciones descritas.
