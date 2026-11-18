# Cómo crear una isla en ChatGPT e importarla en Kana Study

1. En tu conversación, elige las experiencias y el contexto breve que quieras conservar. Copia el prompt de abajo y comenta las expresiones que quieras practicar.
2. En el [editor local](http://127.0.0.1:4447/), pulsa **Importar** y pega el JSON o elige el archivo. Puedes empezar con **Cargar ejemplo ficticio**.
3. Pulsa **Validar**, abre **Previsualizar** y revisa el japonés, el furigana y las traducciones. **Confirmar importación** abre una copia editable. **Guardar borrador** registra la primera revisión privada.
4. Revisa el japonés y las lecturas en **Revisión y versiones**. Aprueba el texto explícitamente cuando esté listo para preparar audio. Guarda el JSON exportado en una ubicación privada.

El ejemplo ficticio sirve como contrato de referencia. [JSON de una isla de ejemplo](../experiments/phrase-islands-puyi-editor/example.json).

## Prompt reutilizable

```text
Ayúdame a preparar una isla privada de japonés para Kana Study a partir de las experiencias que yo haya elegido en esta conversación.

Selecciona expresiones útiles y agrúpalas en bloques temáticos. Usa japonés conversacional natural, con el registro adecuado a cada situación. Puedes usar gramática más allá de N5. Conserva los hechos aportados y evita inventar detalles o experiencias en mi nombre. Selecciona solo el mínimo contexto que ayude a revisar cada frase. Excluye el historial completo, datos de cuenta, contactos, enlaces privados y credenciales.

Devuelve un único objeto JSON válido, sin Markdown, comentarios ni texto adicional. Escribe schemaVersion como el número 1. El objeto tiene island y blocks. Cada isla, bloque, frase y pregunta lleva un UUID válido en minúsculas y distinto. Si estás revisando un JSON anterior, conserva los UUID de las entradas que ya existan. El orden de los arrays es el orden de presentación.

island: id, titleJa, title {es,en,ca}, description {es,en,ca}.
blocks: lista de objetos con id, name {es,en,ca}, phrases (lista) y prompts (lista opcional).
Cada entrada de phrases o prompts admite id, japanese, reading, segments [{text,reading?}], natural {es,en,ca}, structural {es,en,ca}, explanation {es,en,ca}, vocabulary [{japanese,reading,meaning:{es,en,ca}}], register, context, editorialNote, status y audio.

japanese es el texto japonés visible. reading es la lectura completa en kana, con la puntuación correspondiente. En segments, concatenar text debe reproducir japanese exactamente. Concatenar reading cuando existe y text en los demás segmentos debe reproducir reading. Divide los kanji con sus lecturas y deja partículas y puntuación como segmentos de texto si corresponde.

Incluye una traducción natural ES. Añade traducción estructural, explicaciones breves y vocabulario cuando aporten valor. Usa null para traducciones EN/CA pendientes. register admite informal, polite o neutral. Usa editorialNote para explicar las dudas de naturalidad, lectura, registro, hechos o traducción. Cuando un campo requiera decisión, puedes dejarlo vacío y señalarlo en editorialNote.

Incluye preguntas solo cuando aporten valor. Cada pregunta tiene su propia lectura, segmentos y traducción natural. Añade answerPhraseIds con los UUID de las afirmaciones que responden a la pregunta, incluso si están en distintos bloques de esta misma isla.

Usa status "proposed" para propuestas de IA o "pending" para datos pendientes. Usa audio: null. No des por revisado, aprobado o generado ningún texto o audio.
```
