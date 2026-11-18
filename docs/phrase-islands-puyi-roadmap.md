# Islas Puyi — P0/P1 y roadmap

18 de noviembre de 2026. Módulo nuevo **privado**, distinto de Islas de frases generales y del mazo Puyi público. P0 es diseño; P1 es laboratorio aislado, no una integración en las rutas de la aplicación. No se han concedido accesos, ejecutado SQL ni publicado contenido personal.

## Decisión de partida

Cada frase conserva su MP3 AivisSpeech/Aida Shigeru. El usuario elige un **bloque**, duración 5/10/15/30 minutos e inicio explícito. El recorrido es frase → silencio configurable (5 s por defecto) → siguiente frase, con vuelta al inicio del bloque hasta agotar tiempo activo. No hay archivos de 30 minutos ni versiones de medios por duración, FSRS, tarjetas, cuotas o estadísticas.

Una composición de **un solo ciclo corto** no está aprobada como solución. No se ha generado ni activado como sustitución. P1 incluye un diagnóstico de `loop` nativo de una sola muestra, claramente separado: ese diagnóstico no representa el bloque, omite sus silencios y puede cortar al vencer. No es un modo aceptable de producción.

## Entregables y apertura

- [Investigación, medidas y límites del temporizador](phrase-islands-puyi-audio-research.md).
- [Modelo, cuentas y seguridad de servidor](phrase-islands-puyi-security-design.md).
- [Hoja de pruebas físicas y acceso HTTPS](phrase-islands-puyi-device-test-plan.md).
- [Demostración de biblioteca y reproducción por bloques P3](phrase-islands-puyi-p3.md).
- [Shadowing por bloques P4](phrase-islands-puyi-p4.md).
- [Escucha continua temporizada P5](phrase-islands-puyi-p5.md).
- [Tarjetas clicables P5.1 y editor privado P6](phrase-islands-puyi-p6.md).
- [Integración privada P7.1](phrase-islands-puyi-p71.md).
- [Validación aislada P7.2A y checklist de publicación P7.2B](phrase-islands-puyi-p72a.md).
- Laboratorio versionable: `experiments/phrase-islands-puyi-p1/`; instrucciones en su `README.md`.

Desde la raíz, con las dependencias existentes instaladas:

```powershell
node experiments/phrase-islands-puyi-p1/server.mjs
```

Abrir <http://127.0.0.1:4441/>. Se preparan cinco MP3 no personales en `.cache/phrase-islands-puyi-p01/media/`, copiando **sin modificar** cinco clips generales ya aprobados y verificando sus hashes. No se sintetiza voz nueva. El servidor expone una lista cerrada de archivos de laboratorio; no expone el proyecto, documentos privados o perfiles.

La configuración predeterminada compara el requisito real: un único `HTMLAudioElement` persistente, MP3 individuales, 5 s de silencio y repetición del bloque. También permite comparar creación de elemento por clip, precarga del siguiente y Media Session. Hay duración corta **solo para pruebas** del temporizador. Los eventos se exportan como JSON local; no se envían a servicios externos ni se guardan como progreso.

## P0 — Datos y privacidad: diseño preparado

Contrato TypeScript propuesto: `experiments/phrase-islands-puyi-p1/puyi-island.model.ts`. Define Island, Block, Phrase, ConversationPrompt, AudioAsset y contexto original privado. UUID estables y relaciones, orden/revisión, furigana/lectura, traducciones naturales/estructurales, explicación/vocabulario, registro y medios versionados por frase/pregunta. Las listas no tienen tamaño fijado. Los arrays de IDs son una proyección para el lector; la persistencia futura usará relaciones/foreign keys y orden canónico.

La sesión contiene selección, posición, duración y reloj temporal, **no duplica AudioAsset**. Un cambio de duración no cambia un audio ni requiere TTS. Traducciones ES/EN/CA pueden estar pendientes en borrador; el lector debe identificar el idioma disponible en lugar de presentar texto pendiente como traducción aprobada.

La referencia personal entregada se conservó **únicamente** en `.phrase-islands-authoring/puyi/reference/grappling-draft.json`, ignorado por Git: dos bloques, diez frases, dos preguntas y relaciones con sus respuestas/contexto. Sus lecturas/furigana y revisión japonesa están pendientes; no hay aprobación ni MP3 definitivos. El contrato versionable y los cuatro documentos no reproducen la conversación personal.

Se reutilizarán Auth/SupabaseClient/Workspace de Kana Study. El workspace o un botón Angular no concede acceso: membresía explícita de un propietario y tres lectores, UUID reales por verificar y RLS en servidor. El Puyi existente tiene lectura pública y bucket de imágenes público; no sirve como almacén de estos datos privados. Detalles y pruebas negativas en el diseño de seguridad. No se han consultado usuarios reales, supuesto UUID ni aplicado permisos.

