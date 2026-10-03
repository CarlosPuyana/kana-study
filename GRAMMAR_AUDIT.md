# GRAMMAR_AUDIT.md

> Documento de referencia obligatorio para cualquier cambio futuro en el módulo de Gramática de Kana Study.
>
> Objetivo: mantener coherencia pedagógica, técnica y visual durante la evolución del curso N5 y posteriores niveles.
>
> Estado de referencia: auditoría posterior a la implementación completa de Temas 00–10, 131 microconceptos, prácticas acumulativas y temas visuales `nora-dark` y `anime`.

---

## 1. Principio general

El módulo de Gramática no debe convertirse en un libro digital con tests de opción múltiple.

La meta es llevar a una persona desde cero hasta una base funcional de JLPT N5 mediante:

1. explicación breve y clara;
2. ejemplos controlados;
3. práctica activa;
4. lectura progresiva;
5. producción;
6. revisión acumulativa;
7. integración final con formatos similares al JLPT.

No existe una lista oficial cerrada de gramática JLPT N5. El curso se construye mediante convergencia entre objetivos oficiales del JLPT y fuentes de referencia previamente contrastadas: Tae Kim / Guide to Japanese, Bunpro, JLPT Sensei y el libro *Watashi no Nihongo* de Sandra Carrascosa Urbán.

La arquitectura debe poder escalar posteriormente a N4, N3, N2 y N1.

---

## 2. Estado general de la auditoría

### Muy bien resuelto

- Roadmap N5.
- Selección de contenidos.
- Orden pedagógico global.
- Tema 01: frase nominal.
- Tema 02: adjetivos.
- Tema 05: forma simple.
- Tema 06: forma て.
- Tema 07: interacción cotidiana.
- Tema 09: experiencia, comparación y cambio.
- Separación de contenidos claramente N4.
- Explicaciones generalmente correctas y comprensibles.
- Prácticas acumulativas por tema.
- Arquitectura data-driven.
- Tests y generación de contenido.

### Necesita mejora

- Tema 00 como vía real para dominar kana.
- Control de vocabulario y kanji por progresión.
- Exceso de fragmentación en 131 pantallas/microlecciones.
- Tema 10 todavía demasiado simplificado respecto al tipo de tareas JLPT.
- Prácticas acumulativas demasiado lineales.
- Falta revisión dirigida por errores.
- Tema Anime demasiado parecido al tema Oscuro.

### Problema prioritario

El sistema de ejercicios actual es casi exclusivamente de opción múltiple.

Aunque existen 243 ejercicios/preguntas, pedagógicamente la mayoría entrenan reconocimiento entre opciones, no producción real.

El curso debe evolucionar desde:

`reconocer → discriminar → ordenar → construir → recordar`

y no quedarse en:

`reconocer entre 3 opciones`.

---

## 3. Decisiones cerradas

Estas decisiones deben considerarse requisitos del producto salvo que se modifique expresamente este documento.

### 3.1 Tema visual Anime 🌸

Se conserva el nombre `Anime 🌸`, pero deja de ser un tema oscuro.

Debe diferenciarse radicalmente de `Dark`.

Dirección visual:

- luminoso;
- inspirado en key visuals / openings modernos de anime;
- azul cielo;
- blanco;
- índigo;
- coral/sakura;
- cyan;
- pequeños acentos cálidos;
- limpio y elegante;
- no infantil;
- no saturado de decoración;
- sin personajes ni imágenes externas.

Paleta de referencia:

```css
--background: #f7fbff;
--background-soft: #eaf4ff;
--surface: #ffffff;
--surface-raised: #fff8e8;
--surface-hover: #e5efff;

--primary: #536dfe;
--primary-hover: #4054d6;
--primary-soft: rgba(83, 109, 254, 0.12);

--accent: #ff5f87;
--accent-secondary: #25bfd0;
--secondary-soft: rgba(255, 95, 135, 0.10);

--text-primary: #20253f;
--text-secondary: #56617e;
--text-muted: #7f89a6;

--border: #ccd9f4;

--success: #159a82;
--warning: #d99520;
--error: #e54868;
```

Puede ajustarse ligeramente si es necesario para contraste.

Debe incorporar también decoración propia sutil mediante gradientes o detalles de superficie para que el cambio de `Dark` a `Anime 🌸` sea evidente incluso sin fijarse en los botones.

