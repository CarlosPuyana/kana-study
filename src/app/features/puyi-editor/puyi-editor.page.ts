import { ChangeDetectionStrategy, Component, ElementRef, Injectable, afterRenderEffect, inject, signal, viewChild } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslationService } from '../../core/services/translation.service';
import { FuriganaText } from '../../shared/components/furigana-text/furigana-text';
import type { PuyiIsland, PuyiLibrarySource, PuyiText } from '../puyi-islands/puyi-library-source';
import {
  blankDraft, blankEntry, DRAFT_BYTES, DRAFT_LANGS, DRAFT_REGISTERS, draftText, editorialIssues, parsePuyiDraft,
  type DraftBlock, type DraftEntry, type DraftIssue, type DraftPrompt, type DraftSnapshot, type DraftText, type PuyiDraft,
} from './puyi-draft-contract';
import { puyiEditorCopy } from './puyi-editor-copy';

interface Summary { id: string; title: DraftText; titleJa: string; revision: number; approved: boolean; }
interface Job { job: string; revision: number; synthesisFingerprint: string; }
class EditorRequestError extends Error {
  constructor(readonly code: string, readonly issues: DraftIssue[] = []) { super(code); }
}

@Injectable({ providedIn: 'root' })
export class PuyiEditorSession {
  readonly document = signal<PuyiDraft | null>(null);
  readonly revision = signal(0);
  readonly history = signal<number[]>([]);
  readonly dirty = signal(false);
  readonly importing = signal(false);
  readonly candidate = signal<PuyiDraft | null>(null);
  readonly raw = signal('');
  readonly islands = signal<readonly PuyiIsland[]>([]);
  readonly source: PuyiLibrarySource = { islands: this.islands.asReadonly(), accessRevision: signal(0), previewOnly: true };
}

