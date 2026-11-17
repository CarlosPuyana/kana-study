# Islas de frases — roadmap

Nombre provisional. Experiencia de frases japonesas frecuentes para escuchar, hacer shadowing y producir de memoria, accesible desde Mazos pero independiente de sus tarjetas.

## I0 — Esqueleto visual y navegación

Implementado:

- Acceso separado bajo los mazos actuales, sin cambiar sus tarjetas ni sus acciones.
- Ruta hash `#/anki/islands`, componente standalone con carga diferida y regreso a `#/anki` mediante el encabezado compartido.
- Biblioteca demostrativa de seis temáticas. Nombres, descripciones e iconos son datos de presentación locales al componente; no constituyen un catálogo de estudio.
- Selección múltiple mediante botones nativos con `aria-pressed`, indicación textual, marca visual y total anunciado. Enter y Espacio usan el comportamiento nativo de los botones.
- Selección en un signal del componente. Al salir o recargar se descarta; no se conserva por usuario ni workspace.
- Espacio de metadatos en cada temática, actualmente «Próximamente». No hay cantidades inventadas de frases; el único total es el de temáticas seleccionadas por la persona.
- Tres opciones de práctica con botones nativos `disabled`, sin acciones ni sesiones simuladas.
- ES/EN/CA en los JSON de referencia y en un dominio generado diferido (`phrase-islands.generated.ts`), registrado mediante `TranslationService` al entrar en Mazos o Islas. No se añaden sus textos al diccionario inicial.
- Estilos SCSS con variables semánticas existentes, temas claro/oscuro y disposición adaptable.

La nueva página no importa servicios de estudio, FSRS, Undo, sincronización ni escritura de progreso. El compilador de traducciones y la comprobación de carga diferida incluyen el nuevo dominio. La integración no modifica los mecanismos existentes del encabezado común ni de Mazos.

Deliberadamente fuera de I0: catálogo real de frases, audio o reproducción, investigación/selección de proveedor TTS, IA, micrófono, sesiones, gestos de respuesta, atajos de respuesta, estadísticas, progreso, persistencia, nuevos stores/tablas, backend y permisos de administración. No se solicita ningún permiso multimedia.

## I1 — Investigación de TTS japonés, licencias y arquitectura

Investigar proveedores y alternativas, calidad del japonés, licencias de generación/distribución, costes, privacidad y almacenamiento de audio. Definir una arquitectura específica para frases y criterios de aceptación antes de integrar un servicio. No se presupone proveedor, formato ni una nueva dependencia en I0.

## I2 — Prototipo real de audio y validación auditiva

Construir un prototipo acotado con audio real. Validar pronunciación, naturalidad, ritmo y entonación mediante escucha humana; contrastar Chrome y Safari, dispositivos móviles, pausas, repetición y velocidades. No confundir reproducción técnica correcta con calidad lingüística.

## I3 — Catálogo inicial de frases

Definir y revisar contenido con japonés, lectura, español natural, traducción literal y explicación. Establecer temáticas, identificadores y procedencia/licencias reales. La futura cantidad visible se derivará del catálogo aprobado, nunca de los ejemplos visuales de I0.

## I4 — Modos de práctica

- **Escuchar:** listas de frases japonesas con repetición, pausas y velocidades.
- **Shadowing:** escuchar y repetir en voz alta imitando pronunciación, ritmo y entonación.
- **Producción de memoria:** mostrar una frase en español, intentar decirla en japonés y después revelar la respuesta.

Diseñar las sesiones después de validar el catálogo y el audio. No habrá FSRS, repeticiones espaciadas, vencimientos, cuotas diarias ni calificación automática de pronunciación.

## I5 — Autoevaluación RUSH

En Producción de memoria se ofrecerán acciones equivalentes:

| Entrada | «No la sabía» | «La sabía» |
| --- | --- | --- |
| Gesto | Deslizar a la izquierda | Deslizar a la derecha |
| Teclado | Flecha izquierda | Flecha derecha |
| Táctil | Botón «No la sabía» | Botón «La sabía» |

Es autoevaluación de la persona, sin evaluación automática de voz. Los botones serán una alternativa completa a los gestos y el teclado. Estos gestos y atajos **no están implementados en I0**; Enter y Espacio solo activan los botones de selección actuales.

## I6 — Administración de contenido

Definir administración de contenido restringida al administrador, con validación y permisos reales. No habilitar un editor ni permisos ficticios durante I0. Las decisiones de acceso y almacenamiento necesitarán su propia especificación.

## Validación de I0

Pruebas de componente para selección independiente, deselección, metadatos accesibles, traducciones, opciones deshabilitadas, descarte al recrear la página y ausencia de escrituras/apertura de bases de datos en el componente. Playwright focalizado para Mazos → Islas → Mazos, enlaces directos y recarga, teclado/foco, traducciones, contraste y ausencia de desbordamiento en 320/390/1280 px, con claro/oscuro.

Comandos: `npm test`, `npx playwright test --config playwright.phrase-islands.config.ts`, `npm run build` y `npm run build:manga-candidate`. La auditoría candidata debe mantener menos de 750000 bytes iniciales y comprobar que la página y sus traducciones siguen siendo diferidas. Las capturas de la ejecución se guardan en `.cache/phrase-islands/`.
