import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { MangaVocabularyAnalysisPage } from './manga-vocabulary-analysis.page';
import { MangaVocabularyIndexService } from '../../core/services/manga-vocabulary-index.service';
import { LexicalKnowledgeProjectionService } from '../../core/services/lexical-knowledge-projection.service';
import { CustomDeckRepository } from '../../core/services/custom-deck.repository';
import { MangaVocabularyIndex } from '../../core/models/manga-vocabulary-index.model';
import { SettingsService } from '../../core/services/settings.service';

describe('M1 vocabulary view',()=>{
  afterEach(()=>{TestBed.resetTestingModule();});
  const result: MangaVocabularyIndex = {schemaVersion:1,volumeId:'a',sourceStamp:'1',analyzerStamp:'1',pageCount:1,status:'partial',occurrences:2,
    entries:[{key:'cat',dictionaryId:'d',sequence:1,lemma:'猫',reading:'ねこ',category:'lexical',categoryReason:'dictionary-pos',glosses:['cat'],occurrences:[
      {pageIndex:0,blockIndex:0,lineIndex:0,start:0,end:1,surface:'猫',context:'猫。'},
      {pageIndex:0,blockIndex:0,lineIndex:1,start:0,end:1,surface:'猫',context:'猫。'}]}],issues:[{pageIndex:0,reason:'unresolved',context:'謎名'}]};
  beforeEach(()=>{
    localStorage.clear();TestBed.configureTestingModule({imports:[MangaVocabularyAnalysisPage],providers:[provideRouter([]),
      {provide:SettingsService,useValue:{language:signal('es')}},
      {provide:ActivatedRoute,useValue:{paramMap:of(convertToParamMap({volumeId:'a'}))}},
      {provide:MangaVocabularyIndexService,useValue:{load:async()=>result}},
      {provide:CustomDeckRepository,useValue:{mangaConfirmations:async()=>[]}},
      {provide:LexicalKnowledgeProjectionService,useValue:{cacheKey:signal('1'),load:async()=>({units:[]})}}]});
  });
  it('renders translated partial metrics, context and state filters in both themes',async()=>{
    const fixture=TestBed.createComponent(MangaVocabularyAnalysisPage);fixture.detectChanges();await fixture.whenStable();fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Vocabulario de la obra');
    expect(fixture.nativeElement.textContent).toContain('Análisis parcial');
    expect(fixture.nativeElement.textContent).not.toContain('mangaM1.');
    expect(fixture.componentInstance.metrics()).toMatchObject({occurrences:2,unique:1,readingCoverage:0});
    for(const theme of ['dark','light']) {
      document.documentElement.dataset['theme']=theme;
      fixture.componentInstance.state.set('known');fixture.detectChanges();expect(fixture.nativeElement.querySelector('.words details')).toBeNull();
      fixture.componentInstance.state.set('all');fixture.detectChanges();expect(fixture.nativeElement.querySelector('.words summary').textContent).toContain('猫');
    }
    fixture.destroy();delete document.documentElement.dataset['theme'];
  });
});
