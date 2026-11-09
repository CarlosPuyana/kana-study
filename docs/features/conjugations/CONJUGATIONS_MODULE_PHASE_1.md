# Conjugaciones — fase 1

Continuación: [entrenador de adjetivos, fase 2](CONJUGATIONS_ADJECTIVES_PHASE_2.md).
El contenido siguiente conserva el alcance y los resultados históricos de la fase 1.

Estado local, 9 de noviembre de 2026. Base de trabajo: `426f33bf52d9740a28884f0b7b43381abc29cea5`.
Sin commit, push, despliegue, SQL ni cuentas remotas. Esta entrega prepara el catálogo y
su selección; no implementa ejercicios ni modifica los sistemas de aprendizaje existentes.

## Objetivo y acceso

**Más → Conjugaciones**, o `/#/conjugations`. Es un módulo independiente de Gramática,
accesible como Guest. La restricción privada de Gramática permanece sin cambios.
El encabezado permite volver a Más.

## Arquitectura

- Ruta `loadComponent`: página standalone en `src/app/features/conjugations/`.
- Contratos en `src/app/core/models/conjugations.model.ts`.
- Catálogo inmutable de metadatos en `src/app/data/conjugations.ts`.
- Selección en `ConjugationSelectionService`, mediante StorageService y WorkspaceService.
- Copia de interfaz en ES/EN/CA, compilada al dominio diferido
  `src/assets/i18n/conjugations.generated.ts`. Solo los dos textos del acceso en Más
  pertenecen al diccionario inicial. Se reutiliza TranslationService sin modificarlo.
- Se incorpora la ruta al inventario estricto `navigation-audit.ts`.

No se construyen repositorios de estudio, sesiones, scheduler, eventos, outbox ni clientes
cloud al seleccionar o solicitar una práctica.

## Catálogo y clasificación

Orden e identificadores estables; 16 categorías verbales, dos adjetivales y dos de cópula.
La dificultad es una orientación de interfaz, no una clasificación JLPT oficial.
Todas tienen disponibilidad `planned`. Los ejemplos son estáticos, no resultados de un motor.

| Orden | ID | Forma | Grupo | Dificultad |
| --- | --- | --- | --- | --- |
| 1 | verb-negative | 〜ない | Verbo | Básica |
| 2 | verb-past | 〜た | Verbo | Básica |
| 3 | verb-negative-past | 〜なかった | Verbo | Básica |
| 4 | verb-te | て形 | Verbo | Básica |
| 5 | verb-continuous | 〜ている | Verbo | Básica |
| 6 | verb-potential | 可能形 | Verbo | Intermedia |
| 7 | verb-passive | 受身形 | Verbo | Intermedia |
| 8 | verb-causative | 使役形 | Verbo | Avanzada |
| 9 | verb-causative-passive | 使役受身形 | Verbo | Avanzada |
| 10 | verb-volitional | 意向形 | Verbo | Intermedia |
| 11 | verb-imperative | 命令形 | Verbo | Avanzada |
| 12 | verb-desire | 〜たい | Verbo | Básica |
| 13 | verb-conditional-ba | 〜ば | Verbo | Intermedia |
| 14 | verb-conditional-tara | 〜たら | Verbo | Intermedia |
| 15 | verb-polite | 丁寧形 | Verbo | Básica |
| 16 | adjective-i | い形容詞 | Adjetivo | Básica |
| 17 | copula-plain | だ | Cópula | Básica |
| 18 | copula-polite | です | Cópula | Básica |
| 19 | adjective-na | な形容詞 | Adjetivo | Básica |
| 20 | verb-prohibitive | 〜な | Verbo | Avanzada |

`です` y `だ` se distinguen de las formas verbales; `〜な` es una prohibición verbal,
no un adjetivo な. `ruleFamily` prepara la separación entre formas simples, て,
voz, modalidad, condicionales, cortesía verbal, adjetivos y cópulas.

