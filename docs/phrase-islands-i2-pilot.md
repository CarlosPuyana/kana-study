# Islas I2 — piloto local ejecutado

Fecha: 17-11-2026. **20 WAV reales generados, 20 consultas originales y dos pistas precompuestas.** No hay voz ganadora ni aprobación auditiva. Solo laboratorio; nada se ha publicado en `public/` ni integrado en Angular.

## Abrir y escuchar

Desde la raíz del repositorio:

```powershell
python scripts/phrase-islands-i2/serve.py
```

Abrir **http://127.0.0.1:4438/**. El servidor solo escucha en loopback y sirve `.cache/phrase-islands-i2/`; no abrirlo a la red. Si el puerto está ocupado por el laboratorio ya iniciado, usar esa instancia o detenerla antes de reiniciar.

La página ofrece A/B por las diez frases I2-01–I2-10 de [I1](phrase-islands-audio-research.md#11-piloto-i2-diez-frases-comunes), con etiquetas alternadas de forma determinista por frase, sin identificar motores en la interfaz inicial. No es un mecanismo de seguridad: quien inspeccione URLs/JSON puede ver la asignación. Puntuar las tres dimensiones de A y B en todas las frases habilita «Revelar motores». La exportación JSON conserva notas, puntuaciones, asignación, hashes y eventos de reproducción. **Las evaluaciones están en memoria hasta exportarlas**; no se guardan en el almacenamiento de Kana Study.

Controles: reproducir A/B, parar, pausar/continuar el clip activo, velocidades 0,8/1/1,2×, repeticiones 1/2/3 y pausas entre repeticiones 0/1/2 s. Para cancelar una espera entre repeticiones se usa Parar. Se conserva pitch mediante la propiedad del navegador. La página utiliza un único `Audio`, token de generación y cancelación de temporizadores; no importa servicios Angular.

## Resultados y rutas reales

Todo lo grande y toda evidencia de ejecución están en **`.cache/phrase-islands-i2/`**, ignorado por Git:

| Ruta relativa a esa carpeta | Contenido |
| --- | --- |
| `samples/aivis/automatic/I2-01.wav` … `I2-10.wav` | Diez originales Aivis, acompañados de `I2-XX.query.json`. |
| `samples/voicevox/automatic/I2-01.wav` … `I2-10.wav` | Diez originales VOICEVOX y consultas. |
| `manifest.json`, `metrics.csv` | Texto, lectura esperada, versión, estilo instalado, duración, tamaño, frecuencia, tiempo, RTF, pico, SHA-256 del WAV y consulta, avisos/errores por archivo. |
| `track-aivis.wav`, `track-voicevox.wav` | Tres primeras frases, cada una dos veces, con cinco silencios PCM de 1 s. Sin concatenar bytes MP3. |
| `summary.json`, `machine.json` | Resumen de métricas y equipo. |
| `aivis-installed.json`, `voicevox-installed.json`, `*-speakers.json` | Respuestas reales de versión, inventario, estilos, manifiestos y política del hablante. Aivis incluye `/aivm_models` con metadata/licencias de todos los modelos instalados. |
| `model-files.json`, `dependencies.json` | Hashes de VVM/AIVMX/BERT/tokenizador y versiones de distribuciones Python incluidas que exponen METADATA. No es un inventario completo de todos los componentes nativos. |
| `aida-hub.json`, `licenses/`, `downloads/`, `engines/` | API oficial del modelo, condiciones archivadas, paquetes y motores extraídos. |
| `human-evaluation.csv` | Hoja vacía de escucha humana: evaluador, frase, etiqueta, revisión, naturalidad, pronunciación, ritmo, aceptación para shadowing y notas. |
| `technical-tests.json`, `lab-desktop.png`, `aivis.log`, `voicevox.log` | Evidencia técnica del navegador y de los motores. |

No borrar la caché si se quiere conservar esta ejecución. Los WAV no están en Git; se conservan localmente y se pueden regenerar con las herramientas del piloto. Su identidad verificable es el hash del manifiesto, no una promesa de síntesis bit a bit determinista.

## Equipo y ejecución

Windows 11, build 26200; AMD Ryzen 9 3900XT de 12 núcleos/24 procesadores lógicos, 34.276.835.328 bytes de RAM física comunicados por Windows (aprox. 31,9 GiB), unos 14,9 GB disponibles al inicio. Python 3.12.1. Uso por CPU, sin `--use_gpu`; variables de hilos fijadas a 4 en el proceso hijo. No se midió el pico de RAM de cada motor ni se desconectó físicamente la red.

Los paquetes se descargaron de las releases oficiales exactas y se verificaron **antes de extraer**:

| Archivo | Bytes | SHA-256 verificado |
| --- | ---: | --- |
| AivisSpeech-Engine-Windows-x64-1.2.0.7z.001 | 216525495 | `bfbceba2e14dc7f23c7f3695f9ac0381baf91b15d6544e98384574eaadd271f3` |
| voicevox_engine-windows-cpu-0.26.2.7z.001 | 1894232642 | `55824ce0267a121c5d8f47c7d5d82a08b5c072f8417fddd20dc4096ac47aeaaa` |
| Aida 1.0.0 AIVMX | 251137086 | `6dabe29de5ec2c1715e12a430805e1bff6ec64a315cccec2d26fad029df83243` |

Fuentes: [Aivis Engine 1.2.0](https://github.com/Aivis-Project/AivisSpeech-Engine/releases/tag/1.2.0), [VOICEVOX Engine 0.26.2](https://github.com/VOICEVOX/voicevox_engine/releases/tag/0.26.2) y [API oficial Aida](https://api.aivis-project.com/v1/aivm-models/47e53151-a378-46f3-abee-ce13aa07feb1). `assets.json` fija URLs y hashes de los dos paquetes. El extractor portátil oficial 7zr 26.04 también se mantiene en caché, hash observado `256feca8e274e5da655e2a284fabafd9f554365eb164862089dacd4e8276d282`; su descarga se fija a ese hash y rechazará futuros bytes distintos.

IDs obtenidos de las instalaciones, no supuestos:

- **Aivis 1.2.0:** 阿井田 茂, hablante `561e4e59-3bc9-4726-9028-44a3c12a6f1d`, ノーマル, **1310138976**; modelo AIVMX 1.0.0, UUID `47e53151-a378-46f3-abee-ce13aa07feb1`.
- **VOICEVOX 0.26.2:** 玄野武宏, hablante `c30dc15a-0992-4f8d-8bb8-ad3b314e6a6f`, ノーマル, **11**. El `metas.json` del VVM `model/4.vvm` incluye ese estilo y versión de voz **0.17.0**, independiente de la del Engine. El hash del VVM está en `model-files.json`.

Se conservaron las consultas automáticas sin editar (`speedScale=1`, `pitchScale=0`). No se cambiaron texto visible, lectura, entonación ni diccionario para ocultar fallos. Aivis descargó además sus modelos predeterminados Kohaku y Mao y BERT; sus metadatos/licencias están en `/aivm_models`, sus hashes en el inventario y sus binarios en la caché. **No se generaron muestras de esas voces.** No se descargó una versión dev de ningún motor.

### Aislamiento y obstáculos resueltos

Aivis usa la carpeta conocida de Windows e ignora cambiar `APPDATA`. El primer intento en sandbox falló al crear su carpeta de datos. Para ejecutar el piloto se creó, solo al comprobar que no existía, una unión de `AppData/Roaming/AivisSpeech-Engine` hacia el perfil de la caché. **La unión se retiró al terminar**, sin borrar datos ni dejar configuración global. `profile.ps1` reproduce la preparación y rechaza perfiles preexistentes ajenos. Hugging Face usa un `HF_HOME` local al piloto. Los procesos de los motores se cerraron al acabar las muestras; el servidor del comparador es independiente.

El modo `--help` de Aivis tuvo un error de salida cp1252. El arranque con `--output_log_utf8` funcionó; queda registrado como problema de consola, no de síntesis. La ficha HTML de Aida devolvió HTTP 403 al archivarla: se conserva ese fallo, además de la respuesta JSON oficial de la API, el manifiesto incrustado del AIVMX y el checksum verificado. No se declara archivada una página que no se pudo descargar.

## Métricas medidas

Tiempos incluyen petición de consulta y síntesis por frase, sin descarga, arranque ni escritura posterior. La primera petición incluye calentamiento/carga. No comparar bytes WAV como eficiencia del modelo sin tener en cuenta las frecuencias distintas.

| Candidato | WAV | Duración total | Bytes WAV | Frecuencia mono PCM16 | Generación total | Media frases 02–10 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Aivis / Aida | 10 | 18,276 s | 1612344 | 44100 Hz | 12,332 s | 0,765 s/frase |
| VOICEVOX / Takehiro | 10 | 15,883 s | 762808 | 24000 Hz | 8,156 s | 0,664 s/frase |

La primera petición tardó 5,45 s en Aivis y 2,18 s en VOICEVOX. No hay errores de síntesis. Todos los hashes se recalcularon y verificaron; las consultas mantienen velocidad/pitch de partida. El RTF individual está en el manifiesto. No se ha generado un catálogo MP3 ni efectuado una normalización para igualar sonoridad: los originales preservan la salida del motor. Para la escucha comparativa deben controlar volumen perceptivo y registrar cualquier copia nivelada aparte.

## Pruebas técnicas realmente efectuadas

`node scripts/phrase-islands-i2/test.cjs`: **9 comprobaciones correctas** en Microsoft Edge/Chromium **157.0.4341.60**, Windows, navegador automatizado headless:

1. Veinte botones de muestras reales y ocultación/gate de identidad.
2. Inicio con clic, progreso del WAV, pausa, cambio a 0,8× y continuación.
3. Repetición configurada a tres y cancelación de una espera de 2 s sin audio posterior.
4. Finalización de tres repeticiones con el mismo reproductor.
5. Dos repeticiones con pausa de 1 s completadas normalmente.
6. Cambio de frase mientras la respuesta anterior se demora en red: el resultado antiguo no sustituye al nuevo.
7. Archivo ausente: estado de error, sin avance automático ficticio.
8. Estado bloqueado frente a **NotAllowedError simulado**. Esto prueba el tratamiento de error; no certifica una política real de autoplay del SO.
9. Decodificación/reproducción/parada de una pista precompuesta real.

La prevención de superposición se apoya en un solo elemento y en cancelar la operación anterior. No se ha efectuado una medición acústica por loopback del sonido de salida. `npm run build` pasa con los avisos SCSS preexistentes. La compilación no evalúa voces; no se ha modificado código de la aplicación.

**No probado:** Safari/macOS, iPhone, Android, auriculares, llamadas, pantalla bloqueada física, continuidad de cinco minutos ni recarga offline completa. Las dos formas de reproducción están preparadas para comparar en el equipo/dispositivo real: «Secuencia de clips A» y «Pista precompuesta A» usan el mismo candidato y orden, con pausas incorporadas solo en la segunda. No hay evidencia suficiente para declarar cuál sobrevive mejor al bloqueo. Media Session no se añadió como falsa garantía.

## Pronunciación y escucha humana pendiente

Inspección de consultas: ambos motores representan 今日 como キョオ, 明日 como アシタ; 一日 es イチニチ en 06 y ツイタチ en 07; aparecen las realizaciones esperadas ワ/エ/オ de partículas, y las secuencias largas/geminadas de 08–10. Aivis conserva además el texto contextual original en `kana`; VOICEVOX emplea su notación acentual. **Esto describe el análisis lingüístico previo, no lo oído en los WAV.** No se han detectado por ese medio errores de lectura evidentes, ni se ha validado la entonación/ritmo.

Cada original Aivis llega a un único sample PCM de escala completa (pico 0,999969); se deja aviso por archivo para revisar saturación y sonoridad. No hay prueba aquí de clipping audible. VOICEVOX presenta pico máximo 0,760437. No se ha escuchado ni declarado preferencia por timbre, naturalidad o adecuación pedagógica.

Usar dos evaluadores japoneses, idealmente uno con experiencia docente/fonética, y aplicar los criterios de [I1](phrase-islands-audio-research.md#13-criterios-de-aceptación-y-riesgos-pendientes). Hacer una primera escucha sin marcas de motor, exportar notas y revelar después. Comprobar preguntas, vocales largas, desonorización y acentos; no elegir por latencia. La evaluación humana no está rellenada artificialmente.

## Licencias y publicación

Se archivaron LGPL de Aivis, licencia del Engine VOICEVOX, condiciones de los recursos de voces, texto ACML 1.0 y página de términos VirVox. `licenses/index.json` registra fuentes, hashes y el 403. Los manifiestos del motor y `/speaker_info` aportan condiciones de los artefactos instalados; el paquete completo conserva sus propios avisos. No hay modelos ni motores en Angular.

El AIVMX instalado de Aida declara **ACML 1.0**. La política instalada de Takehiro requiere **VOICEVOX:玄野武宏**; los términos VirVox permiten uso comercial/no comercial bajo condiciones y obligaciones de crédito/redistribución. No reetiquetar estos archivos como CC0 o como código de la app. La carpeta de laboratorio **no constituye una aprobación para producción**: antes de llevar un audio a la web, revisar el uso concreto, atribuciones visibles y condiciones para descarga/reutilización por terceros. No se ha obtenido una autorización adicional ni se han utilizado ilustraciones de personajes.

## Reproducir o corregir en una segunda ronda

Preparación en Windows, desde la raíz, sin instalar paquetes Python globales:

```powershell
python scripts/phrase-islands-i2/prepare.py
& ./scripts/phrase-islands-i2/profile.ps1
python scripts/phrase-islands-i2/generate.py
python scripts/phrase-islands-i2/audit.py
python scripts/phrase-islands-i2/serve.py
```

El script no sobrescribe originales existentes: verifica y reutiliza sus hashes. Para una nueva ronda automática conservar primero la ejecución completa en otra carpeta y usar una caché nueva. La unión de AppData debe retirarse al acabar y solo tras verificar que es la unión creada por `profile.ps1`; no borrar un perfil real ni el destino. Los recursos adicionales elegidos por el servidor de modelos al arrancar pueden evolucionar: el inventario de esta ejecución es la evidencia, y Aida se fija por hash.

No hay correcciones fabricadas. Tras una escucha real, copiar la consulta de la frase a un archivo nuevo, editar únicamente controles admitidos, mantener el texto pedagógico y registrar autor/motivo. Con el motor exacto arrancado en su puerto local y el perfil preparado:

```powershell
python scripts/phrase-islands-i2/correct.py --engine voicevox --id I2-07 --query .cache/phrase-islands-i2/edited-I2-07.json --reason "Motivo concreto observado por el evaluador" --reviewer "Identificador del evaluador"
```

La utilidad verifica la versión del motor y guarda WAV, consulta, motivo y hash del original en `samples/<motor>/corrected/<fecha-hora>/`, sin tocar `automatic/`. `corrections.json` apunta a las últimas correcciones; los archivos históricos permanecen. Abrir **http://127.0.0.1:4438/?revision=corrected** para verlas aparte. Si aún no hay correcciones, esa vista está vacía; no se mezclan muestras automáticas para fingir que ambos candidatos han sido corregidos.

Recomendación provisional: **continuar con la escucha ciega de ambos candidatos y las pruebas físicas de segundo plano**. VOICEVOX fue más rápido en esta ejecución y sus WAV ocupan menos a otra frecuencia, pero eso no determina calidad de shadowing. La voz definitiva sigue pendiente. No se han implementado Escuchar, Shadowing, Producción de memoria, catálogo ni administración.
