# Islas de frases — I3: colección inicial y audio real

Fecha: 17 de noviembre de 2026. La decisión definitiva del usuario es **AivisSpeech Engine 1.2.0, Aida Shigeru (阿井田 茂), estilo normal**. Se reutilizan los artefactos verificados de [I2](phrase-islands-i2-pilot.md); no se realiza I2.1 ni otra comparación de motores.

## Colección y revisión

| Temática | ID | Frases aprobadas con MP3 |
| --- | --- | ---: |
| Vida cotidiana | everyday | 6 |
| Conversaciones | conversation | 6 |
| Trabajo y estudios | work | 6 |
| Compras y situaciones habituales | shopping | 6 |
| Viajes | travel | 6 |
| Aficiones | hobbies | 6 |
| Total | | **36** |

«Aprobada» describe la revisión editorial y técnica documentada por el agente, **no una certificación de escucha humana o nativa**. No se ha asignado aprobación por el mero hecho de generar JSON o WAV: se ha revisado el japonés, registro, furigana, significado y explicación de cada entrada en ES/EN/CA, contrastado la consulta fonética de las 36 síntesis y comprobado sus medios. Cada registro editorial conserva el texto y la lectura analizada que se aprobaron. Una entrada pendiente o sin medio queda fuera de la biblioteca.

La revisión incluye は/が/を/に/で/へ/と, no pasado/pasado, negativas, preguntas, deseo, posibilidad, permiso y experiencia. Las consultas representan las realizaciones fonéticas de は/へ como ワ/エ y pueden representar おう/おお como オオ: no se confunde ese análisis con la ortografía de la lectura visible. No se detectó una lectura léxica incompatible en las consultas; esto no garantiza acento tonal, entonación o ritmo suficientemente buenos para shadowing.

