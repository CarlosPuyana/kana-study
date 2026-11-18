# Islas Puyi — P1: hoja de pruebas físicas

18/11/2026. Objetivos aportados por el usuario: iPhone 17 Pro/Safari y Lenovo Xiaoxin Pad Pro 2025 de 12,7″/Chrome Android. El usuario ha confirmado que ambos pueden estar en la misma Wi‑Fi que el PC. **No se ha manipulado ninguno de los dos dispositivos; todos los resultados físicos siguientes están pendientes.**

## Abrir el laboratorio

**Decisión para P5:** las pruebas físicas se posponen hasta disponer de la web desplegada por HTTPS. La preparación con certificados locales que se documenta abajo pertenece al laboratorio P1. Para la ejecución posterior de P5, usar las muestras genéricas desde la web y registrar continuidad, silencios, vueltas y parada con un cronómetro externo.

En el PC: <http://127.0.0.1:4441/>. Desde otro dispositivo `127.0.0.1` apunta al propio dispositivo, no al PC; utilizar el enlace HTTPS privado preparado.

Se ha preparado una CA local temporal y un certificado TLS para la IP LAN de este PC, **sin instalar confianza global ni cambiar firewall**. Los archivos están únicamente bajo `.phrase-islands-authoring/puyi/p1-https/`. La ruta exacta del conjunto actual se obtiene de `.cache/phrase-islands-puyi-p01/https-location.json`; `connection.json` contiene URL con token, huella SHA-256 y rutas de los certificados. No copiarlo a Git, documentación pública, capturas compartidas o assets.

En PowerShell, para localizar los archivos y el enlace sin inventar otra dirección:

```powershell
$p1Location = Get-Content .cache/phrase-islands-puyi-p01/https-location.json -Raw | ConvertFrom-Json
$p1Connection = Get-Content $p1Location.connection -Raw | ConvertFrom-Json
$p1Connection.rootCertificateSha256
$p1Connection.iphoneCertificateProfile
$p1Connection.rootCertificate
$p1Connection.url # Mostrar solo en tu consola privada y abrir en tus dispositivos.
```

### Confianza manual del certificado

1. Transferir **solo** `iphone-local-ca.mobileconfig` al iPhone y `root-ca.cer` a Android mediante un canal que controles. No transferir `root-ca.key`, `server.key` ni el directorio entero.
2. Contrastar el certificado/huella con el `connection.json` de este PC. El perfil de iPhone contiene únicamente un certificado raíz temporal, sin VPN, cuentas o gestión remota.
3. iPhone: abrir el perfil y revisar sus detalles; instalarlo en Ajustes → General → VPN y gestión de dispositivos (la denominación puede variar). Para certificados instalados manualmente, activar su confianza en General → Información → Ajustes de confianza de certificados. **Este paso cambia la confianza del dispositivo y lo realiza el propietario, no el prototipo.**
4. Lenovo/Android: instalar el `.cer` como certificado CA de usuario en Seguridad/Credenciales; el menú exacto depende de la versión/ZUI. Verificar que Chrome reconoce la cadena y la IP del certificado.
5. Abrir la URL con token de `connection.json` en Safari normal y Chrome. No resolver un error TLS ignorando advertencias: corregir confianza, caducidad o dirección. El acceso autorizado redirige a `/` y deja el token en una cookie Secure/HttpOnly/SameSite=Strict; sin token/cookie devuelve 403.
6. El certificado dura **un día**, el token/servidor LAN **una hora desde el arranque**. Si terminó esa ventana, reiniciar explícitamente; una prueba de 30 min debe empezar con margen suficiente. Si cambió la IP, preparar otro certificado, sin sobrescribir el anterior.
7. Al acabar, retirar la confianza/perfil CA de los dos dispositivos y detener el servidor. El LAN se cierra automáticamente al cabo de una hora mientras el PC siga ejecutándose; si lo arrancas en consola puedes usar Ctrl+C. El servidor abierto desde este chat también se puede detener solicitándolo aquí. No instalar permanentemente esta CA de laboratorio.

