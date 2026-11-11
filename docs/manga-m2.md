# Manga M2: RUSH temporal de vocabulario por tomo

## Flujo y reutilización

«Practicar vocabulario» está en el análisis de cada tomo. Abre la ruta diferida
`/manga/practice/:volumeId`. Se reutilizan el índice M1/M1.6, claves, categorías,
frecuencias, lecturas, glosas y referencias originales. No se modifica el
clasificador lingüístico ni se instala otro analizador.

`MangaVocabularyIndexService.cached()` valida el índice contra la revisión del
tomo, metadatos, diccionario y versión de análisis mediante las mismas firmas
que M1. Es una lectura exclusiva de caché: no abre páginas, no invoca análisis
OCR, no escribe índices. Si falta o está obsoleto, se ofrece volver a M1 para
prepararlo. Un índice parcial permite practicar su subconjunto fiable.

Se consultan en modo lectura la proyección de conocimiento y las confirmaciones
existentes. Todas es el filtro predeterminado, por lo que un tomo recién
importado funciona con entradas sin vínculo. Si falla la consulta de
conocimiento se mantienen sin vínculo, sin inventar estados conocidos o
desconocidos, y sigue disponible practicar Todas o Sin vínculo.

## Configuración y selección

- Conocimiento: todas, conocidas, aprendiendo, desconocidas confirmadas,
  sin vínculo y conocidas + aprendiendo.
- Categorías: léxicas (predeterminado), funcionales, ambiguas/sin clasificar
  con respuesta utilizable y todas las elegibles. Se usa la evidencia M1.6.
- Selección: distintas por frecuencia descendente, distintas aleatorias o
  apariciones ponderadas, con repetición de palabras.
- Cantidad: 10, 20, 50 o todas. Se limita a la disponibilidad real.

Cada cambio actualiza el número de tarjetas elegibles, palabras distintas,
apariciones y tamaño efectivo de la sesión. En los modos distintos hay una
tarjeta por clave léxica. En el modo ponderado cada aparición física entra una
vez en una reserva finita que se baraja sin reemplazo. Por tanto, la frecuencia
determina cuántas veces puede repetirse una palabra; «todas» termina al agotar
esa reserva, sin bucles infinitos. No se fusionan homógrafos por grafía.

Las funciones puras `mangaRushPool` y `selectMangaRushCards` producen el conjunto
y las tarjetas, sin escribir ni mutar el índice. El aleatorio se puede inyectar
en pruebas. Los empates de frecuencia usan la clave estable como desempate.

## Elegibilidad y contenido

Se exige una clave M1 coherente con diccionario, secuencia/identificador, lema y
lectura; una palabra japonesa; lectura kana para lemas con kanji; al menos una
glosa textual no vacía/utilizable; y apariciones originales válidas, sin
referencias duplicadas. El rango debe reproducir exactamente la forma encontrada
dentro del contexto y pertenecer a una página del tomo.

Las entradas léxicas predeterminadas usan `isMangaLexicalCandidate`, sin cambios
de clasificación. Las funcionales requieren categoría acreditada. Las entradas
sin categoría o con función ambigua solo entran al seleccionarlas explícitamente
o elegir Todas las elegibles, manteniendo su advertencia de incertidumbre.
No se exige vínculo de conocimiento para ningún grupo.

La interfaz distingue las entradas excluidas por identidad, lectura, significado
o referencia de origen, las que quedan fuera de los filtros y los fragmentos
OCR con identidad no resuelta. Estos fragmentos son incidencias, no tarjetas ni
palabras ficticias. Los motivos de exclusión cuentan entradas, mientras que la
disponibilidad ponderada cuenta apariciones.

Cada tarjeta presenta la forma realmente encontrada y revela todas las glosas
utilizables del diccionario. No se elige una traducción contextual. El ejemplo
japonés es el contexto OCR original, con la aparición resaltada y su página.
Las glosas permanecen en el idioma del diccionario local, aunque la interfaz
se cambie a ES/EN/CA; no se inventan traducciones.

La lectura frontal no mezcla forma flexionada y lectura del lema. Se reutilizan
las reglas existentes para reconstruirla solo cuando hay validación de clase
verbal y una única lectura resultante. Si no puede reconstruirse, se omite esa
lectura frontal y se conserva la del lema en la respuesta. Las lecturas
redundantes se ocultan con la comparación visual M1.5, sin borrar datos.

La respuesta empieza oculta. «La sabía» / «No la sabía» solo funcionan tras
revelarla y son autorregistros, no una corrección objetiva de traducción. La
tarjeta siguiente vuelve a ocultarse. El resumen muestra tarjetas completadas,
palabras distintas y ambos autorregistros, sin cambiar conocimiento.

