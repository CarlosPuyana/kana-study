import { DictionaryTerm } from '../models/dictionary.model';
export class DictionaryImportError extends Error {}
export function glossaryText(value: unknown): string[] {
  const strings: string[] = [];
  function visit(node: unknown, depth: number): void {
    if (depth > 64) throw new DictionaryImportError('Invalid glossary');
    if (typeof node === 'string') { if (node.trim()) strings.push(node.trim()); }
    else if (Array.isArray(node)) node.forEach(child => visit(child, depth + 1));
    else if (node && typeof node === 'object') {
      const object = node as Record<string, unknown>;
      if (object['type'] === 'image' || object['tag'] === 'img' || object['tag'] === 'audio' || object['tag'] === 'video') return;
      if (typeof object['text'] === 'string') visit(object['text'], depth + 1);
      if ('content' in object) visit(object['content'], depth + 1);
    }
  }
  visit(value, 0); return [...new Set(strings)];
}
// Data schema only: yomidevs/yomitan dictionary-term-bank-v3-schema.json.
export function parseDictionaryTerm(value: unknown, dictionaryId: string, id: number): DictionaryTerm {
  if (!Array.isArray(value) || value.length !== 8) throw new DictionaryImportError('Invalid entry');
  const [expression, reading, definitionTags, rules, score, glossary, sequence, termTags] = value;
  if (typeof expression !== 'string' || !expression || typeof reading !== 'string' || (definitionTags !== null && typeof definitionTags !== 'string') || typeof rules !== 'string' || typeof score !== 'number' || !Number.isFinite(score) || !Array.isArray(glossary) || !Number.isInteger(sequence) || typeof termTags !== 'string') throw new DictionaryImportError('Invalid entry');
  return { id: `${dictionaryId}:${id}`, dictionaryId, expression, reading: reading || expression, glossaries: glossaryText(glossary), definitionTags: definitionTags ?? '', rules, score, sequence, termTags };
}
export function parseDictionaryIndex(value: unknown): {title: string; revision: string} {
  if (!value || typeof value !== 'object') throw new DictionaryImportError('Invalid index');
  const index = value as Record<string, unknown>;
  if ((index['format'] ?? index['version']) !== 3 || typeof index['title'] !== 'string' || typeof index['revision'] !== 'string' || !/jmdict/i.test(index['title']) || (index['targetLanguage'] ? !['es','spa'].includes(String(index['targetLanguage'])) : !/spanish|español|espanol/i.test(index['title']))) throw new DictionaryImportError('Expected JMdict Spanish v3');
  return { title: index['title'], revision: index['revision'] };
}
