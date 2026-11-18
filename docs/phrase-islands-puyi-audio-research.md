# Islas Puyi — P1: audio individual, segundo plano y tiempo activo

18/11/2026. Investigación con fuentes oficiales y prototipo real. **No hay validación física de iPhone/Safari ni Android**. El dispositivo objetivo no determina la versión de iOS/Chrome: debe registrarse en la hoja de pruebas.

## Requisito que se conserva

Bloque de N MP3 individuales → silencio configurable entre cada par, incluido último→primero → repetición hasta 5/10/15/30 minutos activos. Pausa manual congela audio/silencio restante y reloj. Los segundos del silencio no están codificados en cada frase. No se producen medios de larga duración ni nuevas síntesis de la misma frase por sesión.

Implementación aislada en `experiments/phrase-islands-puyi-p1/`. Por defecto B: un solo elemento de reproducción persistente con `src` cambiado al finalizar. No depende de servicios de Islas generales. Alternativa A crea un elemento por clip; C añade fetch/Blob del siguiente, acotado; D permite Media Session con detección/fallback. El diagnóstico E usa solo A en bucle nativo, de forma explícita, **no reemplaza el bloque**.

## Comparación técnica

| Opción | Qué aporta | Riesgo/resultado y alcance |
| --- | --- | --- |
| A. Elemento nuevo por clip | Control simple/cancelación por instancia | Cada `play()`/carga puede requerir permiso y tareas JS. Implementado para comparar, no preferido. |
| B. Un elemento, `ended`→src→play | Conserva una instancia durante la sesión; evita audio simultáneo | Predeterminado. Depende de que lleguen `ended` y se ejecuten pausa/cambio; no garantiza Safari bloqueado. |
| C. Precargar siguiente | Reduce espera de red; prueba con Blob independiente del src siguiente | Solo un siguiente, sin descargar 30 minutos. No impide suspensión, no acredita expiración/Range de URLs privadas. |
| D. Media Session | Metadatos/acciones del sistema cuando el navegador las soporte | No concede permiso ilimitado a timers. Se registran capacidades; controles de pantalla bloqueada requieren prueba física. |
| E. `HTMLMediaElement.loop` | El navegador puede repetir un recurso sin cambiar src por JS | Se ensaya con un MP3. No repite una lista ni añade pausas; `ended` no se dispara normalmente al hacer loop. Su parada sigue requiriendo control. |
| F. Un ciclo corto temporal | Podría incluir los N clips y silencios en un recurso reutilizable | Investigación, **no aprobado ni generado**. La repetición nativa puede ayudar a continuidad, pero no demuestra parada a tiempo con JS suspendido. |
| G. HLS nativo/cola nativa | Traslada más decisiones al reproductor del sistema | Requiere otro piloto y aprobación. No basta renombrar MP3 o ponerlos en un `.m3u8`. No implementado. |

### Evidencia oficial y qué no demuestra

