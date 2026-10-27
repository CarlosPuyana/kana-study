# RELEASE-MANGA-3 — Aceptación funcional registrada; publicación pendiente

La aceptación funcional siguiente fue comunicada por el propietario; no la firma un bot.
La autorización de publicación sigue pendiente.
Revisor: __________ Fecha: __________ Navegador/versión/dispositivo: __________
Artefacto/commit candidato revisado: __________ Resultado: __________

## Comunicación del propietario — 26/10/2026

El propietario comunica que ha superado estas siete comprobaciones con el candidato
Guest-only en **Chrome de escritorio**:

- [x] Diccionario.
- [x] Añadir a Mazos.
- [x] FSRS y undo.
- [x] Explorador OCR.
- [x] Backup/restauración.
- [x] Persistencia.
- [x] Interfaz, idiomas y temas.

No se han comunicado versión exacta de Chrome, dispositivo concreto, capturas ni otros
detalles de ejecución. No se inventan. La relación detallada inferior se conserva como
protocolo: sus casillas individuales no se firman automáticamente por esta comunicación
resumida. Safari, Chrome Android físico y Supabase Auth real siguen sin validación.
Esta aceptación funcional no autoriza commit, push ni despliegue.

## Preparación segura

1. Abrir una terminal en `C:\Users\pacam\Desktop\kana-study`.
2. Ejecutar `npm run build:manga-candidate` y comprobar que la auditoría queda por debajo
   de 750.000 bytes. No usar start:manga-manual para aceptar este artefacto.
3. Ejecutar `node scripts/create-manga-release-manual-fixture.mjs`.
4. Ejecutar `npm run preview:manga-candidate`.
5. Crear un perfil de navegador normal separado. Abrir
   `http://127.0.0.1:4402/kana-study/#/manga`. No utilizar el perfil habitual ni borrar sus datos.
6. El preview tiene configuración Auth vacía. No introducir cuentas reales ni modificar
   variables GitHub/Supabase. Las pruebas de cuentas están cubiertas con HTTP controlado;
   el smoke de Auth real requiere otro entorno autorizado y sigue pendiente.

## Flujo Guest prioritario

- [ ] Instalar el diccionario desde la biblioteca y esperar confirmación de instalación.
- [ ] Importar `.cache/release3-manual-volume.cbz`. Es un volumen sintético de una página;
      el generador no crea tarjetas ni modifica almacenamiento del navegador.
- [ ] Activar OCR si estuviera oculto y seleccionar el primer `大丈夫`.
- [ ] Ver inmediatamente palabra, `だいじょうぶ`, glosas españolas y Más significados.
      Confirmar la alternativa `だいじょぶ`; no exigir que las glosas cambien a EN/CA.
- [ ] Comprobar Contexto y Gramática; el diccionario informativo no debe ser sustituido
      automáticamente por un formulario de creación.
- [ ] Pulsar Añadir a Mazos como acción secundaria. Elegir lectura y significado.
      Cancelar debe volver al diccionario; repetir y confirmar debe guardar y regresar al lector.
- [ ] Confirmar también `猫` para dejar otra tarjeta pendiente al probar undo.
- [ ] En Mazos, encontrar el mazo y ambas tarjetas, con identificación Solo local · sin nube.
- [ ] Estudiar una tarjeta con Mostrar respuesta → Bien, deshacer antes de completar el mazo,
      comprobar la tarjeta original y volver a calificar. No exigir undo tras cerrar el día:
      esa restricción ya pertenece al flujo existente y no se ha cambiado.
- [ ] Revisar estadísticas y configuración sin editar parámetros FSRS históricos.
- [ ] Desde el vocabulario del volumen, buscar apariciones de `大丈夫` en OCR y abrir una.
      Confirmar una línea resaltada y rango textual `[0, 3)` para la primera aparición,
      sin cajas ficticias por carácter ni apertura automática del diccionario.

## Protección de progreso

- [ ] Leer el aviso de almacenamiento local y riesgo de pérdida por borrar datos o dispositivo.
- [ ] Abrir Mazos → Datos y progreso y exportar la copia. Guardarla fuera del navegador.
- [ ] Confirmar que el texto explica Guest-only, descarga local, privacidad y exclusión
      de archivos Manga, imágenes, OCR completo y diccionarios.
- [ ] Abrir un segundo perfil normal limpio, en la MISMA URL/origen/puerto, sin crear tarjetas.
- [ ] Restaurar el JSON, revisar vista previa y marcar confirmación; esperar éxito de commit.
- [ ] Recargar, cerrar y reabrir el segundo perfil. Las tarjetas y el progreso siguen disponibles.
- [ ] Continuar estudiando sin el Manga original. Reimportar el CBZ por separado solo si
      se quiere disponer de imágenes; no esperar que un título similar fusione identidades.
- [ ] Intentar restaurar otra vez en el destino ocupado y confirmar rechazo sin sobrescritura.
- [ ] No subir el JSON a servidores ni usar el almacenamiento privado como archivo permanente.

## Accesibilidad, idioma y temas

- [ ] Con Tab/Mayús+Tab, recorrer popup/panel, selects y botones con foco visible.
- [ ] Verificar cancelación/Escape y retorno de foco cuando corresponda.
- [ ] En Ajustes elegir Español/English/Català y comprobar avisos y controles en los tres idiomas.
- [ ] Repetir en tema claro y oscuro, escritorio y ancho estrecho, sin controles inalcanzables.
- [ ] Confirmar que no se anuncian traducción persistente del ejemplo, generación automática,
      comprensión lingüística certificada, PWA ni arranque frío sin red.

## Cuenta — SOLO en entorno aislado previamente autorizado

- [ ] Conservar Guest y no ofrecer una migración custom automática al iniciar sesión.
- [ ] Mostrar el ámbito Guest-only y conservación de datos previos de cuenta, sin promesa cloud.
- [ ] Mantener lector, diccionario, Manga Saved, Japanese 1500 y sincronización legacy disponibles.
- [ ] Rechazar creación/edición/estudio custom y backup de cuenta, también por deep links.
- [ ] Cerrar sesión y recuperar Guest exacto; no ver datos de otra cuenta en A/B/A o dos pestañas.
- [ ] Registrar expresamente si se ha probado Supabase Auth real; el SDK con HTTP simulado no basta.

## Plataformas que requieren aceptación humana

| Plataforma | Estado registrado | Revisor / evidencia / incidencias |
| --- | --- | --- |
| Chrome escritorio real | Siete comprobaciones superadas según comunicación del propietario, 26/10/2026 | Versión/dispositivo/evidencias adicionales no comunicados |
| Chrome Android físico | No disponible/probado en esta sesión | |
| Safari iOS físico | No disponible/probado en esta sesión | |
| Safari macOS | No disponible/probado en esta sesión Windows | |

Chromium con viewport móvil no es Chrome Android ni Safari. Las cuotas, evicción y modo
privado no están garantizados por los tests. Si una plataforma no se prueba, no anunciar
soporte validado para ella. Completar esta tabla antes de decidir el alcance público.

## Aprobación de publicación — NO concedida por este documento

- [ ] Revisados informe, parches, respaldo y procedimiento de rollback.
- [ ] Aceptado el alcance y las limitaciones que se comunicarán a usuarios.
- [ ] Propietario autoriza expresamente el commit/push/promoción concretos.

Firma/aprobación del propietario: __________ Fecha: __________
