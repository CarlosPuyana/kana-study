# Islas de frases — I7: preparación de publicación

18 de noviembre de 2026. Auditoría local sobre `main`, sin publicar. Continúa el [roadmap](phrase-islands-roadmap.md), [catálogo I3](phrase-islands-i3-catalog.md), [sesiones I4](phrase-islands-i4-sessions.md), [RUSH I5](phrase-islands-i5-rush.md), [diseño I6.1](phrase-islands-i6-admin-design.md) y [guía I6.2](phrase-islands-i62-local-editor.md).

**Recomendación: LISTO CON LIMITACIONES DOCUMENTADAS.** No se ha reproducido un bloqueo técnico de Islas. Pasan TypeScript, tests, integridad de medios, builds y pruebas de navegador. Quedan pendientes la autorización de publicación, comprobar el remoto/CI real y las limitaciones auditivas y de dispositivos detalladas abajo. No se presenta como desplegado lo que solo está probado localmente.

## 1. Estado real de Git y alcance

- Rama: `main`. HEAD: `27dc4755b7af8754ed07ef4eb02d29340dfaaa4d`, `feat(mazos): añadir esqueleto de Islas de frases`, 17/11/2026.
- **I0 ya está comprometido.** La premisa de que todo I0–I6.2 estaba sin commit no coincide con el historial. Las ampliaciones posteriores siguen locales: **19 archivos tracked modificados y 104 archivos nuevos**, sin cambios preparados en el índice.
- `origin` apunta a `https://github.com/CarlosPuyana/kana-study.git`. La referencia local `origin/main` coincide con HEAD, con divergencia local 0/0. No se ha hecho fetch, consultado el remoto vivo ni verificado un despliegue de ese SHA; una referencia local no demuestra lo publicado en Pages.
- Se tomó una instantánea SHA-256 de **7965 archivos no ignorados**, HEAD e índice antes de trabajar. Las pruebas de navegador se ejecutaron desde una copia dentro de `.cache/phrase-islands-i7-20261118/browser-work/`, para conservar las capturas/resultados anteriores. No se usaron perfiles personales ni datos reales.
- Comparación final: **ninguno de esos 7965 archivos cambiado o eliminado**, rama/HEAD intactos e índice idéntico por SHA-256 (`74c4876935a11ac13614854d0acda99fe39d80228e4232fa86ce242596cd76da`). Solo se añade este informe a los archivos no ignorados; las nuevas evidencias/fixtures están en áreas privadas ignoradas. Véase `preservation.json`.
- Los deltas de los tres idiomas contienen exclusivamente claves `phraseIslands.*` y `phraseAdmin.*`: 255 claves nuevas/modificadas por idioma; no se encontraron cambios ajenos en sus valores. Las dependencias y `package-lock.json` no cambian.
- No hay cambios tracked pendientes en FSRS, `anki-study`, persistencia, sincronización, autenticación ni el workflow de Pages. Las nuevas clases de Islas sí aparecen como untracked en `core/`; deben incluirse expresamente.

### Arreglos históricos y dependencias

HEAD ya contiene `2e34fe6` (`recover interrupted undo and prevent study lockups`), `12f4ec2` (`deshabilitar Deshacer y desbloquear estudio con pendientes antiguos`) y `39da6e8` (contadores de aprendizaje/reaprendizaje). Se comprobaron historial, archivos actuales y pruebas de comportamiento. No hace falta recuperar esos arreglos desde parches ignorados ni volver a aplicar versiones antiguas.

El contrato vigente está en la sección K de `docs/features/decks/DECKS_ANKI_PARITY_REBUILD.md`: **Undo está retirado de la interfaz de Mazos**, su método de página no realiza acciones y el estudio no procesa intents antiguos. Se conservan los registros originales y la cola se obtiene del estado canónico. No confundirlo con «Deshacer última» de RUSH, que es temporal e independiente. Los servicios históricos siguen teniendo pruebas; no se declara rehabilitado Undo de Mazos porque pasen.

Las 45 pruebas de navegador de recuperación cubren Japanese 1500, Puyi y un mazo custom con HTTP sintético, en ES/EN/CA: marcadores sin ejecutar, confirmados, caducados y corruptos; recarga, paso de día, nueva valoración y cierre voluntario. Se comprueba conservación de eventos/progreso/marcadores. Además, un caso sobre el **build optimizado** confirma que un marcador obsoleto corrupto permanece intacto y no bloquea guardar/reanudar. Esto acredita los casos reproducidos, no demuestra reparación de ningún perfil histórico real, que no se abrió.