[Guía Apple de control de medios](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/Using_HTML5_Audio_Video/ControllingMediaWithJavaScript/ControllingMediaWithJavaScript.html) describe sustitución por eventos. Es una guía archivada: no certifica Safari/iOS actuales en segundo plano. [WebKit 173332](https://bugs.webkit.org/show_bug.cgi?id=173332) documentó `ended` retenido con pantalla apagada y aparece **RESOLVED FIXED**; [229688](https://bugs.webkit.org/show_bug.cgi?id=229688) documentó una regresión al cargar el siguiente recurso. Sirven como evidencia del tipo de fallo y de su dependencia de versiones, no como prueba de que el iPhone objetivo falle hoy.

[W3C Media Session](https://www.w3.org/TR/mediasession/) define integración con controles/metadatos del sistema, no una garantía de temporizadores de aplicación. [Page Visibility](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API) documenta restricciones de trabajo en segundo plano; no se deduce que todo navegador suspenda siempre una página con audio. Precisamente por esa variabilidad deben medirse continuidad **y** parada en el dispositivo real.

[MDN `ended`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/ended_event) especifica que con loop y velocidad no negativa ese evento no se dispara. Un diseño que cuente vueltas solo con `ended` no sirve para ese recurso. `timeupdate`/callbacks también pueden retrasarse: no proporcionan un reloj físico garantizado.

Web Audio/OfflineAudioContext, MSE/ManagedMediaSource o un service worker no constituyen por sí solos una exención de suspensión. [WebKit Safari 17.1](https://webkit.org/blog/14735/webkit-features-in-safari-17-1/) introdujo Managed Media Source en iPhone, pero no promete los dos requisitos del proyecto. No se añaden hacks de audio silencioso continuo, micrófono, wake lock o permisos de captura para evitar restricciones.

## Temporizador implementado y límite imposible de ocultar

`ActiveClock` acumula intervalos entre inicio/reanudación y pausa, sin descontar por ticks. Audio, carga y silencios planificados cuentan como sesión activa; pausa manual o pausa externa notificada al elemento excluyen ese intervalo. No mide si el volumen físico está a cero ni si el sistema suspendió sin enviar eventos.

- Antes de cada clip y callback diferido se comprueba presupuesto restante. Si se agotó en silencio, se detiene y no arranca el siguiente.
- Si vence durante un clip ya iniciado, puede terminar. Se aceptan en P1 clips de hasta 15 s y se programa un corte de seguridad en `duración + 15 s` si no finaliza. En ejecución normal no se cortan palabras; un stall/medio corrupto o la parada manual pueden requerir detener.
- Pausar en audio/silencio conserva fase/posición y presupuesto. Reanudar el clip que ya estaba en margen no empieza otra frase. Parar/cambiar sesión invalida promesas, listeners y temporizadores antiguos.
- Errores y autoplay bloqueado detienen reloj/cola y exigen reintento explícito; no se saltan frases silenciosamente. Una carga activa sin respuesta tiene límite de 15 s mientras se ejecuta el heartbeat. Los cambios de reloj del sistema y las interrupciones que no produzcan evento son límites a medir; no hay reloj de servidor en P1.
- Al regresar de suspensión se reconcilia el tiempo de reloj activo transcurrido y se detiene si venció, sin recuperar clips atrasados ni iniciar una nueva frase. Eso **no equivale a haber parado exactamente mientras la página no ejecutaba código**.

El test unitario que salta 60 s sin entregar callbacks conserva el estado de reproducción hasta reconciliarlo: muestra el límite del diseño, no una simulación que certifique Safari. Un bucle nativo podría seguir indefinidamente durante la suspensión; no se puede prometer margen físico de 15 s si no se ejecuta el código encargado de detenerlo. Registrar el instante audible de parada con cronómetro externo, no solo el log posterior al desbloqueo.

El diagnóstico de loop de A corta al vencer para comprobar el control básico y sus límites. **No respeta por sí mismo la política de completar una frase del bloque y no está propuesto como modo final.** Se mantiene separado/opt-in.

## Prototipo y evidencia ejecutada

Arranque y comandos en [README](../experiments/phrase-islands-puyi-p1/README.md). Medios privados de prueba en `.cache/phrase-islands-puyi-p01/media/A.mp3` a `E.mp3`; son copias verificadas de frases genéricas que ya eran públicas, no la conversación personal. No se crea ninguna pista combinada.

| Clip | Duración s | Bytes |
| --- | ---: | ---: |
| A | 1,628 | 17024 |
| B | 1,814 | 18852 |
| C | 2,220 | 22771 |
| D | 1,570 | 16501 |
| E | 1,976 | 20420 |
| Total | 9,208 | **95568** |

Un ciclo con cinco silencios de 5 s dura teóricamente **34,208 s**, más esperas de transición. Duración seleccionada no multiplica estos bytes. El manifiesto registra SHA-256 y procedencia de cada copia.

Pruebas de motor: 14 casos, aprobados; dos comprobaciones de servidor/diccionarios completan **16 pruebas Node**. Cubren N=1/5/7, orden/bucle, 5 s configurables, reloj pausado, presupuesto en silencio/audio, margen y reanudación, callbacks tardíos, suspensión simulada, autoplay y prefetch tardío. Los MP3/HTTP se prueban además en Edge real. Los resultados finales siguientes no se presentan como pruebas de iPhone.

En el primer pase Edge se detectó un error del **prototipo**, `Illegal invocation`, al almacenar `clearTimeout`/`setTimeout` como métodos: las pruebas unitarias con scheduler inyectado no lo detectaron. Se corrigieron las llamadas mediante wrappers de `globalThis` y se volvió a comprobar con audio real. Se conservaron los logs iniciales. Un intento inicial de conexión estaba aislado del navegador por el entorno local; se reinició únicamente el servidor del laboratorio con acceso al navegador. No fue un fallo de Safari. El primer build normal terminó de compilar, pero no pudo copiar un recurso en `dist` por permisos locales; se repitió con acceso al directorio de salida. No se cambiaron módulos de producción para esos diagnósticos.

### Resultado final automatizado

| Prueba real/medición | Resultado |
| --- | --- |
| Edge/Windows, Playwright | **8 casos distintos aprobados**; revisiones dirigidas posteriores de bucle nativo, layout y pausa también aprobadas. |
| B predeterminado, MP3 individuales | Orden `A,B,C,D,E,A`; una vuelta completa y comienzo de la siguiente. Máximo un audio activo. |
| Silencios observados `playing−ended` en Edge | **5023, 5020, 5024, 5029 y 5025 ms**, con 5000 ms configurados; incluyen carga/eventos, sin pausa manual en esa medición. |
| Carga por clip en esa ejecución | **17–63 ms** hasta `playing`; no son mediciones de conexión móvil ni latencia acústica. |
| A + C, sin pausa configurada | Seis clips en orden, hits de precarga y sin solapamientos. |
| Pausa manual y presupuesto corto | Reloj activo quedó en 66 ms durante **1243 ms** de pausa; final a **4011 ms activos** para 4000 solicitados, sin iniciar otra frase. |
| Vencimiento mientras A suena | A termina, no se carga B; test comprueba final después de 1 s solicitado y antes de 16 s activos. |
| Errores | 404 y `NotAllowedError` provocados, reintento, reinicio rápido/parada y liberación de audio comprobados. |
| E nativo | Vuelta nativa detectada mientras suena A, sin `ended` y sin cargar B; el watchdog para en primer plano. No es prueba de bloque ni bloqueo físico. |
| HTTP local | Cinco hashes correctos, Range inicial/sufijo 206, rutas privadas 404, POST 405. |
| HTTPS local LAN | Cliente Node verifica CA y hostname sin desactivar TLS: 403 sin token, 303 de entrada, cookie Secure/HttpOnly, manifiesto 200, Range 206 y ruta privada 404. Confianza/conectividad de los dispositivos todavía pendientes. |
| UI del laboratorio | ES/EN/CA, teclado/foco, claro/oscuro, 390×844, 1270×800 y 800×1270. Son viewports emulados. |
| Modelo TypeScript aislado | Compilación estricta sin errores. |
| Regresión de la aplicación existente | **289 archivos / 3588 tests aprobados**, build normal final correcto y candidata correcta con **707969 bytes iniciales**; ningún módulo del experimento en el grafo público. |
| Preservación | Comparación de **7966 archivos anteriores**: ninguno cambiado/borrado; HEAD e índice intactos. Solo nuevos documentos/experimento y artefactos privados ignorados. |

Evidencias: `.cache/phrase-islands-puyi-p01/{unit-delivery.log,browser-fixed.log,edge-default-events.json,edge-prefetch-events.json,edge-timer-events.json,edge-native-loop-events.json,https-checks.json,global.log,build-final.log,candidate.log,preservation.json}`. El último chequeo E está en `browser-loop-checked.log`, con el reset de parada excluido del contador de vueltas. Capturas `lab-390-844.png`, `lab-1270-800.png`, `lab-800-1270.png`. Ni un contexto virtual de Playwright ni TLS validado en el PC acreditan manipulación física de Safari/Lenovo.

## Alternativas si falla el encadenamiento físico

1. **Ciclo corto temporal (propuesta, no decisión):** decodificar solo el bloque, insertar los silencios y crear un Blob, o componer un ciclo local en el pipeline. Mantener los MP3 originales y hash/configuración del ciclo en memoria; sin cuatro versiones de duración ni TTS repetido. A 34,208 s, PCM16 mono 44100 ocuparía unos 3,02 MB y los samples Float32 unos 6,03 MB, más buffers de decodificación/copias. No asumir que un bucle de ese Blob se detendrá durante suspensión. Su viabilidad exige otra prueba y aprobación del usuario.
2. **Playlist finita HLS:** investigar una lista efímera que referencie segmentos reutilizados/silencios hasta el límite y termine nativamente. No sería una pista de 30 min, pero sí otra estrategia de transporte/autorización. [RFC 8216 §3.4](https://www.rfc-editor.org/rfc/rfc8216) exige timestamps ID3 para Packed Audio: los MP3 existentes no se convierten en segmentos correctos por escribir un listado. Hay que validar empaquetado, precisión, pausas, Safari nativo/Android, Range, URLs privadas/TTL y diferencia entre tiempo de medios y tiempo de sesión. No implementado ni recomendado como arreglo inmediato sin piloto.
3. **Reproductor nativo:** [AVQueuePlayer](https://developer.apple.com/documentation/avfoundation/avqueueplayer) y [AVAudioSession playback/background audio](https://developer.apple.com/documentation/avfaudio/avaudiosession/category-swift.struct/playback) proporcionan otro entorno de control. No son capacidades que una PWA obtenga solo por instalarse. Suponen alcance nuevo y necesitan decisión del usuario, sin contratar ni crear nada ahora.

Si no se valida una estrategia web que cumpla continuidad, silencios, vuelta y parada, informar de esos fallos por separado y consultar. No sustituir automáticamente por audio largo, ciclo corto o aplicación nativa.

## Espacio, coste y tráfico

Medición: cinco MP3, **95,568 kB**, sin masters nuevos. Para N frases y Q preguntas de duración media d, MP3 a 80 kbit/s ≈ `(N+Q) × d × 10000 bytes`, más cabeceras; WAV PCM16 mono 44100 ≈ `(N+Q) × d × 88200 bytes`. Son estimaciones de futuros textos, no archivos generados.

Ejemplo de primera colección 10+2 audios, media 4 s: unos **480 kB MP3** y **4,23 MB WAV**. Mil audios de 4 s: unos **40 MB MP3** y **352,8 MB WAV** por revisión. Los masters y consultas se conservan localmente; no subir WAV a Storage por defecto. Cada nueva revisión retenida suma espacio; seleccionar 5 o 30 min no crea otro MP3.

Sin caché entre vueltas, esta muestra usa aproximadamente `95568 × 1800/34,208 ≈ 5,03 MB` descargados por escucha de 30 min; cuatro escuchas simultáneas sumarían unos 20,1 MB. Prefetch/Blob/caché pueden reducir tráfico, con el coste de retener bytes y límites de revocación. No se ha medido facturación, cuota disponible o egress del Supabase real: confirmar el plan existente antes de P2, sin contratar uno nuevo. Aivis local no introduce tarifa por petición, pero tiene coste de CPU, revisión y mantenimiento.

## Recomendación

Mantener B como candidato del **laboratorio**, comparar C y Media Session en ambos dispositivos. Completar la hoja física antes de elegir estrategia definitiva para P5. Puede prepararse la revisión editorial privada de P2; no está autorizado publicar textos personales ni producir sus medios definitivos sin revisión japonesa. No declarar resuelto el uso con pantalla bloqueada.
