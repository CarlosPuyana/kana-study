import {MangaSourceService} from '../../core/services/manga-source.service';
import {MangaLanguage} from '../../core/models/local-manga.model';
import {MangaError} from '../../core/services/mokuro-parser';
import { Component, computed, effect, ElementRef, HostListener, inject, OnDestroy, signal, untracked, viewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslationService } from '../../core/services/translation.service';
import { MangaRepository } from '../../core/services/manga.repository';
import { WorkspaceService } from '../../core/services/workspace.service';
import { MangaPage, MangaReaderVolume } from '../../core/models/manga.model';
import { MangaReadingClock } from '../../core/services/manga-reading-clock';
import { MangaOcrComponent } from './manga-ocr.component';
import { DictionaryPopup } from '../../shared/components/dictionary-popup/dictionary-popup';
import { JapaneseLookupService } from '../../core/services/japanese-lookup.service';
import { DictionaryLookup, OcrLookupPoint } from '../../core/models/dictionary.model';
import { MangaReaderPreferences, MANGA_READER_PREFERENCES_KEY, readMangaReaderPreferences } from '../../core/services/manga-reader-preferences';
@Component({
  selector: 'app-manga-reader', imports: [RouterLink, MangaOcrComponent, DictionaryPopup], styleUrl: './manga.scss',
  template: `<main #readerRoot class="manga-reader" (pointerdown)="interact()" (wheel)="zoomWheel($event)">
    <header class="reader-header"><a routerLink="/manga" [attr.aria-label]="i18n.t('manga.library')" [title]="i18n.t('manga.library')"><span aria-hidden="true">←</span> {{ i18n.t('manga.library') }}</a><span class="reader-title" [title]="readerTitle()">{{readerTitle()}}</span><button class="fullscreen-button" [disabled]="!fullscreenAvailable()" [attr.aria-pressed]="fullscreen()" [attr.aria-label]="i18n.t(fullscreen()?'manga.exitFullscreen':'manga.enterFullscreen')" [title]="i18n.t(fullscreen()?'manga.exitFullscreen':'manga.enterFullscreen')" (click)="toggleFullscreen()"><span aria-hidden="true">{{fullscreen()?'⛶':'⛶'}}</span></button>@if(volume()?.catalogId){<label class="reader-language"><span>{{i18n.t('manga.catalog.language')}}</span><select [value]="language()" [disabled]="loading()" (change)="setLanguage($event)">@for(lang of volume()?.availableLanguages;track lang){<option [value]="lang">{{i18n.t('manga.catalog.language.'+lang)}}</option>}</select></label>}</header>
    @if (error()) { <p role="alert">{{ i18n.t('manga.error.' + error()) }}</p> }
    <div #stage class="page-stage" tabindex="0" [attr.aria-label]="i18n.t('manga.viewport')" (pointerdown)="sidePointerDown($event)" (pointermove)="sidePointerMove($event)" (scroll)="sideScroll()" (click)="sideClick($event)">
    @if (current(); as page) {
      <div class="manga-canvas" [style.width.px]="baseWidth()*zoom()/100" [style.height.px]="baseWidth()*page.ocr.img_height/page.ocr.img_width*zoom()/100"><div class="page-image" [style.width.px]="baseWidth()" [style.height.px]="baseWidth()*page.ocr.img_height/page.ocr.img_width" [style.transform]="'scale(' + zoom()/100 + ')'" (touchstart)="touchStart($event)" (touchend)="touchEnd($event)">
        <img [src]="url()" [alt]="i18n.t('manga.page', {number:index()+1})" draggable="false" />
        @if(!volume()?.catalogId||language()==='ja'){<app-manga-ocr [page]="page.ocr" [visible]="showOcr()" (wordClicked)="lookupWord($event)" />}
      </div></div>
    } @else if (!error()) { <p role="status">{{ i18n.t('common.loading') }}</p> }
    </div>
    @if(volume()?.pageCount && current()){
    <nav class="reader-toolbar" [attr.aria-label]="i18n.t('manga.controls')">
      <div class="toolbar-group" [class.rtl]="rightToLeft()" role="group" [attr.aria-label]="i18n.t('manga.assist.navigation')"><button class="previous" [disabled]="index() <= 0 || loading()" [attr.aria-label]="i18n.t('manga.previous')" [title]="i18n.t('manga.previous')" (click)="go(index()-1)"><span aria-hidden="true">{{rightToLeft()?'›':'‹'}}</span></button>
      <span class="page-counter">{{ index()+1 }} / {{ volume()?.pageCount ?? 0 }}</span>
      <button class="next" [disabled]="!volume() || index()+1 >= volume()!.pageCount || loading()" [attr.aria-label]="i18n.t('manga.next')" [title]="i18n.t('manga.next')" (click)="go(index()+1)"><span aria-hidden="true">{{rightToLeft()?'‹':'›'}}</span></button>
      </div><div class="toolbar-group" role="group" [attr.aria-label]="i18n.t('manga.assist.reading')"><button data-panel="settings" [attr.aria-label]="i18n.t('manga.readerSettings')" [title]="i18n.t('manga.readerSettings')" [attr.aria-expanded]="panel()==='settings'" (click)="openPanel('settings')"><span aria-hidden="true">⚙</span></button>
      <button class="clock-button" data-panel="clock" [attr.aria-label]="i18n.t('manga.readingTime') + ': ' + clockLabel()" [title]="i18n.t('manga.readingTime')" [attr.aria-expanded]="panel()==='clock'" (click)="openPanel('clock')"><span aria-hidden="true">{{clockState()==='off'?'▷':clockState()==='paused'?'⏸':'⏱'}}</span><span>{{clockState()==='off'?i18n.t('manga.clock'):formatTime(sessionSeconds())}}</span></button>
      </div><div class="toolbar-group" role="group" [attr.aria-label]="i18n.t('manga.assist.help')"><a class="reader-help" routerLink="/manga/guide" [attr.aria-label]="i18n.t('manga.landing.how')" [title]="i18n.t('manga.landing.how')">?</a></div>
    </nav>
    }
    @if(panel();as activePanel){
      <div class="reader-panel-backdrop" (click)="closePanel()"></div>
      <section class="reader-panel" role="dialog" aria-modal="true" aria-labelledby="reader-panel-title">
        <header><h2 id="reader-panel-title">{{i18n.t(activePanel==='settings'?'manga.readerSettings':'manga.readingTime')}}</h2><button #panelClose [attr.aria-label]="i18n.t('common.close')" [title]="i18n.t('common.close')" (click)="closePanel()">×</button></header>
        @if(activePanel==='settings'){
          <label><span>{{i18n.t('manga.view')}}</span><select [value]="preferences().fitMode" (change)="setFit($event)"><option value="height">{{i18n.t('manga.fitHeight')}}</option><option value="width">{{i18n.t('manga.fitWidth')}}</option><option value="actual">{{i18n.t('manga.actualSize')}}</option></select></label>
          <div class="zoom-controls"><span>{{i18n.t('manga.zoom')}}</span><button [disabled]="zoom()<=50" [attr.aria-label]="i18n.t('manga.zoomOut')" [title]="i18n.t('manga.zoomOut')" (click)="changeZoom(-1)">−</button><output>{{zoom()}}%</output><button [disabled]="zoom()>=300" [attr.aria-label]="i18n.t('manga.zoomIn')" [title]="i18n.t('manga.zoomIn')" (click)="changeZoom(1)">+</button><button (click)="resetZoom()">{{i18n.t('manga.resetZoom')}}</button></div>
          <label><span>{{i18n.t('manga.ocrText')}}</span><input type="checkbox" [checked]="preferences().ocrVisible" (change)="setCheckbox('ocrVisible',$event)"/></label>
          <label><span>{{i18n.t('manga.integratedDictionary')}}</span><input type="checkbox" [checked]="preferences().dictionaryEnabled" (change)="setCheckbox('dictionaryEnabled',$event)"/></label>
          <label><span>{{i18n.t('manga.sideClicks')}}<small>{{i18n.t('manga.desktopOnly')}}</small></span><input type="checkbox" [checked]="preferences().sideClicks" (change)="setCheckbox('sideClicks',$event)"/></label>
          <div class="shortcut-help"><h3>{{i18n.t('manga.shortcuts')}}</h3><p>{{i18n.t('manga.shortcutsHelp')}}</p><p>{{i18n.t('manga.zoomShortcuts')}}</p></div>
        } @else {
          <p role="status">{{clockLabel()}}</p><p class="session-time">{{i18n.t('manga.clockSession')}} <strong>{{formatTime(sessionSeconds(),true)}}</strong></p>
          <button class="clock-toggle" (click)="toggleClock()">{{i18n.t(clockState()==='off'?'manga.clockStart':'manga.clockStop')}}</button>
          <label><span>{{i18n.t('manga.pauseHidden')}}</span><input type="checkbox" [checked]="preferences().pauseHidden" (change)="setCheckbox('pauseHidden',$event)"/></label>
          <label><span>{{i18n.t('manga.idlePause')}}<small>{{i18n.t('manga.idleNever')}}</small></span><span class="idle-input"><input type="number" min="0" max="60" step="1" [value]="preferences().idleMinutes" (change)="setIdle($event)"/> {{i18n.t('manga.minutes')}}</span></label>
          <label><span>{{i18n.t('manga.pauseDictionary')}}</span><input type="checkbox" [checked]="preferences().pauseDictionary" (change)="setCheckbox('pauseDictionary',$event)"/></label>
        }
      </section>
    }
    @if(popup();as point){<app-dictionary-popup [x]="point.x" [y]="point.y" [context]="point" [volumeTitle]="readerTitle()" [location]="{volumeId:volume()?.id ?? '',pageIndex:index(),blockIndex:point.blockIndex ?? 0}" [result]="lookupResult()" [loading]="lookupLoading()" [failed]="lookupFailed()" (closed)="closeDictionary()"/>}
  </main>`,
})
export class MangaReaderPage implements OnDestroy {
  private readonly lookup=inject(JapaneseLookupService);
  readonly popup=signal<OcrLookupPoint|null>(null);readonly lookupResult=signal<DictionaryLookup>({query:'',terms:[],installed:false});readonly lookupLoading=signal(false);readonly lookupFailed=signal(false);private lookupGeneration=0;
  async lookupWord(point:OcrLookupPoint):Promise<void>{if(!this.preferences().dictionaryEnabled||(this.volume()?.catalogId&&this.language()!=='ja'))return;this.interact();this.panel.set(null);this.popup.set(point);this.tick();this.lookupLoading.set(true);this.lookupFailed.set(false);const generation=++this.lookupGeneration;
    try{const result=point.mode==='selection'?await this.lookup.lookupSelection(point.selectedText??point.text):await this.lookup.lookupAt(point.text,point.offset);if(generation===this.lookupGeneration)this.lookupResult.set(result);}catch{if(generation===this.lookupGeneration)this.lookupFailed.set(true);}finally{if(generation===this.lookupGeneration)this.lookupLoading.set(false);}
  }
  closeDictionary():void{this.tick();++this.lookupGeneration;this.popup.set(null);this.interact();}
  readonly i18n = inject(TranslationService); private readonly repository = inject(MangaRepository);private readonly source=inject(MangaSourceService);readonly language=signal<MangaLanguage>('ja');readonly rightToLeft=computed(()=>this.volume()?.readingDirection==='rtl'); private readonly workspaceService = inject(WorkspaceService);
  private readonly router = inject(Router); private readonly id = inject(ActivatedRoute).snapshot.paramMap.get('volumeId')!;
  private readonly workspace = this.workspaceService.active();
  private readonly preferencesKey=this.workspaceService.storageKey(MANGA_READER_PREFERENCES_KEY,this.workspace);
  readonly preferences=signal(readMangaReaderPreferences(this.preferencesKey));
  readonly panel=signal<'settings'|'clock'|null>(null);readonly clockState=signal<'off'|'running'|'paused'>('off');readonly sessionSeconds=signal(0);
  private readonly panelClose=viewChild<ElementRef<HTMLButtonElement>>('panelClose');
  private readonly readerRoot=viewChild<ElementRef<HTMLElement>>('readerRoot');
  private readonly stage=viewChild<ElementRef<HTMLElement>>('stage');
  readonly fullscreen=signal(false);readonly zoom=computed(()=>this.preferences().manualZoom??100);
  private readonly viewport=signal({width:window.innerWidth,height:Math.max(1,window.innerHeight-160)});
  readonly baseWidth=computed(()=>{const page=this.current()?.ocr;if(!page)return 1;const viewport=this.viewport();if(this.preferences().fitMode==='actual')return page.img_width;if(this.preferences().fitMode==='width')return viewport.width;return Math.min(viewport.width,viewport.height*page.img_width/page.img_height);});
  private zoomFrame=0;
  readonly volume = signal<MangaReaderVolume | undefined>(undefined); readonly index = signal(0); readonly current = signal<MangaPage | undefined>(undefined); readonly url = signal(''); readonly showOcr = computed(()=>this.preferences().ocrVisible); readonly error = signal(''); readonly loading = signal(true);
  private readonly cache = new Map<number, {page:MangaPage; url:string; preview?:HTMLImageElement}>(); private readonly clock = new MangaReadingClock(Date.now(),false);
  private seconds = 0; private completed = false; private destroyed = false; private generation = 0; private touch: {x:number;y:number} | null = null;
  private visible = document.visibilityState === 'visible'; private focused = document.hasFocus();
  private timerTicks=0;
  private readonly timer = setInterval(() => { this.tick(); if(++this.timerTicks%5===0)void this.save(); }, 1000);
  private sidePointer:{x:number;y:number;dragged:boolean}|null=null;
  private saveQueue: Promise<void> = Promise.resolve();
  constructor() {
    effect(onCleanup=>{const stage=this.stage()?.nativeElement;if(!stage)return;const measure=()=>this.measureStage();measure();if(typeof ResizeObserver==='function'){const observer=new ResizeObserver(measure);observer.observe(stage);onCleanup(()=>observer.disconnect());}});
    effect(()=>{this.panelClose()?.nativeElement.focus();});
    effect(() => { if (this.workspaceService.active() !== this.workspace) untracked(()=>{this.closeDictionary();void this.router.navigateByUrl('/manga');}); });
    void this.start();
  }
  private readonly requestedPage=inject(ActivatedRoute).snapshot.queryParamMap?.get('page');
  private async start(): Promise<void> {
    try {
      const [volume, saved] = await Promise.all([this.source.volume(this.id, this.workspace), this.repository.progress(this.id,this.workspace)]);
      if (this.destroyed) return;
      if (!volume?.complete) throw new Error('missing');
      this.volume.set(volume); this.seconds = saved?.activeSeconds ?? 0; this.completed = saved?.completed ?? false;
      const requested=this.requestedPage && /^\d+$/.test(this.requestedPage)?Number(this.requestedPage):0;
      const index=Number.isSafeInteger(requested)&&requested>=1&&requested<=volume.pageCount?requested-1:Math.max(0,Math.min(saved?.pageIndex??0,volume.pageCount-1));
      this.loading.set(false); await this.go(index);
    } catch(error) { this.error.set(error instanceof MangaError?error.code:'interrupted'); this.loading.set(false); }
  }
  async go(index: number): Promise<void> {
    const volume = this.volume(); if (!volume || index < 0 || index >= volume.pageCount || this.loading() || this.destroyed || this.popup()) return;
    this.closePanel();this.interact();this.resetPan(); this.loading.set(true); const generation = ++this.generation;
    this.current.set(undefined);
    try {
      const keep = new Set([index-1,index,index+1].filter(i => i >= 0 && i < volume.pageCount));
      for (const [key, value] of this.cache) if (!keep.has(key)) { if(value.preview)value.preview.src='';URL.revokeObjectURL(value.url); this.cache.delete(key); }
      // Current first, then at most two adjacent pages; never fetch the volume's blobs together.
      for (const key of [index, ...Array.from(keep).filter(i => i !== index)]) {
        if (!this.cache.has(key)) {
          const page = await this.source.page(this.id,key,this.workspace,this.language());
          if (generation !== this.generation || this.destroyed) return;
          if (!page) throw new Error('missing');
          this.cache.set(key,{page,url:URL.createObjectURL(page.image)});
        }
        if (key === index) {
          const cached = this.cache.get(key)!; this.index.set(index); this.current.set(cached.page); this.url.set(cached.url);
          this.completed ||= index === volume.pageCount-1; await this.save();
        } else {
          const cached=this.cache.get(key)!;
          if(!cached.preview){const preview=new Image();cached.preview=preview;preview.src=cached.url;if(typeof preview.decode==='function')void preview.decode().catch(()=>undefined);}
        }
      }
    } catch(error) { this.error.set(error instanceof MangaError?error.code:'interrupted'); } finally { if (generation === this.generation) this.loading.set(false); }
  }
  async setLanguage(event:Event):Promise<void>{
    const language=(event.target as HTMLSelectElement).value as MangaLanguage;
    if(!this.volume()?.catalogId||!this.volume()?.availableLanguages?.includes(language)||language===this.language()||this.loading())return;
    this.closeDictionary();this.language.set(language);this.error.set('');
    for(const cached of this.cache.values()){if(cached.preview)cached.preview.src='';URL.revokeObjectURL(cached.url);}this.cache.clear();
    await this.go(this.index());
  }
  readerTitle():string{const volume=this.volume();return [...new Set([volume?.seriesTitle,volume?.title].filter((title):title is string=>!!title?.trim()&&title.trim().toLowerCase()!=='pages'))].join(' · ')||this.i18n.t('more.manga.title');}
  fullscreenAvailable():boolean{return document.fullscreenEnabled!==false&&typeof this.readerRoot()?.nativeElement.requestFullscreen==='function';}
  async toggleFullscreen():Promise<void>{this.interact();try{if(document.fullscreenElement===this.readerRoot()?.nativeElement){await document.exitFullscreen?.();}else{await this.readerRoot()?.nativeElement.requestFullscreen?.();}}catch{/* Unsupported or denied fullscreen leaves normal reading available. */}this.fullscreenChanged();}
  @HostListener('document:fullscreenchange') fullscreenChanged():void{this.fullscreen.set(!!this.readerRoot()&&document.fullscreenElement===this.readerRoot()!.nativeElement);this.measureStage();}
  @HostListener('window:resize') measureStage():void{const stage=this.stage()?.nativeElement;if(stage?.clientWidth&&stage.clientHeight)this.viewport.set({width:stage.clientWidth,height:stage.clientHeight});}
  setFit(event:Event):void{const mode=(event.target as HTMLSelectElement).value;if(mode!=='height'&&mode!=='width'&&mode!=='actual')return;this.updatePreferences({fitMode:mode,manualZoom:null});this.resetPan();}
  changeZoom(direction:number,anchor?:{x:number;y:number}):void{
    const steps=[50,75,100,125,150,175,200,250,300];const old=this.zoom();const next=direction>0?steps.find(step=>step>old)??300:[...steps].reverse().find(step=>step<old)??50;
    if(next===old)return;const stage=this.stage()?.nativeElement;const bounds=stage?.getBoundingClientRect();const x=anchor&&bounds?anchor.x-bounds.left:(stage?.clientWidth??0)/2;const y=anchor&&bounds?anchor.y-bounds.top:(stage?.clientHeight??0)/2;
    const oldMargin=Math.max(0,((stage?.clientWidth??0)-this.baseWidth()*old/100)/2),newMargin=Math.max(0,((stage?.clientWidth??0)-this.baseWidth()*next/100)/2);
    const left=((stage?.scrollLeft??0)+x-oldMargin)*next/old+newMargin-x,top=((stage?.scrollTop??0)+y)*next/old-y;
    this.updatePreferences({manualZoom:next});cancelAnimationFrame(this.zoomFrame);this.zoomFrame=requestAnimationFrame(()=>{if(stage&&!this.destroyed){stage.scrollLeft=Math.max(0,left);stage.scrollTop=Math.max(0,top);}});
  }
  resetPan():void{cancelAnimationFrame(this.zoomFrame);const stage=this.stage()?.nativeElement;if(stage){stage.scrollLeft=0;stage.scrollTop=0;}}
  resetZoom():void{this.updatePreferences({manualZoom:null});this.resetPan();}
  zoomWheel(event:WheelEvent):void{if(!event.ctrlKey||!event.deltaY||this.popup()||this.panel()||!(event.target instanceof Element)||event.target.closest('input,textarea,select,button,[contenteditable]'))return;event.preventDefault();this.changeZoom(event.deltaY<0?1:-1,{x:event.clientX,y:event.clientY});}
  private clockOptions(){return {...this.preferences(),dictionaryOpen:!!this.popup()};}
  private tick(): void {const options=this.clockOptions();const delta=this.clock.tick(this.visible,this.focused,Date.now(),options);this.seconds+=delta;this.sessionSeconds.update(seconds=>seconds+delta);this.clockState.set(this.clock.state(this.visible,this.focused,Date.now(),options));}
  interact(): void { this.tick(); this.clock.interact();this.clockState.set(this.clock.state(this.visible,this.focused,Date.now(),this.clockOptions())); }
  toggleClock():void{this.tick();if(this.clockState()==='off')this.clock.start();else this.clock.stop();this.tick();void this.save();}
  clockLabel():string{return this.i18n.t(this.clockState()==='off'?'manga.clockOff':this.clockState()==='paused'?'manga.clockPaused':'manga.clockActive');}
  formatTime(seconds:number,full=false):string{const total=Math.floor(seconds),hours=Math.floor(total/3600),minutes=Math.floor(total/60)%60;return (full||hours?`${hours.toString().padStart(2,'0')}:`:'')+`${minutes.toString().padStart(2,'0')}:${(total%60).toString().padStart(2,'0')}`;}
  openPanel(panel:'settings'|'clock'):void{this.closeDictionary();this.panel.set(this.panel()===panel?null:panel);this.interact();}
  closePanel():void{const previous=this.panel();this.panel.set(null);if(previous)document.querySelector<HTMLButtonElement>(`.reader-toolbar [data-panel="${previous}"]`)?.focus();}
  private updatePreferences(values:Partial<MangaReaderPreferences>):void{this.tick();this.preferences.update(old=>({...old,...values}));try{localStorage.setItem(this.preferencesKey,JSON.stringify(this.preferences()));}catch{/* Memory-only preferences if storage is unavailable. */}this.interact();}
  setCheckbox(key:'ocrVisible'|'dictionaryEnabled'|'sideClicks'|'pauseHidden'|'pauseDictionary',event:Event):void{this.updatePreferences({[key]:(event.target as HTMLInputElement).checked});if(key==='dictionaryEnabled'&&!this.preferences().dictionaryEnabled)this.closeDictionary();}
  setIdle(event:Event):void{const input=event.target as HTMLInputElement;const value=input.valueAsNumber;if(!Number.isFinite(value)){input.value=String(this.preferences().idleMinutes);return;}const minutes=Math.max(0,Math.min(60,Math.floor(value)));this.updatePreferences({idleMinutes:minutes});input.value=String(minutes);}
  sidePointerDown(event:PointerEvent):void{this.sidePointer=null;if(event.pointerType!=='mouse'||!event.isPrimary||event.button!==0||this.sideBlocked(event.target))return;this.sidePointer={x:event.clientX,y:event.clientY,dragged:false};}
  sidePointerMove(event:PointerEvent):void{if(this.sidePointer&&Math.hypot(event.clientX-this.sidePointer.x,event.clientY-this.sidePointer.y)>8)this.sidePointer.dragged=true;}
  sideScroll():void{if(this.sidePointer)this.sidePointer.dragged=true;}
  private sideBlocked(target:EventTarget|null):boolean{return !this.preferences().sideClicks||!!this.popup()||!!this.panel()||!window.getSelection()?.isCollapsed||!window.matchMedia('(hover: hover) and (pointer: fine)').matches||!(target instanceof Element)||!!target.closest('app-manga-ocr,app-dictionary-popup,.reader-toolbar,.reader-panel,button,input,a,textarea,select,[contenteditable]');}
  sideClick(event:MouseEvent):void{const pointer=this.sidePointer;this.sidePointer=null;if(!pointer||pointer.dragged||this.sideBlocked(event.target)||Math.hypot(event.clientX-pointer.x,event.clientY-pointer.y)>8)return;const bounds=(event.currentTarget as HTMLElement).getBoundingClientRect();const position=(event.clientX-bounds.left)/bounds.width;if(position<.25)void this.go(this.index()+(this.rightToLeft()?1:-1));else if(position>.75)void this.go(this.index()+(this.rightToLeft()?-1:1));}
  @HostListener('document:pointermove') pointerActivity(): void { this.interact(); }
  @HostListener('document:wheel') wheelActivity(): void { this.interact(); }
  private save(): Promise<void> {
    if (!this.volume() || !this.current()) return Promise.resolve();
    const now = new Date().toISOString(); const progress = { volumeId:this.id,pageIndex:this.index(),activeSeconds:this.seconds,completed:this.completed,lastOpenedAt:now,updatedAt:now };
    this.saveQueue = this.saveQueue.catch(() => undefined).then(() => this.repository.put('reading-progress',progress,this.workspace)).catch(() => { this.error.set('interrupted'); });
    return this.saveQueue;
  }
  @HostListener('document:visibilitychange') visibility(): void { this.tick(); this.visible = document.visibilityState === 'visible';this.tick(); void this.save(); }
  @HostListener('window:blur') blur(): void { this.tick(); this.focused = false;this.tick(); void this.save(); }
  @HostListener('window:focus') focus(): void { this.tick(); this.focused = true; this.interact(); }
  @HostListener('window:pagehide') pageHide(): void { this.tick(); void this.save(); }
  @HostListener('document:keydown', ['$event']) key(event: KeyboardEvent): void {
    this.interact();
    if(this.panel()){
      if(event.key==='Escape'){event.preventDefault();this.closePanel();}
      if(event.key==='Tab'){const controls=Array.from(document.querySelectorAll<HTMLElement>('.reader-panel button,.reader-panel input'));const first=controls[0],last=controls.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}
      return;
    }
    if(this.popup()){if(event.key==='Escape'){event.preventDefault();this.closeDictionary();}else if(['ArrowLeft','ArrowRight',' ','PageDown','PageUp','Home','End'].includes(event.key) && !(event.target instanceof HTMLElement && event.target.closest('app-dictionary-popup')))event.preventDefault();return;}
    this.interact(); if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || !window.getSelection()?.isCollapsed || (event.target instanceof HTMLElement && event.target.closest('input,textarea,select,button,a,[contenteditable]'))) return;
    if(event.key==='+'||event.key==='='){event.preventDefault();this.changeZoom(1);return;}if(event.key==='-'){event.preventDefault();this.changeZoom(-1);return;}if(event.key==='0'){event.preventDefault();this.resetZoom();return;}if(event.key.toLowerCase()==='f'){event.preventDefault();void this.toggleFullscreen();return;}
    const targets: Record<string,number> = {ArrowLeft:this.index()+(this.rightToLeft()?1:-1),ArrowRight:this.index()+(this.rightToLeft()?-1:1),' ':this.index()+1,PageDown:this.index()+1,PageUp:this.index()-1,Home:0,End:(this.volume()?.pageCount ?? 1)-1};
    if (event.key in targets) { event.preventDefault(); void this.go(targets[event.key]); }
  }
  touchStart(event: TouchEvent): void {
    this.interact(); this.touch = event.touches.length === 1 && !(event.target instanceof Element && event.target.closest('app-manga-ocr')) ? {x:event.touches[0].clientX,y:event.touches[0].clientY} : null;
  }
  touchEnd(event: TouchEvent): void {
    const start = this.touch; this.touch = null;
    const stage=this.stage()?.nativeElement;
    if (!start || event.touches.length || !window.getSelection()?.isCollapsed || this.popup() || (stage&&(stage.scrollWidth>stage.clientWidth+2||stage.scrollHeight>stage.clientHeight+2))) return;
    const end = event.changedTouches[0]; if (!end) return;
    const dx=end.clientX-start.x,dy=end.clientY-start.y;
    if (Math.abs(dx)>60 && Math.abs(dx)>Math.abs(dy)*1.5) void this.go(this.index()+((dx<0 ? 1 : -1)*(this.rightToLeft()?-1:1)));
  }
  ngOnDestroy(): void { this.closeDictionary(); this.tick(); void this.save(); this.destroyed=true; ++this.generation; clearInterval(this.timer);cancelAnimationFrame(this.zoomFrame); for (const value of this.cache.values()){if(value.preview)value.preview.src='';URL.revokeObjectURL(value.url);} this.cache.clear(); }
}
