# Activación de los medios Kaishi automáticos

Recorrido vigente: [Roadmap UX de Mazos](MAZOS_UX_ROADMAP.md). Su autoaudio configurable palabra→frase sustituye la política manual predeterminada descrita en el estado histórico inferior.

29 de octubre de 2026. Preparación local posterior a KAISHI-MEDIA-AUTO. Sin commit, push ni despliegue.

## Autorización registrada

El propietario de kana-study comunica en este chat que Donkuri le ha autorizado a usar todos los recursos del mazo. Se registra como permiso directo comunicado por el propietario, sin inventar una cita literal ni afirmar que se haya inspeccionado la conversación original. El registro no atribuye a Donkuri la titularidad de todos los recursos ni establece una licencia nueva para terceros.

`release/kaishi-media-rights.json` conserva quién concede el permiso, la fecha en que se comunica, su alcance, el tipo de evidencia y los hashes, tipos y tamaños de los 4344 recursos que integran esta preparación. La discusión pública anterior se conserva como contexto histórico y no se presenta como la nueva autorización.

## Entrega preparada

Versión `esp-v1-3fdaef081150-r2`. Se conserva sin cambios el catálogo bloqueado r1 para evitar mezclar recursos o reutilizar el estado anterior almacenado en caché. La nueva versión incluye catálogo listo, 1500 descriptores, 4344 archivos de contenido único y `CREDITS.txt`. Los medios suman 109382203 bytes. Los enlaces de crédito a Donkuri y a Dogi5/Kaishi-ESP son visibles en Ajustes, fuera del importador opcional.

Los originales preparados se cotejan con el manifiesto del paquete compatible: tamaño, SHA1, tipo y relación exacta entre tarjeta y recurso. El control previo a cada build comprueba el permiso registrado y todo el contenido público. La auditoría posterior repite la comprobación en ambos artefactos. Rechaza archivos añadidos, tonos de demostración, tarjetas o recursos ausentes, modificaciones y mezclas de versiones. No se copia el APKG ni los informes, módulos auxiliares o ficheros privados de extracción.

El recorrido continúa cargando únicamente la tarjeta revelada. El audio se solicita al pulsar los botones de palabra o frase; no se reproduce automáticamente. Los medios locales conservan prioridad. Se respeta la desactivación explícita del acento y se mantiene el importador como alternativa. Sin alteraciones en IDs, contenido textual, progreso, FSRS, SCHEDULER-1, backups, autenticación, SQL, sincronización ni gates.

El audio de frase de 永遠 y el audio de palabra ausente siguen excluidos por las razones documentadas en [KAISHI-MEDIA-AUTO](KAISHI_MEDIA_AUTO.md). El permiso no sustituye la revisión lingüística de esas grabaciones.

## Comprobaciones

Resultados locales: Angular 2201/2201; navegador con originales 3/3; navegador AUTO con fixtures 12/12; regresión Manga candidato 3/3; TypeScript app/spec/worker correcto; ambos builds y auditorías de integridad correctos. Bundle inicial normal 746492 bytes y candidato 747378 bytes, ambos inferiores a 750000. Artefacto completo candidato con medios originales: 149967963 bytes. Permanecen únicamente los cuatro avisos SCSS conocidos. No se ha repetido en esta activación la suite de 33 regresiones del hito anterior; estos resultados corresponden a las comprobaciones ejecutadas ahora. Las pruebas de navegador originales se ejecutan con `playwright.kaishi-original.config.ts` sobre el candidato optimizado bajo `/kana-study/`, en perfiles limpios sin importar el APKG: imagen original, acento, audio manual de palabra/frase, ausencia de autoplay, progreso sin cambios y créditos. Los casos de fallos, cancelación y prioridad local conservan su suite de fixtures separada.

Para probar el candidato con originales, ejecutar `npm run build:manga-candidate` y después `node scripts/serve-kaishi-auto-preview.mjs` **sin `--fixtures`**. Abrir `http://127.0.0.1:4403/kana-study/#/anki/japanese-1500/study` y revelar una tarjeta. Para desarrollo normal, `npm start` sirve ahora los originales desde public; un servidor anterior puede requerir reinicio y recarga.

## Pendiente antes de publicar

Aceptación humana del audio y comprobación Safari/iOS y dispositivos físicos. La validación automatizada de reproducción en Chromium no constituye una escucha lingüística de las 1500 tarjetas. No se ha realizado ningún cambio remoto. El commit, push y despliegue requieren autorización posterior.
