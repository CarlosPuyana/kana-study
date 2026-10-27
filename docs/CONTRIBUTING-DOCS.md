# Mantener la documentación

Consultar primero [INDEX](INDEX.md). Cada sistema debe tener una referencia vigente y,
cuando haga falta conservar resultados de una etapa, un informe histórico enlazado.

| Contenido | Destino |
| --- | --- |
| Arquitectura transversal | docs/architecture/ |
| Guía de módulo | docs/features/; subcarpeta si hay varios documentos del mismo módulo |
| Desarrollo y herramientas | docs/guides/ |
| Hitos Manga × Mazos | docs/history/manga-decks/ |
| Índices de lanzamientos | docs/history/releases/ |
| Operación del lanzamiento | release/; mantener los informes RELEASE existentes en raíz por compatibilidad |
| Evidencias regenerables | .cache/<fase>/; Playwright en test-results/ o playwright-report/ |
| Recursos/licencias de fuente | Junto al dato o herramienta que los consume |

Usar nombres descriptivos estables, Markdown UTF-8 y enlaces relativos al archivo que los contiene.
Conservar los identificadores existentes de hitos. Para un hito nuevo, usar su nombre acordado;
no crear un informe nuevo por cada ajuste trivial. Actualizar el documento vigente si solo
cambia una instrucción o una limitación, conservando la evidencia histórica por separado.

Al añadir o mover documentos:

1. Buscar todas sus referencias con rg, incluyendo scripts, tests, configuración y release/.
2. No mover un contrato operativo si rompe promoción, rollback, generadores o licencias.
3. Para documentos versionados usar git mv con rutas explícitas. Nunca reset/clean ni add -A.
4. Actualizar los enlaces y el índice de su categoría; enlazarlo desde INDEX si es una entrada vigente.
5. Registrar ruta/hash si se preserva evidencia; no reescribir resultados históricos.
6. Ejecutar node scripts/audit-repo-docs.mjs y git diff --check. Si cambia una herramienta,
   probarla; si cambia una ruta de compilación, repetir TypeScript/build y presupuesto candidato.

Versionar fuentes, configuración, guías, índices, manifiestos sanitizados y tests reproducibles.
No versionar dist, dependencias, perfiles, tokens, copias privadas, logs o capturas regenerables
sin justificación y revisión. No añadir ignores globales de Markdown/JSON. La regla *.log
preexistente no autoriza borrar ningún fichero ni impide versionar un log explícitamente justificado.

Conservar evidencias necesarias para una aceptación o rollback, en especial RELEASE-MANGA-3:
manifest/baseline/parches de release/, scripts y archivos .cache/release3-* y sus dependencias
release2c*. No limpiar ni deduplicar logs/capturas/perfiles sin autorización específica.
Cuando un resultado nuevo sustituya una conclusión antigua, actualizar el índice y explicar
qué cambió; no alterar el antiguo informe para convertir un fallo en un éxito.

Las pruebas automatizadas no firman aceptación humana ni autorizan publicación.

El modo --links-only del auditor sirve para revisiones posteriores que actualicen contenido
autorizado. Mantiene enlaces, navegación y mapa de movimientos; excluye únicamente comparar
todo el árbol contra el snapshot histórico inmutable de higiene. Registrar un baseline nuevo
de la fase y verificar su scope por separado. No actualizar el snapshot antiguo para forzar un PASS.
