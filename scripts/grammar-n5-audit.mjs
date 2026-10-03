// Product decisions from GRAMMAR_AUDIT.md. Stable microconcept IDs, authored groups and activities.
export const N5_GROUPS = {
  '00': [['Sistemas de escritura',[1]],['Leer Hiragana',[2]],['Sonidos modificados y combinados',[3,4]],['Duración de los sonidos',[5,6]],['Leer Katakana',[7]],['Pronunciar partículas',[8]]],
  '01': [['Construir una frase nominal',[1]],['Cierre cortés y simple',[2,3]],['Tema y adición',[4,6]],['Preguntar',[5]],['Relacionar nombres',[7]],['Señalar cosas y lugares',[8,9,10]],['Negación y pasado',[11,12,13]]],
  '02': [['Describir nombres',[1,2,3]],['Negar descripciones',[4]],['Describir el pasado',[5,6]],['La excepción いい',[7]],['Intensidad',[8]],['Gustos y habilidades',[9,10,11]]],
  '03': [['Entender el verbo y su entrada',[1,5]],['Familias verbales',[2,3,4]],['Conjugación cortés',[6,7,8,9]],['El objeto de una acción',[10]],['Destino y dirección',[11,14]],['Cuándo ocurre',[12]],['Dónde se actúa',[13]],['Compañía y límites',[15,16]],['Ir con un propósito',[17]]],
  '04': [['Qué y quién existe',[1,2]],['Existencia en un lugar',[3,4]],['Situar respecto a algo',[5]],['Preguntar por lo desconocido',[6]],['Algo, alguien, nada y nadie',[7,8]],['Contar en contexto',[9]],['Horas y fechas',[10,11]],['Duraciones aproximadas',[12]]],
  '05': [['Negación simple y su pasado',[1,3]],['Pasado simple',[2]],['Describir en forma simple',[4,5,6]],['Elegir el trato',[7]],['Explicar y preguntar en contexto',[8,9]],['Citar palabras',[10]],['Frases que modifican y acciones como nombres',[11,12]]],
  '06': [['Construir la forma て',[1,2,3,4,5,6,7]],['Conectar acciones',[8,11]],['～ている',[9,10]],['Peticiones y normas',[12,13,14]]],
  '07': [['Invitar, proponer y ofrecer',[1,2,3]],['Pedir que no se haga',[4]],['Reconocer obligaciones',[5,6,7]],['Aconsejar',[8,9]],['Querer hacer',[10]],['Querer un objeto',[11]]],
  '08': [['Explicar una razón',[1,2]],['Contrastar ideas',[3,4]],['Listar y limitar',[5,6]],['Enumerar actividades',[7]],['Ya y todavía',[8,9,10]],['Antes de una acción',[11]]],
  '09': [['Experiencias',[1,2]],['Intenciones',[3]],['Comparar dentro de un conjunto',[4,5]],['Cambio y elección',[6,7]],['Reconocer exceso',[8]],['Reconocer probabilidad',[9]],['Dar y recibir',[10,11,12]]],
  '10': [['Partículas y formas en conjunto',[1,2]],['Seleccionar y componer',[3,4]],['Gramática dentro de un texto',[5]],['Leer textos originales',[6,7]],['Resolver información práctica',[8]],['Revisar errores y practicar un simulacro',[9,10]]],
};

const fill=(question,prompt,answer,feedback,extra={})=>({kind:'fill-gap',question,prompt,answers:Array.isArray(answer)?answer:[answer],feedback,...extra});
const sequence=(kind,question,prompt,tokens,solution,feedback,extra={})=>({kind,question,prompt,tokens,solution,feedback,...extra});
const segments=(kind,question,prompt,tokens,answer,feedback)=>({kind,question,prompt,tokens,answer,feedback});
const matching=(question,prompt,pairs,feedback)=>({kind:'matching',question,prompt,pairs,feedback});