## P1 — Audio: prototipo funcional, validación física pendiente

El motor usa eventos reales, invalida callbacks anteriores, permite pausar/reanudar/detener y registra transiciones, tiempos de carga, silencios observados, tiempo activo y retrasos de heartbeat. Evita iniciar otro clip después del plazo cuando vuelve a ejecutarse JavaScript. Permite completar el clip actual con margen máximo configurado de **15 s**, condicionado a que el navegador ejecute sus controles. El contador excluye pausa manual y la pausa externa que el navegador notifique. Audio, carga y silencios forman parte del tiempo activo.

**No está demostrado el requisito principal en iPhone 17 Pro/Safari bloqueado.** Tampoco lo está en la Lenovo/Chrome Android con pantalla apagada, Bluetooth o interrupciones. La API web no ofrece aquí una garantía universal de ejecución de la parada. Media Session añade controles/metadatos; no elimina ese límite. El test de suspensión simula la ausencia de callbacks y muestra que una parada puede ejecutarse tarde; no se confunde con una prueba física de Safari.

Los resultados ejecutados y el primer fallo de navegador corregido constan en investigación. Las hojas físicas deben recoger continuidad, silencio, bucle y parada **por separado**, con cronómetro externo y resultado tras desbloquear. P1 no se declara resuelto por mantener una sola pista activa ni por usar un bucle nativo.

## Fases posteriores y puertas de avance

| Fase | Alcance futuro | Condición de aceptación |
| --- | --- | --- |
| P0 | Modelo/acceso privado | Revisar diseño y obtener UUID reales mediante un procedimiento de confianza antes de cualquier SQL/grant. |
| P1 | Audio individual y Safari bloqueado | Ejecutar hoja física en ambos dispositivos y decidir alternativa con el usuario si fallan continuidad o parada. |
| P2 | Primera isla personal y audios | Revisión japonesa humana de registros/lecturas/prosodia, permisos/almacén privado verificados y generación selectiva local; conservar originales. |
| P3 | Biblioteca por bloques | Demostración local con muestras genéricas. La carga privada queda sujeta a la verificación de acceso de P0. |
| P4 | Shadowing | Demostración local con secuencia única, frase activa, pausas de 2/3/5/8 s y pregunta opcional antes del recorrido. |
| P5 | Escucha temporizada | Demostración local en primer plano con 5/10/15/30 min activos y silencios de 0/2/5/8 s. La continuidad y la parada con pantalla bloqueada quedan pendientes de validación física por HTTPS. |
| P5.1 | Tarjetas de bloque | Una pulsación selecciona y reproduce con el modo activo. |
| P6 | Importación desde conversaciones | Editor local con JSON v1, previsualización, borradores privados versionados y preparación de audio por entrada. |
| P7.1 | Integración privada | Ruta Angular diferida, migraciones, defensa RLS, descargas autenticadas y paquete de publicación local. |
| P7.2A | Validación aislada | PostgreSQL, PostgREST y RLS comprobados con identidades ficticias. Queda pendiente el ensayo completo con Supabase Auth y Storage reales. |
| P7.2B | Publicación autorizada | Completar P7.2A, verificar cuatro identidades, aprobar paquete y operaciones de producción, y validar los dispositivos físicos por HTTPS. |

P3, P4 y P5 funcionan en la demostración local con muestras genéricas. La publicación de datos y medios personales requiere superar las comprobaciones de acceso de P0. Las pruebas físicas se realizarán desde la web desplegada por HTTPS, sin certificados locales, antes de dar por validado el segundo plano de P5.

## Diseño de interfaz

Inicio: lista visual de islas. Detalle: título, bloques con frases agrupadas y preguntas relacionadas; selección del bloque y un reproductor sencillo. Escucha: duración, iniciar, pausa/reanudar, detener, frase activa y tiempo restante. Shadowing: misma secuencia con turno para repetir. Sin filas de tarjetas FSRS ni controles de valoración.

iPhone: mobile-first, áreas seguras, controles ≥44 px, furigana legible, retorno claro y significado junto al bloque. Lenovo: lista de bloques y contenido/reproductor en dos columnas en horizontal, sin estirar controles; vertical conserva lectura cómoda. Reutilizar FuriganaText, TranslationService y variables semánticas al integrar Angular. El laboratorio usa SCSS con las variables existentes y una TranslationService local ES/EN/CA aislada; no introduce claves, rutas o cambios en el lector público.
