# Islas de frases — roadmap

Nombre provisional. Experiencia de frases japonesas frecuentes para escuchar, hacer shadowing y producir de memoria, accesible desde Mazos pero independiente de sus tarjetas.

## I0 — Esqueleto visual y navegación

Implementado:

- Acceso separado bajo los mazos actuales, sin cambiar sus tarjetas ni sus acciones.
- Ruta hash `#/anki/islands`, componente standalone con carga diferida y regreso a `#/anki` mediante el encabezado compartido.
- Biblioteca demostrativa de seis temáticas. Nombres, descripciones e iconos son datos de presentación locales al componente; no constituyen un catálogo de estudio.
- Selección múltiple mediante botones nativos con `aria-pressed`, indicación textual, marca visual y total anunciado. Enter y Espacio usan el comportamiento nativo de los botones.
- Selección en un signal del componente. Al salir o recargar se descarta; no se conserva por usuario ni workspace.
- Espacio de metadatos en cada temática, actualmente «Próximamente». No hay cantidades inventadas de frases; el único total es el de temáticas seleccionadas por la persona.
- Tres opciones de práctica con botones nativos `disabled`, sin acciones ni sesiones simuladas.
- ES/EN/CA en los JSON de referencia y en un dominio generado diferido (`phrase-islands.generated.ts`), registrado mediante `TranslationService` al entrar en Mazos o Islas. No se añaden sus textos al diccionario inicial.
- Estilos SCSS con variables semánticas existentes, temas claro/oscuro y disposición adaptable.

La nueva página no importa servicios de estudio, FSRS, Undo, sincronización ni escritura de progreso. El compilador de traducciones y la comprobación de carga diferida incluyen el nuevo dominio. La integración no modifica los mecanismos existentes del encabezado común ni de Mazos.

Deliberadamente fuera de I0: catálogo real de frases, audio o reproducción, investigación/selección de proveedor TTS, IA, micrófono, sesiones, gestos de respuesta, atajos de respuesta, estadísticas, progreso, persistencia, nuevos stores/tablas, backend y permisos de administración. No se solicita ningún permiso multimedia.

## I1 — Investigación de TTS japonés, licencias y arquitectura

Investigación documental realizada el 17 de noviembre de 2026: [informe específico de audio japonés](phrase-islands-audio-research.md).

Se recomienda generación local anticipada y distribución de audio estático versionado por frase. Para I2 se propone comparar AivisSpeech Engine con la voz Aida Shigeru y VOICEVOX Engine con Kurono Takehiro; la voz definitiva queda pendiente de escucha humana y verificación de los artefactos/licencias exactos. El informe compara también Piper Plus/OpenJTalk, Web Speech API, Anki/HyperTTS/AwesomeTTS y Kokoro, distingue condiciones de software/modelo/voz/audio y documenta diez frases, protocolo reproducible y criterios de aceptación.

I1 no implementa audio ni prácticas, no instala motores ni dependencias y no genera archivos de voz. No se presupone un proveedor aprobado por su licencia de código o por su calidad promocionada. Las pruebas auditivas, de hardware, Safari/móvil, bloqueo de pantalla y offline se realizarán en I2.

## I2 — Prototipo real de audio y validación auditiva

Piloto técnico ejecutado: [resultados, apertura del comparador, métricas y límites de validación](phrase-islands-i2-pilot.md). Se generaron los veinte originales previstos con ambos motores CPU y sus consultas, además de dos pistas precompuestas. El comparador independiente permite escucha A/B y evaluación/exportación; los archivos grandes permanecen en `.cache/phrase-islands-i2/`. La escucha humana, selección definitiva y pruebas de bloqueo físico/Safari/móviles siguen pendientes; no se declara completada la aprobación pedagógica de I2.