Los textos y sus explicaciones se han preparado para Kana Study. Se reutiliza el modelo `FuriganaSegment` y se contrasta el patrón de permiso con el material gramatical existente (`grammar-n5-v2.generated.ts`) y la [explicación de 東京外国語大学 sobre てもいいです](https://www.coelang.tufs.ac.jp/mt/ja/gmod/contents/explanation/058.html). Esto valida el patrón, no constituye una revisión externa de las 36 frases. Los niveles N5/N4 son orientativos; «uso cotidiano» es criterio editorial, sin atribuir cifras de frecuencia ni una clasificación oficial del JLPT. Las traducciones naturales presentan una interpretación razonable en contexto, no la única posible.

Ejemplos de la colección:

| ID | Japonés | Español natural | Construcción |
| --- | --- | --- | --- |
| pi-everyday-001 | 今日は家で休む。 | Hoy voy a descansar en casa. | Hoy (tema) / en casa / descansaré. |
| pi-conversation-002 | もう一度言ってくれる？ | ¿Me lo repites? | Otra vez / decirlo / ¿lo haces por mí? |
| pi-travel-005 | 京都に行ったことがあります。 | He estado en Kioto. | A Kioto / haber ido / existe esa experiencia. |

En el primer ejemplo, は marca el tema y で el lugar de la acción; 休む es no pasado informal interpretado aquí como plan. El segundo es una petición informal a una persona cercana. En el tercero, Vた＋ことがあります expresa experiencia previa y に el destino. Se conservan equivalentes EN/CA y sus explicaciones, con ES como referencia estructural.

## Archivos y carga diferida

En `src/app/data/phrase-islands/`:

- `phrases.v1.json`: esquema/versiones, ID inmutable, temática, japonés, segmentos de furigana, lectura, nivel, registro y localizaciones natural/estructural/explicación ES/EN/CA.
- `editorial.v1.json`: revisión de contenido, estado, fecha, texto y lectura comprobados, tipo de revisión y ausencia de certificación auditiva nativa.
- `audio.v1.json`: revisión del medio, ruta relativa a `baseURI`, SHA-256, bytes, duración, formato, frecuencia, motor y modelo.
- `phrase-islands-catalog.ts`: composición de entradas aprobadas con audio. El componente importa el catálogo dentro de la ruta diferida; no se añade al arranque.

Los IDs `pi-<temática>-001` a `006` se mantienen al corregir una entrada. Una revisión de audio nueva tendrá otra referencia/hash: no hace falta modificar un futuro ejercicio que use el ID. Los tres archivos separan contenido pedagógico, decisión editorial y referencia multimedia. No hay editor ni persistencia de aprendizaje. Las traducciones editables se sincronizan con los JSON ES/EN/CA y su dominio generado diferido; se resuelven mediante `TranslationService`.

Los MP3 y el manifiesto están en `public/audio/phrase-islands/v1/`. Su URL conserva `/kana-study/` al resolver contra `document.baseURI`; no hay rutas absolutas a la raíz del dominio. Los clips solo se solicitan al pulsar reproducir. Las traducciones de este dominio también se comparten con el acceso de Mazos, que ya era diferido; no se incorporan al diccionario inicial.

## Generación efectuada y comprobaciones

Se generaron **36 WAV originales y 36 consultas**, sin sustituir textos visibles ni editar la prosodia, en `.cache/phrase-islands-i3/masters/`. Se publicaron **36 MP3 mono a 80 kbit/s, 44100 Hz**; ningún WAV, peso, motor o dependencia TTS se incorpora a Angular.

| Medida | Resultado |
| --- | ---: |
| Duración total de los WAV | 67,923 s |
| Duración por frase | 1,303–2,510 s |
| Tamaño total WAV | 5992356 bytes |
| Tamaño total MP3 | **704281 bytes** |
| Tiempo acumulado consulta + síntesis CPU | 31,225 s |
| Menor SNR WAV/MP3 decodificado | 20,457 dB |
| Mayor pico absoluto MP3 decodificado | 0,685095 |
| Diferencia de duración decodificada | 0 s en las 36 |

El tiempo excluye arranque del motor y codificación. Los WAV son PCM16 mono: se comprueba que se pueden leer completos, tienen duración/muestras y señal no vacía. Los originales alcanzan ocasionalmente escala completa; la mayor racha es de una muestra. No se observa saturación sostenida en este control, pero no se afirma ausencia absoluta de distorsión auditiva. Se mantiene el original y se aplica **−3 dB solo al codificar** para evitar picos de reconstrucción MP3. Todos los MP3 se decodifican, comparan con el WAV atenuado y pasan pico <1, diferencia de duración <80 ms y SNR >10 dB. Estas métricas comprueban integridad de conversión, no naturalidad japonesa ni descartan por sí solas un corte lingüístico del TTS.

`generation.json` conserva las medidas originales pendientes de revisión; `publication-audit.json` añade la revisión aprobada, medidas MP3 y comparación por frase. Ambos están en la caché I3, junto con `installed.json`, `encoder.json` y `engine.log`. Cada WAV, consulta y MP3 tiene SHA-256 registrado. La generación conserva originales existentes si coinciden texto/hash; no los sobrescribe silenciosamente.

Configuración: CPU, 4 hilos, `speedScale=1`, `intonationScale=1`, `tempoDynamicsScale=1`, `pitchScale=0`, `volumeScale=1`, pausas anteriores/posteriores de 0,1 s, salida 44100 Hz mono. El ID real obtenido de `/speakers` es **1310138976** (el índice de estilo 0 de AivisHub no es el ID global del Engine).

- Modelo AIVMX 1.0.0: `47e53151-a378-46f3-abee-ce13aa07feb1`; speaker `561e4e59-3bc9-4726-9028-44a3c12a6f1d`.
- Modelo SHA-256: `6dabe29de5ec2c1715e12a430805e1bff6ec64a315cccec2d26fad029df83243`.
- `run.exe` SHA-256: `14715fff47da5875752a382ac9456adc29eb893626142c8539bb6cd49e4cb9d9`.
- FFmpeg ya instalado: `N-125875-g5d4d3bdc61-20260731`, libmp3lame; ejecutable SHA-256 `851aa8ea5366b5af33c0681cc292d662829c7088e9ac96f6e9b37030e6835ba4`.

Se utiliza el perfil aislado de I2, sin instalar otra versión, modelo ni servicio global. Se retira al terminar únicamente la junction temporal de AppData comprobando su destino; los datos permanecen en la caché. Los archivos grandes están ignorados por Git.

## Procedencia y condiciones

La [ficha oficial de Aida Shigeru](https://hub.aivis-project.com/aivm-models/47e53151-a378-46f3-abee-ce13aa07feb1) coincide con versión, UUID, hash y licencia **ACML 1.0** de los artefactos de I2. La voz/modelo es de 古山キリヲ. Se conserva crédito visible y enlace a `PROVENANCE.md`, manifiesto y copia íntegra de la [licencia oficial ACML 1.0](https://github.com/Aivis-Project/ACML/blob/master/ACML-1.0.md). Hash del documento archivado: `72ac22ef56c20f9d9ca8467ca9bdcc5e06e5fba5270812a9ff1494b00ae6d02a`.

ACML permite usos personales/comerciales/no comerciales sujetos a sus restricciones (entre otras, perjuicio al hablante, ataques, engaño y determinados usos políticos/religiosos). El crédito es opcional; se conserva voluntariamente. El texto educativo estático de este catálogo no presenta ninguno de esos usos identificados. Se mantiene la procedencia y las condiciones para la distribución pública de estos audios; no se declaran CC0 ni libres de toda condición. Las ilustraciones/personaje, pesos y código del motor no se redistribuyen. La licencia del software del Engine y sus dependencias se documentó por separado en I1/I2; no autoriza por sí sola la voz.

## Biblioteca y límites de alcance

`#/anki/islands` muestra seis cantidades reales y selección múltiple. Las frases seleccionadas presentan japonés con furigana, lectura, traducción natural, construcción, explicación, nivel/registro y botones escuchar/repetir y detener. La reproducción empieza por clic; solo existe un clip activo. Cambiar de frase, deseleccionar su temática o abandonar la página cancela el anterior, incluidos callbacks de una carga antigua. Los estados de carga, fin, archivo no disponible y bloqueo del navegador tienen mensajes traducidos y posibilidad de reintentar.

`PhraseAudioService` vive en el componente. No depende del manifiesto de vocabulario, FSRS, Undo, scheduler, stores ni sincronización, y no escribe progreso ni selección. Los tres modos siguen deshabilitados hasta I4. No hay colas, sesiones, repetición configurable, swipes, permisos de micrófono ni generación desde el navegador.

## Validación y reproducción

- Tests dirigidos de componente/reproductor: **12 aprobados**.
- Auditoría `node scripts/test-phrase-islands-i3.mjs`: 36 IDs únicos, 6 aprobadas por temática, furigana coherente, contenido ES/EN/CA, hashes/medios existentes, separación del catálogo respecto al grafo inicial.
- Suite global final: **284 archivos, 3543 tests aprobados**.
- Playwright focalizado: **18 pruebas aprobadas**, Edge real en Windows, tamaños 1280/390/320 px y claro/oscuro; MP3 reales bajo `/kana-study/`, selección múltiple, recarga, traducciones, teclado, contraste, reproducción/cambio/parada, 404 y bloqueo simulado `NotAllowedError`, sin escrituras ni aperturas de BD durante las acciones. El bloqueo se provoca deliberadamente: no se presenta como una política espontánea de Edge.
- `npm run build` y `npm run build:manga-candidate` correctos. Inicial candidato **707969 bytes <750000**; catálogo, componente y traducciones diferidos, sin código manual/de tests en el artefacto. Persisten advertencias SCSS de módulos ajenos sin cambios.
- Capturas revisadas en `.cache/phrase-islands-i3/library-*.png`; japonés con tamaño normal de `FuriganaText` para lectura de frases. No se ha probado Safari/iPhone ni un móvil físico en esta fase.

Desde PowerShell en la raíz del repositorio, con los artefactos de I2 y FFmpeg disponibles:

```powershell
& ./scripts/phrase-islands-i2/profile.ps1
python -X utf8 scripts/phrase-islands-i3-generate.py
# Revisar explícitamente el contenido y consultas antes de aprobar editorial.v1.json.
python -X utf8 scripts/phrase-islands-i3-publish.py
node scripts/compile-i18n.mjs
npm run build:manga-candidate
node scripts/test-phrase-islands-i3.mjs
npx playwright test --config playwright.phrase-islands.config.ts
npm test
npm run build
```

El paso de perfil se niega a reemplazar un perfil real del usuario. Tras finalizar el motor, retirar solo la junction si su destino es la caché I2, conforme a la limpieza descrita en I2. No borrar el perfil de origen. El publicador exige revisión aprobada coincidente con texto/lectura antes de aceptar cada frase. Para corregir en el futuro: conservar los originales v1, generar en una revisión nueva, revisar de nuevo y cambiar únicamente la referencia multimedia/editorial del ID estable; no sobrescribir las evidencias originales.

Para explorar la biblioteca compilada: `npm run preview:manga-candidate` y abrir la URL anunciada por el servidor con `#/anki/islands` (seleccionar una temática). También funciona con `npm start`. Los MP3 están disponibles directamente en la carpeta pública indicada.

Queda pendiente escuchar las 36 frases con una persona competente en japonés para detectar defectos de acento/prosodia que el análisis textual no revela. Se conserva la voz elegida; cualquier incidencia se corrige o deja pendiente por frase. La calidad de modelo para shadowing, Safari/dispositivos físicos, pantalla bloqueada y sesiones de I4 no se dan por validados por estas pruebas.

No se ha hecho SQL, commit, push ni despliegue. Se conservan los cambios previos de I1/I2 y no se modifica ningún módulo de estudio existente.
