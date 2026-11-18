# Islas de frases I1 — Investigación y decisión del audio japonés

Fecha de consulta: **17 de noviembre de 2026**. Fase de investigación y diseño; no se han instalado motores, generado muestras, escuchado voces, incorporado dependencias ni cambiado la aplicación.

## 1. Decisión propuesta

**Adoptar generación anticipada local y distribución de archivos estáticos por frase.** El cliente Angular reproducirá una referencia revisada, idéntica en los tres modos y en todos los dispositivos. El proveedor quedará fuera de los ejercicios: corregir o sustituir una grabación actualizará su referencia/versionado, sin cambiar el ejercicio.

**Candidato principal para I2:** AivisSpeech Engine **1.2.0**, con **阿井田 茂 / Aida Shigeru, estilo ノーマル**, modelo AIVMX 1.0.0, sujeto a revisión de su archivo y condiciones exactas. **Alternativa:** VOICEVOX Engine **0.26.2**, voz **玄野武宏 / Kurono Takehiro, ノーマル**, con sus créditos y restricciones. Son propuestas para comparar, no una aprobación de naturalidad. Sus fichas describen voces adultas masculinas; que resulten poco caricaturescas y adecuadas para imitar debe juzgarse escuchándolas. [Ficha Aida][aida] · [Ficha Takehiro][takehiro]

No elegir todavía una voz definitiva. Si ninguna supera los criterios de I2, cambiar de voz o recurrir a grabación humana autorizada; no rebajar el listón de shadowing por tener una síntesis que funciona.

**Piper Plus** merece una pista exploratoria por su inferencia ligera y fonemización japonesa; su modelo Tsukuyomi-chan tiene condiciones propias que impiden tratar los audios como un banco de materiales libremente reutilizable. **Kokoro `jf_alpha`**, ya presente en las herramientas del repositorio, será un control opcional, sin prioridad por mera disponibilidad. **Web Speech API** no será la referencia docente ni un fallback silencioso. **HyperTTS/AwesomeTTS** aportan un patrón de preparación y gestión de medios, no un motor japonés ni una licencia universal de audio.

## 2. Qué está verificado y qué no

- **Documentado:** características y licencias declaradas por los proyectos, publicaciones de versiones, fichas de voces y contratos de API/código consultados.
- **Inspeccionado localmente:** infraestructura de audio descrita en §7. No se ha modificado ni ejecutado la generación existente.
- **Propuesto:** arquitectura, presupuesto, protocolo y umbrales de este informe. Son decisiones de diseño, no mediciones.
- **Pendiente de I2:** calidad auditiva, lecturas de las diez frases, rendimiento y RAM en nuestro Windows, contenido/licencias de los binarios descargados, reproducción real en móviles, modo avión y pantalla bloqueada.

No hay puntuaciones MOS propias, comparaciones escuchadas ni benchmarks de este equipo. Las afirmaciones promocionales de «naturalidad» no prueban utilidad para shadowing. Las condiciones se resumen para decidir técnicamente; la interpretación y autorización exactas de una distribución futura se revisarán con los archivos que realmente se usen. Una licencia declarada tampoco acredita por sí sola todos los derechos de los datos de entrenamiento.

En este documento **reutilización interna** significa usar un archivo aprobado en Escuchar, Shadowing y Producción de memoria. **Redistribución como material** significa permitir a terceros descargarlo y utilizarlo en otras obras. No son el mismo permiso. Tampoco son equivalentes código, pesos, voz, personaje, ilustraciones y audio resultante.

## 3. Estado y mantenimiento

Instantánea de las publicaciones oficiales consultadas; una rama `dev` o una fecha reciente de subida no se convierte en versión estable.

| Proyecto | Evidencia de mantenimiento/versión | Consecuencia para el piloto |
| --- | --- | --- |
| AivisSpeech, editor | La API de releases señala 1.0.0 como última estable, publicada el 19-11-2024; también existe 1.1.0-dev, actualizada en 2026. [Estable][aivis-ui-release] · [Releases][aivis-ui-releases] | No confundir la versión del editor con la del Engine. |
| AivisSpeech Engine | 1.2.0 estable, 30-04-2026; 1.3.0-dev con assets actualizados el 14-11-2026. [1.2.0][aivis-release] · [Releases][aivis-releases] | Fijar 1.2.0, sin descargar `latest/dev` en cada ejecución. |
| VOICEVOX | Editor 0.26.3, 15-11-2026; Engine 0.26.2, 14-11-2026; hay desarrollo 0.27.0-dev. [Editor][vv-ui-release] · [Engine][vv-release] | Fijar Engine y recursos de voz compatibles; no presuponer numeración idéntica. |
| Piper Plus | v2.1.0, 13-11-2026, con distribución Windows x64 y avisos actualizados de licencias de voz. [Release][piper-release] | Proyecto activo; actividad no equivale a aprobación pedagógica del modelo. |
| HyperTTS / AwesomeTTS | HyperTTS v3.7.1, 15-10-2026; AwesomeTTS v1.89.5, 20-10-2026. El antiguo repositorio AwesomeTTS remite a Vocab-Apps. [HyperTTS][hyper-release] · [AwesomeTTS][awesome-release] | Consultar el repositorio mantenido, no concluir abandono por las releases del anterior. |
| Kokoro | Repo oficial no archivado; `pushed_at` consultado: 06-08-2025. El pipeline local fija v1.0/pesos y librerías concretas. [Repositorio/API][kokoro-repo] | Menor actividad reciente observada; no inferir retirada ni mejoras japonesas posteriores. |
| Web Speech API | Especificación viva, borrador de comunidad de 27-10-2026; las voces dependen del navegador/SO. [Especificación][speech-spec] | No existe una «versión de voz japonesa web» común que podamos fijar. |

## 4. Comparación de calidad y control

