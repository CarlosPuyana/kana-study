# Vocabulario — bloqueo de guardado tras Anti-AFK V2

09/11/2026. Corrección urgente independiente de Kanji K1.

## Causa y reproducción

`c59da61` amplió `CARD_STUDY_LIMIT_MS` de 10 a 180 segundos. El validador de
lecciones seguía exigiendo `durationSeconds <= attempts * 10`. Una primera
respuesta de 30 segundos se escribía en el diario previo, pero se rechazaba
antes de aplicar sus proyecciones. Reintentar encontraba el mismo recibo
rechazado; reanudar tampoco podía superar la recuperación inicial.

Se reprodujo antes de corregir: **4 fallos nuevos**, a 11/30/180 segundos y
al recuperar un diario de 30 segundos. Los otros 45 tests del archivo pasaban.
No se accedió a la cuenta ni a los datos de Nora; la reproducción es sintética.

## Corrección

- El validador reutiliza `CARD_STUDY_LIMIT_MS / 1000`, manteniendo enteros,
  límites por respuesta y todas las comprobaciones de identidad y consolidación.
- Los diarios bloqueados por ese límite se recuperan mediante el protocolo
  existente: misma lección, duración, IDs y snapshot FSRS; sin segunda valoración.
- Continuar lección reutiliza la estructura visual del resto de botones:
  icono, título, modalidad y flecha; conserva las traducciones existentes.
- No se borran operaciones o lecciones, no se migran datos y no cambian el
  reloj, FSRS, consolidación, sincronización ni las duraciones históricas.

## Validación previa a publicación

- **14 regresiones Angular nuevas**: límites, respuestas reales y recuperación
  después de recarga, conservando una sola valoración y un solo intento.
- Vocabulario dirigido inicial: **167/167**; después se añadieron los diez casos
  de validación de límites, incluidos en la suite completa.
- Suite completa local: **2723/2723**, 252 archivos. Incluye 13 regresiones de
  Kanji K1 aún sin publicar; estas no forman parte del commit de este hotfix.
- Playwright del hotfix: **6/6**, ES/EN/CA, escritorio/390/320 px, claro/oscuro.
  Incluye fallo persistente, reintento exitoso, recarga y clic real en Continuar.
- TypeScript app/spec correcto. Builds normal y candidato con `/kana-study/`
  correctos; candidato **749780 bytes**, sin ampliar presupuestos.
- Los seis warnings SCSS conocidos permanecen. Capturas y logs locales en
  `.cache/vocabulary-save-hotfix/`; no se versionan.

La recuperación de cuota realmente agotada u otros datos corruptos seguirá
mostrando un error: esta corrección resuelve el rechazo indebido del tiempo
válido, sin ocultar fallos de almacenamiento. Tras publicarla, recargar la
aplicación y continuar la lección; no es necesario borrar datos del navegador.

## Incidencia de CI posterior al primer push

El workflow de `ef67089`, ejecución `42689487645`, detuvo la publicación con
2709 tests correctos y un fallo preexistente en `learning-writing-prompt.spec.ts`.
El test disparaba un clic de Kanji, esperaba `fixture.whenStable()` y comprobaba
el contador antes de terminar `answerQuick()`, que ahora espera IndexedDB por K0.
Se espera explícitamente la promesa devuelta por el método invocado desde el
botón, tanto para el error como para el acierto. Se conserva la interacción UI
y todas las aserciones, sin sleeps, polling, reintentos ni cambios de producción.
El test dirigido pasa **7/7** y TypeScript spec es correcto. Las adaptaciones
del mock de disponibilidad de K1 quedan fuera de este ajuste de CI.
