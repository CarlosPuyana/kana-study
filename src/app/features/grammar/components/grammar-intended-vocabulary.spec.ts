import {TestBed} from '@angular/core/testing';
import {signal} from '@angular/core';
import {TranslationService} from '../../../core/services/translation.service';
import {GrammarIntendedVocabulary} from './grammar-intended-vocabulary';

describe('Grammar intended vocabulary UI',()=>{
  afterEach(()=>TestBed.resetTestingModule());
  it('limits long lists, expands without losing order, translates inline fallback and resets on lesson change',async()=>{
    const language=signal('es');TestBed.configureTestingModule({providers:[{provide:TranslationService,useValue:{language,t:(key:string)=>key==='known'?'Reliable local meaning':key}}]});
    const f=TestBed.createComponent(GrammarIntendedVocabulary);
    const values=['学生（がくせい）','先生（せんせい）',...Array.from({length:10},(_,i)=>`未収録${i}`)];
    f.componentRef.setInput('prerequisites',{requiredKana:[],allowedKanji:[],intendedVocabulary:values,inlineExplanations:[{term:'未収録0',reading:'',meaningKey:'known'}]});
    await f.whenStable();f.detectChanges();expect(f.nativeElement.querySelectorAll('li')).toHaveLength(8);
    expect(f.nativeElement.textContent).toContain('Reliable local meaning');expect(f.nativeElement.textContent).toContain('grammar.vocabularyUnavailable');
    expect(f.nativeElement.querySelector('strong').textContent).toBe('学生');expect(f.nativeElement.querySelector('small').textContent).toBe('がくせい');
    const spanish=f.nativeElement.querySelector('li span').textContent;language.set('en');await f.whenStable();f.detectChanges();expect(f.nativeElement.querySelector('li span').textContent).not.toBe(spanish);
    f.nativeElement.querySelector('.toggle').click();f.detectChanges();expect(f.nativeElement.querySelectorAll('li')).toHaveLength(12);
    f.nativeElement.querySelector('.toggle').click();f.detectChanges();expect(f.nativeElement.querySelectorAll('li')).toHaveLength(8);
    f.componentInstance.expanded.set(true);f.componentRef.setInput('prerequisites',{requiredKana:[],allowedKanji:[],intendedVocabulary:['かわいい']});
    await f.whenStable();expect(f.componentInstance.expanded()).toBe(false);
  });
});
