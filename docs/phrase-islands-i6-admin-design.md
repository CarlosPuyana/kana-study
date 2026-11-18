# Islas de frases — I6.1: administración y publicación

17 de noviembre de 2026. **Diseño, sin implementación del editor ni cambios de permisos/datos.** Continúa el [roadmap](phrase-islands-roadmap.md), [catálogo I3](phrase-islands-i3-catalog.md), [sesiones I4](phrase-islands-i4-sessions.md), [diseño I4.1](phrase-islands-i41-session-design.md) y [RUSH I5](phrase-islands-i5-rush.md).

## 1. Recomendación y experiencia real

**Empezar con A: editor local de archivos, Aivis local y publicación versionada mediante Git/GitHub Pages.** La interfaz será Angular en el navegador, con una entrada/build de autoría separado y servido localmente; no una ruta pública que aparente poder escribir en el catálogo.

El administrador abre/importa un borrador, edita y guarda un archivo descargable. Una CLI local importa ese archivo, valida, genera/revisa audio y prepara un candidato de publicación en staging. El operador revisa el diff y lo integra mediante GitHub; el workflow existente construye y despliega. **Guardar, preparar y publicar son acciones distintas y efectivas.** No se declara «publicada» una frase por descargar JSON o generar un MP3.

Esto reutiliza Angular, furigana, traducciones, formatos, Aivis instalado y Git/Pages. No necesita otro login, servidor de escritura, tablas nuevas ni TTS de pago. Requiere el Windows preparado y una persona autorizada en el repositorio. Si el requisito pasa a ser «guardar y publicar desde cualquier dispositivo usando solo la cuenta de Kana Study», A no basta y se justifica B/C.

**La administración de Puyi y el acceso GitHub son autoridades diferentes.** No se presupone que el UUID administrador de la aplicación tenga permisos en el repositorio. Confirmar quién hará la publicación y su acceso es una condición de operación de I6.2; no se ha verificado ni cambiado en esta fase.

## 2. Arquitectura existente reutilizable

| Área | Evidencia inspeccionada | Reutilización y límite |
| --- | --- | --- |
| Auth | `core/services/auth.service.ts`, `supabase-client.service.ts`, `core/config/supabase.config.ts` | Ya existe Supabase Auth con sesión, login, recuperación y configuración pública; no crear otra autenticación para un futuro editor web. |
| Usuarios/workspaces | `core/models/account.model.ts`, `workspace.service.ts` | Guest y `user:<UUID>` separan datos personales; `activationRevision` invalida operaciones. Un workspace no concede permisos editoriales globales. |
| Administración pública | `puyi.service.ts`, `features/puyi/puyi-admin.ts`, migración `202611030001_puyi_public_deck.sql` | Hay una asignación administrativa específica de Puyi y autorización real en servidor. No se encontró un rol administrativo general compartido. |
| Acceso a Gramática | `grammar-access.service.ts`, migración `202610270001_grammar_beta_access.sql` | Permiso de lectura/beta; no autoriza editar contenido público. |
| Formularios | `puyi-admin.ts/html`, `core/models/puyi.model.ts` | Patrones reutilizables de edición, preview, Unicode, duplicados, versión esperada, errores e invalidación por identidad; no copiar sus campos como modelo de frases. |
| Despliegue | `.github/workflows/deploy-pages.yml` | Push a `main` o ejecución manual; tests, TypeScript app/spec, build candidata, artefacto y Pages. Permisos del workflow: `contents: read`, `pages: write`, `id-token: write`. No es una API de escritura para Angular. |
| Entradas/idiomas | `angular.json`, `scripts/compile-i18n.mjs` | Hay precedentes de entradas alternativas y dominio diferido `phraseIslands.*`. Los globs copian `public/` y `src/assets/`: nunca colocar borradores privados ahí. |

### Lo verificado sobre Puyi

`puyi_administrator` admite como máximo una asignación de UUID de `auth.users`, con RLS y privilegios de cliente revocados. `is_puyi_admin()` comprueba en servidor rol autenticado y UUID asignado. No usa email, nombre, preferencias ni un `isAdmin` enviado por el navegador.

