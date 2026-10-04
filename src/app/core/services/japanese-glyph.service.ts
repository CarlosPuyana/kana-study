import {DOCUMENT} from '@angular/common';
import {inject, Injectable} from '@angular/core';
import {WritingGlyph} from '../models/kana-writing.model';
import {KanaStrokesService} from './kana-strokes.service';

export function splitWritingWord(word:string):string[]{return [...word.normalize('NFC')];}
@Injectable({providedIn:'root'})
export class JapaneseGlyphService {
  private readonly kana=inject(KanaStrokesService);
  private readonly document=inject(DOCUMENT);
  private assets?:Promise<readonly WritingGlyph[]>;
  async load(word:string):Promise<readonly WritingGlyph[]>{
    this.assets??=Promise.all(['kanji.json','kana-extra.json'].map(async file=>{
      const response=await fetch(new URL('vocabulary-writing/'+file,this.document.baseURI));
      if(!response.ok)throw new Error('Writing assets unavailable');
      return await response.json() as WritingGlyph[];
    })).then(groups=>groups.flat()).catch(error=>{this.assets=undefined;throw error;});
    const assets=await this.assets;
    return Promise.all(splitWritingWord(word).map(async character=>{
      const glyph=assets.find(g=>g.character===character);if(glyph)return glyph;
      if(/[\u3040-\u30ff]/u.test(character)){
        try{return (await this.kana.load(character))[0];}catch{/* Unsupported glyph keeps a usable blank canvas. */}
      }
      return {character,strokes:[],clipPaths:[]};
    }));
  }
}