| Candidato | Japonés y voces | Controles útiles | Límites que importan |
| --- | --- | --- | --- |
| **AivisSpeech / Engine** | Modelos Style-Bert-VITS2/JP-Extra; candidato para una entonación contextual más expresiva. La interfaz facilita revisión editorial. La ficha de Aida identifica al creador/intérprete y estilos. [Engine][aivis-engine] · [Voz][aida] | Velocidad, estilo, dinámica temporal y diccionario. `intonationScale` representa fuerza de estilo, no el mismo control que en VOICEVOX. [Contrato][aivis-model] | No asumir compatibilidad completa de prosodia: longitudes y pitch por mora son valores dummy; `pauseLength`/`pauseLengthScale` se ignoran. Usar texto contextual; comprobar lecturas/acento. [Moras][aivis-moras] · [Contrato][aivis-model] |
| **VOICEVOX / Engine** | Síntesis centrada en japonés, con diferentes voces/personajes. Takehiro es un candidato adulto en estilo normal. [Ficha][takehiro] | Frases acentuales, núcleo acentual, pitch/duración por mora, velocidad, entonación y pausas; diccionario para lecturas. [Moras][vv-model] · [Consulta][vv-query] | Un control detallado no garantiza un resultado espontáneo. Revisar vocales desonorizadas, preguntas y uniones entre frases; evitar estilos exagerados para la referencia. Esto es un objetivo de evaluación, no un fallo medido. |
| **Piper Plus + OpenJTalk** | VITS/ONNX con G2P japonés y características prosódicas. No confundir con Piper original, sus modelos ni la variante GPL. [Proyecto][piper] | CLI/lotes, duración mediante `length_scale`, ruido y controles dependientes del runtime; SSML y diccionarios no tienen cobertura idéntica en todas las implementaciones. [CLI][piper-cli] | El bundle público Tsukuyomi `zs-v1` figura como experimental, sin aprobación general de calidad. Su alias antiguo y sus modelos/configuraciones nuevos son distintos. [Modelos][piper-models] |
| **Web Speech API** | Voz `ja-JP` del dispositivo o servicio remoto. No garantiza un timbre común, disponibilidad ni calidad japonesa. [Voces][speech-voices] | Cola, pausa/cancelación, `rate`, pitch global y volumen; selección de voz. [Interfaz][speech-spec] | No expone controles japoneses de acento por mora ni una salida estándar WAV/MP3. El mismo texto puede cambiar entre sistemas o actualizaciones. |
| **Anki + HyperTTS/AwesomeTTS** | La calidad corresponde al proveedor elegido, no al complemento. Anki puede usar voces del SO. [Anki TTS][anki-fields] | Generación de colección, selección de voces, procesamiento de texto y ajustes que admita el servicio. [HyperTTS][hyper] | Preparar audio para tarjetas personales no prueba que pueda publicarse como biblioteca educativa. Las voces de generación y las de revisión móvil pueden ser diferentes. |
| **Kokoro-82M + Misaki** | 4 voces femeninas y 1 masculina japonesas documentadas. `jf_alpha` tiene valoración orientativa C+ del autor, que no es MOS ni aval docente. [Voces][kokoro-voices] | Pipeline Python, velocidad y preparación de texto; herramientas locales disponibles. | El autor advierte de menor cobertura no inglesa y debilidad en enunciados muy cortos. La prueba de palabras aisladas del repo no valida prosodia de frases. [Voces][kokoro-voices] |

**Otra alternativa considerada:** Style-Bert-VITS2 directamente ofrece control de estilo y entrenamiento; su repositorio declara AGPL-3.0 y publica 2.7.0. No aporta para este piloto una comparación acústica independiente de Aivis ni reduce el trabajo de operación/licencias de modelos. Reservarlo para una necesidad de control que Engine no cubra; no entrenar ni clonar voces en I1/I2. [Proyecto][sbv] · [Versión][sbv-release]

En Aivis sí existen silencios anterior/posterior (`prePhonemeLength`/`postPhonemeLength`): no confundirlos con controlar pausas internas. `kana` transporta el texto de síntesis contextual, no la notación acentual de VOICEVOX; vaciarlo puede empeorar la entonación. En estilo normal se ignora la fuerza de estilo. Estas diferencias obligan a guardar consultas específicas por motor. [Contrato Aivis][aivis-model]

## 5. Operación local, formatos y coste

| Candidato | Windows, hardware y dependencias | API/CLI/lotes y formatos | Offline y coste de muchas frases |
| --- | --- | --- | --- |
| AivisSpeech Engine | Windows 10 22H2/11; al menos 1,5 GB de RAM libre según el proyecto. CPU/ONNX; GPU opcional. Primera preparación incluye modelos/BERT: el README orienta aproximadamente 250 + 650 MB, no el espacio total instalado. [Requisitos][aivis-engine] | HTTP local, puerto 10101, `/audio_query` + `/synthesis`, WAV. Automatizable por frase. [Ejemplo oficial][aivis-engine] | Offline tras preparar recursos. Sin tarifa por carácter local; tiempo, electricidad y revisión siguen teniendo coste. No extrapolar rendimiento de Aivis Cloud al Engine. |
| VOICEVOX Engine | Binarios Windows y ejecución CPU/GPU; evitar instalar toolchains si basta el paquete oficial. El tamaño/RAM exactos dependen de los modelos: medir en I2, sin inventar un mínimo. [Distribución][vv-release] | HTTP local 50021; consulta, síntesis WAV, inventario de estilos. Salida habitual 24 kHz; registrar la real. [Guía][vv-engine] | Offline con recursos instalados; sin tarifa local por frase, con coste de preparación y correcciones. |
| Piper Plus | CLI C++ Windows x64 precompilada; ONNX Runtime y fonemizador/diccionario japonés. La guía también describe compilación con Visual Studio/CMake, innecesaria para usar el binario. [Windows][piper-windows] | CLI, entrada de texto/JSON según runtime, WAV; algunos runtimes ofrecen HTTP. Preferir `--text` para evitar problemas de codificación de la tubería Windows. [CLI][piper-cli] | Offline con modelo/configuración/diccionario descargados. El ONNX legado de Tsukuyomi ronda 38 MiB, que no es RAM total ni el tamaño de todos los modelos. [Modelos][piper-models] |
| Web Speech API | Sin paquetes propios; requiere una voz japonesa accesible en cada equipo. | API JavaScript; no es una API de exportación de archivos. | `localService` distingue servicio local/remoto; verificar modo avión, no deducirlo solo del nombre. Sin factura TTS propia del módulo, sin promesa universal de servicio gratis/offline. [Propiedad][speech-local] |
| HyperTTS/AwesomeTTS | Anki Desktop y complemento; local o red según servicio. | Archivos en la colección o TTS en revisión; formatos y controles del proveedor. [Modos][hyper] | Los motores Windows/macOS son locales; GoogleTranslate/Papago figuran entre servicios gratuitos. Eso no verifica una API oficial estable ni sus derechos de redistribución. [Servicios][hyper-free] |
| Kokoro | Python/PyTorch/Misaki y recursos fijados en las herramientas del repo; pipeline CPU. No se ha medido de nuevo su RAM. | Pipeline local a WAV 24 kHz; exportación existente a MP3 y comparación Opus. | Offline con caché completa; cero tarifa local por uso. Reutilización del entorno posible, sin ejecutarlo durante I1. |