## Aislamiento y ciclo de vida

`MangaRushSessionService` se provee por componente. Solo tiene señales de memoria
y `WorkspaceService` como dependencia de ámbito; no depende de repositorios,
programadores FSRS, servicios del RUSH compartido, relojes, medallas o estadísticas.
No persiste configuración ni respuestas en localStorage, IndexedDB, sessionStorage
o servidores. Tampoco añade palabras a Mazos.

El inicio toma una copia de las tarjetas. Las valoraciones se asocian a posiciones
de esa copia, por lo que las repeticiones se cuentan como tarjetas diferentes.
Se impide valorar antes de revelar, valorar dos veces la misma posición o actuar
con un ID de tomo distinto. Workspace y revisión de activación actúan como barrera
síncrona, también en cambios A → B → A. Cambiar tomo/workspace descarta la sesión.
Salir, navegar atrás o destruir el componente limpia la memoria. Una recarga
vuelve a configuración y nunca restaura respuestas o un resumen fantasma.

Se reutilizan los patrones visuales de pregunta, revelado y resumen del RUSH
existente, con SCSS semántico propio de Manga. No se usa `RushSessionService`,
porque sus mecanismos de persistencia/medallas no corresponden a esta práctica.
Los botones son nativos, los campos están etiquetados y el foco pasa al revelado,
a la valoración y al resumen al avanzar.

## Límite preparado para una fase contextual posterior

`MangaRushMeaningRequest` reutiliza los modelos de solicitud y localización de
`MangaContextService`. `MangaRushMeaningProvider` declara una frontera futura
para respuestas de diccionario o contextualizadas con procedencia. M2 produce
exclusivamente `kind: 'dictionary', contextualized: false`: no se instancia ni
invoca ese proveedor, `MangaContextService` o el Worker, que no se modifica.

Persisten los límites de M1.6: OCR incompleto, sentidos sin asociación contextual,
etiquetas gramaticales ambiguas y calidad/cobertura del diccionario. Una glosa
local utilizable no equivale a una traducción editorial certificada del bocadillo.
Los cambios de conocimiento desde otra pestaña siguen la política de refresco
del servicio existente. Las tarjetas de una sesión iniciada son una copia fija.

## Verificación

Pruebas puras de filtros, cantidades, orden, aleatoriedad, ponderación finita,
repeticiones, glosas múltiples, categorías M1.6 y exclusiones. Pruebas de servicio
y componente para revelado, autorregistro, doble valoración, cierre, recarga,
cambio de tomo/workspace, fallo del conocimiento y cero escrituras.

La prueba de caché espía apertura de OCR, lectura de páginas y escrituras de
IndexedDB, incluso en fallos e invalidaciones. Playwright importa dos ZIP/Mokuro
sintéticos con filas reales del diccionario, prepara M1 y recorre RUSH completo.
Instrumenta todas las mutaciones de almacenes IDB y localStorage desde el acceso
a RUSH hasta completar prácticas distintas, ponderadas y ambiguas y salir.
También comprueba cero lecturas de páginas/consultas de términos, cero POST,
recarga sin sesión, cambio de tomo/workspace y rechazo de una caché obsoleta.
Se ejercitan ES/EN/CA, claro/oscuro y 320/390/1280 px; capturas inspeccionadas.

Las traducciones M2 se compilan en `manga-rush.generated.ts`, importado solo por
la pantalla diferida. La acción de acceso pertenece al dominio diferido de M1.
Los resultados finales de suite/build y el presupuesto se entregan con el cambio.

Resultado final: 3.018 pruebas correctas en 269 archivos; 3 recorridos Playwright
correctos en Edge para 320/390/1280 px, con ES/EN/CA y ambos temas. El build de
producción es correcto. La auditoría del grafo confirma 749.636 bytes iniciales
(sin crecimiento respecto a M1.6) y que la pantalla, la lógica y las traducciones
M2 quedan diferidas. El chunk propio de la pantalla es de 32.163 bytes, además
de los chunks compartidos reutilizados de Manga. Persisten los avisos SCSS
preexistentes de otras pantallas.

## M2.0.1: navegación y teclado

Las cuatro pantallas de Manga comparten `manga-navigation.scss`, con acciones
discretas, retorno decorativo, hover/focus y altura mínima de 44 px. Las rutas
se conservan, incluido `/more`. El lector reserva una fila secundaria para el
vocabulario y mantiene el título con elipsis y texto completo en su atributo
title, evitando competir con la página en pantallas pequeñas.

