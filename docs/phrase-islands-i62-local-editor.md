# Islas de frases — I6.2: editor local y guía operativa

18 de noviembre de 2026. Implementa la opción A del [diseño I6.1](phrase-islands-i6-admin-design.md). **Guardar un borrador, preparar una release y publicarla son acciones distintas. Ninguna muestra de esta fase está publicada.**

## Abrir y utilizar el editor

Desde la carpeta del proyecto:

```powershell
npm run start:phrase-admin
```

Abrir <http://127.0.0.1:4410/>. Es una entrada Angular independiente; no existe una ruta de administración en Kana Study. Cambiar idioma/tema aquí no escribe preferencias ni progreso de la aplicación. No requiere login ni credenciales.

1. Pulsar **Nueva frase** o seleccionar **Editar frase publicada**. El ID es estable y no editable; las altas usan UUID. Se mantienen las seis temáticas.
2. Introducir japonés, lectura, segmentos de furigana, registro/nivel y las tres traducciones naturales, estructurales y explicaciones ES/EN/CA. Los segmentos deben reconstruir exactamente el texto y la lectura. Los kanji necesitan furigana.
3. Revisar la ficha de la columna derecha. El selector de idioma del contenido también cambia la previsualización. Puede abrirse un MP3 local para escucharlo; este archivo no se adjunta al JSON ni equivale a aprobarlo.
4. **Preparar descarga JSON** guarda un archivo real, incluso incompleto. Conservarlo, por ejemplo, en `.phrase-islands-authoring/inbox/`; el navegador decide su carpeta de descargas. **Abrir borrador JSON** permite recuperarlo y continuar con el mismo ID.
5. Se advierte al descartar cambios sin exportar o cerrar la página. No hay guardado automático en almacenamiento del navegador: exportar es necesario.

La validación de campos completos es independiente de la aprobación. No se permite añadir archivos, rutas de medios, estados `approved` o claves adicionales al contrato de borrador.

## Preparar audio, revisar y crear una release

Requisitos comprobados en este equipo: Windows x64, Node 24, Python 3.12.1 y FFmpeg disponible en PATH. Se reutilizan la instalación oficial y los modelos fijados de I2; no hay descarga automática. Véanse [I2](phrase-islands-i2-pilot.md) y [I3](phrase-islands-i3-catalog.md) para su procedencia y licencias.

Ejemplo para un archivo guardado por el editor; sustituir el nombre del archivo y el nombre del revisor:

```powershell
$phraseHandle = (node scripts/phrase-islands-admin.mjs import --file .phrase-islands-authoring/inbox/mi-frase.json | ConvertFrom-Json).handle
node scripts/phrase-islands-admin.mjs validate --draft $phraseHandle
node scripts/phrase-islands-admin.mjs generate --draft $phraseHandle
```

Importar conserva el JSON de forma inmutable y comunica los campos pendientes. Validar, generar y preparar rechazan un borrador incompleto. La CLI repite la validación aunque el archivo proceda del editor, comprueba su revisión base, IDs, duplicados y huellas. Si el catálogo ha cambiado, reabrir la versión actual y trasladar los cambios; no editar sus fingerprints a mano.

`generate` devuelve las rutas privadas del MP3, WAV y consulta, junto con métricas y procedencia. Puede usarse `--python RUTA_EXE --ffmpeg RUTA_EXE` para instalaciones fuera de PATH. Se genera solamente el ID solicitado. Repetir sin `--force` reutiliza un resultado válido; `--force` crea otro intento y conserva todos los anteriores. Los fallos quedan junto a su `job.json`/`engine.log` y nunca crean una aprobación.

Abrir el MP3 devuelto en el editor o reproductor local. Comparar con el japonés visible y su lectura, revisar ES/EN/CA y comprobar pronunciación, acento/entonación y utilidad para imitar. **Después de la revisión y escucha humanas**, ejecutar:

```powershell
node scripts/phrase-islands-admin.mjs review --draft $phraseHandle --reviewer "Nombre del revisor" --content-reviewed --audio-listened
node scripts/phrase-islands-admin.mjs prepare-release --draft $phraseHandle --version 1.1.0 --name mi-release-1_1_0
node scripts/phrase-islands-admin.mjs verify-release --release mi-release-1_1_0
node scripts/phrase-islands-admin.mjs preview --release mi-release-1_1_0 --port 4412
```

Usar una versión mayor que la base y un nombre de release nuevo. Para varias frases, repetir `--draft HANDLE` en `prepare-release`, tras generar y revisar cada una. Las demás altas privadas quedan fuera. Es preferible especificar siempre el handle: omitirlo utiliza el último importado.