---

## 4. Sistema definitivo de ejercicios

El modelo de `GrammarExercise` debe dejar de estar limitado a:

```ts
kind: 'multiple-choice'
```

Tipos objetivo:

```ts
type GrammarExerciseKind =
  | 'multiple-choice'
  | 'sentence-builder'
  | 'sentence-order'
  | 'fill-gap'
  | 'matching'
  | 'detect-error'
  | 'select-segment'
  | 'audio-choice';
```

No todas las lecciones necesitan todos los tipos.

### Prioridad de implementación

Implementar ahora:

1. `multiple-choice`
2. `sentence-builder`
3. `sentence-order`
4. `fill-gap`
5. `detect-error`
6. `select-segment`
7. `matching`

`audio-choice` puede quedar preparado en el modelo, pero no debe convertirse todavía en un sistema de listening completo si requiere audio nuevo o infraestructura adicional.

### Regla pedagógica

Una lección nueva debe intentar avanzar de:

- reconocimiento;
- a manipulación;
- a producción guiada;
- a recuerdo con menos pistas.

No es obligatorio que una misma microlección contenga todas esas fases, pero el tema completo sí debe ofrecer variedad.

---

## 5. Control de vocabulario, kana y kanji

Este requisito estaba definido conceptualmente desde el diseño inicial y todavía no está aplicado de forma estructural.

El curso no debe usar libremente vocabulario o kanji desconocidos.

Cada lección debe poder declarar metadatos como:

```ts
interface GrammarLessonPrerequisites {
  requiredKana?: readonly string[];
  allowedVocabulary?: readonly string[];
  allowedKanji?: readonly string[];
}
```

No es necesario convertirlo en un sistema complejo de desbloqueo todavía.

Su objetivo inicial es:

- documentar qué puede aparecer;
- permitir validaciones;
- evitar ejemplos con dificultad no explicada;
- preparar la progresión futura.

### Regla de autoría

Nunca usar en un ejemplo una dificultad lingüística no presentada previamente salvo que:

- se proporcione lectura;
- se proporcione significado;
- o el elemento sea explícitamente parte de la lección.

### Kanji inicial

En Temas 00–01 se priorizará kana.

Si aparece un kanji todavía no asumible:

- usar furigana si la UI ya lo permite;
- o escribir temporalmente la palabra en kana.

---

## 6. Tema 00 y módulo Kana

Tema 00 no debe intentar sustituir al módulo Kana.

### Gramática Tema 00

- explicar qué son hiragana, katakana y kanji;
- explicar dakuten;
- handakuten;
- ゃゅょ;
- っ pequeña;
- vocales largas;
- pronunciación especial de は / へ / を;
- ofrecer pequeñas comprobaciones.

### Módulo Kana

Debe seguir siendo el lugar principal para dominar lectura y reconocimiento.

Debe existir una llamada clara desde Tema 00 al módulo Kana, por ejemplo:

`Practicar Hiragana` / `Practicar Katakana`.

No bloquear todavía el curso mediante un gate persistente si eso implica nueva arquitectura de progreso.

---

## 7. Agrupación: microconceptos vs sesiones de estudio

Los 131 conceptos actuales se conservan.

No deben eliminarse.

Pero 131 conceptos no deben equivaler necesariamente a 131 sesiones independientes.

Objetivo UX:

aproximadamente 60–75 sesiones de estudio para N5.

La jerarquía ideal será:

```text
Tema
 └─ Lección / sesión
     ├─ microconcepto
     ├─ microconcepto
     ├─ microconcepto
     └─ práctica
```

Los IDs/conceptos existentes pueden mantenerse internamente.

### Ejemplo: Tema 06

En vez de mostrar 14 sesiones completamente separadas:

```text
Sesión 1 · Construir la forma て
  6.1–6.7

Sesión 2 · Conectar acciones
  6.8 + 6.11

Sesión 3 · ～ている
  6.9 + 6.10

Sesión 4 · Peticiones y normas
  6.12–6.14
```

No hace falta ejecutar una migración destructiva de rutas si puede resolverse mediante agrupación visual/data-driven compatible.

---

## 8. Auditoría por temas

### Tema 00 — Fundamentos de escritura

Estado: bueno como introducción, insuficiente para enseñar realmente todo kana.

Mejoras:

- integrar enlaces/práctica con módulo Kana;
- evitar kanji sin lectura;
- retirar progresivamente romaji;
- no convertir Gramática en duplicado del módulo Kana.

### Tema 01 — Frase nominal

Estado: muy bueno.

Mantener especialmente:

- `は` como tema, no como equivalente de “ser”;
- `の` como relación, no solo posesión;
- diferencia `これ` vs `この`.

Mejoras:

- indicar que `tema → información → cierre` es un patrón introductorio, no una ley universal;
- usar ejercicios de construcción y selección de segmentos;
- controlar kanji/furigana.

### Tema 02 — Adjetivos

Estado: muy bueno.

Mantener:

- diferencia い / な;
- excepción きれい;
- irregularidad de いい;
- 好き / 嫌い como descripciones;
- が con gustos/capacidad.

Mejoras:

- visuales para `は` vs `が`;
- ejercicios que identifiquen funciones dentro de la frase;
- más producción.

### Tema 03 — Verbos y partículas

Estado: correcto y completo, pero fragmentado.

Mejoras:

- agrupar formas ます / ません / ました / ませんでした en sesiones;
- ejercicios de conjugación real;
- contraste visual entre に / で / へ;
- no reducir conjugaciones a elegir entre opciones.

### Tema 04 — Existencia, lugar y tiempo

Estado: bueno.

Mantener el contraste:

```text
学校でべんきょうします。
学校に先生がいます。
```

Mejoras:

- contadores y fechas son demasiado densos en una sola unidad;
- dividir la práctica internamente;
- tratar lecturas irregulares mediante repetición en vez de listas.

### Tema 05 — Forma simple y subordinación

Estado: bueno.

Mantener:

- `ない → なかった`;
- adjetivos い sin だ;
- cópula de nombres / adjetivos な;
- explicación contextual de `んです`.

Mejoras:

- enseñar `んです` mediante diálogos;
- añadir construcción de frases relativas;
- más ejercicios sin opciones.

### Tema 06 — Forma て

Estado del contenido: excelente.

Es el tema donde más urge variedad de ejercicios.

Debe incluir transformación real:

```text
のむ → のんで
およぐ → およいで
かえる → かえって
```

con escritura/construcción, no solo selección.

Mantener separación:

- acción en progreso;
- estado resultante.

### Tema 07 — Interacción cotidiana

Estado: muy bueno.

Crear comparación visual entre:

```text
なくてはいけない  = obligación
てはいけない      = prohibición
たほうがいい      = consejo
```

Las variantes `ないと / なきゃ / なくちゃ` deben seguir priorizando reconocimiento.

### Tema 08 — Conectar ideas

Estado: bueno.

Mantener matiz de que `から` vs `ので` no es una oposición absoluta.

Mejoras:

- construir `たり～たり`;
- ejercicios de seleccionar conectores por contexto;
- más lectura breve.

### Tema 09 — Experiencia, comparación y cambio

Estado: muy bueno.

Especialmente importantes:

- experiencia vs evento pasado;
- `なる` vs `する`;
- dirección de `あげる / くれる / もらう`.

Añadir representación visual real:

```text
YO → otra persona : あげる
otra persona → YO : くれる
YO ← otra persona : もらう
```

### Tema 10 — Integración N5

Estado: correcto como prototipo, insuficiente como integración final.

Debe evolucionar hacia tareas similares en estructura al JLPT:

- selección de forma;
- composición de oración;
- gramática dentro de texto;
- lectura corta;
- lectura media;
- información práctica;
- simulacro.

No copiar preguntas oficiales.

Crear contenido original con formatos equivalentes.

Especialmente:

- `sentence composition` debe ser una interacción real de ordenar/construir;
- las lecturas deben ser textos reales, no solo una o dos frases;
- información práctica debe incluir horarios, avisos, menús, planes, carteles, etc.

---

## 9. Prácticas acumulativas

Estado actual:

```text
pregunta
→ responder
→ feedback
→ siguiente
→ puntuación
```

Mejoras requeridas:

### Ahora

- barajar preguntas;
- barajar opciones cuando sea seguro;
- registrar categorías/conceptos fallados durante la ronda;
- mostrar resumen de fallos;
- permitir `Repasar errores`.

### Decisión permanente de producto