Preparar otro conjunto, si fuera necesario:

```powershell
node experiments/phrase-islands-puyi-p1/prepare-https.mjs IP_PRIVADA_ACTUAL_DEL_PC
node experiments/phrase-islands-puyi-p1/start-https.mjs
```

`prepare-https` usa OpenSSL existente (en este Windows, el incluido con Git), crea un directorio UUID nuevo y no instala certificados. Si la IP no pertenece al PC se niega a continuar. El servidor solo admite IP LAN privada explícita + TLS + token aleatorio; no acepta `0.0.0.0` o una dirección pública. Sin HTTP de acceso por LAN ni túnel externo. La IP y token concretos se conservan en el archivo privado, no en este documento.

Si el teléfono no conecta, comprobar misma red, aislamiento Wi‑Fi de invitados, PC encendido y firewall privado. No se ha alterado el firewall automáticamente. Cualquier permiso manual debe limitarse al laboratorio/red privada; no abrir puertos de router ni servicios públicos. Se verificaron desde este PC cadena TLS/hostname con la CA explícita, token, cookie, 403 sin autorización, Range 206 y denegación de rutas privadas. **Eso no demuestra que el iPhone/Lenovo hayan confiado o conectado.**

## Preparación de una ejecución

Rellenar una copia privada de esta hoja, sin nombres de cuenta/credenciales:

| Campo | Valor observado |
| --- | --- |
| ID de ejecución y fecha/hora | Pendiente |
| Dispositivo exacto / versión OS / navegador | Pendiente; no deducir OS del modelo. |
| Safari normal o instalada en inicio / Chrome | Pendiente; registrar por separado. |
| Batería / ahorro / modo silencio / volumen | Pendiente |
| Salida: altavoz, cable, Bluetooth y modelo | Pendiente |
| Red / distancia al PC / pantalla / otras apps | Pendiente |
| Estrategia A/B, prefetch C, Media Session D | Pendiente |
| Duración y silencio seleccionados | Pendiente |
| Hora inicio, pausas manuales, final audible | Pendiente |
| Archivo JSON exportado / observaciones | Pendiente |

Usar exclusivamente muestras A–E genéricas. Pulsar inicio con un gesto explícito. Observar un ciclo visible antes de bloquear. Marcar el momento de una observación y exportar JSON al finalizar/desbloquear. El log no contiene texto personal, JWT, token de entrada o URL firmada; incluye user-agent y tiempos, por lo que también debe guardarse de forma privada.

**Cronómetro externo obligatorio para duración bloqueada:** un evento JS registrado al desbloquear no prueba cuándo cesó el sonido. Registrar último audio realmente oído, A→B y E→A, silencios aproximados y si hubo sonido después del límite. No introducir información de conversaciones personales en grabaciones de prueba.

## Hoja por dispositivo — todo pendiente de ejecución física

Copiar las filas para cada dispositivo. Resultado: PASS / FAIL / NO EJECUTADO, evidencia y condición exacta. Separar las cuatro columnas de audio, no dar un aprobado único ambiguo.

