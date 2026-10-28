# Aprender: lista de contenido al terminar (LEARNING-SESSION-LIST-1)

Cambio local del 28/10/2026 sobre HEAD `2716cb11e5f0016f6ad5fceb089f9b36f632aeaf`.
Aceptación manual local confirmada por el propietario. Commit y push autorizados para
publicar esta mejora; la refactorización de Mazos queda fuera de este cambio.

## Datos y vida de la lista

Solo KanjiPlayPage y VocabularyPlayPage muestran el panel, dentro de su rama de resultados.
Funciona con autoevaluación y opción múltiple, y con las prácticas adicionales que ya pasan
por estas mismas pantallas. Las preguntas activas, Kana, RUSH y escritura independiente
conservan su interfaz y anchura.

`studiedSessionEntries` es una proyección pura de `session.units` y `session.items`.
Solo admite una sesión terminada y unidades cuyo SessionItem tiene `appearances > 0`.
El contador representa la presentación que registra el motor al activar un objetivo;
no se añade telemetría de renderizado ni se inventan timestamps de exposición.

Ambos motores inicializan su cola en el orden de `units` y sus inserciones posteriores
solo repiten una unidad ya presentada. Por tanto, filtrar las unidades presentadas en ese
orden conserva el orden de primera aparición de los objetivos distintos. Se deduplica
exclusivamente por kanjiId/entryId, incluyendo distintas direcciones del mismo objetivo.
No se deduplica por escritura o lectura, y no se incluyen opciones distractoras, ejemplos,
unidades con cero apariciones ni identificadores ausentes del catálogo actual.

La proyección devuelve los objetos originales del catálogo; no modifica la sesión, su cola,
intentos, calificaciones, FSRS, progreso o historial. El contador del panel es de elementos
únicos; los números del resumen existente siguen contando ejercicios e intentos.
Al reiniciar desaparece el panel; al terminar otra sesión se calcula exclusivamente su lista.
Al salir, la limpieza existente del servicio elimina la sesión transitoria. No se recupera
esta lista desde historial o progreso ni se añade almacenamiento, red o migraciones.

## Presentación

- Kanji: carácter y significados del idioma actual; onyomi y kunyomi existentes, etiquetados.
- Vocabulario: furigana mediante FuriganaText, lectura y `quizMeaning` del idioma actual.
- Títulos y contadores singulares/plurales están en ES/EN/CA y se compilan con el sistema
  habitual de traducciones. No hay etiquetas de éxito/dominio/fallo por fila.
- Encabezado h2 y lista ordenada semántica; japonés con lang=ja; filas sin controles ni
  tabindex. No se cambia el foco. Teclado, salida y diálogos de medallas siguen sus flujos.
- A partir de 1000 px, solo el contenedor final se ensancha hasta 76 rem: resumen a la
  izquierda y lista a la derecha. Por debajo se apilan, resumen primero. Se mantiene el
  scroll normal de la página, sin altura máxima ni scroll interno del panel.
- Se usan tokens semánticos y los estilos UX-1. La clase results-shell solo existe al
  finalizar; el mixin nuevo se incluye únicamente en las dos páginas indicadas.

## Archivos

- `src/app/shared/components/learning-session-list/`: proyección pura, componente de consulta,
  template/SCSS y tests de proyección/renderizado/integración con los motores reales.
- `src/app/shared/styles/_learning-results.scss`: distribución de los dos resultados.
- `src/app/features/{kanji-play,vocabulary-play}/*.page.{ts,html,scss}`: entradas y composición
  del panel; sus servicios de sesión no cambian.
- `src/assets/i18n/{es,en,ca}.json` y `core.generated.ts`: seis claves nuevas por idioma.
- `vocabulary-play.page.spec.ts`: fixture de sesión terminada completado con unidades y
  apariciones representativas, manteniendo sus comprobaciones de práctica y bloqueo diario.
- `e2e/learning-ux.spec.ts`: la comprobación existente de medallas observa la cola real
  y su disminución por Escape, sin cambiar código Kana ni su comportamiento.
- `e2e/learning-session-list.spec.ts`: acciones reales de inicio/revelado/respuesta/continuación/
  salida. El inspector de Angular del build de desarrollo se usa únicamente para observar
  objetivos y comparar el resultado con el catálogo, nunca para completar o alterar sesiones.
- Esta guía y `docs/INDEX.md`.

No cambian los servicios de sesión/FSRS/sync, contratos de persistencia, acceso a Gramática,
gates de Manga × Mazos Guest-only, workflow, dependencias, SQL ni catálogos.