export const N5_ACTIVITIES = {
  '01.1': sequence('sentence-order','Ordena esta frase nominal introductoria.','Empieza por これ y termina con el cierre cortés: «Esto es un libro».',['です','これ','ほん','は'],[1,3,2,0],'これはほんです. Es un patrón inicial útil; el tema puede omitirse o el orden variar cuando el contexto lo permite.'),
  '01.4': segments('select-segment','Selecciona la partícula que presenta el tema.','たなかさんはせんせいです。',['たなかさん','は','せんせい','です'],1,'は presenta a Tanaka como tema; せんせいです aporta la información.'),
  '01.7': sequence('sentence-builder','Construye «Es la bolsa de Yuki».','Usa la relación entre nombres, sin añadir un tema.',['かばん','の','ゆきさん','です','は'],[2,1,0,3],'ゆきさんのかばんです: の conecta Yuki con su bolsa.'),
  '01.10': matching('Empareja el lugar y su referencia.','Piensa en la distancia respecto al hablante y al oyente.',[['ここ','aquí, cerca de mí'],['そこ','ahí, cerca de ti'],['あそこ','allí, lejos de ambos']],'ここ / そこ / あそこ distinguen la referencia espacial.'),
  '01.12': fill('Completa el pasado cortés, en kana.','きのうはげつようび＿。 · げつようび = lunes',['でした'],'でした es el cierre cortés en pasado.'),
  '02.4': fill('Escribe la negación cortés de esta descripción.','さむい → [respuesta] · Incluye です.','さむくないです','La い final cambia a くない; です mantiene el trato cortés.'),
  '02.11': segments('select-segment','Selecciona lo que marca la habilidad, no el tema.','はははりょうりがじょうずです。',['はは','は','りょうり','が','じょうずです'],3,'は presenta a はは; が marca りょうり como habilidad descrita.'),
  '03.6': fill('Conjuga きく en afirmativo cortés no pasado.','きく（godan, escuchar） → [respuesta]','ききます','Godan く → き; raíz きき + ます.'),
  '03.7': fill('Conjuga はたらく en negativo cortés no pasado.','はたらく（godan, trabajar） → [respuesta]','はたらきません','La raíz es はたらき; ません añade negación no pasada.'),
  '03.8': fill('Conjuga のむ en afirmativo cortés pasado.','のむ（godan, beber） → [respuesta]','のみました','La raíz のみ se combina con ました para pasado afirmativo.'),
  '03.9': fill('Conjuga みる en negativo cortés pasado.','みる（ichidan, ver） → [respuesta]','みませんでした','Quita る y añade ませんでした: pasado negativo cortés.'),
  '03.13': segments('detect-error','Selecciona la partícula incorrecta.','La intención es «Leo un libro en la biblioteca», sin movimiento.',['としょかん','に','ほんを','よみます'],1,'Para el lugar de leer usa で: としょかんでほんをよみます.'),
  '04.9': matching('Empareja cada cantidad con lo que cuenta.','En una mesa hay dos hojas, tres manzanas y un bolígrafo.',[['かみがにまい','dos hojas de papel'],['りんごがみっつ','tres manzanas'],['ペンがいっぽん','un bolígrafo']],'まい cuenta hojas, つ objetos generales y ほん objetos alargados; uno se lee いっぽん.'),
  '04.11': fill('Lee en kana el día del mes de esta cita.','Cita: mayo, día 2. Escribe solo «día dos».','ふつか','El día dos del mes se lee ふつか. Vuelve a reconocer esta lectura en el repaso.'),
  '05.1': fill('Conjuga のむ en negativo simple.','のむ（godan, beber） → [respuesta]','のまない','む → ま antes de ない: のまない.'),
  '05.2': fill('Conjuga かく en pasado simple.','かく（godan, escribir） → [respuesta]','かいた','Los godan en く usan いた: かいた.'),
  '05.3': fill('Conjuga する en pasado negativo simple.','する（hacer） → [respuesta]','しなかった','する → しない → しなかった.'),
  '05.8': fill('Responde con la explicación «Es que estoy ocupado».','いそがしい = ocupado. Escribe la frase completa, en kana.','いそがしいんです','La forma simple いそがしい enlaza con んです para explicar el motivo en este diálogo.',{context:'A：あした、いきますか。\nB：いいえ。\nA：どうしてですか。（¿Por qué?）\nB：［説明］\nA pregunta por el motivo de no ir. B explica su situación.'}),
  '05.11': sequence('sentence-builder','Construye «la película que vi ayer».','La descripción va delante del nombre, sin pronombre relativo.',['えいが','きのう','の','みた'],[1,3,0],'きのうみた modifica directamente えいが. No añadas の.'),
  '06.1': fill('Transforma este ichidan a la forma て.','おきる（levantarse） → [respuesta]','おきて','Ichidan: る → て.'),
  '06.2': fill('Transforma este godan a la forma て.','かえる（volver） → [respuesta]','かえって','Godan en る: る → って. No es ichidan.'),
  '06.3': fill('Transforma este godan a la forma て.','よむ（leer） → [respuesta]','よんで','Godan en む: む → んで.'),
  '06.4': fill('Transforma este godan a la forma て.','きく（escuchar） → [respuesta]','きいて','Godan en く: く → いて.'),
  '06.5': fill('Transforma este godan a la forma て.','ぬぐ（quitarse ropa） → [respuesta]','ぬいで','Godan en ぐ: ぐ → いで; conserva la sonoridad.'),
  '06.6': fill('Transforma este godan a la forma て.','けす（apagar） → [respuesta]','けして','Godan en す: す → して.'),
  '06.7': fill('Transforma el verbo ir a la forma て.','いく → [respuesta]','いって','いく es la excepción del grupo く: いって.'),
  '07.5': segments('detect-error','Selecciona el bloque que debe cambiar para expresar obligación.','La intención es «Tengo que tomar la medicina».',['くすりを','のんで','はいけません'],1,'Cambia のんで por のまなくて: のまなくてはいけません. てはいけません expresaría prohibición.'),
  '07.8': fill('Da un consejo completando la forma del verbo.','みずを＿ほうがいいです。 · のむ = beber','のんだ','El consejo afirmativo usa la forma た, no ます.'),
  '08.7': sequence('sentence-builder','Construye una lista de actividades representativas.','Leer libros y escuchar música, entre otras cosas. Puedes empezar por cualquiera de las dos actividades.',['ほんを','よんだり','おんがくを','きいたり','します','きいて'],[0,1,2,3,4],'Forma た + り en cada actividad y します al final. El orden entre las actividades no es obligatorio.',{acceptedOrders:[[2,3,0,1,4]]}),
  '09.10': sequence('sentence-builder','Construye la frase desde quien da: «Yo doy un libro a Yuki».','Empieza por わたしは.',['わたしは','ゆきさんに','ほんを','あげます','くれます'],[0,1,2,3],'El objeto sale de mí hacia Yuki: あげます. Yuki lleva に.',{acceptedOrders:[[0,2,1,3]]}),
  '09.11': sequence('sentence-builder','Construye «Yuki me dio un bolígrafo».','Empieza por ゆきさんは.',['ペンを','わたしに','ゆきさんは','くれました','もらいました'],[2,1,0,3],'Yuki da hacia mí: くれました. Quien da es el tema de esta frase.',{acceptedOrders:[[2,0,1,3]]}),
  '09.12': sequence('sentence-builder','Construye «Yo recibí una bolsa de Yuki».','Empieza por わたしは.',['かばんを','もらいました','ゆきさんから','わたしは','あげました'],[3,2,0,1],'Yo soy quien recibe: もらいました. ゆきさんから indica la procedencia.',{acceptedOrders:[[3,0,2,1]]}),
  '10.1': segments('detect-error','Localiza la partícula equivocada en esta acción.','La intención es «Leo un libro en casa».',['わたしは','うちに','ほんを','よみます'],1,'Leer es una acción: el lugar debe ser うちで, no うちに.'),
  '10.2': fill('Cambia al trato cortés sin perder pasado ni negación.','きのうはいかなかった → きのうは［respuesta］','いきませんでした','El pasado negativo simple corresponde a いきませんでした.'),
  '10.4': sequence('sentence-order','Ordena los bloques para «Voy a comprar pan».','El verbo de movimiento cierra la frase.',['いきます','かいに','パンを'],[2,1,0],'パンを es objeto; かいに es propósito; いきます cierra.'),
  '10.9': segments('detect-error','Localiza la unidad incorrecta del pasado cortés.','La intención es «Ayer hizo frío».',['きのうは','さむいでした'],1,'Sustituye la unidad さむいでした por さむかったです: el adjetivo い forma el pasado con かった y conserva です.'),
};