Para todos los generadores a WAV se propone conservar el máster y **convertir a MP3 mono** para la distribución. No confundir los formatos múltiples de una API cloud con la salida del motor local. No se necesitan GPU ni entrenamiento para el piloto de dos candidatos; la suficiencia/latencia del Windows disponible sigue pendiente.

Las APIs locales oficiales de los Engines reducen dependencia de servicios externos. No se propone conectar los navegadores de los alumnos a `localhost`, ni publicar esos puertos. Endpoints gratuitos usados por terceros, wrappers de Google Translate o servicios privados del navegador pueden cambiar, limitarse o carecer de permiso de redistribución: quedan fuera de la ruta de publicación. Que HyperTTS enumere un servicio gratuito no solventa eso.

### Estimación propia, no benchmark

Para 1000 frases de 4 segundos: 4000 s = 66,7 minutos de audio. A 80 kbit/s son aproximadamente **40 MB por voz**, sin metadatos. A 64/96 kbit/s serían 32/48 MB. Dos voces duplican el tamaño. Los WAV mono PCM16 de 24 kHz ocuparían unos 192 MB. Duración y bitrate elegidos son hipótesis; no mediciones de las diez frases.

Tiempo de generación ≈ duración total × RTF, más carga inicial, correcciones y codificación. Un RTF hipotético de 0,5 daría 33,3 minutos; no se atribuye ese rendimiento a ningún candidato. En I2 se medirán carga fría, caliente, segundos por frase, RTF y pico de RAM. Las horas de revisión japonesa probablemente pesen más que el coste marginal de CPU, pero no se cuantifican sin medir.

## 6. Licencias: decisión por capas

### Matriz de permisos y límites

| Opción | Software | Modelo / voz / personaje | Audio en web gratuita y posible uso comercial |
| --- | --- | --- | --- |
| AivisSpeech / Engine + Aida | Editor y Engine declaran LGPL-3.0. Usar la herramienta local no incorpora su código al cliente. Redistribuir herramientas modificadas requiere cumplir sus licencias. [Editor][aivis-ui-license] · [Engine][aivis-license] | La ficha AIVMX de Aida declara **ACML 1.0**, identifica creador, versión y checksum. No atribuir esa licencia a otros modelos ni a ilustraciones. [Modelo][aida] | ACML admite uso personal/corporativo, comercial/no comercial bajo sus prohibiciones; crédito opcional. Propuesta compatible con frases educativas revisadas, condicionada a verificar el archivo. No etiquetar sus audios como CC0 ni prometer reutilización sin condiciones. [Texto ACML][acml] |
| VOICEVOX + Takehiro | Editor/Engine: opción LGPLv3 o licencia alternativa negociada. El código de Core es MIT; los términos de los recursos de voz son otra capa. [Editor][vv-ui-license] · [Engine][vv-license] · [Core][vv-core-license] | Recursos y voz sujetos a sus condiciones, no a «MIT para todo». [Términos Core/recursos][vv-resources] | Uso comercial/no comercial con crédito **VOICEVOX:玄野武宏** y condiciones VirVox. Al distribuir material hay obligaciones para receptores; la venta de materiales para posterior difusión por terceros necesita permiso. No habilita entrenamiento con los audios. [VirVox][virvox] |
| Piper Plus + Tsukuyomi | Programa MIT; G2P y sus dependencias tienen avisos propios. [Licencia][piper-license] · [Dependencias][piper-deps] | La voz no es MIT. La ficha diferencia base legado CC BY 4.0 y base `zs-v1` MIT, manteniendo condiciones de la voz. [Ficha][tsukuyomi] | Crédito obligatorio **Piper Plus:つくよみちゃん**. Admite obras comerciales, pero prohíbe publicar dando permiso de reutilización como material. No apropiado para prometer un catálogo de audio libre; una app de frases cerradas y una biblioteca descargable no son equivalentes. [Condiciones][tsukuyomi] |
| Web Speech API | La especificación de la API no licencia los sintetizadores instalados. | Voz y servicio del SO/proveedor; no existe permiso conjunto verificado aquí. | No aprobado para grabar/exportar y redistribuir voces de Apple/Microsoft/Google. No se ha comprobado el contrato de cada una. Reproducción en dispositivo no crea una licencia de catálogo. |
| HyperTTS / AwesomeTTS | GPL-3.0 en sus repositorios. [HyperTTS][hyper-license] · [AwesomeTTS][awesome-license] | No tienen una licencia propia que sustituya la del proveedor de voz. | Los términos de Vocab.ai remiten a los de terceros. Sus archivos no quedan automáticamente licenciados para nuestra web por haberse generado con un add-on libre. [Términos][vocab-terms] |
| Kokoro `jf_alpha` | Código y pesos oficiales Apache-2.0; el modelo publica datos de procedencia y atribuciones de ciertos corpus. [Código][kokoro-code] · [Modelo][kokoro-model] | `jf_alpha` figura en las voces oficiales; no extender sus condiciones a todas las voces comunitarias. | La licencia de pesos no es una declaración de dominio público del resultado. Mantener procedencia y revisar si hay condiciones adicionales del artefacto exacto; no se ha encontrado una condición de personaje comparable a VirVox para `jf_alpha`. No se certifican derechos irrestrictos del audio. |

### Matices que cambian la elección

**Aivis:** ACML permite los usos indicados, pero restringe suplantación, daño al hablante, determinadas actividades políticas/religiosas, fraude y otros usos. Incluye condiciones para compartir modelos. **ACML-NC** añade limitación no comercial y no sirve como elección preparada para monetización. Un sitio gratuito tampoco demuestra por sí solo uso no comercial. Guardar el texto japonés aplicable; la propia licencia establece su interpretación en japonés. [ACML][acml] · [ACML-NC][acml-nc]

**No utilizar Anneli como supuesto modelo por defecto seguro.** El autor de su antigua distribución declara retirada y falta de autorización de las fuentes utilizadas. Es una razón de procedencia para excluirlo de este piloto, no un pronunciamiento jurídico sobre terceros. Además, las referencias históricas pueden apuntar hoy a otra ficha: fijar nombre, UUID, versión y hash, no fiarse de un tutorial antiguo. [Declaración del autor][anneli-author]

**VOICEVOX:** las condiciones generales exigen crédito y trasladar obligaciones cuando se autoriza a terceros a usar el audio. Para Takehiro se propone mostrar el crédito en la información de audio y acompañar cualquier distribución con las condiciones aplicables. No usar ilustraciones ni logotipos de personaje. La cláusula especial que exige autorización corporativa aun sin ingresos corresponde a **青山龍星 / Aoyama Ryusei**, por lo que no se elige esa voz. No generalizar ese permiso o restricción a todo VOICEVOX. [Condiciones generales][vv-terms] · [VirVox][virvox]

