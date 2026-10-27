# Hitos históricos de Manga × Mazos

[Índice central](../../INDEX.md) · [Lanzamientos](../releases/INDEX.md) · [DESIGN vigente acumulado](../../../MANGA_DECKS_DESIGN.md).

Estos veinte informes registran lo ocurrido en cada fase. Las cifras se transcriben de sus
informes y **no son nuevas validaciones de higiene**. Los comandos se ejecutan desde la raíz
del repositorio. Los nombres antiguos de documentos/logs en texto o bloques de código se
resuelven con [repo-path-map](../../repo-path-map.json); los enlaces navegables se han actualizado.

| Informe | Qué cubre | Resultado declarado / limitación | Posterior que complementa o sustituye el estado |
| --- | --- | --- | --- |
| [H1](MANGA_DECKS_H1.md) | Fundamentos locales y cierre H1.1 | 1735/1735 en cuatro suites independientes; reloj Stats e interferencia aislados | H3A y RELEASE-3 |
| [H2A](MANGA_DECKS_H2A.md) | Evaluación de motores lingüísticos | Spike experimental; no certifica análisis ni selección automática | H2A1 y H2A2 |
| [H2A1](MANGA_DECKS_H2A1.md) | Validación léxica enriquecida | Evaluación humana independiente pendiente; corpus experimental conservado | H2A2 |
| [H2A2](MANGA_DECKS_H2A2.md) | Entrada, lectura, sentido e identidad | Diseño experimental; generación automática bloqueada | H2BA (confirmación manual), H3A |
| [H2BA](MANGA_DECKS_H2BA.md) | Flujo asistido local | 44/44 dirigidos; elección y confirmación humanas | H2BUX1, H2BUX11 y corrección diccionario |
| [H2BUX1](MANGA_DECKS_H2BUX1.md) | Añadir rápido | 1996/1996 Angular; QA humana pendiente | H2BUX11 y corrección diccionario |
| [H2BUX11](MANGA_DECKS_H2BUX11.md) | Guardado y panel compacto | 2000/2000 Angular; no firma aceptación humana | DICTIONARY_UX_FIX y RELEASE-3 |
| [H2BUX2](MANGA_DECKS_H2BUX2.md) | Traducción híbrida del ejemplo | Bloqueada por compatibilidad persistente; no disponible en tarjetas | No cerrado por los releases locales |
| [H3A](MANGA_DECKS_H3A.md) | Identidad y conocimiento entre mazos | 1791/1791 Angular; sin identidad por coincidencia textual | H3BA y H3BB0/B1 |
| [H3BA](MANGA_DECKS_H3BA.md) | Vocabulario confirmado por volumen | 1918/1918 Angular; no porcentaje de comprensión | H3BB0 y H3BB1 |
| [H3BB0](MANGA_DECKS_H3BB0.md) | Explorador OCR textual | 1943/1943 Angular; coincidencias no certifican identidad léxica | H3BB1 |
| [H3BB1](MANGA_DECKS_H3BB1.md) | Navegación OCR precisa | Completado localmente; línea y rango validados; QA física pendiente | RELEASE-1/2C/3 |
| [H4A](MANGA_DECKS_H4A.md) | Fundamentos de protocolo cloud | PGlite y protocolo local; limitaciones de sesiones/JWT/RLS declaradas | H4A1 |
| [H4A1](MANGA_DECKS_H4A1.md) | PostgreSQL nativo y HTTP/JWT | 1810/1810 Angular; Supabase Auth real pendiente | H4BA y siguientes; pendiente externo sigue abierto |
| [H4BA](MANGA_DECKS_H4BA.md) | Transporte y reconciliación aislados | 1834/1834 Angular; cloud público bloqueado | H4BB |
| [H4BB](MANGA_DECKS_H4BB.md) | Guest y resolución segura | 1857/1857 Angular final; Auth real pendiente | H4BC |
| [H4BC](MANGA_DECKS_H4BC.md) | Durabilidad y límites | 1884/1884 Angular final; incidencia histórica PostgREST no diagnosticada | H4BD1 y H4BD2 |
| [H4BD1](MANGA_DECKS_H4BD1.md) | Protocolo remoto V2 | 1887/1887 Angular; publicación Guest atómica en protocolo; no pública | H4BD2 integra Angular |
| [H4BD2](MANGA_DECKS_H4BD2.md) | Integración Angular V2 | 1895/1895 Angular; 33 nativos y 10 HTTP locales; publicación bloqueada | RELEASE-3 conserva cloud apagado |
| [DICTIONARY_UX_FIX](MANGA_DECKS_DICTIONARY_UX_FIX.md) | Restaurar diccionario y separar creación | 2019/2019 Angular; consulta informativa y acción secundaria | RELEASE-1/2C/3 verifican experiencia aceptada |

Los hitos no forman una secuencia de publicación: H3 y H4 se desarrollaron en ramas de alcance
que después confluyen. Consultar fecha y conclusión del informe, no ordenar solo por su número.
El estado actual de publicación lo fija RELEASE-3, no el NO-GO inicial ni una instrucción antigua
de iniciar la fase siguiente. Ningún informe concede autorización de commit, SQL o despliegue.

Bloqueos que siguen abiertos: evaluación lingüística humana independiente, generación automática
y cobertura certificada, traducción persistida de ejemplo UX2, Supabase Auth real, dispositivos
físicos, retención/purga cloud y límites de portabilidad de cuentas. Los releases locales no
cierran esos hitos por el hecho de tener tests verdes.