| ID | Acción | Continuidad | Silencio | Vuelta del bloque | Parada/tiempo |
| --- | --- | --- | --- | --- | --- |
| F01 | Primer plano, B, 5 s, 5 min | A→B→C→D→E | Medir cinco pausas | E→A, ≥2 vueltas | Tiempo activo y margen |
| F02 | Bloquear a mitad de A | ¿Se oye B/C? | ¿≈5 s? | ¿E→A sigue? | Medir sin desbloquear |
| F03 | Bloquear justo antes de terminar A | Detectar `ended`/cambio retenido | Medir | Observar | Comparar con reloj externo |
| F04 | Bloquear durante silencio | ¿Arranca siguiente? | ¿Se alarga? | Observar | ¿Termina bloqueado? |
| F05 | Cambiar de app durante audio | Registrar cortes/recuperación | Medir | ≥2 vueltas | Verificar final |
| F06 | Cambiar de app durante silencio | ¿Se pierde el siguiente? | Medir retraso | Observar | Verificar final |
| F07 | Repetir F02/F04 con A (nuevo elemento) | Comparar con B | Medir | Observar | Comparar |
| F08 | Repetir con C (solo siguiente Blob) | ¿Reduce carga? | Separar carga de pausa | Observar | Caducidad/no red no probadas aquí |
| F09 | D activado/desactivado | Controles del sistema presentes | Pausa/reanudación | Observar | ¿Controla reloj de la sesión? |
| F10 | Pausar manualmente 60 s en audio | Reanuda la misma frase | No avanza mientras pausado | Sin duplicados | Final se desplaza 60 s |
| F11 | Pausar 60 s durante silencio | Mantiene siguiente | Conserva silencio restante | Sin saltos | Se excluyen 60 s |
| F12 | Duración vence en silencio | No debe empezar otra frase | Cancela espera | No otra vuelta | Se detiene al plazo si JS corre |
| F13 | Duración vence en frase | Termina la actual | No inicia siguiente | No otra vuelta | Margen observado ≤15 s; si no, FAIL |
| F14 | 10/15/30 min, pantalla bloqueada | Revisar varios puntos | Sin deriva creciente | Varias vueltas | Fin real, no solo después de desbloquear |
| F15 | Bluetooth: conectar/desconectar/reconectar | Ruta, cortes y audio en altavoz | Registrar | Evitar duplicados | ¿Se pausa reloj si llega `pause`? |
| F16 | Llamada/Siri/alarma/otra app de audio | Registrar interrupción | Registrar | Reanudación explícita si procede | ¿Recibió evento de pausa? |
| F17 | Wi‑Fi perdida y recuperada | No saltar frases sin avisar | Carga vs silencio | Reinicio controlado | No bucle ilimitado tras error |
| F18 | Ahorro batería y bloqueo prolongado | Comparar | Medir | Observar | Registro tardío/heartbeat |
| F19 | Desbloquear después del plazo | No inicia clip atrasado | No cadena de recuperación | Sin vuelta nueva | Registrar cuánto sonó de más |
| F20 | Diagnóstico E de loop nativo de A | Solo A | **No representa los silencios** | No es vuelta de bloque | ¿Se detiene bloqueado? No aprobar producto |
| F21 | Navegación/cierre/recarga de pestaña | Debe parar al salir si se ejecuta evento | Sin timer viejo | No auto-restaurar | Nueva sesión requiere inicio |
| F22 | Rotar portrait↔landscape (Lenovo e iPhone) | Sin reinicio | Sin cambio de pausa | Conserva posición | Reloj no se reinicia |
| F23 | Fuera de Wi‑Fi del PC | Registrar pérdida; el laboratorio es LAN | No asumir conexión exterior | No es prueba de Storage | No usar datos personales |
| F24 | PWA instalada, solo como prueba separada | No extrapolar Safari normal | Medir | Observar | Registrar OS y resultado |

La composición corta no tiene caso ejecutable todavía: requiere aprobación si A–D no cumplen. El futuro bucket privado necesita además pruebas de RLS, Range, caducidad/revocación y cambio de cuenta del diseño de seguridad; no se simula que estas muestras HTTP genéricas las validan.

## Criterios de decisión

Para aceptar una estrategia en cada dispositivo: N clips en orden sin ausencias/solapamiento, silencios del orden configurado sin deriva acumulativa y vueltas correctas; pausa manual excluida; ningún clip nuevo tras presupuesto; frase final completa dentro del margen y parada audible verificada con bloqueo. Repetir el caso crítico al menos tres veces y una sesión de 30 min; adjuntar incidencias/interrupciones.

Un éxito en primer plano no aprueba segundo plano. Un bucle que no se detiene tampoco aprueba P5. Si cualquiera falla, documentar versión, condición y cuatro resultados por separado, conservar JSON y consultar al usuario sobre ciclo corto, playlist nativa u otro alcance. No bajar silenciosamente el requisito ni prometer una garantía universal para todas las versiones de iOS/Android.
