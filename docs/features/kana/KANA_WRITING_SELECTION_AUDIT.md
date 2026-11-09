# Kana: selección, escritura y aislamiento de sesión

Auditoría local, 8–9 de noviembre de 2026. Base `main` / `6a82ceb`. Se conserva el
[layout responsive anterior](KANA_WRITING_RESPONSIVE_REDESIGN.md). No se accede a
la cuenta, el navegador ni el progreso real de Nora. Los escenarios son sintéticos;
**no se ha reproducido ni identificado el estado exacto de su cuenta**.

## Comportamiento real

| Flujo | Qué controla la configuración | Cuándo hay lienzo |
| --- | --- | --- |
| Aprender (`/learn`) | Selección guardada de contenido y tipos de pregunta | Únicamente si la unidad es `romaji-to-kana`, en autoevaluación y opciones; dibujar es opcional |
| Escritura (`/writing`) | Sus controles visibles de silabario, variantes y guía | Es una práctica independiente, aunque Aprender tenga solo Kana → Romaji |
| RUSH (`/rush`) | Su propio diálogo y preferencias por workspace | Si su selección propia incluye Romaji → Kana |
| Puntos débiles → Practicar aprendizaje (`/learn`) | Las unidades débiles suministradas expresamente a `startPractice` | Si una unidad débil es Romaji → Kana, aunque esté desactivada en la ronda normal |

Kana → Romaji presenta el carácter y pide la lectura latina; no monta el lienzo de
Aprender. Romaji → Kana presenta romaji y permite dibujar antes de responder.
No existe un toggle oculto de escritura en Aprender. Audio sigue bloqueado.
El tema de color `nora` tampoco activa tipos de pregunta ni modalidades.

RUSH toma la selección normal como valor inicial solo si todavía no tiene una
configuración propia; después conserva `kana-study.rush.kana-settings.v1`.
Cambiar Selección de aprendizaje no reescribe esas preferencias independientes.
Escritura dispone de controles visibles en su configuración y estado local de la
página, no obtiene su dirección desde Selección de aprendizaje.

El refuerzo de puntos débiles construye sus unidades con ambas direcciones y llama
a `startPractice`, que acepta los objetivos explícitos y deduplica por kana/dirección.
No es una ronda normal ni tiene que filtrar por su selección. Se conserva ese
contrato y se prueba que no escribe una valoración FSRS ni reescribe preferencias.
La explicación de Selección diferencia también este flujo.

## Sesiones y persistencia

Una ronda de Aprender captura las unidades al comenzar. Si cambian preferencias
durante esa ronda en el mismo workspace, mantiene su snapshot. La siguiente usa
la nueva selección. No se eliminan ni transforman unidades ya contestadas.
La selección incluye una explicación ES/EN/CA del lienzo opcional, los flujos
independientes y la aplicación de cambios a la siguiente ronda.

La ronda normal de Kana vive en memoria: navegar fuera de Learn llama a `clear()`;
recargar no restaura una ronda normal incompleta. Los ejercicios y reviews ya
registrados sí permanecen. No se añade una nueva reanudación persistente ni se
afirma que exista. RUSH tiene su propia sesión en IndexedDB; los ajustes y el
progreso normal usan localStorage mediante claves de workspace. No hay conflicto
de fuentes para la dirección de Aprender.

La migración de ajustes antiguos acepta el mapa booleano de tipos y conserva
Romaji → Kana desactivado cuando así estaba guardado. No se observa que el
generador añada escritura a una ronda nueva con solo Kana → Romaji.

## Error real encontrado y corrección

Se reprodujo con un test que utiliza SettingsService, ProgressService y WorkspaceService
reales: A selecciona Romaji → Kana, inicia una ronda y contesta; se activa B con
solo Kana → Romaji. Antes del arreglo, `LearningSessionService.session()` todavía
exponía la ronda de A. El test falló específicamente en `expect(session()).toBeNull()`
(cinco casos correctos, uno fallido). El log rojo es
`.cache/vocabulary-compact/kana-red.log`.

