# Islas de frases — I5: autoevaluación RUSH temporal

17 de noviembre de 2026. Implementación exclusiva de Producción de memoria sobre [I4](phrase-islands-i4-sessions.md) y [I4.1](phrase-islands-i41-session-design.md). Catálogo y MP3 Aivis sin cambios. No hay FSRS, intervalos, calendarios ni persistencia de resultados.

## Responder sin confundirlo con navegar

La sesión empieza por el significado natural en ES/EN/CA. No se insertan japonés, lectura, explicación ni audio antes de «Mostrar respuesta». Después de revelar, los botones grandes **← No la sabía** y **La sabía →** tienen prioridad junto al contenido; Anterior/Siguiente, Deshacer última y Finalizar son navegación secundaria. La explicación conserva su panel plegable de I4.1.

Los tres métodos llaman a `evaluate(known)` y comparten las mismas condiciones: modo Memoria, frase existente, respuesta revelada, ronda sin completar y frase aún sin evaluar.

- **Botones:** una pulsación registra y pasa a la próxima frase sin evaluar, con la respuesta oculta. Los clics repetidos sobre una acción antigua no registran otra frase.
- **Teclado:** izquierda = no sabía; derecha = sabía. Se ignoran eventos repetidos, composición y teclas modificadoras. Inputs, selectores, campos editables, summary, audio/vídeo y controles ARIA que necesitan flechas conservan su teclado. No se interceptan flechas en los otros modos ni antes de revelar. Tras evaluar se enfoca Mostrar respuesta; tras deshacer, el primer botón de evaluación; al completar, el título del resumen.
- **Táctil:** Pointer Events para touch/pen primario. Umbral de 72 px y predominio horizontal de al menos 1,6× el desplazamiento vertical. Un movimiento vertical superior a 18 px con predominio vertical cancela el gesto. Un gesto corto, ambiguo, cancelado, con más de un contacto o sobre un control interactivo nunca evalúa. Cambiar de identidad de frase/ronda invalida un arrastre anterior. Se conserva `pan-y pinch-zoom` nativo. La tarjeta se desplaza como máximo 28 px y se destaca discretamente la acción correspondiente. Las flechas y etiquetas textuales evitan depender solo del color.

No se usa reconocimiento de voz ni se evalúa la pronunciación. Un error de audio solo afecta al reproductor: se puede reintentar o evaluar leyendo el texto, sin convertir automáticamente ese error en un fallo.

## Estado y deshacer

`PhraseRecallSession`, provisto por el componente de sesión, mantiene una lista de rondas en signals. Cada ronda contiene número, IDs únicos en orden de práctica y mapa de respuestas por ID. Cada respuesta registra `phraseId`, `known`, `round` y `order` (posición de práctica dentro de esa ronda). Los mapas se actualizan sin modificar las instantáneas anteriores. Un historial de evaluaciones en orden de acción permite deshacer; no se escriben fechas ni resultados fuera de la memoria.

Una clave ausente significa «Sin evaluar» y se distingue de `known=false`. La pantalla muestra ronda, evaluadas/total y estado de la frase actual. Anterior/Siguiente permiten consultar o saltar frases, sin registrar respuestas. Al visitar una frase ya evaluada se muestra su estado; sus botones de evaluación quedan deshabilitados. Para corregir se usa Deshacer última, que siempre actúa sobre la evaluación más reciente, aunque se haya navegado a otra posición.

Deshacer elimina la última respuesta, detiene audio, restaura la frase y deja su respuesta revelada para corregirla. Puede repetirse sucesivamente. Si se acaba de abrir otra ronda sin evaluarla, deshacer vuelve a la ronda donde se hizo la última evaluación y descarta las rondas posteriores derivadas, evitando listas de falladas obsoletas. Si ya hay evaluaciones en la nueva ronda, primero se deshacen esas. No se reutiliza el Undo de Mazos.

Al evaluar se busca la próxima frase sin evaluar, recorriendo circularmente la lista. Por eso las frases saltadas no desaparecen: se vuelve a ellas y el resumen solo aparece cuando se han evaluado todas.

## Resumen y nuevas rondas

