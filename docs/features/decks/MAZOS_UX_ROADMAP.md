# Mazos — contadores, reverso, audio, resumen y práctica

Implementación local del 29 de octubre de 2026 sobre `bad859a635a9ca91ae23c637dbc4ed3a098ef3de`. Conserva los cambios locales de KAISHI-MEDIA-1/AUTO y su [activación r2](KAISHI_MEDIA_AUTO_ACTIVATION.md), incluidos originales, créditos y permiso comunicado por el propietario. Sin commit, push, despliegue ni operaciones remotas.

## Cinco hitos

1. **MAZOS-COUNTS-1.** `deck-day-presentation.ts` proyecta tarjetas únicas pendientes, independientemente de los campos internos del scheduler. Azul: nuevas dentro del cupo; naranja: respondidas hoy y pendientes hoy, incluso pasos futuros o aciertos; verde: pendientes anteriores sin respuesta hoy, incluido aprendizaje antiguo. La tarjeta activa permanece incluida hasta confirmar. Se reconstruye leyendo progreso y eventos efectivos por mazo/workspace y día Europe/Madrid. El router existente excluye eventos custom anulados/no canónicos; el undo builtin elimina sus eventos. No hay identidad de visita nueva ni contadores paralelos persistidos.
2. **MAZOS-UX-1.** Cabecera compacta y etiquetada; reverso con palabra/furigana, lectura/acento/audio, significado, frase/audio y traducción plegable; frecuencia en esquina y notas plegables. Imagen proporcional `contain`, altura adaptativa, sin reservar hueco si falta. Acciones en pie fijo fuera del contenido desplazable, con espacio de documento y safe-area inferior. Hay un solo desplazamiento de documento. Espacio/1/2 respetan botones, enlaces, campos, summary, elementos editables, roles interactivos, modificadores, repetición e IME. Los colores semánticos se mantienen en oscuro, claro, Nora, Nora oscuro y Anime.
3. **MAZOS-AUDIO-2.** Preferencia visible `kana-study.kaishi-auto-audio.v1`, local por workspace, activa en ausencia de valor y con `false` explícito conservado. Independiente del acento. Una secuencia por aparición revelada: palabra y, solo tras su `ended` real, frase. Un único elemento Audio reutilizado por componente. Preparación, reproducción efectiva y errores son estados distintos; `NotAllowedError` ofrece fallback manual sin reintentos automáticos. No espera a la imagen. Carga local prioritaria por recurso, incluso si falla el catálogo remoto. Responder/guardar, cambiar tarjeta/workspace, destruir, pagehide, pestaña oculta, opt-out o audio manual cancelan también la segunda grabación. Volver a primer plano, cambiar el acento, refrescar medios o reintentar una imagen no repite automáticamente la secuencia.
4. **MAZOS-RESULTS-1.** Al completar realmente el día aparece «Palabras para reforzar». Agrupa Otra vez efectivos de hoy por entryId; incluye fallos seguidos de aciertos, deduplica IDs de evento y conserva una fila por palabra. Orden: fallos descendentes, última fecha de fallo descendente, ID ascendente por comparación de código como desempate estable. No utiliza dificultad FSRS, duración de respuesta ni estadísticas globales. El resumen vacío no inventa dificultades. Audio/imagen de una fila se abren a petición, con autoaudio desactivado en ese contexto; no se cargan todos los medios del ranking. Layout lateral en escritorio y vertical en móvil.
5. **MAZOS-RUSH-1.** Selección inicial de hasta diez palabras del ranking, modificable mediante casillas. Cola y cronómetro propios en memoria; dos aciertos acumulados por palabra (un fallo no borra un acierto), rotación al final para intercalar otras cuando existen, veinte respuestas como máximo por bloque y salida anticipada. Otro bloque solo comienza por acción explícita; conserva los aciertos/fallos de esa práctica y reinicia su contador y reloj de bloque. Al salir o recargar se descarta la práctica. No escribe eventos normales, progreso, journal, cupos ni daily-state; no llama a `DeckStudyService.rate`, ni integra medallas, Rush tradicional o sincronización. El resumen diario normal no cambia.

## Compatibilidad

`DeckStudyService`, `DeckSchedulerService`, definiciones/textos/IDs de Japanese 1500, formatos de persistencia, FSRS, backups, sincronización, workflow, SQL y gates permanecen sin cambios productivos. SCHEDULER-1 conserva 1 minuto → 10 minutos → mañana, reaprendizaje de 10 minutos, Review oficial FSRS, adelanto inclusivo de veinte minutos y cierre seguro. La frase de 永遠 y el audio ausente siguen excluidos.

