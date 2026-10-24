# Manga: diccionario informativo y Añadir a Mazos separado

Fecha: 2026-10-24. Corrección limitada a la separación de consulta y creación de tarjetas.

## Causa real y auditoría

El diff de `dictionary-popup.ts` respecto a HEAD muestra que H2B-UX1 introdujo
`quickMode` derivado exclusivamente de gates, contexto y lookup completado. Con los
gates locales habilitados, seleccionar OCR instanciaba inmediatamente MangaDeckReview.
La plantilla colocaba el diccionario en `details.dictionary-details`, cerrado por
defecto. Los datos no habían desaparecido: habían quedado detrás del formulario.
H2B-UX2 no había añadido UI ni campos persistentes; su bloqueo sigue documentado.

Se comparó la plantilla anterior con `git diff`, sin recuperar archivos completos ni
revertir cambios ajenos. Se conserva el contenido informativo anterior: escritura,
lectura, glosas, más significados, interpretaciones, base y razones cuando corresponden,
pestañas Palabra/Contexto/Gramática y En Kana Study con guardado Manga existente.

El lector continúa usando `JapaneseLookupService.lookupSelection/lookupAt`, que consulta
`DictionaryRepository` y JMdict Español local. No se sustituye el servicio por mocks
en producción, ni se hardcodea 大丈夫. El ZIP distribuido contiene estas dos filas:

| Escritura | Lectura | Glosas españolas |
| --- | --- | --- |
| 大丈夫 | だいじょうぶ | estar a salvo; estar bien; OK |
| 大丈夫 | だいじょぶ | estar a salvo; estar bien; OK |

Playwright extrae esas filas directamente de `public/dictionaries/JMdict_spanish.zip`
y las instala en su IndexedDB aislado. La consulta posterior se realiza mediante el
servicio real del lector, no mediante una respuesta simulada de lookup. No se importa
todo el ZIP en cada navegador de prueba; se usan sus filas reales pertinentes. El
volumen OCR de prueba es sintético, no una página de manga publicada.

## Comportamiento recuperado

La consulta abre siempre el diccionario informativo. Los significados se ven sin elegir
lectura/acepción ni abrir Mazos. Más significados expande las alternativas. El acceso
JMdict Español lleva a la biblioteca y su gestión del diccionario. Se mantienen el
guardado de Manga y enlaces de integración existentes, sin cambiar Manga Saved FSRS.

`canAdd` expresa disponibilidad; `quickMode` exige además una petición explícita del
usuario. El botón secundario «＋ Añadir a Mazos» se ubica en En Kana Study. Solo al
pulsarlo se instancia el mismo MangaDeckReview compacto ya existente, con el lookup
real y el contexto/página originales. Para palabras sin entrada también se ofrece
esa acción secundaria; los campos manuales solo aparecen dentro del panel.

Las varias lecturas/acepciones se resuelven en el panel antes de confirmar. No se crean
identidades por coincidencia superficial ni se elige automáticamente entre sentidos.
Cancelar destruye el borrador y vuelve al diccionario, devolviendo el foco al botón.
El cierre general y Escape conservan el comportamiento del lector. Tras guardar,
el callback existente vuelve al lector, anuncia éxito y enfoca la página.

La solicitud de apertura queda ligada al contexto, ubicación y activationRevision del
workspace. Cambiar fuente, comenzar otro lookup o activar otro workspace invalida la
apertura; A→B→A tampoco reactiva un formulario anterior. Cambiar de pestaña conserva
el borrador abierto explícitamente, como antes. Los guards, confirmación individual,
recibos, reintentos y persistencia del servicio asistido se reutilizan sin modificarlos.

No se envían peticiones IA al consultar palabras, abrir/cancelar el panel o guardar.
La traducción del Contexto conserva su acción explícita anterior. No se amplía UX2:
no hay traducción persistida de ejemplos ni formulario de traducción dentro de Palabra.

## Archivos de esta corrección

- `src/app/shared/components/dictionary-popup/dictionary-popup.ts`: estado de apertura
  explícito, diccionario restaurado, acción secundaria y retorno con foco.
- `src/app/shared/components/dictionary-popup/dictionary-popup.scss`: estilos semánticos
  mínimos del botón secundario y enlace al diccionario.
- `src/app/features/manga/manga-deck-review.html`: botón Cancelar que utiliza el output
  existente; no se crea otro formulario ni se modifica el servicio.
- `src/app/features/manga/manga-assistance.spec.ts`: cuatro regresiones nuevas de
  consulta informativa con gates ES/EN/CA, ausencia de apertura/IA e invalidación de ámbito.
- `e2e/manga-decks-assisted.spec.ts`: helpers y recorridos existentes pulsando la acción
  explícita; comprobación de página parametrizada para seguir verificando el contexto real.
- `e2e/manga-quick-add-ux11.spec.ts`: regresión real 大丈夫 ampliada y apertura explícita
  de los restantes recorridos. Se conservan pruebas de errores, duplicados y FSRS.
- `src/assets/i18n/{es,en,ca}.json` y `core.generated.ts`: traducción sincronizada de la
  única etiqueta nueva. Generado mediante `node scripts/compile-i18n.mjs`.
- Este informe y nota de arquitectura en `MANGA_DECKS_DESIGN.md`.

## Regresión de navegador y capturas

