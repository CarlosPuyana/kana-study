import { writeFile } from 'node:fs/promises';

const raw = `一|one|uno|un|一つ|ひとつ|hitotsu|one|uno|un|kun|ひと
七|seven|siete|set|七つ|ななつ|nanatsu|seven|siete|set|kun|なな
万|ten thousand|diez mil|deu mil|一万|いちまん|ichiman|ten thousand|diez mil|deu mil|on|マン
三|three|tres|tres|三つ|みっつ|mittsu|three|tres|tres|kun|みっ
上|above, up|arriba, encima|dalt, sobre|上げる|あげる|ageru|to raise|subir|apujar|kun|あ
下|below, down|abajo, debajo|baix, sota|下げる|さげる|sageru|to lower|bajar|abaixar|kun|さ
中|middle, inside|medio, interior|mig, interior|中学校|ちゅうがっこう|chuugakkou|middle school|instituto de secundaria|institut de secundària|on|チュウ
九|nine|nueve|nou|九つ|ここのつ|kokonotsu|nine|nueve|nou|kun|ここの
二|two|dos|dos|二つ|ふたつ|futatsu|two|dos|dos|kun|ふた
五|five|cinco|cinc|五つ|いつつ|itsutsu|five|cinco|cinc|kun|いつ
人|person|persona|persona|人|ひと|hito|person|persona|persona|kun|ひと
今|now|ahora|ara|今|いま|ima|now|ahora|ara|kun|いま
休|rest|descansar|descansar|休む|やすむ|yasumu|to rest|descansar|descansar|kun|やす
何|what|qué|què|何|なに|nani|what|qué|què|kun|なに
先|ahead, previous|antes, anterior|abans, anterior|先生|せんせい|sensei|teacher|profesor|professor|on|セン
入|enter|entrar|entrar|入る|はいる|hairu|to enter|entrar|entrar|kun|はい
八|eight|ocho|vuit|八つ|やっつ|yattsu|eight|ocho|vuit|kun|やっ
六|six|seis|sis|六つ|むっつ|muttsu|six|seis|sis|kun|むっ
円|yen, circle|yen, círculo|ien, cercle|百円|ひゃくえん|hyakuen|one hundred yen|cien yenes|cent iens|on|エン
出|exit, go out|salir, salida|sortir, sortida|出る|でる|deru|to go out|salir|sortir|kun|で
分|part, minute|parte, minuto|part, minut|分かる|わかる|wakaru|to understand|entender|entendre|kun|わ
前|before, front|antes, delante|abans, davant|前|まえ|mae|front|delante|davant|kun|まえ
北|north|norte|nord|北|きた|kita|north|norte|nord|kun|きた
十|ten|diez|deu|十|じゅう|juu|ten|diez|deu|on|ジュウ
千|thousand|mil|mil|千|せん|sen|thousand|mil|mil|on|セン
午|noon|mediodía|migdia|午後|ごご|gogo|afternoon|tarde|tarda|on|ゴ
半|half|mitad|meitat|半分|はんぶん|hanbun|half|mitad|meitat|on|ハン
南|south|sur|sud|南|みなみ|minami|south|sur|sud|kun|みなみ
友|friend|amigo|amic|友達|ともだち|tomodachi|friend|amigo|amic|kun|とも
右|right|derecha|dreta|右|みぎ|migi|right|derecha|dreta|kun|みぎ
名|name|nombre|nom|名前|なまえ|namae|name|nombre|nom|kun|な
四|four|cuatro|quatre|四つ|よっつ|yottsu|four|cuatro|quatre|kun|よっ
国|country|país|país|国|くに|kuni|country|país|país|kun|くに
土|earth, soil|tierra, suelo|terra, sòl|土|つち|tsuchi|soil|tierra|terra|kun|つち
外|outside|exterior, fuera|exterior, fora|外|そと|soto|outside|fuera|fora|kun|そと
大|big|grande|gran|大きい|おおきい|ookii|big|grande|gran|kun|おお
天|heaven, sky|cielo|cel|天気|てんき|tenki|weather|tiempo|temps|on|テン
女|woman|mujer|dona|女|おんな|onna|woman|mujer|dona|kun|おんな
子|child|niño, hijo|infant, fill|子ども|こども|kodomo|child|niño|infant|kun|こ
学|study|estudio, aprender|estudi, aprendre|学校|がっこう|gakkou|school|escuela|escola|on|ガク
小|small|pequeño|petit|小さい|ちいさい|chiisai|small|pequeño|petit|kun|ちい
山|mountain|montaña|muntanya|山|やま|yama|mountain|montaña|muntanya|kun|やま
川|river|río|riu|川|かわ|kawa|river|río|riu|kun|かわ
左|left|izquierda|esquerra|左|ひだり|hidari|left|izquierda|esquerra|kun|ひだり
年|year|año|any|年|とし|toshi|year|año|any|kun|とし
後|after, behind|después, detrás|després, darrere|後|あと|ato|after|después|després|kun|あと
日|day, sun|día, sol|dia, sol|日|ひ|hi|day|día|dia|kun|ひ
時|time, hour|tiempo, hora|temps, hora|時|とき|toki|time|tiempo|temps|kun|とき
書|write|escribir|escriure|書く|かく|kaku|to write|escribir|escriure|kun|か
月|month, moon|mes, luna|mes, lluna|月|つき|tsuki|moon|luna|lluna|kun|つき
木|tree, wood|árbol, madera|arbre, fusta|木|き|ki|tree|árbol|arbre|kun|き
本|book, origin|libro, origen|llibre, origen|本|ほん|hon|book|libro|llibre|on|ホン
来|come|venir|venir|来る|くる|kuru|to come|venir|venir|kun|く
東|east|este|est|東京|とうきょう|toukyou|Tokyo|Tokio|Tòquio|on|トウ
校|school|escuela|escola|学校|がっこう|gakkou|school|escuela|escola|on|コウ
母|mother|madre|mare|母|はは|haha|mother|madre|mare|kun|はは
毎|every|cada|cada|毎日|まいにち|mainichi|every day|cada día|cada dia|on|マイ
気|spirit, feeling|ánimo, sensación|ànim, sensació|天気|てんき|tenki|weather|tiempo|temps|on|キ
水|water|agua|aigua|水|みず|mizu|water|agua|aigua|kun|みず
火|fire|fuego|foc|火|ひ|hi|fire|fuego|foc|kun|ひ
父|father|padre|pare|父|ちち|chichi|father|padre|pare|kun|ちち
生|life, birth|vida, nacimiento|vida, naixement|生きる|いきる|ikiru|to live|vivir|viure|kun|い
男|man, male|hombre, varón|home, mascle|男|おとこ|otoko|man|hombre|home|kun|おとこ
白|white|blanco|blanc|白い|しろい|shiroi|white|blanco|blanc|kun|しろ
百|hundred|cien|cent|百|ひゃく|hyaku|hundred|cien|cent|on|ヒャク
聞|hear, listen|oír, escuchar|sentir, escoltar|聞く|きく|kiku|to listen|escuchar|escoltar|kun|き
行|go|ir|anar|行く|いく|iku|to go|ir|anar|kun|い
西|west|oeste|oest|西|にし|nishi|west|oeste|oest|kun|にし
見|see|ver|veure|見る|みる|miru|to see|ver|veure|kun|み
話|speak, talk|hablar, conversación|parlar, conversa|話す|はなす|hanasu|to speak|hablar|parlar|kun|はな
語|language, word|idioma, palabra|llengua, paraula|日本語|にほんご|nihongo|Japanese language|idioma japonés|llengua japonesa|on|ゴ
読|read|leer|llegir|読む|よむ|yomu|to read|leer|llegir|kun|よ
車|car, vehicle|coche, vehículo|cotxe, vehicle|車|くるま|kuruma|car|coche|cotxe|kun|くるま
金|gold, money|oro, dinero|or, diners|お金|おかね|okane|money|dinero|diners|kun|かね
長|long, leader|largo, jefe|llarg, cap|長い|ながい|nagai|long|largo|llarg|kun|なが
間|interval, space|intervalo, espacio|interval, espai|時間|じかん|jikan|time|tiempo|temps|on|カン
雨|rain|lluvia|pluja|雨|あめ|ame|rain|lluvia|pluja|kun|あめ
電|electricity|electricidad|electricitat|電車|でんしゃ|densha|train|tren|tren|on|デン
食|eat, food|comer, alimento|menjar, aliment|食べる|たべる|taberu|to eat|comer|menjar|kun|た
高|high, expensive|alto, caro|alt, car|高い|たかい|takai|high, expensive|alto, caro|alt, car|kun|たか`;