No se ha identificado una dependencia local ajena pendiente para que Islas funcione. HEAD solo no contiene el catálogo/audio/sesiones/editor posteriores a I0: publicar únicamente los archivos tracked perdería parte esencial del trabajo.

## 2. Inventario: qué versionar y qué desplegar

| Grupo | Archivos iniciales | Git futuro | Artefacto Pages |
| --- | ---: | --- | --- |
| A. Biblioteca, sesiones, RUSH, catálogo y medios | 57 | Sí | Código compilado/diferido y 36 MP3/licencia/manifiesto; no copiar el árbol de fuentes como sitio. |
| B. Integración compartida | 9 | Sí | Su resultado de build; configs/compilador/ignore no se copian como herramientas. |
| C. Autoría, pruebas y documentación | 57 | Sí | Editor y herramientas excluidos del grafo público; tests/docs/scripts no son assets. |
| D. Privados/temporales/generados | No enumerar sus contenidos en Git | No | No, salvo configuración pública generada por CI y salidas finales expresamente previstas. |
| E. Cambios ajenos | 0 tracked/untracked identificados | Preservar y revisar aparte si aparecen | No incorporar por arrastre. |

El anexo enumera los 123 archivos iniciales, con los MP3 identificados por los manifiestos. Este informe añade **un archivo nuevo de grupo C**. `src/app/features/grammar/grammar-expansion.spec.ts` pertenece a C: su único cambio adapta la comprobación de traducciones para incluir la copia privada de autoría y asegurar que no entra en los diccionarios compilados públicos; no cambia Gramática en producción.

Dependencias que deben viajar juntas:

- Las rutas de `anki.routes.ts` cargan biblioteca y sesión; estas importan catálogo, audio, estado RUSH, swipe, resumen y traducciones. Los sidecars de texto/editorial/audio enlazan por IDs estables.
- Las traducciones JSON, `phrase-islands.generated.ts` y el compilador deben mantenerse sincronizados. La navegación/auditoría y sus tests incluyen las cuatro rutas nuevas.
- `package.json` llama a `audit-phrase-islands-public.mjs`, que importa la biblioteca CLI y el contrato de autoría TypeScript. Aunque estos no se despliegan como módulos del lector, **sí deben estar versionados para el build de CI**.
- El compilador y el test de traducciones requieren `phrase-admin-copy.generated.ts`; la entrada local necesita sus archivos HTML/TS/config y preferencias. Omitir estos untracked produciría una publicación incompleta.

### D. Exclusiones concretas y preservación de trabajo ajeno

Mantener privados `.phrase-islands-authoring/` completo —borradores, revisiones, WAV, consultas, modelos/metadatos, backups, previews y release de prueba de 37— y `.cache/` completo, incluidos motores, modelos, descargas, muestras I2/I3/I6.2 y evidencias I7. También `node_modules/`, `.angular/`, `dist/` como árbol Git, `test-results/`, informes Playwright y `__pycache__`.

`dist/kana-study-candidate/browser/` es precisamente la salida que **sí sube CI como artefacto**, no algo que deba añadirse a Git. `dist/phrase-islands-admin/` nunca se sube a Pages. Los WAV originales no se sustituyen por los MP3 ni se borran; el archivo privado durable de I6.2 sigue disponible.

Preservar sin aplicar ni borrar `grammar-corrections.patch`, `grammar-exercise-expansion.patch`, `grammar-progress.patch`, cachés/recursos de `experiments/manga-morphology-h2a/` y estado `.wrangler/` del worker. Son artefactos ignorados anteriores/ajenos, no cambios de Islas para esta publicación. No se ha revisado su contenido ni se garantiza qué cambios personales representan. No ejecutar limpieza, reset, stash o restauración masiva para preparar el commit.

`public/supabase-config.js` está ignorado por diseño, pero el glob público lo copia al sitio. El archivo local contiene solamente campos de URL/clave pública publicable; no se mostraron valores. **CI lo genera de nuevo** con `vars.SUPABASE_URL` y `vars.SUPABASE_PUBLISHABLE_KEY`. No añadir ese archivo local ni credenciales al commit. No añadir exclusiones generales nuevas: las existentes cubren estos directorios y mantienen visibles los archivos legítimos.