Las nuevas traducciones permanecen en los JSON ES/EN/CA. `compile-i18n.mjs` genera el dominio `deck-study.generated.ts`, cargado con las pantallas/componentes diferidos; `TranslationService` registra esa copia sin incorporar sus textos al arranque. No se ha añadido ninguna dependencia ni elevado un presupuesto.

## Incidencias detectadas durante validación

- El primer test nuevo necesitaba completar su stub del lector de historial; se corrigió la prueba, conservando las verificaciones originales de la página.
- La invocación inicial de Angular dentro del sandbox falló al renombrar su caché temporal (`EPERM`); las ejecuciones normales autorizadas usan el runner Angular, sin desactivar tests ni modificar el producto.
- La primera suite completa detectó dos tests existentes de Perfil que esperaban español con preferencias catalanas retenidas. `profile.page.spec.ts` ahora limpia localStorage antes/después y destruye TestBed antes de restaurar globals. No cambia Perfil ni sus traducciones.
- El zoom 200 % reveló el mínimo global de 320 CSS px en html/body. Se anula únicamente cuando está montada la pantalla de estudio; no se recorta información ni se oculta overflow. La prueba conserva su aserción de ausencia de desbordamiento y acciones visibles.
- La prueba de reintento en catalán utilizaba un nombre distinto al traducido; se corrigió el selector, manteniendo las comprobaciones de bloqueo y recuperación.
- La primera regresión de 33 escenarios terminó 32/33: la traza mostró `net::ERR_NETWORK_CHANGED` cargando módulos Angular/Vite tras reload, con la aplicación sin arrancar. No se cambió producto ni test para ese fallo externo; la repetición completa terminó 33/33, sin reintentos automáticos.
- Las pruebas multimedia anteriores asumían el catálogo bloqueado y un único checkbox. Se adaptó el escenario del importador para simular explícitamente hosting estático indisponible, verificar ausencia de controles de audio (sin confundirlos con la traducción proyectada) y seleccionar solo la opción de acento. Las pruebas de audio fallido verifican su nuevo mensaje específico y la recuperación manual, sin exigir el antiguo reintento de imagen.

## Archivos del roadmap

- Nuevos: `deck-day-presentation.ts/.spec.ts`, `deck-intensive-session.ts/.spec.ts`, `anki-study/deck-intensive-practice.ts`, dominio generado `deck-study.generated.ts`, `playwright.mazos-roadmap.config.ts` y `manual-tests/mazos-roadmap/mazos-roadmap.spec.ts`.
- Adaptados: página de estudio TS/HTML/SCSS/tests; componente Kaishi multimedia TS/HTML/SCSS/tests; preferencias Kaishi y su prueba; Ajustes multimedia; traductor y compilador de dominios; ES/EN/CA y agregados generados; tokens semánticos/zoom en styles; regresión persistida de `deck-scheduler-policy.spec.ts`; aislamiento de `profile.page.spec.ts`.
- Regresiones multimedia anteriores: setup explícito de modo manual en las tres suites de `manual-tests/kaishi-*`; se conserva su cobertura de manual/offline/importación. El modo automático predeterminado tiene su propia suite de perfiles nuevos.
- Documentación: esta guía, INDEX y referencias de vigencia en las guías Kaishi. Los numerosos archivos públicos r2 y cambios anteriores de MEDIA-1/AUTO ya existían antes de este roadmap; no se atribuyen como nuevos aquí ni se sobrescriben.

## Validación y evidencias

Evidencias locales ignoradas: `.cache/mazos-roadmap/`.

