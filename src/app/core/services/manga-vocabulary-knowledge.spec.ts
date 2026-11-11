import { LexicalKnowledgeSnapshot } from '../models/lexical-knowledge.model';
import { MangaCardConfirmation } from '../models/manga-deck-confirmation.model';
import { MangaVocabularyIndex } from '../models/manga-vocabulary-index.model';
import { mangaVocabularyMetrics, projectMangaVocabulary } from './manga-vocabulary-knowledge';
import { provenIdentity } from './lexical-knowledge.fixture';
import { lexicalCard } from './lexical-knowledge.fixture';
import { projectLexicalKnowledge } from './lexical-knowledge';

describe('M1 workspace knowledge is an independent readonly projection', () => {
  it('uses exact confirmed evidence, updates from knowledge only and separates weighted/unique metrics', async () => {
    const identity = await provenIdentity('1', '猫', 'ねこ');
    const occurrence = {pageIndex:0,blockIndex:0,lineIndex:0,start:0,end:1,surface:'猫',context:'猫。'};
    const index: MangaVocabularyIndex = {schemaVersion:1,volumeId:'a',sourceStamp:'1',analyzerStamp:'1',status:'complete',pageCount:1,occurrences:4,
      entries:[{key:'cat',dictionaryId:'d',sequence:1,lemma:'猫',reading:'ねこ',glosses:[],occurrences:[occurrence,{...occurrence,lineIndex:1},{...occurrence,lineIndex:2}]},
        {key:'dog',dictionaryId:'d',sequence:2,lemma:'犬',reading:'いぬ',glosses:[],occurrences:[{...occurrence,surface:'犬',context:'犬。'}]}],issues:[]};
    // Projection needs just these validated receipt fields. Repository validation is tested separately.
    const receipt = {source:{volumeId:'a',pageNumber:1,blockIndex:0,lineIndex:0,range:[0,1],fragment:'猫。',surface:'猫'},
      entity:{word:'猫',reading:'ねこ',identity:identity.identity}} as unknown as MangaCardConfirmation;
    const snapshot = (state: 0|1|2, workspace: 'guest'|'user:second' = 'guest'): LexicalKnowledgeSnapshot => ({workspace,cacheKey:'fixture',manifestRevision:'fixture',
      inventoryComplete:true,unmappedCards:0,issues:[],units:projectLexicalKnowledge([identity],[lexicalCard(identity.identity.key,state)],[],true)});
    const original = JSON.stringify(index);
    const known = projectMangaVocabulary(index,snapshot(2),[receipt]);
    expect(known.map(w=>w.state)).toEqual(['known','unlinked']);
    expect(mangaVocabularyMetrics(known)).toMatchObject({readingCoverage:75,uniqueCoverage:50,occurrences:4,unique:2});
    expect(projectMangaVocabulary(index,snapshot(1,'user:second'),[receipt])[0].state).toBe('learning');
    expect(projectMangaVocabulary(index,snapshot(2),[])[0].state).toBe('unlinked');
    expect(projectMangaVocabulary(index,snapshot(0),[receipt])[0].state).toBe('unlinked');
    const unknown=snapshot(0);unknown.units.forEach(u=>Object.assign(u,{state:'unknown'}));
    expect(projectMangaVocabulary(index,unknown,[receipt])[0].state).toBe('unknown');
    const changed={...receipt,source:{...receipt.source,fragment:'別の猫。'}};
    expect(projectMangaVocabulary(index,snapshot(2),[changed])[0].state).toBe('unlinked');
    expect(projectMangaVocabulary({...index,volumeId:'b'},snapshot(2),[receipt])[0].state).toBe('unlinked');
    expect(JSON.stringify(index)).toBe(original);
    expect(mangaVocabularyMetrics([]).readingCoverage).toBeNull();
  });
});