Gramática NO utiliza FSRS ni programación espaciada. No hay due, intervalos ni mastery. La revisión utiliza práctica contextual, prácticas acumulativas, registro de errores y repaso voluntario dirigido por dificultades. No se añadirá scheduling espaciado salvo decisión explícita futura. La persistencia definida en el apartado «Progreso persistente V1» reemplaza la antigua previsión de progreso futuro.

---

## 10. Tema 10 y JLPT

La integración final debe aproximarse al tipo de razonamiento del JLPT, no simplemente a preguntas genéricas.

Objetivo:

```text
regla aislada
↓
frase
↓
párrafo
↓
información práctica
↓
tarea integrada
```

El módulo Gramática puede preparar Grammar + Reading.

Una preparación completa para JLPT N5 requerirá además listening.

No afirmar que completar Gramática equivale por sí solo a una preparación completa del examen.

---

## 11. Listening

Pendiente como línea futura.

El módulo de Gramática puede incluir ejercicios auditivos puntuales, pero el listening completo debería tratarse como módulo/capacidad propia.

No añadir ahora una infraestructura grande de audio únicamente por esta auditoría.

---

## 12. Arquitectura

Mantener:

- Angular standalone;
- arquitectura data-driven;
- componentes reutilizables;
- i18n existente;
- temas mediante variables CSS;
- responsive;
- Chrome / Safari;
- sin nuevas dependencias salvo necesidad demostrable.

Evitar:

- una página/componente distinto por concepto;
- duplicación;
- grandes refactors no necesarios;
- reescribir Tema 00/01 sin motivo;
- convertir el contenido en HTML estático difícil de mantener.

---

## 13. Tests que deben existir tras la mejora

Además de los tests actuales:

- todos los exercise kinds válidos renderizan;
- cada exercise kind puede resolverse;
- respuesta correcta/incorrecta y feedback;
- navegación no pierde estado visual incorrectamente;
- los datos no contienen ejercicios con respuesta imposible;
- las prácticas pueden barajarse;
- el resumen de errores refleja los fallos de esa ronda;
- Anime / Nora Dark son ThemePreference válidos;
- el curso conserva todos los conceptos N5 previstos;
- la agrupación visual no elimina conceptos ni rompe rutas existentes.

---

## 14. Prioridad de corrección

Orden obligatorio recomendado:

1. Rediseñar `Anime 🌸`.
2. Ampliar el motor real de ejercicios.
3. Convertir una selección representativa de ejercicios existentes a tipos activos.
4. Añadir control/metadatos de vocabulario y kanji.
5. Mejorar Tema 00 con integración a Kana.
6. Agrupar los 131 microconceptos en sesiones visuales.
7. Mejorar Tema 10.
8. Añadir análisis de errores en prácticas.
9. Auditar de nuevo todo el contenido.
10. Solo después, ampliar cantidad de ejercicios.

---

## 15. Regla para futuras implementaciones

Antes de añadir una nueva función o nivel, comprobar:

- ¿enseña o solo pregunta?
- ¿obliga al alumno a producir en algún momento?
- ¿usa vocabulario/kanji asumible?
- ¿la dificultad procede de la gramática objetivo y no de contenido no enseñado?
- ¿el feedback explica el porqué?
- ¿la actividad es usable en móvil?
- ¿funciona con todos los temas?
- ¿es reutilizable para N4+?
- ¿mantiene la progresión definida en este documento?

Si la respuesta a varias de estas preguntas es “no”, la implementación debe revisarse antes de considerarse terminada.

## 16. Segunda corrección dirigida: estado histórico (actualizado por §17)

Se conservan 131 conceptos, sus rutas, 72 sesiones y 243 ejercicios. Hay 62 sesiones con actividad activa y 10 de reconocimiento declarado, con motivo explícito. Distribución: 146 multiple-choice, 55 fill-gap, 16 sentence-builder, 7 sentence-order, 8 select-segment, 5 matching y 6 detect-error.

La fuente authored adicional es `scripts/grammar-n5-stabilize.mjs`. Cada sesión declara vocabulario previsto; cada microconcepto declara los kanji permitidos según el orden real de sesiones. Los 18 kanji se introducen en 03–05 con ejemplos de lectura, se reutilizan en 06–09 y se retiran ayudas gradualmente en 10. Las lecturas de 10 usan 行・食・本・読・日・円・今; 日本 incluye lectura explícita. Los ejemplos reutilizan FuriganaText; no hay parser nuevo.

