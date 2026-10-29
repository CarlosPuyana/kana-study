# Documentación de Kana Study

Entrada principal desde [README](../README.md). Estado documental: 27/10/2026.

## Qué consultar primero

La beta Manga × Mazos Guest-only quedó publicada y verificada en el commit
cdb763a27c6c08580d0ea58f9b4ebc9dc9b79bb5 ([Actions #42](https://github.com/CarlosPuyana/kana-study/actions/runs/40490658798)).
El workflow selecciona manga-candidate: custom/assisted activos, sync/upload apagados.
La entrada normal sigue con los cuatro gates apagados. Supabase Auth real continúa sin
validar, con riesgo aceptado; Safari y móviles físicos siguen pendientes.
UX-1 tiene aceptación manual confirmada y está en el commit 597e9dee6ffbde8ece86060ec7756a8f8ffe6329.
GRAMMAR-ACCESS-1 es un cambio local pendiente de publicación y aplicación SQL. Los informes de RELEASE conservan
el estado de su propia fase, incluida la preparación previa a esa publicación.

- Para decidir una promoción o retirada: [RELEASE-MANGA-3](../MANGA_DECKS_RELEASE_3.md),
  [checklist humana](../release/manga-guest-acceptance.md) y [historia de lanzamiento](history/releases/INDEX.md).
- Para modificar Manga × Mazos: [DESIGN acumulado](../MANGA_DECKS_DESIGN.md), sección más
  reciente aplicable; [historial por hito](history/manga-decks/INDEX.md) y [guía manual](../MANGA_DECKS_MANUAL_TESTING.md).
- Para desarrollar/verificar: [guía de herramientas y evidencias](guides/DEVELOPMENT.md).
- Para escribir documentación: [CONTRIBUTING-DOCS](CONTRIBUTING-DOCS.md).

- Para Aprender, teclado y diálogos Kana/Kanji/Vocabulario: [guía de UX de aprendizaje](features/LEARNING_UX.md).
- Para las listas finales de Kanji/Vocabulario: [contenido de la sesión terminada](features/LEARNING_SESSION_LIST.md).
- Para cerrar y administrar el acceso a Gramática: [beta privada](features/GRAMMAR_ACCESS.md).

## Arquitectura y módulos vigentes

Estas referencias describen sistemas implementados; algunas incluyen antecedentes. El código
y los informes posteriores complementan sus límites. No ejecutar planes antiguos automáticamente.

| Sistema / cambio previsto | Lectura previa | Fuentes y comprobaciones |
| --- | --- | --- |
| Reglas generales | [AGENTS](../AGENTS.md), [README](../README.md) | Angular standalone, SCSS, ES/EN/CA; las instrucciones específicas del trabajo prevalecen |
| Persistencia y rutas | [Persistencia](architecture/PERSISTENCE.md), [Navegación](architecture/NAVIGATION_UX.md) | src/app/core/services y app.routes; hash routing intencional |
| Manga, archivos y OCR | [Lector](features/manga/MANGA_READER.md), [archivos locales](features/manga/LOCAL_MANGA.md) | src/app/features/manga; pruebas reader/ocr/location |
| Manga Saved y FSRS | [FSRS Manga](features/manga/MANGA_FSRS.md), [integración estudio](features/manga/MANGA_STUDY_INTEGRATION.md) | No confundir guardados Manga con mazos custom |
| Manga y Grammar | [Acceso vigente](features/GRAMMAR_ACCESS.md), [integración V1](features/manga/MANGA_GRAMMAR.md) | Referencias del curso solo con permiso; V1 conserva el comportamiento anterior a la beta cerrada |
| Mazos y FSRS | [Práctica intensiva libre](features/decks/DECK_FREE_PRACTICE.md), [Roadmap UX de estudio](features/decks/MAZOS_UX_ROADMAP.md), [Kaishi automático](features/decks/KAISHI_MEDIA_AUTO.md), [activación r2](features/decks/KAISHI_MEDIA_AUTO_ACTIVATION.md), [importación local anterior](features/decks/KAISHI_MEDIA_1.md), [Scheduler vigente](features/decks/SCHEDULER_1.md), [referencia histórica](features/decks/DECK_SCHEDULER.md), [DESIGN](../MANGA_DECKS_DESIGN.md) | Japanese 1500 independiente; historial custom y journal propios |
| Grammar | [Temario](features/grammar/TEMARIO.md), [auditoría original](../GRAMMAR_AUDIT.md) | src/app/features/grammar, datos y scripts audit:i18n/audit:grammar |
| Stats V2 | [Stats V2 / AttemptEvent](features/stats/STATS_V2.md) | Servicios attempt-*; no usar resúmenes de sesión como eventos nuevos |
| Daily, RUSH y feedback | [Daily](features/DAILY_STUDY_V2.md), [RUSH](features/RUSH.md), [atajos unificados](features/RUSH_SHORTCUTS.md), [feedback UX](features/UX_FEEDBACK_V1.md) | Consultar el sistema concreto antes de tocar tiempos/progresión |
| Cuentas y sincronización | [Supabase y contratos](../SUPABASE_SETUP.md), [historia H4](history/manga-decks/INDEX.md) | SQL/transportes experimentales no autorizan despliegue ni activación |

## Historia y estado de lanzamiento

- [Manga × Mazos: veinte informes](history/manga-decks/INDEX.md): alcance, resultado declarado,
  informes posteriores y bloqueos. H2A evalúa lingüística; H4 trata cloud experimental;
  H3B cubre vocabulario/OCR. Su numeración no implica orden temporal de publicación.
- [RELEASE-MANGA-1 → 2A → 2B → 2C → 3](history/releases/INDEX.md): diagnóstico, backup,
  claridad Guest/login, candidato y preparación de promoción/rollback.
- [Artefactos operativos](../release/): parches, baseline público, manifiesto y propuestas de
  commit conservan su ruta. [Notas propuestas](../release/manga-guest-release-notes.md), aún borrador.
- [Informe de organización](REPO_ORGANIZATION_REPORT.md) y [mapa de rutas/hashes](repo-path-map.json).

## Datos, recursos y experimentos

Estos documentos se mantienen junto a sus fuentes, scripts o licencias:

- [Datos japoneses](../src/app/data/README.md), [kanji](../src/app/data/KANJI_DATA.md),
  [vocabulario](../src/app/data/VOCAB_DATA.md).
- [Generar audio](../scripts/generate-vocabulary-audio.md), [POC Kokoro](../scripts/kokoro-japanese-poc.md),
  [licencia de audio](../scripts/vocabulary-audio-license.md), [proveniencia publicada](../public/audio/vocabulary/n5/PROVENANCE.md).
- [Experimento lingüístico H2A](../experiments/manga-morphology-h2a/README.md),
  [anotación independiente pendiente](../experiments/manga-morphology-h2a/corpus-independent/ANNOTATION.md),
  [avisos Kuromoji](../experiments/manga-morphology-h2a/licenses/kuromoji-NOTICE.md).
- [Worker IA](../workers/manga-assistant/README.md), [benchmark](../workers/manga-assistant/BENCHMARK.md),
  [diagnóstico de salida](../workers/manga-assistant/MODEL_OUTPUT_DIAGNOSTIC.md).

## Pruebas, logs y capturas

Los tests fuente están en src/**/*.spec.ts, e2e/ y supabase/tests/. Los verificadores de build,
fronteras y rollback están en scripts/audit-* y scripts/check-*. Consultar los requisitos de
cada arnés; no iniciar servicios remotos para satisfacer una prueba local.

- .cache/release3-* conserva las evidencias de la última preparación; .cache/release2c-* contiene
  también artefactos que R3 reutiliza y vuelve a generar. No interpretar el prefijo como fecha de ejecución.
- .cache/hygiene1/ contiene inventarios antes/después, hashes, referencias antiguas y logs de esta tarea.
- .cache/archive/repo-root-logs/ contiene **39 logs originales** antes dispersos por la raíz, sin borrar contenido.
- test-results/ y playwright-report/ son salidas locales ignoradas de Playwright; dist/ y .angular/ son generados.
- .cache/ contiene además capturas PNG, backups sintéticos privados, perfiles, CBZ y reconstrucciones
  del commit público. No publicarlos ni añadirlos indiscriminadamente a Git.

Los comandos de informes se ejecutan desde la raíz del repositorio, aunque el Markdown se haya
movido. Los nombres antiguos en texto/código histórico son referencias de época, no enlaces
relativos a ejecutar desde docs/. Para localizar cualquiera, usar el mapa de rutas o rg --files docs.