La causa era que el estado de la ronda y sus medallas eran signals globales, sin
dependencia de la activación del workspace. El progreso y los ajustes sí se
recargaban por usuario, lo que permitía mostrar una ronda anterior junto a una
selección distinta e incluso intentar valorarla en el nuevo contexto.

Se sustituyen esos dos signals por `linkedSignal` dependientes de
`WorkspaceService.activationRevision`. Se invalidan de forma síncrona al cambiar
de workspace, incluso A → B → A sin ejecutar change detection entre medias.
Valorar una ronda invalidada no hace nada. No se toca selección, cola, FSRS,
repeticiones, tiempos ni escritura de eventos válidos.

El borrador de Selección también estaba desconectado del workspace. Se vincula
a la misma revisión para evitar guardar en B el borrador abierto en A, incluso
si se pulsa Guardar antes del siguiente render. No se vacía el almacenamiento.

Al cambiar de workspace se descarta exclusivamente la ronda efímera/borrador
anterior, sin completar automáticamente ni valorar la pregunta pendiente. Los
reviews ya guardados, preferencias de cada usuario e historiales permanecen.
No se añade memoria de sesiones suspendidas entre cuentas.

Esto corrige un fallo demostrado, **pero no prueba que fuera la causa del caso de
Nora**. Un lienzo en Escritura, RUSH o refuerzo de puntos débiles con Romaji → Kana desactivado en Aprender es
legítimo. Para atribuir su observación concreta hace falta conocer la pantalla y
la secuencia de acciones. La pregunta sobre la ruta se ha planteado al propietario;
no se inventa una respuesta ni se presume acceso a su cuenta.

## Pruebas y uso

- Solo Kana → Romaji, solo Romaji → Kana y ambos: unidades únicas de tipos permitidos.
- Guardado, reload de selección y migración booleana antigua.
- Snapshot de ronda activa y nueva ronda tras cambiar ajustes.
- A → B → A, preferencias y progreso separados; valoración obsoleta ignorada.
- Borrador cruzado entre workspaces, antes de change detection.
- Tema Nora sin alteración de la dirección.
- UI clara/oscura en 1366, 390 y 320 px; audio desactivado; lienzo según unidad.
- Práctica de Escritura accesible con Aprender en Kana → Romaji sin cambiar FSRS.
- Regresión del layout anterior, RUSH y sus protecciones existentes.

Para escribir en **Aprender**: Selección de aprendizaje → activar **Romaji → Kana**
→ Guardar → iniciar una ronda. En autoevaluación se puede revelar sin dibujar;
en opciones se conserva el paso original para continuar hacia las opciones.
Para practicar independientemente, entrar en **Escritura (✍)** y configurar allí
el contenido, o ajustar Romaji → Kana dentro del diálogo de **RUSH**.

Comandos nuevos: `npm test -- --include '**/kana-writing-selection.spec.ts'` y
`npx playwright test --config playwright.kana-selection.config.ts`.
Las capturas están en `.cache/vocabulary-compact/kana-selection/*/selection.png`.
Resultado final: **9/9** casos UI de selección, **25/25** del layout anterior,
**42/42** regresiones de interacción, **284/284** dirigidos y **2499/2499** Angular
completos. También pasan TypeScript app/spec, ambos builds, 120 casos de Mazos /
Vocabulario / estadísticas / RUSH y tres perfiles Manga. Los nueve tests nuevos
de contrato incluyen el refuerzo independiente y A → B → A sin lectura intermedia.
El reload de Learn muestra correctamente la ausencia de ronda en memoria y
mantiene byte a byte el progreso guardado. La selección sigue guardada tras reload.
Los detalles de bundles, capturas y auditorías figuran en la
[guía compacta de Vocabulario](../vocabulary/VOCABULARY_PLAY_COMPACT_LAYOUT.md).
No hay commit, push, SQL o despliegue.

## Limitaciones

No se certifican Safari, hardware táctil ni Supabase Auth real. La simulación de
workspaces en tests no equivale a entrar en una cuenta remota. No se amplía esta
corrección al algoritmo de otros módulos. La cuenta de Nora permanece intacta.
