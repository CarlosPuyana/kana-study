# Laboratorio P1 de Islas Puyi

Experimento independiente del lector Angular. No hay ruta pública, login simulado o contenido personal. No cambia las 36 frases/MP3 existentes. Los cinco clips de prueba son copias de muestras genéricas Aivis ya públicas, con hash verificado y voz acreditada.

Desde la raíz del repositorio:

```powershell
node experiments/phrase-islands-puyi-p1/server.mjs
```

Abrir <http://127.0.0.1:4441/>. El servidor prepara las muestras/manifiesto/CSS en `.cache/phrase-islands-puyi-p01/`. Requiere Node y el paquete Sass ya instalado por las dependencias del proyecto; no añade paquetes. Ctrl+C detiene un servidor iniciado desde tu consola.

## Comparación

- Por defecto: B, un elemento de audio persistente, A→B→C→D→E→A, silencio 5 s y duración 5 min. Cambiar duración a 10/15/30 no crea otro medio.
- A: crear elemento por clip. Nunca reproduce dos simultáneamente.
- C: fetch/Blob del siguiente; mantiene solo actual+siguiente, libera tardíos tras stop y falla de forma explícita si no puede continuar. No demuestra seguridad/caducidad de un bucket real.
- D: Media Session opt-in, acciones play/pause/stop cuando el navegador las admite. No garantiza que se ejecuten timers con pantalla apagada.
- E: diagnóstico opt-in, **solo A con loop nativo**. No es la escucha del bloque, no añade silencios y puede cortar al vencer. No es una solución aprobada.
- «Prueba corta» permite comprobar plazo en segundos sin esperar cinco minutos. Es instrumental, no una nueva duración del producto.

Pausa conserva fase y tiempo activo; el reloj incluye carga/silencios, excluye pausas manuales y externas notificadas. Al vencer, no empieza otro clip; puede terminar el actual con margen de 15 s **si JS sigue ejecutándose**. No se garantiza parada precisa durante suspensión; al volver se reconcilia y evita iniciar clips atrasados. El motor rechaza en este piloto clips de más de 15 s; no es una limitación del modelo de datos.

Descargar registro JSON guarda eventos, configuración, capacidades y tiempos en un archivo local. No sube nada. El estado de práctica está en memoria, sin IndexedDB/localStorage/service worker. Los identificadores de eventos son datos técnicos; las etiquetas del laboratorio pasan por su TranslationService local con diccionarios ES/EN/CA propios. No se añaden claves a la aplicación ni se arranca su almacenamiento/auth.

## Pruebas

```powershell
node --test experiments/phrase-islands-puyi-p1/player.test.mjs experiments/phrase-islands-puyi-p1/server.test.mjs
npx tsc --ignoreConfig --strict --noEmit --skipLibCheck --target es2022 experiments/phrase-islands-puyi-p1/puyi-island.model.ts
npx playwright test --config experiments/phrase-islands-puyi-p1/playwright.config.ts
```

Playwright usa Edge disponible en este Windows. Las capturas/medidas van a `.cache/phrase-islands-puyi-p01/`; para conservar una ejecución anterior, pasar `--output RUTA_NUEVA`. Los test físicos no se ejecutan por lanzar Playwright. No generar conversación personal o TTS para repetir estas comprobaciones.

## HTTPS local para iPhone/Lenovo

El usuario confirmó misma Wi‑Fi. Ya hay un conjunto temporal preparado en el área privada; localizarlo con `.cache/phrase-islands-puyi-p01/https-location.json`. `connection.json` contiene URL/token y huella/rutas del certificado, **no debe versionarse**.

```powershell
# Para preparar otro conjunto, indicar una IP privada asignada al PC:
node experiments/phrase-islands-puyi-p1/prepare-https.mjs IP_LAN_DEL_PC
node experiments/phrase-islands-puyi-p1/start-https.mjs
```

El preparador utiliza OpenSSL existente (Git en Windows, o `PUYI_P1_OPENSSL`), genera certificados en una carpeta UUID privada y no instala una CA ni altera firewall. Solo admite LAN privada, TLS y token fuerte. El servidor se cierra en una hora; certificados de un día. No hay túnel, hosting externo ni recursos de pago.

**Antes de abrirlo en el dispositivo:** transferir solo perfil CA/certificado público, comprobar huella, instalar confianza manualmente si el propietario decide hacerlo y retirar esa confianza tras la prueba. No compartir claves privadas. Seguir la [guía de dispositivos](../../docs/phrase-islands-puyi-device-test-plan.md); no ignorar errores TLS. PC y dispositivos deben seguir en la misma red y el PC despierto. No se ha probado aún la conexión física o el firewall desde el teléfono/tablet.

## Privacidad y fuentes

Servidor con lista cerrada de rutas, Range/206 y `no-store`, sin directorios navegables. El token se cambia por cookie Secure/HttpOnly y redirige a URL limpia; logs/eventos no incluyen token/JWT. El certificado/tokens, borrador personal y asignación nominal pendiente están en `.phrase-islands-authoring/puyi/`, ignorado por Git, fuera de las rutas servidas. El laboratorio solo sirve sus cinco MP3 genéricos y la licencia ACML adjunta.

No ejecutar los publicadores I3 para contenidos privados. Modelo, referencias y futuras políticas de servidor: [P0](../../docs/phrase-islands-puyi-security-design.md). Fuentes y alternativas: [investigación](../../docs/phrase-islands-puyi-audio-research.md). Las limitaciones se mantienen aunque una vuelta funcione en Edge.