Las RPC de escritura vuelven a comprobar ese permiso; la escritura directa de `puyi_cards` está revocada. Hay lectura pública de tarjetas activas y políticas/reservas específicas para fotos en Storage. `PuyiService.admin()` decide presentación e invalida identidades antiguas, pero **la autorización confiable son las RPC/políticas SQL**. Falsificar el signal no concede escritura.

Para B/C se reutilizan Auth y, si el propietario decide que será la misma persona, esa asignación administrativa. Una capacidad específica de Islas puede delegar en la comprobación existente, **dentro de cada operación de servidor**, sin cambiar Puyi. No existe hoy `is_phrase_islands_admin()` y no se amplía silenciosamente el alcance del permiso actual. Tampoco sirven `puyi_save_card` ni `puyi-images`: sus campos y MIME de imagen no admiten este catálogo con ES/EN/CA y MP3.

La documentación oficial distingue [claves públicas y secretas](https://supabase.com/docs/guides/getting-started/api-keys) y explica [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security). Una clave pública no otorga administración; service-role/secretos no deben ir al cliente. A no requiere ninguna clave nueva.

`docs/features/decks/PUYI.md` documenta activación y pruebas remotas anteriores. No se han consultado en I6.1 el UUID administrador, políticas desplegadas hoy, credenciales ni estado remoto autenticado. Se verifica el contrato del repositorio, no una auditoría nueva de producción.

## 3. Comparación de publicación

Valoración técnica basada en lo inspeccionado, no en prototipos nuevos ni tarifas contratadas.

| Criterio | A. Local + Git — recomendada | B. Web + backend existente | C. Mixto web/local |
| --- | --- | --- | --- |
| Guardado | Archivo de borrador importable/exportable y revisiones locales de CLI | Borradores privados en Supabase con control de versión | Formulario web exporta archivos; si necesita continuidad cloud, requiere almacenamiento privado |
| Publicación real | Integración autorizada en Git y workflow actual | RPC publica snapshot inmutable; lector remoto o puente de release hacia Git | Audio local; paquete aprobado entra a Git o a una release remota autorizada |
| Seguridad | SO autoriza archivos locales; GitHub autoriza cambiar/publicar el repositorio | Auth reutilizable, pero nuevas RPC/RLS y permisos de medios | El guard del formulario no basta: GitHub/RPC siguen siendo autoridad de publicación |
| Complejidad | Moderada: editor de archivos y generalización del pipeline | Alta: esquema de borradores/releases, políticas, medios, conflictos y consumo remoto | Media si intercambia archivos; alta si combina persistencia cloud y local |
| Mantenimiento | Un catálogo versionado y el despliegue existente | Backend, versiones, limpieza/huérfanos, cuotas y recuperación | Evitar divergencia entre borrador remoto, exportación local y publicación |
| Coste incremental | CPU/disco/copias y Pages/Actions existentes; sin factura API TTS nueva | Posible DB, Storage y transferencia adicionales; plan actual sin verificar | Como A sin guardado cloud; como B si lo incorpora |
| Compatibilidad/uso | Formulario con input de archivo y descarga; Windows/Git para audio/publicación | Cómodo desde varios equipos tras mayor puesta en marcha; Aivis sigue fuera de Pages | Preparar textos desde otros dispositivos es posible; audio y publicación mantienen pasos externos |

B no se resuelve reutilizando una fila de Puyi: necesitaría almacenamiento privado de borradores/revisiones, releases y medios específicos. Se justificarían migraciones aditivas entonces, **no en I6.2-A**. Actualizar sin despliegue también requeriría sustituir el catálogo estático por un lector de snapshots remotos, con errores/caché y versión fija durante una sesión.

C es una ampliación posible: formulario web con Auth y permiso administrativo existente para la experiencia de administración, descarga del borrador y Aivis/Git locales. Si solo exporta archivos no puede anunciar un «Publicar» web ficticio. Si guarda/escribe en cloud, necesita los controles confiables de B.

## 4. Catálogo actual: compatibilidad y límites reales

En `src/app/data/phrase-islands/` se mantienen tres responsabilidades:

- `phrases.v1.json`: `schemaVersion`, versión de catálogo, ID/tema, japonés, segmentos `{text, reading?}`, lectura, nivel/registro y nueve textos de contenido ES/EN/CA.
- `editorial.v1.json`: estado/revisión, texto y lectura analizada revisados, fecha/checks y alcance de la revisión.
- `audio.v1.json`: revisión/ruta MP3, SHA completo, bytes, duración, frecuencia, voz, motor y hash del modelo.

`phrase-islands-catalog.ts` filtra aprobadas con referencia de audio. **Eso no hace privados los borradores:** cualquier JSON importado puede quedar en el artefacto aunque no se muestre. Los borradores deben estar fuera de los imports y globs públicos. La fuente publicada contendrá solo el snapshot seleccionado, nunca propuestas privadas. Un PR de un repositorio público tampoco es confidencial: llevar a Git únicamente el candidato ya revisado. Si se exige confidencialidad durante revisión por PR, hace falta otra configuración/estrategia; no se ha verificado esa necesidad.

### Adaptaciones obligatorias del pipeline I3

1. `phrase-islands-i3-generate.py` usa caché fija y másteres `<id>.wav`. Reutiliza originales si coinciden texto/hash; cambiar el japonés con el mismo ID falla. Necesita generación selectiva y directorios por revisión/fingerprint, conservando originales.
2. `phrase-islands-i3-publish.py` exige **36 frases**, las recodifica todas y escribe directamente en datos/MP3 públicos. «Publish» prepara archivos locales: no hace Git ni despliega. Debe preparar una release en staging, no sobreescribir el checkout activo.
3. La aprobación actual liga texto y lectura analizada, no todo el contenido localizado. Hay que ligar también segmentos, nueve textos, registro/nivel y medio exacto; una traducción editada invalida revisión aunque el japonés sea idéntico.
4. Verificar consulta y su hash/vínculo con la síntesis, además del WAV; no aceptar métricas editadas como prueba de generación. Conservar versión de herramienta y configuración.
5. `test-phrase-islands-i3.mjs` fija 36, seis por tema y 36 MP3. Debe aceptar altas y medios históricos, manteniendo integridad. También hay cantidades fijas en pruebas de biblioteca/RUSH: separar fixtures del algoritmo y pruebas del catálogo real, no perpetuar 6/12/36.
6. `.cache/` está ignorada: los másteres/consultas allí no son una copia de seguridad duradera. Ofrecer archivo privado recuperable de autoría, sin subirlos a Pages.

Estas adaptaciones son de I6.2; no se implementan ni se ejecutan generadores/publicadores en I6.1.

### IDs y revisiones

Conservar los 36 IDs existentes. En altas reservar `pi-<UUID en minúsculas>`, compatible con los IDs string y rutas actuales; no deducir el siguiente número del array. No cambiar ID por editar/mover de tema ni reutilizar uno retirado.

Separar `schemaVersion` (formato), versión de catálogo (release), `contentRevision` y `audio.revision`. El formato v1 puede mantenerse y una ampliación producir catálogo 1.1.0 sin renombrar los archivos de esquema. Los metadatos compatibles no requieren SQL ni migración de progreso.

MP3 nuevos con ruta inmutable por ID/revisión/hash y SHA completo en manifiesto. El directorio `audio/phrase-islands/v1/` puede mantenerse si el formato sigue igual; no equivale a la revisión individual. Conservar clips anteriores durante rollback/compatibilidad, sin sobrescribir ni borrar por dejar de estar activos.

## 5. Editor propuesto y guardado efectivo

Entrada Angular local con salida separada que Pages no despliega. Pantallas: listado/importación de borradores, formulario y preview, validación/exportación. No lógica en el `App` raíz ni ruta administrativa ficticia en el lector público.

Formulario: seis temáticas actuales; japonés y segmentos manuales de furigana; pestañas ES/EN/CA con natural/estructural/explicación; registro informal/cortés/neutro; N5/N4 orientativo; ID bloqueado, revisión base y estado visibles. Reutilizar `FuriganaText` y patrones del formulario Puyi. ES es referencia estructural; EN/CA no se rellenan copiando ES silenciosamente. Labels mediante `TranslationService` en tres idiomas y dominio de autoría separado; contenido del borrador según su idioma, sin claves arbitrarias de i18n.

**Guardar borrador** descarga JSON y **Abrir borrador** lo importa. Permitir guardar incompletos sin permitir publicarlos. No afirmar «guardado en disco» solo por iniciar una descarga: indicar archivo preparado y permitir comprobarlo/reabrirlo. Avisar de cambios sin guardar al salir. No hace falta API experimental de acceso al filesystem ni servidor local de escritura.

La CLI importa el archivo y guarda una revisión local con sustitución atómica en una carpeta privada/ignorada. Genera la propuesta en staging y deja un recibo recuperable. Así el formulario sí puede guardar y el flujo sí puede publicar, con responsabilidades explícitas.

### Validación en formulario y CLI

- Guardado de borrador incompleto frente a publicación con campos completos, tres idiomas y revisión explícita.
- Tema/nivel/registro permitidos, ID sin colisiones y Unicode válido. Límites iniciales propuestos por puntos de código: japonés/lectura 300, 128 segmentos; por idioma natural 1000, estructural 2000 y explicación 3000; JSON individual hasta 128 KiB. Fijarlos con fixtures, siguiendo el criterio Unicode de Puyi.
- `segments.text` concatena el japonés exacto; lecturas o texto concatenan la lectura visible. Revisar kanji, kana y puntuación; la naturalidad/lectura contextual no se valida solo con una regex.
- Bloquear alta de otro ID con japonés idéntico tras NFC/trim/espacios equivalentes, también entre borradores. Variantes de puntuación/lectura generan aviso revisable. No modificar el japonés visible para eludir errores de audio.
- Texto plano, esquema/propiedades permitidas, sin HTML ejecutable, claves de traducción elegidas por el archivo o URLs arbitrarias de medios.
- La CLI repite comprobaciones; alterar Angular o importar `status: approved` no concede aprobación.

## 6. Flujo para añadir y publicar una frase

```mermaid
flowchart LR
  E[Editor local] -->|Guardar JSON| D[Borrador privado]
  D --> I[CLI: importar y validar]
  I --> R[Revisión ES EN CA y furigana]
  R --> A[Aivis local por revisión]
  A --> V[Escucha y validación MP3]
  V --> S[Snapshot y diff de release]
  S --> G[Integración Git autorizada]
  G --> W[Workflow Pages existente]
  W --> P[Catálogo público]
```

1. Crear/reservar ID, guardar y reabrir borrador. No modificar las 36 publicadas.
2. CLI importa en área privada y registra hashes de archivos base y SHA Git cuando haya base comprometida. Detectar conflictos con la copia actual.
3. Revisión del contenido. Estados privados: borrador → contenido revisado → audio generado → audio validado → listo para publicar; no introducir estos estados en el lector innecesariamente.
4. Generación local selectiva, consulta y WAV originales; escucha y comprobación de lectura. Corregir consulta sin ocultar fallos cambiando engañosamente el texto visible.
5. Validar MP3 y aprobar el conjunto contenido/audio ligado a huellas. La síntesis técnicamente correcta no acredita naturalidad. Mantener el alcance histórico de revisión I3, sin certificar retrospectivamente escucha nativa.
6. Preparar snapshot compatible: tres sidecars, claves ES/EN/CA, dominio diferido, manifiesto/procedencia y solo MP3 finales nuevos. Excluir WAV, pesos, borradores y notas/credenciales privadas.
7. Revisar diff/preview y checks. El operador integra solo los archivos autorizados; no `git add .` ni commit automático de cambios ajenos.
8. El workflow actual despliega tras integrar en `main`. Comprobar versión servida y clip bajo `/kana-study/`; solo entonces registrar publicada con SHA/release/despliegue. Una pestaña abierta conserva su sesión; actualizar al cargar la nueva versión.

Nombres futuros orientativos: `phrase-islands-admin import/validate/generate/review/prepare-release/verify-release`, CLI Node con módulos Python reutilizados. **Todavía no existen.** La publicación final usa Git/GitHub con credenciales del operador fuera del navegador, no un endpoint público.

## 7. Editar, corregir audio y revertir

Editar crea una copia de autoría con mismo ID y revisión nueva. La publicada permanece hasta el siguiente despliegue. Comparar hashes/versiones base de frase y catálogo; una edición concurrente produce conflicto, no sobreescritura silenciosa.

- Traducción/explicación/metadatos: nueva revisión editorial; reutilizar medio solo si japonés, lectura y contrato de síntesis no cambiaron y el hash sigue válido.
- Japonés/lectura o consulta de pronunciación/prosodia: invalidar aprobación de audio y crear otra revisión, aunque el texto visible no cambie. Conservar originales.
- Temática: mismo ID, cambiar `topicId` y recalcular cantidades desde el snapshot.
- Retirada posterior: registrar ID retirado en autoría y excluirlo de otra release, sin reutilizarlo ni borrar sus clips durante esa operación. El primer editor puede limitarse a altas/ediciones.

Fingerprint canónico del contenido completo y fingerprint de síntesis (texto/lectura, consulta, motor/modelo/estilo/parámetros), más hashes WAV/query/MP3 y versión del encoder. Una aprobación liga esas huellas; cambios relevantes exigen revisión de nuevo.

Rollback preferente: preparar un cambio inverso de la release, revisarlo e integrarlo como nueva publicación. Nunca resetear destructivamente el workspace. Un artefacto anterior podría redeplegarse si sigue disponible, sin presumir retención. Conservar medios permite volver a referencias previas sin TTS. No tocar sesiones, progreso ni migraciones de otros módulos; cachés/pestañas abiertas no cambian instantáneamente.

## 8. Audio: navegador frente a equipo local

Se mantiene **AivisSpeech Engine 1.2.0, Aida Shigeru normal**, con artefactos verificados I2/I3 y CPU. Resolver estilo real instalado; no sustituirlo por el índice de AivisHub. Sin versiones dev ni motor alternativo.

WAV/consultas privados por ID/revisión/fingerprint. MP3 mono 80 kbit/s como base, margen −3 dB de I3 y controles de decodificación, duración, pico y comparación WAV. Conservar hashes, parámetros y ACML/procedencia de los artefactos exactos según I3; software open source no implica por sí solo permiso sobre voz/modelo/audio. Copia privada recuperable de autoría, no solo caché.

| Navegador | Fuera del navegador |
| --- | --- |
| Formulario, validación de comodidad, preview/furigana, importar/descargar JSON, escuchar archivo seleccionado | Validación confiable, revisiones en disco, Aivis/FFmpeg, hashes, generación selectiva, preparación de release, Git y despliegue |

[Pages no ejecuta lenguajes de servidor](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site): no puede ejecutar Aivis ni escribir el repositorio desde el formulario. CI recibe MP3 finales validados; no pesos, modelos ni TTS.

## 9. Seguridad y permisos

En A, la autorización compartida de escritura/publicación la verifica **GitHub**. Un usuario normal puede modificar su copia o proponer un fork, pero no publicar el catálogo común sin permiso. El editor no entra al artefacto público ni expone endpoints de escritura; no se presenta un botón oculto como seguridad.

La CLI opera bajo permisos del SO y escribe solo en raíces seleccionadas. Validar IDs/rutas y rechazar traversal/enlaces que escapen del destino. No ejecutar campos importados como shell ni aceptar argumentos libres o descargas remotas arbitrarias. Invocar Python/FFmpeg con argumentos estructurados y parámetros permitidos.

Recomendar reglas de rama/checks y control de despliegue, según las [protecciones documentadas por GitHub](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches). **No se afirma que estén activas**: verificar disponibilidad/plan y configuración antes de publicar. Ningún bool Supabase concede derechos GitHub. No introducir PAT ni service-role en Angular, borradores, manifiestos o assets.

Para B/C con escritura cloud: Auth existente y capacidad/UUID verificados en cada RPC, RLS de borradores privados, lecturas solo publicadas, permisos específicos de medios y control de versión esperada. Descartar operaciones por cambio de identidad/workspace; denegar si el permiso no se confirma. Guards/botones son UX, no autorización. El lector mantiene un snapshot coherente por sesión, sin mezclar versiones de contenido y audio.

## 10. Plan de implementación I6.2 y aceptación

Nombres propuestos, no piezas ya implementadas:

1. **Contratos/fixtures:** `PhraseAdminDraft`, validador puro, fingerprints y manifiesto de release. Borradores incompletos/válidos/duplicados/conflictos y catálogo de 37 frases; conservar regresión de las 36 originales.
2. **Pipeline:** extraer módulos I3, selección por ID/revisión/workdir y preparación en staging. Generalizar límites fijos sin debilitar hashes/revisiones; no regenerar todo ni sobrescribir checkout activo.
3. **Editor:** `src/main.phrase-islands-admin.ts`, feature en `src/app/features/phrase-islands-admin`, formulario/preview y `PhraseDraftFileService`. Reutilizar furigana, idiomas y patrones de Puyi sin su mazo/scheduler. Build/salida separados; sin ruta nueva de administración pública inicialmente.
4. **Autoría:** ID/revisión base, huellas, archivo recuperable y escrituras atómicas; detectar concurrencia. Borradores fuera de assets/Git público. Sin tablas ni stores de usuario nuevos.
5. **Audio/revisión:** guía de comando real y preview; CLI verifica instalación, genera esa revisión, valida y produce checklist/recibo. Aprobación explícita ligada a contenido/medio.
6. **Publicación:** snapshot y traducciones, preview `/kana-study/`, checks de PR y workflow. Añadir auditoría de catálogo/medios al workflow en I6.2, sin TTS en CI; confirmar permisos GitHub/reglas con el propietario. No automatizar push ni confundir guardar con desplegar.
7. **Rollback/operación:** conservar releases/medios, diff inverso, verificar versión servida y documentar copias/recuperación. Los cambios actuales sin comprometer deben preservarse: no asumir que HEAD contiene toda la base I0–I5 ni resetearlos. Preparar una base autorizada y separar cambios ajenos.

Pruebas de aceptación:

- Formulario ES/EN/CA, seis temas, furigana, campos incompletos guardables/no publicables, preview/teclado/responsive/temas.
- Importación hostil, Unicode/límites, duplicados, ID estable y conflictos de base. CLI valida aunque se evada Angular.
- Alta 37 actualiza cantidades sin romper biblioteca, tres modos o RUSH. Fixtures de algoritmo separadas de cantidades del catálogo real.
- Traducción editada invalida revisión y puede reutilizar audio; pronunciación editada conserva originales y cambia revisión/hash. Sin pendientes ni referencias rotas en release.
- MP3 reales/hash/metadata y consultas ligadas a revisión/licencia. Si CI decodifica, provisionar herramienta verificada; no asumir FFmpeg ni instalar modelos allí.
- Flujo completo y rollback en directorio/repositorio de prueba. Solo archivos autorizados en diff; ningún borrador, secreto, máster o modelo en artefacto público.
- Antes de publicación real, comprobar autoridad GitHub con el propietario. Si se elige backend: pruebas negativas de RPC/RLS como anónimo/no administrador, no solo del botón.
- Tests dirigidos, globales, Playwright y build candidata; inicial <750000, lector diferido y sin cambios en FSRS/sincronización/progreso. Una publicación real requiere su acción explícita futura.

**Migraciones de A: ninguna.** B requeriría diseñar migraciones aditivas/Storage y pruebas de permisos, nunca tablas de progreso ni alterar Puyi por comodidad.

## 11. Coste, alcance verificado y cierre

A aprovecha el equipo y despliegue existentes sin consumo nuevo de API TTS de pago. No supone coste total cero: CPU, disco, copias y Pages/Actions dependen del uso/plan. No se han comprobado tarifas/cuotas contratadas ni espacio libre; B/C cloud pueden añadir DB, Storage y transferencia. El mantenimiento principal es revisión lingüística, actualización controlada de herramientas y recuperación de archivos.

No se verificaron administrador remoto real, RLS desplegada hoy, derechos GitHub, protecciones de rama ni retención de artefactos. Sí se inspeccionaron servicios, migraciones, contratos, pipeline y workflow. Las observaciones históricas remotas de Puyi proceden de su documentación.

I6.1 solo añade este informe y actualiza el roadmap. No crea editor, CLI, migraciones, borradores ni audios. Sin SQL, commit, push ni despliegue.

Validación de esta fase: `npm run build` termina correctamente, con los avisos SCSS del estado existente. Enlaces locales y `git diff --check` correctos. Una comparación SHA-256 de los 7939 archivos existentes al comenzar confirma que solo cambian este documento y el roadmap; se preservan código, catálogo, medios y cambios locales previos. No se ejecuta una nueva suite de comportamiento: esta fase modifica únicamente documentación y no implementa comportamiento que probar.