**Tsukuyomi:** la fuente del corpus distingue investigación privada, obra con diálogo fijo y software que permite sintetizar nueva conversación. Sus requisitos de publicación/atribución cambian con el uso; no reducirlos a la etiqueta del modelo. Los audios del modelo no deben incorporarse a un repositorio cuya licencia general parezca conceder reutilización irrestricta. [Condiciones del corpus][tsukuyomi-corpus]

**Piper con otra voz:** CSS10 Japanese es una alternativa publicada que remite a los términos del dataset, no a los del programa. No se ha completado la cadena de corpus, base y jurisdicciones ni su aprobación auditiva; no se presenta como sustitución jurídicamente despejada de Tsukuyomi. [Ficha CSS10][piper-css10]

**Regla de publicación futura:** separar la licencia de la aplicación de `audio/`, conservar créditos por voz y las restricciones originales, y revisar permisos para recorte, normalización, conversión, descargas y futura monetización. No incluir pesos ni intérpretes de TTS en la web. Si se quiere permitir un banco de frases reutilizable sin estas condiciones, obtener autorización específica o grabaciones humanas con cesión/licencia explícita. No se han solicitado autorizaciones en I1.

## 7. Infraestructura de audio del repositorio

Inspección limitada a código y herramientas de audio, con el roadmap como contexto. Estas observaciones son del estado local, no de una ejecución auditiva.

| Archivo / conjunto | Existe | Reutilización propuesta y límite |
| --- | --- | --- |
| `src/app/core/services/japanese-audio.service.ts` y su spec | `HTMLAudioElement`, resolución contra `document.baseURI`, play/repeat/stop, estados blocked/error y token para ignorar respuestas obsoletas. No crea audio al consultar disponibilidad. | Reutilizar esos patrones y pruebas para GitHub Pages/autoplay. Está ligado a `VOCABULARY_AUDIO_MANIFEST`: no introducir frases en ese manifiesto ni usarlo directamente como reproductor de sesiones. |
| `src/app/core/services/kaishi-static-media.service.ts` | Catálogo/recursos estáticos con versión, MIME, tamaños, cancelación y comprobación de integridad. | Reutilizar diseño de manifiestos y validación; no sus IDs, rutas, límites de paquete ni licencia de grabaciones. Un nuevo audio sintético no hereda autorización de Kaishi. |
| `src/app/shared/components/kaishi-card-media/kaishi-card-media.ts` y su spec | Secuencia palabra/frase basada en `ended`, Audio reutilizado, cancelación, revocación de blob URLs y tratamiento de bloqueo. | Referencia de control de concurrencia y limpieza. Actualmente se cancela al ocultarse la página: copiarla entera impediría el objetivo de escucha en segundo plano. No cambiar su comportamiento para Islas. |
| `kaishi-media.service.ts`, `kaishi-media-store.ts` | Importación en worker, recursos inmutables en una BD de medios de dispositivo, preferencias por workspace. | No reutilizar stores, preferencias ni escrituras: están especializados en ese paquete. Son prueba de patrones existentes, no justificación para añadir persistencia durante I1. |
| `scripts/kokoro_audio.py`, `generate-vocabulary-audio.py/.md`, `export-vocabulary-audio.py` | Generación CPU fijada, procedencia, hashes, controles de silencio/clipping, revisión/exclusiones y publicación de MP3. WAV/Opus quedan como intermediarios/comparación. | Reutilizar el enfoque de preparación fuera de Angular y exportación tras revisión. Su entrada es `primaryReading` de vocabulario: no sirve sin adaptación para frases con contexto y partículas. No ejecutar ni cambiar esos scripts ahora. |
| `scripts/vocabulary-audio-license.md`, `public/audio/vocabulary/n5/PROVENANCE.md` | Procedencia y advertencia de revisión lingüística pendiente. FFmpeg tiene su propia licencia según el binario usado. | Mantener avisos/licencias del tooling y nueva procedencia por voz; no usar un documento de vocabulario como autorización de otro catálogo. |

En el ámbito inspeccionado no aparece un gestor de listas de Islas, Media Session ni una política offline completa con service worker. La caché HTTP existente y el almacén de Kaishi no equivalen a una garantía offline para el módulo nuevo. No se ha hecho una auditoría general de otros módulos.

## 8. Alternativas de arquitectura

| Enfoque | Ventajas | Costes/riesgos | Decisión |
| --- | --- | --- | --- |
| **A. Estático por frase** | Revisión previa; referencia estable; sin claves ni motor en el cliente; funciona con hosting estático. Corregible por archivo. | Almacenamiento/bandwidth, regeneración y trazabilidad editorial. Offline completo requiere diseño adicional. | **Recomendado.** |
| **B. Servicio dinámico** | Texto abierto, variedad de voces, síntesis de contenido nuevo. | Backend, disponibilidad, coste recurrente, privacidad, abuso, autenticación y CORS; GitHub Pages no ejecuta el motor. | Fuera del objetivo gratuito/client-side actual. Una oferta de prueba cloud no garantiza gratuidad permanente. |
| **C. TTS del dispositivo** | Sin alojar un catálogo de MP3 ni pesos propios. | Calidad/voz variables, japonés ausente, offline variable, referencia no fijable y exportación no estándar. | No como modelo para shadowing. Solo futura ayuda opcional claramente diferenciada si se solicita. |
| **D. Híbrido** | Preparación local con diferentes motores o voz humana; mismos archivos estáticos en consumo. Posible edición excepcional sin cambiar ejercicios. | Necesita control editorial para no mezclar voces, niveles y licencias inadvertidamente. | **Híbrido de autoría + distribución A**, no fallback automático que cambie la voz al fallar un MP3. |

La experiencia de Anki refuerza la separación entre archivo de medios guardado junto a la colección y TTS invocado en revisión. Los add-ons permiten preparar una colección para uso móvil, pero no conviene reproducir su dependencia de proveedores dentro de Angular. Se aprovecha la idea, sin copiar código GPL del complemento. [Medios Anki][anki-media] · [TTS Anki][anki-fields] · [HyperTTS][hyper]

### Contrato de referencia propuesto, sin implementarlo

Cada frase tendrá un ID editorial independiente de las tarjetas FSRS y un `audioRef`. Un manifiesto diferido resolverá ese ID a una grabación aprobada. Campos previstos:

