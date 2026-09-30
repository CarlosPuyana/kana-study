import { ChangeDetectionStrategy,Component,input } from '@angular/core';import { FuriganaSegment } from '../../../core/models/vocabulary.model';
export type FuriganaTextSize='small'|'medium'|'large';
@Component({selector:'app-furigana-text',templateUrl:'./furigana-text.html',styleUrl:'./furigana-text.scss',changeDetection:ChangeDetectionStrategy.OnPush,host:{'[class]':'"furigana-text furigana-text--"+size()'}})export class FuriganaText{readonly segments=input.required<readonly FuriganaSegment[]>();readonly size=input<FuriganaTextSize>('medium')}
