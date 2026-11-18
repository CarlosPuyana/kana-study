# Islas de frases — I4.1: diseño de sesiones

17 de noviembre de 2026. Rediseño de presentación sobre [I4](phrase-islands-i4-sessions.md). Se mantienen las rutas, selección `topics`, catálogo, archivos Aivis, sesiones temporales y reproductor compartido. No se implementa I5/I6.

## Jerarquía y decisiones de UX

La cabecera de sesión reúne regreso, nombre del modo y posición `1 / 6` en una fila compacta. La barra de progreso complementa la posición textual y tiene nombre accesible. La cabecera específica usa `RouterLink` con los mismos parámetros de regreso; no modifica el encabezado compartido de otras pantallas. Se omiten las acciones de cuenta dentro de la práctica para mantener el foco; siguen disponibles al regresar a Islas.

La tarea ocupa una tarjeta única con contenido, transporte y navegación próximos. Reproducir y Mostrar respuesta son acciones primarias; Anterior y Detener, secundarias; Finalizar es discreta. Pausar/Continuar comparten posición según el estado, invocando exactamente los métodos existentes. Los controles conservan un área de al menos 44 px, foco visible y nombres traducidos. Los botones primarios usan colores semánticos con contraste comprobado de al menos 4,5:1 en claro/oscuro.

### Escuchar

Composición centrada de reproductor: marca de sonido decorativa sin animación, japonés grande con furigana, lectura secundaria y transporte agrupado. Estado de audio cerca de los botones. El significado se abre a petición; la explicación tiene otro nivel plegable. No se presenta un indicador ficticio de amplitud o de tiempo: la marca es estática y decorativa.

### Shadowing

Composición con dos pasos explícitos: escuchar el ritmo/entonación e imitar durante la pausa. El paso activo sigue el estado `waiting()` ya existente. En escritorio y 768 px la guía está al lado del japonés; en móvil es una franja de dos columnas dentro de la tarjeta. El texto aclara avance manual y ausencia de evaluación. No se añade un contador de segundos ni un temporizador nuevo.

### Producción de memoria

Antes de revelar: instrucción «Dilo en japonés», significado destacado y CTA «Mostrar respuesta». No hay japonés, lectura, explicación ni audio de la respuesta en el DOM. Después: significado reducido a contexto, japonés protagonista con furigana, audio cercano y Siguiente como acción principal. La construcción y la explicación están en «Ver construcción y explicación», un panel plegable disponible tras revelar. No se añade autoevaluación.

## Menos scroll

Opciones deja de ser un fieldset permanentemente desplegado. Un `details/summary` nativo muestra un resumen compacto de velocidad y repeticiones/pausa de imitación; dentro conserva los mismos selectores según el modo. Otro `details/summary` contiene construcción y explicación. Se evita una columna de explicación siempre abierta y se agrupa la navegación en el borde inferior de la tarjeta, junto a la tarea.

El flujo principal funciona con los paneles cerrados. Los tests visuales comprueban que Mostrar respuesta antes de revelar, Reproducir y Siguiente quedan dentro del viewport para las frases de prueba en 320/390/768/1280 px. El contenido más largo y los paneles abiertos pueden requerir scroll: no se limita su altura ni se recorta información.

## Reutilización e integridad

Se reutilizan `PhraseSessionPage`, `FuriganaText`, `PhraseAudioService`, los signals y todos los métodos de I4. El único cambio TypeScript de producción en esta fase sustituye la importación del encabezado por `RouterLink`; no cambia ningún método ni estado del motor de sesión o audio. Los paneles usan el comportamiento nativo del navegador, sin nuevas dependencias ni timers. SCSS con variables semánticas existentes, sin paletas por componente. Los textos nuevos se añaden a ES/EN/CA y al dominio diferido generado de Islas.

Se conserva navegación, progreso, retorno con selección, revelación, cancelación por ruta/workspace y ausencia de escrituras de aprendizaje. No se modifican catálogo, WAV/MP3, FSRS, Undo, sincronización ni persistencia. Se preservan los cambios previos. Sin commit, push ni despliegue.

## Validación

- 21 tests dirigidos de sesión, biblioteca y audio aprobados.
- Suite global: 285 archivos y 3552 tests aprobados.
- Build candidata correcta; 707969 bytes iniciales (<750000), catálogo y funcionalidad diferidos, sin código de tests en el artefacto. Auditoría de los 36 medios y hashes correcta. Se mantienen avisos SCSS preexistentes de otros módulos.
- Playwright: **72 pruebas aprobadas**. Recorridos de I4 más prueba visual para tres modos, antes/después de revelar, opciones/detalles por teclado, foco, contraste, ausencia de desbordamiento y acciones principales en viewport. Ocho configuraciones: 320, 390, 768 y 1280 px, cada una en claro/oscuro, con Edge real sobre Windows. ES/EN/CA y audio MP3 real.
- Capturas por modo y configuración: `.cache/phrase-islands-i41/listen-*.png`, `shadowing-*.png`, `recall-before-*.png` y `recall-*.png`.

No se declara probado Safari/iOS, móviles físicos ni pantalla bloqueada. Las limitaciones de audio en segundo plano documentadas en I4 permanecen vigentes.

Capturas finales limpias de móvil (390 px, tema claro) en `listen-clean-mobile-light.png`, `shadowing-clean-mobile-light.png` y `recall-clean-mobile-light.png`, en la misma carpeta. Revisión visual inicial de 320/1280 px y posterior de escritorio y móvil, incluidos estados antes/después de revelar. Se verificó además la alineación real de los tres elementos de cabecera en 390 px.