`npm run build` ejecuta automáticamente `scripts/audit-grammar-n5.mjs` antes de compilar. Rechaza datos generados obsoletos, caracteres Han fuera de allowedKanji, permisos antes de una introducción con lectura, sesiones productivas sin actividad y reconocimiento sin motivo. `controlledVocabulary` comprueba exclusivamente palabras/lexemas marcados por el autor contra intendedVocabulary; NO segmenta japonés ni afirma auditar automáticamente vocabulario sin marcar. `inlineExplanations` permite únicamente el término exacto y exige lectura y significado; esas explicaciones se muestran en la lección.

Regenerar: `node scripts/complete-grammar-n5.mjs`. Tests de fuentes: `node --test scripts/grammar-n5-generation.test.mjs scripts/grammar-n5-stabilization.test.mjs`.

Los fill-gap mantienen IME e input normal; su banco contextual no ordena la respuesta, contiene distractores y permite insertar en el cursor, repetir kana y borrar. Romaji no se convierte ni se acepta como respuesta final. Navegación: Tema → Sesión → Paso; identificadores y enlaces anteriores permanecen estables.

Anime mantiene su identidad clara; primary pasa a #465be0 y hover a #3548c6 para asegurar AA con texto blanco. `public/supabase-config.js` y `grammar-corrections.patch` quedan ignorados y fuera del índice; se conserva la generación de configuración de producción en el workflow existente.

## 17. Corrección de findings técnicos y editoriales

Se mantienen 131 conceptos, 72 sesiones y 243 ejercicios. Los 55 fill-gap especifican el objetivo y el alcance de la respuesta en kana; se admiten variantes authored de duración, explicación, destino, causa y órdenes naturales. 06.13 construye realmente ～てもいい; 10.9 agrupa `さむいでした` como una única unidad incorrecta. Tema 10 conserva glosas léxicas pero retira la interpretación del aviso y usa distractores relacionados con el texto.

Flujo canónico único: `npm run generate:grammar` (foundation + course → audit + stabilize → validación → generated e i18n), `npm run audit:grammar`, tests Node/generación y tests Angular. El importador HTML queda archivado y bloqueado antes de escribir. No editar generated ni traducir manualmente la copia pedagógica generada: la autoría vive en foundation/course/audit/stabilize. Las traducciones completas EN/CA siguen fuera del alcance actual.

La clasificación deriva del ejercicio más exigente: recognition (selección, detección y asociación), manipulation (ordenar/construir con bloques proporcionados), production (respuesta escrita, con asistencia opcional). Resultado: 22 recognition, 14 manipulation, 36 production. No implica dominio ni recuperación sin pistas. Las 72 agrupaciones se conservan: las siete reglas de て forman una familia sistemática; las sesiones unitarias aíslan objetivos específicos. No se añade un cierre práctico por sesión ni nuevas actividades para uniformar tamaños.

La auditoría comprueba traducciones referenciadas, IDs y sesiones duplicados, cobertura única, referencias de conceptos/soluciones/órdenes/emparejamientos, objetivos de temas e introducciones de práctica, kanji y vocabulario explícitamente declarado. Los previews de tema se validan contra los kanji introducidos en ese tema; las prácticas contra su alcance final. No se infieren palabras ni prerrequisitos gramaticales mediante un parser. Se amplían controles léxicos a 49 ejercicios de concepto y 11 de práctica, incluyendo compañía, fechas y lectura contextual.

Kana assist incorpora formas originales y distractores gramaticales plausibles; ambos sufijos くらい/ぐらい están disponibles. Mantiene cursor, IME y botones móviles. El foco tras comprobar por teclado pasa a Continuar; la interacción de ratón no fuerza ese traslado. El menú móvil incluye foco inicial, ciclo de Tab, contenido de fondo inert, Escape y devolución al activador. El foreground seleccionado usa un token semántico con contraste comprobado en los cinco temas.

Tests editoriales: `node --test scripts/grammar-n5-generation.test.mjs scripts/grammar-n5-stabilization.test.mjs scripts/grammar-editorial.test.mjs`; interacciones/regresiones en `grammar-editorial.spec.ts`. En aquella corrección quedaban pendientes la ampliación de ejercicios, un simulacro representativo completo y el aprendizaje persistente. La ampliación ya figura en los 542 ejercicios actuales; la persistencia se incorpora en la V1 descrita a continuación. El simulacro representativo completo sigue fuera de esta tarea.