## 3. Validación ejecutada en I7

Entorno real: Windows, Node **24.21.0**, npm **11.19.0**, Edge/Chromium. Resultados de esta fase, no heredados de informes anteriores:

| Comprobación | Resultado |
| --- | --- |
| `npx tsc -p tsconfig.app.json --noEmit` | Código de salida 0. |
| `npx tsc -p tsconfig.spec.json --noEmit` | Código de salida 0. |
| `npx tsc -p tsconfig.phrase-admin.json --noEmit` | Código de salida 0. |
| Tests dirigidos de Islas/audio/RUSH/contrato/editor/router | **8 archivos, 64 tests aprobados**. |
| Regresión dirigida de guardado/Undo/workspace/storage/auth/sync | **22 archivos, 300 tests aprobados**. |
| `node --test scripts/phrase-islands-admin.test.mjs` | **14 aprobados**; conflictos, entrada no confiable, huellas, paths Windows, staging/rollback/backup y fallos de motor. |
| `python scripts/phrase_islands_audio_test.py` | **5 aprobados** con señales sintéticas de prueba; no nueva síntesis de voz. |
| `node scripts/test-phrase-islands-i3.mjs` | 36 IDs únicos/aprobados, furigana/ES/EN/CA, archivos, bytes y hashes correctos. |
| `npm test` | **289 archivos, 3588 tests aprobados**. Los 64/300 anteriores son subconjuntos, no se suman al total global. |
| Playwright Islas | **112 aprobados**, build optimizado bajo `/kana-study/`, ocho combinaciones de tema/viewport. |
| Playwright editor | **12 aprobados**; creación, descarga real incompleta/completa, reapertura, ID estable, edición, avisos de descarte, imports inválidos, ES/EN/CA y teclado. El servidor local del editor funcionó. |
| Playwright recuperación de Mazos | **45 aprobados**, casos históricos descritos en §1; build de desarrollo con mismos providers de candidata para instrumentar estado. |
| Auditoría adicional en navegador optimizado | **2 aprobados**: todos los 36 MP3 obtenidos/hasheados/decodificados desde HTTP local y reanudación de estudio con marcador Undo obsoleto. |
| Matriz adicional de reproducción | **1 aprobado**: tres repeticiones, 0,8×, pausa/continuación durante silencio de 1 s y cancelación de silencio de 2 s; resultado final en `audio-matrix-final-playwright.log`. |
| `npm run build -- --stats-json` | Correcto: **707087 bytes iniciales**, <750000. Es el script `npm run build`, con estadísticas adicionales. |
| `npm run build:manga-candidate` | Correcto: **707969 bytes iniciales**, <750000; pasa auditoría estricta y carga diferida. |
| `npm ls --depth=0` | Correcto; no se añadieron dependencias ni cambió el lockfile. |
| `git diff --check` | Sin errores de espacios; avisos de normalización LF/CRLF en archivos generados. |
| Verificación privada de `i62-demo37-final` y `i62-rollback36` | Ambas correctas, estado `verified-in-staging-not-published`; no se aplicaron al catálogo. |

### Cobertura real y límites de interpretación

La biblioteca ofrece seis temáticas/seis frases por temática, selección múltiple, exploración separada y retorno por URL con atrás/adelante/recarga. Se comprobaron furigana, traducciones/explicaciones y estados vacíos. Las cantidades derivan del catálogo, sin imponer 36 a futuras publicaciones.

Las pruebas de audio usan MP3 reales: inicio explícito, repetición, pausa/continuación, cambios rápidos, parada, callbacks obsoletos, máximo un clip activo y final por evento `ended`. Se prueban controles de velocidad y cancelación de temporizadores. Los casos 404 y `NotAllowedError` son **fallos provocados** para verificar gestión de errores, no fallos espontáneos de los 36 medios.