Construir un prototipo acotado con audio real siguiendo el [piloto de diez frases y los criterios del informe I1](phrase-islands-audio-research.md#11-piloto-i2-diez-frases-comunes). Comparar los mismos textos en al menos los dos candidatos principales, por separado antes y después de correcciones editoriales, con escucha humana ciega. Validar pronunciación, naturalidad, ritmo y entonación; contrastar Chrome y Safari, dispositivos móviles, pausas, repetición, velocidades, bloqueo de pantalla y alcance offline real. No confundir reproducción técnica correcta con calidad lingüística.

## I3 — Catálogo inicial de frases

Implementado: [colección inicial, generación, licencias y validación de I3](phrase-islands-i3-catalog.md). **Decisión definitiva del usuario: AivisSpeech Engine 1.2.0, Aida Shigeru, estilo normal.** Esta decisión sustituye la selección pendiente de I1/I2: no se hará I2.1 ni nuevas rondas A/B.

Hay 36 frases con revisión editorial/técnica documentada, seis por temática, japonés/furigana y contenido ES/EN/CA; 36 WAV/consultas conservados en caché y 36 MP3 mono versionados en assets públicos. Contenido, estado editorial y referencia multimedia están separados mediante IDs estables. La biblioteca muestra cantidades reales, permite explorar la selección y escuchar/repetir/detener cada frase. Los tres modos permanecen deshabilitados hasta I4; no hay sesiones, progreso ni persistencia de selección.

La revisión por el agente y la reproducción técnica no equivalen a certificación auditiva nativa. Se mantiene pendiente la comprobación humana de las 36 prosodias sin reabrir la elección de motor/voz. El informe conserva las evidencias y limita lo verificado en Safari/móviles físicos. Los apartados I0–I2 anteriores describen el alcance y decisiones de sus respectivas fases.

## I4 — Modos de práctica

Implementados: [sesiones temporales, audio compartido, controles y validación de I4](phrase-islands-i4-sessions.md).

- **Escuchar:** lista iniciada por clic con 1/2/3 repeticiones, pausas cancelables de 0/1/2 s, velocidad 0,8/1/1,2×, pausa/continuación y fin limpio mediante eventos reales de audio.
- **Shadowing:** escuchar e imitar durante un intervalo orientativo configurable; repetición y avance manual, sin micrófono ni evaluación.
- **Producción de memoria:** significado natural en el idioma de interfaz, respuesta japonesa y audio ocultos hasta revelar; estructura/explicación y reproducción manual después.

Las rutas diferidas `islands/listen`, `islands/shadowing` e `islands/recall` reutilizan `topics` de I3.1. Sesiones exclusivamente en memoria, índice/total, Anterior/Siguiente, Finalizar y regreso con selección. Salir o cambiar workspace cancela audio e intervalos y descarta la sesión. Sin FSRS, escrituras de aprendizaje, cuotas, estadísticas, autoevaluación I5 ni editor I6. Las referencias anteriores a modos deshabilitados describen el alcance histórico de I0–I3.1.

## I5 — Autoevaluación RUSH

Implementada exclusivamente en Producción de memoria: [flujo, rondas, deshacer y validación](phrase-islands-i5-rush.md).

Después de revelar, **← No la sabía / La sabía →** funcionan mediante botones, flechas o swipe horizontal. No se evalúa antes de revelar ni se interceptan controles editables; gestos verticales/ambiguos y eventos repetidos se descartan. Cada acción registra una respuesta por ID/ronda/orden y pasa a la próxima frase sin evaluar, nuevamente oculta.

El estado es temporal, distingue pendientes/aciertos/fallos y permite deshacer incluso tras navegar o abrir otra ronda. Al completar todas las frases se muestran total real, aciertos, fallos y porcentaje. Repetir las falladas inicia, solo a petición, una ronda nueva con esas frases y respuestas vacías. Con cero fallos no se ofrece repetir. No hay estadísticas persistentes, FSRS, intervalos ni valoración automática de voz. Salir, finalizar o cambiar workspace descarta la sesión; catálogo/audio y los otros modos no cambian.

## I6 — Administración de contenido

### I6.1 — Arquitectura de administración y publicación

Diseño completado: [infraestructura reutilizable, estrategias y plan de I6.2](phrase-islands-i6-admin-design.md). Puyi ya dispone de Supabase Auth y autorización administrativa de servidor; es una capacidad específica, no un rol global ni un permiso GitHub.

Se recomienda comenzar con editor local de archivos, pipeline Aivis selectivo y publicación revisada mediante Git/Pages. Guardar borrador, preparar snapshot y desplegar son pasos efectivos distintos. GitHub autoriza la publicación común; el editor no entra al artefacto público. Sin nuevo login, backend de escritura ni migraciones en esta opción. Si se necesita guardar/publicar solo con la cuenta web, se justifica reutilizar Auth y la asignación administrativa con nuevas RPC/RLS específicas.

### I6.2 — Editor local y releases versionadas

Implementado: [guía operativa, demostración real y validación](phrase-islands-i62-local-editor.md). Entrada Angular de autoría independiente (`npm run start:phrase-admin`), borradores JSON recuperables, furigana/ES/EN/CA, validación compartida con CLI, revisiones y aprobaciones ligadas a fingerprints. AivisSpeech 1.2.0/Aida Shigeru genera solo el ID solicitado y conserva consultas, WAV y MP3 privados por intento; permite reutilizar audio idéntico en ediciones de traducciones.

La CLI prepara snapshots inmutables, diff, verificación, preview aislado, backup recuperable y rollback mediante otra release. GitHub sigue autorizando la publicación real; no se incorporan editor, borradores, modelos ni másteres al build público. Se mantiene la carga diferida y el presupuesto inicial de 750000 bytes.

Demostración real de 37 frases en staging: alta desde formulario con MP3 Aivis, otro borrador excluido, Explorar/los tres modos/RUSH comprobados; edición existente conserva ID/audio y rollback vuelve a 36. Revisiones de demostración técnica, pendientes de escucha humana y no publicables como aprobación editorial. Las 36 frases y sus audios originales permanecen intactos. Sin SQL, commit, push ni despliegue. I6.1 conserva su alcance histórico de diseño sin implementación.

## Validación de I0

Pruebas de componente para selección independiente, deselección, metadatos accesibles, traducciones, opciones deshabilitadas, descarte al recrear la página y ausencia de escrituras/apertura de bases de datos en el componente. Playwright focalizado para Mazos → Islas → Mazos, enlaces directos y recarga, teclado/foco, traducciones, contraste y ausencia de desbordamiento en 320/390/1280 px, con claro/oscuro.

Comandos: `npm test`, `npx playwright test --config playwright.phrase-islands.config.ts`, `npm run build` y `npm run build:manga-candidate`. La auditoría candidata debe mantener menos de 750000 bytes iniciales y comprobar que la página y sus traducciones siguen siendo diferidas. Las capturas de la ejecución se guardan en `.cache/phrase-islands/`.

## I3.1 — Exploración separada de la práctica

La página `#/anki/islands` mantiene presentación, seis temáticas con cantidades reales, selección múltiple, enlace «Explorar frases» y los tres modos deshabilitados. No expande frases al seleccionar. El explorador se muestra en `#/anki/islands/explore`, reutilizando el componente y reproductor existentes con presentación según los datos de ruta, sin duplicar catálogo ni audio.

La selección se serializa en `?topics=everyday,travel`, compartida por el enlace de exploración y el regreso a Islas. Se filtran IDs desconocidos y duplicados. Atrás/adelante y recarga reconstruyen la selección desde la URL. Un explorador sin temas válidos muestra el estado vacío y navegación de regreso. No hay almacenamiento de usuario ni escrituras de estudio. Este contrato de parámetros puede reutilizarse en I4; los modos siguen sin implementar sesiones.

El catálogo, WAV y MP3 permanecen intactos. Las capturas de inicio están en `.cache/phrase-islands-i3/home-*.png` y las del explorador en `library-*.png`.

Validación I3.1: 14 tests dirigidos aprobados; suite global final de 284 archivos y 3543 tests aprobada. Playwright: 24 pruebas aprobadas en Edge/Windows con 320/390/1280 px, temas claro/oscuro, ES/EN/CA, audio real, errores/bloqueo simulado, teclado, enlaces directos, recarga y navegación atrás/adelante. Compilación candidata correcta con 707969 bytes iniciales (<750000), catálogo y traducciones diferidos. Auditoría de los 36 medios/hashes correcta; sin regenerar ni modificar audios. Capturas revisadas de inicio y explorador; no se declara validado Safari ni móvil físico.

## I4.1 — Rediseño de las sesiones

[Diseño aplicado, decisiones UX y validación](phrase-islands-i41-session-design.md). Cabecera compacta con progreso, tarea y transporte dentro de una tarjeta, opciones y explicación plegables. Escuchar tiene composición de reproductor; Shadowing, guía de escucha/imitación; Memoria, significado y revelación como foco, seguido de japonés y avance. Se conserva sin cambios el motor de sesión/audio de I4 y no se implementa I5. Capturas de los tres modos en `.cache/phrase-islands-i41/`.