export const N5_READING = {
  '10.5': {question:'El texto explica por qué no se compra la bolsa. Completa el conector.',prompt:'たかいです＿、きょうはかいません。',context:'あした、ともだちのたんじょうびです。わたしは、かばんをあげたいです。\nこのかばんはきれいですが、たかいです。たかいです＿、きょうはかいません。\nあした、ほかのみせにいくつもりです。\nたんじょうび = cumpleaños · ほか = otro',options:['から','けど','まで'],answer:0,feedback:'El texto da el precio como motivo para no comprar hoy; から expresa esa causa.'},
  '10.6': {question:'¿Dónde comerán mañana?',prompt:'Busca el plan de mañana, no lo ocurrido hoy.',context:'きょうはどようびです。わたしはうちでべんきょうしました。\nあしたはともだちとこうえんにいきます。パンとおちゃをかってから、こうえんでたべます。\nよるはうちでほんをよむつもりです。',options:['En casa.','En el parque.','En la tienda.'],answer:1,feedback:'あした introduce el plan; después de comprar, こうえんでたべます sitúa la comida en el parque.'},
  '10.7': {question:'¿Por qué no irán a la biblioteca el domingo?',prompt:'Relaciona el plan y el horario que aparece en el texto.',context:'わたしはにほんごをべんきょうしています。まいにち、うちでほんをよみますが、うちはあまりしずかではありません。\nえきのとなりに、あたらしいとしょかんがあります。げつようびからどようびまで、くじからごじまでです。にちようびはやすみです。\nこんどのにちようび、ともだちとそこでべんきょうしたいです。でも、そのひはやすみですから、こうえんにいくつもりです。\nこうえんでおちゃをのんでから、うちにかえります。つぎのどようびは、あさくじにとしょかんにいきます。ほんをかりて、にじかんぐらいべんきょうするつもりです。\nとしょかんはあたらしいですが、まだいったことがありません。ともだちもいったことがありません。ふたりでいくのがたのしみです。\nこんど = próximo · そのひ = ese día · つぎ = siguiente · かりる = tomar prestado · たのしみ = algo esperado con ilusión',options:['Porque la biblioteca cierra el domingo.','Porque la biblioteca abre por la tarde el domingo.','Porque ya han estudiado allí antes.'],answer:0,feedback:'にちようびはやすみ indica que la biblioteca está cerrada el domingo. Por eso el plan cambia al parque.'},
  '10.8': {question:'Es domingo a las 11:00. Quieres entrar y pedir algo por 400 yenes o menos. ¿Qué opción cumple todo?',prompt:'Comprueba día, horario, precio y aviso.',context:'<strong>そらカフェ（cafetería Sora）</strong><table><tr><th>ひ（día）</th><th>じかん（horario）</th></tr><tr><td>げつようび～どようび</td><td>9:00～18:00</td></tr><tr><td>にちようび</td><td>10:00～16:00</td></tr></table><strong>メニュー</strong><table><tr><td>おちゃ</td><td>300えん</td></tr><tr><td>コーヒー</td><td>450えん</td></tr><tr><td>ケーキ</td><td>500えん</td></tr></table><p>ここでほんをよんでもいいです。そとのたべものをもってこないでください。</p><p>えん = yenes · そと = fuera · たべもの = comida · もってくる = traer.</p>',options:['Entrar y pedir té.','Entrar y pedir café.','Entrar a las 9:00 y pedir pastel.'],answer:0,feedback:'El domingo abre de 10 a 16. A las 11 puedes entrar; おちゃ cuesta 300 yenes y respeta el máximo de 400.'},
  '10.10': {question:'¿Qué respuesta encaja con el plan y la experiencia del texto?',prompt:'Distingue experiencia pasada de intención futura.',context:'ゆきさんはまだにほんにいったことがありません。\nらいねん、にほんにいくつもりです。いま、まいにちにほんごをべんきょうしています。\nあしたはとしょかんで、ともだちとほんをよむつもりです。\nらいねん = el año que viene',options:['Ya ha estado en Japón y mañana no estudiará.','Nunca ha estado en Japón y tiene intención de ir el año que viene.','Está en Japón ahora.'],answer:1,feedback:'まだ…いったことがありません niega experiencia hasta ahora; らいねん…つもり expresa intención futura.'},
};