- `phraseId`, versión del texto, texto japonés visible, entrada de síntesis separada y motivo de cualquier corrección;
- motor/versión, modelo/UUID/versión/hash, hablante y estilo, consulta completa/diccionario/configuración y semilla si se expone;
- revisión de audio, URL relativa con hash SHA-256, MIME, duración, bytes, sample rate/canales;
- URLs y copia fechada de licencias, crédito, procedencia y resultado de revisión humana;
- estado editorial `draft/rejected/approved`, sin relación con progreso del alumno.

Ruta ilustrativa: `audio/phrase-islands/v1/<phraseId>/<voiceKey>/<sha256>.mp3`. No es un archivo creado ni una nueva estructura de almacenamiento de usuario. Los metadatos completos de generación pueden quedar en la carpeta de autoría; el navegador recibirá solo el manifiesto público necesario y la información legal.

Una corrección mantiene `phraseId` si no cambia el contenido pedagógico, publica un nuevo hash/revisión, cambia el puntero del manifiesto y conserva la evidencia anterior. Una sesión ya empezada fija su versión para no cambiar de voz a mitad. Cambiar el significado de la frase requiere revisión de contenido, no un simple recambio de MP3. Ninguna de estas operaciones pasa por FSRS o servicios de progreso de Mazos.

## 9. Reproducción, móvil y pantalla bloqueada

**Diseño recomendado para una futura implementación:** un reproductor dedicado con un único `HTMLAudioElement` reutilizado, inicio explícito por interacción, estados de carga/reproducción/pausa/bloqueo/error y cancelación con identificador de operación. Esperar `play()` y distinguir rechazo de permiso de archivo inexistente. El permiso de autoplay puede depender del elemento; no crear uno distinto por cada repetición. [WebKit][webkit-autoplay] · [Contrato play()][media-play]

En primer plano, avanzar por `ended`, repetir N veces y separar con una pausa cancelable. No estimar el fin usando una duración calculada antes de cargar. Al detener/salir, cancelar la pausa y descartar eventos antiguos. En Producción de memoria solo reproducir al revelar o pulsar escuchar; los errores no deben avanzar ejercicios ni simular aciertos.

Velocidad inicial propuesta 0,8× / 1× / 1,2×, conservando pitch donde se soporte. El audio natural 1× será la referencia de pronunciación; estirar tiempo puede producir artefactos y no equivale a una pronunciación lenta auténtica. Evaluar una variante lenta generada separadamente solo si hace falta. [playbackRate][media-rate] · [preservesPitch][media-pitch]

**Pantalla bloqueada: no prometer continuidad universal.** Media Session puede ofrecer metadatos y controles del sistema; no concede ejecución ilimitada ni impide suspensión. Usarla con detección de capacidades y fallback a controles normales. Los temporizadores/avances JavaScript pueden limitarse en segundo plano, por lo que «frase → silencio con timer → siguiente frase» es especialmente sensible. [Media Session][media-session] · [Visibilidad y temporizadores][visibility]

I2 debe comparar esa secuencia con una **pista estática derivada corta**, preparada desde los mismos másteres e incluyendo silencios y repeticiones, acompañada de marcas temporales. Reduce la dependencia de timers entre clips; no garantiza supervivencia ante interrupciones del sistema. Si gana, considerar pistas temáticas precompuestas para Escuchar con un pequeño conjunto de pausas, manteniendo clips individuales para los otros modos. No generar todas las combinaciones ni concatenar MP3 byte a byte. Corregir un clip obligará a regenerar las pistas derivadas que lo referencien.

Probar Safari iOS real y Chrome Android real: reproducción al bloquear, transición entre clips, controles de auriculares, interrupción por llamada/otra app, vuelta a primer plano y ausencia de doble reproducción. WebKit automatizado de escritorio no sustituye esa validación. No basar la solución en `navigator.audioSession`, que sigue marcado experimental/de disponibilidad limitada. [Audio Session][audio-session]

## 10. Formato, carga, caché y tamaño de publicación

- **Máster:** WAV PCM con sample rate original, sin conversión ascendente como supuesto aumento de calidad. Guardar sin pérdida para corregir/codificar de nuevo. No distribuir WAV por defecto.
- **Distribución inicial propuesta:** MP3 mono, comparar 64/80/96 kbit/s sobre los mismos WAV. El repo ya usa 80 kbit/s. Elegir tras escucha, no por bytes únicamente. MP3 tiene compatibilidad amplia; Opus puede ahorrar tamaño, pero contenedor/decodificador y Safari deben verificarse antes de ofrecerlo como única opción. [Códecs][audio-codecs]
- Cargar catálogo/audio solo al entrar en Islas y al solicitar o preparar la próxima frase. No importar pesos, BERT, ONNX Runtime, Python ni WASM de TTS en el bundle inicial. Mantener el presupuesto estricto `< 750000` bytes y verificarlo cuando se implemente; I1 no lo modifica ni aporta una nueva medición.
- Resolver rutas desde `document.baseURI`, como hace el servicio existente. Usar rutas reales de assets bajo el base href de GitHub Pages, sin introducir el fragmento `#/` dentro de la URL de audio.
- Archivos inmutables con hash y manifiesto versionado evitan que corregir una voz deje a unos usuarios con bytes antiguos bajo la misma URL. No asumir control libre de cabeceras de caché en GitHub Pages.
- Caché HTTP es oportunista. Un modo offline fiable requerirá en otra fase un mecanismo explícito para descargar/verificar el conjunto necesario **y el shell de la app**, confirmar disponibilidad y gestionar cuotas/evicción. Una pestaña abierta con clips ya cargados no demuestra recarga offline. El navegador puede eliminar datos locales; informar cuando falte un archivo. No añadir stores ni service worker en I1. [Cuotas][storage]

GitHub Pages publica sitios de hasta 1 GB y tiene un límite blando de 100 GB/mes de transferencia. El coste de assets no pertenece al presupuesto JS inicial, pero sí al tamaño y tráfico del sitio completo. Con la hipótesis de 40 MB por catálogo/voz, 1000 descargas completas serían unos 40 GB. Contar también recursos existentes, versiones antiguas y pistas derivadas. Si crece, decidir alojamiento estático de medios con CORS adecuado; no asumir «gratis para siempre». Sus restricciones sobre negocios/SaaS también deberán revisarse antes de una monetización. [Límites oficiales][pages]

## 11. Piloto I2: diez frases comunes

