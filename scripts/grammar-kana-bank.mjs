// Kana Assist is an input aid, not an ordered spelling of the answer.
export function grammarKanaBank(exerciseId, answers) {
  const required = [...new Set(Array.from(answers.join('')))];
  const bank = new Set(required);
  const score = character => {
    let hash = 2166136261;
    for (const code of `${exerciseId}:${character}`) hash = Math.imul(hash ^ code.codePointAt(0), 16777619) >>> 0;
    return hash;
  };
  const compare = (a, b) => score(a) - score(b) || a.codePointAt(0) - b.codePointAt(0);
  const distractors = Array.from('はがをにへでとのもだじやゃなかたいくるいえすまんうしられ')
    .filter(character => !bank.has(character));
  for (const character of [...new Set(distractors)].sort(compare)) {
    bank.add(character);
    if (bank.size >= Math.max(6, required.length + 2)) break;
  }
  const ordered = [...bank].sort(compare);
  // Also avoid preserving the answer's character order between distractors.
  if (required.length > 1 && ordered.filter(c => required.includes(c)).join('') === required.join('')) ordered.reverse();
  return ordered;
}
