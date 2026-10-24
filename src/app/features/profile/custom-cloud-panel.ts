import {ChangeDetectionStrategy,Component,computed,inject,signal,effect,untracked} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {AuthService} from '../../core/services/auth.service';
import {TranslationService} from '../../core/services/translation.service';
import {CustomGuestImportService,guestHasData,inventoryRows} from '../../core/services/custom-guest-import.service';
import {CustomConflictRecoveryService} from '../../core/services/custom-conflict-recovery.service';
import {CustomConflictResolutionService} from '../../core/services/custom-conflict-resolution.service';
import {CUSTOM_DECKS_ENABLED} from '../../core/services/custom-deck.repository';
import {MANGA_DECK_ASSISTED_ENABLED} from '../../core/services/manga-deck-gate';
import {CustomGuestImport,CustomGuestInventory} from '../../core/models/custom-guest-import.model';
import {CustomDeckCard} from '../../core/models/deck-catalog.model';
import {DeckCardProgress} from '../../core/models/deck-study.model';
import {CustomTransferCheckpointV2} from '../../core/models/custom-transfer-v2.model';

@Component({selector:'app-custom-cloud-panel',imports:[FormsModule],templateUrl:'./custom-cloud-panel.html',styleUrl:'./custom-cloud-panel.scss',changeDetection:ChangeDetectionStrategy.OnPush})
export class CustomCloudPanel {
 readonly recovery=inject(CustomConflictRecoveryService);readonly transfer=inject(CustomGuestImportService);readonly resolver=inject(CustomConflictResolutionService);readonly auth=inject(AuthService);readonly i18n=inject(TranslationService);
 private readonly custom=inject(CUSTOM_DECKS_ENABLED);private readonly manga=inject(MANGA_DECK_ASSISTED_ENABLED);
 readonly enabled=computed(()=>this.custom()&&this.manga()&&this.transfer.enabled());
 readonly inventory=signal<CustomGuestInventory|null>(null);readonly plans=signal<CustomGuestImport[]>([]);
 readonly conflicts=signal<Awaited<ReturnType<CustomConflictResolutionService['list']>>>([]);
 readonly busy=signal(false);readonly error=signal(false);readonly preview=signal(false);readonly accepted=signal(false);
 readonly pending=signal<{id:string;mode:'keep'|'rebase'|'restore'}|null>(null);
 archiveId='';readonly archiveView=signal<Awaited<ReturnType<CustomConflictRecoveryService['archives']['inspect']>>>(null);
 readonly archiveWord=computed(()=>(this.archiveView()?.card.payload as CustomDeckCard|undefined)?.word??'');
 readonly archiveCard=computed(()=>this.archiveView()?.card.payload as CustomDeckCard|undefined);
 readonly archiveReps=computed(()=>(this.archiveView()?.canonicalProgress?.payload as DeckCardProgress|undefined)?.card?.reps??0);
 readonly checkpoints=signal<Record<string,CustomTransferCheckpointV2>>({});
 consentChecked=false;confirmed=false;resolutionConfirmed=false;
 constructor(){effect(()=>{this.transfer.workspace.activationRevision();this.auth.user()?.id;const enabled=this.enabled();untracked(()=>{this.archiveId='';this.archiveView.set(null);this.checkpoints.set({});this.plans.set([]);this.conflicts.set([]);this.accepted.set(false);this.pending.set(null);this.preview.set(false);this.confirmed=false;this.consentChecked=false;if(enabled)void this.refresh();});});}
 count(store:string){return this.inventory()?inventoryRows(this.inventory()!,store).length:0;}
 hasGuest(){return !!this.inventory()&&guestHasData(this.inventory()!);}
 async refresh(){
  const epoch=this.transfer.workspace.activationRevision(),user=this.auth.user();const current=()=>epoch===this.transfer.workspace.activationRevision()&&user?.id===this.auth.user()?.id;
  try{const inventory=await this.transfer.inventory();if(!current())return;this.inventory.set(inventory);if(user&&this.transfer.workspace.userId()===user.id){
   const state=(await this.transfer.repo.syncSnapshot(`user:${user.id}`)).state;if(!current())return;this.accepted.set(state.consent?.version===1&&state.consent.accepted);
   this.checkpoints.set(state.transfers??{});
   this.plans.set(Object.values(state.imports??{}));const conflicts=await this.resolver.list();if(current())this.conflicts.set(conflicts);
  }}catch{if(current())this.error.set(true);}
 }
 private async action(run:()=>Promise<unknown>){if(this.busy())return;this.busy.set(true);this.error.set(false);try{await run();}catch{this.error.set(true);}finally{this.busy.set(false);await this.refresh();}}
 useAccount(){return this.action(async()=>{if(!await this.auth.chooseGuestImport('account'))return;await this.transfer.chooseAccount();this.preview.set(false);});}
 merge(){return this.action(async()=>{
  if(!this.confirmed||(!this.accepted()&&!this.consentChecked))return;
  const consentChecked=this.consentChecked;if(!await this.auth.chooseGuestImport('merge'))return;if(consentChecked&&!this.accepted())await this.transfer.consent(true);
  const complete=await this.transfer.start(true);if(complete)await this.auth.finishCustomGuestImport();else this.error.set(this.transfer.status()==='error');
  this.preview.set(false);this.confirmed=false;this.consentChecked=false;
 });}
 resume(id:string){return this.action(async()=>{if(await this.transfer.resume(id))await this.auth.finishCustomGuestImport();else this.error.set(this.transfer.status()==='error');});}
 allow(){return this.action(async()=>{if(this.consentChecked){await this.transfer.consent(true);this.consentChecked=false;}});}
 revoke(){return this.action(async()=>{await this.transfer.consent(false);this.accepted.set(false);});}
 archive(conflict:string){return this.action(async()=>{const epoch=this.transfer.workspace.activationRevision(),result=await this.recovery.archives.archive(conflict,true);if(epoch!==this.transfer.workspace.activationRevision())return;this.archiveId=result.id;this.error.set(!result.complete);});}
 inspectArchive(){return this.action(async()=>{const epoch=this.transfer.workspace.activationRevision(),result=await this.recovery.archives.inspect(this.archiveId.trim());if(epoch===this.transfer.workspace.activationRevision())this.archiveView.set(result);});}
 select(id:string,mode:'keep'|'rebase'|'restore'){this.pending.set({id,mode});this.resolutionConfirmed=false;}
 resolve(){return this.action(async()=>{const p=this.pending();if(!p||!this.resolutionConfirmed)return;if(!await this.resolver.resolve(p.id,p.mode,true))this.error.set(true);else await this.auth.finishCustomGuestImport();this.pending.set(null);});}
 done(plan:CustomGuestImport){const p=this.checkpoints()[plan.id];return p?Object.keys(p.receipts).length:plan.steps.filter(s=>s.done).length;}
 total(plan:CustomGuestImport){const p=this.checkpoints()[plan.id];return p?Math.max(p.manifest.chunks.length+3,p.requests.length):plan.steps.length;}
 version(conflict:ReturnType<CustomCloudPanel['conflicts']>[number],incoming:boolean){
  const proposed=conflict.evidence.operation.changes,cardChange=proposed.find(e=>e.kind==='card'),progressChange=proposed.find(e=>e.kind==='progress');
  const event=proposed.find(e=>e.kind==='review-event')?.payload as {entryId?:string}|undefined,id=cardChange?.id??progressChange?.id??event?.entryId;
  const card=(incoming?(cardChange?.payload??conflict.canonical.find(e=>e.kind==='card'&&e.id===id)?.payload):conflict.canonical.find(e=>e.kind==='card'&&e.id===id)?.payload) as CustomDeckCard|undefined;
  const progress=(incoming?progressChange?.payload:conflict.canonical.find(e=>e.kind==='progress'&&e.id===id)?.payload) as DeckCardProgress|undefined;
  return {word:card?.word??'',meaning:card?.glosses?.map(g=>g.text).join('; ')??'',context:card?.context?.text??'',reps:progress?.card.reps??null};
 }
}

