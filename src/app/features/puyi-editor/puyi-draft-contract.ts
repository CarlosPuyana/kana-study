export const PRIVATE_DRAFT_VERSION = 1;
export const DRAFT_BYTES = 2 * 1024 * 1024;
export const DRAFT_LANGS = ['es', 'en', 'ca'] as const;
export const DRAFT_REGISTERS = ['neutral', 'informal', 'polite'] as const;
export type DraftText = Record<typeof DRAFT_LANGS[number], string | null>;
export type DraftStatus = 'pending' | 'proposed' | 'reviewed' | 'approved';
export type DraftSegment = { text: string; reading?: string };
export interface DraftAudio {
  assetId: string;
  itemId: string;
  revision: number;
  sha256: string;
  synthesisFingerprint: string;
  status: 'unverified' | 'generated' | 'approved' | 'stale';
}
export interface DraftEntry {
  id: string;
  japanese: string;
  reading: string;
  segments: DraftSegment[];
  natural: DraftText;
  structural: DraftText;
  explanation: DraftText;
  vocabulary: { japanese: string; reading: string; meaning: DraftText }[];
  context: string;
  register: typeof DRAFT_REGISTERS[number];
  editorialNote: string;
  status: DraftStatus;
  revision: number;
  audio: DraftAudio | null;
}
export interface DraftPrompt extends DraftEntry { answerPhraseIds: string[]; }
export interface DraftBlock { id: string; name: DraftText; phrases: DraftEntry[]; prompts: DraftPrompt[]; }
export interface PuyiDraft {
  schemaVersion: 1;
  island: { id: string; titleJa: string; title: DraftText; description: DraftText };
  blocks: DraftBlock[];
}
export interface DraftIssue { field: string; code: string; }
export interface DraftSnapshot { revision: number; savedAt: string; document: PuyiDraft; }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const SHA = /^[0-9a-f]{64}$/;
const JAPANESE = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u;
const KANA = /^[\p{Script=Hiragana}\p{Script=Katakana}ー・。、！？?!…「」『』（）()、\s]+$/u;
export const validDraftId = (id: unknown): id is string => typeof id === 'string' && UUID.test(id);
export const draftText = (): DraftText => ({ es: '', en: null, ca: null });

export function blankDraft(): PuyiDraft {
  return { schemaVersion: 1, island: { id: crypto.randomUUID(), titleJa: '', title: draftText(), description: draftText() }, blocks: [] };
}

export function blankEntry(): DraftEntry {
  return {
    id: crypto.randomUUID(), japanese: '', reading: '', segments: [], natural: draftText(), structural: draftText(),
    explanation: draftText(), vocabulary: [], context: '', register: 'neutral', editorialNote: '', status: 'pending', revision: 1, audio: null,
  };
}

export function draftEntries(draft: PuyiDraft): DraftEntry[] {
  return draft.blocks.flatMap(block => [...block.phrases, ...block.prompts]);
}

export function draftIds(draft: PuyiDraft): string[] {
  return [draft.island.id, ...draft.blocks.map(block => block.id), ...draftEntries(draft).map(entry => entry.id)];
}

function plain(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && Object.getPrototypeOf(value) === Object.prototype;
}

export function parsePuyiDraft(raw: string, preserveLocalState = false): { document: PuyiDraft | null; issues: DraftIssue[] } {
  if (new TextEncoder().encode(raw).length > DRAFT_BYTES) return { document: null, issues: [{ field: '', code: 'size' }] };
  try {
    return readPuyiDraft(JSON.parse(raw.replace(/^\uFEFF/, '')), preserveLocalState);
  } catch {
    return { document: null, issues: [{ field: '', code: 'json' }] };
  }
}

