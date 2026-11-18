# Islas Puyi · Shadowing por bloques

En la demostración local, abre **Vida cotidiana** → **En casa** y selecciona **Shadowing**. Elige 2, 3, 5 u 8 segundos de pausa. El valor inicial es 5 segundos y se puede cambiar entre recorridos. Pulsa **Empezar shadowing** en el reproductor inferior. [Abrir el bloque de muestra](http://127.0.0.1:4446/#/island/everyday).

El japonés con furigana y su traducción se resaltan durante **Escucha** y **Tu turno**. Si la fila activa queda fuera de vista, la página la acerca sin mover el foco. Cada turno comienza al recibir el evento real de fin del MP3. Después del turno de la última frase, el reproductor indica **Bloque terminado**. Para hacer otro recorrido hay que iniciarlo.

**Pausar** conserva la posición del audio o los segundos que quedan para imitar. **Repetir frase actual** vuelve al inicio del MP3 y prepara un turno completo después del clip. **Detener**, cambiar de modo o bloque y salir de la isla limpian el audio y cancelan los avances pendientes. Si falla la carga o el navegador bloquea el inicio, **Reintentar** vuelve a la frase afectada.

**Preguntas relacionadas** aparece antes de las frases en Shadowing. Sus clips se pueden escuchar por separado como introducción a las respuestas del bloque. La cola de Shadowing contiene las frases del bloque.

## Reproducción y privacidad

Se mantiene el elemento de audio único de P3. El mismo motor controla Reproducción, Shadowing y los clips individuales con la cola, la posición y un temporizador cancelable. Para conservar el silencio pendiente al pausar usa un reloj monotónico. La entrada Angular de la demo registra únicamente el catálogo genérico de P3. La pausa y el estado del reproductor viven en memoria y la práctica carece de integración con progreso o FSRS. Se reutilizan los MP3 y la atribución AivisSpeech de P3.

La integración del catálogo personal depende de la aprobación editorial y auditiva y de verificar las cuatro identidades, las políticas RLS y el bucket privado de Supabase. [Diseño de privacidad](phrase-islands-puyi-security-design.md).

## Validación local

```powershell
npm run start:puyi-demo
npm test -- --include src/app/features/puyi-islands/puyi-block-player.spec.ts
npx playwright test --config playwright.puyi-demo.config.ts
npm test
npm run build
npm run build:puyi-demo
```

Las pruebas de navegador usan Edge y WebKit en Windows. Los tamaños emulados fueron 320 × 750, 402 × 874, 800 × 1280 y 1280 × 800. Verifican ES/EN/CA, ambos temas, foco de teclado, controles táctiles y fila activa visible por encima del reproductor. Las pruebas de audio usan MP3 reales para la secuencia, la pregunta independiente y la recuperación tras solicitar un archivo inexistente. El rechazo de autoplay se provoca en la prueba.

- Pasaron 12 pruebas dirigidas, 3600 en la suite global y 14 en Playwright.
- Compilaron la demo y la aplicación pública. Los 7008 archivos públicos coinciden byte a byte con la referencia de P3. El grafo público excluye la demo.
- Los 36 MP3 disponibles en la demo coinciden con los originales públicos. La revisión privada conserva su hash y las compilaciones carecen de coincidencias con los marcadores de la revisión de Grappling. Durante la prueba de Shadowing solo se solicitó audio de muestra, sin llamadas a servicios externos, escrituras en el almacenamiento web ni aperturas de IndexedDB.

Capturas en `.cache/phrase-islands-puyi-p4/captures/`. Registros y comprobación de privacidad en `.cache/phrase-islands-puyi-p4/`.

## Safari, segundo plano y P5

La emulación comprueba el diseño y la secuencia en primer plano. Safari del iPhone y Chrome de la Lenovo quedan pendientes de validación física tras el despliegue seguro. Al bloquear la pantalla o cambiar de aplicación, el sistema puede retrasar el evento de fin o suspender el temporizador de imitación. La continuidad y el momento de avance quedan sujetos al comportamiento del navegador. [Investigación de audio](phrase-islands-puyi-audio-research.md) · [Plan de pruebas físicas](phrase-islands-puyi-device-test-plan.md).

P5 reutiliza la cola, el evento de fin y la cancelación del motor para el bucle con tiempo activo en primer plano. El resultado de las pruebas físicas determinará la estrategia de segundo plano. [Escucha continua P5](phrase-islands-puyi-p5.md).