const seeds = raw.trim().split('\n').map(line => {
  const [character, en, es, ca, word, reading, romaji, exEn, exEs, exCa, readingType, targetReading] = line.split('|');
  return { character, meanings: { en: en.split(', '), es: es.split(', '), ca: ca.split(', ') },
    example: { word, reading, romaji, translations: { en: exEn, es: exEs, ca: exCa }, readingType, targetReading } };
});

const entries = await Promise.all(seeds.map(async seed => {
  const response = await fetch(`https://kanjiapi.dev/v1/kanji/${encodeURIComponent(seed.character)}`);
  if (!response.ok) throw new Error(`Unable to fetch ${seed.character}: ${response.status}`);
  const source = await response.json();
  return { id: seed.character, character: seed.character, meanings: seed.meanings,
    onyomi: source.on_readings, kunyomi: source.kun_readings, strokeCount: source.stroke_count,
    schoolGrade: source.grade ?? null, frequencyRank: source.freq_mainichi_shinbun ?? null,
    jlptApproxLevel: 'N5', examples: [seed.example], enabled: true };
}));

const output = `/* Generated from KANJIDIC2 metadata via kanjiapi.dev. See KANJI_DATA.md. */\nimport { Kanji } from '../core/models/kanji.model';\n\nexport const KANJI_N5: readonly Kanji[] = ${JSON.stringify(entries, null, 2)};\n`;
await writeFile(new URL('../src/app/data/kanji-n5.generated.ts', import.meta.url), output);
console.log(`Generated ${entries.length} Kanji with ${entries.reduce((n, item) => n + item.examples.length, 0)} examples.`);
