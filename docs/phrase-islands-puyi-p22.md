# Islas Puyi · Audio privado P2.2

## Estado

El propietario aprobó las doce entradas de `grappling-p21-confirmacion.json`, incluidas las propuestas de A4 y A5, la nueva B4 y 道場 en A2 y A3. El recibo vincula esa revisión textual con su SHA-256 y cada UUID y revisión. Los textos y el historial siguen en la carpeta privada de autoría.

Están generados y verificados **12 de 12 MP3** de Grappling con AivisSpeech 1.2.0 y Aida Shigeru normal. Son 317.655 bytes y unos 31 s de audio en total. Edge decodificó los doce y el reproductor local sirvió sus SHA-256 exactos con soporte `Range`. El análisis automático no marcó silencios excesivos ni saturación en los MP3. Escuchar especialmente el nombre y las partículas de A2/A3, la lectura de B4 y la entonación de P-A/P-B. Las dos consultas de preguntas no activaron una marca de interrogación. La calidad de la entonación queda para la escucha humana. [Todos los audios en este PC](http://127.0.0.1:4448/?section=all).

## Escuchar y publicar Grappling

Si el reproductor local está cerrado, inicia la vista de la revisión final y abre **Todos los audios**.

```powershell
$env:PUYI_REVIEW_PORT='4448'
node experiments/phrase-islands-puyi-review/preview.mjs grappling-p21-confirmacion.json grappling-draft.json
```

Después de escuchar y aprobar los doce clips, ejecuta desde la raíz de Kana Study:

```powershell
node experiments/phrase-islands-puyi-editor/publish-grappling.mjs
```

Cuando queden clips pendientes de aprobación auditiva, escribe `ACEPTO` para confirmar el lote. Si marcaste alguno para corregir, resuélvelo primero. El comando lee la configuración pública del Kana Study desplegado, comprueba el bucket con el endpoint público de Storage y solicita el correo y la contraseña oculta de la cuenta propietaria existente. Usa la clave publicable y conserva la sesión en memoria durante la ejecución.

El publicador guarda el contenido aprobado con los UUID originales, sube los MP3 al bucket privado y comprueba su SHA-256 al descargarlos. Los contextos originales y las notas de autoría quedan locales. Luego publica, prueba el catálogo, abre los dos bloques y vuelve a comprobar sus doce archivos. Si se interrumpe, repite el comando. Una revisión publicada idéntica se comprueba sin guardarla de nuevo. Una revisión previa diferente detiene el flujo para respetar los cambios editoriales.

Al terminar, abre el enlace mostrado, elige un bloque y prueba Reproducción, Shadowing y Escucha continua en la aplicación desplegada. Para repetir la comprobación de catálogo, bloques y MP3 con una cuenta lectora autorizada, ejecuta el mismo comando con `--comprobar`. En el momento de preparar este flujo, Supabase devolvió `401` al catálogo sin sesión y el endpoint público no dejó ver el bucket privado. Queda pendiente la publicación autenticada y la comprobación de sus tres modos en la web desplegada.

## Generación tras aprobar el texto

Los comandos se ejecutan desde la raíz. `status` muestra la huella exacta del borrador y las notas de pronunciación para cada entrada. `preflight` verifica los hashes del ejecutable Aivis, el modelo y la licencia, además de la disponibilidad de Python, FFmpeg y ffprobe.

```powershell
node experiments/phrase-islands-puyi-review/audio.mjs status
node experiments/phrase-islands-puyi-review/audio.mjs preflight
```

Tras recibir la aprobación explícita de las 12 entradas, registrar el recibo para la huella aprobada. `generate` usa el motor local de I6.2 con **AivisSpeech Engine 1.2.0, Aida Shigeru normal**, velocidad y dinámica de referencia, MP3 mono a 44,1 kHz y 80 kbit/s. Se puede indicar una o varias etiquetas para producir solo esas entradas. Sin etiquetas, genera únicamente las entradas que carecen de una revisión válida.

```powershell
node experiments/phrase-islands-puyi-review/audio.mjs approve SHA256_CONFIRMADO_POR_EL_PROPIETARIO
node experiments/phrase-islands-puyi-review/audio.mjs generate
node experiments/phrase-islands-puyi-review/audio.mjs verify
```

Cada intento se conserva en `.phrase-islands-authoring/puyi/audio/<isla>/<huella-texto>/<entrada>/r<revisión>.<intento>/`. Incluye WAV, MP3, consulta, huellas SHA-256, duración, formato, comprobación de recorte, procedencia y licencia. La medición de silencios usa ventanas de 10 ms y umbral de −42 dBFS, con aviso si se detecta más de 0,35 s en un extremo o más de 0,65 s dentro. Ese aviso orienta la escucha y no altera el clip. `verify` exige las 12 correspondencias y guarda el informe privado por entrada.

## Escucha y correcciones

La vista local muestra el reproductor junto a la frase cuando hay un clip válido. Abrir **Pendiente de escucha**, escribir una nota si procede y pulsar **Aceptar audio** o **Marcar para corregir**. Cada decisión es una acción local registrada para esa revisión y su hash. Se indica que proviene de la vista local y no se identifica una cuenta remota. Cuando cambia la revisión, la decisión anterior queda en el historial y el nuevo audio vuelve a estar pendiente.

La escucha comprueba lectura y partículas, la adaptación del nombre, pausas, acento y ritmo. Comparar las moras guardadas con el kana editorial, teniendo en cuenta las grafías de vocales largas y los cambios entre grafía y pronunciación de las partículas. Revisar la interrogación especialmente en las dos preguntas. La consulta y el análisis técnico sirven de apoyo para la escucha.

Para repetir una toma con la misma configuración, ejecutar `generate ETIQUETA --new-revision`. Si hace falta cambiar la lectura o el texto, preparar y aprobar una revisión textual nueva. Si el texto está bien y el problema requiere ajustar moras o acento en la consulta, registrar el cambio concreto en la nota de escucha y preparar una corrección de consulta conservando el original. El generador actual usa la consulta del motor y la configuración fija de I6.2.

## Comprobaciones ejecutadas

- El generador rechazó la síntesis selectiva del borrador pendiente antes de iniciar el motor.
- En Edge se verificaron el MP3, reproducción local y peticiones parciales con una muestra genérica de I6.2. También se verificó que las dos decisiones de escucha requieren acciones explícitas, se rechaza un registro obsoleto y un recibo de texto que no coincide deja el clip inaccesible.
- La suite global pasó los 3.588 tests y el build público terminó correctamente. La auditoría de Islas generales validó los 36 MP3. El informe de pronunciación de las 12 voces se completa tras la síntesis autorizada.
- El SHA-256 del borrador sigue igual. Se buscaron nombres de archivos, UUID y frases distintivas del borrador en `public/`, `src/assets/` y el build público, sin coincidencias. [Informe local de comprobación](../.cache/phrase-islands-puyi-p22/privacy.json).
