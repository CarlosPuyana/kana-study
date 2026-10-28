import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { IDBFactory, IDBKeyRange, IDBObjectStore as FakeObjectStore } from 'fake-indexeddb';
import { CustomDeck, CustomDeckCard } from '../models/deck-catalog.model';
import { CustomDeckRepository, CUSTOM_DECKS_ENABLED, CUSTOM_DECK_IDB, CUSTOM_DECK_DATABASE } from './custom-deck.repository';
import { DeckCatalogService } from './deck-catalog.service';
import { DeckStudyService } from './deck-study.service';
import { DeckSchedulerService, DECK_SCHEDULER_ENABLE_FUZZ } from './deck-scheduler.service';
import { WorkspaceService } from './workspace.service';
import { lexicalIdentity, validateCard, validateDeck, eventValid } from './custom-deck-validation';
import { BUILTIN_DECK_CONTENT } from './builtin-deck-content';
import { JAPANESE_1500_ENTRIES } from '../../data/japanese-1500.generated';
import { JAPANESE_1500_INDEX } from '../../data/japanese-1500.index.generated';
import { STUDY_DECKS } from '../../data/study-decks';
import { DeckPersistenceRouter } from './deck-persistence-router';
import { ProfileStatsService } from './profile-stats.service';
import { LocalRushRepository } from './rush-repository.service';
import { planDailyStudy } from './daily-study-planner';
import { customDeck, customCard } from './custom-deck.fixture';
const NOW = new Date('2026-10-21T12:00:00.000Z');
describe('Custom decks H1: atomic local catalog and the existing FSRS engine', () => {
    let factory: IDBFactory, repo: CustomDeckRepository, catalog: DeckCatalogService, study: DeckStudyService, workspace: WorkspaceService;
    const enabled = signal(true);
    beforeEach(() => {
        TestBed.resetTestingModule();
        localStorage.clear();
        enabled.set(true);
        factory = new IDBFactory();
        vi.stubGlobal('indexedDB', factory);
        vi.stubGlobal('IDBKeyRange', IDBKeyRange);
        TestBed.configureTestingModule({ providers: [{ provide: CUSTOM_DECKS_ENABLED, useValue: enabled }, { provide: CUSTOM_DECK_IDB, useValue: factory }, { provide: DECK_SCHEDULER_ENABLE_FUZZ, useValue: false }, { provide: LocalRushRepository, useValue: { getStats: async () => ({ sessions: [], coverage: [] }) } }] });
        repo = TestBed.inject(CustomDeckRepository);
        catalog = TestBed.inject(DeckCatalogService);
        study = TestBed.inject(DeckStudyService);
        workspace = TestBed.inject(WorkspaceService);
    });
    afterEach(() => { TestBed.resetTestingModule(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
    async function seed(deckId = 'md-試験') { await repo.create('create-' + deckId, customDeck(deckId), [await customCard(deckId)]); const state = await catalog.load(deckId); if (state.status !== 'ready')
        throw new Error(JSON.stringify(state)); return state.value; }
    async function grade(deckId = 'md-試験', rating: 'again' | 'good' = 'good', at = NOW) { const loaded = await catalog.load(deckId); if (loaded.status !== 'ready')
        throw new Error('missing fixture'); const { deck, content } = loaded.value; const snapshot = await study.snapshot(deck, content.index, at), choice = study.chooseNext(snapshot, deck, { debt: 0 }).choice!; const preview = study.preview(deck, choice, at); return { event: await study.rate(deck, choice, preview, rating, 1234, at), preview, choice, deck }; }
    it('returns every original builtin object, ID, index and field unchanged', async () => {
        const loaded = await catalog.load('japanese-1500');
        expect(loaded.status).toBe('ready');
        if (loaded.status !== 'ready')
            return;
        expect(loaded.value.content).toBe(BUILTIN_DECK_CONTENT);
        expect(loaded.value.content.entries()).toBe(JAPANESE_1500_ENTRIES);
        expect(loaded.value.content.index).toBe(JAPANESE_1500_INDEX);
        expect(loaded.value.deck.cardCount).toBe(1500);
        expect(loaded.value.deck.settings).toEqual(STUDY_DECKS[0].settings);
        for (const entry of JAPANESE_1500_ENTRIES)
            expect(loaded.value.content.entry(entry.id)).toBe(entry);
        const choice = { entryId: JAPANESE_1500_INDEX[0].id, kind: 'new' as const, progress: null };
        expect(study.preview(loaded.value.deck, choice, NOW)).toEqual(TestBed.inject(DeckSchedulerService).preview(null, .9, NOW));
    });
    it('loads real custom entries, a literal title and only its own index', async () => { const { deck, content } = await seed(); expect(deck.displayName).toEqual({ kind: 'literal', text: customDeck().title }); expect(deck.cardCount).toBe(1); expect(content.entries()).toHaveLength(1); expect(content.entry('card-猫')?.word).toBe('猫'); expect(content.entry(JAPANESE_1500_INDEX[0].id)).toBeNull(); expect(content.index).toEqual([{ id: 'card-猫', order: 1 }]); expect(await repo.getDeckProgress(deck.id)).toEqual([]); await catalog.refresh(); expect(catalog.get(deck.id)?.cardCount).toBe(1); });
    it('hides custom metadata and deep links behind the default gate', async () => { await seed(); enabled.set(false); await catalog.refresh(); expect(catalog.items().map(d => d.id)).toEqual(['japanese-1500']); expect(await catalog.load('md-試験')).toEqual({ status: 'missing' }); expect(() => TestBed.inject(DeckPersistenceRouter).bind('md-試験')).toThrow(); });
    it.each(['again', 'good'] as const)('uses the exact existing %s branch and undoes without an extra effective event', async (rating) => {
        await seed();
        const { event, preview } = await grade('md-試験', rating);
        expect(eventValid(event)).toBe(true);
        expect((await repo.getDeckProgress('md-試験'))[0].card).toEqual(preview[rating].card);
        expect(event.fsrsRating).toBe(rating === 'again' ? 1 : 3);
        expect(event.elapsedAnswerMs).toBe(1234);
        await study.undo(event);
        await study.undo(event);
        expect(await repo.getDeckProgress('md-試験')).toEqual([]);
        expect(await repo.getDeckReviewEvents('md-試験')).toEqual([]);
        expect((await repo.getDailyState('md-試験', '2026-10-21'))?.introducedEntryIds).toEqual([]);
        expect((await repo.journal()).map(o => o.kind)).toEqual(['create', 'review', 'undo']);
    });
    it('keeps the same lexical identity in two decks completely independent', async () => { await seed(); await seed('md-other'); const { event } = await grade(); expect(await repo.getDeckProgress('md-other')).toEqual([]); expect((await repo.content('md-other'))[0].lexicalIdentity.key).toBe((await repo.content('md-試験'))[0].lexicalIdentity.key); await grade('md-other', 'again'); await study.undo(event); expect(await repo.getDeckProgress('md-試験')).toEqual([]); expect(await repo.getDeckReviewEvents('md-other')).toHaveLength(1); });
    it('edits real content without changing any FSRS fields or history', async () => { await seed(); await grade(); const before = await repo.getDeckProgress('md-試験'), events = await repo.getDeckReviewEvents('md-試験'); const card = (await repo.content('md-試験'))[0]; await repo.editCard('edit', { ...card, glosses: [{ ...card.glosses[0], text: 'gato editado' }], contentVersion: 2 }, 1); expect(await repo.getDeckProgress('md-試験')).toEqual(before); expect(await repo.getDeckReviewEvents('md-試験')).toEqual(events); expect((await repo.content('md-試験'))[0].glosses[0].text).toBe('gato editado'); });
    it('rejects lexical replacement under an existing card ID, rather than transferring memory', async () => { await seed(); await grade(); const card = (await repo.content('md-試験'))[0]; const lexical = await lexicalIdentity({ ...card.lexicalIdentity.anchor, entryId: '999' }, ['猫'], 'fixture'); await expect(repo.editCard('replace', { ...card, lexicalIdentity: lexical, contentVersion: 2 }, 1)).rejects.toThrow('new card ID'); expect(await repo.getDeckProgress('md-試験')).toHaveLength(1); });
    it('deduplicates concurrent writes and replays durable operation receipts', async () => { const d = customDeck(), c = await customCard(); await Promise.all([repo.create('op', d, [c]), repo.create('op', d, [c])]); await repo.create('same-content', d, [c]); expect(await repo.list()).toHaveLength(1); expect(await repo.content(d.id)).toHaveLength(1); await expect(repo.create('op', { ...d, title: 'different' }, [c])).rejects.toThrow(); expect(await repo.journal()).toHaveLength(2); });
    it('rolls back an aborted transaction with its journal, then recovers using the same operation', async () => {
        const d = customDeck(), c = await customCard();
        const proto = FakeObjectStore.prototype;
        await repo.create('schema', customDeck('md-schema'), []);
        const put = proto.put;
        let fail = true;
        vi.spyOn(proto, 'put').mockImplementation(function (this: IDBObjectStore, ...args: [
            value: any,
            key?: IDBValidKey
        ]) { if (this.name === 'journal' && fail) {
            fail = false;
            throw new DOMException('quota', 'QuotaExceededError');
        } return put.apply(this, args); });
        await expect(repo.create('atomic', d, [c])).rejects.toThrow();
        expect((await repo.list()).map(x => x.id)).toEqual(['md-schema']);
        expect(await repo.content(d.id)).toEqual([]);
        expect((await repo.journal()).map(o => o.id)).toEqual(['schema']);
        await repo.create('atomic', d, [c]);
        expect(await repo.content(d.id)).toHaveLength(1);
    });
    it('retries the same frozen review without incrementing reps or time twice', async () => { await seed(); const { event, preview, choice, deck } = await grade(); const repeated = await study.rate(deck, choice, preview, 'good', 9000, new Date(NOW.getTime() + 4000)); expect(repeated).toEqual(event); expect(await repo.getDeckReviewEvents(deck.id)).toHaveLength(1); expect((await repo.getDeckProgress(deck.id))[0].card.reps).toBe(1); });
    it('rejects a concurrent stale review and an obsolete undo', async () => { const { deck, content } = await seed(); const snapshot = await study.snapshot(deck, content.index, NOW), choice = study.chooseNext(snapshot, deck, { debt: 0 }).choice!, p1 = study.preview(deck, choice, NOW), p2 = study.preview(deck, choice, NOW); const first = await study.rate(deck, choice, p1, 'good', 10, NOW); await expect(study.rate(deck, choice, p2, 'again', 10, NOW)).rejects.toThrow('stale'); const progress = (await repo.getDeckProgress(deck.id))[0]; const next = { entryId: progress.entryId, kind: 'review' as const, progress }; await study.rate(deck, next, study.preview(deck, next, new Date(progress.due)), 'good', 10, new Date(progress.due)); await expect(study.undo(first)).rejects.toThrow(); expect(await repo.getDeckReviewEvents(deck.id)).toHaveLength(2); });
    it('captures an owner before asynchronous validation and never publishes into another account', async () => { const card = await customCard(); const writing = repo.create('captured', customDeck(), [card]); workspace.activateUser('a:b'); await writing; expect(await repo.list()).toEqual([]); expect(await catalog.load('md-試験')).toEqual({ status: 'missing' }); expect(await repo.list('guest')).toHaveLength(1); workspace.activateUser('a_b'); expect(await repo.list()).toEqual([]); workspace.activateGuest(); expect(await repo.list()).toHaveLength(1); });
    it('rejects an engine operation when the workspace changes during a read', async () => { const { deck, content } = await seed(); const read = repo.getDailyState.bind(repo); let release!: () => void; const blocked = new Promise<void>(r => release = r); vi.spyOn(repo, 'getDailyState').mockImplementation(async (...args) => { await blocked; return read(...args); }); const snapshot = study.snapshot(deck, content.index, NOW); workspace.activateUser('other'); release(); await expect(snapshot).rejects.toThrow('workspace changed'); expect(await repo.getDeckProgress(deck.id)).toEqual([]); });
    it('survives a service/browser reload with journal and effective FSRS history intact', async () => { await seed(); await grade(); const progress = await repo.getDeckProgress('md-試験'); TestBed.resetTestingModule(); TestBed.configureTestingModule({ providers: [{ provide: CUSTOM_DECK_IDB, useValue: factory }, { provide: CUSTOM_DECKS_ENABLED, useValue: signal(true) }] }); const fresh = TestBed.inject(CustomDeckRepository); expect(await fresh.getDeckProgress('md-試験')).toEqual(progress); expect(await fresh.content('md-試験')).toHaveLength(1); expect(await fresh.journal()).toHaveLength(2); });
    it('reports corrupt content as error, never as an empty usable deck', async () => { await seed(); const db = await new Promise<IDBDatabase>(resolve => { const r = factory.open(CUSTOM_DECK_DATABASE); r.onsuccess = () => resolve(r.result); }); await new Promise<void>(resolve => { const tx = db.transaction('cards', 'readwrite'); tx.objectStore('cards').put({ workspace: 'guest', key: JSON.stringify(['md-試験', 'card-猫']), value: { ...({}), deckId: 'md-試験' } }); tx.oncomplete = () => resolve(); }); db.close(); expect((await catalog.load('md-試験')).status).toBe('error'); });
    it('preserves overrides and Madrid daily boundaries without creating progress on preview', async () => { const { deck, content } = await seed(); await study.adjustTodayNewLimit(deck, -10, NOW); expect((await study.snapshot(deck, content.index, NOW)).newAvailable).toBe(0); await study.adjustTodayNewLimit(deck, 5, NOW); expect((await study.snapshot(deck, content.index, NOW)).effectiveNewLimit).toBe(5); expect((await study.snapshot(deck, content.index, new Date('2026-10-21T22:01:00Z'))).effectiveNewLimit).toBe(10); expect(await repo.getDeckProgress(deck.id)).toEqual([]); });
    it('includes effective custom reviews exactly once in Profile and literal Daily titles', async () => {
        await seed();
        await grade();
        await catalog.refresh();
        const stats = await TestBed.inject(ProfileStatsService).load(NOW);
        expect(stats.deckUnseen).toBe(1500);
        expect(stats.deckReview).toBe(0);
        expect(stats.deckLearning).toBe(1);
        expect(stats.reviews).toBe(1);
        expect(stats.studySeconds).toBe(1);
        const plan = planDailyStudy({ workspace: 'guest', now: NOW.getTime(), day: '2026-10-21', normal: [], grammar: [], grammarContinuePath: null, weaknesses: [], decks: [{ id: 'md-試験', titleKey: 'anki.title', literalTitle: customDeck().title, due: 0, fresh: 1, completedToday: false, reviewsToday: 1, nextDue: null }], sessions: [], manga: { enabled: false, due: 0, fresh: 0, nextDue: null, eventsToday: 0, completedSessionIds: [] } }, 15);
        expect([...plan.recommended, ...plan.available].find(a => a.id === 'deck:md-試験')?.literalTitle).toBe(customDeck().title);
        expect(plan.performed[0].literalTitle).toBe(customDeck().title);
    });
    it('validates bounded Unicode, escaped text, stable authority and versions', async () => {
        const card = await customCard();
        expect(await validateCard({ ...card, id: '𠮷"\\', word: '猫' })).toEqual({ ...card, id: '𠮷"\\' });
        expect(() => validateDeck({ ...customDeck(), id: 'md-' + '𠮷'.repeat(64) })).toThrow();
        expect(() => validateDeck({ ...customDeck(), title: 'x'.repeat(161) })).toThrow();
        for (const patch of [{ word: 'x'.repeat(257) }, { reading: '\uD800' }, { glosses: [{ ...card.glosses[0], text: 'x'.repeat(2001) }] }, { context: { text: 'x'.repeat(1201) } }, { schemaVersion: 2 }])
            await expect(validateCard({ ...card, ...patch } as CustomDeckCard)).rejects.toThrow();
        await expect(lexicalIdentity({ ...card.lexicalIdentity.anchor, entryId: 'temporary-import-uuid' }, ['猫'], 'v')).rejects.toThrow();
        const identity = await lexicalIdentity(card.lexicalIdentity.anchor, ['猫', 'ネコ'], 'new-evidence');
        expect(identity.key).toBe(card.lexicalIdentity.key);
    });
    it('closes connections on versionchange so an upgrade cannot remain blocked', async () => {
        const db = await (repo as unknown as {
            open(): Promise<IDBDatabase>;
        }).open();
        const close = vi.spyOn(db, 'close');
        const upgraded = await new Promise<IDBDatabase>((resolve, reject) => { const r = factory.open(CUSTOM_DECK_DATABASE, db.version+1); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });
        expect(close).toHaveBeenCalled();
        upgraded.close();
        await expect(repo.list()).rejects.toMatchObject({ name: 'VersionError' });
    });
    it('reports blocked opens and closes a connection that succeeds after the rejection', async () => {
        const db = await (repo as unknown as {
            open(): Promise<IDBDatabase>;
        }).open();
        const close = vi.spyOn(db, 'close');
        const opening = {} as IDBOpenDBRequest;
        vi.spyOn(factory, 'open').mockReturnValue(opening);
        const pending = repo.list();
        queueMicrotask(() => opening.onblocked?.call(opening, {} as IDBVersionChangeEvent));
        await expect(pending).rejects.toThrow('blocked');
        Object.defineProperty(opening, 'result', { value: db });
        opening.onsuccess?.call(opening, {} as Event);
        expect(close).toHaveBeenCalled();
    });
    it('bounds the escaped UTF-8 JSON payload without truncating identity or context', async () => {
        const card = await customCard();
        const spellings = ['猫', ...Array.from({ length: 31 }, (_, i) => String(i) + '\\'.repeat(1000))];
        await expect(validateCard({ ...card, lexicalIdentity: { ...card.lexicalIdentity, spellings } })).rejects.toThrow();
        const allowed = { ...card, context: { text: '𠮷"\\'.repeat(200) } };
        expect((await validateCard(allowed)).context?.text).toBe(allowed.context.text);
        await expect(validateCard({ ...card, reading: 'いぬ' })).rejects.toThrow();
    });
    it('retains the original Madrid day and event when retrying a failed commit after midnight',async()=>{
        const {deck,content}=await seed();
        const beforeMidnight=new Date('2026-10-21T21:59:00.000Z');
        const snapshot=await study.snapshot(deck,content.index,beforeMidnight);
        const choice=study.chooseNext(snapshot,deck,{debt:0}).choice!;
        const preview=study.preview(deck,choice,beforeMidnight);
        const commit=vi.spyOn(repo,'commitReview').mockRejectedValueOnce(new Error('interrupted'));
        await expect(study.rate(deck,choice,preview,'good',1200,beforeMidnight)).rejects.toThrow('interrupted');
        const firstEvent=commit.mock.calls[0][1];
        const result=await study.rate(deck,choice,preview,'good',9000,new Date('2026-10-21T22:01:00.000Z'));
        expect(result).toEqual(firstEvent);
        expect((await repo.getDailyState(deck.id,'2026-10-21'))?.introducedEntryIds).toEqual(['card-猫']);
        expect(await repo.getDailyState(deck.id,'2026-10-22')).toBeNull();
        expect(await repo.getDeckReviewEvents(deck.id)).toHaveLength(1);
    });

    it('resumes short steps despite historical completion, replays receipts and undoes a completed day',async()=>{
        const {deck,content}=await seed();
        const first=await grade();
        await repo.writeDailyState({deckId:deck.id,localDate:'2026-10-21',introducedEntryIds:['card-猫'],newLimitOverride:null,completedAt:NOW.getTime()});
        const pending=await study.snapshot(deck,content.index,NOW);
        expect(pending.completedToday).toBe(false);expect(pending.learningPending).toBe(1);expect(pending.newAvailable).toBe(0);
        // Retry of the first introduction still resolves its existing receipt.
        expect(await study.rate(deck,first.choice,first.preview,'good',9000,NOW)).toEqual(first.event);
        const choice=study.chooseNext(pending,deck,{debt:0}).choice!;
        expect(choice.advanced).toBe(true);
        const preview=study.preview(deck,choice,NOW),event=await study.rate(deck,choice,preview,'good',1000,NOW);
        expect(event.stateAfter).toBe(2);expect((await study.snapshot(deck,content.index,NOW)).completedToday).toBe(true);
        expect(await repo.getDeckReviewEvents(deck.id)).toHaveLength(2);
        await study.undo(event);await study.undo(event);
        expect((await repo.getDailyState(deck.id,'2026-10-21'))?.completedAt).toBeNull();
        expect((await study.snapshot(deck,content.index,NOW)).learningPending).toBe(1);
        expect(await repo.getDeckReviewEvents(deck.id)).toHaveLength(1);
        await study.adjustTodayNewLimit(deck,5,NOW);
        expect((await study.snapshot(deck,content.index,NOW)).effectiveNewLimit).toBe(15);
    });

});