@Component({
  selector: 'app-puyi-editor',
  imports: [FormsModule, NgTemplateOutlet, FuriganaText],
  templateUrl: './puyi-editor.page.html',
  styleUrl: './puyi-editor.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PuyiEditorPage {
  readonly session = inject(PuyiEditorSession);
  private readonly copy = inject(TranslationService);
  private readonly router = inject(Router);
  readonly langs = DRAFT_LANGS;
  readonly registers = DRAFT_REGISTERS;
  readonly draftList = signal<Summary[]>([]);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly issues = signal<DraftIssue[]>([]);
  readonly notice = signal('');
  readonly job = signal<Job | null>(null);
  readonly editing = signal<string | null>(null);
  private readonly feedback = viewChild<ElementRef<HTMLElement>>('feedback');

  constructor() {
    this.copy.useStudyCopy(puyiEditorCopy);
    if (!this.session.document()) void this.run(() => this.refresh());
    afterRenderEffect(() => {
      if (this.error() || this.issues().length || this.job()) this.feedback()?.nativeElement.focus();
    });
  }

  t(key: string, params?: Record<string, string | number>): string {
    return this.copy.t('puyi.editor.' + key, params);
  }

  text(value: DraftText): string { return value[this.copy.language()] || value.es || ''; }

  issueText(issue: DraftIssue): string {
    const key = issue.code === 'japanese' ? 'japaneseIssue' : issue.code === 'reading' ? 'readingIssue' : issue.code;
    const field = issue.field.split('.').filter(Boolean).map(part => {
      const labels: Record<string, string> = {
        island: 'new', blocks: 'blockName', phrases: 'phrases', prompts: 'prompts', title: 'title',
        name: 'blockName', natural: 'natural', structural: 'structural', explanation: 'explanation',
        japanese: 'japanese', reading: 'reading', segments: 'furigana', answerPhraseIds: 'answers',
      };
      return labels[part] ? this.t(labels[part]) : part;
    }).join(' › ');
    return [field, this.t(key)].filter(Boolean).join(' — ');
  }

  async request<T>(url: string, data?: unknown): Promise<T> {
    const response = await fetch(url, data === undefined ? undefined : {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new EditorRequestError(result.code, result.issues);
    return result as T;
  }

  private async run(work: () => Promise<void>): Promise<void> {
    if (this.busy()) return;
    this.clearFeedback();
    this.busy.set(true);
    try {
      await work();
    } catch (error) {
      this.error.set(error instanceof EditorRequestError ? error.code : 'internal');
      if (error instanceof EditorRequestError) this.issues.set(error.issues);
    } finally {
      this.busy.set(false);
    }
  }

  private clearFeedback(): void {
    this.error.set('');
    this.issues.set([]);
    this.notice.set('');
    this.job.set(null);
  }

  private async refresh(): Promise<void> { this.draftList.set(await this.request<Summary[]>('/api/drafts')); }

  private open(document: PuyiDraft, revision = 0, history: number[] = []): void {
    this.session.document.set(document);
    this.session.revision.set(revision);
    this.session.history.set(history);
    this.session.dirty.set(revision === 0);
    this.editing.set(null);
  }

  newIsland(): void { this.clearFeedback(); this.open(blankDraft()); }

  openSaved(id: string): void {
    void this.run(async () => {
      const { document, revision, history } = await this.request<DraftSnapshot & { history: number[] }>('/api/draft?id=' + id);
      this.open(document, revision, history);
    });
  }

  leave(): void {
    if (this.session.dirty() && !window.confirm(this.t('discard'))) return;
    this.session.document.set(null);
    this.session.dirty.set(false);
    void this.run(() => this.refresh());
  }

  toggleImport(): void {
    this.clearFeedback();
    this.session.importing.update(value => !value);
    this.session.candidate.set(null);
    this.session.raw.set('');
  }

  paste(value: string): void { this.session.raw.set(value); this.session.candidate.set(null); this.clearFeedback(); }

  chooseFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.paste('');
    void this.run(async () => {
      if (file.size > DRAFT_BYTES) throw new EditorRequestError('size');
      this.paste(await file.text());
    });
  }

  example(): void {
    void this.run(async () => this.paste(JSON.stringify(await this.request('/example.json'), null, 2)));
  }

  validateImport(): void {
    this.session.candidate.set(null);
    void this.run(async () => {
      const { document, issues } = parsePuyiDraft(this.session.raw());
      if (!document) throw new EditorRequestError('invalid', issues);
      this.session.candidate.set(await this.request<PuyiDraft>('/api/check', { document }));
    });
  }

  confirmImport(): void {
    const candidate = this.session.candidate();
    if (!candidate) return;
    this.toggleImport();
    this.open(candidate);
  }

  preview(draft: PuyiDraft): void {
    const localized = (value: DraftText, fallback = ''): PuyiText => ({
      es: value.es || fallback, en: value.en || value.es || fallback, ca: value.ca || value.es || fallback,
    });
    const row = (entry: DraftEntry) => ({
      id: entry.id, japanese: entry.japanese, translation: localized(entry.natural),
      segments: this.segments(entry), audioUrl: '',
    });
    this.session.islands.set([{
      id: draft.island.id, japanese: draft.island.titleJa || this.text(draft.island.title) || this.t('untitled'),
      title: localized(draft.island.title), description: localized(draft.island.description),
      blocks: draft.blocks.map(block => ({
        id: block.id, name: localized(block.name, this.t('untitledBlock')),
        phrases: block.phrases.map(row), questions: block.prompts.map(row),
      })),
    }]);
    void this.router.navigate(['/island', draft.island.id]);
  }

  segments(entry: DraftEntry) {
    return entry.segments.length && entry.segments.map(segment => segment.text).join('') === entry.japanese
      ? entry.segments : [{ text: entry.japanese }];
  }

  changed(entry?: DraftEntry, changesSound = false): void {
    this.session.dirty.set(true);
    this.clearFeedback();
    if (!entry) return;
    entry.status = 'pending';
    if (changesSound && entry.audio) entry.audio.status = 'stale';
  }

  addBlock(draft: PuyiDraft): void {
    draft.blocks.push({ id: crypto.randomUUID(), name: draftText(), phrases: [], prompts: [] });
    this.changed();
  }

  addEntry(block: DraftBlock, kind: 'phrases' | 'prompts'): void {
    const entry = blankEntry();
    if (kind === 'phrases') block.phrases.push(entry);
    else block.prompts.push({ ...entry, answerPhraseIds: [] });
    this.editing.set(entry.id);
    this.changed();
  }

  addWord(entry: DraftEntry): void {
    entry.vocabulary.push({ japanese: '', reading: '', meaning: draftText() });
    this.changed(entry);
  }

  move(list: DraftEntry[], index: number, offset: number): void {
    const to = index + offset;
    if (to < 0 || to >= list.length) return;
    [list[to], list[index]] = [list[index], list[to]];
    this.changed();
  }

  remove(draft: PuyiDraft, list: DraftEntry[], index: number): void {
    const [entry] = list.splice(index, 1);
    this.removeLinks(draft, new Set([entry.id]));
  }

  removeBlock(draft: PuyiDraft, index: number): void {
    const [block] = draft.blocks.splice(index, 1);
    this.removeLinks(draft, new Set(block.phrases.map(phrase => phrase.id)));
  }

  private removeLinks(draft: PuyiDraft, ids: ReadonlySet<string>): void {
    for (const block of draft.blocks) {
      for (const question of block.prompts) {
        const valid = question.answerPhraseIds.filter(id => !ids.has(id));
        if (valid.length !== question.answerPhraseIds.length) {
          question.answerPhraseIds = valid;
          this.changed(question);
        }
      }
    }
    this.changed();
  }

  answers(draft: PuyiDraft): DraftEntry[] { return draft.blocks.flatMap(block => block.phrases); }

  linked(question: DraftPrompt, phrase: DraftEntry, event: Event): void {
    question.answerPhraseIds = (event.target as HTMLInputElement).checked
      ? [...question.answerPhraseIds, phrase.id] : question.answerPhraseIds.filter(id => id !== phrase.id);
    this.changed(question);
  }

  isQuestion(entry: DraftEntry): entry is DraftPrompt { return 'answerPhraseIds' in entry; }

  state(entry: DraftEntry): string {
    return this.t(entry.status === 'reviewed' ? 'reviewedStatus' : entry.status === 'approved' ? 'ready' : entry.status);
  }

  audioState(entry: DraftEntry): string {
    return this.t(entry.audio?.status === 'approved' ? 'audioApproved' : entry.audio?.status ?? 'pending');
  }

  check(draft: PuyiDraft): boolean {
    this.clearFeedback();
    const issues = editorialIssues(draft);
    this.issues.set(issues);
    if (!issues.length) this.notice.set('valid');
    return issues.length === 0;
  }

  save(draft: PuyiDraft, review: 'reviewed' | 'approved' | null = null): void {
    if (review && !this.check(draft)) return;
    if (review === 'approved' && !window.confirm(this.t('approveConfirm'))) return;
    void this.run(async () => {
      const snapshot = await this.request<DraftSnapshot>('/api/save', { document: draft, expected: this.session.revision(), review });
      this.open(snapshot.document, snapshot.revision, [snapshot.revision, ...this.session.history()]);
      this.notice.set('saved');
    });
  }

  restore(draft: PuyiDraft, revision: number): void {
    if (!window.confirm(this.t('restoreConfirm'))) return;
    void this.run(async () => {
      const snapshot = await this.request<DraftSnapshot>('/api/restore', { id: draft.island.id, revision, expected: this.session.revision() });
      this.open(snapshot.document, snapshot.revision, [snapshot.revision, ...this.session.history()]);
      this.notice.set('saved');
    });
  }

  prepare(draft: PuyiDraft, entry: DraftEntry): void {
    void this.run(async () => {
      this.job.set(await this.request<Job>('/api/audio-job', { id: draft.island.id, itemId: entry.id, expected: this.session.revision() }));
      this.notice.set('jobReady');
    });
  }

  download(draft: PuyiDraft): void {
    const blob = new Blob([JSON.stringify(draft, null, 2) + '\n'], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'isla-' + draft.island.id + '.json';
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