| Validación ejecutada | Resultado | Log |
| --- | --- | --- |
| Contadores y política real inicial | 31/31 | `counts.log` |
| Reverso y atajos antes del autoaudio | 22/22 | `ux.log` |
| Autoaudio, preferencias y páginas | 39/39 | `audio.log` |
| Ranking y página | 21/21 | `results.log` |
| Cola intensiva y página | 24/24 | `rush.log` |
| Dirigidos ampliados: scheduler, mazos, backups, Daily, medios y Perfil | 251/251 | `directed-final.log` |
| Suite Angular final | **2219/2219, 217 archivos** | `full-final.log` |
| Roadmap sobre candidato, cinco tamaños | **30/30** | `browser-final.log` |
| Roadmap adicional Nora oscuro CA | **6/6** | `nora-dark.log` |
| Regresión scheduler/Mazos/backups/Daily/Guest/login | **33/33** | `regression-browser-final.log` |
| Multimedia con fixtures, autoaudio explícitamente desactivado | **12/12** | `media-manual-final.log` |
| Originales estáticos sin APKG, modo manual explícito | **3/3** | `original-manual.log` |
| APKG real: cancelar, importar, reemplazar, recargar, offline y eliminar/reinstalar en perfil temporal | **1/1** | `local-compat-final.log` |
| Regresión Manga candidato ES/EN/CA | **3/3** | `manga-regression.log` |
| TypeScript app/spec/worker | Correcto | `ts-*-final.log` |
| Builds normales/candidato GitHub Pages | Correctos; cuatro warnings SCSS conocidos | `build-normal-final.log`, `build-candidate-final.log` |
| Integridad de medios, gráfico inicial, límites locales y frontera estricta | Correcto | `media-audit-final.log`, `boundaries.log`, `budget.log` |
| Auditoría documental, revisión del diff y whitespace | Correcto | `docs-audit-final.log`, `diff-check-final.log` |

Total de comprobaciones de navegador finales: 36 del roadmap, 33 de regresión general, 12 de fixtures, 3 de originales en modo manual, 1 de importación y 3 de Manga: **88/88** dentro de este alcance. No equivale a ejecutar todo el catálogo e2e del repositorio. La regresión Manga usa SDK Auth controlado; no valida Supabase real. HEAD original conservado, sin staging, commit ni push. El diff de los archivos productivos protegidos (scheduler, cola, dataset, gates, acceso custom, providers de lanzamiento, workflow y SQL) está vacío.

| Artefacto browser | Inicial | Tamaño completo, incluidos originales r2 |
| --- | ---: | ---: |
| Normal | 746599 bytes | 149999626 bytes |
| Candidato | **747485 bytes** | **149999402 bytes** |

El inicial candidato queda 2515 bytes por debajo de 750000. El worker de importación conserva 527549 bytes y sigue diferido. La auditoría comprueba además que la proyección diaria, la práctica intensiva y sus traducciones no están en el arranque. Se mantienen 1500 descriptores y 4344 recursos estáticos íntegros, 109382203 bytes multimedia. El APKG no se incluye en el despliegue.

Capturas principales: `back-desktop-es-dark.png`, `back-laptop-en-light.png`, `back-mobile-es-light.png`, `back-small-ca-nora.png`, `back-narrow-es-anime.png` y `back-desktop-ca-nora-dark.png`; `results-*`, `practice-*` y `zoom-*` documentan los demás estados. Se han inspeccionado visualmente las capturas de escritorio/móvil y los temas, además de las aserciones geométricas. No son aceptación humana del producto.

Los tests de navegador usan perfiles nuevos Chromium y el candidato optimizado bajo `/kana-study/`, con audio/imágenes r2. Matriz: 1280×900 oscuro ES y Nora oscuro CA, 1280×720 claro EN, 390×844 claro ES, 360×640 Nora CA y 320×568 Anime ES. Incluyen geometría del reverso habitual, acciones de 44px, notas/traducción desplegadas, zoom CSS 200 %, teclado, secuencia real `play→ended→play→ended`, opt-out tras recarga, fallos de imagen, denegación de audio, red lenta, cancelación, ranking, límite/continuación y comparación exacta de todos los almacenes IndexedDB normales antes/después de practicar. Los eventos de visibilidad se simulan explícitamente; no se presentan como prueba de suspensión física de iOS.

## Uso local y límites

Abrir Japanese 1500 y estudiar normalmente: al revelar se solicitan los medios de esa tarjeta y comienza palabra→frase si el navegador lo permite. Ajustes del mazo permite desactivar la opción sin desactivar el acento. El resumen ofrece selección y práctica intensiva cuando termina el trabajo diario, sin alterar los próximos repasos.

Para el artefacto candidato, generar `npm run build:manga-candidate` y ejecutar `node scripts/serve-kaishi-auto-preview.mjs` sin fixtures. Abrir `http://127.0.0.1:4403/kana-study/#/anki/japanese-1500/study`. No usar un perfil con datos habituales para aceptación exploratoria.

Pendientes: aceptación humana del diseño y audio; Safari/iOS, zoom nativo del navegador, dispositivos físicos y políticas de audio en segundo plano reales. Chromium y zoom CSS no sustituyen esas comprobaciones. No se promete que Safari acepte cada reproducción automática ni disponibilidad offline completa. No se ha probado Supabase Auth real ni modificado su configuración. Se conserva la autorización de medios comunicada por el propietario, sin convertirla en una licencia inventada ni una cita literal.