export function readPuyiDraft(value: unknown, preserveLocalState = false): { document: PuyiDraft | null; issues: DraftIssue[] } {
  if (!plain(value)) return { document: null, issues: [{ field: '', code: 'shape' }] };
  if (value['schemaVersion'] !== PRIVATE_DRAFT_VERSION) return { document: null, issues: [{ field: 'schemaVersion', code: 'schema' }] };
  const issues: DraftIssue[] = [];
  const ids = new Set<string>();
  const assets = new Set<string>();
  const issue = (field: string, code: string) => { issues.push({ field, code }); };

  function obj(raw: unknown, field: string): Record<string, unknown> {
    if (plain(raw)) return raw;
    issue(field, 'shape');
    return {};
  }
  function list(raw: unknown, field: string): unknown[] {
    if (raw === undefined) return [];
    if (Array.isArray(raw)) return raw;
    issue(field, 'shape');
    return [];
  }
  function str(raw: unknown, field: string): string {
    if (raw === undefined || raw === null) return '';
    if (typeof raw === 'string' && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\uD800-\uDFFF]/u.test(raw)) return raw.normalize('NFC');
    issue(field, 'text');
    return '';
  }
  function id(raw: unknown, field: string): string {
    if (!validDraftId(raw)) {
      issue(field, 'id');
      return '';
    }
    if (ids.has(raw)) issue(field, 'duplicateId');
    ids.add(raw);
    return raw;
  }
  function localized(raw: unknown, field: string): DraftText {
    const result = draftText();
    if (raw === undefined || raw === null) return result;
    const localized = obj(raw, field);
    for (const lang of DRAFT_LANGS) {
      if (localized[lang] !== undefined && localized[lang] !== null) result[lang] = str(localized[lang], field + '.' + lang);
    }
    return result;
  }
  function position<T>(rows: unknown, field: string, parse: (row: unknown, path: string) => T): T[] {
    return list(rows, field).map((row, index) => parse(row, field + '.' + (index + 1)));
  }
  function audio(raw: unknown, itemId: string, field: string): DraftAudio | null {
    if (raw == null) return null;
    const { assetId, itemId: owner, revision, sha256, synthesisFingerprint, status } = obj(raw, field);
    if (!validDraftId(assetId) || owner !== itemId || typeof revision !== 'number' || !Number.isSafeInteger(revision) || revision < 1 ||
        typeof sha256 !== 'string' || !SHA.test(sha256) || typeof synthesisFingerprint !== 'string' || !SHA.test(synthesisFingerprint)) {
      issue(field, 'audio');
      return null;
    }
    if (assets.has(assetId)) issue(field, 'audio');
    assets.add(assetId);
    return {
      assetId, itemId, revision, sha256, synthesisFingerprint,
      status: preserveLocalState && (status === 'generated' || status === 'approved' || status === 'stale') ? status : 'unverified',
    };
  }
  function entry(raw: unknown, field: string): DraftEntry {
    const item = obj(raw, field);
    const entryId = id(item['id'], field + '.id');
    const register = item['register'] ?? 'neutral';
    if (register !== 'neutral' && register !== 'informal' && register !== 'polite') issue(field + '.register', 'choice');
    const status = item['status'];
    const revision = item['revision'];
    return {
      id: entryId,
      japanese: str(item['japanese'], field + '.japanese'),
      reading: str(item['reading'], field + '.reading'),
      segments: position(item['segments'], field + '.segments', (rawSegment, p) => {
        const segment = obj(rawSegment, p);
        const reading = str(segment['reading'], p + '.reading');
        return { text: str(segment['text'], p + '.text'), ...(reading && { reading }) };
      }),
      natural: localized(item['natural'], field + '.natural'),
      structural: localized(item['structural'], field + '.structural'),
      explanation: localized(item['explanation'], field + '.explanation'),
      vocabulary: position(item['vocabulary'], field + '.vocabulary', (rawWord, p) => {
        const word = obj(rawWord, p);
        return { japanese: str(word['japanese'], p + '.japanese'), reading: str(word['reading'], p + '.reading'), meaning: localized(word['meaning'], p + '.meaning') };
      }),
      context: str(item['context'], field + '.context'),
      editorialNote: str(item['editorialNote'], field + '.editorialNote'),
      register: register === 'informal' || register === 'polite' ? register : 'neutral',
      status: status === 'pending' ? status : preserveLocalState && (status === 'reviewed' || status === 'approved') ? status : 'proposed',
      revision: preserveLocalState && typeof revision === 'number' && Number.isSafeInteger(revision) && revision > 0 ? revision : 1,
      audio: audio(item['audio'], entryId, field + '.audio'),
    };
  }
  const island = obj(value['island'], 'island');
  const document: PuyiDraft = {
    schemaVersion: 1,
    island: { id: id(island['id'], 'island.id'), titleJa: str(island['titleJa'], 'island.titleJa'),
      title: localized(island['title'], 'island.title'), description: localized(island['description'], 'island.description') },
    blocks: position(value['blocks'], 'blocks', (rawBlock, p) => {
      const block = obj(rawBlock, p);
      return {
        id: id(block['id'], p + '.id'), name: localized(block['name'], p + '.name'),
        phrases: position(block['phrases'], p + '.phrases', entry),
        prompts: position(block['prompts'], p + '.prompts', (rawPrompt, field) => {
          const prompt = obj(rawPrompt, field);
          const answers = list(prompt['answerPhraseIds'], field + '.answerPhraseIds');
          if (!answers.every(validDraftId) || new Set(answers).size !== answers.length) issue(field + '.answerPhraseIds', 'relation');
          return { ...entry(prompt, field), answerPhraseIds: answers.filter(validDraftId) };
        }),
      };
    }),
  };
  const phrases = new Set(document.blocks.flatMap(block => block.phrases.map(phrase => phrase.id)));
  document.blocks.forEach((block, index) => block.prompts.forEach((prompt, position) => {
    if (prompt.answerPhraseIds.some(answer => !phrases.has(answer))) {
      issue(`blocks.${index + 1}.prompts.${position + 1}.answerPhraseIds`, 'relation');
    }
  }));
  return { document: issues.length ? null : document, issues };
}

export function editorialIssues(draft: PuyiDraft): DraftIssue[] {
  const issues: DraftIssue[] = [];
  const require = (pass: boolean, field: string, code = 'required') => { if (!pass) issues.push({ field, code }); };
  require(!!draft.island.title.es?.trim(), 'island.title.es');
  require(draft.blocks.length > 0, 'blocks');
  draft.blocks.forEach((block, i) => {
    const path = `blocks.${i + 1}`;
    require(!!block.name.es?.trim(), path + '.name.es');
    require(block.phrases.length > 0, path + '.phrases');
    for (const kind of ['phrases', 'prompts'] as const) {
      block[kind].forEach((entry, index) => {
        const key = `${path}.${kind}.${index + 1}`;
        require(JAPANESE.test(entry.japanese), key + '.japanese', 'japanese');
        require(KANA.test(entry.reading) && JAPANESE.test(entry.reading), key + '.reading', 'reading');
        require(entry.segments.length > 0 && entry.segments.every(segment =>
          !!segment.text && (!segment.reading || KANA.test(segment.reading)) && (!/\p{Script=Han}/u.test(segment.text) || !!segment.reading)) &&
          entry.segments.map(segment => segment.text).join('') === entry.japanese &&
          entry.segments.map(segment => segment.reading ?? segment.text).join('') === entry.reading, key + '.segments', 'segments');
        require(!!entry.natural.es?.trim(), key + '.natural.es');
      });
    }
  });
  return issues;
}
