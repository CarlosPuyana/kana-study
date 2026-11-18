# Islas de frases — I4: sesiones temporales

Implementación del 17 de noviembre de 2026. Se conservan las 36 frases y sus MP3 AivisSpeech/Aida Shigeru de I3. No hay generación TTS, I5 ni I6.

## Acceso y navegación

En `#/anki/islands`, seleccionar una o varias temáticas habilita los tres modos. Las rutas diferidas son `#/anki/islands/listen`, `/shadowing` y `/recall`, con el mismo parámetro `topics` que el explorador. Filtrar el catálogo elimina temas desconocidos y evita duplicados. Se usa el orden original. Un enlace vacío/inválido muestra una indicación útil y regreso a Islas.

Cada pantalla muestra frase actual/total, Anterior, Siguiente, Finalizar y regreso mediante la cabecera. Anterior/Siguiente detienen audio y pausas; la reproducción siguiente requiere un clic explícito. Regresar conserva las temáticas de la URL. Recargar crea una sesión nueva desde el principio, sin recuperar respuestas. Finalizar cancela audio, listeners y temporizadores y muestra el final de sesión; no escribe resultados.

## Tres comportamientos

- **Escuchar:** pulsar Reproducir inicia la lista desde la frase actual. Repeticiones 1/2/3, intervalo entre clips 0/1/2 s y velocidad 0,8/1/1,2×. El evento real `ended` decide repetir o avanzar, nunca una duración supuesta. Al terminar el último clip/repetición finaliza limpiamente. Pausar/Continuar conserva posición del clip o tiempo restante del intervalo. Detener cancela todo y permite empezar de nuevo desde la frase actual. Significado y explicación se muestran/ocultan opcionalmente.
- **Shadowing:** reproducción de una frase, seguida de un turno orientativo de 2/3/5/8 segundos para imitarla. No avanza automáticamente ni inicia una reproducción al terminar ese turno. Reproducir permite repetir la misma frase; Siguiente/Anterior avanzan manualmente. Incluye velocidad y significado opcional. No usa micrófono ni evalúa pronunciación.
- **Producción de memoria:** antes de revelar solo aparece el significado natural de la respuesta en el idioma de interfaz, junto a controles generales de sesión. Japonés, furigana, lectura, explicación y reproducción de la respuesta no se insertan en el DOM. Mostrar respuesta revela estos elementos y habilita audio manual/repetible. Cada cambio de frase vuelve a ocultarla. No hay valoración, swipes, estadísticas ni audio anterior a revelar.

## Audio y aislamiento

`PhraseAudioService`, ya usado en el explorador, sigue siendo el único reproductor. Añade velocidad, pausa/continuación y callback de fin. Atiende eventos `play`, `playing`, `pause`, `ended`, errores y rechazos de `play()`. Los tokens de generación invalidan callbacks/promesas antiguas. Se retiran listeners y fuente al detener o destruir; reproducir de nuevo detiene el clip anterior, incluso tras clics rápidos.

`PhraseSessionPage` controla lista, índice, revelación e intervalos cancelables en memoria. Un contador de cancelación invalida acciones retrasadas. Errores/bloqueo cancelan la marcha y permiten reintentar con el botón de reproducción. `WorkspaceService.activationRevision` actúa solo como señal de invalidación: cambiar workspace cancela el audio y vacía la sesión, incluso en A→B→A. No se invoca activación ni se escribe almacenamiento desde Islas. Salir de ruta destruye el componente y descarta la sesión.

Las referencias de audio siguen resolviéndose contra `document.baseURI`, incluido `/kana-study/`. El componente, catálogo y traducciones siguen diferidos; no se añaden dependencias TTS ni modelos al bundle. No se usan FSRS, scheduler de Mazos, Undo, historial, sincronización ni stores nuevos.

## Límites de reproducción

Se revisan las limitaciones documentadas en I1: el navegador puede suspender ejecución y temporizadores entre clips, especialmente en segundo plano o con pantalla bloqueada. Esta fase no usa Media Session ni promete continuidad universal. Iniciar se hace mediante botón, después de interacción explícita; los siguientes clips son continuación de esa lista, pero pueden requerir un reintento si el sistema bloquea `play()`. Se muestra un aviso en la sesión. No se han probado Safari/iPhone ni móviles físicos, ni bloqueo físico de pantalla.

## Validación

Pruebas dirigidas: 21 tests de componente, sesión y reproductor. Incluyen ausencia de audio anterior a revelar, duplicados, secuencia basada en eventos, repeticiones, intervalos pausables/cancelables, final limpio, cambio de workspace, destrucción y callbacks obsoletos.

Suite global final: 285 archivos y 3552 tests aprobados. Compilación `npm run build:manga-candidate` correcta; presupuesto inicial 707969 bytes <750000. Auditoría de 36 medios/hashes y separación del catálogo respecto al grafo inicial correcta. Las advertencias SCSS existentes de otros módulos se conservan.

Los recorridos de navegador y capturas se documentan tras la ejecución focalizada: `npx playwright test --config playwright.phrase-islands.config.ts`. Los cambios de workspace se comprueban mediante la señal real de invalidación en test de componente; no se presenta como una prueba de login/logout real con cuentas. Errores 404 y `NotAllowedError` se provocan deliberadamente para comprobar el reintento.

Sin SQL, commit, push ni despliegue. Se preservan los cambios locales de las fases anteriores.

Playwright final: **48 pruebas aprobadas** en Edge/Windows, 1280/390/320 px y claro/oscuro. Biblioteca y sesiones: selección múltiple, navegación y retorno, ES/EN/CA, controles de teclado, secuencia de audio real con repeticiones y velocidad, pausa/continuación, final automático del último clip, shadowing manual, DOM sin respuesta antes de revelar, bloqueo/404 simulados y reintento, clics rápidos con un solo clip activo y cero escrituras/aperturas de bases de datos en las acciones instrumentadas. Capturas revisadas en `.cache/phrase-islands-i4/recall-*.png`. Los navegadores reproducen archivos reales; no hay métricas de evaluación de voz.
