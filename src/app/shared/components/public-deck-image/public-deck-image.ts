import {ChangeDetectionStrategy,Component,input,signal} from '@angular/core';
@Component({selector:'app-public-deck-image',changeDetection:ChangeDetectionStrategy.OnPush,
 template:`@if(url();as src){@if(failed()!==src){<img [src]="src" [alt]="word()" loading="lazy" decoding="async" (error)="failed.set(src)" />}}`,
 styles:`:host{display:block}img{display:block;max-width:100%;max-height:18rem;object-fit:contain;margin:1rem auto;border-radius:.75rem}`})
export class PublicDeckImage {readonly url=input<string>();readonly word=input.required<string>();readonly failed=signal('');}