Escuchar comprueba avance secuencial/finalización; Shadowing comprueba turno de imitación y navegación/repetición manual. Memoria comienza con traducción en ES y japonés/audio ocultos, revela, evalúa por botones/flechas/swipe nativo emulado, protege controles de teclado/scroll, deshace, resume y repite solo falladas durante varias rondas. La ausencia de escrituras/aperturas de almacenamiento durante acciones se comprueba con instrumentación; el código de audio/RUSH no importa FSRS/scheduler/persistencia. Cambio de workspace y destrucción cancelan sesión/audio/temporizadores; no persisten progreso de Islas.

Las pruebas de sincronización y Auth son locales con mocks/HTTP controlado, no una validación del servidor Supabase real, sus RLS o datos de cuentas. Puyi se prueba con fixtures, sin atribuir su permiso administrativo al editor local. Los accesos normales a Islas no exigen administración.

Balance Playwright: **172 casos finales aprobados** (112 + 12 + 45 + 2 + 1). El primer intento del caso adicional de velocidad falló por una aserción incorrecta del test: inspeccionaba todos los elementos históricos después de liberar su `src`, cuando el navegador ya había restablecido `playbackRate` a 1. Se conservó ese intento en `audio-matrix-playwright.log`, se corrigió únicamente el test privado para registrar la velocidad durante `playing` y pasó. `browser-work/evidence/audio-matrix.json` confirma velocidades activas `[0.8, 0.8, 0.8, 1]`, máximo un clip activo y todos detenidos/sin `src` al final. No se cambió el reproductor ni se atribuye este fallo a intermitencia de la aplicación. Los comandos base de tests no requirieron repeticiones.

Se conservan ocho avisos SCSS de tamaño de componente: siete de módulos previos y uno de la sesión de Islas (95 bytes sobre el umbral de aviso de 8 kB). No incumplen el límite inicial. El aviso Node de detección de módulo al importar el contrato TS y `NO_COLOR`/`FORCE_COLOR` de Playwright tampoco bloquean. Los informes I5/I6.2 documentan intermitencias históricas; no se reproducen en este pase y no se dan por corregidas universalmente.

## 4. Artefacto, medios y seguridad

Se inspeccionaron los grafos y árboles completos de ambos builds. La candidata tiene **7007 archivos / 152104042 bytes** en total; ese tamaño incluye recursos anteriores de la aplicación y no es el bundle inicial. Los MP3 de Islas suman **704281 bytes**. El artefacto normal tiene 7008 archivos / 152104350 bytes.

- Exactamente **36 MP3 de Islas** en cada build; bytes y SHA-256 coinciden con las referencias de origen. La prueba HTTP añade decodificación mono 44100 Hz y duración compatible para **cada** archivo bajo `/kana-study/audio/phrase-islands/v1/`.
- Islas, catálogo y traducciones permanecen fuera del grafo inicial. Ningún output compilado importa editor, contrato/servicios privados de autoría, specs ni `custom-deck.fixture`.
- No hay WAV, AIVMX, ONNX, EXE, archivos de borrador/job/review ni directorios privados/scripts/manual-tests en el artefacto. La muestra número 37 permanece fuera; el manifiesto público sigue siendo 1.0.0 con 36 recursos.
- Los globs históricos copian los JSON de traducción completos a `assets/i18n/`; contienen **71 etiquetas pasivas `phraseAdmin.*`** por idioma. No son componentes, rutas, formularios ni capacidad de edición. La copia TS del editor vive fuera de assets y su módulo no entra al grafo público. Se documenta esta diferencia en lugar de afirmar que no aparece ninguna cadena del editor.
- Se revisaron deltas y textos del artefacto buscando formatos concretos de claves secretas GitHub/OpenAI/Supabase y claves privadas PEM, sin coincidencias. Se comprobó por separado el tipo publicable del config. Es una comprobación acotada, no una prueba universal de ausencia de cualquier secreto imaginable; no se imprimieron valores sensibles.
- Las condiciones ACML 1.0/procedencia y crédito Aivis/Aida Shigeru se conservan. El hash de la licencia archivada se valida; no se redistribuyen motor/modelos/ilustraciones. La elección y condiciones documentadas en I3 siguen vigentes, sin equiparar código abierto con licencia del audio ni atribuir CC0 a estas muestras.

El editor guarda archivos y la CLI valida/revisa/prepara; no disponen de credenciales GitHub/Supabase ni pueden autorizar una escritura pública por ocultar/mostrar un botón. GitHub sigue siendo la autoridad final. Las aprobaciones locales se ligan al borrador/contenido/síntesis/audio y se congelan por release; no son firmas resistentes a una persona que controle todo el disco.