## Validación y evidencia

Resultados comprobados el 28/10/2026:

| Comprobación | Resultado |
| --- | --- |
| Dirigidos: proyección, componente, páginas y servicios existentes | 68/68, seis archivos |
| Playwright: nuevas listas y regresiones UX-1/feedback | 90/90; 30 escenarios nuevos de listas, sin skips ni retries |
| Angular completo | 2152/2152, 208 archivos |
| TypeScript app/spec | Ambos correctos, sin emitir archivos |
| Build normal GitHub Pages | Correcto; 734811 bytes iniciales |
| Build manga-candidate GitHub Pages | Correcto; 735697 bytes iniciales, estrictamente <750000 |
| Presupuesto estricto | Guard real acepta 749999 y rechaza 750000/750001 en metadatos sintéticos |
| Auditorías de límites de bundle/código de pruebas | Correctas; sin código manual/test en los artefactos |
| Regresión Manga × Mazos optimizado | 3/3 ES/EN/CA; FSRS/undo, backup/restauración, cuentas/Guest, Japanese 1500 y cero operaciones cloud custom |
| Documentación y git diff --check | Correctos |

Ambos builds conservan solamente los cuatro avisos SCSS conocidos de Grammar. No se
amplían presupuestos. La revisión de scope previa a publicar confirmó 13 archivos modificados
y nueve nuevos, ninguna eliminación, índice vacío y HEAD original conservado.

Se revisaron capturas completas de escritorio oscuro, móvil claro y 320 px oscuro; están
guardadas las 30 pantallas finales nuevas. Incluyen ES/EN/CA, ambas modalidades y prácticas.
Las comprobaciones geométricas verifican columnas/orden, anchura de la pregunta intacta,
ausencia de overflow horizontal y scroll normal. Un ejemplo real de práctica Vocabulario
presenta cuatro ejercicios, cinco intentos y solo dos palabras únicas con furigana.

La primera pasada dirigida detectó el placeholder de contador (el formato existente es
`{{count}}`) y el fixture antiguo sin unidades: corregidos sin relajar las aserciones.
Las primeras pasadas Playwright descubrieron una carrera en los helpers de medallas:
comprobar presencia y después leer título podía esperar un nodo ya cerrado; además podía
observarse un intervalo sin diálogo antes del siguiente render de la cola. El helper final
espera el foco del control existente y exige que cada Escape reduzca exactamente en uno
la cola real, antes de esperar la desaparición del último diálogo. La prueba previa de Kana
usa la misma observación segura. No se alteran medallas, foco o teclado en producción,
ni se añaden sleeps, reintentos automáticos, exclusiones o timeouts mayores.

Los fixtures controlados comprueban homógrafos con IDs distintos, unidades no presentadas,
distractores, orden, singular/plural, cambio de idioma y ausencia de lecturas/escrituras de
almacenamiento por la proyección. La integración usa los motores de sesión reales con
puertos de persistencia observados: tres ejercicios sobre dos objetivos y una repetición
conservan tres ejercicios/cuatro intentos frente a dos filas. Comprueba también reinicio,
segunda sesión con otro objetivo, acciones finales y exclusión del panel durante preguntas.

Las capturas y logs permanecen locales e ignorados en `.cache/session-list/`, con fixtures
sintéticos y datos de catálogo, sin cuentas privadas. La inspección automatizada de Chromium
no sustituye pruebas con Safari, dispositivos físicos o lector de pantalla. El propietario
ha confirmado que las pruebas manuales locales son satisfactorias.
Los ejecutables Firefox/WebKit no están instalados; no se cuentan como validados.

Comandos principales de reproducción, desde la raíz y en serie:

```powershell
npm test -- --include=src/app/shared/components/learning-session-list/*.spec.ts --include=src/app/features/kanji-play/kanji-play.page.spec.ts --include=src/app/features/vocabulary-play/vocabulary-play.page.spec.ts --include=src/app/core/services/kanji-session.service.spec.ts --include=src/app/core/services/vocabulary-session.service.spec.ts
npx playwright test e2e/learning-session-list.spec.ts e2e/learning-ux.spec.ts e2e/ux-feedback.spec.ts
npm test
npx tsc -p tsconfig.app.json --noEmit
npx tsc -p tsconfig.spec.json --noEmit
npm run build -- --base-href /kana-study/ --stats-json
node scripts/audit-local-deck-boundaries.mjs
npm run build:manga-candidate
node scripts/check-manga-release-budget-boundary.mjs
npm run test:manga-candidate
node scripts/audit-repo-docs.mjs --links-only
git diff --check
```