Durante una tarjeta activa, Espacio/Enter revelan; 1 registra «No la sabía» y
2 «La sabía», solo tras revelar. Se reutilizan `studyKeyboardAvailable`,
`studyModalOpen` y `StudyPrimaryAction`, sin importar servicios de aprendizaje.
Los controles nativos conservan Enter/Espacio; la directiva bloquea su repetición.
Los números solo se admiten desde el fondo o los botones de estudio propios,
no desde otros controles, campos editables ni modales. Modificadores, IME y
eventos repetidos no ejecutan acciones. Fuera de una tarjeta activa no se
interceptan teclas. Angular elimina el listener declarativo al destruir la vista.
Las barreras de ámbito y la sesión temporal no cambian.

Los botones incluyen indicaciones discretas y `aria-keyshortcuts`; las teclas
se ocultan para punteros táctiles. Las pruebas cubren controles enfocados,
edición, modales, repetición, respuesta oculta, sesión terminada y navegación
real. Se mantienen las comprobaciones de cero escrituras de aprendizaje.

Validación M2.0.1: 3.019 pruebas globales correctas en 269 archivos; nueve recorridos de regresión Playwright correctos y repetición focalizada de Espacio/Enter/1/2 mantenidos en 320/390/1280 px. ES/EN/CA y claro/oscuro comprobados. Build correcto; inicial idéntico de 749.636 bytes y lógica diferida.

## M2.1: consulta contextual explícita

Tras revelar una tarjeta, «Consultar en contexto con IA» invoca el adaptador
`MangaRushMeaningService`, que implementa el puerto preparado en M2. Reutiliza
`MangaContextService.request('translate', ...)` y el endpoint configurado por
`kana-study-manga-assistant`. No se toca el Worker, modelo, prompts ni límites.
El contrato translate admite palabra seleccionada y contexto como evidencia,
sin traducir el bocadillo completo ni elegir sentidos verificados.

Solo se envían la forma encontrada, su indicación de selección, idioma y una
ventana literal del OCR alrededor de su rango (hasta 1.200 unidades). Se respetan
los límites existentes de petición/respuesta. No se envían imágenes, progreso,
workspace, identidad de cuenta ni glosas. El resultado y sus notas se presentan
en una sección distinta, marcada como interpretación generada no verificada;
JMdict, las tarjetas y los autorregistros nunca se sustituyen ni modifican.

No hay llamadas al abrir, revelar, avanzar o importar, ni precargas, lotes o
reintentos automáticos. El botón se bloquea mientras espera y desaparece cuando
ya hay respuesta. Los errores permiten únicamente reintento manual. Si falta un
endpoint seguro se muestra asistencia no configurada. La accesibilidad real se
comprueba al consultar: HTTP, CORS, cuota y salida inválida producen un error
local que conserva todo el funcionamiento JMdict. En desarrollo/pruebas, el
origen debe estar permitido por el Worker; no se cambian sus orígenes admitidos.

Se reutiliza la implementación de caché existente y su máximo de 20 respuestas,
con un namespace RUSH por workspace. No se reutiliza la caché global antigua,
que no contiene evidencia de propietario. La clave incluye endpoint, operación,
palabra/identidad, contexto, tomo/localización e idioma. Workspace e identidad
son únicamente parte de la clave local, no del envío. Los otros consumidores
de MangaContextService mantienen su comportamiento anterior.

El controlador cancela al cambiar tarjeta, idioma, tomo o workspace y al destruir
la vista. Una barrera síncrona adicional comprueba posición/objeto de tarjeta,
propietario y revisión de activación antes de mostrar y antes de guardar. Así,
una respuesta tardía tampoco se almacena si el transporte ignora la cancelación.
La única escritura nueva es la caché de IA del workspace que solicitó la consulta;
no se escriben FSRS, conocimiento, estadísticas, respuestas ni OCR.

Pruebas de adaptador con fetch simulado cubren caché, errores sin retry, ausencia
de configuración, cambio de idioma/tomo/workspace y respuestas tardías. Playwright
intercepta todas las solicitudes `/assist`: cero inferencias reales. Verifica
consentimiento, notas, caché tras recarga y fallo conservando JMdict en los tres
tamaños e idiomas del recorrido. OPTIONS real del endpoint configurado devolvió
204 con CORS para producción; no se realizó ninguna inferencia de comprobación.

Validación M2.1: 3.023 pruebas globales correctas en 270 archivos; tres recorridos Playwright con IA simulada en 320/390/1280 px, ES/EN/CA y ambos temas. Build correcto; arranque sin crecimiento, 749.636 bytes. La integración y las traducciones siguen diferidas. Solo se comprobó OPTIONS del endpoint real, sin inferencias.