La previsualización sirve <http://127.0.0.1:4412/kana-study/#/anki/islands>, construye una copia de los archivos actuales del workspace y aplica allí el candidato. Conserva cambios que todavía no están en HEAD y nunca modifica el proyecto original. La copia usa un enlace a `node_modules`; necesita permiso para crear esa unión de directorios en Windows. Los intentos interrumpidos se conservan; un nuevo intento utiliza otra carpeta. Para detener el servidor, Ctrl+C.

## Revisiones y audio

| Identificador | Significado |
| --- | --- |
| `schemaVersion: 1` | Contrato del borrador/contenido; no es la versión de publicación. |
| `phrases.v1.json.version` | Versión semántica del snapshot completo. El nombre `v1` indica su esquema. |
| `editorial.records[id].contentRevision` | Aumenta al editar contenido publicado; el ID permanece. |
| `audio[id].revision` | Aumenta al sustituir el audio publicado, con URL nueva que incluye revisión y hash. |
| fingerprints | Fijan catálogo base, frase, síntesis, borrador, audio y revisión; impiden reutilizar una aprobación obsoleta. |

La consulta se obtiene con **AivisSpeech Engine 1.2.0 / Aida Shigeru normal**, modelo 1.0.0. Se valida el hash del ejecutable registrado en I2, el del modelo descargado **y el realmente instalado**, versión del motor en ejecución, UUID y condiciones del modelo. Se consulta el ID real del estilo normal, no se deduce ni inventa. CPU, cuatro hilos, puerto aleatorio de loopback; sin GPU, servicios públicos ni claves.

Parámetros: velocidad/entonación/dinámica/tono del borrador; volumen 1, silencios previo/posterior 0,1 s, pausa predeterminada, salida PCM16 mono 44100 Hz. MP3 mono 80 kbit/s, ganancia −3 dB y sin metadatos heredados. Se comprueban duración, señal, clipping sostenido, decodificación, diferencia de duración, comparación de señal y SHA-256. Estas métricas no certifican naturalidad. La generación conserva también licencia y metadatos del modelo/voz consultados al motor.

El motor 1.2.0 utiliza una carpeta conocida de Windows. Se admite exclusivamente el perfil aislado de I2: si hay un perfil real diferente, se detiene sin reemplazarlo. Si la herramienta crea temporalmente la unión hacia el perfil de I2, la retira al terminar. No cambiar ni borrar un perfil real para superar este control; utilizar una cuenta Windows aislada si fuera necesario.

Una traducción nueva exige otra revisión editorial, pero puede conservar la URL y revisión de audio cuando japonés, lectura y síntesis son idénticos y hay prueba verificable. Para las 36 frases heredadas esa prueba procede de las consultas/auditoría I3 archivadas. Cambiar japonés, lectura o síntesis invalida el audio anterior. Los registros de revisión congelan también la referencia al intento exacto: regenerar después no altera una release previamente preparada.

## Editar una frase publicada

Seleccionar la frase en el editor, modificarla y descargar otro borrador. También se puede obtener el borrador desde la CLI:

```powershell
node scripts/phrase-islands-admin.mjs export-draft --id pi-everyday-001 --output .phrase-islands-authoring/inbox/editar-001.json
```

Abrir ese archivo en el editor, editarlo, exportar/importar y repetir validación → generación/reutilización → revisión → nueva release. Se mantienen ID y originales. Cambiar únicamente traducciones no sintetiza de nuevo cuando la prueba de identidad es válida; generar no traslada la aprobación editorial anterior.

## Staging y publicación real posterior

Cada release contiene `release.json`, `diff.txt`, `base/` y `candidate/`, bajo `.phrase-islands-authoring/releases/NOMBRE/`. El diff enumera archivos añadidos/cambiados y contenido por frase. El candidato incluye únicamente los tres JSON del catálogo, traducciones y copia generada de Islas, manifest/licencia/procedencia y MP3 permitidos. Mantiene los MP3 históricos aunque hayan dejado de ser la referencia activa. No contiene borradores, consultas, WAV, modelos ni herramientas.

`verify-release` comprueba inventario completo, bytes/hashes, snapshots, versiones, condiciones archivadas y revisiones congeladas. Reconstruye el catálogo esperado desde las aprobaciones o el rollback; no acepta añadir otros cambios recalculando solo el hash del manifiesto. Las revisiones locales acreditan el proceso, **no son una identidad administrativa remota ni una firma contra alguien que controle el equipo completo**. GitHub conserva la autoridad de publicación.

Una publicación futura requiere revisión e integración explícita. Este procedimiento **no se ejecutó en I6.2**:

