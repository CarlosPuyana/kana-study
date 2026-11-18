# Islas Puyi · Biblioteca y reproductor P3

La demostración local reúne tres islas de muestra con dos bloques cada una. Cada bloque presenta una lista continua de japonés con furigana y traducción natural. Las preguntas aparecen en un desplegable al final. Cada fila permite escuchar su MP3 y se destaca mientras suena.

El reproductor permanece a mano al desplazarse. Reproduce el bloque una vez en orden, con cinco segundos entre frases. Pausar conserva la posición del clip o el silencio restante. Detener, cambiar de bloque o volver a la biblioteca cancela el audio pendiente. Un bloqueo de autoplay o un error de carga permiten reintentar la misma frase.

## Abrir y verificar

```powershell
npm run start:puyi-demo
npm run build:puyi-demo
npm test -- --include src/app/features/puyi-islands/puyi-block-player.spec.ts
npx playwright test --config playwright.puyi-demo.config.ts
```

[Demostración local](http://127.0.0.1:4446/). El servidor escucha en este PC. Playwright usa Edge y WebKit. El motor WebKit puede instalarse con `npx playwright install webkit` si falta en el entorno. Las capturas y los informes están en `.cache/phrase-islands-puyi-p3/`.

La fuente local reutiliza MP3 de muestras genéricas del catálogo general y su atribución AivisSpeech. El reproductor de esta vista sigue el patrón validado de P1 con un elemento de audio y avance al recibir `ended`. Reutiliza el componente de furigana, los temas y TranslationService de Kana Study. El vocabulario y los datos de estudio de la aplicación quedan fuera de esta entrada.

## Resultados de P3

- Pasaron las cinco pruebas dirigidas del reproductor y las 3593 pruebas de la suite global.
- Pasaron seis pruebas de Playwright en Edge y WebKit. Verificaron navegación, ES/EN/CA, tamaños móvil y tablet, playback de MP3, pausas, reproducción individual y cancelación al detener, cambiar de bloque o salir de la isla.
- Compilaron Kana Study y la demo. Los 7008 archivos de la compilación pública coinciden byte a byte con la referencia anterior a P3. La comprobación de privacidad encontró cero referencias a la entrada de la demo en la compilación pública y cero marcadores del borrador privado en los archivos de texto inspeccionados. El hash del borrador de Grappling se conservó.

## Paso a la biblioteca privada

La entrada Angular de P3 tiene su propia configuración de build, sus rutas y el catálogo genérico. El build de Pages sigue usando la entrada pública. **Grappling será la primera isla real tras la aprobación del texto, la revisión de los audios y la validación del acceso privado.**

La vista recibe su catálogo mediante `PUYI_LIBRARY_SOURCE`. La integración real deberá esperar la sesión de `AuthService`, obtener del servidor el catálogo que autoricen las políticas RLS para los cuatro UUID verificados y resolver los clips mediante el bucket privado. El contador de revisión de acceso permite cancelar la reproducción al cambiar de contexto. Ese contador se vinculará a `WorkspaceService.activationRevision` y a la pérdida de sesión o acceso. Los datos se invalidarán junto con el audio.

El prototipo registra únicamente la fuente genérica. El diseño de P0 define las comprobaciones de usuario autorizado y no autorizado que deberán superar las políticas y el acceso a los objetos antes de conectar datos reales. [Diseño de seguridad](phrase-islands-puyi-security-design.md).

## P4 y P5

P4 incorpora el turno de imitación y sus controles en la misma vista del bloque. Los ciclos y el temporizador de tiempo activo se reservan para P5. La continuidad al cambiar de aplicación, bloquear pantalla o conectar auriculares y la parada bajo suspensión requieren pruebas en Safari del iPhone y Chrome de la Lenovo físicos. [Shadowing P4](phrase-islands-puyi-p4.md) · [Plan de pruebas en dispositivos](phrase-islands-puyi-device-test-plan.md).