El resumen presenta número de ronda, total realmente evaluado, aciertos, fallos y porcentaje redondeado al entero más cercano. Los contadores se derivan del mapa actual, nunca del historial acumulado. No se mezclan varias evaluaciones de una misma frase en rondas distintas como si fueran frases únicas nuevas.

«Repetir las falladas» solo aparece si existen fallos y únicamente responde a una acción explícita. Crea otra ronda con esos IDs, en su orden anterior, respuestas nuevas vacías e índice inicial con el significado visible y japonés oculto. Las acertadas de la ronda anterior no regresan automáticamente. Se puede repetir este proceso o finalizar. Con cero fallos no se ofrece otra ronda. El resumen también permite deshacer la última evaluación.

Finalizar abandona las respuestas y muestra el fin de sesión; finalizar antes de evaluar todo no inventa un resumen completo. Salir, recargar, cambiar los parámetros de temáticas o cambiar workspace descarta el estado. La selección de temáticas se conserva al regresar mediante el contrato URL de I3.1.

## Separación y audio

- `PhraseRecallSession`: estado y reglas de rondas, sin dependencias de almacenamiento.
- `RecallSwipe`: directiva de intención táctil, cancelación e indicación de arrastre; no conoce audio ni resultados.
- `PhraseSessionPage`: coordina los tres métodos con el estado de revelación, foco, navegación y el reproductor existente.
- `PhraseRecallSummary`: componente compartido de presentación con métricas de entrada y eventos de repetir/finalizar/deshacer; no calcula ni guarda respuestas.

Escuchar, Shadowing y Explorar conservan su comportamiento. El servicio de audio no se modifica en I5. Evaluar, navegar, deshacer, salir y cambiar workspace usan la cancelación existente para impedir callbacks o reproducciones obsoletos. No se regeneran ni se modifican las 36 frases o sus medios.

## Validación

- Pruebas dirigidas: 39 tests aprobados de estado de rondas, componente, intención táctil, audio y biblioteca.
- Casos: guardia antes de revelar, botones/flechas, controles editables, eventos repetidos, duplicados, orden/IDs, saltos de navegación, resumen, varias rondas, cero fallos/todas falladas/una frase, deshacer dentro y entre rondas, audio fallido y cambio de workspace/destrucción.
- Playwright comprueba además eventos táctiles nativos de Chromium vía CDP, scroll vertical sin respuesta, gestos cortos/ambiguos, errores 404 y reintento con MP3 real, ausencia de escrituras/aperturas de BD en acciones instrumentadas, ES/EN/CA y regresiones I4/I4.1. Se ejecuta en Edge/Windows, 320/390/768/1280 px y claro/oscuro.
- Auditoría de los 36 medios/hashes correcta; build candidata con 707969 bytes iniciales, estrictamente <750000, y funcionalidades diferidas, sin código de tests en el artefacto.
- El build emite un aviso de SCSS de la sesión: 8,10 kB frente a umbral de aviso de 8 kB (95 bytes de exceso). No afecta al presupuesto inicial ni bloquea el build. Se conservan además los avisos existentes de otros módulos.

Capturas: `.cache/phrase-islands-i5/hidden-*.png`, `revealed-*.png` y `summary-*.png`. Resultado final: **112 pruebas Playwright aprobadas** y **287 archivos / 3570 tests globales aprobados**. En una ejecución intermedia falló una comprobación de temporización de Kanji (`study-time-flows.spec.ts`, 00:00 frente a 00:04); se verificaron sus 10 tests aislados y la suite completa volvió a pasar sin modificar ese módulo. No se oculta ese resultado intermitente ni se atribuye una causa no demostrada.

## Límites

Son autoevaluaciones de la sesión actual, sin recuperación al recargar, progreso entre sesiones, editor de respuestas arbitrarias ni evaluación automática de voz. El teclado y los botones permiten completar todo el flujo sin gestos. El táctil se verifica mediante emulación nativa en Edge/Chromium, no con dedos en dispositivos físicos. No se ha validado Safari/iOS ni pantalla bloqueada; siguen vigentes las limitaciones de segundo plano de I4.

Sin SQL, commit, push ni despliegue. Se mantienen los cambios locales previos y no se modifican módulos ajenos.