El caso real comprueba antes de pulsar Añadir a Mazos: 大丈夫, lectura, todas las glosas
principales, expansión de la otra lectura, enlace a JMdict, pestañas Contexto/Gramática,
ningún formulario/selector de tarjeta, inventario de stores custom idéntico y cero POST.
Después abre por teclado, cancela y comprueba el foco, vuelve a abrir, elige lectura y
sentido explícitamente, guarda y lee la tarjeta/recibo reales en IndexedDB. Estudia con
Good, vuelve a consultar la palabra en otra página y añade contexto a la misma identidad:
una tarjeta, progreso y eventos FSRS idénticos después de esa segunda confirmación.

Capturas locales de referencia y resultado, sin datos personales:

- [Antes: captura local previa, formulario ocupando la consulta](.cache/ux11-before-actual.png).
- [Después: diccionario informativo, escritorio oscuro](.cache/dictionary-ux-informative-desktop-dark.png).
- [Después: diccionario informativo, móvil claro](.cache/dictionary-ux-informative-mobile-light.png).
- [Después: diccionario informativo, estrecho oscuro](.cache/dictionary-ux-informative-narrow-dark.png).
- [Panel abierto explícitamente y acepción revisada, escritorio](.cache/ux11-after-reviewed-desktop-dark.png).
- [Panel abierto explícitamente y acepción revisada, móvil](.cache/ux11-after-reviewed-mobile-light.png).

La captura `ux11-before-actual.png` ya existía antes de esta corrección (18:52 del
2026-10-24) y pertenece al diagnóstico anterior de UX1.1; muestra la regresión local,
no el despliegue antiguo ni todos los detalles del panel compacto posterior.
Las imágenes `ux11-after-*` se generan al abrir expresamente el mismo panel conservado;
sirven para comparar las dos vistas, no como captura nueva del despliegue anterior.
La disposición inicial defectuosa está registrada también en MANGA_DECKS_H2BUX11.md.
Se inspeccionan las imágenes finales: la información principal aparece primero y el
botón secundario queda en En Kana Study, alcanzable mediante el scroll del sheet.
No se altera el límite de altura del diccionario de consulta para promocionar Mazos.

## Validaciones y límites

Resultados finales (2026-10-24):

| Comprobación | Resultado |
| --- | --- |
| Dirigidos iniciales, diccionario/creación/guardado/integración | 117/117, 6 archivos |
| Dirigidos finales, todos los specs Manga + asistido + JapaneseLookup | 275/275, 19 archivos |
| Suite Angular completa, `npm test` | 2019/2019, 196 archivos, exit 0 |
| Playwright, lector y creación asistida | 81/81, 2.2 minutos, tres proyectos, retries 0 |
| TypeScript app y spec, `--noEmit` | Ambos correctos, exit 0 |
| Build Pages con `--base-href /kana-study/ --stats-json` | Correcto, 749.79 kB iniciales frente a 749.67 kB anteriores; límite 750 kB conservado |
| Warnings SCSS | Los mismos cuatro de Grammar: page, practice, lesson y roadmap |
| Grafo de chunks | Localización y explorador conservan carga diferida; fuera de cierre estático de main/Reader |
| Providers y entrypoint de modo manual en Pages | Ausentes de las estadísticas del build |
| `git diff --check` + whitespace de archivos nuevos | Correctos; avisos Git de normalización LF/CRLF, sin errores |

Comandos principales:

```text
npm test -- --include=src/app/features/manga/*.spec.ts --include=src/app/core/services/manga-deck-assisted.spec.ts --include=src/app/core/services/japanese-lookup.service.spec.ts
npx playwright test e2e/manga-decks-assisted.spec.ts e2e/manga-quick-add-ux11.spec.ts --max-failures=3
npm test
npx tsc -p tsconfig.app.json --noEmit
npx tsc -p tsconfig.spec.json --noEmit
npm run build -- --base-href /kana-study/ --stats-json
git diff --check
```

El límite de tres fallos detiene únicamente una ejecución diagnóstica fallida; en la
ejecución final se ejecutaron y pasaron los 81 casos, sin omisiones. Logs locales:
`.cache/dictionary-ux-{directed-final,full,e2e,ts-app,ts-spec,build,diffcheck}.log`.
Comparación SHA-256 con el estado anterior a esta corrección: únicamente cambian los
doce archivos enumerados en el apartado de archivos; ningún archivo eliminado.
Los gates, servicios/repositorios/contratos y fuentes de los módulos protegidos
permanecen idénticos. La suite completa incluye sus regresiones.

Las primeras pruebas de desarrollo detectaron el catálogo generado desactualizado y helpers que todavía asumían
apertura automática o página 2. Se regeneró i18n, se añadió la acción explícita y se
mantuvo la aserción de página correcta parametrizada. Ningún test se omite ni se relaja
para ocultar persistencia; no hay reintentos automáticos de Playwright.

La aceptación visual humana del usuario sigue siendo independiente de los tests.
Las pruebas de navegador cubren Chromium, no una nueva ejecución de Safari. No se
dispone de una captura adicional del despliegue antiguo en este encargo; la comparación
histórica se basa en el código anterior y los artefactos locales descritos.

Los cuatro gates de producción permanecen desactivados. El modo manual local/Guest
se conserva. Sin cambios en scheduler, Stats V2, Japanese 1500, Manga Saved FSRS, SQL,
sincronización ni contratos persistentes. Sin dependencias nuevas, reset, clean,
checkout destructivo, commit, push, despliegue SQL ni comienzo de otro hito.
