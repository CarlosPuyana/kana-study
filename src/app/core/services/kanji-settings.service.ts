import { Injectable,inject,signal } from '@angular/core';
import { KanjiQuestionType } from '../models/kanji.model';
import { KanjiSelection } from '../models/kanji-study.model';
import { StorageService } from './storage.service';
import { DEFAULT_KANJI_SELECTION } from './kanji-selection';
const KEY='kana-study.kanji-selection.v1';
@Injectable({providedIn:'root'}) export class KanjiSettingsService{private readonly storage=inject(StorageService);private readonly state=signal<KanjiSelection>(this.storage.get(KEY,DEFAULT_KANJI_SELECTION));readonly selection=this.state.asReadonly();save(value:KanjiSelection){this.state.set(value);this.storage.set(KEY,value)}setLevel(enabled:boolean){this.save({...this.state(),levels:{N5:enabled}})}setQuestionTypes(questionTypes:readonly KanjiQuestionType[]){this.save({...this.state(),questionTypes})}}