1. Verificar la release y leer `diff.txt`. Una release `previewOnly: true` es una demostración y no debe integrarse; la CLI/auditoría pública la rechazan sin excepción explícita de laboratorio.
2. Antes de copiar, comparar cada archivo de destino con su `baseSha256` de `release.json`. Si falta, aparece o cambia respecto a la base, detenerse y preparar nuevamente desde el workspace actualizado. Así no se pisan cambios locales posteriores al staging.
3. Copiar exclusivamente los archivos `changed`/`added` listados por el manifiesto desde `candidate/` a su misma ruta en el proyecto. Revisar el diff completo; no copiar la carpeta privada ni archivos fuera de esa lista. No usar `git add .`.
4. Ejecutar pruebas y `npm run build:manga-candidate`. Seleccionar expresamente los archivos revisados en Git y usar los permisos y workflow Pages existentes. El editor, borradores y másteres no se publican.
5. Solo después de comprobar el despliegue real, sus datos y MP3 se puede declarar publicada la frase. Ningún comando de esta CLI hace commit, push, SQL ni despliegue.

## Copias recuperables y rollback

`.phrase-islands-authoring/` es privada e ignorada por Git, **no una caché desechable**. Contiene borradores inmutables por fingerprint, historial de revisiones, intentos de síntesis y snapshots. No borrarla con limpiezas del proyecto. El comando siguiente archiva los 36 WAV/consultas originales de I3 con comprobación de hashes, sin borrar la caché:

```powershell
node scripts/phrase-islands-admin.mjs archive-baseline
node scripts/phrase-islands-admin.mjs backup --release mi-release-1_1_0 --output D:/KanaStudyBackups/release-1_1_0
node scripts/phrase-islands-admin.mjs verify-release --release mi-release-1_1_0 --workspace D:/KanaStudyBackups/release-1_1_0
```

El destino debe ser nuevo y privado; cambiar la unidad si no existe. El backup incluye esa release, su base/candidato, borradores/revisiones implicados, todos los intentos de audio de esos IDs y los másteres/procedencia heredados archivados. Si es un rollback, incluye las releases de las que depende. Puede usarse el directorio recuperado como `--workspace`. No es un backup de borradores ajenos a esa release: para conservarlos todos, copiar también la carpeta privada completa a un soporte recuperable. La instalación del motor/modelos I2 necesita su propia copia si se desea regenerar sin descargas.

Para restaurar el estado anterior de una release ya integrada, sobre el catálogo actual:

```powershell
node scripts/phrase-islands-admin.mjs prepare-rollback --release mi-release-1_1_0 --version 1.2.0 --name restauracion-1_2_0
node scripts/phrase-islands-admin.mjs verify-release --release restauracion-1_2_0
```

Se prepara **otra release**, con versión superior a la actual, recuperando el snapshot base de la indicada. Las ediciones restauradas reciben nueva revisión de contenido. Conserva históricos y requiere la misma integración/revisión posterior; no ejecuta `git reset`. Para simularlo sin integrar nada se puede usar `--catalog-root RUTA_AL_CANDIDATO_ACTUAL`.

## Demostración real conservada

Alta desde el formulario, descarga, reapertura e importación: **少し休みましょう。 / すこしやすみましょう。 / Descansemos un poco.**, ID `pi-ef6201ac-492f-44a8-a071-3c4614177ffa`. Borrador guardado en `.phrase-islands-authoring/demonstration/phrase37-from-editor.json`; resultado y handles en `demonstration/results.json`.

| Evidencia | Resultado |
| --- | --- |
| Motor / voz | AivisSpeech 1.2.0 / Aida Shigeru normal, estilo real `1310138976`. |
| Modelo SHA-256 | `6dabe29de5ec2c1715e12a430805e1bff6ec64a315cccec2d26fad029df83243`. |
| Consulta analizada | `スコシヤスミマショオ.`; no implica evaluación auditiva del acento. |
| Primera síntesis válida | 5,689 s; WAV 142580 bytes; duración 1,616 s; mono 44100 Hz. |
| MP3 incluido en la demo | 16762 bytes; SHA-256 `579380e5b896a26f141daa61aabdcbcc0b97c23d2df1673dd818d13569c75736`. |
| Candidato | `releases/i62-demo37-final/candidate/`, catálogo 1.1.0 y 37 frases. |
| Borrador no publicado | Otra alta privada, sin audio/aprobación; no figura en el candidato ni en la aplicación aislada. |
| Edición real desde el formulario | `demonstration/edit001-from-editor.json`; `i62-edit001` conserva `pi-everyday-001`, reutiliza el MP3 original y exige nueva revisión. |
| Rollback aislado | `i62-rollback36`, versión 1.2.0; restaura 36 y conserva el MP3 histórico de la frase añadida. |
| Backup recuperado | `backups/i62-complete-final/`; verificación independiente correcta. `backups/i62-delivery/` añade el último intento real y sus condiciones consultadas al motor. |

