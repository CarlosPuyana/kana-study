import {VOCABULARY_N5} from './vocabulary-n5.generated';

describe('reviewed Spanish Vocabulary meanings', () => {
  const meaning = (written: string) => VOCABULARY_N5.find(entry => entry.primaryWrittenForm === written)!;

  it('distinguishes lexical senses previously confused through English homonyms', () => {
    for (const [written, spanish] of [
      ['お皿', 'plato'], ['どなた', 'quién (trato respetuoso)'], ['誰', 'quién'],
      ['ネクタイ', 'corbata'], ['ノート', 'cuaderno'], ['軽い', 'ligero'],
      ['時計', 'reloj'], ['出す', 'sacar'], ['吹く', 'soplar'], ['貼る', 'pegar / adherir'],
      ['閉まる', 'cerrarse'], ['頼む', 'pedir / solicitar'], ['半分', 'mitad'],
    ]) {
      expect(meaning(written).quizMeaning.es).toBe(spanish);
      expect(meaning(written).meanings.es).toEqual([spanish]);
    }
  });

  it('preserves transitivity and noun/verb contrasts in the exercise labels', () => {
    expect(meaning('開く').quizMeaning.es).toBe('abrirse');
    expect(meaning('開ける').quizMeaning.es).toBe('abrir');
    expect(meaning('休み').quizMeaning.es).toBe('descanso');
    expect(meaning('休む').quizMeaning.es).toBe('descansar');
    expect(meaning('並ぶ').quizMeaning.es).toBe('ponerse en fila');
    expect(meaning('並べる').quizMeaning.es).toBe('poner en fila / ordenar');
    expect(meaning('話').quizMeaning.es).toBe('conversación / charla');
    expect(meaning('話す').quizMeaning.es).toBe('hablar');
  });

  it('keeps interrogative accents, date durations and meaningful contextual distinctions', () => {
    expect(meaning('いつ').quizMeaning.es).toBe('cuándo');
    expect(meaning('どうして').quizMeaning.es).toBe('por qué razón');
    for (const written of ['二日', '三日', '四日', '五日', '六日', '七日', '八日', '九日', '十日', '二十日']) {
      expect(meaning(written).quizMeaning.es).toMatch(/días$/u);
    }
    expect(meaning('さ来年').quizMeaning.es).toBe('dentro de dos años');
    expect(meaning('毎晩').quizMeaning.es).toBe('cada noche');
    expect(meaning('夕方').quizMeaning.es).toBe('al atardecer / a última hora de la tarde');
  });

  it('does not turn regional Spanish or unresolved identity conflicts into automatic fixes', () => {
    expect(meaning('引く').quizMeaning.es).toBe('jalar');
    expect(meaning('バター').quizMeaning.es).toBe('manteca');
    expect(meaning('立つ').quizMeaning.es).toBe('pararse');
    expect(meaning('せっけん').quizMeaning.es).toBe('economía');
    expect(meaning('伯父/叔父').primaryReading).toBe('おじいさん');
    expect(meaning('伯父/叔父').quizMeaning.es).toBe('abuelo');
  });
});