## Diseño y tarjetas

Dos columnas en escritorio y una en móvil, con colores semánticos del tema existente.
Cada tarjeta muestra nombre localizado, forma japonesa, ejemplo o descripción, grupo,
dificultad, casilla de mezcla y acción individual. No es un contenedor interactivo con
controles anidados. El recuento de palabras y la mejor racha muestran **Pendiente**;
no se usan ceros ni estimaciones que parezcan datos reales.

El aviso de fase y los botones anuncian que la práctica llegará después. Pulsarlos
actualiza un mensaje accesible, sin crear una sesión, redirigir ni escribir progreso.

## Selección individual, mezcla y filtros

La casilla añade o quita una categoría de la mezcla. La acción individual solicita solo
esa categoría, sin cambiar las casillas. La mezcla requiere al menos una selección.
**Seleccionar las 20** abarca el catálogo completo incluso con un filtro activo;
**Limpiar selección** elimina la selección completa.

Los filtros Todos, Verbos, Adjetivos y Cópula afectan únicamente a la vista. No eliminan
selecciones ocultas; se indica cuántas hay fuera del filtro. No se persiste el filtro
ni el mensaje de práctica pendiente.

## Persistencia y workspaces

Clave lógica `kana-study.conjugation-selection.v1`, con `{version:1,categoryIds:[...]}`.
StorageService utiliza el namespace del workspace activo. Guest, A y B conservan
selecciones separadas, incluso en cambios A→B→A sin lectura intermedia.

Se guardan solo IDs válidos, únicos y en orden de catálogo. JSON inválido o valores
desconocidos no crean categorías. La escritura usa `localOnly:true` y `strict:true`:
no genera operaciones de sincronización. Si falla el almacenamiento se mantiene el
estado anterior y se informa del error; la casilla vuelve al valor realmente guardado.

Esta preferencia local no se añade a los listados existentes de importación Guest,
backup de aprendizaje ni sincronización entre dispositivos. Borrar los datos del
navegador puede borrarla. No se modifica ningún progreso previo.

## Internacionalización y accesibilidad

68 claves de interfaz diferidas y dos de navegación en cada idioma, con paridad de
claves y placeholders. Las formas japonesas usan `lang="ja"`. Se reutilizan encabezado,
botones, radios, casillas nativas, foco visible y mensajes `status`/`alert`.

Se comprobó navegación por teclado y espacio para seleccionar, estados deshabilitados,
áreas interactivas de al menos 44×44 px y ausencia de desbordamiento horizontal.
Los controles se verificaron en claro/oscuro, ES/EN/CA y zoom real del navegador al 125 %.

## Validación

Evidencias regenerables locales en `.cache/conjugations-phase1/`; no se versionan
perfiles, logs, capturas ni artefactos compilados.

| Comprobación | Resultado |
| --- | --- |
| Angular completa, `npm test` | 2518/2518, 243 archivos |
| Dirigidos de catálogo, selección, pantalla, rutas, módulos, navegación y workspace | 52/52, siete archivos |
| Playwright Conjugaciones | 24/24, sin reintentos |
| Viewports | 1920×1080, 1536×864, 1366×768, 1280×720, 390×844, 375×812, 320×800 |
| Zoom real al 125 % | ES, EN y CA; API de zoom del navegador y medición de geometría |
| Candidato estático bajo `/kana-study/` | 1/1; carga diferida, selección, recarga y aviso de práctica |
| Regresiones estáticas de lecciones, estadísticas, Vocabulario/RUSH, Mazos y RUSH | 120/120 |
| Manga candidato | 3/3, escritorio y móvil |
| Navegación y acceso Gramática, comprobación adicional | 33/36; tres fallos del mismo caso de logout entre pestañas, ver limitaciones |
| TypeScript app/spec | Correcto |
| Build normal y candidato | Correctos; presupuestos sin cambios |
| Auditoría FSRS | 67 transiciones correctas, incluidos UTC y DST Madrid |
| i18n y recursos multimedia | Correctos |
| Enlaces de documentación y `git diff --check` | Correctos |