No se generaron nuevos audios TTS ni se publicó la muestra I6.2. Se reutilizaron las pruebas y evidencias existentes. Los tests crean únicamente fixtures privados aislados. No se ejecutaron generadores/publicadores I3 ni se alteraron másteres originales.

## 5. Workflow y diferencias con CI

Se inspeccionó `.github/workflows/deploy-pages.yml`, sin modificarlo. `Deploy to GitHub Pages` se activa por **push a `main`** o `workflow_dispatch`; serializa/cancela por grupo `pages`.

Flujo exacto: checkout → Node **24.15.0** con cache npm → `npm ci` → generar configuración **pública** desde vars → `npm test` → TypeScript app/spec → `npm run build:manga-candidate` → configurar Pages → subir **solo `dist/kana-study-candidate/browser`** → deploy en entorno `github-pages`. Permisos: `contents: read`, `pages: write`, `id-token: write`. No ejecuta TTS, editor, tests Python o la demo privada. El build público debe funcionar sin `.cache/` ni `.phrase-islands-authoring/` en el checkout.

Diferencias pendientes: esta auditoría usa Windows/Node 24.21.0 y dependencias ya instaladas; **no ejecutó `npm ci` en un checkout limpio Linux/Node 24.15.0 ni un run real de Actions**. Se verificaron lockfile, TypeScript, rutas/base y herramientas usadas por CI, pero el run futuro será la comprobación definitiva de ese entorno. Tampoco se comprobaron las vars, permisos, protección de rama/entorno o configuración Pages del repositorio remoto; no se inventan ni se cambian.

Antes del push es imprescindible incluir todos los archivos necesarios del anexo: npm/build local pueden pasar con untracked que no existirían en Actions. No subir `browser-stats.json` u otros archivos adyacentes al directorio `browser`; el workflow actual ya delimita correctamente el artefacto. No se necesita cambiar workflows o introducir secrets para Islas.

## 6. Plan concreto de publicación futura — no ejecutado

### Selección, preservación y commits

1. Obtener autorización específica. Volver a leer estado/rama/diff y consultar el SHA remoto vivo de `main` (lectura, por ejemplo `git ls-remote origin refs/heads/main`). Si difiere de la base auditada, revisar la diferencia antes de integrar; no forzar un push ni cambiar de rama sobre trabajo local.
2. Conservar la instantánea/lista de esta fase y una copia recuperable del área privada fuera del repositorio. Si aparecen cambios ajenos nuevos, mantenerlos sin preparar y revisarlos aparte. No aplicar parches ignorados para «completar» la base.
3. Preparar **solo** A+B+C del anexo, incluyendo los 104 nuevos y este informe. Usar selección explícita por archivo; no `git add .`, `git add -A` o staging de todo `src/`/`public/` por comodidad. Comprobar el diff preparado, lista y tamaños; ningún archivo D debe aparecer.
4. Se recomiendan **dos commits futuros**: primero `feat(islands): añadir catálogo, prácticas RUSH y autoría local` con toda la implementación/pruebas/configs de A+B+C excepto `docs/`; después `docs(islands): documentar operación y preparación de publicación` con los nueve documentos modificados/nuevos iniciales y este décimo informe. I0 ya tiene su commit. Mantener implementación y autoría juntas evita un estado intermedio roto por las dependencias del compilador/test/auditor descritas en §2; no es necesario separar fases artificialmente a costa de un checkout que no compila.
5. Antes de confirmar, revisar `git diff --cached --name-status`, `git diff --cached --check` y el diff preparado. Comparar con el anexo; revisar especialmente binarios MP3, JSON/editorial/manifiesto, idiomas y scripts ejecutables. No introducir la release privada de 37.

No se ha ejecutado ninguno de los pasos de staging/commit/push de este plan. El índice permanece sin preparar.

### Comprobaciones antes del push

Sobre el conjunto finalmente seleccionado, repetir TypeScript, suite global, integridad/CLI y build candidata si ha cambiado desde esta auditoría; comprobar nuevamente los <750000 bytes y ausencia de privados. Ejecutar la misma secuencia CI en un checkout limpio con Node 24.15.0 y `npm ci` si se dispone de ese entorno. Verificar que no queda ningún import requerido sin versionar y que los MP3 Git no son punteros/archivos faltantes.

