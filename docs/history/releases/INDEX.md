# Lanzamientos Manga × Mazos

[Volver al índice](../../INDEX.md). Los informes conservan su ruta raíz porque son parte de los
comandos, inventarios y procedimientos de rollback preparados. Son registros de cada fase,
no instrucciones para ejecutar promociones. Los resultados de esta tabla son históricos,
no nuevas ejecuciones de REPO-HYGIENE-1.

| Informe | Resultado y alcance de esa fase | Complemento posterior |
| --- | --- | --- |
| [RELEASE-1](../../../MANGA_DECKS_RELEASE_AUDIT.md) | NO-GO: faltaban backup, claridad Guest y candidato; Angular 2023/2023 | 2A cierra C1; 2B cierra C2; 2C prepara C3 |
| [RELEASE-2A](../../../MANGA_DECKS_RELEASE_2A.md) | Backup Guest→Guest vacío, once stores; Angular 2053/2053 | 2B aclara cuenta/Guest; contrato de backup sigue vigente |
| [RELEASE-2B](../../../MANGA_DECKS_RELEASE_2B.md) | C2 local resuelto; Angular 2075/2075; incidencias heredadas documentadas | 2C restringe el candidato público a Guest |
| [RELEASE-2C](../../../MANGA_DECKS_RELEASE_2C.md) | GO condicionado candidato; Angular 2087/2087, 748760 bytes | 3 verifica referencia pública y prepara rollback |
| [RELEASE-3](../../../MANGA_DECKS_RELEASE_3.md) | GO de preparación; 2087 Angular, 42 Playwright, rollback local exacto | Último informe operativo, sin publicación autorizada |

Aceptación funcional comunicada por el propietario: siete comprobaciones en Chrome de escritorio,
26/10/2026; detalles en la checklist. Pendientes actuales: autorización de publicación, soporte
móvil/Safari físico que se anuncie y Supabase Auth real en entorno aislado autorizado. Cloud custom continúa apagado; datos custom de cuenta se conservan pero
no tienen backup portable en esta versión. La aprobación de publicación sigue pendiente.

En [release/](../../../release/) se conservan checklist, notas, parches inversos, propuestas de
commit, baseline público y manifiesto acumulado. Nada se aplica por reorganizar documentación.
Los hashes anteriores de rutas y listados históricos no se regeneran para aparentar otro estado;
el [mapa de movimientos](../../repo-path-map.json) explica las rutas posteriores a higiene.