const PRACTICE_CONCEPTS={
  '00':[1,2,3,4,5,6,7,8,4,8], '01':[1,1,8,9,5,7,7,11,12,13,10,7],
  '02':[2,6,9,5,8,7,10,3,6,8], '03':[2,8,4,10,13,11,12,14,16,17],
  '04':[1,2,7,8,5,6,9,10,11,12], '05':[1,2,3,4,5,8,9,10,11,12],
  '06':[1,2,3,5,7,9,10,11,12,13], '07':[1,2,3,4,5,6,7,8,9,10],
  '08':[1,2,3,4,5,6,7,8,10,11], '09':[1,2,3,4,5,6,7,8,9,12],
  '10':[1,2,3,4,5,6,7,8,9,10],
};
const VOCABULARY={
  '00':['ひらがな','カタカナ','かんじ'], '01':['わたし','がくせい','せんせい','ほん','かばん','きょう','きのう','あした','げつようび'],
  '02':['さむい','あつい','きれい','しずか','すき','じょうず','りょうり'],
  '03':['たべる','のむ','みる','きく','はたらく','いく','くる','する','うち','えき'],
  '04':['ある','いる','えき','ねこ','ひと','かみ','りんご','えんぴつ','じかん','がつ','にち','ふつか','みっか'],
  '05':['のむ','かく','する','いそがしい','どうして','おくれる','でんしゃ','えいが'],
  '06':['おきる','かえる','よむ','のむ','きく','ぬぐ','およぐ','けす','いく'],
  '07':['くすり','みず','のむ','やすむ','いく','たべる','ほしい'],
  '08':['ほん','おんがく','よむ','きく','もう','まだ','まえ'],
  '09':['にほん','ともだち','ほん','ペン','かばん','あげる','くれる','もらう'],
  '10':['こうえん','としょかん','おちゃ','かりる','こんど','つぎ','そと','えん','たんじょうび'],
};