La primera suite detectó la falta de registro de la nueva ruta en el inventario de
navegación. Se añadió la entrada requerida, sin debilitar el test, y la suite completa
pasó. Los contratos de módulos se actualizan para el nuevo módulo disponible.

### Bundles

| Artefacto | Antes | Después | Diferencia |
| --- | ---: | ---: | ---: |
| Inicial normal | 748.018 bytes | 748.513 bytes | +495 bytes |
| Inicial candidato | 748.904 bytes | 749.399 bytes | +495 bytes |

Ambos quedan estrictamente por debajo de 750.000 bytes; margen candidato: 601 bytes.
`node scripts/audit-conjugations-bundle.mjs` recorre el grafo inicial y comprueba que
pantalla, catálogo, servicio de selección y diccionario del módulo están fuera.
El navegador verifica además que el chunk se solicita al entrar, no desde Más.

Tamaño completo del despliegue generado: normal 150.358.330 bytes; candidato
150.358.132 bytes, incluidos los recursos estáticos existentes. No confundir con el
bundle inicial. Permanecen seis warnings SCSS de componentes anteriores (cuatro de
Gramática, Aprender y Vocabulario); ninguno corresponde a Conjugaciones.

Capturas locales: `desktop-es-dark.png`, `mobile-en-light.png`, `narrow-ca-dark.png`
en la carpeta de evidencias; capturas por proyecto y zoom en `browser-results/`.

## Archivos

Nuevos: modelo, catálogo y su spec; servicio de selección y su spec; página TS/HTML/SCSS
y su spec; diccionario generado; tests Node de traducciones; auditor de bundles;
configuración Playwright y `manual-tests/conjugations/`; esta guía.

Modificados: `app.routes.ts` y su spec, modelo y catálogo de módulos y su spec,
inventario `navigation-audit.ts`, SVG de ModuleCard, generador i18n, tres JSON de
idiomas y agregados generados core/dictionaries; índice documental.

No se modifican FSRS, estadísticas, Japanese 1500, Vocabulario, persistencia de
sesiones, sincronización, gates, workflows ni SQL.

## Limitaciones y pendientes

La batería adicional de Gramática reproduce un fallo en el test existente
`e2e/grammar-access.spec.ts`, «SDK logout in another tab closes the open course and
retains stored progress»: no consigue pulsar «Cerrar sesión» en la pestaña secundaria.
Ocurre en los tres tamaños comprobados. No se ha eliminado, omitido ni relajado la
prueba, ni se ha modificado autenticación para forzar su resultado. El resto de los
casos de denegación, revocación y concesión de Gramática pasa. La comprobación completa
de logout entre pestañas permanece pendiente; no se afirma que toda la batería
Playwright del repositorio esté verde ni que el fallo se haya demostrado anterior.
Una prueba diagnóstica local, sin la espera automática de navegación del clic, llegó a
verificar la revocación en la pestaña del curso, pero no finalizó el cierre de la otra
pestaña. Es evidencia parcial, no una prueba pasada ni una causa raíz confirmada.

Las pruebas se realizan en Edge/Chromium local con configuración controlada, no con
cuentas privadas. Safari, dispositivos físicos y Supabase Auth real no se validan.
Los ejemplos no constituyen una revisión lingüística humana independiente.

## Contratos para fase 2

`ConjugationPracticeIntent` transmite modo `single`/`mixed` y una copia de IDs válidos.
No es una sesión ejecutable. El modelo conserva disponibilidad y familia de reglas,
permitiendo implementar después vocabulario real, transformaciones, ejercicios,
respuestas y métricas con su propio diseño y pruebas. No se han creado bancos vacíos,
reglas ficticias, progreso, rachas ni migraciones para anticipar esa fase.
