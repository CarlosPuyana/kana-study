# Desarrollo y evidencias locales

Ejecutar desde la raíz del repositorio. Véanse [README](../../README.md), [package.json](../../package.json)
y [AGENTS](../../AGENTS.md). Node compatible con engines.node; npm install según README.

| Necesidad | Comando / referencia |
| --- | --- |
| Desarrollo normal | npm start |
| Tests Angular | npm test; para un spec, npm test -- --include=src/...spec.ts |
| TypeScript | npx tsc -p tsconfig.app.json --noEmit; npx tsc -p tsconfig.spec.json --noEmit |
| Build normal Pages apagado | npm run build -- --base-href /kana-study/ |
| Candidato optimizado Guest-only | npm run build:manga-candidate; npm run preview:manga-candidate |
| Recorrido automatizado candidato | npm run test:manga-candidate; perfiles sintéticos, no aceptación humana |
| Auditar documentación | node scripts/audit-repo-docs.mjs --links-only |
| Revisar parches sin aplicarlos al workflow | node scripts/check-manga-promotion-proposal.mjs |
| Validar límite estricto | node scripts/check-manga-release-budget-boundary.mjs |

El preview candidato escucha en 127.0.0.1:4402/kana-study/ con Auth vacío. Utilizar un perfil
normal separado y Guest; crear las tarjetas manualmente. [Checklist completa](../../release/manga-guest-acceptance.md).
El modo manga-manual es una configuración local distinta; no sirve para aceptar o publicar el candidato.

Guardar una nueva pasada en una ruta nueva, por ejemplo:

~~~powershell
New-Item -ItemType Directory -Force .cache/mi-validacion | Out-Null
npm test *> .cache/mi-validacion/angular-01.log
if ($LASTEXITCODE -ne 0) { throw 'Angular falló: revisar el log' }
~~~

No sobrescribir evidencias necesarias del lanzamiento. Ejecutar suites/builds de forma serial para
no introducir contención. Los scripts inspeccionados ya emiten artefactos en .cache/ y Playwright
usa test-results/; stdout se redirige explícitamente por quien ejecute el comando. No hay un
script fuente que genere los 39 logs heredados de raíz.

La auditoría documental comprueba enlaces locales, movimientos/hashes y ausencia de cambios en
fuentes/configuración/proveedores/workflow respecto al inventario local de higiene, si existe.
Fuera de ese entorno sigue comprobando enlaces y destino de los movimientos; no simula disponer
de evidencias ignoradas. Para revisar limitaciones de Supabase, usar [setup](../../SUPABASE_SETUP.md)
y los [informes H4](../history/manga-decks/INDEX.md), sin habilitar cloud ni desplegar SQL.

Tras cambios documentales autorizados posteriores a REPO-HYGIENE-1, usar --links-only para
comprobar enlaces, destinos de movimientos, hashes de documentos trasladados y navegación.
El modo por defecto conserva el check adicional contra el snapshot histórico de higiene,
que no debe sobrescribirse. La integridad del trabajo nuevo se compara con el baseline de
su propia fase, no se presentan como intactos documentos que se han actualizado a propósito.