Corpus propuesto para el piloto, no catálogo de producción. Misma ortografía, puntuación y contexto para todos los candidatos. Las lecturas marcadas son el objetivo de este ensayo; variantes legítimas no son errores universales, pero no deben cambiar sin registrarlo. Validar primero el texto con los evaluadores japoneses. Las siguientes frases se proponen aquí, sin importar grabaciones de corpus externos.

| ID | Texto para síntesis | Lectura objetivo | Sentido y comprobación |
| --- | --- | --- | --- |
| I2-01 | おはようございます。 | おはようございます。 | Buenos días, cortés; /よう/ y ritmo de fórmula corta. |
| I2-02 | おはよう。 | おはよう。 | Buenos días, informal; comparar con 01 sin tono infantil impuesto. |
| I2-03 | 今日はいい天気ですね。 | きょうはいいてんきですね。 | Hoy hace buen tiempo; 今日 = きょう, は = /wa/, vocales largas y entonación de ね. |
| I2-04 | 明日は学校へ行きます。 | あしたはがっこうへいきます。 | Mañana voy a la escuela; 明日, は /wa/, へ /e/, geminada y /こう/. Afirmación cortés. |
| I2-05 | 明日、学校へ行く？ | あした、がっこうへいく？ | ¿Mañana vas a la escuela? Informal; curva interrogativa sin exageración y pausa breve. |
| I2-06 | ここで一日働きます。 | ここでいちにちはたらきます。 | Trabajaré aquí un día; 一日 = いちにち, duración. |
| I2-07 | 七月一日は休みです。 | しちがつついたちはやすみです。 | El 1 de julio es festivo/día libre; 七月 = しちがつ, 一日 = ついたち, fecha. |
| I2-08 | 切手を買ってきてください。 | きってをかってきてください。 | Por favor, ve a comprar sellos; dos geminadas, を /o/ y petición sin cortes internos artificiales. |
| I2-09 | コーヒーをもう一杯お願いします。 | コーヒーをもういっぱいおねがいします。 | Otro café, por favor; /コー/, /ヒー/, /もう/ e 一杯 = いっぱい. |
| I2-10 | この電車は東京へ行きますか？ | このでんしゃはとうきょうへいきますか？ | ¿Este tren va a Tokio? は /wa/, へ /e/, /とうきょう/ y pregunta cortés frente a 04/05. |

Las lecturas de la tabla conservan la escritura convencional は/へ/を; su pronunciación en estas funciones es /wa/e/o/. No convertir todo a kana ni sustituir esos caracteres en el texto visible para hacer que un TTS pase. Mantener separados `displayText`, lectura editorial y eventual `synthesisText`/diccionario corregido.

## 12. Protocolo reproducible de I2

Este procedimiento es un diseño para ejecutar en I2; **no se ha ejecutado en I1**. Ningún ejemplo implica abrir ahora puertos, descargar modelos ni escribir progreso.

### 12.1 Preparación y captura de versiones

1. Crear una carpeta de trabajo fuera de `public/`, por ejemplo `.cache/phrase-islands-i2/`. Registrar Windows/build, CPU, RAM, versiones de motores, modelo y diccionario, configuración, licencia fechada y hashes de instaladores/modelos. Descargar solo desde releases y fichas oficiales, sin reutilizar archivos de tutoriales.
2. Usar AivisSpeech Engine 1.2.0 y VOICEVOX Engine 0.26.2 en CPU, ligados a loopback. Preparar todos los recursos de cada motor una vez, cerrar otros generadores y comprobar después la síntesis con red desconectada. No se fija un umbral de RAM inventado para VOICEVOX: medirlo.
3. Para Aida: UUID de modelo `47e53151-a378-46f3-abee-ce13aa07feb1`, versión declarada `1.0.0`, hablante `561e4e59-3bc9-4726-9028-44a3c12a6f1d`. La ficha consultada declara SHA-256 `6dabe29de5ec2c1715e12a430805e1bff6ec64a315cccec2d26fad029df83243`; contrastarlo con el AIVMX descargado y su metadata. **No se ha descargado ni comprobado ese hash localmente.** [Ficha][aida]
4. Para Takehiro, guardar inventario `/speakers`, UUID/estilo real, versiones de los recursos/VVM si aparecen y hashes de sus archivos. No se ha verificado aquí el hash de su modelo. No fijar un número de estilo copiado de otra versión.
5. Resolver `speaker` desde el campo `styles[].id` de la instalación, seleccionando el hablante correcto y estilo `ノーマル`. En particular, el Style ID local de una ficha AIVM no tiene por qué ser el ID global del Engine. Guardar la consulta devuelta y los endpoints/documentación de la versión instalada. Las páginas Swagger publicadas fueron localizadas, pero su contenido interactivo no fue extraíble en esta investigación; la verificación se apoyó en los README/código fijados. [Aivis API][aivis-api] · [VOICEVOX API][vv-api]

### 12.2 Generación comparable

Primera ronda: 10 WAV por candidato, una voz normal, velocidad por defecto y mismo texto japonés. Guardar consultas automáticas sin corregir. Desactivar alteraciones voluntarias de pitch/estilo; no copiar parámetros de VOICEVOX a Aivis porque sus significados difieren. Registrar cualquier aleatoriedad expuesta; si no se puede fijar, conservar el WAV como referencia reproducible en lugar de prometer bytes deterministas.

Flujo documental de API, válido como esquema para ambos motores una vez identificado el estilo:

```text
GET  http://127.0.0.1:<puerto>/version
GET  http://127.0.0.1:<puerto>/speakers
POST http://127.0.0.1:<puerto>/audio_query?text=<UTF-8 URL encoded>&speaker=<styles[].id>
guardar respuesta como I2-01.query.raw.json
POST http://127.0.0.1:<puerto>/synthesis?speaker=<mismo styles[].id>
Content-Type: application/json
body: consulta anterior sin cambios
guardar respuesta binaria como I2-01.raw.wav
```

Usar un cliente que codifique explícitamente UTF-8, respuestas binarias y timeouts, sin transformar la salida WAV en texto. Revisar el esquema local si hay diferencias. No se incluye un generador ejecutable en el repositorio durante I1.

Segunda ronda: los revisores anotarán problemas. Permitir hasta dos iteraciones editoriales por frase y motor, registrando minutos empleados, diccionario/consulta modificados y motivo. Mantener el texto pedagógico. En VOICEVOX se podrán corregir acentos/moras; en Aivis usar solo controles admitidos y revisar de nuevo la prosodia, sin fingir que los campos ignorados corrigen nada. Comparar **automático contra automático** y **corregido contra corregido** por separado, para que una voz no gane por recibir más edición oculta.