Abrir la demostración existente:

```powershell
node scripts/phrase-islands-admin.mjs preview --release i62-demo37-final --demo --port 4413
```

<http://127.0.0.1:4413/kana-study/#/anki/islands>. Seleccionar Vida cotidiana: siete frases, incluida la nueva. `--demo` habilita únicamente un laboratorio con revisión `technical-demo`, `audioListened: false`; no suprime la escucha humana necesaria para producción. Se conservaron originales e intentos fallidos, incluido el diagnóstico de un salto/formato de licencia que se resolvió comparando Markdown sin espacios finales; el contenido y hash del modelo siguen fijados.

## Validación y límites

- Contrato/editor/biblioteca/sesión: 38 pruebas dirigidas. CLI: 14 pruebas, incluyendo entradas maliciosas, límites de rutas insensibles a mayúsculas en Windows, conflictos, revisiones obsoletas, reutilización, archivos no autorizados, cambios fuera de aprobaciones, rollback/backup y fallo de arranque. Audio/FFmpeg: cinco pruebas con fixtures de señal explícitamente sintéticos, además de generación Aivis real de la frase de demostración. Una segunda síntesis real conservó originales y condiciones/metadatos del modelo; la release congelada anterior siguió verificándose correctamente.
- Suite Angular global: **289 archivos, 3588 pruebas aprobadas**. El primer pase detectó la comparación de traducciones, adaptada para comprobar por separado la copia privada del editor; otros dos fallos de temporización ajenos al cambio no se reprodujeron en el pase global final. No se modificaron esos módulos.
- Playwright en Edge/Windows: 12 pruebas del editor, cuatro de la aplicación aislada de 37 frases y **112 de regresión del catálogo público**. Estas últimas cubren ocho combinaciones de tamaño/tema, 320/390/768/1280 px, ES/EN/CA, reproducción real, errores/bloqueo, navegación y RUSH. Las capturas están en `.cache/phrase-islands-i62/`.
- `npm run build:manga-candidate`: **707969 bytes iniciales < 750000**, Islas y traducciones diferidas. Auditoría del grafo: sin módulos de autoría; auditoría del catálogo/medios pública correcta. `npm run build:phrase-admin` construye por separado el editor.
- Comparación de hashes frente a la copia de 7940 archivos tomada antes de trabajar: sin archivos previos borrados y sin cambios en catálogo/medios originales, FSRS, Undo, sincronización o progreso. Las cantidades de producción derivan de datos; se generalizaron las comprobaciones que exigían exactamente 36/seis por tema.
- No se certifica naturalidad ni escucha nativa de la muestra; sigue pendiente revisión humana. No se probó Safari, iPhone, móvil físico ni bloqueo de pantalla en esta fase. El tamaño móvil se comprobó con viewport de Edge.
- No hay nuevos paquetes, credenciales, servicios, migraciones ni cambios en permisos. Node puede emitir un aviso de detección de módulo al importar el contrato TypeScript; no se cambió el tipo global del paquete para ocultarlo.

Comandos reproducibles de comprobación:

```powershell
node --test scripts/phrase-islands-admin.test.mjs
python scripts/phrase_islands_audio_test.py
node scripts/test-phrase-islands-i3.mjs
npm test
npm run build:manga-candidate
npm run build:phrase-admin
npx playwright test --config playwright.phrase-admin.config.ts
npx playwright test --config playwright.phrase-islands.config.ts
npx playwright test --config playwright.phrase-admin-release.config.ts
```

La última prueba necesita la release privada real de demostración y `demonstration/results.json`. Las demás no necesitan sintetizar ni descargar voces. Para otro candidato de una alta, usar `PHRASE_ADMIN_RELEASE` y adaptar la expectativa deliberada 36 → 37 de esa demostración.

Capturas: [editor oscuro](../.cache/phrase-islands-i62/editor-desktop-dark.png), [editor claro](../.cache/phrase-islands-i62/editor-desktop-light.png), [previsualización](../.cache/phrase-islands-i62/preview-desktop-light.png), [frase 37 en Explorar](../.cache/phrase-islands-i62/release37-explore-desktop-dark.png) y [RUSH aislado](../.cache/phrase-islands-i62/release37-recall-desktop-dark.png).
