import {VocabularyEntry} from '../models/vocabulary.model';

const normalize = (value: string) => value.normalize('NFC').trim();
// A kana-only spelling restriction is not a different pronunciation. Keep the
// written form exact, but accept either kana script for the same reading.
const phonetic = (value: string) => normalize(value).replace(/[ァ-ヶ]/g, character => String.fromCharCode(character.charCodeAt(0) - 0x60));

export function vocabularyReadingForForm(entry: VocabularyEntry, form: string): string {
  return entry.formReadings ? Object.entries(entry.formReadings).find(([written]) => normalize(written) === normalize(form))?.[1][0] ?? '' : entry.primaryReading;
}

export function vocabularyFormForReading(entry: VocabularyEntry, reading: string): string {
  return entry.formReadings ? entry.writtenForms.find(form => vocabularyFormAllowsReading(entry, form, reading)) ?? '' : entry.primaryWrittenForm;
}

/** Optional reviewed restrictions; legacy entries retain their existing contract. */
export function vocabularyFormAllowsReading(entry: VocabularyEntry, form: string, reading: string): boolean {
  if (!entry.formReadings) return entry.readings.some(value => normalize(value) === normalize(reading));
  return Object.entries(entry.formReadings).some(([written, readings]) => normalize(written) === normalize(form)
    && readings.some(value => phonetic(value) === phonetic(reading)));
}

/** Avoid presenting a reading restricted to another spelling as a reading of the primary. */
export function vocabularyReadingVariants(entry: VocabularyEntry): readonly string[] {
  if (!entry.formReadings) return entry.readings.filter(reading => reading !== entry.primaryReading);
  return entry.readings.filter(reading => phonetic(reading) !== phonetic(entry.primaryReading)).map(reading => {
    if (vocabularyFormAllowsReading(entry, entry.primaryWrittenForm, reading)) return reading;
    const forms = Object.entries(entry.formReadings!).filter(([, readings]) => readings.includes(reading)).map(([form]) => form);
    return forms.length === 1 && forms[0] === reading ? reading : `${forms.join(' / ')}（${reading}）`;
  });
}
