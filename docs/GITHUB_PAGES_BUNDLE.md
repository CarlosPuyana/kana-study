# GitHub Pages: presupuesto inicial

Verificación del 12/11/2026, commit base `541a431` y
[Actions #69](https://github.com/CarlosPuyana/kana-study/actions/runs/43103368323).

## Causa demostrada

La medición local correspondía a `npm run build` (`src/main.ts`). Pages ejecuta
`npm run build:manga-candidate`, con `src/main.manga-candidate.ts`, proveedores
adicionales y otra configuración de salida/base. Son grafos iniciales distintos.

Se exportó el commit a una copia aislada con finales LF de checkout Linux y se
instaló con `npm ci`, Node **24.15.0** y npm **11.12.1**, las versiones de Actions.
La reproducción se ejecutó en Windows: ambos tamaños coinciden exactamente con
las mediciones reportadas, sin atribuir la diferencia al sistema operativo o a
dependencias distintas.

| Entrada | Bytes antes | Resultado anterior |
| --- | ---: | --- |
| Normal | 749883 | 117 bytes de margen |
| Candidata Pages | 750769 | Rechazada: excede el máximo exclusivo |

El delta neto es **886 bytes**. El grafo candidato incorpora
`custom-deck-access.ts` (673 bytes atribuidos) y `manga-candidate.providers.ts`
(239), además de la entrada distinta y pequeños cambios de minificación/chunks.
El archivo público de configuración Supabase es un asset externo, no el origen
del delta de este grafo.

## Corrección

Los textos exclusivos del lector, biblioteca e importación Manga se generan en
`manga-reader.generated.ts`, cargado mediante `import()` antes de activar
`/manga` o `/upload`. Se conservan todos los textos ES/EN/CA. Los títulos de rutas
y las etiquetas usadas por el diccionario compartido, Mazos y el plan diario
permanecen síncronos. Se reutiliza `useStudyCopy`; la carga se comparte, conserva
otros dominios y permite reintentar tras un fallo.

Resultado definitivo del mismo comando de Pages: **704644 bytes**. Reducción:
**46125 bytes**; margen: **45356 bytes**, manteniendo `< 750000`.
La auditoría estricta pasa y confirma los módulos diferidos y la ausencia de
código manual/test en el candidato. Workflow, proveedores de release, lockfile,
presupuesto y `audit-manga-candidate-bundle.mjs` permanecen intactos.

Archivos de producción/documentación modificados:

- `scripts/compile-i18n.mjs`: nuevo dominio; `src/assets/i18n/core.generated.ts`,
  `dictionaries.generated.ts` y nuevo `manga-reader.generated.ts`: generación.
- `src/app/core/services/translation.service.ts`: carga diferida y reutilización.
- `src/app/app.routes.ts`: resolvers de las dos entradas.
- `README.md`: comando, salida candidata y enlace a este diagnóstico.

Pruebas: nuevo `scripts/manga-reader-i18n.test.mjs`,
`manga-translation-routing.spec.ts` y ampliación de `translation-loading.spec.ts`.
Los fixtures de `manga-assistance`, `manga-builtin.page`, `manga-fsrs.page`,
`manga-review.page` y `auth/navigation-ux` preparan la misma carga que el router,
sin retirar aserciones. `learn-weakness-integration.spec.ts` compara el registro
con la tarjeta realmente presentada, incluida su clave e ID: una ronda durable
puede reanudar otra dirección. No cambia código de estudio de Kanji ni FSRS.

## Validación

- Comando real: `npm run build:manga-candidate`, con instalación limpia aislada.
- Pruebas dirigidas de Manga, carga/títulos, navegación y fixture de debilidad;
  tres tests Node de partición de traducciones y compatibilidad Conjugaciones.
- Navegador sobre el artefacto optimizado: ES/EN/CA, 320/390/1280 px,
  claro/oscuro, Inicio → Conjugaciones → biblioteca → lector → importación.
  Inicio y Conjugaciones no solicitan el chunk del lector; sin errores JS ni
  claves sin resolver. Perfiles sintéticos y sin peticiones externas.
- TypeScript app/spec: correcto. Suite global final: **3456/3456**, 277 archivos,
  con Node 24.15.0 y dependencias de `npm ci` (cuatro workers, sin filtros).
- Persisten siete avisos SCSS anteriores; no se ocultan ni se modifican límites.

Evidencias locales en `.cache/pages-ci/`: logs de Actions, checksum del runtime,
instalación, grafos antes/después, build, tests y navegador. No se ha ejecutado
ningún commit, push ni despliegue.
