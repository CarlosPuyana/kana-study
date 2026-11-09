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
- Para el catálogo y selección local del nuevo módulo: [Conjugaciones, fase 1](features/conjugations/CONJUGATIONS_MODULE_PHASE_1.md).
- Para practicar adjetivos con respuestas explícitas y estadísticas locales: [Conjugaciones, fase 2](features/conjugations/CONJUGATIONS_ADJECTIVES_PHASE_2.md).
- Para la navegación Más y los verbos de Conjugaciones: [Más y verbos, fase 3](features/conjugations/CONJUGATIONS_VERBS_PHASE_3.md).
- Para modificar Manga × Mazos: [DESIGN acumulado](../MANGA_DECKS_DESIGN.md), sección más
  reciente aplicable; [historial por hito](history/manga-decks/INDEX.md) y [guía manual](../MANGA_DECKS_MANUAL_TESTING.md).
- Para desarrollar/verificar: [guía de herramientas y evidencias](guides/DEVELOPMENT.md).
- Para contabilización activa, visibilidad y suspensión: [tiempo de estudio anti-AFK V2](features/study/STUDY_TIME_ANTI_AFK_V2.md).
- Para escribir documentación: [CONTRIBUTING-DOCS](CONTRIBUTING-DOCS.md).

- Para Aprender, teclado y diálogos Kana/Kanji/Vocabulario: [guía de UX de aprendizaje](features/LEARNING_UX.md).
- Para el layout local de Escritura Kana: [rediseño responsive](features/kana/KANA_WRITING_RESPONSIVE_REDESIGN.md).
- Para la relación entre selección y lienzo Kana: [auditoría de selección](features/kana/KANA_WRITING_SELECTION_AUDIT.md).
- Para estudiar Vocabulario con respuestas compactas según dirección: [layout de Aprender](features/vocabulary/VOCABULARY_PLAY_COMPACT_LAYOUT.md).
- Para las listas finales de Kanji/Vocabulario: [contenido de la sesión terminada](features/LEARNING_SESSION_LIST.md).
- Para Tarjetas de Mazos y su finalización: [Por Tiempo y resumen del aprendizaje](features/decks/DECK_TIME_AND_LEARNING_SUMMARY.md).
- Para evolución por tarjeta y avisos de almacenamiento: [historial individual](features/decks/DECK_CARD_HISTORY.md).
- Para verificar los controles y diseño de Ajustes de Mazos: [auditoría de Ajustes](features/decks/DECK_SETTINGS_AUDIT.md).
- Para sus correcciones y el mixed persistido: [mejoras de Ajustes](features/decks/DECK_SETTINGS_IMPROVEMENTS.md).
- Para consolidar Vocabulario con dos aciertos y una valoración inicial: [consolidación de la lección](features/vocabulary/VOCABULARY_TWO_SUCCESS_CONSOLIDATION.md).
- Para la selección diaria vigente: [lecciones cortas de 10/15 palabras](features/vocabulary/VOCABULARY_SHORT_DAILY_LESSONS.md).
- Para el historial de la implementación FSRS y los dos RUSH del resultado: [FSRS diario y RUSH de sesión](features/vocabulary/VOCABULARY_FSRS_RUSH_REDESIGN.md).
- Para consultar el resumen y las estadísticas actuales de Vocabulario: [estadísticas avanzadas](features/vocabulary/VOCABULARY_ADVANCED_STATS.md).
- Para verificar los significados españoles y las incidencias pendientes del catálogo: [auditoría lingüística de Vocabulario](features/vocabulary/VOCABULARY_SPANISH_LINGUISTIC_AUDIT.md).
- Para las normalizaciones, los bloqueos EN/CA/identidad y la decisión de cierre: [revisión lingüística final](features/vocabulary/VOCABULARY_LINGUISTIC_FINAL_REVIEW.md).
- Para el diagnóstico histórico de estadísticas de Vocabulario: [auditoría y propuesta](features/vocabulary/VOCABULARY_STATS_AUDIT.md).
- Para comprender FSRS de Vocabulario y Mazos: [auditoría de arquitectura](features/srs/01-ARQUITECTURA-FSRS.md),
  [comparación](features/srs/02-VOCABULARIO-VS-MAZOS.md), [simulaciones](features/srs/03-INTERVALOS-Y-SIMULACIONES.md),
  [hallazgos](features/srs/04-AUDITORIA-Y-MEJORAS.md) y [guía para estudiar](features/srs/05-GUIA-PARA-EL-USUARIO.md).
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
| Mazo Puyi | [Guía y activación segura](features/decks/PUYI.md) | Contenido público, administración por un UUID verificado; Auth/Storage reales pendientes |
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