Conservar los WAV originales y crear copias de escucha de volumen comparable, sin limitación agresiva, eliminación de fonemas finales ni filtros que oculten fallos. Medir duración, sample rate, bytes, pico, silencio anómalo y clipping; comprobar MP3 volviendo a decodificarlo. No subir la tasa de muestreo para aparentar más calidad. Las métricas detectan fallos técnicos; no validan lectura ni acento.

Opcionales, después de la comparación principal: 10 frases con el Kokoro local fijado (`jf_alpha`, pesos `f3ff3571791e39611d31c381e3a41a3af07b4987`, entorno registrado), o Piper Plus 2.1.0 con un bundle de voz fijado y licencia aceptada. El bundle público de Tsukuyomi `zs-v1` tiene revisión `93c1fb6d67c29accc9ddf52326bb4582b1b52a3d`: no mezclar su ONNX/config con el alias legado. No publicar la prueba como banco de audios reutilizables. [Guía de modelos][piper-models]

### 12.3 Escucha humana y decisión

- Al menos **dos hablantes nativos de japonés**, preferiblemente uno con experiencia docente/fonética del japonés estándar. Si no están disponibles, dejar la aprobación pedagógica pendiente. Su participación puede requerir remuneración: no asumir que toda la evaluación será gratuita.
- Escucha ciega A/B de las mismas diez frases, orden aleatorio registrado, auriculares y volumen comparables. Mantener una clave que identifique motor/voz/revisión; no mostrar la marca durante la puntuación.
- Primero transcribir lo oído y marcar lecturas, partículas, mora larga/geminada, omisiones/adiciones y naturalidad de las preguntas. Después puntuar 1–5 naturalidad, acento/entonación y ritmo; indicar si lo usarían como modelo de shadowing. Admitir variantes estándar justificadas sin exigir una curva F0 idéntica a otra voz.
- Añadir registro cualitativo de timbre adulto/neutro, cansancio tras repetir, sonidos caricaturescos, respiraciones y pausas extrañas. Una voz agradable puede seguir enseñando un patrón incorrecto.
- Guardar CSV por evaluador: `phraseId`, candidato, revisión, errores concretos, las tres notas, aceptación para shadowing y comentario. Conservar las discrepancias y su resolución, no solo una media.

### 12.4 Prueba de reproducción aislada

Preparar en I2 un reproductor de laboratorio, separado de la app y de servicios de progreso, con esos audios: repetición 1/2/3, pausas 0/1/2 s, velocidad 0,8/1/1,2 y botón explícito de inicio. Probar también la pista derivada con silencios del §9. No es todavía implementar las prácticas completas.

Matriz mínima: Windows Chrome, macOS Safari, Android Chrome e iPhone Safari reales; anotar versiones/dispositivo. Probar inicio bloqueado y recuperación manual, siguiente/repetir/parar durante carga o pausa, cambios de selección, pérdida de red, retorno a primer plano y bloqueo 5 minutos. Repetir con archivos precargados y sin precargar; comprobar ausencia de mezcla/doble reproducción. Separar claramente pruebas del motor de las del navegador.

Modo avión: verificar por separado reproducción en una pestaña abierta y recarga/nueva apertura. Si el laboratorio no implementa todavía caché explícita del shell y audios, registrar «offline completo no probado/no soportado», no declararlo superado porque sonó un archivo ya cargado.

## 13. Criterios de aceptación y riesgos pendientes

Umbrales propuestos para elegir la voz, a acordar antes de escuchar:

| Área | Criterio |
| --- | --- |
| Derechos | Artefacto exacto identificado, licencia/condiciones archivadas, atribución preparada y uso público previsto cubierto. Ninguna duda conocida de procedencia sin resolver. La licencia de la app no debe conceder permisos que la voz no concede. |
| Lecturas | Tras corrección, 10/10 frases sin omisiones, adiciones ni errores fonémicos; acuerdo de ambos revisores sobre las lecturas objetivo, partículas y duraciones distintivas. |
| Prosodia | Media de cada dimensión ≥4/5 y ninguna frase <3/5 para ninguno de los evaluadores; ninguna desviación pedagógicamente perjudicial pendiente de corregir. Un error grave veta la frase aunque la media sea alta. |
| Shadowing | Ambos revisores aceptan las 10 referencias 1× para imitación; el timbre no depende de exageraciones o efectos. La calidad a 0,8×/1,2× se evalúa aparte. |
| Técnicos | Ningún archivo vacío, truncado, saturado o con silencios no intencionados que afecten a la frase. Codificación/decodificación correctas y reproducción repetida sin solapamiento en la matriz. |
| Coste/editorial | Registrar tiempos automáticos y de corrección por frase; carga en el Windows disponible sin fallos. Si hacen falta correcciones sistemáticas, ampliar el piloto antes de producir cientos. No hay SLA de generación inventado. |
| Segundo plano | Documentar exactamente dónde funcionan pista única y cola por clips. Si no hay continuidad al bloquear, aprobar solo el alcance probado y explicarlo en producto; si el bloqueo es requisito imprescindible, no dar I2 por válido sin resolverlo. |
| Offline | Identificar qué se descarga y qué sobrevive a una recarga. La disponibilidad de un motor local no prueba offline de la web. No prometerlo sin una prueba de caché completa. |

La ganadora será la voz aprobada con mejor resultado conjunto de prosodia y edición sostenible. No elegir por número de estrellas, tamaño de modelo o puntuación genérica multilingüe. Un empate puede resolverse con preferencia de oyentes, manteniendo todos los requisitos anteriores. Diez frases bastan para detectar problemas iniciales, no para aprobar todo un catálogo: I3 exigirá revisión por archivo y más variedad léxica/contextual.

Pendientes explícitos: escucha real; rendimiento/RAM; permisos precisos de archivos descargados y reuso externo; variabilidad de modelos y diccionarios; términos que cambien antes de publicar; comportamiento Safari/iOS bloqueado; cortes tras llamadas; caché con evicción; coste real de revisión, hosting y mantenimiento. No se han validado APIs cloud, garantías de voz de navegador, contratos individuales Apple/Microsoft ni autorizaciones especiales de titulares.

## 14. Alcance cerrado de I1

Resultado: investigación documental, propuesta de arquitectura y piloto reproducible. Solo se añaden este informe y su enlace/resumen en el roadmap. No se crea catálogo de producción, reproductor, generador, dependencia, audio, tabla, store, configuración de proveedor ni progreso de usuario. No se modifican FSRS, Undo, Mazos, rutas, almacenamiento o sincronización. No SQL, commit, push ni despliegue.

