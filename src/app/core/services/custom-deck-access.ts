import {computed,inject,Injectable,InjectionToken} from '@angular/core';
import {WorkspaceService} from './workspace.service';

/** Release policy, supplied only by the separate production candidate entry. */
export const CUSTOM_DECK_GUEST_ONLY=new InjectionToken<boolean>('custom decks Guest-only release',{providedIn:'root',factory:()=>false});

@Injectable({providedIn:'root'})
export class CustomDeckAccess {
 readonly guestOnly=inject(CUSTOM_DECK_GUEST_ONLY);
 private readonly workspace=inject(WorkspaceService);
 readonly permitted=computed(()=>!this.guestOnly||this.workspace.active()==='guest');
 assertWrite(owner:string,epoch:number):void{
  if(this.guestOnly&&(owner!=='guest'||this.workspace.active()!=='guest'||this.workspace.activationRevision()!==epoch))throw new Error('Custom decks are Guest-only in this release');
 }
}