// The overrides are authored activities, not a second runtime parser or course engine.
export function applyGrammarAudit(topics,lessons,practices,copy) {
  const key=(name,value)=>{const id=`grammar.audit.${name}`;copy[id]=value;return id;};
  const getLesson=concept=>lessons.find(l=>`${l.topicId}.${l.id}`===concept);
  const authoredExercise=(base,old,spec)=>{
    const result={id:old.id,kind:spec.kind??'multiple-choice',labelKey:old.labelKey,topicKey:old.topicKey,
      conceptId:old.conceptId,errorCategoryKey:old.errorCategoryKey,
      questionKey:key(`${base}.question`,spec.question),promptKey:key(`${base}.prompt`,spec.prompt),
      successKey:key(`${base}.success`,spec.feedback),errorKey:key(`${base}.error`,spec.feedback)};
    if(spec.context)result.contextKey=key(`${base}.context`,spec.context);
    if(result.kind==='fill-gap'){result.acceptedAnswers=[...spec.answers];result.solutionKey=key(`${base}.solution`,spec.answers[0]);}
    else if(result.kind==='matching')result.pairs=spec.pairs.map(([left,right],i)=>({leftKey:key(`${base}.left.${i}`,left),rightKey:key(`${base}.right.${i}`,right)}));
    else if(['sentence-order','sentence-builder'].includes(result.kind)){
      result.tokenKeys=spec.tokens.map((token,i)=>key(`${base}.token.${i}`,token));result.solution=[...spec.solution];
      if(spec.acceptedOrders)result.acceptedOrders=spec.acceptedOrders.map(order=>[...order]);
    }else{result.optionKeys=(spec.options??spec.tokens).map((token,i)=>key(`${base}.option.${i}`,token));result.answer=spec.answer;}
    return result;
  };
  const beginnerReadings={'学生':'がくせい','先生':'せんせい','日本':'にほん','休み':'やすみ','私':'わたし','今日':'きょう','理解':'わかる'};
  function helpBeginners(value){
    if(typeof value==='string'&&copy[value]){
      for(const [written,reading]of Object.entries(beginnerReadings))copy[value]=copy[value].replaceAll(written,reading);
      return;
    }
    if(Array.isArray(value)){value.forEach(helpBeginners);return;}
    if(value&&typeof value==='object')for(const [name,item]of Object.entries(value)){
      if(name.endsWith('Key')&&typeof item==='string'&&copy[item]){
        for(const [written,reading]of Object.entries(beginnerReadings))copy[item]=copy[item].replaceAll(written,reading);
      }else if(name==='symbol'&&typeof item==='string'){
        for(const [written,reading]of Object.entries(beginnerReadings))value[name]=value[name].replaceAll(written,reading);
      }else helpBeginners(item);
    }
  }
  helpBeginners([topics.filter(t=>Number(t.id)<2),lessons.filter(l=>Number(l.topicId)<2),practices.filter(p=>Number(p.topicId)<2)]);
  getLesson('00.1').theory.find(block=>block.symbol==='漢字').symbol='漢字（かんじ）';
  const introductory=getLesson('01.1');
  introductory.theory[0].bodyKey=key('01.1.rule','Tema → información → cierre es un patrón introductorio útil para la frase nominal. No es una ley universal: el tema se omite si ya se conoce y el orden puede variar por contexto.');
  introductory.ideaKey=key('01.1.idea','Practica este patrón como punto de partida. No todas las oraciones necesitan un tema explícito ni siguen un único orden.');

  for(const lesson of lessons){
    const concept=`${lesson.topicId}.${lesson.id}`;
    lesson.prerequisites={requiredKana:lesson.topicId==='00'?(lesson.position<3?[]:lesson.position===8?['hiragana','katakana']:['hiragana']):['hiragana','katakana'],
      intendedVocabulary:VOCABULARY[lesson.topicId],allowedKanji:concept==='00.1'?['漢','字']:[]};
    lesson.exercise.conceptId=concept;lesson.exercise.errorCategoryKey=lesson.titleKey;
    if(Number(lesson.topicId)>=2)lesson.theory[0].symbol='あ';
    const spec=N5_ACTIVITIES[concept]??N5_READING[concept];
    if(spec)lesson.exercise=authoredExercise(`lesson.${concept}`,lesson.exercise,spec);
  }
  for(const practice of practices)practice.exercises.forEach((exercise,i)=>{
    const concept=`${practice.topicId}.${PRACTICE_CONCEPTS[practice.topicId][i]}`;
    exercise.conceptId=concept;exercise.errorCategoryKey=getLesson(concept).titleKey;
  });
  const practiceOverrides={
    '01.0':segments('select-segment','Selecciona el tema de esta frase.','これはかばんです。',['これ','は','かばん','です'],1,'これ es el tema; は lo presenta. La consigna pide el tema, no su partícula.'),
    '01.6':sequence('sentence-builder','Construye «Es el libro de Tanaka».','Usa todos los bloques necesarios.',['ほん','です','たなかさん','の','も'],[2,3,0,1],'たなかさんのほんです: の relaciona a la persona con su libro.'),
    '02.1':fill('Completa el pasado negativo cortés.','たかい → [respuesta] · No era caro.','たかくなかったです','い → くなかった y です al final.'),
    '03.1':fill('Conjuga かく en pasado cortés.','きのう、てがみを［respuesta］。 · かく = escribir','かきました','かく → かきます → かきました.'),
    '04.6':matching('Asocia cada compra con su contador.','En la tienda compras papel, manzanas y lápices.',[['かみ','にまい · dos hojas'],['りんご','みっつ · tres manzanas'],['えんぴつ','いっぽん · un lápiz']],'Objetos planos usan まい; objetos largos usan ほん; つ permite contar objetos de forma general.'),
    '04.8':fill('Completa la nueva fecha de la cita, solo el día en kana.','A: ごがつふつかはどうですか。\nB: そのひはいそがしいです。ごがつ＿はどうですか。\nPropón el día 3 de mayo; いそがしい = ocupado.','みっか','ふつか es día 2 y みっか es día 3. La segunda propuesta cambia la fecha, no el mes.'),
    '05.0':fill('Conjuga el negativo simple de およぐ.','およぐ → [respuesta] · nadar','およがない','Godan: ぐ → がない.'),
    '05.5':fill('Completa una explicación cortés.','A: どうしていきませんか。\nB: きょうは＿。 · Quiero decir «porque estoy ocupado».','いそがしいんです','んです presenta la circunstancia que explica la decisión.'),
    '06.1':fill('Escribe la forma て de かえる.','かえる → [respuesta]','かえって','El godan かえる cambia る → って.'),
    '06.2':fill('Escribe la forma て de のむ.','のむ → [respuesta]','のんで','む → んで. Escribe la transformación, sin elegir entre opciones.'),
    '06.3':fill('Escribe la forma て de およぐ.','およぐ → [respuesta]','およいで','ぐ → いで. Conserva la sonoridad.'),
    '07.4':segments('detect-error','Selecciona la forma que debe cambiar para expresar obligación.','La intención es «Tengo que estudiar».',['べんきょうして','はいけません'],0,'べんきょうしなくてはいけません expresa obligación. てはいけません prohíbe.'),
    '08.6':sequence('sentence-builder','Construye una lista abierta de actividades.','A veces veo películas y a veces paseo. Puedes empezar por cualquiera de las actividades.',['えいがを','みたり','さんぽしたり','します','みて'],[0,1,2,3],'Las actividades representativas llevan たり y el cierre します.',{acceptedOrders:[[2,0,1,3]]}),
    '09.9':sequence('sentence-builder','Construye «Recibí un bolígrafo de Tanaka».','Empieza por わたしは.',['ペンを','わたしは','もらいました','たなかさんから','くれました'],[1,3,0,2],'Quien recibe es わたし; la procedencia lleva から.',{acceptedOrders:[[1,0,3,2]]}),
    '10.0':segments('select-segment','Selecciona lo que indica el lugar de la acción.','としょかんでほんをよみます。',['としょかん','で','ほん','を','よみます'],1,'で marca el lugar donde se lee; を marca el objeto.'),
    '10.1':fill('Completa la frase cortés en pasado negativo.','きのう、コーヒーを＿。 · のむ = beber','のみませんでした','Pasado negativo cortés: のみませんでした.'),
    '10.3':sequence('sentence-order','Ordena «Voy a la biblioteca a leer un libro».','Empieza por el destino y termina por el movimiento.',['よみに','いきます','としょかんへ','ほんを'],[2,3,0,1],'Destino + objeto + propósito en に + movimiento.'),
    '10.5':{...N5_READING['10.6'],question:'¿Qué hará por la noche?',options:['Leerá un libro en casa.','Comprará pan en el parque.','Se quedará en la tienda.'],answer:0,feedback:'よるはうちでほんをよむつもりです expresa la intención para la noche.'},
    '10.6':{...N5_READING['10.7'],question:'¿Cuándo irán a la biblioteca según el plan final?',options:['El domingo a las cinco.','El sábado siguiente a las nueve.','Cada día a las tres.'],answer:1,feedback:'つぎのどようび…あさくじ sitúa el nuevo plan en el sábado siguiente, a las nueve.'},
    '10.7':{...N5_READING['10.8'],question:'Es domingo a las 9:00. ¿Qué decisión respeta el horario y el aviso?',options:['Esperar hasta las 10:00 y no traer comida de fuera.','Entrar a las 9:00 con comida de fuera.','Esperar hasta las 18:00.'],answer:0,feedback:'El domingo abre a las 10:00; el aviso pide no traer comida de fuera.'},
    '10.8':segments('detect-error','Localiza lo que falla en esta descripción cortés.','La intención es «La habitación no era silenciosa».',['へやは','しずか','くなかったです'],2,'El adjetivo な usa しずかではありませんでした (o しずかじゃなかったです), no くなかったです.'),
    '10.9':sequence('sentence-builder','Construye una intención futura.','«Tengo intención de ir a Japón». Empieza por わたしは.',['つもりです','にほんに','わたしは','いく','いった'],[2,1,3,0],'La intención usa el diccionario: いくつもりです.'),
  };
  // Select the topic itself, not the marker; keep the authored instruction and solution consistent.
  practiceOverrides['01.0'].answer=0;
  for(const practice of practices)practice.exercises=practice.exercises.map((exercise,i)=>{
    const spec=practiceOverrides[`${practice.topicId}.${i}`];return spec?authoredExercise(`practice.${practice.topicId}.${i}`,exercise,spec):exercise;
  });

  const addTheory=(concept,name,text)=>{
    const lesson=getLesson(concept);lesson.theory[0].bodyKey=key(`theory.${concept}`,text);
    lesson.theory[0].titleKey=key(`theory.${concept}.title`,name);
  };
  addTheory('02.11','Tema y habilidad','<span class="grammar-contrast"><span>はは <b>は</b><small>tema: mi madre</small></span><span>りょうり <b>が</b><small>habilidad: cocinar</small></span><span>じょうずです<small>es hábil</small></span></span>は organiza de quién hablamos; が identifica la habilidad que describimos. No son intercambiables aquí.');
  addTheory('03.13','Lugar, destino y dirección','<span class="grammar-contrast"><span>うち <b>で</b><small>lugar de una acción</small></span><span>うち <b>に</b><small>destino o existencia</small></span><span>うち <b>へ</b><small>dirección del movimiento</small></span></span>うちでべんきょうします = estudio en casa. うちにいきます = voy a casa. うちへいきます = voy hacia casa.');
  addTheory('04.9','Contar para una tarea','En una tienda pides にまいのかみ (dos hojas), みっつのりんご (tres manzanas) e いっぽんのえんぴつ (un lápiz). Elige el contador por lo que estás contando, no por una lista aislada. まい: plano; ほん: largo; つ: objetos en general.');
  addTheory('04.11','Fechas para un plan','A: いついきますか。 — ¿Cuándo vas?<br>B: ごがつふつかにいきます。 — Voy el 2 de mayo.<br>A: みっかはどうですか。 — ¿Y el día 3?<br>Aprende la fecha dentro de una cita: ふつか (día 2), みっか (día 3). El ejercicio y la práctica vuelven a usar esta distinción.');
  addTheory('05.8','Una explicación en diálogo','A: どうしておくれましたか。 — ¿Por qué llegaste tarde?<br>B: でんしゃがおそかったんです。 — Es que el tren llegó tarde.<br>んです ofrece la explicación que conecta con la pregunta. No añade una causa nueva por sí solo. おくれる = llegar tarde; でんしゃ = tren; おそい = tarde/lento.');
  addTheory('07.5','Obligación, prohibición y consejo','<span class="grammar-contrast"><span>くすりをのまなくてはいけません<small>obligación: tengo que tomar la medicina</small></span><span>ここでたべてはいけません<small>prohibición: no se puede comer aquí</small></span><span>やすんだほうがいいです<small>consejo: sería mejor descansar</small></span></span>Lee la forma que precede al cierre: なくて / て / た cambian la intención. くすり = medicina; やすむ = descansar.');
  // Every lesson using a new contextual text also carries that text in the activity, not in an external asset.
  getLesson('10.9').ideaKey=key('10.9.idea','En las prácticas, el resumen de errores identifica los conceptos que fallaron. Repasar errores crea una ronda solo con esas actividades; vuelve a la teoría si no entiendes el motivo.');

  for(const [concept,from,to,action,focus]of [
    ['09.10','わたし','ゆきさん','あげます','from'],['09.11','ゆきさん','わたし','くれます','to'],['09.12','わたし','ゆきさん','もらいます','from'],
  ]){
    const direction={fromKey:key(`${concept}.from`,from),toKey:key(`${concept}.to`,to),actionKey:key(`${concept}.action`,action),
      captionKey:key(`${concept}.caption`,concept==='09.10'?'Yo doy hacia otra persona.':concept==='09.11'?'Otra persona da hacia mí.':'Yo recibo desde otra persona.'),arrow:concept==='09.12'?'←':'→',focus};
    getLesson(concept).direction=direction;getLesson(concept).exercise.direction=direction;
    if(concept==='09.12')practices.find(p=>p.topicId==='09').exercises[9].direction={...direction,toKey:key('practice.09.12.to','たなかさん')};
  }
  const sessions=[];
  for(const topic of topics){
    const groups=N5_GROUPS[topic.id];
    groups.forEach(([title,ids],i)=>sessions.push({id:`${topic.id}-session-${i+1}`,topicId:topic.id,position:i+1,titleKey:key(`session.${topic.id}.${i+1}`,title),lessonIds:ids.map(String)}));
    const order=groups.flatMap(([,ids])=>ids.map(String));
    order.forEach((id,i)=>{
      const lesson=getLesson(`${topic.id}.${id}`);const route=`/grammar/n5/${topic.id}`;
      lesson.previousPath=i?`${route}/${order[i-1]}`:route;lesson.nextPath=i===order.length-1?`${route}/practice`:`${route}/${order[i+1]}`;
    });
    topic.metaKeys=[key(`session.count.${topic.id}`,`${groups.length} sesiones · ${order.length} microconceptos`),key('learning.flow','Teoría · ejercicios · práctica acumulativa')];
    if(topic.journey){topic.journey.bodyKey=key(`journey.${topic.id}`,'Estudia conceptos relacionados dentro de cada sesión. Comprueba cada idea y después combínalas en la práctica acumulativa.');topic.journey.links[0].labelKey=key('start.sessions','Empezar sesiones →');}
  }
  Object.assign(copy,{
    'grammar.answerLabel':'Tu respuesta en japonés','grammar.buildHelp':'Selecciona bloques en orden. Pulsa un bloque de tu frase para retirarlo.',
    'grammar.yourSentence':'Tu frase','grammar.removeToken':'Retirar {{token}}','grammar.availableBlocks':'Bloques disponibles',
    'grammar.matchHelp':'Selecciona un elemento de la izquierda y luego su pareja de la derecha. Puedes cambiar una pareja antes de comprobar.',
    'grammar.solution':'Solución:','grammar.errorSummary':'Conceptos para repasar','grammar.reviewErrors':'Repasar errores',
    'grammar.noErrors':'No has fallado ningún concepto en esta ronda.','grammar.reviewingErrors':'Repaso de errores',
    'grammar.session':'Sesión {{number}}','grammar.sessionConcept':'Concepto {{current}} de {{total}}',
    'grammar.requiredKana':'Kana de referencia','grammar.vocabulary':'Vocabulario previsto','grammar.practiceHiragana':'Practicar Hiragana',
    'grammar.practiceKatakana':'Practicar Katakana','grammar.kanaHelp':'Entrena los caracteres en el módulo Kana; aquí estudias cómo funcionan.',
  });
  return sessions;
}

