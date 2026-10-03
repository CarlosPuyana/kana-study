// Authored tasks, not generated substitutions. Each tuple records a different pedagogical operation.
// Existing exercise IDs remain the anchor; additional IDs are stable within each concept.
export const lessonExercises = l => [l.exercise,...l.additionalExercises??[]].sort((a,b)=>(a.learningStage??3)-(b.learningStage??3));
const task=(kind,intent,question,prompt,values,answer,why,words=[],extra={})=>({kind,intent,question,prompt,values,answer,why,words,...extra});
const mc=(q,p,options,a,why,w=[])=>task('multiple-choice','recognize',q,p,options.split('|'),a,why,w);
const error=(q,p,options,a,why,w=[])=>task('detect-error','repair',q,p,options.split('|'),a,why,w);
const select=(q,p,options,a,why,w=[])=>task('select-segment','function',q,p,options.split('|'),a,why,w);
const gap=(q,p,answers,why,w=[],extra={})=>task('fill-gap','produce',q+' Escribe en kana solo el fragmento que falta.',p,answers.split('|'),0,why,w,extra);
const build=(q,p,tokens,why,w=[],orders=[])=>task('sentence-builder','compose',q,p,tokens.split('|'),0,why,w,{orders});
const order=(q,p,tokens,why,w=[],orders=[])=>task('sentence-order','organize',q,p,tokens.split('|'),0,why,w,{orders});
const match=(q,p,pairs,why,w=[])=>task('matching','associate',q,p,pairs.map(([left,right])=>[left,right]),0,why,w);
export const EXPANSION_TASKS={
 '00.1':[match('Relaciona cada muestra con su sistema.','Mira la escritura, no su significado.',[['ね','Hiragana: un signo'],['ネ','Katakana: un signo'],['かな','Hiragana: una palabra']], 'ね y かな son hiragana; ネ es katakana.')],
 '00.2':[select('Selecciona la muestra escrita completamente en hiragana.','Compara las formas de los signos.','さかな|サカナ|さカな',0,'Los tres signos de さかな son hiragana.')],
 '00.3':[match('Relaciona el signo añadido con su efecto.','Compara か → が y は → ぱ.',[['゛','Dakuten: sonoriza, como k → g'],['゜','Handakuten: h → p']], 'El dakuten y el handakuten modifican sonidos; no crean una sílaba extra.')],
 '00.4':[error('¿Qué lectura separa incorrectamente un sonido combinado?','にゅ y しょ contienen kana pequeños.','にゅ → nyu|しょ → shi-yo|にゃ → nya',1,'しょ es sho, un sonido combinado; しよ con よ grande sería shi-yo.')],
 '00.5':[mc('¿Dónde hay una pausa consonántica?','Compara las dos palabras.','さか|さっか|さあか',1,'La っ pequeña de さっか indica una consonante geminada; no una vocal larga.')],
 '00.6':[match('Relaciona cada señal con lo que alarga.','Distingue vocal y consonante.',[['ー en ケーキ','Vocal anterior'],['っ en がっこう','Consonante siguiente']], 'ー prolonga una vocal; っ marca una consonante geminada.')],
 '00.7':[select('Selecciona la palabra escrita enteramente en katakana.','No hace falta traducirla.','てれび|テれビ|テレビ',2,'テレビ utiliza solo katakana, frecuente en préstamos.')],
 '00.8':[match('Relaciona cada partícula con su pronunciación.','En función de partícula, no dentro de otra palabra.',[['は','wa'],['へ','e'],['を','o']], 'Las lecturas de estas partículas son wa, e y o.')],
 '01.1':[
 mc('¿Qué bloque suele cerrar una oración nominal?','Identifica la función, sin traducir una palabra aislada.','El tema|El predicado|La posesión',1,'El predicado nominal, como がくせいです, suele cerrar la oración.'),
 build('Construye «Esto es una bolsa». Empieza por これは.','Usa los tres bloques.','これは|かばん|です','El tema va delante y かばんです cierra la oración.',['かばん'])],
 '01.2':[
 mc('¿Qué aporta です en una identificación?','こちらはゆきさんです。','Una identificación cortés|Una pregunta por sí sola|Una acción pasada',0,'です identifica de forma cortés; el pasado sería でした.',['こちら','ゆきさん']),
 build('Preséntate como profesor con trato cortés. Empieza por わたしは.','Usa todos los bloques.','わたしは|せんせい|です','せんせい + です forma un predicado nominal cortés.',['せんせい'])],
 '01.3':[
 error('Selecciona la terminación que mezcla dos cópulas.','Queremos una afirmación simple: «Soy estudiante».','わたしはがくせいだ。|わたしはがくせいだです。|わたしはがくせいです。',1,'だ y です son alternativas de registro; no se acumulan.'),
 gap('Convierte al registro simple afirmativo no pasado.','ゆきさんはせんせいです。 → ゆきさんはせんせい＿。','だ','La cópula simple afirmativa es だ.',['ゆきさん','せんせい'])],
 '01.4':[
 mc('¿Qué función tiene は aquí?','かばんは、これです。','Marca el tema: la bolsa|Marca un destinatario|Marca una pregunta',0,'は presenta aquello de lo que se habla; aquí, la bolsa.',['かばん']),
 build('Di «Tanaka es estudiante». Empieza por たなかさんは.','Usa los tres bloques.','たなかさんは|がくせい|です','は presenta a Tanaka como tema; がくせいです es lo que afirmamos.'),
 gap('Presenta これ como tema; no uses も.','これ＿ほんです。','は','は marca el tema; も añadiría el sentido «también».',['これ','ほん'])],
 '01.5':[
 select('Selecciona la parte que convierte la frase en pregunta cortés.','これはかばんですか。','これは|かばん|です|か',3,'か al final indica la pregunta; です mantiene el trato cortés.',['これ','かばん']),
 gap('Pregunta cortésmente si esa persona es profesora.','ゆきさんはせんせいです＿。','か','La partícula final か convierte la identificación en pregunta.',['ゆきさん','せんせい'])],
 '01.6':[
 select('Selecciona lo que expresa «también».','ゆきさんもせんせいです。','ゆきさん|も|せんせい|です',1,'も incorpora a Yuki al grupo mencionado.',['ゆきさん']),
 build('Tanaka es estudiante. Añade que tú también lo eres. Empieza por わたしも.','Conserva «también», no solo un tema nuevo.','わたしも|がくせい|です','も reemplaza aquí a は y expresa la coincidencia.')],
 '01.7':[
 select('¿Qué parte enlaza a la persona con el objeto que posee?','たなかさんのほんです。','たなかさん|の|ほん|です',1,'の relaciona el poseedor con el objeto; el poseedor va primero.',['たなかさん','ほん']),
 gap('Completa la relación «la bolsa de Yuki».','ゆきさん＿かばん','の','Poseedor + の + objeto: ゆきさんのかばん.')],
 '01.8':[
 match('Relaciona los objetos señalados con el pronombre.','Distingue cercanía al hablante, al oyente o a ninguno de los dos.',[['Cerca del hablante','これ'],['Cerca del oyente','それ'],['Lejos de ambos','あれ']], 'これ・それ・あれ pueden aparecer solos, sin un nombre detrás.'),
 error('¿Qué expresión necesita cambiar a この?','Buscamos «este libro», con ほん detrás.','これはほんです。|これほんです。|このほんです。',1,'これ es pronombre; delante del nombre se usa この.',['ほん'])],
 '01.9':[
 select('¿Qué forma necesita un nombre inmediatamente después?','Distingue determinante y pronombre.','それ|その|そこ',1,'その necesita un nombre, como そのかばん; それ aparece solo.'),
 build('Señalas una bolsa junto al oyente. Di «Esa bolsa es de Yuki». Empieza por そのかばんは.','Usa los tres bloques.','そのかばんは|ゆきさんの|です','その modifica かばん; ゆきさんの indica de quién es.',['ゆきさん'])],
 '01.10':[
 mc('¿Qué pregunta busca un lugar?','Quieres saber dónde está la escuela.','どれですか。|どこですか。|だれですか。',1,'どこ pregunta por lugar; どれ por una cosa y だれ por una persona.',['どれ','だれ']),
 gap('Indica un lugar lejos de hablante y oyente.','がっこうは＿です。','あそこ','あそこ señala un lugar alejado de ambos.',['がっこう'])],
 '01.11':[
 match('Relaciona el trato con una negación nominal.','Ambas niegan «ser estudiante».',[['Cortés','がくせいではありません'],['Simple','がくせいじゃない']], 'La negación nominal no se forma añadiendo ない a です.'),
 gap('Niega en trato cortés formal con では.','せんせいです → せんせい＿。','ではありません','ではありません es la negación cortés formal de la cópula.')],
 '01.12':[
 select('Selecciona la parte que marca pasado cortés.','きのうはやすみでした。','きのうは|やすみ|でした',2,'でした es el pasado cortés de です.',['やすみ']),
 build('Di «Yuki era estudiante», en pasado cortés. Empieza por ゆきさんは.','Usa todos los bloques.','ゆきさんは|がくせい|でした','El nombre no se conjuga; la cópula cambia a でした.',['ゆきさん'])],
 '01.13':[
 match('Relaciona tiempo y negación con su cópula cortés.','Mantén ambos rasgos.',[['No pasado negativo','ではありません'],['Pasado negativo','ではありませんでした']], 'でした añade pasado a la negación cortés.'),
 gap('Niega la identificación en pasado cortés formal con では.','きのうはげつようび＿。','ではありませんでした','ではありませんでした niega que ayer fuera lunes.')],
 '02.1':[
 select('Selecciona el adjetivo que describe directamente un nombre.','あたらしいかばんです。','あたらしい|かばん|です',0,'El adjetivo い conserva い delante del nombre.',['かばん']),
 error('Selecciona el enlace incorrecto para un adjetivo い.','Queremos describir un libro grande.','おおきいほん|おおきいなほん|おおきいほんです',1,'Un adjetivo い no añade な para modificar un nombre.')],
 '02.2':[
 match('Relaciona la clase con el enlace ante へや.','きれい termina en い pero es adjetivo な.',[['おおきい','おおきいへや'],['きれい','きれいなへや']], 'La clase gramatical determina si se necesita な.'),
 build('Describe una habitación tranquila. Empieza por しずかな.','Usa los tres bloques.','しずかな|へや|です','しずか necesita な ante el nombre.',['しずか','きれい','かばん'])],
 '02.3':[
 select('¿Qué bloque completo modifica a ほん?','あたらしいほんはこれです。','あたらしい|ほんは|これです',0,'La descripción あたらしい va delante del nombre.'),
 gap('Une el adjetivo な con el nombre.','きれい＿かばん','な','きれい es adjetivo な, aunque termine en い.',['しずか'])],
 '02.4':[
 mc('¿Cómo se niega un adjetivo い?','Elige la operación, no solo una palabra.','Añadir じゃない a la forma completa|Cambiar い final por くない|Cambiar い por な',1,'La negación simple de un adjetivo い usa su raíz + くない.'),
 error('Selecciona la negación mal formada.','Compara la raíz y la terminación.','おいしくないです。|さむくないです。|たかいじゃないです。',2,'たかい se niega como たかくない, no con じゃない.',['おいしい','たかい']),
 gap('Niega «es grande», con くないです.','このいえは＿です。 · おおきい','おおきくない','Quita い y añade くない.',['いえ','おおきい'])],
 '02.5':[
 mc('¿Qué parte cambia en el pasado de un adjetivo い?','Elige la transformación afirmativa simple.','い → かった|い → でした|い → なかった',0,'El propio adjetivo lleva el pasado: raíz + かった.'),
 error('¿Qué pasado afirmativo está mal formado?','Queremos describir cómo era algo ayer.','たのしかったです。|おいしかったです。|たかいでした。',2,'たかい forma pasado como たかかった; no añade でした.'),
 gap('Describe en pasado afirmativo cortés con かったです.','きのうは＿です。 · さむい','さむかった','さむい pierde い antes de かった.',['さむい'])],
 '02.6':[
 match('Relaciona cada cualidad con su pasado negativo simple.','Busca くなかった.',[['たかい','たかくなかった'],['たのしい','たのしくなかった']], 'La raíz enlaza con くなかった para expresar negación pasada.'),
 gap('Escribe el adjetivo en pasado negativo con くなかった.','このパンは＿です。 · おいしい','おいしくなかった','おいしい → おいしくない → おいしくなかった.',['パン']),
 error('Selecciona la forma que pierde la negación.','Queremos decir «no fue divertido».','たのしくなかった。|たのしかった。|たのしくありませんでした。',1,'たのしかった es pasado afirmativo; las otras dos formas conservan la negación.')],
 '02.7':[
 match('Relaciona cada función con una forma de いい.','Usa la raíz irregular よ-.',[['Pasado afirmativo','よかった'],['Negativo no pasado','よくない']], 'Al conjugar いい se recupera la raíz よ-.'),
 error('Selecciona la forma incorrecta de いい.','Compara las raíces.','よくなかった|いかった|よくない',1,'El pasado es よかった; いかった no conserva la raíz irregular.'),
 gap('Conjuga いい en pasado negativo simple.','いい → ＿','よくなかった','La negación pasada usa よくなかった.')],
 '02.8':[
 match('Relaciona intensidad y estructura habitual.','Distingue afirmación y negación.',[['Muy difícil','とてもむずかしい'],['No muy difícil','あまりむずかしくない'],['Nada difícil','ぜんぜんむずかしくない']], 'あまり y ぜんぜん se practican aquí con negación.'),
 gap('Expresa «no muy difícil» usando あまり y くない.','あまり＿です。 · むずかしい','むずかしくない','あまり modifica una negación para expresar grado limitado.',['たかい'])],
 '02.9':[
 select('Selecciona lo que expresa un gusto positivo.','わたしはりょうりがすきです。','わたしは|りょうりが|すきです',2,'すき expresa gusto; りょうりが indica lo que gusta.'),
 build('Di «No me gusta el pescado», con きらい. Empieza por わたしは.','No uses una negación verbal.','わたしは|さかなが|きらいです','きらい es un predicado adjetival な; el objeto del gusto lleva が.')],
 '02.10':[
 match('Relaciona habilidad y gusto con su predicado.','No son la misma idea.',[['Tiene habilidad','じょうずです'],['Tiene poca habilidad','へたです'],['Le gusta','すきです']], 'じょうず・へた describen habilidad; すき describe gusto.',['へた']),
 gap('Yuki tiene habilidad cocinando. Completa con じょうず.','ゆきさんはりょうりが＿です。','じょうず','りょうりが señala la habilidad descrita por じょうず.',['ゆきさん'])],
 '02.11':[
 error('Selecciona la parte que confunde el gusto con un objeto verbal.','わたしは／さかなを／すきです。','わたしは|さかなを|すきです',1,'すき es un predicado adjetival; aquí se dice さかながすきです.'),
 gap('Presenta a Yuki como tema, sin el sentido «también».','ゆきさん＿りょうりがじょうずです。','は','は introduce el tema; が marca la habilidad.',['ゆきさん']),
 build('Di «Tanaka es bueno cocinando». Empieza por たなかさんは.','Conserva las dos funciones: tema y habilidad.','たなかさんは|りょうりが|じょうずです','は presenta a Tanaka y が señala aquello en lo que tiene habilidad.',['たなかさん'])],
};
const ROWS=EXPANSION_TASKS;
export const GLOSSES={
 'おきる':'levantarse','きれい':'bonito / limpio','これ':'esto','いま':'ahora','おいしい':'sabroso','コーヒー':'café','ひと':'persona',
 'こちら':'esta persona / por aquí','ゆきさん':'Yuki','せんせい':'profesor/a','かばん':'bolsa','がっこう':'escuela','どれ':'cuál','だれ':'quién','やすみ':'descanso / día libre','しずか':'tranquilo/a','いえ':'casa','おおきい':'grande','パン':'pan','さむい':'frío','たかい':'caro / alto','きのう':'ayer','みず':'agua','みる':'ver','のむ':'beber','かく':'escribir','かえる':'volver','する':'hacer','べんきょうする':'estudiar','えいが':'película','おんがく':'música','はたらく':'trabajar','ノート':'cuaderno','うち':'casa','よむ':'leer','ろくじ':'las seis','はちじ':'las ocho','くじ':'las nueve','ねる':'dormir','ほん':'libro','たなかさん':'Tanaka','みっつ':'tres cosas','こうえん':'parque','へや':'habitación','ねこ':'gato','つくえ':'mesa','うえ':'encima','となり':'al lado','だれか':'alguien','よじ':'las cuatro','しちじ':'las siete','ついたち':'día 1 del mes','にじかん':'dos horas','たべる':'comer','かう':'comprar','まつ':'esperar','およぐ':'nadar','きょう':'hoy','たのしい':'divertido','どうして':'por qué','いく':'ir','ひま':'libre / sin ocupación','あした':'mañana','くる':'venir','おはよう':'buenos días','こんばんは':'buenas noches','おもしろい':'interesante','すき':'gustar','あつい':'caluroso / caliente','しゃしん':'foto','あめ':'lluvia','わたし':'yo','あね':'mi hermana mayor','あに':'mi hermano mayor','かさ':'paraguas','のみもの':'bebidas','くだもの':'frutas','りんご':'manzana','えき':'estación','ともだち':'amigo/a','ふる':'caer (lluvia)','そと':'fuera','あさ':'mañana (parte del día)','そこで':'allí','かえす':'devolver','なる':'llegar a ser','ここ':'aquí','はなす':'hablar','とる':'tomar / hacer una foto','けす':'apagar','ほしい':'querer un objeto','いる':'estar (animado)','あそぶ':'jugar / pasar tiempo libre','いそぐ':'darse prisa','おちゃ':'té','テレビ':'televisión','へた':'poco hábil',
};

