# Incidente: interrupciones periódicas de Gramática

## Causa y reproducción

Se reprodujo una interrupción de la interfaz, no una recarga completa del navegador.
`GrammarAccessService` invalidaba su autorización cada 60.000 ms y al volver al primer
plano. `GrammarAccessShell` aplicaba `hidden` a toda la actividad mientras esperaba
la nueva respuesta. Aunque conservaba la instancia Angular durante una comprobación
normal, retiraba el contenido del layout y podía perderse la posición de lectura.
Si la consulta fallaba o tardaba más de 10 segundos, el shell navegaba a
`/grammar-access`, destruyendo la actividad y su estado transitorio.

Además, el servicio comparaba por referencia el objeto `User` del SDK. Un
`TOKEN_REFRESHED` de la misma cuenta sustituye ese objeto y producía otra falsa
invalidación. El identificador de cuenta y la revisión de activación del workspace
no habían cambiado.

La regresión Playwright que mantiene pendiente la respuesta del minuto falla contra
el servicio original: `.lesson-heading-card` queda oculta. La misma prueba pasa con
la corrección. La reproducción utilizó únicamente una propiedad de aviso inerte
añadida al servicio original para que compilara con el nuevo shell; no alteró su
revalidación. Traza local conservada en `.cache/grammar-stability/baseline-trace.zip`.
Dos pruebas unitarias nuevas también fallaron antes del cambio: revalidación periódica
y sustitución del objeto User de la misma cuenta.

No se identificaron recargas automáticas de la aplicación. Las recargas encontradas
en autenticación/perfil corresponden a acciones explícitas. Los efectos de las páginas
de Gramática, los relojes, las rutas, `WorkspaceService`, `AuthService`,
`StorageService` y los caminos de sincronización se revisaron sin modificar otros módulos.

## Estado expuesto y segunda carrera reproducida

- La ocultación podía desplazar la lectura, incluso sin recrear el componente.
- La salida por un error de red descartaba respuestas sin comprobar, feedback y posición
  del ejercicio, explicaciones desplegadas y la ronda de práctica/repaso en memoria.
  Las respuestas ya persistidas no se borraban deliberadamente.
- Los servicios de progreso V1/V2 recargaban su caché mediante un efecto diferido.
  Se reprodujo una pérdida independiente: hidratar una respuesta recibida de cloud y
  contestar localmente antes del siguiente ciclo Angular guardaba solo una respuesta
  en lugar de las dos. La prueba reproduce el fallo sin `TestBed.tick()` intermedio.

## Corrección

La revalidación sigue ejecutándose periódicamente, en foco/visibilidad, tras un cambio
de autenticación y al recuperar la conexión. Una actividad previamente autorizada
permanece visible y montada mientras se comprueba la misma cuenta/activación.
Un error temporal muestra un aviso específico traducido ES/EN/CA y reintenta; no navega
ni reinicia. No se persiste ninguna autorización offline. Las nuevas entradas siguen
esperando una respuesta positiva del servidor mediante los guards.

Una denegación explícita, un cierre de sesión o un cambio real de workspace siguen
retirando el acceso. La generación de petición y la revisión de activación descartan
respuestas antiguas, incluso A → B → A. Una respuesta posterior al timeout tampoco
puede cambiar el resultado de una comprobación posterior.

El progreso usa el `workspaceStorageSignal` existente: lee la hidratación de manera
síncrona antes de la siguiente mutación. Conserva las dependencias de activación,
revisión de datos e hidratación cloud. No conecta esas revisiones a la inicialización
de la lección. Se mantiene la reconciliación por ejercicio y los contadores existentes;
no se suman snapshots ni se vuelven a emitir respuestas o estadísticas por revalidar.

## Validación

- Regresiones dirigidas iniciales: 351 pruebas de Gramática/acceso/progreso correctas;
  después, 43 pruebas dirigidas adicionales/repetidas incluyen la nueva integración
  y la carrera de hidratación.
