# Islas Puyi · Tarjetas de bloque y editor privado

## P5.1 · Reproducir desde la tarjeta

En la demo, abre **Vida cotidiana** y pulsa el centro, el título o el icono de una tarjeta de bloque. El selector de bloques y la cabecera del bloque abierto arrancan la misma sesión que el reproductor inferior. Un bloque distinto cancela la sesión previa. Pulsar la tarjeta activa durante reproducción, carga o silencio conserva la sesión. Si está pausada, la reanuda. En **Una vez**, la fila completa de cada frase escucha ese MP3 individual. La fila de cada pregunta conserva su reproducción independiente. Los controles secundarios conservan sus acciones.

El modo inicial es **Una vez**. Shadowing y Escucha continua conservan sus ajustes al cambiar de bloque. [Abrir la demo](http://127.0.0.1:4446/#/island/everyday).

## P6 · Crear, importar y revisar

```powershell
npm run build:puyi-editor
npm run start:puyi-editor
```

En **Importar**, puedes pegar JSON, abrir un archivo o cargar el ejemplo ficticio **Paseo por el parque**. Validar permite corregir errores y abre una previsualización con la misma vista de P3. Confirmar pasa al editor y **Guardar borrador** registra una revisión. **Nueva isla** crea una isla vacía con un UUID. Puedes editar frases y preguntas, cambiar su orden y sus relaciones y añadir o quitar bloques. Los detalles lingüísticos quedan plegados. [Abrir el editor local](http://127.0.0.1:4447/) · [Guía y prompt para ChatGPT](phrase-islands-puyi-chatgpt-template.md).

El formato de intercambio v1 conserva los UUID de P0 y el orden de los arrays. Una pregunta puede enlazar frases de cualquier bloque de la misma isla. Cada importación corresponde a una isla. Los campos editoriales pueden estar incompletos y el límite de transporte es 2 MB por petición. Las aprobaciones incluidas en el JSON importado se tratan como propuestas y sus referencias de audio quedan sin verificar. La aprobación local de texto requiere validar japonés, lectura, segmentos y traducción ES y confirmar expresamente la revisión. La comprobación automática verifica coherencia de campos. La naturalidad se decide al revisar y escuchar.

El servidor local solo escucha en `127.0.0.1:4447`. Las revisiones viven en `.phrase-islands-authoring/puyi/drafts-p6/`, ignorada por Git. El editor comprueba UUID, duplicados, propiedad de referencias y revisión esperada antes de guardar una revisión inmutable. **Restaurar** copia una versión anterior a una revisión nueva. La lista permite gestionar varias islas y exportar cada borrador como JSON. La previsualización muestra texto y furigana. Los borradores quedan fuera de la demo, del catálogo público y de la compilación de Pages.

## Audio individual

Tras aprobar el texto guardado, abre **Editar** en una frase o pregunta y pulsa **Preparar audio individual**. La acción prepara un `job.json` privado con AivisSpeech 1.2.0, Aida Shigeru normal y la huella del japonés y la lectura. Preparar el mismo trabajo devuelve su ruta existente. Un trabajo selecciona una sola entrada. El propietario puede ejecutar más adelante el motor local con la ruta que muestra el editor.

```powershell
python -X utf8 scripts/phrase-islands-authoring-audio.py --job "RUTA_PRIVADA_AL_JOB_JSON"
node experiments/phrase-islands-puyi-editor/audio.mjs register "RUTA_PRIVADA_AL_JOB_JSON"
```

`register` comprueba la entrada actual, la licencia y los hashes de MP3, WAV y consulta con las verificaciones de P2.2. Tras escuchar el MP3 local y comprobar que corresponde a la lectura, la aprobación explícita se registra con su SHA-256. Volver a abrir el borrador muestra el estado actualizado.

```powershell
Get-FileHash -Algorithm SHA256 "RUTA_PRIVADA_AL_MP3"
node experiments/phrase-islands-puyi-editor/audio.mjs approve "RUTA_PRIVADA_AL_JOB_JSON" "SHA256_EN_MINUSCULAS"
```

Cambiar traducciones conserva el audio válido. Cambiar japonés o lectura lo marca como de una versión anterior y conserva los archivos y las revisiones. Esta fase prepara y valida el flujo con datos ficticios. La síntesis y la escucha de nuevas entradas personales quedan para una ejecución explícita posterior.

## Verificación y P7

```powershell
npm run test:puyi-editor
npx playwright test --config playwright.puyi-demo.config.ts
npm test
npm run build:puyi-demo
npm run build:puyi-editor
npm run build
```

Pasaron 7 pruebas del importador, 24 dirigidas del reproductor, 3612 en la suite global y 34 pruebas de Playwright en Edge y WebKit. Las pruebas de navegador cubren las tarjetas con MP3 reales, las regresiones P3–P5 y la importación por texto y archivo, la previsualización, la edición, la exportación y la restauración de una isla ficticia. Las capturas están en `.cache/phrase-islands-puyi-p6/captures/`.

Compilaron el editor, la demo y la aplicación pública. Los 7008 archivos públicos coinciden byte a byte con P5 y el editor está fuera de su grafo. La auditoría de texto e IDs encontró cero marcadores privados en las tres compilaciones. Se conservó el hash de Grappling y coincidieron los 36 MP3 generales. La compilación del editor carece de MP3.

P7 requiere cerrar las aprobaciones textuales y auditivas de Grappling, comprobar las cuatro identidades de Supabase, RLS y acceso, caducidad y revocación en el bucket privado, y autorizar el despliegue. Después se podrá probar el audio con pantalla bloqueada en iPhone y Lenovo sobre HTTPS. El editor local y su validación cumplen una función editorial. La autorización remota se aplicará en el servidor mediante RLS. [Diseño de seguridad](phrase-islands-puyi-security-design.md).