export const CATEGORY_MINIMUM={introduction:2,integration:2,rule:3,fundamental:4,automation:5};
const FUNDAMENTALS=new Set('02.4 02.5 02.6 02.7 02.11 03.2 03.3 03.4 03.6 03.7 03.8 03.9 03.17 04.9 04.10 04.11 05.1 05.2 05.3 05.8 06.8 06.9 06.10 06.11 06.12 06.13 06.14 07.4 07.5 07.8 07.10 08.7 09.1 09.3 09.6 09.8 09.10 09.11 09.12'.split(' '));
export const exerciseCategory=id=>id.startsWith('00.')||id==='07.7'?'introduction':id.startsWith('10.')?'integration':id.startsWith('06.')&&+id.split('.')[1]<=7?'automation':FUNDAMENTALS.has(id)?'fundamental':'rule';

export function expandGrammarExercises(lessons,sessions,copy){
 const key=(id,field,value)=>{const k=`grammar.expansion.${id}.${field}`;copy[k]=value;return k;};
 const stage={ 'multiple-choice':0,matching:0,'select-segment':1,'detect-error':1,'sentence-builder':2,'sentence-order':2,'fill-gap':3 };
 for(const l of lessons){
  const concept=`${l.topicId}.${l.id}`,rows=ROWS[concept];
  if(!rows?.length)throw new Error(`Missing authored expansion: ${concept}`);
  l.exercise.learningStage=stage[l.exercise.kind];
  l.additionalExercises=rows.map((r,index)=>{
   const id=`${concept}-exp-${index+1}`,extraWords=r.words.filter(w=>!l.prerequisites.intendedVocabulary.includes(w));
   const gloss=extraWords.map(w=>{if(!GLOSSES[w])throw new Error(`Missing gloss: ${concept} ${w}`);return `${w} = ${GLOSSES[w]}`;});
   const e={id,conceptId:concept,kind:r.kind,learningStage:r.stage??stage[r.kind],editorialIntent:r.intent,
    labelKey:l.exercise.labelKey,topicKey:l.exercise.topicKey,
    questionKey:key(id,'question',r.question),promptKey:key(id,'prompt',r.context?r.prompt:[r.prompt,...gloss].join(' · ')),
    successKey:key(id,'success',r.why),errorKey:key(id,'error',`Revisa el patrón. ${r.why}`),
    controlledVocabulary:[...new Set([...l.exercise.controlledVocabulary??l.prerequisites.intendedVocabulary,...r.words])],errorCategoryKey:l.exercise.errorCategoryKey};
   if(r.context)e.contextKey=key(id,'context',[r.context,...gloss].join(' · '));
   if(['multiple-choice','select-segment','detect-error'].includes(r.kind)){e.optionKeys=r.values.map((v,i)=>key(id,`option.${i}`,v));e.answer=r.answer;}
   if(['sentence-builder','sentence-order'].includes(r.kind)){
    // Tokens start rotated, never already solved. The wording explicitly constrains the first block/order.
    const rotated=[r.values.at(-1),...r.values.slice(0,-1)];
    e.tokenKeys=rotated.map((v,i)=>key(id,`token.${i}`,v));e.solution=r.values.map((_,i)=>(i+1)%r.values.length);
    if(r.orders.length)e.acceptedOrders=r.orders.map(o=>o.map(i=>(i+1)%r.values.length));
    e.orderPolicy='constrained';
   }
   if(r.kind==='fill-gap'){
    e.acceptedAnswers=[...r.values];e.solutionKey=key(id,'solution',r.values[0]);
    // Kana buttons supplement normal IME. Include grammatical near-misses; never put the answer in sequence.
    e.kanaBank=[...new Set([...r.values.join(''),...r.words.join(''),...'ないましたてるんではもにとがすくぐっうろけ'])].sort((a,b)=>a.localeCompare(b,'ja'));
   }
   if(r.kind==='matching'){e.pairs=r.values.map(([left,right],i)=>({leftKey:key(id,`left.${i}`,left),rightKey:key(id,`right.${i}`,right)}));e.rightOrder=r.values.map((_,i)=>r.values.length-1-i);}
   return e;
  });
  l.prerequisites.intendedVocabulary=[...new Set([...l.prerequisites.intendedVocabulary,...rows.flatMap(r=>r.words)])];
  const category=exerciseCategory(concept);l.exercisePlan={category,minimum:CATEGORY_MINIMUM[category]};
 }
 // Membership, titles, prerequisites and paths of the 72 sessions remain untouched.
 // This descriptive mode follows all tasks now available in the existing session.
 for(const s of sessions){const ex=s.lessonIds.flatMap(id=>lessonExercises(lessons.find(l=>l.topicId===s.topicId&&l.id===id)));
  s.learningMode=ex.some(e=>e.kind==='fill-gap')?'production':ex.some(e=>['sentence-builder','sentence-order'].includes(e.kind))?'manipulation':'recognition';
 }
}
Object.assign(ROWS,{
 '03.1':[
 mc('¿Qué cambia al conjugar un verbo japonés?','Piensa en la oración, no en la persona que habla.','La terminación según tiempo, afirmación/negación y trato|Una terminación distinta para cada persona|El orden de las letras del nombre',0,'El verbo cambia por tiempo, negación y trato; no por persona.'),
 build('Compón «Bebo agua». Empieza por わたしは.','Conserva el verbo al final.','わたしは|みずを|のみます','のみます es el predicado verbal; みずを indica el objeto.',['みず'])],
 '03.2':[
 mc('¿Qué operación forma ます en un ichidan?','Verbo de partida: みる, ichidan.','Cambiar る por ります|Quitar る y añadir ます|Añadir ます sin quitar る',1,'Un ichidan pierde る antes de añadir ます.',['みる']),
 error('Selecciona la transformación incorrecta de un ichidan.','Todos estos verbos están clasificados como ichidan.','たべる → たべます|みる → みります|おきる → おきます',1,'みる pierde る: みます, sin añadir り.'),
 gap('Conjuga みる, ichidan, en afirmativo cortés no pasado.','みる → ＿','みます','La raíz み- recibe ます.',['みる'])],
 '03.3':[
 match('Relaciona el final godan con su raíz de ます.','No añadas todavía ます.',[['のむ','のみ'],['はなす','はなし'],['かく','かき']], 'En godan, el sonido final de la fila u pasa a la fila i.',['のむ','かく']),
 error('Selecciona la transformación que aplica una regla ichidan a un godan.','かえる se clasifica aquí como godan.','かえる → かえます|のむ → のみます|はなす → はなします',0,'El godan かえる forma かえります, no かえます.',['かえる','のむ']),
 gap('Conjuga はなす, godan, en afirmativo cortés no pasado.','はなす → ＿','はなします','す pasa a し antes de ます.')],
 '03.4':[
 match('Relaciona los irregulares con su forma cortés.','No uses la regla godan o ichidan.',[['する','します'],['くる','きます']], 'する y くる tienen raíces irregulares.',['する']),
 error('Selecciona el verbo que no usa su raíz irregular.','Se busca afirmativo cortés no pasado.','くります|します|きます',0,'くる forma きます, no くります.'),
 gap('Conjuga la acción べんきょうする en afirmativo cortés.','べんきょうする → ＿','べんきょうします','El nombre se mantiene y する pasa a します.',['べんきょうする'])],
 '03.5':[
 match('Relaciona la forma cortés con la de diccionario.','Recupera el grupo correspondiente.',[['のみます','のむ'],['みます','みる'],['します','する']], 'La forma de diccionario es simple no pasada afirmativa.',['する']),
 gap('Recupera el verbo de diccionario ichidan.','たべます → ＿','たべる','たべ- vuelve a recibir る; no se transforma en たべむ.')],
 '03.6':[
 mc('¿Qué forma expresa hábito con trato cortés?','No buscamos pasado ni negación.','のんだ|のまない|のみます',2,'のみます es afirmativo cortés no pasado.'),
 build('Compón «Veo una película». Empieza por えいがを.','Usa un predicado cortés.','えいがを|み|ます','El ichidan みる usa la raíz み- con ます.',['えいが']),
 gap('Conjuga el godan のむ en afirmativo cortés no pasado.','あした、コーヒーを＿。 · のむ','のみます','む pasa a み antes de ます.',['あした','コーヒー'])],
 '03.7':[
 select('Selecciona la terminación que expresa negación cortés.','みません','み|ません',1,'ません niega la acción manteniendo el trato cortés.'),
 build('Di «No escucho música». Empieza por おんがくを.','Usa negación cortés no pasada.','おんがくを|きき|ません','きく usa la raíz きき- ante ません.',['おんがく']),
 gap('Niega のむ con trato cortés, sin pasado.','のむ → ＿','のみません','La raíz のみ- se mantiene; cambia la terminación a ません.')],
 '03.8':[
 match('Relaciona la forma no pasada con el pasado cortés.','Conserva la raíz de ます.',[['みます','みました'],['はたらきます','はたらきました']], 'ました marca pasado afirmativo cortés.',['はたらく']),
 error('¿Qué forma pierde el pasado solicitado?','Queremos «escuché», no un hábito.','ききました|ききます|きいた',1,'ききます es no pasado; ききました y きいた son pasados de distinto registro.'),
 gap('Conjuga のむ en pasado afirmativo cortés.','きのう、みずを＿。','のみました','のみ- + ました indica que la acción ocurrió.',['のむ','みず','きのう'])],
 '03.9':[
 select('Selecciona la terminación que conserva pasado y negación.','はたらきませんでした','はたらき|ませんでした',1,'ませんでした es pasado negativo cortés.',['はたらく']),
 error('¿Qué respuesta cambia el significado «no vi»?','Compara tiempo y negación.','みませんでした|みました|みなかった',1,'みました afirma que vi; las otras dos formas niegan en pasado.'),
 gap('Conjuga きく en pasado negativo cortés.','きく → ＿','ききませんでした','きき- recibe ませんでした para mantener pasado y negación.')],
 '03.10':[
 select('Selecciona el objeto directo de leer.','ゆきさんはノートをよみます。','ゆきさんは|ノートを|よみます',1,'ノートを es lo que se lee; を marca el objeto.',['ゆきさん','ノート']),
 build('Di «Bebo té». Empieza por おちゃを.','Usa los dos bloques.','おちゃを|のみます','El objeto おちゃ va con を delante del verbo.')],
 '03.11':[
 select('Selecciona el destino, no quien se desplaza.','ゆきさんはうちにいきます。','ゆきさんは|うちに|いきます',1,'うちに señala adónde se va.',['ゆきさん','うち']),
 error('Selecciona el destino mal marcado.','Queremos decir que vamos hacia un lugar.','まちにいきます。|えきでいきます。|うちへいきます。',1,'で marca lugar de acción, no el destino de いく; に y へ son posibles aquí.',['うち'])],
 '03.12':[
 match('Relaciona la hora con la función de に.','Señala cuándo ocurre la acción.',[['ろくじにおきます','Hora de levantarse'],['はちじにねます','Hora de acostarse']], 'に marca un momento concreto, no duración.',['ろくじ','はちじ','ねる']),
 build('Di «Me levanto a las ocho». Empieza por はちじに.','Mantén la hora unida a su partícula.','はちじに|おきます','に enlaza una hora concreta con la acción.',['くじ'])],
 '03.13':[
 select('Selecciona el lugar donde sucede la acción.','としょかんでべんきょうします。','としょかんで|べんきょうします',0,'で localiza la acción de estudiar.'),
 gap('Completa el lugar de la acción, no un destino.','うち＿ほんをよみます。','で','Leer sucede en casa: lugar de acción + で.',['ほん','よむ'])],
 '03.14':[
 match('Relaciona la partícula con la función.','La pronunciación de へ como partícula es e.',[['へ en まちへいきます','Dirección del desplazamiento'],['で en まちでべんきょうします','Lugar de la acción']], 'へ indica dirección; で localiza una acción.',['べんきょうする']),
 gap('Usa específicamente へ para señalar la dirección.','うち＿いきます。','へ','La consigna pide へ; に también puede marcar destino, pero no es la partícula solicitada.',['うち'])],
 '03.15':[
 select('Selecciona la compañía.','あねと、うちでべんきょうします。','あねと|うちで|べんきょうします',0,'と señala con quién; で señala dónde.',['うち']),
 gap('Señala que estudias junto a Yuki.','ゆきさん＿べんきょうします。','と','Persona + と expresa compañía.',['ゆきさん'])],
 '03.16':[
 match('Relaciona los límites temporales con su función.','くじからじゅうじまで',[['くじから','Inicio a las nueve'],['じゅうじまで','Final a las diez']], 'から inicia el intervalo y まで lo cierra.',['くじ']),
 build('Di «Estudio de las diez a las tres». Empieza por じゅうじから.','Conserva inicio antes de final.','じゅうじから|さんじまで|べんきょうします','から señala inicio; まで, final.')],
 '03.17':[
 mc('¿Qué forma verbal va antes de にいきます para indicar propósito?','Partimos del verbo みる.','みるに|みてに|みに',2,'Se usa la raíz de ます, み-, seguida de に.',['みる']),
 error('Selecciona el bloque incorrecto.','えいがを／みるに／いきます。','えいがを|みるに|いきます',1,'El propósito necesita みに, no みるに.',['えいが','みる']),
 build('Di «Voy a beber agua». Empieza por みずを.','Construye el propósito antes de いきます.','みずを|のみに|いきます','のみ- es la raíz de ます; に enlaza el propósito con ir.',['みず'])],
 '04.1':[
 match('Relaciona el referente con el verbo de existencia.','Se trata de una mesa y de un perro vivo.',[['つくえ','あります'],['いぬ','います']], 'あります se usa para cosas; います, para seres animados.'),
 build('Di «Hay un libro en casa». Empieza por うちに.','Usa todos los bloques.','うちに|ほんが|あります','El libro es inanimado; el lugar de existencia lleva に.',['うち','ほん'])],
 '04.2':[
 select('Selecciona lo que existe, no su ubicación.','へやにねこがいます。','へやに|ねこが|います',1,'ねこが indica el ser animado cuya existencia se afirma.',['へや','ねこ']),
 gap('Afirma que hay una persona.','ひとが＿。','います','Una persona es animada: se usa います.')],
 '04.3':[
 select('¿Qué función tiene が aquí?','かばんがうちにあります。','Introduce lo que existe|Marca un objeto comprado|Marca una compañía',0,'が señala aquello cuya existencia se afirma.'),
 build('Di «Hay un perro». Empieza por いぬが.','Usa el verbo de existencia adecuado.','いぬが|います','El ser que existe lleva が; un perro vivo se expresa con います.')],
 '04.4':[
 select('Selecciona el lugar de existencia.','こうえんにいぬがいます。','こうえんに|いぬが|います',0,'に localiza la existencia; で se usaría con una acción.',['こうえん']),
 gap('Marca el lugar donde se lee, no donde existe un objeto.','うち＿ほんをよみます。','で','よむ expresa una acción, por eso su lugar lleva で.',['よむ'])],
 '04.5':[
 match('Relaciona cada posición con su significado.','La relación se construye con nombre + の + posición.',[['うえ','Encima'],['した','Debajo'],['となり','Al lado']], 'Las posiciones funcionan como nombres de lugar.',['うえ','となり']),
 order('Di «El libro está debajo de la mesa». Empieza por ほんは.','Mantén つくえのしたに como bloque.','ほんは|つくえのしたに|あります','の relaciona la mesa con su parte inferior; に marca el lugar.',['ほん','つくえ'])],
 '04.6':[
 select('¿Qué forma debe ir seguida de un nombre?','No confundas «cuál» con «qué bolsa».','どれ|どの|だれ',1,'どの necesita un nombre; どれ y だれ pueden aparecer solos.'),
 gap('Pregunta «¿Qué bolsa es de Yuki?».','＿かばんがゆきさんのですか。','どの','どの modifica directamente かばん.',['ゆきさん'])],
 '04.7':[
 select('Selecciona lo que hace total la negación.','かばんにはなにもありません。','かばんには|なにも|ありません',1,'なにも con negación expresa que no hay nada.',['かばん']),
 gap('Completa «No hay nada», no «hay algo».','つくえのうえには＿ありません。','なにも','なにも se combina con el predicado negativo.',['つくえ','うえ'])],
 '04.8':[
 match('Relaciona presencia y ausencia.','Se habla de personas.',[['Hay alguien','だれかいます'],['No hay nadie','だれもいません']], 'だれか afirma alguien; だれも + negación niega a todos.',['だれか']),
 gap('Pregunta si hay alguien en la habitación.','へやに＿いますか。','だれか','だれか pregunta por una persona no identificada.')],
 '04.9':[
 mc('¿Qué contador usarías para hojas de papel?','No necesitamos todavía una lista de irregularidades.','まい|じ|がつ',0,'まい cuenta objetos planos, como papel; じ indica horas.'),
 gap('Completa la cantidad de dos hojas con el contador de objetos planos.','かみをに＿ください。','まい','にまい es dos objetos planos; el número y el contador forman la cantidad.'),
 build('Pide tres manzanas usando el contador general みっつ. Empieza por りんごを.','Conserva el contador completo.','りんごを|みっつ|ください','みっつ cuenta tres cosas con el contador general; no es una fecha.')],
 '04.10':[
 match('Relaciona estas dos horas frecuentes con su lectura.','Aprende estas irregularidades separadas de los minutos.',[['Las cuatro','よじ'],['Las nueve','くじ']], 'Las lecturas horarias son よじ y くじ, no よんじ ni きゅうじ.',['よじ','くじ']),
 gap('Escribe la hora «las siete», no una duración.','いま、＿です。','しちじ','La lectura horaria practicada es しちじ.',['しちじ']),
 error('Selecciona la lectura horaria que debe corregirse.','Se habla de horas, no de cantidad de objetos.','よじ|くじ|よんじ',2,'Las cuatro se lee よじ; よんじ no es la lectura horaria.')],
 '04.11':[
 match('Relaciona tres fechas frecuentes.','Aquí son días del mes, no duración.',[['Día 1 del mes','ついたち'],['Día 2 del mes','ふつか'],['Día 3 del mes','みっか']], 'Estas fechas tienen lecturas propias; no basta añadir にち al número.',['ついたち']),
 error('Selecciona la lectura mal formada para un día del mes.','きょうは＿です。','ふつか|ににち|みっか',1,'El día 2 se lee ふつか y el día 3, みっか. ににち no es una lectura válida de fecha.'),
 gap('Completa la fecha: día 1 del mes.','きょうは＿です。','ついたち','ついたち es el primer día del mes, una lectura irregular.')],
 '04.12':[
 select('Selecciona la duración aproximada.','ほんをにじかんぐらいよみます。','ほんを|にじかんぐらい|よみます',1,'にじかん indica dos horas de duración y ぐらい aproximación.',['ほん','にじかん']),
 gap('Añade la aproximación a una duración.','にじかん＿べんきょうします。','くらい|ぐらい','くらい y ぐらい son variantes válidas para duración aproximada.',['にじかん'])],
 '05.1':[
 match('Relaciona el grupo con la forma ない.','Atiende a la raíz, no a la última letra aislada.',[['たべる, ichidan','たべない'],['のむ, godan','のまない'],['くる, irregular','こない']], 'Ichidan pierde る; godan usa la fila a; くる es irregular.',['たべる']),
 error('Selecciona la negación mal formada del godan かう.','La terminación う usa わ ante ない.','かわない|かあない|かいません',1,'かう forma かわない; la regla no produce かあない.',['かう']),
 gap('Conjuga およぐ en negativo simple no pasado.','およぐ → ＿','およがない','ぐ pasa a が antes de ない.')],
 '05.2':[
 match('Relaciona el final con el pasado simple.','Compara familias diferentes.',[['まつ','まった'],['のむ','のんだ'],['かく','かいた']], 'つ → った, む → んだ y く → いた.',['まつ','のむ']),
 error('Selecciona la transformación que pierde la sonoridad.','およぐ es godan en ぐ.','およいだ|およいた|およぎました',1,'El pasado simple de ぐ termina en いだ: およいだ.',['およぐ']),
 gap('Conjuga ねる, ichidan, en pasado simple afirmativo.','ねる → ＿','ねた','El ichidan pierde る antes de た.',['ねる'])],
 '05.3':[
 select('Selecciona la terminación de pasado negativo simple.','たべなかった','たべ|なかった',1,'なかった conserva negación y pasado.',['たべる']),
 error('¿Qué transformación cambia el sentido «no vino»?','No debe perderse la negación.','こなかった|きた|きませんでした',1,'きた es afirmativo; こなかった y きませんでした niegan en pasado.'),
 gap('Conjuga およぐ en pasado negativo simple.','およぐ → ＿','およがなかった','Primero およがない; ない cambia a なかった.')],
 '05.4':[
 match('Relaciona tiempo y polaridad en registro simple nominal.','El nombre がくせい permanece igual.',[['Afirmación no pasada','がくせいだ'],['Afirmación pasada','がくせいだった'],['Negación pasada','がくせいじゃなかった']], 'La cópula, no el nombre, expresa estos cambios.'),
 gap('Convierte a pasado simple afirmativo.','せんせいでした → せんせい＿','だった','でした pasa a だった al cambiar de registro sin cambiar el pasado.')],
 '05.5':[
 error('Selecciona el uso incorrecto de な al cerrar una oración.','Se busca afirmación simple, sin un nombre detrás.','ひまだ。|ひまなだ。|ひまじゃない。',1,'な enlaza con un nombre; el predicado simple es ひまだ.'),
 gap('Expresa en pasado simple negativo con じゃなかった.','きのうはひま＿。','じゃなかった','El adjetivo な usa la cópula negativa pasada, como un nombre.',['きのう'])],
 '05.6':[
 select('¿Qué palabra lleva por sí misma tiempo pasado?','きのうはたのしかった。','きのうは|たのしかった',1,'Los adjetivos い se conjugan; no necesitan だ.',['きのう','たのしい']),
 error('Selecciona la afirmación simple mal formada.','No añadas una cópula simple a un adjetivo い.','たかい。|たかいだ。|たかかった。',1,'El adjetivo い ya cierra la frase: たかい, sin だ.')],
 '05.7':[
 match('Relaciona las formas equivalentes de distinto registro.','No cambies tiempo ni negación.',[['みません','みない'],['みました','みた'],['みませんでした','みなかった']], 'El registro cambia, pero se conserva el significado temporal y negativo.',['みる']),
 error('Selecciona la equivalencia que cambia tiempo o negación.','Compara ambos lados.','たべません → たべない|たべました → たべた|たべませんでした → たべない',2,'たべませんでした necesita たべなかった para conservar el pasado.',['たべる'])],
 '05.8':[
 mc('¿Qué respuesta explica una situación observada?','A: どうしてくるんですか。 B: «Es que mañana estoy libre».','あしたはひまなんです。|あしたはひまでしたか。|あしたはひまじゃないです。',0,'なんです explica la situación; la respuesta no pregunta ni niega.',['どうして','くる','あした','ひま']),
 build('Explica «Es que hoy estoy libre». Empieza por きょうは.','Con ひま, enlaza la explicación usando な.','きょうは|ひまな|んです','Un nombre o adjetivo な afirmativo enlaza con なんです.',['きょう','ひま']),
 gap('Explica que no vas hoy. Usa la forma ない + んです o のです.','きょうはいかない＿。','んです|のです','La forma simple negativa se une directamente a んです o のです.',['きょう','いく'])],
 '05.9':[
 select('Selecciona el marcador de pregunta informal.','あした、くるの？','あした|くる|の',2,'の con entonación interrogativa pregunta informalmente por la situación.',['あした','くる']),
 gap('Pregunta informalmente si esa persona es estudiante usando の.','がくせい＿？','なの','Con nombre afirmativo se usa なの, no だの.')],
 '05.10':[
 select('Selecciona la parte que marca el contenido citado.','「おはよう」といいます。','おはよう|と|いいます',1,'と delimita lo que se dice.',['おはよう']),
 build('Di que pronuncias «こんばんは». Empieza por 「こんばんは」.','Usa el marcador de cita.','「こんばんは」|と|いいます','La cita precede a と y al verbo de decir.',['こんばんは'])],
 '05.11':[
 mc('¿Qué describe きのうかった?','きのうかったかばん','La bolsa|Ayer como objeto|Una pregunta',0,'La frase relativa está delante de かばん y lo modifica.',['きのう','かう','かばん']),
 order('Di «La película que vi ayer es interesante». Empieza por きのうみた.','No pongas la descripción detrás del nombre.','きのうみた|えいがは|おもしろいです','La relativa きのうみた precede al nombre えいが.',['きのう','みる','おもしろい'])],
 '05.12':[
 select('Selecciona lo que convierte la acción en una actividad nominal.','えいがをみるのがすきです。','えいがを|みる|の|がすきです',2,'の nominaliza えいがをみる, que puede llevar が.',['みる','すき']),
 build('Di «Me gusta ver películas». Empieza por えいがを.','Conserva el verbo de diccionario antes de の.','えいがを|みる|のが|すきです','La acción みる se nominaliza con の y recibe が ante すき.',['すき','みる'])],
});
Object.assign(ROWS,{
 '09.1':[
 select('Selecciona el marcador de experiencia, no una fecha concreta.','おちゃをのんだことがあります。','おちゃを|のんだ|ことがあります',2,'ことがある indica experiencia alguna vez.',['おちゃ']),
 build('Di «He leído este libro alguna vez». Empieza por このほんを.','Usa forma た antes de ことがあります.','このほんを|よんだ|ことがあります','La experiencia usa pasado simple + ことがあります.',['ほん','よむ']),
 gap('Expresa experiencia de beber usando forma た.','コーヒーを＿ことがあります。 · のむ','のんだ','La forma requerida es のんだ, no のむ o のんで.')],
 '09.2':[
 error('Selecciona la forma que niega dentro del verbo, en lugar de negar la experiencia.','Queremos «Nunca he visto esa película».','みたことがありません|みなかったことがあります|みたことがない',1,'La negación de experiencia va en ある; la acción conserva la forma た.'),
 gap('Niega la experiencia en trato cortés.','このえいがをみたことが＿。','ありません','ありません niega la existencia de la experiencia, no el pasado del verbo.')],
 '09.3':[
 match('Relaciona intención afirmativa y negativa.','No garantizan que el plan vaya a cumplirse.',[['よむつもりです','Pienso leer'],['よまないつもりです','Pienso no leer']], 'Diccionario o ない antes de つもり determina la intención.'),
 build('Di «Mañana pienso no ir». Empieza por あしたは.','Usa una intención negativa.','あしたは|いかない|つもりです','La negación precede a つもり, conservando la intención.',['いく']),
 gap('Planifica ver una película usando la forma diccionario.','えいがを＿つもりです。 · みる','みる','つもり enlaza con diccionario, no con ます o て.',['えいが','みる'])],
 '09.4':[
 select('Selecciona la referencia frente a la cual se compara.','ケーキよりパンのほうがたかいです。','ケーキより|パンのほうが|たかいです',0,'より introduce la referencia; のほうが señala lo más caro.'),
 gap('Marca el pan como referencia, no como lo más caro.','パン＿ケーキのほうがたかいです。','より','より marca la base de comparación; el pastel es más caro.')],
 '09.5':[
 select('Selecciona el grupo que delimita la comparación.','のみもののなかで、おちゃがいちばんすきです。','のみもののなかで|おちゃが|いちばん|すきです',0,'のなかで fija el conjunto; no afirma una preferencia sin límites.',['のみもの','おちゃ']),
 build('Dentro de las bebidas, el té es el favorito. Empieza por のみもののなかで.','Conserva grupo antes de elemento.','のみもののなかで|おちゃが|いちばん|すきです','El grupo precede al elemento marcado con がいちばん.',['のみもの','おちゃ'])],
 '09.6':[
 match('Relaciona la clase con el enlace de cambio.','No uses la forma de modificar sustantivos.',[['Adjetivo い: あつい','あつくなる'],['Adjetivo な: しずか','しずかになる'],['Nombre: せんせい','せんせいになる']], 'い → く; nombres y adjetivos な → に ante なる.',['あつい','せんせい']),
 error('Selecciona el cambio mal enlazado.','Queremos describir un nuevo estado.','たかくなりました|しずかくなりました|ひまになりました',1,'しずか, adjetivo な, necesita に antes de なる.',['たかい','ひま']),
 gap('Expresa «se ha vuelto grande» usando くなりました.','いえが＿。 · おおきい','おおきくなりました','El adjetivo い cambia su final a く antes de なる.',['いえ','おおきい'])],
 '09.7':[
 match('Relaciona cambio y elección.','El sujeto decide en uno de los casos.',[['しずかになりました','Llegó a estar tranquilo'],['おちゃにしました','Eligió té']], 'なる describe llegar a un estado; にする presenta una elección.'),
 gap('Elige agua para beber, con にします.','みず＿します。','に','Nombre + にする señala qué opción se elige.',['みず'])],
 '09.8':[
 match('Relaciona la palabra con la raíz que admite すぎる.','Se excluye la terminación final correspondiente.',[['たべる','たべすぎる'],['たかい','たかすぎる'],['しずか','しずかすぎる']], 'Verbo: raíz de ます; い: sin い; な: sin な.',['たべる','しずか']),
 error('Selecciona la forma que conserva indebidamente la terminación.','Queremos decir «demasiado silencioso».','しずかすぎます|しずかなすぎます|たかすぎます',1,'Un adjetivo な enlaza con すぎる sin な.',['しずか']),
 gap('Expresa «comí demasiado», con すぎました.','たべる → ＿','たべすぎました','La raíz たべ- enlaza con すぎる; el pasado cortés va al final.',['たべる'])],
 '09.9':[
 select('Selecciona la marca de suposición.','あした、ゆきさんはくるでしょう。','あした|ゆきさんは|くる|でしょう',3,'でしょう añade probabilidad, sin afirmar certeza.',['ゆきさん','くる']),
 error('Selecciona la suposición nominal mal enlazada.','あめ: lluvia, nombre.','あめでしょう|あめだでしょう|あめだろう',1,'El nombre no lleva だ delante de でしょう; だろう es otra forma.',['あめ'])],
 '09.10':[
 mc('Yo entrego un cuaderno a Yuki. Desde mi punto de vista, ¿qué verbo presenta el regalo?','わたし → ゆきさん：ノート','あげます|くれます|もらいます',0,'Soy quien da hacia otra persona: あげます.',['わたし','ノート']),
 gap('Mi hermana entrega un paraguas a Tanaka. Usa あげる en pasado cortés.','あねはたなかさんにかさを＿。','あげました','La hermana es quien da y Tanaka el destinatario; no viene hacia mí.',['あね','たなかさん','かさ']),
 select('Selecciona el destinatario del regalo.','ゆきさんはあににペンをあげました。','ゆきさんは|あにに|ペンを|あげました',1,'あにに es quien recibe; Yuki da y el bolígrafo es el objeto.',['あに'])],
 '09.11':[
 mc('Tanaka me entrega una foto. Tanaka es el sujeto: ¿qué verbo usarías?','たなかさん → わたし：しゃしん','あげます|くれます|もらいます',1,'Con quien da como sujeto y el regalo hacia mí se usa くれます.',['たなかさん','わたし','しゃしん']),
 gap('Yuki me dio un cuaderno. Usa くれる en pasado cortés.','ゆきさんはわたしにノートを＿。','くれました','El objeto viene de Yuki hacia mí; Yuki sigue siendo sujeto.',['わたし','ノート']),
 error('Selecciona el verbo que invierte quién recibe.','あねは／わたしに／かさを／もらいました。 Queremos «Mi hermana me dio un paraguas».','あねは|わたしに|かさを|もらいました',3,'Con mi hermana como dadora hacia mí, corresponde くれました.',['あね','わたし','かさ'])],
 '09.12':[
 mc('Recibo una foto de Yuki. Yo soy el sujeto: ¿qué verbo corresponde?','わたし ← ゆきさん：しゃしん','くれます|もらいます|あげます',1,'もらいます presenta el intercambio desde quien recibe.',['わたし','しゃしん']),
 gap('Marca de quién recibes el paraguas. Admite las dos partículas de origen personal.','わたしはたなかさん＿かさをもらいました。','に|から','Con もらう, に o から marcan a la persona de quien se recibe.',['わたし','たなかさん','かさ']),
 select('Selecciona a quien recibe, no quien da.','あにはゆきさんからノートをもらいました。','あには|ゆきさんから|ノートを|もらいました',0,'El sujeto de もらう es quien recibe: el hermano.',['あに','ノート'])],
 '10.1':[
 select('Selecciona dónde ocurre la compra, frente al destino posterior.','えきでパンをかって、うちにかえります。','えきで|パンを|うちに|かえります',0,'で localiza comprar; に señala el destino de volver.',['えき','パン','かう','かえる'])],
 '10.2':[
 match('Relaciona formas sin perder tiempo y negación.','Integra dos registros.',[['よまなかった','よみませんでした'],['のんだ','のみました']], 'La equivalencia mantiene pasado y polaridad, cambiando el registro.')],
 '10.3':[
 select('Selecciona la forma que exige el enlace posterior.','コーヒーを＿まえに、みずをのみます。','のむ|のんだ|のんで',0,'まえに exige diccionario; no se escoge la forma solo por el significado.',['コーヒー','のむ','みず'])],
 '10.4':[
 select('Selecciona el bloque relativo que describe a la persona.','きのうきたひとは、せんせいです。','きのうきた|ひとは|せんせいです',0,'La relativa きのうきた precede al nombre ひと.',['きのう','くる','ひと','せんせい']),
 build('Compón «Quiero ir a leer a la biblioteca». Empieza por としょかんに.','Combina destino, propósito y deseo.','としょかんに|ほんをよみに|いきたいです','よみに expresa propósito; いきたい describe el deseo de ir.')],
 '10.5':[
 mc('¿Qué relación mantiene coherente el texto?','あめがふっています。そとにいきません。 Dos frases: razón y decisión.','Contraste con けど|Causa con から o ので|Lista abierta con や',1,'La lluvia explica quedarse; から y ので permiten expresar esa causa.',['あめ','ふる','そと','いく']),
 build('Une las ideas: «Es caro, pero quiero comprarlo». Empieza por たかいですけど.','No cambies el deseo por una negación.','たかいですけど|かいたいです','けど mantiene el contraste entre precio alto y deseo de comprar.')],
 '10.6':[
 mc('¿Dónde estará Yuki después de estudiar?','ゆきさんはあさ、うちでべんきょうします。べんきょうしてから、としょかんにいきます。そこでほんをかります。 · あさ = mañana del día · そこで = allí','En casa|En la biblioteca|En el parque',1,'してから sitúa la visita a la biblioteca después del estudio.',['ゆきさん','あさ','うち','べんきょうする','いく','そこで'])],
 '10.7':[
 select('Selecciona el plan que aún no se ha realizado.','きのう、ゆきさんはとしょかんでほんをかりました。きょうはそのほんをよんでいます。あしたはともだちにかえすつもりです。 · かえす = devolver','Ayer tomó prestado el libro|Hoy está leyendo|Mañana piensa devolverlo',2,'あした y つもり indican intención futura; las otras acciones son pasada y actual.',['ゆきさん','きのう','きょう','ともだち','かえす'])],
 '10.8':[
 mc('Llegas a las once y quieres leer un libro. ¿Qué permite el aviso?','カフェ：じゅうじからごじまで。ここでほんをよんでもいいです。そとのたべものをもってきてはいけません。','Entrar a las once y leer|Traer comida de fuera|Entrar antes de las diez',0,'Las once están dentro del horario y leer está permitido; traer comida externa está prohibido.')],
 '10.9':[
 match('Relaciona cada error con la corrección del mismo significado.','No cambies tiempo o polaridad.',[['しずかくなりました','しずかになりました'],['たかいでした','たかかったです']], 'Adjetivo な + に para cambio; adjetivo い + かった para pasado.',['たかい','なる'])],
 '10.10':[
 mc('¿Qué respuesta respeta una petición y mantiene el permiso del lugar?','A: ここでほんをよんでもいいですか。 B: はい。でも、はなさないでください。','Se puede leer en silencio|Hay obligación de hablar|No se puede leer nunca',0,'B concede permiso para leer y pide no hablar; no prohíbe leer.',['ここ','よむ','はなす'])],
});
Object.assign(ROWS,{
 '06.1':[
 mc('¿Qué operación corresponde a un ichidan?','Usamos たべる y みる.','Quitar る y añadir て|Cambiar る por って|Cambiar る por んで',0,'Los ichidan pierden る y añaden て.',['たべる','みる']),
 error('Selecciona la transformación que aplica una regla godan a un ichidan.','Estos tres verbos son ichidan.','みる → みて|たべる → たべって|ねる → ねて',1,'たべる forma たべて, sin consonante geminada.',['みる','たべる','ねる']),
 gap('Transforma ねる, ichidan, en forma て.','ねる → ＿','ねて','La raíz ね- recibe て.',['ねる']),
 build('Di «Veo este libro y duermo». Empieza por このほんを.','Usa みる en forma て para enlazar.','このほんを|みて|ねます','みる → みて enlaza la acción con dormir.',['ほん','みる','ねる'])],
 '06.2':[
 match('Relaciona los tres finales de esta familia con su forma て.','Verbos godan; no apliques la regla ichidan.',[['かう','かって'],['まつ','まって'],['かえる','かえって']], 'う・つ・る en godan se convierten en って.',['かう','まつ']),
 error('Selecciona la transformación incorrecta del godan en つ.','La pequeña っ forma parte de la terminación.','まつ → まって|まつ → まつて|かう → かって',1,'まつ cambia つ a って; no conserva つ.',['まつ','かう']),
 gap('Transforma el godan かう en forma て.','かう → ＿','かって','う pasa a って, no a うて.',['かう']),
 build('Indica una secuencia: esperar y después volver. Empieza por まって.','La última acción va en pasado cortés.','まって|かえりました','まつ → まって enlaza la primera acción con la siguiente.',['まつ'])],
 '06.3':[
 match('Relaciona verbo y forma て de la familia nasal.','Distingue terminación nasal y geminada.',[['のむ','のんで'],['あそぶ','あそんで'],['よむ','よんで']], 'む・ぶ・ぬ pasan a んで; aquí practicamos む y ぶ.',['あそぶ']),
 error('Selecciona la transformación que pierde la nasal.','あそぶ es godan en ぶ.','うちであそんでかえります|うちであそってかえります|うちでのんでかえります',1,'ぶ cambia a んで, no a って.',['あそぶ','うち','かえる']),
 gap('Transforma あそぶ en forma て.','ゆきさんと＿、うちにかえります。 · あそぶ','あそんで','あそぶ pierde ぶ y recibe んで.',['あそぶ','ゆきさん','うち','かえる']),
 build('Di «Bebo té y duermo». Empieza por おちゃを.','Usa のむ en forma て.','おちゃを|のんで|ねます','のむ → のんで enlaza la acción con dormir.',['おちゃ','ねる'])],
 '06.4':[
 mc('¿Qué regla comparten かく y きく?','Son godan en く, sin usar aquí la excepción いく.','く → いて|く → いで|く → って',0,'Los godan regulares en く forman いて.',['かく']),
 error('Selecciona la forma que usa sonoridad de la familia incorrecta.','かく: escribir.','かいて|かいで|きいて',1,'かく forma かいて; いで corresponde a verbos en ぐ.',['かく']),
 gap('Transforma かく en forma て.','かく → ＿','かいて','El final く cambia a いて.',['かく']),
 build('Di «Escucho música y duermo». Empieza por おんがくを.','Usa きく en forma て.','おんがくを|きいて|ねます','きく forma きいて, con dos い seguidas.',['おんがく','ねる'])],
 '06.5':[
 match('Relaciona estos verbos en ぐ con su forma て.','Mantén la sonoridad de で.',[['およぐ','およいで'],['いそぐ','いそいで']], 'ぐ cambia a いで en ambos verbos.',['いそぐ']),
 error('Selecciona la forma incorrecta de いそぐ.','La familia es ぐ, no く.','いそいで|いそいて|およいで',1,'いそぐ forma いそいで; no pierde la sonoridad.',['いそぐ']),
 gap('Transforma いそぐ en forma て.','＿、えきにいきます。 · いそぐ','いそいで','Quita ぐ y añade いで.',['いそぐ','えき','いく']),
 build('Di «Nado y vuelvo». Empieza por およいで.','Enlaza la primera acción; termina con trato cortés.','およいで|かえります','およぐ → およいで enlaza las acciones.',['かえる'])],
 '06.6':[
 select('Selecciona el resultado de cambiar す por して.','はなす: hablar.','はなして|はなんで|はなって',0,'Los godan en す forman して.',['はなす']),
 error('Selecciona la forma incorrecta del verbo けす.','けす: apagar.','けして|けすて|はなして',1,'す se sustituye por して; no se conserva en けすて.',['はなす']),
 gap('Transforma はなす en forma て.','ゆきさんと＿、うちにかえります。 · はなす','はなして','La raíz はな- recibe して.',['はなす','ゆきさん','うち','かえる']),
 build('Di «Apago la televisión y duermo». Empieza por テレビを.','Usa けす en forma て.','テレビを|けして|ねます','けす → けして enlaza apagar con dormir.',['テレビ','ねる'])],
 '06.7':[
 mc('¿Por qué いく necesita una excepción?','Compara su final con el de きく.','No sigue く → いて|Es siempre ichidan|No tiene forma て',0,'Aunque termina en く, いく forma いって.'),
 error('Selecciona la transformación que olvida la excepción.','Solo una de estas transformaciones es incorrecta.','きく → きいて|いく → いいて|かく → かいて',1,'La forma de いく es いって, con っ.',['かく']),
 gap('Enlaza «ir» con la siguiente acción usando forma て.','うちに＿、ほんをよみます。 · いく','いって','いく usa いって para enlazar las acciones.',['うち','ほん','よむ']),
 build('Indica «Voy a la escuela y estudio». Empieza por がっこうに.','No uses la transformación regular いいて.','がっこうに|いって|べんきょうします','いって es la excepción de いく y enlaza con estudiar.',['がっこう','べんきょうする'])],
 '06.8':[
 mc('¿Qué parte establece el tiempo de esta secuencia?','テレビをみて、ねました。','Solo みて|ねました al final|El sustantivo テレビ',1,'La forma て enlaza; el último verbo marca pasado.',['テレビ','みる','ねる']),
 gap('Enlaza beber con dormir, conservando el orden.','おちゃを＿、ねます。 · のむ','のんで','のんで enlaza la primera acción con la siguiente.'),
 build('Di «Leo un libro y después duermo». Empieza por ほんを.','No intercambies el orden de acciones.','ほんを|よんで|ねます','La secuencia presenta primero leer y después dormir.')],
 '06.9':[
 select('Selecciona la parte que expresa una acción en curso.','いま、ゆきさんはほんをよんでいます。','いま|ゆきさんは|ほんを|よんでいます',3,'よんでいます describe leer en curso en este contexto.',['ゆきさん']),
 error('¿Qué respuesta describe un hábito y no necesariamente lo que ocurre ahora?','La pregunta pide qué está ocurriendo en este momento.','おんがくをきいています。|おんがくをききます。|ほんをよんでいます。',1,'ききます por sí sola es no pasado, no el patrón de acción en progreso.'),
 gap('Di que ahora están viendo una película, con ています.','いま、えいがを＿。 · みる','みています','みて + います expresa la acción en curso.',['みる','えいが'])],
 '06.10':[
 mc('¿Qué expresa けっこんしています aquí?','たなかさんはけっこんしています。','Está en el estado de estar casado|Está celebrando necesariamente la boda ahora|Nunca se ha casado',0,'ている puede expresar un estado resultante; no siempre una acción en curso.'),
 match('Relaciona verbo y lectura contextual de ている.','No traduzcas ambos como «está haciendo».',[['いまほんをよんでいます','Lectura en curso'],['けっこんしています','Estado de estar casado']], 'El tipo de verbo y el contexto determinan la lectura de ている.',['ほん','よむ']),
 build('Di «Yuki está casada». Empieza por ゆきさんは.','Usa el estado resultante.','ゆきさんは|けっこんして|います','けっこんしている describe el estado que permanece tras casarse.',['ゆきさん'])],
 '06.11':[
 mc('¿Qué relación subraya てから?','ほんをよんでから、ねます。','Dormir precede a leer|Dormir sucede después de leer|Ambas acciones deben ocurrir a la vez',1,'てから destaca que la primera acción debe terminar antes de la siguiente.'),
 gap('Subraya que primero termina ducharse y después se duerme.','シャワーをあびて＿、ねます。','から','てから marca la finalización previa de la primera acción.'),
 order('Ordena «Después de beber té, leo». Empieza por おちゃを.','No inviertas las acciones.','おちゃを|のんでから|ほんをよみます','La acción anterior a から sucede primero.')],
 '06.12':[
 mc('¿Qué forma enlaza con una petición afirmativa ください?','Verbo: とる.','とる|とって|とった',1,'La petición afirmativa usa forma て + ください.',['とる']),
 error('Selecciona el enlace mal formado.','Queremos pedir que miren una foto.','しゃしんをみてください。|しゃしんをみるください。|このほんをみてください。',1,'みる debe pasar a みて antes de ください.'),
 build('Pide que beban agua. Empieza por みずを.','Usa una petición afirmativa cortés.','みずを|のんで|ください','のんで enlaza con la petición ください.')],
 '06.13':[
 select('Selecciona la parte que expresa permiso.','しゃしんをとってもいいです。','しゃしんを|とって|もいいです',2,'もいい tras forma て permite la acción.'),
 gap('Permite mirar este libro. Usa てもいいです; escribe solo lo posterior a みて.','このほんをみて＿。','もいいです','Forma て + もいいです expresa permiso.'),
 mc('¿Qué respuesta concede permiso, frente a prohibición o petición?','Selecciona el permiso para hacer una foto.','しゃしんをとってください。|しゃしんをとってはいけません。|しゃしんをとってもいいです。',2,'もいい permite; ください pide y はいけません prohíbe.')],
 '06.14':[
 select('Selecciona lo que prohíbe la acción.','ここでしゃしんをとってはいけません。','ここで|しゃしんを|とって|はいけません',3,'はいけません tras forma て expresa prohibición.',['ここ']),
 build('Prohíbe beber agua aquí. Empieza por ここで.','No lo conviertas en una petición negativa.','ここで|みずを|のんでは|いけません','てはいけません expresa una norma que prohíbe la acción.',['ここ']),
 gap('Completa la prohibición con はいけません.','このほんをみて＿。','はいけません','Forma て + はいけません indica que la acción no está permitida.')],
});
Object.assign(ROWS,{
 '07.1':[
 match('Relaciona invitación y afirmación negativa.','La forma interrogativa cambia el uso.',[['おちゃをのみませんか','Invitación a beber té'],['おちゃをのみません','Afirmación de que no bebo té']], 'ませんか invita a hacer algo juntos; no equivale a la negación declarativa.'),
 build('Invita a leer juntos. Empieza por いっしょに.','Usa la invitación ませんか.','いっしょに|ほんを|よみませんか','La raíz よみ- recibe ませんか para invitar.',['ほん'])],
 '07.2':[
 select('Selecciona la propuesta de acción conjunta.','ドアをしめましょう。','ドアを|しめましょう',1,'ましょう propone hacer algo; no pregunta si el oyente acepta.'),
 gap('Propón beber agua juntos usando ましょう.','いっしょにみずを＿。 · のむ','のみましょう','La raíz のみ- enlaza con ましょう.',['みず'])],
 '07.3':[
 mc('Quieres ofrecerte a cerrar la puerta. ¿Qué dices?','El oyente tiene las manos ocupadas.','ドアをしめましょうか。|ドアをしめません。|ドアをしめました。',0,'ましょうか ofrece realizar la acción por el oyente.'),
 build('Ofrécete a leer el cuaderno. Empieza por ノートを.','Pregunta si tu ayuda es deseada.','ノートを|よみましょうか','ましょうか ofrece hacer la acción por el oyente.',['ノート'])],
 '07.4':[
 match('Relaciona petición y prohibición.','Ambas evitan una acción, pero no tienen el mismo matiz.',[['はなさないでください','Petición: por favor, no hables'],['はなしてはいけません','Norma: está prohibido hablar']], 'ないでください pide no hacer; てはいけません establece una prohibición.'),
 gap('Pide que no apaguen la televisión. Usa ないでください.','テレビを＿。 · けす','けさないでください','けす → けさない + でください.',['テレビ','けす']),
 error('Selecciona la petición negativa mal enlazada.','Queremos «Por favor, no hables».','はなさないでください。|はなすないでください。|はなさないで。',1,'Primero se forma はなさない; no se añade ない a la forma diccionario.')],
 '07.5':[
 match('Relaciona obligación y prohibición.','Observa la forma anterior a はいけません.',[['のまなくてはいけません','Hay que beber'],['のんではいけません','Está prohibido beber']], 'なくて expresa la obligación de hacer; て expresa la prohibición.'),
 gap('Expresa la obligación de levantarse con なくてはいけません.','あした、よじにおき＿。','なくてはいけません','おきる → おきない → おきなくて; la estructura obliga a levantarse.',['あした','よじ','おきる']),
 build('Di «Hay que beber agua». Empieza por みずを.','Construye obligación, no prohibición.','みずを|のまなくては|いけません','La forma negativa en なくて es necesaria para expresar obligación.',['みず'])],
 '07.6':[
 mc('¿Qué forma conserva el sentido de obligación?','あした、がっこうにいかなくてはならない。','No hay que ir a la escuela|Hay que ir a la escuela|Sería mejor no ir a la escuela',1,'なくてはならない obliga; no es una prohibición ni un consejo.',['あした','がっこう','いく']),
 gap('Expresa obligación usando la terminación formal なくてはならない.','くすりをのま＿。','なくてはならない','なくてはならない enlaza con la raíz negativa のま-.')],
 '07.7':[
 match('Relaciona las formas coloquiales con su función.','No las confundas con permiso.',[['のまなきゃ','Obligación abreviada con なきゃ'],['のまなくちゃ','Obligación abreviada con なくちゃ'],['のまないと','Obligación abreviada con ないと']], 'En este uso, las tres expresiones comunican que hay que hacer la acción.')],
 '07.8':[
 match('Relaciona consejo, obligación y prohibición.','Compara qué pide cada estructura.',[['やすんだほうがいい','Conviene descansar'],['やすまなくてはいけない','Hay que descansar'],['やすんではいけない','Está prohibido descansar']], 'たほうがいい aconseja; no impone una obligación absoluta.'),
 build('Aconseja beber agua. Empieza por みずを.','Usa forma た + ほうがいいです.','みずを|のんだ|ほうがいいです','El consejo afirmativo se apoya en la forma た, aunque no describe pasado.'),
 gap('Aconseja no comprar, frente al consejo afirmativo de esta lección.','かう → ＿ほうがいいです。','かわない','El consejo negativo usa ない; contrasta con かったほうがいい.')],
 '07.9':[
 select('Selecciona lo que expresa consejo, sin una norma obligatoria.','かわないほうがいいです。','かわない|ほうがいいです',1,'ほうがいい expresa recomendación; la negación dice qué conviene evitar.'),
 gap('Aconseja no beber esto usando forma ない.','これは＿ほうがいいです。 · のむ','のまない','El consejo de evitar una acción usa forma ない + ほうがいい.')],
 '07.10':[
 match('Relaciona acción deseada y objeto deseado.','Verbo y nombre utilizan patrones distintos.',[['Quiero beber','のみたいです'],['Quiero agua','みずがほしいです']], 'たい se une a raíz verbal; ほしい describe un objeto deseado.',['のむ','みず','ほしい']),
 error('Selecciona la forma mal enlazada.','Se expresa deseo de ver una película.','えいがをみたいです。|えいがをみるたいです。|えいががみたいです。',1,'たい se une a み-, no a みる. En este patrón pueden usarse を o が.',['えいが','みる']),
 gap('Expresa deseo de beber con たいです.','おちゃを＿。 · のむ','のみたいです','La raíz のみ- recibe たいです.',['おちゃ','のむ'])],
 '07.11':[
 select('Selecciona el objeto que se desea.','わたしはかばんがほしいです。','わたしは|かばんが|ほしいです',1,'かばんが es el objeto deseado, no una acción.',['かばん']),
 gap('Deseas un cuaderno como objeto; usa ほしいです.','ノートが＿。','ほしいです','ほしい describe un objeto deseado; たい necesita una raíz verbal.',['ノート'])],
 '08.1':[
 select('Selecciona la parte que da la razón.','ひまだから、いきます。','ひまだから|いきます',0,'La razón termina en から; con un adjetivo な afirmativo se conserva だ.'),
 build('Di «Como está caro, no compro». Empieza por たかいから.','Usa registro simple para la razón.','たかいから|かいません','Un adjetivo い enlaza directamente con から, sin だ.')],
 '08.2':[
 match('Relaciona clase y enlace con ので.','No añadas だ delante de ので.',[['ひま, adjetivo な','ひまなので'],['たかい, adjetivo い','たかいので']], 'Nombres y adjetivos な afirmativos usan なので; los い enlazan directamente.'),
 gap('Expresa la razón «porque estoy libre» usando ので.','ひま＿、いきます。','なので','ひま enlaza con なので, no con だので.')],
 '08.3':[
 mc('¿Qué relación expresa けど?','このほんはむずかしいけど、おもしろいです。','Causa obligatoria|Contraste compatible|Orden temporal',1,'Las ideas «difícil» e «interesante» se contrastan, sin excluirse.'),
 build('Di «Es tranquilo, pero grande». Empieza por しずかだけど.','La primera descripción es un adjetivo な.','しずかだけど|おおきいです','En registro simple afirmativo, しずか usa だ antes de けど.')],
 '08.4':[
 select('¿Qué función tiene が en esta frase?','おおきいですが、しずかです。','Marca el sujeto de existencia|Conecta dos ideas en contraste|Marca una posesión',1,'Después del predicado, が puede conectar un contraste.'),
 gap('Une en trato cortés las dos ideas con が, no con けど.','おもしろいです＿、むずかしいです。','が','Aquí が es conector de contraste, no marcador de sujeto.')],
 '08.5':[
 match('Relaciona marcador y alcance de la lista.','Lista completa frente a ejemplos.',[['おちゃとコーヒー','Té y café: lista cerrada'],['おちゃやコーヒー','Té, café y cosas así']], 'と presenta una lista cerrada; や da ejemplos representativos.'),
 build('Da ejemplos de compras: manzanas, té y cosas así. Empieza por りんごや.','No cierres la lista con と.','りんごや|おちゃを|かいます','や indica que las compras mencionadas son ejemplos.')],
 '08.6':[
 select('Selecciona lo que restringe la compra.','コーヒーだけをかいます。','コーヒー|だけ|を|かいます',1,'だけ limita el objeto comprado a café.'),
 gap('Limita la compra a manzanas usando だけ.','りんご＿をかいます。','だけ','だけ se coloca tras el nombre que se limita.')],
 '08.7':[
 mc('¿Qué patrón presenta ejemplos de actividades sin fijar su orden?','Una lista representativa del tiempo libre.','よんで、みます|よんだり、みたりします|よむまえにみます',1,'たり enumera actividades; て y まえに establecen relaciones temporales.'),
 gap('Forma una actividad representativa a partir de きく.','おんがくを＿、さんぽしたりします。','きいたり','きく → きいた + り; する al final cierra la lista.'),
 select('¿Qué concluyes sobre el orden?','ゆきさんはえいがをみたり、おんがくをきいたりします。','Siempre ve una película antes de escuchar|Da ejemplos, sin imponer ese orden|Hace solo una de las dos cosas',1,'たり ofrece actividades representativas; no establece una secuencia fija.',['ゆきさん'])],
 '08.8':[
 select('Selecciona el indicador de que la acción está completada.','もうえいがをみました。','もう|えいがを|みました',0,'もう con pasado indica que ver la película ya ocurrió.'),
 gap('Indica que ya lo has leído.','A: そのほんをよみましたか。 B: はい、＿よみました。','もう','もう sitúa la acción como ya completada.')],
 '08.9':[
 match('Relaciona continuidad y finalización.','El predicado ayuda a interpretar el adverbio.',[['まだうちにいます','La estancia continúa'],['もううちにかえりました','La vuelta ya ocurrió']], 'まだ afirmativo expresa continuidad; もう con pasado, finalización.',['いる','かえる']),
 build('Di «Todavía veo esa película», como acción que continúa. Empieza por まだ.','No lo cambies a «todavía no la he visto».','まだ|そのえいがを|みています','まだ + ている afirmativo expresa que la acción continúa.')],
 '08.10':[
 mc('¿Qué respuesta señala una acción esperada pendiente?','Te preguntan si ya leíste el libro.','まだよんでいません。|まだよんでいます。|もうよみました。',0,'まだ + ていません dice que todavía no se ha completado leer.'),
 gap('Di «Todavía no he vuelto». Usa ていません.','まだうちに＿。 · かえる','かえっていません','かえる → かえって + いません expresa una vuelta pendiente.',['かえる'])],
 '08.11':[
 error('Selecciona el enlace incorrecto para «antes de beber».','La acción principal puede estar en pasado.','のむまえに|のんだまえに|のむまえにみました',1,'Ante まえに se mantiene diccionario, aunque la acción principal sea pasada.'),
 order('Di «Antes de dormir, bebo agua». Empieza por ねるまえに.','Conserva la acción previa como primer bloque.','ねるまえに|みずを|のみます','La forma diccionario ねる enlaza con まえに.')],
});

// Application follows form practice in the high-priority automation concepts.
for(let n=1;n<=7;n++)ROWS['06.'+n].at(-1).stage=4;
ROWS['08.7'].at(-1).stage=4;
for(const [id,rows]of Object.entries(ROWS))if(id.startsWith('10.'))for(const r of rows)r.stage=4;
// Reading uses the existing passage surface rather than the large transformation prompt.
for(const id of ['10.6','10.7','10.8','10.10'])for(const r of ROWS[id]){
 r.context=r.prompt.split(' · ')[0];r.prompt='Lee el texto japonés y responde con su información.';
}
ROWS['10.7'][0].values=['きのう、としょかんでほんをかりました。','きょう、そのほんをよんでいます。','あした、ともだちにかえすつもりです。'];