- `npm test`, ejecución global final: 3.524/3.524 pruebas, 281/281 archivos.
  La primera ejecución concurrente con compilaciones tuvo un timeout del benchmark de
  backup y un fallo de aislamiento TestBed; la repetición completa pasó sin cambiar
  esos tests ni módulos.
- Playwright de estabilidad: matriz con Chromium de Playwright en escritorio oscuro
  y móvil claro, y WebKit móvil claro. ES/EN/CA, 65 minutos simulados por idioma/tamaño,
  refresco de token del SDK con petición HTTP interceptada, pestaña secundaria,
  eventos de visibilidad/foco, offline/online, respuestas tardías y progreso cloud.
  Se comprueban identidad del nodo, feedback, selección, respuestas, contadores,
  scroll, URL, ausencia de nuevas navegaciones y ausencia de errores de página.
- Práctica, repaso e integración: conservan su borrador/ronda tras cinco minutos
  simulados y retornos de foco. Navegación voluntaria y reentrada conservan el progreso
  confirmado. Una prueba Angular fuerza una revisión real de datos del mismo workspace
  y otra cambia realmente de workspace, sin copiar respuestas a la otra cuenta.
- Las pruebas existentes de acceso cubren Guest, revocación, errores iniciales,
  reintento y cierre de sesión del SDK desde otra pestaña.
  Matriz conjunta final: **36/36 casos** (24 de estabilidad y 12 de acceso), sin reintentos.
  La ejecución adicional con Edge instalado pasó las 16 regresiones de estabilidad,
  pero su cierre de pestaña/contexto se bloqueó en el caso de logout móvil después
  de pasar las aserciones funcionales. Se comprobó ese caso con los navegadores
  distribuidos por Playwright, sin cambiar la aplicación ni relajar sus aserciones.
- `npm run build`: correcto. `npm run build:manga-candidate`: correcto;
  auditoría inicial **707.969 < 750.000 bytes**, límite exclusivo intacto.
  Ambos builds muestran avisos SCSS en archivos no modificados.
- Traducciones sincronizadas y auditoría ES/EN/CA correcta. Capturas de escritorio
  oscuro/móvil claro inspeccionadas sin desbordamiento horizontal.

## Comprobación manual y límites

1. Con una cuenta autorizada, abrir una lección, responder sin continuar y desplegar
   la explicación. Anotar la posición. Esperar varios minutos: no debe parpadear,
   moverse la lectura ni desaparecer la respuesta.
2. Cambiar de pestaña y volver. Desconectar la red durante más de un minuto,
   continuar la actividad y reconectar: debe aparecer el aviso, conservarse el estado
   y desaparecer el aviso cuando se confirme el acceso.
3. Navegar voluntariamente al roadmap y volver: se debe retomar el ejercicio pendiente
   según el progreso confirmado. Probar también práctica, repaso e integración.
4. Cerrar sesión desde otra pestaña o cambiar realmente de cuenta/workspace: debe
   cerrarse el curso previo y sus respuestas no deben aparecer en la otra cuenta.
5. Repetir en Safari/iPhone y Chrome, en ES/EN/CA y ambos temas. La automatización
   usa Chromium y WebKit en Windows; no sustituye una comprobación en Safari/iPhone real.

Las pruebas usan cuentas, tokens y respuestas HTTP sintéticos; no acceden a Supabase
real ni registran contenido privado. No se añadió telemetría de producción.
Una recarga manual/cierre del navegador todavía puede descartar borradores en memoria;
esta corrección conserva la actividad durante refrescos legítimos y fallos temporales,
sin introducir persistencia permanente de rondas antiguas. La continuidad offline se
limita a una autorización ya obtenida en memoria y cesa ante denegación o cambio de
identidad. No se borraron ni restauraron datos de usuario. Sin SQL, commit, push ni despliegue.

Repetir la matriz automatizada con:

```powershell
$env:PLAYWRIGHT_BROWSERS_PATH=Join-Path (Get-Location) '.cache/playwright-browsers'
npx playwright install chromium webkit # Solo la primera vez.
npx playwright test --config playwright.grammar-stability.config.ts
npm test
npm run build
npm run build:manga-candidate
```