La comprobación de build del repositorio no valida la naturalidad del audio ni sustituye I2. No hay comportamiento de producción nuevo que requiera nuevas pruebas de aplicación en esta fase documental.

Comprobaciones de esta entrega: `npm run build` correcto (con los avisos SCSS preexistentes); referencias Markdown internas definidas y diez filas del piloto verificadas. No se ha ejecutado una suite de audio, prueba de navegador ni escucha; siguen pendientes de I2. La revisión de cambios confirma únicamente este informe y el roadmap.

[aivis-engine]: https://github.com/Aivis-Project/AivisSpeech-Engine/blob/1.2.0/README.md
[aivis-model]: https://github.com/Aivis-Project/AivisSpeech-Engine/blob/1.2.0/voicevox_engine/model.py
[aivis-moras]: https://github.com/Aivis-Project/AivisSpeech-Engine/blob/1.2.0/voicevox_engine/tts_pipeline/model.py
[aivis-license]: https://github.com/Aivis-Project/AivisSpeech-Engine/blob/1.2.0/LICENSE
[aivis-ui-license]: https://github.com/Aivis-Project/AivisSpeech/blob/master/LICENSE
[aivis-api]: https://aivis-project.github.io/AivisSpeech-Engine/api/
[aivis-release]: https://github.com/Aivis-Project/AivisSpeech-Engine/releases/tag/1.2.0
[aivis-releases]: https://github.com/Aivis-Project/AivisSpeech-Engine/releases
[aivis-ui-release]: https://github.com/Aivis-Project/AivisSpeech/releases/tag/1.0.0
[aivis-ui-releases]: https://github.com/Aivis-Project/AivisSpeech/releases
[aida]: https://hub.aivis-project.com/aivm-models/47e53151-a378-46f3-abee-ce13aa07feb1
[acml]: https://github.com/Aivis-Project/ACML/blob/master/ACML-1.0.md
[acml-nc]: https://github.com/Aivis-Project/ACML/blob/master/ACML-NC-1.0.md
[anneli-author]: https://huggingface.co/kaunista/style-bert-vits2-Anneli
[vv-engine]: https://github.com/VOICEVOX/voicevox_engine/blob/0.26.2/README.md
[vv-release]: https://github.com/VOICEVOX/voicevox_engine/releases/tag/0.26.2
[vv-ui-release]: https://github.com/VOICEVOX/voicevox/releases/tag/0.26.3
[vv-model]: https://github.com/VOICEVOX/voicevox_engine/blob/0.26.2/voicevox_engine/tts_pipeline/model.py
[vv-query]: https://github.com/VOICEVOX/voicevox_engine/blob/0.26.2/voicevox_engine/model.py
[vv-license]: https://github.com/VOICEVOX/voicevox_engine/blob/0.26.2/LICENSE
[vv-ui-license]: https://github.com/VOICEVOX/voicevox/blob/0.26.3/LICENSE
[vv-core-license]: https://github.com/VOICEVOX/voicevox_core/blob/main/LICENSE
[vv-resources]: https://github.com/VOICEVOX/voicevox_resource/blob/main/core/README.md
[vv-api]: https://voicevox.github.io/voicevox_engine/api/
[vv-terms]: https://voicevox.hiroshiba.jp/term/
[takehiro]: https://voicevox.hiroshiba.jp/product/kurono_takehiro/
[virvox]: https://virvoxproject.wixsite.com/official/voicevox%E3%81%AE%E5%88%A9%E7%94%A8%E8%A6%8F%E7%B4%84
[piper]: https://github.com/ayutaz/piper-plus/blob/v2.1.0/README.md
[piper-release]: https://github.com/ayutaz/piper-plus/releases/tag/v2.1.0
[piper-cli]: https://github.com/ayutaz/piper-plus/blob/v2.1.0/docs/guides/development/cli-usage.md
[piper-windows]: https://github.com/ayutaz/piper-plus/blob/v2.1.0/docs/getting-started/windows-setup.md
[piper-license]: https://github.com/ayutaz/piper-plus/blob/v2.1.0/LICENSE.md
[piper-deps]: https://github.com/ayutaz/piper-plus/blob/v2.1.0/src/python/g2p/THIRD_PARTY_LICENSES.md
[piper-models]: https://github.com/ayutaz/piper-plus/blob/v2.1.0/docs/guides/development/pretrained-models.md
[piper-css10]: https://huggingface.co/ayousanz/piper-plus-css10-ja-6lang
[tsukuyomi]: https://huggingface.co/ayousanz/piper-plus-tsukuyomi-chan
[tsukuyomi-corpus]: https://tyc.rei-yumesaki.net/material/corpus/
[kokoro-repo]: https://api.github.com/repos/hexgrad/kokoro
[kokoro-code]: https://github.com/hexgrad/kokoro
[kokoro-model]: https://huggingface.co/hexgrad/Kokoro-82M
[kokoro-voices]: https://huggingface.co/hexgrad/Kokoro-82M/blob/main/VOICES.md
[sbv]: https://github.com/litagin02/Style-Bert-VITS2
[sbv-release]: https://github.com/litagin02/Style-Bert-VITS2/releases/tag/2.7.0
[hyper]: https://www.vocab.ai/hypertts
[hyper-free]: https://www.vocab.ai/tips/free-services
[hyper-release]: https://github.com/Vocab-Apps/anki-hyper-tts/releases/tag/v3.7.1
[hyper-license]: https://github.com/Vocab-Apps/anki-hyper-tts/blob/main/LICENSE
[awesome-release]: https://github.com/Vocab-Apps/anki-awesome-tts/releases/tag/v1.89.5
[awesome-license]: https://github.com/Vocab-Apps/anki-awesome-tts/blob/master/LICENSE.txt
[vocab-terms]: https://www.vocab.ai/terms-of-service
[anki-fields]: https://docs.ankiweb.net/manual/templates/fields
[anki-media]: https://docs.ankiweb.net/manual/media
[speech-spec]: https://webaudio.github.io/web-speech-api/
[speech-voices]: https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis/getVoices
[speech-local]: https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisVoice/localService
[media-play]: https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/play
[media-rate]: https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Audio_and_video_delivery/WebAudio_playbackRate_explained
[media-pitch]: https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/preservesPitch
[webkit-autoplay]: https://webkit.org/blog/7734/auto-play-policy-changes-for-macos/
[media-session]: https://developer.mozilla.org/en-US/docs/Web/API/MediaSession
[audio-session]: https://developer.mozilla.org/en-US/docs/Web/API/AudioSession/type
[visibility]: https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API
[audio-codecs]: https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats/Audio_codecs
[storage]: https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria
[pages]: https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
