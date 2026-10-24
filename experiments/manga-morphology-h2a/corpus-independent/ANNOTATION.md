# Evaluación independiente pendiente

Hay **100 slots vacíos**, no 100 ejemplos ni 200 referencias fiables al sumarlos al
corpus original. El corpus original de 100 casos queda congelado como desarrollo y
regresión. No hay actualmente textos de manga con autorización documentada ni revisor
competente disponible en este experimento. No se usan archivos del usuario sin acreditar
su permiso para incorporarlos al corpus; la posesión de un manga no acredita redistribución.

## Procedimiento antes de evaluar

1. Registrar autorización y alcance (análisis local / inclusión en repositorio / publicación).
   El OCR autorizado solo para uso local debe permanecer en recursos ignorados; un
   manifiesto puede referenciar su hash sin publicar texto, imágenes o título privado.
2. Separar obras, unidades léxicas/entradas, familias de conjugación y plantillas de
   contexto de los usados para desarrollar reglas. Registrar `leakageFamily` por caso;
   revisar manualmente equivalencias, no basta comparar strings. Un caso equivalente
   a 食べなかった, 春さん u otro usado para corregir el algoritmo debe permanecer en
   desarrollo, aunque cambie flexión o nombre. No ajustar reglas tras ver el holdout.
3. Un anotador competente, independiente del desarrollador/analizador, recibe texto y
   contexto autorizados **sin la salida del modelo**. Registrar autoría, competencia,
   fecha y referencia de revisión. Preferir segunda revisión y adjudicación de desacuerdos.
   Una anotación del agente no pasa a «experta» por cambiar un flag.
4. Registrar superficie original, spans UTF-16, normalización y mapa; límites morfológicos
   y unidades léxicas son capas distintas. Registrar todas las alternativas válidas,
   ent_seq y restricciones de grafía/lectura/sentido de la fuente fijada, idioma real de
   glosa y justificación. Sentido ordinal solo local a ese hash, nunca ID permanente.
5. Etiquetas: `verified` solo con identidad demostrable; `ambiguous` para varias lecturas,
   sentidos o segmentaciones viables; `unknown` cuando no hay análisis léxico acreditado;
   `excluded` para función, signos y nombres propios según política documentada. No
   inferir confianza de OCR de Mokuro si no la aporta. Conservar desacuerdos y casos
   no certificables; no eliminarlos ni convertirlos en verificables para elevar precisión.
6. Cada `annotation` incluirá `classification`, `spans`, `lemma`, `readings`,
   `entryAlternatives`, `senseEvidence`, `rationale`, `difficulty` y `reviewStatus`.
   `reviewers` registrará procedencia de revisión; `disagreements` preservará propuestas
   anteriores y adjudicación. Derechos, revisión y separación son gates independientes.
7. Congelar manifiesto/hash y política antes de ejecutar evaluación final. Informar todos
   los aceptados, FP/FN, abstenciones, cobertura, por categoría y por obra autorizada.
   No extrapolar de slots o de frases sintéticas un número útil de palabras por volumen.

Objetivo abierto: ≥200 casos fiables revisados, ≥50 difíciles. Los 100 de desarrollo
tampoco cuentan como revisados por expertos. Si no hay material/revisor, informar cero
casos independientes y continuar investigación sin iniciar integración productiva.
