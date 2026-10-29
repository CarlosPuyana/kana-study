# KAISHI-MEDIA-AUTO

Recorrido vigente: [Roadmap UX de Mazos](MAZOS_UX_ROADMAP.md). Su autoaudio configurable palabra→frase sustituye la política manual predeterminada descrita en el estado histórico inferior.

29 de octubre de 2026. Implementación local que replantea el recorrido de [KAISHI-MEDIA-1](KAISHI_MEDIA_1.md), conservando su almacén e importador. HEAD inspeccionado: `bad859a635a9ca91ae23c637dbc4ed3a098ef3de`; ya había cambios locales de MEDIA-1, que no se han revertido. Sin commit, push ni despliegue.

> Actualización posterior: el propietario comunica autorización de Donkuri el 29-10-2026. Véase [activación de medios originales](KAISHI_MEDIA_AUTO_ACTIVATION.md). La revisión y cifras siguientes describen el estado histórico anterior a esa autorización.

**En la revisión inicial, la publicación de los audios e imágenes originales quedó bloqueada por derechos no acreditados.** El recorrido automático está implementado y se valida con recursos de prueba propios, identificados como tales. Los originales preparados permanecen exclusivamente en `.cache/kaishi-auto/private/`, nunca en `public/` o `dist/`. No se presenta esa preparación como permiso de redistribución ni como multimedia original ya disponible para nuevos usuarios.

## Condiciones de redistribución: revisión y bloqueo

Fuentes primarias consultadas:

- [Repositorio del traductor español](https://github.com/Dogi5/Kaishi-ESP): lista raíz sin licencia general localizada; enlazar una descarga no acredita permiso para reubicar sus medios.
- [Repositorio original y créditos](https://github.com/donkuri/kaishi): identifica fuentes mixtas, incluyendo Core, AJT Japanese e imágenes de Irasutoya. No se estableció una licencia por recurso que cubra este despliegue.
- [Discusión del mantenedor sobre licencia](https://github.com/donkuri/kaishi/issues/33): reconoce incertidumbre sobre material de terceros. Su aceptación personal de reutilización con mención no despeja los derechos ajenos.
- [Condiciones de Irasutoya](https://www.irasutoya.com/p/terms.html): no se pudieron recuperar de forma fiable durante esta revisión. No se infiere aprobación ni un permiso general a partir de fuentes secundarias.

Resultado registrado en `release/kaishi-media-rights.json`: `blocked`, cero recursos aprobados. Queda pendiente acreditar autorización/licencia aplicable a cada origen y su alcance para servir esos archivos públicamente, incluidas atribuciones y limitaciones. No se ha contactado a terceros ni sustituido esa autorización por una aceptación de riesgo.

`check-kaishi-static-publication.mjs` se ejecuta en `prebuild` de ambos builds. Mientras el estado siga bloqueado solo permite el catálogo de bloqueo en la carpeta pública de esta versión; rechaza medios originales o fixtures que se intenten introducir allí. La auditoría de artefactos comprueba también que no estén en los directorios de despliegue. Levantar el bloqueo exige una revisión posterior explícita; no existe opción de UI, URL o localStorage que lo haga.

## Recorrido y preferencias

Japanese 1500 conserva IDs, orden, textos, lecturas, ejemplos, traducciones y programación. Al revelar, se consulta únicamente la tarjeta actual. Si hay recursos disponibles, aparece su imagen y botones independientes para palabra y frase. El audio se descarga y reproduce solo al pulsar su botón. No hay autoplay ni multimedia en el anverso.

El acento existente aparece por defecto cuando no hay una preferencia explícita. El valor local `false` de MEDIA-1 continúa desactivándolo, incluso tras recarga. Se conserva el almacenamiento por workspace sin nuevos contratos de sincronización. Ajustes muestra la preferencia fuera de cualquier gestión de archivos.

La administración local queda bajo “Medios locales y paquete opcional”, cerrada inicialmente. No es un requisito ni el recorrido habitual. Las instalaciones existentes no se migran ni borran automáticamente:

1. Por cada recurso, se prefiere el Blob local existente del almacén anterior.
2. Si falta, se usa su referencia estática, si la versión está publicada.
3. Si tampoco existe o falla la red, se conserva el reverso textual y el acento; hay un error discreto recuperable cuando procede.

Una copia local completa evita las peticiones de medios estáticos. El contenido local compartido sigue limitado al mismo navegador/origen; las preferencias continúan separadas por workspace. Los backups de progreso excluyen estos blobs y no se alteran.

Actualmente un perfil público limpio recibe el catálogo de bloqueo, por lo que no ve audios/imágenes originales automáticos hasta resolver los derechos. Puede estudiar texto y acento. El preview de QA proporciona el recorrido completo con fixtures claramente marcados, sin pedir un APKG.

## Entrega estática y caché

Base relativa: `assets/kaishi/esp-v1-3fdaef081150-r1/`, resuelta contra `document.baseURI`. Se ha comprobado bajo `/kana-study/`, sin hotlinks ni dependencia de CORS o GitHub Releases.

- `catalog.json`: esquema, versión, publicación y dataset. Se consulta a demanda, no al abrir Home.
- `cards/<SHA256(entryId)>.json`: solo las referencias de esa tarjeta. No se descarga el manifiesto de 1500 entradas para estudiar.
- `resources/<SHA1-contenido>.<ext>`: nombres estables por contenido, deduplicados. MP3, PNG, JPEG y WebP; WAV exclusivamente para los fixtures de prueba.

La versión del catálogo y de cada descriptor deben coincidir con la del cliente. No se modifican recursos de una versión publicada: una futura promoción o cambio de referencias requiere una revisión/versionado nuevo para no reutilizar un catálogo de bloqueo cacheado. Los hashes de recurso impiden mezclar bytes distintos bajo la misma referencia.

Las peticiones usan la caché HTTP normal (`default`), sin parámetros aleatorios. Un reintento manual puede revalidar (`reload`). Se rechazan redirecciones para impedir convertir estas rutas en hotlinks externos. Solo se aceptan rutas relativas del directorio de recursos con hash, tamaño y MIME conocidos. Se limita cada cuerpo a 512 KiB y se verifica el tamaño decodificado y SHA1, también cuando Content-Encoding cambia el Content-Length transferido. No se añade service worker ni se promete arranque o disponibilidad offline completos. Los medios locales anteriores mantienen su funcionamiento offline; la caché HTTP depende del navegador y del servidor.

La imagen no reserva un contenedor alto si falta. Al cambiar de tarjeta/workspace, destruir la vista o salir, se abortan peticiones, se detiene audio y se revocan URLs Blob. Los resultados asíncronos antiguos se ignoran; también se cancela un audio aún en descarga si se elige otro. El renderer tonal existente sigue emitiendo texto y clases estructuradas, sin insertar HTML Anki.

## Preparación durante desarrollo

`prepare-kaishi-static-media.mjs` reutiliza el paquete exacto y el manifiesto auditado. Verifica tamaño/SHA256 del APKG, inventario/CRC, descompresión Zstandard, tamaños, hashes y formatos. No importa SQLite, plantillas ni progreso. Escribe solo en rutas privadas fijas dentro de `.cache/kaishi-auto/`; no tiene una opción para copiar el paquete a `public` o `dist`.

```powershell
node scripts/prepare-kaishi-static-media.mjs 'RUTA_LOCAL_AL_APKG_COMPATIBLE.apkg'
```

Preparación real ejecutada: 1500 descriptores, 4498 referencias habilitadas a 4353 entradas ZIP y **4344 archivos únicos por contenido**, con **109382203 bytes** de medios. La deduplicación por SHA1 elimina nueve copias adicionales frente al almacén por índice ZIP anterior. El pack estático (recursos, descriptores y catálogo) suma **110044359 bytes** y 5845 archivos; excluye el APKG y los helpers/informes privados.

Se mantienen 1499 referencias de palabra, 1499 de frase y 1500 imágenes. El audio de frase de 永遠 y el audio de palabra ausente siguen excluidos en preparación y resolución. No se inventan grabaciones. No se cambia テーマ por 手間. No se afirma haber escuchado o revisado lingüísticamente todas las grabaciones.

## Preview de QA sin instalación

```powershell
npm run build:manga-candidate
node scripts/prepare-kaishi-static-media.mjs --fixtures
node scripts/serve-kaishi-auto-preview.mjs --fixtures
```

Abrir `http://127.0.0.1:4403/kana-study/#/anki/japanese-1500/study` en un perfil separado limpio. Revelar la tarjeta. Los tonos y las imágenes geométricas son fixtures programáticos propios; la tarjeta lo indica. No son grabaciones Kaishi. El servidor de preview solo escucha en loopback y no sirve la preparación privada original. Sin `--fixtures` sirve el artefacto normal bloqueado.

```powershell
npx playwright test -c playwright.kaishi-auto.config.ts --output=.cache/kaishi-auto/browser-final
```

Los tests usan perfiles nuevos sin medios ni preferencia tonal previa, navegando por la UI para seleccionar el tema claro cuando corresponde. Comprueban 12 escenarios en Chromium: escritorio oscuro, 390 px claro y 320 px oscuro; solicitudes por tarjeta, ausencia de audio previo al clic, audio/parada, preferencia y recarga, errores/reintento, cancelación de la tarjeta antigua, formato local anterior, prioridad y conservación exacta de progreso/programación. El caso de compatibilidad estructural usa filas mínimas explícitas del formato anterior, no un bypass de instalación pública.

La comprobación adicional del APKG real se ejecuta en un perfil aislado mediante `playwright.kaishi.config.ts`, expandiendo expresamente la administración secundaria. Sus capturas nuevas se separan con `KAISHI_MEDIA_EVIDENCE_DIR`; no se sobrescriben las evidencias de MEDIA-1. No aloja esos recursos en el servidor: los importa localmente desde el dispositivo.

## Resultados

Validación del estado final, 29 de octubre de 2026. Evidencias locales ignoradas en `.cache/kaishi-auto/`:

| Comprobación | Resultado | Evidencia |
| --- | --- | --- |
| Tests afectados mediante builder Angular | 49/49, 8 archivos | `directed-angular-final.log` |
| Suite Angular completa | 2201/2201, 215 archivos | `full-final.log` |
| Perfil limpio, multimedia automática con fixtures, tres tamaños/temas | 12/12 | `browser-final.log` |
| Compatibilidad con APKG original importado localmente, escritorio | 1/1 | `legacy-compat-verified.log` |
| Regresión navegador: scheduler, mazos, backup, Daily y separación Guest/login | 33/33 | `regression-browser.log` |
| Regresión Manga candidato ES/EN/CA | 3/3 | `manga-regression.log` |
| TypeScript app/spec/worker | Correcto | `ts-app.log`, `ts-spec.log`, `ts-worker.log` |
| Builds producción normal y candidato, base `/kana-study/` | Correctos; cuatro warnings SCSS conocidos | `build-normal.log`, `build-candidate.log` |
| Auditoría medios/bundle, límites locales, límite estricto y bloqueo de publicación | Correctas | `media-audit.log`, `normal-audit.log`, `budget-boundary.log`, `rights-guard.log` |

Una invocación adicional directa de Vitest no configuró el entorno Angular (`describe is not defined`) y encontró copias antiguas bajo `.cache`; no ejecutó tests. Se repitió correctamente mediante `npm test -- --include=…`, sin cambiar código ni debilitar pruebas. La primera ejecución de compatibilidad original encontró un error de escritura de una captura anterior; se asignó un directorio nuevo de evidencias y el recorrido completo pasó, sin sobrescribir capturas previas.

| Artefacto browser | JavaScript/CSS inicial | Despliegue completo actual | Proyección con pack original no autorizado |
| --- | ---: | ---: | ---: |
| Normal | 746492 bytes | 39923011 bytes | 149967271 bytes |
| Candidato | **747378 bytes** | 39922811 bytes | 149967071 bytes |

El candidato queda 2622 bytes por debajo del límite estricto de 750000. El worker de importación, 527549 bytes, permanece diferido; ni sus dependencias ni los medios se incorporan al bundle inicial. El despliegue actual contiene cero archivos multimedia originales estáticos. La última columna es únicamente una proyección del artefacto más el pack privado de 110044359 bytes, descontando el catálogo de bloqueo sustituido: no es un despliegue ni una aprobación de publicación.

Cambios AUTO: nuevo modelo/resolutor estático y tests; preparación privada y fixtures; servidor QA; guardia de publicación y auditoría; adaptación del componente multimedia y Ajustes; preferencia tonal y traducciones ES/EN/CA; pruebas de perfil limpio y documentación. Se conservan el manifiesto auditado, parser/worker, almacén e importador de MEDIA-1 y sus cambios anteriores. No se modifican fuentes de Japanese 1500, scheduler/FSRS, gates, workflow, SQL ni sincronización.

Capturas: `card-desktop-dark.png`, `card-mobile-light.png`, `card-narrow-dark.png` y sus correspondientes `settings-*.png`. Son pruebas automatizadas Chromium con recursos de demostración; no constituyen aceptación humana ni validación Safari. Auditoría de enlaces y `git diff --check` se ejecutan al cerrar la documentación.

## Límites pendientes

La publicación de originales permanece bloqueada. Safari/iOS y hardware de audio real requieren comprobación manual; no hay WebKit/Firefox instalados en este entorno. La prueba mecánica de tonos y de muestras locales originales no es una validación lingüística masiva. No se ha usado Supabase real ni modificado SQL. Gramática restringida, Guest-only, custom cloud/upload apagados, FSRS y SCHEDULER-1 permanecen intactos. No se inicia otro hito.