// Course copy remains Spanish source for this phase; new controls are localized in all supported languages.
export const GRAMMAR_UI_TRANSLATIONS={
  en:{'grammar.answerLabel':'Your answer in Japanese','grammar.buildHelp':'Select blocks in order. Select a block in your sentence to remove it.','grammar.yourSentence':'Your sentence','grammar.removeToken':'Remove {{token}}','grammar.availableBlocks':'Available blocks','grammar.matchHelp':'Select an item on the left, then its match on the right. You can change pairs before checking.','grammar.solution':'Solution:','grammar.errorSummary':'Concepts to review','grammar.reviewErrors':'Review mistakes','grammar.noErrors':'You did not miss any concepts in this round.','grammar.reviewingErrors':'Reviewing mistakes','grammar.session':'Session {{number}}','grammar.sessionConcept':'Concept {{current}} of {{total}}','grammar.requiredKana':'Reference kana','grammar.vocabulary':'Reference vocabulary','grammar.practiceHiragana':'Practice Hiragana','grammar.practiceKatakana':'Practice Katakana','grammar.kanaHelp':'Train character recognition in the Kana module; here you study how they work.'},
  ca:{'grammar.answerLabel':'La teva resposta en japonès','grammar.buildHelp':'Selecciona blocs en ordre. Prem un bloc de la teva frase per retirar-lo.','grammar.yourSentence':'La teva frase','grammar.removeToken':'Retirar {{token}}','grammar.availableBlocks':'Blocs disponibles','grammar.matchHelp':'Selecciona un element de l’esquerra i després la seva parella de la dreta. Pots canviar les parelles abans de comprovar.','grammar.solution':'Solució:','grammar.errorSummary':'Conceptes per repassar','grammar.reviewErrors':'Repassar errors','grammar.noErrors':'No has fallat cap concepte en aquesta ronda.','grammar.reviewingErrors':'Repàs d’errors','grammar.session':'Sessió {{number}}','grammar.sessionConcept':'Concepte {{current}} de {{total}}','grammar.requiredKana':'Kana de referència','grammar.vocabulary':'Vocabulari de referència','grammar.practiceHiragana':'Practicar Hiragana','grammar.practiceKatakana':'Practicar Katakana','grammar.kanaHelp':'Entrena els caràcters al mòdul Kana; aquí estudies com funcionen.'},
};
Object.assign(GRAMMAR_UI_TRANSLATIONS.en, {'grammar.kanaAssist':'Kana help: build your answer','grammar.eraseKana':'Erase','grammar.step':'Step {{number}}','grammar.kanjiReference':'Reference kanji'});
Object.assign(GRAMMAR_UI_TRANSLATIONS.ca, {'grammar.kanaAssist':'Kana d’ajuda: construeix la resposta','grammar.eraseKana':'Esborrar','grammar.step':'Pas {{number}}','grammar.kanjiReference':'Kanji de referència'});
Object.assign(GRAMMAR_UI_TRANSLATIONS.en, {'grammar.exerciseStep':'Exercise {{current}} of {{total}}'});
Object.assign(GRAMMAR_UI_TRANSLATIONS.ca, {'grammar.exerciseStep':'Exercici {{current}} de {{total}}'});