Revisar la configuración remota de Pages (`GitHub Actions`), acceso de escritura/protecciones y las dos vars públicas existentes. Identificar un último despliegue correcto recuperable con SHA/run/artifact antes de iniciar. Publicar solo los commits revisados mediante el mecanismo autorizado del repositorio; **un push a `main` inicia despliegue automáticamente**. No tratarlo como un paso inocuo de backup.

### Workflow y verificación posterior

1. Seguir el run `Deploy to GitHub Pages` correspondiente al SHA aprobado. Exigir `build` y `deploy` verdes, artefacto correcto y entorno `github-pages`. Si falla build, no etiquetar publicado ni reintentar ignorando el diagnóstico.
2. Tomar la URL real de `steps.deployment.outputs.page_url`; la esperada por nombre/base es `https://carlospuyana.github.io/kana-study/`, **no verificada en vivo en I7**. Abrir sin caché/perfil Guest de prueba y comprobar SHA/run/fecha del despliegue, base, chunks y ausencia de 404.
3. Entrar directamente a `#/anki/islands` y recargar: seis temas, total 36, selección múltiple y exploración/retorno conservados por `topics`. Revisar ES/EN/CA y un ancho estrecho y escritorio, ambos temas.
4. Descargar y contrastar **los 36** audios desplegados contra el manifiesto del commit aprobado, no solo un clip que podría proceder de caché. También verificar licencia/procedencia. Ejemplo PowerShell de lectura, para el momento posterior autorizado:

   ```powershell
   $pagesBaseUrl = 'https://carlospuyana.github.io/kana-study/' # Confirmar con el output real del deploy.
   $audioRefs = Get-Content src/app/data/phrase-islands/audio.v1.json -Raw | ConvertFrom-Json
   $verificationDir = Join-Path '.cache' ('islands-pages-check-' + [guid]::NewGuid())
   New-Item -ItemType Directory -Path $verificationDir | Out-Null
   foreach ($entry in $audioRefs.PSObject.Properties) {
     $targetFile = Join-Path $verificationDir ($entry.Name + '.mp3')
     Invoke-WebRequest -Uri ($pagesBaseUrl + $entry.Value.path) -OutFile $targetFile
     if ((Get-FileHash -LiteralPath $targetFile -Algorithm SHA256).Hash.ToLowerInvariant() -ne $entry.Value.sha256) {
       throw ('Audio distinto del commit aprobado: ' + $entry.Name)
     }
   }
   ```

5. Mediante clic real, probar Escuchar con repeticiones/pausa/velocidad y cambio/parada; Shadowing y avance manual; Memoria oculta/revelada, botones/flechas/gestos disponibles, deshacer, resumen y una segunda ronda de falladas. No convertir reproducción técnica en certificación pedagógica.
6. En un perfil de prueba sin cuenta real, comprobar Mazos tradicionales, guardado/recarga y ausencia del Undo retirado. No borrar almacenamiento de un perfil real para «arreglar» un fallo. Si se necesita validar servidor Auth/sync, hacerlo mediante pruebas autorizadas aparte, sin asumir que los mocks locales prueban el backend desplegado.
7. Solo entonces registrar SHA, run, URL, manifiesto/hashes y resultado como publicación verificada. Hasta ese momento el estado sigue siendo «preparado localmente».

### Rollback

Para un fallo de código/integración del primer lanzamiento, volver mediante **un nuevo commit de reversión** del commit funcional o volver a ejecutar un run histórico correcto recuperable del workflow, tras comprobar su SHA/artefacto. La base local de referencia es `27dc475` (I0 y arreglos previos); no se ha confirmado que sea el último despliegue correcto remoto. No revertir por error `12f4ec2`/`2e34fe6`, no usar reset/force push y no desplegar una mezcla manual de chunks de versiones distintas.

La reversión requiere nuevamente revisión, tests/build y el workflow, seguida de comprobación de la URL real. Mantener copia del artefacto fallido y evidencias. Las pestañas ya abiertas pueden retener código viejo: pedir recarga tras el rollback y comprobar los errores de recursos; no prometer continuidad de una sesión temporal entre despliegues.

