import { Kana } from '../models/kana.model';
import { QuestionType } from '../models/progress.model';

export function answerFor(kana: Kana, questionType: QuestionType): string {
  return questionType === 'romaji-to-kana' ? kana.character : kana.romaji;
}

export function buildQuestionOptions(
  answerKana: Kana,
  questionType: QuestionType,
  allKana: readonly Kana[],
  seed: string,
): readonly string[] {
  const answer = answerFor(answerKana, questionType);
  const sameScriptRequired = questionType === 'romaji-to-kana';
  const candidates = allKana
    .filter(candidate => candidate.id !== answerKana.id)
    .filter(candidate => !sameScriptRequired || candidate.type === answerKana.type)
    .map(candidate => ({
      candidate,
      value: answerFor(candidate, questionType),
      priority: candidate.group === answerKana.group ? 0
        : candidate.variant === answerKana.variant ? 1
        : candidate.type === answerKana.type ? 2 : 3,
    }))
    .filter(option => option.value !== answer)
    .sort((left, right) => left.priority - right.priority
      || hash(`${seed}:candidate:${left.candidate.id}`)
        - hash(`${seed}:candidate:${right.candidate.id}`));

  const seen = new Set<string>([answer]);
  const distractors: string[] = [];
  for (const option of candidates) {
    if (seen.has(option.value)) continue;
    seen.add(option.value);
    distractors.push(option.value);
    if (distractors.length === 3) break;
  }

  return [answer, ...distractors]
    .sort((left, right) => hash(`${seed}:option:${left}`) - hash(`${seed}:option:${right}`));
}

function hash(value: string): number {
  let result = 0;
  for (let index = 0; index < value.length; index++) {
    result = ((result << 5) - result) + value.charCodeAt(index);
  }
  return Math.abs(result);
}
