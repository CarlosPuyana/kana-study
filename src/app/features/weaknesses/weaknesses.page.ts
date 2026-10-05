import {ChangeDetectionStrategy, Component, computed, inject} from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import {LearningSessionService} from '../../core/services/learning-session.service';
import {VocabularySessionService} from '../../core/services/vocabulary-session.service';
import {KanjiSessionService} from '../../core/services/kanji-session.service';
import {QuestionType, StudyUnit} from '../../core/models/progress.model';
import {VOCABULARY_QUESTION_TYPES, VocabularyStudyUnit} from '../../core/models/vocabulary.model';
import {KANJI_QUESTION_TYPES, KanjiStudyUnit} from '../../core/models/kanji.model';
import {WeaknessModule} from '../../core/models/weakness.model';
import {TranslationService} from '../../core/services/translation.service';
import {WeaknessService} from '../../core/services/weakness.service';
import {JapaneseAudioService} from '../../core/services/japanese-audio.service';
import {ALL_KANA} from '../../data/kana';
import {VOCABULARY_N5} from '../../data/vocabulary-n5.generated';
import {KANJI_N5} from '../../data/kanji-n5.generated';

@Component({selector:'app-weaknesses-page', imports:[RouterLink], templateUrl:'./weaknesses.page.html',
  styleUrl:'./weaknesses.page.scss', changeDetection:ChangeDetectionStrategy.OnPush})
export class WeaknessesPage {
  readonly i18n = inject(TranslationService);
  private readonly weaknesses = inject(WeaknessService);
  private readonly audio = inject(JapaneseAudioService);
  private readonly router = inject(Router);
  private readonly kanaSession = inject(LearningSessionService);
  private readonly vocabularySession = inject(VocabularySessionService);
  private readonly kanjiSession = inject(KanjiSessionService);
  readonly kanaLearn = computed(()=>this.weaknesses.learnUnits('kana',ALL_KANA.flatMap(k=>
    (['kana-to-romaji','romaji-to-kana'] as readonly QuestionType[]).map(questionType=>
      ({key:`${k.id}:${questionType}`,kanaId:k.id,questionType} satisfies StudyUnit))),u=>u.kanaId));
  readonly vocabularyLearn = computed(()=>this.weaknesses.learnUnits('vocabulary',VOCABULARY_N5.filter(e=>e.enabled).flatMap(e=>
    VOCABULARY_QUESTION_TYPES.map(questionType=>({key:`vocab:${e.id}:${questionType}`,entryId:e.id,questionType} satisfies VocabularyStudyUnit))),u=>u.entryId));
  readonly kanjiLearn = computed(()=>this.weaknesses.learnUnits('kanji',KANJI_N5.filter(k=>k.enabled).flatMap(k=>
    KANJI_QUESTION_TYPES.map(questionType=>({key:`kanji:${k.id}:${questionType}`,kanjiId:k.id,questionType} satisfies KanjiStudyUnit))),u=>u.kanjiId));
  readonly kana = computed(() => this.weaknesses.items('kana',ALL_KANA,5));
  readonly vocabulary = computed(() => this.weaknesses.items('vocabulary',VOCABULARY_N5.filter(e=>e.enabled),5));
  readonly vocabularyListening = computed(() => this.weaknesses.items('vocabulary',VOCABULARY_N5.filter(e=>e.enabled&&this.audio.hasAudio(e.id)),5,'listening'));
  readonly kanji = computed(() => this.weaknesses.items('kanji',KANJI_N5.filter(k=>k.enabled),5));
  readonly empty = computed(() => !this.kana().length && !this.vocabulary().length && !this.vocabularyListening().length && !this.kanji().length
    && !this.kanaLearn().length && !this.vocabularyLearn().length && !this.kanjiLearn().length);
  learnLabel(module:WeaknessModule,itemId:string):string {
    return module==='kana'?ALL_KANA.find(e=>e.id===itemId)?.character??'':module==='kanji'?KANJI_N5.find(e=>e.id===itemId)?.character??'':VOCABULARY_N5.find(e=>e.id===itemId)?.primaryWrittenForm??'';
  }
  direction(module:WeaknessModule,questionType:string):string {
    return this.i18n.t(`${module==='kana'?'questionTypes':module+'.questionType'}.${questionType}`);
  }
  practiceLearn(module:WeaknessModule):void {
    const started=module==='kana'?this.kanaSession.startPractice(this.kanaLearn()):module==='vocabulary'?this.vocabularySession.startPractice(this.vocabularyLearn()):this.kanjiSession.startPractice(this.kanjiLearn());
    if(started)void this.router.navigateByUrl(module==='kana'?'/learn':`/${module}/play`);
  }
}
