// Second directed audit: curated activities, session vocabulary and a small declared kanji progression.
// No morphological inference: controlledVocabulary explicitly names the words an author wants checked.
const FILL=['01.2','02.5','02.7','03.2','03.10','03.11','03.12','03.17','04.1','04.3','04.5','04.12','05.4','05.7','05.10','06.9','06.12','07.1','07.10','08.1','08.5','08.11','09.1','09.3','09.6','10.5'];
// Explicit editorial targets; never infer the task from the former MC answer.
const FILL_QUESTIONS={
 '01.2':'Completa solo el cierre afirmativo cortés: «Soy estudiante».',
 '02.5':'Escribe la forma completa de おいしい en pasado afirmativo cortés, con です.',
 '02.7':'Escribe la forma completa de いい en pasado afirmativo cortés, con です.',
 '03.2':'Escribe solo la raíz de おきる usada para añadir ます, sin añadir ます.',
 '03.10':'Completa solo la partícula que marca el objeto directo: «Bebo té».',
 '03.11':'Completa solo una partícula de destino o dirección: «Voy a la estación».',
 '03.12':'Completa solo la partícula que marca la hora exacta: «Me levanto a las siete».',
 '03.17':'Completa solo la raíz de のみます antes de にいきます: «Voy a beber café».',
 '04.1':'Completa solo el verbo de existencia, en afirmativo cortés no pasado: «Hay una mesa».',
 '04.3':'Completa solo la partícula que introduce lo que existe: «Hay un libro en la bolsa».',
 '04.5':'Completa solo la partícula de relación: «Hay un gato debajo de la silla».',
 '04.12':'Escribe solo la expresión de duración aproximada «unas tres horas», sin verbo.',
 '05.4':'Escribe la expresión completa せんせい en pasado afirmativo simple: «Era profesor».',
 '05.7':'Convierte のみませんでした al pasado negativo simple. Escribe solo el verbo.',
 '05.10':'Completa solo la partícula que marca la cita: «Dice gracias».',
 '06.9':'Completa solo きく en afirmativo cortés con ～ています: «Ahora estoy escuchando música».',
 '06.12':'Completa solo la forma て de かく antes de ください: «Escribe tu nombre, por favor».',
 '07.1':'Completa solo のむ con la invitación cortés ～ませんか: «¿Bebemos té juntos?».',
 '07.10':'Completa solo よみます con ～たい antes de です: «Quiero leer este libro».',
 '08.1':'Completa solo un conector causal: «Como es caro, no lo compro».',
 '08.5':'Completa solo la partícula de una lista abierta: «Té, café, entre otras cosas».',
 '08.11':'Completa solo la forma diccionario de ねます antes de まえに: «Bebí agua antes de dormir».',
 '09.1':'Completa solo みる en pasado simple antes de ことがあります: «He visto esta película alguna vez».',
 '09.3':'Completa solo la forma diccionario de よみます antes de つもりです: «Mañana tengo intención de leer un libro».',
 '09.6':'Completa solo el enlace de un adjetivo な con なりました: «Se volvió silencioso».',
 '10.5':'Completa solo un conector causal entre el precio y la decisión de no comprar hoy.',
};
const SEQUENCES={
  '01.5':['sentence-builder',['がくせい','です','か','。'],[0,1,2,3],'Construye «¿Eres estudiante?», con cierre cortés.'],
  '02.1':['sentence-builder',['いえ','おおきい','です','な'],[1,0,2],'Construye «Es una casa grande».'],
  '03.15':['sentence-order',['べんきょうします','たなかさん','と'],[1,2,0],'Ordena «Estudio con Tanaka».'],
  '05.6':['sentence-builder',['たか','なかった','く','です'],[0,2,1],'Construye «No era caro», en forma simple.'],
  '06.8':['sentence-order',['うちに','おちゃを','かえりました','のんで'],[1,3,0,2],'Ordena «Bebí té y volví a casa».'],
  '06.13':['sentence-builder',['みずを','のんで','も','いい','ですか','は'],[0,1,2,3,4],'Construye «¿Puedo beber agua?» usando ～てもいい.'],
  '07.4':['sentence-builder',['ください','はなさ','で','ない','ます'],[1,3,2,0],'Construye «No hables, por favor».'],
  '07.11':['sentence-order',['ほしいです','みず','が'],[1,2,0],'Ordena «Quiero agua», como objeto.'],
  '08.10':['sentence-builder',['そのえいがは','みて','いません','まだ','みました'],[0,3,1,2],'Construye «Todavía no he visto esa película».'],
  '09.4':['sentence-order',['たかいです','ケーキのほうが','パンより'],[2,1,0],'Ordena «El pastel es más caro que el pan».'],
};
const SEGMENTS={
  '02.8':['select-segment',['ぜんぜん','むずかしく','ないです'],0,'Selecciona lo que refuerza «nada difícil».','ぜんぜん acompaña la negación para expresar «nada».'],
  '03.1':['select-segment',['わたし','は','のみます'],2,'Selecciona la acción en «Yo bebo».','のみます expresa la acción; わたし es la persona y は presenta el tema.'],
  '06.11':['select-segment',['シャワーを','あびてから','ねます'],1,'Selecciona la acción que sucede primero.','あびてから sitúa ducharse antes de dormir.'],
  '08.3':['select-segment',['おおきいです','けど','しずかです'],1,'Selecciona el conector de contraste.','けど enlaza dos ideas que se contrastan.'],
};
const MATCHING={
  '04.6':[['どの','qué + nombre'],['どれ','cuál, sin nombre detrás'],['だれ','quién']],
  '04.7':[['なにか','algo'],['なにも＋negativo','nada'],['だれも＋negativo','nadie']],
};
// These sessions intentionally test reading/recognition, rather than asking the learner to reproduce a text.
export function grammarSessionMode(exercises){
 if(exercises.some(e=>e.kind==='fill-gap'))return 'production';
 if(exercises.some(e=>['sentence-builder','sentence-order'].includes(e.kind)))return 'manipulation';
 return 'recognition';
}
const SESSION_VOCAB={
 '00':[['ひらがな','カタカナ','かんじ'],['き','ぬ'],['か','が','きゃ','しゅ'],['きて','きって','コーヒー'],['ア','カ'],['わたし','がくせい','スーパー']],
 '01':[['これ','ほん','わたし'],['わたし','がくせい'],['たなかさん','せんせい'],['がくせい'],['ゆきさん','かばん','ほん'],['ほん','かばん','ここ','そこ','あそこ'],['がくせい','せんせい','きのう','げつようび']],
 '02':[['おおきい','いえ','きれい','へや','ほん','あたらしい'],['さむい'],['おいしい','たのしい','たかい'],['いい'],['むずかしい'],['さかな','すき','きらい','りょうり','じょうず']],
 '03':[['のむ','たべる','はたらく','みる'],['おきる','たべる','はなす','くる'],['きく','はたらく','のむ','みる'],['おちゃ','ほん','よむ'],['えき','まち','いく'],['しちじ','おきる'],['うち','としょかん','べんきょうする'],['たなかさん','ともだち','あね','べんきょうする','じゅうじ','さんじ'],['コーヒー','のむ']],
 '04':[['つくえ','いぬ','ひと'],['かばん','ほん','うち','いぬ'],['いす','ねこ','した'],['かばん','どの','どれ','だれ'],['なにか','なにも','だれも','へや'],['かみ','りんご','えんぴつ','ペン','えん'],['いま','じ','ふん','がつ','ふつか','みっか','ひ','いそがしい','いつ','きょう','げつようび','たんじょうび'],['じかん','さんじかん','べんきょうする','よむ']],
 '05':[['のむ','くる','およぐ'],['かく','あそぶ'],['せんせい','がくせい','がっこう','ひま','たかい'],['のむ'],['いそがしい','でんしゃ','おくれる'],['ありがとう','いう'],['えいが','ほん','よむ']],
 '06':[['おきる','かえる','よむ','のむ','きく','ぬぐ','およぐ','けす','いく'],['おちゃ','のむ','うち','シャワー','あびる','ねる','ほん','よむ'],['おんがく','きく','たなかさん','けっこんする','いま','ほん','よむ'],['なまえ','かく','みず','のむ','しゃしん','とる','ほん','みる']],
 '07':[['いっしょ','おちゃ','のむ','よむ','ドア','しめる'],['はなす'],['くすり','のむ','べんきょうする'],['みず','のむ','やすむ','かう'],['ほん','よむ'],['みず','ほしい']],
 '08':[['たかい','かう','ひま','いく'],['おおきい','しずか','ほん','おもしろい','むずかしい'],['おちゃ','コーヒー','りんご','かう'],['ほん','よむ','おんがく','きく','えいが','みる','さんぽする'],['ほん','よむ','うち','えいが','みる'],['ねる','みず','のむ']],
 '09':[['えいが','みる','コーヒー','のむ'],['あした','ほん','よむ'],['パン','ケーキ','たかい','みず','すき'],['しずか','おちゃ'],['たかい'],['あした','さむい'],['ほん','ペン','かばん','ゆきさん','あげる','くれる','もらう']],
 '10':[['うち','ほん','よむ','のむ','コーヒー'],['パン','かう','いく','としょかん','ほん','よむ'],['かばん','たんじょうび','ともだち','たかい'],['ほん','よむ','こうえん','おちゃ','としょかん','かりる','つぎ','こんど','しずか','やすみ','たのしみ'],['カフェ','おちゃ','コーヒー','ケーキ','えん','ひ','ほん','よむ','そと','たべもの','もってくる'],['にほん','いく','いま','ほん','よむ','がくせい','さむい','へや','しずか']],
};
// Explicit source examples use the existing FuriganaText component. No guesswork or new parser.
const EXAMPLES={
 '03.1':[['飲','の'],['みます'], 'Bebo / beberé.'],
 '03.2':[['食','た'],['べる'], 'Comer: verbo ichidan.'],
 '03.5':[['見','み'],['る'], 'Ver: forma diccionario.'],
 '03.10':[['本','ほん'], 'Libro: objeto de una acción.'],
 '03.11':[['行','い'],['きます'], 'Voy / iré.'],
 '04.2':[['人','ひと'], 'Persona: existencia de un ser vivo.'],
 '04.9':[['300'],['円','えん'], '300 yenes: cantidad de dinero.'],
 '04.10':[['今','いま'],['、9'],['時','じ'],['10'],['分','ぷん'], 'Ahora son las 9:10.'],
 '04.11':[['5月2日','ごがつふつか'], '2 de mayo. 月 marca el mes y 日 el día; 日 también se lee ひ cuando significa «día».'],
 '05.3':[['来','こ'],['なかった'], 'No vine: pasado negativo simple.'],
 '05.4':[['先生','せんせい'],['・'],['学生','がくせい'],['・'],['学校','がっこう'], 'Profesor · estudiante · escuela.'],
 '05.11':[['本','ほん'],['を'],['読','よ'],['む'], 'Leer un libro.'],
 '06.3':[['飲','の'],['んで'], 'Forma て de beber.'],
 '06.8':[['本','ほん'],['を'],['読','よ'],['んで、おちゃを'],['飲','の'],['みます'], 'Leo un libro y bebo té.'],
 '06.9':[['今','いま'],['、'],['本','ほん'],['を'],['読','よ'],['んでいます'], 'Ahora estoy leyendo un libro.'],
 '06.12':[['本','ほん'],['を'],['見','み'],['てください'], 'Mire el libro, por favor.'],
 '07.1':[['おちゃを'],['飲','の'],['みませんか'], '¿Bebemos té juntos?'],
 '08.7':[['本','ほん'],['を'],['読','よ'],['んだり、おんがくをきいたりします'], 'Leo libros, escucho música y hago otras cosas.'],
 '09.12':[['本','ほん'],['をもらいました'], 'Recibí un libro.'],
};
const INTRO={ '03.1':'飲','03.2':'食','03.5':'見','03.10':'本','03.11':'行','04.2':'人','04.9':'円','04.10':'今時分','04.11':'月日','05.3':'来','05.4':'先生学校','05.11':'読' };
// Lexical targets also seed plausible kana errors from the original dictionary form.
const LEXICAL={
 '01.2':['がくせい'],'02.4':['さむい'],'02.5':['おいしい'],'02.7':['いい','よい'],
 '03.2':['おきる'],'03.6':['きく'],'03.7':['はたらく'],'03.8':['のむ'],'03.9':['みる'],
 '03.10':['おちゃ','のむ'],'03.11':['えき','いく'],'03.12':['しちじ','おきる'],'03.15':['たなかさん','ともだち','あね','べんきょうする'],'03.17':['コーヒー','のむ'],
 '04.1':['つくえ'],'04.3':['かばん','ほん'],'04.5':['いす','ねこ','した'],'04.11':['ふつか'],'04.12':['さんじかん','べんきょうする','よむ'],
 '05.1':['のむ'],'05.2':['かく'],'05.3':['する'],'05.4':['せんせい'],'05.7':['のむ'],'05.8':['いそがしい'],'05.10':['ありがとう','いう'],
 '06.1':['おきる'],'06.2':['かえる'],'06.3':['よむ'],'06.4':['きく'],'06.5':['ぬぐ'],'06.6':['けす'],'06.7':['いく'],
 '06.9':['おんがく','きく'],'06.12':['なまえ','かく'],'07.1':['おちゃ','のむ'],'07.8':['みず','のむ'],'07.10':['ほん','よむ'],
 '08.1':['たかい','かう'],'08.5':['おちゃ','コーヒー'],'08.11':['ねる','みず','のむ'],'09.1':['えいが','みる'],'09.3':['あした','ほん','よむ'],'09.6':['しずか'],
 '10.2':['いく'],'10.5':['たかい','かう'],
 'practice-02-1':['たかい'],'practice-03-1':['てがみ','かく'],'practice-04-8':['ふつか','みっか','いそがしい'],
 'practice-05-0':['およぐ'],'practice-05-5':['いそがしい'],'practice-06-1':['かえる'],'practice-06-2':['のむ'],'practice-06-3':['およぐ'],
 'practice-08-6':['えいが','みる','さんぽする'],'practice-10-1':['コーヒー','のむ'],'practice-10-3':['としょかん','ほん','よむ'],
};
const ALTERNATIVES={
 '03.11':['に','へ'],'04.12':['さんじかんぐらい','さんじかんくらい'],
 '05.8':['いそがしいんです','いそがしいのです'],'practice-05-5':['いそがしいんです','いそがしいのです'],
 'practice-02-1':['たかくなかったです','たかくありませんでした'],
 '08.1':['から','ので'],'10.5':['から','ので'],
};
export function stabilizeGrammarCourse(topics,lessons,practices,sessions,copy){
 Object.assign(copy,{'grammar.kanaAssist':'Kana de ayuda: construye tu respuesta','grammar.eraseKana':'Borrar','grammar.step':'Paso {{number}}','grammar.kanjiReference':'Kanji de referencia'});
 const key=(name,value)=>{const id=`grammar.stable.${name}`;copy[id]=value;return id;};
 const lesson=id=>lessons.find(l=>`${l.topicId}.${l.id}`===id);
 const revise=(id,spec)=>{const l=lesson(id),e=l.exercise;const {optionKeys,answer,...base}=e;l.exercise={...base,...structuredClone(spec)};return l.exercise;};
 for(const id of FILL){const old=lesson(id).exercise,solution=copy[old.optionKeys[old.answer]].replace(/[。.!！]+$/u,'');
  revise(id,{kind:'fill-gap',questionKey:key(`${id}.question`,FILL_QUESTIONS[id]),acceptedAnswers:[solution],solutionKey:key(`${id}.solution`,solution)});
 }
 for(const [id,[kind,tokens,solution,question]]of Object.entries(SEQUENCES))revise(id,{kind,tokenKeys:tokens.map((s,i)=>key(`${id}.token.${i}`,s)),solution,questionKey:key(`${id}.question`,question),promptKey:key(`${id}.prompt`,'Selecciona los bloques necesarios en el orden indicado por la consigna.')});
 lesson('09.4').exercise.acceptedOrders=[[1,2,0]];
 lesson('08.10').exercise.acceptedOrders=[[3,0,1,2]];
 for(const [id,[kind,tokens,answer,question,feedback]]of Object.entries(SEGMENTS))revise(id,{kind,optionKeys:tokens.map((s,i)=>key(`${id}.segment.${i}`,s)),answer,questionKey:key(`${id}.question`,question),promptKey:key(`${id}.prompt`,tokens.join('')),successKey:key(`${id}.feedback`,feedback),errorKey:key(`${id}.feedback`,feedback)});
 for(const [id,pairs]of Object.entries(MATCHING))revise(id,{kind:'matching',pairs:pairs.map(([left,right],i)=>({leftKey:key(`${id}.left.${i}`,left),rightKey:key(`${id}.right.${i}`,right)})),questionKey:key(`${id}.question`,'Empareja cada expresión con su función.'),promptKey:key(`${id}.prompt`,'Comprueba si la expresión acompaña a un nombre o a una negación.')});
 const explanation=lesson('05.8');explanation.ideaKey=key('05.8.idea','んです presenta una explicación que responde al contexto, no una causa nueva por sí solo.');
 if(explanation.exercise.contextKey)explanation.exercise.contextKey=key('05.8.context',copy[explanation.exercise.contextKey].replaceAll('説明','respuesta'));
 const known=new Set();
 for(const session of sessions){
  session.learningMode=grammarSessionMode(session.lessonIds.map(id=>lesson(`${session.topicId}.${id}`).exercise));
  if(session.learningMode==='recognition')session.recognitionReasonKey=key(`recognition.${session.id}`,
   `Esta sesión comprueba ${copy[session.titleKey].toLowerCase()} mediante selección o asociación; no evalúa producción escrita.`);
  for(const id of session.lessonIds){const l=lesson(`${session.topicId}.${id}`),concept=`${l.topicId}.${id}`,introduced=[...new Set(INTRO[concept]??'')];introduced.forEach(c=>known.add(c));
   l.prerequisites={requiredKana:l.prerequisites.requiredKana,intendedVocabulary:[...new Set([...SESSION_VOCAB[session.topicId][session.position-1],...LEXICAL[concept]??[]])],allowedKanji:[...known],introducedKanji:introduced};
   if(concept==='00.1')l.prerequisites.inlineExplanations=[{term:'漢字',reading:'かんじ',meaningKey:key('kanji.exception','Kanji: caracteres que representan significado, presentados aquí como sistema de escritura.')}];
   if(EXAMPLES[concept]){const rows=EXAMPLES[concept],meaning=rows.at(-1);l.kanjiExamples=[{segments:rows.slice(0,-1).map(([text,reading])=>({text,...reading?{reading}:{}})),meaningKey:key(`${concept}.kanjiMeaning`,meaning)}];}
  }
  const ls=session.lessonIds.map(id=>lesson(`${session.topicId}.${id}`));
  session.prerequisites={requiredKana:[...new Set(ls.flatMap(l=>l.prerequisites.requiredKana))],intendedVocabulary:[...new Set(ls.flatMap(l=>l.prerequisites.intendedVocabulary))],allowedKanji:[...new Set(ls.flatMap(l=>l.prerequisites.allowedKanji))]};
 }
 // Explicitly controlled vocabulary. These declarations can be checked reliably without tokenizing Japanese.
 for(const [concept,words]of Object.entries({'01.7':['ゆきさん','かばん'],'03.10':['おちゃ'],'06.8':['おちゃ','うち'],'06.9':['おんがく','きく'],'08.5':['おちゃ','コーヒー'],'09.4':['パン','ケーキ']}))lesson(concept).exercise.controlledVocabulary=words;
 for(const exercise of [...lessons.map(l=>l.exercise),...practices.flatMap(p=>p.exercises)]){
  const words=LEXICAL[exercise.id];
  if(words){exercise.controlledVocabulary=words;const l=lesson(exercise.conceptId);if(l)l.prerequisites.intendedVocabulary=[...new Set([...l.prerequisites.intendedVocabulary,...words])];}
 }
 for(const session of sessions)session.prerequisites.intendedVocabulary=[...new Set(session.lessonIds.flatMap(id=>lesson(`${session.topicId}.${id}`).prerequisites.intendedVocabulary))];
 for(const exercise of [...lessons.map(l=>l.exercise),...practices.flatMap(p=>p.exercises)])if(exercise.kind==='fill-gap'){
  const specific={'05.1':'Conjuga のむ en negativo simple no pasado.','05.2':'Conjuga かく en pasado afirmativo simple.','05.8':'Escribe la explicación cortés completa «Es que estoy ocupado», usando いそがしい.','07.8':'Completa solo la forma た afirmativa de のむ para el consejo «Sería mejor beber agua».','practice-03-1':'Completa solo かく en pasado afirmativo cortés: «Ayer escribí una carta».','practice-05-0':'Conjuga およぐ en negativo simple no pasado.'};
  if(specific[exercise.id])exercise.questionKey=key(`${exercise.id}.target`,specific[exercise.id]);
  if(ALTERNATIVES[exercise.id])exercise.acceptedAnswers=[...ALTERNATIVES[exercise.id]];
  const fragment=/＿|___|［respuesta］/.test(copy[exercise.promptKey]);
  exercise.questionKey=key(`${exercise.id}.explicitQuestion`,`${copy[exercise.questionKey]} ${fragment?'Escribe solo el fragmento que falta':'Escribe solo la forma solicitada'}, en kana.`);
  const useful=Array.from(exercise.acceptedAnswers.join('')).filter(c=>/[\p{Script=Hiragana}\p{Script=Katakana}ー]/u.test(c));
  const original=Array.from((wordsForBank(exercise)).join('')).filter(c=>/[\p{Script=Hiragana}\p{Script=Katakana}ー]/u.test(c));
  const distractors=exercise.acceptedAnswers.every(a=>a.length<=2)?['に','へ','で','を','が','の','は','や','と','か','ら']:exercise.id==='04.12'?['じ','か','ん','く','ぐ','ら','い','ご','ろ']:['な','い','ま','す','た','て','る','ん','で'];
  exercise.kanaBank=[...new Set([...useful,...original,...distractors])].sort();
 }
 function wordsForBank(e){return ({'04.12':['さん','じかん'],'06.9':['きく'],'06.12':['かく'],'07.10':['よむ']})[e.id]??LEXICAL[e.id]??[];}
 for(const [id,feedback]of Object.entries({'03.11':'に indica destino; へ expresa dirección. Ambas completan aquí «Voy a la estación».','04.12':'さんじかん es una duración; くらい y ぐらい expresan aproximadamente. Ambas variantes son válidas.','05.8':'いそがしいんです / いそがしいのです presentan la explicación «Es que estoy ocupado».','08.1':'から y ので enlazan el precio como causa con la decisión de no comprar.','10.5':'から y ので enlazan el precio con la decisión de no comprar hoy.'})){const e=lesson(id).exercise;e.successKey=e.errorKey=key(`${id}.feedback`,feedback);}
 const explanationPractice=practices.find(p=>p.topicId==='05').exercises.find(e=>e.id==='practice-05-5');
 explanationPractice.promptKey=key('practice-05-5.prompt','A: どうしていきませんか。\nB: きょうは＿。 · Usa いそがしい (ocupado) para explicar «Es que estoy ocupado».');
 explanationPractice.successKey=explanationPractice.errorKey=key('practice-05-5.feedback','いそがしいんです e いそがしいのです explican la circunstancia con cierre cortés.');
 // Preserve the original texts and task meaning, changing only known written forms. Full source strings remain editable.
 for(const [id,replacements]of Object.entries({
  '10.6':[['いきます','行きます'],['たべます','食べます'],['ほんをよむ','本を読む']],
  '10.7':[['ほんをよみます','本を読みます'],['そのひ','その日'],['いきます','行きます'],['ほんをかりて','本をかりて'],['いったこと','行ったこと']],
  '10.8':[['ひ（día）','日（día）'],['えん','円'],['ほんをよんでも','本を読んでも']],
  '10.10':[['にほんに','日本（にほん）に'],['いったこと','行ったこと'],['いくつもり','行くつもり'],['いま、','今、'],['ほんをよむ','本を読む']],
 })){
  const l=lesson(id),current=copy[l.exercise.contextKey];let context=current;for(const [kana,written]of replacements)context=context.replaceAll(kana,written);
  l.exercise.contextKey=key(`${id}.context`,context);
  const p=practices.find(p=>p.topicId==='10'),index=Number(id.split('.')[1])-1;
  if(p.exercises[index].contextKey)p.exercises[index].contextKey=l.exercise.contextKey;
 }
 for(const p of practices)for(const area of p.areas)if(area.symbol==='文')area.symbol='✓';
 return sessions;
}
