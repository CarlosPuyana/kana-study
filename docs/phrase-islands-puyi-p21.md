# Islas Puyi · Revisión editorial P2.1

La propuesta está en `.phrase-islands-authoring/puyi/review/`, dentro del área privada ignorada por Git. El JSON revisado conserva los UUID y el orden del borrador de origen. Guarda por entrada el contexto mínimo que explica la frase. La comparativa privada conserva su japonés y traducción originales y explica cada decisión.

El esquema admite cualquier número de bloques, frases o preguntas. Las preguntas llevan referencias a sus respuestas mediante IDs. El orden narrativo es un campo independiente. Cada entrada tiene una revisión de contenido y una referencia pendiente a su audio individual. Los UUID editoriales de la isla y sus entradas son independientes de los UUID de Supabase Auth.

La propuesta cuenta con dos bloques, diez frases y dos preguntas. ES es la referencia editorial y contiene estructura, explicación y vocabulario. Las traducciones naturales EN y CA son borradores y sus campos pedagógicos están pendientes. La revisión de P2.1 es textual y está hecha con IA. La aprobación del usuario y la validación auditiva nativa figuran como pendientes en el JSON.

## Revisar en el PC

```powershell
node experiments/phrase-islands-puyi-review/review.mjs
node experiments/phrase-islands-puyi-review/preview.mjs
```

La previsualización muestra japonés con furigana, lectura completa, traducciones, explicaciones, preguntas con enlaces a las respuestas y comparativa por entrada. Se abre en el PC desde [la previsualización privada](http://127.0.0.1:4444/).

El servidor escucha en 127.0.0.1, sirve solo la vista y sus estilos, desactiva el almacenamiento en caché y carga el JSON de autoría desde disco. La URL HTTPS de P1 para dispositivos solo corresponde a muestras genéricas. La herramienta de revisión acepta otros archivos privados mediante dos argumentos, el nombre JSON de la propuesta dentro de `review/` y el de su fuente dentro de `reference/`.

## Validación de P2.1

- Integridad verificada para 15 UUID heredados, 12 lecturas en kana, reconstrucción de japonés y lectura a partir del furigana, posiciones y enlaces pregunta–respuesta. Se rechazaron 11 propuestas alteradas con errores de IDs, orden, enlaces, lectura, traducción, aprobación o referencia de audio.
- Vista probada en Edge a 1280 px en oscuro y 390 px en claro. Se comprobaron 12 entradas, 10 enlaces de respuesta, teclado y acceso a las traducciones EN/CA. El JSON devuelve 404, las peticiones con origen externo reciben 403 y no hubo peticiones salientes.
- Los dos builds públicos pasaron y el candidato conserva 707.969 bytes iniciales. Se comprobaron nombres de archivos, marcadores del contenido privado e IDs en `public/`, `src/assets/` y ambos builds, además del grafo del candidato. Los 36 MP3 generales superaron su auditoría de integridad.
- Suite global final con cuatro workers de Vitest, 3.588 tests de 289 archivos. Las dos primeras ejecuciones a concurrencia predeterminada detectaron un timeout de backup y fallos de inicio de sesión de práctica en Kanji, respectivamente. Ambos archivos pasaron sus 55 tests dirigidos y la suite final pasó completa con cuatro workers. Las pruebas y el código de esos módulos se mantuvieron intactos.
- La comparación de 7.987 archivos previos y del borrador privado original confirmó que sus hashes permanecen iguales. Los resultados de las comprobaciones están en `.cache/phrase-islands-puyi-p21/`.

## P2.2 · Preparación y generación posterior

1. Obtener la aprobación explícita de la propuesta textual y registrar las decisiones lingüísticas en la revisión privada. Guardar un recibo ligado al SHA-256 del JSON y a las 12 entradas por UUID y revisión. Si cambia el japonés o la lectura, revisar la entrada nueva antes de preparar su audio.
2. Validar el esquema, IDs, enlaces, orden y furigana de la revisión aprobada con las mismas comprobaciones de integridad. El validador de P2.1 está dedicado al borrador y exige estado pendiente. En P2.2, añadir una comprobación separada que valide el recibo y el hash, conservando el documento de revisión como evidencia.
3. Preparar 12 trabajos privados, uno por frase o pregunta. Fijar **AivisSpeech Engine 1.2.0, Aida Shigeru normal**, modelo y licencia con sus hashes. Reusar `scripts/phrase-islands-authoring-audio.py` y `scripts/phrase_islands_audio.py` como base técnica. El helper actual sintetiza inmediatamente después de consultar y escribe una referencia del catálogo general en su resultado. En P2.2, habilitar una etapa de consulta independiente y empaquetar el resultado con una referencia privada propia de Islas Puyi.
4. Para cada UUID, enviar únicamente el japonés aprobado a `/audio_query`, con el motor local en loopback. Guardar los parámetros y la consulta en la carpeta privada del intento. Comparar las moras con la lectura esperada, teniendo en cuenta las partículas は y を, las vocales largas, las geminadas y los signos. Las diferencias entre kana editorial y pronunciación requieren interpretación. Acento, pausas, entonación interrogativa y nombres extranjeros se revisan en la consulta y mediante escucha. Si hiciera falta una corrección, conservar la consulta original y versionar la corrección con su motivo.
5. Tras la comprobación de la consulta, sintetizar un WAV por entrada y codificarlo con el pipeline existente a **MP3 mono a 44,1 kHz y 80 kbit/s**. Guardar WAV, consulta usada, controles de codificación, licencias y procedencia en `.phrase-islands-authoring/puyi/audio/<uuid>/r<n>/<fingerprint>/<intento>/`. Calcular el fingerprint a partir de japonés, lectura, consulta aplicada y configuración de voz. Reservar el huellado de traducciones para la revisión editorial.
6. Validar que cada MP3 decodifica, medir duración y tamaño y registrar SHA-256. Reutilizar un clip cuyo fingerprint y bytes sigan siendo válidos. Una síntesis diferente tendrá revisión de audio nueva y una referencia inmutable. Verificar correspondencia de 10 frases y 2 preguntas con sus 12 clips y conservar WAV y consultas para poder rehacer o comparar.
7. Hacer escucha humana individual y encadenada por bloque. Revisar claridad, ritmo, pausas y acento. Mantener los clips en el área privada y la fórmula de práctica de P1 con pausas configurables en el reproductor. El flujo termina con el manifiesto privado y sus 12 clips individuales.

La aprobación textual permite preparar P2.2. Las pruebas físicas de P1 con Safari bloqueado y Lenovo quedan pendientes antes de decidir el modo Escucha de producción. El acceso futuro depende de los UUID verificados y RLS. [Diseño de seguridad de Islas Puyi](phrase-islands-puyi-security-design.md).
