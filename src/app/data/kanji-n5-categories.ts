// Kana Study's pedagogical grouping; not an official JLPT classification.
export type KanjiTheme = 'numbersMoney' | 'timeCalendar' | 'peopleFamily' | 'directionsPlaces'
  | 'natureElements' | 'schoolLanguage' | 'actions' | 'descriptionsEveryday';
export const KANJI_N5_CATEGORIES: readonly { theme: KanjiTheme; characters: readonly string[] }[] = [
  { theme: 'numbersMoney', characters: ['一','二','三','四','五','六','七','八','九','十','百','千','万','円'] },
  { theme: 'timeCalendar', characters: ['今','午','半','分','前','後','年','日','時','月','毎','間'] },
  { theme: 'peopleFamily', characters: ['人','友','女','子','母','父','男','生','先'] },
  { theme: 'directionsPlaces', characters: ['上','下','中','北','南','右','国','外','左','東','西'] },
  { theme: 'natureElements', characters: ['土','天','山','川','木','気','水','火','雨','金'] },
  { theme: 'schoolLanguage', characters: ['名','学','書','本','校','聞','話','語','読'] },
  { theme: 'actions', characters: ['休','入','出','来','行','見','食'] },
  { theme: 'descriptionsEveryday', characters: ['何','大','小','白','車','長','電','高'] },
];
export const KANJI_THEME_BY_CHARACTER: Readonly<Record<string, KanjiTheme>> = Object.fromEntries(
  KANJI_N5_CATEGORIES.flatMap(category => category.characters.map(character => [character, category.theme])),
);