Para una **futura edición del catálogo ya publicado**, usar la CLI `prepare-rollback` de I6.2 para producir otro snapshot/versionado con referencias históricas conservadas. Eso no revierte una funcionalidad Angular completa y **preparar ese snapshot tampoco lo despliega**. La demo `i62-rollback36` prueba staging, no es un rollback de Pages ejecutado.

Islas no migra datos ni escribe progreso. Una reversión no debe restaurar/borrar IndexedDB, localStorage, registros Undo, sincronización ni datos de usuarios. Si hay un problema de datos ajeno, conservar evidencia y detener esa parte para diagnóstico específico; no hacer una refactorización general ni SQL.

## 7. Limitaciones y evidencia recuperable

- No se ejecutó Safari/iOS, móvil físico ni bloqueo real de pantalla. Los tamaños 320/390/768/1280 y los swipes se probaron en Edge con emulación. No hay garantía universal de avance por timers con pantalla bloqueada; el aviso ya aparece en la sesión.
- La decisión Aivis/Aida Shigeru se mantiene. La revisión técnica/editorial y decodificación no certifican escucha nativa, acento o idoneidad pedagógica de las 36 prosodias. La comprobación auditiva humana documentada sigue pendiente; no se ha inventado un juicio auditivo en I7.
- No se validó un servidor Auth/sync real ni se inspeccionaron perfiles afectados por problemas históricos. Los casos de recuperación y límites del Undo retirado están documentados con las pruebas ejecutadas, sin garantía sobre corrupción/concurrencia no reproducidas.
- CI Linux/Node fijado, remoto vivo y Pages real quedan para el procedimiento de publicación autorizado. Los avisos de SCSS y módulo TS descritos no son errores de este pase.
- La selección y RUSH son temporales por diseño; recargar/salir/cambiar workspace descarta las respuestas. No hay progreso de Islas que prometa recuperación entre sesiones.

Evidencias locales nuevas en `.cache/phrase-islands-i7-20261118/`: `before.json`, `preservation.json`, `initial-status.txt`, `directed.log`, `regressions.log`, `global.log`, `cli.log`, `audio.log`, `catalog.log`, `build.log`, `candidate.log`, `dependencies.log`, `artifact-audit.json`, logs Playwright y `browser-work/evidence/mp3-36.json`. Capturas nuevas bajo `browser-work/.cache/`, conservando las anteriores. Las pruebas ad hoc y configs reproducibles de esta auditoría están en `browser-work/manual-tests/audit/` y `browser-work/*.config.ts`; requieren los archivos actuales del proyecto y los builds locales. No forman parte del sitio ni sustituyen a los tests versionables del anexo.

**Conclusión: LISTO CON LIMITACIONES DOCUMENTADAS.** Publicar requiere otra instrucción. Esta fase entrega el inventario y procedimiento verificables, sin commit, push, despliegue, SQL, cambios de datos reales o alteración del código de producción.

## Anexo: archivos iniciales que deben incluirse

`M` indica modificación de un archivo ya tracked; `??`, archivo nuevo todavía sin versionar. Los 36 MP3 se enumeran exactamente con su hash en los dos manifiestos citados; no se incluyen comodines de otras carpetas como autorización de staging.

### A — 57 archivos iniciales

```text
 M src/app/features/phrase-islands/phrase-islands.page.html
 M src/app/features/phrase-islands/phrase-islands.page.scss
 M src/app/features/phrase-islands/phrase-islands.page.ts
 M src/assets/i18n/phrase-islands.generated.ts
?? public/audio/phrase-islands/v1/ACML-1.0.md
?? public/audio/phrase-islands/v1/PROVENANCE.md
?? public/audio/phrase-islands/v1/manifest.json
?? src/app/core/models/phrase-island.model.ts
?? src/app/core/services/phrase-audio.service.ts
?? src/app/core/services/phrase-recall-session.ts
?? src/app/data/phrase-islands/audio.v1.json
?? src/app/data/phrase-islands/editorial.v1.json
?? src/app/data/phrase-islands/phrase-islands-catalog.ts
?? src/app/data/phrase-islands/phrases.v1.json
?? src/app/features/phrase-islands/phrase-session.page.html
?? src/app/features/phrase-islands/phrase-session.page.scss
?? src/app/features/phrase-islands/phrase-session.page.ts
?? src/app/features/phrase-islands/recall-swipe.ts
?? src/app/shared/components/phrase-recall-summary/phrase-recall-summary.html
?? src/app/shared/components/phrase-recall-summary/phrase-recall-summary.scss
?? src/app/shared/components/phrase-recall-summary/phrase-recall-summary.ts
```