## Progreso persistente V1 — decisión de producto (2026-10-03)

- Gramática NO utiliza FSRS ni SpacedRepetitionService. Compleción no significa dominio: todos los ejercicios actuales del microconcepto deben haberse contestado al menos una vez, incluso con errores. No existe nota mínima, mastery ni bloqueo del contenido.
- El registro versionado guarda respuestas por exerciseId y progreso por microconcepto. El estado de las 72 sesiones se deriva de sus lessonIds; el Tema y el Roadmap cuentan sesiones completadas. Los 131 microconceptos y 542 ejercicios N5 permanecen intactos.
- Completed es estable al revisitar. Una actualización del currículo se contrasta con los IDs de los ejercicios actuales, de modo que nuevos ejercicios no se consideran contestados.
- Resume conserva ruta, concepto y el primer ejercicio realmente pendiente, calculado por los IDs actuales y answers. Una respuesta comprobada avanza el pendiente incluso antes de pulsar Continuar. Los huecos de merge y ejercicios nuevos se resuelven por el primer ID sin respuesta; lastExerciseIndex y el índice antiguo no prevalecen. Una visita manual a un concepto parcial usa su primer pendiente aunque el resume global sea otro; un concepto completado abre en cero para repaso voluntario. Continuar prioriza el contenido incompleto guardado, después el primer concepto pendiente en orden curricular, después dificultades y finalmente la práctica del Tema 10. Abrir contenido no inicia su progreso.
- Las dificultades persistentes son marcas por concepto sin calendario. Fallar las activa; los aciertos normales no las borran. /grammar/review ofrece una ronda voluntaria de hasta 12 ejercicios existentes, evita el último fallado si hay alternativas y mezcla los ejercicios mediante el shuffle existente. Solo una ronda terminada con todos los ejercicios seleccionados del concepto correctos limpia su marca.
- Las prácticas de Tema son independientes de la compleción. Se guarda la última ronda completa original; Repasar errores conserva su comportamiento y no sustituye esa puntuación. Sus errores alimentan las mismas dificultades.
- StorageService persiste kana-study.grammar-progress.v1 en el workspace activo, incluido guest. La sincronización usa la infraestructura existente y user_preferences, sin tablas nuevas. El merge puro une conceptos y respuestas por timestamp, conserva completed, y resuelve prácticas, dificultades (incluidas las marcas limpiadas) y resume por updatedAt. La normalización del servicio contrasta siempre los IDs actuales.
- La interfaz muestra señales textuales y símbolos, progreso de compleción y última práctica; no estima retención ni gamifica el aprendizaje.

Validación V1: generate:grammar y audit:grammar correctos; 53 tests Node y 557 tests Angular/Vitest (53 nuevos) correctos; TypeScript app/spec y build correctos. Verificados los flujos de inicio, recarga/resume, compleción con errores, sesiones con varios pasos, sesión grande del Tema 06, práctica completa y Repasar errores, y limpieza de dificultades. Conflictos multidispositivo simulados mediante tests del merge y de SyncService, sin efectuar operaciones reales sobre cuentas cloud. Revisados escritorio (1280 px), móvil (390 px), Light, Dark, Nora, Nora oscuro y Anime. El build mantiene avisos de presupuestos de tamaño; no hay errores de compilación.

Corrección dirigida de progreso: WorkspaceService notifica mediante dataRevision las escrituras efectivas de importación Guest→cuenta; GrammarProgressService observa esta señal sin dependencia circular con StorageService. /grammar/review reconstruye la selección por cambios de dificultades únicamente en intro: sync no reinicia preguntas ni sustituye resultados, y el botón explícito de repaso vuelve a seleccionar contenido actualizado.

Concurrencia cloud: user_preferences y el merge por registros se mantienen. Dos escrituras exactamente simultáneas no constituyen una transacción atómica ni un locking distribuido. Cada dispositivo conserva su copia local; los siguientes pull/merge reconcilian la unión y la devuelven al cloud, de modo que el modelo converge mediante sincronizaciones posteriores. Un test de SyncService simula el overwrite de un snapshot cloud y la reconciliación posterior de ambos dispositivos. No se añaden tablas ni RPC.
