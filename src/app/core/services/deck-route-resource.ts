import {DestroyRef,effect,inject,signal} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {CatalogDeck,DeckContentProvider,DeckLoadState,DeckStudyEntryView,isCustomEntry} from '../models/deck-catalog.model';
import {DeckCatalogService,deckTitle} from './deck-catalog.service';
import {TranslationService} from './translation.service';

/** Per-route state. Editorial content stays synchronous in its existing lazy feature chunk. */
export function createDeckRouteResource(builtin?:DeckContentProvider){
 const catalog=inject(DeckCatalogService);
 const route=inject(ActivatedRoute);
 let id=route.snapshot.paramMap.get('deckId');
 const initial=catalog.get(id);
 // Metadata-only consumers do not import the editorial dataset or fabricate an empty provider.
 const state=signal<DeckLoadState<{deck:CatalogDeck;content:DeckContentProvider|null}>>(
  initial?.kind==='builtin'?{status:'ready',value:{deck:initial,content:builtin??null}}:{status:'loading'},
 );
 let owner=catalog.owner(),generation=0,revision=catalog.revision();
 const load=async()=>{
  const current=++generation;
  const capturedOwner=catalog.owner();
  owner=capturedOwner;
  const value=await catalog.load(id);
  if(current===generation&&capturedOwner===catalog.owner())state.set(value);
 };
 let pending:Promise<void>=state().status==='loading'?load():Promise.resolve();
 const subscription=route.paramMap?.subscribe(params=>{
  const next=params.get('deckId');
  if(next!==id){id=next;state.set({status:'loading'});pending=load();}
 });
 inject(DestroyRef).onDestroy(()=>{generation++;subscription?.unsubscribe();});
 effect(()=>{
  const nextOwner=catalog.owner(),nextRevision=catalog.revision();
  if(owner!==nextOwner||(id?.startsWith('md-')&&revision!==nextRevision)){
   state.set({status:'loading'});pending=load();
  }
  revision=nextRevision;
 });
 return {
  catalog,state,ready:()=>pending,
  get deck(){
   if(owner!==catalog.owner())return null;
   const current=state();
   return current.status==='ready'?current.value.deck:null;
  },
  get content(){
   if(owner!==catalog.owner())return null;
   const current=state();
   return current.status==='ready'?current.value.content:null;
  },
  title:(i18n:TranslationService)=>{
   if(owner!==catalog.owner())return '';
   const current=state();
   return current.status==='ready'?deckTitle(current.value.deck,i18n):'';
  },
 };
}
export function entryMeaning(entry:DeckStudyEntryView,language:string):string{
 if(!isCustomEntry(entry))return entry.meaning[language==='en'?'en':'es'];
 const exact=entry.glosses.find(g=>g.language===language);
 if(exact)return exact.text;
 const fallback=entry.glosses[0];
 return fallback?`${fallback.text} (${fallback.language.toUpperCase()})`:'';
}
