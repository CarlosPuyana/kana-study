import { inject, Injectable, Injector } from '@angular/core';
import { WorkspaceService } from './workspace.service';
import {CUSTOM_DECKS_ENABLED,CUSTOM_DECK_SYNC_ENABLED} from './custom-deck-gates';
import {MANGA_DECK_ASSISTED_ENABLED} from './manga-deck-gate';

@Injectable({ providedIn: 'root' })
export class WorkspaceMigrationService {
  private readonly workspace = inject(WorkspaceService);
  private readonly injector=inject(Injector);
  private async custom(){const module=await import('./custom-guest-workspace-migration');return this.injector.get(module.CustomGuestWorkspaceMigration); }
  private readonly customGate=inject(CUSTOM_DECKS_ENABLED);private readonly syncGate=inject(CUSTOM_DECK_SYNC_ENABLED);private readonly mangaGate=inject(MANGA_DECK_ASSISTED_ENABLED);
  private customAllowed(){return this.customGate()&&this.syncGate()&&this.mangaGate();}
  async hasCustomGuestData(){return this.customGate()&&(await import('./custom-local-presence')).hasLocalCustomData('guest');}
  customImportAvailable(){return this.customAllowed();}
  async customImportComplete(userId:string){return this.customAllowed()&&(await this.custom()).complete(userId);}

  async copyGuestToUser(userId:string):Promise<void>{
    return (await import('./workspace-legacy-copy')).copyGuestToUser(userId,this.workspace,this.injector);
  }

  async hasGuestData(): Promise<boolean> {
    if(await this.hasCustomGuestData())return true;
    return this.hasLegacyGuestData();
  }
  async hasLegacyGuestData(): Promise<boolean> {
    if (this.workspace.hasGuestProgress()) return true;
    return (await import('./custom-local-presence')).hasLegacyLocalData();
  }


}
