# Cómo decide Kana Study cuándo volver a mostrar una palabra

La aplicación estima cuánto tiempo puedes recordar cada tarjeta. Si la recuerdas cuando vuelve a tocar,
espacia el siguiente repaso. Si la olvidas, vuelve a enseñártela pronto. Utiliza FSRS-6, un modelo de memoria;
no sabe por sí mismo que 明日 es fácil para ti ni comprende tu dominio del japonés.

## Minutos, mañana y meses

Una tarjeta realmente nueva empieza con pasos cortos: responder Bien suele programar 10 minutos.
Eso no significa que vaya a reaparecer exactamente entonces: la cola y el tipo de sesión también intervienen.
En Mazos puede adelantarse un paso corto al quedarse sin otras tarjetas. En Vocabulario una ronda diaria
puede dejarlo para otro día; practicar libremente no completa ese paso de su historial FSRS.

Tras el aprendizaje inicial, Mazos programa una comprobación para mañana. Mañana significa el siguiente
día de estudio de Madrid, no «dentro de 24 horas». Las tarjetas de repaso están disponibles durante su día
de vencimiento, aunque su fecha interna incluya una hora posterior.

Con varios recuerdos correctos separados por días/semanas, el programa considera que la memoria dura más.
Por eso puede proponer uno, dos o tres meses, incluso sin decenas de repasos. En una simulación de Mazos:
10 minutos → mañana → 3 días → 16 días → 61 días. No es una secuencia universal: tus respuestas,
las fechas, los ajustes y una pequeña variación de distribución cambian los resultados.

«2 meses» es una aproximación: puede significar de 45 a 74 días. «3 meses» puede significar de 75 a 104.
Se conserva una fecha exacta internamente. Una tarjeta nueva no recibe meses en su primera valoración
disponible, pero una palabra que acabas de abrir puede tener historial anterior.

## Qué pulsar

En **Mazos**:

- **Otra vez**: no recordaste correctamente antes de revelar. Vuelve a un paso corto.
- **Bien**: recordaste correctamente antes de revelar. El programa puede ampliar el intervalo.

No elijas Bien solo porque entiendes la respuesta al verla. No hay botones Difícil o Fácil en Mazos.
La tecla 1 es Otra vez; la tecla 2 es Bien.

En **Vocabulario**, autoevaluación:

- **NO**: no lo recordaste; equivale a Otra vez.
- **CASI**: el motor lo interpreta como que lo recordaste con dificultad. Si no llegaste a recordarlo,
  NO comunica mejor lo sucedido. CASI no garantiza que vuelva pronto una palabra ya consolidada.
- **SÍ**: lo recordaste correctamente; equivale a Bien.

Con opciones, acertar se interpreta como Bien y fallar como Otra vez. Reconocer una respuesta entre
opciones no exige necesariamente la misma memoria que producirla sin pistas; tenlo en cuenta al comparar módulos.
En una ronda de Vocabulario solo la primera respuesta de cada unidad reprograma; las repeticiones
posteriores sirven para practicar. Las teclas son 1/2/3 para NO/CASI/SÍ.

## Si olvidas una palabra después de meses

Pulsa Otra vez o NO con normalidad. No necesitas borrar su progreso, cambiar fechas ni fingir un acierto.
El motor reduce su estabilidad y propone reaprendizaje, habitualmente a 10 minutos para una tarjeta consolidada.
Equivocarse tras un intervalo largo es información útil; el objetivo del 90 % no promete recuerdo perfecto.

Japanese 1500, Puyi y tus mazos personalizados tienen memoria separada. La misma palabra en dos mazos
puede tener fechas distintas. Lo mismo ocurre entre direcciones de Vocabulario y entre workspaces.
El contenido Puyi es compartido, pero tus repasos no son los de su administrador ni los de otros alumnos.

## ¿Debo cambiar los ajustes?

De entrada mantendría 90 %. Una retención mayor suele acortar intervalos y aumentar el trabajo diario.
95 % puede ser una opción a evaluar si olvidas más de lo deseado; 97 % aumenta mucho la carga.
80/85 % permiten más riesgo de olvido a cambio de menos repasos. No cambies solo porque la etiqueta diga meses:
lo relevante es si recuerdas correctamente cuando vuelve la tarjeta y cómo encaja la carga en tu rutina.

La auditoría comprobó cálculos y encontró diferencias técnicas puntuales de fechas/diagnóstico,
documentadas para una decisión posterior. No cambió tu programación ni tus datos. Para explicar
por qué **tu** 明日 tiene una fecha concreta harían falta su historial y ajustes, que no se han leído aquí.

Detalles: [comparación](02-VOCABULARIO-VS-MAZOS.md), [tablas reales de simulación](03-INTERVALOS-Y-SIMULACIONES.md)
y [hallazgos y propuestas](04-AUDITORIA-Y-MEJORAS.md).
