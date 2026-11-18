# Islas Puyi · Escucha continua por bloques

Abre **Vida cotidiana → En casa**, selecciona **Escucha continua**, elige la duración y pulsa **Reproducir**. La demo ofrece 5, 10, 15 y 30 minutos, y silencios de 0, 2, 5 y 8 segundos. Empieza con 5 minutos y 5 segundos de silencio. Los ajustes se eligen antes de empezar y quedan en memoria dentro de la vista. [Abrir el bloque de muestra](http://127.0.0.1:4446/#/island/everyday).

El reproductor fijo muestra el tiempo restante y el progreso. La fila activa conserva el japonés, el furigana y su traducción, incluso durante el silencio. La lista avanza desde el primer MP3 y vuelve al primero después de la última frase y su silencio. Las preguntas relacionadas se reproducen aparte por petición del usuario. **Una vez** conserva la vuelta única de P3 y **Shadowing** termina tras el último turno de imitación de P4.

## Reloj y finalización

El reloj sigue el modelo `ActiveClock` de P1. Suma intervalos de tiempo activo, que incluyen carga, audio y silencio programado. Pausar congela el contador y conserva la posición del MP3 o el silencio pendiente. Un rechazo de autoplay, un error de medios o una carga que sigue sin arrancar después de 15 s detienen el avance y congelan el contador. **Reintentar** reanuda desde el MP3 afectado con el tiempo que queda.

| Estado cuando se agota el tiempo | Resultado |
| --- | --- |
| Silencio o inicio de un clip que todavía no ha sonado | Termina la sesión. No se carga el siguiente clip ni se mantiene una reproducción pendiente. |
| Ya ha empezado la frase actual | El contador queda en 00:00 y se deja terminar la frase. Con JavaScript ejecutándose, se corta si sigue activa 15 s después del límite. |
| Pausa manual o error recuperable | El plazo activo permanece congelado. Continuar conserva la fase, incluido el margen si la frase ya estaba terminando. Reintentar vuelve a la misma frase si queda tiempo. |
| Regreso tras demora o suspensión | Se recalcula el tiempo activo desde el reloj. Si ya pasó el límite, se impide una frase nueva. Si pasó también el margen, se libera el audio al recuperar ejecución. |

La cuenta atrás se actualiza por segundos. El plazo se comprueba además antes de cargar una frase, al resolverse el inicio de reproducción y al acabar un clip. **Detener**, cambiar de modo o bloque, salir de la isla, y perder el contexto de acceso cancelan los temporizadores y liberan la fuente del elemento de audio. Las promesas y eventos anteriores quedan invalidados. El reloj usa tiempo de pared para que cuente el intervalo suspendido, por lo que un cambio del reloj del sistema puede afectar la sesión.

## Medios y privacidad

P5 conserva un único elemento de audio y carga el MP3 actual según el avance. Los clips se reutilizan en cada vuelta y para cualquier duración. El punto de carga de clip permite añadir una precarga acotada más adelante si las pruebas la justifican. El catálogo de la demo sigue siendo el genérico de P3. Grappling requiere aprobación editorial y auditiva, cuatro identidades verificadas, políticas de lectura verificadas y un bucket privado antes de conectarlo.

## Validación local

```powershell
npm run start:puyi-demo
npm test -- --include src/app/features/puyi-islands/puyi-block-player.spec.ts
npx playwright test --config playwright.puyi-demo.config.ts
npm test
npm run build:puyi-demo
npm run build
```

Los registros y la auditoría se guardan en `.cache/phrase-islands-puyi-p5/`. Las capturas están en `.cache/phrase-islands-puyi-p5/captures/`. Para instalar el motor de pruebas si falta, usar `npx playwright install webkit`.

- **24 pruebas dirigidas** con reloj simulado. Cubren varios ciclos, las cuatro duraciones, pausa y recuperación, vencimiento en silencio y durante audio, el margen de 15 s, carga pendiente y callbacks suspendidos.
- **3612 pruebas en 290 archivos** en la suite global.
- **24 pruebas de Playwright** en Edge y WebKit para P3, P4 y P5. Con MP3 reales, ambos motores pasaron A→B→C→D→E→A, incluido el silencio entre E y A. También pasaron pausa en audio y silencio, cambios de bloque y modo, salida de la isla, recuperación de errores y vencimiento con un salto simulado del reloj. Se comprobaron ES/EN/CA, ambos temas, teclado y controles táctiles a 320 × 750, 402 × 874, 800 × 1280 y 1280 × 800.
- **Compilaciones de la demo y la aplicación pública correctas.** Los 7008 archivos públicos coinciden byte a byte con P4. El grafo público excluye la demo. La auditoría encontró cero coincidencias con los textos del borrador privado y confirmó que conserva su hash. Los 36 MP3 de muestra coinciden con los originales públicos.

## Segundo plano y próximas fases

La validación física queda pospuesta hasta poder acceder desde la web desplegada por HTTPS, sin certificados locales. Edge y WebKit en Windows comprueban el primer plano con tamaños emulados. En iPhone y Lenovo faltan las mediciones de continuidad, silencios, vueltas y parada con pantalla bloqueada o al cambiar de aplicación. Si el sistema suspende JavaScript, el evento de fin, el siguiente clip o la parada pueden retrasarse hasta recuperar ejecución. [Investigación de audio](phrase-islands-puyi-audio-research.md) · [Hoja de pruebas físicas](phrase-islands-puyi-device-test-plan.md).

- **P6** queda pendiente de autorización para diseñar la importación de conversaciones seleccionadas a borradores privados revisables, con trazabilidad y aprobación editorial antes de publicar.
- **P7** requiere cerrar las aprobaciones de Grappling, verificar las cuatro cuentas, RLS y el bucket privado con pruebas negativas y comprobar acceso y revocación de medios. El despliegue seguro requiere autorización explícita. Después se harán las pruebas físicas por HTTPS de la hoja de dispositivos.