Más 36 MP3 enumerados por ruta/hash en `src/app/data/phrase-islands/audio.v1.json` y `public/audio/phrase-islands/v1/manifest.json`; todos bajo `public/audio/phrase-islands/v1/pi-*.mp3`.

### B — 9 archivos iniciales

```text
 M .gitignore
 M angular.json
 M package.json
 M scripts/compile-i18n.mjs
 M src/app/features/anki/anki.routes.ts
 M src/app/navigation-audit.ts
 M src/assets/i18n/ca.json
 M src/assets/i18n/en.json
 M src/assets/i18n/es.json
```

### C — 57 archivos iniciales

```text
 M docs/phrase-islands-roadmap.md
 M manual-tests/phrase-islands/phrase-islands.spec.ts
 M playwright.phrase-islands.config.ts
 M src/app/app.routes.spec.ts
 M src/app/features/grammar/grammar-expansion.spec.ts
 M src/app/features/phrase-islands/phrase-islands.page.spec.ts
?? docs/phrase-islands-audio-research.md
?? docs/phrase-islands-i2-pilot.md
?? docs/phrase-islands-i3-catalog.md
?? docs/phrase-islands-i4-sessions.md
?? docs/phrase-islands-i41-session-design.md
?? docs/phrase-islands-i5-rush.md
?? docs/phrase-islands-i6-admin-design.md
?? docs/phrase-islands-i62-local-editor.md
?? manual-tests/phrase-admin-release/release.spec.ts
?? manual-tests/phrase-admin/editor.spec.ts
?? manual-tests/phrase-islands/catalog-fixture.ts
?? manual-tests/phrase-islands/phrase-islands-rush.spec.ts
?? playwright.phrase-admin-release.config.ts
?? playwright.phrase-admin.config.ts
?? scripts/audit-phrase-islands-public.mjs
?? scripts/phrase-islands-admin-lib.mjs
?? scripts/phrase-islands-admin-preview.mjs
?? scripts/phrase-islands-admin.mjs
?? scripts/phrase-islands-admin.test.mjs
?? scripts/phrase-islands-authoring-audio.py
?? scripts/phrase-islands-i2/.gitignore
?? scripts/phrase-islands-i2/assets.json
?? scripts/phrase-islands-i2/audit.py
?? scripts/phrase-islands-i2/correct.py
?? scripts/phrase-islands-i2/generate.py
?? scripts/phrase-islands-i2/index.html
?? scripts/phrase-islands-i2/lab.js
?? scripts/phrase-islands-i2/prepare.py
?? scripts/phrase-islands-i2/profile.ps1
?? scripts/phrase-islands-i2/serve.py
?? scripts/phrase-islands-i2/test.cjs
?? scripts/phrase-islands-i3-generate.py
?? scripts/phrase-islands-i3-publish.py
?? scripts/phrase_islands_audio.py
?? scripts/phrase_islands_audio_test.py
?? scripts/test-phrase-islands-i3.mjs
?? src/app/core/models/phrase-admin-contract.spec.ts
?? src/app/core/models/phrase-admin-contract.ts
?? src/app/core/services/phrase-audio.service.spec.ts
?? src/app/core/services/phrase-authoring-preferences.service.ts
?? src/app/core/services/phrase-recall-session.spec.ts
?? src/app/features/phrase-islands-admin/phrase-admin-copy.generated.ts
?? src/app/features/phrase-islands-admin/phrase-admin.page.html
?? src/app/features/phrase-islands-admin/phrase-admin.page.scss
?? src/app/features/phrase-islands-admin/phrase-admin.page.spec.ts
?? src/app/features/phrase-islands-admin/phrase-admin.page.ts
?? src/app/features/phrase-islands/phrase-session.page.spec.ts
?? src/app/features/phrase-islands/recall-swipe.spec.ts
?? src/index.phrase-islands-admin.html
?? src/main.phrase-islands-admin.ts
?? tsconfig.phrase-admin.json
```

### E — 0 archivos iniciales

Ningún cambio tracked/untracked ajeno identificado.
